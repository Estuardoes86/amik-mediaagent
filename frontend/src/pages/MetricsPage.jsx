import React, { useMemo, useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, CartesianGrid, PieChart, Pie, Cell, Legend, AreaChart, Area
} from 'recharts';
import { useMetaCampaigns, useGoogleCampaigns } from '../hooks/useData.js';
import { useApp } from '../context/AppContext.jsx';

/* ── Design tokens ── */
const C = {
  gold:    '#DCA145',
  goldDim: 'rgba(220,161,69,0.12)',
  green:   '#2DD4A0',
  blue:    '#5B8DB8',
  red:     '#E8445A',
  purple:  '#9061B0',
  carbon:  '#262630',
  slate:   '#30373F',
  text2:   '#9CA3AA',
  text3:   '#5C6470',
};

/* ── Custom tooltip ── */
const Tip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background:'#1C1C25', border:`1px solid ${C.goldDim}`, borderLeft:`3px solid ${C.gold}`, padding:'10px 16px', borderRadius:8, fontSize:12, boxShadow:'0 8px 24px rgba(0,0,0,.5)' }}>
      <div style={{ color:C.text2, marginBottom:6, fontSize:10, letterSpacing:1, textTransform:'uppercase', fontFamily:'var(--font-semi)', fontWeight:700 }}>{label}</div>
      {payload.map((p,i) => (
        <div key={i} style={{ color:p.color, fontFamily:'var(--font-semi)', fontWeight:600, marginBottom:2 }}>
          {p.name}: <span style={{ color:'#F0EDE8' }}>{typeof p.value === 'number' ? p.value.toLocaleString() : p.value}</span>
        </div>
      ))}
    </div>
  );
};

/* ── KPI Card ── */
function Kpi({ label, value, sub, delta, deltaDir, accent, idx }) {
  const borderColors = { accent:C.gold, green:C.green, blue:C.blue, red:C.red, purple:C.purple, meta:C.blue, google:C.gold, slate:C.slate };
  const valColors    = { accent:C.gold, green:C.green };
  return (
    <div style={{
      background: C.carbon, border:'1px solid rgba(255,255,255,0.07)',
      borderRadius:8, padding:'18px 20px 16px', position:'relative', overflow:'hidden',
      boxShadow:'0 4px 20px rgba(0,0,0,.4)', animation:`kpi-rise .45s ${(idx||0)*.05}s both`,
      transition:'transform .2s, box-shadow .2s',
    }}
    onMouseEnter={e=>{ e.currentTarget.style.transform='translateY(-3px)'; e.currentTarget.style.boxShadow=`0 8px 32px rgba(0,0,0,.5), 0 0 0 1px ${C.goldDim}`; }}
    onMouseLeave={e=>{ e.currentTarget.style.transform=''; e.currentTarget.style.boxShadow='0 4px 20px rgba(0,0,0,.4)'; }}
    >
      {/* Left accent bar */}
      <div style={{ position:'absolute', left:0, top:0, bottom:0, width:3, background: borderColors[accent] || 'rgba(255,255,255,.1)', borderRadius:'8px 0 0 8px' }} />

      <div style={{ fontFamily:'var(--font-semi)', fontSize:9.5, fontWeight:700, letterSpacing:'2.5px', textTransform:'uppercase', color:C.text3, marginBottom:10 }}>
        {label}
      </div>
      <div style={{ fontFamily:'var(--font-cond)', fontWeight:800, fontSize:36, lineHeight:1, letterSpacing:.5, color: valColors[accent] || '#F0EDE8' }}>
        {value ?? '—'}
      </div>
      {delta && (
        <div style={{ display:'inline-flex', alignItems:'center', gap:4, fontFamily:'var(--font-semi)', fontSize:11, fontWeight:700, marginTop:6, color: deltaDir==='up' ? C.green : C.red }}>
          {deltaDir==='up' ? '▲' : '▼'} {delta}
        </div>
      )}
      {sub && (
        <div style={{ fontSize:11.5, color:C.text2, marginTop:6, lineHeight:1.4 }}
          dangerouslySetInnerHTML={{ __html: sub }} />
      )}
    </div>
  );
}

