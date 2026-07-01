import React, { useState, useMemo } from 'react';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, RadarChart, Radar,
  PolarGrid, PolarAngleAxis, Cell, PieChart, Pie, Legend
} from 'recharts';

/* ══════════════════════════════════════════════
   AMIK MediaAgent — Redes Sociales Orgánicas
   Plataformas: Facebook · Instagram · YouTube
   (TikTok y LinkedIn: pendiente aprobación API)
══════════════════════════════════════════════ */

// ── Colores por plataforma ──
const P = {
  facebook:  { color:'#1877F2', bg:'#EFF6FF', label:'Facebook',  icon:'f' },
  instagram: { color:'#E1306C', bg:'#FFF0F5', label:'Instagram', icon:'ig' },
  youtube:   { color:'#FF0000', bg:'#FFF5F5', label:'YouTube',   icon:'yt' },
  tiktok:    { color:'#010101', bg:'#F5F5F5', label:'TikTok',    icon:'tk' },
  linkedin:  { color:'#0A66C2', bg:'#EFF6FF', label:'LinkedIn',  icon:'in' },
};

// ── Datos DEMO hasta conectar APIs ──
const DEMO = {
  facebook: {
    seguidores: 18420, seguidoresDelta: +312,
    alcance: 142000, impresiones: 318000,
    engagement: 4.2, posts: 18,
    audiencia: [
      { pais:'Perú', pct:72 },{ pais:'Chile', pct:9 },
      { pais:'Colombia', pct:8 },{ pais:'Argentina', pct:6 },{ pais:'Otros', pct:5 },
    ],
    tendencia: [
      {s:'3/3',seg:17800,alc:9200,eng:3.8},{s:'10/3',seg:17950,alc:11400,eng:4.1},
      {s:'17/3',seg:18050,alc:10800,eng:3.9},{s:'24/3',seg:18180,alc:13200,eng:4.4},
      {s:'31/3',seg:18240,alc:12100,eng:4.2},{s:'7/4',seg:18310,alc:14500,eng:4.6},
      {s:'14/4',seg:18380,alc:13800,eng:4.3},{s:'21/4',seg:18420,alc:15200,eng:4.2},
    ],
    mejorPost: { tipo:'Video', fecha:'18 Abr', alcance:28400, eng:7.8, texto:'¡Conoce nuestra nueva sede!' },
    peorPost:  { tipo:'Imagen', fecha:'4 Abr', alcance:1820, eng:0.9, texto:'Horario de atención' },
  },
  instagram: {
    seguidores: 24180, seguidoresDelta: +891,
    alcance: 198000, impresiones: 442000,
    engagement: 6.8, posts: 24,
    audiencia: [
      { pais:'Perú', pct:68 },{ pais:'Chile', pct:11 },
      { pais:'Colombia', pct:10 },{ pais:'Argentina', pct:7 },{ pais:'Otros', pct:4 },
    ],
    tendencia: [
      {s:'3/3',seg:23100,alc:14200,eng:6.1},{s:'10/3',seg:23380,alc:16800,eng:6.4},
      {s:'17/3',seg:23650,alc:15400,eng:6.2},{s:'24/3',seg:23820,alc:19200,eng:7.1},
      {s:'31/3',seg:23990,alc:17800,eng:6.8},{s:'7/4',seg:24080,alc:21400,eng:7.4},
      {s:'14/4',seg:24140,alc:20100,eng:7.0},{s:'21/4',seg:24180,alc:22800,eng:6.8},
    ],
    mejorPost: { tipo:'Reel', fecha:'22 Abr', alcance:41200, eng:11.2, texto:'Un día en UPSJB 🎓' },
    peorPost:  { tipo:'Carrusel', fecha:'8 Abr', alcance:2140, eng:1.4, texto:'Cronograma de pagos' },
  },
  youtube: {
    seguidores: 3840, seguidoresDelta: +128,
    alcance: 28400, impresiones: 94000,
    engagement: 3.1, posts: 6,
    audiencia: [
      { pais:'Perú', pct:81 },{ pais:'Chile', pct:6 },
      { pais:'Colombia', pct:5 },{ pais:'Argentina', pct:4 },{ pais:'Otros', pct:4 },
    ],
    tendencia: [
      {s:'3/3',seg:3620,alc:2800,eng:2.8},{s:'10/3',seg:3680,alc:3400,eng:3.0},
      {s:'17/3',seg:3710,alc:3100,eng:2.9},{s:'24/3',seg:3750,alc:3800,eng:3.2},
      {s:'31/3',seg:3790,alc:3600,eng:3.1},{s:'7/4',seg:3810,alc:4200,eng:3.4},
      {s:'14/4',seg:3825,alc:3900,eng:3.2},{s:'21/4',seg:3840,alc:4100,eng:3.1},
    ],
    mejorPost: { tipo:'Video', fecha:'15 Abr', alcance:8400, eng:5.2, texto:'Tour virtual Campus Chorrillos' },
    peorPost:  { tipo:'Video', fecha:'2 Mar', alcance:480, eng:1.1, texto:'Informativo matrículas 2026' },
  },
};

