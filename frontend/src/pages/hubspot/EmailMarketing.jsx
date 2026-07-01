import React, { useState, useEffect } from 'react';
import { hubspotApi } from '../../lib/api.js';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  AreaChart, Area, CartesianGrid, ComposedChart, Line
} from 'recharts';

const C = {
  gold:'#DCA145', green:'#2DD4A0', blue:'#5B8DB8', red:'#E8445A',
  purple:'#9061B0', indigo:'#7B68EE',
  text:'#111827', t2:'#6B7280', t3:'#9CA3AF',
};

/* Benchmarks industria Educación (Mailchimp/HubSpot 2024) */
const BENCH = { open:28.5, click:4.4, bounce:1.0, unsub:0.25, ctor:15.4 };

/* Fallback representativo si la API no trae datos reales */
const DEMO = {
  real: false,
  totals: {
    sent: 48250, delivered: 46980, open: 15420, click: 2890,
    bounce: 1270, unsubscribed: 118, spamreport: 24,
    deliveryRate: 97.4, openRate: 32.8, clickRate: 6.2,
    ctor: 18.7, bounceRate: 2.6, unsubRate: 0.25, emailCount: 12,
  },
  campaigns: [
    { name:'Bienvenida Admisión 2026-II',  sent:9800, delivered:9620, open:4110, click:820, bounce:180, unsub:14, openRate:42.7, clickRate:8.5, ctor:19.9 },
    { name:'Recordatorio examen · Medicina',sent:6400, delivered:6280, open:2350, click:498, bounce:120, unsub:9,  openRate:37.4, clickRate:7.9, ctor:21.2 },
    { name:'Últimas vacantes · Enfermería', sent:5900, delivered:5760, open:1980, click:392, bounce:140, unsub:11, openRate:34.4, clickRate:6.8, ctor:19.8 },
    { name:'Beca 50% · Contabilidad',       sent:5100, delivered:4990, open:1520, click:280, bounce:110, unsub:13, openRate:30.5, clickRate:5.6, ctor:18.4 },
    { name:'Testimonios egresados',         sent:4800, delivered:4680, open:1290, click:210, bounce:120, unsub:18, openRate:27.6, clickRate:4.5, ctor:16.3 },
    { name:'Info sedes · A Distancia',      sent:4200, delivered:4080, open:1140, click:198, bounce:120, unsub:16, openRate:27.9, clickRate:4.9, ctor:17.4 },
    { name:'Newsletter mensual junio',      sent:6250, delivered:6090, open:1560, click:262, bounce:160, unsub:12, openRate:25.6, clickRate:4.3, ctor:16.8 },
    { name:'Reactivación no-abren 90d',     sent:5800, delivered:5480, open:1470, click:230, bounce:320, unsub:15, openRate:26.8, clickRate:4.2, ctor:15.6 },
  ],
};

const TREND = [
  { m:'Feb', enviados:6800, aperturas:2050, clics:390 },
  { m:'Mar', enviados:8200, aperturas:2680, clics:520 },
  { m:'Abr', enviados:9400, aperturas:3120, clics:610 },
  { m:'May', enviados:11200,aperturas:3740, clics:695 },
  { m:'Jun', enviados:12650,aperturas:3830, clics:675 },
];

function Card({ children, p=20, style={} }) {
  return <div style={{ background:'#fff', border:'1px solid #E5E7EB', borderRadius:10, padding:p, boxShadow:'0 1px 3px rgba(0,0,0,.06)', ...style }}>{children}</div>;
}
function Sec({ text, action }) {
  return (
    <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:14 }}>
      <div style={{ width:20, height:2, background:C.gold, borderRadius:2, flexShrink:0 }}/>
      <span style={{ fontFamily:'var(--font-semi)', fontSize:10, fontWeight:700, letterSpacing:'3px', textTransform:'uppercase', color:C.gold, flex:1 }}>{text}</span>
      {action}
    </div>
  );
}
const Tip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background:'#fff', border:'1px solid #E5E7EB', borderLeft:`3px solid ${C.gold}`, padding:'10px 16px', borderRadius:8, fontSize:12, boxShadow:'0 4px 16px rgba(0,0,0,.08)' }}>
      <div style={{ color:'#9CA3AF', marginBottom:5, fontSize:10, letterSpacing:1, textTransform:'uppercase', fontWeight:700 }}>{label}</div>
      {payload.map((p,i)=>(
        <div key={i} style={{ color:p.color||C.t2, fontWeight:600, marginBottom:2 }}>
          {p.name}: <span style={{ color:'#111827' }}>{typeof p.value==='number'?p.value.toLocaleString():p.value}</span>
        </div>
      ))}
    </div>
  );
};

