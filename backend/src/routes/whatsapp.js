import { Router } from 'express';
import { getPhoneNumberInfo, getMessageAnalytics } from '../services/whatsappService.js';

export const whatsappRouter = Router();

whatsappRouter.get('/status', async (req, res, next) => {
  try {
    const info = await getPhoneNumberInfo();
    if (!info) return res.status(400).json({ error: 'No se pudo obtener info del numero' });
    res.json(info);
  } catch (err) { next(err); }
});

whatsappRouter.get('/analytics', async (req, res, next) => {
  try {
    const { start, end } = req.query;
    const now = Math.floor(Date.now() / 1000);
    const defaultStart = now - 30 * 24 * 60 * 60;
    const data = await getMessageAnalytics(start || defaultStart, end || now);
    res.json(data || { analytics: null });
  } catch (err) { next(err); }
});
