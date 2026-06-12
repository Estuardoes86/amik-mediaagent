import React, { useState } from 'react';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { useApp } from '../context/AppContext.jsx';

const TABS = [
  { path: '/inbox', label: 'INBOX', shortLabel: 'INBOX' },
  { path: '/metrics', label: 'MÉTRICAS', shortLabel: 'MÉT' },
  { path: '/audit', label: 'AUDIT', shortLabel: 'AUD' },
  { path: '/campaigns', label: 'CAMPAÑAS', shortLabel: 'CAMP' },
  { path: '/ai', label: 'IA COPILOTO', shortLabel: 'IA' },
  { path: '/reports', label: 'REPORTES', shortLabel: 'REP' },
  { path: '/settings', label: 'CONFIG', shortLabel: 'CFG' },
];

const DATE_PRESETS = [
  { value: 'last_7d', label: 'Últ. 7d' },
  { value: 'last_30d', label: 'Últ. 30d' },
  { value: 'last_90d', label: 'Últ. 90d' },
];

export default function Layout() {
  const { activeClient, clients, setActiveClient, datePreset, setDatePreset } = useApp();
  const location = useLocation();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
      {/* Top nav */}
      <nav style={{
        display: 'flex',
        alignItems: 'center',
        height: 48,
        borderBottom: '0.5px solid var(--border)',
        background: 'var(--bg)',
        flexShrink: 0,
        overflowX: 'auto'
      }}>
        {/* Logo */}
        <div style={{
          padding: '0 20px',
          fontSize: 13,
          fontWeight: 700,
          letterSpacing: '2px',
          color: 'var(--accent)',
          borderRight: '0.5px solid var(--border)',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          flexShrink: 0
        }}>
          AMIK · AG
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', height: '100%', flex: 1, overflowX: 'auto' }}>
          {TABS.map(tab => (
            <NavLink
              key={tab.path}
              to={tab.path}
              style={({ isActive }) => ({
                display: 'flex',
                alignItems: 'center',
                padding: '0 18px',
                fontSize: 11,
                letterSpacing: '1px',
                fontWeight: 600,
                color: isActive ? 'var(--text)' : 'var(--text3)',
                borderRight: '0.5px solid var(--border)',
                borderBottom: isActive ? '2px solid var(--accent)' : '2px solid transparent',
                background: isActive ? 'var(--bg2)' : 'transparent',
                textDecoration: 'none',
                whiteSpace: 'nowrap',
                height: '100%',
                transition: 'all 0.15s'
              })}
            >
              {tab.label}
            </NavLink>
          ))}
        </div>

        {/* Right controls */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '0 16px',
          borderLeft: '0.5px solid var(--border)',
          flexShrink: 0
        }}>
          <select
            value={datePreset}
            onChange={e => setDatePreset(e.target.value)}
            style={{ width: 'auto', padding: '4px 8px', fontSize: 11 }}
          >
            {DATE_PRESETS.map(d => (
              <option key={d.value} value={d.value}>{d.label}</option>
            ))}
          </select>

          <select
            value={activeClient.id}
            onChange={e => setActiveClient(e.target.value)}
            style={{ width: 'auto', padding: '4px 8px', fontSize: 11 }}
          >
            {clients.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>

          <div style={{ fontSize: 11, color: 'var(--green)', letterSpacing: 1, flexShrink: 0 }}>
            ● LIVE
          </div>
        </div>
      </nav>

      {/* Page content */}
      <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <Outlet />
      </div>
    </div>
  );
}
