import { Router } from 'express';
import {
  getPipelines, getAdmissionsFunnel, getContactsSummary,
  getHubspotSummary, getRecentDeals, getOwners,
  getEmailMarketingStats, getNurturingWorkflows
} from '../services/hubspotService.js';

export const hubspotRouter = Router();

/* GET /api/hubspot/summary?pipelineId=xxx&daysBack=30 */
hubspotRouter.get('/summary', async (req, res, next) => {
  try {
    const { pipelineId, daysBack = 30 } = req.query;
    if (!process.env.HUBSPOT_API_KEY) return res.status(400).json({ error:'HUBSPOT_API_KEY not configured' });
    const data = await getHubspotSummary(pipelineId, parseInt(daysBack));
    res.json(data);
  } catch (err) { next(err); }
});

/* GET /api/hubspot/pipelines */
hubspotRouter.get('/pipelines', async (req, res, next) => {
  try {
    res.json({ pipelines: await getPipelines() });
  } catch (err) { next(err); }
});

/* GET /api/hubspot/funnel?pipelineId=xxx */
hubspotRouter.get('/funnel', async (req, res, next) => {
  try {
    const { pipelineId } = req.query;
    if (!pipelineId) return res.status(400).json({ error:'pipelineId required' });
    res.json(await getAdmissionsFunnel(pipelineId));
  } catch (err) { next(err); }
});

/* GET /api/hubspot/contacts?daysBack=30 */
hubspotRouter.get('/contacts', async (req, res, next) => {
  try {
    const { daysBack = 30 } = req.query;
    res.json(await getContactsSummary(parseInt(daysBack)));
  } catch (err) { next(err); }
});

/* GET /api/hubspot/recent */
hubspotRouter.get('/recent', async (req, res, next) => {
  try {
    res.json({ deals: await getRecentDeals(20) });
  } catch (err) { next(err); }
});

/* GET /api/hubspot/owners */
hubspotRouter.get('/owners', async (req, res, next) => {
  try {
    res.json({ owners: await getOwners() });
  } catch (err) { next(err); }
});

/* GET /api/hubspot/email-stats?daysBack=90 */
hubspotRouter.get('/email-stats', async (req, res, next) => {
  try {
    const { daysBack = 90 } = req.query;
    if (!process.env.HUBSPOT_API_KEY) return res.status(400).json({ error:'HUBSPOT_API_KEY not configured' });
    res.json(await getEmailMarketingStats(parseInt(daysBack)));
  } catch (err) { next(err); }
});

/* GET /api/hubspot/nurturing */
hubspotRouter.get('/nurturing', async (req, res, next) => {
  try {
    if (!process.env.HUBSPOT_API_KEY) return res.status(400).json({ error:'HUBSPOT_API_KEY not configured' });
    res.json(await getNurturingWorkflows());
  } catch (err) { next(err); }
});
