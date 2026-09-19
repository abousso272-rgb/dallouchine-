import type { Plugin, ViteDevServer } from 'vite';
import express, { Request, Response } from 'express';
import { shipmentsRouter } from './api/shipmentsRouter';
import { sourcingRouter } from './api/sourcingRouter';
import { paymentsRouter } from './api/paymentsRouter';
import { logisticsRouter } from './api/logisticsRouter';
import { sourcingRouter } from './api/sourcingRouter';

export function expressApiPlugin(): Plugin {
  return {
    name: 'express-api-plugin',
    configureServer(server: ViteDevServer) {
      const app = express();

      app.use(
        express.json({
          verify: (req: Request, _res: Response, buf: Buffer) => {
            (req as any).rawBody = buf.toString('utf8');
          }
        })
      );
      app.use(express.urlencoded({ extended: true }));

      app.get('/api/health', (_req, res) => {
        res.json({ status: 'online', mode: 'vite-dev', gateway: 'GeniusPay' });
      });

      app.use('/api/payments', paymentsRouter);
      app.use('/api', paymentsRouter);
      app.use('/api/shipments', shipmentsRouter);
      app.use('/api/sourcing', sourcingRouter);

      server.middlewares.use(app);
    }
  };
}
