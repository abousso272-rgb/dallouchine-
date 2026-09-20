import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { shipmentsRouter } from './api/shipmentsRouter';
import { sourcingRouter } from './api/sourcingRouter';
import { b2bRouter } from './api/b2bRouter';
import { paymentsRouter } from './api/paymentsRouter';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const app = express();

// Configuration du parseur JSON avec capture du rawBody pour la signature HMAC des webhooks
app.use(
  express.json({
    verify: (req: Request, _res: Response, buf: Buffer) => {
      (req as any).rawBody = buf.toString('utf8');
    }
  })
);

app.use(express.urlencoded({ extended: true }));

// En-têtes de sécurité
app.use((_req: Request, res: Response, next: NextFunction) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
});

// 1. API Health Check
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'online',
    service: 'Dallou Chine API & Logistics Engine',
    gateway: 'GeniusPay',
    timestamp: new Date().toISOString()
  });
});

// 2. API Routes
app.use('/api/payments', paymentsRouter);
app.use('/api', paymentsRouter); // Supporte aussi /api/webhooks/geniuspay
app.use('/api/shipments', shipmentsRouter);
app.use('/api/sourcing', sourcingRouter);
app.use('/api/b2b', b2bRouter);

// 3. Fichiers statiques et SPA Fallback en production (hors Vercel)
if (!process.env.VERCEL) {
  const distPath = path.resolve(__dirname, '..', 'dist');
  app.use(express.static(distPath));

  app.get('*', (req: Request, res: Response, next: NextFunction) => {
    if (req.path.startsWith('/api/')) {
      return next();
    }
    const indexPath = path.join(distPath, 'index.html');
    res.sendFile(indexPath, (err) => {
      if (err) {
        res.status(404).send('Application non construite. Exécutez npm run build d\'abord.');
      }
    });
  });
}

export default app;
