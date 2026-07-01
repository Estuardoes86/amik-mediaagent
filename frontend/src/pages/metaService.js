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

// Builds date params — supports preset or {since, until}
function dateParams(datePreset, since, until) {
  if (since && until) {
    return { time_range: JSON.stringify({ since, until }) };
  }
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
    limit: 100
  });
  return data.data || [];
}

export async function getCampaignInsights(accountId, datePreset = 'last_30d', since, until) {
  const data = await metaGet(`${accountId}/insights`, {
    fields: 'campaign_id,campaign_name,impressions,clicks,inline_link_clicks,spend,actions,cost_per_action_type,ctr,cpm,reach,frequency,unique_clicks,unique_ctr',
    ...dateParams(datePreset, since, until),
    level: 'campaign',
    limit: 100
  });
  return data.data || [];
}

export async function getAdSetInsights(accountId, datePreset = 'last_7d', since, until) {
  const data = await metaGet(`${accountId}/insights`, {
    fields: 'adset_id,adset_name,campaign_name,impressions,clicks,spend,actions,cost_per_action_type,ctr,reach',
    ...dateParams(datePreset, since, until),
    level: 'adset',
    limit: 100
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
    limit: 100
  });
  return data.data || [];
}

// Daily breakdown for trend chart
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
  const totals = { spend:0, impressions:0, clicks:0, leads:0, purchases:0, reach:0, waConv:0 };
  for (const row of insights) {
    totals.spend       += parseFloat(row.spend || 0);
    totals.impressions += parseInt(row.impressions || 0);
    totals.clicks      += parseInt(row.clicks || 0);
    totals.reach       += parseInt(row.reach || 0);
    if (row.actions) {
      for (const a of row.actions) {
        if (a.action_type === 'lead')                           totals.leads    += parseInt(a.value||0);
        if (a.action_type === 'purchase')                       totals.purchases+= parseInt(a.value||0);
        if (a.action_type === 'onsite_conversion.total_messaging_connection')  totals.waConv   += parseInt(a.value||0);
      }
    }
  }
  totals.cpl       = totals.leads > 0         ? (totals.spend / totals.leads).toFixed(2)       : null;
  totals.cpaWA     = totals.waConv > 0        ? (totals.spend / totals.waConv).toFixed(2)      : null;
  totals.ctr       = totals.impressions > 0   ? ((totals.clicks/totals.impressions)*100).toFixed(2) : null;
  totals.cpm       = totals.impressions > 0   ? ((totals.spend/totals.impressions)*1000).toFixed(2) : null;
  totals.cpc       = totals.clicks > 0        ? (totals.spend/totals.clicks).toFixed(2)        : null;
  totals.convRate  = totals.clicks > 0 && totals.leads > 0 ? ((totals.leads/totals.clicks)*100).toFixed(2) : null;
  totals.frequency = totals.reach > 0         ? (totals.impressions/totals.reach).toFixed(2)   : null;
  return totals;
}

export { cache };
