import React, { useState, useRef, useEffect } from 'react';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { useApp } from '../context/AppContext.jsx';

/* ══════════════════════════════════════════════
   AMIK MediaAgent — Sidebar Layout v2
   Colapsable con iconos · Selector de cliente · Multi-dominio
══════════════════════════════════════════════ */

const NAV_GROUPS = [
  {
    group: 'Principal',
    items: [
      { path:'/dashboard', label:'Dashboard',    icon:'⊞' },
      { path:'/inbox',     label:'Inbox',        icon:'✉' },
    ]
  },
  {
    group: 'Paid Media',
    items: [
      { path:'/meta',      label:'Meta Ads',     icon:'ƒ' },
      { path:'/google',    label:'Google Ads',   icon:'G' },
      { path:'/campaigns', label:'Campañas',     icon:'◎' },
    ]
  },
  {
    group: 'Orgánico & CRM',
    items: [
      { path:'/social',    label:'Redes Soc.',   icon:'◈' },
      { path:'/hubspot',   label:'HubSpot',      icon:'H' },
    ]
  },
  {
    group: 'Análisis',
    items: [
      { path:'/metrics',   label:'Métricas',     icon:'◉' },
      { path:'/reports',   label:'Reportes',     icon:'≡' },
      { path:'/audit',     label:'Audit',        icon:'✓' },
    ]
  },
  {
    group: 'Tools',
    items: [
      { path:'/ai',        label:'IA Copiloto',  icon:'✦' },
      { path:'/settings',  label:'Config',       icon:'⚙' },
    ]
  },
];

const PRESETS = [
  { value:'today',        label:'Hoy'              },
  { value:'yesterday',    label:'Ayer'             },
  { value:'last_7d',      label:'Últimos 7 días'   },
  { value:'last_14d',     label:'Últimos 14 días'  },
  { value:'last_30d',     label:'Últimos 30 días'  },
  { value:'last_60d',     label:'Últimos 60 días'  },
  { value:'this_month',   label:'Este mes'         },
  { value:'last_month',   label:'Mes anterior'     },
  { value:'last_quarter', label:'Último trimestre' },
  { value:'custom',       label:'Personalizado'    },
];

