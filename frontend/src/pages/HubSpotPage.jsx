import React, { useState, useEffect } from 'react';
import { hubspotApi } from '../lib/api.js';
import { useApp } from '../context/AppContext.jsx';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, LineChart, Line, CartesianGrid
} from 'recharts';

const C = {
  gold:'#DCA145', goldDim:'rgba(220,161,69,.12)', goldBorder:'rgba(220,161,69,.28)',
  green:'#2DD4A0', greenDim:'rgba(45,212,160,.1)',
  blue:'#5B8DB8', blueDim:'rgba(91,141,184,.12)',
  red:'#E8445A', redDim:'rgba(232,68,90,.1)',
  purple:'#9061B0', indigo:'#7B68EE',
  carbon:'#262630', slate:'#30373F',
  text:'#F0EDE8', text2:'#9CA3AA', text3:'#5C6470',
};

// ── Static data from HubSpot analysis ──────────────────────────────
const STATIC = {
  totalLeads: 5930,
  metaLeads: 30, target: 25000,
  funnel: [
    { stage:'Interesado', value:922,  color:C.blue   },
    { stage:'Inscrito',   value:420,  color:C.indigo },
    { stage:'Ingresante', value:235,  color:C.purple },
    { stage:'Pagante',    value:392,  color:C.gold   },
    { stage:'Matriculado',value:14,   color:C.green  },
  ],
  convRates: [
    { from:'Interesado', to:'Inscrito',   rate:45.6 },
    { from:'Inscrito',   to:'Ingresante', rate:56.0 },
    { from:'Ingresante', to:'Pagante',    rate:166.8},
    { from:'Pagante',    to:'Matriculado',rate:3.6  },
  ],
  tiempos: [
    { etapa:'Interesado → Inscrito',   dias:3.7,  delta:'+0%',   dir:'neutral' },
    { etapa:'Inscrito → Ingresante',   dias:22.7, delta:'+521%', dir:'bad'     },
    { etapa:'Ingresante → Pagante',    dias:1.3,  delta:'-94%',  dir:'good'    },
    { etapa:'Total creación → cierre', dias:24.1, delta:'+1704%',dir:'bad'     },
  ],
  estadoLeads: [
    { estado:'Sin Gestión',   valor:258,  color:C.text3  },
    { estado:'En Validación', valor:1932, color:C.gold   },
    { estado:'En Calificación',valor:179, color:C.indigo },
    { estado:'Calificado',    valor:325,  color:C.green  },
    { estado:'Descalificado', valor:2906, color:C.red    },
    { estado:'En Nutrición',  valor:17,   color:C.blue   },
  ],
  carreras: [
    { name:'Enfermería',          leads:704, conv:49 },
    { name:'Derecho',             leads:436, conv:18 },
    { name:'Contabilidad',        leads:382, conv:0  },
    { name:'Ing. Agroindustrial', leads:174, conv:0  },
    { name:'Ing. Civil',          leads:150, conv:10 },
    { name:'Estomatología',       leads:112, conv:5  },
    { name:'Adm. Empresas',       leads:109, conv:7  },
    { name:'Medicina Humana',     leads:858, conv:54 },
    { name:'Psicología',          leads:0,   conv:24 },
    { name:'Ing. Sistemas',       leads:89,  conv:17 },
  ].sort((a,b)=>b.leads-a.leads),
  fuentes: [
    { name:'Google (Search)',  leads:3254, color:C.gold   },
    { name:'Meta/CTWA',        leads:1531, color:C.blue   },
    { name:'Búsq. Orgánica',   leads:577,  color:C.green  },
    { name:'Tráfico Orgánico', leads:231,  color:C.indigo },
    { name:'Sin valor',        leads:337,  color:C.text3  },
  ],
  contacto: [
    { name:'WhatsApp', value:2162, pct:89 },
    { name:'Teléfono', value:187,  pct:8  },
    { name:'Email',    value:81,   pct:3  },
  ],
  googleAds: { interesado:20, inscrito:23, ingresante:12, pagante:22, matriculado:2, inversion:519794 },
  metaInv: 196793,
  asesores: [
    { name:'Alessandra Perez',   leads:165, atendidos:60, olvido:4  },
    { name:'Julio Lamadrid',     leads:138, atendidos:34, olvido:3  },
    { name:'Lesly Cullampe',     leads:130, atendidos:0,  olvido:0  },
    { name:'Oscar Silva',        leads:16,  atendidos:16, olvido:1  },
    { name:'Leonela Aponte',     leads:13,  atendidos:14, olvido:2  },
    { name:'Wilson Cieza',       leads:0,   atendidos:10, olvido:8  },
  ],
  tendencia: [
    { s:'23/3', leads:150 },{ s:'30/3', leads:229 },{ s:'6/4', leads:217 },
    { s:'13/4', leads:147 },{ s:'20/4', leads:170 },{ s:'27/4', leads:421 },
    { s:'4/5',  leads:493 },{ s:'11/5', leads:585 },{ s:'18/5', leads:577 },
    { s:'25/5', leads:501 },{ s:'1/6',  leads:547 },{ s:'8/6',  leads:635 },
    { s:'15/6', leads:611 },{ s:'22/6', leads:335 },
  ],
};

