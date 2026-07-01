import { Router } from 'express';
import {
  getFacebookInsights,
  getInstagramInsights,
  getYouTubeInsights,
  getAllSocialInsights,
} from '../services/socialService.js';
import { cache } from '../services/socialService.js';

export const socialRouter = Router();

// GET /api/social/all — las 3 plataformas juntas
socialRouter.get('/all', async (req, res, next) => {
  try {
    const data = await getAllSocialInsights();
    res.json(data);
  } catch (err) { next(err); }
});

// GET /api/social/facebook
socialRouter.get('/facebook', async (req, res, next) => {
  try {
    res.json(await getFacebookInsights());
  } catch (err) { next(err); }
});

// GET /api/social/instagram
socialRouter.get('/instagram', async (req, res, next) => {
  try {
    res.json(await getInstagramInsights());
  } catch (err) { next(err); }
});

// GET /api/social/youtube
socialRouter.get('/youtube', async (req, res, next) => {
  try {
    res.json(await getYouTubeInsights());
  } catch (err) { next(err); }
});

// DELETE /api/social/cache — limpiar cache
socialRouter.delete('/cache', (req, res) => {
  cache.flushAll();
  res.json({ ok: true, msg: 'Cache limpiado' });
});
