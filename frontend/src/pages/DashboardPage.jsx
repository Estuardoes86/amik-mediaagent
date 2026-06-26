import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMetaCampaigns, useGoogleCampaigns } from '../hooks/useData.js';
import { useApp } from '../context/AppContext.jsx';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid } from 'recharts';

const CLIENTS = [
  { id:'upsjb',  name:'UPSJB',       color:'#2563EB', meta:true,  google:true,  hs:true  },
  { id:'deco',   name:'Deco Shalom', color:'#059669', meta:true,  google:false, hs:false },
  { id:'espac',  name:'ESPAC',       color:'#7C3AED', meta:true,  google:true,  hs:false },
  { id:'libra',  name:'LIBRA',       color:'#DC2626', meta:true,  google:false, hs:false },
];

const DEMO_METRICS = {
  upsjb:  { metaSpend:48169, googleSpend:519794, leads:2701, conversions:87, cpl:17.83, campanas:40 },
  deco:   { metaSpend:3200,  googleSpend:0,       leads:142,  conversions:0,  cpl:22.54, campanas:6  },
  espac:  { metaSpend:8400,  googleSpend:4200,    leads:380,  conversions:45, cpl:21.05, campanas:12 },
  libra:  { metaSpend:1800,  googleSpend:0,       leads:89,   conversions:0,  cpl:20.22, campanas:4  },
};

const TREND = [
  {s:'23/3',upsjb:4200,deco:180,espac:620,libra:90},
  {s:'30/3',upsjb:5100,deco:210,espac:730,libra:110},
  {s:'6/4', upsjb:4800,deco:195,espac:680,libra:95},
  {s:'13/4',upsjb:5600,deco:240,espac:810,libra:130},
  {s:'20/4',upsjb:5200,deco:220,espac:760,libra:120},
  {s:'27/4',upsjb:8400,deco:310,espac:920,libra:150},
  {s:'4/5', upsjb:9200,deco:340,espac:1050,libra:160},
  {s:'11/5',upsjb:11000,deco:380,espac:1200,libra:180},
  {s:'18/5',upsjb:10500,deco:360,espac:1100,libra:170},
  {s:'25/5',upsjb:9800,deco:340,espac:1000,libra:155},
  {s:'1/6', upsjb:10200,deco:355,espac:1080,libra:165},
  {s:'8/6', upsjb:11800,deco:400,espac:1250,libra:185},
  {s:'15/6',upsjb:11200,deco:380,espac:1180,libra:175},
  {s:'22/6',upsjb:6200,deco:210,espac:680,libra:100},
];

const Tip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="chart-tip">
      <div className="chart-tip-label">{label}</div>
      {payload.map((p,i)=>(
        <div key={i} className="chart-tip-row" style={{ color:p.color }}>
          {p.name}: <strong>S/ {p.value?.toLocaleString()}</strong>
        </div>
      ))}
    </div>
  );
};

