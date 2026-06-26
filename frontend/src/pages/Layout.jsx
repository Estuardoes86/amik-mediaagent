import React, { useState, useRef, useEffect } from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { useApp } from '../context/AppContext.jsx';

const TABS = [
  { path:'/dashboard',  label:'Dashboard'   },
  { path:'/inbox',      label:'Inbox'       },
  { path:'/meta',       label:'Meta Ads'    },
  { path:'/google',     label:'Google Ads'  },
  { path:'/hubspot',    label:'HubSpot'     },
  { path:'/campaigns',  label:'Campañas'    },
  { path:'/metrics',    label:'Métricas'    },
  { path:'/audit',      label:'Audit'       },
  { path:'/ai',         label:'IA Copiloto' },
  { path:'/reports',    label:'Reportes'    },
  { path:'/settings',   label:'Config'      },
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
          dateRange, applyDateRange } = useApp();

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [customSince,    setCustomSince]    = useState(dateRange.since);
  const [customUntil,    setCustomUntil]    = useState(dateRange.until);
  const [selectedPreset, setSelectedPreset] = useState('last_30d');
  const pickerRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target))
        setShowDatePicker(false);
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

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100vh', overflow:'hidden', background:'#F8F9FA', fontFamily:"'Inter', system-ui, sans-serif" }}>

      <header style={{
        display:'flex', alignItems:'center', height:56,
        background:'#FFFFFF', borderBottom:'1px solid #E5E7EB',
        flexShrink:0, zIndex:100, boxShadow:'0 1px 3px rgba(0,0,0,0.06)',
      }}>

        <div style={{
          display:'flex', alignItems:'center', gap:8,
          padding:'0 20px', borderRight:'1px solid #F3F4F6',
          height:'100%', flexShrink:0,
        }}>
          <div style={{
            width:28, height:28, borderRadius:7,
            background:'linear-gradient(135deg,#DCA145,#B8832E)',
            display:'flex', alignItems:'center', justifyContent:'center',
            fontSize:13, fontWeight:900, color:'#fff',
          }}>A</div>
          <div>
            <div style={{ fontSize:12, fontWeight:800, letterSpacing:'1.5px', color:'#111827', textTransform:'uppercase', lineHeight:1.1 }}>AMIK</div>
            <div style={{ fontSize:8, fontWeight:600, letterSpacing:'2px', color:'#9CA3AF', textTransform:'uppercase', lineHeight:1.2 }}>MEDIA AGENT</div>
          </div>
        </div>

        <nav style={{ display:'flex', alignItems:'center', height:'100%', flex:1, overflowX:'auto', padding:'0 8px', gap:2 }}>
          {TABS.map(tab => (
            <NavLink key={tab.path} to={tab.path}
              style={({ isActive }) => ({
                display:'flex', alignItems:'center',
                padding:'5px 11px', borderRadius:6,
                fontSize:12, fontWeight: isActive ? 600 : 500,
                color: isActive ? '#DCA145' : '#6B7280',
                background: isActive ? 'rgba(220,161,69,0.08)' : 'transparent',
                border: isActive ? '1px solid rgba(220,161,69,0.2)' : '1px solid transparent',
                textDecoration:'none', whiteSpace:'nowrap', transition:'all 0.12s',
              })}
            >{tab.label}</NavLink>
          ))}
        </nav>

        <div style={{ display:'flex', alignItems:'center', gap:8, padding:'0 16px', borderLeft:'1px solid #F3F4F6', flexShrink:0 }}>

          <div style={{ display:'flex', gap:4 }}>
            {clients.map(c => (
              <button key={c.id} onClick={() => setActiveClient(c.id)}
                style={{
                  display:'flex', alignItems:'center', gap:5,
                  padding:'4px 10px', borderRadius:20,
                  fontSize:11, fontWeight:600,
                  border: activeClient.id === c.id ? `1.5px solid ${c.color}` : '1.5px solid #E5E7EB',
                  background: activeClient.id === c.id ? `${c.color}14` : '#fff',
                  color: activeClient.id === c.id ? c.color : '#6B7280',
                  cursor:'pointer', transition:'all 0.12s',
                }}
              >
                <span style={{ width:6, height:6, borderRadius:'50%', background: activeClient.id === c.id ? c.color : '#D1D5DB', flexShrink:0 }}/>
                {c.name}
              </button>
            ))}
          </div>

          <div ref={pickerRef} style={{ position:'relative' }}>
            <button onClick={() => setShowDatePicker(v => !v)}
              style={{
                display:'flex', alignItems:'center', gap:6,
                padding:'5px 12px', borderRadius:7,
                background: showDatePicker ? 'rgba(220,161,69,0.08)' : '#F9FAFB',
                border: `1px solid ${showDatePicker ? 'rgba(220,161,69,0.35)' : '#E5E7EB'}`,
                color: showDatePicker ? '#DCA145' : '#374151',
                fontSize:12, fontWeight:500, cursor:'pointer', transition:'all 0.12s', whiteSpace:'nowrap',
              }}
            >
              📅 {displayLabel()} <span style={{ fontSize:9, opacity:0.5 }}>▼</span>
            </button>

            {showDatePicker && (
              <div style={{
                position:'absolute', top:'calc(100% + 8px)', right:0, zIndex:999,
                background:'#fff', border:'1px solid #E5E7EB',
                borderRadius:10, boxShadow:'0 8px 32px rgba(0,0,0,0.12)', minWidth:240, overflow:'hidden',
              }}>
                <div style={{ padding:'6px 0' }}>
                  {PRESETS.filter(p => p.value !== 'custom').map(p => (
                    <button key={p.value} onClick={() => handlePresetClick(p.value)}
                      style={{
                        display:'block', width:'100%', textAlign:'left', padding:'8px 16px',
                        background: selectedPreset === p.value ? 'rgba(220,161,69,0.07)' : 'transparent',
                        border:'none', color: selectedPreset === p.value ? '#DCA145' : '#374151',
                        fontSize:13, fontWeight: selectedPreset === p.value ? 600 : 400, cursor:'pointer',
                      }}
                    >
                      {selectedPreset === p.value && <span style={{ marginRight:8, fontSize:10 }}>✓</span>}
                      {p.label}
                    </button>
                  ))}
                </div>
                <div style={{ borderTop:'1px solid #F3F4F6', padding:'12px 14px 14px' }}>
                  <div style={{ fontSize:10, fontWeight:700, letterSpacing:'1.5px', textTransform:'uppercase', color:'#9CA3AF', marginBottom:8 }}>Rango personalizado</div>
                  <div style={{ display:'flex', gap:8, marginBottom:8 }}>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:10, color:'#9CA3AF', marginBottom:4, fontWeight:600 }}>DESDE</div>
                      <input type="date" value={customSince} onChange={e => setCustomSince(e.target.value)}
                        style={{ width:'100%', padding:'5px 8px', fontSize:12, background:'#F9FAFB', border:'1px solid #E5E7EB', color:'#111827', borderRadius:6 }}/>
                    </div>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:10, color:'#9CA3AF', marginBottom:4, fontWeight:600 }}>HASTA</div>
                      <input type="date" value={customUntil} onChange={e => setCustomUntil(e.target.value)}
                        style={{ width:'100%', padding:'5px 8px', fontSize:12, background:'#F9FAFB', border:'1px solid #E5E7EB', color:'#111827', borderRadius:6 }}/>
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

          <div style={{ display:'flex', alignItems:'center', gap:5, padding:'4px 10px', borderRadius:20, background:'#ECFDF5', border:'1px solid #A7F3D0' }}>
            <span className="live-dot"/>
            <span style={{ fontSize:10, fontWeight:700, letterSpacing:'1.5px', color:'#059669', textTransform:'uppercase' }}>LIVE</span>
          </div>
        </div>
      </header>

      <div style={{ flex:1, overflow:'hidden', display:'flex', flexDirection:'column' }}>
        <Outlet />
      </div>
    </div>
  );
}
