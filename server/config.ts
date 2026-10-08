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
  anthropicApiKey: string;
  anthropicModel: string;
  anthropicBaseUrl: string;
  saspaySecretKey: string;
  saspayWebhookSecret: string;
  saspayBaseUrl: string;
  /** ADD_ON : le client paie les frais en plus ; DEDUCTED : frais prélevés sur notre encaissement */
  saspayFeeMode: 'ADD_ON' | 'DEDUCTED';
  /** Fournisseur utilisé pour les nouveaux paiements */
  paymentProvider: 'saspay' | 'geniuspay';
  /** Relais HTTP(S) à IP fixe pour les appels SasPay soumis à liste blanche (remboursements). Optionnel. */
  saspayProxyUrl: string;
}

// Clé publique du projet Supabase Dallou Chine (non secrète : déjà embarquée dans le front).
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
  port: parseInt(process.env.PORT || '3000', 10),
  anthropicApiKey: process.env.ANTHROPIC_API_KEY || '',
  anthropicModel: process.env.ANTHROPIC_MODEL || 'claude-sonnet-5-5',
  anthropicBaseUrl: (process.env.ANTHROPIC_BASE_URL || 'https://api.anthropic.com').replace(/\/+$/, ''),
  saspaySecretKey: process.env.SASPAY_SECRET_KEY || '',
  saspayWebhookSecret: process.env.SASPAY_WEBHOOK_SECRET || '',
  saspayBaseUrl: (process.env.SASPAY_BASE_URL || 'https://api.saspay.me/api/v1').replace(/\/+$/, ''),
  saspayFeeMode: process.env.SASPAY_FEE_MODE === 'ADD_ON' ? 'ADD_ON' : 'DEDUCTED',
  saspayProxyUrl: process.env.SASPAY_PROXY_URL || process.env.FIXIE_URL || process.env.QUOTAGUARDSTATIC_URL || '',
  paymentProvider: process.env.PAYMENT_PROVIDER === 'geniuspay' || (!process.env.SASPAY_SECRET_KEY && process.env.PAYMENT_PROVIDER !== 'saspay') ? 'geniuspay' : 'saspay'
};

export const hasServiceRole = Boolean(config.supabaseServiceRoleKey);
export const hasAiProvider = Boolean(config.anthropicApiKey);
export const hasSasPayCredentials = Boolean(config.saspaySecretKey);
export const hasGeniusPayCredentials = Boolean(config.geniusPayApiKey && config.geniusPayApiSecret);

// Journalisation sans jamais afficher de secret
export function logServerConfig(): void {
  console.log('[Server Config]', {
    geniusPayEnvironment: config.geniusPayEnvironment,
    geniusPayBaseUrl: config.geniusPayBaseUrl,
    paymentProvider: config.paymentProvider,
    hasSasPayCredentials,
    hasSasPayWebhookSecret: Boolean(config.saspayWebhookSecret),
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