// ── Components ──────────────────────────────────────────────────────

const Tip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background:'#1C1C25', border:`1px solid ${C.goldBorder}`, borderLeft:`3px solid ${C.gold}`, padding:'10px 16px', borderRadius:8, fontSize:12, boxShadow:'0 8px 32px rgba(0,0,0,.6)' }}>
      <div style={{ color:C.text3, marginBottom:6, fontSize:10, letterSpacing:1, textTransform:'uppercase', fontFamily:'var(--font-semi)', fontWeight:700 }}>{label}</div>
      {payload.map((p,i)=>(
        <div key={i} style={{ color:C.text2, fontFamily:'var(--font-semi)', fontWeight:600, marginBottom:2 }}>
          {p.name}: <span style={{ color:'#fff' }}>{typeof p.value==='number'?p.value.toLocaleString():p.value}</span>
        </div>
      ))}
    </div>
  );
};

function Kpi({ label, value, sub, color, idx=0, alert }) {
  const [hov, setHov] = useState(false);
  return (
    <div onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}
      style={{ background:hov?'#2E2B35':C.carbon, border:`1px solid ${hov?C.goldBorder:'rgba(255,255,255,.07)'}`,
        borderRadius:8, padding:'18px 20px 16px', position:'relative', overflow:'hidden',
        boxShadow:hov?`0 8px 32px rgba(0,0,0,.5)`:'0 4px 20px rgba(0,0,0,.4)',
        transition:'all .2s', transform:hov?'translateY(-3px)':'none',
        animation:`kpi-rise .4s ${idx*.05}s both` }}>
      <div style={{ position:'absolute', left:0, top:0, bottom:0, width:3, background:color||C.gold, borderRadius:'8px 0 0 8px' }}/>
      {alert && <div style={{ position:'absolute', top:12, right:14, fontSize:16 }}>{alert}</div>}
      <div style={{ fontFamily:'var(--font-semi)', fontSize:9.5, fontWeight:700, letterSpacing:'2.5px', textTransform:'uppercase', color:hov?C.text2:C.text3, marginBottom:10 }}>{label}</div>
      <div style={{ fontFamily:'var(--font-cond)', fontWeight:800, fontSize:34, lineHeight:1, color:hov?'#fff':C.text }}>{value??'—'}</div>
      {sub && <div style={{ fontSize:11.5, color:hov?C.text2:C.text3, marginTop:6, lineHeight:1.4 }} dangerouslySetInnerHTML={{__html:sub}}/>}
    </div>
  );
}

const SecHead = ({ label, sub }) => (
  <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:16, marginTop:4 }}>
    <div style={{ width:22, height:2, background:C.gold, borderRadius:2, flexShrink:0 }}/>
    <div>
      <span style={{ fontFamily:'var(--font-semi)', fontSize:10, fontWeight:700, letterSpacing:'3px', textTransform:'uppercase', color:C.gold }}>{label}</span>
      {sub && <span style={{ fontFamily:'var(--font-semi)', fontSize:10, color:C.text3, marginLeft:12 }}>{sub}</span>}
    </div>
  </div>
);

function Card({ children, style={} }) {
  return (
    <div style={{ background:C.carbon, border:'1px solid rgba(255,255,255,.07)', borderRadius:8, padding:20, boxShadow:'0 4px 20px rgba(0,0,0,.4)', ...style }}>
      {children}
    </div>
  );
}

function CardHead({ label, sub }) {
  return (
    <div style={{ marginBottom:16, paddingBottom:12, borderBottom:'1px solid rgba(255,255,255,.06)' }}>
      <div style={{ fontFamily:'var(--font-semi)', fontSize:10, fontWeight:700, letterSpacing:'2px', textTransform:'uppercase', color:C.text2 }}>{label}</div>
      {sub && <div style={{ fontSize:11, color:C.text3, marginTop:3 }}>{sub}</div>}
    </div>
  );
}

