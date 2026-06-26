import React, { useState, useRef, useEffect } from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { useApp } from '../context/AppContext.jsx';

const TABS = [
  { path:'/inbox',     label:'INBOX'      },
  { path:'/metrics',   label:'MÉTRICAS'   },
  { path:'/campaigns', label:'CAMPAÑAS'   },
  { path:'/audit',     label:'AUDIT'      },
  { path:'/ai',        label:'IA COPILOTO'},
  { path:'/hubspot',   label:'HUBSPOT CRM' },
  { path:'/reports',   label:'REPORTES'   },
  { path:'/settings',  label:'CONFIG'     },
];

const PRESETS = [
  { value:'today',       label:'Hoy'         },
  { value:'yesterday',   label:'Ayer'        },
  { value:'last_7d',     label:'Últ. 7 días' },
  { value:'last_14d',    label:'Últ. 14 días'},
  { value:'last_30d',    label:'Últ. 30 días'},
  { value:'last_60d',    label:'Últ. 60 días'},
  { value:'this_month',  label:'Este mes'    },
  { value:'last_month',  label:'Mes anterior'},
  { value:'last_quarter',label:'Último trimestre'},
  { value:'custom',      label:'Personalizado'},
];

export default function Layout() {
  const { activeClient, clients, setActiveClient,
          dateMode, datePreset, setDatePreset,
          dateRange = {since:'', until:''}, applyDateRange = ()=>{} } = useApp();

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [customSince,    setCustomSince]    = useState(dateRange.since);
  const [customUntil,    setCustomUntil]    = useState(dateRange.until);
  const [selectedPreset, setSelectedPreset] = useState('last_30d');
  const pickerRef = useRef(null);

  // Close picker on outside click
  useEffect(() => {
    const handler = (e) => { if (pickerRef.current && !pickerRef.current.contains(e.target)) setShowDatePicker(false); };
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
    return PRESETS.find(p => p.value === datePreset)?.label || 'Últ. 30 días';
  };

  const navStyle = {
    display:'flex', alignItems:'center', height:52,
    borderBottom:'1px solid rgba(255,255,255,.07)',
    background:'linear-gradient(180deg,#1C1C25 0%,#14141B 100%)',
    flexShrink:0, overflowX:'auto', position:'relative', zIndex:100,
  };

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100vh', overflow:'hidden' }}>
      <nav style={navStyle}>

        {/* Logo */}
        <div style={{ padding:'0 22px', height:'100%', display:'flex', alignItems:'center', gap:10, borderRight:'1px solid rgba(255,255,255,.07)', flexShrink:0 }}>
          <span style={{ fontFamily:'var(--font-cond)', fontWeight:900, fontSize:15, letterSpacing:'3px', color:'#DCA145', textTransform:'uppercase' }}>AMIK</span>
          <div style={{ width:1, height:16, background:'rgba(255,255,255,.12)' }}/>
          <span style={{ fontFamily:'var(--font-semi)', fontWeight:600, fontSize:8.5, letterSpacing:'2.5px', color:'#5C6470', textTransform:'uppercase' }}>MEDIA AGENT</span>
        </div>

        {/* Tabs */}
        <div style={{ display:'flex', height:'100%', flex:1, overflowX:'auto' }}>
          {TABS.map(tab => (
            <NavLink key={tab.path} to={tab.path}
              className={({ isActive }) => `nav-tab${isActive ? ' active' : ''}`}>
              {tab.label}
            </NavLink>
          ))}
        </div>

        {/* Right controls */}
        <div style={{ display:'flex', alignItems:'center', gap:8, padding:'0 16px', borderLeft:'1px solid rgba(255,255,255,.07)', flexShrink:0, position:'relative' }}>

          {/* Date picker trigger */}
          <div ref={pickerRef} style={{ position:'relative' }}>
            <button
              onClick={() => setShowDatePicker(v => !v)}
              style={{
                display:'flex', alignItems:'center', gap:7,
                background: showDatePicker ? 'rgba(220,161,69,.12)' : 'rgba(255,255,255,.04)',
                border:`1px solid ${showDatePicker ? 'rgba(220,161,69,.4)' : 'rgba(255,255,255,.1)'}`,
                color: showDatePicker ? '#DCA145' : '#9CA3AA',
                padding:'5px 13px', borderRadius:6, cursor:'pointer',
                fontFamily:'var(--font-semi)', fontSize:10.5, fontWeight:700,
                letterSpacing:.8, whiteSpace:'nowrap', transition:'all .15s',
              }}
            >
              <span style={{ fontSize:11 }}>📅</span>
              {displayLabel()}
              <span style={{ fontSize:8, opacity:.6 }}>▼</span>
            </button>

            {/* Dropdown */}
            {showDatePicker && (
              <div style={{
                position:'absolute', top:'calc(100% + 8px)', right:0, zIndex:999,
                background:'#1C1C25', border:'1px solid rgba(220,161,69,.25)',
                borderRadius:10, boxShadow:'0 16px 48px rgba(0,0,0,.7)',
                minWidth:260, overflow:'hidden',
              }}>
                {/* Presets */}
                <div style={{ padding:'8px 0' }}>
                  {PRESETS.filter(p => p.value !== 'custom').map(p => (
                    <button key={p.value} onClick={() => handlePresetClick(p.value)}
                      style={{
                        display:'block', width:'100%', textAlign:'left',
                        padding:'9px 18px', background: selectedPreset===p.value ? 'rgba(220,161,69,.12)' : 'transparent',
                        border:'none', color: selectedPreset===p.value ? '#DCA145' : '#9CA3AA',
                        fontFamily:'var(--font-semi)', fontSize:12, fontWeight:600,
                        cursor:'pointer', transition:'all .12s', letterSpacing:.3,
                      }}
                      onMouseEnter={e => { e.currentTarget.style.background='rgba(255,255,255,.05)'; e.currentTarget.style.color='#F0EDE8'; }}
                      onMouseLeave={e => { e.currentTarget.style.background=selectedPreset===p.value?'rgba(220,161,69,.12)':'transparent'; e.currentTarget.style.color=selectedPreset===p.value?'#DCA145':'#9CA3AA'; }}
                    >
                      {selectedPreset === p.value && <span style={{ marginRight:8 }}>✓</span>}{p.label}
                    </button>
                  ))}
                </div>

                {/* Custom range */}
                <div style={{ borderTop:'1px solid rgba(255,255,255,.07)', padding:'14px 16px 16px' }}>
                  <div style={{ fontFamily:'var(--font-semi)', fontSize:9.5, fontWeight:700, letterSpacing:2, textTransform:'uppercase', color:'#5C6470', marginBottom:10 }}>
                    Rango personalizado
                  </div>
                  <div style={{ display:'flex', gap:8, marginBottom:10 }}>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:10, color:'#5C6470', marginBottom:4, fontFamily:'var(--font-semi)', fontWeight:600 }}>DESDE</div>
                      <input type="date" value={customSince} onChange={e => setCustomSince(e.target.value)}
                        style={{ width:'100%', padding:'6px 8px', fontSize:12, background:'#262630', border:'1px solid rgba(255,255,255,.1)', color:'#F0EDE8', borderRadius:6 }}/>
                    </div>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:10, color:'#5C6470', marginBottom:4, fontFamily:'var(--font-semi)', fontWeight:600 }}>HASTA</div>
                      <input type="date" value={customUntil} onChange={e => setCustomUntil(e.target.value)}
                        style={{ width:'100%', padding:'6px 8px', fontSize:12, background:'#262630', border:'1px solid rgba(255,255,255,.1)', color:'#F0EDE8', borderRadius:6 }}/>
                    </div>
                  </div>
                  <button onClick={handleApplyCustom}
                    style={{
                      width:'100%', padding:'8px', background:'linear-gradient(135deg,#DCA145,#B8832E)',
                      border:'none', borderRadius:6, color:'#14141B', fontFamily:'var(--font-semi)',
                      fontSize:11, fontWeight:800, letterSpacing:1.5, textTransform:'uppercase',
                      cursor:'pointer', transition:'opacity .15s',
                    }}
                    onMouseEnter={e=>e.currentTarget.style.opacity='.85'}
                    onMouseLeave={e=>e.currentTarget.style.opacity='1'}
                  >
                    Aplicar rango
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Client selector */}
          <select value={activeClient.id} onChange={e => setActiveClient(e.target.value)}
            style={{
              padding:'5px 10px', fontSize:10.5, fontFamily:'var(--font-semi)', fontWeight:700,
              letterSpacing:.8, textTransform:'uppercase', borderRadius:6, width:'auto',
              color:'#DCA145', borderColor:'rgba(220,161,69,.3)', background:'rgba(220,161,69,.06)',
            }}>
            {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>

          {/* Live dot */}
          <div style={{ display:'flex', alignItems:'center', gap:6, flexShrink:0 }}>
            <span className="pulse-dot"/>
            <span style={{ fontFamily:'var(--font-semi)', fontSize:9, fontWeight:700, letterSpacing:2.5, color:'#2DD4A0', textTransform:'uppercase' }}>LIVE</span>
          </div>
        </div>
      </nav>

      <div style={{ flex:1, overflow:'hidden', display:'flex', flexDirection:'column' }}>
        <Outlet />
      </div>
    </div>
  );
}
