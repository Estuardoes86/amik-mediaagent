import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid } from 'recharts';
import { useMetaCampaigns, useGoogleCampaigns, useMetaInsights } from '../hooks/useData.js';
import { useApp } from '../context/AppContext.jsx';

function KpiCard({ label, value, change, changeDir, subtitle }) {
  return (
    <div style={{ background: 'var(--bg2)', border: '0.5px solid var(--border)', padding: '20px' }}>
      <div style={{ fontSize: 11, color: 'var(--text3)', letterSpacing: '1px', marginBottom: 8 }}>{label}</div>
      <div style={{ fontSize: 24, fontWeight: 700, color: change ? (changeDir === 'up' ? 'var(--green)' : 'var(--text)') : 'var(--text)' }}>
        {value ?? '—'}
      </div>
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

export default function MetricsPage() {
  const { activeClient } = useApp();
  const { campaigns: metaCampaigns, summary: metaSummary, loading: metaLoading } = useMetaCampaigns();
  const { campaigns: googleCampaigns, summary: googleSummary, loading: googleLoading } = useGoogleCampaigns();
  const { insights, loading: insightsLoading } = useMetaInsights();

  const hasMetaId = !!activeClient.metaAccountId;
  const hasGoogleId = !!activeClient.googleCustomerId;

  // Build chart data from real campaigns or show demo
  const chartData = useMemo(() => {
    if (metaCampaigns.length > 0) {
      return metaCampaigns.slice(0, 8).map(c => ({
        name: c.name?.substring(0, 18) + '...' || 'Campaign',
        spend: parseFloat(c.metrics?.spend || 0).toFixed(0),
        leads: c.metrics?.actions?.find(a => a.action_type === 'lead')?.value || 0
      }));
    }
    // Demo data
    return ['S1','S2','S3','S4','S5','S6','S7','S8'].map((s, i) => ({
      name: s, spend: [4200,3800,4600,4100,4800,4300,5100,4700][i],
      leads: [88,72,94,88,102,91,114,98][i]
    }));
  }, [metaCampaigns]);

  const totalSpend = (parseFloat(metaSummary.spend || 0) + parseFloat(googleSummary.spend || 0)).toFixed(0);
  const totalLeads = parseInt(metaSummary.leads || 0) + parseInt(googleSummary.conversions || 0);
  const cpl = totalLeads > 0 ? (totalSpend / totalLeads).toFixed(2) : null;

  const isDemo = !hasMetaId && !hasGoogleId;

  return (
    <div className="scroll-y" style={{ flex: 1, padding: 24 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 16, marginBottom: 20 }}>
        <h1 style={{ fontSize: 18, fontWeight: 700 }}>Métricas</h1>
        <span style={{ fontSize: 12, color: 'var(--text3)' }}>
          {activeClient.name} · {isDemo && <span style={{ color: 'var(--yellow)' }}>modo demo — configura IDs de cuenta en Settings</span>}
          {!isDemo && (metaLoading || googleLoading) && <span>cargando...</span>}
        </span>
      </div>

      {/* KPI Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 1, background: 'var(--border)', marginBottom: 24 }}>
        <KpiCard label="CPL PROMEDIO" value={cpl ? `S/ ${cpl}` : isDemo ? 'S/ 48' : '—'} change="-28% vs. mes ant." changeDir="up" />
        <KpiCard label="LEADS TOTALES" value={totalLeads > 0 ? totalLeads.toLocaleString() : isDemo ? '3,847' : '—'} change="+21%" changeDir="up" />
        <KpiCard label="INVERSIÓN TOTAL" value={totalSpend > 0 ? `S/ ${parseInt(totalSpend).toLocaleString()}` : isDemo ? 'S/ 184,000' : '—'} />
        <KpiCard label="CTR META" value={metaSummary.ctr ? `${metaSummary.ctr}%` : isDemo ? '2.8%' : '—'} change="-0.3%" changeDir="down" />
        <KpiCard label="CPM META" value={metaSummary.cpm ? `S/ ${metaSummary.cpm}` : isDemo ? 'S/ 12.40' : '—'} />
        <KpiCard label="CAMPAÑAS ACTIVAS" value={metaCampaigns.length || (isDemo ? 6 : 0)} />
      </div>

      {/* Charts row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, background: 'var(--border)', marginBottom: 24 }}>
        {/* Spend by campaign */}
        <div style={{ background: 'var(--bg2)', padding: 20 }}>
          <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 16, letterSpacing: '0.5px' }}>
            INVERSIÓN POR CAMPAÑA
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={chartData} barSize={16}>
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#555' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#555' }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="spend" fill="#ff4500" opacity={0.85} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Leads trend */}
        <div style={{ background: 'var(--bg2)', padding: 20 }}>
          <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 16, letterSpacing: '0.5px' }}>
            LEADS POR PERÍODO
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={chartData}>
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#555' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#555' }} axisLine={false} tickLine={false} />
              <CartesianGrid stroke="#1e1e1e" strokeDasharray="3 3" />
              <Tooltip content={<CustomTooltip />} />
              <Line type="monotone" dataKey="leads" stroke="#00c97a" strokeWidth={2} dot={{ fill: '#00c97a', r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Google campaigns summary */}
      {(googleCampaigns.length > 0 || isDemo) && (
        <div style={{ background: 'var(--bg2)', border: '0.5px solid var(--border)', padding: 20, marginBottom: 24 }}>
          <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 16, letterSpacing: '0.5px' }}>GOOGLE ADS — RESUMEN</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
            {[
              ['Inversión', googleSummary.spend ? `S/ ${parseFloat(googleSummary.spend).toFixed(0)}` : isDemo ? 'S/ 42,000' : '—'],
              ['Clicks', googleSummary.clicks?.toLocaleString() || (isDemo ? '8,420' : '—')],
              ['Conversiones', googleSummary.conversions?.toLocaleString() || (isDemo ? '640' : '—')],
              ['Campañas', googleCampaigns.length || (isDemo ? 4 : 0)]
            ].map(([k, v]) => (
              <div key={k}>
                <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 4 }}>{k}</div>
                <div style={{ fontSize: 18, fontWeight: 700 }}>{v}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* No config notice */}
      {!hasMetaId && !hasGoogleId && (
        <div style={{
          background: 'var(--yellow-dim)', border: '0.5px solid rgba(245,200,66,0.3)',
          padding: '16px 20px', borderRadius: 'var(--radius)', fontSize: 13
        }}>
          <strong style={{ color: 'var(--yellow)' }}>Configuración pendiente:</strong>
          {' '}Ve a <strong>Settings → Clientes</strong> y agrega los IDs de cuenta Meta Ads y Google Ads de {activeClient.name} para ver datos reales.
        </div>
      )}
    </div>
  );
}
