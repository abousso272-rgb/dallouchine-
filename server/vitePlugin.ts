import type { Plugin, ViteDevServer } from 'vite';
import { createApiApp } from './app';

/** Monte l'API Express sur le serveur de développement Vite (mêmes routes qu'en production). */
export function expressApiPlugin(): Plugin {
  return {
    name: 'daluche-express-api',
    configureServer(server: ViteDevServer) {
      const api = createApiApp();
      server.middlewares.use((req, res, next) => {
        if (req.url && req.url.startsWith('/api')) {
          api(req as any, res as any, next);
          return;
        }
        next();
      });
    }
  };
}
