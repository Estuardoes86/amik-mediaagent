import axios from 'axios';

const api = axios.create({
  baseURL: (import.meta.env.VITE_API_URL || '') + '/api',
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' }
});

api.interceptors.request.use(config => {
  const key = import.meta.env.VITE_INTERNAL_API_KEY;
  if (key) config.headers['x-api-key'] = key;
  return config;
});

export const metaApi = {
  getAccounts: () => api.get('/meta/accounts'),
  getCampaigns: (accountId, dateParams = {}) =>
    api.get('/meta/campaigns', { params: { accountId, ...dateParams } }),
  getInsights: (accountId, dateParams = {}) =>
    api.get('/meta/insights', { params: { accountId, ...dateParams } }),
  getAdSets: (accountId, dateParams = {}) =>
    api.get('/meta/adsets', { params: { accountId, ...dateParams } }),
  getDaily: (accountId, dateParams = {}) =>
    api.get('/meta/daily', { params: { accountId, ...dateParams } }),
};

export const googleApi = {
  getCustomers: () => api.get('/google/customers'),
  getCampaigns: (customerId, dateRange = 'LAST_30_DAYS') =>
    api.get('/google/campaigns', { params: { customerId, dateRange } }),
  getKeywords: (customerId) =>
    api.get('/google/keywords', { params: { customerId } }),
  getFull: (customerId, dateRange = 'LAST_30_DAYS') =>
    api.get('/google/full', { params: { customerId, dateRange } })
};

export const aiApi = {
  chat:      (messages, clientContext) => api.post('/ai/chat', { messages, clientContext }),
  analyze:   (data, analysisType, clientName) => api.post('/ai/analyze', { data, analysisType, clientName }),
  streamUrl: '/api/ai/stream'
};

export const auditApi = {
  run: (metaAccountId, googleCustomerId, clientName) =>
    api.post('/audit/run', { metaAccountId, googleCustomerId, clientName })
};

export const reportsApi = {
  generate: (payload) => api.post('/reports/generate', payload),
  list:     ()        => api.get('/reports/list')
};

export const socialApi = {
  getAll:       () => api.get('/social/all'),
  getFacebook:  () => api.get('/social/facebook'),
  getInstagram: () => api.get('/social/instagram'),
  getYouTube:   () => api.get('/social/youtube'),
  clearCache:   () => api.delete('/social/cache'),
};

export default api;
