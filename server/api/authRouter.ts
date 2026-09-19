import { Router, Request, Response } from 'express';
import { requireAuth, requireAdmin } from '../middleware/auth';

export const authRouter = Router();

/**
 * 1. GET /api/auth/me
 * Renvoie l'identité certifiée par Supabase Auth (jamais de confiance au frontend)
 */
authRouter.get('/me', requireAuth, (req: Request, res: Response): void => {
  res.json({
    success: true,
    user: req.user
  });
});

/**
 * 2. GET /api/admin/verify
 * Vérifie l'accès administratif certifié
 */
authRouter.get('/admin/verify', requireAdmin, (req: Request, res: Response): void => {
  res.json({
    success: true,
    authorized: true,
    user: req.user,
    message: 'Session administrative certifiée par Supabase Auth & RLS.'
  });
});
