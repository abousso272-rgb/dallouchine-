import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { paymentsRouter } from './server/api/paymentsRouter';
import { config, logServerConfig } from './server/config';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

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
    service: 'SinoSenegal API & Payment Engine',
    gateway: 'GeniusPay',
    timestamp: new Date().toISOString()
  });
});

// 2. API Routes
app.use('/api/payments', paymentsRouter);
app.use('/api', paymentsRouter); // Supporte aussi /api/webhooks/geniuspay

// 3. Fichiers statiques et SPA Fallback en production
const distPath = path.resolve(__dirname, 'dist');
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

const PORT = config.port;
app.listen(PORT, '0.0.0.0', () => {
  logServerConfig();
  console.log(`[SinoSenegal Server] Express server running on port ${PORT}`);
});

export default app;
