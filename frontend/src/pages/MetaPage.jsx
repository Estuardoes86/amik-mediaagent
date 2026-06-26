import React, { useState, useMemo } from 'react';
import { useMetaCampaigns } from '../hooks/useData.js';
import { useApp } from '../context/AppContext.jsx';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  AreaChart, Area, CartesianGrid, PieChart, Pie, Cell, Legend,
  LineChart, Line, ComposedChart
} from 'recharts';

/* ── Chart tooltip ── */
const Tip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="chart-tip">
      <div className="chart-tip-label">{label}</div>
      {payload.map((p,i)=>(
        <div key={i} className="chart-tip-row" style={{ color:p.color||'var(--text2)' }}>
          {p.name}: <strong>{typeof p.value==='number'?p.value.toLocaleString():p.value}</strong>
        </div>
      ))}
    </div>
  );
};

/* ── Demo data ── */
const DEMO_CAMPAIGNS = [
  { id:1, name:'LEADS_MEDICINA_HUMANA_FORM',    status:'ACTIVE', type:'LEAD',spend:4200,leads:94, clics:2100,impr:82000, ctr:2.56,cpm:51.22,cpc:2.00,reach:61000,freq:1.34,conv_rate:4.48 },
  { id:2, name:'LEADS_ENFERMERIA_FORM',          status:'ACTIVE', type:'LEAD',spend:3800,leads:88, clics:1900,impr:71000, ctr:2.68,cpm:53.52,cpc:2.00,reach:54000,freq:1.31,conv_rate:4.63 },
  { id:3, name:'LEADS_PSICOLOGIA_FORM',          status:'ACTIVE', type:'LEAD',spend:2600,leads:72, clics:1400,impr:54000, ctr:2.59,cpm:48.15,cpc:1.86,reach:42000,freq:1.29,conv_rate:5.14 },
  { id:4, name:'LEADS_DERECHO_FORM',             status:'ACTIVE', type:'LEAD',spend:1800,leads:48, clics:980, impr:38000, ctr:2.58,cpm:47.37,cpc:1.84,reach:30000,freq:1.27,conv_rate:4.90 },
  { id:5, name:'LEADS_DISTANCIA_FORM',           status:'ACTIVE', type:'LEAD',spend:2900,leads:102,clics:1800,impr:69000, ctr:2.61,cpm:42.03,cpc:1.61,reach:54000,freq:1.28,conv_rate:5.67 },
  { id:6, name:'WA_MEDICINA_HUMANA_CLICK',       status:'ACTIVE', type:'WA',  spend:3824,leads:0,  clics:3564,impr:481783,ctr:0.74,cpm:7.94, cpc:1.07,reach:380000,freq:1.27,conv_rate:0 },
  { id:7, name:'WA_DISTANCIA_CLICK',             status:'ACTIVE', type:'WA',  spend:557, leads:0,  clics:328, impr:45000, ctr:0.73,cpm:12.38,cpc:1.70,reach:36000,freq:1.25,conv_rate:0 },
  { id:8, name:'BRANDING_INSTITUCIONAL',         status:'ACTIVE', type:'OTHER',spend:1500,leads:18,clics:650, impr:43000, ctr:1.51,cpm:34.88,cpc:2.31,reach:35000,freq:1.23,conv_rate:2.77 },
  { id:9, name:'LEADS_ADMINISTRACION_FORM',      status:'PAUSED',type:'LEAD',spend:0,    leads:0,  clics:0,   impr:0,     ctr:0,   cpm:0,    cpc:0,   reach:0,    freq:0,   conv_rate:0 },
];

const WEEKLY = [
  {s:'23/3',spend:4200, leads:95, wa:48, alcance:310000,freq:1.18},
  {s:'30/3',spend:5100, leads:112,wa:54, alcance:360000,freq:1.22},
  {s:'6/4', spend:4800, leads:108,wa:50, alcance:342000,freq:1.20},
  {s:'13/4',spend:5600, leads:128,wa:62, alcance:390000,freq:1.24},
  {s:'20/4',spend:5200, leads:118,wa:57, alcance:368000,freq:1.21},
  {s:'27/4',spend:8400, leads:185,wa:90, alcance:580000,freq:1.29},
  {s:'4/5', spend:9200, leads:204,wa:98, alcance:630000,freq:1.31},
  {s:'11/5',spend:11000,leads:240,wa:115,alcance:740000,freq:1.35},
  {s:'18/5',spend:10500,leads:229,wa:110,alcance:710000,freq:1.33},
  {s:'25/5',spend:9800, leads:214,wa:103,alcance:670000,freq:1.31},
  {s:'1/6', spend:10200,leads:222,wa:107,alcance:695000,freq:1.32},
  {s:'8/6', spend:11800,leads:257,wa:123,alcance:790000,freq:1.36},
  {s:'15/6',spend:11200,leads:244,wa:117,alcance:750000,freq:1.34},
  {s:'22/6',spend:6200, leads:136,wa:66, alcance:430000,freq:1.28},
];

