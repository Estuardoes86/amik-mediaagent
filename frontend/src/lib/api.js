import axios from 'axios';

const api = axios.create({
  baseURL: (import.meta.env.VITE_API_URL || '') + '/api',
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' }
});

// Attach internal API key if set
api.interceptors.request.use(config => {
  const key = import.meta.env.VITE_INTERNAL_API_KEY;
  if (key) config.headers['x-api-key'] = key;
  return config;
});

// Meta Ads
export const metaApi = {
  getAccounts: () => api.get('/meta/accounts'),
  getCampaigns: (accountId, datePreset = 'last_30d') =>
    api.get('/meta/campaigns', { params: { accountId, datePreset } }),
  getInsights: (accountId, datePreset = 'last_30d') =>
    api.get('/meta/insights', { params: { accountId, datePreset } }),
  getAdSets: (accountId) =>
    api.get('/meta/adsets', { params: { accountId } })
};

// Google Ads
export const googleApi = {
  getCustomers: () => api.get('/google/customers'),
  getCampaigns: (customerId, dateRange = 'LAST_30_DAYS') =>
    api.get('/google/campaigns', { params: { customerId, dateRange } }),
  getKeywords: (customerId) =>
    api.get('/google/keywords', { params: { customerId } }),
  getFull: (customerId, dateRange = 'LAST_30_DAYS') =>
    api.get('/google/full', { params: { customerId, dateRange } })
};

// AI / Claude
export const aiApi = {
  chat: (messages, clientContext) =>
    api.post('/ai/chat', { messages, clientContext }),
  analyze: (data, analysisType, clientName) =>
    api.post('/ai/analyze', { data, analysisType, clientName }),
  streamUrl: '/api/ai/stream'
};

// Audit
export const auditApi = {
  run: (metaAccountId, googleCustomerId, clientName) =>
    api.post('/audit/run', { metaAccountId, googleCustomerId, clientName })
};

// Reports
export const reportsApi = {
  generate: (payload) => api.post('/reports/generate', payload),
  list: () => api.get('/reports/list')
};

export default api;
