import React, { createContext, useContext, useState, useCallback } from 'react';

const AppContext = createContext(null);

const DEFAULT_CLIENTS = [
  { id:'upsjb',  name:'UPSJB',       fullName:'Universidad Privada San Juan Bautista', metaAccountId: import.meta.env.VITE_UPSJB_META_ID||'',  googleCustomerId: import.meta.env.VITE_UPSJB_GOOGLE_ID||'',  currency:'PEN', color:'#5B8DB8' },
  { id:'deco',   name:'Deco Shalom', fullName:'Deco Shalom Mueblería',                 metaAccountId: import.meta.env.VITE_DECO_META_ID||'',   googleCustomerId: import.meta.env.VITE_DECO_GOOGLE_ID||'',   currency:'PEN', color:'#DCA145' },
  { id:'espac',  name:'ESPAC',       fullName:'Escuela de Pilotos de Aviación Civil',  metaAccountId: import.meta.env.VITE_ESPAC_META_ID||'',  googleCustomerId: import.meta.env.VITE_ESPAC_GOOGLE_ID||'',  currency:'PEN', color:'#2DD4A0' },
  { id:'libra',  name:'LIBRA',       fullName:'LIBRA — Apoyo Trastornos Alimentarios', metaAccountId: import.meta.env.VITE_LIBRA_META_ID||'',  googleCustomerId: import.meta.env.VITE_LIBRA_GOOGLE_ID||'',  currency:'PEN', color:'#9061B0' },
];

// Today and 30 days ago as default
function defaultDates() {
  const today = new Date();
  const from  = new Date(); from.setDate(today.getDate() - 29);
  return {
    since: from.toISOString().slice(0,10),
    until: today.toISOString().slice(0,10),
  };
}

export function AppProvider({ children }) {
  const [activeClient,     setActiveClientState] = useState(DEFAULT_CLIENTS[0]);
  const [clients,          setClients]           = useState(DEFAULT_CLIENTS);
  const [toasts,           setToasts]            = useState([]);
  const [dateMode,         setDateMode]          = useState('preset');   // 'preset' | 'range'
  const [datePreset,       setDatePreset_]        = useState('last_30d');
  const [dateRange,        setDateRange]          = useState(defaultDates());

  const setDatePreset = (v) => { setDatePreset_(v); setDateMode('preset'); };
  const applyDateRange = (since, until) => { setDateRange({ since, until }); setDateMode('range'); };

  // Resolved params to send to API
  const dateParams = dateMode === 'range'
    ? { since: dateRange.since, until: dateRange.until, datePreset: undefined }
    : { datePreset, since: undefined, until: undefined };

  const setActiveClient = useCallback((clientId) => {
    const client = clients.find(c => c.id === clientId);
    if (client) setActiveClientState(client);
  }, [clients]);

  const addClient = useCallback((client) => {
    setClients(prev => [...prev, { ...client, id: client.name.toLowerCase().replace(/\s+/g,'_') }]);
  }, []);

  const showToast = useCallback((message, type = 'info') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
  }, []);

  return (
    <AppContext.Provider value={{
      activeClient, setActiveClient, clients, addClient,
      toasts, showToast,
      dateMode, datePreset, setDatePreset, dateRange, setDateRange, applyDateRange, dateParams,
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
