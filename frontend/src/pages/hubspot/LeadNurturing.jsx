import React, { useState, useEffect } from 'react';
import { hubspotApi } from '../../lib/api.js';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell
} from 'recharts';

const C = {
  gold:'#DCA145', green:'#2DD4A0', blue:'#5B8DB8', red:'#E8445A',
  purple:'#9061B0', indigo:'#7B68EE',
  text:'#111827', t2:'#6B7280', t3:'#9CA3AF',
};

/* Fallback representativo de workflows de admisión */
const DEMO = {
  real: false,
  count: 6, active: 5,
  workflows: [
    { name:'Bienvenida nuevo lead admisión', enabled:true,  type:'DRIP',    enrolled:1240, completed:890 },
    { name:'Nurturing Medicina · alto interés', enabled:true, type:'DRIP',   enrolled:620,  completed:410 },
    { name:'Reactivación no-contactados 7d',  enabled:true,  type:'TRIGGER', enrolled:480,  completed:210 },
    { name:'Recordatorio examen admisión',    enabled:true,  type:'DATE',    enrolled:395,  completed:388 },
    { name:'Beca / descuento por sede',       enabled:true,  type:'DRIP',    enrolled:210,  completed:96  },
    { name:'Win-back descalificados',         enabled:false, type:'TRIGGER', enrolled:0,    completed:0   },
  ],
};

/* Etapas del flujo de nurturing (embudo de nutrición) */
const STAGES = [
  { l:'Inscritos en flujos', v:2945, c:C.blue,   d:'Total en automatizaciones activas' },
  { l:'Email abierto',       v:1680, c:C.gold,   d:'Interactuaron con al menos 1 correo' },
  { l:'Clic en CTA',         v:512,  c:C.indigo, d:'Avanzaron a la landing/formulario' },
  { l:'Reengaged → ventas',  v:184,  c:C.green,  d:'Devueltos a asesor comercial' },
];

