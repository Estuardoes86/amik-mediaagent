import React, { useState, useMemo } from 'react';
import { useMetaCampaigns, useGoogleCampaigns } from '../hooks/useData.js';
import { useApp } from '../context/AppContext.jsx';

const DEMO_META = [
  { id:1, name:'2026_2_LEADS_MEDICINA_HUMANA_FORM',    status:'ACTIVE', metrics:{ spend:'4200', ctr:'3.1', impressions:'82000', clicks:'2100', actions:[{action_type:'lead',value:'94'}] }},
  { id:2, name:'2026_2_LEADS_ENFERMERIA_FORM',         status:'ACTIVE', metrics:{ spend:'3800', ctr:'2.8', impressions:'71000', clicks:'1900', actions:[{action_type:'lead',value:'88'}] }},
  { id:3, name:'2026_2_LEADS_PSICOLOGIA_FORM',         status:'ACTIVE', metrics:{ spend:'2600', ctr:'2.4', impressions:'54000', clicks:'1400', actions:[{action_type:'lead',value:'72'}] }},
  { id:4, name:'2026_2_LEADS_DERECHO_FORM',            status:'ACTIVE', metrics:{ spend:'1800', ctr:'1.9', impressions:'38000', clicks:'980',  actions:[{action_type:'lead',value:'48'}] }},
  { id:5, name:'2026_2_LEADS_ADMINISTRACION_FORM',     status:'ACTIVE', metrics:{ spend:'1500', ctr:'1.7', impressions:'31000', clicks:'820',  actions:[{action_type:'lead',value:'38'}] }},
  { id:6, name:'2026_2_LEADS_DISTANCIA_FORM',          status:'ACTIVE', metrics:{ spend:'2900', ctr:'3.4', impressions:'69000', clicks:'1800', actions:[{action_type:'lead',value:'102'}] }},
  { id:7, name:'2026_2_BRANDING_INSTITUCIONAL',        status:'ACTIVE', metrics:{ spend:'1500', ctr:'0.6', impressions:'43000', clicks:'650',  actions:[] }},
  { id:8, name:'2026_2_REMARKETING_LIMA',              status:'PAUSED', metrics:{ spend:'0',    ctr:'0',   impressions:'0',     clicks:'0',    actions:[] }},
];

const DEMO_GOOGLE = [
  { id:1, name:'Admisiones · Search · Lima',     status:'ENABLED', channelType:'SEARCH',  spend:900,  clicks:1840, conversions:42, ctr:0.043, avgCpc:0.49 },
  { id:2, name:'Medicina · Search · Nacional',   status:'ENABLED', channelType:'SEARCH',  spend:640,  clicks:1120, conversions:28, ctr:0.038, avgCpc:0.57 },
  { id:3, name:'Posgrado · Search · Lima',       status:'ENABLED', channelType:'SEARCH',  spend:480,  clicks:880,  conversions:18, ctr:0.033, avgCpc:0.55 },
  { id:4, name:'Remarketing · Display',          status:'ENABLED', channelType:'DISPLAY', spend:320,  clicks:580,  conversions:12, ctr:0.008, avgCpc:0.55 },
  { id:5, name:'Distancia · Search',             status:'PAUSED',  channelType:'SEARCH',  spend:0,    clicks:0,    conversions:0,  ctr:0,     avgCpc:0 },
];

