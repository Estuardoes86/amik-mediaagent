import React, { useState, useEffect } from 'react';
import { hubspotApi } from '../lib/api.js';
import { useApp } from '../context/AppContext.jsx';

const C = { gold:'#DCA145', goldDim:'rgba(220,161,69,.12)', goldBorder:'rgba(220,161,69,.28)',
  green:'#2DD4A0', blue:'#5B8DB8', red:'#E8445A', purple:'#9061B0',
  indigo:'#7B68EE', carbon:'#262630', slate:'#30373F',
  text:'#F0EDE8', text2:'#9CA3AA', text3:'#5C6470' };

const FUNNEL_STEPS = [
  { key:'interesado',  label:'Interesado',  color:C.blue,   icon:'👤' },
  { key:'inscrito',    label:'Inscrito',     color:C.indigo, icon:'📝' },
  { key:'ingresante',  label:'Ingresante',   color:C.purple, icon:'🎓' },
  { key:'pagante',     label:'Pagante',      color:C.gold,   icon:'💳' },
  { key:'matriculado', label:'Matriculado',  color:C.green,  icon:'✅' },
];

function Kpi({ label, value, sub, color, idx=0 }) {
  const [hov, setHov] = useState(false);
  return (
    <div onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}
      style={{ background:hov?'#2E2B35':C.carbon, border:`1px solid ${hov?C.goldBorder:'rgba(255,255,255,.07)'}`,
        borderRadius:8, padding:'18px 20px 16px', position:'relative', overflow:'hidden',
        boxShadow:hov?`0 8px 32px rgba(0,0,0,.5)`:'0 4px 20px rgba(0,0,0,.4)',
        transition:'all .2s', transform:hov?'translateY(-3px)':'none',
        animation:`kpi-rise .4s ${idx*.06}s both` }}>
      <div style={{ position:'absolute', left:0, top:0, bottom:0, width:3, background:color||C.gold, borderRadius:'8px 0 0 8px' }}/>
      <div style={{ fontFamily:'var(--font-semi)', fontSize:9.5, fontWeight:700, letterSpacing:'2.5px', textTransform:'uppercase', color:hov?C.text2:C.text3, marginBottom:10 }}>{label}</div>
      <div style={{ fontFamily:'var(--font-cond)', fontWeight:800, fontSize:36, lineHeight:1, color:hov?'#fff':C.text }}>{value??'—'}</div>
      {sub && <div style={{ fontSize:11.5, color:hov?C.text2:C.text3, marginTop:6 }} dangerouslySetInnerHTML={{__html:sub}}/>}
    </div>
  );
}

const SecHead = ({ label }) => (
  <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:16, marginTop:8 }}>
    <div style={{ width:22, height:2, background:C.gold, borderRadius:2 }}/>
    <span style={{ fontFamily:'var(--font-semi)', fontSize:10, fontWeight:700, letterSpacing:'3px', textTransform:'uppercase', color:C.gold }}>{label}</span>
  </div>
);

