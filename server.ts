import app from './server/app';
import { config, logServerConfig } from './server/config';

const PORT = config.port;
if (!process.env.VERCEL) {
  app.listen(PORT, '0.0.0.0', () => {
    logServerConfig();
    console.log(`[SinoSenegal Server] Express server running on port ${PORT}`);
  });
}

export default app;
