import React, { useMemo, useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, CartesianGrid, PieChart, Pie, Cell, Legend
} from 'recharts';
import { useMetaCampaigns, useGoogleCampaigns, useMetaInsights } from '../hooks/useData.js';
import { useApp } from '../context/AppContext.jsx';

function KpiCard({ label, value, change, changeDir, subtitle, accent }) {
  return (
    <div style={{
      background: 'var(--bg2)', border: '0.5px solid var(--border)', padding: '20px',
      borderTop: accent ? `2px solid ${accent}` : undefined
    }}>
      <div style={{ fontSize: 11, color: 'var(--text3)', letterSpacing: '1px', marginBottom: 8 }}>{label}</div>
      <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--text)' }}>{value ?? '—'}</div>
      {change && (
        <div style={{ fontSize: 11, marginTop: 4, color: changeDir === 'up' ? 'var(--green)' : 'var(--red)' }}>
          {changeDir === 'up' ? '▲' : '▼'} {change}
        </div>
      )}
      {subtitle && <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 4 }}>{subtitle}</div>}
    </div>
  );
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: 'var(--bg3)', border: '0.5px solid var(--border2)', padding: '8px 14px', fontSize: 12 }}>
      <div style={{ color: 'var(--text2)', marginBottom: 4 }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.color }}>{p.name}: {p.value}</div>
      ))}
    </div>
  );
};

const PLATFORM_COLORS = { Meta: '#4a9eff', Google: '#f5c842' };

