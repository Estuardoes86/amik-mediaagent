import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext.jsx';
import { whatsappApi } from '../lib/api.js';

const DEMO_ACTIONS = [
  {
    id: 1, priority: 'P0', type: 'BUDGET · UAR', conf: 0.91,
    title: 'Mover S/ 4,800/día de Admisiones-Form → Admisiones-Video · CPL spike +34% en 90min detectado',
    impact: '+S/ 3,200/día recuperados estimados',
    hash: '8c2f1ab',
    campaign: 'Admisiones 2026-II', platform: 'Meta Ads', detectedAgo: '12min',
    why: 'El ad set Admisiones-Video tiene CPL 34% menor que Admisiones-Form en las últimas 90 minutos. Señal de canibalización creativa.',
    rollback: '14 días'
  },
  {
    id: 2, priority: 'P1', type: 'ESTRUCTURA · SF', conf: 0.87,
    title: 'Consolidar 47 ad sets → 11 grupos · ML starvation detectado en ad sets con <50 eventos/semana',
    impact: '−S/ 8,400/mes desperdicio estimado',
    hash: 'a1b2c3d',
    campaign: 'Posgrados Lima', platform: 'Meta Ads', detectedAgo: '2h',
    why: '47 ad sets activos con menos de 50 conversiones/semana cada uno. El algoritmo no tiene señal suficiente para optimizar.',
    rollback: '14 días'
  },
  {
    id: 3, priority: 'P1', type: 'CREATIVE · ROTACIÓN', conf: 0.83,
    title: 'Pausar creativos >14 días sin refresher · fatiga detectada. CTR cayó −41% vs. semana 1',
    impact: '+18% CTR estimado con creativos frescos',
    hash: 'f4e5d6c',
    campaign: 'Medicina Humana · Ica', platform: 'Meta Ads', detectedAgo: '4h',
    why: 'Los 6 creativos activos llevan más de 14 días en pauta sin rotación. CTR promedio bajó de 2.8% a 1.6%.',
    rollback: '14 días'
  }
];

