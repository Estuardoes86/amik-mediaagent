import { Router } from 'express';
import Anthropic from '@anthropic-ai/sdk';

export const reportsRouter = Router();
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// POST /api/reports/generate — generate executive summary text
reportsRouter.post('/generate', async (req, res, next) => {
  try {
    const { clientName, period, metaSummary, googleSummary, auditFindings } = req.body;

    const prompt = `Genera un resumen ejecutivo de performance de medios pagos para:

Cliente: ${clientName}
Período: ${period || 'último mes'}

Métricas Meta Ads:
${JSON.stringify(metaSummary, null, 2)}

Métricas Google Ads:
${JSON.stringify(googleSummary, null, 2)}

Hallazgos del audit:
${JSON.stringify(auditFindings, null, 2)}

Formato del reporte:
1. RESUMEN EJECUTIVO (3-4 oraciones clave)
2. KPIs PRINCIPALES (tabla con métricas vs. mes anterior)
3. PRINCIPALES LOGROS
4. PROBLEMAS DETECTADOS (priorizados)
5. ACCIONES RECOMENDADAS PARA PRÓXIMO MES
6. PRÓXIMOS PASOS (con responsable y fecha estimada)

Usa datos reales. Sé concreto con números. Máximo 600 palabras.`;

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1500,
      messages: [{ role: 'user', content: prompt }]
    });

    res.json({
      report: response.content[0]?.text || '',
      generatedAt: new Date().toISOString(),
      client: clientName,
      period
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/reports/list — list saved reports (placeholder)
reportsRouter.get('/list', async (req, res) => {
  res.json({ reports: [] });
});
