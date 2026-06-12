import { useState, useEffect, useCallback } from 'react';
import { metaApi, googleApi, auditApi } from '../lib/api.js';
import { useApp } from '../context/AppContext.jsx';

// Generic fetch hook
export function useFetch(fetchFn, deps = []) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchFn();
      setData(result.data);
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  }, deps);

  useEffect(() => { fetch(); }, [fetch]);

  return { data, loading, error, refetch: fetch };
}

// Meta campaigns for active client
export function useMetaCampaigns() {
  const { activeClient, datePreset } = useApp();
  const { data, loading, error, refetch } = useFetch(
    () => activeClient.metaAccountId
      ? metaApi.getCampaigns(activeClient.metaAccountId, datePreset)
      : Promise.resolve({ data: { campaigns: [], summary: {} } }),
    [activeClient.metaAccountId, datePreset]
  );
  return { campaigns: data?.campaigns || [], summary: data?.summary || {}, loading, error, refetch };
}

// Meta insights for active client
export function useMetaInsights() {
  const { activeClient, datePreset } = useApp();
  const { data, loading, error, refetch } = useFetch(
    () => activeClient.metaAccountId
      ? metaApi.getInsights(activeClient.metaAccountId, datePreset)
      : Promise.resolve({ data: {} }),
    [activeClient.metaAccountId, datePreset]
  );
  return { insights: data || {}, loading, error, refetch };
}

// Google campaigns for active client
export function useGoogleCampaigns() {
  const { activeClient, datePreset } = useApp();
  const googleRange = datePreset === 'last_30d' ? 'LAST_30_DAYS' : 'LAST_7_DAYS';
  const { data, loading, error, refetch } = useFetch(
    () => activeClient.googleCustomerId
      ? googleApi.getCampaigns(activeClient.googleCustomerId, googleRange)
      : Promise.resolve({ data: { campaigns: [], summary: {} } }),
    [activeClient.googleCustomerId, datePreset]
  );
  return { campaigns: data?.campaigns || [], summary: data?.summary || {}, loading, error, refetch };
}

// Full audit hook
export function useAudit() {
  const { activeClient, showToast } = useApp();
  const [auditData, setAuditData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const runAudit = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await auditApi.run(
        activeClient.metaAccountId,
        activeClient.googleCustomerId,
        activeClient.name
      );
      setAuditData(res.data);
      showToast(`✓ Audit completado — score: ${res.data.score}/100`, 'success');
    } catch (err) {
      setError(err.response?.data?.error || err.message);
      showToast('Error al ejecutar audit', 'error');
    } finally {
      setLoading(false);
    }
  }, [activeClient]);

  return { auditData, loading, error, runAudit };
}

// Actions inbox state (local, no backend persistence yet)
export function useInbox() {
  const [actions, setActions] = useState([]);
  const [log, setLog] = useState([]);

  const addAction = useCallback((action) => {
    setActions(prev => [...prev, { ...action, id: Date.now(), status: 'pending' }]);
  }, []);

  const approveAction = useCallback((id) => {
    setActions(prev => prev.filter(a => a.id !== id));
    const action = actions.find(a => a.id === id);
    if (action) {
      const hash = Math.random().toString(36).substr(2, 7);
      setLog(prev => [{
        id: Date.now(),
        type: 'approved',
        title: action.title,
        hash,
        ts: new Date().toISOString()
      }, ...prev]);
    }
  }, [actions]);

  const rejectAction = useCallback((id) => {
    setActions(prev => prev.filter(a => a.id !== id));
  }, []);

  return { actions, log, addAction, approveAction, rejectAction };
}