export default function MetricsPage() {
  const { activeClient } = useApp();
  const { campaigns: metaCampaigns, summary: metaSummary, loading: metaLoading } = useMetaCampaigns();
  const { campaigns: googleCampaigns, summary: googleSummary, loading: googleLoading } = useGoogleCampaigns();
  const { insights } = useMetaInsights();
  const [activeChart, setActiveChart] = useState('spend');

  const hasMetaId = !!activeClient.metaAccountId;
  const hasGoogleId = !!activeClient.googleCustomerId;
  const isDemo = !hasMetaId && !hasGoogleId;
  const isLoading = metaLoading || googleLoading;

  // ── Computed totals ──────────────────────────────────────────────
  const metaSpend = parseFloat(metaSummary.spend || 0);
  const googleSpend = parseFloat(googleSummary.spend || 0);
  const totalSpend = metaSpend + googleSpend;

  const metaLeads = parseInt(metaSummary.leads || 0);
  const googleConv = parseInt(googleSummary.conversions || 0);
  const totalLeads = metaLeads + googleConv;

  const metaClics = parseInt(metaSummary.clicks || 0);
  const googleClics = parseInt(googleSummary.clicks || 0);
  const totalClics = metaClics + googleClics;

  const cplMeta = metaLeads > 0 ? (metaSpend / metaLeads).toFixed(2) : null;
  const cplGoogle = googleConv > 0 ? (googleSpend / googleConv).toFixed(2) : null;
  const cplTotal = totalLeads > 0 ? (totalSpend / totalLeads).toFixed(2) : null;

  const metaCtr = parseFloat(metaSummary.ctr || 0);
  const metaCpm = parseFloat(metaSummary.cpm || 0);

  // ── Campaign-level chart data ────────────────────────────────────
  const campaignChart = useMemo(() => {
    if (metaCampaigns.length > 0) {
      return metaCampaigns.slice(0, 10).map(c => {
        const spend = parseFloat(c.metrics?.spend || 0);
        const leads = parseInt(c.metrics?.actions?.find(a => a.action_type === 'lead')?.value || 0);
        const clics = parseInt(c.metrics?.clicks || 0);
        const cpl = leads > 0 ? parseFloat((spend / leads).toFixed(2)) : 0;
        return {
          name: (c.name || 'Campaña').replace(/2026_\d+_/g, '').substring(0, 22),
          spend: parseFloat(spend.toFixed(0)),
          leads,
          clics,
          cpl
        };
      });
    }
    return [
      { name: 'Admisiones Lima', spend: 4200, leads: 88, clics: 2100, cpl: 47.7 },
      { name: 'Posgrados Lima', spend: 3800, leads: 72, clics: 1900, cpl: 52.8 },
      { name: 'Medicina Ica', spend: 2600, leads: 94, clics: 1400, cpl: 27.7 },
      { name: 'Remarketing', spend: 1800, leads: 55, clics: 980, cpl: 32.7 },
      { name: 'Distancia', spend: 2900, leads: 102, clics: 1800, cpl: 28.4 },
      { name: 'Branding', spend: 1500, leads: 18, clics: 650, cpl: 83.3 },
    ];
  }, [metaCampaigns]);

  // ── Platform pie data ────────────────────────────────────────────
  const pieData = [
    { name: 'Meta Ads', value: isDemo ? 142000 : metaSpend },
    { name: 'Google Ads', value: isDemo ? 42000 : googleSpend },
  ];

  // ── Trend (demo weekly) ──────────────────────────────────────────
  const trendData = [
    { week: 'S1', meta: 38000, google: 9200, leads: 88 },
    { week: 'S2', meta: 41000, google: 10100, leads: 97 },
    { week: 'S3', week: 'S3', meta: 44000, google: 10800, leads: 112 },
    { week: 'S4', meta: 40000, google: 9900, leads: 103 },
  ];

  const chartTabs = [
    { key: 'spend', label: 'INVERSIÓN' },
    { key: 'leads', label: 'LEADS' },
    { key: 'clics', label: 'CLICS' },
    { key: 'cpl', label: 'CPL' },
  ];

  return (
    <div className="scroll-y" style={{ flex: 1, padding: 24 }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 16, marginBottom: 20 }}>
        <h1 style={{ fontSize: 18, fontWeight: 700 }}>Métricas</h1>
        <span style={{ fontSize: 12, color: 'var(--text3)' }}>
          {activeClient.name}
          {isDemo && <span style={{ color: 'var(--yellow)', marginLeft: 8 }}>modo demo</span>}
          {!isDemo && isLoading && <span style={{ marginLeft: 8 }}>cargando...</span>}
        </span>
      </div>

      {/* ── KPI Grid ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 1, background: 'var(--border)', marginBottom: 24 }}>
        <KpiCard
          label="CPL TOTAL"
          value={cplTotal ? `S/ ${cplTotal}` : isDemo ? 'S/ 48.20' : '—'}
          change="-28% vs. mes ant."
          changeDir="up"
          accent="var(--accent)"
        />
        <KpiCard
          label="CPL META ADS"
          value={cplMeta ? `S/ ${cplMeta}` : isDemo ? 'S/ 45.10' : '—'}
          subtitle={isDemo ? '115 leads · Meta' : metaLeads > 0 ? `${metaLeads} leads` : undefined}
          accent="#4a9eff"
        />
        <KpiCard
          label="CPL GOOGLE ADS"
          value={cplGoogle ? `S/ ${cplGoogle}` : isDemo ? 'S/ 65.60' : '—'}
          subtitle={isDemo ? '640 conv. · Google' : googleConv > 0 ? `${googleConv} conv.` : undefined}
          accent="#f5c842"
        />
        <KpiCard
          label="LEADS + CONV. TOTALES"
          value={totalLeads > 0 ? totalLeads.toLocaleString() : isDemo ? '3,847' : '—'}
          change="+21%"
          changeDir="up"
        />
        <KpiCard
          label="INVERSIÓN TOTAL"
          value={totalSpend > 0 ? `S/ ${parseInt(totalSpend).toLocaleString()}` : isDemo ? 'S/ 184,000' : '—'}
        />
        <KpiCard
          label="CLICS TOTALES"
          value={totalClics > 0 ? totalClics.toLocaleString() : isDemo ? '28,420' : '—'}
          subtitle={metaCtr > 0 ? `CTR ${metaCtr.toFixed(2)}%` : isDemo ? 'CTR 2.8%' : undefined}
        />
        <KpiCard
          label="CPM META"
          value={metaCpm > 0 ? `S/ ${metaCpm.toFixed(2)}` : isDemo ? 'S/ 12.40' : '—'}
        />
        <KpiCard
          label="CAMPAÑAS ACTIVAS"
          value={metaCampaigns.filter(c => c.status === 'ACTIVE').length || (isDemo ? 6 : 0)}
        />
      </div>

      {/* ── Comparativo plataformas ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 1, background: 'var(--border)', marginBottom: 24 }}>

        {/* Platform bars */}
        <div style={{ background: 'var(--bg2)', padding: 20 }}>
          <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 4, letterSpacing: '0.5px' }}>COMPARATIVO META vs. GOOGLE</div>
          <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 16 }}>Inversión, leads y eficiencia por plataforma</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {[
              { label: 'Meta Ads', color: '#4a9eff', spend: isDemo ? 142000 : metaSpend, leads: isDemo ? 3207 : metaLeads, cpl: isDemo ? '44.27' : cplMeta, clics: isDemo ? 20000 : metaClics },
              { label: 'Google Ads', color: '#f5c842', spend: isDemo ? 42000 : googleSpend, leads: isDemo ? 640 : googleConv, cpl: isDemo ? '65.63' : cplGoogle, clics: isDemo ? 8420 : googleClics },
            ].map(p => (
              <div key={p.label} style={{ background: 'var(--bg3)', padding: 16, borderTop: `2px solid ${p.color}` }}>
                <div style={{ fontSize: 11, color: p.color, fontWeight: 700, letterSpacing: 1, marginBottom: 12 }}>{p.label}</div>
                {[
                  ['Inversión', `S/ ${parseInt(p.spend).toLocaleString()}`],
                  ['Leads / Conv.', parseInt(p.leads).toLocaleString()],
                  ['CPL', p.cpl ? `S/ ${p.cpl}` : '—'],
                  ['Clics', parseInt(p.clics).toLocaleString()],
                ].map(([k, v]) => (
                  <div key={k} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 8 }}>
                    <span style={{ color: 'var(--text3)' }}>{k}</span>
                    <span style={{ fontWeight: 600 }}>{v}</span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* Pie chart */}
        <div style={{ background: 'var(--bg2)', padding: 20 }}>
          <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 4, letterSpacing: '0.5px' }}>DISTRIBUCIÓN INVERSIÓN</div>
          <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 8 }}>% por plataforma</div>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} dataKey="value" paddingAngle={3}>
                {pieData.map((entry, i) => (
                  <Cell key={i} fill={Object.values(PLATFORM_COLORS)[i]} />
                ))}
              </Pie>
              <Tooltip formatter={(v) => `S/ ${parseInt(v).toLocaleString()}`} contentStyle={{ background: 'var(--bg3)', border: '0.5px solid var(--border2)', fontSize: 12 }} />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── Campaign chart con tabs ── */}
      <div style={{ background: 'var(--bg2)', border: '0.5px solid var(--border)', marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', padding: '14px 20px', borderBottom: '0.5px solid var(--border)', gap: 0 }}>
          <div style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.5px', marginRight: 24 }}>POR CAMPAÑA</div>
          {chartTabs.map(t => (
            <button key={t.key} onClick={() => setActiveChart(t.key)} style={{
              padding: '4px 14px', fontSize: 11, fontWeight: 700, letterSpacing: 1,
              cursor: 'pointer', border: 'none', background: 'transparent',
              color: activeChart === t.key ? 'var(--accent)' : 'var(--text3)',
              borderBottom: activeChart === t.key ? '2px solid var(--accent)' : '2px solid transparent',
            }}>{t.label}</button>
          ))}
        </div>
        <div style={{ padding: 20 }}>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={campaignChart} barSize={18} layout="vertical">
              <XAxis type="number" tick={{ fontSize: 10, fill: '#555' }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: '#888' }} axisLine={false} tickLine={false} width={130} />
              <Tooltip content={<CustomTooltip />} />
              <Bar
                dataKey={activeChart}
                fill={activeChart === 'leads' ? 'var(--green)' : activeChart === 'cpl' ? 'var(--yellow)' : activeChart === 'clics' ? '#4a9eff' : 'var(--accent)'}
                opacity={0.85}
                radius={[0, 3, 3, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── Tendencia semanal ── */}
      <div style={{ background: 'var(--bg2)', border: '0.5px solid var(--border)', padding: 20, marginBottom: 24 }}>
        <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 4, letterSpacing: '0.5px' }}>TENDENCIA SEMANAL · INVERSIÓN</div>
        <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 16 }}>Meta vs. Google por semana</div>
        <ResponsiveContainer width="100%" height={180}>
          <LineChart data={trendData}>
            <XAxis dataKey="week" tick={{ fontSize: 10, fill: '#555' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 10, fill: '#555' }} axisLine={false} tickLine={false} />
            <CartesianGrid stroke="#1e1e1e" strokeDasharray="3 3" />
            <Tooltip content={<CustomTooltip />} />
            <Line type="monotone" dataKey="meta" name="Meta" stroke="#4a9eff" strokeWidth={2} dot={{ fill: '#4a9eff', r: 3 }} />
            <Line type="monotone" dataKey="google" name="Google" stroke="#f5c842" strokeWidth={2} dot={{ fill: '#f5c842', r: 3 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Notice */}
      {isDemo && (
        <div style={{ background: 'var(--yellow-dim)', border: '0.5px solid rgba(245,200,66,0.3)', padding: '14px 20px', fontSize: 13 }}>
          <strong style={{ color: 'var(--yellow)' }}>Datos demo —</strong>{' '}
          Ve a <strong>Config → Clientes</strong> y agrega los IDs de Meta Ads y Google Ads de {activeClient.name} para ver datos reales.
        </div>
      )}
    </div>
  );
}
