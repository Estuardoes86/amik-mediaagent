import { Router } from 'express';
import {
  getAdAccounts, getCampaigns, getCampaignInsights, getAccountReach,
  getAdSetInsights, getPixels, getCreativeInsights,
  getDailyInsights, aggregateInsights, extractPrograma
} from '../services/metaService.js';

export const metaRouter = Router();

// GET /api/meta/accounts
metaRouter.get('/accounts', async (req, res, next) => {
  try {
    res.json({ accounts: await getAdAccounts() });
  } catch (err) { next(err); }
});

// GET /api/meta/campaigns?accountId=act_xxx&datePreset=last_30d
//                         OR &since=2026-01-01&until=2026-01-31
metaRouter.get('/campaigns', async (req, res, next) => {
  try {
    const { accountId, datePreset = 'last_30d', since, until } = req.query;
    if (!accountId) return res.status(400).json({ error: 'accountId required' });

    const [campaigns, insights, accountReach] = await Promise.all([
      getCampaigns(accountId),
      getCampaignInsights(accountId, datePreset, since, until),
      getAccountReach(accountId, datePreset, since, until).catch(() => null)
    ]);

    // Merge campaigns with insights by campaign_id
    const insightMap = {};
    for (const i of insights) insightMap[i.campaign_id] = i;

    // Solo campañas con gasto real en el período (igual que Meta Ads Manager)
    const enriched = campaigns
      .map(c => ({
        ...c,
        metrics: insightMap[c.id] || null,
        programa: extractPrograma(c.name),
      }))
      .filter(c => c.metrics && parseFloat(c.metrics.spend || 0) > 0);

    const summary = aggregateInsights(insights, accountReach);

    res.json({ campaigns: enriched, summary });
  } catch (err) { next(err); }
});

// GET /api/meta/insights?accountId=act_xxx&datePreset=last_30d
metaRouter.get('/insights', async (req, res, next) => {
  try {
    const { accountId, datePreset = 'last_30d', since, until } = req.query;
    if (!accountId) return res.status(400).json({ error: 'accountId required' });

    const [campaignInsights, adSetInsights, creativeInsights, pixels] = await Promise.all([
      getCampaignInsights(accountId, datePreset, since, until),
      getAdSetInsights(accountId, datePreset, since, until),
      getCreativeInsights(accountId, datePreset, since, until),
      getPixels(accountId)
    ]);

    res.json({ campaignInsights, adSetInsights, creativeInsights, pixels });
  } catch (err) { next(err); }
});

// GET /api/meta/adsets?accountId=act_xxx&datePreset=last_30d
metaRouter.get('/adsets', async (req, res, next) => {
  try {
    const { accountId, datePreset = 'last_30d', since, until } = req.query;
    if (!accountId) return res.status(400).json({ error: 'accountId required' });
    res.json({ adsets: await getAdSetInsights(accountId, datePreset, since, until) });
  } catch (err) { next(err); }
});

// GET /api/meta/daily?accountId=act_xxx&datePreset=last_30d
metaRouter.get('/daily', async (req, res, next) => {
  try {
    const { accountId, datePreset = 'last_30d', since, until } = req.query;
    if (!accountId) return res.status(400).json({ error: 'accountId required' });
    const daily = await getDailyInsights(accountId, datePreset, since, until);
    res.json({ daily });
  } catch (err) { next(err); }
});
