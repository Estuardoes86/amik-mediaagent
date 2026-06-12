import { Router } from 'express';
import {
  getAdAccounts,
  getCampaigns,
  getCampaignInsights,
  getAdSetInsights,
  getPixels,
  getCreativeInsights,
  aggregateInsights
} from '../services/metaService.js';

export const metaRouter = Router();

// GET /api/meta/accounts
metaRouter.get('/accounts', async (req, res, next) => {
  try {
    const accounts = await getAdAccounts();
    res.json({ accounts });
  } catch (err) {
    next(err);
  }
});

// GET /api/meta/campaigns?accountId=act_xxx&datePreset=last_30d
metaRouter.get('/campaigns', async (req, res, next) => {
  try {
    const { accountId, datePreset = 'last_30d' } = req.query;
    if (!accountId) return res.status(400).json({ error: 'accountId required' });

    const [campaigns, insights] = await Promise.all([
      getCampaigns(accountId, datePreset),
      getCampaignInsights(accountId, datePreset)
    ]);

    // Merge campaigns with insights
    const insightMap = {};
    for (const i of insights) insightMap[i.campaign_id] = i;

    const enriched = campaigns.map(c => ({
      ...c,
      metrics: insightMap[c.id] || null
    }));

    res.json({ campaigns: enriched, summary: aggregateInsights(insights) });
  } catch (err) {
    next(err);
  }
});

// GET /api/meta/insights?accountId=act_xxx&datePreset=last_30d
metaRouter.get('/insights', async (req, res, next) => {
  try {
    const { accountId, datePreset = 'last_30d' } = req.query;
    if (!accountId) return res.status(400).json({ error: 'accountId required' });

    const [campaignInsights, adSetInsights, creativeInsights, pixels] = await Promise.all([
      getCampaignInsights(accountId, datePreset),
      getAdSetInsights(accountId, 'last_7d'),
      getCreativeInsights(accountId, 'last_14d'),
      getPixels(accountId)
    ]);

    res.json({
      campaignInsights,
      adSetInsights,
      creativeInsights,
      pixels,
      summary: aggregateInsights(campaignInsights)
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/meta/adsets?accountId=act_xxx
metaRouter.get('/adsets', async (req, res, next) => {
  try {
    const { accountId, datePreset = 'last_7d' } = req.query;
    if (!accountId) return res.status(400).json({ error: 'accountId required' });
    const adsets = await getAdSetInsights(accountId, datePreset);
    res.json({ adsets });
  } catch (err) {
    next(err);
  }
});
