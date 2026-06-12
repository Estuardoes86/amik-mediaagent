import { Router } from 'express';
import {
  getAccessibleCustomers,
  getCampaignPerformance,
  getKeywordPerformance,
  getConversionActions,
  aggregateGoogleMetrics
} from '../services/googleService.js';

export const googleRouter = Router();

// GET /api/google/customers
googleRouter.get('/customers', async (req, res, next) => {
  try {
    const customers = await getAccessibleCustomers();
    res.json({ customers });
  } catch (err) {
    next(err);
  }
});

// GET /api/google/campaigns?customerId=xxx&dateRange=LAST_30_DAYS
googleRouter.get('/campaigns', async (req, res, next) => {
  try {
    const { customerId, dateRange = 'LAST_30_DAYS' } = req.query;
    if (!customerId) return res.status(400).json({ error: 'customerId required' });

    const campaigns = await getCampaignPerformance(customerId, dateRange);
    const summary = aggregateGoogleMetrics(campaigns);

    res.json({ campaigns, summary });
  } catch (err) {
    next(err);
  }
});

// GET /api/google/keywords?customerId=xxx
googleRouter.get('/keywords', async (req, res, next) => {
  try {
    const { customerId, dateRange = 'LAST_30_DAYS' } = req.query;
    if (!customerId) return res.status(400).json({ error: 'customerId required' });

    const keywords = await getKeywordPerformance(customerId, dateRange);
    res.json({ keywords });
  } catch (err) {
    next(err);
  }
});

// GET /api/google/conversions?customerId=xxx
googleRouter.get('/conversions', async (req, res, next) => {
  try {
    const { customerId } = req.query;
    if (!customerId) return res.status(400).json({ error: 'customerId required' });

    const conversions = await getConversionActions(customerId);
    res.json({ conversions });
  } catch (err) {
    next(err);
  }
});

// GET /api/google/full?customerId=xxx — all data in one call
googleRouter.get('/full', async (req, res, next) => {
  try {
    const { customerId, dateRange = 'LAST_30_DAYS' } = req.query;
    if (!customerId) return res.status(400).json({ error: 'customerId required' });

    const [campaigns, keywords, conversions] = await Promise.all([
      getCampaignPerformance(customerId, dateRange),
      getKeywordPerformance(customerId, dateRange),
      getConversionActions(customerId)
    ]);

    res.json({
      campaigns,
      keywords,
      conversions,
      summary: aggregateGoogleMetrics(campaigns)
    });
  } catch (err) {
    next(err);
  }
});
