import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import { metaRouter }      from './routes/meta.js';
import { whatsappRouter }  from './routes/whatsapp.js';
import { googleRouter }    from './routes/google.js';
import { aiRouter }        from './routes/ai.js';
import { auditRouter }     from './routes/audit.js';
import { reportsRouter }   from './routes/reports.js';
import { hubspotRouter }   from './routes/hubspot.js';
import { authMiddleware }  from './middleware/auth.js';

dotenv.config();

const app  = express();
const PORT = process.env.PORT || 3001;

app.use(helmet());
app.use(cors({ origin: true, credentials: true }));
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 200 }));
app.use(express.json({ limit: '10mb' }));

app.get('/health', (req, res) => res.json({
  status: 'ok', version: '1.1.0', ts: Date.now(),
  integrations: {
    meta:     !!process.env.META_ACCESS_TOKEN,
    google:   !!process.env.GOOGLE_ADS_DEVELOPER_TOKEN,
    hubspot:  !!process.env.HUBSPOT_API_KEY,
    anthropic:!!process.env.ANTHROPIC_API_KEY,
  }
}));

app.use('/api/meta',     authMiddleware, metaRouter);
app.use('/api/google',   authMiddleware, googleRouter);
app.use('/api/ai',       authMiddleware, aiRouter);
app.use('/api/audit',    authMiddleware, auditRouter);
app.use('/api/reports',  authMiddleware, reportsRouter);
app.use('/api/hubspot',  authMiddleware, hubspotRouter);
app.use('/api/whatsapp', authMiddleware, whatsappRouter);

app.use((err, req, res, next) => {
  console.error('[ERROR]', err.message);
  res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`\n🚀 AMIK MediaAgent v1.1.0 — http://localhost:${PORT}`);
  console.log(`   Meta:     ${process.env.META_ACCESS_TOKEN     ? '✓' : '✗ META_ACCESS_TOKEN'}`);
  console.log(`   Google:   ${process.env.GOOGLE_ADS_DEVELOPER_TOKEN ? '✓' : '✗ GOOGLE_ADS_DEVELOPER_TOKEN'}`);
  console.log(`   HubSpot:  ${process.env.HUBSPOT_API_KEY       ? '✓' : '✗ HUBSPOT_API_KEY'}`);
  console.log(`   Claude:   ${process.env.ANTHROPIC_API_KEY     ? '✓' : '✗ ANTHROPIC_API_KEY'}\n`);
});
