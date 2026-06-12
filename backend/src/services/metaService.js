import axios from 'axios';
import NodeCache from 'node-cache';

const cache = new NodeCache({ stdTTL: 300 }); // 5 min cache
const META_BASE = 'https://graph.facebook.com/v19.0';

function getToken() {
  return process.env.META_ACCESS_TOKEN;
}

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

// Get all ad accounts accessible by the token
export async function getAdAccounts() {
  const data = await metaGet('me/adaccounts', {
    fields: 'id,name,account_status,currency,timezone_name,spend_cap,amount_spent'
  });
  return data.data || [];
}

// Get campaigns for an account
export async function getCampaigns(accountId, datePreset = 'last_30d') {
  const data = await metaGet(`${accountId}/campaigns`, {
    fields: 'id,name,status,objective,daily_budget,lifetime_budget,start_time,stop_time',
    effective_status: '["ACTIVE","PAUSED"]',
    limit: 50
  });
  return data.data || [];
}

// Get campaign insights (metrics)
export async function getCampaignInsights(accountId, datePreset = 'last_30d') {
  const data = await metaGet(`${accountId}/insights`, {
    fields: 'campaign_id,campaign_name,impressions,clicks,spend,actions,cost_per_action_type,ctr,cpm,reach,frequency',
    date_preset: datePreset,
    level: 'campaign',
    limit: 50
  });
  return data.data || [];
}

// Get ad set insights for structure analysis
export async function getAdSetInsights(accountId, datePreset = 'last_7d') {
  const data = await metaGet(`${accountId}/insights`, {
    fields: 'adset_id,adset_name,campaign_name,impressions,clicks,spend,actions,cost_per_action_type',
    date_preset: datePreset,
    level: 'adset',
    limit: 100
  });
  return data.data || [];
}

// Get pixel/CAPI status
export async function getPixels(accountId) {
  try {
    const data = await metaGet(`${accountId}/adspixels`, {
      fields: 'id,name,last_fired_time,is_unavailable,code'
    });
    return data.data || [];
  } catch {
    return [];
  }
}

// Get creative performance
export async function getCreativeInsights(accountId, datePreset = 'last_14d') {
  const data = await metaGet(`${accountId}/insights`, {
    fields: 'ad_id,ad_name,adset_name,campaign_name,impressions,clicks,spend,ctr,actions,creative',
    date_preset: datePreset,
    level: 'ad',
    limit: 100
  });
  return data.data || [];
}

// Aggregate metrics from insights into a summary
export function aggregateInsights(insights) {
  const totals = { spend: 0, impressions: 0, clicks: 0, leads: 0, purchases: 0 };

  for (const row of insights) {
    totals.spend += parseFloat(row.spend || 0);
    totals.impressions += parseInt(row.impressions || 0);
    totals.clicks += parseInt(row.clicks || 0);

    if (row.actions) {
      for (const action of row.actions) {
        if (action.action_type === 'lead') totals.leads += parseInt(action.value || 0);
        if (action.action_type === 'purchase') totals.purchases += parseInt(action.value || 0);
      }
    }
  }

  totals.cpl = totals.leads > 0 ? (totals.spend / totals.leads).toFixed(2) : null;
  totals.ctr = totals.impressions > 0 ? ((totals.clicks / totals.impressions) * 100).toFixed(2) : null;
  totals.cpm = totals.impressions > 0 ? ((totals.spend / totals.impressions) * 1000).toFixed(2) : null;

  return totals;
}

export { cache };