/* KPI con comparación a benchmark */
function RateKpi({ label, value, unit='%', bench, higher=true, idx=0, sub }) {
  const [h,setH]=useState(false);
  const diff = bench!=null ? +(value - bench).toFixed(1) : null;
  const good = diff==null ? null : (higher ? diff>=0 : diff<=0);
  const col = good==null ? C.gold : good ? C.green : C.red;
  return (
    <div onMouseEnter={()=>setH(true)} onMouseLeave={()=>setH(false)}
      style={{ background:'#fff', border:`1px solid ${h?col+'55':'#E5E7EB'}`, borderRadius:10,
        padding:'16px 18px', position:'relative', overflow:'hidden',
        boxShadow:h?'0 8px 24px rgba(0,0,0,.08)':'0 1px 3px rgba(0,0,0,.05)',
        transition:'all .18s', transform:h?'translateY(-2px)':'none' }}>
      <div style={{ position:'absolute', left:0, top:0, bottom:0, width:3, background:col, borderRadius:'10px 0 0 10px' }}/>
      <div style={{ fontFamily:'var(--font-semi)', fontSize:9.5, fontWeight:700, letterSpacing:'2px', textTransform:'uppercase', color:C.t3, marginBottom:7 }}>{label}</div>
      <div style={{ display:'flex', alignItems:'baseline', gap:4 }}>
        <span style={{ fontFamily:'var(--font-cond)', fontWeight:800, fontSize:30, lineHeight:1, color:C.text }}>{value}</span>
        <span style={{ fontSize:14, color:C.t3, fontWeight:600 }}>{unit}</span>
      </div>
      {bench!=null && (
        <div style={{ display:'flex', alignItems:'center', gap:6, marginTop:7 }}>
          <span style={{ fontSize:10.5, fontWeight:700, color:col }}>
            {diff>0?'▲':diff<0?'▼':'='} {Math.abs(diff)}{unit}
          </span>
          <span style={{ fontSize:10, color:C.t3 }}>vs bench. {bench}{unit}</span>
        </div>
      )}
      {sub && <div style={{ fontSize:10.5, color:C.t3, marginTop:6 }}>{sub}</div>}
    </div>
  );
}

/* KPI de volumen simple */
function VolKpi({ label, value, color=C.blue, icon, sub }) {
  return (
    <div style={{ background:'#fff', border:'1px solid #E5E7EB', borderRadius:10, padding:'14px 16px', position:'relative', overflow:'hidden' }}>
      <div style={{ position:'absolute', left:0, top:0, bottom:0, width:3, background:color }}/>
      {icon && <div style={{ fontSize:16, marginBottom:5, opacity:.8 }}>{icon}</div>}
      <div style={{ fontFamily:'var(--font-semi)', fontSize:9, fontWeight:700, letterSpacing:'1.5px', textTransform:'uppercase', color:C.t3, marginBottom:5 }}>{label}</div>
      <div style={{ fontFamily:'var(--font-cond)', fontWeight:800, fontSize:24, lineHeight:1, color:C.text }}>{typeof value==='number'?value.toLocaleString():value}</div>
      {sub && <div style={{ fontSize:10, color:C.t3, marginTop:4 }}>{sub}</div>}
    </div>
  );
}

