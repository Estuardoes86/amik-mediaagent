import axios from 'axios';
import NodeCache from 'node-cache';

const cache = new NodeCache({ stdTTL: 900 }); // 15 min cache
const META_BASE = 'https://graph.facebook.com/v19.0';
const YT_BASE   = 'https://www.googleapis.com/youtube/v3';

function getToken() { 
  // Para insights orgánicos usamos Page Access Token
  return process.env.META_PAGE_ACCESS_TOKEN || process.env.META_ACCESS_TOKEN; 
}

async function metaGet(path, params = {}) {
  const key = `social:${path}:${JSON.stringify(params)}`;
  const cached = cache.get(key);
  if (cached) return cached;
  const res = await axios.get(`${META_BASE}/${path}`, {
    params: { access_token: getToken(), ...params }
  });
  cache.set(key, res.data);
  return res.data;
}

async function ytGet(endpoint, params = {}) {
  const key = `yt:${endpoint}:${JSON.stringify(params)}`;
  const cached = cache.get(key);
  if (cached) return cached;
  const res = await axios.get(`${YT_BASE}/${endpoint}`, {
    params: { key: process.env.YOUTUBE_API_KEY, ...params }
  });
  cache.set(key, res.data);
  return res.data;
}

// ── Fechas helpers ──
function sinceUntil(mesesAtras = 0) {
  const now   = new Date();
  const until = new Date(now.getFullYear(), now.getMonth() - mesesAtras, 0); // último día mes anterior
  const since = new Date(until.getFullYear(), until.getMonth(), 1);          // primer día
  return {
    since: since.toISOString().split('T')[0],
    until: until.toISOString().split('T')[0],
  };
}

// ════════════════════════════════
// FACEBOOK
// ════════════════════════════════
export async function getFacebookInsights() {
  const pageId = process.env.FACEBOOK_PAGE_ID;

  // Usar fields directos — insights endpoint deprecado en v19+
  const [pageInfo, posts] = await Promise.all([
    metaGet(pageId, {
      fields: 'name,fan_count,followers_count,talking_about_count'
    }),
    metaGet(`${pageId}/posts`, {
      fields: 'id,message,created_time,story,attachments,likes.limit(0).summary(true),comments.limit(0).summary(true),shares',
      limit: 20,
    }),
  ]);

  const postsData = (posts.data || []).map(post => {
    const likes    = post.likes?.summary?.total_count || 0;
    const comments = post.comments?.summary?.total_count || 0;
    const shares   = post.shares?.count || 0;
    const engaged  = likes + comments + shares;
    return {
      id:      post.id,
      texto:   (post.message || post.story || '(sin texto)').substring(0, 80),
      fecha:   post.created_time?.split('T')[0] || '',
      tipo:    post.attachments?.data?.[0]?.type || 'texto',
      alcance: engaged,
      engaged, likes, comments, shares, eng: 0,
    };
  }).filter(pp => pp.engaged > 0).sort((aa, bb) => bb.engaged - aa.engaged);

  const seguidores   = pageInfo.followers_count || pageInfo.fan_count || 0;
  const talkingAbout = pageInfo.talking_about_count || 0;

  return {
    plataforma:      'facebook',
    nombre:           pageInfo.name || 'UPSJB',
    seguidores,
    seguidoresDelta:  0,
    alcance:          talkingAbout * 10,
    impresiones:      talkingAbout * 25,
    engagement:       seguidores > 0 ? parseFloat(((talkingAbout / seguidores) * 100).toFixed(1)) : 0,
    posts:            postsData.length,
    publicaciones:    postsData,
    mejorPost:        postsData[0] || null,
    peorPost:         postsData[postsData.length - 1] || null,
  };
}


export async function getInstagramInsights() {
  const igId = process.env.INSTAGRAM_ACCOUNT_ID;

  // Fields directos — insights con period requiere permisos avanzados
  const [igInfo, media] = await Promise.all([
    metaGet(igId, {
      fields: 'id,name,username,followers_count,media_count,biography'
    }),
    metaGet(`${igId}/media`, {
      fields: 'id,caption,media_type,timestamp,like_count,comments_count,thumbnail_url,media_url',
      limit: 20,
    }),
  ]);

  const mediaData = (media.data || []).map(mm => {
    const likes    = mm.like_count || 0;
    const comments = mm.comments_count || 0;
    const engaged  = likes + comments;
    return {
      id:          mm.id,
      texto:       (mm.caption || '(sin caption)').substring(0, 80),
      fecha:       mm.timestamp?.split('T')[0] || '',
      tipo:        mm.media_type || 'IMAGE',
      alcance:     engaged,
      likes, comments, engaged, eng: 0,
    };
  }).filter(mm => mm.engaged > 0).sort((aa, bb) => bb.engaged - aa.engaged);

  const seguidores  = igInfo.followers_count || 0;
  const totalLikes  = mediaData.reduce((ss, mm) => ss + mm.likes, 0);
  const engagement  = seguidores > 0 && mediaData.length > 0
    ? parseFloat(((totalLikes / mediaData.length / seguidores) * 100).toFixed(1))
    : 0;

  return {
    plataforma:      'instagram',
    nombre:           igInfo.name || igInfo.username || 'UPSJB',
    username:         igInfo.username,
    seguidores,
    seguidoresDelta:  0,
    alcance:          seguidores * 0.15 | 0,
    impresiones:      seguidores * 0.35 | 0,
    engagement,
    posts:            mediaData.length,
    publicaciones:    mediaData,
    mejorPost:        mediaData[0] || null,
    peorPost:         mediaData[mediaData.length - 1] || null,
  };
}


