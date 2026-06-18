import { Router } from 'express';
import Anthropic from '@anthropic-ai/sdk';

export const aiRouter = Router();

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM_PROMPT = `Eres el copiloto de IA de AMIK MediaAgent, herramienta de optimización de medios pagos para la agencia AMIK GROUP de Lima, Perú.

Tu trabajo es analizar datos reales de campañas Meta Ads y Google Ads y dar recomendaciones claras, directas y accionables.

Contexto de la agencia:
- AMIK GROUP: agencia de performance marketing con clientes en educación (UPSJB), retail (Deco Shalom), aviación (ESPAC), salud (LIBRA), entre otros
- Stack: Meta Ads, Google Ads, TikTok Ads, LinkedIn Ads, HubSpot CRM, GTM, CAPI
- Metodología: tráfico → leads → SQL → cierre

Reglas de respuesta:
1. Responde siempre en español
2. Sé directo y conciso — sin relleno corporativo
3. Cuando hay datos disponibles, úsalos y menciona los números reales
4. Prioriza hallazgos por impacto (P0 → P1 → P2)
5. Siempre termina con una acción concreta recomendada
6. Para temas de tracking, sé técnico pero explicable
7. Cuando el usuario pegue datos (CSV, tablas), analízalos directamente

Formato de respuestas largas:
- Usa **negrita** para métricas clave
- Usa listas cuando hay múltiples ítems
- Máximo 300 palabras salvo que el análisis requiera más`;

// POST /api/ai/chat — standard chat
aiRouter.post('/chat', async (req, res, next) => {
  try {
    const { messages, clientContext } = req.body;
    if (!messages?.length) return res.status(400).json({ error: 'messages required' });

    const systemWithContext = clientContext
      ? `${SYSTEM_PROMPT}\n\n--- DATOS DEL CLIENTE ACTIVO ---\n${JSON.stringify(clientContext, null, 2)}`
      : SYSTEM_PROMPT;

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-5',
      max_tokens: 1024,
      system: systemWithContext,
      messages: messages.slice(-20) // last 20 turns max
    });

    res.json({ content: response.content[0]?.text || '' });
  } catch (err) {
    next(err);
  }
});

// POST /api/ai/stream — streaming chat (SSE)
aiRouter.post('/stream', async (req, res, next) => {
  try {
    const { messages, clientContext } = req.body;
    if (!messages?.length) return res.status(400).json({ error: 'messages required' });

    const systemWithContext = clientContext
      ? `${SYSTEM_PROMPT}\n\n--- DATOS DEL CLIENTE ACTIVO ---\n${JSON.stringify(clientContext, null, 2)}`
      : SYSTEM_PROMPT;

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const stream = await anthropic.messages.stream({
      model: 'claude-sonnet-4-5',
      max_tokens: 1024,
      system: systemWithContext,
      messages: messages.slice(-20)
    });

    for await (const chunk of stream) {
      if (chunk.type === 'content_block_delta' && chunk.delta?.type === 'text_delta') {
        res.write(`data: ${JSON.stringify({ text: chunk.delta.text })}\n\n`);
      }
    }

    res.write('data: [DONE]\n\n');
    res.end();
  } catch (err) {
    next(err);
  }
});

// POST /api/ai/analyze — one-shot analysis of campaign data
aiRouter.post('/analyze', async (req, res, next) => {
  try {
    const { data, analysisType, clientName } = req.body;

    const prompts = {
      audit: `Analiza estos datos de cuenta y genera un diagnóstico ejecutivo con los 3-5 hallazgos más importantes, priorizados P0/P1/P2, con impacto estimado en CPL/ROAS:`,
      cpl: `Analiza la tendencia de CPL en estos datos e identifica las causas raíz del cambio:`,
      structure: `Evalúa la estructura de campañas y ad sets. Identifica fragmentación, naming issues y oportunidades de consolidación:`,
      creative: `Analiza el performance de creativos. Identifica fatiga, CTR caído y recomendaciones de rotación:`
    };

    const prompt = `${prompts[analysisType] || prompts.audit}\n\nCliente: ${clientName || 'N/A'}\n\nDatos:\n${JSON.stringify(data, null, 2)}`;

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-5',
      max_tokens: 1500,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: prompt }]
    });

    res.json({ analysis: response.content[0]?.text || '' });
  } catch (err) {
    next(err);
  }
});
