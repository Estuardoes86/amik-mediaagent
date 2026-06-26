import React, { useState } from 'react';
import { useMetaCampaigns } from '../hooks/useData.js';
import { useApp } from '../context/AppContext.jsx';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  AreaChart, Area, CartesianGrid, PieChart, Pie, Cell, Legend
} from 'recharts';

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

const DEMO_CAMPAIGNS = [
  { id:1, name:'MEDICINA_HUMANA_FORM',    status:'ACTIVE', spend:4200, leads:94,  clics:2100, impr:82000,  ctr:2.56, cpm:51.22 },
  { id:2, name:'ENFERMERIA_FORM',          status:'ACTIVE', spend:3800, leads:88,  clics:1900, impr:71000,  ctr:2.68, cpm:53.52 },
  { id:3, name:'PSICOLOGIA_FORM',          status:'ACTIVE', spend:2600, leads:72,  clics:1400, impr:54000,  ctr:2.59, cpm:48.15 },
  { id:4, name:'DERECHO_FORM',             status:'ACTIVE', spend:1800, leads:48,  clics:980,  impr:38000,  ctr:2.58, cpm:47.37 },
  { id:5, name:'DISTANCIA_FORM',           status:'ACTIVE', spend:2900, leads:102, clics:1800, impr:69000,  ctr:2.61, cpm:42.03 },
  { id:6, name:'WA_MEDICINA_HUMANA',       status:'ACTIVE', spend:3824, leads:0,   clics:3564, impr:481783, ctr:0.74, cpm:7.94  },
  { id:7, name:'WA_DISTANCIA',             status:'ACTIVE', spend:557,  leads:0,   clics:328,  impr:45000,  ctr:0.73, cpm:12.38 },
  { id:8, name:'BRANDING_INSTITUCIONAL',   status:'ACTIVE', spend:1500, leads:18,  clics:650,  impr:43000,  ctr:1.51, cpm:34.88 },
  { id:9, name:'ADMINISTRACION_FORM',      status:'PAUSED', spend:0,    leads:0,   clics:0,    impr:0,      ctr:0,    cpm:0     },
];

const WEEKLY = [
  {s:'23/3',spend:4200,leads:95, wa:48 },{s:'30/3',spend:5100,leads:112,wa:54},
  {s:'6/4', spend:4800,leads:108,wa:50 },{s:'13/4',spend:5600,leads:128,wa:62},
  {s:'20/4',spend:5200,leads:118,wa:57 },{s:'27/4',spend:8400,leads:185,wa:90},
  {s:'4/5', spend:9200,leads:204,wa:98 },{s:'11/5',spend:11000,leads:240,wa:115},
  {s:'18/5',spend:10500,leads:229,wa:110},{s:'25/5',spend:9800,leads:214,wa:103},
  {s:'1/6', spend:10200,leads:222,wa:107},{s:'8/6', spend:11800,leads:257,wa:123},
  {s:'15/6',spend:11200,leads:244,wa:117},{s:'22/6',spend:6200,leads:136,wa:66},
];

