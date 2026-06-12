import { Router } from 'express';
import { getCampaignInsights, getAdSetInsights, getCreativeInsights, getPixels, aggregateInsights } from '../services/metaService.js';
import { getCampaignPerformance, getKeywordPerformance, getConversionActions } from '../services/googleService.js';
import { runAudit } from '../services/auditService.js';

export const auditRouter = Router();

// POST /api/audit/run
// Body: { metaAccountId, googleCustomerId, clientName }
auditRouter.post('/run', async (req, res, next) => {
  try {
    const { metaAccountId, googleCustomerId, clientName } = req.body;

    // Gather all data in parallel
    const [metaInsights, metaAdSets, metaCreatives, metaPixels, googleCampaigns, googleKeywords, googleConversions] = await Promise.allSettled([
      metaAccountId ? getCampaignInsights(metaAccountId, 'last_7d') : Promise.resolve([]),
      metaAccountId ? getAdSetInsights(metaAccountId, 'last_7d') : Promise.resolve([]),
      metaAccountId ? getCreativeInsights(metaAccountId, 'last_14d') : Promise.resolve([]),
      metaAccountId ? getPixels(metaAccountId) : Promise.resolve([]),
      googleCustomerId ? getCampaignPerformance(googleCustomerId, 'LAST_7_DAYS') : Promise.resolve([]),
      googleCustomerId ? getKeywordPerformance(googleCustomerId, 'LAST_7_DAYS') : Promise.resolve([]),
      googleCustomerId ? getConversionActions(googleCustomerId) : Promise.resolve([])
    ]);

    const metaData = {
      campaignInsights: metaInsights.value || [],
      adSetInsights: metaAdSets.value || [],
      creativeInsights: metaCreatives.value || [],
      pixels: metaPixels.value || [],
      insightsSummary: aggregateInsights(metaInsights.value || [])
    };

    const googleData = {
      campaigns: googleCampaigns.value || [],
      keywords: googleKeywords.value || [],
      conversions: googleConversions.value || []
    };

    const auditResult = runAudit(metaData, googleData);

    res.json({
      client: clientName || 'Unknown',
      ...auditResult,
      dataUsed: {
        metaCampaigns: metaData.campaignInsights.length,
        metaAdSets: metaData.adSetInsights.length,
        metaAds: metaData.creativeInsights.length,
        metaPixels: metaData.pixels.length,
        googleCampaigns: googleData.campaigns.length,
        googleKeywords: googleData.keywords.length
      }
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/audit/history — placeholder for stored audit history
auditRouter.get('/history', async (req, res) => {
  // In production: fetch from DB
  res.json({ history: [] });
});
