import React, { useState, useMemo, useEffect } from 'react';
import { socialApi } from './api.js';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, RadarChart, Radar,
  PolarGrid, PolarAngleAxis, Cell, PieChart, Pie, Legend,
  ComposedChart, Line, ReferenceLine
} from 'recharts';

/* ══════════════════════════════════════════════
   AMIK MediaAgent — Redes Sociales Orgánicas
   FB · IG · YT — comparativos temporales
══════════════════════════════════════════════ */

const PLAT = {
  facebook:  { color:'#1877F2', bg:'#EFF6FF', label:'Facebook',  icon:'FB' },
  instagram: { color:'#E1306C', bg:'#FFF0F5', label:'Instagram', icon:'IG' },
  youtube:   { color:'#FF0000', bg:'#FFF5F5', label:'YouTube',   icon:'YT' },
  tiktok:    { color:'#010101', bg:'#F5F5F5', label:'TikTok',    icon:'TK' },
  linkedin:  { color:'#0A66C2', bg:'#EFF6FF', label:'LinkedIn',  icon:'IN' },
};

// ── DEMO data con histórico mensual y semanal ──
const DEMO = {
  facebook: {
    seguidores:18420, seguidoresDelta:+312,
    alcance:142000, impresiones:318000, engagement:4.2, posts:18,
    // Histórico mensual (últimos 13 meses)
    mensual:[
      {mes:'Jun 25',seg:14200,alc:82000,imp:190000,eng:3.4,posts:14,likes:2840,comentarios:312,shares:520},
      {mes:'Jul 25',seg:14800,alc:88000,imp:204000,eng:3.6,posts:15,likes:3100,comentarios:340,shares:580},
      {mes:'Ago 25',seg:15200,alc:91000,imp:212000,eng:3.5,posts:13,likes:3050,comentarios:328,shares:560},
      {mes:'Sep 25',seg:15800,alc:98000,imp:228000,eng:3.7,posts:16,likes:3380,comentarios:362,shares:610},
      {mes:'Oct 25',seg:16200,alc:104000,imp:240000,eng:3.9,posts:17,likes:3580,comentarios:384,shares:650},
      {mes:'Nov 25',seg:16600,alc:110000,imp:256000,eng:4.0,posts:18,likes:3820,comentarios:408,shares:690},
      {mes:'Dic 25',seg:17000,alc:118000,imp:274000,eng:4.1,posts:16,likes:4020,comentarios:430,shares:720},
      {mes:'Ene 26',seg:17200,alc:112000,imp:260000,eng:3.8,posts:14,likes:3720,comentarios:398,shares:670},
      {mes:'Feb 26',seg:17500,alc:122000,imp:284000,eng:4.0,posts:16,likes:4100,comentarios:440,shares:730},
      {mes:'Mar 26',seg:17900,alc:132000,imp:306000,eng:4.1,posts:18,likes:4280,comentarios:458,shares:760},
      {mes:'Abr 26',seg:18110,alc:138000,imp:314000,eng:4.2,posts:17,likes:4420,comentarios:472,shares:780},
      {mes:'May 26',seg:18200,alc:136000,imp:310000,eng:4.1,posts:16,likes:4340,comentarios:464,shares:770},
      {mes:'Jun 26',seg:18420,alc:142000,imp:318000,eng:4.2,posts:18,likes:4520,comentarios:484,shares:800},
    ],
    semanal:[
      {s:'W1 Abr',alc:31000,eng:4.0,posts:4},{s:'W2 Abr',alc:34000,eng:4.3,posts:5},
      {s:'W3 Abr',alc:32000,eng:4.1,posts:4},{s:'W4 Abr',alc:35000,eng:4.5,posts:5},
      {s:'W1 May',alc:33000,eng:4.2,posts:4},{s:'W2 May',alc:36000,eng:4.4,posts:5},
      {s:'W3 May',alc:34000,eng:4.1,posts:4},{s:'W4 May',alc:33000,eng:4.0,posts:3},
      {s:'W1 Jun',alc:35000,eng:4.3,posts:5},{s:'W2 Jun',alc:37000,eng:4.5,posts:5},
      {s:'W3 Jun',alc:36000,eng:4.2,posts:4},{s:'W4 Jun',alc:34000,eng:4.1,posts:4},
    ],
    audiencia:[{pais:'Perú',pct:72},{pais:'Chile',pct:9},{pais:'Colombia',pct:8},{pais:'Argentina',pct:6},{pais:'Otros',pct:5}],
    mejorPost:{tipo:'Video',fecha:'18 Jun',alcance:28400,eng:7.8,texto:'¡Conoce nuestra nueva sede!'},
    peorPost: {tipo:'Imagen',fecha:'4 Jun',alcance:1820,eng:0.9,texto:'Horario de atención'},
  },
  instagram:{
    seguidores:24180, seguidoresDelta:+891,
    alcance:198000, impresiones:442000, engagement:6.8, posts:24,
    mensual:[
      {mes:'Jun 25',seg:18200,alc:110000,imp:248000,eng:5.8,posts:20,likes:6380,comentarios:820,shares:1240},
      {mes:'Jul 25',seg:19100,alc:124000,imp:278000,eng:6.0,posts:22,likes:7020,comentarios:900,shares:1360},
      {mes:'Ago 25',seg:19800,alc:132000,imp:296000,eng:6.1,posts:21,likes:7480,comentarios:960,shares:1450},
      {mes:'Sep 25',seg:20500,alc:142000,imp:318000,eng:6.3,posts:23,likes:8060,comentarios:1035,shares:1560},
      {mes:'Oct 25',seg:21100,alc:152000,imp:340000,eng:6.4,posts:22,likes:8640,comentarios:1110,shares:1670},
      {mes:'Nov 25',seg:21800,alc:162000,imp:362000,eng:6.5,posts:24,likes:9240,comentarios:1188,shares:1790},
      {mes:'Dic 25',seg:22300,alc:168000,imp:376000,eng:6.6,posts:22,likes:9680,comentarios:1244,shares:1870},
      {mes:'Ene 26',seg:22600,alc:158000,imp:354000,eng:6.4,posts:20,likes:9020,comentarios:1160,shares:1740},
      {mes:'Feb 26',seg:23000,alc:172000,imp:385000,eng:6.6,posts:22,likes:9940,comentarios:1278,shares:1920},
      {mes:'Mar 26',seg:23500,alc:184000,imp:412000,eng:6.7,posts:24,likes:10580,comentarios:1360,shares:2040},
      {mes:'Abr 26',seg:23820,alc:192000,imp:430000,eng:6.8,posts:23,likes:11040,comentarios:1420,shares:2130},
      {mes:'May 26',seg:24000,alc:188000,imp:422000,eng:6.7,posts:22,likes:10820,comentarios:1392,shares:2090},
      {mes:'Jun 26',seg:24180,alc:198000,imp:442000,eng:6.8,posts:24,likes:11440,comentarios:1472,shares:2210},
    ],
    semanal:[
      {s:'W1 Abr',alc:44000,eng:6.6,posts:6},{s:'W2 Abr',alc:48000,eng:7.0,posts:6},
      {s:'W3 Abr',alc:46000,eng:6.8,posts:6},{s:'W4 Abr',alc:54000,eng:7.4,posts:6},
      {s:'W1 May',alc:46000,eng:6.7,posts:6},{s:'W2 May',alc:50000,eng:7.0,posts:6},
      {s:'W3 May',alc:47000,eng:6.6,posts:5},{s:'W4 May',alc:45000,eng:6.5,posts:5},
      {s:'W1 Jun',alc:48000,eng:6.8,posts:6},{s:'W2 Jun',alc:52000,eng:7.1,posts:6},
      {s:'W3 Jun',alc:50000,eng:6.9,posts:6},{s:'W4 Jun',alc:48000,eng:6.8,posts:6},
    ],
    audiencia:[{pais:'Perú',pct:68},{pais:'Chile',pct:11},{pais:'Colombia',pct:10},{pais:'Argentina',pct:7},{pais:'Otros',pct:4}],
    mejorPost:{tipo:'Reel',fecha:'22 Jun',alcance:41200,eng:11.2,texto:'Un día en UPSJB 🎓'},
    peorPost: {tipo:'Carrusel',fecha:'8 Jun',alcance:2140,eng:1.4,texto:'Cronograma de pagos'},
  },
  youtube:{
    seguidores:3840, seguidoresDelta:+128,
    alcance:28400, impresiones:94000, engagement:3.1, posts:6,
    mensual:[
      {mes:'Jun 25',seg:2800,alc:14000,imp:46000,eng:2.4,posts:4,likes:840,comentarios:98,shares:210},
      {mes:'Jul 25',seg:2940,alc:16000,imp:53000,eng:2.6,posts:4,likes:960,comentarios:112,shares:240},
      {mes:'Ago 25',seg:3060,alc:17000,imp:56000,eng:2.7,posts:5,likes:1020,comentarios:119,shares:255},
      {mes:'Sep 25',seg:3180,alc:18500,imp:61000,eng:2.8,posts:5,likes:1110,comentarios:129,shares:278},
      {mes:'Oct 25',seg:3290,alc:20000,imp:66000,eng:2.9,posts:5,likes:1200,comentarios:140,shares:300},
      {mes:'Nov 25',seg:3390,alc:21500,imp:71000,eng:3.0,posts:6,likes:1290,comentarios:150,shares:323},
      {mes:'Dic 25',seg:3480,alc:22000,imp:73000,eng:2.9,posts:5,likes:1320,comentarios:154,shares:330},
      {mes:'Ene 26',seg:3540,alc:20000,imp:66000,eng:2.8,posts:4,likes:1200,comentarios:140,shares:300},
      {mes:'Feb 26',seg:3600,alc:23000,imp:76000,eng:3.0,posts:5,likes:1380,comentarios:161,shares:345},
      {mes:'Mar 26',seg:3680,alc:25000,imp:82000,eng:3.1,posts:6,likes:1500,comentarios:175,shares:375},
      {mes:'Abr 26',seg:3740,alc:26800,imp:88000,eng:3.1,posts:6,likes:1608,comentarios:188,shares:402},
      {mes:'May 26',seg:3790,alc:27200,imp:90000,eng:3.0,posts:5,likes:1632,comentarios:190,shares:408},
      {mes:'Jun 26',seg:3840,alc:28400,imp:94000,eng:3.1,posts:6,likes:1704,comentarios:199,shares:426},
    ],
    semanal:[
      {s:'W1 Abr',alc:6200,eng:3.0,posts:1},{s:'W2 Abr',alc:7100,eng:3.2,posts:2},
      {s:'W3 Abr',alc:6800,eng:3.1,posts:1},{s:'W4 Abr',alc:6700,eng:3.0,posts:2},
      {s:'W1 May',alc:6500,eng:2.9,posts:1},{s:'W2 May',alc:7200,eng:3.1,posts:2},
      {s:'W3 May',alc:6900,eng:3.0,posts:1},{s:'W4 May',alc:6600,eng:2.9,posts:1},
      {s:'W1 Jun',alc:6800,eng:3.0,posts:1},{s:'W2 Jun',alc:7400,eng:3.2,posts:2},
      {s:'W3 Jun',alc:7200,eng:3.1,posts:2},{s:'W4 Jun',alc:7000,eng:3.0,posts:1},
    ],
    audiencia:[{pais:'Perú',pct:81},{pais:'Chile',pct:6},{pais:'Colombia',pct:5},{pais:'Argentina',pct:4},{pais:'Otros',pct:4}],
    mejorPost:{tipo:'Video',fecha:'15 Jun',alcance:8400,eng:5.2,texto:'Tour virtual Campus Chorrillos'},
    peorPost: {tipo:'Video',fecha:'2 Jun',alcance:480,eng:1.1,texto:'Informativo matrículas 2026'},
  },
};