function BreakdownCard({ title, data, color }) {
  if (!data || Object.keys(data).length === 0) return null;
  const sorted = Object.entries(data).filter(([k])=>k!=='Sin programa'&&k!=='Sin fuente'&&k!=='Sin estado').sort((a,b)=>b[1]-a[1]).slice(0,10);
  const max = sorted[0]?.[1] || 1;
  return (
    <div style={{ background:C.carbon, border:'1px solid rgba(255,255,255,.07)', borderRadius:8, padding:20, boxShadow:'0 4px 20px rgba(0,0,0,.4)' }}>
      <div style={{ fontFamily:'var(--font-semi)', fontSize:10, fontWeight:700, letterSpacing:'2px', textTransform:'uppercase', color:C.text3, marginBottom:16 }}>{title}</div>
      {sorted.map(([name, count])=>(
        <div key={name} style={{ marginBottom:10 }}>
          <div style={{ display:'flex', justifyContent:'space-between', fontSize:11.5, marginBottom:4 }}>
            <span style={{ color:C.text2, fontWeight:500, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', maxWidth:'75%' }}>{name}</span>
            <span style={{ fontFamily:'var(--font-cond)', fontWeight:800, fontSize:16, color:'#fff' }}>{count}</span>
          </div>
          <div style={{ background:'rgba(255,255,255,.05)', borderRadius:3, height:6 }}>
            <div style={{ width:`${(count/max)*100}%`, height:'100%', borderRadius:3, background:color, transition:'width .6s ease' }}/>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function HubSpotPage() {
  const { activeClient } = useApp();
  const [data,       setData]       = useState(null);
  const [pipelines,  setPipelines]  = useState([]);
  const [pipelineId, setPipelineId] = useState('');
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState(null);

  useEffect(() => {
    hubspotApi.getPipelines()
      .then(res => {
        const pipes = res.data?.pipelines || [];
        setPipelines(pipes);
        // Auto-select Admisión 2026 pipeline
        const admision = pipes.find(p=>p.label?.toLowerCase().includes('2026')||p.label?.toLowerCase().includes('admis')) || pipes[0];
        if (admision) setPipelineId(admision.id);
      })
      .catch(e => setError(e.response?.data?.error || e.message));
  }, []);

  useEffect(() => {
    if (!pipelineId) return;
    setLoading(true); setError(null);
    hubspotApi.getSummary(pipelineId, 30)
      .then(res => setData(res.data))
      .catch(e => setError(e.response?.data?.error || e.message))
      .finally(() => setLoading(false));
  }, [pipelineId]);

  const funnel   = data?.funnel?.funnel      || {};
  const convs    = data?.funnel?.conversions || [];
  const raw      = data?.funnel?.raw         || {};
  const byProg   = data?.funnel?.byProgram   || data?.contacts?.byProgram || {};
  const bySrc    = data?.funnel?.bySource    || data?.contacts?.bySource  || {};
  const contacts = data?.contacts            || {};
  const recent   = data?.recentDeals         || [];
  const totalFunnel = Object.values(funnel).reduce((s,v)=>s+v,0);
  const maxVal   = FUNNEL_STEPS.map(s=>funnel[s.key]||0).find(v=>v>0) || 1;

  const convRate = (from, to) => {
    const f = funnel[from]||0, t = funnel[to]||0;
    return f > 0 ? ((t/f)*100).toFixed(1) : '0.0';
  };

  return (
    <div className="scroll-y" style={{ flex:1, padding:'24px 28px', background:'#14141B' }}>

      {/* ── Header ── */}
      <div style={{ display:'flex', alignItems:'center', gap:14, marginBottom:26, flexWrap:'wrap' }}>
        <h1 style={{ fontFamily:'var(--font-cond)', fontWeight:900, fontSize:26, letterSpacing:2, textTransform:'uppercase', color:'#fff' }}>
          HubSpot CRM
        </h1>
        <span style={{ fontFamily:'var(--font-semi)', fontSize:11, fontWeight:600, letterSpacing:1.5, color:C.text3, textTransform:'uppercase' }}>{activeClient.name}</span>

        {pipelines.length > 0 && (
          <select value={pipelineId} onChange={e=>setPipelineId(e.target.value)}
            style={{ padding:'6px 14px', fontSize:11, fontFamily:'var(--font-semi)', fontWeight:700, letterSpacing:.8,
              borderRadius:6, background:'rgba(220,161,69,.06)', borderColor:C.goldBorder, color:C.gold, maxWidth:380 }}>
            {pipelines.map(p=><option key={p.id} value={p.id}>{p.label}</option>)}
          </select>
        )}

        {loading && <span className="spinner"/>}
        {!loading && data && (
          <button className="btn btn-ghost btn-sm" onClick={()=>setPipelineId(p=>p)} style={{ marginLeft:'auto' }}>↻ Actualizar</button>
        )}
      </div>

      {error && (
        <div style={{ background:'rgba(232,68,90,.08)', border:'1px solid rgba(232,68,90,.3)', borderLeft:`3px solid ${C.red}`,
          padding:'14px 18px', borderRadius:8, marginBottom:20, color:C.text2, fontSize:13 }}>
          <strong style={{ color:C.red }}>Error —</strong> {error}
        </div>
      )}

      {data && (<>

        {/* ══ KPI ROW ══ */}
        <SecHead label="Resumen del pipeline"/>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, marginBottom:28 }}>
          <Kpi idx={0} label="Total en pipeline"  color={C.blue}
            value={totalFunnel.toLocaleString()}
            sub={`Pipeline: <b>${data.pipeline?.label||'—'}</b>`}/>
          <Kpi idx={1} label="Contactos nuevos (30d)" color={C.green}
            value={contacts.total?.toLocaleString()||'0'}
            sub="Nuevos leads ingresados"/>
          <Kpi idx={2} label="Tasa Interesado→Matriculado" color={C.gold}
            value={funnel.interesado>0?`${convRate('interesado','matriculado')}%`:'—'}
            sub={`<b>${funnel.matriculado||0}</b> matriculados de <b>${funnel.interesado||0}</b>`}/>
          <Kpi idx={3} label="Tasa Inscrito→Matriculado" color={C.purple}
            value={funnel.inscrito>0?`${convRate('inscrito','matriculado')}%`:'—'}
            sub={`Cierre desde inscripción`}/>
        </div>

        {/* ══ EMBUDO + TASAS ══ */}
        <SecHead label="Embudo de admisiones"/>
        <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr', gap:16, marginBottom:28 }}>

          {/* Funnel bars */}
          <div style={{ background:C.carbon, border:'1px solid rgba(255,255,255,.07)', borderRadius:8, padding:24, boxShadow:'0 4px 20px rgba(0,0,0,.4)' }}>
            {FUNNEL_STEPS.map((step,i) => {
              const val = funnel[step.key]||0;
              const pct = maxVal>0 ? Math.max((val/maxVal)*100, val>0?6:0) : 0;
              const conv = convs.find(c=>c.to===step.key);
              return (
                <div key={step.key} style={{ marginBottom:i<FUNNEL_STEPS.length-1?6:0 }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:6 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                      <span style={{ fontSize:15 }}>{step.icon}</span>
                      <span style={{ fontFamily:'var(--font-semi)', fontWeight:700, fontSize:13, color:C.text2 }}>{step.label}</span>
                    </div>
                    <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                      {conv && (
                        <span style={{ fontFamily:'var(--font-semi)', fontSize:10.5, fontWeight:700,
                          color: parseFloat(conv.rate)>30?C.green:parseFloat(conv.rate)>10?C.gold:C.red,
                          background:'rgba(255,255,255,.05)', padding:'2px 9px', borderRadius:20 }}>
                          conv. {conv.rate}%
                        </span>
                      )}
                      <span style={{ fontFamily:'var(--font-cond)', fontWeight:800, fontSize:26, color:'#fff', minWidth:55, textAlign:'right' }}>
                        {val.toLocaleString()}
                      </span>
                    </div>
                  </div>
                  <div style={{ background:'rgba(255,255,255,.05)', borderRadius:5, height:42, overflow:'hidden' }}>
                    <div style={{
                      width:`${pct}%`, height:'100%', borderRadius:5,
                      background:`linear-gradient(90deg,${step.color}88,${step.color})`,
                      display:'flex', alignItems:'center', paddingLeft:14,
                      fontFamily:'var(--font-semi)', fontSize:11, fontWeight:600, color:'rgba(255,255,255,.85)',
                      transition:'width .8s cubic-bezier(.16,1,.3,1)',
                    }}>
                      {val>0 && `${pct.toFixed(0)}% del total`}
                    </div>
                  </div>
                  {i<FUNNEL_STEPS.length-1 && <div style={{ marginLeft:22, height:8, borderLeft:'1px dashed rgba(255,255,255,.1)' }}/>}
                </div>
              );
            })}
          </div>

          {/* Conversions + raw stages */}
          <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
            <div style={{ background:C.carbon, border:'1px solid rgba(255,255,255,.07)', borderRadius:8, padding:20, boxShadow:'0 4px 20px rgba(0,0,0,.4)', flex:1 }}>
              <div style={{ fontFamily:'var(--font-semi)', fontSize:10, fontWeight:700, letterSpacing:'2px', textTransform:'uppercase', color:C.text3, marginBottom:14 }}>TASAS DE CONVERSIÓN</div>
              {convs.map((c,i)=>{
                const rate = parseFloat(c.rate);
                const color = rate>30?C.green:rate>10?C.gold:C.red;
                return (
                  <div key={i} style={{ marginBottom:12, paddingBottom:12, borderBottom:i<convs.length-1?'1px solid rgba(255,255,255,.05)':undefined }}>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:5 }}>
                      <span style={{ fontFamily:'var(--font-semi)', fontSize:11, color:C.text2 }}>{c.from} → {c.to}</span>
                      <span style={{ fontFamily:'var(--font-cond)', fontWeight:800, fontSize:20, color }}>{c.rate}%</span>
                    </div>
                    <div style={{ background:'rgba(255,255,255,.05)', borderRadius:3, height:5 }}>
                      <div style={{ width:`${Math.min(rate,100)}%`, height:'100%', borderRadius:3, background:color, transition:'width .6s' }}/>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Raw stages */}
            {Object.keys(raw).length>0 && (
              <div style={{ background:C.carbon, border:'1px solid rgba(255,255,255,.07)', borderRadius:8, padding:20, boxShadow:'0 4px 20px rgba(0,0,0,.4)' }}>
                <div style={{ fontFamily:'var(--font-semi)', fontSize:10, fontWeight:700, letterSpacing:'2px', textTransform:'uppercase', color:C.text3, marginBottom:12 }}>ETAPAS EN HUBSPOT</div>
                {Object.entries(raw).sort((a,b)=>b[1]-a[1]).map(([name,count])=>(
                  <div key={name} style={{ display:'flex', justifyContent:'space-between', fontSize:11.5, marginBottom:7, alignItems:'center' }}>
                    <span style={{ color:C.text2, maxWidth:'75%', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{name}</span>
                    <span style={{ fontWeight:700, color:'#fff', fontFamily:'var(--font-cond)', fontSize:16 }}>{count}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ══ BREAKDOWNS: Programa + Fuente ══ */}
        <SecHead label="Análisis por programa y fuente"/>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, marginBottom:28 }}>
          <BreakdownCard title="PROGRAMA ACADÉMICO DE INTERÉS" data={byProg} color={C.blue}/>
          <BreakdownCard title="FUENTE DE TRÁFICO ORIGINAL"    data={bySrc}  color={C.gold}/>
        </div>

        {/* ══ DEALS RECIENTES ══ */}
        {recent.length>0 && (<>
          <SecHead label="Deals recientes"/>
          <div style={{ background:C.carbon, border:'1px solid rgba(255,255,255,.07)', borderRadius:8, overflow:'hidden', boxShadow:'0 4px 20px rgba(0,0,0,.4)' }}>
            <table className="table">
              <thead>
                <tr>
                  <th style={{ textAlign:'left' }}>DEAL</th>
                  <th style={{ textAlign:'left' }}>PROGRAMA</th>
                  <th style={{ textAlign:'left' }}>FUENTE</th>
                  <th>ETAPA</th>
                  <th style={{ textAlign:'right' }}>CREADO</th>
                </tr>
              </thead>
              <tbody>
                {recent.map(d=>(
                  <tr key={d.id}>
                    <td style={{ fontWeight:500, color:C.text, maxWidth:200, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                      {d.properties.dealname||'Sin nombre'}
                    </td>
                    <td style={{ fontSize:11.5, color:C.text2, maxWidth:160, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                      {d.properties.programa_academico_interes||'—'}
                    </td>
                    <td style={{ fontSize:11.5, color:C.text3 }}>
                      {d.properties.fuente_de_trafico_original||'—'}
                    </td>
                    <td>
                      <span style={{ fontFamily:'var(--font-semi)', fontSize:10.5, fontWeight:600, color:C.text2 }}>
                        {d.properties.dealstage||'—'}
                      </span>
                    </td>
                    <td style={{ textAlign:'right', fontSize:11.5, color:C.text3 }}>
                      {d.properties.createdate ? new Date(d.properties.createdate).toLocaleDateString('es-PE') : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>)}

      </>)}

      {!loading && !data && !error && (
        <div className="empty-state">
          <div style={{ fontSize:40, marginBottom:8 }}>🔗</div>
          <p style={{ fontFamily:'var(--font-semi)', fontWeight:700, fontSize:14, color:C.text2 }}>Conectando con HubSpot...</p>
          <p>Selecciona un pipeline para ver el embudo</p>
        </div>
      )}
    </div>
  );
}
