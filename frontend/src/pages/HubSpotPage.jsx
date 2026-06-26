import React, { useState, useEffect, useMemo } from 'react';
import { hubspotApi } from '../lib/api.js';
import { useApp } from '../context/AppContext.jsx';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, AreaChart, Area, CartesianGrid
} from 'recharts';

/* ── Design tokens ─────────────────────────── */
const C = {
  gold:'#DCA145', goldD:'rgba(220,161,69,.12)', goldB:'rgba(220,161,69,.28)',
  green:'#2DD4A0', greenD:'rgba(45,212,160,.10)',
  blue:'#5B8DB8',  blueD:'rgba(91,141,184,.12)',
  red:'#E8445A',   redD:'rgba(232,68,90,.10)',
  purple:'#9061B0',indigo:'#7B68EE',
  carbon:'#262630',slate:'#30373F',slate2:'#3D4550',
  text:'#F0EDE8',  t2:'#9CA3AA', t3:'#5C6470',
};

/* ── Data ──────────────────────────────────── */
const FUNNEL = [
  { key:'interesado',  label:'Interesado',  v:922,  color:C.blue,   icon:'👤' },
  { key:'inscrito',    label:'Inscrito',     v:420,  color:C.indigo, icon:'📝' },
  { key:'ingresante',  label:'Ingresante',   v:235,  color:C.purple, icon:'🎓' },
  { key:'pagante',     label:'Pagante',      v:392,  color:C.gold,   icon:'💳' },
  { key:'perdido',     label:'No Interesado',v:20,   color:C.red,    icon:'❌' },
];

const CARRERAS = [
  { n:'Medicina Humana',        leads:858,  conv:54, conv_pct:6.3  },
  { n:'Enfermería',             leads:704,  conv:49, conv_pct:7.0  },
  { n:'Derecho',                leads:436,  conv:18, conv_pct:4.1  },
  { n:'Contabilidad',           leads:382,  conv:0,  conv_pct:0    },
  { n:'Ingeniería Agroindustrial',leads:174,conv:0,  conv_pct:0    },
  { n:'Ingeniería Civil',       leads:150,  conv:10, conv_pct:6.7  },
  { n:'Estomatología',          leads:112,  conv:5,  conv_pct:4.5  },
  { n:'Adm. de Empresas',       leads:109,  conv:7,  conv_pct:6.4  },
  { n:'Psicología',             leads:0,    conv:24, conv_pct:null },
  { n:'Ing. de Sistemas',       leads:89,   conv:17, conv_pct:19.1 },
  { n:'Ing. de Sistemas (dist)',leads:19,   conv:0,  conv_pct:0    },
  { n:'Derecho (a distancia)',  leads:67,   conv:5,  conv_pct:7.5  },
  { n:'Adm. y Marketing',       leads:42,   conv:8,  conv_pct:19.0 },
  { n:'Adm. y Neg. Internac.',  leads:36,   conv:7,  conv_pct:19.4 },
  { n:'Contabilidad (dist)',    leads:22,   conv:0,  conv_pct:0    },
  { n:'Adm. de Empresas (dist)',leads:36,   conv:7,  conv_pct:19.4 },
  { n:'Ing. en Energías',       leads:18,   conv:0,  conv_pct:0    },
  { n:'Medicina Veterinaria',   leads:549,  conv:6,  conv_pct:1.1  },
];

const TENDENCIA = [
  { s:'23/3',leads:150 },{ s:'30/3',leads:229 },{ s:'6/4',leads:217 },
  { s:'13/4',leads:147 },{ s:'20/4',leads:170 },{ s:'27/4',leads:421 },
  { s:'4/5', leads:493 },{ s:'11/5',leads:585 },{ s:'18/5',leads:577 },
  { s:'25/5',leads:501 },{ s:'1/6', leads:547 },{ s:'8/6', leads:635 },
  { s:'15/6',leads:611 },{ s:'22/6',leads:335 },
];

const ESTADOS = [
  { e:'Sin Gestión',    v:258,  color:C.t3    },
  { e:'En Validación',  v:1932, color:C.gold  },
  { e:'En Calificación',v:179,  color:C.indigo},
  { e:'Calificado',     v:325,  color:C.green },
  { e:'Descalificado',  v:2906, color:C.red   },
  { e:'En Nutrición',   v:17,   color:C.blue  },
];

const ASESORES = [
  { n:'Alessandra Pérez',   asig:165, atend:60,  olvido:4 },
  { n:'Julio Lamadrid',     asig:138, atend:34,  olvido:3 },
  { n:'Lesly Cullampe',     asig:130, atend:0,   olvido:0 },
  { n:'Oscar Silva',        asig:16,  atend:16,  olvido:1 },
  { n:'Leonela Aponte',     asig:13,  atend:14,  olvido:2 },
  { n:'Wilson Cieza',       asig:0,   atend:10,  olvido:8 },
];

/* ── Micro-components ──────────────────────── */
const Tip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background:'#1C1C25', border:`1px solid ${C.goldB}`, borderLeft:`3px solid ${C.gold}`, padding:'10px 16px', borderRadius:8, fontSize:12, boxShadow:'0 8px 32px rgba(0,0,0,.6)' }}>
      <div style={{ color:C.t3, marginBottom:5, fontSize:10, letterSpacing:1, textTransform:'uppercase', fontFamily:'var(--font-semi)', fontWeight:700 }}>{label}</div>
      {payload.map((p,i)=>(
        <div key={i} style={{ color:C.t2, fontFamily:'var(--font-semi)', fontWeight:600, marginBottom:2 }}>
          {p.name}: <span style={{ color:'#fff' }}>{typeof p.value==='number'?p.value.toLocaleString():p.value}</span>
        </div>
      ))}
    </div>
  );
};