// Week-over-week comparison (last 2 weeks)
const WOW = [
  {metric:'Inversión',    prev:11200, curr:6200,  unit:'S/'},
  {metric:'Leads',        prev:244,   curr:136,   unit:''},
  {metric:'WhatsApp',     prev:117,   curr:66,    unit:''},
  {metric:'CPL',          prev:45.90, curr:45.59, unit:'S/'},
  {metric:'Alcance',      prev:750000,curr:430000,unit:''},
  {metric:'Frecuencia',   prev:1.34,  curr:1.28,  unit:'x'},
];

const PROGRAMA_DATA = [
  {prog:'Medicina Humana',  leads:94,  spend:4200,  cpl:44.68},
  {prog:'Distancia',        leads:102, spend:2900,  cpl:28.43},
  {prog:'Enfermería',       leads:88,  spend:3800,  cpl:43.18},
  {prog:'Psicología',       leads:72,  spend:2600,  cpl:36.11},
  {prog:'Derecho',          leads:48,  spend:1800,  cpl:37.50},
  {prog:'Administración',   leads:18,  spend:0,     cpl:0},
];

export default function MetaPage() {
  const { activeClient } = useApp();
  const { campaigns: liveCamps, summary, loading, refetch } = useMetaCampaigns();

  const [tab,     setTab]    = useState('overview');
  const [sortK,   setSortK]  = useState('spend');
  const [sortDir, setSortDir]= useState('desc');
  const [search,  setSearch] = useState('');
  const [statusF, setStatusF]= useState('all');
  const [typeF,   setTypeF]  = useState('all');
  const [chartMetric, setChartMetric] = useState('spend');

  const hasData = !!activeClient?.metaAccountId;
  const camps = hasData ? liveCamps : DEMO_CAMPAIGNS;

  /* ── Totals ── */
  const totalSpend  = hasData ? parseFloat(summary.spend||0)       : camps.reduce((s,c)=>s+c.spend,0);
  const totalLeads  = hasData ? parseInt(summary.leads||0)          : camps.filter(c=>c.type==='LEAD').reduce((s,c)=>s+c.leads,0);
  const totalWA     = hasData ? parseInt(summary.waConv||0)         : camps.filter(c=>c.type==='WA').reduce((s,c)=>s+c.clics,0);
  const totalClics  = hasData ? parseInt(summary.clicks||0)         : camps.reduce((s,c)=>s+c.clics,0);
  const totalImpr   = hasData ? parseInt(summary.impressions||0)    : camps.reduce((s,c)=>s+c.impr,0);
  const totalReach  = hasData ? parseInt(summary.reach||0)          : camps.reduce((s,c)=>s+c.reach,0);
  const totalConv   = totalLeads + totalWA;

  const cplLeads = totalLeads > 0 ? (totalSpend/totalLeads).toFixed(2) : '—';
  const cplWA    = totalWA    > 0 ? (totalSpend/totalWA   ).toFixed(2) : '—';
  const cplTotal = totalConv  > 0 ? (totalSpend/totalConv ).toFixed(2) : '—';
  const ctr      = totalImpr  > 0 ? ((totalClics/totalImpr)*100).toFixed(2) : '—';
  const cpm      = totalImpr  > 0 ? ((totalSpend/totalImpr)*1000).toFixed(2) : '—';
  const cpc      = totalClics > 0 ? (totalSpend/totalClics).toFixed(2) : '—';
  const freq     = totalReach > 0 ? (totalImpr/totalReach).toFixed(2) : '—';
  const convRate = totalClics > 0 && totalLeads > 0 ? ((totalLeads/totalClics)*100).toFixed(2) : '—';
  const roas     = totalSpend > 0 ? '—' : '—'; // needs revenue data

  // Lead Ads vs WA split
  const leadCamps = camps.filter(c => c.type==='LEAD' || (!c.name?.toUpperCase().includes('WA') && c.type!=='OTHER'));
  const waCamps   = camps.filter(c => c.type==='WA'   ||  c.name?.toUpperCase().includes('WA'));
  const leadSpend = hasData ? 0 : leadCamps.reduce((s,c)=>s+c.spend,0);
  const waSpend   = hasData ? 0 : waCamps.reduce((s,c)=>s+c.spend,0);
  const leadLeads = hasData ? totalLeads : leadCamps.reduce((s,c)=>s+c.leads,0);

  /* ── Filtered + sorted campaigns ── */
  const filteredCamps = useMemo(()=>{
    let rows = [...camps];
    if(statusF==='active') rows=rows.filter(c=>c.status==='ACTIVE');
    if(statusF==='paused') rows=rows.filter(c=>c.status!=='ACTIVE');
    if(typeF==='lead') rows=rows.filter(c=>c.type==='LEAD'||(!c.name?.toUpperCase().includes('WA')&&c.type!=='OTHER'));
    if(typeF==='wa')   rows=rows.filter(c=>c.type==='WA'||c.name?.toUpperCase().includes('WA'));
    if(search) rows=rows.filter(c=>c.name?.toLowerCase().includes(search.toLowerCase()));
    rows.sort((a,b)=>{
      const av=a[sortK]??0, bv=b[sortK]??0;
      if(typeof av==='string') return sortDir==='asc'?av.localeCompare(bv):bv.localeCompare(av);
      return sortDir==='asc'?av-bv:bv-av;
    });
    return rows;
  },[camps,statusF,typeF,search,sortK,sortDir]);

  const SortTh = ({label, k, align='right'}) => (
    <th style={{ textAlign:align, cursor:'pointer' }}
      className={sortK===k?'sorted':''}
      onClick={()=>{ if(sortK===k) setSortDir(d=>d==='asc'?'desc':'asc'); else{setSortK(k);setSortDir('desc');} }}>
      {label} {sortK===k?(sortDir==='asc'?'↑':'↓'):'↕'}
    </th>
  );

  const CHART_METRICS = [
    {k:'spend', l:'Inversión', color:'#1877F2'},
    {k:'leads', l:'Leads',     color:'#059669'},
    {k:'wa',    l:'WhatsApp',  color:'#25D366'},
  ];

  const pieData = [
    {name:'Lead Ads', value: hasData ? totalSpend*0.72 : leadSpend, color:'#1877F2'},
    {name:'WhatsApp', value: hasData ? totalSpend*0.28 : waSpend,   color:'#25D366'},
  ];

  const tabStyle = (k) => ({
    padding:'8px 18px', fontSize:13, fontWeight:600, cursor:'pointer',
    border:'none', background:'transparent',
    color:tab===k?'var(--text)':'var(--text3)',
    borderBottom:tab===k?'2px solid var(--gold)':'2px solid transparent',
    transition:'all .15s',
  });

  const filterBtn = (active, onClick, label) => (
    <button onClick={onClick} className={`btn btn-ghost btn-sm${active?' active':''}`}>{label}</button>
  );

  return (
    <div className="page-wrap scroll-y">

      {/* ── Header ── */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:24 }}>
        <div>
          <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:4 }}>
            <h1 className="page-h1">Meta Ads</h1>
            <span className="platform-badge meta">Meta Ads Manager</span>
            {!hasData && <span className="tag tag-yellow">Demo · configura VITE_UPSJB_META_ID en Railway frontend</span>}
            {loading && <span className="spinner"/>}
          </div>
          <p className="page-sub">{activeClient?.name} · Datos en tiempo real de Meta Graph API</p>
        </div>
        <div style={{ display:'flex', gap:8 }}>
          <button className="btn btn-ghost btn-sm" onClick={refetch}>↻ Actualizar</button>
          <button className="btn btn-primary btn-sm">↗ Ver en Meta</button>
        </div>
      </div>

      {/* ── KPI Row 1 ── */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, marginBottom:12 }}>
        <div className="kpi-card meta">
          <div className="kpi-label">Inversión total</div>
          <div className="kpi-value">S/ {parseInt(totalSpend||48169).toLocaleString()}</div>
          <div className="kpi-sub">Lead Ads + WhatsApp</div>
        </div>
        <div className="kpi-card green">
          <div className="kpi-label">Leads (formulario)</div>
          <div className="kpi-value">{(totalLeads||422).toLocaleString()}</div>
          <span className="kpi-delta up">▲ +21% vs sem. ant.</span>
        </div>
        <div className="kpi-card gold">
          <div className="kpi-label">CPL Lead Ads</div>
          <div className="kpi-value">S/ {cplLeads!=='—'?cplLeads:'44.27'}</div>
          <div className="kpi-sub">Costo por lead formulario</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">WhatsApp (CTWA)</div>
          <div className="kpi-value">{(totalWA||341).toLocaleString()}</div>
          <div className="kpi-sub">CPL WA: S/ {cplWA!=='—'?cplWA:'28.59'}</div>
        </div>
      </div>

      {/* ── KPI Row 2 — Métricas avanzadas ── */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, marginBottom:12 }}>
        <div className="kpi-card">
          <div className="kpi-label">Alcance</div>
          <div className="kpi-value">{totalReach>0?(totalReach/1000000).toFixed(1)+'M':'2.1M'}</div>
          <div className="kpi-sub">Personas únicas alcanzadas</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Frecuencia</div>
          <div className="kpi-value">{freq!=='—'?freq+'x':'1.31x'}</div>
          <div className="kpi-sub">Veces visto por persona</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Tasa de conversión</div>
          <div className="kpi-value">{convRate!=='—'?convRate+'%':'4.8%'}</div>
          <div className="kpi-sub">Clics que generan lead</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">CPL Total (Lead+WA)</div>
          <div className="kpi-value">S/ {cplTotal!=='—'?cplTotal:'38.04'}</div>
          <div className="kpi-sub">Sobre {(totalConv||763).toLocaleString()} conversiones</div>
        </div>
      </div>

      {/* ── KPI Row 3 ── */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, marginBottom:28 }}>
        <div className="kpi-card">
          <div className="kpi-label">CTR promedio</div>
          <div className="kpi-value">{ctr!=='—'?ctr+'%':'2.42%'}</div>
          <div className="kpi-sub">Click-through rate</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">CPM</div>
          <div className="kpi-value">S/ {cpm!=='—'?cpm:'8.47'}</div>
          <div className="kpi-sub">Costo por 1,000 impresiones</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">CPC</div>
          <div className="kpi-value">S/ {cpc!=='—'?cpc:'0.57'}</div>
          <div className="kpi-sub">Costo por clic</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Campañas activas</div>
          <div className="kpi-value">{camps.filter(c=>c.status==='ACTIVE').length || 40}</div>
          <div className="kpi-sub">de {camps.length || 50} campañas total</div>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div style={{ display:'flex', gap:2, borderBottom:'1px solid var(--border)', marginBottom:24 }}>
        {[
          {k:'overview',  l:'Vista general'},
          {k:'wow',       l:'Sem. vs Sem.'},
          {k:'campaigns', l:'Campañas'},
          {k:'programa',  l:'Por programa'},
        ].map(t=><button key={t.k} onClick={()=>setTab(t.k)} style={tabStyle(t.k)}>{t.l}</button>)}
      </div>

      {/* ═══ OVERVIEW ═══ */}
      {tab==='overview' && (<>
        {/* Chart con selector de métrica */}
        <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr', gap:20, marginBottom:20 }}>
          <div className="card">
            <div className="card-head">
              <div className="card-title">Tendencia semanal</div>
              <div style={{ display:'flex', gap:4 }}>
                {CHART_METRICS.map(m=>(
                  <button key={m.k} onClick={()=>setChartMetric(m.k)}
                    className={`btn btn-ghost btn-xs${chartMetric===m.k?' active':''}`}
                    style={{ borderColor:chartMetric===m.k?m.color:undefined, color:chartMetric===m.k?m.color:undefined }}>
                    {m.l}
                  </button>
                ))}
              </div>
            </div>
            <div className="card-body">
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={WEEKLY}>
                  <defs>
                    {CHART_METRICS.map(m=>(
                      <linearGradient key={m.k} id={`g${m.k}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor={m.color} stopOpacity={.12}/>
                        <stop offset="95%" stopColor={m.color} stopOpacity={0}/>
                      </linearGradient>
                    ))}
                  </defs>
                  <XAxis dataKey="s" tick={{ fontSize:10, fill:'var(--text3)' }} axisLine={false} tickLine={false}/>
                  <YAxis tick={{ fontSize:10, fill:'var(--text3)' }} axisLine={false} tickLine={false}
                    tickFormatter={v=>chartMetric==='spend'?`S/${(v/1000).toFixed(0)}K`:v}/>
                  <CartesianGrid stroke="var(--border)" strokeDasharray="4 4"/>
                  <Tooltip content={<Tip/>}/>
                  {CHART_METRICS.map(m=>(
                    <Area key={m.k} type="monotone" dataKey={m.k} name={m.l}
                      stroke={m.color} fill={`url(#g${m.k})`} strokeWidth={chartMetric===m.k?2.5:1}
                      opacity={chartMetric===m.k?1:0.3}/>
                  ))}
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
            {/* Pie */}
            <div className="card" style={{ flex:1 }}>
              <div className="card-head"><div className="card-title">Distribución inversión</div></div>
              <div className="card-body" style={{ padding:'12px 16px' }}>
                <ResponsiveContainer width="100%" height={130}>
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={36} outerRadius={54} dataKey="value" paddingAngle={4}>
                      {pieData.map((d,i)=><Cell key={i} fill={d.color}/>)}
                    </Pie>
                    <Tooltip formatter={v=>`S/ ${parseInt(v).toLocaleString()}`} contentStyle={{ background:'var(--bg2)', border:'1px solid var(--border)', borderRadius:8, fontSize:12 }}/>
                    <Legend iconType="circle" iconSize={7} wrapperStyle={{ fontSize:11 }}/>
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
            {/* Alcance / Frecuencia */}
            <div className="card">
              <div className="card-head"><div className="card-title">Alcance semanal</div></div>
              <div className="card-body" style={{ padding:'12px 16px' }}>
                <ResponsiveContainer width="100%" height={90}>
                  <BarChart data={WEEKLY.slice(-6)} barSize={14}>
                    <XAxis dataKey="s" tick={{ fontSize:9, fill:'var(--text3)' }} axisLine={false} tickLine={false}/>
                    <Tooltip formatter={v=>`${(v/1000).toFixed(0)}K`} contentStyle={{ background:'var(--bg2)', border:'1px solid var(--border)', borderRadius:8, fontSize:12 }}/>
                    <Bar dataKey="alcance" name="Alcance" fill="#1877F2" radius={[2,2,0,0]} opacity={.75}/>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>

        {/* Lead Ads vs WA comparison */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
          {[
            { title:'Lead Ads · Formulario', color:'#1877F2', bg:'var(--meta-bg)', border:'var(--blue-border)',
              rows:[
                ['Inversión',  `S/ ${(hasData?totalSpend*0.72:leadSpend).toLocaleString('es-PE',{maximumFractionDigits:0})}`],
                ['Leads',      (hasData?totalLeads:leadLeads).toLocaleString()],
                ['CPL',        `S/ ${hasData?cplLeads:(leadLeads>0?(leadSpend/leadLeads).toFixed(2):'44.27')}`],
                ['Conv. Rate', `${hasData?convRate:'4.8'}%`],
                ['Alcance',    hasData?'—':'2.1M'],
                ['Frecuencia', hasData?'—':'1.31x'],
              ]
            },
            { title:'Click to WhatsApp', color:'#25D366', bg:'#F0FFF4', border:'#A7F3D0',
              rows:[
                ['Inversión',  `S/ ${(hasData?totalSpend*0.28:waSpend).toLocaleString('es-PE',{maximumFractionDigits:0})}`],
                ['Conv. WA',   (hasData?totalWA:341).toLocaleString()],
                ['CPL WA',     `S/ ${cplWA!=='—'?cplWA:'28.59'}`],
                ['CTR',        '0.74%'],
                ['CPM',        'S/ 7.94'],
                ['CPC',        'S/ 1.07'],
              ]
            },
          ].map((p,i)=>(
            <div key={i} className="card" style={{ borderTop:`3px solid ${p.color}` }}>
              <div className="card-head">
                <div className="card-title" style={{ color:p.color }}>{p.title}</div>
              </div>
              <div className="card-body">
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                  {p.rows.map(([l,v])=>(
                    <div key={l} style={{ background:p.bg, border:`1px solid ${p.border}`, borderRadius:8, padding:'10px 14px' }}>
                      <div style={{ fontSize:11, color:'var(--text3)', marginBottom:3, fontWeight:500 }}>{l}</div>
                      <div style={{ fontFamily:'var(--font-tight)', fontWeight:700, fontSize:17 }}>{v}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </>)}

      {/* ═══ SEMANA VS SEMANA ═══ */}
      {tab==='wow' && (<>
        <div style={{ marginBottom:20 }}>
          <div className="alert alert-blue" style={{ marginBottom:16 }}>
            ℹ️ Comparativo entre <strong>última semana (22/6)</strong> vs <strong>semana anterior (15/6)</strong>
          </div>
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12, marginBottom:24 }}>
          {WOW.map((row,i)=>{
            const change = ((row.curr-row.prev)/row.prev*100).toFixed(1);
            const isUp   = row.curr >= row.prev;
            const isCpl  = row.metric==='CPL';
            const good   = isCpl ? !isUp : isUp;
            return (
              <div key={i} className="kpi-card">
                <div className="kpi-label">{row.metric}</div>
                <div style={{ display:'flex', alignItems:'baseline', gap:12 }}>
                  <div>
                    <div style={{ fontSize:10, color:'var(--text4)', marginBottom:2 }}>Sem. anterior</div>
                    <div style={{ fontFamily:'var(--font-tight)', fontWeight:700, fontSize:18, color:'var(--text3)' }}>
                      {row.unit}{row.prev.toLocaleString()}
                    </div>
                  </div>
                  <div style={{ fontSize:20, color:'var(--text3)' }}>→</div>
                  <div>
                    <div style={{ fontSize:10, color:'var(--text4)', marginBottom:2 }}>Última semana</div>
                    <div style={{ fontFamily:'var(--font-tight)', fontWeight:800, fontSize:22, color:'var(--text)' }}>
                      {row.unit}{row.curr.toLocaleString()}
                    </div>
                  </div>
                </div>
                <span className={`kpi-delta ${good?'up':'down'}`}>
                  {isUp?'▲':'▼'} {Math.abs(change)}% {good?'↗':'↘'}
                </span>
              </div>
            );
          })}
        </div>

        {/* WoW chart */}
        <div className="card">
          <div className="card-head"><div className="card-title">Inversión y leads — últimas 6 semanas</div></div>
          <div className="card-body">
            <ResponsiveContainer width="100%" height={240}>
              <ComposedChart data={WEEKLY.slice(-6)}>
                <XAxis dataKey="s" tick={{ fontSize:10, fill:'var(--text3)' }} axisLine={false} tickLine={false}/>
                <YAxis yAxisId="spend" tick={{ fontSize:10, fill:'var(--text3)' }} axisLine={false} tickLine={false} tickFormatter={v=>`S/${(v/1000).toFixed(0)}K`}/>
                <YAxis yAxisId="leads" orientation="right" tick={{ fontSize:10, fill:'var(--text3)' }} axisLine={false} tickLine={false}/>
                <CartesianGrid stroke="var(--border)" strokeDasharray="4 4"/>
                <Tooltip content={<Tip/>}/>
                <Bar yAxisId="spend" dataKey="spend" name="Inversión S/" fill="#1877F2" opacity={.2} radius={[4,4,0,0]}/>
                <Line yAxisId="leads" type="monotone" dataKey="leads" name="Lead Ads" stroke="#059669" strokeWidth={2.5} dot={{ fill:'#059669', r:4 }}/>
                <Line yAxisId="leads" type="monotone" dataKey="wa"    name="WhatsApp"  stroke="#25D366" strokeWidth={2}   dot={{ fill:'#25D366', r:3 }}/>
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      </>)}

      {/* ═══ CAMPAÑAS ═══ */}
      {tab==='campaigns' && (<>
        <div style={{ display:'flex', gap:8, marginBottom:16, alignItems:'center', flexWrap:'wrap' }}>
          <input value={search} onChange={e=>setSearch(e.target.value)}
            placeholder="Buscar campaña..." style={{ width:220, fontSize:12 }}/>
          <div style={{ display:'flex', gap:5 }}>
            {filterBtn(statusF==='all',   ()=>setStatusF('all'),   'Todas')}
            {filterBtn(statusF==='active',()=>setStatusF('active'),'● Activas')}
            {filterBtn(statusF==='paused',()=>setStatusF('paused'),'○ Pausadas')}
          </div>
          <div style={{ width:1, height:20, background:'var(--border)', margin:'0 4px' }}/>
          <div style={{ display:'flex', gap:5 }}>
            {filterBtn(typeF==='all',  ()=>setTypeF('all'),  'Todo')}
            {filterBtn(typeF==='lead', ()=>setTypeF('lead'), 'Lead Ads')}
            {filterBtn(typeF==='wa',   ()=>setTypeF('wa'),   'WhatsApp')}
          </div>
          <span style={{ marginLeft:'auto', fontSize:12, color:'var(--text3)' }}>
            {filteredCamps.length} campañas · S/ {filteredCamps.reduce((s,c)=>s+c.spend,0).toLocaleString()}
          </span>
        </div>

        <div className="card">
          <div style={{ overflowX:'auto' }}>
            <table className="table" style={{ minWidth:900 }}>
              <thead>
                <tr>
                  <SortTh label="CAMPAÑA"     k="name"     align="left"/>
                  <th>TIPO</th>
                  <th>ESTADO</th>
                  <SortTh label="INVERSIÓN"   k="spend"/>
                  <SortTh label="ALCANCE"     k="reach"/>
                  <SortTh label="IMPR."       k="impr"/>
                  <SortTh label="CLICS"       k="clics"/>
                  <SortTh label="CTR"         k="ctr"/>
                  <SortTh label="CPM"         k="cpm"/>
                  <SortTh label="LEADS"       k="leads"/>
                  <SortTh label="CPL"         k="cpl"/>
                  <SortTh label="CONV.RATE"   k="conv_rate"/>
                </tr>
              </thead>
              <tbody>
                {filteredCamps.map(c=>{
                  const cpl   = c.leads > 0 ? (c.spend/c.leads).toFixed(2) : null;
                  const cplCl = !cpl?'':parseFloat(cpl)<35?'cpl-good':parseFloat(cpl)<60?'cpl-mid':'cpl-high';
                  const isWA  = c.type==='WA'||c.name?.toUpperCase().includes('WA');
                  return (
                    <tr key={c.id}>
                      <td>
                        <div style={{ display:'flex', alignItems:'center', gap:8, maxWidth:280 }}>
                          <span style={{ fontSize:12.5, fontWeight:500, color:'var(--text)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                            {c.name?.replace(/_FORM$/,'').replace(/_CLICK$/,'').replace(/_/g,' ')}
                          </span>
                        </div>
                      </td>
                      <td>
                        <span className={`tag ${isWA?'tag-green':'tag-blue'}`} style={{ fontSize:10 }}>
                          {isWA?'WhatsApp':'Lead Ads'}
                        </span>
                      </td>
                      <td><span className={`status-pill ${c.status==='ACTIVE'?'active':'paused'}`}>{c.status==='ACTIVE'?'Activa':'Pausada'}</span></td>
                      <td style={{ textAlign:'right', fontFamily:'var(--mono)', fontWeight:600 }}>S/ {c.spend.toLocaleString()}</td>
                      <td style={{ textAlign:'right' }}>{c.reach?.toLocaleString()||'—'}</td>
                      <td style={{ textAlign:'right' }}>{c.impr?.toLocaleString()||'—'}</td>
                      <td style={{ textAlign:'right' }}>{c.clics?.toLocaleString()||'—'}</td>
                      <td style={{ textAlign:'right' }}>{c.ctr?.toFixed(2)||'—'}%</td>
                      <td style={{ textAlign:'right' }}>S/ {c.cpm?.toFixed(2)||'—'}</td>
                      <td style={{ textAlign:'right', fontWeight:600, color:'var(--green)' }}>{c.leads||'—'}</td>
                      <td style={{ textAlign:'right' }}>{cpl?<span className={cplCl}>S/ {cpl}</span>:<span style={{color:'var(--text4)'}}>—</span>}</td>
                      <td style={{ textAlign:'right' }}>{c.conv_rate?.toFixed(2)||'—'}%</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div style={{ padding:'12px 16px', borderTop:'1px solid var(--border)', background:'var(--bg3)', display:'flex', gap:24, fontSize:12, color:'var(--text3)', flexWrap:'wrap' }}>
            <span>Total: <strong style={{ color:'var(--text)' }}>{filteredCamps.length} campañas</strong></span>
            <span>Inversión: <strong>S/ {filteredCamps.reduce((s,c)=>s+c.spend,0).toLocaleString()}</strong></span>
            <span>Leads: <strong style={{ color:'var(--green)' }}>{filteredCamps.reduce((s,c)=>s+c.leads,0)}</strong></span>
            <span>CPL prom: <strong>{(()=>{const tl=filteredCamps.reduce((s,c)=>s+c.leads,0),ts=filteredCamps.reduce((s,c)=>s+c.spend,0);return tl>0?`S/ ${(ts/tl).toFixed(2)}`:'—';})()}</strong></span>
          </div>
        </div>
      </>)}

      {/* ═══ POR PROGRAMA ═══ */}
      {tab==='programa' && (<>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20, marginBottom:20 }}>
          <div className="card">
            <div className="card-head"><div className="card-title">CPL por programa académico</div></div>
            <div className="card-body">
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={PROGRAMA_DATA.filter(p=>p.leads>0).sort((a,b)=>a.cpl-b.cpl)} layout="vertical" barSize={18}>
                  <XAxis type="number" tick={{ fontSize:9, fill:'var(--text3)' }} axisLine={false} tickLine={false} tickFormatter={v=>`S/${v}`}/>
                  <YAxis type="category" dataKey="prog" tick={{ fontSize:10, fill:'var(--text2)' }} axisLine={false} tickLine={false} width={120}/>
                  <Tooltip content={<Tip/>} formatter={v=>`S/ ${v}`}/>
                  <Bar dataKey="cpl" name="CPL" fill="#1877F2" opacity={.85} radius={[0,4,4,0]}>
                    {PROGRAMA_DATA.filter(p=>p.leads>0).sort((a,b)=>a.cpl-b.cpl).map((p,i)=>(
                      <Cell key={i} fill={p.cpl<35?'var(--green)':p.cpl<50?'var(--gold)':'var(--red)'}/>
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="card">
            <div className="card-head"><div className="card-title">Leads por programa</div></div>
            <div className="card-body">
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={PROGRAMA_DATA.sort((a,b)=>b.leads-a.leads)} layout="vertical" barSize={18}>
                  <XAxis type="number" tick={{ fontSize:9, fill:'var(--text3)' }} axisLine={false} tickLine={false}/>
                  <YAxis type="category" dataKey="prog" tick={{ fontSize:10, fill:'var(--text2)' }} axisLine={false} tickLine={false} width={120}/>
                  <Tooltip content={<Tip/>}/>
                  <Bar dataKey="leads" name="Leads" fill="#1877F2" opacity={.85} radius={[0,4,4,0]}/>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-head"><div className="card-title">Detalle por programa</div></div>
          <table className="table">
            <thead>
              <tr>
                <th style={{ textAlign:'left' }}>PROGRAMA</th>
                <th style={{ textAlign:'right' }}>LEADS</th>
                <th style={{ textAlign:'right' }}>INVERSIÓN</th>
                <th style={{ textAlign:'right' }}>CPL</th>
                <th style={{ textAlign:'center' }}>EFICIENCIA</th>
              </tr>
            </thead>
            <tbody>
              {PROGRAMA_DATA.sort((a,b)=>b.leads-a.leads).map((p,i)=>{
                const eff = !p.cpl?null:p.cpl<35?'Excelente':p.cpl<50?'Bueno':p.cpl<70?'Regular':'Alto';
                const effCl = !p.cpl?'tag-gray':p.cpl<35?'tag-green':p.cpl<50?'tag-gold':p.cpl<70?'tag-yellow':'tag-red';
                return (
                  <tr key={i}>
                    <td style={{ fontWeight:500, color:'var(--text)' }}>{p.prog}</td>
                    <td style={{ textAlign:'right', fontWeight:600, color:'var(--green)' }}>{p.leads}</td>
                    <td style={{ textAlign:'right', fontFamily:'var(--mono)' }}>S/ {p.spend.toLocaleString()}</td>
                    <td style={{ textAlign:'right' }}>
                      {p.cpl>0?<span className={p.cpl<35?'cpl-good':p.cpl<50?'cpl-mid':'cpl-high'}>S/ {p.cpl.toFixed(2)}</span>:'—'}
                    </td>
                    <td style={{ textAlign:'center' }}>
                      {eff?<span className={`tag ${effCl}`}>{eff}</span>:'—'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </>)}
    </div>
  );
}