export default function HubSpotPage() {
  const { activeClient } = useApp();
  const [tab, setTab] = useState('ejecutivo');
  const [liveData, setLiveData] = useState(null);
  const [pipelines, setPipelines] = useState([]);
  const [pipelineId, setPipelineId] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    hubspotApi.getPipelines()
      .then(res => {
        const pipes = res.data?.pipelines || [];
        setPipelines(pipes);
        const admision = pipes.find(p=>p.label?.toLowerCase().includes('2026')||p.label?.toLowerCase().includes('admis')) || pipes[0];
        if (admision) setPipelineId(admision.id);
      }).catch(()=>{});
  }, []);

  useEffect(() => {
    if (!pipelineId) return;
    setLoading(true);
    hubspotApi.getSummary(pipelineId, 30)
      .then(res => setLiveData(res.data))
      .catch(()=>{})
      .finally(()=>setLoading(false));
  }, [pipelineId]);

  // Merge live data with static if available
  const funnel = liveData?.funnel?.funnel
    ? STATIC.funnel.map(s => ({ ...s, value: liveData.funnel.funnel[s.stage.toLowerCase()] || s.value }))
    : STATIC.funnel;

  const totalDesc = STATIC.estadoLeads.find(e=>e.estado==='Descalificado')?.valor || 0;
  const totalValid = STATIC.estadoLeads.find(e=>e.estado==='En Validación')?.valor || 0;
  const pctDesc = ((totalDesc / STATIC.totalLeads)*100).toFixed(0);
  const googleCPM = (STATIC.googleAds.inversion / (STATIC.googleAds.matriculado||1)).toFixed(0);

  const TABS = [
    { k:'ejecutivo', l:'RESUMEN EJECUTIVO' },
    { k:'embudo',    l:'EMBUDO' },
    { k:'carreras',  l:'CARRERAS' },
    { k:'asesores',  l:'ASESORES' },
    { k:'canales',   l:'CANALES' },
  ];

  return (
    <div className="scroll-y" style={{ flex:1, padding:'24px 28px', background:'#14141B' }}>

      {/* ── Header ── */}
      <div style={{ display:'flex', alignItems:'center', gap:14, marginBottom:20, flexWrap:'wrap' }}>
        <h1 style={{ fontFamily:'var(--font-cond)', fontWeight:900, fontSize:26, letterSpacing:2, textTransform:'uppercase', color:'#fff' }}>
          HubSpot CRM
        </h1>
        <span style={{ fontFamily:'var(--font-semi)', fontSize:11, fontWeight:600, letterSpacing:1.5, color:C.text3, textTransform:'uppercase' }}>{activeClient.name}</span>
        {pipelines.length>0 && (
          <select value={pipelineId} onChange={e=>setPipelineId(e.target.value)}
            style={{ padding:'5px 12px', fontSize:11, fontFamily:'var(--font-semi)', fontWeight:700, borderRadius:6, background:'rgba(220,161,69,.06)', borderColor:C.goldBorder, color:C.gold }}>
            {pipelines.map(p=><option key={p.id} value={p.id}>{p.label}</option>)}
          </select>
        )}
        {loading && <span className="spinner"/>}
        <div style={{ fontFamily:'var(--font-semi)', fontSize:10, color:C.text3, marginLeft:'auto', background:'rgba(255,255,255,.04)', border:'1px solid rgba(255,255,255,.08)', padding:'4px 12px', borderRadius:20 }}>
          📊 Datos: Proceso 2026-II · Actualizado jun/2026
        </div>
      </div>

      {/* ── Tabs ── */}
      <div style={{ display:'flex', gap:0, marginBottom:24, borderBottom:'1px solid rgba(255,255,255,.07)' }}>
        {TABS.map(t=>(
          <button key={t.k} onClick={()=>setTab(t.k)} style={{
            padding:'8px 20px', fontFamily:'var(--font-semi)', fontSize:10.5, fontWeight:700, letterSpacing:1.5,
            textTransform:'uppercase', cursor:'pointer', border:'none', background:'transparent',
            color: tab===t.k ? C.gold : C.text3,
            borderBottom: tab===t.k ? `2px solid ${C.gold}` : '2px solid transparent',
            transition:'all .15s',
          }}>{t.l}</button>
        ))}
      </div>

      {/* ══════════════════════════════════════
          TAB: RESUMEN EJECUTIVO
      ══════════════════════════════════════ */}
      {tab==='ejecutivo' && (<>

        {/* Alertas críticas */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10, marginBottom:24 }}>
          {[
            { icon:'🚨', label:'Leads descalificados por asesor', value:`${totalDesc.toLocaleString()} (${pctDesc}%)`, color:C.red, note:'Motivo #1: Asesor no cambia estado' },
            { icon:'⚠️', label:'Leads atascados en Validación', value:totalValid.toLocaleString(), color:C.gold, note:'33% del total sin trabajar activamente' },
            { icon:'⏱️', label:'Tiempo Inscrito → Ingresante', value:'22.7 días', color:C.red, note:'Subió +521% vs. período anterior' },
          ].map((a,i)=>(
            <div key={i} style={{ background:`${a.color}0D`, border:`1px solid ${a.color}44`, borderLeft:`3px solid ${a.color}`, borderRadius:8, padding:'16px 18px' }}>
              <div style={{ fontSize:18, marginBottom:6 }}>{a.icon}</div>
              <div style={{ fontFamily:'var(--font-semi)', fontSize:9.5, fontWeight:700, letterSpacing:2, textTransform:'uppercase', color:a.color, marginBottom:6 }}>{a.label}</div>
              <div style={{ fontFamily:'var(--font-cond)', fontWeight:800, fontSize:28, color:'#fff', marginBottom:4 }}>{a.value}</div>
              <div style={{ fontSize:11, color:C.text2 }}>{a.note}</div>
            </div>
          ))}
        </div>

        <SecHead label="KPIs del proceso 2026-II"/>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, marginBottom:14 }}>
          <Kpi idx={0} label="Total leads digitales" color={C.blue}
            value={STATIC.totalLeads.toLocaleString()}
            sub={`Meta proceso: <b>25,000</b> · ${((STATIC.totalLeads/25000)*100).toFixed(1)}% alcanzado`}/>
          <Kpi idx={1} label="Interesados pipeline" color={C.indigo}
            value="922"
            sub={`Admisión Pregrado 2026-II`}/>
          <Kpi idx={2} label="Matriculados Google Ads" color={C.green}
            value="2"
            sub={`De S/ 519,794 invertidos · CPM S/ ${parseInt(googleCPM).toLocaleString()}`} alert="⚠️"/>
          <Kpi idx={3} label="Tiempo respuesta promedio" color={C.red}
            value="21.1 hrs"
            sub={`Objetivo: <b>&lt;5 minutos</b> · Gap crítico`} alert="🚨"/>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, marginBottom:28 }}>
          <Kpi idx={4} label="Calificados totales" color={C.green}
            value="325"
            sub={`5.5% del total leads · tasa baja`}/>
          <Kpi idx={5} label="Canal preferido" color={C.gold}
            value="WhatsApp"
            sub={`89% de 2,430 contactos prefiere WA`}/>
          <Kpi idx={6} label="Inversión Google 2026-II" color={C.blue}
            value="S/ 519,794"
            sub={`Meta: S/ 196,793 · Total: S/ 716,587`}/>
          <Kpi idx={7} label="Leads sin propietario (jun)" color={C.red}
            value="49"
            sub={`20 en mayo · +145% MoM`} alert="⚠️"/>
        </div>

        {/* Tendencia semanal */}
        <SecHead label="Tendencia de leads por semana"/>
        <Card style={{ marginBottom:28 }}>
          <CardHead label="Leads digitales recibidos · Semanal" sub="Todas las fuentes pagadas"/>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={STATIC.tendencia} barSize={24}>
              <XAxis dataKey="s" tick={{ fontSize:9, fill:C.text3 }} axisLine={false} tickLine={false}/>
              <YAxis tick={{ fontSize:9, fill:C.text3 }} axisLine={false} tickLine={false}/>
              <CartesianGrid stroke="rgba(255,255,255,.04)" strokeDasharray="4 4"/>
              <Tooltip content={<Tip/>}/>
              <Bar dataKey="leads" name="Leads" fill={C.gold} opacity={.85} radius={[3,3,0,0]}/>
            </BarChart>
          </ResponsiveContainer>
          <div style={{ display:'flex', gap:24, marginTop:12, fontSize:11.5, color:C.text3, flexWrap:'wrap' }}>
            <span>Pico: <strong style={{ color:'#fff' }}>635 leads</strong> (8/jun)</span>
            <span>Promedio: <strong style={{ color:'#fff' }}>~430 leads/semana</strong></span>
            <span>Última semana: <strong style={{ color:C.red }}>335 (-47% vs pico)</strong></span>
          </div>
        </Card>

        {/* Estado del lead + canal */}
        <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr', gap:14, marginBottom:28 }}>
          <Card>
            <CardHead label="Estado actual de todos los leads" sub={`${STATIC.totalLeads.toLocaleString()} contactos totales`}/>
            {STATIC.estadoLeads.map((e,i)=>{
              const pct = (e.valor/STATIC.totalLeads*100).toFixed(1);
              return (
                <div key={i} style={{ marginBottom:10 }}>
                  <div style={{ display:'flex', justifyContent:'space-between', fontSize:12, marginBottom:4 }}>
                    <span style={{ color:C.text2, fontFamily:'var(--font-semi)', fontWeight:600 }}>{e.estado}</span>
                    <div style={{ display:'flex', gap:12, alignItems:'center' }}>
                      <span style={{ fontSize:10.5, color:C.text3 }}>{pct}%</span>
                      <span style={{ fontFamily:'var(--font-cond)', fontWeight:800, fontSize:18, color:'#fff' }}>{e.valor.toLocaleString()}</span>
                    </div>
                  </div>
                  <div style={{ background:'rgba(255,255,255,.05)', borderRadius:4, height:28, overflow:'hidden' }}>
                    <div style={{ width:`${pct}%`, height:'100%', borderRadius:4, background:e.color, opacity:.85, transition:'width .7s ease' }}/>
                  </div>
                </div>
              );
            })}
          </Card>
          <Card>
            <CardHead label="Canal de contacto preferido"/>
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie data={STATIC.contacto} cx="50%" cy="50%" innerRadius={48} outerRadius={70} dataKey="value" paddingAngle={4}>
                  <Cell fill={C.green}/><Cell fill={C.blue}/><Cell fill={C.gold}/>
                </Pie>
                <Tooltip formatter={v=>v.toLocaleString()} contentStyle={{ background:'#1C1C25', border:`1px solid ${C.goldBorder}`, fontSize:12, borderRadius:8 }}/>
                <Legend iconType="circle" iconSize={7} wrapperStyle={{ fontFamily:'var(--font-semi)', fontSize:10.5 }}/>
              </PieChart>
            </ResponsiveContainer>
            <div style={{ marginTop:8, fontSize:11.5, color:C.text2, textAlign:'center' }}>
              <strong style={{ color:C.green }}>89%</strong> prefiere WhatsApp sobre llamada o email
            </div>
          </Card>
        </div>

      </>)}

      {/* ══════════════════════════════════════
          TAB: EMBUDO
      ══════════════════════════════════════ */}
      {tab==='embudo' && (<>
        <SecHead label="Embudo de admisiones Pregrado 2026-II"/>
        <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr', gap:16, marginBottom:28 }}>
          <Card>
            <CardHead label="Interesado → Matriculado" sub="Pipeline Admisión Pregrado"/>
            {(() => {
              const max = STATIC.funnel[0].value;
              return STATIC.funnel.map((s,i)=>{
                const pct = Math.max((s.value/max)*100, s.value>0?8:0);
                const prev = i>0 ? STATIC.funnel[i-1].value : null;
                const conv = prev ? ((s.value/prev)*100).toFixed(1) : null;
                return (
                  <div key={i} style={{ marginBottom:i<STATIC.funnel.length-1?6:0 }}>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:5 }}>
                      <span style={{ fontFamily:'var(--font-semi)', fontWeight:700, fontSize:13, color:C.text2 }}>{s.stage}</span>
                      <div style={{ display:'flex', gap:12, alignItems:'center' }}>
                        {conv && (
                          <span style={{ fontFamily:'var(--font-semi)', fontSize:10.5, fontWeight:700,
                            color:parseFloat(conv)>50?C.green:parseFloat(conv)>25?C.gold:C.red,
                            background:'rgba(255,255,255,.05)', padding:'2px 9px', borderRadius:20 }}>
                            conv. {conv}%
                          </span>
                        )}
                        <span style={{ fontFamily:'var(--font-cond)', fontWeight:800, fontSize:26, color:'#fff', minWidth:60, textAlign:'right' }}>
                          {s.value.toLocaleString()}
                        </span>
                      </div>
                    </div>
                    <div style={{ background:'rgba(255,255,255,.05)', borderRadius:5, height:44, overflow:'hidden' }}>
                      <div style={{ width:`${pct}%`, height:'100%', borderRadius:5,
                        background:`linear-gradient(90deg,${s.color}88,${s.color})`,
                        display:'flex', alignItems:'center', paddingLeft:14,
                        fontFamily:'var(--font-semi)', fontSize:11, fontWeight:600, color:'rgba(255,255,255,.85)',
                        transition:'width .8s cubic-bezier(.16,1,.3,1)' }}>
                        {s.value>0 && `${pct.toFixed(0)}% del top`}
                      </div>
                    </div>
                    {i<STATIC.funnel.length-1 && <div style={{ marginLeft:22, height:8, borderLeft:'1px dashed rgba(255,255,255,.1)' }}/>}
                  </div>
                );
              });
            })()}
          </Card>

          {/* Tiempos */}
          <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
            <Card>
              <CardHead label="Tiempos promedio de cierre"/>
              {STATIC.tiempos.map((t,i)=>(
                <div key={i} style={{ marginBottom:12, paddingBottom:12, borderBottom:i<STATIC.tiempos.length-1?'1px solid rgba(255,255,255,.05)':undefined }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline', marginBottom:4 }}>
                    <span style={{ fontFamily:'var(--font-semi)', fontSize:11, color:C.text2 }}>{t.etapa}</span>
                    <span style={{ fontFamily:'var(--font-cond)', fontWeight:800, fontSize:22,
                      color:t.dir==='good'?C.green:t.dir==='bad'?C.red:C.text }}>
                      {t.dias}d
                    </span>
                  </div>
                  <div style={{ fontSize:10.5, color:t.dir==='good'?C.green:t.dir==='bad'?C.red:C.text3, fontFamily:'var(--font-semi)', fontWeight:600 }}>
                    {t.delta} vs. período anterior
                  </div>
                </div>
              ))}
            </Card>
            {/* Google Ads funnel */}
            <Card>
              <CardHead label="Google Ads 2026-02" sub="S/ 519,794 invertidos"/>
              {[
                ['Interesado',  STATIC.googleAds.interesado ],
                ['Inscrito',    STATIC.googleAds.inscrito   ],
                ['Ingresante',  STATIC.googleAds.ingresante ],
                ['Pagante',     STATIC.googleAds.pagante    ],
                ['Matriculado', STATIC.googleAds.matriculado],
              ].map(([stage,val],i,arr)=>{
                const pct = (val/arr[0][1]*100).toFixed(0);
                return (
                  <div key={stage} style={{ display:'flex', justifyContent:'space-between', fontSize:12, marginBottom:8, alignItems:'center' }}>
                    <span style={{ color:C.text3 }}>{stage}</span>
                    <div style={{ display:'flex', gap:10, alignItems:'center' }}>
                      <div style={{ background:'rgba(255,255,255,.05)', borderRadius:3, height:6, width:80 }}>
                        <div style={{ width:`${pct}%`, height:'100%', borderRadius:3, background:C.gold }}/>
                      </div>
                      <span style={{ fontWeight:700, color: stage==='Matriculado'?C.green:'#fff', fontFamily:'var(--font-cond)', fontSize:18, minWidth:28, textAlign:'right' }}>{val}</span>
                    </div>
                  </div>
                );
              })}
              <div style={{ marginTop:10, paddingTop:10, borderTop:'1px solid rgba(255,255,255,.06)', fontSize:11.5, color:C.red }}>
                ⚠️ S/ {parseInt(googleCPM).toLocaleString()} costo por matriculado — revisar atribución
              </div>
            </Card>
          </div>
        </div>
      </>)}

      {/* ══════════════════════════════════════
          TAB: CARRERAS
      ══════════════════════════════════════ */}
      {tab==='carreras' && (<>
        <SecHead label="Leads y conversiones por carrera" sub="Pauta pagada · Proceso 2026-II"/>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, marginBottom:28 }}>
          <Card>
            <CardHead label="Leads totales por carrera"/>
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={STATIC.carreras.filter(c=>c.leads>0).slice(0,8)} layout="vertical" barSize={20}>
                <XAxis type="number" tick={{ fontSize:9, fill:C.text3 }} axisLine={false} tickLine={false}/>
                <YAxis type="category" dataKey="name" tick={{ fontSize:10, fill:C.text2, fontFamily:'var(--font-semi)' }} axisLine={false} tickLine={false} width={130}/>
                <Tooltip content={<Tip/>}/>
                <Bar dataKey="leads" name="Leads" fill={C.blue} opacity={.85} radius={[0,4,4,0]}/>
              </BarChart>
            </ResponsiveContainer>
          </Card>
          <Card>
            <CardHead label="Convertidos por carrera" sub="Inscrito + Ingresante + Matriculado"/>
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={STATIC.carreras.filter(c=>c.conv>0).sort((a,b)=>b.conv-a.conv)} layout="vertical" barSize={20}>
                <XAxis type="number" tick={{ fontSize:9, fill:C.text3 }} axisLine={false} tickLine={false}/>
                <YAxis type="category" dataKey="name" tick={{ fontSize:10, fill:C.text2, fontFamily:'var(--font-semi)' }} axisLine={false} tickLine={false} width={130}/>
                <Tooltip content={<Tip/>}/>
                <Bar dataKey="conv" name="Convertidos" fill={C.green} opacity={.85} radius={[0,4,4,0]}/>
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </div>

        {/* Tabla eficiencia */}
        <Card>
          <CardHead label="Eficiencia por carrera · Leads vs Conversión"/>
          <table className="table">
            <thead>
              <tr>
                <th style={{ textAlign:'left' }}>CARRERA</th>
                <th style={{ textAlign:'right' }}>LEADS</th>
                <th style={{ textAlign:'right' }}>CONV.</th>
                <th style={{ textAlign:'right' }}>TASA CONV.</th>
                <th style={{ textAlign:'right' }}>ALERTA</th>
              </tr>
            </thead>
            <tbody>
              {STATIC.carreras.filter(c=>c.leads>0||c.conv>0).sort((a,b)=>b.leads-a.leads).map(c=>{
                const rate = c.leads>0 ? ((c.conv/c.leads)*100).toFixed(1) : '—';
                const rateN = parseFloat(rate)||0;
                const color = rateN>10?C.green:rateN>5?C.gold:C.red;
                return (
                  <tr key={c.name}>
                    <td style={{ fontWeight:600, color:C.text }}>{c.name}</td>
                    <td style={{ textAlign:'right', fontFamily:'var(--mono)' }}>{c.leads.toLocaleString()}</td>
                    <td style={{ textAlign:'right', color:C.green, fontWeight:700 }}>{c.conv}</td>
                    <td style={{ textAlign:'right' }}>
                      <span style={{ color, fontWeight:700 }}>{rate}{rate!=='—'?'%':''}</span>
                    </td>
                    <td style={{ textAlign:'right', fontSize:14 }}>
                      {rateN<5&&c.leads>100?'🚨':rateN<10&&c.leads>50?'⚠️':'✅'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>
      </>)}

      {/* ══════════════════════════════════════
          TAB: ASESORES
      ══════════════════════════════════════ */}
      {tab==='asesores' && (<>
        <SecHead label="Performance de asesores" sub="Este trimestre · Pipeline Admisión"/>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12, marginBottom:24 }}>
          {[
            { label:'Leads enviados a ventas', value:'549', color:C.blue },
            { label:'Leads atendidos por humano', value:'168', sub:'31% del total enviado', color:C.gold },
            { label:'Tiempo promedio respuesta', value:'21.1 hrs', sub:'Objetivo: <5 min', color:C.red, alert:'🚨' },
          ].map((k,i)=><Kpi key={i} idx={i} {...k}/>)}
        </div>

        <Card style={{ marginBottom:24 }}>
          <CardHead label="Leads por asesor · Enviados vs Atendidos vs En Olvido"/>
          <table className="table">
            <thead>
              <tr>
                <th style={{ textAlign:'left' }}>ASESOR</th>
                <th style={{ textAlign:'right' }}>LEADS ASIGNADOS</th>
                <th style={{ textAlign:'right' }}>ATENDIDOS</th>
                <th style={{ textAlign:'right' }}>EN OLVIDO</th>
                <th style={{ textAlign:'right' }}>TASA ATENCIÓN</th>
                <th style={{ textAlign:'right' }}>ESTADO</th>
              </tr>
            </thead>
            <tbody>
              {STATIC.asesores.map((a,i)=>{
                const tasa = a.leads>0?((a.atendidos/a.leads)*100).toFixed(0):'-';
                const tasaN = parseInt(tasa)||0;
                return (
                  <tr key={i}>
                    <td style={{ fontWeight:600, color:C.text }}>{a.name}</td>
                    <td style={{ textAlign:'right' }}>{a.leads}</td>
                    <td style={{ textAlign:'right', color:C.green, fontWeight:700 }}>{a.atendidos}</td>
                    <td style={{ textAlign:'right', color:a.olvido>3?C.red:C.gold, fontWeight:700 }}>{a.olvido}</td>
                    <td style={{ textAlign:'right' }}>
                      <span style={{ color:tasaN>50?C.green:tasaN>25?C.gold:C.red, fontWeight:700 }}>{tasa}{tasa!=='-'?'%':''}</span>
                    </td>
                    <td style={{ textAlign:'right', fontSize:14 }}>
                      {a.olvido>=8?'🚨':a.olvido>=3?'⚠️':'✅'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>

        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
          <Card>
            <CardHead label="Leads atendidos antes de 10 min" sub="Solo 2 leads en todo el proceso"/>
            <div style={{ textAlign:'center', padding:'24px 0' }}>
              <div style={{ fontFamily:'var(--font-cond)', fontWeight:900, fontSize:64, color:C.red }}>2</div>
              <div style={{ fontFamily:'var(--font-semi)', fontSize:12, color:C.text3, marginTop:8 }}>de 549 leads enviados a ventas</div>
              <div style={{ marginTop:16, padding:'10px 16px', background:C.redDim, border:`1px solid ${C.red}44`, borderRadius:8, fontSize:12, color:C.text2 }}>
                🚨 Solo el <strong style={{ color:C.red }}>0.36%</strong> fue atendido en menos de 10 minutos
              </div>
            </div>
          </Card>
          <Card>
            <CardHead label="Motivos de descalificación (top)" sub="2,906 leads descalificados total"/>
            {[
              { motivo:'Asesor no cambia estado',    n:2390, color:C.red   },
              { motivo:'Intento límite',              n:120,  color:C.gold  },
              { motivo:'No detalla motivo',           n:73,   color:C.text3 },
              { motivo:'Clases a distancia',          n:63,   color:C.blue  },
              { motivo:'Eligió otra universidad',     n:58,   color:C.indigo},
              { motivo:'Factor económico',            n:52,   color:C.text3 },
            ].map((m,i)=>(
              <div key={i} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:9 }}>
                <span style={{ fontSize:11.5, color:i===0?C.text:C.text2, fontWeight:i===0?700:400, maxWidth:'75%' }}>{m.motivo}</span>
                <span style={{ fontFamily:'var(--font-cond)', fontWeight:800, fontSize:18, color:m.color }}>{m.n.toLocaleString()}</span>
              </div>
            ))}
          </Card>
        </div>
      </>)}

      {/* ══════════════════════════════════════
          TAB: CANALES
      ══════════════════════════════════════ */}
      {tab==='canales' && (<>
        <SecHead label="Performance por canal y fuente de tráfico"/>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, marginBottom:24 }}>
          <Kpi idx={0} label="Google Ads inversión" color={C.gold} value="S/ 519,794" sub="72.6% del presupuesto 2026-II"/>
          <Kpi idx={1} label="Meta Ads inversión"   color={C.blue} value="S/ 196,793" sub="27.4% del presupuesto 2026-II"/>
          <Kpi idx={2} label="Google leads"         color={C.gold} value="3,254"       sub="55% del total leads digitales"/>
          <Kpi idx={3} label="Meta/CTWA leads"      color={C.blue} value="1,531"       sub="26% del total · medio: ctwa"/>
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, marginBottom:24 }}>
          <Card>
            <CardHead label="Leads por fuente de tráfico" sub="Total proceso 2026-II"/>
            {STATIC.fuentes.map((f,i)=>{
              const pct = (f.leads/STATIC.totalLeads*100).toFixed(1);
              return (
                <div key={i} style={{ marginBottom:12 }}>
                  <div style={{ display:'flex', justifyContent:'space-between', fontSize:12, marginBottom:4 }}>
                    <span style={{ color:C.text2, fontFamily:'var(--font-semi)', fontWeight:600 }}>{f.name}</span>
                    <div style={{ display:'flex', gap:10 }}>
                      <span style={{ color:C.text3, fontSize:11 }}>{pct}%</span>
                      <span style={{ fontFamily:'var(--font-cond)', fontWeight:800, fontSize:18, color:'#fff' }}>{f.leads.toLocaleString()}</span>
                    </div>
                  </div>
                  <div style={{ background:'rgba(255,255,255,.05)', borderRadius:4, height:30, overflow:'hidden' }}>
                    <div style={{ width:`${pct}%`, height:'100%', borderRadius:4, background:f.color, opacity:.85 }}/>
                  </div>
                </div>
              );
            })}
          </Card>

          <Card>
            <CardHead label="Estado del lead por canal"/>
            <table className="table">
              <thead>
                <tr>
                  <th style={{ textAlign:'left' }}>CANAL</th>
                  <th style={{ textAlign:'right' }}>CALIFICADOS</th>
                  <th style={{ textAlign:'right' }}>DESCALIF.</th>
                  <th style={{ textAlign:'right' }}>TASA CAL.</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { canal:'Google (Búsq. Pago)', cal:136, desc:1732, total:3254 },
                  { canal:'Meta (Redes Pago)',   cal:63,  desc:709,  total:1531 },
                  { canal:'Búsqueda Orgánica',   cal:93,  desc:319,  total:577  },
                  { canal:'Tráfico Orgánico',    cal:30,  desc:132,  total:231  },
                ].map((r,i)=>{
                  const tasa = ((r.cal/r.total)*100).toFixed(1);
                  return (
                    <tr key={i}>
                      <td style={{ color:C.text, fontWeight:500 }}>{r.canal}</td>
                      <td style={{ textAlign:'right', color:C.green, fontWeight:700 }}>{r.cal}</td>
                      <td style={{ textAlign:'right', color:C.red }}>{r.desc.toLocaleString()}</td>
                      <td style={{ textAlign:'right' }}>
                        <span style={{ color:parseFloat(tasa)>5?C.green:C.gold, fontWeight:700 }}>{tasa}%</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <div style={{ marginTop:14, padding:'12px 14px', background:'rgba(45,212,160,.07)', border:`1px solid rgba(45,212,160,.2)`, borderRadius:8, fontSize:12, color:C.text2 }}>
              💡 <strong style={{ color:C.green }}>Google califica 3x mejor que Meta</strong> (4.2% vs 4.1%) pero Meta tiene mayor volumen CTWA. Estrategia óptima: Google para calidad, Meta para volumen.
            </div>
          </Card>
        </div>

        {/* UTM breakdown */}
        <Card>
          <CardHead label="UTM Source / Medium · Leads totales" sub="1,132 con UTM registrado"/>
          <table className="table">
            <thead>
              <tr>
                <th style={{ textAlign:'left' }}>UTM SOURCE</th>
                <th style={{ textAlign:'left' }}>UTM MEDIUM</th>
                <th style={{ textAlign:'right' }}>CONTACTOS</th>
                <th style={{ textAlign:'right' }}>% DEL TOTAL</th>
              </tr>
            </thead>
            <tbody>
              {[
                { src:'facebook',      med:'ctwa', n:952,  pct:84.1 },
                { src:'meta',          med:'ctwa', n:40,   pct:3.5  },
                { src:'instagram',     med:'ctwa', n:34,   pct:3.0  },
                { src:'teads',         med:'ctwp', n:1,    pct:0.1  },
                { src:'(Sin valor)',   med:'—',    n:105,  pct:9.3  },
              ].map((r,i)=>(
                <tr key={i}>
                  <td style={{ color:C.text, fontWeight:500 }}>{r.src}</td>
                  <td style={{ color:C.text3 }}>{r.med}</td>
                  <td style={{ textAlign:'right', fontFamily:'var(--mono)' }}>{r.n.toLocaleString()}</td>
                  <td style={{ textAlign:'right' }}>
                    <span style={{ color:r.pct>50?C.gold:r.pct>5?C.text2:C.text3, fontWeight:r.pct>50?700:400 }}>{r.pct}%</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ marginTop:12, fontSize:11.5, color:C.text3, padding:'10px 14px', background:'rgba(255,255,255,.03)', borderRadius:6 }}>
            ⚠️ <strong style={{ color:C.gold }}>105 leads sin UTM (9.3%)</strong> — pérdida de atribución. Revisar píxeles y parámetros UTM en campañas activas.
          </div>
        </Card>
      </>)}

    </div>
  );
}