/* Secuencia tipo de emails del nurturing */
const SEQUENCE = [
  { step:1, day:'Día 0',  name:'Bienvenida + video campus',     open:44, click:12 },
  { step:2, day:'Día 2',  name:'Conoce tu carrera + testimonio', open:38, click:9  },
  { step:3, day:'Día 5',  name:'Beneficios y becas disponibles', open:33, click:8  },
  { step:4, day:'Día 8',  name:'Fechas de examen + inscripción', open:31, click:11 },
  { step:5, day:'Día 12', name:'Última llamada · vacantes',      open:28, click:7  },
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

export default function LeadNurturing() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [note, setNote] = useState('');

  useEffect(() => {
    let alive = true;
    hubspotApi.getNurturing()
      .then(r => {
        if (!alive) return;
        const d = r.data;
        if (d?.real && (d.workflows?.length > 0)) { setData(d); setNote(''); }
        else { setData(DEMO); setNote(d?.error || 'HubSpot no devolvió workflows — mostrando referencia.'); }
      })
      .catch(err => {
        if (!alive) return;
        setData(DEMO);
        setNote(err.response?.data?.error || 'No se pudo conectar con la API de Automation — mostrando referencia.');
      })
      .finally(() => alive && setLoading(false));
    return () => { alive = false; };
  }, []);

  if (loading) return (
    <div style={{ padding:'60px 0', textAlign:'center', color:C.t3 }}>
      <span className="spinner"/> <span style={{ marginLeft:10 }}>Cargando workflows de nurturing…</span>
    </div>
  );

  const totalEnrolled = data.workflows.reduce((s,w)=>s+(w.enrolled||0),0);
  const totalCompleted = data.workflows.reduce((s,w)=>s+(w.completed||0),0);
  const complRate = totalEnrolled ? +(totalCompleted/totalEnrolled*100).toFixed(1) : 0;

  return (
    <>
      {note && (
        <div style={{ marginBottom:16, padding:'10px 16px', background:'rgba(220,161,69,.08)', border:'1px solid rgba(220,161,69,.3)', borderRadius:8, fontSize:12, color:C.t2, display:'flex', gap:8, alignItems:'center' }}>
          <span>ℹ️</span><span>{note}</span>
        </div>
      )}
      {data.real && (
        <div style={{ marginBottom:16, padding:'8px 14px', background:'rgba(45,212,160,.08)', border:'1px solid rgba(45,212,160,.3)', borderRadius:8, fontSize:11.5, color:'#0F9D74', fontWeight:600, display:'inline-flex', gap:6, alignItems:'center' }}>
          <span className="live-dot"/> Datos reales de HubSpot Automation
        </div>
      )}

      {/* KPIs */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, marginBottom:24 }}>
        {[
          { l:'Workflows activos', v:`${data.active}/${data.count}`, c:C.green, icon:'🔄' },
          { l:'Contactos en flujo', v:totalEnrolled.toLocaleString(), c:C.blue, icon:'👥' },
          { l:'Completaron flujo',  v:totalCompleted.toLocaleString(), c:C.gold, icon:'🏁' },
          { l:'Tasa de progresión', v:`${complRate}%`, c:C.indigo, icon:'📈' },
        ].map((k,i) => (
          <div key={i} style={{ background:'#fff', border:'1px solid #E5E7EB', borderRadius:10, padding:'16px 18px', position:'relative', overflow:'hidden' }}>
            <div style={{ position:'absolute', left:0, top:0, bottom:0, width:3, background:k.c }}/>
            <div style={{ fontSize:18, marginBottom:6, opacity:.8 }}>{k.icon}</div>
            <div style={{ fontFamily:'var(--font-semi)', fontSize:9.5, fontWeight:700, letterSpacing:'2px', textTransform:'uppercase', color:C.t3, marginBottom:6 }}>{k.l}</div>
            <div style={{ fontFamily:'var(--font-cond)', fontWeight:800, fontSize:30, lineHeight:1, color:C.text }}>{k.v}</div>
          </div>
        ))}
      </div>

      {/* Embudo de nutrición + secuencia */}
      <div style={{ display:'grid', gridTemplateColumns:'2fr 3fr', gap:14, marginBottom:28 }}>
        <Card>
          <Sec text="Embudo de nutrición"/>
          {STAGES.map((s,i) => {
            const max = STAGES[0].v;
            const pct = Math.max((s.v/max)*100, 6);
            const prev = i>0 ? STAGES[i-1].v : null;
            const conv = prev ? ((s.v/prev)*100).toFixed(1) : null;
            return (
              <div key={s.l} style={{ marginBottom:i<STAGES.length-1?12:0 }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:5 }}>
                  <span style={{ fontFamily:'var(--font-semi)', fontWeight:700, fontSize:12.5, color:C.t2 }}>{s.l}</span>
                  <div style={{ display:'flex', gap:10, alignItems:'center' }}>
                    {conv && <span style={{ fontSize:10, fontWeight:700, color:parseFloat(conv)>50?C.green:parseFloat(conv)>25?C.gold:C.red, background:'#F3F4F6', padding:'2px 8px', borderRadius:20 }}>{conv}%</span>}
                    <span style={{ fontFamily:'var(--font-cond)', fontWeight:800, fontSize:20, color:C.text, minWidth:52, textAlign:'right' }}>{s.v.toLocaleString()}</span>
                  </div>
                </div>
                <div style={{ background:'#F3F4F6', borderRadius:6, height:30, overflow:'hidden' }}>
                  <div style={{ width:`${pct}%`, height:'100%', borderRadius:6, background:`linear-gradient(90deg,${s.c}77,${s.c})`, transition:'width .8s cubic-bezier(.16,1,.3,1)' }}/>
                </div>
                <div style={{ fontSize:10, color:C.t3, marginTop:3 }}>{s.d}</div>
              </div>
            );
          })}
        </Card>

        <Card>
          <Sec text="Secuencia tipo · engagement por paso"/>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={SEQUENCE} barSize={22}>
              <XAxis dataKey="day" tick={{ fontSize:10, fill:C.t2 }} axisLine={false} tickLine={false}/>
              <YAxis tick={{ fontSize:9, fill:C.t3 }} axisLine={false} tickLine={false} unit="%"/>
              <Tooltip contentStyle={{ background:'#fff', border:'1px solid #E5E7EB', borderRadius:8, fontSize:12 }} formatter={(v,n)=>[`${v}%`, n==='open'?'Apertura':'Clic']}/>
              <Bar dataKey="open" name="open" fill={C.gold} radius={[4,4,0,0]} opacity={.85}/>
              <Bar dataKey="click" name="click" fill={C.indigo} radius={[4,4,0,0]}/>
            </BarChart>
          </ResponsiveContainer>
          <div style={{ marginTop:6 }}>
            {SEQUENCE.map(s => (
              <div key={s.step} style={{ display:'flex', alignItems:'center', gap:10, padding:'6px 0', borderBottom:'1px solid #F3F4F6', fontSize:11.5 }}>
                <span style={{ width:22, height:22, borderRadius:'50%', background:'rgba(220,161,69,.15)', color:C.gold, display:'flex', alignItems:'center', justifyContent:'center', fontWeight:800, fontSize:11, flexShrink:0 }}>{s.step}</span>
                <span style={{ color:C.t3, fontFamily:'var(--font-semi)', fontWeight:600, minWidth:44 }}>{s.day}</span>
                <span style={{ color:C.text, flex:1 }}>{s.name}</span>
                <span style={{ color:C.gold, fontWeight:700 }}>{s.open}%</span>
                <span style={{ color:C.indigo, fontWeight:700 }}>{s.click}%</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Tabla de workflows */}
      <Card p={0}>
        <div style={{ padding:'12px 20px', borderBottom:'1px solid #E5E7EB' }}>
          <span style={{ fontFamily:'var(--font-semi)', fontSize:10, fontWeight:700, letterSpacing:2, textTransform:'uppercase', color:C.t2 }}>
            Workflows de automatización · {data.count} totales · {data.active} activos
          </span>
        </div>
        <table className="table">
          <thead>
            <tr>
              <th style={{ textAlign:'left' }}>WORKFLOW</th>
              <th style={{ textAlign:'center' }}>TIPO</th>
              <th style={{ textAlign:'right' }}>INSCRITOS</th>
              <th style={{ textAlign:'right' }}>COMPLETARON</th>
              <th style={{ textAlign:'right' }}>PROGRESIÓN</th>
              <th style={{ textAlign:'center' }}>ESTADO</th>
            </tr>
          </thead>
          <tbody>
            {data.workflows.map((w,i) => {
              const rate = w.enrolled ? ((w.completed/w.enrolled)*100).toFixed(0) : '—';
              const rN = parseInt(rate)||0;
              return (
                <tr key={i}>
                  <td style={{ fontWeight:600, color:C.text, maxWidth:260, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{w.name}</td>
                  <td style={{ textAlign:'center' }}>
                    <span style={{ fontSize:9.5, fontWeight:700, letterSpacing:1, color:C.t2, background:'#F3F4F6', padding:'2px 8px', borderRadius:20 }}>{w.type}</span>
                  </td>
                  <td style={{ textAlign:'right', fontFamily:'var(--mono)' }}>{w.enrolled?.toLocaleString() || '—'}</td>
                  <td style={{ textAlign:'right', fontFamily:'var(--mono)', color:C.t2 }}>{w.completed?.toLocaleString() || '—'}</td>
                  <td style={{ textAlign:'right' }}>
                    {rate!=='—' ? <span style={{ fontWeight:700, color:rN>60?C.green:rN>30?C.gold:C.red }}>{rate}%</span> : <span style={{ color:C.t3 }}>—</span>}
                  </td>
                  <td style={{ textAlign:'center' }}>
                    <span style={{ fontSize:10, fontWeight:700, color:w.enabled?C.green:C.t3, background:w.enabled?'rgba(45,212,160,.12)':'#F3F4F6', padding:'3px 10px', borderRadius:20 }}>
                      {w.enabled ? '● Activo' : '○ Pausado'}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>
    </>
  );
}
