import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { shipmentsRouter } from './api/shipmentsRouter';
import { paymentsRouter } from './api/paymentsRouter';
import { teamRouter } from './api/teamRouter';
import { config, hasServiceRole, hasGeniusPayCredentials } from './config';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** Application Express limitée aux routes /api (réutilisée par le serveur Vite en développement). */
export function createApiApp() {
  const api = express();

  // Corps JSON + capture du corps brut pour la vérification HMAC des webhooks
  api.use(
    express.json({
      limit: '1mb',
      verify: (req: Request, _res: Response, buf: Buffer) => {
        (req as any).rawBody = buf.toString('utf8');
      }
    })
  );
  api.use(express.urlencoded({ extended: true }));

  api.use((_req: Request, res: Response, next: NextFunction) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Cache-Control', 'no-store');
    next();
  });

  api.get('/api/health', (_req: Request, res: Response) => {
    res.json({
      status: 'online',
      service: 'DALUCHE API',
      gateway: 'GeniusPay',
      paymentsConfigured: hasGeniusPayCredentials,
      paymentsEnvironment: config.geniusPayEnvironment,
      serviceRoleConfigured: hasServiceRole,
      timestamp: new Date().toISOString()
    });
  });

  api.use('/api/payments', paymentsRouter);
  api.use('/api', paymentsRouter); // /api/webhooks/geniuspay
  api.use('/api/shipments', shipmentsRouter);
  api.use('/api/team', teamRouter);

  api.use('/api', (_req: Request, res: Response) => {
    res.status(404).json({ success: false, error: 'Route API inconnue.' });
  });

  return api;
}

export const app = express();
app.use(createApiApp());

// Fichiers statiques + fallback SPA (hors Vercel, qui sert lui-même dist/)
if (!process.env.VERCEL) {
  const distPath = path.resolve(__dirname, '..', 'dist');
  app.use(express.static(distPath));
  app.get('*', (_req: Request, res: Response) => {
    res.sendFile(path.join(distPath, 'index.html'), err => {
      if (err) res.status(404).send('Application non construite. Exécutez npm run build.');
    });
  });
}

export default app;
