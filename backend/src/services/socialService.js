import axios from 'axios';
import NodeCache from 'node-cache';

const cache = new NodeCache({ stdTTL: 900 }); // 15 min cache
const META_BASE = 'https://graph.facebook.com/v19.0';
const YT_BASE   = 'https://www.googleapis.com/youtube/v3';

function getToken() { return process.env.META_PAGE_ACCESS_TOKEN || process.env.META_ACCESS_TOKEN; }

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
export async function getFacebookInsights(periodo = 'month') {
  const pageId = process.env.FACEBOOK_PAGE_ID;

  // Métricas de página
  const metrics = [
    'page_fans',                    // seguidores totales
    'page_fan_adds',         // nuevos seguidores
    'page_impressions_unique',      // alcance
    'page_impressions',             // impresiones
    'page_engaged_users',        // engagement total
    // alcance de posts
  ].join(',');

  const [pageInfo, insights, posts] = await Promise.all([
    // Info básica
    metaGet(pageId, { fields: 'name,fan_count,followers_count' }),
    // Insights del mes
    metaGet(`${pageId}/insights`, {
      metric: metrics,
      period: periodo,
      date_preset: 'last_month',
    }),
    // Últimos posts
    metaGet(`${pageId}/posts`, {
      fields: 'id,message,created_time,story,attachments,insights.metric(post_impressions_unique,post_engaged_users,post_reactions_by_type_total)',
      limit: 20,
    }),
  ]);

  // Procesar insights
  const insightMap = {};
  for (const item of (insights.data || [])) {
    insightMap[item.name] = item.values?.[item.values.length - 1]?.value ?? 0;
  }

  // Procesar posts para mejor/peor
  const postsData = (posts.data || []).map(p => {
    const ins = p.insights?.data || [];
    const alcance  = ins.find(i => i.name === 'post_impressions_unique')?.values?.[0]?.value || 0;
    const engaged  = ins.find(i => i.name === 'post_engaged_users')?.values?.[0]?.value || 0;
    const reactions= ins.find(i => i.name === 'post_reactions_by_type_total')?.values?.[0]?.value || {};
    const totalReact = Object.values(reactions).reduce((s, v) => s + (v || 0), 0);
    return {
      id: p.id,
      texto: p.message || p.story || '(sin texto)',
      fecha: p.created_time?.split('T')[0] || '',
      tipo: p.attachments?.data?.[0]?.type || 'texto',
      alcance,
      engaged,
      reactions: totalReact,
      eng: alcance > 0 ? ((engaged / alcance) * 100).toFixed(1) : 0,
    };
  }).filter(p => p.alcance > 0).sort((a, b) => b.alcance - a.alcance);

  const seguidores     = pageInfo.followers_count || pageInfo.fan_count || 0;
  const alcance        = insightMap['page_impressions_unique'] || 0;
  const impresiones    = insightMap['page_impressions'] || 0;
  const engTotal       = insightMap['page_engaged_users'] || 0;
  const engagement     = alcance > 0 ? parseFloat(((engTotal / alcance) * 100).toFixed(1)) : 0;

  return {
    plataforma:  'facebook',
    nombre:       pageInfo.name || 'UPSJB',
    seguidores,
    seguidoresDelta: insightMap['page_fan_adds'] || 0,
    alcance,
    impresiones,
    engagement,
    posts:        postsData.length,
    mejorPost:    postsData[0]   || null,
    peorPost:     postsData[postsData.length - 1] || null,
  };
}

// ════════════════════════════════
// INSTAGRAM
// ════════════════════════════════
export async function getInstagramInsights() {
  const igId = process.env.INSTAGRAM_ACCOUNT_ID;

  const metrics = [
    'follower_count',
    'reach',
    'impressions',
    'profile_views',
    'website_clicks',
  ].join(',');

  const [igInfo, insights, media] = await Promise.all([
    // Info cuenta
    metaGet(igId, { fields: 'id,name,username,followers_count,media_count,biography' }),
    // Insights
    metaGet(`${igId}/insights`, {
      metric: metrics,
      period: 'month',
      since:  Math.floor(Date.now()/1000) - 2592000, // últimos 30 días
      until:  Math.floor(Date.now()/1000),
    }),
    // Últimos posts
    metaGet(`${igId}/media`, {
      fields: 'id,caption,media_type,timestamp,like_count,comments_count,insights.metric(reach,impressions,engagement)',
      limit:  20,
    }),
  ]);

  const insightMap = {};
  for (const item of (insights.data || [])) {
    const last = item.values?.[item.values.length - 1]?.value ?? 0;
    insightMap[item.name] = last;
  }

  // Procesar media
  const mediaData = (media.data || []).map(m => {
    const ins     = m.insights?.data || [];
    const alcance = ins.find(i => i.name === 'reach')?.values?.[0]?.value || 0;
    const eng     = ins.find(i => i.name === 'engagement')?.values?.[0]?.value || 0;
    return {
      id:      m.id,
      texto:   m.caption?.substring(0, 80) || '(sin caption)',
      fecha:   m.timestamp?.split('T')[0] || '',
      tipo:    m.media_type || 'IMAGE',
      alcance,
      likes:   m.like_count || 0,
      comentarios: m.comments_count || 0,
      engaged: eng,
      eng:     alcance > 0 ? parseFloat(((eng / alcance) * 100).toFixed(1)) : 0,
    };
  }).filter(m => m.alcance > 0).sort((a, b) => b.alcance - a.alcance);

  const seguidores  = igInfo.followers_count || 0;
  const alcance     = insightMap['reach'] || 0;
  const impresiones = insightMap['impressions'] || 0;
  const engagement  = alcance > 0
    ? parseFloat(((mediaData.reduce((s, m) => s + m.engaged, 0) / Math.max(alcance, 1)) * 100).toFixed(1))
    : 0;

  return {
    plataforma:  'instagram',
    nombre:      igInfo.name || igInfo.username || 'UPSJB',
    username:    igInfo.username,
    seguidores,
    seguidoresDelta: 0, // IG no da delta directamente — calculado vs mes ant.
    alcance,
    impresiones,
    engagement,
    posts:       mediaData.length,
    mejorPost:   mediaData[0]   || null,
    peorPost:    mediaData[mediaData.length - 1] || null,
  };
}

// ════════════════════════════════
// YOUTUBE
// ════════════════════════════════
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
    facebook:  fb.status  === 'fulfilled' ? fb.value  : { error: fb.reason?.message  },
    instagram: ig.status  === 'fulfilled' ? ig.value  : { error: ig.reason?.message  },
    youtube:   yt.status  === 'fulfilled' ? yt.value  : { error: yt.reason?.message  },
  };
}

export { cache };
