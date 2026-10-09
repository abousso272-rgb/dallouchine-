import 'dotenv/config';

export interface ServerConfig {
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
  /** Relais HTTP(S) à IP fixe pour les appels SasPay soumis à liste blanche (remboursements). Optionnel. */
  saspayProxyUrl: string;
}

// Clé publique du projet Supabase Dallou Chine (non secrète : déjà embarquée dans le front).
const PUBLIC_SUPABASE_URL = 'https://splsjtguapquznbiacad.supabase.co';
const PUBLIC_SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNwbHNqdGd1YXBxdXpuYmlhY2FkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk3NzYwNjYsImV4cCI6MjEwNTM1MjA2Nn0.yr8irdxSNMFI-N3K7ueOZV72uKQSVQykDpX9ioY1C4A';

const clean = (v?: string) => (v || '').trim();

export const config: ServerConfig = {
  supabaseUrl: process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || PUBLIC_SUPABASE_URL,
  supabaseAnonKey: process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || PUBLIC_SUPABASE_ANON_KEY,
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  appUrl: (process.env.APP_URL || 'https://dallouchine.vercel.app').replace(/\/+$/, ''),
  port: parseInt(process.env.PORT || '3000', 10),
  anthropicApiKey: clean(process.env.ANTHROPIC_API_KEY),
  anthropicModel: process.env.ANTHROPIC_MODEL || 'claude-sonnet-5-5',
  anthropicBaseUrl: (process.env.ANTHROPIC_BASE_URL || 'https://api.anthropic.com').replace(/\/+$/, ''),
  saspaySecretKey: clean(process.env.SASPAY_SECRET_KEY),
  saspayWebhookSecret: clean(process.env.SASPAY_WEBHOOK_SECRET),
  saspayBaseUrl: (process.env.SASPAY_BASE_URL || 'https://api.saspay.me/api/v1').replace(/\/+$/, ''),
  saspayFeeMode: process.env.SASPAY_FEE_MODE === 'ADD_ON' ? 'ADD_ON' : 'DEDUCTED',
  saspayProxyUrl: process.env.SASPAY_PROXY_URL || process.env.FIXIE_URL || process.env.QUOTAGUARDSTATIC_URL || ''
};

/** Une vraie clé SasPay (et non un exemple recopié tel quel). */
export const hasSasPayCredentials = /^sk_(test|live)_[A-Za-z0-9_-]{12,}$/.test(config.saspaySecretKey);
/** Secret de signature des webhooks plausible (ASCII, assez long). */
export const hasSasPayWebhookSecret = /^[\x21-\x7e]{16,}$/.test(config.saspayWebhookSecret);
export const saspayEnvironment: 'sandbox' | 'production' = config.saspaySecretKey.startsWith('sk_live_') ? 'production' : 'sandbox';
export const hasServiceRole = Boolean(config.supabaseServiceRoleKey);
export const hasAiProvider = /^sk-ant-[A-Za-z0-9_-]{20,}$/.test(config.anthropicApiKey) || (config.anthropicApiKey.length > 20 && !config.anthropicApiKey.includes('…'));

// Journalisation sans jamais afficher de secret
export function logServerConfig(): void {
  console.log('[Server Config]', {
    paymentProvider: 'saspay',
    saspayEnvironment,
    hasSasPayCredentials,
    hasSasPayWebhookSecret,
    hasAiProvider,
    supabaseUrl: config.supabaseUrl,
    hasServiceRole,
    appUrl: config.appUrl,
    port: config.port
  });
}
