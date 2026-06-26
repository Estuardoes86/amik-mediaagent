import { useState, useEffect, useRef } from 'react';
import { metaApi, googleApi, auditApi } from '../lib/api.js';
import { useApp } from '../context/AppContext.jsx';

// Simple fetch hook that re-runs whenever key changes
function useFetchKey(fetchFn, key) {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    setLoading(true);
    setError(null);
    fetchFn()
      .then(res => { if(mountedRef.current) setData(res.data); })
      .catch(err => { if(mountedRef.current) setError(err.response?.data?.error || err.message); })
      .finally(() => { if(mountedRef.current) setLoading(false); });
    return () => { mountedRef.current = false; };
  }, [key]); // Re-runs ONLY when key string changes

  const refetch = () => {
    setLoading(true);
    fetchFn()
      .then(res => setData(res.data))
      .catch(err => setError(err.response?.data?.error || err.message))
      .finally(() => setLoading(false));
  };

  return { data, loading, error, refetch };
}

export function useMetaCampaigns() {
  const { activeClient, dateParams } = useApp();
  const key = `meta-camps:${activeClient.metaAccountId}:${JSON.stringify(dateParams)}`;

  const { data, loading, error, refetch } = useFetchKey(
    () => activeClient.metaAccountId
      ? metaApi.getCampaigns(activeClient.metaAccountId, dateParams)
      : Promise.resolve({ data: { campaigns:[], summary:{} } }),
    key
  );

  return {
    campaigns: data?.campaigns || [],
    summary:   data?.summary   || {},
    loading, error, refetch
  };
}

export function useMetaInsights() {
  const { activeClient, dateParams } = useApp();
  const key = `meta-insights:${activeClient.metaAccountId}:${JSON.stringify(dateParams)}`;

  const { data, loading, error, refetch } = useFetchKey(
    () => activeClient.metaAccountId
      ? metaApi.getInsights(activeClient.metaAccountId, dateParams)
      : Promise.resolve({ data:{} }),
    key
  );

  return { insights: data || {}, loading, error, refetch };
}

export function useGoogleCampaigns() {
  const { activeClient, dateParams } = useApp();

  // Map preset to Google format
  const googleRange = (() => {
    if (dateParams.since && dateParams.until) return 'LAST_30_DAYS'; // custom range not supported yet
    const p = dateParams.datePreset || 'last_30d';
    if (p==='last_7d')     return 'LAST_7_DAYS';
    if (p==='last_14d')    return 'LAST_14_DAYS';
    if (p==='last_30d')    return 'LAST_30_DAYS';
    if (p==='last_60d')    return 'LAST_60_DAYS';
    if (p==='this_month')  return 'THIS_MONTH';
    if (p==='last_month')  return 'LAST_MONTH';
    if (p==='last_quarter')return 'LAST_QUARTER';
    if (p==='today')       return 'TODAY';
    if (p==='yesterday')   return 'YESTERDAY';
    return 'LAST_30_DAYS';
  })();

  const key = `google-camps:${activeClient.googleCustomerId}:${googleRange}`;

  const { data, loading, error, refetch } = useFetchKey(
    () => activeClient.googleCustomerId
      ? googleApi.getCampaigns(activeClient.googleCustomerId, googleRange)
      : Promise.resolve({ data: { campaigns:[], summary:{} } }),
    key
  );

  return {
    campaigns: data?.campaigns || [],
    summary:   data?.summary   || {},
    loading, error, refetch
  };
}

export function useAudit() {
  const { activeClient, showToast } = useApp();
  const [auditData, setAuditData] = useState(null);
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState(null);

  const runAudit = async () => {
    setLoading(true); setError(null);
    try {
      const res = await auditApi.run(
        activeClient.metaAccountId,
        activeClient.googleCustomerId,
        activeClient.name
      );
      setAuditData(res.data);
      showToast?.(`✓ Audit completado — score: ${res.data.score}/100`, 'success');
    } catch (err) {
      setError(err.response?.data?.error || err.message);
      showToast?.('Error al ejecutar audit', 'error');
    } finally {
      setLoading(false);
    }
  };

  return { auditData, loading, error, runAudit };
}

export function useInbox() {
  const [actions, setActions] = useState([]);
  const [log,     setLog]     = useState([]);

  const addAction     = (a) => setActions(p => [...p, {...a, id:Date.now(), status:'pending'}]);
  const approveAction = (id) => {
    const a = actions.find(x=>x.id===id);
    setActions(p => p.filter(x=>x.id!==id));
    if(a) setLog(p => [{...a, ts:new Date().toISOString(), status:'approved'}, ...p]);
  };
  const rejectAction = (id) => setActions(p => p.filter(x=>x.id!==id));

  return { actions, log, addAction, approveAction, rejectAction };
}
