import React, { useState, useMemo } from 'react';
import { useMetaCampaigns, useGoogleCampaigns } from '../hooks/useData.js';
import { useApp } from '../context/AppContext.jsx';

export default function CampaignsPage() {
  const { activeClient } = useApp();
  const { campaigns: metaCampaigns, summary: metaSummary, loading: metaLoading, refetch: refetchMeta } = useMetaCampaigns();
  const { campaigns: googleCampaigns, summary: googleSummary, loading: googleLoading, refetch: refetchGoogle } = useGoogleCampaigns();
  const [tab, setTab] = useState('meta');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortKey, setSortKey] = useState('spend');
  const [sortDir, setSortDir] = useState('desc');
  const [search, setSearch] = useState('');

  const hasMetaId = !!activeClient.metaAccountId;
  const hasGoogleId = !!activeClient.googleCustomerId;

  // Demo data
  const demoCampaigns = [
    { id: 1, name: '2026_2_LEADS_MEDICINA_HUMANA_FORM', status: 'ACTIVE', metrics: { spend: '2400', ctr: '2.9', impressions: '82000', clicks: '2378', actions: [{ action_type: 'lead', value: '54' }] } },
    { id: 2, name: '2026_2_LEADS_ENFERMERIA_FORM', status: 'ACTIVE', metrics: { spend: '1800', ctr: '1.8', impressions: '61000', clicks: '1098', actions: [{ action_type: 'lead', value: '29' }] } },
    { id: 3, name: '2026_2_LEADS_PSICOLOGIA_FORM', status: 'ACTIVE', metrics: { spend: '1200', ctr: '3.1', impressions: '44000', clicks: '1364', actions: [{ action_type: 'lead', value: '32' }] } },
    { id: 4, name: '2026_2_LEADS_DERECHO_FORM', status: 'ACTIVE', metrics: { spend: '980', ctr: '2.3', impressions: '38000', clicks: '874', actions: [{ action_type: 'lead', value: '21' }] } },
    { id: 5, name: '2026_2_LEADS_ADMINISTRACION_FORM', status: 'ACTIVE', metrics: { spend: '1100', ctr: '2.1', impressions: '42000', clicks: '882', actions: [{ action_type: 'lead', value: '19' }] } },
    { id: 6, name: '2026_2_REMARKETING_LIMA', status: 'PAUSED', metrics: { spend: '0', ctr: '1.1', impressions: '0', clicks: '0', actions: [] } },
  ];

  const demoGoogle = [
    { id: 1, name: 'Admisiones · Search · Lima', status: 'ENABLED', channelType: 'SEARCH', spend: 900, clicks: 1840, conversions: 42, ctr: 0.043, avgCpc: 0.49 },
    { id: 2, name: 'Medicina · Search · Nacional', status: 'ENABLED', channelType: 'SEARCH', spend: 640, clicks: 1120, conversions: 28, ctr: 0.038, avgCpc: 0.57 },
    { id: 3, name: 'Remarketing · Display', status: 'ENABLED', channelType: 'DISPLAY', spend: 320, clicks: 580, conversions: 12, ctr: 0.008, avgCpc: 0.55 },
    { id: 4, name: 'Posgrado · Search', status: 'PAUSED', channelType: 'SEARCH', spend: 0, clicks: 0, conversions: 0, ctr: 0, avgCpc: 0 },
  ];

  const displayMeta = hasMetaId ? metaCampaigns : demoCampaigns;
  const displayGoogle = hasGoogleId ? googleCampaigns : demoGoogle;

  const getLeads = (c) => parseInt(c.metrics?.actions?.find(a => a.action_type === 'lead')?.value || 0);
  const getSpend = (c) => parseFloat(c.metrics?.spend || 0);
  const getClics = (c) => parseInt(c.metrics?.clicks || 0);
  const getCpl = (c) => { const l = getLeads(c), s = getSpend(c); return l > 0 ? (s / l) : null; };

  // Sort handler
  const handleSort = (key) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('desc'); }
  };

  // Filtered + sorted Meta
  const filteredMeta = useMemo(() => {
    let rows = [...displayMeta];
    if (statusFilter !== 'all') rows = rows.filter(c => statusFilter === 'active' ? c.status === 'ACTIVE' : c.status !== 'ACTIVE');
    if (search) rows = rows.filter(c => c.name?.toLowerCase().includes(search.toLowerCase()));
    rows.sort((a, b) => {
      let av, bv;
      if (sortKey === 'spend') { av = getSpend(a); bv = getSpend(b); }
      else if (sortKey === 'leads') { av = getLeads(a); bv = getLeads(b); }
      else if (sortKey === 'cpl') { av = getCpl(a) ?? 999999; bv = getCpl(b) ?? 999999; }
      else if (sortKey === 'clics') { av = getClics(a); bv = getClics(b); }
      else if (sortKey === 'ctr') { av = parseFloat(a.metrics?.ctr || 0); bv = parseFloat(b.metrics?.ctr || 0); }
      else { av = a.name || ''; bv = b.name || ''; return sortDir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av); }
      return sortDir === 'asc' ? av - bv : bv - av;
    });
    return rows;
  }, [displayMeta, statusFilter, search, sortKey, sortDir]);

  // Filtered + sorted Google
  const filteredGoogle = useMemo(() => {
    let rows = [...displayGoogle];
    if (statusFilter !== 'all') rows = rows.filter(c => statusFilter === 'active' ? c.status === 'ENABLED' : c.status !== 'ENABLED');
    if (search) rows = rows.filter(c => c.name?.toLowerCase().includes(search.toLowerCase()));
    rows.sort((a, b) => {
      let av, bv;
      if (sortKey === 'spend') { av = parseFloat(a.spend || 0); bv = parseFloat(b.spend || 0); }
      else if (sortKey === 'leads') { av = parseFloat(a.conversions || 0); bv = parseFloat(b.conversions || 0); }
      else if (sortKey === 'clics') { av = parseInt(a.clicks || 0); bv = parseInt(b.clicks || 0); }
      else if (sortKey === 'ctr') { av = parseFloat(a.ctr || 0); bv = parseFloat(b.ctr || 0); }
      else { av = a.name || ''; bv = b.name || ''; return sortDir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av); }
      return sortDir === 'asc' ? av - bv : bv - av;
    });
    return rows;
  }, [displayGoogle, statusFilter, search, sortKey, sortDir]);

  // Totals Meta
  const metaTotals = useMemo(() => {
    const spend = filteredMeta.reduce((s, c) => s + getSpend(c), 0);
    const leads = filteredMeta.reduce((s, c) => s + getLeads(c), 0);
    const clics = filteredMeta.reduce((s, c) => s + getClics(c), 0);
    const cpl = leads > 0 ? spend / leads : null;
    return { spend, leads, clics, cpl };
  }, [filteredMeta]);

  const SortTh = ({ label, k, align = 'right' }) => (
    <th onClick={() => handleSort(k)} style={{ textAlign: align, cursor: 'pointer', userSelect: 'none' }}>
      {label} <span style={{ opacity: sortKey === k ? 1 : 0.3, fontSize: 9 }}>{sortDir === 'asc' ? '▲' : '▼'}</span>
    </th>
  );

  return (
    <div className="scroll-y" style={{ flex: 1, padding: 24 }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 16, marginBottom: 16 }}>
        <h1 style={{ fontSize: 18, fontWeight: 700 }}>Campañas</h1>
        <span style={{ fontSize: 12, color: 'var(--text3)' }}>{activeClient.name}</span>
        {!hasMetaId && !hasGoogleId && <span style={{ fontSize: 11, color: 'var(--yellow)' }}>modo demo</span>}
      </div>

      {/* Filters bar */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, alignItems: 'center', flexWrap: 'wrap' }}>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Buscar campaña..."
          style={{ width: 220, padding: '6px 12px', fontSize: 12 }}
        />
        {['all', 'active', 'paused'].map(s => (
          <button key={s} onClick={() => setStatusFilter(s)} className="btn btn-ghost btn-sm"
            style={{ borderColor: statusFilter === s ? 'var(--accent)' : undefined, color: statusFilter === s ? 'var(--accent)' : undefined }}>
            {s === 'all' ? 'Todas' : s === 'active' ? '● Activas' : '○ Pausadas'}
          </button>
        ))}
        <button
          onClick={() => { refetchMeta(); refetchGoogle(); }}
          className="btn btn-ghost btn-sm"
          style={{ marginLeft: 'auto' }}
          disabled={metaLoading || googleLoading}
        >
          {(metaLoading || googleLoading) ? <span className="spinner" /> : '↻ Actualizar'}
        </button>
      </div>

      {/* Platform tabs */}
      <div style={{ display: 'flex', gap: 0, marginBottom: 16, borderBottom: '0.5px solid var(--border)' }}>
        {[
          { key: 'meta', label: `META ADS (${filteredMeta.length})` },
          { key: 'google', label: `GOOGLE ADS (${filteredGoogle.length})` }
        ].map(p => (
          <button key={p.key} onClick={() => setTab(p.key)} style={{
            padding: '8px 20px', fontSize: 11, fontWeight: 700, letterSpacing: 1,
            cursor: 'pointer', border: 'none', background: 'transparent',
            color: tab === p.key ? 'var(--text)' : 'var(--text3)',
            borderBottom: tab === p.key ? '2px solid var(--accent)' : '2px solid transparent',
          }}>
            {p.label}
          </button>
        ))}
      </div>

      {/* ── META table ── */}
      {tab === 'meta' && (
        <div style={{ background: 'var(--bg2)', border: '0.5px solid var(--border)' }}>
          <table className="table">
            <thead>
              <tr>
                <SortTh label="CAMPAÑA" k="name" align="left" />
                <th>ESTADO</th>
                <SortTh label="INVERSIÓN" k="spend" />
                <SortTh label="IMPRESIONES" k="impressions" />
                <SortTh label="CLICS" k="clics" />
                <SortTh label="CTR" k="ctr" />
                <SortTh label="LEADS" k="leads" />
                <SortTh label="CPL" k="cpl" />
              </tr>
            </thead>
            <tbody>
              {filteredMeta.map(c => {
                const cpl = getCpl(c);
                return (
                  <tr key={c.id}>
                    <td style={{ fontWeight: 500, maxWidth: 280 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span className="badge badge-meta">META</span>
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 220 }}>{c.name}</span>
                      </div>
                    </td>
                    <td>
                      <span className={`status-dot ${c.status === 'ACTIVE' ? 'active' : 'paused'}`}>
                        {c.status === 'ACTIVE' ? 'activa' : 'pausada'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right', fontFamily: 'var(--mono)' }}>S/ {getSpend(c).toLocaleString()}</td>
                    <td style={{ textAlign: 'right', fontFamily: 'var(--mono)' }}>{parseInt(c.metrics?.impressions || 0).toLocaleString()}</td>
                    <td style={{ textAlign: 'right', fontFamily: 'var(--mono)' }}>{getClics(c).toLocaleString()}</td>
                    <td style={{ textAlign: 'right' }}>{parseFloat(c.metrics?.ctr || 0).toFixed(2)}%</td>
                    <td style={{ textAlign: 'right', color: 'var(--green)', fontWeight: 600 }}>{getLeads(c)}</td>
                    <td style={{ textAlign: 'right' }}>
                      {cpl !== null
                        ? <span style={{ color: cpl < 50 ? 'var(--green)' : cpl < 80 ? 'var(--yellow)' : 'var(--red)' }}>S/ {cpl.toFixed(2)}</span>
                        : <span style={{ color: 'var(--text3)' }}>—</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* Summary footer */}
          <div style={{ display: 'flex', gap: 32, padding: '12px 16px', borderTop: '0.5px solid var(--border)', background: 'var(--bg3)', fontSize: 12, flexWrap: 'wrap' }}>
            <span style={{ color: 'var(--text3)' }}>TOTAL · {filteredMeta.length} campañas</span>
            <span>Inversión: <strong style={{ fontFamily: 'var(--mono)' }}>S/ {metaTotals.spend.toLocaleString(undefined, { maximumFractionDigits: 0 })}</strong></span>
            <span>Clics: <strong>{metaTotals.clics.toLocaleString()}</strong></span>
            <span>Leads: <strong style={{ color: 'var(--green)' }}>{metaTotals.leads}</strong></span>
            <span>CPL prom: <strong style={{ color: metaTotals.cpl && metaTotals.cpl < 50 ? 'var(--green)' : 'var(--yellow)' }}>
              {metaTotals.cpl ? `S/ ${metaTotals.cpl.toFixed(2)}` : '—'}
            </strong></span>
          </div>
        </div>
      )}

      {/* ── GOOGLE table ── */}
      {tab === 'google' && (
        <div style={{ background: 'var(--bg2)', border: '0.5px solid var(--border)' }}>
          <table className="table">
            <thead>
              <tr>
                <SortTh label="CAMPAÑA" k="name" align="left" />
                <th>TIPO</th>
                <th>ESTADO</th>
                <SortTh label="INVERSIÓN" k="spend" />
                <SortTh label="CLICS" k="clics" />
                <SortTh label="CTR" k="ctr" />
                <SortTh label="CONV." k="leads" />
                <th style={{ textAlign: 'right' }}>CPC PROM</th>
              </tr>
            </thead>
            <tbody>
              {filteredGoogle.map(c => (
                <tr key={c.id}>
                  <td style={{ fontWeight: 500, maxWidth: 260 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span className="badge badge-google">GOOGLE</span>
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 200 }}>{c.name}</span>
                    </div>
                  </td>
                  <td style={{ color: 'var(--text3)', fontSize: 11 }}>{c.channelType}</td>
                  <td>
                    <span className={`status-dot ${c.status === 'ENABLED' ? 'active' : 'paused'}`}>
                      {c.status === 'ENABLED' ? 'activa' : 'pausada'}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right', fontFamily: 'var(--mono)' }}>S/ {parseFloat(c.spend || 0).toFixed(0)}</td>
                  <td style={{ textAlign: 'right' }}>{parseInt(c.clicks || 0).toLocaleString()}</td>
                  <td style={{ textAlign: 'right' }}>{(parseFloat(c.ctr || 0) * 100).toFixed(2)}%</td>
                  <td style={{ textAlign: 'right', color: 'var(--green)', fontWeight: 600 }}>{parseFloat(c.conversions || 0).toFixed(0)}</td>
                  <td style={{ textAlign: 'right' }}>S/ {parseFloat(c.avgCpc || 0).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Google summary footer */}
          <div style={{ display: 'flex', gap: 32, padding: '12px 16px', borderTop: '0.5px solid var(--border)', background: 'var(--bg3)', fontSize: 12, flexWrap: 'wrap' }}>
            <span style={{ color: 'var(--text3)' }}>TOTAL · {filteredGoogle.length} campañas</span>
            <span>Inversión: <strong style={{ fontFamily: 'var(--mono)' }}>S/ {filteredGoogle.reduce((s, c) => s + parseFloat(c.spend || 0), 0).toFixed(0)}</strong></span>
            <span>Clics: <strong>{filteredGoogle.reduce((s, c) => s + parseInt(c.clicks || 0), 0).toLocaleString()}</strong></span>
            <span>Conv.: <strong style={{ color: 'var(--green)' }}>{filteredGoogle.reduce((s, c) => s + parseFloat(c.conversions || 0), 0).toFixed(0)}</strong></span>
          </div>
        </div>
      )}
    </div>
  );
}
