import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext.jsx';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

const METRICS = {
  upsjb: { metaSpend:48169, googleSpend:519794, leads:2701, cpl:17.83, campanas:40, conv:87,  hs:922  },
  deco:  { metaSpend:3200,  googleSpend:0,       leads:142,  cpl:22.54, campanas:6,  conv:0,   hs:0    },
  espac: { metaSpend:8400,  googleSpend:4200,    leads:380,  cpl:21.05, campanas:12, conv:45,  hs:0    },
  libra: { metaSpend:1800,  googleSpend:0,       leads:89,   cpl:20.22, campanas:4,  conv:0,   hs:0    },
};

const TREND = {
  upsjb: [
    {s:'23/3',v:4200},{s:'30/3',v:5100},{s:'6/4',v:4800},{s:'13/4',v:5600},
    {s:'20/4',v:5200},{s:'27/4',v:8400},{s:'4/5',v:9200},{s:'11/5',v:11000},
    {s:'18/5',v:10500},{s:'25/5',v:9800},{s:'1/6',v:10200},{s:'8/6',v:11800},
    {s:'15/6',v:11200},{s:'22/6',v:6200},
  ],
  deco: [
    {s:'23/3',v:180},{s:'30/3',v:210},{s:'6/4',v:195},{s:'13/4',v:240},
    {s:'20/4',v:220},{s:'27/4',v:310},{s:'4/5',v:340},{s:'11/5',v:380},
    {s:'18/5',v:360},{s:'25/5',v:340},{s:'1/6',v:355},{s:'8/6',v:400},
    {s:'15/6',v:380},{s:'22/6',v:210},
  ],
  espac: [
    {s:'23/3',v:620},{s:'30/3',v:730},{s:'6/4',v:680},{s:'13/4',v:810},
    {s:'20/4',v:760},{s:'27/4',v:920},{s:'4/5',v:1050},{s:'11/5',v:1200},
    {s:'18/5',v:1100},{s:'25/5',v:1000},{s:'1/6',v:1080},{s:'8/6',v:1250},
    {s:'15/6',v:1180},{s:'22/6',v:680},
  ],
  libra: [
    {s:'23/3',v:90},{s:'30/3',v:110},{s:'6/4',v:95},{s:'13/4',v:130},
    {s:'20/4',v:120},{s:'27/4',v:150},{s:'4/5',v:160},{s:'11/5',v:180},
    {s:'18/5',v:170},{s:'25/5',v:155},{s:'1/6',v:165},{s:'8/6',v:185},
    {s:'15/6',v:175},{s:'22/6',v:100},
  ],
};

const PLATFORMS = {
  upsjb: { meta:true, google:true, hs:true  },
  deco:  { meta:true, google:false,hs:false },
  espac: { meta:true, google:true, hs:false },
  libra: { meta:true, google:false,hs:false },
};

const Tip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="chart-tip">
      <div className="chart-tip-label">{label}</div>
      {payload.map((p,i)=>(
        <div key={i} className="chart-tip-row">
          <strong>S/ {p.value?.toLocaleString()}</strong>
        </div>
      ))}
    </div>
  );
};

