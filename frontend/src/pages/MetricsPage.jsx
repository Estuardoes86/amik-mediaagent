import React, { useMemo, useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, CartesianGrid, PieChart, Pie, Cell, Legend,
  AreaChart, Area
} from 'recharts';
import { useMetaCampaigns, useGoogleCampaigns } from '../hooks/useData.js';
import { useApp } from '../context/AppContext.jsx';

/* ── Tokens ── */
const C = { gold:'#DCA145', goldDim:'rgba(220,161,69,.12)', goldBorder:'rgba(220,161,69,.28)',
  green:'#059669', blue:'#2563EB', red:'#DC2626', purple:'#7C3AED',
  carbon:'#FFFFFF', slate:'#F3F4F6', text:'#111827', text2:'#6B7280', text3:'#9CA3AF',
};

/* ── Tooltip ── */
const Tip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background:'#fff', border:`1px solid ${C.goldBorder}`, borderLeft:`3px solid ${C.gold}`, padding:'10px 16px', borderRadius:8, fontSize:12, boxShadow:'0 4px 16px rgba(0,0,0,.08)' }}>
      <div style={{ color:'#9CA3AF', marginBottom:6, fontSize:10, letterSpacing:1, textTransform:'uppercase', fontFamily:'var(--font-semi)', fontWeight:700 }}>{label}</div>
      {payload.map((p,i) => (
        <div key={i} style={{ color:'#6B7280', fontFamily:'var(--font-semi)', fontWeight:600, marginBottom:2 }}>
          {p.name}: <span style={{ color:'#111827' }}>{typeof p.value==='number' ? p.value.toLocaleString() : p.value}</span>
        </div>
      ))}
    </div>
  );
};

/* ── KPI Card ── */
const accentMap = { accent:C.gold, green:C.green, blue:C.blue, red:C.red, purple:C.purple, meta:C.blue, google:C.gold, slate:C.slate };
const valMap    = { accent:C.gold, green:C.green };

function Kpi({ label, value, sub, delta, deltaDir, accent, idx=0 }) {
  const [hov, setHov] = useState(false);
  return (
    <div
      onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}
      style={{
        background: hov ? '#F3F4F6' : '#FFFFFF',
        border:`1px solid ${hov ? C.goldBorder : 'rgba(255,255,255,.07)'}`,
        borderRadius:8, padding:'18px 20px 16px', position:'relative', overflow:'hidden',
        boxShadow: hov ? `0 8px 32px rgba(0,0,0,.5), 0 0 0 1px ${C.goldDim}` : '0 4px 20px rgba(0,0,0,.4)',
        animation:`kpi-rise .45s ${idx*.05}s both`, transition:'background .15s, border .15s, box-shadow .2s, transform .2s',
        transform: hov ? 'translateY(-3px)' : 'none', cursor:'default',
      }}
    >
      <div style={{ position:'absolute', left:0, top:0, bottom:0, width:3, background:accentMap[accent]||'rgba(255,255,255,.1)', borderRadius:'8px 0 0 8px' }}/>
      <div style={{ fontFamily:'var(--font-semi)', fontSize:9.5, fontWeight:700, letterSpacing:'2.5px', textTransform:'uppercase', color: hov ? C.text2 : C.text3, marginBottom:10, transition:'color .15s' }}>
        {label}
      </div>
      <div style={{ fontFamily:'var(--font-cond)', fontWeight:800, fontSize:36, lineHeight:1, letterSpacing:.5, color: hov ? '#fff' : (valMap[accent]||C.text), transition:'color .15s' }}>
        {value ?? '—'}
      </div>
      {delta && (
        <div style={{ display:'inline-flex', alignItems:'center', gap:4, fontFamily:'var(--font-semi)', fontSize:11, fontWeight:700, marginTop:6, color:deltaDir==='up'?C.green:C.red }}>
          {deltaDir==='up'?'▲':'▼'} {delta}
        </div>
      )}
      {sub && <div style={{ fontSize:11.5, color: hov ? C.text2 : C.text3, marginTop:6, lineHeight:1.4, transition:'color .15s' }} dangerouslySetInnerHTML={{ __html:sub }}/>}
    </div>
  );
}