function calcScore(d){
  const engScore   =Math.min(d.engagement/10*40,40);
  const growthScore=Math.min((d.seguidoresDelta/d.seguidores*100)*10,25);
  const alcScore   =Math.min(d.alcance/(d.seguidores*10)*20,20);
  const freqScore  =Math.min(d.posts/20*15,15);
  return Math.round(engScore+growthScore+alcScore+freqScore);
}

const fmt  = v=>parseInt(v||0).toLocaleString('es-PE');
const fmtK = v=>v>=1000000?`${(v/1000000).toFixed(1)}M`:v>=1000?`${(v/1000).toFixed(1)}K`:v;
const pct  = (curr,prev)=>prev>0?((curr-prev)/prev*100).toFixed(1):null;
const arrow= v=>parseFloat(v)>=0?'▲':'▼';
const arrowColor=v=>parseFloat(v)>=0?'#10B981':'#EF4444';

const Tip=({active,payload,label})=>{
  if(!active||!payload?.length)return null;
  return(
    <div style={{background:'var(--bg2)',border:'1px solid var(--border)',borderRadius:8,padding:'10px 14px',fontSize:12,boxShadow:'var(--shadow-sm)'}}>
      <div style={{fontWeight:600,color:'var(--text)',marginBottom:6}}>{label}</div>
      {payload.map((p,i)=>(
        <div key={i} style={{color:p.color||'var(--text2)',marginBottom:2}}>
          {p.name}: <strong>{typeof p.value==='number'?p.value.toLocaleString('es-PE'):p.value}</strong>
        </div>
      ))}
    </div>
  );
};