export default function Layout() {
  const { activeClient, clients, setActiveClient,
          dateMode, datePreset, setDatePreset,
          dateRange, applyDateRange, user, onLogout } = useApp();

  const [collapsed,      setCollapsed]      = useState(false);
  const [showClients,    setShowClients]    = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [customSince,    setCustomSince]    = useState(dateRange.since);
  const [customUntil,    setCustomUntil]    = useState(dateRange.until);
  const [selectedPreset, setSelectedPreset] = useState('last_30d');
  const location = useLocation();
  const dateRef   = useRef(null);
  const clientRef = useRef(null);

  const SIDEBAR_W  = collapsed ? 56 : 220;

  useEffect(() => {
    const handler = (e) => {
      if (dateRef.current   && !dateRef.current.contains(e.target))   setShowDatePicker(false);
      if (clientRef.current && !clientRef.current.contains(e.target)) setShowClients(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handlePresetClick = (preset) => {
    if (preset === 'custom') return;
    setSelectedPreset(preset);
    setDatePreset(preset);
    setShowDatePicker(false);
  };

  const handleApplyCustom = () => {
    if (!customSince || !customUntil) return;
    applyDateRange(customSince, customUntil);
    setSelectedPreset('custom');
    setShowDatePicker(false);
  };

  const displayLabel = () => {
    if (dateMode === 'range') return `${dateRange.since} → ${dateRange.until}`;
    return PRESETS.find(p => p.value === datePreset)?.label || 'Últimos 30 días';
  };

  // Página activa para el header
  const activeItem = NAV_GROUPS.flatMap(g => g.items).find(i => location.pathname.startsWith(i.path));

  return (
    <div style={{ display:'flex', height:'100vh', overflow:'hidden', background:'var(--bg)', fontFamily:'var(--font)' }}>

      {/* ════════════════ SIDEBAR ════════════════ */}
      <aside style={{
        width: SIDEBAR_W,
        flexShrink: 0,
        background: 'var(--sidebar)',
        display: 'flex',
        flexDirection: 'column',
        transition: 'width 0.2s ease',
        overflow: 'hidden',
        borderRight: '1px solid var(--sidebar-border)',
        zIndex: 200,
      }}>

        {/* Logo + collapse */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: collapsed ? '16px 0' : '16px 16px',
          height: 64, flexShrink: 0,
          borderBottom: '1px solid var(--sidebar-border)',
          justifyContent: collapsed ? 'center' : 'space-between',
        }}>
          {!collapsed && (
            <div style={{ display:'flex', alignItems:'center', gap:10 }}>
              <div style={{
                width:32, height:32, borderRadius:8,
                background:'linear-gradient(135deg,#DCA145,#B8832E)',
                display:'flex', alignItems:'center', justifyContent:'center',
                fontSize:15, fontWeight:900, color:'#fff', flexShrink:0,
              }}>A</div>
              <div>
                <div style={{ fontSize:12, fontWeight:800, letterSpacing:'1.5px', color:'#fff', textTransform:'uppercase', lineHeight:1.1 }}>AMIK</div>
                <div style={{ fontSize:8, fontWeight:600, letterSpacing:'2px', color:'rgba(255,255,255,0.4)', textTransform:'uppercase' }}>MEDIA AGENT</div>
              </div>
            </div>
          )}
          {collapsed && (
            <div style={{
              width:32, height:32, borderRadius:8,
              background:'linear-gradient(135deg,#DCA145,#B8832E)',
              display:'flex', alignItems:'center', justifyContent:'center',
              fontSize:15, fontWeight:900, color:'#fff',
            }}>A</div>
          )}
          {!collapsed && (
            <button onClick={() => setCollapsed(true)}
              style={{ background:'none', border:'none', cursor:'pointer', color:'rgba(255,255,255,0.4)', fontSize:16, padding:4, borderRadius:4, lineHeight:1 }}
              title="Colapsar">‹</button>
          )}
        </div>

        {/* Selector de cliente */}
        <div ref={clientRef} style={{ padding: collapsed ? '12px 8px' : '12px 12px', borderBottom:'1px solid var(--sidebar-border)', position:'relative' }}>
          <button onClick={() => setShowClients(v => !v)}
            style={{
              width:'100%', display:'flex', alignItems:'center', gap:8,
              padding: collapsed ? '8px 0' : '8px 10px',
              background:'rgba(255,255,255,0.07)', borderRadius:8,
              border:'1px solid rgba(255,255,255,0.1)',
              cursor:'pointer', transition:'all 0.12s',
              justifyContent: collapsed ? 'center' : 'space-between',
            }}
            title={collapsed ? activeClient?.name : undefined}
          >
            <div style={{ display:'flex', alignItems:'center', gap:8, minWidth:0 }}>
              <span style={{
                width:8, height:8, borderRadius:'50%',
                background: activeClient?.color || '#DCA145', flexShrink:0,
              }}/>
              {!collapsed && (
                <span style={{ fontSize:12, fontWeight:600, color:'rgba(255,255,255,0.9)', truncate:true, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                  {activeClient?.name || 'Cliente'}
                </span>
              )}
            </div>
            {!collapsed && <span style={{ fontSize:10, color:'rgba(255,255,255,0.4)', flexShrink:0 }}>▾</span>}
          </button>

          {showClients && (
            <div style={{
              position:'absolute', top:'calc(100% + 4px)',
              left: collapsed ? 64 : 12, right: collapsed ? 'auto' : 12,
              minWidth: collapsed ? 200 : 'auto',
              background:'#fff', borderRadius:10,
              boxShadow:'0 8px 32px rgba(0,0,0,0.18)',
              border:'1px solid var(--border)', zIndex:999, overflow:'hidden',
            }}>
              <div style={{ padding:'6px 0' }}>
                <div style={{ padding:'6px 14px 4px', fontSize:10, fontWeight:700, letterSpacing:'1.5px', color:'var(--text4)', textTransform:'uppercase' }}>
                  Clientes
                </div>
                {clients.map(c => (
                  <button key={c.id} onClick={() => { setActiveClient(c.id); setShowClients(false); }}
                    style={{
                      display:'flex', alignItems:'center', gap:10, width:'100%',
                      padding:'8px 14px', background: activeClient?.id === c.id ? `${c.color}12` : 'transparent',
                      border:'none', cursor:'pointer', textAlign:'left',
                    }}
                  >
                    <span style={{ width:8, height:8, borderRadius:'50%', background:c.color, flexShrink:0 }}/>
                    <div>
                      <div style={{ fontSize:13, fontWeight:600, color:'var(--text)' }}>{c.name}</div>
                      <div style={{ fontSize:10, color:'var(--text4)' }}>{c.fullName}</div>
                    </div>
                    {activeClient?.id === c.id && <span style={{ marginLeft:'auto', color:c.color, fontSize:12 }}>✓</span>}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Nav groups */}
        <nav style={{ flex:1, overflowY:'auto', padding: collapsed ? '8px 0' : '8px 0', overflowX:'hidden' }}>
          {NAV_GROUPS.map(group => (
            <div key={group.group} style={{ marginBottom: collapsed ? 0 : 4 }}>
              {!collapsed && (
                <div style={{
                  padding:'8px 16px 4px',
                  fontSize:9, fontWeight:700, letterSpacing:'1.5px',
                  color:'rgba(255,255,255,0.28)', textTransform:'uppercase',
                }}>
                  {group.group}
                </div>
              )}
              {group.items.map(item => (
                <NavLink key={item.path} to={item.path}
                  title={collapsed ? item.label : undefined}
                  style={({ isActive }) => ({
                    display:'flex', alignItems:'center',
                    gap: collapsed ? 0 : 10,
                    padding: collapsed ? '10px 0' : '8px 16px',
                    justifyContent: collapsed ? 'center' : 'flex-start',
                    margin: collapsed ? '1px 6px' : '1px 8px',
                    borderRadius: 8,
                    fontSize: 13, fontWeight: isActive ? 600 : 400,
                    color: isActive ? '#fff' : 'rgba(255,255,255,0.55)',
                    background: isActive ? 'rgba(220,161,69,0.18)' : 'transparent',
                    borderLeft: isActive && !collapsed ? '2px solid #DCA145' : '2px solid transparent',
                    textDecoration:'none', transition:'all 0.1s',
                    paddingLeft: !collapsed && isActive ? 14 : (!collapsed ? 16 : undefined),
                  })}
                >
                  <span style={{ fontSize:15, lineHeight:1, flexShrink:0, fontFamily:'system-ui' }}>{item.icon}</span>
                  {!collapsed && <span>{item.label}</span>}
                </NavLink>
              ))}
              {!collapsed && <div style={{ height:1, background:'var(--sidebar-border)', margin:'6px 16px' }}/>}
            </div>
          ))}
        </nav>

        {/* Usuario + expand */}
        <div style={{
          borderTop:'1px solid var(--sidebar-border)',
          padding: collapsed ? '12px 0' : '12px 14px',
          flexShrink:0,
        }}>
          {collapsed ? (
            <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:8 }}>
              <button onClick={() => setCollapsed(false)}
                style={{ background:'none', border:'none', cursor:'pointer', color:'rgba(255,255,255,0.4)', fontSize:16, padding:4 }}
                title="Expandir">›</button>
              <button onClick={onLogout}
                style={{ background:'none', border:'none', cursor:'pointer', color:'rgba(255,255,255,0.35)', fontSize:13, padding:4 }}
                title="Salir">⎋</button>
            </div>
          ) : (
            <div style={{ display:'flex', alignItems:'center', gap:10 }}>
              <div style={{
                width:30, height:30, borderRadius:'50%',
                background:'linear-gradient(135deg,#DCA145,#B8832E)',
                display:'flex', alignItems:'center', justifyContent:'center',
                fontSize:12, fontWeight:700, color:'#fff', flexShrink:0,
              }}>
                {(user?.name || user?.email || 'U')[0].toUpperCase()}
              </div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:12, fontWeight:600, color:'rgba(255,255,255,0.85)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                  {user?.name || user?.email?.split('@')[0] || 'Usuario'}
                </div>
                <div style={{ fontSize:10, color:'rgba(255,255,255,0.35)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                  {user?.email || ''}
                </div>
              </div>
              <button onClick={onLogout}
                style={{ background:'none', border:'none', cursor:'pointer', color:'rgba(255,255,255,0.35)', fontSize:13, padding:4, flexShrink:0 }}
                title="Cerrar sesión">⎋</button>
            </div>
          )}
        </div>
      </aside>

      {/* ════════════════ MAIN ════════════════ */}
      <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden', minWidth:0 }}>

        {/* Topbar */}
        <header style={{
          height:56, flexShrink:0,
          background:'#fff', borderBottom:'1px solid var(--border)',
          display:'flex', alignItems:'center', justifyContent:'space-between',
          padding:'0 20px', boxShadow:'var(--shadow-xs)', zIndex:100,
        }}>
          {/* Breadcrumb / página activa */}
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <span style={{ fontSize:18, lineHeight:1 }}>{activeItem?.icon}</span>
            <span style={{ fontSize:15, fontWeight:700, color:'var(--text)' }}>{activeItem?.label || 'Dashboard'}</span>
            <span style={{ fontSize:12, color:'var(--text4)', marginLeft:4 }}>·</span>
            <span style={{ fontSize:12, color:'var(--text4)' }}>{activeClient?.fullName || activeClient?.name}</span>
          </div>

          {/* Right: date + live */}
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>

            {/* Date picker */}
            <div ref={dateRef} style={{ position:'relative' }}>
              <button onClick={() => setShowDatePicker(v => !v)}
                style={{
                  display:'flex', alignItems:'center', gap:6, padding:'6px 12px',
                  borderRadius:8, fontSize:12, fontWeight:500, cursor:'pointer',
                  background: showDatePicker ? 'var(--gold-dim)' : 'var(--bg3)',
                  border:`1px solid ${showDatePicker ? 'var(--gold-border)' : 'var(--border)'}`,
                  color: showDatePicker ? 'var(--gold)' : 'var(--text2)',
                  transition:'all 0.12s', whiteSpace:'nowrap',
                }}
              >
                📅 {displayLabel()} <span style={{ fontSize:9, opacity:0.5 }}>▼</span>
              </button>

              {showDatePicker && (
                <div style={{
                  position:'absolute', top:'calc(100% + 8px)', right:0, zIndex:999,
                  background:'#fff', border:'1px solid var(--border)',
                  borderRadius:12, boxShadow:'var(--shadow-md)', minWidth:220, overflow:'hidden',
                }}>
                  <div style={{ padding:'6px 0' }}>
                    {PRESETS.filter(p => p.value !== 'custom').map(p => (
                      <button key={p.value} onClick={() => handlePresetClick(p.value)}
                        style={{
                          display:'block', width:'100%', textAlign:'left', padding:'8px 16px',
                          background: selectedPreset === p.value ? 'var(--gold-dim)' : 'transparent',
                          border:'none', color: selectedPreset === p.value ? 'var(--gold)' : 'var(--text2)',
                          fontSize:13, fontWeight: selectedPreset === p.value ? 600 : 400, cursor:'pointer',
                        }}
                      >
                        {selectedPreset === p.value && <span style={{ marginRight:8, fontSize:10 }}>✓</span>}
                        {p.label}
                      </button>
                    ))}
                  </div>
                  <div style={{ borderTop:'1px solid var(--border)', padding:'12px 14px 14px' }}>
                    <div style={{ fontSize:10, fontWeight:700, letterSpacing:'1.5px', textTransform:'uppercase', color:'var(--text4)', marginBottom:8 }}>Rango personalizado</div>
                    <div style={{ display:'flex', gap:8, marginBottom:8 }}>
                      <div style={{ flex:1 }}>
                        <div style={{ fontSize:10, color:'var(--text4)', marginBottom:4, fontWeight:600 }}>DESDE</div>
                        <input type="date" value={customSince} onChange={e => setCustomSince(e.target.value)}
                          style={{ width:'100%', padding:'5px 8px', fontSize:12, background:'var(--bg3)', border:'1px solid var(--border)', color:'var(--text)', borderRadius:6 }}/>
                      </div>
                      <div style={{ flex:1 }}>
                        <div style={{ fontSize:10, color:'var(--text4)', marginBottom:4, fontWeight:600 }}>HASTA</div>
                        <input type="date" value={customUntil} onChange={e => setCustomUntil(e.target.value)}
                          style={{ width:'100%', padding:'5px 8px', fontSize:12, background:'var(--bg3)', border:'1px solid var(--border)', color:'var(--text)', borderRadius:6 }}/>
                      </div>
                    </div>
                    <button onClick={handleApplyCustom}
                      style={{
                        width:'100%', padding:'7px', borderRadius:6,
                        background:'linear-gradient(135deg,#DCA145,#B8832E)', border:'none', color:'#fff',
                        fontSize:11, fontWeight:700, letterSpacing:'1px', textTransform:'uppercase', cursor:'pointer',
                      }}
                    >Aplicar rango</button>
                  </div>
                </div>
              )}
            </div>

            {/* LIVE badge */}
            <div style={{ display:'flex', alignItems:'center', gap:5, padding:'4px 10px', borderRadius:20, background:'#ECFDF5', border:'1px solid #A7F3D0' }}>
              <span className="live-dot"/>
              <span style={{ fontSize:10, fontWeight:700, letterSpacing:'1.5px', color:'#059669', textTransform:'uppercase' }}>LIVE</span>
            </div>
          </div>
        </header>

        {/* Page content */}
        <div style={{ flex:1, overflow:'hidden', display:'flex', flexDirection:'column' }}>
          <Outlet />
        </div>
      </div>
    </div>
  );
}