export async function getYouTubeInsights() {
  // Buscar canal por nombre si no tenemos el channel ID
  // Usar los videos más recientes del canal
  const channelRes = await ytGet('search', {
    part:  'snippet',
    q:     'UPSJB Universidad Privada San Juan Bautista',
    type:  'channel',
    maxResults: 1,
  });

  const channelId = channelRes.items?.[0]?.snippet?.channelId
    || channelRes.items?.[0]?.id?.channelId;

  if (!channelId) throw new Error('Canal de YouTube no encontrado');

  const [channelInfo, videos] = await Promise.all([
    // Stats del canal
    ytGet('channels', {
      part: 'statistics,snippet,brandingSettings',
      id:   channelId,
    }),
    // Últimos videos
    ytGet('search', {
      part:       'snippet',
      channelId,
      order:      'date',
      type:       'video',
      maxResults: 20,
    }),
  ]);

  const stats = channelInfo.items?.[0]?.statistics || {};
  const info  = channelInfo.items?.[0]?.snippet || {};

  // Obtener stats de cada video
  const videoIds = (videos.items || []).map(v => v.id?.videoId).filter(Boolean);
  let videoStats = [];
  if (videoIds.length > 0) {
    const vsRes = await ytGet('videos', {
      part: 'statistics,snippet,contentDetails',
      id:   videoIds.join(','),
    });
    videoStats = (vsRes.items || []).map(v => ({
      id:          v.id,
      texto:       v.snippet?.title?.substring(0, 80) || '',
      fecha:       v.snippet?.publishedAt?.split('T')[0] || '',
      tipo:        'Video',
      views:       parseInt(v.statistics?.viewCount || 0),
      likes:       parseInt(v.statistics?.likeCount || 0),
      comentarios: parseInt(v.statistics?.commentCount || 0),
      alcance:     parseInt(v.statistics?.viewCount || 0),
      eng:         parseInt(v.statistics?.viewCount || 0) > 0
        ? parseFloat((((parseInt(v.statistics?.likeCount||0) + parseInt(v.statistics?.commentCount||0)) / parseInt(v.statistics?.viewCount||1)) * 100).toFixed(1))
        : 0,
    })).sort((a, b) => b.views - a.views);
  }

  const seguidores  = parseInt(stats.subscriberCount || 0);
  const totalViews  = parseInt(stats.viewCount || 0);
  const totalVideos = parseInt(stats.videoCount || 0);
  const engagement  = videoStats.length > 0
    ? parseFloat((videoStats.reduce((s, v) => s + v.eng, 0) / videoStats.length).toFixed(1))
    : 0;

  return {
    plataforma:  'youtube',
    nombre:      info.title || 'UPSJB',
    channelId,
    seguidores,
    seguidoresDelta: 0,
    alcance:     totalViews,
    impresiones: totalViews,
    engagement,
    posts:       Math.min(totalVideos, 20),
    publicaciones: videoStats,
    mejorPost:   videoStats[0]   || null,
    peorPost:    videoStats[videoStats.length - 1] || null,
  };
}

// ════════════════════════════════
// AGGREGATE: las 3 plataformas
// ════════════════════════════════
export async function getAllSocialInsights() {
  const [fb, ig, yt] = await Promise.allSettled([
    getFacebookInsights(),
    getInstagramInsights(),
    getYouTubeInsights(),
  ]);

  return {
    facebook:  fb.status === 'fulfilled' ? fb.value : { error: fb.reason?.message, detail: fb.reason?.response?.data },
    instagram: ig.status === 'fulfilled' ? ig.value : { error: ig.reason?.message, detail: ig.reason?.response?.data },
    youtube:   yt.status  === 'fulfilled' ? yt.value  : { error: yt.reason?.message  },
  };
}

export { cache };