export default function DashboardPage() {
  const { activeClient } = useApp();
  const navigate = useNavigate();
  const id = activeClient?.id || 'upsjb';
  const m = METRICS[id];
  const pl = PLATFORMS[id];
  const trend = TREND[id];
  const totalSpend = m.metaSpend + m.googleSpend;

  const kpis = [
    { label:'Inversión total',    value:`S/ ${parseInt(totalSpend).toLocaleString()}`, sub:'Meta + Google', type:'gold'  },
    { label:'Leads totales',      value:m.leads.toLocaleString(),                       sub:'Formularios + WhatsApp', type:'green' },
    { label:'CPL promedio',       value:`S/ ${m.cpl}`,                                  sub:'Costo por lead', type:'blue' },
    { label:'Campañas activas',   value:m.campanas,                                     sub:'todas las plataformas', type:'' },
  ];

  return (
    <div className="page-wrap scroll-y">

      {/* Header */}
      <div style={{ marginBottom:24 }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <div>
            <h1 className="page-h1" style={{ display:'flex', alignItems:'center', gap:10 }}>
              <span style={{ display:'inline-block', width:12, height:12, borderRadius:'50%', background:activeClient?.color||'#DCA145' }}/>
              {activeClient?.fullName || activeClient?.name}
            </h1>
            <p className="page-sub">Resumen de rendimiento · Proceso 2026-II</p>
          </div>
          <div style={{ display:'flex', gap:8 }}>
            {pl.meta   && <button className="btn btn-ghost btn-sm" onClick={()=>navigate('/meta')}>📘 Meta Ads</button>}
            {pl.google && <button className="btn btn-ghost btn-sm" onClick={()=>navigate('/google')}>🔍 Google Ads</button>}
            {pl.hs     && <button className="btn btn-ghost btn-sm" onClick={()=>navigate('/hubspot')}>🟠 HubSpot</button>}
            <button className="btn btn-secondary btn-sm" onClick={()=>navigate('/campaigns')}>Ver campañas →</button>
          </div>
        </div>
      </div>

      {/* KPIs */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14, marginBottom:28 }}>
        {kpis.map((k,i)=>(
          <div key={i} className={`kpi-card ${k.type}`}>
            <div className="kpi-label">{k.label}</div>
            <div className="kpi-value">{k.value}</div>
            <div className="kpi-sub">{k.sub}</div>
          </div>
        ))}
      </div>

      {/* Platform breakdown */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:14, marginBottom:28 }}>
        {pl.meta && (
          <div className="card" style={{ cursor:'pointer', borderTop:'3px solid #1877F2' }} onClick={()=>navigate('/meta')}>
            <div className="card-body">
              <div style={{ fontSize:11, fontWeight:700, color:'#1877F2', marginBottom:8, letterSpacing:'1px' }}>META ADS</div>
              <div style={{ fontFamily:'var(--font-tight)', fontWeight:800, fontSize:28, color:'var(--text)', marginBottom:4 }}>
                S/ {m.metaSpend.toLocaleString()}
              </div>
              <div style={{ fontSize:12, color:'var(--text3)' }}>Inversión en Meta</div>
              <div style={{ marginTop:12, paddingTop:12, borderTop:'1px solid var(--border)', display:'flex', justifyContent:'space-between' }}>
                <span style={{ fontSize:12, color:'var(--text3)' }}>Ver detalle</span>
                <span style={{ fontSize:12, color:'#1877F2', fontWeight:600 }}>→</span>
              </div>
            </div>
          </div>
        )}
        {pl.google && (
          <div className="card" style={{ cursor:'pointer', borderTop:'3px solid #EA4335' }} onClick={()=>navigate('/google')}>
            <div className="card-body">
              <div style={{ fontSize:11, fontWeight:700, color:'#EA4335', marginBottom:8, letterSpacing:'1px' }}>GOOGLE ADS</div>
              <div style={{ fontFamily:'var(--font-tight)', fontWeight:800, fontSize:28, color:'var(--text)', marginBottom:4 }}>
                S/ {m.googleSpend.toLocaleString()}
              </div>
              <div style={{ fontSize:12, color:'var(--text3)' }}>Inversión en Google</div>
              <div style={{ marginTop:12, paddingTop:12, borderTop:'1px solid var(--border)', display:'flex', justifyContent:'space-between' }}>
                <span style={{ fontSize:12, color:'var(--text3)' }}>Ver detalle</span>
                <span style={{ fontSize:12, color:'#EA4335', fontWeight:600 }}>→</span>
              </div>
            </div>
          </div>
        )}
        {pl.hs && (
          <div className="card" style={{ cursor:'pointer', borderTop:'3px solid #FF7A59' }} onClick={()=>navigate('/hubspot')}>
            <div className="card-body">
              <div style={{ fontSize:11, fontWeight:700, color:'#FF7A59', marginBottom:8, letterSpacing:'1px' }}>HUBSPOT CRM</div>
              <div style={{ fontFamily:'var(--font-tight)', fontWeight:800, fontSize:28, color:'var(--text)', marginBottom:4 }}>
                {m.hs.toLocaleString()}
              </div>
              <div style={{ fontSize:12, color:'var(--text3)' }}>Leads en pipeline</div>
              <div style={{ marginTop:12, paddingTop:12, borderTop:'1px solid var(--border)', display:'flex', justifyContent:'space-between' }}>
                <span style={{ fontSize:12, color:'var(--text3)' }}>Ver detalle</span>
                <span style={{ fontSize:12, color:'#FF7A59', fontWeight:600 }}>→</span>
              </div>
            </div>
          </div>
        )}
        {!pl.google && !pl.hs && (
          <div className="card" style={{ opacity:0.4, borderTop:'3px solid var(--border)' }}>
            <div className="card-body">
              <div style={{ fontSize:11, fontWeight:700, color:'var(--text3)', marginBottom:8 }}>GOOGLE ADS</div>
              <div style={{ fontSize:13, color:'var(--text3)' }}>No configurado</div>
            </div>
          </div>
        )}
      </div>

      {/* Trend chart */}
      <div className="card" style={{ marginBottom:28 }}>
        <div className="card-head">
          <div className="card-title">Inversión semanal</div>
        </div>
        <div className="card-body">
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={trend}>
              <XAxis dataKey="s" tick={{ fontSize:10, fill:'var(--text3)' }} axisLine={false} tickLine={false}/>
              <YAxis tick={{ fontSize:10, fill:'var(--text3)' }} axisLine={false} tickLine={false} tickFormatter={v=>`S/${(v/1000).toFixed(0)}K`}/>
              <CartesianGrid stroke="var(--border)" strokeDasharray="4 4"/>
              <Tooltip content={<Tip/>}/>
              <Line type="monotone" dataKey="v" name="Inversión" stroke={activeClient?.color||'#DCA145'} strokeWidth={2.5} dot={false}/>
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

    </div>
  );
}