/* ── Funnel ── */
function Funnel({ title, badge, color, steps, cpl, spend, conv }) {
  const max = steps[0]?.value || 1;
  return (
    <div style={{ background:'#FFFFFF', border:'1px solid #E5E7EB', borderRadius:8, padding:22, boxShadow:'0 1px 3px rgba(0,0,0,.06)' }}>
      <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:6 }}>
        <span style={{ fontFamily:'var(--font-semi)', fontWeight:700, fontSize:14, color:'#111827' }}>{title}</span>
        <span style={{ background:`${color}22`, border:`1px solid ${color}44`, color, fontFamily:'var(--font-semi)', fontSize:9, fontWeight:700, letterSpacing:1.5, textTransform:'uppercase', padding:'2px 9px', borderRadius:20 }}>{badge}</span>
      </div>
      {/* Mini stats */}
      <div style={{ display:'flex', gap:20, marginBottom:20, paddingBottom:14, borderBottom:'1px solid rgba(255,255,255,.06)' }}>
        {[
          ['Inversión', `S/ ${parseInt(spend||0).toLocaleString()}`],
          ['Conv./Leads', parseInt(conv||0).toLocaleString()],
          ['CPL', cpl ? `S/ ${parseFloat(cpl).toFixed(2)}` : '—'],
        ].map(([k,v])=>(
          <div key={k}>
            <div style={{ fontFamily:'var(--font-semi)', fontSize:9, fontWeight:700, letterSpacing:2, textTransform:'uppercase', color:'#9CA3AF', marginBottom:4 }}>{k}</div>
            <div style={{ fontFamily:'var(--font-cond)', fontWeight:800, fontSize:20, color:k==='CPL'?color:'#111827' }}>{v}</div>
          </div>
        ))}
      </div>
      {/* Bars */}
      {steps.map((s,i) => {
        const pct = Math.max(((s.value/max)*100),8);
        const convRate = i>0 ? ((s.value/steps[i-1].value)*100).toFixed(1) : null;
        return (
          <div key={i} style={{ marginBottom: i<steps.length-1 ? 4 : 0 }}>
            <div style={{ display:'flex', justifyContent:'space-between', fontSize:10.5, fontFamily:'var(--font-semi)', fontWeight:600, color:'#6B7280', marginBottom:5, letterSpacing:.3 }}>
              <span>{s.label}</span>
              <span style={{ display:'flex', gap:10, alignItems:'center' }}>
                {convRate && <span style={{ fontSize:9.5, color:'#9CA3AF', fontWeight:600 }}>conv. {convRate}%</span>}
                <span style={{ fontFamily:'var(--font-cond)', fontWeight:800, fontSize:16, color:'#111827' }}>{s.value.toLocaleString()}</span>
              </span>
            </div>
            <div style={{ background:'#F3F4F6', borderRadius:5, height:38, overflow:'hidden' }}>
              <div style={{
                width:`${pct}%`, height:'100%', borderRadius:5,
                background:`linear-gradient(90deg,${color}99,${color})`,
                display:'flex', alignItems:'center', paddingLeft:12,
                fontFamily:'var(--font-semi)', fontWeight:600, fontSize:10.5, color:'rgba(255,255,255,.9)',
                transition:'width .8s cubic-bezier(.16,1,.3,1)',
              }}>
                {s.note||''}
              </div>
            </div>
            {i<steps.length-1 && <div style={{ marginLeft:14, height:8, borderLeft:`1px dashed rgba(255,255,255,.1)` }}/>}
          </div>
        );
      })}
    </div>
  );
}

/* ── Section header ── */
const SecHead = ({ label }) => (
  <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:16, marginTop:4 }}>
    <div style={{ width:22, height:2, background:C.gold, flexShrink:0, borderRadius:2 }}/>
    <span style={{ fontFamily:'var(--font-semi)', fontSize:10, fontWeight:700, letterSpacing:'3px', textTransform:'uppercase', color:C.gold }}>
      {label}
    </span>
  </div>
);

