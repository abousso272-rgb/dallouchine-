import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, loadEnv, type Plugin } from 'vite';
import { expressApiPlugin } from './server/vitePlugin';

/** Vérification Google Search Console : balise ajoutée au HTML si VITE_GOOGLE_SITE_VERIFICATION est défini. */
function siteVerification(token: string | undefined): Plugin {
  return {
    name: 'google-site-verification',
    transformIndexHtml(html) {
      const t = (token || '').trim();
      if (!/^[A-Za-z0-9_-]{10,100}$/.test(t)) return html;
      return html.replace('<meta charset="UTF-8" />', `<meta charset="UTF-8" />\n    <meta name="google-site-verification" content="${t}" />`);
    }
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_');
  return {
    plugins: [react(), tailwindcss(), expressApiPlugin(), siteVerification(env.VITE_GOOGLE_SITE_VERIFICATION)],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            react: ['react', 'react-dom', 'react-dom/client'],
            supabase: ['@supabase/supabase-js']
          }
        }
      }
    },
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
