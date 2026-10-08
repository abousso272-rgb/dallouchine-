import app from './server/app';
import { config, logServerConfig } from './server/config';

const PORT = config.port;
if (!process.env.VERCEL) {
  app.listen(PORT, '0.0.0.0', () => {
    logServerConfig();
    console.log(`[Dallou Chine] Serveur Express démarré on port ${PORT}`);
  });
}

export default app;
