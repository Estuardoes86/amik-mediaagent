import React, { useState, useEffect, useMemo } from 'react';
import { hubspotApi } from '../lib/api.js';
import { useApp } from '../context/AppContext.jsx';
import EmailMarketing from './hubspot/EmailMarketing.jsx';
import LeadNurturing from './hubspot/LeadNurturing.jsx';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, AreaChart, Area, CartesianGrid
} from 'recharts';

const C = {
  gold:'#DCA145', goldD:'rgba(220,161,69,.12)', goldB:'rgba(220,161,69,.28)',
  green:'#2DD4A0', greenD:'rgba(45,212,160,.10)',
  blue:'#5B8DB8',  blueD:'rgba(91,141,184,.12)',
  red:'#E8445A',   redD:'rgba(232,68,90,.10)',
  purple:'#9061B0',indigo:'#7B68EE',
  carbon:'#FFFFFF',slate:'#F8F9FA',slate2:'#F3F4F6',
  text:'#111827',  t2:'#6B7280', t3:'#9CA3AF',
};

const SEDES = [
  { key:'chorrillos', label:'Chorrillos', color:'#5B8DB8' },
  { key:'sanborja',   label:'San Borja',  color:'#7B68EE' },
  { key:'ica',        label:'Filial Ica', color:'#9061B0' },
  { key:'chincha',    label:'F. Chincha', color:'#DCA145' },
  { key:'distancia',  label:'A Distancia',color:'#2DD4A0' },
  { key:'sin',        label:'Sin valor',  color:'#5C6470' },
];

const CARRERAS = [
  { n:'Medicina Humana',                 total:858,  sin:258,chorrillos:216,sanborja:250,ica:75, chincha:37, distancia:22, conv:54,  conv_pct:6.3  },
  { n:'Enfermería',                      total:701,  sin:158,chorrillos:184,sanborja:144,ica:108,chincha:65, distancia:42, conv:49,  conv_pct:7.0  },
  { n:'Medicina Veterinaria y Zootecnia',total:549,  sin:0,  chorrillos:0,  sanborja:5,  ica:544,chincha:0,  distancia:0,  conv:6,   conv_pct:1.1  },
  { n:'Psicología',                      total:499,  sin:1,  chorrillos:198,sanborja:109,ica:85, chincha:71, distancia:35, conv:24,  conv_pct:4.8  },
  { n:'Derecho',                         total:433,  sin:77, chorrillos:54, sanborja:57, ica:26, chincha:18, distancia:201,conv:18,  conv_pct:4.2  },
  { n:'Contabilidad',                    total:381,  sin:31, chorrillos:77, sanborja:118,ica:43, chincha:20, distancia:92, conv:0,   conv_pct:0    },
  { n:'Tec. Médica, Terapia Física',     total:195,  sin:0,  chorrillos:133,sanborja:6,  ica:26, chincha:20, distancia:10, conv:5,   conv_pct:2.6  },
  { n:'Ing. Agroindustrial',             total:174,  sin:0,  chorrillos:1,  sanborja:0,  ica:173,chincha:0,  distancia:0,  conv:0,   conv_pct:0    },
  { n:'Ingeniería Civil',                total:150,  sin:30, chorrillos:6,  sanborja:0,  ica:42, chincha:24, distancia:48, conv:10,  conv_pct:6.7  },
  { n:'Turismo y Hotelería',             total:143,  sin:1,  chorrillos:2,  sanborja:4,  ica:133,chincha:2,  distancia:1,  conv:0,   conv_pct:0    },
  { n:'Tec. Médica, Laboratorio',        total:117,  sin:0,  chorrillos:67, sanborja:6,  ica:21, chincha:14, distancia:9,  conv:0,   conv_pct:0    },
  { n:'Estomatología',                   total:112,  sin:12, chorrillos:53, sanborja:7,  ica:31, chincha:3,  distancia:6,  conv:5,   conv_pct:4.5  },
  { n:'Adm. de Empresas',                total:109,  sin:39, chorrillos:9,  sanborja:23, ica:11, chincha:11, distancia:16, conv:7,   conv_pct:6.4  },
  { n:'Ing. de Sistemas',                total:89,   sin:21, chorrillos:22, sanborja:5,  ica:9,  chincha:22, distancia:10, conv:17,  conv_pct:19.1 },
  { n:'Derecho (a distancia)',           total:67,   sin:0,  chorrillos:1,  sanborja:0,  ica:2,  chincha:1,  distancia:62, conv:5,   conv_pct:7.5  },
  { n:'Adm. y Marketing',               total:42,   sin:0,  chorrillos:2,  sanborja:10, ica:4,  chincha:9,  distancia:17, conv:8,   conv_pct:19.0 },
  { n:'Adm. Empresas (a distancia)',     total:36,   sin:0,  chorrillos:5,  sanborja:3,  ica:2,  chincha:0,  distancia:26, conv:7,   conv_pct:19.4 },
  { n:'Adm. y Neg. Int.',               total:24,   sin:0,  chorrillos:3,  sanborja:2,  ica:4,  chincha:10, distancia:5,  conv:7,   conv_pct:29.2 },
  { n:'Contabilidad (a distancia)',      total:22,   sin:0,  chorrillos:4,  sanborja:0,  ica:0,  chincha:1,  distancia:17, conv:0,   conv_pct:0    },
  { n:'Ing. de Sistemas (a distancia)',  total:19,   sin:0,  chorrillos:0,  sanborja:1,  ica:0,  chincha:3,  distancia:15, conv:0,   conv_pct:0    },
  { n:'Ing. en Enología y Viticultura',  total:18,   sin:0,  chorrillos:0,  sanborja:0,  ica:18, chincha:0,  distancia:0,  conv:0,   conv_pct:0    },
  { n:'Adm. y Marketing (a distancia)', total:12,   sin:0,  chorrillos:0,  sanborja:1,  ica:0,  chincha:0,  distancia:11, conv:0,   conv_pct:0    },
  { n:'Adm. y Neg. Int. (a distancia)', total:12,   sin:0,  chorrillos:0,  sanborja:1,  ica:1,  chincha:1,  distancia:9,  conv:0,   conv_pct:0    },
];

const TOTALES_SEDE = { chorrillos:1041, sanborja:754, ica:1360, chincha:332, distancia:658, sin:639, total:4785 };

