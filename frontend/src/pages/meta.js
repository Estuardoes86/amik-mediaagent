import { Router } from 'express';
import {
  getAdAccounts, getCampaigns, getCampaignInsights,
  getAdSetInsights, getPixels, getCreativeInsights,
  getDailyInsights, aggregateInsights
} from '../services/metaService.js';

export const metaRouter = Router();

metaRouter.get('/accounts', async (req, res, next) => {
  try {
    res.json({ accounts: await getAdAccounts() });
  } catch (err) { next(err); }
});

metaRouter.get('/campaigns', async (req, res, next) => {
  try {
    const { accountId, datePreset = 'last_30d', since, until } = req.query;
    if (!accountId) return res.status(400).json({ error: 'accountId required' });

    const [campaigns, insights] = await Promise.all([
      getCampaigns(accountId),
      getCampaignInsights(accountId, datePreset, since, until)
    ]);

    const insightMap = {};
    for (const i of insights) insightMap[i.campaign_id] = i;

    const enriched = campaigns.map(c => ({ ...c, metrics: insightMap[c.id] || null }));
    res.json({ campaigns: enriched, summary: aggregateInsights(insights) });
  } catch (err) { next(err); }
});

metaRouter.get('/insights', async (req, res, next) => {
  try {
    const { accountId, datePreset = 'last_30d', since, until } = req.query;
    if (!accountId) return res.status(400).json({ error: 'accountId required' });

    const [campaignInsights, adSetInsights, creativeInsights, dailyInsights, pixels] = await Promise.all([
      getCampaignInsights(accountId, datePreset, since, until),
      getAdSetInsights(accountId, datePreset, since, until),
      getCreativeInsights(accountId, datePreset, since, until),
      getDailyInsights(accountId, datePreset, since, until),
      getPixels(accountId)
    ]);

    res.json({
      campaignInsights, adSetInsights, creativeInsights, dailyInsights, pixels,
      summary: aggregateInsights(campaignInsights)
    });
  } catch (err) { next(err); }
});

metaRouter.get('/daily', async (req, res, next) => {
  try {
    const { accountId, datePreset = 'last_30d', since, until } = req.query;
    if (!accountId) return res.status(400).json({ error: 'accountId required' });
    const daily = await getDailyInsights(accountId, datePreset, since, until);
    res.json({ daily, summary: aggregateInsights(daily) });
  } catch (err) { next(err); }
});

metaRouter.get('/adsets', async (req, res, next) => {
  try {
    const { accountId, datePreset = 'last_7d', since, until } = req.query;
    if (!accountId) return res.status(400).json({ error: 'accountId required' });
    res.json({ adsets: await getAdSetInsights(accountId, datePreset, since, until) });
  } catch (err) { next(err); }
});
