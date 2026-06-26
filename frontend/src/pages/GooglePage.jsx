import React from 'react';
import { useGoogleCampaigns } from '../hooks/useData.js';
import { useApp } from '../context/AppContext.jsx';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, AreaChart, Area } from 'recharts';

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

const DEMO = [
  { id:1, name:'Admisiones · Search · Lima',     status:'ENABLED', type:'SEARCH',  spend:12800, clicks:1840, conv:42,  ctr:4.3,  cpc:6.96 },
  { id:2, name:'Medicina · Search · Nacional',   status:'ENABLED', type:'SEARCH',  spend:9400,  clicks:1120, conv:28,  ctr:3.8,  cpc:8.39 },
  { id:3, name:'Posgrado · Search · Lima',       status:'ENABLED', type:'SEARCH',  spend:7200,  clicks:880,  conv:18,  ctr:3.3,  cpc:8.18 },
  { id:4, name:'Remarketing · Display',          status:'ENABLED', type:'DISPLAY', spend:4800,  clicks:580,  conv:12,  ctr:0.8,  cpc:8.28 },
  { id:5, name:'Carreras · PMax',               status:'ENABLED', type:'PMAX',    spend:8200,  clicks:1240, conv:22,  ctr:2.1,  cpc:6.61 },
  { id:6, name:'Distancia · Search',             status:'PAUSED',  type:'SEARCH',  spend:0,     clicks:0,    conv:0,   ctr:0,    cpc:0    },
];

const WEEKLY = [
  {s:'23/3',spend:8200,conv:12},{s:'30/3',spend:9100,conv:14},{s:'6/4',spend:8600,conv:13},
  {s:'13/4',spend:10200,conv:16},{s:'20/4',spend:9600,conv:15},{s:'27/4',spend:14800,conv:22},
  {s:'4/5',spend:16400,conv:25},{s:'11/5',spend:19800,conv:30},{s:'18/5',spend:18900,conv:29},
  {s:'25/5',spend:17600,conv:27},{s:'1/6',spend:18200,conv:28},{s:'8/6',spend:21200,conv:32},
  {s:'15/6',spend:20100,conv:31},{s:'22/6',spend:11200,conv:17},
];

