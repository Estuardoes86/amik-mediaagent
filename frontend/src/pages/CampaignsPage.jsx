import React, { useState } from 'react';
import { useMetaCampaigns, useGoogleCampaigns } from '../hooks/useData.js';
import { useApp } from '../context/AppContext.jsx';

export default function CampaignsPage() {
  const { activeClient } = useApp();
  const { campaigns: metaCampaigns, summary: metaSummary, loading: metaLoading, refetch: refetchMeta } = useMetaCampaigns();
  const { campaigns: googleCampaigns, summary: googleSummary, loading: googleLoading, refetch: refetchGoogle } = useGoogleCampaigns();
  const [tab, setTab] = useState('meta');

  const hasMetaId = !!activeClient.metaAccountId;
  const hasGoogleId = !!activeClient.googleCustomerId;

  // Demo Meta campaigns
  const demoCampaigns = [
    { id: 1, name: 'Admisiones 2026-II · Lima', status: 'ACTIVE', metrics: { spend: '2400', ctr: '2.9', impressions: '82000', clicks: '2378', actions: [{ action_type: 'lead', value: '54' }] } },
    { id: 2, name: 'Posgrados · Lima', status: 'ACTIVE', metrics: { spend: '1800', ctr: '1.8', impressions: '61000', clicks: '1098', actions: [{ action_type: 'lead', value: '29' }] } },
    { id: 3, name: 'Medicina Humana · Ica', status: 'ACTIVE', metrics: { spend: '1200', ctr: '3.1', impressions: '44000', clicks: '1364', actions: [{ action_type: 'lead', value: '32' }] } },
    { id: 4, name: 'Remarketing · Lima', status: 'PAUSED', metrics: { spend: '0', ctr: '1.1', impressions: '0', clicks: '0', actions: [] } },
  ];

  const demoGoogle = [
    { id: 1, name: 'Admisiones · Search · Lima', status: 'ENABLED', channelType: 'SEARCH', spend: 900, clicks: 1840, conversions: 42, ctr: 0.043, avgCpc: 0.49 },
    { id: 2, name: 'Remarketing · Display', status: 'ENABLED', channelType: 'DISPLAY', spend: 320, clicks: 580, conversions: 12, ctr: 0.008, avgCpc: 0.55 },
  ];

  const displayMeta = hasMetaId ? metaCampaigns : demoCampaigns;
  const displayGoogle = hasGoogleId ? googleCampaigns : demoGoogle;

  const getLeads = (campaign) => {
    return campaign.metrics?.actions?.find(a => a.action_type === 'lead')?.value || 0;
  };

  const getCpl = (campaign) => {
    const leads = getLeads(campaign);
    const spend = parseFloat(campaign.metrics?.spend || 0);
    return leads > 0 ? (spend / leads).toFixed(2) : '—';
  };

  return (
    <div className="scroll-y" style={{ flex: 1, padding: 24 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 16, marginBottom: 20 }}>
        <h1 style={{ fontSize: 18, fontWeight: 700 }}>Campañas</h1>
        <span style={{ fontSize: 12, color: 'var(--text3)' }}>{activeClient.name}</span>
        {!hasMetaId && !hasGoogleId && (
          <span style={{ fontSize: 11, color: 'var(--yellow)' }}>modo demo</span>
        )}
      </div>

      {/* Platform tabs */}
      <div style={{ display: 'flex', gap: 0, marginBottom: 20, borderBottom: '0.5px solid var(--border)' }}>
        {['meta', 'google'].map(p => (
          <button key={p} onClick={() => setTab(p)} style={{
            padding: '8px 20px', fontSize: 11, fontWeight: 700, letterSpacing: 1,
            cursor: 'pointer', border: 'none', background: 'transparent',
            color: tab === p ? 'var(--text)' : 'var(--text3)',
            borderBottom: tab === p ? '2px solid var(--accent)' : '2px solid transparent',
            textTransform: 'uppercase'
          }}>
            {p === 'meta' ? `META ADS (${displayMeta.length})` : `GOOGLE ADS (${displayGoogle.length})`}
          </button>
        ))}
        <button
          onClick={() => { refetchMeta(); refetchGoogle(); }}
          className="btn btn-ghost btn-sm"
          style={{ marginLeft: 'auto', marginBottom: 2 }}
          disabled={metaLoading || googleLoading}
        >
          {(metaLoading || googleLoading) ? <span className="spinner" /> : '↻ Actualizar'}
        </button>
      </div>

      {/* Meta campaigns table */}
      {tab === 'meta' && (
        <div style={{ background: 'var(--bg2)', border: '0.5px solid var(--border)' }}>
          <table className="table">
            <thead>
              <tr>
                <th>CAMPAÑA</th>
                <th>ESTADO</th>
                <th style={{ textAlign: 'right' }}>INVERSIÓN</th>
                <th style={{ textAlign: 'right' }}>IMPRESIONES</th>
                <th style={{ textAlign: 'right' }}>CTR</th>
                <th style={{ textAlign: 'right' }}>LEADS</th>
                <th style={{ textAlign: 'right' }}>CPL</th>
              </tr>
            </thead>
            <tbody>
              {displayMeta.map(c => (
                <tr key={c.id}>
                  <td style={{ fontWeight: 500, maxWidth: 240 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span className="badge badge-meta">META</span>
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.name}</span>
                    </div>
                  </td>
                  <td>
                    <span className={`status-dot ${c.status === 'ACTIVE' || c.status === 'ACTIVE' ? 'active' : 'paused'}`}>
                      {c.status === 'ACTIVE' ? 'activa' : 'pausada'}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right', fontFamily: 'var(--mono)' }}>
                    S/ {parseFloat(c.metrics?.spend || 0).toLocaleString()}
                  </td>
                  <td style={{ textAlign: 'right', fontFamily: 'var(--mono)' }}>
                    {parseInt(c.metrics?.impressions || 0).toLocaleString()}
                  </td>
                  <td style={{ textAlign: 'right' }}>{parseFloat(c.metrics?.ctr || 0).toFixed(2)}%</td>
                  <td style={{ textAlign: 'right', color: 'var(--green)', fontWeight: 600 }}>
                    {getLeads(c)}
                  </td>
                  <td style={{ textAlign: 'right', color: 'var(--text2)' }}>
                    {getCpl(c) !== '—' ? `S/ ${getCpl(c)}` : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Meta summary row */}
          <div style={{
            display: 'flex', gap: 32, padding: '12px 16px',
            borderTop: '0.5px solid var(--border)', background: 'var(--bg3)',
            fontSize: 12
          }}>
            <span style={{ color: 'var(--text3)' }}>TOTAL</span>
            <span>Inversión: <strong>S/ {parseInt(metaSummary.spend || displayMeta.reduce((s,c) => s + parseFloat(c.metrics?.spend||0),0)).toLocaleString()}</strong></span>
            <span>Leads: <strong style={{ color: 'var(--green)' }}>
              {metaSummary.leads || displayMeta.reduce((s,c) => s + parseInt(getLeads(c)||0),0)}
            </strong></span>
          </div>
        </div>
      )}

      {/* Google campaigns table */}
      {tab === 'google' && (
        <div style={{ background: 'var(--bg2)', border: '0.5px solid var(--border)' }}>
          <table className="table">
            <thead>
              <tr>
                <th>CAMPAÑA</th>
                <th>TIPO</th>
                <th>ESTADO</th>
                <th style={{ textAlign: 'right' }}>INVERSIÓN</th>
                <th style={{ textAlign: 'right' }}>CLICKS</th>
                <th style={{ textAlign: 'right' }}>CTR</th>
                <th style={{ textAlign: 'right' }}>CONVERSIONES</th>
                <th style={{ textAlign: 'right' }}>CPC PROM</th>
              </tr>
            </thead>
            <tbody>
              {displayGoogle.map(c => (
                <tr key={c.id}>
                  <td style={{ fontWeight: 500, maxWidth: 220 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span className="badge badge-google">GOOGLE</span>
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.name}</span>
                    </div>
                  </td>
                  <td style={{ color: 'var(--text3)', fontSize: 11 }}>{c.channelType}</td>
                  <td>
                    <span className={`status-dot ${c.status === 'ENABLED' ? 'active' : 'paused'}`}>
                      {c.status === 'ENABLED' ? 'activa' : 'pausada'}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right', fontFamily: 'var(--mono)' }}>S/ {parseFloat(c.spend||0).toFixed(0)}</td>
                  <td style={{ textAlign: 'right' }}>{parseInt(c.clicks||0).toLocaleString()}</td>
                  <td style={{ textAlign: 'right' }}>{(parseFloat(c.ctr||0)*100).toFixed(2)}%</td>
                  <td style={{ textAlign: 'right', color: 'var(--green)', fontWeight: 600 }}>{parseFloat(c.conversions||0).toFixed(0)}</td>
                  <td style={{ textAlign: 'right' }}>S/ {parseFloat(c.avgCpc||0).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