const ScoreRing=({score,color})=>{
  const r=36,circ=2*Math.PI*r,dash=(score/100)*circ;
  const grade=score>=75?'Excelente':score>=55?'Bueno':score>=35?'Regular':'Mejorar';
  const gc=score>=75?'#10B981':score>=55?'#F59E0B':score>=35?'#3B82F6':'#EF4444';
  return(
    <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:4}}>
      <svg width={90} height={90} viewBox="0 0 90 90">
        <circle cx={45} cy={45} r={r} fill="none" stroke="var(--border)" strokeWidth={7}/>
        <circle cx={45} cy={45} r={r} fill="none" stroke={color} strokeWidth={7}
          strokeDasharray={`${dash} ${circ}`} strokeDashoffset={circ/4} strokeLinecap="round"/>
        <text x={45} y={45} textAnchor="middle" dominantBaseline="middle"
          fontSize={18} fontWeight={800} fill="var(--text)" fontFamily="'Inter Tight',sans-serif">{score}</text>
      </svg>
      <span style={{fontSize:11,fontWeight:700,color:gc,letterSpacing:.5}}>{grade.toUpperCase()}</span>
    </div>
  );
};

// Delta badge
const Delta=({curr,prev,unit=''})=>{
  const p=pct(curr,prev);
  if(!p)return null;
  const up=parseFloat(p)>=0;
  return(
    <span style={{fontSize:11,fontWeight:700,color:up?'#10B981':'#EF4444',background:up?'#ECFDF5':'#FEF2F2',
      borderRadius:20,padding:'2px 8px',display:'inline-flex',alignItems:'center',gap:3}}>
      {up?'▲':'▼'} {Math.abs(p)}%{unit}
    </span>
  );
};

const PIE_COLORS=['#1877F2','#E1306C','#FF0000','#F59E0B','#9CA3AF'];

// ── Tabs de período ──
const PERIODOS=[
  {k:'mes',    l:'Mes vs mes anterior'},
  {k:'anio',   l:'Año anterior'},
  {k:'semanas',l:'Últimas 4 semanas'},
  {k:'ytd',    l:'Acumulado YTD'},
];