export default function InboxPage() {
  const { activeClient, showToast } = useApp();
  const [actions, setActions] = useState(DEMO_ACTIONS);
  const [waStatus, setWaStatus] = useState(null);
  const [waLoading, setWaLoading] = useState(true);

  useEffect(() => {
    if (activeClient?.id !== 'upsjb') { setWaLoading(false); return; }
    whatsappApi.getStatus()
      .then(res => setWaStatus(res.data))
      .catch(() => setWaStatus(null))
      .finally(() => setWaLoading(false));
  }, [activeClient?.id]);
  const [log, setLog] = useState([]);
  const [expanded, setExpanded] = useState(null);

  function approve(action) {
    setActions(prev => prev.filter(a => a.id !== action.id));
    const ts = new Date().toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });
    setLog(prev => [{ ...action, ts, status: 'approved' }, ...prev]);
    showToast(`✓ Acción aprobada · rollback disponible ${action.rollback}`, 'success');
  }

  function reject(action) {
    setActions(prev => prev.filter(a => a.id !== action.id));
    showToast('Acción rechazada — no se ejecutará ningún cambio', 'info');
  }

  const priorityStyle = {
    P0: { border: '0.5px solid var(--border)', borderLeft: '3px solid var(--accent)' },
    P1: { border: '0.5px solid var(--border)', borderLeft: '3px solid var(--yellow)' },
    P2: { border: '0.5px solid var(--border)', borderLeft: '3px solid var(--text3)' }
  };

  return (
    <div className="scroll-y" style={{ flex: 1, padding: 24 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 16, marginBottom: 20 }}>
        <h1 style={{ fontSize: 18, fontWeight: 700 }}>Actions Inbox</h1>
        <span style={{ fontSize: 12, color: 'var(--text3)' }}>
          {actions.length} acción{actions.length !== 1 ? 'es' : ''} pendiente{actions.length !== 1 ? 's' : ''} · {activeClient.name}
        </span>
      </div>

      {/* WhatsApp Status — EduAgent */}
      {activeClient?.id === 'upsjb' && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 12,
          padding: '14px 16px', marginBottom: 20, borderRadius: 'var(--radius)',
          background: waStatus ? 'var(--green-bg)' : 'var(--bg3)',
          border: `1px solid ${waStatus ? 'var(--green-border)' : 'var(--border)'}`,
        }}>
          <span style={{ fontSize: 20 }}>{waStatus ? '🟢' : '⚪'}</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>
              WhatsApp EduAgent {waLoading ? '— verificando...' : waStatus ? '— Conectado' : '— Sin conexión'}
            </div>
            {waStatus && (
              <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 2 }}>
                {waStatus.display_phone_number} · {waStatus.verified_name}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Actions */}
      {actions.length === 0 && (
        <div className="empty-state">
          <div style={{ fontSize: 32 }}>✓</div>
          <p>Inbox limpio — no hay acciones pendientes</p>
        </div>
      )}

      {actions.map(action => (
        <div key={action.id} style={{
          ...priorityStyle[action.priority],
          background: 'var(--bg2)',
          marginBottom: 10,
          borderRadius: 'var(--radius)'
        }}>
          {/* Header row */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '12px 16px', borderBottom: '0.5px solid var(--border)'
          }}>
            <span className={`badge badge-${action.priority.toLowerCase()}`}>{action.priority}</span>
            <span style={{ fontSize: 11, color: 'var(--text3)', letterSpacing: '1px' }}>{action.type}</span>
            <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--text2)' }}>
              conf <span style={{ color: 'var(--green)', fontWeight: 700 }}>{action.conf}</span>
            </span>
          </div>

          {/* Body */}
          <div style={{ padding: '14px 16px' }}>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 8, lineHeight: 1.4 }}>
              {action.title}
            </div>
            <div style={{ fontSize: 12, color: 'var(--green)', marginBottom: 10 }}>
              {action.impact} · rollback hash{' '}
              <span style={{ fontFamily: 'var(--mono)', color: 'var(--accent2)' }}>{action.hash}</span>
              {' '}· {action.rollback}
            </div>

            {/* Meta row */}
            <div style={{ display: 'flex', gap: 20, marginBottom: 14 }}>
              {[
                ['CAMPAÑA', action.campaign],
                ['PLATAFORMA', action.platform],
                ['DETECTADO', `hace ${action.detectedAgo}`]
              ].map(([k, v]) => (
                <div key={k} style={{ fontSize: 11, color: 'var(--text3)' }}>
                  {k}: <span style={{ color: 'var(--text2)' }}>{v}</span>
                </div>
              ))}
            </div>

            {/* WHY expandable */}
            {expanded === action.id && (
              <div style={{
                background: 'var(--bg)', border: '0.5px solid var(--border)',
                padding: '10px 14px', marginBottom: 14, borderRadius: 'var(--radius)',
                fontSize: 12, color: 'var(--text2)', lineHeight: 1.6
              }}>
                <span style={{ color: 'var(--accent)', fontSize: 10, letterSpacing: 1, fontWeight: 700 }}>WHY · </span>
                {action.why}
              </div>
            )}

            {/* Actions */}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
              <button className="btn btn-success" onClick={() => approve(action)}>✓ APROBAR</button>
              <button className="btn btn-ghost" onClick={() => setExpanded(expanded === action.id ? null : action.id)}>
                {expanded === action.id ? 'OCULTAR' : 'VER WHY'}
              </button>
              <button className="btn btn-ghost">PROGRAMAR</button>
              <button className="btn btn-danger" onClick={() => reject(action)}>RECHAZAR</button>
            </div>
          </div>
        </div>
      ))}

      {/* Execution ledger */}
      {log.length > 0 && (
        <div style={{ marginTop: 24 }}>
          <div style={{ fontSize: 11, letterSpacing: 2, color: 'var(--text3)', marginBottom: 10 }}>
            // LEDGER DE EJECUCIÓN
          </div>
          <div style={{
            background: 'var(--bg)', border: '0.5px solid var(--border)',
            padding: '12px 16px', fontFamily: 'var(--mono)', fontSize: 11,
            color: 'var(--text3)', lineHeight: 2
          }}>
            {log.map((entry, i) => (
              <div key={i}>
                <span style={{ color: 'var(--green)' }}>✓ EJECUTADO</span>
                {' '}{entry.ts} ·{' '}
                <span style={{ color: 'var(--accent2)' }}>{entry.hash}</span>
                {' '}· {entry.title.substring(0, 60)}...
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