function StatBadge({ label, value, color=C.gold }) {
  return (
    <div style={{ background:`${color}11`, border:`1px solid ${color}33`, borderRadius:8, padding:'12px 16px', textAlign:'center' }}>
      <div style={{ fontFamily:'var(--font-cond)', fontWeight:800, fontSize:28, color, lineHeight:1 }}>{value}</div>
      <div style={{ fontFamily:'var(--font-semi)', fontSize:9.5, fontWeight:700, letterSpacing:1.5, textTransform:'uppercase', color:C.t3, marginTop:5 }}>{label}</div>
    </div>
  );
}

function SecLabel({ text, action }) {
  return (
    <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:14 }}>
      <div style={{ width:20, height:2, background:C.gold, borderRadius:2, flexShrink:0 }}/>
      <span style={{ fontFamily:'var(--font-semi)', fontSize:10, fontWeight:700, letterSpacing:'3px', textTransform:'uppercase', color:C.gold, flex:1 }}>{text}</span>
      {action}
    </div>
  );
}

function Card({ children, p=20, style={} }) {
  return (
    <div style={{ background:C.carbon, border:'1px solid rgba(255,255,255,.07)', borderRadius:10, padding:p, boxShadow:'0 4px 24px rgba(0,0,0,.4)', ...style }}>
      {children}
    </div>
  );
}

function KpiTile({ label, value, sub, color=C.gold, icon, alert, idx=0 }) {
  const [h,setH] = useState(false);
  return (
    <div onMouseEnter={()=>setH(true)} onMouseLeave={()=>setH(false)}
      style={{ background:h?'#2A2535':C.carbon, border:`1px solid ${h?C.goldB:'rgba(255,255,255,.07)'}`,
        borderRadius:10, padding:'18px 20px', position:'relative', overflow:'hidden',
        boxShadow:h?`0 8px 32px rgba(0,0,0,.5), 0 0 0 1px ${C.goldD}`:'0 4px 20px rgba(0,0,0,.4)',
        transition:'all .18s', transform:h?'translateY(-3px)':'none',
        animation:`kpi-rise .4s ${idx*.05}s both`, cursor:'default' }}>
      <div style={{ position:'absolute', left:0, top:0, bottom:0, width:3, background:color, borderRadius:'10px 0 0 10px' }}/>
      {alert && <div style={{ position:'absolute', top:10, right:12, fontSize:15 }}>{alert}</div>}
      {icon && <div style={{ fontSize:22, marginBottom:8, opacity:.7 }}>{icon}</div>}
      <div style={{ fontFamily:'var(--font-semi)', fontSize:9.5, fontWeight:700, letterSpacing:'2.5px', textTransform:'uppercase', color:h?C.t2:C.t3, marginBottom:8 }}>{label}</div>
      <div style={{ fontFamily:'var(--font-cond)', fontWeight:800, fontSize:32, lineHeight:1, color:h?'#fff':C.text }}>{value}</div>
      {sub && <div style={{ fontSize:11, color:h?C.t2:C.t3, marginTop:6, lineHeight:1.5 }} dangerouslySetInnerHTML={{__html:sub}}/>}
    </div>
  );
}