export default function CampaignsPage() {
  const { activeClient } = useApp();
  const { campaigns: metaCampaigns, loading: metaLoading, refetch: refetchMeta } = useMetaCampaigns();
  const { campaigns: googleCampaigns, loading: googleLoading, refetch: refetchGoogle } = useGoogleCampaigns();

  const [tab,          setTab]          = useState('meta');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortKey,      setSortKey]      = useState('spend');
  const [sortDir,      setSortDir]      = useState('desc');
  const [search,       setSearch]       = useState('');

  const hasMetaId   = !!activeClient.metaAccountId;
  const hasGoogleId = !!activeClient.googleCustomerId;
  const isDemo      = !hasMetaId && !hasGoogleId;

  const rawMeta   = hasMetaId   ? metaCampaigns   : DEMO_META;
  const rawGoogle = hasGoogleId ? googleCampaigns  : DEMO_GOOGLE;

  /* ── Helpers ── */
  const getLeads  = c => parseInt(c.metrics?.actions?.find(a=>a.action_type==='lead')?.value || 0);
  const getSpend  = c => parseFloat(c.metrics?.spend || 0);
  const getClics  = c => parseInt(c.metrics?.clicks || 0);
  const getImpr   = c => parseInt(c.metrics?.impressions || 0);
  const getCtr    = c => parseFloat(c.metrics?.ctr || 0);
  const getCpl    = c => { const l=getLeads(c),s=getSpend(c); return l>0 ? s/l : null; };
  const cplClass  = v => v === null ? '' : v < 45 ? 'cpl-good' : v < 70 ? 'cpl-mid' : 'cpl-high';

  /* ── Sort handler ── */
  const handleSort = k => {
    if (sortKey === k) setSortDir(d => d==='asc'?'desc':'asc');
    else { setSortKey(k); setSortDir('desc'); }
  };

  /* ── Filtered + sorted Meta ── */
  const filteredMeta = useMemo(() => {
    let rows = [...rawMeta];
    if (statusFilter==='active') rows = rows.filter(c=>c.status==='ACTIVE');
    if (statusFilter==='paused') rows = rows.filter(c=>c.status!=='ACTIVE');
    if (search) rows = rows.filter(c=>c.name?.toLowerCase().includes(search.toLowerCase()));
    rows.sort((a,b) => {
      let av,bv;
      if (sortKey==='spend')  { av=getSpend(a);  bv=getSpend(b); }
      else if (sortKey==='leads') { av=getLeads(a);  bv=getLeads(b); }
      else if (sortKey==='clics') { av=getClics(a);  bv=getClics(b); }
      else if (sortKey==='impr')  { av=getImpr(a);   bv=getImpr(b);  }
      else if (sortKey==='ctr')   { av=getCtr(a);    bv=getCtr(b);   }
      else if (sortKey==='cpl')   { av=getCpl(a)??999; bv=getCpl(b)??999; }
      else { return sortDir==='asc' ? (a.name||'').localeCompare(b.name||'') : (b.name||'').localeCompare(a.name||''); }
      return sortDir==='asc' ? av-bv : bv-av;
    });
    return rows;
  }, [rawMeta, statusFilter, search, sortKey, sortDir]);

  /* ── Filtered + sorted Google ── */
  const filteredGoogle = useMemo(() => {
    let rows = [...rawGoogle];
    if (statusFilter==='active') rows = rows.filter(c=>c.status==='ENABLED');
    if (statusFilter==='paused') rows = rows.filter(c=>c.status!=='ENABLED');
    if (search) rows = rows.filter(c=>c.name?.toLowerCase().includes(search.toLowerCase()));
    rows.sort((a,b) => {
      let av,bv;
      if (sortKey==='spend') { av=parseFloat(a.spend||0); bv=parseFloat(b.spend||0); }
      else if (sortKey==='leads'||sortKey==='cpl') { av=parseFloat(a.conversions||0); bv=parseFloat(b.conversions||0); }
      else if (sortKey==='clics') { av=parseInt(a.clicks||0); bv=parseInt(b.clicks||0); }
      else if (sortKey==='ctr')   { av=parseFloat(a.ctr||0); bv=parseFloat(b.ctr||0); }
      else { return sortDir==='asc' ? (a.name||'').localeCompare(b.name||'') : (b.name||'').localeCompare(a.name||''); }
      return sortDir==='asc' ? av-bv : bv-av;
    });
    return rows;
  }, [rawGoogle, statusFilter, search, sortKey, sortDir]);

  /* ── Meta totals ── */
  const metaTotals = useMemo(() => {
    const spend = filteredMeta.reduce((s,c)=>s+getSpend(c),0);
    const leads = filteredMeta.reduce((s,c)=>s+getLeads(c),0);
    const clics = filteredMeta.reduce((s,c)=>s+getClics(c),0);
    const impr  = filteredMeta.reduce((s,c)=>s+getImpr(c),0);
    return { spend, leads, clics, impr, cpl: leads>0 ? spend/leads : null };
  }, [filteredMeta]);

  /* ── Google totals ── */
  const googleTotals = useMemo(() => {
    const spend = filteredGoogle.reduce((s,c)=>s+parseFloat(c.spend||0),0);
    const conv  = filteredGoogle.reduce((s,c)=>s+parseFloat(c.conversions||0),0);
    const clics = filteredGoogle.reduce((s,c)=>s+parseInt(c.clicks||0),0);
    return { spend, conv, clics, cpl: conv>0 ? spend/conv : null };
  }, [filteredGoogle]);

  /* ── Sort TH ── */
  const SortTh = ({ label, k, align='right' }) => (
    <th onClick={() => handleSort(k)} className={sortKey===k ? 'sorted' : ''} style={{ textAlign: align }}>
      {label} <span style={{ fontSize:8, opacity: sortKey===k ? 1 : 0.3 }}>{sortDir==='asc'?'▲':'▼'}</span>
    </th>
  );

  const cleanName = name => name?.replace(/2026_\d+_/,'').replace(/_FORM$/,'').replace(/_/g,' ') || name;

  return (
    <div className="scroll-y" style={{ flex:1, padding:'24px 28px', background:'var(--bg)' }}>

      {/* ── Header ── */}
      <div className="page-header">
        <span className="page-title">Campañas</span>
        <span className="page-client">{activeClient.name}</span>
        {isDemo && <span style={{ fontSize:10, color:'var(--gold)', fontFamily:'var(--font-semi)', fontWeight:700, letterSpacing:1, textTransform:'uppercase', background:'var(--gold-dim)', border:'1px solid var(--gold-border)', padding:'2px 9px', borderRadius:20 }}>DEMO</span>}
      </div>

      {/* ── Toolbar ── */}
      <div style={{ display:'flex', gap:8, marginBottom:18, alignItems:'center', flexWrap:'wrap' }}>
        <input
          value={search} onChange={e=>setSearch(e.target.value)}
          placeholder="Buscar campaña..."
          style={{ width:220, padding:'7px 13px', fontSize:12 }}
        />
        <div style={{ display:'flex', gap:6 }}>
          {[['all','Todas'],['active','● Activas'],['paused','○ Pausadas']].map(([k,l])=>(
            <button key={k} className={`btn btn-ghost btn-sm${statusFilter===k?' active':''}`}
              onClick={()=>setStatusFilter(k)}>{l}</button>
          ))}
        </div>
        <div style={{ marginLeft:'auto', display:'flex', gap:8 }}>
          <button
            className="btn btn-outline-gold btn-sm"
            onClick={()=>{ refetchMeta(); refetchGoogle(); }}
            disabled={metaLoading||googleLoading}
          >
            {(metaLoading||googleLoading) ? <span className="spinner"/> : '↻ Actualizar datos'}
          </button>
        </div>
      </div>

      {/* ── Platform tabs ── */}
      <div style={{ display:'flex', gap:0, marginBottom:16, borderBottom:'1px solid var(--border)' }}>
        {[
          { k:'meta',   l:`META ADS`,    count: filteredMeta.length },
          { k:'google', l:`GOOGLE ADS`,  count: filteredGoogle.length },
        ].map(p=>(
          <button key={p.k} className={`tab-btn${tab===p.k?' active':''}`} onClick={()=>setTab(p.k)}>
            {p.l}
            <span style={{
              background: tab===p.k ? 'var(--gold)' : 'var(--border2)',
              color: tab===p.k ? 'var(--carbon-deep)' : 'var(--text3)',
              fontSize:9, fontWeight:800, padding:'1px 7px', borderRadius:20, marginLeft:4
            }}>{p.count}</span>
          </button>
        ))}
      </div>

      {/* ══ META TABLE ══ */}
      {tab==='meta' && (
        <div style={{ background:'var(--carbon)', border:'1px solid var(--border)', borderRadius:'var(--radius-md)', overflow:'hidden', boxShadow:'var(--shadow)' }}>
          <table className="table">
            <thead>
              <tr>
                <SortTh label="CAMPAÑA" k="name" align="left"/>
                <th>ESTADO</th>
                <SortTh label="INVERSIÓN"   k="spend"/>
                <SortTh label="IMPRESIONES" k="impr"/>
                <SortTh label="CLICS"       k="clics"/>
                <SortTh label="CTR"         k="ctr"/>
                <SortTh label="LEADS"       k="leads"/>
                <SortTh label="CPL"         k="cpl"/>
              </tr>
            </thead>
            <tbody>
              {filteredMeta.map(c => {
                const cpl = getCpl(c);
                return (
                  <tr key={c.id}>
                    <td style={{ maxWidth:300 }}>
                      <div style={{ display:'flex', alignItems:'center', gap:9 }}>
                        <span className="badge badge-meta">META</span>
                        <span style={{ overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', maxWidth:230, fontSize:12.5, color:'var(--text)', fontWeight:500 }}>
                          {cleanName(c.name)}
                        </span>
                      </div>
                    </td>
                    <td><span className={`status-dot ${c.status==='ACTIVE'?'active':'paused'}`}>{c.status==='ACTIVE'?'Activa':'Pausada'}</span></td>
                    <td style={{ textAlign:'right', fontFamily:'var(--mono)', fontSize:12 }}>S/ {getSpend(c).toLocaleString()}</td>
                    <td style={{ textAlign:'right', fontFamily:'var(--mono)', fontSize:12 }}>{getImpr(c).toLocaleString()}</td>
                    <td style={{ textAlign:'right', fontFamily:'var(--mono)', fontSize:12 }}>{getClics(c).toLocaleString()}</td>
                    <td style={{ textAlign:'right' }}>{getCtr(c).toFixed(2)}%</td>
                    <td style={{ textAlign:'right', fontWeight:700, color:'var(--green)' }}>{getLeads(c) || '—'}</td>
                    <td style={{ textAlign:'right' }}>
                      {cpl !== null
                        ? <span className={cplClass(cpl)}>S/ {cpl.toFixed(2)}</span>
                        : <span style={{ color:'var(--text3)' }}>—</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          <div className="summary-footer">
            <span className="sf-label">{filteredMeta.length} campañas</span>
            <span>Inversión: <strong>S/ {metaTotals.spend.toLocaleString(undefined,{maximumFractionDigits:0})}</strong></span>
            <span>Impresiones: <strong>{metaTotals.impr.toLocaleString()}</strong></span>
            <span>Clics: <strong>{metaTotals.clics.toLocaleString()}</strong></span>
            <span>Leads: <span className="sf-green">{metaTotals.leads}</span></span>
            <span>CPL prom: <span className={metaTotals.cpl ? cplClass(metaTotals.cpl) : ''}>
              {metaTotals.cpl ? `S/ ${metaTotals.cpl.toFixed(2)}` : '—'}
            </span></span>
          </div>
        </div>
      )}

      {/* ══ GOOGLE TABLE ══ */}
      {tab==='google' && (
        <div style={{ background:'var(--carbon)', border:'1px solid var(--border)', borderRadius:'var(--radius-md)', overflow:'hidden', boxShadow:'var(--shadow)' }}>
          <table className="table">
            <thead>
              <tr>
                <SortTh label="CAMPAÑA" k="name" align="left"/>
                <th>TIPO</th>
                <th>ESTADO</th>
                <SortTh label="INVERSIÓN"   k="spend"/>
                <SortTh label="CLICS"       k="clics"/>
                <SortTh label="CTR"         k="ctr"/>
                <SortTh label="CONV."       k="leads"/>
                <th style={{ textAlign:'right' }}>CPC PROM</th>
              </tr>
            </thead>
            <tbody>
              {filteredGoogle.map(c=>(
                <tr key={c.id}>
                  <td style={{ maxWidth:280 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:9 }}>
                      <span className="badge badge-google">GADS</span>
                      <span style={{ overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', maxWidth:210, fontSize:12.5, color:'var(--text)', fontWeight:500 }}>{c.name}</span>
                    </div>
                  </td>
                  <td><span style={{ fontFamily:'var(--font-semi)', fontSize:10, letterSpacing:1, color:'var(--text3)', textTransform:'uppercase' }}>{c.channelType}</span></td>
                  <td><span className={`status-dot ${c.status==='ENABLED'?'active':'paused'}`}>{c.status==='ENABLED'?'Activa':'Pausada'}</span></td>
                  <td style={{ textAlign:'right', fontFamily:'var(--mono)', fontSize:12 }}>S/ {parseFloat(c.spend||0).toFixed(0)}</td>
                  <td style={{ textAlign:'right', fontFamily:'var(--mono)', fontSize:12 }}>{parseInt(c.clicks||0).toLocaleString()}</td>
                  <td style={{ textAlign:'right' }}>{(parseFloat(c.ctr||0)*100).toFixed(2)}%</td>
                  <td style={{ textAlign:'right', fontWeight:700, color:'var(--green)' }}>{parseFloat(c.conversions||0).toFixed(0)||'—'}</td>
                  <td style={{ textAlign:'right', fontFamily:'var(--mono)', fontSize:12 }}>S/ {parseFloat(c.avgCpc||0).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="summary-footer">
            <span className="sf-label">{filteredGoogle.length} campañas</span>
            <span>Inversión: <strong>S/ {googleTotals.spend.toFixed(0)}</strong></span>
            <span>Clics: <strong>{googleTotals.clics.toLocaleString()}</strong></span>
            <span>Conv.: <span className="sf-green">{googleTotals.conv.toFixed(0)}</span></span>
            <span>CPL prom: <span className={cplClass(googleTotals.cpl)}>
              {googleTotals.cpl ? `S/ ${googleTotals.cpl.toFixed(2)}` : '—'}
            </span></span>
          </div>
        </div>
      )}
    </div>
  );
}