export default function MetaPage() {
  const { activeClient } = useApp();
  const { campaigns: liveCamps, summary, loading } = useMetaCampaigns();
  const [tab,    setTab]    = useState('overview');
  const [sortK,  setSortK]  = useState('spend');
  const [sortDir,setSortDir]= useState('desc');
  const [search, setSearch] = useState('');
  const [statusF,setStatusF]= useState('all');

  const hasData = !!activeClient?.metaAccountId;
  const camps = hasData ? liveCamps : DEMO_CAMPAIGNS;

  const totalSpend = hasData ? parseFloat(summary.spend||0) : camps.reduce((s,c)=>s+c.spend,0);
  const totalLeads = hasData ? parseInt(summary.leads||0)   : camps.reduce((s,c)=>s+c.leads,0);
  const totalWA    = hasData ? parseInt(summary.waConv||0)  : camps.filter(c=>c.name.includes('WA')).reduce((s,c)=>s+c.clics,0);
  const totalClics = hasData ? parseInt(summary.clicks||0)  : camps.reduce((s,c)=>s+c.clics,0);
  const totalImpr  = hasData ? parseInt(summary.impressions||0) : camps.reduce((s,c)=>s+c.impr,0);
  const cplLeads   = totalLeads > 0 ? (totalSpend / totalLeads).toFixed(2) : '—';
  const cplWA      = totalWA    > 0 ? (totalSpend / totalWA   ).toFixed(2) : '—';
  const ctr        = totalImpr  > 0 ? ((totalClics/totalImpr)*100).toFixed(2) : '—';
  const cpm        = totalImpr  > 0 ? ((totalSpend/totalImpr)*1000).toFixed(2) : '—';
  const cpc        = totalClics > 0 ? (totalSpend/totalClics).toFixed(2) : '—';

  // Separate Lead Ads vs WhatsApp
  const leadCamps = camps.filter(c=>!c.name?.toUpperCase().includes('WA'));
  const waCamps   = camps.filter(c=> c.name?.toUpperCase().includes('WA'));
  const leadSpend = leadCamps.reduce((s,c)=>s+c.spend,0);
  const waSpend   = waCamps.reduce((s,c)=>s+c.spend,0);
  const leadLeads = leadCamps.reduce((s,c)=>s+c.leads,0);

  // Sorted/filtered campaigns
  const filteredCamps = [...camps]
    .filter(c => {
      if(statusF==='active') return c.status==='ACTIVE';
      if(statusF==='paused') return c.status!=='ACTIVE';
      return true;
    })
    .filter(c => !search || c.name?.toLowerCase().includes(search.toLowerCase()))
    .sort((a,b) => {
      const av = a[sortK]??0, bv = b[sortK]??0;
      return sortDir==='asc' ? av-bv : bv-av;
    });

  const SortTh = ({label, k, align='right'}) => (
    <th style={{ textAlign:align, cursor:'pointer' }}
      className={sortK===k?'sorted':''} onClick={()=>{
        if(sortK===k) setSortDir(d=>d==='asc'?'desc':'asc');
        else { setSortK(k); setSortDir('desc'); }
      }}>
      {label} {sortK===k ? (sortDir==='asc'?'↑':'↓') : '↕'}
    </th>
  );

  const pieData = [
    { name:'Lead Ads', value:leadSpend },
    { name:'WhatsApp', value:waSpend   },
  ];

  return (
    <div className="page-wrap scroll-y">

      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:24 }}>
        <div>
          <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:4 }}>
            <h1 className="page-h1">Meta Ads</h1>
            <span className="platform-badge meta">Meta Ads Manager</span>
            {!hasData && <span className="tag tag-yellow">Demo</span>}
            {loading && <span className="spinner"/>}
          </div>
          <p className="page-sub">{activeClient?.name} · Datos en tiempo real de Meta Graph API</p>
        </div>
        <div style={{ display:'flex', gap:8 }}>
          <button className="btn btn-ghost btn-sm">↻ Actualizar</button>
          <button className="btn btn-primary btn-sm">+ Nueva campaña</button>
        </div>
      </div>

      {/* KPIs */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14, marginBottom:14 }}>
        <div className="kpi-card meta">
          <div className="kpi-label">Inversión total</div>
          <div className="kpi-value">S/ {parseInt(totalSpend).toLocaleString()}</div>
          <div className="kpi-sub">Lead Ads + WhatsApp</div>
        </div>
        <div className="kpi-card green">
          <div className="kpi-label">Leads (formulario)</div>
          <div className="kpi-value">{totalLeads.toLocaleString()}</div>
          <span className="kpi-delta up">▲ +21% vs ant.</span>
        </div>
        <div className="kpi-card gold">
          <div className="kpi-label">CPL Lead Ads</div>
          <div className="kpi-value">S/ {cplLeads}</div>
          <div className="kpi-sub">Costo por lead formulario</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">WhatsApp (CTWA)</div>
          <div className="kpi-value">{totalWA.toLocaleString()}</div>
          <div className="kpi-sub">CPL WA: S/ {cplWA}</div>
        </div>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14, marginBottom:28 }}>
        <div className="kpi-card">
          <div className="kpi-label">Clics totales</div>
          <div className="kpi-value">{totalClics.toLocaleString()}</div>
          <div className="kpi-sub">CTR: {ctr}%</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Impresiones</div>
          <div className="kpi-value">{totalImpr > 0 ? (totalImpr/1000000).toFixed(1)+'M' : '5.7M'}</div>
          <div className="kpi-sub">CPM: S/ {cpm}</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">CPC promedio</div>
          <div className="kpi-value">S/ {cpc}</div>
          <div className="kpi-sub">Costo por clic</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Campañas activas</div>
          <div className="kpi-value">{camps.filter(c=>c.status==='ACTIVE').length}</div>
          <div className="kpi-sub">de {camps.length} total</div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display:'flex', gap:2, borderBottom:'1px solid var(--border)', marginBottom:24 }}>
        {[
          {k:'overview', l:'Vista general'},
          {k:'campaigns',l:'Campañas'},
          {k:'creative', l:'Creativos'},
        ].map(t=>(
          <button key={t.k} onClick={()=>setTab(t.k)} style={{
            padding:'9px 18px', fontSize:13, fontWeight:600, cursor:'pointer',
            border:'none', background:'transparent',
            color:tab===t.k?'var(--text)':'var(--text3)',
            borderBottom:tab===t.k?'2px solid var(--gold)':'2px solid transparent',
            transition:'all .15s',
          }}>{t.l}</button>
        ))}
      </div>

      {/* ── OVERVIEW ── */}
      {tab==='overview' && (<>
        <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr', gap:20, marginBottom:24 }}>
          <div className="card">
            <div className="card-head">
              <div className="card-title">Inversión y leads semanales</div>
            </div>
            <div className="card-body">
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={WEEKLY}>
                  <defs>
                    <linearGradient id="mspend" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#1877F2" stopOpacity={.15}/>
                      <stop offset="95%" stopColor="#1877F2" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="s" tick={{ fontSize:10, fill:'var(--text3)' }} axisLine={false} tickLine={false}/>
                  <YAxis tick={{ fontSize:10, fill:'var(--text3)' }} axisLine={false} tickLine={false} tickFormatter={v=>`S/${(v/1000).toFixed(0)}K`}/>
                  <CartesianGrid stroke="var(--border)" strokeDasharray="4 4"/>
                  <Tooltip content={<Tip/>}/>
                  <Area type="monotone" dataKey="spend" name="Inversión S/" stroke="#1877F2" fill="url(#mspend)" strokeWidth={2.5}/>
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
            <div className="card">
              <div className="card-head"><div className="card-title">Distribución inversión</div></div>
              <div className="card-body">
                <ResponsiveContainer width="100%" height={160}>
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={42} outerRadius={62} dataKey="value" paddingAngle={4}>
                      <Cell fill="#1877F2"/><Cell fill="#25D366"/>
                    </Pie>
                    <Tooltip formatter={v=>`S/ ${parseInt(v).toLocaleString()}`} contentStyle={{ background:'var(--bg2)', border:'1px solid var(--border)', borderRadius:8, fontSize:12 }}/>
                    <Legend iconType="circle" iconSize={7} wrapperStyle={{ fontSize:11 }}/>
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="card">
              <div className="card-head"><div className="card-title">Leads por semana</div></div>
              <div className="card-body" style={{ padding:'12px 16px' }}>
                <ResponsiveContainer width="100%" height={100}>
                  <BarChart data={WEEKLY.slice(-7)} barSize={12}>
                    <XAxis dataKey="s" tick={{ fontSize:9, fill:'var(--text3)' }} axisLine={false} tickLine={false}/>
                    <Tooltip content={<Tip/>}/>
                    <Bar dataKey="leads" name="Lead Ads" fill="#1877F2" radius={[2,2,0,0]}/>
                    <Bar dataKey="wa"    name="WhatsApp"  fill="#25D366" radius={[2,2,0,0]}/>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>

        {/* Segment comparison */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
          {[
            { title:'Lead Ads · Formulario', color:'#1877F2', bg:'var(--meta-bg)', border:'var(--blue-border)',
              data:[['Inversión',`S/ ${leadSpend.toLocaleString()}`],['Leads',leadLeads],['CPL',`S/ ${leadLeads>0?(leadSpend/leadLeads).toFixed(2):'—'}`],['Campañas',leadCamps.length]] },
            { title:'Click to WhatsApp', color:'#25D366', bg:'#F0FFF4', border:'#A7F3D0',
              data:[['Inversión',`S/ ${waSpend.toLocaleString()}`],['Conv. WA',totalWA],['CPL WA',`S/ ${cplWA}`],['Campañas',waCamps.length]] },
          ].map((p,i)=>(
            <div key={i} className="card" style={{ borderTop:`3px solid ${p.color}` }}>
              <div className="card-head">
                <div className="card-title" style={{ color:p.color }}>{p.title}</div>
              </div>
              <div className="card-body">
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
                  {p.data.map(([l,v])=>(
                    <div key={l} style={{ background:p.bg, border:`1px solid ${p.border}`, borderRadius:8, padding:'10px 14px' }}>
                      <div style={{ fontSize:11, color:'var(--text3)', marginBottom:3 }}>{l}</div>
                      <div style={{ fontFamily:'var(--font-tight)', fontWeight:700, fontSize:18 }}>{v}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </>)}

      {/* ── CAMPAIGNS ── */}
      {tab==='campaigns' && (<>
        <div style={{ display:'flex', gap:8, marginBottom:16, alignItems:'center', flexWrap:'wrap' }}>
          <input value={search} onChange={e=>setSearch(e.target.value)}
            placeholder="Buscar campaña..." style={{ width:220, fontSize:12 }}/>
          <div style={{ display:'flex', gap:6 }}>
            {[['all','Todas'],['active','● Activas'],['paused','○ Pausadas']].map(([k,l])=>(
              <button key={k} onClick={()=>setStatusF(k)}
                className={`btn btn-ghost btn-sm${statusF===k?' active':''}`}>{l}</button>
            ))}
          </div>
          <span style={{ marginLeft:'auto', fontSize:12, color:'var(--text3)' }}>
            {filteredCamps.length} campañas · S/ {filteredCamps.reduce((s,c)=>s+c.spend,0).toLocaleString()} inversión
          </span>
        </div>

        <div className="card">
          <table className="table">
            <thead>
              <tr>
                <th style={{ textAlign:'left' }}>CAMPAÑA</th>
                <th>ESTADO</th>
                <SortTh label="INVERSIÓN" k="spend"/>
                <SortTh label="IMPRESIONES" k="impr"/>
                <SortTh label="CLICS" k="clics"/>
                <SortTh label="CTR" k="ctr"/>
                <SortTh label="LEADS" k="leads"/>
                <th style={{ textAlign:'right' }}>CPL</th>
              </tr>
            </thead>
            <tbody>
              {filteredCamps.map(c=>{
                const cpl = c.leads > 0 ? (c.spend/c.leads).toFixed(2) : null;
                const cplClass = !cpl ? '' : parseFloat(cpl)<30?'cpl-good':parseFloat(cpl)<60?'cpl-mid':'cpl-high';
                return (
                  <tr key={c.id}>
                    <td>
                      <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                        <span style={{ fontSize:11.5, fontWeight:500, color:'var(--text)' }}>
                          {c.name?.replace(/_FORM$/,'').replace(/_/g,' ')}
                        </span>
                        {c.name?.toUpperCase().includes('WA') &&
                          <span className="tag tag-green" style={{ fontSize:9 }}>WA</span>}
                      </div>
                    </td>
                    <td><span className={`status-pill ${c.status==='ACTIVE'?'active':'paused'}`}>{c.status==='ACTIVE'?'Activa':'Pausada'}</span></td>
                    <td style={{ textAlign:'right', fontFamily:'var(--mono)', fontWeight:600 }}>S/ {c.spend.toLocaleString()}</td>
                    <td style={{ textAlign:'right' }}>{c.impr?.toLocaleString()}</td>
                    <td style={{ textAlign:'right' }}>{c.clics?.toLocaleString()}</td>
                    <td style={{ textAlign:'right' }}>{c.ctr?.toFixed(2)}%</td>
                    <td style={{ textAlign:'right', fontWeight:600, color:'var(--green)' }}>{c.leads||'—'}</td>
                    <td style={{ textAlign:'right' }}>
                      {cpl ? <span className={cplClass}>S/ {cpl}</span> : <span style={{ color:'var(--text4)' }}>—</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {/* Summary footer */}
          <div style={{ padding:'12px 16px', borderTop:'1px solid var(--border)', background:'var(--bg3)',
            display:'flex', gap:24, fontSize:12, color:'var(--text3)', flexWrap:'wrap' }}>
            <span>Total: <strong style={{ color:'var(--text)' }}>{filteredCamps.length} campañas</strong></span>
            <span>Inversión: <strong>S/ {filteredCamps.reduce((s,c)=>s+c.spend,0).toLocaleString()}</strong></span>
            <span>Leads: <strong style={{ color:'var(--green)' }}>{filteredCamps.reduce((s,c)=>s+c.leads,0)}</strong></span>
            <span>CPL prom: <strong>{
              (() => {
                const tl=filteredCamps.reduce((s,c)=>s+c.leads,0);
                const ts=filteredCamps.reduce((s,c)=>s+c.spend,0);
                return tl>0?`S/ ${(ts/tl).toFixed(2)}`:'—';
              })()
            }</strong></span>
          </div>
        </div>
      </>)}

      {tab==='creative' && (
        <div className="empty-state">
          <div className="empty-state-icon">🎨</div>
          <h3>Vista de creativos</h3>
          <p>Próximamente — análisis de rendimiento por creativo y formato</p>
        </div>
      )}
    </div>
  );
}
