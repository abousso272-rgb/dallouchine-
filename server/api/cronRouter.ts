import { Router, Request, Response } from 'express';
import { timingSafeEqual } from 'crypto';
import { config } from '../config';
import { dispatchNotificationEmails } from '../services/NotificationEmailService';

export const cronRouter = Router();

function authorized(req: Request): boolean {
  if (!config.cronSecret) return false;
  const header = String(req.headers.authorization || '');
  const given = header.startsWith('Bearer ') ? header.slice(7) : String(req.query.secret || '');
  const a = Buffer.from(given);
  const b = Buffer.from(config.cronSecret);
  return a.length === b.length && timingSafeEqual(a, b);
}

/**
 * GET|POST /api/cron/notifications
 * Déclenché toutes les quelques minutes par un planificateur (Vercel Cron, GitHub Actions, cron-job.org…).
 * Protégé par CRON_SECRET (en-tête Authorization: Bearer <secret>).
 */
async function handler(req: Request, res: Response): Promise<void> {
  if (!config.cronSecret) {
    res.status(503).json({ success: false, error: 'CRON_SECRET non configuré : déclencheur désactivé.' });
    return;
  }
  if (!authorized(req)) {
    res.status(401).json({ success: false, error: 'Non autorisé.' });
    return;
  }
  try {
    res.json({ success: true, ...(await dispatchNotificationEmails()) });
  } catch (err) {
    console.error('[cron] notifications:', (err as Error).message);
    res.status(500).json({ success: false, error: 'Envoi des emails impossible.' });
  }
}

cronRouter.get('/notifications', handler);
cronRouter.post('/notifications', handler);
