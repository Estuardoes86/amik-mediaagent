import React, { useState, useRef, useEffect } from 'react';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { useApp } from '../context/AppContext.jsx';

const CLIENTS = [
  { id:'upsjb',  name:'UPSJB',       color:'#2563EB' },
  { id:'deco',   name:'Deco Shalom', color:'#059669' },
  { id:'espac',  name:'ESPAC',       color:'#7C3AED' },
  { id:'libra',  name:'LIBRA',       color:'#DC2626' },
];

const PRESETS = [
  { v:'today',       l:'Hoy'            },
  { v:'yesterday',   l:'Ayer'           },
  { v:'last_7d',     l:'Últimos 7 días' },
  { v:'last_14d',    l:'Últimos 14 días'},
  { v:'last_30d',    l:'Últimos 30 días'},
  { v:'last_60d',    l:'Últimos 60 días'},
  { v:'this_month',  l:'Este mes'       },
  { v:'last_month',  l:'Mes anterior'   },
  { v:'last_quarter',l:'Último trimestre'},
];

const NAV = [
  {
    label: 'Principal',
    items: [
      { path:'/dashboard', icon:'⊞', label:'Dashboard' },
      { path:'/inbox',     icon:'🔔', label:'Inbox',   badge:'3' },
    ]
  },
  {
    label: 'Plataformas',
    items: [
      { path:'/meta',      icon:'📘', label:'Meta Ads'    },
      { path:'/google',    icon:'🔍', label:'Google Ads'  },
      { path:'/hubspot',   icon:'🟠', label:'HubSpot CRM' },
    ]
  },
  {
    label: 'Campañas',
    items: [
      { path:'/campaigns', icon:'📋', label:'Campañas'  },
      { path:'/metrics',   icon:'📊', label:'Métricas'  },
      { path:'/audit',     icon:'🔎', label:'Audit'     },
    ]
  },
  {
    label: 'Herramientas',
    items: [
      { path:'/ai',        icon:'✦',  label:'IA Copiloto' },
      { path:'/reports',   icon:'📄', label:'Reportes'    },
      { path:'/settings',  icon:'⚙️', label:'Config'      },
    ]
  },
];

