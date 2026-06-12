import React, { createContext, useContext, useState, useCallback } from 'react';

const AppContext = createContext(null);

// Default client configurations
const DEFAULT_CLIENTS = [
  {
    id: 'upsjb',
    name: 'UPSJB',
    fullName: 'Universidad Privada San Juan Bautista',
    metaAccountId: import.meta.env.VITE_UPSJB_META_ID || '',
    googleCustomerId: import.meta.env.VITE_UPSJB_GOOGLE_ID || '',
    currency: 'PEN',
    color: '#4a9eff'
  },
  {
    id: 'deco',
    name: 'Deco Shalom',
    fullName: 'Deco Shalom Mueblería',
    metaAccountId: import.meta.env.VITE_DECO_META_ID || '',
    googleCustomerId: import.meta.env.VITE_DECO_GOOGLE_ID || '',
    currency: 'PEN',
    color: '#f5c842'
  },
  {
    id: 'espac',
    name: 'ESPAC',
    fullName: 'Escuela de Pilotos de Aviación Civil',
    metaAccountId: import.meta.env.VITE_ESPAC_META_ID || '',
    googleCustomerId: import.meta.env.VITE_ESPAC_GOOGLE_ID || '',
    currency: 'PEN',
    color: '#00c97a'
  },
  {
    id: 'libra',
    name: 'LIBRA',
    fullName: 'LIBRA — Apoyo Trastornos Alimentarios',
    metaAccountId: import.meta.env.VITE_LIBRA_META_ID || '',
    googleCustomerId: import.meta.env.VITE_LIBRA_GOOGLE_ID || '',
    currency: 'PEN',
    color: '#c084fc'
  }
];

export function AppProvider({ children }) {
  const [activeClient, setActiveClientState] = useState(DEFAULT_CLIENTS[0]);
  const [clients, setClients] = useState(DEFAULT_CLIENTS);
  const [toasts, setToasts] = useState([]);
  const [datePreset, setDatePreset] = useState('last_30d');

  const setActiveClient = useCallback((clientId) => {
    const client = clients.find(c => c.id === clientId);
    if (client) setActiveClientState(client);
  }, [clients]);

  const addClient = useCallback((client) => {
    setClients(prev => [...prev, { ...client, id: client.name.toLowerCase().replace(/\s+/g, '_') }]);
  }, []);

  const showToast = useCallback((message, type = 'info') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
  }, []);

  return (
    <AppContext.Provider value={{
      activeClient,
      setActiveClient,
      clients,
      addClient,
      toasts,
      showToast,
      datePreset,
      setDatePreset
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
