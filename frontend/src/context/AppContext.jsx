import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';

const AppContext = createContext(null);

const DEFAULT_CLIENTS = [
  { id:'upsjb',  name:'UPSJB',       fullName:'Universidad Privada San Juan Bautista', metaAccountId: import.meta.env.VITE_UPSJB_META_ID||'',  googleCustomerId: import.meta.env.VITE_UPSJB_GOOGLE_ID||'',  currency:'PEN', color:'#2563EB' },
  { id:'deco',   name:'Deco Shalom', fullName:'Deco Shalom Mueblería',                 metaAccountId: import.meta.env.VITE_DECO_META_ID||'',   googleCustomerId: import.meta.env.VITE_DECO_GOOGLE_ID||'',   currency:'PEN', color:'#059669' },
  { id:'espac',  name:'ESPAC',       fullName:'Escuela de Pilotos de Aviación Civil',  metaAccountId: import.meta.env.VITE_ESPAC_META_ID||'',  googleCustomerId: import.meta.env.VITE_ESPAC_GOOGLE_ID||'',  currency:'PEN', color:'#7C3AED' },
  { id:'libra',  name:'LIBRA',       fullName:'LIBRA — Apoyo Trastornos Alimentarios', metaAccountId: import.meta.env.VITE_LIBRA_META_ID||'',  googleCustomerId: import.meta.env.VITE_LIBRA_GOOGLE_ID||'',  currency:'PEN', color:'#DC2626' },
];

function todayStr() { return new Date().toISOString().slice(0,10); }
function daysAgoStr(n) { const d=new Date(); d.setDate(d.getDate()-n); return d.toISOString().slice(0,10); }

export function AppProvider({ children, user, onLogout }) {
  // Filtrar clientes según el usuario logueado
  const allowedClients = user?.clients?.length
    ? DEFAULT_CLIENTS.filter(c => user.clients.includes(c.id))
    : DEFAULT_CLIENTS;

  const [activeClient, setActiveClientState] = useState(allowedClients[0]);
  const [clients,      setClients]           = useState(allowedClients);
  const [toasts,       setToasts]            = useState([]);

  // Date state — all in one object so changes are always detected
  const [dateState, setDateState] = useState({
    mode:   'preset',      // 'preset' | 'range'
    preset: 'last_30d',
    since:  daysAgoStr(29),
    until:  todayStr(),
  });

  const setDatePreset = useCallback((preset) => {
    setDateState({ mode:'preset', preset, since:daysAgoStr(29), until:todayStr() });
  }, []);

  const applyDateRange = useCallback((since, until) => {
    if(!since || !until) return;
    setDateState({ mode:'range', preset:'custom', since, until });
  }, []);

  // Computed dateParams — changes whenever dateState changes
  const dateParams = useMemo(() => {
    if (dateState.mode === 'range') {
      return { since: dateState.since, until: dateState.until };
    }
    return { datePreset: dateState.preset };
  }, [dateState]);

  const setActiveClient = useCallback((clientId) => {
    const client = clients.find(c => c.id === clientId);
    if (client) setActiveClientState(client);
  }, [clients]);

  const showToast = useCallback((message, type='info') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
  }, []);

  return (
    <AppContext.Provider value={{
      // Clients
      activeClient, setActiveClient, clients,
      // Date
      dateMode:    dateState.mode,
      datePreset:  dateState.preset,
      dateRange:   { since: dateState.since, until: dateState.until },
      setDatePreset,
      applyDateRange,
      setDateRange: applyDateRange,
      dateParams,
      // Toast
      toasts, showToast,
      // Auth
      user, onLogout,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
};
