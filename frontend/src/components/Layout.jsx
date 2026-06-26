import React, { useState, useRef, useEffect } from 'react';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { useApp } from '../context/AppContext.jsx';

const PRESETS = [
  { v:'today',       l:'Hoy'              },
  { v:'yesterday',   l:'Ayer'             },
  { v:'last_7d',     l:'Últimos 7 días'   },
  { v:'last_14d',    l:'Últimos 14 días'  },
  { v:'last_30d',    l:'Últimos 30 días'  },
  { v:'last_60d',    l:'Últimos 60 días'  },
  { v:'this_month',  l:'Este mes'         },
  { v:'last_month',  l:'Mes anterior'     },
  { v:'last_quarter',l:'Último trimestre' },
];

const NAV = [
  {
    label: 'Principal',
    items: [
      { path:'/dashboard', icon:'⊞', label:'Dashboard'   },
      { path:'/inbox',     icon:'🔔', label:'Inbox'       },
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
      { path:'/campaigns', icon:'📋', label:'Campañas'    },
      { path:'/metrics',   icon:'📊', label:'Métricas'    },
      { path:'/audit',     icon:'🔎', label:'Audit'       },
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

const PAGE_TITLES = {
  '/dashboard':'Dashboard','/inbox':'Inbox',
  '/meta':'Meta Ads','/google':'Google Ads','/hubspot':'HubSpot CRM',
  '/campaigns':'Campañas','/metrics':'Métricas','/audit':'Audit',
  '/ai':'IA Copiloto','/reports':'Reportes','/settings':'Configuración',
};

export default function Layout() {
  const {
    activeClient, clients, setActiveClient,
    dateMode, datePreset, setDatePreset,
    dateRange, applyDateRange
  } = useApp();

  const location = useLocation();
  const [showDate,    setShowDate]    = useState(false);
  const [customSince, setCustomSince] = useState('');
  const [customUntil, setCustomUntil] = useState('');
  const dateRef = useRef(null);

  // Init custom dates
  useEffect(()=>{
    if(dateRange?.since) setCustomSince(dateRange.since);
    if(dateRange?.until) setCustomUntil(dateRange.until);
  },[]);

  // Close date picker on outside click
  useEffect(()=>{
    const h = e => { if(dateRef.current && !dateRef.current.contains(e.target)) setShowDate(false); };
    document.addEventListener('mousedown', h);
    return ()=>document.removeEventListener('mousedown', h);
  },[]);

  const dateLabel = dateMode==='range' && dateRange?.since
    ? `${dateRange.since} → ${dateRange.until}`
    : PRESETS.find(p=>p.v===datePreset)?.l || 'Últimos 30 días';

  const pageTitle = PAGE_TITLES[location.pathname] || 'AMIK MediaAgent';

  return (
    <div style={{ display:'flex', height:'100vh', overflow:'hidden' }}>

      {/* ── Sidebar ── */}
      <aside style={{
        width:220, flexShrink:0,
        background:'#1A1A2E',
        borderRight:'1px solid rgba(255,255,255,0.07)',
        display:'flex', flexDirection:'column',
        overflowY:'auto',
      }}>
        {/* Logo */}
        <div style={{ padding:'20px 20px 16px', borderBottom:'1px solid rgba(255,255,255,0.07)' }}>
          <div style={{ fontFamily:'var(--font-tight)', fontWeight:900, fontSize:15, letterSpacing:3, color:'var(--gold)', textTransform:'uppercase' }}>AMIK</div>
          <div style={{ fontSize:9, fontWeight:600, letterSpacing:2.5, color:'rgba(255,255,255,0.4)', textTransform:'uppercase', marginTop:2 }}>Media Agent</div>
        </div>

        {/* Client selector — usa AppContext directamente */}
        <div style={{ padding:'12px', borderBottom:'1px solid rgba(255,255,255,0.07)' }}>
          <div style={{ fontSize:9.5, fontWeight:700, letterSpacing:1.5, textTransform:'uppercase', color:'rgba(255,255,255,0.4)', marginBottom:8, paddingLeft:4 }}>
            Cliente activo
          </div>
          <select
            value={activeClient?.id || ''}
            onChange={e => setActiveClient(e.target.value)}
            style={{
              width:'100%', background:'rgba(255,255,255,0.07)',
              border:'1px solid rgba(255,255,255,0.12)', color:'#fff',
              fontSize:12, fontWeight:600, borderRadius:6, padding:'6px 10px',
              fontFamily:'var(--font)',
            }}
          >
            {(clients||[]).map(c => (
              <option key={c.id} value={c.id} style={{ background:'#1A1A2E' }}>
                {c.name}
              </option>
            ))}
          </select>
          {/* Show account IDs for debugging */}
          {activeClient?.metaAccountId && (
            <div style={{ fontSize:9, color:'rgba(255,255,255,0.3)', marginTop:4, paddingLeft:2 }}>
              Meta: {activeClient.metaAccountId.slice(0,15)}...
            </div>
          )}
        </div>

        {/* Nav */}
        {NAV.map(section => (
          <div key={section.label} style={{ padding:'12px 12px 4px' }}>
            <div style={{ fontSize:9.5, fontWeight:700, letterSpacing:1.5, textTransform:'uppercase', color:'rgba(255,255,255,0.35)', padding:'0 8px', marginBottom:4 }}>
              {section.label}
            </div>
            {section.items.map(item => (
              <NavLink key={item.path} to={item.path}
                style={({ isActive }) => ({
                  display:'flex', alignItems:'center', gap:10,
                  padding:'8px 10px', borderRadius:6,
                  fontSize:13, fontWeight: isActive ? 600 : 500,
                  color: isActive ? 'var(--gold)' : 'rgba(255,255,255,0.55)',
                  textDecoration:'none', marginBottom:1,
                  background: isActive ? 'rgba(220,161,69,0.15)' : 'transparent',
                  transition:'all 0.15s',
                })}
              >
                <span style={{ fontSize:15, width:20, textAlign:'center', flexShrink:0 }}>{item.icon}</span>
                <span>{item.label}</span>
              </NavLink>
            ))}
          </div>
        ))}

        {/* Bottom */}
        <div style={{ marginTop:'auto', padding:'12px', borderTop:'1px solid rgba(255,255,255,0.07)' }}>
          <div style={{ display:'flex', alignItems:'center', gap:7 }}>
            <span className="live-dot"/>
            <span style={{ fontSize:10.5, fontWeight:600, color:'rgba(255,255,255,0.7)', letterSpacing:0.5 }}>
              Conectado · LIVE
            </span>
          </div>
          <div style={{ fontSize:10, color:'rgba(255,255,255,0.3)', marginTop:5 }}>AMIK MediaAgent v1.1</div>
        </div>
      </aside>

      {/* ── Main ── */}
      <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden', background:'var(--bg)' }}>

        {/* Topbar */}
        <div style={{
          height:52, background:'var(--bg2)', borderBottom:'1px solid var(--border)',
          display:'flex', alignItems:'center', padding:'0 24px', gap:12,
          flexShrink:0, boxShadow:'var(--shadow-xs)',
        }}>
          <div style={{ fontFamily:'var(--font-tight)', fontWeight:700, fontSize:15, color:'var(--text)' }}>
            {pageTitle}
          </div>

          <div style={{ marginLeft:'auto', display:'flex', alignItems:'center', gap:8 }}>

            {/* ── Date picker ── */}
            <div ref={dateRef} style={{ position:'relative' }}>
              <button
                onClick={() => setShowDate(v=>!v)}
                style={{
                  display:'flex', alignItems:'center', gap:6,
                  padding:'6px 12px', fontSize:12, fontWeight:600,
                  border:`1px solid ${showDate?'var(--gold)':'var(--border)'}`,
                  borderRadius:6, cursor:'pointer',
                  background: showDate ? 'var(--gold-dim)' : 'var(--bg2)',
                  color: showDate ? 'var(--gold-dark)' : 'var(--text2)',
                  transition:'all .15s',
                }}
              >
                <span>📅</span>
                <span>{dateLabel}</span>
                <span style={{ fontSize:9, opacity:.5 }}>▼</span>
              </button>

              {showDate && (
                <div style={{
                  position:'absolute', top:'calc(100% + 6px)', right:0, zIndex:999,
                  background:'var(--bg2)', border:'1px solid var(--border)',
                  borderRadius:10, boxShadow:'var(--shadow-lg)', minWidth:240,
                  overflow:'hidden',
                }}>
                  {/* Preset list */}
                  <div style={{ padding:'6px 0', borderBottom:'1px solid var(--border)' }}>
                    {PRESETS.map(p=>(
                      <button key={p.v}
                        onClick={()=>{ setDatePreset(p.v); setShowDate(false); }}
                        style={{
                          display:'block', width:'100%', textAlign:'left',
                          padding:'8px 16px', fontSize:13,
                          fontWeight: datePreset===p.v&&dateMode==='preset' ? 600 : 400,
                          background: datePreset===p.v&&dateMode==='preset' ? 'var(--gold-dim)' : 'transparent',
                          color: datePreset===p.v&&dateMode==='preset' ? 'var(--gold-dark)' : 'var(--text2)',
                          border:'none', cursor:'pointer',
                        }}
                        onMouseEnter={e=>{ if(!(datePreset===p.v&&dateMode==='preset')) e.currentTarget.style.background='var(--bg3)'; }}
                        onMouseLeave={e=>{ e.currentTarget.style.background=datePreset===p.v&&dateMode==='preset'?'var(--gold-dim)':'transparent'; }}
                      >
                        {datePreset===p.v&&dateMode==='preset'&&'✓ '}{p.l}
                      </button>
                    ))}
                  </div>

                  {/* Custom range */}
                  <div style={{ padding:'14px 16px' }}>
                    <div style={{ fontSize:11, fontWeight:700, color:'var(--text3)', marginBottom:10, textTransform:'uppercase', letterSpacing:1 }}>
                      Rango personalizado
                    </div>
                    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:10 }}>
                      <div>
                        <div style={{ fontSize:11, color:'var(--text3)', marginBottom:4, fontWeight:500 }}>Desde</div>
                        <input type="date" value={customSince}
                          onChange={e=>setCustomSince(e.target.value)}
                          style={{ fontSize:12, padding:'6px 8px' }}/>
                      </div>
                      <div>
                        <div style={{ fontSize:11, color:'var(--text3)', marginBottom:4, fontWeight:500 }}>Hasta</div>
                        <input type="date" value={customUntil}
                          onChange={e=>setCustomUntil(e.target.value)}
                          style={{ fontSize:12, padding:'6px 8px' }}/>
                      </div>
                    </div>
                    <button
                      className="btn btn-primary"
                      style={{ width:'100%', justifyContent:'center' }}
                      onClick={()=>{
                        if(customSince && customUntil) {
                          applyDateRange(customSince, customUntil);
                          setShowDate(false);
                        }
                      }}
                    >
                      Aplicar rango
                    </button>
                    {dateMode==='range' && (
                      <button
                        className="btn btn-ghost"
                        style={{ width:'100%', justifyContent:'center', marginTop:6, fontSize:11 }}
                        onClick={()=>{ setDatePreset('last_30d'); setShowDate(false); }}
                      >
                        Limpiar — volver a Últimos 30 días
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Active period pill */}
            {dateMode==='range' && (
              <span style={{
                fontSize:11, fontWeight:600, color:'var(--gold-dark)',
                background:'var(--gold-dim)', border:'1px solid var(--gold-border)',
                padding:'4px 10px', borderRadius:20,
              }}>
                📅 Rango personalizado activo
              </span>
            )}

          </div>
        </div>

        {/* Page */}
        <div style={{ flex:1, overflow:'hidden', display:'flex', flexDirection:'column' }}>
          <Outlet/>
        </div>
      </div>
    </div>
  );
}
