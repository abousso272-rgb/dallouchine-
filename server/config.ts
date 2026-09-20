export interface ServerConfig {
  geniusPayApiKey: string;
  geniusPayApiSecret: string;
  geniusPayWebhookSecret: string;
  geniusPayBaseUrl: string;
  geniusPayEnvironment: 'sandbox' | 'production';
  supabaseUrl: string;
  supabaseServiceRoleKey: string;
  appUrl: string;
  port: number;
}

export const config: ServerConfig = {
  geniusPayApiKey: process.env.GENIUSPAY_API_KEY || 'pk_sandbox_sample_key_sinosenegal',
  geniusPayApiSecret: process.env.GENIUSPAY_API_SECRET || 'sk_sandbox_sample_secret_sinosenegal',
  geniusPayWebhookSecret: process.env.GENIUSPAY_WEBHOOK_SECRET || 'whsec_sample_geniuspay_secret_sinosenegal',
  geniusPayBaseUrl: (process.env.GENIUSPAY_BASE_URL || 'https://geniuspay.ci/api/v1/merchant').replace(/\/+$/, ''),
  geniusPayEnvironment: (process.env.GENIUSPAY_ENVIRONMENT as 'sandbox' | 'production') || 'sandbox',
  supabaseUrl: process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '',
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || '',
  appUrl: process.env.APP_URL || 'http://localhost:3000',
  port: parseInt(process.env.PORT || '3000', 10)
};

// Safe config logger (Masks secrets)
export function logServerConfig(): void {
  console.log('[Server Config] Initialized with:', {
    environment: config.geniusPayEnvironment,
    baseUrl: config.geniusPayBaseUrl,
    hasApiKey: Boolean(config.geniusPayApiKey && config.geniusPayApiKey.length > 5),
    hasApiSecret: Boolean(config.geniusPayApiSecret && config.geniusPayApiSecret.length > 5),
    hasWebhookSecret: Boolean(config.geniusPayWebhookSecret && config.geniusPayWebhookSecret.length > 5),
    hasSupabaseUrl: Boolean(config.supabaseUrl),
    appUrl: config.appUrl,
    port: config.port
  });
}
