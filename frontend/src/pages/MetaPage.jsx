import React, { useState, useMemo } from 'react';
import { useMetaCampaigns } from '../hooks/useData.js';
import { useApp } from '../context/AppContext.jsx';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  AreaChart, Area, CartesianGrid, PieChart, Pie, Cell, Legend,
  ComposedChart, Line
} from 'recharts';

/* ── helpers ── */
const n = (v,d=0) => parseFloat(v||0).toFixed(d);
const i = (v)    => parseInt(v||0);
const fmt = (v)  => parseInt(v||0).toLocaleString();

const getLeads = c => {
  const m = c.metrics || c;
  return (m.actions||[]).reduce((s,a)=>a.action_type==='lead'?s+i(a.value):s, 0);
};
const getWA = c => {
  const m = c.metrics || c;
  // Solo conversaciones de WhatsApp REALMENTE iniciadas (evento estandar de Meta)
  return (m.actions||[]).reduce((s,a)=>a.action_type==='onsite_conversion.total_messaging_connection'?s+i(a.value):s, 0);
};
const getSpend  = c => parseFloat((c.metrics||c).spend||0);
const getClics  = c => { const m=c.metrics||c; return i(m.inline_link_clicks ?? (m.clicks||0)); };
const getImpr   = c => i((c.metrics||c).impressions||0);
const getReach  = c => i((c.metrics||c).reach||0);
const getCtr    = c => parseFloat((c.metrics||c).ctr||0);
const getCpm    = c => parseFloat((c.metrics||c).cpm||0);
const getFreq   = c => { const m=c.metrics||c; const r=i(m.reach||0),imp=i(m.impressions||0); return r>0?imp/r:0; };
const isWACamp  = c => (c.name||'').toUpperCase().includes('WHATSAPP') || (c.name||'').toUpperCase().match(/\bWA[_\b]/);

/* ── Tooltip ── */
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

/* ── Static weekly trend (until API provides daily) ── */
const WEEKLY = [
  {s:'23/3',spend:4200,leads:95,wa:48},{s:'30/3',spend:5100,leads:112,wa:54},
  {s:'6/4',spend:4800,leads:108,wa:50},{s:'13/4',spend:5600,leads:128,wa:62},
  {s:'20/4',spend:5200,leads:118,wa:57},{s:'27/4',spend:8400,leads:185,wa:90},
  {s:'4/5',spend:9200,leads:204,wa:98},{s:'11/5',spend:11000,leads:240,wa:115},
  {s:'18/5',spend:10500,leads:229,wa:110},{s:'25/5',spend:9800,leads:214,wa:103},
  {s:'1/6',spend:10200,leads:222,wa:107},{s:'8/6',spend:11800,leads:257,wa:123},
  {s:'15/6',spend:11200,leads:244,wa:117},{s:'22/6',spend:6200,leads:136,wa:66},
];