/* ── Funnel ── */
function Funnel({ title, badge, color, steps }) {
  const max = steps[0]?.value || 1;
  return (
    <div style={{ background:C.carbon, border:'1px solid rgba(255,255,255,.07)', borderRadius:8, padding:20, boxShadow:'0 4px 20px rgba(0,0,0,.4)' }}>
      <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:18 }}>
        <div style={{ fontFamily:'var(--font-semi)', fontWeight:700, fontSize:14, color:'#F0EDE8' }}>{title}</div>
        <span style={{ background: color+'22', border:`1px solid ${color}44`, color, fontFamily:'var(--font-semi)', fontSize:9, fontWeight:700, letterSpacing:1.5, textTransform:'uppercase', padding:'2px 9px', borderRadius:20 }}>{badge}</span>
      </div>
      {steps.map((s, i) => {
        const pct = Math.max(((s.value / max) * 100), 8);
        return (
          <div key={i} style={{ marginBottom:6 }}>
            <div style={{ display:'flex', justifyContent:'space-between', fontSize:10.5, fontFamily:'var(--font-semi)', fontWeight:600, color:C.text2, marginBottom:4, letterSpacing:.5, textTransform:'uppercase' }}>
              <span>{s.label}</span>
              <span style={{ color:'#F0EDE8', fontFamily:'var(--font-cond)', fontWeight:700, fontSize:13 }}>
                {s.value.toLocaleString()}
                {i > 0 && <span style={{ fontSize:10, color:C.text3, marginLeft:6 }}>({((s.value/max)*100).toFixed(1)}%)</span>}
              </span>
            </div>
            <div style={{ background:'rgba(255,255,255,.05)', borderRadius:4, height:36, overflow:'hidden' }}>
              <div style={{
                width:`${pct}%`, height:'100%', borderRadius:4,
                background:`linear-gradient(90deg, ${color}CC, ${color})`,
                display:'flex', alignItems:'center', paddingLeft:12,
                fontFamily:'var(--font-semi)', fontWeight:700, fontSize:11, color:'#fff',
                transition:'width .8s cubic-bezier(.16,1,.3,1)',
              }}>
                {s.sub || ''}
              </div>
            </div>
            {i < steps.length - 1 && (
              <div style={{ marginLeft:16, marginTop:2, marginBottom:2, height:10, borderLeft:`1px dashed rgba(255,255,255,.12)` }} />
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ── Section header ── */
const SecHead = ({ label }) => (
  <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:16, marginTop:8 }}>
    <div style={{ width:22, height:2, background:C.gold, flexShrink:0 }} />
    <span style={{ fontFamily:'var(--font-semi)', fontSize:10, fontWeight:700, letterSpacing:'3px', textTransform:'uppercase', color:C.gold }}>
      {label}
    </span>
  </div>
);

export default function MetricsPage() {
  const { activeClient } = useApp();
  const { campaigns: metaCampaigns, summary: metaSummary, loading: metaLoading } = useMetaCampaigns();
  const { campaigns: googleCampaigns, summary: googleSummary, loading: googleLoading } = useGoogleCampaigns();
  const [chartTab, setChartTab] = useState('spend');

  const hasMetaId  = !!activeClient.metaAccountId;
  const hasGoogleId = !!activeClient.googleCustomerId;
  const isDemo = !hasMetaId && !hasGoogleId;
  const isLoading = metaLoading || googleLoading;

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
  const metaCtr     = parseFloat(metaSummary.ctr || 0);
  const metaCpm     = parseFloat(metaSummary.cpm || 0);

  const cplMeta    = metaLeads  > 0 ? (metaSpend   / metaLeads ).toFixed(2) : null;
  const cplGoogle  = googleConv > 0 ? (googleSpend  / googleConv).toFixed(2) : null;
  const cplTotal   = totalLeads > 0 ? (totalSpend   / totalLeads).toFixed(2) : null;
  const cpcGoogle  = googleClics> 0 ? (googleSpend  / googleClics).toFixed(2): null;

  /* ── Separate Lead Ads vs WhatsApp ── */
  const { leadCampaigns, waCampaigns, otherCampaigns } = useMemo(() => {
    const src = hasMetaId ? metaCampaigns : [];
    const lead=[], wa=[], other=[];
    for (const c of src) {
      const n = (c.name || '').toUpperCase();
      if (n.includes('WHATSAPP') || n.includes('WA_') || n.includes('_WA_')) wa.push(c);
      else if (n.includes('LEAD') || n.includes('FORM')) lead.push(c);
      else other.push(c);
    }
    return { leadCampaigns:lead, waCampaigns:wa, otherCampaigns:other };
  }, [metaCampaigns, hasMetaId]);

  const sumGroup = (arr) => {
    let spend=0, leads=0, clics=0, impr=0, waConv=0;
    for (const c of arr) {
      spend += parseFloat(c.metrics?.spend || 0);
      clics += parseInt(c.metrics?.clicks  || 0);
      impr  += parseInt(c.metrics?.impressions || 0);
      for (const a of (c.metrics?.actions || [])) {
        if (a.action_type === 'lead') leads += parseInt(a.value||0);
        if (a.action_type?.includes('messaging') || a.action_type?.includes('whatsapp')) waConv += parseInt(a.value||0);
      }
    }
    return { spend, leads, clics, impr, waConv,
      cpl: leads > 0 ? spend/leads : waConv > 0 ? spend/waConv : null,
      conv: leads || waConv };
  };

  /* Demo segment data */
  const demoLead = { spend:38420, leads:2156, clics:18200, impr:4200000, conv:2156, cpl:17.82 };
  const demoWA   = { spend:9749,  leads:0,    clics:4030,  impr:481783,  conv:341,  cpl:28.59, waConv:341 };
  const realLead  = sumGroup(leadCampaigns);
  const realWA    = sumGroup(waCampaigns);
  const segLead   = isDemo ? demoLead : realLead;
  const segWA     = isDemo ? demoWA   : realWA;

  /* ── Campaign bar chart ── */
  const chartData = useMemo(() => {
    if (metaCampaigns.length > 0) {
      return metaCampaigns.slice(0, 10).map(c => {
        const spend = parseFloat(c.metrics?.spend || 0);
        const leads = parseInt(c.metrics?.actions?.find(a=>a.action_type==='lead')?.value || 0);
        const clics = parseInt(c.metrics?.clicks || 0);
        const cpl   = leads > 0 ? parseFloat((spend/leads).toFixed(2)) : 0;
        const name  = (c.name||'').replace(/2026_\d_/g,'').replace(/_FORM$/,'').replace(/CLICK_/,'').replace(/_/g,' ').substring(0,22);
        return { name, spend:parseFloat(spend.toFixed(0)), leads, clics, cpl };
      });
    }
    return [
      { name:'WHATSAPP DISTANCIA',  spend:3824, leads:0,  clics:3564, cpl:0  },
      { name:'LEADS MEDICINA',      spend:4200, leads:94, clics:2100, cpl:44.7},
      { name:'LEADS ENFERMERIA',    spend:3800, leads:88, clics:1900, cpl:43.2},
      { name:'LEADS PSICOLOGIA',    spend:2600, leads:72, clics:1400, cpl:36.1},
      { name:'LEADS DISTANCIA',     spend:2900, leads:102,clics:1800, cpl:28.4},
      { name:'WHATSAPP LIMA',       spend:557,  leads:0,  clics:328,  cpl:0  },
      { name:'LEADS DERECHO',       spend:1800, leads:48, clics:980,  cpl:37.5},
      { name:'BRANDING',            spend:1500, leads:18, clics:650,  cpl:83.3},
    ];
  }, [metaCampaigns]);

  const trendData = [
    { s:'S1', meta:38000, google:9200,  leads:820,  cpl:55 },
    { s:'S2', meta:41000, google:10100, leads:910,  cpl:54 },
    { s:'S3', meta:44000, google:10800, leads:1020, cpl:52 },
    { s:'S4', meta:40000, google:9900,  leads:980,  cpl:51 },
    { s:'S5', meta:43500, google:10400, leads:1050, cpl:50 },
    { s:'S6', meta:46000, google:11200, leads:1090, cpl:51 },
  ];

  const pieData = [
    { name:'Meta Ads',   value: isDemo ? 48169  : metaSpend  },
    { name:'Google Ads', value: isDemo ? 0       : googleSpend },
    { name:'Lead Ads',   value: isDemo ? 38420   : segLead.spend },
    { name:'WhatsApp',   value: isDemo ? 9749    : segWA.spend  },
  ].filter(d=>d.value>0);

  const PIE_COLORS = [C.blue, C.gold, C.green, C.purple];

  const chartTabs = [
    { k:'spend', l:'INVERSIÓN', color:C.gold  },
    { k:'leads', l:'LEADS',     color:C.green },
    { k:'clics', l:'CLICS',     color:C.blue  },
    { k:'cpl',   l:'CPL',       color:C.red   },
  ];
  const activeColor = chartTabs.find(t=>t.k===chartTab)?.color || C.gold;

  /* ── Demo display values ── */
  const D = {
    spend:'S/ 48,169', metaSpend:'S/ 48,169', googleSpend:'S/ 0',
    leads:'2,701', metaLeads:'2,701', googleConv:'0',
    cplTotal:'S/ 17.83', cplMeta:'S/ 17.83', cplGoogle:'S/ 65.63',
    clics:'85,200', impr:'5.7M', ctr:'1.50%', cpm:'S/ 8.47', cpc:'S/ 4.99',
    alcance:'2.1M', campActivas:'40',
  };

  const fmt = (real, demo, prefix='') => real > 0 ? `${prefix}${parseInt(real).toLocaleString()}` : demo;

  return (
    <div className="scroll-y" style={{ flex:1, padding:'24px 28px', background:'var(--bg)' }}>

      {/* ── Page header ── */}
      <div style={{ display:'flex', alignItems:'center', gap:14, marginBottom:26 }}>
        <h1 style={{ fontFamily:'var(--font-cond)', fontWeight:900, fontSize:26, letterSpacing:2, textTransform:'uppercase', color:'#fff' }}>
          Métricas
        </h1>
        <span style={{ fontFamily:'var(--font-semi)', fontSize:11, fontWeight:600, letterSpacing:1.5, color:C.text3, textTransform:'uppercase' }}>
          {activeClient.name}
        </span>
        {isDemo && (
          <span style={{ fontSize:9, color:C.gold, fontFamily:'var(--font-semi)', fontWeight:700, letterSpacing:1.5, textTransform:'uppercase', background:C.goldDim, border:`1px solid rgba(220,161,69,.3)`, padding:'3px 10px', borderRadius:20 }}>
            DEMO
          </span>
        )}
        {!isDemo && isLoading && <span className="spinner" style={{ marginLeft:4 }} />}
        {!isDemo && !isLoading && (
          <button className="btn btn-ghost btn-sm" style={{ marginLeft:'auto' }}>↻ Actualizar</button>
        )}
      </div>

      {/* ══ KPI ROW 1 — Totales ══ */}
      <SecHead label="Totales del período" />
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, marginBottom:20 }}>
        <Kpi idx={0} accent="accent" label="CPL Promedio Total"
          value={cplTotal ? `S/ ${cplTotal}` : D.cplTotal}
          delta="-28% vs. mes ant." deltaDir="up"
          sub={`${isDemo ? D.leads : totalLeads.toLocaleString()} leads &middot; ${isDemo ? D.campActivas : metaCampaigns.filter(c=>c.status==='ACTIVE').length} camp. activas`} />
        <Kpi idx={1} accent="green" label="Leads + Conversiones"
          value={totalLeads > 0 ? totalLeads.toLocaleString() : D.leads}
          delta="+21% vs. mes ant." deltaDir="up"
          sub={`Meta <b>${isDemo ? D.metaLeads : metaLeads}</b> &middot; Google <b>${isDemo ? D.googleConv : googleConv}</b>`} />
        <Kpi idx={2} accent="slate" label="Inversión Total"
          value={totalSpend > 0 ? `S/ ${parseInt(totalSpend).toLocaleString()}` : D.spend}
          sub={`Meta <b>${isDemo ? 'S/48,169' : 'S/'+parseInt(metaSpend).toLocaleString()}</b> &middot; Google <b>${isDemo ? 'S/0' : 'S/'+parseInt(googleSpend).toLocaleString()}</b>`} />
        <Kpi idx={3} accent="blue" label="Clics Totales"
          value={isDemo ? D.clics : (metaClics+googleClics).toLocaleString()}
          sub={`CTR Meta <b>${metaCtr > 0 ? metaCtr.toFixed(2)+'%' : D.ctr}</b>`} />
      </div>

      {/* ══ KPI ROW 2 — Por plataforma ══ */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, marginBottom:28 }}>
        <Kpi idx={4} accent="meta"   label="CPL Meta Ads"
          value={cplMeta ? `S/ ${cplMeta}` : D.cplMeta}
          sub={`<b>${isDemo ? D.metaLeads : metaLeads}</b> leads generados`} />
        <Kpi idx={5} accent="google" label="CPL Google Ads"
          value={cplGoogle ? `S/ ${cplGoogle}` : D.cplGoogle}
          sub={`<b>${isDemo ? D.googleConv : googleConv}</b> conversiones`} />
        <Kpi idx={6} accent="slate"  label="Impresiones Meta"
          value={metaImpr > 0 ? (metaImpr/1000000).toFixed(1)+'M' : D.impr}
          sub={`CPM <b>${metaCpm > 0 ? 'S/ '+metaCpm.toFixed(2) : D.cpm}</b>`} />
        <Kpi idx={7} accent="slate"  label="CPC Google Ads"
          value={cpcGoogle ? `S/ ${cpcGoogle}` : D.cpc}
          sub={`<b>${isDemo ? '8,420' : googleClics.toLocaleString()}</b> clics pagados`} />
      </div>

      {/* ══ EMBUDOS ══ */}
      <SecHead label="Embudos por tipo de campaña" />
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, marginBottom:28 }}>

        {/* Lead Ads funnel */}
        <Funnel
          title="Lead Ads · Formulario"
          badge={`${isDemo ? leadCampaigns.length || 8 : leadCampaigns.length} campañas`}
          color={C.green}
          steps={[
            { label:'Impresiones',      value: isDemo ? 4200000 : segLead.impr,  sub:'alcance total' },
            { label:'Clics al anuncio', value: isDemo ? 18200   : segLead.clics, sub:'CTR 1.5%' },
            { label:'Formularios abiertos', value: isDemo ? 3240 : Math.round((isDemo?18200:segLead.clics)*0.18), sub:'18% apertura' },
            { label:'Leads generados',  value: isDemo ? 2156    : segLead.leads, sub:`CPL S/${isDemo ? '17.82' : segLead.cpl?.toFixed(2)||'—'}` },
          ]}
        />

        {/* WhatsApp funnel */}
        <Funnel
          title="Click to WhatsApp"
          badge={`${isDemo ? waCampaigns.length || 3 : waCampaigns.length} campañas`}
          color={C.gold}
          steps={[
            { label:'Impresiones',          value: isDemo ? 481783 : segWA.impr,   sub:'alcance WA' },
            { label:'Clics al botón WA',    value: isDemo ? 4030   : segWA.clics,  sub:'CTR 0.84%' },
            { label:'Conversaciones iniciadas', value: isDemo ? 546 : Math.round((isDemo?4030:segWA.clics)*0.14), sub:'14% conv.' },
            { label:'Leads calificados',    value: isDemo ? 341    : segWA.waConv||segWA.conv, sub:`CPL S/${isDemo ? '28.59' : segWA.cpl?.toFixed(2)||'—'}` },
          ]}
        />
      </div>

      {/* ══ COMPARATIVO PLATAFORMAS ══ */}
      <SecHead label="Comparativo por plataforma" />
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 300px', gap:14, marginBottom:28 }}>

        {/* Meta */}
        <div style={{ background:C.carbon, border:'1px solid rgba(255,255,255,.07)', borderTop:`3px solid ${C.blue}`, borderRadius:8, padding:20, boxShadow:'0 4px 20px rgba(0,0,0,.4)' }}>
          <div style={{ fontFamily:'var(--font-semi)', fontSize:10, fontWeight:700, letterSpacing:'2.5px', textTransform:'uppercase', color:C.blue, marginBottom:16 }}>Meta Ads</div>
          {[
            ['Inversión',   isDemo ? 'S/ 48,169' : `S/ ${parseInt(metaSpend).toLocaleString()}`],
            ['Leads',       isDemo ? '2,701' : metaLeads.toLocaleString()],
            ['CPL',         cplMeta ? `S/ ${cplMeta}` : D.cplMeta],
            ['Clics',       isDemo ? '85,200' : metaClics.toLocaleString()],
            ['CTR',         metaCtr > 0 ? `${metaCtr.toFixed(2)}%` : D.ctr],
            ['CPM',         metaCpm > 0 ? `S/ ${metaCpm.toFixed(2)}` : D.cpm],
            ['Impresiones', metaImpr > 0 ? `${(metaImpr/1000000).toFixed(1)}M` : D.impr],
            ['Campañas act.',isDemo ? D.campActivas : metaCampaigns.filter(c=>c.status==='ACTIVE').length],
          ].map(([k,v]) => (
            <div key={k} style={{ display:'flex', justifyContent:'space-between', fontSize:12.5, marginBottom:9, alignItems:'baseline' }}>
              <span style={{ color:C.text3 }}>{k}</span>
              <span style={{ fontWeight:700, color:'#F0EDE8', fontFamily:'var(--font-semi)' }}>{v}</span>
            </div>
          ))}
        </div>

        {/* Google */}
        <div style={{ background:C.carbon, border:'1px solid rgba(255,255,255,.07)', borderTop:`3px solid ${C.gold}`, borderRadius:8, padding:20, boxShadow:'0 4px 20px rgba(0,0,0,.4)' }}>
          <div style={{ fontFamily:'var(--font-semi)', fontSize:10, fontWeight:700, letterSpacing:'2.5px', textTransform:'uppercase', color:C.gold, marginBottom:16 }}>Google Ads</div>
          {[
            ['Inversión',    isDemo ? 'S/ 0' : `S/ ${parseInt(googleSpend).toLocaleString()}`],
            ['Conversiones', isDemo ? '0' : googleConv.toLocaleString()],
            ['CPL',          cplGoogle ? `S/ ${cplGoogle}` : '—'],
            ['Clics',        isDemo ? '0' : googleClics.toLocaleString()],
            ['CPC',          cpcGoogle ? `S/ ${cpcGoogle}` : '—'],
            ['Campañas',     isDemo ? '0' : googleCampaigns.length],
          ].map(([k,v]) => (
            <div key={k} style={{ display:'flex', justifyContent:'space-between', fontSize:12.5, marginBottom:9, alignItems:'baseline' }}>
              <span style={{ color:C.text3 }}>{k}</span>
              <span style={{ fontWeight:700, color:'#F0EDE8', fontFamily:'var(--font-semi)' }}>{v}</span>
            </div>
          ))}
        </div>

        {/* Pie */}
        <div style={{ background:C.carbon, border:'1px solid rgba(255,255,255,.07)', borderRadius:8, padding:'16px 20px 12px', boxShadow:'0 4px 20px rgba(0,0,0,.4)', display:'flex', flexDirection:'column' }}>
          <div style={{ fontFamily:'var(--font-semi)', fontSize:10, fontWeight:700, letterSpacing:'2px', textTransform:'uppercase', color:C.text2, marginBottom:4 }}>DISTRIBUCIÓN</div>
          <ResponsiveContainer width="100%" height={190}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius={48} outerRadius={72} dataKey="value" paddingAngle={4}>
                {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
              </Pie>
              <Tooltip formatter={v=>`S/ ${parseInt(v).toLocaleString()}`} contentStyle={{ background:'#1C1C25', border:`1px solid ${C.goldDim}`, fontSize:12, borderRadius:8 }} />
              <Legend iconType="circle" iconSize={7} wrapperStyle={{ fontFamily:'var(--font-semi)', fontSize:10.5, paddingTop:8 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ══ RENDIMIENTO POR CAMPAÑA ══ */}
      <SecHead label="Rendimiento por campaña (Meta)" />
      <div style={{ background:C.carbon, border:'1px solid rgba(255,255,255,.07)', borderRadius:8, marginBottom:28, overflow:'hidden', boxShadow:'0 4px 20px rgba(0,0,0,.4)' }}>
        <div style={{ display:'flex', alignItems:'center', gap:4, padding:'14px 20px', borderBottom:'1px solid rgba(255,255,255,.07)' }}>
          <span style={{ fontFamily:'var(--font-semi)', fontSize:10, fontWeight:700, letterSpacing:'2px', textTransform:'uppercase', color:C.text2, marginRight:12 }}>VER POR</span>
          {chartTabs.map(t => (
            <button key={t.k} onClick={()=>setChartTab(t.k)} style={{
              padding:'5px 14px', fontFamily:'var(--font-semi)', fontSize:10, fontWeight:700, letterSpacing:1.5, textTransform:'uppercase',
              cursor:'pointer', border:'none', background: chartTab===t.k ? t.color+'22' : 'transparent',
              color: chartTab===t.k ? t.color : C.text3,
              borderBottom: chartTab===t.k ? `2px solid ${t.color}` : '2px solid transparent',
              borderRadius:'4px 4px 0 0', transition:'all .15s',
            }}>{t.l}</button>
          ))}
          <span style={{ marginLeft:'auto', fontFamily:'var(--font-semi)', fontSize:10, color:C.text3 }}>
            {isDemo ? '8 campañas (demo)' : `${metaCampaigns.length} campañas`}
          </span>
        </div>
        <div style={{ padding:20 }}>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={chartData} layout="vertical" barSize={22}>
              <XAxis type="number" tick={{ fontSize:10, fill:C.text3 }} axisLine={false} tickLine={false} tickFormatter={v => chartTab==='spend'||chartTab==='cpl' ? `S/${v}` : v.toLocaleString()} />
              <YAxis type="category" dataKey="name" tick={{ fontSize:10, fill:'#9CA3AA', fontFamily:'var(--font-semi)' }} axisLine={false} tickLine={false} width={150} />
              <Tooltip content={<Tip />} />
              <Bar dataKey={chartTab} fill={activeColor} opacity={0.88} radius={[0,4,4,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ══ TENDENCIAS ══ */}
      <SecHead label="Tendencia semanal" />
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, marginBottom:20 }}>
        <div style={{ background:C.carbon, border:'1px solid rgba(255,255,255,.07)', borderRadius:8, overflow:'hidden', boxShadow:'0 4px 20px rgba(0,0,0,.4)' }}>
          <div style={{ padding:'14px 20px', borderBottom:'1px solid rgba(255,255,255,.07)', fontFamily:'var(--font-semi)', fontSize:10, fontWeight:700, letterSpacing:'2px', textTransform:'uppercase', color:C.text2 }}>
            INVERSIÓN META vs. GOOGLE
          </div>
          <div style={{ padding:20 }}>
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={trendData}>
                <defs>
                  <linearGradient id="gm" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor={C.blue} stopOpacity={0.35}/>
                    <stop offset="95%" stopColor={C.blue} stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="gg" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor={C.gold} stopOpacity={0.35}/>
                    <stop offset="95%" stopColor={C.gold} stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="s" tick={{ fontSize:10, fill:C.text3 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize:10, fill:C.text3 }} axisLine={false} tickLine={false} tickFormatter={v=>`${(v/1000).toFixed(0)}K`} />
                <CartesianGrid stroke="rgba(255,255,255,.04)" strokeDasharray="4 4" />
                <Tooltip content={<Tip />} />
                <Area type="monotone" dataKey="meta"   name="Meta"   stroke={C.blue} fill="url(#gm)" strokeWidth={2}/>
                <Area type="monotone" dataKey="google" name="Google" stroke={C.gold} fill="url(#gg)" strokeWidth={2}/>
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div style={{ background:C.carbon, border:'1px solid rgba(255,255,255,.07)', borderRadius:8, overflow:'hidden', boxShadow:'0 4px 20px rgba(0,0,0,.4)' }}>
          <div style={{ padding:'14px 20px', borderBottom:'1px solid rgba(255,255,255,.07)', fontFamily:'var(--font-semi)', fontSize:10, fontWeight:700, letterSpacing:'2px', textTransform:'uppercase', color:C.text2 }}>
            LEADS + CPL SEMANAL
          </div>
          <div style={{ padding:20 }}>
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={trendData}>
                <XAxis dataKey="s" tick={{ fontSize:10, fill:C.text3 }} axisLine={false} tickLine={false} />
                <YAxis yAxisId="l" tick={{ fontSize:10, fill:C.text3 }} axisLine={false} tickLine={false} />
                <YAxis yAxisId="c" orientation="right" tick={{ fontSize:10, fill:C.text3 }} axisLine={false} tickLine={false} tickFormatter={v=>`S/${v}`}/>
                <CartesianGrid stroke="rgba(255,255,255,.04)" strokeDasharray="4 4" />
                <Tooltip content={<Tip />} />
                <Line yAxisId="l" type="monotone" dataKey="leads" name="Leads"  stroke={C.green} strokeWidth={2.5} dot={{ fill:C.green, r:4 }}/>
                <Line yAxisId="c" type="monotone" dataKey="cpl"   name="CPL S/" stroke={C.gold}  strokeWidth={2}   dot={{ fill:C.gold,  r:3 }} strokeDasharray="5 3"/>
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {isDemo && (
        <div style={{ background:'rgba(220,161,69,.07)', border:'1px solid rgba(220,161,69,.25)', borderLeft:`3px solid ${C.gold}`, padding:'14px 18px', borderRadius:8, fontSize:13, color:C.text2, marginTop:8 }}>
          <strong style={{ color:C.gold }}>Datos demo —</strong> Ve a <strong>Config → Clientes</strong> y agrega los IDs de cuenta de {activeClient.name} para ver datos reales.
        </div>
      )}
    </div>
  );
}