// ── Score framework (0-100) ──
function calcScore(d) {
  const engScore   = Math.min(d.engagement / 10 * 40, 40);   // 40pts — engagement rate
  const growthScore= Math.min((d.seguidoresDelta / d.seguidores * 100) * 10, 25); // 25pts — crecimiento %
  const alcScore   = Math.min(d.alcance / (d.seguidores * 10) * 20, 20); // 20pts — alcance relativo
  const freqScore  = Math.min(d.posts / 20 * 15, 15);         // 15pts — frecuencia
  return Math.round(engScore + growthScore + alcScore + freqScore);
}

const fmt = v => parseInt(v||0).toLocaleString('es-PE');
const fmtK = v => v >= 1000 ? `${(v/1000).toFixed(1)}K` : v;

const Tip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background:'var(--bg2)', border:'1px solid var(--border)', borderRadius:8, padding:'10px 14px', fontSize:12, boxShadow:'var(--shadow-sm)' }}>
      <div style={{ fontWeight:600, color:'var(--text)', marginBottom:6 }}>{label}</div>
      {payload.map((p,i)=>(
        <div key={i} style={{ color:p.color, marginBottom:2 }}>
          {p.name}: <strong>{typeof p.value==='number'?p.value.toLocaleString('es-PE'):p.value}</strong>
        </div>
      ))}
    </div>
  );
};

// ── Score Ring SVG ──
const ScoreRing = ({ score, color }) => {
  const r = 36, circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;
  const grade = score >= 75 ? 'Excelente' : score >= 55 ? 'Bueno' : score >= 35 ? 'Regular' : 'Mejorar';
  const gradeColor = score >= 75 ? '#10B981' : score >= 55 ? '#F59E0B' : score >= 35 ? '#3B82F6' : '#EF4444';
  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:4 }}>
      <svg width={90} height={90} viewBox="0 0 90 90">
        <circle cx={45} cy={45} r={r} fill="none" stroke="var(--border)" strokeWidth={7}/>
        <circle cx={45} cy={45} r={r} fill="none" stroke={color} strokeWidth={7}
          strokeDasharray={`${dash} ${circ}`} strokeDashoffset={circ/4}
          strokeLinecap="round" style={{ transition:'stroke-dasharray .6s ease' }}/>
        <text x={45} y={45} textAnchor="middle" dominantBaseline="middle"
          fontSize={18} fontWeight={800} fill="var(--text)" fontFamily="'Inter Tight', sans-serif">{score}</text>
      </svg>
      <span style={{ fontSize:11, fontWeight:700, color:gradeColor, letterSpacing:.5 }}>{grade.toUpperCase()}</span>
    </div>
  );
};

