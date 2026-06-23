import React, { useMemo, useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, CartesianGrid, PieChart, Pie, Cell, Legend, AreaChart, Area
} from 'recharts';
import { useMetaCampaigns, useGoogleCampaigns, useMetaInsights } from '../hooks/useData.js';
import { useApp } from '../context/AppContext.jsx';

const C = {
  gold: '#DCA145', green: '#2DD4A0', blue: '#5B8DB8',
  red: '#E8445A', slate: '#30373F', text3: '#5C6470'
};

const Tooltip_ = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: '#1C1C25', border: '1px solid rgba(220,161,69,.25)',
      padding: '10px 16px', borderRadius: 8, fontSize: 12,
      boxShadow: '0 8px 24px rgba(0,0,0,.5)'
    }}>
      <div style={{ color: '#9CA3AA', marginBottom: 6, fontFamily: 'var(--font-semi)', fontSize: 10, letterSpacing: 1, textTransform: 'uppercase' }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.color, fontFamily: 'var(--font-semi)', fontWeight: 600 }}>
          {p.name}: <span style={{ color: '#F0EDE8' }}>{p.value?.toLocaleString?.() ?? p.value}</span>
        </div>
      ))}
    </div>
  );
};

function KpiCard({ label, value, sub, delta, deltaDir, accent, delay }) {
  return (
    <div className={`kpi-card ${accent || ''}`} style={{ animationDelay: `${delay || 0}s` }}>
      <div className="kpi-label">{label}</div>
      <div className={`kpi-value ${accent === 'accent' ? 'gold-val' : accent === 'green' ? 'green-val' : ''}`}>
        {value ?? '—'}
      </div>
      {delta && (
        <div className={`kpi-delta ${deltaDir}`}>
          {deltaDir === 'up' ? '▲' : '▼'} {delta}
        </div>
      )}
      {sub && <div className="kpi-sub">{sub}</div>}
    </div>
  );
}

