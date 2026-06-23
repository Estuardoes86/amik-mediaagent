import React from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { useApp } from '../context/AppContext.jsx';

const TABS = [
  { path: '/inbox',     label: 'INBOX' },
  { path: '/metrics',   label: 'MÉTRICAS' },
  { path: '/campaigns', label: 'CAMPAÑAS' },
  { path: '/audit',     label: 'AUDIT' },
  { path: '/ai',        label: 'IA COPILOTO' },
  { path: '/reports',   label: 'REPORTES' },
  { path: '/settings',  label: 'CONFIG' },
];

const DATE_PRESETS = [
  { value: 'last_7d',  label: 'Últ. 7d' },
  { value: 'last_30d', label: 'Últ. 30d' },
  { value: 'last_90d', label: 'Últ. 90d' },
];

export default function Layout() {
  const { activeClient, clients, setActiveClient, datePreset, setDatePreset } = useApp();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>

      {/* ── Top nav ── */}
      <nav style={{
        display: 'flex', alignItems: 'center', height: 52,
        borderBottom: '1px solid var(--border)',
        background: 'linear-gradient(180deg, #1C1C25 0%, #14141B 100%)',
        flexShrink: 0, overflowX: 'auto'
      }}>

        {/* Logo */}
        <div style={{
          padding: '0 24px', height: '100%',
          display: 'flex', alignItems: 'center', gap: 10,
          borderRight: '1px solid var(--border)', flexShrink: 0,
        }}>
          <div style={{
            fontFamily: 'var(--font-cond)', fontWeight: 900, fontSize: 14,
            letterSpacing: '3px', color: 'var(--gold)', textTransform: 'uppercase',
          }}>
            AMIK
          </div>
          <div style={{
            width: 1, height: 18, background: 'var(--border2)', flexShrink: 0
          }} />
          <div style={{
            fontFamily: 'var(--font-semi)', fontWeight: 600, fontSize: 9,
            letterSpacing: '2.5px', color: 'var(--text3)', textTransform: 'uppercase'
          }}>
            MEDIA AGENT
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', height: '100%', flex: 1, overflowX: 'auto' }}>
          {TABS.map(tab => (
            <NavLink
              key={tab.path}
              to={tab.path}
              className={({ isActive }) => `nav-tab${isActive ? ' active' : ''}`}
            >
              {tab.label}
            </NavLink>
          ))}
        </div>

        {/* Right controls */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10, padding: '0 18px',
          borderLeft: '1px solid var(--border)', flexShrink: 0
        }}>
          {/* Date preset */}
          <select
            value={datePreset}
            onChange={e => setDatePreset(e.target.value)}
            style={{
              width: 'auto', padding: '5px 10px', fontSize: 10,
              fontFamily: 'var(--font-semi)', fontWeight: 700, letterSpacing: 1,
              textTransform: 'uppercase', borderRadius: 'var(--radius)',
            }}
          >
            {DATE_PRESETS.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
          </select>

          {/* Client selector */}
          <select
            value={activeClient.id}
            onChange={e => setActiveClient(e.target.value)}
            style={{
              width: 'auto', padding: '5px 10px', fontSize: 10,
              fontFamily: 'var(--font-semi)', fontWeight: 700, letterSpacing: 1,
              textTransform: 'uppercase', borderRadius: 'var(--radius)',
              borderColor: 'var(--gold-border)', color: 'var(--gold)',
            }}
          >
            {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>

          {/* Live indicator */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
            <span className="pulse-dot" />
            <span style={{
              fontFamily: 'var(--font-semi)', fontSize: 9, fontWeight: 700,
              letterSpacing: 2.5, color: 'var(--green)', textTransform: 'uppercase'
            }}>LIVE</span>
          </div>
        </div>
      </nav>

      {/* ── Page ── */}
      <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <Outlet />
      </div>
    </div>
  );
}
