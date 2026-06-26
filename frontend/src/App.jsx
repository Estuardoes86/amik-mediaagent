import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider }   from './context/AppContext.jsx';
import { ToastContainer } from './components/Toast.jsx';
import Layout            from './components/Layout.jsx';
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

export default function App() {
  return (
    <AppProvider>
      <Routes>
        <Route path="/" element={<Layout />}>
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