export default function MetaPage() {
  const { activeClient } = useApp();
  const { campaigns, summary, loading, refetch } = useMetaCampaigns();
  const [tab,     setTab]    = useState('overview');
  const [sortK,   setSortK]  = useState('spend');
  const [sortDir, setSortDir]= useState('desc');
  const [search,  setSearch] = useState('');
  const [statusF, setStatusF]= useState('all');
  const [typeF,   setTypeF]  = useState('all');
  const [chartM,  setChartM] = useState('spend');

  /* ── Aggregate from real campaigns ── */
  const totalSpend = campaigns.length > 0
    ? campaigns.reduce((s,c)=>s+getSpend(c), 0)
    : parseFloat(summary.spend||0);
  const totalLeads = campaigns.length > 0
    ? campaigns.reduce((s,c)=>s+getLeads(c),0)
    : i(summary.leads||0);
  const totalWA    = campaigns.length > 0
    ? campaigns.reduce((s,c)=>s+getWA(c),0)
    : i(summary.waConv||0);
  const totalClics = campaigns.length > 0
    ? campaigns.reduce((s,c)=>s+getClics(c),0)
    : i(summary.clicks||0);
  const totalImpr  = campaigns.length > 0
    ? campaigns.reduce((s,c)=>s+getImpr(c),0)
    : i(summary.impressions||0);
  const totalReach = campaigns.length > 0
    ? campaigns.reduce((s,c)=>s+getReach(c),0)
    : i(summary.reach||0);
  const totalConv  = totalLeads + totalWA;

  /* ── Derived metrics ── */
  const cplLeads = totalLeads>0 ? (totalSpend/totalLeads).toFixed(2) : '—';
  const cplWA    = totalWA>0    ? (totalSpend/totalWA   ).toFixed(2) : '—';
  const cplTotal = totalConv>0  ? (totalSpend/totalConv ).toFixed(2) : '—';
  const ctr      = totalImpr>0  ? ((totalClics/totalImpr)*100).toFixed(2) : '—';
  const cpm      = totalImpr>0  ? ((totalSpend/totalImpr)*1000).toFixed(2) : '—';
  const cpc      = totalClics>0 ? (totalSpend/totalClics).toFixed(2) : '—';
  const freq     = totalReach>0 ? (totalImpr/totalReach).toFixed(2) : '—';
  const convRate = totalClics>0&&totalLeads>0 ? ((totalLeads/totalClics)*100).toFixed(2) : '—';

  /* ── Segment Lead Ads vs WhatsApp ── */
  const leadCamps = campaigns.filter(c=>!isWACamp(c));
  const waCamps   = campaigns.filter(c=> isWACamp(c));
  const leadSpend = leadCamps.reduce((s,c)=>s+getSpend(c),0);
  const waSpend   = waCamps.reduce((s,c)=>s+getSpend(c),0);
  const leadLeads = leadCamps.reduce((s,c)=>s+getLeads(c),0);
  const waConvs   = waCamps.reduce((s,c)=>s+getWA(c),0);
  const leadCpl   = leadLeads>0 ? (leadSpend/leadLeads).toFixed(2) : '—';
  const waCpl     = waConvs>0   ? (waSpend/waConvs).toFixed(2) : '—';

  /* ── By programa (from campaign names) ── */
  // extractPrograma — uses backend field if available, fallback to frontend
  const extractPrograma = (c) => {
    if (c.programa && c.programa.carrera) return c.programa;
    const n = (c.name||'').toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
    const isWA = n.includes('WHATSAPP');
    if (n.includes('WHATSAPP MEDICINA')||n.includes('MEDICINA HUMANA')) return { carrera:'Medicina Humana', isWA };
    if (n.includes('VETERINARIA'))   return { carrera:'Medicina Veterinaria y Zootecnia', isWA };
    if (n.includes('ENFERMERIA'))    return { carrera:'Enfermería', isWA };
    if (n.includes('PSICOLOGIA'))    return { carrera:'Psicología', isWA };
    if (n.includes('TERAPIA'))       return { carrera:'Terapia Física y Rehabilitación', isWA };
    if (n.includes('LABORATORIO'))   return { carrera:'Laboratorio Clínico', isWA };
    if (n.includes('DERECHO'))       return { carrera:'Derecho', isWA };
    if (n.includes('CONTABILIDAD'))  return { carrera:'Contabilidad', isWA };
    if (n.includes('ESTOMATOLOGIA')) return { carrera:'Estomatología', isWA };
    if (n.includes('AGROINDUSTRIAL'))return { carrera:'Ingeniería Agroindustrial', isWA };
    if (n.includes('CIVIL'))         return { carrera:'Ingeniería Civil', isWA };
    if (n.includes('SISTEMAS'))      return { carrera:'Ingeniería de Sistemas', isWA };
    if (n.includes('ENOLOGIA'))      return { carrera:'Ingeniería en Enología y Viticultura', isWA };
    if (n.includes('TURISMO')||n.includes('HOTELERIA')) return { carrera:'Turismo, Hotelería y Gastronomía', isWA };
    if (n.includes('ADMINISTRACION MARKETING')||n.includes('ADMIN MARKETING')) return { carrera:'Administración y Marketing', isWA };
    if (n.includes('NEGOCIOS'))      return { carrera:'Administración y Negocios Int.', isWA };
    if (n.includes('ADMINISTRACION')||n.includes('ADMIN')) return { carrera:'Administración de Empresas', isWA };
    return { carrera:'Otros', isWA };
  };

  const byPrograma = useMemo(()=>{
    const map = {};
    for (const c of campaigns) {
      const { carrera, isWA: campIsWA } = extractPrograma(c);
      if (!map[carrera]) map[carrera]={ prog:carrera, leadsForm:0, spendForm:0, leadsWA:0, spendWA:0 };
      if (campIsWA || isWACamp(c)) {
        map[carrera].leadsWA  += getWA(c)||0;
        map[carrera].spendWA  += getSpend(c);
      } else {
        map[carrera].leadsForm += getLeads(c);
        map[carrera].spendForm += getSpend(c);
      }
    }
    return Object.values(map).map(p=>({
      ...p,
      totalLeads: p.leadsForm + p.leadsWA,
      totalSpend: p.spendForm + p.spendWA,
      cplForm:  p.leadsForm>0 ? (p.spendForm/p.leadsForm).toFixed(2) : null,
      cplWA:    p.leadsWA>0   ? (p.spendWA/p.leadsWA).toFixed(2)    : null,
      cplTotal: (p.leadsForm+p.leadsWA)>0 ? ((p.spendForm+p.spendWA)/(p.leadsForm+p.leadsWA)).toFixed(2) : null,
    })).sort((a,b)=>b.totalLeads-a.totalLeads);
  },[campaigns]);

  /* ── Filtered campaigns ── */
  const filteredCamps = useMemo(()=>{
    let rows=[...campaigns];
    if(statusF==='active') rows=rows.filter(c=>c.status==='ACTIVE');
    if(statusF==='paused') rows=rows.filter(c=>c.status!=='ACTIVE');
    if(typeF==='lead') rows=rows.filter(c=>!isWACamp(c));
    if(typeF==='wa')   rows=rows.filter(c=> isWACamp(c));
    if(search) rows=rows.filter(c=>c.name?.toLowerCase().includes(search.toLowerCase()));
    rows.sort((a,b)=>{
      let av,bv;
      if(sortK==='spend')  { av=getSpend(a); bv=getSpend(b); }
      else if(sortK==='leads') { av=getLeads(a); bv=getLeads(b); }
      else if(sortK==='clics') { av=getClics(a); bv=getClics(b); }
      else if(sortK==='impr')  { av=getImpr(a);  bv=getImpr(b);  }
      else if(sortK==='ctr')   { av=getCtr(a);   bv=getCtr(b);   }
      else if(sortK==='cpm')   { av=getCpm(a);   bv=getCpm(b);   }
      else if(sortK==='reach') { av=getReach(a); bv=getReach(b); }
      else if(sortK==='cpl')   { const la=getLeads(a),lb=getLeads(b); av=la>0?getSpend(a)/la:999; bv=lb>0?getSpend(b)/lb:999; }
      else { av=a.name||''; bv=b.name||''; return sortDir==='asc'?av.localeCompare(bv):bv.localeCompare(av); }
      return sortDir==='asc'?av-bv:bv-av;
    });
    return rows;
  },[campaigns,statusF,typeF,search,sortK,sortDir]);

  const SortTh = ({label,k,align='right'}) => (
    <th style={{ textAlign:align, cursor:'pointer' }} className={sortK===k?'sorted':''}
      onClick={()=>{ if(sortK===k) setSortDir(d=>d==='asc'?'desc':'asc'); else{setSortK(k);setSortDir('desc');} }}>
      {label} {sortK===k?(sortDir==='asc'?'↑':'↓'):'↕'}
    </th>
  );

  const tabS = k => ({
    padding:'8px 18px', fontSize:13, fontWeight:600, cursor:'pointer', border:'none', background:'transparent',
    color:tab===k?'var(--text)':'var(--text3)',
    borderBottom:tab===k?'2px solid var(--gold)':'2px solid transparent', transition:'all .15s',
  });

  const pieData = [
    {name:'Lead Ads', value:leadSpend||1, color:'#1877F2'},
    {name:'WhatsApp', value:waSpend||0,   color:'#25D366'},
  ].filter(d=>d.value>0);

  const CHART_M = [
    {k:'spend',l:'Inversión',color:'#1877F2'},
    {k:'leads', l:'Leads',   color:'#059669'},
    {k:'wa',    l:'WA',      color:'#25D366'},
  ];

  /* ── WoW data (last 2 vs prev 2 weeks) ── */
  const wow = [
    {m:'Inversión', prev:WEEKLY.slice(-4,-2).reduce((s,w)=>s+w.spend,0), curr:WEEKLY.slice(-2).reduce((s,w)=>s+w.spend,0), unit:'S/'},
    {m:'Leads',     prev:WEEKLY.slice(-4,-2).reduce((s,w)=>s+w.leads,0), curr:WEEKLY.slice(-2).reduce((s,w)=>s+w.leads,0), unit:''},
    {m:'WhatsApp',  prev:WEEKLY.slice(-4,-2).reduce((s,w)=>s+w.wa,0),    curr:WEEKLY.slice(-2).reduce((s,w)=>s+w.wa,0),    unit:''},
  ];

  return (
    <div className="page-wrap scroll-y">

      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:24 }}>
        <div>
          <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:4 }}>
            <h1 className="page-h1">Meta Ads</h1>
            <span className="platform-badge meta">Meta Ads Manager</span>
            {loading && <span className="spinner"/>}
          </div>
          <p className="page-sub">{activeClient?.name} · {campaigns.length} campañas · Datos en tiempo real</p>
        </div>
        <div style={{ display:'flex', gap:8 }}>
          <button className="btn btn-ghost btn-sm" onClick={refetch}>↻ Actualizar</button>
          <a href="https://adsmanager.facebook.com" target="_blank" rel="noreferrer" className="btn btn-ghost btn-sm">↗ Ads Manager</a>
        </div>
      </div>

      {/* KPI Row 1 */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, marginBottom:12 }}>
        <div className="kpi-card meta">
          <div className="kpi-label">Inversión total</div>
          <div className="kpi-value">S/ {fmt(totalSpend)}</div>
          <div className="kpi-sub">Lead Ads + WhatsApp</div>
        </div>
        <div className="kpi-card green">
          <div className="kpi-label">Leads formulario</div>
          <div className="kpi-value">{fmt(totalLeads)}</div>
          <div className="kpi-sub">CPL: S/ {cplLeads}</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Conversaciones Iniciadas WA</div>
          <div className="kpi-value">{fmt(totalWA)}</div>
          <div className="kpi-sub">Costo por mensaje: S/ {cplWA}</div>
        </div>
        <div className="kpi-card gold">
          <div className="kpi-label">CPL Total</div>
          <div className="kpi-value">S/ {cplTotal}</div>
          <div className="kpi-sub">{fmt(totalConv)} conversiones totales</div>
        </div>
      </div>

      {/* KPI Row 2 */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, marginBottom:12 }}>
        <div className="kpi-card">
          <div className="kpi-label">Alcance</div>
          <div className="kpi-value">{totalReach>0?(totalReach/1000000).toFixed(1)+'M':totalReach}</div>
          <div className="kpi-sub">Personas únicas</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Frecuencia</div>
          <div className="kpi-value">{freq}x</div>
          <div className="kpi-sub">Impresiones por persona</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Tasa de conversión</div>
          <div className="kpi-value">{convRate}{convRate!=='—'?'%':''}</div>
          <div className="kpi-sub">Clics que generan lead</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Campañas activas</div>
          <div className="kpi-value">{campaigns.filter(c=>c.status==='ACTIVE').length}</div>
          <div className="kpi-sub">de {campaigns.length} total</div>
        </div>
      </div>

      {/* KPI Row 3 */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, marginBottom:28 }}>
        <div className="kpi-card">
          <div className="kpi-label">CTR promedio</div>
          <div className="kpi-value">{ctr}{ctr!=='—'?'%':''}</div>
          <div className="kpi-sub">{fmt(totalClics)} clics totales</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">CPM</div>
          <div className="kpi-value">S/ {cpm}</div>
          <div className="kpi-sub">Costo por 1,000 impresiones</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">CPC</div>
          <div className="kpi-value">S/ {cpc}</div>
          <div className="kpi-sub">Costo por clic</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Impresiones</div>
          <div className="kpi-value">{totalImpr>0?(totalImpr/1000000).toFixed(1)+'M':totalImpr}</div>
          <div className="kpi-sub">Impresiones totales</div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display:'flex', gap:2, borderBottom:'1px solid var(--border)', marginBottom:24 }}>
        {[
          {k:'overview', l:'Vista general'},
          {k:'campaigns',l:'Campañas'},
          {k:'programa', l:'Por programa'},
          {k:'wow',      l:'Sem. vs Sem.'},
        ].map(t=><button key={t.k} onClick={()=>setTab(t.k)} style={tabS(t.k)}>{t.l}</button>)}
      </div>

      {/* ═══ OVERVIEW ═══ */}
      {tab==='overview'&&(<>
        <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr', gap:20, marginBottom:20 }}>
          <div className="card">
            <div className="card-head">
              <div className="card-title">Tendencia semanal</div>
              <div style={{ display:'flex', gap:4 }}>
                {CHART_M.map(m=>(
                  <button key={m.k} onClick={()=>setChartM(m.k)}
                    className={`btn btn-ghost btn-xs${chartM===m.k?' active':''}`}
                    style={{ borderColor:chartM===m.k?m.color:undefined, color:chartM===m.k?m.color:undefined }}>
                    {m.l}
                  </button>
                ))}
              </div>
            </div>
            <div className="card-body">
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={WEEKLY}>
                  <defs>
                    {CHART_M.map(m=>(
                      <linearGradient key={m.k} id={`g${m.k}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor={m.color} stopOpacity={.12}/>
                        <stop offset="95%" stopColor={m.color} stopOpacity={0}/>
                      </linearGradient>
                    ))}
                  </defs>
                  <XAxis dataKey="s" tick={{ fontSize:10, fill:'var(--text3)' }} axisLine={false} tickLine={false}/>
                  <YAxis tick={{ fontSize:10, fill:'var(--text3)' }} axisLine={false} tickLine={false}
                    tickFormatter={v=>chartM==='spend'?`S/${(v/1000).toFixed(0)}K`:v}/>
                  <CartesianGrid stroke="var(--border)" strokeDasharray="4 4"/>
                  <Tooltip content={<Tip/>}/>
                  {CHART_M.map(m=>(
                    <Area key={m.k} type="monotone" dataKey={m.k} name={m.l}
                      stroke={m.color} fill={`url(#g${m.k})`}
                      strokeWidth={chartM===m.k?2.5:1} opacity={chartM===m.k?1:0.25}/>
                  ))}
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
            <div className="card" style={{ flex:1 }}>
              <div className="card-head"><div className="card-title">Distribución inversión</div></div>
              <div className="card-body" style={{ padding:'12px 16px' }}>
                <ResponsiveContainer width="100%" height={140}>
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={40} outerRadius={58} dataKey="value" paddingAngle={4}>
                      {pieData.map((d,i)=><Cell key={i} fill={d.color}/>)}
                    </Pie>
                    <Tooltip formatter={v=>`S/ ${fmt(v)}`} contentStyle={{ background:'var(--bg2)', border:'1px solid var(--border)', borderRadius:8, fontSize:12 }}/>
                    <Legend iconType="circle" iconSize={7} wrapperStyle={{ fontSize:11 }}/>
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="card">
              <div className="card-head"><div className="card-title">Leads últimas 7 semanas</div></div>
              <div className="card-body" style={{ padding:'10px 14px' }}>
                <ResponsiveContainer width="100%" height={90}>
                  <BarChart data={WEEKLY.slice(-7)} barSize={10}>
                    <XAxis dataKey="s" tick={{ fontSize:8, fill:'var(--text3)' }} axisLine={false} tickLine={false}/>
                    <Tooltip content={<Tip/>}/>
                    <Bar dataKey="leads" name="Lead Ads" fill="#1877F2" radius={[2,2,0,0]}/>
                    <Bar dataKey="wa"    name="WhatsApp"  fill="#25D366" radius={[2,2,0,0]}/>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>

        {/* Lead Ads vs WA */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
          {[
            { title:'Lead Ads · Formulario', color:'#1877F2', bg:'var(--meta-bg)', border:'var(--blue-border)',
              rows:[
                ['Inversión',    `S/ ${fmt(leadSpend)}`],
                ['Leads',        fmt(leadLeads)],
                ['CPL',          `S/ ${leadCpl}`],
                ['Campañas',     leadCamps.length],
                ['% inversión',  `${leadSpend>0?((leadSpend/totalSpend)*100).toFixed(0):0}%`],
                ['Conv. rate',   convRate!=='—'?convRate+'%':'—'],
              ]
            },
            { title:'Click to WhatsApp', color:'#25D366', bg:'#F0FFF4', border:'#A7F3D0',
              rows:[
                ['Inversión',    `S/ ${fmt(waSpend)}`],
                ['Conv. WA',     fmt(waConvs)],
                ['CPL WA',       `S/ ${waCpl}`],
                ['Campañas',     waCamps.length],
                ['% inversión',  `${waSpend>0?((waSpend/totalSpend)*100).toFixed(0):0}%`],
                ['CTR',          waCamps.length>0?`${getCtr(waCamps[0]).toFixed(2)}%`:'—'],
              ]
            },
          ].map((p,i)=>(
            <div key={i} className="card" style={{ borderTop:`3px solid ${p.color}` }}>
              <div className="card-head"><div className="card-title" style={{ color:p.color }}>{p.title}</div></div>
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

      {/* ═══ CAMPAÑAS ═══ */}
      {tab==='campaigns'&&(<>
        <div style={{ display:'flex', gap:8, marginBottom:16, alignItems:'center', flexWrap:'wrap' }}>
          <input value={search} onChange={e=>setSearch(e.target.value)}
            placeholder="Buscar campaña..." style={{ width:220, fontSize:12 }}/>
          <div style={{ display:'flex', gap:5 }}>
            {[['all','Todas'],['active','● Activas'],['paused','○ Pausadas']].map(([k,l])=>(
              <button key={k} onClick={()=>setStatusF(k)} className={`btn btn-ghost btn-sm${statusF===k?' active':''}`}>{l}</button>
            ))}
          </div>
          <div style={{ width:1, height:20, background:'var(--border)' }}/>
          <div style={{ display:'flex', gap:5 }}>
            {[['all','Todo'],['lead','Lead Ads'],['wa','WhatsApp']].map(([k,l])=>(
              <button key={k} onClick={()=>setTypeF(k)} className={`btn btn-ghost btn-sm${typeF===k?' active':''}`}>{l}</button>
            ))}
          </div>
          <span style={{ marginLeft:'auto', fontSize:12, color:'var(--text3)' }}>
            {filteredCamps.length} campañas · S/ {fmt(filteredCamps.reduce((s,c)=>s+getSpend(c),0))}
          </span>
        </div>

        <div className="card">
          <div style={{ overflowX:'auto' }}>
            <table className="table" style={{ minWidth:960 }}>
              <thead>
                <tr>
                  <SortTh label="CAMPAÑA"   k="name"  align="left"/>
                  <th style={{ textAlign:'left' }}>TIPO</th>
                  <th>ESTADO</th>
                  <SortTh label="INVERSIÓN" k="spend"/>
                  <SortTh label="ALCANCE"   k="reach"/>
                  <SortTh label="IMPR."     k="impr"/>
                  <SortTh label="CLICS"     k="clics"/>
                  <SortTh label="CTR"       k="ctr"/>
                  <SortTh label="CPM"       k="cpm"/>
                  <SortTh label="LEADS"     k="leads"/>
                  <SortTh label="CPL"       k="cpl"/>
                </tr>
              </thead>
              <tbody>
                {filteredCamps.map(c=>{
                  const wa      = isWACamp(c);
                  const waConv  = getWA(c);
                  const leads   = wa ? waConv : getLeads(c);
                  const spend   = getSpend(c);
                  const cpl     = leads>0?(spend/leads).toFixed(2):null;
                  const cplCl   = !cpl?'':parseFloat(cpl)<35?'cpl-good':parseFloat(cpl)<60?'cpl-mid':'cpl-high';
                  return (
                    <tr key={c.id}>
                      <td style={{ maxWidth:260 }}>
                        <span style={{ fontSize:12.5, fontWeight:500, color:'var(--text)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', display:'block' }}>
                          {(c.name||'').replace(/_FORM$/,'').replace(/_CLICK$/,'').replace(/_/g,' ')}
                        </span>
                      </td>
                      <td><span className={`tag ${wa?'tag-green':'tag-blue'}`} style={{ fontSize:10 }}>{wa?'WhatsApp':'Lead Ads'}</span></td>
                      <td><span className={`status-pill ${c.status==='ACTIVE'?'active':'paused'}`}>{c.status==='ACTIVE'?'Activa':'Pausada'}</span></td>
                      <td style={{ textAlign:'right', fontFamily:'var(--mono)', fontWeight:600 }}>S/ {fmt(spend)}</td>
                      <td style={{ textAlign:'right' }}>{fmt(getReach(c))}</td>
                      <td style={{ textAlign:'right' }}>{fmt(getImpr(c))}</td>
                      <td style={{ textAlign:'right' }}>{fmt(getClics(c))}</td>
                      <td style={{ textAlign:'right' }}>{getCtr(c).toFixed(2)}%</td>
                      <td style={{ textAlign:'right' }}>S/ {getCpm(c).toFixed(2)}</td>
                      <td style={{ textAlign:'right', fontWeight:600, color:'var(--green)' }}>
                        {leads>0?leads:waConv>0?waConv:'—'}
                      </td>
                      <td style={{ textAlign:'right' }}>
                        {cpl?<span className={cplCl}>S/ {cpl}</span>:<span style={{color:'var(--text4)'}}>—</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div style={{ padding:'12px 16px', borderTop:'1px solid var(--border)', background:'var(--bg3)', display:'flex', gap:24, fontSize:12, color:'var(--text3)', flexWrap:'wrap' }}>
            <span>{filteredCamps.length} campañas</span>
            <span>Inversión: <strong>S/ {fmt(filteredCamps.reduce((s,c)=>s+getSpend(c),0))}</strong></span>
            <span>Leads: <strong style={{color:'var(--green)'}}>{filteredCamps.reduce((s,c)=>s+getLeads(c),0)}</strong></span>
            <span>WA: <strong style={{color:'var(--green)'}}>{filteredCamps.reduce((s,c)=>s+getWA(c),0)}</strong></span>
            <span>CPL prom: <strong>{(()=>{const tl=filteredCamps.reduce((s,c)=>s+getLeads(c),0),ts=filteredCamps.reduce((s,c)=>s+getSpend(c),0);return tl>0?`S/ ${(ts/tl).toFixed(2)}`:'—';})()}</strong></span>
          </div>
        </div>
      </>)}

      {/* ═══ POR PROGRAMA ═══ */}
      {tab==='programa'&&(<>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20, marginBottom:20 }}>
          <div className="card">
            <div className="card-head"><div className="card-title">CPL por programa · menor es mejor</div></div>
            <div className="card-body">
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={byPrograma.filter(p=>p.cplForm).sort((a,b)=>parseFloat(a.cplForm||999)-parseFloat(b.cplForm||999))} layout="vertical" barSize={18}>
                  <XAxis type="number" tick={{ fontSize:9, fill:'var(--text3)' }} axisLine={false} tickLine={false} tickFormatter={v=>`S/${v}`}/>
                  <YAxis type="category" dataKey="prog" tick={{ fontSize:10, fill:'var(--text2)' }} axisLine={false} tickLine={false} width={120}/>
                  <Tooltip content={<Tip/>}/>
                  <Bar dataKey="cplForm" name="CPL Form. S/" radius={[0,4,4,0]}>
                    {byPrograma.filter(p=>p.cplForm).sort((a,b)=>parseFloat(a.cplForm||999)-parseFloat(b.cplForm||999)).map((p,i)=>(
                      <Cell key={i} fill={parseFloat(p.cplForm)<35?'var(--green)':parseFloat(p.cplForm)<55?'var(--gold)':'var(--red)'}/>
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="card">
            <div className="card-head"><div className="card-title">Leads por programa</div></div>
            <div className="card-body">
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={[...byPrograma].sort((a,b)=>b.totalLeads-a.totalLeads)} layout="vertical" barSize={18}>
                  <XAxis type="number" tick={{ fontSize:9, fill:'var(--text3)' }} axisLine={false} tickLine={false}/>
                  <YAxis type="category" dataKey="prog" tick={{ fontSize:10, fill:'var(--text2)' }} axisLine={false} tickLine={false} width={120}/>
                  <Tooltip content={<Tip/>}/>
                  <Bar dataKey="leadsForm" name="Lead Ads" fill="#1877F2" opacity={.85} radius={[0,0,0,0]} stackId="a"/>
                  <Bar dataKey="leadsWA"   name="WhatsApp"  fill="#25D366" opacity={.85} radius={[0,4,4,0]} stackId="a"/>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-head">
            <div className="card-title">Detalle por programa · Lead Ads vs WhatsApp</div>
            <div style={{ display:'flex', gap:16, fontSize:11, color:'var(--text3)' }}>
              <span style={{ color:'var(--blue)', fontWeight:600 }}>● Lead Ads</span>
              <span style={{ color:'var(--green)', fontWeight:600 }}>● WhatsApp</span>
            </div>
          </div>
          <div style={{ overflowX:'auto' }}>
          <table className="table" style={{ minWidth:860 }}>
            <thead>
              <tr>
                <th style={{ textAlign:'left' }}>PROGRAMA</th>
                <th style={{ textAlign:'right', color:'var(--blue)' }}>LEADS FORM.</th>
                <th style={{ textAlign:'right', color:'var(--blue)' }}>INV. FORM.</th>
                <th style={{ textAlign:'right', color:'var(--blue)' }}>CPL FORM.</th>
                <th style={{ textAlign:'right', color:'#25D366' }}>CONV. WA</th>
                <th style={{ textAlign:'right', color:'#25D366' }}>INV. WA</th>
                <th style={{ textAlign:'right', color:'#25D366' }}>CPL WA</th>
                <th style={{ textAlign:'right', fontWeight:700 }}>TOTAL</th>
                <th style={{ textAlign:'center' }}>EFICIENCIA</th>
              </tr>
            </thead>
            <tbody>
              {byPrograma.map((p,i)=>{
                const cplN=parseFloat(p.cplTotal)||0;
                const cplFN=parseFloat(p.cplForm)||0;
                const cplWN=parseFloat(p.cplWA)||0;
                const eff=!p.cplTotal?'Sin datos':cplN<15?'Excelente':cplN<30?'Bueno':cplN<50?'Regular':'Revisar';
                const effC=!p.cplTotal?'tag-gray':cplN<15?'tag-green':cplN<30?'tag-gold':cplN<50?'tag-yellow':'tag-red';
                return (
                  <tr key={i}>
                    <td style={{ fontWeight:600, color:'var(--text)', minWidth:180 }}>{p.prog}</td>
                    <td style={{ textAlign:'right', color:'var(--blue)', fontWeight:600 }}>{p.leadsForm>0?p.leadsForm.toLocaleString():'—'}</td>
                    <td style={{ textAlign:'right', fontFamily:'var(--mono)', fontSize:12 }}>{p.spendForm>0?`S/ ${fmt(p.spendForm)}`:'—'}</td>
                    <td style={{ textAlign:'right' }}>
                      {p.cplForm?<span className={cplFN<35?'cpl-good':cplFN<60?'cpl-mid':'cpl-high'}>S/ {p.cplForm}</span>:'—'}
                    </td>
                    <td style={{ textAlign:'right', color:'#25D366', fontWeight:600 }}>{p.leadsWA>0?p.leadsWA.toLocaleString():'—'}</td>
                    <td style={{ textAlign:'right', fontFamily:'var(--mono)', fontSize:12 }}>{p.spendWA>0?`S/ ${fmt(p.spendWA)}`:'—'}</td>
                    <td style={{ textAlign:'right' }}>
                      {p.cplWA?<span className={cplWN<5?'cpl-good':cplWN<15?'cpl-mid':'cpl-high'}>S/ {p.cplWA}</span>:'—'}
                    </td>
                    <td style={{ textAlign:'right', fontWeight:700, color:'var(--text)' }}>{p.totalLeads.toLocaleString()}</td>
                    <td style={{ textAlign:'center' }}><span className={`tag ${effC}`}>{eff}</span></td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr style={{ background:'var(--bg3)', borderTop:'2px solid var(--border)' }}>
                <td style={{ fontWeight:700, color:'var(--gold)', fontFamily:'var(--font-tight)', fontSize:12 }}>TOTAL</td>
                <td style={{ textAlign:'right', fontWeight:700, color:'var(--blue)' }}>{byPrograma.reduce((s,p)=>s+p.leadsForm,0).toLocaleString()}</td>
                <td style={{ textAlign:'right', fontFamily:'var(--mono)', fontWeight:600 }}>S/ {fmt(byPrograma.reduce((s,p)=>s+p.spendForm,0))}</td>
                <td style={{ textAlign:'right', fontWeight:600 }}>
                  {(()=>{const tl=byPrograma.reduce((s,p)=>s+p.leadsForm,0),ts=byPrograma.reduce((s,p)=>s+p.spendForm,0);return tl>0?`S/ ${(ts/tl).toFixed(2)}`:'—';})()}
                </td>
                <td style={{ textAlign:'right', fontWeight:700, color:'#25D366' }}>{byPrograma.reduce((s,p)=>s+p.leadsWA,0).toLocaleString()}</td>
                <td style={{ textAlign:'right', fontFamily:'var(--mono)', fontWeight:600 }}>S/ {fmt(byPrograma.reduce((s,p)=>s+p.spendWA,0))}</td>
                <td style={{ textAlign:'right', fontWeight:600 }}>
                  {(()=>{const tl=byPrograma.reduce((s,p)=>s+p.leadsWA,0),ts=byPrograma.reduce((s,p)=>s+p.spendWA,0);return tl>0?`S/ ${(ts/tl).toFixed(2)}`:'—';})()}
                </td>
                <td style={{ textAlign:'right', fontWeight:800, color:'var(--text)' }}>{byPrograma.reduce((s,p)=>s+p.totalLeads,0).toLocaleString()}</td>
                <td/>
              </tr>
            </tfoot>
          </table>
          </div>
        </div>
      </>)}

      {/* ═══ SEM VS SEM ═══ */}
      {tab==='wow'&&(<>
        <div className="alert alert-blue" style={{ marginBottom:20 }}>
          ℹ️ Comparativo <strong>últimas 2 semanas</strong> vs <strong>2 semanas anteriores</strong>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12, marginBottom:24 }}>
          {wow.map((row,i)=>{
            const pct=((row.curr-row.prev)/row.prev*100).toFixed(1);
            const isUp=row.curr>=row.prev;
            const good=row.m==='CPL'?!isUp:isUp;
            return (
              <div key={i} className="kpi-card">
                <div className="kpi-label">{row.m}</div>
                <div style={{ display:'flex', alignItems:'baseline', gap:10, flexWrap:'wrap' }}>
                  <div>
                    <div style={{ fontSize:10, color:'var(--text4)', marginBottom:2 }}>Período anterior</div>
                    <div style={{ fontFamily:'var(--font-tight)', fontWeight:700, fontSize:18, color:'var(--text3)' }}>
                      {row.unit}{row.prev.toLocaleString()}
                    </div>
                  </div>
                  <span style={{ color:'var(--text3)', fontSize:18 }}>→</span>
                  <div>
                    <div style={{ fontSize:10, color:'var(--text4)', marginBottom:2 }}>Período actual</div>
                    <div style={{ fontFamily:'var(--font-tight)', fontWeight:800, fontSize:22, color:'var(--text)' }}>
                      {row.unit}{row.curr.toLocaleString()}
                    </div>
                  </div>
                </div>
                <span className={`kpi-delta ${good?'up':'down'}`}>
                  {isUp?'▲':'▼'} {Math.abs(pct)}%
                </span>
              </div>
            );
          })}
        </div>

        <div className="card">
          <div className="card-head"><div className="card-title">Inversión y leads — últimas 8 semanas</div></div>
          <div className="card-body">
            <ResponsiveContainer width="100%" height={260}>
              <ComposedChart data={WEEKLY.slice(-8)}>
                <XAxis dataKey="s" tick={{ fontSize:10, fill:'var(--text3)' }} axisLine={false} tickLine={false}/>
                <YAxis yAxisId="s" tick={{ fontSize:10, fill:'var(--text3)' }} axisLine={false} tickLine={false} tickFormatter={v=>`S/${(v/1000).toFixed(0)}K`}/>
                <YAxis yAxisId="l" orientation="right" tick={{ fontSize:10, fill:'var(--text3)' }} axisLine={false} tickLine={false}/>
                <CartesianGrid stroke="var(--border)" strokeDasharray="4 4"/>
                <Tooltip content={<Tip/>}/>
                <Bar yAxisId="s" dataKey="spend" name="Inversión S/" fill="#1877F2" opacity={.15} radius={[4,4,0,0]}/>
                <Line yAxisId="l" type="monotone" dataKey="leads" name="Lead Ads" stroke="#059669" strokeWidth={2.5} dot={{ fill:'#059669', r:4 }}/>
                <Line yAxisId="l" type="monotone" dataKey="wa"    name="WhatsApp"  stroke="#25D366" strokeWidth={2}   dot={{ fill:'#25D366', r:3 }}/>
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      </>)}
    </div>
  );
}