export default function GooglePage() {
  const { activeClient } = useApp();
  const { campaigns: live, summary, loading } = useGoogleCampaigns();
  const hasData = !!activeClient?.googleCustomerId;
  const camps = hasData ? live : DEMO;

  const totalSpend = hasData ? parseFloat(summary.spend||0) : camps.reduce((s,c)=>s+c.spend,0);
  const totalConv  = hasData ? parseInt(summary.conversions||0) : camps.reduce((s,c)=>s+c.conv,0);
  const totalClics = hasData ? parseInt(summary.clicks||0)  : camps.reduce((s,c)=>s+c.clicks,0);
  const cpl   = totalConv  > 0 ? (totalSpend/totalConv ).toFixed(2) : '—';
  const cpc   = totalClics > 0 ? (totalSpend/totalClics).toFixed(2) : '—';

  return (
    <div className="page-wrap scroll-y">
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:24 }}>
        <div>
          <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:4 }}>
            <h1 className="page-h1">Google Ads</h1>
            <span className="platform-badge google">Google Ads API</span>
            {!hasData && <span className="tag tag-yellow">Demo</span>}
            {loading && <span className="spinner"/>}
          </div>
          <p className="page-sub">{activeClient?.name} · Datos en tiempo real de Google Ads API</p>
        </div>
        <button className="btn btn-ghost btn-sm">↻ Actualizar</button>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14, marginBottom:14 }}>
        <div className="kpi-card google">
          <div className="kpi-label">Inversión total</div>
          <div className="kpi-value">S/ {parseInt(totalSpend).toLocaleString()}</div>
          <div className="kpi-sub">Google Ads · todas las campañas</div>
        </div>
        <div className="kpi-card green">
          <div className="kpi-label">Conversiones</div>
          <div className="kpi-value">{totalConv.toLocaleString()}</div>
          <span className="kpi-delta up">▲ +18% vs ant.</span>
        </div>
        <div className="kpi-card gold">
          <div className="kpi-label">CPL Google</div>
          <div className="kpi-value">S/ {cpl}</div>
          <div className="kpi-sub">Costo por conversión</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">CPC promedio</div>
          <div className="kpi-value">S/ {cpc}</div>
          <div className="kpi-sub">{totalClics.toLocaleString()} clics totales</div>
        </div>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14, marginBottom:28 }}>
        <div className="kpi-card"><div className="kpi-label">Campañas activas</div><div className="kpi-value">{camps.filter(c=>c.status==='ENABLED').length}</div><div className="kpi-sub">de {camps.length} total</div></div>
        <div className="kpi-card"><div className="kpi-label">Search</div><div className="kpi-value">{camps.filter(c=>c.type==='SEARCH').length}</div><div className="kpi-sub">campañas Search</div></div>
        <div className="kpi-card"><div className="kpi-label">Display</div><div className="kpi-value">{camps.filter(c=>c.type==='DISPLAY').length}</div><div className="kpi-sub">campañas Display</div></div>
        <div className="kpi-card"><div className="kpi-label">PMax</div><div className="kpi-value">{camps.filter(c=>c.type==='PMAX').length}</div><div className="kpi-sub">Performance Max</div></div>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr', gap:20, marginBottom:24 }}>
        <div className="card">
          <div className="card-head"><div className="card-title">Inversión y conversiones semanales</div></div>
          <div className="card-body">
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={WEEKLY}>
                <defs>
                  <linearGradient id="gspend" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#EA4335" stopOpacity={.12}/>
                    <stop offset="95%" stopColor="#EA4335" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="s" tick={{ fontSize:10, fill:'var(--text3)' }} axisLine={false} tickLine={false}/>
                <YAxis tick={{ fontSize:10, fill:'var(--text3)' }} axisLine={false} tickLine={false} tickFormatter={v=>`S/${(v/1000).toFixed(0)}K`}/>
                <CartesianGrid stroke="var(--border)" strokeDasharray="4 4"/>
                <Tooltip content={<Tip/>}/>
                <Area type="monotone" dataKey="spend" name="Inversión S/" stroke="#EA4335" fill="url(#gspend)" strokeWidth={2.5}/>
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="card">
          <div className="card-head"><div className="card-title">Conv. por tipo</div></div>
          <div className="card-body">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={['SEARCH','DISPLAY','PMAX'].map(t=>({ name:t, spend:camps.filter(c=>c.type===t).reduce((s,c)=>s+c.spend,0), conv:camps.filter(c=>c.type===t).reduce((s,c)=>s+c.conv,0) }))} barSize={28}>
                <XAxis dataKey="name" tick={{ fontSize:10, fill:'var(--text3)' }} axisLine={false} tickLine={false}/>
                <YAxis tick={{ fontSize:10, fill:'var(--text3)' }} axisLine={false} tickLine={false}/>
                <Tooltip content={<Tip/>}/>
                <Bar dataKey="conv" name="Conversiones" fill="#EA4335" radius={[4,4,0,0]} opacity={.85}/>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-head"><div className="card-title">Campañas Google Ads</div></div>
        <table className="table">
          <thead>
            <tr>
              <th style={{ textAlign:'left' }}>CAMPAÑA</th>
              <th>TIPO</th>
              <th>ESTADO</th>
              <th style={{ textAlign:'right' }}>INVERSIÓN</th>
              <th style={{ textAlign:'right' }}>CLICS</th>
              <th style={{ textAlign:'right' }}>CONV.</th>
              <th style={{ textAlign:'right' }}>CPL</th>
              <th style={{ textAlign:'right' }}>CPC</th>
            </tr>
          </thead>
          <tbody>
            {camps.map(c=>{
              const cpl=c.conv>0?(c.spend/c.conv).toFixed(2):null;
              const cpc=c.clicks>0?(c.spend/c.clicks).toFixed(2):null;
              const cplC=!cpl?'':parseFloat(cpl)<100?'cpl-good':parseFloat(cpl)<200?'cpl-mid':'cpl-high';
              return (
                <tr key={c.id}>
                  <td style={{ fontWeight:500, color:'var(--text)' }}>{c.name}</td>
                  <td><span className="tag tag-gray" style={{ fontSize:10 }}>{c.type}</span></td>
                  <td><span className={`status-pill ${c.status==='ENABLED'?'active':'paused'}`}>{c.status==='ENABLED'?'Activa':'Pausada'}</span></td>
                  <td style={{ textAlign:'right', fontFamily:'var(--mono)', fontWeight:600 }}>S/ {c.spend.toLocaleString()}</td>
                  <td style={{ textAlign:'right' }}>{(c.clicks||0).toLocaleString()}</td>
                  <td style={{ textAlign:'right', fontWeight:600, color:'var(--green)' }}>{c.conv||'—'}</td>
                  <td style={{ textAlign:'right' }}>{cpl?<span className={cplC}>S/ {cpl}</span>:<span style={{color:'var(--text4)'}}>—</span>}</td>
                  <td style={{ textAlign:'right' }}>{cpc?`S/ ${cpc}`:'—'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <div style={{ padding:'12px 16px', borderTop:'1px solid var(--border)', background:'var(--bg3)', display:'flex', gap:24, fontSize:12, color:'var(--text3)' }}>
          <span>Inversión total: <strong>S/ {camps.reduce((s,c)=>s+c.spend,0).toLocaleString()}</strong></span>
          <span>Conv. total: <strong style={{color:'var(--green)'}}>{camps.reduce((s,c)=>s+c.conv,0)}</strong></span>
          <span>CPL promedio: <strong>{cpl!=='—'?`S/ ${cpl}`:'—'}</strong></span>
        </div>
      </div>
    </div>
  );
}
