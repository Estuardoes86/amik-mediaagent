import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import { metaRouter } from './routes/meta.js';
import { googleRouter } from './routes/google.js';
import { aiRouter } from './routes/ai.js';
import { auditRouter } from './routes/audit.js';
import { reportsRouter } from './routes/reports.js';
import { authMiddleware } from './middleware/auth.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Security
app.use(helmet());
app.use(cors({
  origin: true,
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 200 });
app.use(limiter);

app.use(express.json({ limit: '10mb' }));

// Health check
app.get('/health', (req, res) => res.json({ status: 'ok', version: '1.0.0', ts: Date.now() }));

// Routes
app.use('/api/meta', authMiddleware, metaRouter);
app.use('/api/google', authMiddleware, googleRouter);
app.use('/api/ai', authMiddleware, aiRouter);
app.use('/api/audit', authMiddleware, auditRouter);
app.use('/api/reports', authMiddleware, reportsRouter);

// Error handler
app.use((err, req, res, next) => {
  console.error('[ERROR]', err.message);
  res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`\n🚀 AMIK MediaAgent backend running on http://localhost:${PORT}`);
  console.log(`   Meta API: ${process.env.META_ACCESS_TOKEN ? '✓ configured' : '✗ missing META_ACCESS_TOKEN'}`);
  console.log(`   Google API: ${process.env.GOOGLE_ADS_DEVELOPER_TOKEN ? '✓ configured' : '✗ missing GOOGLE_ADS_DEVELOPER_TOKEN'}`);
  console.log(`   Claude AI: ${process.env.ANTHROPIC_API_KEY ? '✓ configured' : '✗ missing ANTHROPIC_API_KEY'}\n`);
});
