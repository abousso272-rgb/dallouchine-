import { Router, Request, Response } from 'express';
import { requireAuth } from '../middleware/auth';
import { analyzeProduct, AnalysisError, checkRateLimit } from '../services/ProductAnalysisService';

export const aiRouter = Router();

/**
 * POST /api/ai/analyze-product  { url?: string, image?: { mediaType, data(base64) } }
 * Réservé aux utilisateurs connectés (coût IA). Rien n'est enregistré : l'analyse
 * est renvoyée au client, qui l'utilise pour préremplir sa demande de sourcing.
 */
aiRouter.post('/analyze-product', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    checkRateLimit(req.user!.id);
    const url = typeof req.body.url === 'string' && req.body.url.trim() ? req.body.url.trim().slice(0, 2000) : undefined;
    const image =
      req.body.image && typeof req.body.image.data === 'string' && typeof req.body.image.mediaType === 'string'
        ? { mediaType: req.body.image.mediaType, data: req.body.image.data }
        : undefined;
    const analysis = await analyzeProduct({ url, image });
    res.json({ success: true, analysis });
  } catch (err) {
    if (err instanceof AnalysisError) {
      res.status(err.status).json({ success: false, error: err.message, errorCode: err.code });
      return;
    }
    console.error('[AI] analyze-product', err);
    res.status(500).json({ success: false, error: 'Analyse impossible pour le moment.' });
  }
});
