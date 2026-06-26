import axios from 'axios';
import NodeCache from 'node-cache';

const cache = new NodeCache({ stdTTL: 300 });
const META_BASE = 'https://graph.facebook.com/v19.0';

function getToken() { return process.env.META_ACCESS_TOKEN; }

async function metaGet(path, params = {}) {
  const cacheKey = `meta:${path}:${JSON.stringify(params)}`;
  const cached = cache.get(cacheKey);
  if (cached) return cached;
  const response = await axios.get(`${META_BASE}/${path}`, {
    params: { access_token: getToken(), ...params }
  });
  cache.set(cacheKey, response.data);
  return response.data;
}

function dateParams(datePreset, since, until) {
  if (since && until) return { time_range: JSON.stringify({ since, until }) };
  return { date_preset: datePreset || 'last_30d' };
}

export async function getAdAccounts() {
  const data = await metaGet('me/adaccounts', {
    fields: 'id,name,account_status,currency,timezone_name,spend_cap,amount_spent'
  });
  return data.data || [];
}

export async function getCampaigns(accountId) {
  const data = await metaGet(`${accountId}/campaigns`, {
    fields: 'id,name,status,objective,daily_budget,lifetime_budget,start_time,stop_time',
    effective_status: '["ACTIVE","PAUSED"]',
    limit: 500  // Get ALL campaigns
  });
  return data.data || [];
}

export async function getCampaignInsights(accountId, datePreset = 'last_30d', since, until) {
  const data = await metaGet(`${accountId}/insights`, {
    fields: 'campaign_id,campaign_name,impressions,clicks,spend,actions,cost_per_action_type,ctr,cpm,reach,frequency,unique_clicks,unique_ctr,action_values',
    ...dateParams(datePreset, since, until),
    level: 'campaign',
    limit: 500
  });
  return data.data || [];
}

export async function getAdSetInsights(accountId, datePreset = 'last_7d', since, until) {
  const data = await metaGet(`${accountId}/insights`, {
    fields: 'adset_id,adset_name,campaign_name,impressions,clicks,spend,actions,cost_per_action_type,ctr,reach',
    ...dateParams(datePreset, since, until),
    level: 'adset',
    limit: 500
  });
  return data.data || [];
}

export async function getPixels(accountId) {
  try {
    const data = await metaGet(`${accountId}/adspixels`, {
      fields: 'id,name,last_fired_time,is_unavailable,code'
    });
    return data.data || [];
  } catch { return []; }
}

export async function getCreativeInsights(accountId, datePreset = 'last_14d', since, until) {
  const data = await metaGet(`${accountId}/insights`, {
    fields: 'ad_id,ad_name,adset_name,campaign_name,impressions,clicks,spend,ctr,actions,creative,reach,frequency',
    ...dateParams(datePreset, since, until),
    level: 'ad',
    limit: 200
  });
  return data.data || [];
}

export async function getDailyInsights(accountId, datePreset = 'last_30d', since, until) {
  const data = await metaGet(`${accountId}/insights`, {
    fields: 'date_start,date_stop,impressions,clicks,spend,actions,reach',
    ...dateParams(datePreset, since, until),
    time_increment: 1,
    level: 'account',
    limit: 100
  });
  return data.data || [];
}

export function aggregateInsights(insights) {
  const totals = { spend:0, impressions:0, clicks:0, leads:0, purchases:0, reach:0, waConv:0, revenue:0 };
  for (const row of insights) {
    totals.spend       += parseFloat(row.spend || 0);
    totals.impressions += parseInt(row.impressions || 0);
    totals.clicks      += parseInt(row.clicks || 0);
    totals.reach       += parseInt(row.reach || 0);
    if (row.actions) {
      for (const a of row.actions) {
        if (a.action_type === 'lead')                           totals.leads    += parseInt(a.value||0);
        if (a.action_type === 'purchase')                       totals.purchases+= parseInt(a.value||0);
        // All WhatsApp conversion types
        if (a.action_type?.includes('messaging_conversation') ||
            a.action_type?.includes('messaging_first_reply') ||
            a.action_type?.includes('total_messaging_connection') ||
            a.action_type?.includes('whatsapp_message'))        totals.waConv   += parseInt(a.value||0);
      }
    }
    if (row.action_values) {
      for (const av of row.action_values) {
        if (av.action_type === 'purchase') totals.revenue += parseFloat(av.value||0);
      }
    }
  }
  totals.cpl       = totals.leads > 0         ? (totals.spend / totals.leads).toFixed(2)         : null;
  totals.cpaWA     = totals.waConv > 0        ? (totals.spend / totals.waConv).toFixed(2)        : null;
  totals.ctr       = totals.impressions > 0   ? ((totals.clicks/totals.impressions)*100).toFixed(2) : null;
  totals.cpm       = totals.impressions > 0   ? ((totals.spend/totals.impressions)*1000).toFixed(2) : null;
  totals.cpc       = totals.clicks > 0        ? (totals.spend/totals.clicks).toFixed(2)          : null;
  totals.convRate  = totals.clicks > 0 && totals.leads > 0 ? ((totals.leads/totals.clicks)*100).toFixed(2) : null;
  totals.frequency = totals.reach > 0         ? (totals.impressions/totals.reach).toFixed(2)     : null;
  totals.roas      = totals.spend > 0 && totals.revenue > 0 ? (totals.revenue/totals.spend).toFixed(2) : null;
  return totals;
}

// Extract programa from campaign name (UPSJB naming convention)
export function extractPrograma(campaignName) {
  const n = (campaignName||'').toUpperCase();
  const programas = [
    ['Medicina Humana',        ['MEDICINA_HUMANA','MEDICINA HUMANA','MED_HUM','MEDHUM']],
    ['Enfermería',             ['ENFERMERIA','ENFER','ENFERM']],
    ['Psicología',             ['PSICOLOG']],
    ['Derecho',                ['DERECHO','DERE']],
    ['Contabilidad',           ['CONTABILIDAD','CONTAB']],
    ['Administración',         ['ADMINISTRACION','ADMIN']],
    ['Ingeniería de Sistemas', ['ING_SIST','SISTEMAS','INGENIERIA_SIST']],
    ['Ingeniería Civil',       ['ING_CIVIL','CIVIL']],
    ['Ingeniería Agroindustrial',['AGROINDUSTRIAL','AGRO']],
    ['Estomatología',          ['ESTOMATOLOG','ESTOMA']],
    ['Medicina Veterinaria',   ['VETERINARIA','VET']],
    ['Ingeniería en Energías', ['ENERGIA','ENERGIAS']],
    ['Tecnología Médica',      ['TECNOLOGIA_MEDICA','TEC_MED','TECMED']],
    ['Turismo y Hotelería',    ['TURISMO','HOTELERIA']],
    ['A Distancia',            ['DISTANCIA','VIRTUAL','DIST']],
  ];
  for (const [prog, keywords] of programas) {
    if (keywords.some(k => n.includes(k))) return prog;
  }
  return 'Otros';
}

export { cache };