const FUNNEL = [
  { key:'interesado', label:'Interesado',  v:922, color:C.blue,   icon:'👤' },
  { key:'inscrito',   label:'Inscrito',    v:420, color:C.indigo, icon:'📝' },
  { key:'ingresante', label:'Ingresante',  v:235, color:C.purple, icon:'🎓' },
  { key:'pagante',    label:'Pagante',     v:392, color:C.gold,   icon:'💳' },
];

const TENDENCIA = [
  {s:'23/3',v:150},{s:'30/3',v:229},{s:'6/4',v:217},{s:'13/4',v:147},{s:'20/4',v:170},
  {s:'27/4',v:421},{s:'4/5',v:493},{s:'11/5',v:585},{s:'18/5',v:577},{s:'25/5',v:501},
  {s:'1/6',v:547},{s:'8/6',v:635},{s:'15/6',v:611},{s:'22/6',v:335},
];

const ESTADOS = [
  {e:'Sin Gestión',    v:258,  color:'#9CA3AF'    },
  {e:'En Validación',  v:1932, color:C.gold  },
  {e:'En Calificación',v:179,  color:C.indigo},
  {e:'Calificado',     v:325,  color:C.green },
  {e:'Descalificado',  v:2906, color:C.red   },
  {e:'En Nutrición',   v:17,   color:C.blue  },
];

// ── Micro components ────────────────────────────────────────────────

const Tip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background:'#fff', border:'1px solid #E5E7EB', borderLeft:`3px solid ${C.gold}`, padding:'10px 16px', borderRadius:8, fontSize:12, boxShadow:'0 4px 16px rgba(0,0,0,.08)' }}>
      <div style={{ color:'#9CA3AF', marginBottom:5, fontSize:10, letterSpacing:1, textTransform:'uppercase', fontWeight:700 }}>{label}</div>
      {payload.map((p,i)=>(
        <div key={i} style={{ color:p.color||C.t2, fontWeight:600, marginBottom:2 }}>
          {p.name}: <span style={{ color:'#111827' }}>{typeof p.value==='number'?p.value.toLocaleString():p.value}</span>
        </div>
      ))}
    </div>
  );
};

function Card({ children, p=20, style={} }) {
  return <div style={{ background:'#fff', border:'1px solid #E5E7EB', borderRadius:10, padding:p, boxShadow:'0 1px 3px rgba(0,0,0,.06)', ...style }}>{children}</div>;
}

function Sec({ text, action }) {
  return (
    <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:14 }}>
      <div style={{ width:20, height:2, background:C.gold, borderRadius:2, flexShrink:0 }}/>
      <span style={{ fontFamily:'var(--font-semi)', fontSize:10, fontWeight:700, letterSpacing:'3px', textTransform:'uppercase', color:C.gold, flex:1 }}>{text}</span>
      {action}
    </div>
  );
}

function Kpi({ label, value, sub, color=C.gold, icon, alert, idx=0 }) {
  const [h,setH] = useState(false);
  return (
    <div onMouseEnter={()=>setH(true)} onMouseLeave={()=>setH(false)}
      style={{ background:'#fff', border:`1px solid ${h?C.goldB:'#E5E7EB'}`,
        borderRadius:10, padding:'16px 18px', position:'relative', overflow:'hidden',
        boxShadow:h?`0 8px 32px rgba(0,0,0,.5)`:' 0 4px 20px rgba(0,0,0,.4)',
        transition:'all .18s', transform:h?'translateY(-3px)':'none',
        animation:`kpi-rise .4s ${idx*.05}s both` }}>
      <div style={{ position:'absolute', left:0, top:0, bottom:0, width:3, background:color, borderRadius:'10px 0 0 10px' }}/>
      {alert&&<div style={{ position:'absolute', top:10, right:12, fontSize:14 }}>{alert}</div>}
      {icon&&<div style={{ fontSize:20, marginBottom:6, opacity:.75 }}>{icon}</div>}
      <div style={{ fontFamily:'var(--font-semi)', fontSize:9.5, fontWeight:700, letterSpacing:'2.5px', textTransform:'uppercase', color:h?C.t2:C.t3, marginBottom:7 }}>{label}</div>
      <div style={{ fontFamily:'var(--font-cond)', fontWeight:800, fontSize:30, lineHeight:1, color:h?'#fff':C.text }}>{value}</div>
      {sub&&<div style={{ fontSize:11, color:h?C.t2:C.t3, marginTop:5, lineHeight:1.5 }} dangerouslySetInnerHTML={{__html:sub}}/>}
    </div>
  );
}

function PillBtn({ active, onClick, label, color }) {
  return (
    <button onClick={onClick} style={{
      padding:'5px 14px', fontFamily:'var(--font-semi)', fontSize:10, fontWeight:700, letterSpacing:1,
      textTransform:'uppercase', cursor:'pointer', borderRadius:20,
      border:`1px solid ${active?(color||C.gold):'rgba(255,255,255,.12)'}`,
      background:active?`${(color||C.gold)}18`:'transparent',
      color:active?(color||C.gold):C.t3, transition:'all .15s',
    }}>{label}</button>
  );
}

// ── Main ────────────────────────────────────────────────────────────

