import axios from 'axios';
import NodeCache from 'node-cache';
import { google } from 'googleapis';

const cache = new NodeCache({ stdTTL: 300 });
const GOOGLE_BASE = 'https://googleads.googleapis.com/v16';

// OAuth2 client con Refresh Token
const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  'http://localhost:3000/oauth2callback'
);

oauth2Client.setCredentials({
  refresh_token: process.env.GOOGLE_REFRESH_TOKEN
});

async function getAccessToken() {
  const { token } = await oauth2Client.getAccessToken();
  return token;
}

async function getHeaders() {
  const accessToken = await getAccessToken();
  return {
    Authorization: `Bearer ${accessToken}`,
    'developer-token': process.env.GOOGLE_DEVELOPER_TOKEN,
    'login-customer-id': process.env.GOOGLE_ADS_MANAGER_ID || process.env.GOOGLE_ADS_CUSTOMER_ID || ''
  };
}

async function googleQuery(customerId, query) {
  const cacheKey = `google:${customerId}:${query.substring(0, 80)}`;
  const cached = cache.get(cacheKey);
  if (cached) return cached;

  const headers = await getHeaders();
  const response = await axios.post(
    `${GOOGLE_BASE}/customers/${customerId}/googleAds:search`,
    { query },
    { headers }
  );

  const data = response.data.results || [];
  cache.set(cacheKey, data);
  return data;
}

export async function getAccessibleCustomers() {
  try {
    const headers = await getHeaders();
    const response = await axios.get(
      `${GOOGLE_BASE}/customers:listAccessibleCustomers`,
      { headers }
    );
    return response.data.resourceNames || [];
  } catch (err) {
    console.error('[Google] getAccessibleCustomers error:', err.response?.data || err.message);
    return [];
  }
}

export async function getCampaignPerformance(customerId, dateRange = 'LAST_30_DAYS') {
  const query = `
    SELECT
      campaign.id,
      campaign.name,
      campaign.status,
      campaign.advertising_channel_type,
      campaign_budget.amount_micros,
      metrics.impressions,
      metrics.clicks,
      metrics.cost_micros,
      metrics.conversions,
      metrics.ctr,
      metrics.average_cpc,
      metrics.conversion_rate
    FROM campaign
    WHERE segments.date DURING ${dateRange}
      AND campaign.status IN ('ENABLED', 'PAUSED')
    ORDER BY metrics.cost_micros DESC
    LIMIT 50
  `;

  try {
    const rows = await googleQuery(customerId, query);
    return rows.map(row => ({
      id: row.campaign?.id,
      name: row.campaign?.name,
      status: row.campaign?.status,
      channelType: row.campaign?.advertisingChannelType,
      budget: row.campaignBudget?.amountMicros ? row.campaignBudget.amountMicros / 1e6 : null,
      impressions: row.metrics?.impressions,
      clicks: row.metrics?.clicks,
      spend: row.metrics?.costMicros ? row.metrics.costMicros / 1e6 : 0,
      conversions: row.metrics?.conversions,
      ctr: row.metrics?.ctr,
      avgCpc: row.metrics?.averageCpc ? row.metrics.averageCpc / 1e6 : null,
      convRate: row.metrics?.conversionRate
    }));
  } catch (err) {
    console.error('[Google] getCampaignPerformance error:', err.response?.data || err.message);
    return [];
  }
}

export async function getKeywordPerformance(customerId, dateRange = 'LAST_30_DAYS') {
  const query = `
    SELECT
      ad_group_criterion.keyword.text,
      ad_group_criterion.keyword.match_type,
      campaign.name,
      metrics.impressions,
      metrics.clicks,
      metrics.cost_micros,
      metrics.conversions,
      metrics.average_cpc
    FROM keyword_view
    WHERE segments.date DURING ${dateRange}
      AND campaign.status = 'ENABLED'
      AND ad_group.status = 'ENABLED'
      AND ad_group_criterion.status = 'ENABLED'
    ORDER BY metrics.cost_micros DESC
    LIMIT 100
  `;

  try {
    const rows = await googleQuery(customerId, query);
    return rows.map(row => ({
      keyword: row.adGroupCriterion?.keyword?.text,
      matchType: row.adGroupCriterion?.keyword?.matchType,
      campaign: row.campaign?.name,
      impressions: row.metrics?.impressions,
      clicks: row.metrics?.clicks,
      spend: row.metrics?.costMicros ? row.metrics.costMicros / 1e6 : 0,
      conversions: row.metrics?.conversions,
      avgCpc: row.metrics?.averageCpc ? row.metrics.averageCpc / 1e6 : null
    }));
  } catch (err) {
    console.error('[Google] getKeywordPerformance error:', err.response?.data || err.message);
    return [];
  }
}

export async function getConversionActions(customerId) {
  const query = `
    SELECT
      conversion_action.id,
      conversion_action.name,
      conversion_action.type,
      conversion_action.status,
      metrics.all_conversions
    FROM conversion_action
    WHERE conversion_action.status = 'ENABLED'
    LIMIT 30
  `;

  try {
    return await googleQuery(customerId, query);
  } catch (err) {
    console.error('[Google] getConversionActions error:', err.response?.data || err.message);
    return [];
  }
}

export function aggregateGoogleMetrics(campaigns) {
  return campaigns.reduce((acc, c) => ({
    spend: acc.spend + (c.spend || 0),
    clicks: acc.clicks + (c.clicks || 0),
    impressions: acc.impressions + (c.impressions || 0),
    conversions: acc.conversions + (c.conversions || 0)
  }), { spend: 0, clicks: 0, impressions: 0, conversions: 0 });
}
