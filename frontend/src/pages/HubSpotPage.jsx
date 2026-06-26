import React, { useState, useEffect } from 'react';
import { hubspotApi } from '../lib/api.js';
import { useApp } from '../context/AppContext.jsx';

const C = { gold:'#DCA145', goldDim:'rgba(220,161,69,.12)', goldBorder:'rgba(220,161,69,.28)',
  green:'#2DD4A0', blue:'#5B8DB8', red:'#E8445A', purple:'#9061B0',
  carbon:'#262630', slate:'#30373F', text:'#F0EDE8', text2:'#9CA3AA', text3:'#5C6470' };

const FUNNEL_STEPS = [
  { key:'interesado',  label:'Interesado',  color:C.blue,   icon:'👤' },
  { key:'inscrito',    label:'Inscrito',     color:'#7B68EE', icon:'📝' },
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
        boxShadow:hov?`0 8px 32px rgba(0,0,0,.5)`:' 0 4px 20px rgba(0,0,0,.4)',
        transition:'all .2s', transform:hov?'translateY(-3px)':'none',
        animation:`kpi-rise .4s ${idx*.06}s both` }}>
      <div style={{ position:'absolute', left:0, top:0, bottom:0, width:3, background:color||C.gold, borderRadius:'8px 0 0 8px' }}/>
      <div style={{ fontFamily:'var(--font-semi)', fontSize:9.5, fontWeight:700, letterSpacing:'2.5px', textTransform:'uppercase', color:hov?C.text2:C.text3, marginBottom:10, transition:'color .15s' }}>{label}</div>
      <div style={{ fontFamily:'var(--font-cond)', fontWeight:800, fontSize:36, lineHeight:1, color:hov?'#fff':C.text, transition:'color .15s' }}>{value??'—'}</div>
      {sub && <div style={{ fontSize:11.5, color:hov?C.text2:C.text3, marginTop:6, transition:'color .15s' }} dangerouslySetInnerHTML={{__html:sub}}/>}
    </div>
  );
}

const SecHead = ({ label }) => (
  <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:16, marginTop:8 }}>
    <div style={{ width:22, height:2, background:C.gold, borderRadius:2 }}/>
    <span style={{ fontFamily:'var(--font-semi)', fontSize:10, fontWeight:700, letterSpacing:'3px', textTransform:'uppercase', color:C.gold }}>{label}</span>
  </div>
);

