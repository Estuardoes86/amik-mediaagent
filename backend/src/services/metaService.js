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
    fields: 'campaign_id,campaign_name,impressions,clicks,inline_link_clicks,spend,actions,cost_per_action_type,ctr,cpm,reach,frequency,unique_clicks,unique_ctr,action_values',
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
  const totals = { spend:0, impressions:0, clicks:0, linkClicks:0, leads:0, purchases:0, reach:0, waConv:0, revenue:0 };
  for (const row of insights) {
    totals.spend       += parseFloat(row.spend || 0);
    totals.impressions += parseInt(row.impressions || 0);
    totals.clicks      += parseInt(row.clicks || 0);
    totals.linkClicks  += parseInt(row.inline_link_clicks || 0);
    totals.reach       += parseInt(row.reach || 0);
    if (row.actions) {
      for (const a of row.actions) {
        if (a.action_type === 'lead')                                          totals.leads    += parseInt(a.value||0);
        if (a.action_type === 'purchase')                                      totals.purchases+= parseInt(a.value||0);
        // Conversaciones de WhatsApp REALMENTE iniciadas (evento estandar de Meta)
        if (a.action_type === 'onsite_conversion.total_messaging_connection')  totals.waConv    += parseInt(a.value||0);
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
  totals.ctr       = totals.impressions > 0   ? ((totals.linkClicks/totals.impressions)*100).toFixed(2) : null;
  totals.cpm       = totals.impressions > 0   ? ((totals.spend/totals.impressions)*1000).toFixed(2) : null;
  totals.cpc       = totals.linkClicks > 0    ? (totals.spend/totals.linkClicks).toFixed(2)      : null;
  totals.convRate  = totals.linkClicks > 0 && totals.leads > 0 ? ((totals.leads/totals.linkClicks)*100).toFixed(2) : null;
  totals.frequency = totals.reach > 0         ? (totals.impressions/totals.reach).toFixed(2)     : null;
  totals.roas      = totals.spend > 0 && totals.revenue > 0 ? (totals.revenue/totals.spend).toFixed(2) : null;
  return totals;
}

// Extract carrera + sede + type from campaign name
// UPSJB naming: "2026 2 LEADS [WHATSAPP] CARRERA [SEDE]"
export function extractPrograma(campaignName) {
  const raw = (campaignName||'');
  const n = raw.toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');

  // Detect sede
  let sede = 'Presencial';
  if      (n.includes('DISTANCIA')||n.includes('VIRTUAL'))   sede = 'A Distancia';
  else if (n.includes('CHORRILLOS'))                          sede = 'Chorrillos';
  else if (n.includes('SAN BORJA')||n.includes('SANBORJA'))  sede = 'San Borja';
  else if (/ ICA( |$)/.test(n))                              sede = 'Ica';
  else if (n.includes('CHINCHA'))                             sede = 'Chincha';

  // Detect type
  const isWA = n.includes('WHATSAPP');

  // Carrera — most specific first
  const map = [
    ['Medicina Humana',                       ['MEDICINA HUMANA']],
    ['Medicina Veterinaria y Zootecnia',      ['VETERINARIA','ZOOTECNIA']],
    ['Enfermería',                            ['ENFERMERIA']],
    ['Psicología',                            ['PSICOLOGIA']],
    ['Derecho',                               ['DERECHO']],
    ['Contabilidad',                          ['CONTABILIDAD']],
    ['Estomatología',                         ['ESTOMATOLOGIA']],
    ['Ingeniería Agroindustrial',             ['AGROINDUSTRIAL']],
    ['Ingeniería Civil',                      ['CIVIL']],
    ['Ingeniería de Sistemas',                ['SISTEMAS']],
    ['Ingeniería en Enología y Viticultura',  ['ENOLOGIA','VITICULTURA']],
    ['Terapia Física y Rehabilitación',       ['TERAPIA FISICA','TERAPIA']],
    ['Laboratorio Clínico',                   ['LABORATORIO']],
    ['Turismo, Hotelería y Gastronomía',      ['TURISMO','HOTELERIA','GASTRONOMIA']],
    ['Administración y Marketing',            ['ADMINISTRACION MARKETING','ADMIN MARKETING','ADMINISTRACIÓN MARKETING']],
    ['Administración y Negocios Int.',        ['NEGOCIOS INTERNACIONALES','NEGOCIOS INT','ADMINISTRACION NEGOCIOS']],
    ['Administración de Empresas',            ['ADMINISTRACION','ADMIN']],
    ['Medicina (WA)',                         ['WHATSAPP MEDICINA']],
  ];

  // Special: WHATSAPP MEDICINA maps to Medicina Humana
  if (n.includes('WHATSAPP MEDICINA')) return { carrera:'Medicina Humana', sede, isWA:true };

  let carrera = 'Otros';
  for (const [c, kws] of map) {
    if (kws.some(k => n.includes(k))) { carrera = c; break; }
  }
  return { carrera, sede, isWA };
}

export { cache };