export default function SocialPage() {
  const [active, setActive] = useState('instagram');
  const [metricTab, setMetricTab] = useState('seguidores');
  const d = DEMO[active];
  const score = calcScore(d);
  const pal = P[active];

  // Ranking de plataformas por score
  const ranking = useMemo(()=>
    Object.entries(DEMO)
      .map(([k,v])=>({ key:k, label:P[k].label, color:P[k].color, score:calcScore(v), eng:v.engagement, seg:v.seguidores, delta:v.seguidoresDelta }))
      .sort((a,b)=>b.score-a.score)
  ,[]);

  // Radar data para el framework
  const radarData = [
    { metric:'Engagement', ...Object.fromEntries(Object.entries(DEMO).map(([k,v])=>[k, Math.round(v.engagement*10)])) },
    { metric:'Crecimiento', ...Object.fromEntries(Object.entries(DEMO).map(([k,v])=>[k, Math.round(v.seguidoresDelta/v.seguidores*1000)])) },
    { metric:'Alcance', ...Object.fromEntries(Object.entries(DEMO).map(([k,v])=>[k, Math.round(v.alcance/v.seguidores*10)])) },
    { metric:'Frecuencia', ...Object.fromEntries(Object.entries(DEMO).map(([k,v])=>[k, Math.round(v.posts/30*100)])) },
    { metric:'Audiencia PE', ...Object.fromEntries(Object.entries(DEMO).map(([k,v])=>[k, v.audiencia[0].pct])) },
  ];

  const metricKey = metricTab === 'seguidores' ? 'seg' : metricTab === 'alcance' ? 'alc' : 'eng';
  const metricLabel = metricTab === 'seguidores' ? 'Seguidores' : metricTab === 'alcance' ? 'Alcance' : 'Engagement %';

  const PIE_COLORS = ['#1877F2','#E1306C','#FF0000','#F59E0B','#9CA3AF'];

  return (
    <div className="page-wrap scroll-y">

      {/* ── Header ── */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:24 }}>
        <div>
          <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:4 }}>
            <h1 className="page-h1">Redes Sociales</h1>
            <span style={{ fontSize:11, fontWeight:700, background:'var(--gold-dim)', color:'var(--gold)', border:'1px solid var(--gold-border)', borderRadius:20, padding:'2px 10px', letterSpacing:.5 }}>ORGÁNICO</span>
          </div>
          <p className="page-sub">Métricas orgánicas · Facebook · Instagram · YouTube</p>
        </div>
        <div style={{ display:'flex', gap:8, alignItems:'center' }}>
          <span style={{ fontSize:11, color:'var(--text4)', background:'var(--bg3)', border:'1px solid var(--border)', borderRadius:6, padding:'4px 10px' }}>
            ⚡ Demo — conectar API
          </span>
          <button className="btn btn-ghost btn-sm">↗ Metricool</button>
        </div>
      </div>

      {/* ── Framework: Ranking de plataformas ── */}
      <div className="card" style={{ marginBottom:20, borderTop:'3px solid var(--gold)' }}>
        <div className="card-head">
          <div>
            <div className="card-title">🏆 Performance Score · Framework AMIK</div>
            <div style={{ fontSize:11, color:'var(--text3)', marginTop:2 }}>Score 0–100 basado en engagement (40%) · crecimiento (25%) · alcance relativo (20%) · frecuencia (15%)</div>
          </div>
        </div>
        <div className="card-body">
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:16 }}>
            {ranking.map((r,i)=>(
              <div key={r.key} onClick={()=>setActive(r.key)}
                style={{ background: active===r.key ? P[r.key].bg : 'var(--bg3)',
                  border:`2px solid ${active===r.key ? r.color : 'var(--border)'}`,
                  borderRadius:12, padding:'16px 20px', cursor:'pointer', transition:'all .15s',
                  display:'flex', alignItems:'center', gap:16 }}>
                <ScoreRing score={r.score} color={r.color}/>
                <div style={{ flex:1 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:6 }}>
                    {i===0 && <span style={{ fontSize:14 }}>🥇</span>}
                    {i===1 && <span style={{ fontSize:14 }}>🥈</span>}
                    {i===2 && <span style={{ fontSize:14 }}>🥉</span>}
                    <span style={{ fontWeight:700, fontSize:14, color:r.color }}>{r.label}</span>
                  </div>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:4 }}>
                    <div><div style={{ fontSize:10, color:'var(--text4)' }}>Seguidores</div><div style={{ fontWeight:700, fontSize:13 }}>{fmtK(r.seg)}</div></div>
                    <div><div style={{ fontSize:10, color:'var(--text4)' }}>Crecimiento</div><div style={{ fontWeight:700, fontSize:13, color:'#10B981' }}>+{fmtK(r.delta)}</div></div>
                    <div><div style={{ fontSize:10, color:'var(--text4)' }}>Engagement</div><div style={{ fontWeight:700, fontSize:13 }}>{r.eng}%</div></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Radar comparativo ── */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:20 }}>
        <div className="card">
          <div className="card-head"><div className="card-title">Comparativo de plataformas</div></div>
          <div className="card-body">
            <ResponsiveContainer width="100%" height={240}>
              <RadarChart data={radarData} margin={{ top:10, right:30, bottom:10, left:30 }}>
                <PolarGrid stroke="var(--border)"/>
                <PolarAngleAxis dataKey="metric" tick={{ fontSize:11, fill:'var(--text3)' }}/>
                {Object.entries(P).filter(([k])=>DEMO[k]).map(([k,v])=>(
                  <Radar key={k} name={v.label} dataKey={k} stroke={v.color} fill={v.color} fillOpacity={.08} strokeWidth={2}/>
                ))}
                <Legend iconType="circle" iconSize={7} wrapperStyle={{ fontSize:11 }}/>
                <Tooltip content={<Tip/>}/>
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* ── Mejor / Peor publicación ── */}
        <div className="card">
          <div className="card-head">
            <div className="card-title">Mejor y peor publicación · {pal.label}</div>
          </div>
          <div className="card-body" style={{ display:'flex', flexDirection:'column', gap:12 }}>
            {/* Mejor */}
            <div style={{ background:'#ECFDF5', border:'1px solid #A7F3D0', borderRadius:10, padding:'14px 16px' }}>
              <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:8 }}>
                <span style={{ fontSize:16 }}>🚀</span>
                <span style={{ fontSize:12, fontWeight:700, color:'#059669' }}>MEJOR PUBLICACIÓN</span>
                <span style={{ marginLeft:'auto', fontSize:11, color:'var(--text3)' }}>{d.mejorPost.fecha} · {d.mejorPost.tipo}</span>
              </div>
              <p style={{ fontSize:13, color:'var(--text)', fontStyle:'italic', marginBottom:8 }}>"{d.mejorPost.texto}"</p>
              <div style={{ display:'flex', gap:16 }}>
                <div><span style={{ fontSize:10, color:'var(--text4)' }}>Alcance</span><div style={{ fontWeight:700, color:'#059669' }}>{fmtK(d.mejorPost.alcance)}</div></div>
                <div><span style={{ fontSize:10, color:'var(--text4)' }}>Engagement</span><div style={{ fontWeight:700, color:'#059669' }}>{d.mejorPost.eng}%</div></div>
              </div>
            </div>
            {/* Peor */}
            <div style={{ background:'#FEF2F2', border:'1px solid #FECACA', borderRadius:10, padding:'14px 16px' }}>
              <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:8 }}>
                <span style={{ fontSize:16 }}>📉</span>
                <span style={{ fontSize:12, fontWeight:700, color:'#DC2626' }}>PUBLICACIÓN A MEJORAR</span>
                <span style={{ marginLeft:'auto', fontSize:11, color:'var(--text3)' }}>{d.peorPost.fecha} · {d.peorPost.tipo}</span>
              </div>
              <p style={{ fontSize:13, color:'var(--text)', fontStyle:'italic', marginBottom:8 }}>"{d.peorPost.texto}"</p>
              <div style={{ display:'flex', gap:16 }}>
                <div><span style={{ fontSize:10, color:'var(--text4)' }}>Alcance</span><div style={{ fontWeight:700, color:'#DC2626' }}>{fmtK(d.peorPost.alcance)}</div></div>
                <div><span style={{ fontSize:10, color:'var(--text4)' }}>Engagement</span><div style={{ fontWeight:700, color:'#DC2626' }}>{d.peorPost.eng}%</div></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── KPIs de la plataforma seleccionada ── */}
      <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:14 }}>
        <div style={{ width:8, height:8, borderRadius:'50%', background:pal.color }}/>
        <span style={{ fontWeight:700, fontSize:15, color:pal.color }}>{pal.label}</span>
        <span style={{ fontSize:12, color:'var(--text4)' }}>— métricas del último mes</span>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:12, marginBottom:20 }}>
        {[
          { label:'Seguidores', value:fmt(d.seguidores), sub:`+${fmt(d.seguidoresDelta)} este mes`, color:pal.color },
          { label:'Alcance orgánico', value:fmtK(d.alcance), sub:'Personas únicas', color:'var(--text)' },
          { label:'Impresiones', value:fmtK(d.impresiones), sub:`${(d.impresiones/d.alcance).toFixed(1)}x frecuencia`, color:'var(--text)' },
          { label:'Engagement rate', value:`${d.engagement}%`, sub:d.engagement>5?'🔥 Muy alto':d.engagement>3?'✅ Bueno':'⚠️ Mejorar', color: d.engagement>5?'#10B981':d.engagement>3?'#F59E0B':'#EF4444' },
          { label:'Publicaciones', value:d.posts, sub:'este mes', color:'var(--text)' },
        ].map((k,i)=>(
          <div key={i} className="kpi-card" style={{ borderTop:`3px solid ${k.color}` }}>
            <div className="kpi-label">{k.label}</div>
            <div className="kpi-value" style={{ color:k.color }}>{k.value}</div>
            <div className="kpi-sub">{k.sub}</div>
          </div>
        ))}
      </div>

      {/* ── Tendencia + Audiencia ── */}
      <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr', gap:16, marginBottom:20 }}>
        <div className="card">
          <div className="card-head">
            <div className="card-title">Tendencia semanal · {pal.label}</div>
            <div style={{ display:'flex', gap:4 }}>
              {[['seguidores','Seguidores'],['alcance','Alcance'],['engagement','Engagement']].map(([k,l])=>(
                <button key={k} onClick={()=>setMetricTab(k)}
                  className={`btn btn-ghost btn-xs${metricTab===k?' active':''}`}
                  style={{ borderColor:metricTab===k?pal.color:undefined, color:metricTab===k?pal.color:undefined }}>{l}</button>
              ))}
            </div>
          </div>
          <div className="card-body">
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={d.tendencia}>
                <defs>
                  <linearGradient id="socialGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor={pal.color} stopOpacity={.15}/>
                    <stop offset="95%" stopColor={pal.color} stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="s" tick={{ fontSize:10, fill:'var(--text3)' }} axisLine={false} tickLine={false}/>
                <YAxis tick={{ fontSize:10, fill:'var(--text3)' }} axisLine={false} tickLine={false} tickFormatter={v=>metricTab==='engagement'?`${v}%`:fmtK(v)}/>
                <CartesianGrid stroke="var(--border)" strokeDasharray="4 4"/>
                <Tooltip content={<Tip/>}/>
                <Area type="monotone" dataKey={metricKey} name={metricLabel}
                  stroke={pal.color} fill="url(#socialGrad)" strokeWidth={2.5}/>
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card">
          <div className="card-head"><div className="card-title">Audiencia por país</div></div>
          <div className="card-body">
            <ResponsiveContainer width="100%" height={160}>
              <PieChart>
                <Pie data={d.audiencia} dataKey="pct" nameKey="pais" cx="50%" cy="50%"
                  outerRadius={58} innerRadius={32} paddingAngle={3}>
                  {d.audiencia.map((_, i)=><Cell key={i} fill={PIE_COLORS[i]}/>)}
                </Pie>
                <Tooltip formatter={(v,n)=>[`${v}%`, n]}
                  contentStyle={{ background:'var(--bg2)', border:'1px solid var(--border)', borderRadius:8, fontSize:12 }}/>
                <Legend iconType="circle" iconSize={7} wrapperStyle={{ fontSize:11 }}/>
              </PieChart>
            </ResponsiveContainer>
            <div style={{ marginTop:8 }}>
              {d.audiencia.map((a,i)=>(
                <div key={i} style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4 }}>
                  <div style={{ width:8, height:8, borderRadius:'50%', background:PIE_COLORS[i], flexShrink:0 }}/>
                  <span style={{ fontSize:11, color:'var(--text2)', flex:1 }}>{a.pais}</span>
                  <div style={{ width:80, height:4, background:'var(--bg4)', borderRadius:4, overflow:'hidden' }}>
                    <div style={{ width:`${a.pct}%`, height:'100%', background:PIE_COLORS[i], borderRadius:4 }}/>
                  </div>
                  <span style={{ fontSize:11, fontWeight:600, color:'var(--text)', width:28, textAlign:'right' }}>{a.pct}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Pendientes TikTok / LinkedIn ── */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
        {[
          { key:'tiktok',   msg:'API orgánica requiere cuenta Business verificada con Meta Business Suite separado.' },
          { key:'linkedin', msg:'API de LinkedIn Pages requiere OAuth con permisos r_organization_social aprobados.' },
        ].map(({key, msg})=>(
          <div key={key} className="card" style={{ borderTop:`3px solid ${P[key].color}`, opacity:.7 }}>
            <div className="card-body" style={{ padding:'16px 20px', display:'flex', alignItems:'center', gap:12 }}>
              <div style={{ width:36, height:36, borderRadius:8, background:P[key].bg, display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, fontWeight:800, color:P[key].color, flexShrink:0 }}>
                {P[key].icon.toUpperCase()}
              </div>
              <div>
                <div style={{ fontWeight:700, color:'var(--text)', fontSize:13, marginBottom:3 }}>{P[key].label} — Pendiente conexión</div>
                <div style={{ fontSize:11, color:'var(--text4)' }}>{msg}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
}