export default function MetricsPage() {
  const { activeClient } = useApp();
  const { campaigns: metaCampaigns, summary: metaSummary, loading: metaLoading } = useMetaCampaigns();
  const { campaigns: googleCampaigns, summary: googleSummary, loading: googleLoading } = useGoogleCampaigns();
  const [chartTab, setChartTab] = useState('spend');

  const hasMetaId  = !!activeClient.metaAccountId;
  const hasGoogleId = !!activeClient.googleCustomerId;
  const isDemo = !hasMetaId && !hasGoogleId;
  const isLoading = metaLoading || googleLoading;

  /* ── Computed numbers ── */
  const metaSpend  = parseFloat(metaSummary.spend  || 0);
  const googleSpend= parseFloat(googleSummary.spend || 0);
  const totalSpend = metaSpend + googleSpend;

  const metaLeads  = parseInt(metaSummary.leads || 0);
  const googleConv = parseInt(googleSummary.conversions || 0);
  const totalLeads = metaLeads + googleConv;

  const metaClics  = parseInt(metaSummary.clicks || 0);
  const googleClics= parseInt(googleSummary.clicks || 0);
  const totalClics = metaClics + googleClics;

  const metaImpr   = parseInt(metaSummary.impressions || 0);
  const metaCtr    = parseFloat(metaSummary.ctr  || 0);
  const metaCpm    = parseFloat(metaSummary.cpm  || 0);

  const cplMeta    = metaLeads  > 0 ? (metaSpend  / metaLeads ).toFixed(2) : null;
  const cplGoogle  = googleConv > 0 ? (googleSpend/ googleConv).toFixed(2) : null;
  const cplTotal   = totalLeads > 0 ? (totalSpend / totalLeads).toFixed(2) : null;
  const cpcGoogle  = googleClics> 0 ? (googleSpend/ googleClics).toFixed(2): null;

  /* ── Demo values ── */
  const D = {
    spend: 'S/ 184,000', metaSpend: 'S/ 142,000', googleSpend: 'S/ 42,000',
    leads: '3,847', metaLeads: '3,207', googleConv: '640',
    cplTotal: 'S/ 47.83', cplMeta: 'S/ 44.27', cplGoogle: 'S/ 65.63',
    clics: '28,420', metaClics: '20,000', googleClics: '8,420',
    impr: '18.7M', ctr: '2.8%', cpm: 'S/ 7.58',
    cpc: 'S/ 4.99', campActivas: '6', alcance: '2.1M',
  };

  /* ── Campaign chart ── */
  const campaignData = useMemo(() => {
    if (metaCampaigns.length > 0) {
      return metaCampaigns.slice(0, 8).map(c => {
        const spend = parseFloat(c.metrics?.spend || 0);
        const leads = parseInt(c.metrics?.actions?.find(a => a.action_type === 'lead')?.value || 0);
        const clics = parseInt(c.metrics?.clicks || 0);
        const impr  = parseInt(c.metrics?.impressions || 0);
        const cpl   = leads > 0 ? parseFloat((spend / leads).toFixed(2)) : 0;
        return {
          name: (c.name || '').replace(/2026_\d+_LEADS?_/i, '').replace(/_FORM$/i,'').substring(0, 20),
          spend: parseFloat(spend.toFixed(0)), leads, clics, impr, cpl
        };
      });
    }
    return [
      { name: 'MEDICINA HUMANA',    spend: 4200, leads: 94, clics: 2100, impr: 82000, cpl: 44.7 },
      { name: 'ENFERMERIA',         spend: 3800, leads: 88, clics: 1900, impr: 71000, cpl: 43.2 },
      { name: 'PSICOLOGIA',         spend: 2600, leads: 72, clics: 1400, impr: 54000, cpl: 36.1 },
      { name: 'DERECHO',            spend: 1800, leads: 48, clics: 980,  impr: 38000, cpl: 37.5 },
      { name: 'ADMINISTRACION',     spend: 1500, leads: 38, clics: 820,  impr: 31000, cpl: 39.5 },
      { name: 'DISTANCIA',          spend: 2900, leads: 102,clics: 1800, impr: 69000, cpl: 28.4 },
      { name: 'BRANDING',           spend: 1500, leads: 18, clics: 650,  impr: 43000, cpl: 83.3 },
    ];
  }, [metaCampaigns]);

  /* ── Tendencia semanal ── */
  const trendData = [
    { s: 'S1', meta: 38000, google: 9200, leads: 820, cpl: 54 },
    { s: 'S2', meta: 41000, google: 10100,leads: 910, cpl: 56 },
    { s: 'S3', meta: 44000, google: 10800,leads: 1020,cpl: 53 },
    { s: 'S4', meta: 40000, google: 9900, leads: 980, cpl: 51 },
    { s: 'S5', meta: 43500, google: 10400,leads: 1050,cpl: 51 },
    { s: 'S6', meta: 46000, google: 11200,leads: 1090,cpl: 52 },
  ];

  /* ── Pie data ── */
  const pieData = [
    { name: 'Meta Ads', value: isDemo ? 142000 : metaSpend },
    { name: 'Google Ads',value: isDemo ? 42000  : googleSpend },
  ];

  const chartTabs = [
    { k: 'spend', l: 'INVERSIÓN', color: C.gold },
    { k: 'leads', l: 'LEADS',     color: C.green },
    { k: 'clics', l: 'CLICS',     color: C.blue },
    { k: 'cpl',   l: 'CPL',       color: C.red },
  ];

  const activeColor = chartTabs.find(t => t.k === chartTab)?.color || C.gold;

  const fmtV = (v, k) => {
    if (k === 'spend' || k === 'cpl') return `S/ ${v?.toLocaleString?.()}`; 
    return v?.toLocaleString?.();
  };

  return (
    <div className="scroll-y" style={{ flex: 1, padding: '24px 28px', background: 'var(--bg)' }}>

      {/* ── Header ── */}
      <div className="page-header">
        <span className="page-title">Métricas</span>
        <span className="page-client">{activeClient.name}</span>
        {isDemo && <span style={{ fontSize: 10, color: 'var(--gold)', fontFamily: 'var(--font-semi)', fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', background: 'var(--gold-dim)', border: '1px solid var(--gold-border)', padding: '2px 9px', borderRadius: 20 }}>DEMO</span>}
        {!isDemo && isLoading && <span className="spinner" />}
        {!isDemo && !isLoading && (
          <button className="btn btn-ghost btn-sm" style={{ marginLeft: 'auto' }}>↻ Actualizar</button>
        )}
      </div>

      {/* ── KPI Grid — 4 cols ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
        <KpiCard accent="accent" label="CPL PROMEDIO TOTAL"
          value={cplTotal ? `S/ ${cplTotal}` : D.cplTotal}
          delta="-28% vs. mes ant." deltaDir="up"
          sub={`${isDemo ? '3,847' : totalLeads} leads · ${isDemo ? '6' : metaCampaigns.filter(c=>c.status==='ACTIVE').length} campañas activas`}
          delay={0} />
        <KpiCard accent="green" label="LEADS + CONVERSIONES"
          value={totalLeads > 0 ? totalLeads.toLocaleString() : D.leads}
          delta="+21% vs. mes ant." deltaDir="up"
          sub={`Meta <b>${isDemo ? '3,207' : metaLeads}</b> · Google <b>${isDemo ? '640' : googleConv}</b>`}
          delay={.05} />
        <KpiCard accent="slate" label="INVERSIÓN TOTAL"
          value={totalSpend > 0 ? `S/ ${parseInt(totalSpend).toLocaleString()}` : D.spend}
          sub={`Meta <b>${isDemo ? 'S/ 142K' : 'S/ '+parseInt(metaSpend).toLocaleString()}</b> · Google <b>${isDemo ? 'S/ 42K' : 'S/ '+parseInt(googleSpend).toLocaleString()}</b>`}
          delay={.10} />
        <KpiCard accent="blue" label="CLICS TOTALES"
          value={totalClics > 0 ? totalClics.toLocaleString() : D.clics}
          sub={`CTR Meta <b>${metaCtr > 0 ? metaCtr.toFixed(2)+'%' : D.ctr}</b>`}
          delay={.15} />
      </div>

      {/* ── 2nd KPI row ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 24 }}>
        <KpiCard label="CPL META ADS" accent="meta"
          value={cplMeta ? `S/ ${cplMeta}` : D.cplMeta}
          sub={`<b>${isDemo ? '3,207' : metaLeads}</b> leads generados`}
          delay={.18} />
        <KpiCard label="CPL GOOGLE ADS" accent="google"
          value={cplGoogle ? `S/ ${cplGoogle}` : D.cplGoogle}
          sub={`<b>${isDemo ? '640' : googleConv}</b> conversiones`}
          delay={.22} />
        <KpiCard label="IMPRESIONES META" accent="slate"
          value={metaImpr > 0 ? (metaImpr/1000000).toFixed(1)+'M' : D.impr}
          sub={`CPM <b>${metaCpm > 0 ? 'S/ '+metaCpm.toFixed(2) : D.cpm}</b>`}
          delay={.26} />
        <KpiCard label="CPC GOOGLE ADS" accent="slate"
          value={cpcGoogle ? `S/ ${cpcGoogle}` : D.cpc}
          sub={`<b>${isDemo ? '8,420' : googleClics.toLocaleString()}</b> clics pagados`}
          delay={.30} />
      </div>

      {/* ── Comparativo + Pie ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 320px', gap: 14, marginBottom: 20 }}>

        {/* Meta card */}
        <div className="platform-card meta">
          <div className="platform-label">Meta Ads</div>
          {[
            ['Inversión',   isDemo ? 'S/ 142,000' : `S/ ${parseInt(metaSpend).toLocaleString()}`],
            ['Leads',       isDemo ? '3,207' : metaLeads.toLocaleString()],
            ['CPL',         cplMeta ? `S/ ${cplMeta}` : D.cplMeta],
            ['Clics',       isDemo ? '20,000' : metaClics.toLocaleString()],
            ['CTR',         metaCtr > 0 ? `${metaCtr.toFixed(2)}%` : D.ctr],
            ['CPM',         metaCpm > 0 ? `S/ ${metaCpm.toFixed(2)}` : D.cpm],
            ['Impresiones', metaImpr > 0 ? `${(metaImpr/1000000).toFixed(1)}M` : D.impr],
          ].map(([k,v]) => (
            <div className="platform-row" key={k}><span>{k}</span><span>{v}</span></div>
          ))}
        </div>

        {/* Google card */}
        <div className="platform-card google">
          <div className="platform-label">Google Ads</div>
          {[
            ['Inversión',    isDemo ? 'S/ 42,000' : `S/ ${parseInt(googleSpend).toLocaleString()}`],
            ['Conversiones', isDemo ? '640' : googleConv.toLocaleString()],
            ['CPL',          cplGoogle ? `S/ ${cplGoogle}` : D.cplGoogle],
            ['Clics',        isDemo ? '8,420' : googleClics.toLocaleString()],
            ['CPC',          cpcGoogle ? `S/ ${cpcGoogle}` : D.cpc],
            ['Campañas',     isDemo ? '4' : googleCampaigns.length],
          ].map(([k,v]) => (
            <div className="platform-row" key={k}><span>{k}</span><span>{v}</span></div>
          ))}
        </div>

        {/* Pie */}
        <div className="chart-card" style={{ display:'flex', flexDirection:'column', justifyContent:'center' }}>
          <div className="chart-card-head" style={{ borderBottom: 'none', paddingBottom: 0 }}>
            <span className="chart-card-title">DISTRIBUCIÓN INVERSIÓN</span>
          </div>
          <div style={{ padding: '0 20px 16px' }}>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={52} outerRadius={76} dataKey="value" paddingAngle={4}>
                  <Cell fill={C.blue} />
                  <Cell fill={C.gold} />
                </Pie>
                <Tooltip formatter={v => `S/ ${parseInt(v).toLocaleString()}`}
                  contentStyle={{ background: '#1C1C25', border: '1px solid rgba(220,161,69,.25)', fontSize: 12, borderRadius: 8 }} />
                <Legend iconType="circle" iconSize={8}
                  wrapperStyle={{ fontFamily: 'var(--font-semi)', fontSize: 11, paddingTop: 8 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* ── Campaign chart con tabs ── */}
      <div className="chart-card" style={{ marginBottom: 20 }}>
        <div className="chart-card-head">
          <span className="chart-card-title">RENDIMIENTO POR CAMPAÑA</span>
          <div style={{ display:'flex', gap:2, marginLeft:16 }}>
            {chartTabs.map(t => (
              <button key={t.k} className={`tab-btn${chartTab === t.k ? ' active' : ''}`}
                onClick={() => setChartTab(t.k)} style={{ color: chartTab === t.k ? t.color : undefined, borderBottomColor: chartTab === t.k ? t.color : undefined }}>
                {t.l}
              </button>
            ))}
          </div>
          <span className="chart-card-sub" style={{ marginLeft:'auto' }}>{isDemo ? '7 campañas (demo)' : `${metaCampaigns.length} campañas`}</span>
        </div>
        <div className="chart-card-body">
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={campaignData} layout="vertical" barSize={20}>
              <XAxis type="number" tick={{ fontSize: 10, fill: C.text3 }} axisLine={false} tickLine={false} tickFormatter={v => chartTab === 'spend' || chartTab === 'cpl' ? `S/${v}` : v} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: '#9CA3AA', fontFamily: 'var(--font-semi)' }} axisLine={false} tickLine={false} width={140} />
              <Tooltip content={<Tooltip_ />} formatter={(v,n) => [fmtV(v, chartTab), chartTabs.find(t=>t.k===chartTab)?.l]} />
              <Bar dataKey={chartTab} fill={activeColor} opacity={0.88} radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── Tendencia semanal ── */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, marginBottom:20 }}>

        <div className="chart-card">
          <div className="chart-card-head">
            <span className="chart-card-title">TENDENCIA INVERSIÓN SEMANAL</span>
          </div>
          <div className="chart-card-body">
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={trendData}>
                <defs>
                  <linearGradient id="gmeta" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor={C.blue} stopOpacity={0.3}/>
                    <stop offset="95%" stopColor={C.blue} stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="ggoogle" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor={C.gold} stopOpacity={0.3}/>
                    <stop offset="95%" stopColor={C.gold} stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="s" tick={{ fontSize: 10, fill: C.text3 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: C.text3 }} axisLine={false} tickLine={false} tickFormatter={v=>`${(v/1000).toFixed(0)}K`} />
                <CartesianGrid stroke="rgba(255,255,255,.04)" strokeDasharray="4 4" />
                <Tooltip content={<Tooltip_ />} />
                <Area type="monotone" dataKey="meta"   name="Meta"   stroke={C.blue} fill="url(#gmeta)"   strokeWidth={2} />
                <Area type="monotone" dataKey="google" name="Google" stroke={C.gold} fill="url(#ggoogle)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="chart-card">
          <div className="chart-card-head">
            <span className="chart-card-title">TENDENCIA LEADS + CPL</span>
          </div>
          <div className="chart-card-body">
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={trendData}>
                <XAxis dataKey="s" tick={{ fontSize: 10, fill: C.text3 }} axisLine={false} tickLine={false} />
                <YAxis yAxisId="l" tick={{ fontSize: 10, fill: C.text3 }} axisLine={false} tickLine={false} />
                <YAxis yAxisId="c" orientation="right" tick={{ fontSize: 10, fill: C.text3 }} axisLine={false} tickLine={false} tickFormatter={v=>`S/${v}`} />
                <CartesianGrid stroke="rgba(255,255,255,.04)" strokeDasharray="4 4" />
                <Tooltip content={<Tooltip_ />} />
                <Line yAxisId="l" type="monotone" dataKey="leads" name="Leads"  stroke={C.green} strokeWidth={2.5} dot={{ fill: C.green, r: 4 }} />
                <Line yAxisId="c" type="monotone" dataKey="cpl"   name="CPL S/" stroke={C.gold}  strokeWidth={2}   dot={{ fill: C.gold,  r: 3 }} strokeDasharray="5 3" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Demo notice */}
      {isDemo && (
        <div className="demo-notice">
          <strong>Datos demo —</strong> Ve a <strong>Config → Clientes</strong> y agrega los IDs de Meta Ads y Google Ads de {activeClient.name} para ver datos reales.
        </div>
      )}
    </div>
  );
}