/* ─────────────────────────────────────────────
   MAIN PAGE
───────────────────────────────────────────── */
export default function HubSpotPage() {
  const { activeClient } = useApp();
  const [tab, setTab]             = useState('resumen');
  const [pipelines, setPipelines] = useState([]);
  const [pipelineId, setPId]      = useState('');
  const [liveData, setLive]       = useState(null);
  const [loading, setLoading]     = useState(false);
  const [carreraSort, setSort]    = useState('leads');
  const [carreraFilter, setFilter]= useState('all');
  const [asesorFilter, setAFilter]= useState('all');
  const [searchCarrera, setSearch]= useState('');

  useEffect(() => {
    hubspotApi.getPipelines().then(r=>{
      const pipes = r.data?.pipelines||[];
      setPipelines(pipes);
      const p = pipes.find(p=>p.label?.toLowerCase().includes('2026')||p.label?.toLowerCase().includes('admis'))||pipes[0];
      if(p) setPId(p.id);
    }).catch(()=>{});
  },[]);

  useEffect(()=>{
    if(!pipelineId) return;
    setLoading(true);
    hubspotApi.getSummary(pipelineId,30).then(r=>setLive(r.data)).catch(()=>{}).finally(()=>setLoading(false));
  },[pipelineId]);

  // Merge live funnel if available
  const liveFunnel = liveData?.funnel?.funnel;
  const funnel = FUNNEL.map(f => ({ ...f, v: liveFunnel?.[f.key] ?? f.v }));
  const totalFunnel = funnel.reduce((s,f)=>s+(f.key!=='perdido'?f.v:0),0);

  // Filtered/sorted carreras
  const filteredCarreras = useMemo(()=>{
    let rows = [...CARRERAS].filter(c=>{
      if(searchCarrera && !c.n.toLowerCase().includes(searchCarrera.toLowerCase())) return false;
      if(carreraFilter==='alerta') return c.conv_pct!==null && c.conv_pct<5 && c.leads>50;
      if(carreraFilter==='top') return c.conv>10;
      return true;
    });
    rows.sort((a,b)=>{
      if(carreraSort==='leads')    return b.leads-a.leads;
      if(carreraSort==='conv')     return b.conv-a.conv;
      if(carreraSort==='conv_pct') return (b.conv_pct||0)-(a.conv_pct||0);
      return a.n.localeCompare(b.n);
    });
    return rows;
  },[carreraSort,carreraFilter,searchCarrera]);

  const TABS = [
    { k:'resumen',  l:'📊 Resumen'   },
    { k:'embudo',   l:'🔻 Embudo'    },
    { k:'carreras', l:'🎓 Carreras'  },
    { k:'asesores', l:'👤 Asesores'  },
    { k:'canales',  l:'📡 Canales'   },
  ];

  /* shared styles */
  const tabBtn = (k) => ({
    padding:'9px 18px', fontFamily:'var(--font-semi)', fontSize:11, fontWeight:700,
    letterSpacing:1.2, textTransform:'uppercase', cursor:'pointer', border:'none',
    background: tab===k ? 'rgba(220,161,69,.12)' : 'transparent',
    color: tab===k ? C.gold : C.t3,
    borderBottom: tab===k ? `2px solid ${C.gold}` : '2px solid transparent',
    borderRadius: tab===k ? '6px 6px 0 0' : undefined,
    transition:'all .15s',
  });

  const filterBtn = (active, onClick, label) => (
    <button onClick={onClick} style={{
      padding:'5px 14px', fontFamily:'var(--font-semi)', fontSize:10, fontWeight:700, letterSpacing:1,
      textTransform:'uppercase', cursor:'pointer', borderRadius:20,
      border:`1px solid ${active?C.gold:C.slate2}`,
      background:active?C.goldD:'transparent', color:active?C.gold:C.t3,
      transition:'all .15s',
    }}>{label}</button>
  );

  return (
    <div className="scroll-y" style={{ flex:1, padding:'22px 28px', background:'#14141B' }}>

      {/* ── Header ── */}
      <div style={{ display:'flex', alignItems:'center', gap:14, marginBottom:20, flexWrap:'wrap' }}>
        <div>
          <h1 style={{ fontFamily:'var(--font-cond)', fontWeight:900, fontSize:24, letterSpacing:2, textTransform:'uppercase', color:'#fff', lineHeight:1 }}>HubSpot CRM</h1>
          <div style={{ fontFamily:'var(--font-semi)', fontSize:10, color:C.t3, letterSpacing:1.5, textTransform:'uppercase', marginTop:4 }}>
            {activeClient.name} · Admisión Pregrado 2026-II
          </div>
        </div>

        {pipelines.length>0 && (
          <select value={pipelineId} onChange={e=>setPId(e.target.value)}
            style={{ padding:'6px 14px', fontSize:11, fontFamily:'var(--font-semi)', fontWeight:700, letterSpacing:.8,
              borderRadius:8, background:C.goldD, borderColor:C.goldB, color:C.gold, marginLeft:8 }}>
            {pipelines.map(p=><option key={p.id} value={p.id}>{p.label}</option>)}
          </select>
        )}

        {loading && <span className="spinner"/>}

        {/* Live stats strip */}
        <div style={{ marginLeft:'auto', display:'flex', gap:8 }}>
          {[
            { l:'Total leads', v:'5,930', c:C.blue  },
            { l:'Calificados', v:'325',   c:C.green },
            { l:'Descalif.',   v:'2,906', c:C.red   },
            { l:'Tiempo resp', v:'21.1h', c:C.red   },
          ].map((s,i)=>(
            <div key={i} style={{ textAlign:'center', padding:'6px 14px', background:`${s.c}11`, border:`1px solid ${s.c}33`, borderRadius:8 }}>
              <div style={{ fontFamily:'var(--font-cond)', fontWeight:800, fontSize:18, color:s.c, lineHeight:1 }}>{s.v}</div>
              <div style={{ fontFamily:'var(--font-semi)', fontSize:9, fontWeight:700, letterSpacing:1, color:C.t3, marginTop:3, textTransform:'uppercase' }}>{s.l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Tabs ── */}
      <div style={{ display:'flex', gap:2, marginBottom:24, borderBottom:'1px solid rgba(255,255,255,.07)' }}>
        {TABS.map(t=><button key={t.k} onClick={()=>setTab(t.k)} style={tabBtn(t.k)}>{t.l}</button>)}
      </div>

      {/* ═══════════════════════════════════════
          TAB: RESUMEN
      ═══════════════════════════════════════ */}
      {tab==='resumen' && (<>

        {/* Alertas */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12, marginBottom:24 }}>
          {[
            { icon:'🚨', title:'Descalificados por asesor', value:'2,906', note:'Motivo #1: asesor no actualiza HubSpot', color:C.red },
            { icon:'⚠️', title:'Atascados en Validación',   value:'1,932', note:'33% del total sin trabajar activamente', color:C.gold },
            { icon:'⏱️', title:'Tiempo promedio de respuesta', value:'21.1 hrs', note:'Objetivo <5 min · Gap crítico de ventas', color:C.red },
          ].map((a,i)=>(
            <div key={i} style={{ background:`${a.color}0D`, border:`1px solid ${a.color}40`, borderLeft:`3px solid ${a.color}`, borderRadius:10, padding:'16px 20px' }}>
              <div style={{ fontSize:20, marginBottom:6 }}>{a.icon}</div>
              <div style={{ fontFamily:'var(--font-semi)', fontSize:9.5, fontWeight:700, letterSpacing:2, textTransform:'uppercase', color:a.color, marginBottom:6 }}>{a.title}</div>
              <div style={{ fontFamily:'var(--font-cond)', fontWeight:900, fontSize:32, color:'#fff', lineHeight:1, marginBottom:6 }}>{a.value}</div>
              <div style={{ fontSize:11.5, color:C.t2 }}>{a.note}</div>
            </div>
          ))}
        </div>

        {/* KPIs */}
        <SecLabel text="KPIs del proceso"/>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, marginBottom:14 }}>
          <KpiTile idx={0} icon="📩" label="Total leads digitales" color={C.blue}  value="5,930" sub={`Meta proceso: <b>25,000</b> · 23.7% alcanzado`}/>
          <KpiTile idx={1} icon="🎯" label="Leads calificados"     color={C.green} value="325"   sub={`5.5% del total · tasa de calificación`}/>
          <KpiTile idx={2} icon="✅" label="Matriculados (Google)"  color={C.green} value="2"     sub={`S/ 519,794 invertidos · S/259K por matrícula`} alert="⚠️"/>
          <KpiTile idx={3} icon="💬" label="Canal preferido"        color={C.gold}  value="89% WA" sub={`2,162 de 2,430 prefieren WhatsApp`}/>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, marginBottom:28 }}>
          <KpiTile idx={4} icon="💰" label="Inversión Google 2026-II" color={C.gold}   value="S/519K" sub={`S/ 519,794 · 72.6% del presupuesto`}/>
          <KpiTile idx={5} icon="📱" label="Inversión Meta 2026-II"   color={C.blue}   value="S/196K" sub={`S/ 196,793 · 27.4% del presupuesto`}/>
          <KpiTile idx={6} icon="👻" label="Leads sin propietario jun" color={C.red}    value="49"    sub={`20 en mayo · +145% MoM`} alert="⚠️"/>
          <KpiTile idx={7} icon="⚡" label="Atendidos <10 min"         color={C.red}    value="2"     sub={`De 549 leads enviados a ventas · 0.36%`} alert="🚨"/>
        </div>

        {/* Tendencia + Estado */}
        <div style={{ display:'grid', gridTemplateColumns:'3fr 2fr', gap:14, marginBottom:28 }}>
          <Card>
            <SecLabel text="Tendencia semanal de leads"/>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={TENDENCIA}>
                <defs>
                  <linearGradient id="gl" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor={C.gold} stopOpacity={.35}/>
                    <stop offset="95%" stopColor={C.gold} stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="s" tick={{ fontSize:9, fill:C.t3 }} axisLine={false} tickLine={false}/>
                <YAxis tick={{ fontSize:9, fill:C.t3 }} axisLine={false} tickLine={false}/>
                <CartesianGrid stroke="rgba(255,255,255,.04)" strokeDasharray="4 4"/>
                <Tooltip content={<Tip/>}/>
                <Area type="monotone" dataKey="leads" name="Leads" stroke={C.gold} fill="url(#gl)" strokeWidth={2.5}/>
              </AreaChart>
            </ResponsiveContainer>
            <div style={{ display:'flex', gap:20, marginTop:10, fontSize:11.5, color:C.t3 }}>
              <span>Pico: <b style={{ color:'#fff' }}>635</b> (8 jun)</span>
              <span>Promedio: <b style={{ color:'#fff' }}>~430/sem</b></span>
              <span>Última: <b style={{ color:C.red }}>335 ↓47%</b></span>
            </div>
          </Card>

          <Card>
            <SecLabel text="Estado actual de leads"/>
            {ESTADOS.map((e,i)=>{
              const pct = (e.v/5930*100).toFixed(1);
              return (
                <div key={i} style={{ marginBottom:8 }}>
                  <div style={{ display:'flex', justifyContent:'space-between', fontSize:11.5, marginBottom:3 }}>
                    <span style={{ color:C.t2, fontFamily:'var(--font-semi)', fontWeight:600 }}>{e.e}</span>
                    <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                      <span style={{ color:C.t3, fontSize:10 }}>{pct}%</span>
                      <span style={{ fontFamily:'var(--font-cond)', fontWeight:800, fontSize:16, color:'#fff', minWidth:40, textAlign:'right' }}>{e.v.toLocaleString()}</span>
                    </div>
                  </div>
                  <div style={{ background:'rgba(255,255,255,.05)', borderRadius:3, height:22, overflow:'hidden' }}>
                    <div style={{ width:`${pct}%`, height:'100%', background:e.color, opacity:.8, borderRadius:3, transition:'width .7s ease' }}/>
                  </div>
                </div>
              );
            })}
          </Card>
        </div>
      </>)}

      {/* ═══════════════════════════════════════
          TAB: EMBUDO
      ═══════════════════════════════════════ */}
      {tab==='embudo' && (<>
        <SecLabel text="Embudo de admisiones · Admisión Pregrado 2026-II"/>

        {/* Stat badges */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:10, marginBottom:24 }}>
          {funnel.map(f=><StatBadge key={f.key} label={f.label} value={f.v.toLocaleString()} color={f.color}/>)}
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'5fr 3fr', gap:16, marginBottom:24 }}>

          {/* Main funnel */}
          <Card>
            {(() => {
              const max = funnel[0].v;
              return funnel.filter(f=>f.key!=='perdido').map((f,i,arr)=>{
                const pct = Math.max((f.v/max)*100, f.v>0?8:2);
                const prev = i>0?arr[i-1].v:null;
                const conv = prev ? ((f.v/prev)*100).toFixed(1) : null;
                return (
                  <div key={f.key} style={{ marginBottom:i<arr.length-1?8:0 }}>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:6 }}>
                      <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                        <span style={{ fontSize:18 }}>{f.icon}</span>
                        <span style={{ fontFamily:'var(--font-semi)', fontWeight:700, fontSize:14, color:C.t2 }}>{f.label}</span>
                      </div>
                      <div style={{ display:'flex', gap:12, alignItems:'center' }}>
                        {conv && (
                          <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                            <div style={{ width:60, height:5, background:'rgba(255,255,255,.08)', borderRadius:3 }}>
                              <div style={{ width:`${Math.min(parseFloat(conv),100)}%`, height:'100%', borderRadius:3, background:parseFloat(conv)>50?C.green:parseFloat(conv)>25?C.gold:C.red }}/>
                            </div>
                            <span style={{ fontFamily:'var(--font-semi)', fontSize:11, fontWeight:700,
                              color:parseFloat(conv)>50?C.green:parseFloat(conv)>25?C.gold:C.red,
                              background:'rgba(255,255,255,.05)', padding:'2px 9px', borderRadius:20 }}>
                              {conv}% conv.
                            </span>
                          </div>
                        )}
                        <span style={{ fontFamily:'var(--font-cond)', fontWeight:900, fontSize:28, color:'#fff', minWidth:65, textAlign:'right' }}>
                          {f.v.toLocaleString()}
                        </span>
                      </div>
                    </div>
                    <div style={{ background:'rgba(255,255,255,.05)', borderRadius:6, height:48, overflow:'hidden' }}>
                      <div style={{
                        width:`${pct}%`, height:'100%', borderRadius:6,
                        background:`linear-gradient(90deg,${f.color}77,${f.color})`,
                        display:'flex', alignItems:'center', paddingLeft:16,
                        fontFamily:'var(--font-semi)', fontSize:11.5, fontWeight:600, color:'rgba(255,255,255,.9)',
                        transition:'width .9s cubic-bezier(.16,1,.3,1)',
                      }}>
                        {f.v>0&&`${pct.toFixed(0)}% del top`}
                      </div>
                    </div>
                    {i<arr.length-1 && <div style={{ marginLeft:26, height:10, borderLeft:'1px dashed rgba(255,255,255,.1)' }}/>}
                  </div>
                );
              });
            })()}
          </Card>

          {/* Tiempos + Google funnel */}
          <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
            <Card>
              <SecLabel text="Tiempos de cierre"/>
              {[
                { e:'Interesado → Inscrito',   d:'3.7', dir:'ok',  delta:'estable' },
                { e:'Inscrito → Ingresante',   d:'22.7',dir:'bad', delta:'+521%' },
                { e:'Ingresante → Pagante',    d:'1.3', dir:'good',delta:'-94%' },
                { e:'Total → Matrícula',       d:'24.1',dir:'bad', delta:'+1,704%' },
              ].map((t,i)=>(
                <div key={i} style={{ display:'flex', justifyContent:'space-between', alignItems:'center',
                  padding:'10px 0', borderBottom:i<3?'1px solid rgba(255,255,255,.05)':undefined }}>
                  <span style={{ fontSize:11.5, color:C.t2 }}>{t.e}</span>
                  <div style={{ textAlign:'right' }}>
                    <div style={{ fontFamily:'var(--font-cond)', fontWeight:800, fontSize:22,
                      color:t.dir==='good'?C.green:t.dir==='bad'?C.red:C.text }}>{t.d}d</div>
                    <div style={{ fontSize:10, color:t.dir==='good'?C.green:t.dir==='bad'?C.red:C.t3, fontFamily:'var(--font-semi)', fontWeight:600 }}>{t.delta}</div>
                  </div>
                </div>
              ))}
            </Card>

            <Card>
              <SecLabel text="Google Ads 2026-02" action={<span style={{ fontSize:10, color:C.t3 }}>S/ 519,794</span>}/>
              {[
                { s:'Interesado',   v:20  },
                { s:'Inscrito',     v:23  },
                { s:'Ingresante',   v:12  },
                { s:'Pagante',      v:22  },
                { s:'Matriculado',  v:2   },
              ].map((r,i,arr)=>(
                <div key={r.s} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
                  <span style={{ fontSize:11.5, color:r.s==='Matriculado'?C.green:C.t2 }}>{r.s}</span>
                  <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                    <div style={{ width:80, background:'rgba(255,255,255,.05)', borderRadius:3, height:6 }}>
                      <div style={{ width:`${(r.v/arr[0].v)*100}%`, height:'100%', borderRadius:3, background:r.s==='Matriculado'?C.green:C.gold }}/>
                    </div>
                    <span style={{ fontFamily:'var(--font-cond)', fontWeight:800, fontSize:20,
                      color:r.s==='Matriculado'?C.green:'#fff', minWidth:30, textAlign:'right' }}>{r.v}</span>
                  </div>
                </div>
              ))}
              <div style={{ marginTop:10, padding:'10px 12px', background:C.redD, border:`1px solid ${C.red}33`, borderRadius:8, fontSize:11.5, color:C.t2 }}>
                ⚠️ <strong style={{ color:C.red }}>S/ 259,897 por matriculado</strong> — verificar atribución en pipeline
              </div>
            </Card>
          </div>
        </div>
      </>)}

      {/* ═══════════════════════════════════════
          TAB: CARRERAS
      ═══════════════════════════════════════ */}
      {tab==='carreras' && (<>

        {/* Filters bar */}
        <div style={{ display:'flex', gap:8, marginBottom:20, alignItems:'center', flexWrap:'wrap' }}>
          <input value={searchCarrera} onChange={e=>setSearch(e.target.value)}
            placeholder="Buscar carrera..." style={{ width:200, padding:'7px 12px', fontSize:12 }}/>
          <div style={{ display:'flex', gap:6 }}>
            {filterBtn(carreraFilter==='all',    ()=>setFilter('all'),    'Todas')}
            {filterBtn(carreraFilter==='top',    ()=>setFilter('top'),    '🏆 Top conv.')}
            {filterBtn(carreraFilter==='alerta', ()=>setFilter('alerta'), '🚨 Alerta')}
          </div>
          <div style={{ marginLeft:'auto', display:'flex', gap:6 }}>
            <span style={{ fontSize:11, color:C.t3, alignSelf:'center' }}>Ordenar:</span>
            {[['leads','Leads'],['conv','Convertidos'],['conv_pct','Tasa %']].map(([k,l])=>(
              filterBtn(carreraSort===k, ()=>setSort(k), l)
            ))}
          </div>
        </div>

        {/* Charts */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, marginBottom:20 }}>
          <Card>
            <SecLabel text="Leads por carrera · Top 10"/>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={[...CARRERAS].sort((a,b)=>b.leads-a.leads).filter(c=>c.leads>0).slice(0,10)} layout="vertical" barSize={18}>
                <XAxis type="number" tick={{ fontSize:9, fill:C.t3 }} axisLine={false} tickLine={false}/>
                <YAxis type="category" dataKey="n" tick={{ fontSize:9.5, fill:C.t2, fontFamily:'var(--font-semi)' }} axisLine={false} tickLine={false} width={130}/>
                <Tooltip content={<Tip/>}/>
                <Bar dataKey="leads" name="Leads" fill={C.blue} opacity={.85} radius={[0,4,4,0]}/>
              </BarChart>
            </ResponsiveContainer>
          </Card>
          <Card>
            <SecLabel text="Convertidos por carrera · Top 10"/>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={[...CARRERAS].sort((a,b)=>b.conv-a.conv).filter(c=>c.conv>0).slice(0,10)} layout="vertical" barSize={18}>
                <XAxis type="number" tick={{ fontSize:9, fill:C.t3 }} axisLine={false} tickLine={false}/>
                <YAxis type="category" dataKey="n" tick={{ fontSize:9.5, fill:C.t2, fontFamily:'var(--font-semi)' }} axisLine={false} tickLine={false} width={130}/>
                <Tooltip content={<Tip/>}/>
                <Bar dataKey="conv" name="Conv." fill={C.green} opacity={.85} radius={[0,4,4,0]}/>
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </div>

        {/* Table */}
        <Card p={0}>
          <div style={{ padding:'14px 20px', borderBottom:'1px solid rgba(255,255,255,.07)', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <span style={{ fontFamily:'var(--font-semi)', fontSize:10, fontWeight:700, letterSpacing:2, textTransform:'uppercase', color:C.t2 }}>
              TABLA DETALLE · {filteredCarreras.length} carreras
            </span>
          </div>
          <table className="table">
            <thead>
              <tr>
                <th style={{ textAlign:'left', cursor:'pointer' }} onClick={()=>setSort('n')}>CARRERA ↕</th>
                <th style={{ textAlign:'right', cursor:'pointer', color:carreraSort==='leads'?C.gold:undefined }} onClick={()=>setSort('leads')}>LEADS ↕</th>
                <th style={{ textAlign:'right', cursor:'pointer', color:carreraSort==='conv'?C.gold:undefined }} onClick={()=>setSort('conv')}>CONV. ↕</th>
                <th style={{ textAlign:'right', cursor:'pointer', color:carreraSort==='conv_pct'?C.gold:undefined }} onClick={()=>setSort('conv_pct')}>TASA ↕</th>
                <th style={{ textAlign:'center' }}>ESTADO</th>
              </tr>
            </thead>
            <tbody>
              {filteredCarreras.map(c=>{
                const tasa = c.conv_pct;
                const color = tasa===null?C.t3:tasa>10?C.green:tasa>5?C.gold:C.red;
                const icon = tasa===null?'—':tasa>10?'🏆':tasa>5?'✅':c.leads>100?'🚨':'⚠️';
                return (
                  <tr key={c.n}>
                    <td style={{ fontWeight:600, color:C.text }}>{c.n}</td>
                    <td style={{ textAlign:'right', fontFamily:'var(--mono)' }}>{c.leads>0?c.leads.toLocaleString():'—'}</td>
                    <td style={{ textAlign:'right', fontWeight:700, color:c.conv>0?C.green:C.t3 }}>{c.conv>0?c.conv:'—'}</td>
                    <td style={{ textAlign:'right' }}>
                      {tasa!==null
                        ? <span style={{ color, fontWeight:700 }}>{tasa.toFixed(1)}%</span>
                        : <span style={{ color:C.t3 }}>—</span>}
                    </td>
                    <td style={{ textAlign:'center', fontSize:15 }}>{icon}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <div style={{ padding:'12px 20px', borderTop:'1px solid rgba(255,255,255,.07)', fontSize:11.5, color:C.t3, display:'flex', gap:20 }}>
            <span>Total leads: <b style={{ color:C.text }}>{filteredCarreras.reduce((s,c)=>s+c.leads,0).toLocaleString()}</b></span>
            <span>Total conv.: <b style={{ color:C.green }}>{filteredCarreras.reduce((s,c)=>s+c.conv,0)}</b></span>
          </div>
        </Card>
      </>)}

      {/* ═══════════════════════════════════════
          TAB: ASESORES
      ═══════════════════════════════════════ */}
      {tab==='asesores' && (<>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, marginBottom:24 }}>
          <KpiTile idx={0} icon="📨" label="Enviados a ventas"   color={C.blue}  value="549"     sub="Este trimestre"/>
          <KpiTile idx={1} icon="✋" label="Atendidos por humano" color={C.gold}  value="168"     sub={`31% del total enviado`}/>
          <KpiTile idx={2} icon="⚡" label="Atendidos &lt;10 min" color={C.red}   value="2"       sub={`0.36% de 549 leads`} alert="🚨"/>
          <KpiTile idx={3} icon="⏱️" label="Tiempo prom. respuesta" color={C.red} value="21.1 h" sub={`Objetivo: &lt;5 min`} alert="🚨"/>
        </div>

        {/* Filter buttons */}
        <div style={{ display:'flex', gap:6, marginBottom:16 }}>
          {filterBtn(asesorFilter==='all',    ()=>setAFilter('all'),    'Todos')}
          {filterBtn(asesorFilter==='alerta', ()=>setAFilter('alerta'), '🚨 Con olvidos')}
          {filterBtn(asesorFilter==='ok',     ()=>setAFilter('ok'),     '✅ Sin olvidos')}
        </div>

        <Card p={0} style={{ marginBottom:20 }}>
          <div style={{ padding:'14px 20px', borderBottom:'1px solid rgba(255,255,255,.07)' }}>
            <span style={{ fontFamily:'var(--font-semi)', fontSize:10, fontWeight:700, letterSpacing:2, textTransform:'uppercase', color:C.t2 }}>PERFORMANCE POR ASESOR</span>
          </div>
          <table className="table">
            <thead>
              <tr>
                <th style={{ textAlign:'left' }}>ASESOR</th>
                <th style={{ textAlign:'right' }}>ASIGNADOS</th>
                <th style={{ textAlign:'right' }}>ATENDIDOS</th>
                <th style={{ textAlign:'right' }}>EN OLVIDO</th>
                <th style={{ textAlign:'right' }}>TASA ATENCIÓN</th>
                <th style={{ textAlign:'center' }}>ESTADO</th>
              </tr>
            </thead>
            <tbody>
              {ASESORES.filter(a=>{
                if(asesorFilter==='alerta') return a.olvido>=3;
                if(asesorFilter==='ok')     return a.olvido<3;
                return true;
              }).map((a,i)=>{
                const tasa = a.asig>0 ? ((a.atend/a.asig)*100).toFixed(0) : '—';
                const tasaN = parseInt(tasa)||0;
                const icon = a.olvido>=8?'🚨':a.olvido>=3?'⚠️':'✅';
                return (
                  <tr key={i}>
                    <td style={{ fontWeight:600, color:C.text }}>{a.n}</td>
                    <td style={{ textAlign:'right' }}>{a.asig||'—'}</td>
                    <td style={{ textAlign:'right', color:C.green, fontWeight:700 }}>{a.atend}</td>
                    <td style={{ textAlign:'right', color:a.olvido>=8?C.red:a.olvido>=3?C.gold:C.t3, fontWeight:700 }}>{a.olvido}</td>
                    <td style={{ textAlign:'right' }}>
                      {tasa!=='—'
                        ? <span style={{ color:tasaN>50?C.green:tasaN>25?C.gold:C.red, fontWeight:700 }}>{tasa}%</span>
                        : <span style={{ color:C.t3 }}>—</span>}
                    </td>
                    <td style={{ textAlign:'center', fontSize:15 }}>{icon}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>

        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
          <Card>
            <SecLabel text="Atención en menos de 10 min"/>
            <div style={{ textAlign:'center', padding:'20px 0' }}>
              <div style={{ fontFamily:'var(--font-cond)', fontWeight:900, fontSize:72, color:C.red, lineHeight:1 }}>2</div>
              <div style={{ fontFamily:'var(--font-semi)', fontSize:12, color:C.t3, marginTop:8 }}>de 549 leads enviados a ventas</div>
              <div style={{ marginTop:16, padding:'12px 16px', background:C.redD, border:`1px solid ${C.red}33`, borderRadius:8, fontSize:12, color:C.t2 }}>
                Solo el <strong style={{ color:C.red }}>0.36%</strong> fue contactado en los primeros 10 minutos. El primer minuto es crítico en admisiones.
              </div>
            </div>
          </Card>
          <Card>
            <SecLabel text="Motivos de descalificación"/>
            {[
              { m:'Asesor no cambia estado', n:2390, color:C.red   },
              { m:'Intento límite',           n:120,  color:C.gold  },
              { m:'Sin motivo registrado',    n:73,   color:C.t3   },
              { m:'Clases a distancia',       n:63,   color:C.blue  },
              { m:'Eligió otra universidad',  n:58,   color:C.indigo},
              { m:'Factor económico',         n:52,   color:C.t3   },
              { m:'Proceso concluido',        n:29,   color:C.t3   },
            ].map((m,i)=>(
              <div key={i} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:9, paddingBottom:9, borderBottom:i<6?'1px solid rgba(255,255,255,.04)':undefined }}>
                <span style={{ fontSize:11.5, color:i===0?C.text:C.t2, fontWeight:i===0?700:400 }}>{m.m}</span>
                <span style={{ fontFamily:'var(--font-cond)', fontWeight:800, fontSize:20, color:m.color }}>{m.n.toLocaleString()}</span>
              </div>
            ))}
          </Card>
        </div>
      </>)}

      {/* ═══════════════════════════════════════
          TAB: CANALES
      ═══════════════════════════════════════ */}
      {tab==='canales' && (<>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, marginBottom:24 }}>
          <KpiTile idx={0} icon="🔍" label="Google Ads leads"  color={C.gold} value="3,254" sub="55% del total digital"/>
          <KpiTile idx={1} icon="📘" label="Meta / CTWA leads" color={C.blue} value="1,531" sub="26% del total · medio ctwa"/>
          <KpiTile idx={2} icon="🌱" label="Orgánico leads"    color={C.green} value="577"  sub="9.7% del total"/>
          <KpiTile idx={3} icon="❓" label="Sin UTM"           color={C.red}   value="105"  alert="⚠️" sub="9.3% sin atribución"/>
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, marginBottom:20 }}>
          <Card>
            <SecLabel text="Leads por fuente"/>
            {[
              { n:'Google (Búsqueda pago)', v:3254, color:C.gold   },
              { n:'Meta / Redes sociales',  v:1531, color:C.blue   },
              { n:'Búsqueda orgánica',      v:577,  color:C.green  },
              { n:'Tráfico orgánico',       v:231,  color:C.indigo },
              { n:'Sin UTM / valor',        v:337,  color:C.t3     },
            ].map((f,i)=>{
              const pct = (f.v/5930*100).toFixed(1);
              return (
                <div key={i} style={{ marginBottom:12 }}>
                  <div style={{ display:'flex', justifyContent:'space-between', fontSize:12, marginBottom:4 }}>
                    <span style={{ color:C.t2, fontFamily:'var(--font-semi)', fontWeight:600 }}>{f.n}</span>
                    <div style={{ display:'flex', gap:10 }}>
                      <span style={{ color:C.t3, fontSize:10.5 }}>{pct}%</span>
                      <span style={{ fontFamily:'var(--font-cond)', fontWeight:800, fontSize:18, color:'#fff' }}>{f.v.toLocaleString()}</span>
                    </div>
                  </div>
                  <div style={{ background:'rgba(255,255,255,.05)', borderRadius:4, height:28, overflow:'hidden' }}>
                    <div style={{ width:`${pct}%`, height:'100%', borderRadius:4, background:f.color, opacity:.8, transition:'width .7s ease' }}/>
                  </div>
                </div>
              );
            })}
          </Card>

          <Card>
            <SecLabel text="Calidad de lead por canal"/>
            <table className="table">
              <thead>
                <tr>
                  <th style={{ textAlign:'left' }}>CANAL</th>
                  <th style={{ textAlign:'right' }}>LEADS</th>
                  <th style={{ textAlign:'right' }}>CALIFIC.</th>
                  <th style={{ textAlign:'right' }}>DESCALIF.</th>
                  <th style={{ textAlign:'right' }}>TASA</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { c:'Google Search', l:3254, cal:136, desc:1732 },
                  { c:'Meta / CTWA',   l:1531, cal:63,  desc:709  },
                  { c:'Orgánico',      l:577,  cal:93,  desc:319  },
                  { c:'Org. Social',   l:231,  cal:30,  desc:132  },
                ].map((r,i)=>{
                  const tasa = ((r.cal/r.l)*100).toFixed(1);
                  return (
                    <tr key={i}>
                      <td style={{ color:C.text, fontWeight:500 }}>{r.c}</td>
                      <td style={{ textAlign:'right', fontFamily:'var(--mono)' }}>{r.l.toLocaleString()}</td>
                      <td style={{ textAlign:'right', color:C.green, fontWeight:700 }}>{r.cal}</td>
                      <td style={{ textAlign:'right', color:C.red }}>{r.desc.toLocaleString()}</td>
                      <td style={{ textAlign:'right' }}>
                        <span style={{ color:parseFloat(tasa)>5?C.green:C.gold, fontWeight:700 }}>{tasa}%</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <div style={{ marginTop:14, padding:'12px 14px', background:C.greenD, border:`1px solid ${C.green}33`, borderRadius:8, fontSize:12, color:C.t2 }}>
              💡 Orgánico califica mejor (16.1%) — considera SEO como estrategia de calidad.
            </div>
          </Card>
        </div>

        {/* UTM table */}
        <Card p={0}>
          <div style={{ padding:'14px 20px', borderBottom:'1px solid rgba(255,255,255,.07)' }}>
            <span style={{ fontFamily:'var(--font-semi)', fontSize:10, fontWeight:700, letterSpacing:2, textTransform:'uppercase', color:C.t2 }}>
              DESGLOSE UTM SOURCE / MEDIUM · 1,132 contactos con UTM
            </span>
          </div>
          <table className="table">
            <thead>
              <tr>
                <th style={{ textAlign:'left' }}>UTM SOURCE</th>
                <th style={{ textAlign:'left' }}>UTM MEDIUM</th>
                <th style={{ textAlign:'right' }}>CONTACTOS</th>
                <th style={{ textAlign:'right' }}>% DEL TOTAL</th>
                <th style={{ textAlign:'center' }}>CANAL</th>
              </tr>
            </thead>
            <tbody>
              {[
                { src:'facebook',    med:'ctwa', n:952, pct:84.1, canal:'Meta WhatsApp' },
                { src:'meta',        med:'ctwa', n:40,  pct:3.5,  canal:'Meta WA directo' },
                { src:'instagram',   med:'ctwa', n:34,  pct:3.0,  canal:'Instagram WA' },
                { src:'teads',       med:'ctwp', n:1,   pct:0.1,  canal:'Teads display' },
                { src:'(Sin valor)', med:'—',    n:105, pct:9.3,  canal:'Sin trackear ⚠️' },
              ].map((r,i)=>(
                <tr key={i}>
                  <td style={{ color:C.text, fontWeight:500 }}>{r.src}</td>
                  <td style={{ color:C.t3 }}>{r.med}</td>
                  <td style={{ textAlign:'right', fontFamily:'var(--mono)', fontWeight:700 }}>{r.n.toLocaleString()}</td>
                  <td style={{ textAlign:'right' }}>
                    <span style={{ color:r.pct>50?C.gold:r.pct>5?C.t2:C.t3, fontWeight:r.pct>50?700:400 }}>{r.pct}%</span>
                  </td>
                  <td style={{ textAlign:'center', fontSize:12, color:C.t2 }}>{r.canal}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ padding:'12px 20px', borderTop:'1px solid rgba(255,255,255,.07)', fontSize:11.5, color:C.t3 }}>
            ⚠️ <strong style={{ color:C.gold }}>Facebook CTWA domina con 84.1%</strong> — casi todo el volumen WhatsApp viene de Facebook. Instagram y Meta directo son marginales.
          </div>
        </Card>
      </>)}

    </div>
  );
}