/* ── Platform comparison card ── */
function PlatformCard({ title, color, rows }) {
  return (
    <div style={{ background:'#FFFFFF', border:'1px solid #E5E7EB', borderTop:`3px solid ${color}`, borderRadius:8, padding:20, boxShadow:'0 1px 3px rgba(0,0,0,.06)' }}>
      <div style={{ fontFamily:'var(--font-semi)', fontSize:10, fontWeight:700, letterSpacing:'2.5px', textTransform:'uppercase', color, marginBottom:16 }}>{title}</div>
      {rows.map(([k,v,highlight])=>(
        <div key={k} style={{ display:'flex', justifyContent:'space-between', fontSize:12.5, marginBottom:10, alignItems:'baseline', paddingBottom:9, borderBottom:'1px solid rgba(255,255,255,.04)' }}>
          <span style={{ color:'#9CA3AF', fontFamily:'var(--font-semi)', fontWeight:600 }}>{k}</span>
          <span style={{ fontWeight:700, color: highlight ? color : '#fff', fontFamily:'var(--font-semi)', fontSize:13 }}>{v}</span>
        </div>
      ))}
    </div>
  );
}

export default function MetricsPage() {
  const { activeClient, dateMode, datePreset, dateRange = {} } = useApp();
  const { campaigns:metaCampaigns, summary:metaSummary, loading:metaLoading } = useMetaCampaigns();
  const { campaigns:googleCampaigns, summary:googleSummary, loading:googleLoading } = useGoogleCampaigns();
  const [chartTab, setChartTab] = useState('spend');

  const hasMetaId   = !!activeClient.metaAccountId;
  const hasGoogleId = !!activeClient.googleCustomerId;
  const isDemo      = !hasMetaId && !hasGoogleId;
  const isLoading   = metaLoading || googleLoading;

  /* ── Numbers ── */
  const metaSpend   = parseFloat(metaSummary.spend  || 0);
  const googleSpend = parseFloat(googleSummary.spend || 0);
  const totalSpend  = metaSpend + googleSpend;
  const metaLeads   = parseInt(metaSummary.leads || 0);
  const googleConv  = parseInt(googleSummary.conversions || 0);
  const totalLeads  = metaLeads + googleConv;
  const metaClics   = parseInt(metaSummary.clicks || 0);
  const googleClics = parseInt(googleSummary.clicks || 0);
  const metaImpr    = parseInt(metaSummary.impressions || 0);
  const metaCtr     = parseFloat(metaSummary.ctr  || 0);
  const metaCpm     = parseFloat(metaSummary.cpm  || 0);
  const metaCpc     = parseFloat(metaSummary.cpc  || 0);
  const metaReach   = parseInt(metaSummary.reach  || 0);
  const metaFreq    = parseFloat(metaSummary.frequency || 0);
  const metaConvRate= parseFloat(metaSummary.convRate  || 0);
  const metaWaConv  = parseInt(metaSummary.waConv || 0);

  const cplMeta    = metaLeads  > 0 ? (metaSpend/metaLeads).toFixed(2)    : null;
  const cplGoogle  = googleConv > 0 ? (googleSpend/googleConv).toFixed(2) : null;
  const cplTotal   = totalLeads > 0 ? (totalSpend/totalLeads).toFixed(2)  : null;
  const cpcGoogle  = googleClics> 0 ? (googleSpend/googleClics).toFixed(2): null;

  /* ── Segment by campaign type ── */
  const { leadCamps, waCamps } = useMemo(() => {
    const src = hasMetaId ? metaCampaigns : [];
    const lead=[], wa=[];
    for (const c of src) {
      const n = (c.name||'').toUpperCase();
      if (n.includes('WHATSAPP')||n.includes('_WA_')||n.includes('WA_')) wa.push(c);
      else lead.push(c);
    }
    return { leadCamps:lead, waCamps:wa };
  }, [metaCampaigns, hasMetaId]);

  const sumGroup = (arr) => {
    let spend=0,leads=0,clics=0,impr=0,wa=0;
    for (const c of arr) {
      spend += parseFloat(c.metrics?.spend||0);
      clics += parseInt(c.metrics?.clicks||0);
      impr  += parseInt(c.metrics?.impressions||0);
      for (const a of (c.metrics?.actions||[])) {
        if (a.action_type==='lead') leads += parseInt(a.value||0);
        if (a.action_type?.includes('messaging')) wa += parseInt(a.value||0);
      }
    }
    return { spend, leads, clics, impr, wa, conv:leads||wa, cpl: (leads||wa)>0 ? spend/(leads||wa) : null };
  };

  const demoLead = { spend:38420, leads:2156, clics:18200, impr:4200000, conv:2156, cpl:17.82 };
  const demoWA   = { spend:9749,  leads:0,    clics:4030,  impr:481783,  conv:341,  wa:341, cpl:28.59 };
  const sL = isDemo ? demoLead : sumGroup(leadCamps);
  const sW = isDemo ? demoWA   : sumGroup(waCamps);

  /* ── Chart data ── */
  const chartData = useMemo(() => {
    if (metaCampaigns.length>0) {
      return metaCampaigns.slice(0,10).map(c => {
        const spend = parseFloat(c.metrics?.spend||0);
        const leads = parseInt(c.metrics?.actions?.find(a=>a.action_type==='lead')?.value||0);
        const clics = parseInt(c.metrics?.clicks||0);
        const cpl   = leads>0 ? parseFloat((spend/leads).toFixed(2)) : 0;
        const name  = (c.name||'').replace(/2026_\d_/g,'').replace(/_FORM$/,'').replace(/CLICK_/,'').replace(/_/g,' ').substring(0,22);
        return { name, spend:parseFloat(spend.toFixed(0)), leads, clics, cpl };
      });
    }
    return [
      { name:'WHATSAPP DISTANCIA', spend:3824,leads:0, clics:3564,cpl:0   },
      { name:'LEADS MEDICINA',     spend:4200,leads:94,clics:2100,cpl:44.7},
      { name:'LEADS ENFERMERIA',   spend:3800,leads:88,clics:1900,cpl:43.2},
      { name:'LEADS DISTANCIA',    spend:2900,leads:102,clics:1800,cpl:28.4},
      { name:'LEADS PSICOLOGIA',   spend:2600,leads:72,clics:1400,cpl:36.1},
      { name:'WHATSAPP LIMA',      spend:557, leads:0, clics:328, cpl:0   },
      { name:'LEADS DERECHO',      spend:1800,leads:48,clics:980, cpl:37.5},
      { name:'BRANDING',           spend:1500,leads:18,clics:650, cpl:83.3},
    ];
  }, [metaCampaigns]);

  const trendData = [
    { s:'S1',spend:38000,google:9200, leads:820, cpl:55,waleads:48 },
    { s:'S2',spend:41000,google:10100,leads:910, cpl:54,waleads:54 },
    { s:'S3',spend:44000,google:10800,leads:1020,cpl:52,waleads:61 },
    { s:'S4',spend:40000,google:9900, leads:980, cpl:51,waleads:58 },
    { s:'S5',spend:43500,google:10400,leads:1050,cpl:50,waleads:66 },
    { s:'S6',spend:46000,google:11200,leads:1090,cpl:51,waleads:70 },
  ];

  const chartTabs = [
    { k:'spend',l:'INVERSIÓN',color:C.gold  },
    { k:'leads', l:'LEADS',   color:C.green },
    { k:'clics', l:'CLICS',   color:C.blue  },
    { k:'cpl',   l:'CPL',     color:C.red   },
  ];
  const activeColor = chartTabs.find(t=>t.k===chartTab)?.color||C.gold;

  /* Demo values */
  const D = {
    spend:'S/ 48,169', cplTotal:'S/ 17.83', cplMeta:'S/ 17.83', cplGoogle:'—',
    leads:'2,701', clics:'85,200', impr:'5.7M', ctr:'1.50%', cpm:'S/ 8.47',
    cpc:'S/ 0.57', freq:'2.71', reach:'2.1M', convRate:'3.17%', campAct:'40',
  };

  /* Date label for header */
  const dateLbl = dateMode==='range'
    ? `${dateRange.since} → ${dateRange.until}`
    : PRESETS_MAP[datePreset] || 'Últ. 30 días';

  return (
    <div className="scroll-y" style={{ flex:1, padding:'24px 28px', background:'#F8F9FA' }}>

      {/* ── Header ── */}
      <div style={{ display:'flex', alignItems:'center', gap:14, marginBottom:26 }}>
        <h1 style={{ fontFamily:'var(--font-cond)', fontWeight:900, fontSize:26, letterSpacing:2, textTransform:'uppercase', color:'#111827', lineHeight:1 }}>
          Métricas
        </h1>
        <span style={{ fontFamily:'var(--font-semi)', fontSize:11, fontWeight:600, letterSpacing:1.5, color:'#9CA3AF', textTransform:'uppercase' }}>
          {activeClient.name}
        </span>
        <span style={{ fontFamily:'var(--font-semi)', fontSize:10, fontWeight:600, color:'#9CA3AF', background:'#F3F4F6', border:'1px solid #E5E7EB', padding:'3px 10px', borderRadius:20 }}>
          📅 {dateLbl}
        </span>
        {isDemo && <span style={{ fontSize:9, color:C.gold, fontFamily:'var(--font-semi)', fontWeight:700, letterSpacing:1.5, textTransform:'uppercase', background:C.goldDim, border:`1px solid ${C.goldBorder}`, padding:'3px 10px', borderRadius:20 }}>DEMO</span>}
        {!isDemo && isLoading && <span className="spinner" style={{ marginLeft:4 }}/>}
        {!isDemo && !isLoading && (
          <button className="btn btn-ghost btn-sm" style={{ marginLeft:'auto' }}>↻ Actualizar</button>
        )}
      </div>

      {/* ══ KPI ROW 1 ══ */}
      <SecHead label="Resumen general" />
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, marginBottom:14 }}>
        <Kpi idx={0} accent="accent" label="CPL Promedio Total"
          value={cplTotal ? `S/ ${cplTotal}` : D.cplTotal}
          delta="-28% vs. período ant." deltaDir="up"
          sub={`${isDemo?D.leads:totalLeads.toLocaleString()} leads · <b>${isDemo?D.campAct:metaCampaigns.filter(c=>c.status==='ACTIVE').length}</b> campañas activas`}/>
        <Kpi idx={1} accent="green" label="Leads + Conversiones"
          value={totalLeads>0 ? totalLeads.toLocaleString() : D.leads}
          delta="+21% vs. período ant." deltaDir="up"
          sub={`Meta <b>${isDemo?D.leads:metaLeads}</b> · Google <b>${isDemo?'0':googleConv}</b>`}/>
        <Kpi idx={2} accent="slate" label="Inversión Total"
          value={totalSpend>0 ? `S/ ${parseInt(totalSpend).toLocaleString()}` : D.spend}
          sub={`Meta <b>S/${isDemo?'48,169':parseInt(metaSpend).toLocaleString()}</b> · Google <b>S/${isDemo?'0':parseInt(googleSpend).toLocaleString()}</b>`}/>
        <Kpi idx={3} accent="blue" label="Clics Totales"
          value={isDemo ? D.clics : (metaClics+googleClics).toLocaleString()}
          sub={`CTR Meta <b>${metaCtr>0?metaCtr.toFixed(2)+'%':D.ctr}</b> · CPC <b>${metaCpc>0?'S/ '+metaCpc.toFixed(2):D.cpc}</b>`}/>
      </div>

      {/* ══ KPI ROW 2 — Métricas avanzadas ══ */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, marginBottom:28 }}>
        <Kpi idx={4} accent="meta"   label="CPL Meta Ads"
          value={cplMeta?`S/ ${cplMeta}`:D.cplMeta}
          sub={`<b>${isDemo?D.leads:metaLeads}</b> leads · Lead Ads + WA`}/>
        <Kpi idx={5} accent="google" label="CPL Google Ads"
          value={cplGoogle?`S/ ${cplGoogle}`:D.cplGoogle}
          sub={`<b>${isDemo?'0':googleConv}</b> conversiones Google`}/>
        <Kpi idx={6} accent="slate"  label="Alcance + Frecuencia"
          value={metaReach>0?(metaReach/1000000).toFixed(1)+'M':D.reach}
          sub={`Frecuencia <b>${metaFreq>0?metaFreq.toFixed(2):D.freq}x</b> · CPM <b>${metaCpm>0?'S/ '+metaCpm.toFixed(2):D.cpm}</b>`}/>
        <Kpi idx={7} accent="green"  label="Tasa de Conversión"
          value={metaConvRate>0?metaConvRate.toFixed(2)+'%':D.convRate}
          sub={`Clics→Leads Meta · Impresiones <b>${metaImpr>0?(metaImpr/1000000).toFixed(1)+'M':D.impr}</b>`}/>
      </div>

      {/* ══ EMBUDOS ══ */}
      <SecHead label="Embudos por tipo de campaña" />
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, marginBottom:28 }}>
        <Funnel
          title="Lead Ads · Formulario" badge={`${isDemo?8:leadCamps.length} campañas`} color={C.green}
          spend={isDemo?sL.spend:sL.spend} conv={isDemo?sL.conv:sL.conv} cpl={isDemo?sL.cpl:sL.cpl}
          steps={[
            { label:'Impresiones totales',    value: isDemo?4200000:sL.impr,  note:'alcance campaña' },
            { label:'Clics al anuncio',       value: isDemo?18200:sL.clics,   note:'CTR 1.5%' },
            { label:'Formularios iniciados',  value: isDemo?3240:Math.round((isDemo?18200:sL.clics)*.18), note:'18% apertura' },
            { label:'Leads generados',        value: isDemo?sL.leads:sL.leads, note:`CPL S/${typeof sL.cpl==='number'?sL.cpl.toFixed(2):sL.cpl||'—'}` },
          ]}
        />
        <Funnel
          title="Click to WhatsApp" badge={`${isDemo?3:waCamps.length} campañas`} color={C.gold}
          spend={isDemo?sW.spend:sW.spend} conv={isDemo?sW.conv:sW.conv} cpl={isDemo?sW.cpl:sW.cpl}
          steps={[
            { label:'Impresiones totales',        value: isDemo?481783:sW.impr,  note:'alcance WA' },
            { label:'Clics al botón WhatsApp',    value: isDemo?4030:sW.clics,   note:'CTR 0.84%' },
            { label:'Conversaciones iniciadas',   value: isDemo?546:Math.round((isDemo?4030:sW.clics)*.14), note:'14% conv.' },
            { label:'Leads calificados',          value: isDemo?sW.conv:sW.conv, note:`CPL S/${typeof sW.cpl==='number'?sW.cpl.toFixed(2):sW.cpl||'—'}` },
          ]}
        />
      </div>

      {/* ══ COMPARATIVO PLATAFORMAS ══ */}
      <SecHead label="Comparativo por plataforma" />
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 300px', gap:14, marginBottom:28 }}>
        <PlatformCard title="Meta Ads" color={C.blue} rows={[
          ['Inversión',    isDemo?'S/ 48,169':`S/ ${parseInt(metaSpend).toLocaleString()}`],
          ['Leads',        isDemo?D.leads:metaLeads.toLocaleString(), true],
          ['CPL',          cplMeta?`S/ ${cplMeta}`:D.cplMeta, true],
          ['Clics',        isDemo?D.clics:metaClics.toLocaleString()],
          ['CTR',          metaCtr>0?`${metaCtr.toFixed(2)}%`:D.ctr],
          ['CPM',          metaCpm>0?`S/ ${metaCpm.toFixed(2)}`:D.cpm],
          ['CPC',          metaCpc>0?`S/ ${metaCpc.toFixed(2)}`:D.cpc],
          ['Frecuencia',   metaFreq>0?`${metaFreq.toFixed(2)}x`:D.freq],
          ['Alcance',      metaReach>0?`${(metaReach/1000000).toFixed(1)}M`:D.reach],
          ['Conv. WA',     isDemo?'341':metaWaConv.toLocaleString()],
          ['Camp. activas',isDemo?D.campAct:metaCampaigns.filter(c=>c.status==='ACTIVE').length],
        ]}/>
        <PlatformCard title="Google Ads" color={C.gold} rows={[
          ['Inversión',    isDemo?'S/ 0':`S/ ${parseInt(googleSpend).toLocaleString()}`],
          ['Conversiones', isDemo?'0':googleConv.toLocaleString(), true],
          ['CPL',          cplGoogle?`S/ ${cplGoogle}`:'—', true],
          ['Clics',        isDemo?'0':googleClics.toLocaleString()],
          ['CPC',          cpcGoogle?`S/ ${cpcGoogle}`:'—'],
          ['Campañas',     isDemo?'0':googleCampaigns.length],
        ]}/>
        {/* Pie */}
        <div style={{ background:'#FFFFFF', border:'1px solid #E5E7EB', borderRadius:8, padding:'16px 20px', boxShadow:'0 1px 3px rgba(0,0,0,.06)' }}>
          <div style={{ fontFamily:'var(--font-semi)', fontSize:10, fontWeight:700, letterSpacing:'2px', textTransform:'uppercase', color:'#6B7280', marginBottom:12 }}>DISTRIBUCIÓN INVERSIÓN</div>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={[
                { name:'Lead Ads',  value:isDemo?38420:sL.spend },
                { name:'WhatsApp',  value:isDemo?9749:sW.spend  },
                { name:'Google',    value:isDemo?0:googleSpend   },
              ].filter(d=>d.value>0)}
              cx="50%" cy="50%" innerRadius={50} outerRadius={72} dataKey="value" paddingAngle={4}>
                <Cell fill={C.green}/><Cell fill={C.gold}/><Cell fill={C.blue}/>
              </Pie>
              <Tooltip formatter={v=>`S/ ${parseInt(v).toLocaleString()}`}
                contentStyle={{ background:'#fff', border:`1px solid ${C.goldBorder}`, fontSize:12, borderRadius:8 }}/>
              <Legend iconType="circle" iconSize={7} wrapperStyle={{ fontFamily:'var(--font-semi)', fontSize:10.5, paddingTop:10 }}/>
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ══ RENDIMIENTO POR CAMPAÑA ══ */}
      <SecHead label="Rendimiento por campaña · Meta" />
      <div style={{ background:'#FFFFFF', border:'1px solid #E5E7EB', borderRadius:8, marginBottom:28, overflow:'hidden', boxShadow:'0 1px 3px rgba(0,0,0,.06)' }}>
        <div style={{ display:'flex', alignItems:'center', gap:4, padding:'14px 20px', borderBottom:'1px solid rgba(255,255,255,.07)' }}>
          {chartTabs.map(t=>(
            <button key={t.k} onClick={()=>setChartTab(t.k)} style={{
              padding:'5px 14px', fontFamily:'var(--font-semi)', fontSize:10, fontWeight:700, letterSpacing:1.5, textTransform:'uppercase',
              cursor:'pointer', border:'none', background:chartTab===t.k?`${t.color}22`:'transparent',
              color:chartTab===t.k?t.color:'#9CA3AF', borderBottom:chartTab===t.k?`2px solid ${t.color}`:'2px solid transparent',
              borderRadius:'4px 4px 0 0', transition:'all .15s',
            }}>{t.l}</button>
          ))}
          <span style={{ marginLeft:'auto', fontFamily:'var(--font-semi)', fontSize:10, color:'#111827'3 }}>
            {isDemo?'8 campañas demo':`${metaCampaigns.length} campañas`}
          </span>
        </div>
        <div style={{ padding:20 }}>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={chartData} layout="vertical" barSize={22}>
              <XAxis type="number" tick={{ fontSize:10,fill:C.text3 }} axisLine={false} tickLine={false}
                tickFormatter={v=>chartTab==='spend'||chartTab==='cpl'?`S/${v}`:v.toLocaleString()}/>
              <YAxis type="category" dataKey="name" tick={{ fontSize:10,fill:'#9CA3AA',fontFamily:'var(--font-semi)' }} axisLine={false} tickLine={false} width={150}/>
              <Tooltip content={<Tip/>}/>
              <Bar dataKey={chartTab} fill={activeColor} opacity={0.9} radius={[0,4,4,0]}/>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ══ TENDENCIAS ══ */}
      <SecHead label="Tendencia semanal" />
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, marginBottom:20 }}>
        <div style={{ background:'#FFFFFF', border:'1px solid #E5E7EB', borderRadius:8, overflow:'hidden', boxShadow:'0 1px 3px rgba(0,0,0,.06)' }}>
          <div style={{ padding:'14px 20px', borderBottom:'1px solid rgba(255,255,255,.07)', fontFamily:'var(--font-semi)', fontSize:10, fontWeight:700, letterSpacing:'2px', textTransform:'uppercase', color:'#6B7280' }}>INVERSIÓN META vs GOOGLE</div>
          <div style={{ padding:20 }}>
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={trendData}>
                <defs>
                  <linearGradient id="gm" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={C.blue} stopOpacity={.35}/><stop offset="95%" stopColor={C.blue} stopOpacity={0}/></linearGradient>
                  <linearGradient id="gg" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={C.gold} stopOpacity={.35}/><stop offset="95%" stopColor={C.gold} stopOpacity={0}/></linearGradient>
                </defs>
                <XAxis dataKey="s" tick={{ fontSize:10,fill:C.text3 }} axisLine={false} tickLine={false}/>
                <YAxis tick={{ fontSize:10,fill:C.text3 }} axisLine={false} tickLine={false} tickFormatter={v=>`${(v/1000).toFixed(0)}K`}/>
                <CartesianGrid stroke="rgba(255,255,255,.04)" strokeDasharray="4 4"/>
                <Tooltip content={<Tip/>}/>
                <Area type="monotone" dataKey="spend" name="Meta"   stroke={C.blue} fill="url(#gm)" strokeWidth={2}/>
                <Area type="monotone" dataKey="google" name="Google" stroke={C.gold} fill="url(#gg)" strokeWidth={2}/>
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div style={{ background:'#FFFFFF', border:'1px solid #E5E7EB', borderRadius:8, overflow:'hidden', boxShadow:'0 1px 3px rgba(0,0,0,.06)' }}>
          <div style={{ padding:'14px 20px', borderBottom:'1px solid rgba(255,255,255,.07)', fontFamily:'var(--font-semi)', fontSize:10, fontWeight:700, letterSpacing:'2px', textTransform:'uppercase', color:'#6B7280' }}>LEADS + CPL SEMANAL</div>
          <div style={{ padding:20 }}>
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={trendData}>
                <XAxis dataKey="s" tick={{ fontSize:10,fill:C.text3 }} axisLine={false} tickLine={false}/>
                <YAxis yAxisId="l" tick={{ fontSize:10,fill:C.text3 }} axisLine={false} tickLine={false}/>
                <YAxis yAxisId="c" orientation="right" tick={{ fontSize:10,fill:C.text3 }} axisLine={false} tickLine={false} tickFormatter={v=>`S/${v}`}/>
                <CartesianGrid stroke="rgba(255,255,255,.04)" strokeDasharray="4 4"/>
                <Tooltip content={<Tip/>}/>
                <Line yAxisId="l" type="monotone" dataKey="leads"   name="Lead Ads" stroke={C.green}  strokeWidth={2.5} dot={{ fill:C.green,  r:4 }}/>
                <Line yAxisId="l" type="monotone" dataKey="waleads" name="WhatsApp" stroke={C.gold}   strokeWidth={2}   dot={{ fill:C.gold,   r:3 }}/>
                <Line yAxisId="c" type="monotone" dataKey="cpl"     name="CPL S/"   stroke={C.red}    strokeWidth={1.5} dot={false} strokeDasharray="5 3"/>
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {isDemo && (
        <div style={{ background:'rgba(220,161,69,.07)', border:'1px solid rgba(220,161,69,.25)', borderLeft:`3px solid ${C.gold}`, padding:'14px 18px', borderRadius:8, fontSize:13, color:'#6B7280' }}>
          <strong style={{ color:C.gold }}>Datos demo —</strong> Ve a <strong>Config → Clientes</strong> y agrega los IDs de {activeClient.name} para ver datos reales.
        </div>
      )}
    </div>
  );
}

const PRESETS_MAP = { today:'Hoy', yesterday:'Ayer', last_7d:'Últ. 7 días', last_14d:'Últ. 14 días', last_30d:'Últ. 30 días', last_60d:'Últ. 60 días', this_month:'Este mes', last_month:'Mes anterior', last_quarter:'Último trimestre' };
