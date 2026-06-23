import { useState, useEffect, useCallback } from 'react';
import { metaApi, googleApi, auditApi } from '../lib/api.js';
import { useApp } from '../context/AppContext.jsx';

export function useFetch(fetchFn, deps = []) {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState(null);

  const fetch = useCallback(async () => {
    setLoading(true); setError(null);
    try { setData((await fetchFn()).data); }
    catch (err) { setError(err.response?.data?.error || err.message); }
    finally { setLoading(false); }
  }, deps);

  useEffect(() => { fetch(); }, [fetch]);
  return { data, loading, error, refetch: fetch };
}

export function useMetaCampaigns() {
  const { activeClient, dateParams } = useApp();
  const { data, loading, error, refetch } = useFetch(
    () => activeClient.metaAccountId
      ? metaApi.getCampaigns(activeClient.metaAccountId, dateParams)
      : Promise.resolve({ data: { campaigns:[], summary:{} } }),
    [activeClient.metaAccountId, JSON.stringify(dateParams)]
  );
  return { campaigns: data?.campaigns||[], summary: data?.summary||{}, loading, error, refetch };
}

export function useMetaInsights() {
  const { activeClient, dateParams } = useApp();
  const { data, loading, error, refetch } = useFetch(
    () => activeClient.metaAccountId
      ? metaApi.getInsights(activeClient.metaAccountId, dateParams)
      : Promise.resolve({ data:{} }),
    [activeClient.metaAccountId, JSON.stringify(dateParams)]
  );
  return { insights: data||{}, loading, error, refetch };
}

export function useGoogleCampaigns() {
  const { activeClient, dateParams } = useApp();
  const googleRange = dateParams.datePreset === 'last_7d' ? 'LAST_7_DAYS' : dateParams.datePreset === 'last_90d' ? 'LAST_90_DAYS' : 'LAST_30_DAYS';
  const { data, loading, error, refetch } = useFetch(
    () => activeClient.googleCustomerId
      ? googleApi.getCampaigns(activeClient.googleCustomerId, googleRange)
      : Promise.resolve({ data: { campaigns:[], summary:{} } }),
    [activeClient.googleCustomerId, googleRange]
  );
  return { campaigns: data?.campaigns||[], summary: data?.summary||{}, loading, error, refetch };
}

export function useAudit() {
  const { activeClient, showToast } = useApp();
  const [auditData, setAuditData] = useState(null);
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState(null);

  const runAudit = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const res = await auditApi.run(activeClient.metaAccountId, activeClient.googleCustomerId, activeClient.name);
      setAuditData(res.data);
      showToast(`✓ Audit completado — score: ${res.data.score}/100`, 'success');
    } catch (err) {
      setError(err.response?.data?.error || err.message);
      showToast('Error al ejecutar audit', 'error');
    } finally { setLoading(false); }
  }, [activeClient]);

  return { auditData, loading, error, runAudit };
}

export function useInbox() {
  const [actions, setActions] = useState([]);
  const [log,     setLog]     = useState([]);
  const addAction    = useCallback(a => setActions(p => [...p, {...a, id:Date.now(), status:'pending'}]), []);
  const approveAction= useCallback(id => {
    const a = actions.find(x=>x.id===id);
    setActions(p => p.filter(x=>x.id!==id));
    if (a) setLog(p => [{ ...a, ts:new Date().toISOString(), status:'approved', hash:Math.random().toString(36).substr(2,7) }, ...p]);
  }, [actions]);
  const rejectAction = useCallback(id => setActions(p => p.filter(x=>x.id!==id)), []);
  return { actions, log, addAction, approveAction, rejectAction };
}