export default function HubSpotPage() {
  const { activeClient } = useApp();
  const [tab,        setTab]    = useState('resumen');
  const [pipelines,  setPipes]  = useState([]);
  const [pipelineId, setPId]    = useState('');
  const [loading,    setLoad]   = useState(false);
  // Carreras filters
  const [sort,       setSort]   = useState('total');
  const [filter,     setFilter] = useState('all');
  const [sede,       setSede]   = useState('all');
  const [search,     setSearch] = useState('');
  // Asesores filter
  const [asesorF,    setAF]     = useState('all');

  useEffect(()=>{
    hubspotApi.getPipelines().then(r=>{
      const p=r.data?.pipelines||[];
      setPipes(p);
      const a=p.find(x=>x.label?.toLowerCase().includes('2026')||x.label?.toLowerCase().includes('admis'))||p[0];
      if(a) setPId(a.id);
    }).catch(()=>{});
  },[]);

  useEffect(()=>{
    if(!pipelineId) return;
    setLoad(true);
    hubspotApi.getSummary(pipelineId,30).finally(()=>setLoad(false));
  },[pipelineId]);

  // Filtered carreras
  const filteredC = useMemo(()=>{
    let rows=[...CARRERAS];
    if(search) rows=rows.filter(c=>c.n.toLowerCase().includes(search.toLowerCase()));
    if(filter==='alerta') rows=rows.filter(c=>c.conv_pct!==null&&c.conv_pct<5&&c.total>50);
    if(filter==='top')    rows=rows.filter(c=>c.conv_pct!==null&&c.conv_pct>10);
    if(filter==='conv0')  rows=rows.filter(c=>c.conv===0&&c.total>20);
    if(sede!=='all') rows=rows.filter(c=>c[sede]>0);
    rows.sort((a,b)=>{
      if(sort==='total')    return b.total-a.total;
      if(sort==='conv')     return b.conv-a.conv;
      if(sort==='conv_pct') return (b.conv_pct||0)-(a.conv_pct||0);
      if(sort==='sede')     return (b[sede]||0)-(a[sede]||0);
      return a.n.localeCompare(b.n);
    });
    return rows;
  },[sort,filter,sede,search]);

  const tabStyle = (k) => ({
    padding:'9px 18px', fontFamily:'var(--font-semi)', fontSize:11, fontWeight:700,
    letterSpacing:1.2, textTransform:'uppercase', cursor:'pointer', border:'none',
    background:tab===k?'rgba(220,161,69,.1)':'transparent',
    color:tab===k?C.gold:C.t3,
    borderBottom:tab===k?`2px solid ${C.gold}`:'2px solid transparent',
    transition:'all .15s', whiteSpace:'nowrap',
  });

  // Sede pie data
  const pieData = SEDES.filter(s=>s.key!=='sin').map(s=>({
    name:s.label, value:TOTALES_SEDE[s.key], color:s.color
  }));

  return (
    <div className="scroll-y" style={{ flex:1, padding:'22px 28px', background:'#F8F9FA' }}>

      {/* ── Header ── */}
      <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:20, flexWrap:'wrap' }}>
        <div>
          <h1 style={{ fontFamily:'var(--font-cond)', fontWeight:900, fontSize:24, letterSpacing:2, textTransform:'uppercase', color:'#111827', lineHeight:1 }}>HubSpot CRM</h1>
          <div style={{ fontFamily:'var(--font-semi)', fontSize:10, color:'#9CA3AF', letterSpacing:1.5, textTransform:'uppercase', marginTop:4 }}>
            {activeClient.name} · Admisión Pregrado 2026-II
          </div>
        </div>

        {pipelines.length>0&&(
          <select value={pipelineId} onChange={e=>setPId(e.target.value)}
            style={{ padding:'6px 14px', fontSize:11, fontFamily:'var(--font-semi)', fontWeight:700,
              borderRadius:8, background:C.goldD, borderColor:C.goldB, color:C.gold }}>
            {pipelines.map(p=><option key={p.id} value={p.id}>{p.label}</option>)}
          </select>
        )}
        {loading&&<span className="spinner"/>}

        {/* Quick KPIs strip */}
        <div style={{ marginLeft:'auto', display:'flex', gap:8, flexWrap:'wrap' }}>
          {[
            {l:'Total leads',v:'4,785',c:C.blue  },
            {l:'Calificados',v:'325',  c:C.green },
            {l:'Descalific.',v:'2,906',c:C.red   },
            {l:'Resp. prom', v:'21.1h',c:C.red   },
          ].map((s,i)=>(
            <div key={i} style={{ textAlign:'center', padding:'6px 14px', background:`${s.c}11`, border:`1px solid ${s.c}33`, borderRadius:8 }}>
              <div style={{ fontFamily:'var(--font-cond)', fontWeight:800, fontSize:18, color:s.c, lineHeight:1 }}>{s.v}</div>
              <div style={{ fontFamily:'var(--font-semi)', fontSize:9, fontWeight:700, letterSpacing:1, color:'#9CA3AF', marginTop:3, textTransform:'uppercase' }}>{s.l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Tabs ── */}
      <div style={{ display:'flex', gap:2, marginBottom:24, borderBottom:'1px solid rgba(255,255,255,.07)', overflowX:'auto' }}>
        {[
          {k:'resumen',  l:'📊 Resumen'  },
          {k:'embudo',   l:'🔻 Embudo'   },
          {k:'carreras', l:'🎓 Carreras' },
          {k:'sedes',    l:'📍 Sedes'    },
          {k:'asesores', l:'👤 Asesores' },
          {k:'canales',  l:'📡 Canales'  },
          {k:'email',    l:'✉️ Email'     },
          {k:'nurturing',l:'🔄 Nurturing' },
        ].map(t=><button key={t.k} onClick={()=>setTab(t.k)} style={tabStyle(t.k)}>{t.l}</button>)}
      </div>

      {/* ═══ TAB RESUMEN ═══ */}
      {tab==='resumen'&&(<>
        {/* Alertas */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12, marginBottom:24 }}>
          {[
            {icon:'🚨',title:'Descalificados por asesor',value:'2,906',note:'Motivo #1: asesor no actualiza HubSpot',color:C.red},
            {icon:'⚠️',title:'Atascados en Validación',  value:'1,932',note:'33% del total sin trabajar activamente', color:C.gold},
            {icon:'⏱️',title:'Tiempo promedio respuesta', value:'21.1h',note:'Objetivo <5 min · gap crítico',          color:C.red},
          ].map((a,i)=>(
            <div key={i} style={{ background:`${a.color}0D`, border:`1px solid ${a.color}40`, borderLeft:`3px solid ${a.color}`, borderRadius:10, padding:'16px 20px' }}>
              <div style={{ fontSize:20, marginBottom:6 }}>{a.icon}</div>
              <div style={{ fontFamily:'var(--font-semi)', fontSize:9.5, fontWeight:700, letterSpacing:2, textTransform:'uppercase', color:a.color, marginBottom:6 }}>{a.title}</div>
              <div style={{ fontFamily:'var(--font-cond)', fontWeight:900, fontSize:32, color:'#111827', lineHeight:1, marginBottom:6 }}>{a.value}</div>
              <div style={{ fontSize:11.5, color:'#6B7280' }}>{a.note}</div>
            </div>
          ))}
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, marginBottom:14 }}>
          <Kpi idx={0} icon="📩" label="Leads digitales totales" color={C.blue}  value="4,785" sub={`23 carreras · Meta proceso: <b>25,000</b>`}/>
          <Kpi idx={1} icon="✅" label="Matriculados Google Ads"  color={C.green} value="2"     sub={`De S/ 519,794 invertidos`} alert="⚠️"/>
          <Kpi idx={2} icon="💬" label="Prefieren WhatsApp"       color={C.gold}  value="89%"   sub={`2,162 de 2,430 contactos`}/>
          <Kpi idx={3} icon="⚡" label="Atendidos &lt;10 min"      color={C.red}   value="2"     sub={`De 549 leads a ventas · 0.36%`} alert="🚨"/>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, marginBottom:28 }}>
          <Kpi idx={4} icon="🔍" label="Google Ads inversión"  color={C.gold}  value="S/519K" sub={`72.6% del presupuesto 2026-II`}/>
          <Kpi idx={5} icon="📱" label="Meta Ads inversión"    color={C.blue}  value="S/196K" sub={`27.4% del presupuesto 2026-II`}/>
          <Kpi idx={6} icon="🌟" label="Mejor tasa conv."      color={C.green} value="29.2%"  sub={`Adm. y Neg. Int. · 7 de 24 leads`}/>
          <Kpi idx={7} icon="👻" label="Leads sin propietario" color={C.red}   value="49"     sub={`Jun 2026 · +145% vs mayo`} alert="⚠️"/>
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'3fr 2fr', gap:14, marginBottom:28 }}>
          <Card>
            <Sec text="Tendencia semanal de leads digitales"/>
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
                <Area type="monotone" dataKey="v" name="Leads" stroke={C.gold} fill="url(#gl)" strokeWidth={2.5}/>
              </AreaChart>
            </ResponsiveContainer>
            <div style={{ display:'flex', gap:20, marginTop:10, fontSize:11.5, color:'#9CA3AF' }}>
              <span>Pico: <b style={{ color:'#111827' }}>635</b> (8 jun)</span>
              <span>Prom: <b style={{ color:'#111827' }}>~430/sem</b></span>
              <span>Última: <b style={{ color:C.red }}>335 ↓47%</b></span>
            </div>
          </Card>
          <Card>
            <Sec text="Estado actual del pipeline"/>
            {ESTADOS.map((e,i)=>{
              const pct=(e.v/5930*100).toFixed(1);
              return (
                <div key={i} style={{ marginBottom:8 }}>
                  <div style={{ display:'flex', justifyContent:'space-between', fontSize:11.5, marginBottom:3 }}>
                    <span style={{ color:'#6B7280', fontFamily:'var(--font-semi)', fontWeight:600 }}>{e.e}</span>
                    <div style={{ display:'flex', gap:8 }}>
                      <span style={{ color:'#9CA3AF', fontSize:10 }}>{pct}%</span>
                      <span style={{ fontFamily:'var(--font-cond)', fontWeight:800, fontSize:16, color:'#111827', minWidth:38, textAlign:'right' }}>{e.v.toLocaleString()}</span>
                    </div>
                  </div>
                  <div style={{ background:'#F3F4F6', borderRadius:3, height:22, overflow:'hidden' }}>
                    <div style={{ width:`${pct}%`, height:'100%', background:e.color, opacity:.8, borderRadius:3 }}/>
                  </div>
                </div>
              );
            })}
          </Card>
        </div>
      </>)}

      {/* ═══ TAB EMBUDO ═══ */}
      {tab==='embudo'&&(<>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:10, marginBottom:24 }}>
          {FUNNEL.map(f=>(
            <div key={f.key} style={{ background:`${f.color}11`, border:`1px solid ${f.color}33`, borderRadius:10, padding:'14px 18px', textAlign:'center' }}>
              <div style={{ fontSize:22, marginBottom:6 }}>{f.icon}</div>
              <div style={{ fontFamily:'var(--font-cond)', fontWeight:900, fontSize:32, color:f.color, lineHeight:1 }}>{f.v.toLocaleString()}</div>
              <div style={{ fontFamily:'var(--font-semi)', fontSize:9.5, fontWeight:700, letterSpacing:1.5, textTransform:'uppercase', color:'#9CA3AF', marginTop:5 }}>{f.label}</div>
            </div>
          ))}
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'5fr 3fr', gap:16, marginBottom:24 }}>
          <Card>
            <Sec text="Embudo visual · Admisión Pregrado 2026-II"/>
            {(() => {
              const max=FUNNEL[0].v;
              return FUNNEL.map((f,i)=>{
                const pct=Math.max((f.v/max)*100,8);
                const prev=i>0?FUNNEL[i-1].v:null;
                const conv=prev?((f.v/prev)*100).toFixed(1):null;
                return (
                  <div key={f.key} style={{ marginBottom:i<FUNNEL.length-1?8:0 }}>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:6 }}>
                      <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                        <span style={{ fontSize:18 }}>{f.icon}</span>
                        <span style={{ fontFamily:'var(--font-semi)', fontWeight:700, fontSize:14, color:'#6B7280' }}>{f.label}</span>
                      </div>
                      <div style={{ display:'flex', gap:12, alignItems:'center' }}>
                        {conv&&(
                          <span style={{ fontFamily:'var(--font-semi)', fontSize:11, fontWeight:700,
                            color:parseFloat(conv)>50?C.green:parseFloat(conv)>25?C.gold:C.red,
                            background:'#F3F4F6', padding:'2px 9px', borderRadius:20 }}>
                            {conv}% conv.
                          </span>
                        )}
                        <span style={{ fontFamily:'var(--font-cond)', fontWeight:900, fontSize:28, color:'#111827', minWidth:65, textAlign:'right' }}>
                          {f.v.toLocaleString()}
                        </span>
                      </div>
                    </div>
                    <div style={{ background:'#F3F4F6', borderRadius:6, height:48, overflow:'hidden' }}>
                      <div style={{ width:`${pct}%`, height:'100%', borderRadius:6,
                        background:`linear-gradient(90deg,${f.color}77,${f.color})`,
                        display:'flex', alignItems:'center', paddingLeft:16,
                        fontFamily:'var(--font-semi)', fontSize:11.5, fontWeight:600, color:'rgba(255,255,255,.9)',
                        transition:'width .9s cubic-bezier(.16,1,.3,1)' }}>
                        {f.v>0&&`${pct.toFixed(0)}%`}
                      </div>
                    </div>
                    {i<FUNNEL.length-1&&<div style={{ marginLeft:26, height:10, borderLeft:'1px dashed rgba(255,255,255,.1)' }}/>}
                  </div>
                );
              });
            })()}
          </Card>

          <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
            <Card>
              <Sec text="Tiempos de cierre"/>
              {[
                {e:'Interesado → Inscrito',  d:'3.7', dir:'ok',  dt:'estable'},
                {e:'Inscrito → Ingresante',  d:'22.7',dir:'bad', dt:'+521%'},
                {e:'Ingresante → Pagante',   d:'1.3', dir:'good',dt:'-94%'},
                {e:'Total → Matrícula',      d:'24.1',dir:'bad', dt:'+1,704%'},
              ].map((t,i)=>(
                <div key={i} style={{ display:'flex', justifyContent:'space-between', alignItems:'center',
                  padding:'10px 0', borderBottom:i<3?'1px solid rgba(255,255,255,.05)':undefined }}>
                  <span style={{ fontSize:11.5, color:'#6B7280' }}>{t.e}</span>
                  <div style={{ textAlign:'right' }}>
                    <div style={{ fontFamily:'var(--font-cond)', fontWeight:800, fontSize:22,
                      color:t.dir==='good'?C.green:t.dir==='bad'?C.red:C.text }}>{t.d}d</div>
                    <div style={{ fontSize:10, color:t.dir==='good'?C.green:t.dir==='bad'?C.red:C.t3, fontFamily:'var(--font-semi)', fontWeight:600 }}>{t.dt}</div>
                  </div>
                </div>
              ))}
            </Card>
            <Card>
              <Sec text="Google Ads · Funnel" action={<span style={{ fontSize:10, color:'#9CA3AF' }}>S/ 519,794</span>}/>
              {[{s:'Interesado',v:20},{s:'Inscrito',v:23},{s:'Ingresante',v:12},{s:'Pagante',v:22},{s:'Matriculado',v:2}].map((r,i,a)=>(
                <div key={r.s} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
                  <span style={{ fontSize:11.5, color:r.s==='Matriculado'?C.green:C.t2 }}>{r.s}</span>
                  <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                    <div style={{ width:80, background:'#F3F4F6', borderRadius:3, height:6 }}>
                      <div style={{ width:`${(r.v/a[0].v)*100}%`, height:'100%', borderRadius:3, background:r.s==='Matriculado'?C.green:C.gold }}/>
                    </div>
                    <span style={{ fontFamily:'var(--font-cond)', fontWeight:800, fontSize:20, color:r.s==='Matriculado'?C.green:'#fff', minWidth:28, textAlign:'right' }}>{r.v}</span>
                  </div>
                </div>
              ))}
              <div style={{ marginTop:10, padding:'10px 12px', background:C.redD, border:`1px solid ${C.red}33`, borderRadius:8, fontSize:11.5, color:'#6B7280' }}>
                ⚠️ <strong style={{ color:C.red }}>S/259,897 por matriculado</strong> — verificar atribución
              </div>
            </Card>
          </div>
        </div>
      </>)}

      {/* ═══ TAB CARRERAS ═══ */}
      {tab==='carreras'&&(<>
        {/* Filter bar */}
        <div style={{ display:'flex', gap:8, marginBottom:18, alignItems:'center', flexWrap:'wrap' }}>
          <input value={search} onChange={e=>setSearch(e.target.value)}
            placeholder="Buscar carrera..." style={{ width:200, padding:'7px 12px', fontSize:12 }}/>
          <div style={{ display:'flex', gap:5, flexWrap:'wrap' }}>
            <PillBtn active={filter==='all'}    onClick={()=>setFilter('all')}    label="Todas"/>
            <PillBtn active={filter==='top'}    onClick={()=>setFilter('top')}    label="🏆 Top conv." color={C.green}/>
            <PillBtn active={filter==='alerta'} onClick={()=>setFilter('alerta')} label="🚨 Alerta"    color={C.red}/>
            <PillBtn active={filter==='conv0'}  onClick={()=>setFilter('conv0')}  label="0 conv."       color={C.gold}/>
          </div>
          <span style={{ fontSize:11, color:'#9CA3AF', marginLeft:8 }}>Ordenar:</span>
          <div style={{ display:'flex', gap:5 }}>
            <PillBtn active={sort==='total'}    onClick={()=>setSort('total')}    label="Leads"/>
            <PillBtn active={sort==='conv'}     onClick={()=>setSort('conv')}     label="Conv."/>
            <PillBtn active={sort==='conv_pct'} onClick={()=>setSort('conv_pct')} label="Tasa %"/>
          </div>
        </div>

        {/* Charts */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, marginBottom:20 }}>
          <Card>
            <Sec text="Top 10 · Leads totales"/>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={[...CARRERAS].sort((a,b)=>b.total-a.total).slice(0,10)} layout="vertical" barSize={16}>
                <XAxis type="number" tick={{ fontSize:9, fill:C.t3 }} axisLine={false} tickLine={false}/>
                <YAxis type="category" dataKey="n" tick={{ fontSize:9, fill:C.t2, fontFamily:'var(--font-semi)' }} axisLine={false} tickLine={false} width={130}/>
                <Tooltip content={<Tip/>}/>
                <Bar dataKey="total" name="Leads" fill={C.blue} opacity={.85} radius={[0,4,4,0]}/>
              </BarChart>
            </ResponsiveContainer>
          </Card>
          <Card>
            <Sec text="Top 10 · Convertidos"/>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={[...CARRERAS].sort((a,b)=>b.conv-a.conv).filter(c=>c.conv>0).slice(0,10)} layout="vertical" barSize={16}>
                <XAxis type="number" tick={{ fontSize:9, fill:C.t3 }} axisLine={false} tickLine={false}/>
                <YAxis type="category" dataKey="n" tick={{ fontSize:9, fill:C.t2, fontFamily:'var(--font-semi)' }} axisLine={false} tickLine={false} width={130}/>
                <Tooltip content={<Tip/>}/>
                <Bar dataKey="conv" name="Conv." fill={C.green} opacity={.85} radius={[0,4,4,0]}/>
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </div>

        {/* Full table */}
        <Card p={0}>
          <div style={{ padding:'12px 20px', borderBottom:'1px solid rgba(255,255,255,.07)', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <span style={{ fontFamily:'var(--font-semi)', fontSize:10, fontWeight:700, letterSpacing:2, textTransform:'uppercase', color:'#6B7280' }}>
              {filteredC.length} carreras · {filteredC.reduce((s,c)=>s+c.total,0).toLocaleString()} leads · {filteredC.reduce((s,c)=>s+c.conv,0)} conv.
            </span>
          </div>
          <table className="table">
            <thead>
              <tr>
                <th style={{ textAlign:'left' }}>CARRERA</th>
                <th style={{ textAlign:'right', cursor:'pointer', color:sort==='total'?C.gold:undefined }} onClick={()=>setSort('total')}>LEADS ↕</th>
                <th style={{ textAlign:'right', cursor:'pointer', color:sort==='conv'?C.gold:undefined  }} onClick={()=>setSort('conv')}>CONV. ↕</th>
                <th style={{ textAlign:'right', cursor:'pointer', color:sort==='conv_pct'?C.gold:undefined }} onClick={()=>setSort('conv_pct')}>TASA ↕</th>
                <th style={{ textAlign:'center' }}>SEDE PRINCIPAL</th>
                <th style={{ textAlign:'center' }}>ESTADO</th>
              </tr>
            </thead>
            <tbody>
              {filteredC.map(c=>{
                const t=c.conv_pct;
                const col=t===null?C.t3:t>10?C.green:t>5?C.gold:C.red;
                const icon=t===null?'—':t>10?'🏆':t>5?'✅':c.total>100?'🚨':'⚠️';
                // Find main sede
                const mainSede=SEDES.reduce((m,s)=>((c[s.key]||0)>(c[m.key]||0)?s:m),SEDES[0]);
                return (
                  <tr key={c.n}>
                    <td style={{ fontWeight:600, color:'#111827', maxWidth:200, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{c.n}</td>
                    <td style={{ textAlign:'right', fontFamily:'var(--mono)' }}>{c.total.toLocaleString()}</td>
                    <td style={{ textAlign:'right', fontWeight:700, color:c.conv>0?C.green:C.t3 }}>{c.conv>0?c.conv:'—'}</td>
                    <td style={{ textAlign:'right' }}>
                      {t!==null?<span style={{ color:col, fontWeight:700 }}>{t.toFixed(1)}%</span>:<span style={{ color:'#9CA3AF' }}>—</span>}
                    </td>
                    <td style={{ textAlign:'center' }}>
                      <span style={{ fontFamily:'var(--font-semi)', fontSize:10, color:mainSede.color, background:`${mainSede.color}15`, padding:'2px 8px', borderRadius:20, fontWeight:700 }}>
                        {mainSede.label} ({c[mainSede.key]})
                      </span>
                    </td>
                    <td style={{ textAlign:'center', fontSize:14 }}>{icon}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>
      </>)}

      {/* ═══ TAB SEDES ═══ */}
      {tab==='sedes'&&(<>
        <Sec text="Leads por sede · 4,785 totales"/>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12, marginBottom:24 }}>
          {SEDES.filter(s=>s.key!=='sin').map((s,i)=>(
            <Kpi key={s.key} idx={i} label={`Sede ${s.label}`} color={s.color}
              value={TOTALES_SEDE[s.key].toLocaleString()}
              sub={`${((TOTALES_SEDE[s.key]/TOTALES_SEDE.total)*100).toFixed(1)}% del total`}/>
          ))}
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, marginBottom:20 }}>
          <Card>
            <Sec text="Distribución por sede"/>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={80} dataKey="value" paddingAngle={3}>
                  {pieData.map((d,i)=><Cell key={i} fill={d.color}/>)}
                </Pie>
                <Tooltip formatter={v=>`${v.toLocaleString()} leads`} contentStyle={{ background:'#fff', border:`1px solid ${C.goldB}`, fontSize:12, borderRadius:8 }}/>
                <Legend iconType="circle" iconSize={7} wrapperStyle={{ fontFamily:'var(--font-semi)', fontSize:10.5 }}/>
              </PieChart>
            </ResponsiveContainer>
          </Card>

          <Card>
            <Sec text="Barras por sede"/>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={SEDES.filter(s=>s.key!=='sin').map(s=>({ name:s.label, leads:TOTALES_SEDE[s.key], fill:s.color }))} barSize={28}>
                <XAxis dataKey="name" tick={{ fontSize:9.5, fill:C.t2 }} axisLine={false} tickLine={false}/>
                <YAxis tick={{ fontSize:9, fill:C.t3 }} axisLine={false} tickLine={false}/>
                <Tooltip content={<Tip/>}/>
                {SEDES.filter(s=>s.key!=='sin').map(s=>(
                  <Bar key={s.key} dataKey={s.key} name={s.label} fill={s.color} hide/>
                ))}
                <Bar dataKey="leads" name="Leads" radius={[4,4,0,0]}>
                  {SEDES.filter(s=>s.key!=='sin').map((s,i)=><Cell key={i} fill={s.color} opacity={.85}/>)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </div>

        {/* Tabla por sede */}
        <div style={{ display:'flex', gap:6, marginBottom:16, flexWrap:'wrap' }}>
          <PillBtn active={sede==='all'} onClick={()=>setSede('all')} label="Todas"/>
          {SEDES.filter(s=>s.key!=='sin').map(s=>(
            <PillBtn key={s.key} active={sede===s.key} onClick={()=>setSede(s.key)} label={s.label} color={s.color}/>
          ))}
        </div>

        <Card p={0}>
          <div style={{ padding:'12px 20px', borderBottom:'1px solid rgba(255,255,255,.07)' }}>
            <span style={{ fontFamily:'var(--font-semi)', fontSize:10, fontWeight:700, letterSpacing:2, textTransform:'uppercase', color:'#6B7280' }}>
              LEADS POR CARRERA Y SEDE
            </span>
          </div>
          <div style={{ overflowX:'auto' }}>
            <table className="table" style={{ minWidth:700 }}>
              <thead>
                <tr>
                  <th style={{ textAlign:'left' }}>CARRERA</th>
                  <th style={{ textAlign:'right', color:C.blue   }}>CHORRILLOS</th>
                  <th style={{ textAlign:'right', color:C.indigo }}>SAN BORJA</th>
                  <th style={{ textAlign:'right', color:C.purple }}>ICA</th>
                  <th style={{ textAlign:'right', color:C.gold   }}>CHINCHA</th>
                  <th style={{ textAlign:'right', color:C.green  }}>A DIST.</th>
                  <th style={{ textAlign:'right', fontWeight:700  }}>TOTAL</th>
                </tr>
              </thead>
              <tbody>
                {(sede==='all'?CARRERAS:[...CARRERAS].filter(c=>c[sede]>0).sort((a,b)=>b[sede]-a[sede])).map(c=>(
                  <tr key={c.n}>
                    <td style={{ fontWeight:500, color:'#111827' }}>{c.n}</td>
                    <td style={{ textAlign:'right', color:c.chorrillos>0?C.blue:C.t3   }}>{c.chorrillos||'—'}</td>
                    <td style={{ textAlign:'right', color:c.sanborja>0?C.indigo:C.t3   }}>{c.sanborja||'—'}</td>
                    <td style={{ textAlign:'right', color:c.ica>0?C.purple:C.t3        }}>{c.ica||'—'}</td>
                    <td style={{ textAlign:'right', color:c.chincha>0?C.gold:C.t3      }}>{c.chincha||'—'}</td>
                    <td style={{ textAlign:'right', color:c.distancia>0?C.green:C.t3   }}>{c.distancia||'—'}</td>
                    <td style={{ textAlign:'right', fontWeight:700, color:'#111827'       }}>{c.total.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr style={{ background:'rgba(220,161,69,.05)', borderTop:'1px solid rgba(220,161,69,.2)' }}>
                  <td style={{ fontWeight:800, color:C.gold, fontFamily:'var(--font-semi)', fontSize:11 }}>TOTAL</td>
                  <td style={{ textAlign:'right', fontWeight:700, color:C.blue   }}>1,041</td>
                  <td style={{ textAlign:'right', fontWeight:700, color:C.indigo }}>754</td>
                  <td style={{ textAlign:'right', fontWeight:700, color:C.purple }}>1,360</td>
                  <td style={{ textAlign:'right', fontWeight:700, color:C.gold   }}>332</td>
                  <td style={{ textAlign:'right', fontWeight:700, color:C.green  }}>658</td>
                  <td style={{ textAlign:'right', fontWeight:800, color:'#111827'   }}>4,785</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </Card>
      </>)}

      {/* ═══ TAB ASESORES ═══ */}
      {tab==='asesores'&&(<>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, marginBottom:24 }}>
          <Kpi idx={0} icon="📨" label="Enviados a ventas"    color={C.blue}  value="549"    sub="Este trimestre"/>
          <Kpi idx={1} icon="✋" label="Atendidos por humano" color={C.gold}  value="168"    sub="31% del total"/>
          <Kpi idx={2} icon="⚡" label="Atendidos &lt;10 min" color={C.red}   value="2"      sub="0.36% de 549" alert="🚨"/>
          <Kpi idx={3} icon="⏱️" label="Tiempo prom. respuesta" color={C.red} value="21.1h" sub="Objetivo: &lt;5 min" alert="🚨"/>
        </div>

        <div style={{ display:'flex', gap:6, marginBottom:16 }}>
          <PillBtn active={asesorF==='all'}    onClick={()=>setAF('all')}    label="Todos"/>
          <PillBtn active={asesorF==='alerta'} onClick={()=>setAF('alerta')} label="🚨 Con olvidos" color={C.red}/>
          <PillBtn active={asesorF==='ok'}     onClick={()=>setAF('ok')}     label="✅ Sin olvidos"  color={C.green}/>
        </div>

        <Card p={0} style={{ marginBottom:20 }}>
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
              {[
                {n:'Alessandra Pérez', asig:165, atend:60, olvido:4},
                {n:'Julio Lamadrid',   asig:138, atend:34, olvido:3},
                {n:'Lesly Cullampe',   asig:130, atend:0,  olvido:0},
                {n:'Oscar Silva',      asig:16,  atend:16, olvido:1},
                {n:'Leonela Aponte',   asig:13,  atend:14, olvido:2},
                {n:'Wilson Cieza',     asig:0,   atend:10, olvido:8},
              ].filter(a=>asesorF==='alerta'?a.olvido>=3:asesorF==='ok'?a.olvido<3:true)
              .map((a,i)=>{
                const t=a.asig>0?((a.atend/a.asig)*100).toFixed(0):'—';
                const tN=parseInt(t)||0;
                return (
                  <tr key={i}>
                    <td style={{ fontWeight:600, color:'#111827' }}>{a.n}</td>
                    <td style={{ textAlign:'right' }}>{a.asig||'—'}</td>
                    <td style={{ textAlign:'right', color:C.green, fontWeight:700 }}>{a.atend}</td>
                    <td style={{ textAlign:'right', color:a.olvido>=8?C.red:a.olvido>=3?C.gold:C.t3, fontWeight:700 }}>{a.olvido}</td>
                    <td style={{ textAlign:'right' }}>
                      {t!=='—'?<span style={{ color:tN>50?C.green:tN>25?C.gold:C.red, fontWeight:700 }}>{t}%</span>:<span style={{ color:'#9CA3AF' }}>—</span>}
                    </td>
                    <td style={{ textAlign:'center', fontSize:14 }}>{a.olvido>=8?'🚨':a.olvido>=3?'⚠️':'✅'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>

        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
          <Card style={{ textAlign:'center' }}>
            <Sec text="Atendidos en menos de 10 minutos"/>
            <div style={{ padding:'16px 0' }}>
              <div style={{ fontFamily:'var(--font-cond)', fontWeight:900, fontSize:72, color:C.red, lineHeight:1 }}>2</div>
              <div style={{ fontSize:12, color:'#9CA3AF', marginTop:8 }}>de 549 leads enviados a ventas</div>
              <div style={{ marginTop:16, padding:'12px', background:C.redD, border:`1px solid ${C.red}33`, borderRadius:8, fontSize:12, color:'#6B7280' }}>
                Solo el <strong style={{ color:C.red }}>0.36%</strong> fue contactado en los primeros 10 minutos
              </div>
            </div>
          </Card>
          <Card>
            <Sec text="Motivos de descalificación"/>
            {[
              {m:'Asesor no cambia estado',n:2390,color:C.red   },
              {m:'Intento límite',          n:120, color:C.gold  },
              {m:'Sin motivo registrado',   n:73,  color:'#9CA3AF'   },
              {m:'Clases a distancia',      n:63,  color:C.blue  },
              {m:'Eligió otra universidad', n:58,  color:C.indigo},
              {m:'Factor económico',        n:52,  color:'#9CA3AF'   },
              {m:'Proceso concluido',       n:29,  color:'#9CA3AF'   },
            ].map((m,i)=>(
              <div key={i} style={{ display:'flex', justifyContent:'space-between', alignItems:'center',
                marginBottom:8, paddingBottom:8, borderBottom:i<6?'1px solid rgba(255,255,255,.04)':undefined }}>
                <span style={{ fontSize:11.5, color:i===0?C.text:C.t2, fontWeight:i===0?700:400 }}>{m.m}</span>
                <span style={{ fontFamily:'var(--font-cond)', fontWeight:800, fontSize:20, color:m.color }}>{m.n.toLocaleString()}</span>
              </div>
            ))}
          </Card>
        </div>
      </>)}

      {/* ═══ TAB CANALES ═══ */}
      {tab==='canales'&&(<>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, marginBottom:24 }}>
          <Kpi idx={0} icon="🔍" label="Google leads"   color={C.gold}  value="3,254" sub="55% del total digital"/>
          <Kpi idx={1} icon="📘" label="Meta/CTWA"      color={C.blue}  value="1,531" sub="26% · medio ctwa"/>
          <Kpi idx={2} icon="🌱" label="Orgánico"       color={C.green} value="577"   sub="9.7% del total"/>
          <Kpi idx={3} icon="❓" label="Sin UTM"         color={C.red}   value="105"   sub="Sin atribución" alert="⚠️"/>
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, marginBottom:20 }}>
          <Card>
            <Sec text="Leads por fuente de tráfico"/>
            {[
              {n:'Google (Búsqueda pago)',v:3254,color:C.gold  },
              {n:'Meta / Redes sociales', v:1531,color:C.blue  },
              {n:'Búsqueda orgánica',     v:577, color:C.green },
              {n:'Tráfico org. social',   v:231, color:C.indigo},
              {n:'Sin UTM / valor',       v:337, color:'#9CA3AF'    },
            ].map((f,i)=>{
              const pct=(f.v/5930*100).toFixed(1);
              return (
                <div key={i} style={{ marginBottom:12 }}>
                  <div style={{ display:'flex', justifyContent:'space-between', fontSize:12, marginBottom:4 }}>
                    <span style={{ color:'#6B7280', fontFamily:'var(--font-semi)', fontWeight:600 }}>{f.n}</span>
                    <div style={{ display:'flex', gap:10 }}>
                      <span style={{ color:'#9CA3AF', fontSize:10.5 }}>{pct}%</span>
                      <span style={{ fontFamily:'var(--font-cond)', fontWeight:800, fontSize:18, color:'#111827' }}>{f.v.toLocaleString()}</span>
                    </div>
                  </div>
                  <div style={{ background:'#F3F4F6', borderRadius:4, height:28, overflow:'hidden' }}>
                    <div style={{ width:`${pct}%`, height:'100%', borderRadius:4, background:f.color, opacity:.8 }}/>
                  </div>
                </div>
              );
            })}
          </Card>
          <Card>
            <Sec text="Calidad por canal"/>
            <table className="table">
              <thead>
                <tr>
                  <th style={{ textAlign:'left' }}>CANAL</th>
                  <th style={{ textAlign:'right' }}>LEADS</th>
                  <th style={{ textAlign:'right' }}>CALIFIC.</th>
                  <th style={{ textAlign:'right' }}>TASA</th>
                </tr>
              </thead>
              <tbody>
                {[
                  {c:'Google Search',l:3254,cal:136,desc:1732},
                  {c:'Meta / CTWA',  l:1531,cal:63, desc:709 },
                  {c:'Orgánico',     l:577, cal:93, desc:319 },
                  {c:'Org. Social',  l:231, cal:30, desc:132 },
                ].map((r,i)=>{
                  const t=((r.cal/r.l)*100).toFixed(1);
                  return (
                    <tr key={i}>
                      <td style={{ color:'#111827', fontWeight:500 }}>{r.c}</td>
                      <td style={{ textAlign:'right', fontFamily:'var(--mono)' }}>{r.l.toLocaleString()}</td>
                      <td style={{ textAlign:'right', color:C.green, fontWeight:700 }}>{r.cal}</td>
                      <td style={{ textAlign:'right' }}>
                        <span style={{ color:parseFloat(t)>10?C.green:parseFloat(t)>5?C.gold:C.red, fontWeight:700 }}>{t}%</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <div style={{ marginTop:14, padding:'12px', background:C.greenD, border:`1px solid ${C.green}33`, borderRadius:8, fontSize:12, color:'#6B7280' }}>
              💡 Orgánico califica mejor (16.1%) — considera SEO como estrategia de calidad vs volumen.
            </div>
          </Card>
        </div>

        <Card p={0}>
          <div style={{ padding:'12px 20px', borderBottom:'1px solid rgba(255,255,255,.07)' }}>
            <span style={{ fontFamily:'var(--font-semi)', fontSize:10, fontWeight:700, letterSpacing:2, textTransform:'uppercase', color:'#6B7280' }}>
              DESGLOSE UTM · 1,132 contactos con tracking
            </span>
          </div>
          <table className="table">
            <thead>
              <tr>
                <th style={{ textAlign:'left' }}>UTM SOURCE</th>
                <th style={{ textAlign:'left' }}>UTM MEDIUM</th>
                <th style={{ textAlign:'right' }}>CONTACTOS</th>
                <th style={{ textAlign:'right' }}>% UTM</th>
                <th style={{ textAlign:'center' }}>CANAL</th>
              </tr>
            </thead>
            <tbody>
              {[
                {src:'facebook',   med:'ctwa',n:952,pct:84.1,canal:'Meta WhatsApp'},
                {src:'meta',       med:'ctwa',n:40, pct:3.5, canal:'Meta WA directo'},
                {src:'instagram',  med:'ctwa',n:34, pct:3.0, canal:'Instagram WA'},
                {src:'teads',      med:'ctwp',n:1,  pct:0.1, canal:'Teads display'},
                {src:'(Sin valor)',med:'—',   n:105,pct:9.3, canal:'Sin trackear ⚠️'},
              ].map((r,i)=>(
                <tr key={i}>
                  <td style={{ color:'#111827', fontWeight:500 }}>{r.src}</td>
                  <td style={{ color:'#9CA3AF' }}>{r.med}</td>
                  <td style={{ textAlign:'right', fontFamily:'var(--mono)', fontWeight:700 }}>{r.n.toLocaleString()}</td>
                  <td style={{ textAlign:'right' }}>
                    <span style={{ color:r.pct>50?C.gold:r.pct>5?C.t2:C.t3, fontWeight:r.pct>50?700:400 }}>{r.pct}%</span>
                  </td>
                  <td style={{ textAlign:'center', fontSize:12, color:'#6B7280' }}>{r.canal}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ padding:'12px 20px', borderTop:'1px solid rgba(255,255,255,.07)', fontSize:11.5, color:'#9CA3AF' }}>
            ⚠️ <strong style={{ color:C.gold }}>Facebook CTWA domina con 84.1%</strong> del volumen WhatsApp trackeado.
          </div>
        </Card>
      </>)}

      {/* TAB EMAIL MARKETING */}
      {tab==='email'&&<EmailMarketing/>}

      {/* TAB LEAD NURTURING */}
      {tab==='nurturing'&&<LeadNurturing/>}
    </div>
  );
}