export default function DashboardPage() {
  const { setActiveClient } = useApp();
  const navigate = useNavigate();
  const [activeClients, setAC] = useState(['upsjb','deco','espac','libra']);

  const totalInv = CLIENTS.filter(c=>activeClients.includes(c.id))
    .reduce((s,c)=>s+(DEMO_METRICS[c.id].metaSpend+DEMO_METRICS[c.id].googleSpend),0);
  const totalLeads = CLIENTS.filter(c=>activeClients.includes(c.id))
    .reduce((s,c)=>s+DEMO_METRICS[c.id].leads,0);
  const avgCpl = totalLeads > 0 ? (totalInv / totalLeads).toFixed(2) : 0;

  const toggleClient = (id) => setAC(prev =>
    prev.includes(id) ? prev.filter(x=>x!==id) : [...prev, id]
  );

  const goTo = (clientId, path) => {
    setActiveClient(clientId);
    navigate(path);
  };

  return (
    <div className="page-wrap scroll-y">

      {/* Header */}
      <div style={{ marginBottom:24 }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <div>
            <h1 className="page-h1">Dashboard global</h1>
            <p className="page-sub">Resumen de todos los clientes · Proceso 2026-II</p>
          </div>
          <div style={{ display:'flex', gap:8, alignItems:'center' }}>
            <span style={{ fontSize:12, color:'var(--text3)' }}>Filtrar clientes:</span>
            {CLIENTS.map(c=>(
              <button key={c.id} onClick={()=>toggleClient(c.id)}
                className={`client-pill${activeClients.includes(c.id)?' active':''}`}
                style={{ borderColor:activeClients.includes(c.id)?c.color:undefined,
                  background:activeClients.includes(c.id)?`${c.color}10`:undefined,
                  color:activeClients.includes(c.id)?c.color:undefined }}>
                <span className="client-dot" style={{ background:c.color }}/>
                {c.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Global KPIs */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14, marginBottom:28 }}>
        {[
          { label:'Inversión total',   value:`S/ ${parseInt(totalInv).toLocaleString()}`, type:'gold',  sub:'Meta + Google · todos los clientes' },
          { label:'Leads totales',     value:totalLeads.toLocaleString(),                  type:'green', sub:'Formularios + WhatsApp' },
          { label:'CPL promedio',      value:`S/ ${avgCpl}`,                               type:'blue',  sub:'Costo por lead combinado' },
          { label:'Clientes activos',  value:activeClients.length,                         type:'',      sub:'de 4 clientes totales' },
        ].map((k,i)=>(
          <div key={i} className={`kpi-card ${k.type}`}>
            <div className="kpi-label">{k.label}</div>
            <div className="kpi-value">{k.value}</div>
            <div className="kpi-sub">{k.sub}</div>
          </div>
        ))}
      </div>

      {/* Client cards */}
      <div style={{ marginBottom:10 }}>
        <div className="section-header">
          <div>
            <div className="section-title">Rendimiento por cliente</div>
            <div className="section-sub">Clic en una tarjeta para ir al detalle</div>
          </div>
        </div>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:16, marginBottom:32 }}>
        {CLIENTS.filter(c=>activeClients.includes(c.id)).map(client=>{
          const m = DEMO_METRICS[client.id];
          const totalSpend = m.metaSpend + m.googleSpend;
          return (
            <div key={client.id} className="card" style={{ cursor:'pointer', transition:'all .2s' }}
              onMouseEnter={e=>{ e.currentTarget.style.boxShadow='var(--shadow-md)'; e.currentTarget.style.borderColor=client.color; }}
              onMouseLeave={e=>{ e.currentTarget.style.boxShadow=''; e.currentTarget.style.borderColor=''; }}>

              {/* Card header */}
              <div className="card-head" style={{ borderLeft:`4px solid ${client.color}` }}>
                <div>
                  <div style={{ fontWeight:700, fontSize:15, color:'var(--text)' }}>{client.name}</div>
                  <div style={{ fontSize:12, color:'var(--text3)', marginTop:2 }}>
                    {m.campanas} campañas activas
                  </div>
                </div>
                <div style={{ display:'flex', gap:6' }}>
                  {client.meta   && <span className="platform-badge meta">Meta</span>}
                  {client.google && <span className="platform-badge google">Google</span>}
                  {client.hs     && <span className="platform-badge hs">HubSpot</span>}
                </div>
              </div>

              {/* Metrics grid */}
              <div className="card-body">
                <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12, marginBottom:16 }}>
                  {[
                    { l:'Inversión', v:`S/ ${parseInt(totalSpend).toLocaleString()}` },
                    { l:'Leads',     v:m.leads.toLocaleString() },
                    { l:'CPL',       v:`S/ ${m.cpl}` },
                  ].map((stat,i)=>(
                    <div key={i} style={{ background:'var(--bg3)', borderRadius:8, padding:'12px 14px' }}>
                      <div style={{ fontSize:11, color:'var(--text3)', fontWeight:600, marginBottom:4 }}>{stat.l}</div>
                      <div style={{ fontFamily:'var(--font-tight)', fontWeight:700, fontSize:20, color:'var(--text)' }}>{stat.v}</div>
                    </div>
                  ))}
                </div>

                {/* Platform breakdown */}
                <div style={{ display:'flex', gap:8, marginBottom:14 }}>
                  {client.meta && (
                    <div style={{ flex:1, background:'var(--meta-bg)', borderRadius:6, padding:'8px 12px', border:'1px solid var(--blue-border)' }}>
                      <div style={{ fontSize:10, fontWeight:700, color:'var(--meta)', marginBottom:2 }}>META ADS</div>
                      <div style={{ fontFamily:'var(--font-tight)', fontWeight:700, fontSize:16 }}>S/ {m.metaSpend.toLocaleString()}</div>
                    </div>
                  )}
                  {client.google && (
                    <div style={{ flex:1, background:'var(--google-bg)', borderRadius:6, padding:'8px 12px', border:'1px solid var(--red-border)' }}>
                      <div style={{ fontSize:10, fontWeight:700, color:'var(--google)', marginBottom:2 }}>GOOGLE ADS</div>
                      <div style={{ fontFamily:'var(--font-tight)', fontWeight:700, fontSize:16 }}>S/ {m.googleSpend.toLocaleString()}</div>
                    </div>
                  )}
                  {client.hs && (
                    <div style={{ flex:1, background:'var(--hs-bg)', borderRadius:6, padding:'8px 12px', border:'1px solid #FFD0C0' }}>
                      <div style={{ fontSize:10, fontWeight:700, color:'var(--hs)', marginBottom:2 }}>HUBSPOT</div>
                      <div style={{ fontFamily:'var(--font-tight)', fontWeight:700, fontSize:16 }}>922 leads</div>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div style={{ display:'flex', gap:8 }}>
                  {client.meta   && <button className="btn btn-ghost btn-sm" onClick={()=>goTo(client.id,'/meta')}>📘 Meta</button>}
                  {client.google && <button className="btn btn-ghost btn-sm" onClick={()=>goTo(client.id,'/google')}>🔍 Google</button>}
                  {client.hs     && <button className="btn btn-ghost btn-sm" onClick={()=>goTo(client.id,'/hubspot')}>🟠 HubSpot</button>}
                  <button className="btn btn-secondary btn-sm" style={{ marginLeft:'auto' }}
                    onClick={()=>goTo(client.id,'/campaigns')}>Ver campañas →</button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Trend chart */}
      <div className="card" style={{ marginBottom:28 }}>
        <div className="card-head">
          <div>
            <div className="card-title">Inversión semanal por cliente</div>
          </div>
        </div>
        <div className="card-body">
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={TREND}>
              <XAxis dataKey="s" tick={{ fontSize:10, fill:'var(--text3)' }} axisLine={false} tickLine={false}/>
              <YAxis tick={{ fontSize:10, fill:'var(--text3)' }} axisLine={false} tickLine={false} tickFormatter={v=>`S/${(v/1000).toFixed(0)}K`}/>
              <CartesianGrid stroke="var(--border)" strokeDasharray="4 4"/>
              <Tooltip content={<Tip/>}/>
              {activeClients.includes('upsjb') && <Line type="monotone" dataKey="upsjb" name="UPSJB" stroke="#2563EB" strokeWidth={2.5} dot={false}/>}
              {activeClients.includes('deco')  && <Line type="monotone" dataKey="deco"  name="Deco"  stroke="#059669" strokeWidth={2}   dot={false}/>}
              {activeClients.includes('espac') && <Line type="monotone" dataKey="espac" name="ESPAC" stroke="#7C3AED" strokeWidth={2}   dot={false}/>}
              {activeClients.includes('libra') && <Line type="monotone" dataKey="libra" name="LIBRA" stroke="#DC2626" strokeWidth={2}   dot={false}/>}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

    </div>
  );
}