export default function HubSpotPage() {
  const { activeClient, dateParams } = useApp();
  const [data,       setData]       = useState(null);
  const [pipelines,  setPipelines]  = useState([]);
  const [pipelineId, setPipelineId] = useState('');
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState(null);
  const hasKey = true; // HUBSPOT_API_KEY set in Railway

  // Load pipelines on mount
  useEffect(() => {
    hubspotApi.getPipelines()
      .then(res => {
        const pipes = res.data?.pipelines || [];
        setPipelines(pipes);
        if (pipes.length > 0) setPipelineId(pipes[0].id);
      })
      .catch(e => setError(e.response?.data?.error || e.message));
  }, []);

  // Load summary when pipelineId changes
  useEffect(() => {
    if (!pipelineId) return;
    setLoading(true); setError(null);
    hubspotApi.getSummary(pipelineId, 30)
      .then(res => setData(res.data))
      .catch(e => setError(e.response?.data?.error || e.message))
      .finally(() => setLoading(false));
  }, [pipelineId]);

  const funnel  = data?.funnel?.funnel      || {};
  const convs   = data?.funnel?.conversions || [];
  const raw     = data?.funnel?.raw         || {};
  const contacts= data?.contacts            || {};
  const recent  = data?.recentDeals         || [];
  const totalFunnel = Object.values(funnel).reduce((s,v)=>s+v,0);
  const topStep = FUNNEL_STEPS.find(s=>funnel[s.key]>0);
  const maxVal  = topStep ? funnel[topStep.key] : 1;

  return (
    <div className="scroll-y" style={{ flex:1, padding:'24px 28px', background:'#14141B' }}>

      {/* ── Header ── */}
      <div style={{ display:'flex', alignItems:'center', gap:14, marginBottom:26 }}>
        <h1 style={{ fontFamily:'var(--font-cond)', fontWeight:900, fontSize:26, letterSpacing:2, textTransform:'uppercase', color:'#fff' }}>
          HubSpot CRM
        </h1>
        <span style={{ fontFamily:'var(--font-semi)', fontSize:11, fontWeight:600, letterSpacing:1.5, color:C.text3, textTransform:'uppercase' }}>{activeClient.name}</span>

        {/* Pipeline selector */}
        {pipelines.length > 0 && (
          <select value={pipelineId} onChange={e=>setPipelineId(e.target.value)}
            style={{ padding:'5px 12px', fontSize:11, fontFamily:'var(--font-semi)', fontWeight:700, letterSpacing:.8, borderRadius:6, background:'rgba(220,161,69,.06)', borderColor:C.goldBorder, color:C.gold, marginLeft:8 }}>
            {pipelines.map(p=><option key={p.id} value={p.id}>{p.label}</option>)}
          </select>
        )}

        {loading && <span className="spinner" style={{ marginLeft:4 }}/>}
        {!loading && data && <button className="btn btn-ghost btn-sm" onClick={()=>setPipelineId(p=>p)} style={{ marginLeft:'auto' }}>↻ Actualizar</button>}
      </div>

      {/* Error */}
      {error && (
        <div style={{ background:'rgba(232,68,90,.08)', border:'1px solid rgba(232,68,90,.3)', borderLeft:`3px solid ${C.red}`, padding:'14px 18px', borderRadius:8, marginBottom:20, color:C.text2, fontSize:13 }}>
          <strong style={{ color:C.red }}>Error —</strong> {error}
        </div>
      )}

      {/* Loading skeleton */}
      {loading && !data && (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, marginBottom:24 }}>
          {[0,1,2,3].map(i=>(
            <div key={i} style={{ background:C.carbon, border:'1px solid rgba(255,255,255,.07)', borderRadius:8, padding:'18px 20px', height:100, animation:'pulse 1.5s ease-in-out infinite', opacity:.6 }}/>
          ))}
        </div>
      )}

      {data && (<>

        {/* ══ KPI ROW ══ */}
        <SecHead label="Resumen CRM"/>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, marginBottom:28 }}>
          <Kpi idx={0} label="Total en pipeline"  color={C.blue}  value={totalFunnel.toLocaleString()} sub={`Pipeline: <b>${data.pipeline?.label||'—'}</b>`}/>
          <Kpi idx={1} label="Contactos (30d)"    color={C.green} value={contacts.total?.toLocaleString()||'0'} sub={`Nuevos leads ingresados`}/>
          <Kpi idx={2} label="Tasa Interesado→Matriculado" color={C.gold}
            value={funnel.interesado>0 ? `${((funnel.matriculado||0)/funnel.interesado*100).toFixed(1)}%` : '—'}
            sub={`<b>${funnel.matriculado||0}</b> matriculados de <b>${funnel.interesado||0}</b> interesados`}/>
          <Kpi idx={3} label="Tasa Inscrito→Matriculado" color={C.purple}
            value={funnel.inscrito>0 ? `${((funnel.matriculado||0)/funnel.inscrito*100).toFixed(1)}%` : '—'}
            sub={`Cierre desde inscripción`}/>
        </div>

        {/* ══ EMBUDO DE ADMISIONES ══ */}
        <SecHead label="Embudo de admisiones"/>
        <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr', gap:16, marginBottom:28 }}>

          {/* Funnel bars */}
          <div style={{ background:C.carbon, border:'1px solid rgba(255,255,255,.07)', borderRadius:8, padding:24, boxShadow:'0 4px 20px rgba(0,0,0,.4)' }}>
            {FUNNEL_STEPS.map((step, i) => {
              const val = funnel[step.key] || 0;
              const pct = maxVal > 0 ? Math.max((val/maxVal)*100, val>0?8:0) : 0;
              const conv = convs.find(c=>c.to===step.key);
              return (
                <div key={step.key} style={{ marginBottom: i<FUNNEL_STEPS.length-1?6:0 }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:6 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                      <span style={{ fontSize:14 }}>{step.icon}</span>
                      <span style={{ fontFamily:'var(--font-semi)', fontWeight:700, fontSize:12, color:C.text2, letterSpacing:.3 }}>{step.label}</span>
                    </div>
                    <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                      {conv && (
                        <span style={{ fontFamily:'var(--font-semi)', fontSize:10, fontWeight:600, color: parseFloat(conv.rate)>30?C.green:parseFloat(conv.rate)>15?C.gold:C.red, background:'rgba(255,255,255,.05)', padding:'2px 8px', borderRadius:20 }}>
                          conv. {conv.rate}%
                        </span>
                      )}
                      <span style={{ fontFamily:'var(--font-cond)', fontWeight:800, fontSize:22, color:'#fff', minWidth:50, textAlign:'right' }}>
                        {val.toLocaleString()}
                      </span>
                    </div>
                  </div>
                  <div style={{ background:'rgba(255,255,255,.05)', borderRadius:5, height:40, overflow:'hidden' }}>
                    <div style={{
                      width:`${pct}%`, height:'100%', borderRadius:5,
                      background:`linear-gradient(90deg,${step.color}88,${step.color})`,
                      display:'flex', alignItems:'center', paddingLeft:12,
                      transition:'width .8s cubic-bezier(.16,1,.3,1)',
                      fontFamily:'var(--font-semi)', fontSize:11, fontWeight:600, color:'rgba(255,255,255,.9)',
                    }}>
                      {val > 0 && `${pct.toFixed(0)}% del total`}
                    </div>
                  </div>
                  {i < FUNNEL_STEPS.length-1 && (
                    <div style={{ marginLeft:20, height:8, borderLeft:'1px dashed rgba(255,255,255,.1)' }}/>
                  )}
                </div>
              );
            })}
          </div>

          {/* Conversions table */}
          <div style={{ background:C.carbon, border:'1px solid rgba(255,255,255,.07)', borderRadius:8, padding:20, boxShadow:'0 4px 20px rgba(0,0,0,.4)' }}>
            <div style={{ fontFamily:'var(--font-semi)', fontSize:10, fontWeight:700, letterSpacing:'2px', textTransform:'uppercase', color:C.text3, marginBottom:16 }}>TASAS DE CONVERSIÓN</div>
            {convs.map((c,i) => {
              const rate = parseFloat(c.rate);
              const color = rate>30?C.green:rate>15?C.gold:C.red;
              return (
                <div key={i} style={{ marginBottom:14, paddingBottom:14, borderBottom:i<convs.length-1?'1px solid rgba(255,255,255,.05)':undefined }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:6 }}>
                    <span style={{ fontFamily:'var(--font-semi)', fontSize:11, color:C.text2 }}>
                      {c.from} → {c.to}
                    </span>
                    <span style={{ fontFamily:'var(--font-cond)', fontWeight:800, fontSize:20, color }}>
                      {c.rate}%
                    </span>
                  </div>
                  <div style={{ background:'rgba(255,255,255,.05)', borderRadius:3, height:5 }}>
                    <div style={{ width:`${Math.min(rate,100)}%`, height:'100%', borderRadius:3, background:color, transition:'width .6s ease' }}/>
                  </div>
                </div>
              );
            })}

            {/* Raw stages */}
            {Object.keys(raw).length > 0 && (
              <div style={{ marginTop:16, paddingTop:14, borderTop:'1px solid rgba(255,255,255,.06)' }}>
                <div style={{ fontFamily:'var(--font-semi)', fontSize:9.5, fontWeight:700, letterSpacing:2, textTransform:'uppercase', color:C.text3, marginBottom:10 }}>ETAPAS EN HUBSPOT</div>
                {Object.entries(raw).map(([name,count])=>(
                  <div key={name} style={{ display:'flex', justifyContent:'space-between', fontSize:11.5, marginBottom:6, color:C.text2 }}>
                    <span>{name}</span>
                    <span style={{ fontWeight:700, color:C.text }}>{count}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ══ CONTACTOS POR FUENTE ══ */}
        {contacts.bySource && Object.keys(contacts.bySource).length > 0 && (<>
          <SecHead label="Contactos por fuente"/>
          <div style={{ background:C.carbon, border:'1px solid rgba(255,255,255,.07)', borderRadius:8, padding:20, marginBottom:28, boxShadow:'0 4px 20px rgba(0,0,0,.4)' }}>
            <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
              {Object.entries(contacts.bySource).sort((a,b)=>b[1]-a[1]).map(([src, count])=>(
                <div key={src} style={{ background:'rgba(255,255,255,.05)', border:'1px solid rgba(255,255,255,.08)', borderRadius:8, padding:'12px 18px', minWidth:120, textAlign:'center' }}>
                  <div style={{ fontFamily:'var(--font-cond)', fontWeight:800, fontSize:28, color:C.gold }}>{count}</div>
                  <div style={{ fontFamily:'var(--font-semi)', fontSize:10, fontWeight:600, color:C.text3, letterSpacing:1, textTransform:'uppercase', marginTop:4 }}>{src}</div>
                </div>
              ))}
            </div>
          </div>
        </>)}

        {/* ══ DEALS RECIENTES ══ */}
        {recent.length > 0 && (<>
          <SecHead label="Deals recientes"/>
          <div style={{ background:C.carbon, border:'1px solid rgba(255,255,255,.07)', borderRadius:8, overflow:'hidden', boxShadow:'0 4px 20px rgba(0,0,0,.4)' }}>
            <table className="table">
              <thead>
                <tr>
                  <th style={{ textAlign:'left' }}>DEAL</th>
                  <th>ETAPA</th>
                  <th style={{ textAlign:'right' }}>MONTO</th>
                  <th style={{ textAlign:'right' }}>CREADO</th>
                </tr>
              </thead>
              <tbody>
                {recent.map(d=>(
                  <tr key={d.id}>
                    <td style={{ fontWeight:500, color:C.text, maxWidth:260, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                      {d.properties.dealname||'Sin nombre'}
                    </td>
                    <td>
                      <span style={{ fontFamily:'var(--font-semi)', fontSize:10.5, fontWeight:600, color:C.text2 }}>
                        {d.properties.dealstage||'—'}
                      </span>
                    </td>
                    <td style={{ textAlign:'right', fontFamily:'var(--mono)', fontSize:12, color:C.gold }}>
                      {d.properties.amount ? `S/ ${parseFloat(d.properties.amount).toLocaleString()}` : '—'}
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

      {/* No data state */}
      {!loading && !data && !error && (
        <div className="empty-state">
          <div style={{ fontSize:40, marginBottom:8 }}>🔗</div>
          <p style={{ fontFamily:'var(--font-semi)', fontWeight:700, fontSize:14, color:C.text2 }}>Conectando con HubSpot...</p>
          <p>Selecciona un pipeline para ver el embudo de admisiones</p>
        </div>
      )}
    </div>
  );
}
