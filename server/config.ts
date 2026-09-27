import 'dotenv/config';

export interface ServerConfig {
  geniusPayApiKey: string;
  geniusPayApiSecret: string;
  geniusPayWebhookSecret: string;
  geniusPayBaseUrl: string;
  geniusPayEnvironment: 'sandbox' | 'production';
  supabaseUrl: string;
  supabaseAnonKey: string;
  supabaseServiceRoleKey: string;
  appUrl: string;
  port: number;
}

// Clé publique du projet Supabase DALUCHE (non secrète : déjà embarquée dans le front).
const PUBLIC_SUPABASE_URL = 'https://splsjtguapquznbiacad.supabase.co';
const PUBLIC_SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNwbHNqdGd1YXBxdXpuYmlhY2FkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk3NzYwNjYsImV4cCI6MjEwNTM1MjA2Nn0.yr8irdxSNMFI-N3K7ueOZV72uKQSVQykDpX9ioY1C4A';

export const config: ServerConfig = {
  geniusPayApiKey: process.env.GENIUSPAY_API_KEY || '',
  geniusPayApiSecret: process.env.GENIUSPAY_API_SECRET || '',
  geniusPayWebhookSecret: process.env.GENIUSPAY_WEBHOOK_SECRET || '',
  geniusPayBaseUrl: (process.env.GENIUSPAY_BASE_URL || 'https://geniuspay.ci/api/v1/merchant')
    .replace(/^http:\/\//i, 'https://')
    .replace(/\/+$/, ''),
  geniusPayEnvironment: process.env.GENIUSPAY_ENVIRONMENT === 'production' ? 'production' : 'sandbox',
  supabaseUrl: process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || PUBLIC_SUPABASE_URL,
  supabaseAnonKey: process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || PUBLIC_SUPABASE_ANON_KEY,
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  appUrl: (process.env.APP_URL || 'https://dallouchine.vercel.app').replace(/\/+$/, ''),
  port: parseInt(process.env.PORT || '3000', 10)
};

export const hasServiceRole = Boolean(config.supabaseServiceRoleKey);
export const hasGeniusPayCredentials = Boolean(config.geniusPayApiKey && config.geniusPayApiSecret);

// Journalisation sans jamais afficher de secret
export function logServerConfig(): void {
  console.log('[Server Config]', {
    geniusPayEnvironment: config.geniusPayEnvironment,
    geniusPayBaseUrl: config.geniusPayBaseUrl,
    hasGeniusPayCredentials,
    hasWebhookSecret: Boolean(config.geniusPayWebhookSecret),
    supabaseUrl: config.supabaseUrl,
    hasServiceRole,
    appUrl: config.appUrl,
    port: config.port
  });
  if (!hasServiceRole) {
    console.warn(
      '[Server Config] SUPABASE_SERVICE_ROLE_KEY absent : les opérations de paiement utilisent la clé publique. ' +
        'Configurez la clé service_role puis appliquez la migration 20260927_02_harden_payment_rpcs.sql.'
    );
  }
}
