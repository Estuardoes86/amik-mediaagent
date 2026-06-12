import React, { useState } from 'react';
import { useApp } from '../context/AppContext.jsx';
import { useMetaCampaigns, useGoogleCampaigns } from '../hooks/useData.js';
import { reportsApi } from '../lib/api.js';

export default function ReportsPage() {
  const { activeClient, showToast } = useApp();
  const { summary: metaSummary } = useMetaCampaigns();
  const { summary: googleSummary } = useGoogleCampaigns();
  const [generating, setGenerating] = useState(false);
  const [report, setReport] = useState(null);
  const [savedReports] = useState([
    { name: `Performance Mayo 2026 — ${activeClient.name}`, date: '01 Jun 2026', pages: '28 slides', ready: true },
    { name: `Audit Tracking Q2 2026 — ${activeClient.name}`, date: '15 May 2026', pages: '12 slides', ready: true },
    { name: `Performance Abril 2026 — ${activeClient.name}`, date: '01 May 2026', pages: '24 slides', ready: true }
  ]);

  async function generateReport() {
    setGenerating(true);
    try {
      const res = await reportsApi.generate({
        clientName: activeClient.name,
        period: 'Junio 2026',
        metaSummary,
        googleSummary,
        auditFindings: []
      });
      setReport(res.data);
      showToast('✓ Reporte ejecutivo generado', 'success');
    } catch (err) {
      // Demo fallback
      setReport({
        report: `## Reporte Ejecutivo — ${activeClient.name}\n**Período:** Junio 2026\n\n### 1. Resumen Ejecutivo\nLas campañas de ${activeClient.name} muestran una mejora sostenida en CPL durante las últimas 4 semanas. La consolidación de ad sets implementada en mayo ha reducido la fragmentación y mejorado la señal al algoritmo de Meta.\n\n### 2. KPIs Principales\n- **CPL:** S/ 48 (−28% vs. mes anterior)\n- **Leads totales:** 3,847 (+21%)\n- **Inversión total:** S/ 184,000\n- **CTR Meta:** 2.8%\n\n### 3. Principales Logros\n- Reducción sostenida de CPL por 4 semanas consecutivas\n- Incremento de leads del 21% sin aumento proporcional de inversión\n- Mejora de señal en campañas de Medicina Humana Ica\n\n### 4. Problemas Detectados\n**P0 — CAPI:** Posible deduplicación incorrecta. Investigar con Meta Events Manager.\n**P1 — Creativos:** Fatiga detectada en 6 anuncios con >14 días activos.\n\n### 5. Acciones Recomendadas — Próximo Mes\n1. Rotar creativos en campañas con CTR < 1.5%\n2. Verificar CAPI deduplication key\n3. Expandir audiencias lookalike al 3% en Posgrados\n4. Activar Advantage+ Shopping en Google para remarketing\n\n### 6. Próximos Pasos\n| Acción | Responsable | Fecha |\n|--------|-------------|-------|\n| Rotación creativos | Account Manager | 15 Jun |\n| Fix CAPI | Dev / Pixel | 10 Jun |\n| Revisión presupuesto Q3 | Director Marketing | 20 Jun |`,
        generatedAt: new Date().toISOString(),
        client: activeClient.name
      });
      showToast('Reporte generado en modo demo', 'info');
    } finally {
      setGenerating(false);
    }
  }

  function downloadReport() {
    if (!report) return;
    const blob = new Blob([report.report], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Reporte_${activeClient.name}_${new Date().toISOString().slice(0,10)}.md`;
    a.click();
    showToast('Descargando reporte...', 'success');
  }

  return (
    <div className="scroll-y" style={{ flex: 1, padding: 24 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 16, marginBottom: 20 }}>
        <h1 style={{ fontSize: 18, fontWeight: 700 }}>Reportes ejecutivos</h1>
        <span style={{ fontSize: 12, color: 'var(--text3)' }}>{activeClient.name}</span>
      </div>

      {/* Generate new report */}
      <div style={{
        background: 'var(--bg2)', border: '0.5px solid var(--border)',
        padding: 20, marginBottom: 24, borderRadius: 'var(--radius)'
      }}>
        <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>
          Generar reporte ejecutivo con IA
        </div>
        <div style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 16 }}>
          Claude analiza las métricas actuales de Meta Ads y Google Ads y genera un resumen ejecutivo listo para presentar al cliente.
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-primary" onClick={generateReport} disabled={generating}>
            {generating ? <><span className="spinner" style={{ marginRight: 8 }} />Generando con IA...</> : '▶ GENERAR REPORTE'}
          </button>
          {report && (
            <button className="btn btn-ghost" onClick={downloadReport}>↓ DESCARGAR .MD</button>
          )}
        </div>
      </div>

      {/* Generated report */}
      {report && (
        <div style={{
          background: 'var(--bg2)', border: '0.5px solid var(--border)',
          padding: 24, marginBottom: 24, borderRadius: 'var(--radius)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 600, letterSpacing: 1 }}>REPORTE GENERADO</div>
            <div style={{ fontSize: 11, color: 'var(--text3)' }}>
              {new Date(report.generatedAt).toLocaleString('es-PE')}
            </div>
          </div>
          <div style={{
            fontSize: 13, lineHeight: 1.8, color: 'var(--text2)',
            whiteSpace: 'pre-wrap', fontFamily: 'inherit'
          }}>
            {report.report.split('\n').map((line, i) => {
              if (line.startsWith('## ')) return <h2 key={i} style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', margin: '16px 0 8px' }}>{line.replace('## ', '')}</h2>;
              if (line.startsWith('### ')) return <h3 key={i} style={{ fontSize: 13, fontWeight: 700, color: 'var(--accent)', margin: '14px 0 6px', letterSpacing: 1 }}>{line.replace('### ', '')}</h3>;
              if (line.startsWith('**')) return <p key={i} style={{ margin: '4px 0' }} dangerouslySetInnerHTML={{ __html: line.replace(/\*\*([^*]+)\*\*/g, '<strong style="color:var(--text)">$1</strong>') }} />;
              if (line.startsWith('- ')) return <li key={i} style={{ marginLeft: 16, marginBottom: 4 }} dangerouslySetInnerHTML={{ __html: line.replace(/^- /, '').replace(/\*\*([^*]+)\*\*/g, '<strong style="color:var(--text)">$1</strong>') }} />;
              if (line.startsWith('|')) return <div key={i} style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text3)', margin: '2px 0' }}>{line}</div>;
              return line ? <p key={i} style={{ margin: '4px 0' }}>{line}</p> : <br key={i} />;
            })}
          </div>
        </div>
      )}

      {/* Saved reports */}
      <div style={{ fontSize: 11, letterSpacing: 2, color: 'var(--text3)', marginBottom: 12 }}>
        // REPORTES ANTERIORES
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {savedReports.map((r, i) => (
          <div key={i} style={{
            background: 'var(--bg2)', border: '0.5px solid var(--border)',
            padding: '16px', display: 'flex', alignItems: 'center', gap: 16,
            cursor: 'pointer', transition: 'border-color 0.15s', borderRadius: 'var(--radius)'
          }}
            onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--border2)'}
            onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
          >
            <div style={{ fontSize: 20, color: 'var(--accent)' }}>▤</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 2 }}>{r.name}</div>
              <div style={{ fontSize: 11, color: 'var(--text3)' }}>{r.date} · {r.pages}</div>
            </div>
            <div style={{ fontSize: 11, color: 'var(--green)' }}>✓ listo</div>
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => showToast(`Descargando ${r.name}...`, 'success')}
            >
              DESCARGAR
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
