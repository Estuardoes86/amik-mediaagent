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

// Safe spread — ensures dateParams is always an object
const safeDate = (dp) => (dp && typeof dp === 'object') ? dp : { datePreset: 'last_30d' };

export const metaApi = {
  getAccounts:  ()                      => api.get('/meta/accounts'),
  getCampaigns: (accountId, dp)         => api.get('/meta/campaigns', { params: { accountId, ...safeDate(dp) } }),
  getInsights:  (accountId, dp)         => api.get('/meta/insights',  { params: { accountId, ...safeDate(dp) } }),
  getAdSets:    (accountId, dp)         => api.get('/meta/adsets',    { params: { accountId, ...safeDate(dp) } }),
  getDaily:     (accountId, dp)         => api.get('/meta/daily',     { params: { accountId, ...safeDate(dp) } }),
};

export const googleApi = {
  getCustomers: ()                           => api.get('/google/customers'),
  getCampaigns: (customerId, dateRange)      => api.get('/google/campaigns', { params: { customerId, dateRange: dateRange||'LAST_30_DAYS' } }),
  getKeywords:  (customerId)                 => api.get('/google/keywords',  { params: { customerId } }),
  getFull:      (customerId, dateRange)      => api.get('/google/full',      { params: { customerId, dateRange: dateRange||'LAST_30_DAYS' } }),
};

export const aiApi = {
  chat:      (messages, clientContext)           => api.post('/ai/chat',    { messages, clientContext }),
  analyze:   (data, analysisType, clientName)    => api.post('/ai/analyze', { data, analysisType, clientName }),
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

export const hubspotApi = {
  getSummary:   (pipelineId, daysBack=30) => api.get('/hubspot/summary',   { params:{ pipelineId, daysBack } }),
  getPipelines: ()                         => api.get('/hubspot/pipelines'),
  getFunnel:    (pipelineId)               => api.get('/hubspot/funnel',    { params:{ pipelineId } }),
  getContacts:  (daysBack=30)              => api.get('/hubspot/contacts',  { params:{ daysBack } }),
  getRecent:    ()                         => api.get('/hubspot/recent'),
  getEmailStats:(daysBack=90)              => api.get('/hubspot/email-stats', { params:{ daysBack } }),
  getNurturing: ()                         => api.get('/hubspot/nurturing'),
};

export const whatsappApi = {
  getStatus:    ()              => api.get('/whatsapp/status'),
  getAnalytics: (start, end)    => api.get('/whatsapp/analytics', { params: { start, end } }),
};

export default api;
