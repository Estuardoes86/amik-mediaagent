import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider }   from './context/AppContext.jsx';
import { ToastContainer } from './components/Toast.jsx';
import Layout            from './components/Layout.jsx';
import LoginPage         from './pages/LoginPage.jsx';
import DashboardPage     from './pages/DashboardPage.jsx';
import InboxPage         from './pages/InboxPage.jsx';
import MetaPage          from './pages/MetaPage.jsx';
import GooglePage        from './pages/GooglePage.jsx';
import HubSpotPage       from './pages/HubSpotPage.jsx';
import CampaignsPage     from './pages/CampaignsPage.jsx';
import MetricsPage       from './pages/MetricsPage.jsx';
import AuditPage         from './pages/AuditPage.jsx';
import AiPage            from './pages/AiPage.jsx';
import ReportsPage       from './pages/ReportsPage.jsx';
import SettingsPage      from './pages/SettingsPage.jsx';
import './index.css';

const API = import.meta.env.VITE_API_URL || '/api';

export default function App() {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('amik_token');
    if (!token) { setLoading(false); return; }
    fetch(`${API}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(r => r.json())
      .then(data => { if (data.user) setUser(data.user); })
      .catch(() => localStorage.removeItem('amik_token'))
      .finally(() => setLoading(false));
  }, []);

  const handleLogin = async (credentialResponse) => {
    try {
      const res = await fetch(`${API}/auth/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential: credentialResponse.credential })
      });
      const data = await res.json();
      if (data.token) {
        localStorage.setItem('amik_token', data.token);
        setUser(data.user);
      } else {
        alert(data.error || 'Acceso denegado');
      }
    } catch (err) {
      alert('Error al iniciar sesión');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('amik_token');
    setUser(null);
  };

  if (loading) return (
    <div style={{ height:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#F8F9FA' }}>
      <div className="spinner" style={{ width:24, height:24, borderWidth:3 }}/>
    </div>
  );

  if (!user) return <LoginPage onLogin={handleLogin} />;

  return (
    <AppProvider user={user} onLogout={handleLogout}>
      <Routes>
        <Route path="/" element={<Layout onLogout={handleLogout} user={user} />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard"  element={<DashboardPage />} />
          <Route path="inbox"      element={<InboxPage />} />
          <Route path="meta"       element={<MetaPage />} />
          <Route path="google"     element={<GooglePage />} />
          <Route path="hubspot"    element={<HubSpotPage />} />
          <Route path="campaigns"  element={<CampaignsPage />} />
          <Route path="metrics"    element={<MetricsPage />} />
          <Route path="audit"      element={<AuditPage />} />
          <Route path="ai"         element={<AiPage />} />
          <Route path="reports"    element={<ReportsPage />} />
          <Route path="settings"   element={<SettingsPage />} />
        </Route>
      </Routes>
      <ToastContainer />
    </AppProvider>
  );
}