export default function Layout() {
  const { activeClient, clients, setActiveClient,
          dateMode, datePreset, setDatePreset,
          dateRange, applyDateRange } = useApp();
  const location = useLocation();

  const [showDate,    setShowDate]    = useState(false);
  const [customSince, setCustomSince] = useState(dateRange?.since || '');
  const [customUntil, setCustomUntil] = useState(dateRange?.until || '');
  const dateRef = useRef(null);

  useEffect(()=>{
    const h = e => { if(dateRef.current && !dateRef.current.contains(e.target)) setShowDate(false); };
    document.addEventListener('mousedown', h);
    return ()=>document.removeEventListener('mousedown', h);
  },[]);

  const dateLabel = dateMode==='range'
    ? `${dateRange?.since} → ${dateRange?.until}`
    : PRESETS.find(p=>p.v===datePreset)?.l || 'Últimos 30 días';

  // Page title from path
  const pageTitle = {
    '/dashboard':'Dashboard','/inbox':'Inbox','/meta':'Meta Ads',
    '/google':'Google Ads','/hubspot':'HubSpot CRM','/campaigns':'Campañas',
    '/metrics':'Métricas','/audit':'Audit','/ai':'IA Copiloto',
    '/reports':'Reportes','/settings':'Configuración',
  }[location.pathname] || 'AMIK MediaAgent';

  return (
    <div className="app-shell">

      {/* ── Sidebar ── */}
      <aside className="sidebar">
        {/* Logo */}
        <div className="sidebar-logo">
          <div className="sidebar-logo-mark">AMIK</div>
          <div className="sidebar-logo-sub">Media Agent</div>
        </div>

        {/* Client selector */}
        <div style={{ padding:'12px', borderBottom:'1px solid var(--sidebar-border)' }}>
          <div style={{ fontSize:9.5, fontWeight:700, letterSpacing:1.5, textTransform:'uppercase', color:'var(--sidebar-text)', marginBottom:8, paddingLeft:4 }}>
            Cliente activo
          </div>
          <select
            value={activeClient?.id || ''}
            onChange={e => setActiveClient(e.target.value)}
            style={{
              background:'rgba(255,255,255,0.07)', border:'1px solid rgba(255,255,255,0.12)',
              color:'#fff', fontSize:12, fontWeight:600, borderRadius:6, padding:'6px 10px',
            }}
          >
            {(clients || CLIENTS).map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>

        {/* Nav sections */}
        {NAV.map(section=>(
          <div key={section.label} className="sidebar-section">
            <div className="sidebar-label">{section.label}</div>
            {section.items.map(item=>(
              <NavLink key={item.path} to={item.path}
                className={({isActive})=>`nav-item${isActive?' active':''}`}>
                <span className="nav-icon">{item.icon}</span>
                <span>{item.label}</span>
                {item.badge && <span className="nav-badge">{item.badge}</span>}
              </NavLink>
            ))}
          </div>
        ))}

        {/* Bottom */}
        <div style={{ marginTop:'auto', padding:'12px', borderTop:'1px solid var(--sidebar-border)' }}>
          <div style={{ display:'flex', alignItems:'center', gap:7 }}>
            <span className="live-dot"/>
            <span style={{ fontSize:10.5, fontWeight:600, color:'var(--sidebar-text2)', letterSpacing:0.5 }}>
              Conectado · LIVE
            </span>
          </div>
          <div style={{ fontSize:10, color:'var(--sidebar-text)', marginTop:6 }}>
            AMIK MediaAgent v1.1
          </div>
        </div>
      </aside>

      {/* ── Main ── */}
      <div className="main-content">

        {/* Topbar */}
        <div className="topbar">
          <div>
            <div className="topbar-title">{pageTitle}</div>
          </div>

          <div style={{ marginLeft:'auto', display:'flex', alignItems:'center', gap:8 }}>
            {/* Date picker */}
            <div ref={dateRef} style={{ position:'relative' }}>
              <button onClick={()=>setShowDate(v=>!v)} className="btn btn-ghost btn-sm"
                style={{ borderColor: showDate ? 'var(--gold)' : undefined, color: showDate ? 'var(--gold)' : undefined }}>
                📅 {dateLabel}
                <span style={{ fontSize:9, opacity:.5 }}>▼</span>
              </button>

              {showDate && (
                <div style={{
                  position:'absolute', top:'calc(100% + 6px)', right:0, zIndex:999,
                  background:'var(--bg2)', border:'1px solid var(--border)',
                  borderRadius:'var(--radius-md)', boxShadow:'var(--shadow-lg)',
                  minWidth:240, overflow:'hidden',
                }}>
                  <div style={{ padding:'8px 0', borderBottom:'1px solid var(--border)' }}>
                    {PRESETS.map(p=>(
                      <button key={p.v} onClick={()=>{ setDatePreset(p.v); setShowDate(false); }}
                        style={{
                          display:'block', width:'100%', textAlign:'left',
                          padding:'8px 16px', fontSize:13, fontWeight: datePreset===p.v?600:400,
                          background:datePreset===p.v?'var(--gold-dim)':'transparent',
                          color:datePreset===p.v?'var(--gold-dark)':'var(--text2)',
                          border:'none', cursor:'pointer',
                        }}
                        onMouseEnter={e=>e.currentTarget.style.background='var(--bg3)'}
                        onMouseLeave={e=>e.currentTarget.style.background=datePreset===p.v?'var(--gold-dim)':'transparent'}
                      >
                        {datePreset===p.v&&'✓ '}{p.l}
                      </button>
                    ))}
                  </div>
                  <div style={{ padding:'12px 16px' }}>
                    <div style={{ fontSize:11, fontWeight:600, color:'var(--text3)', marginBottom:10, textTransform:'uppercase', letterSpacing:1 }}>
                      Rango personalizado
                    </div>
                    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:10 }}>
                      <div>
                        <div style={{ fontSize:11, color:'var(--text3)', marginBottom:4 }}>Desde</div>
                        <input type="date" value={customSince} onChange={e=>setCustomSince(e.target.value)} style={{ fontSize:12 }}/>
                      </div>
                      <div>
                        <div style={{ fontSize:11, color:'var(--text3)', marginBottom:4 }}>Hasta</div>
                        <input type="date" value={customUntil} onChange={e=>setCustomUntil(e.target.value)} style={{ fontSize:12 }}/>
                      </div>
                    </div>
                    <button className="btn btn-primary" style={{ width:'100%', justifyContent:'center' }}
                      onClick={()=>{ applyDateRange?.(customSince,customUntil); setShowDate(false); }}>
                      Aplicar rango
                    </button>
                  </div>
                </div>
              )}
            </div>

            <button className="btn btn-ghost btn-sm">↻ Actualizar</button>
          </div>
        </div>

        {/* Page content */}
        <div style={{ flex:1, overflow:'hidden', display:'flex', flexDirection:'column' }}>
          <Outlet/>
        </div>
      </div>
    </div>
  );
}
