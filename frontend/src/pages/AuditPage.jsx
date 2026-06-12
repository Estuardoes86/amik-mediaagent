import React from 'react';
import { useAudit } from '../hooks/useData.js';
import { useApp } from '../context/AppContext.jsx';

function ScoreCircle({ score }) {
  const color = score >= 70 ? 'var(--green)' : score >= 50 ? 'var(--yellow)' : 'var(--accent)';
  return (
    <div style={{
      width: 88, height: 88, borderRadius: '50%',
      border: `3px solid ${color}`, display: 'flex',
      flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flexShrink: 0
    }}>
      <div style={{ fontSize: 26, fontWeight: 700, color }}>{score}</div>
      <div style={{ fontSize: 10, color: 'var(--text3)', letterSpacing: 1 }}>SCORE</div>
    </div>
  );
}

function TierBar({ label, score }) {
  const color = score >= 70 ? 'var(--green)' : score >= 50 ? 'var(--yellow)' : 'var(--accent)';
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 11 }}>
        <span style={{ color: 'var(--text3)' }}>{label}</span>
        <span style={{ color }}>{score}/100</span>
      </div>
      <div style={{ height: 3, background: 'var(--bg3)', borderRadius: 2 }}>
        <div style={{ height: '100%', width: `${score}%`, background: color, borderRadius: 2, transition: 'width 0.5s' }} />
      </div>
    </div>
  );
}

const DEMO_FINDINGS = [
  {
    priority: 'P0', tier: 'tracking', id: 'capi',
    title: 'CAPI deduplicación posiblemente rota',
    description: 'Sin cuenta conectada no podemos verificar. Conecta tu cuenta Meta Ads en Settings para diagnóstico real.',
    action: 'Configurar Meta Account ID en Settings → Clientes',
    impact: 'Bloquea optimización de conversiones'
  },
  {
    priority: 'P1', tier: 'structure', id: 'struct',
    title: 'ML Starvation: posible fragmentación de ad sets',
    description: 'Patrón común en cuentas de educación con múltiples carreras y segmentaciones.',
    action: 'Conecta cuenta para análisis real de ad sets',
    impact: 'Estimado: −15-25% CPL post-consolidación'
  }
];

export default function AuditPage() {
  const { activeClient } = useApp();
  const { auditData, loading, error, runAudit } = useAudit();

  const hasConfig = !!(activeClient.metaAccountId || activeClient.googleCustomerId);
  const findings = auditData?.findings || (hasConfig ? [] : DEMO_FINDINGS);
  const score = auditData?.score || (hasConfig ? null : 58);
  const tiers = auditData?.tiers;

  const priorityBorder = { P0: 'var(--accent)', P1: 'var(--yellow)', P2: 'var(--text3)' };

  return (
    <div className="scroll-y" style={{ flex: 1, padding: 24 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 20, marginBottom: 28 }}>
        {score !== null && <ScoreCircle score={score} />}
        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>
            Audit automático — {activeClient.name}
          </h1>
          <div style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 16 }}>
            {auditData
              ? `Ejecutado: ${new Date(auditData.runAt).toLocaleString('es-PE')}`
              : 'Sin audit ejecutado aún'}
          </div>

          {/* Tier scores */}
          {tiers && (
            <div style={{ maxWidth: 320 }}>
              <TierBar label="TIER 1 · Tracking" score={tiers.tracking.score} />
              <TierBar label="TIER 2 · Estructura" score={tiers.structure.score} />
              <TierBar label="TIER 3 · Señal" score={tiers.signal.score} />
            </div>
          )}

          <button
            className="btn btn-primary"
            style={{ marginTop: 16 }}
            onClick={runAudit}
            disabled={loading}
          >
            {loading ? <><span className="spinner" style={{ marginRight: 8 }} />Ejecutando audit...</> : '▶ EJECUTAR AUDIT AHORA'}
          </button>
          {!hasConfig && (
            <span style={{ fontSize: 11, color: 'var(--text3)', marginLeft: 12 }}>
              Configura IDs de cuenta en Settings para audit real
            </span>
          )}
        </div>
      </div>

      {error && (
        <div style={{ background: 'var(--red-dim)', border: '0.5px solid rgba(255,68,68,0.3)', padding: '12px 16px', marginBottom: 20, fontSize: 13 }}>
          Error: {error}
        </div>
      )}

      {/* Findings */}
      <div style={{ fontSize: 11, letterSpacing: 2, color: 'var(--text3)', marginBottom: 12 }}>
        // HALLAZGOS · {findings.length} detectados
      </div>

      {findings.length === 0 && !loading && (
        <div className="empty-state">
          <div style={{ fontSize: 32 }}>✓</div>
          <p>{auditData ? 'Sin hallazgos críticos — cuenta en buen estado' : 'Ejecuta el audit para ver diagnósticos'}</p>
        </div>
      )}

      {findings.map((f, i) => (
        <div key={f.id || i} style={{
          background: 'var(--bg2)',
          border: '0.5px solid var(--border)',
          borderLeft: `3px solid ${priorityBorder[f.priority]}`,
          padding: '16px',
          marginBottom: 8,
          borderRadius: 'var(--radius)'
        }}>
          <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                <span className={`badge badge-${f.priority.toLowerCase()}`}>{f.priority}</span>
                <span style={{ fontSize: 11, color: 'var(--text3)', letterSpacing: 1 }}>
                  {f.tier?.toUpperCase()}
                </span>
              </div>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 6 }}>{f.title}</div>
              <div style={{ fontSize: 12, color: 'var(--text2)', lineHeight: 1.6, marginBottom: 8 }}>{f.description}</div>
              <div style={{ fontSize: 12, color: 'var(--green)' }}>↳ {f.action}</div>
            </div>
            <div style={{ fontSize: 11, color: 'var(--text3)', textAlign: 'right', minWidth: 120 }}>
              {f.impact}
            </div>
          </div>
        </div>
      ))}

      {auditData && (
        <div style={{ marginTop: 16, fontSize: 11, color: 'var(--text3)' }}>
          Datos analizados: {auditData.dataUsed?.metaCampaigns || 0} campañas Meta ·{' '}
          {auditData.dataUsed?.metaAdSets || 0} ad sets ·{' '}
          {auditData.dataUsed?.googleCampaigns || 0} campañas Google
        </div>
      )}
    </div>
  );
}