export default function SocialPage(){
  const[active,  setActive]  =useState('instagram');
  const[metricT, setMetricT] =useState('alc');
  const[periodoT,setPeriodoT]=useState('mes');
  const[compMetric,setCompMetric]=useState('alc');


  const ranking=useMemo(()=>
    Object.entries(DEMO)
      .map(([k,v])=>({key:k,label:PLAT[k].label,color:PLAT[k].color,score:calcScore(v),eng:v.engagement,seg:v.seguidores,delta:v.seguidoresDelta}))
      .sort((a,b)=>b.score-a.score)
  ,[]);

  // mesActual etc. definidos abajo tras d

  // Comparativo mes vs mes anterior — tarjetas
  const METRICAS_COMP=[
    {k:'seg', l:'Seguidores',    icon:'👥', fmt:fmtK},
    {k:'alc', l:'Alcance',       icon:'📡', fmt:fmtK},
    {k:'imp', l:'Impresiones',   icon:'👁️', fmt:fmtK},
    {k:'eng', l:'Engagement %',  icon:'💬', fmt:v=>`${v}%`},
    {k:'posts',l:'Publicaciones',icon:'📝', fmt:v=>v},
    {k:'likes',l:'Likes',        icon:'❤️', fmt:fmtK},
    {k:'comentarios',l:'Comentarios',icon:'💭',fmt:fmtK},
    {k:'shares',l:'Compartidos', icon:'↗️', fmt:fmtK},
  ];

  // anoActual etc. definidos abajo tras d
  const compAnualData=anoActual.map((m,i)=>({
    mes: m.mes,
    actual: m[compMetric]||0,
    anterior: anoAnterior[i]?.[compMetric]||0,
  }));

  // Semanas (últimas 4 + 4 anteriores para comparar)
  const sem4=d.semanal.slice(-4);
  const sem4prev=d.semanal.slice(-8,-4);
  const sem4data=sem4.map((s,i)=>({
    s: s.s,
    actual:   s[metricT]||0,
    anterior: sem4prev[i]?.[metricT]||0,
  }));

  // YTD acumulado
  const ytdData=ytdMeses.map(m=>({
    mes:m.mes,
    alc:m.alc,
    seg:m.seg,
    eng:m.eng,
  }));

  const radarData=[
    {metric:'Engagement',...Object.fromEntries(Object.entries(DEMO).map(([k,v])=>[k,Math.round(v.engagement*10)]))},
    {metric:'Crecimiento',...Object.fromEntries(Object.entries(DEMO).map(([k,v])=>[k,Math.round(v.seguidoresDelta/v.seguidores*1000)]))},
    {metric:'Alcance',...Object.fromEntries(Object.entries(DEMO).map(([k,v])=>[k,Math.round(v.alcance/v.seguidores*10)]))},
    {metric:'Frecuencia',...Object.fromEntries(Object.entries(DEMO).map(([k,v])=>[k,Math.round(v.posts/30*100)]))},
    {metric:'Audiencia PE',...Object.fromEntries(Object.entries(DEMO).map(([k,v])=>[k,v.audiencia[0].pct]))},
  ];

  // ── Datos reales desde API (con fallback a DEMO) ──
  const [apiData,   setApiData]  = useState(null);
  const [apiLoading,setApiLoading]=useState(true);
  const [apiError,  setApiError] = useState(null);

  useEffect(()=>{
    setApiLoading(true);
    socialApi.getAll()
      .then(res=>{
        // Merge: si la plataforma tiene error usa DEMO, sino usa real
        const merged = {};
        for(const k of ['facebook','instagram','youtube']){
          const real = res.data[k];
          if(real && !real.error && real.seguidores){
            // Normalizar campos para que coincidan con la estructura DEMO
            merged[k] = {
              ...DEMO[k],           // mantiene tendencia/audiencia demo
              seguidores:      real.seguidores      ?? DEMO[k].seguidores,
              seguidoresDelta: real.seguidoresDelta ?? DEMO[k].seguidoresDelta,
              alcance:         real.alcance         ?? DEMO[k].alcance,
              impresiones:     real.impresiones     ?? DEMO[k].impresiones,
              engagement:      real.engagement      ?? DEMO[k].engagement,
              posts:           real.posts           ?? DEMO[k].posts,
              mejorPost:       real.mejorPost ? {
                tipo:    real.mejorPost.tipo   || 'Post',
                fecha:   real.mejorPost.fecha  || '',
                alcance: real.mejorPost.alcance|| 0,
                eng:     real.mejorPost.eng    || 0,
                texto:   real.mejorPost.texto  || '',
              } : DEMO[k].mejorPost,
              peorPost: real.peorPost ? {
                tipo:    real.peorPost.tipo   || 'Post',
                fecha:   real.peorPost.fecha  || '',
                alcance: real.peorPost.alcance|| 0,
                eng:     real.peorPost.eng    || 0,
                texto:   real.peorPost.texto  || '',
              } : DEMO[k].peorPost,
              _esReal: true,
            };
          } else {
            merged[k] = { ...DEMO[k], _esReal: false };
          }
        }
        setApiData(merged);
        setApiError(null);
      })
      .catch(err=>{ setApiError(err.message); })
      .finally(()=>setApiLoading(false));
  },[]);

  // Usar datos reales si están disponibles, sino DEMO
  const DATA = apiData || DEMO;
  const d = DATA[active], esReal = d?._esReal;
  const pal = PLAT[active], score = d ? calcScore(d) : 0;

  // ── Datos según período (dependen de d) ──
  const mesActual   = d?.mensual?.[d.mensual.length-1] || {};
  const mesAnterior = d?.mensual?.[d.mensual.length-2] || {};
  const mesAnioAnt  = d?.mensual?.[0] || {};
  const ytdMeses    = d?.mensual?.slice(6) || [];
  const anoActual   = d?.mensual?.slice(6) || [];
  const anoAnterior = d?.mensual?.slice(0,6) || [];

  return(
    <div className="page-wrap scroll-y">

      {/* ── Header ── */}
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:24}}>
        <div>
          <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:4}}>
            <h1 className="page-h1">Redes Sociales</h1>
            <span style={{fontSize:11,fontWeight:700,background:'var(--gold-dim)',color:'var(--gold)',border:'1px solid var(--gold-border)',borderRadius:20,padding:'2px 10px',letterSpacing:.5}}>ORGÁNICO</span>
          </div>
          <p className="page-sub">Facebook · Instagram · YouTube — comparativos temporales</p>
        </div>
        <div style={{display:'flex',gap:8,alignItems:'center'}}>
          {apiLoading && <span style={{fontSize:11,color:'var(--text4)',background:'var(--bg3)',border:'1px solid var(--border)',borderRadius:6,padding:'4px 10px'}}>⟳ Cargando datos...</span>}
          {!apiLoading && esReal  && <span style={{fontSize:11,color:'#059669',background:'#ECFDF5',border:'1px solid #A7F3D0',borderRadius:6,padding:'4px 10px'}}>● Datos en tiempo real</span>}
          {!apiLoading && !esReal && <span style={{fontSize:11,color:'var(--gold)',background:'var(--gold-dim)',border:'1px solid var(--gold-border)',borderRadius:6,padding:'4px 10px'}}>⚡ Demo — API pendiente</span>}
          <button className="btn btn-ghost btn-sm">↗ Metricool</button>
        </div>
      </div>

      {/* ── Framework Score ── */}
      <div className="card" style={{marginBottom:20,borderTop:'3px solid var(--gold)'}}>
        <div className="card-head">
          <div>
            <div className="card-title">🏆 Performance Score · Framework AMIK</div>
            <div style={{fontSize:11,color:'var(--text3)',marginTop:2}}>Engagement 40% · Crecimiento 25% · Alcance relativo 20% · Frecuencia 15%</div>
          </div>
        </div>
        <div className="card-body">
          <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:16}}>
            {ranking.map((r,i)=>(
              <div key={r.key} onClick={()=>setActive(r.key)}
                style={{background:active===r.key?PLAT[r.key].bg:'var(--bg3)',
                  border:`2px solid ${active===r.key?r.color:'var(--border)'}`,
                  borderRadius:12,padding:'16px 20px',cursor:'pointer',transition:'all .15s',
                  display:'flex',alignItems:'center',gap:16}}>
                <ScoreRing score={r.score} color={r.color}/>
                <div style={{flex:1}}>
                  <div style={{display:'flex',alignItems:'center',gap:6,marginBottom:6}}>
                    {i===0&&<span style={{fontSize:14}}>🥇</span>}
                    {i===1&&<span style={{fontSize:14}}>🥈</span>}
                    {i===2&&<span style={{fontSize:14}}>🥉</span>}
                    <span style={{fontWeight:700,fontSize:14,color:r.color}}>{r.label}</span>
                  </div>
                  <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:4}}>
                    <div><div style={{fontSize:10,color:'var(--text4)'}}>Seguidores</div><div style={{fontWeight:700,fontSize:13}}>{fmtK(r.seg)}</div></div>
                    <div><div style={{fontSize:10,color:'var(--text4)'}}>Crecimiento</div><div style={{fontWeight:700,fontSize:13,color:'#10B981'}}>+{fmtK(r.delta)}</div></div>
                    <div><div style={{fontSize:10,color:'var(--text4)'}}>Engagement</div><div style={{fontWeight:700,fontSize:13}}>{r.eng}%</div></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Selector de plataforma activa ── */}
      <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:16}}>
        {Object.entries(PLAT).filter(([k])=>DEMO[k]).map(([k,v])=>(
          <button key={k} onClick={()=>setActive(k)}
            className={`btn btn-ghost btn-sm`}
            style={{borderColor:active===k?v.color:'var(--border)',
              color:active===k?v.color:'var(--text3)',
              background:active===k?v.bg:'transparent',fontWeight:active===k?700:500}}>
            {v.label}
          </button>
        ))}
        <div style={{marginLeft:'auto',width:8,height:8,borderRadius:'50%',background:pal.color}}/>
        <span style={{fontWeight:700,color:pal.color,fontSize:13}}>{pal.label} seleccionado</span>
      </div>

      {/* ── Tabs de período ── */}
      <div style={{display:'flex',gap:2,borderBottom:'1px solid var(--border)',marginBottom:20}}>
        {PERIODOS.map(t=>(
          <button key={t.k} onClick={()=>setPeriodoT(t.k)}
            style={{padding:'8px 18px',fontSize:13,fontWeight:600,cursor:'pointer',border:'none',background:'transparent',
              color:periodoT===t.k?'var(--text)':'var(--text3)',
              borderBottom:periodoT===t.k?`2px solid ${pal.color}`:'2px solid transparent',transition:'all .15s'}}>
            {t.l}
          </button>
        ))}
      </div>

      {/* ══ TAB: MES VS MES ANTERIOR ══ */}
      {periodoT==='mes'&&(<>
        <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:12,marginBottom:20}}>
          {METRICAS_COMP.filter(m=>['seg','alc','eng','posts'].includes(m.k)).map(m=>{
            const curr=mesActual[m.k]||0, prev=mesAnterior[m.k]||0;
            return(
              <div key={m.k} className="kpi-card" style={{borderTop:`3px solid ${pal.color}`}}>
                <div className="kpi-label">{m.icon} {m.l}</div>
                <div className="kpi-value" style={{color:pal.color}}>{m.fmt(curr)}</div>
                <div style={{display:'flex',alignItems:'center',gap:8,marginTop:6}}>
                  <Delta curr={curr} prev={prev}/>
                  <span style={{fontSize:11,color:'var(--text4)'}}>vs {mesAnterior.mes}</span>
                </div>
                <div style={{fontSize:11,color:'var(--text4)',marginTop:2}}>Anterior: <strong>{m.fmt(prev)}</strong></div>
              </div>
            );
          })}
        </div>

        {/* Engagement breakdown */}
        <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:12,marginBottom:20}}>
          {METRICAS_COMP.filter(m=>['imp','likes','comentarios','shares'].includes(m.k)).map(m=>{
            const curr=mesActual[m.k]||0, prev=mesAnterior[m.k]||0;
            return(
              <div key={m.k} className="kpi-card">
                <div className="kpi-label">{m.icon} {m.l}</div>
                <div style={{fontFamily:'var(--font-tight)',fontWeight:700,fontSize:20}}>{m.fmt(curr)}</div>
                <div style={{display:'flex',alignItems:'center',gap:8,marginTop:6}}>
                  <Delta curr={curr} prev={prev}/>
                  <span style={{fontSize:11,color:'var(--text4)'}}>vs {mesAnterior.mes}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Gráfico tendencia 13 meses */}
        <div className="card">
          <div className="card-head">
            <div className="card-title">Evolución mensual · {pal.label}</div>
            <div style={{display:'flex',gap:4}}>
              {[['alc','Alcance'],['seg','Seguidores'],['eng','Engagement'],['posts','Posts']].map(([k,l])=>(
                <button key={k} onClick={()=>setMetricT(k)}
                  className={`btn btn-ghost btn-xs${metricT===k?' active':''}`}
                  style={{borderColor:metricT===k?pal.color:undefined,color:metricT===k?pal.color:undefined}}>{l}</button>
              ))}
            </div>
          </div>
          <div className="card-body">
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={d.mensual}>
                <defs>
                  <linearGradient id="socialG" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor={pal.color} stopOpacity={.15}/>
                    <stop offset="95%" stopColor={pal.color} stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="mes" tick={{fontSize:10,fill:'var(--text3)'}} axisLine={false} tickLine={false}/>
                <YAxis tick={{fontSize:10,fill:'var(--text3)'}} axisLine={false} tickLine={false} tickFormatter={v=>metricT==='eng'?`${v}%`:fmtK(v)}/>
                <CartesianGrid stroke="var(--border)" strokeDasharray="4 4"/>
                <Tooltip content={<Tip/>}/>
                <ReferenceLine x="Ene 26" stroke="var(--gold)" strokeDasharray="4 2" label={{value:'2026',fontSize:10,fill:'var(--gold)'}}/>
                <Area type="monotone" dataKey={metricT} name={metricT==='alc'?'Alcance':metricT==='seg'?'Seguidores':metricT==='eng'?'Engagement %':'Posts'}
                  stroke={pal.color} fill="url(#socialG)" strokeWidth={2.5}/>
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </>)}

      {/* ══ TAB: AÑO ANTERIOR ══ */}
      {periodoT==='anio'&&(<>
        <div style={{background:'var(--blue-bg)',border:'1px solid var(--blue-border)',borderRadius:8,padding:'10px 16px',marginBottom:16,fontSize:12,color:'var(--blue)'}}>
          📅 Comparando <strong>{mesActual.mes}</strong> vs mismo período del año anterior (<strong>{mesAnioAnt.mes}</strong>)
        </div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:12,marginBottom:20}}>
          {METRICAS_COMP.filter(m=>['seg','alc','eng','posts'].includes(m.k)).map(m=>{
            const curr=mesActual[m.k]||0, prev=mesAnioAnt[m.k]||0;
            return(
              <div key={m.k} className="kpi-card" style={{borderTop:`3px solid ${pal.color}`}}>
                <div className="kpi-label">{m.icon} {m.l}</div>
                <div className="kpi-value" style={{color:pal.color}}>{m.fmt(curr)}</div>
                <div style={{display:'flex',alignItems:'center',gap:8,marginTop:6}}>
                  <Delta curr={curr} prev={prev}/>
                  <span style={{fontSize:11,color:'var(--text4)'}}>vs {mesAnioAnt.mes}</span>
                </div>
                <div style={{fontSize:11,color:'var(--text4)',marginTop:2}}>Año ant.: <strong>{m.fmt(prev)}</strong></div>
              </div>
            );
          })}
        </div>

        <div className="card">
          <div className="card-head">
            <div className="card-title">Año actual vs año anterior · {pal.label}</div>
            <div style={{display:'flex',gap:4}}>
              {[['alc','Alcance'],['seg','Seguidores'],['eng','Engagement'],['posts','Posts']].map(([k,l])=>(
                <button key={k} onClick={()=>setCompMetric(k)}
                  className={`btn btn-ghost btn-xs${compMetric===k?' active':''}`}
                  style={{borderColor:compMetric===k?pal.color:undefined,color:compMetric===k?pal.color:undefined}}>{l}</button>
              ))}
            </div>
          </div>
          <div className="card-body">
            <ResponsiveContainer width="100%" height={240}>
              <ComposedChart data={compAnualData}>
                <XAxis dataKey="mes" tick={{fontSize:10,fill:'var(--text3)'}} axisLine={false} tickLine={false}/>
                <YAxis tick={{fontSize:10,fill:'var(--text3)'}} axisLine={false} tickLine={false} tickFormatter={fmtK}/>
                <CartesianGrid stroke="var(--border)" strokeDasharray="4 4"/>
                <Tooltip content={<Tip/>}/>
                <Bar dataKey="anterior" name="Año anterior" fill={pal.color} opacity={.25} radius={[4,4,0,0]}/>
                <Line type="monotone" dataKey="actual" name="Año actual" stroke={pal.color} strokeWidth={2.5} dot={{fill:pal.color,r:4}}/>
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      </>)}

      {/* ══ TAB: ÚLTIMAS 4 SEMANAS ══ */}
      {periodoT==='semanas'&&(<>
        <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:12,marginBottom:20}}>
          {sem4.map((s,i)=>{
            const prev=sem4prev[i];
            const val=s[metricT]||0, prevVal=prev?.[metricT]||0;
            return(
              <div key={i} className="kpi-card" style={{borderTop:`3px solid ${pal.color}`}}>
                <div className="kpi-label">📅 {s.s}</div>
                <div className="kpi-value" style={{color:pal.color,fontSize:20}}>{fmtK(val)}</div>
                <div style={{display:'flex',alignItems:'center',gap:6,marginTop:6}}>
                  <Delta curr={val} prev={prevVal}/>
                  <span style={{fontSize:10,color:'var(--text4)'}}>vs {prev?.s}</span>
                </div>
              </div>
            );
          })}
        </div>

        <div className="card">
          <div className="card-head">
            <div className="card-title">Semana a semana · actual vs 4 semanas anteriores</div>
            <div style={{display:'flex',gap:4}}>
              {[['alc','Alcance'],['eng','Engagement'],['posts','Posts']].map(([k,l])=>(
                <button key={k} onClick={()=>setMetricT(k)}
                  className={`btn btn-ghost btn-xs${metricT===k?' active':''}`}
                  style={{borderColor:metricT===k?pal.color:undefined,color:metricT===k?pal.color:undefined}}>{l}</button>
              ))}
            </div>
          </div>
          <div className="card-body">
            <ResponsiveContainer width="100%" height={240}>
              <ComposedChart data={sem4data}>
                <XAxis dataKey="s" tick={{fontSize:10,fill:'var(--text3)'}} axisLine={false} tickLine={false}/>
                <YAxis tick={{fontSize:10,fill:'var(--text3)'}} axisLine={false} tickLine={false} tickFormatter={fmtK}/>
                <CartesianGrid stroke="var(--border)" strokeDasharray="4 4"/>
                <Tooltip content={<Tip/>}/>
                <Bar dataKey="anterior" name="4 sem. anteriores" fill={pal.color} opacity={.2} radius={[4,4,0,0]}/>
                <Line type="monotone" dataKey="actual" name="Semanas actuales" stroke={pal.color} strokeWidth={2.5} dot={{fill:pal.color,r:5}}/>
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      </>)}

      {/* ══ TAB: YTD ══ */}
      {periodoT==='ytd'&&(<>
        <div style={{background:'var(--gold-dim)',border:'1px solid var(--gold-border)',borderRadius:8,padding:'10px 16px',marginBottom:16,fontSize:12,color:'var(--gold-dark)'}}>
          📊 Acumulado <strong>Enero – Junio 2026</strong> · {pal.label}
        </div>

        {/* Totales YTD */}
        <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:12,marginBottom:20}}>
          {[
            {l:'Alcance total YTD',   v:ytdMeses.reduce((s,m)=>s+m.alc,0),  fmt:fmtK, icon:'📡'},
            {l:'Impresiones YTD',     v:ytdMeses.reduce((s,m)=>s+m.imp,0),  fmt:fmtK, icon:'👁️'},
            {l:'Posts publicados YTD',v:ytdMeses.reduce((s,m)=>s+m.posts,0),fmt:v=>v, icon:'📝'},
            {l:'Eng. promedio YTD',   v:(ytdMeses.reduce((s,m)=>s+m.eng,0)/ytdMeses.length).toFixed(1),fmt:v=>`${v}%`,icon:'💬'},
          ].map((k,i)=>(
            <div key={i} className="kpi-card" style={{borderTop:`3px solid ${pal.color}`}}>
              <div className="kpi-label">{k.icon} {k.l}</div>
              <div className="kpi-value" style={{color:pal.color}}>{k.fmt(k.v)}</div>
            </div>
          ))}
        </div>

        {/* Crecimiento seguidores YTD */}
        <div className="card" style={{marginBottom:16}}>
          <div className="card-head"><div className="card-title">Crecimiento de seguidores 2026 · {pal.label}</div></div>
          <div className="card-body">
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={ytdData}>
                <defs>
                  <linearGradient id="ytdG" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor={pal.color} stopOpacity={.15}/>
                    <stop offset="95%" stopColor={pal.color} stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="mes" tick={{fontSize:10,fill:'var(--text3)'}} axisLine={false} tickLine={false}/>
                <YAxis tick={{fontSize:10,fill:'var(--text3)'}} axisLine={false} tickLine={false} tickFormatter={fmtK}/>
                <CartesianGrid stroke="var(--border)" strokeDasharray="4 4"/>
                <Tooltip content={<Tip/>}/>
                <Area type="monotone" dataKey="seg" name="Seguidores" stroke={pal.color} fill="url(#ytdG)" strokeWidth={2.5}/>
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Alcance vs Engagement YTD */}
        <div className="card">
          <div className="card-head"><div className="card-title">Alcance mensual 2026 · {pal.label}</div></div>
          <div className="card-body">
            <ResponsiveContainer width="100%" height={200}>
              <ComposedChart data={ytdData}>
                <XAxis dataKey="mes" tick={{fontSize:10,fill:'var(--text3)'}} axisLine={false} tickLine={false}/>
                <YAxis yAxisId="l" tick={{fontSize:10,fill:'var(--text3)'}} axisLine={false} tickLine={false} tickFormatter={fmtK}/>
                <YAxis yAxisId="r" orientation="right" tick={{fontSize:10,fill:'var(--text3)'}} axisLine={false} tickLine={false} tickFormatter={v=>`${v}%`}/>
                <CartesianGrid stroke="var(--border)" strokeDasharray="4 4"/>
                <Tooltip content={<Tip/>}/>
                <Bar yAxisId="l" dataKey="alc" name="Alcance" fill={pal.color} opacity={.3} radius={[4,4,0,0]}/>
                <Line yAxisId="r" type="monotone" dataKey="eng" name="Engagement %" stroke={pal.color} strokeWidth={2.5} dot={{fill:pal.color,r:4}}/>
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      </>)}

      {/* ── Mejor/Peor + Audiencia (siempre visible) ── */}
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginTop:20}}>
        <div className="card">
          <div className="card-head"><div className="card-title">Mejor y peor publicación · {pal.label}</div></div>
          <div className="card-body" style={{display:'flex',flexDirection:'column',gap:12}}>
            <div style={{background:'#ECFDF5',border:'1px solid #A7F3D0',borderRadius:10,padding:'14px 16px'}}>
              <div style={{display:'flex',alignItems:'center',gap:6,marginBottom:8}}>
                <span style={{fontSize:16}}>🚀</span>
                <span style={{fontSize:12,fontWeight:700,color:'#059669'}}>MEJOR PUBLICACIÓN</span>
                <span style={{marginLeft:'auto',fontSize:11,color:'var(--text3)'}}>{d.mejorPost.fecha} · {d.mejorPost.tipo}</span>
              </div>
              <p style={{fontSize:13,color:'var(--text)',fontStyle:'italic',marginBottom:8}}>"{d.mejorPost.texto}"</p>
              <div style={{display:'flex',gap:16}}>
                <div><span style={{fontSize:10,color:'var(--text4)'}}>Alcance</span><div style={{fontWeight:700,color:'#059669'}}>{fmtK(d.mejorPost.alcance)}</div></div>
                <div><span style={{fontSize:10,color:'var(--text4)'}}>Engagement</span><div style={{fontWeight:700,color:'#059669'}}>{d.mejorPost.eng}%</div></div>
              </div>
            </div>
            <div style={{background:'#FEF2F2',border:'1px solid #FECACA',borderRadius:10,padding:'14px 16px'}}>
              <div style={{display:'flex',alignItems:'center',gap:6,marginBottom:8}}>
                <span style={{fontSize:16}}>📉</span>
                <span style={{fontSize:12,fontWeight:700,color:'#DC2626'}}>PUBLICACIÓN A MEJORAR</span>
                <span style={{marginLeft:'auto',fontSize:11,color:'var(--text3)'}}>{d.peorPost.fecha} · {d.peorPost.tipo}</span>
              </div>
              <p style={{fontSize:13,color:'var(--text)',fontStyle:'italic',marginBottom:8}}>"{d.peorPost.texto}"</p>
              <div style={{display:'flex',gap:16}}>
                <div><span style={{fontSize:10,color:'var(--text4)'}}>Alcance</span><div style={{fontWeight:700,color:'#DC2626'}}>{fmtK(d.peorPost.alcance)}</div></div>
                <div><span style={{fontSize:10,color:'var(--text4)'}}>Engagement</span><div style={{fontWeight:700,color:'#DC2626'}}>{d.peorPost.eng}%</div></div>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-head"><div className="card-title">Comparativo plataformas · Radar</div></div>
          <div className="card-body">
            <ResponsiveContainer width="100%" height={220}>
              <RadarChart data={radarData} margin={{top:10,right:30,bottom:10,left:30}}>
                <PolarGrid stroke="var(--border)"/>
                <PolarAngleAxis dataKey="metric" tick={{fontSize:11,fill:'var(--text3)'}}/>
                {Object.entries(PLAT).filter(([k])=>DEMO[k]).map(([k,v])=>(
                  <Radar key={k} name={v.label} dataKey={k} stroke={v.color} fill={v.color} fillOpacity={.08} strokeWidth={2}/>
                ))}
                <Legend iconType="circle" iconSize={7} wrapperStyle={{fontSize:11}}/>
                <Tooltip content={<Tip/>}/>
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* ── Pendientes TikTok / LinkedIn ── */}
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginTop:16}}>
        {[
          {key:'tiktok',  msg:'API orgánica requiere cuenta Business verificada.'},
          {key:'linkedin',msg:'API requiere OAuth con permisos r_organization_social.'},
        ].map(({key,msg})=>(
          <div key={key} className="card" style={{borderTop:`3px solid ${PLAT[key].color}`,opacity:.7}}>
            <div className="card-body" style={{padding:'16px 20px',display:'flex',alignItems:'center',gap:12}}>
              <div style={{width:36,height:36,borderRadius:8,background:PLAT[key].bg,display:'flex',alignItems:'center',justifyContent:'center',fontSize:12,fontWeight:800,color:PLAT[key].color,flexShrink:0}}>
                {PLAT[key].icon}
              </div>
              <div>
                <div style={{fontWeight:700,color:'var(--text)',fontSize:13,marginBottom:3}}>{PLAT[key].label} — Pendiente conexión</div>
                <div style={{fontSize:11,color:'var(--text4)'}}>{msg}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
}