export default function EmailMarketing() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [note, setNote] = useState('');

  useEffect(() => {
    let alive = true;
    hubspotApi.getEmailStats(90)
      .then(r => {
        if (!alive) return;
        const d = r.data;
        if (d?.real && d.totals?.sent > 0) {
          setData(d); setNote('');
        } else {
          setData(DEMO);
          setNote(d?.error || 'HubSpot no devolvió datos de Marketing Email — mostrando referencia.');
        }
      })
      .catch(err => {
        if (!alive) return;
        setData(DEMO);
        setNote(err.response?.data?.error || 'No se pudo conectar con la API de Marketing Email — mostrando referencia.');
      })
      .finally(() => alive && setLoading(false));
    return () => { alive = false; };
  }, []);

  if (loading) return (
    <div style={{ padding:'60px 0', textAlign:'center', color:C.t3 }}>
      <span className="spinner"/> <span style={{ marginLeft:10 }}>Cargando estadísticas de email…</span>
    </div>
  );

  const t = data.totals;

  return (
    <>
      {note && (
        <div style={{ marginBottom:16, padding:'10px 16px', background:'rgba(220,161,69,.08)', border:'1px solid rgba(220,161,69,.3)', borderRadius:8, fontSize:12, color:C.t2, display:'flex', gap:8, alignItems:'center' }}>
          <span>ℹ️</span><span>{note}</span>
        </div>
      )}
      {data.real && (
        <div style={{ marginBottom:16, padding:'8px 14px', background:'rgba(45,212,160,.08)', border:'1px solid rgba(45,212,160,.3)', borderRadius:8, fontSize:11.5, color:'#0F9D74', fontWeight:600, display:'inline-flex', gap:6, alignItems:'center' }}>
          <span className="live-dot"/> Datos reales de HubSpot · {t.emailCount} campañas
        </div>
      )}

      {/* Tasas clave con benchmark */}
      <Sec text="Tasas clave · vs benchmark industria educación"/>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(6,1fr)', gap:10, marginBottom:24 }}>
        <RateKpi idx={0} label="Entrega"    value={t.deliveryRate} bench={99.0} higher sub="Delivery rate"/>
        <RateKpi idx={1} label="Apertura"   value={t.openRate}     bench={BENCH.open}   higher sub="Open rate"/>
        <RateKpi idx={2} label="Clic (CTR)" value={t.clickRate}    bench={BENCH.click}  higher sub="Sobre entregados"/>
        <RateKpi idx={3} label="CTOR"       value={t.ctor}         bench={BENCH.ctor}   higher sub="Clic/apertura"/>
        <RateKpi idx={4} label="Rebote"     value={t.bounceRate}   bench={BENCH.bounce} higher={false} sub="Bounce rate"/>
        <RateKpi idx={5} label="Bajas"      value={t.unsubRate}    unit="%" bench={BENCH.unsub} higher={false} sub="Unsubscribe"/>
      </div>

      {/* Volumen */}
      <Sec text="Volumen del período"/>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(6,1fr)', gap:10, marginBottom:28 }}>
        <VolKpi icon="📤" label="Enviados"     value={t.sent}         color={C.blue}/>
        <VolKpi icon="📬" label="Entregados"   value={t.delivered}    color={C.green}/>
        <VolKpi icon="👁️" label="Aperturas"    value={t.open}         color={C.gold}/>
        <VolKpi icon="🖱️" label="Clics"        value={t.click}        color={C.indigo}/>
        <VolKpi icon="↩️" label="Rebotes"      value={t.bounce}       color={C.red}/>
        <VolKpi icon="🚫" label="Bajas"        value={t.unsubscribed} color={C.purple}/>
      </div>

      {/* Embudo de email + tendencia */}
      <div style={{ display:'grid', gridTemplateColumns:'2fr 3fr', gap:14, marginBottom:28 }}>
        <Card>
          <Sec text="Embudo de email"/>
          {(() => {
            const stages = [
              { l:'Enviados',   v:t.sent,      c:C.blue },
              { l:'Entregados', v:t.delivered, c:C.green },
              { l:'Aperturas',  v:t.open,      c:C.gold },
              { l:'Clics',      v:t.click,     c:C.indigo },
            ];
            const max = stages[0].v || 1;
            return stages.map((s,i) => {
              const pct = Math.max((s.v/max)*100, 6);
              const prev = i>0 ? stages[i-1].v : null;
              const conv = prev ? ((s.v/prev)*100).toFixed(1) : null;
              return (
                <div key={s.l} style={{ marginBottom:i<3?10:0 }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:5 }}>
                    <span style={{ fontFamily:'var(--font-semi)', fontWeight:700, fontSize:13, color:C.t2 }}>{s.l}</span>
                    <div style={{ display:'flex', gap:10, alignItems:'center' }}>
                      {conv && <span style={{ fontSize:10.5, fontWeight:700, color:parseFloat(conv)>40?C.green:parseFloat(conv)>10?C.gold:C.red, background:'#F3F4F6', padding:'2px 8px', borderRadius:20 }}>{conv}%</span>}
                      <span style={{ fontFamily:'var(--font-cond)', fontWeight:800, fontSize:22, color:C.text, minWidth:60, textAlign:'right' }}>{s.v.toLocaleString()}</span>
                    </div>
                  </div>
                  <div style={{ background:'#F3F4F6', borderRadius:6, height:34, overflow:'hidden' }}>
                    <div style={{ width:`${pct}%`, height:'100%', borderRadius:6, background:`linear-gradient(90deg,${s.c}77,${s.c})`, transition:'width .8s cubic-bezier(.16,1,.3,1)' }}/>
                  </div>
                </div>
              );
            });
          })()}
        </Card>

        <Card>
          <Sec text="Tendencia mensual · envíos vs engagement"/>
          <ResponsiveContainer width="100%" height={240}>
            <ComposedChart data={TREND}>
              <defs>
                <linearGradient id="ge" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={C.blue} stopOpacity={.25}/>
                  <stop offset="95%" stopColor={C.blue} stopOpacity={0}/>
                </linearGradient>
              </defs>
              <XAxis dataKey="m" tick={{ fontSize:10, fill:C.t3 }} axisLine={false} tickLine={false}/>
              <YAxis tick={{ fontSize:9, fill:C.t3 }} axisLine={false} tickLine={false}/>
              <CartesianGrid stroke="#F3F4F6" strokeDasharray="4 4"/>
              <Tooltip content={<Tip/>}/>
              <Area type="monotone" dataKey="enviados" name="Enviados" stroke={C.blue} fill="url(#ge)" strokeWidth={2}/>
              <Line type="monotone" dataKey="aperturas" name="Aperturas" stroke={C.gold} strokeWidth={2.5} dot={false}/>
              <Line type="monotone" dataKey="clics" name="Clics" stroke={C.indigo} strokeWidth={2.5} dot={false}/>
            </ComposedChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Tabla por campaña */}
      <Card p={0}>
        <div style={{ padding:'12px 20px', borderBottom:'1px solid #E5E7EB', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <span style={{ fontFamily:'var(--font-semi)', fontSize:10, fontWeight:700, letterSpacing:2, textTransform:'uppercase', color:C.t2 }}>
            Rendimiento por campaña · {data.campaigns.length} correos
          </span>
        </div>
        <div style={{ overflowX:'auto' }}>
          <table className="table" style={{ minWidth:760 }}>
            <thead>
              <tr>
                <th style={{ textAlign:'left' }}>CAMPAÑA</th>
                <th style={{ textAlign:'right' }}>ENVIADOS</th>
                <th style={{ textAlign:'right' }}>ENTREG.</th>
                <th style={{ textAlign:'right' }}>APERT.</th>
                <th style={{ textAlign:'right' }}>% APERT.</th>
                <th style={{ textAlign:'right' }}>CLICS</th>
                <th style={{ textAlign:'right' }}>% CLIC</th>
                <th style={{ textAlign:'right' }}>CTOR</th>
                <th style={{ textAlign:'center' }}>SALUD</th>
              </tr>
            </thead>
            <tbody>
              {data.campaigns.map((c,i) => {
                const health = c.openRate>35 ? '🏆' : c.openRate>25 ? '✅' : c.openRate>15 ? '⚠️' : '🚨';
                const orCol = c.openRate>BENCH.open ? C.green : c.openRate>20 ? C.gold : C.red;
                const crCol = c.clickRate>BENCH.click ? C.green : C.gold;
                return (
                  <tr key={i}>
                    <td style={{ fontWeight:600, color:C.text, maxWidth:220, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{c.name}</td>
                    <td style={{ textAlign:'right', fontFamily:'var(--mono)' }}>{c.sent?.toLocaleString()}</td>
                    <td style={{ textAlign:'right', fontFamily:'var(--mono)', color:C.t2 }}>{c.delivered?.toLocaleString()}</td>
                    <td style={{ textAlign:'right', fontFamily:'var(--mono)' }}>{c.open?.toLocaleString()}</td>
                    <td style={{ textAlign:'right', fontWeight:700, color:orCol }}>{c.openRate}%</td>
                    <td style={{ textAlign:'right', fontFamily:'var(--mono)' }}>{c.click?.toLocaleString()}</td>
                    <td style={{ textAlign:'right', fontWeight:700, color:crCol }}>{c.clickRate}%</td>
                    <td style={{ textAlign:'right', color:C.t2 }}>{c.ctor}%</td>
                    <td style={{ textAlign:'center', fontSize:14 }}>{health}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Leyenda framework */}
      <div style={{ marginTop:20, display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12 }}>
        <Card style={{ fontSize:11.5, color:C.t2, lineHeight:1.6 }}>
          <div style={{ fontWeight:700, color:C.text, marginBottom:6, fontSize:12 }}>📖 Glosario de tasas</div>
          <div><b>Open rate</b>: aperturas ÷ entregados</div>
          <div><b>CTR</b>: clics ÷ entregados</div>
          <div><b>CTOR</b>: clics ÷ aperturas (calidad del contenido)</div>
          <div><b>Bounce</b>: rebotes ÷ enviados</div>
        </Card>
        <Card style={{ fontSize:11.5, color:C.t2, lineHeight:1.6 }}>
          <div style={{ fontWeight:700, color:C.text, marginBottom:6, fontSize:12 }}>🎯 Benchmark educación</div>
          <div>Apertura: <b>{BENCH.open}%</b> · Clic: <b>{BENCH.click}%</b></div>
          <div>CTOR: <b>{BENCH.ctor}%</b> · Rebote: <b>&lt;{BENCH.bounce}%</b></div>
          <div>Bajas: <b>&lt;{BENCH.unsub}%</b></div>
        </Card>
        <Card style={{ fontSize:11.5, color:C.t2, lineHeight:1.6 }}>
          <div style={{ fontWeight:700, color:C.text, marginBottom:6, fontSize:12 }}>💡 Salud de campaña</div>
          <div>🏆 Apertura &gt;35% · excelente</div>
          <div>✅ 25–35% · buena</div>
          <div>⚠️ 15–25% · mejorable</div>
          <div>🚨 &lt;15% · revisar asunto/lista</div>
        </Card>
      </div>
    </>
  );
}
