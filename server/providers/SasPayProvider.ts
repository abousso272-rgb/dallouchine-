import crypto from 'crypto';
import { PaymentProvider, WebhookVerificationResult } from './PaymentProvider';
import { CreatePaymentSessionParams, CreatePaymentSessionResult, PaymentStatus, ProviderPaymentStatusResult } from '../types/payment';
import { ProxyAgent } from 'undici';
import { config } from '../config';

let proxyAgent: ProxyAgent | null = null;
function proxyDispatcher() {
  if (!config.saspayProxyUrl) return undefined;
  if (!proxyAgent) proxyAgent = new ProxyAgent(config.saspayProxyUrl);
  return proxyAgent;
}

/**
 * Connecteur SasPay (https://docs.saspay.me).
 *  - Page de paiement hébergée : POST /checkout-sessions/ (Wave, Orange Money, cartes…)
 *  - Vérification directe : GET /checkout-sessions/{id}/status/ puis GET /payments/{id}/verify/
 *  - Notifications : HMAC-SHA256 de « horodatage.corps » (en-têtes X-Webhook-*)
 * Aucune confirmation n'est jamais prise sur la seule foi d'une notification : le paiement est
 * relu auprès de l'API avec la clé secrète avant d'être transmis à la base.
 */
export class SasPayProvider implements PaymentProvider {
  public readonly name = 'saspay';

  private get baseUrl() {
    return config.saspayBaseUrl;
  }

  private headers(extra: Record<string, string> = {}) {
    return { Authorization: `Bearer ${config.saspaySecretKey}`, 'Content-Type': 'application/json', Accept: 'application/json', ...extra };
  }

  private async call(method: 'GET' | 'POST', path: string, body?: unknown, extraHeaders: Record<string, string> = {}, viaFixedIp = false) {
    const dispatcher = viaFixedIp ? proxyDispatcher() : undefined;
    const res = await fetch(`${this.baseUrl}${path}`, {
      method,
      headers: this.headers(extraHeaders),
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(20_000),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ...(dispatcher ? ({ dispatcher } as any) : {})
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const json: any = await res.json().catch(() => ({}));
    return { res, json, data: json?.data ?? json };
  }

  static mapStatus(raw?: string): PaymentStatus {
    switch ((raw || '').toUpperCase()) {
      case 'SUCCESS':
      case 'PAID':
        return 'paid';
      case 'FAILED':
        return 'failed';
      case 'CANCELLED':
      case 'CANCELED':
        return 'cancelled';
      case 'EXPIRED':
        return 'expired';
      default:
        return 'pending';
    }
  }

  async createPaymentSession(params: CreatePaymentSessionParams): Promise<CreatePaymentSessionResult> {
    const email = params.customer.email || `client+${params.orderCode.toLowerCase()}@dallouchine.vercel.app`;
    const payload = {
      amount: Math.round(params.amount).toFixed(2),
      currency: params.currency || 'XOF',
      description: `${params.description || `Commande ${params.orderCode}`} · ${params.merchantReference || ''}`.trim(),
      country: 'SN',
      customer_name: params.customer.name || 'Client Dallou Chine',
      customer_email: email,
      customer_phone: params.customer.phone || '',
      return_url: params.returnUrl,
      expires_at: new Date(Date.now() + 48 * 3600 * 1000).toISOString(),
      fee_charge_mode: config.saspayFeeMode,
      metadata: {
        order_id: params.orderId,
        order_code: params.orderCode,
        merchant_reference: params.merchantReference,
        user_id: params.userId || null,
        platform: 'dallouchine',
        ...(params.metadata || {})
      }
    };
    try {
      const { res, json, data } = await this.call('POST', '/checkout-sessions/', payload);
      if (!res.ok || !data?.checkout_url) {
        console.warn('[SasPay] création de session refusée', res.status, JSON.stringify(json).slice(0, 400));
        const unavailable = res.status >= 500 || res.status === 429;
        return {
          success: false,
          paymentId: params.orderId,
          checkoutUrl: '',
          errorMessage: unavailable
            ? 'Le service de paiement est momentanément indisponible. Votre commande est enregistrée : relancez le paiement depuis « Mes commandes » dans quelques minutes.'
            : res.status === 401 || res.status === 403
              ? 'Le paiement en ligne est en cours de configuration. Contactez-nous pour finaliser votre commande.'
              : json?.error?.message || json?.message || `Le paiement a été refusé par la passerelle (HTTP ${res.status}).`
        };
      }
      return {
        success: true,
        paymentId: params.orderId,
        checkoutUrl: data.checkout_url,
        providerTransactionId: String(data.id),
        providerReference: params.merchantReference,
        expiresAt: data.expires_at || payload.expires_at
      };
    } catch (err) {
      console.error('[SasPay] passerelle injoignable:', (err as Error)?.message);
      return {
        success: false,
        paymentId: params.orderId,
        checkoutUrl: '',
        errorMessage: 'La passerelle de paiement est momentanément inaccessible. Réessayez dans quelques instants.'
      };
    }
  }

  /** Statut certifié d'une session de paiement (identifiant de session SasPay). */
  async getPaymentStatus(sessionId: string): Promise<ProviderPaymentStatusResult> {
    const fallback: ProviderPaymentStatusResult = { providerTransactionId: sessionId, status: 'pending', amount: 0, currency: 'XOF' };
    try {
      const st = await this.call('GET', `/checkout-sessions/${encodeURIComponent(sessionId)}/status/`);
      if (!st.res.ok) return fallback;
      const sessionStatus = String(st.data?.status || '').toUpperCase();
      const txId: string | undefined = st.data?.transaction_id;
      if (sessionStatus !== 'PAID' || !txId) {
        return { ...fallback, status: sessionStatus === 'EXPIRED' ? 'expired' : sessionStatus === 'CANCELLED' ? 'cancelled' : 'pending' };
      }
      const tx = await this.verifyTransaction(txId);
      return tx || fallback;
    } catch (err) {
      console.warn('[SasPay] statut indisponible:', (err as Error)?.message);
      return fallback;
    }
  }

  /** Relecture d'une transaction d'encaissement auprès de l'API (source de vérité). */
  async verifyTransaction(txId: string): Promise<ProviderPaymentStatusResult | null> {
    const v = await this.call('GET', `/payments/${encodeURIComponent(txId)}/verify/`);
    if (!v.res.ok) return null;
    const d = v.data || {};
    if (d.flow_direction && String(d.flow_direction).toUpperCase() !== 'INBOUND') return null;
    return {
      providerTransactionId: String(d.id || txId),
      status: SasPayProvider.mapStatus(d.status),
      amount: Number(d.requested_amount || 0),
      currency: d.currency || 'XOF',
      paidAt: d.updated_at,
      netAmount: d.net_amount !== undefined ? Number(d.net_amount) : undefined,
      chargedAmount: d.debited_amount !== undefined ? Number(d.debited_amount) : undefined,
      feeChargeMode: d.fee_charge_mode,
      network: typeof d.network === 'string' && !/^[0-9a-f-]{36}$/i.test(d.network) ? d.network : undefined,
      txReference: d.reference,
      rawResponse: d
    };
  }

  /**
   * Retrouve, parmi les sessions payées récemment, celle qui correspond à la transaction :
   * elle porte notre numéro de commande et notre référence dans ses métadonnées.
   */
  async findSessionForTransaction(txId: string): Promise<{ id: string; orderId?: string; merchantReference?: string } | null> {
    const l = await this.call('GET', '/checkout-sessions/?status=PAID&page_size=100');
    if (!l.res.ok) return null;
    const rows: any[] = Array.isArray(l.json?.results) ? l.json.results : Array.isArray(l.data?.results) ? l.data.results : Array.isArray(l.data) ? l.data : [];
    for (const s of rows) {
      const t = typeof s.transaction === 'object' && s.transaction ? s.transaction.id : s.transaction;
      if (t && String(t) === String(txId)) {
        return { id: String(s.id), orderId: s.metadata?.order_id, merchantReference: s.metadata?.merchant_reference };
      }
    }
    return null;
  }

  /** Réseaux disponibles (encaissement / envoi) pour un pays, d'après les tarifs du compte. */
  async listNetworks(country = 'SN'): Promise<{ code: string; name: string; payin: boolean; payout: boolean; otpRequired: boolean; payinPercent?: number }[]> {
    const r = await this.call('GET', '/pricing/my-rates/');
    if (!r.res.ok) return [];
    const rows: any[] = Array.isArray(r.data) ? r.data : Array.isArray(r.data?.results) ? r.data.results : Array.isArray(r.json?.results) ? r.json.results : [];
    return rows
      .filter(x => !country || String(x.country_code || '').toUpperCase() === country)
      .map(x => ({
        code: String(x.network_code),
        name: String(x.network_name || x.network_code),
        payin: Boolean(x.payin?.available ?? x.payin),
        payout: Boolean(x.payout?.available ?? x.payout),
        otpRequired: Boolean(x.otp_required),
        payinPercent: x.payin?.tiers?.[0]?.percent !== undefined ? Number(x.payin.tiers[0].percent) : undefined
      }));
  }

  /**
   * Envoi d'argent (remboursement) vers un compte mobile money. SasPay exige une adresse IP en liste
   * blanche : l'appel passe par SASPAY_PROXY_URL (relais à IP fixe) s'il est configuré.
   */
  async payout(p: {
    idempotencyKey: string;
    amount: number;
    networkCode: string;
    msisdn: string;
    customer: { firstName: string; lastName: string; email: string; phone: string };
    description: string;
    metadata?: Record<string, unknown>;
  }): Promise<{ success: boolean; payoutId?: string; errorCode?: string; errorMessage?: string }> {
    try {
      const { res, json, data } = await this.call(
        'POST',
        '/payouts/initialize/',
        {
          amount: Math.round(p.amount).toFixed(2),
          currency: 'XOF',
          country: 'SN',
          method: p.networkCode,
          recipient: { msisdn: p.msisdn },
          customer: { email: p.customer.email, first_name: p.customer.firstName, last_name: p.customer.lastName, phone: p.customer.phone },
          description: p.description,
          metadata: p.metadata || {},
          fee_charge_mode: 'ADD_ON'
        },
        { 'Idempotency-Key': p.idempotencyKey },
        true
      );
      if (res.ok && (data?.id || json?.id)) return { success: true, payoutId: String(data?.id || json?.id) };
      const code = json?.error?.code || json?.code || `HTTP_${res.status}`;
      const messages: Record<string, string> = {
        ip_not_whitelisted: 'SasPay refuse l’envoi : l’adresse IP du serveur n’est pas autorisée (liste blanche). Configurez un relais à IP fixe ou remboursez depuis le tableau de bord SasPay.',
        payout_not_enabled: 'Les envois d’argent ne sont pas activés sur votre compte SasPay.',
        insufficient_balance: 'Solde SasPay insuffisant pour ce remboursement.',
        invalid_method: 'Réseau mobile money non pris en charge pour l’envoi.',
        invalid_customer: 'Coordonnées du bénéficiaire invalides.',
        no_route_available: 'Aucune route disponible actuellement pour ce réseau.'
      };
      return { success: false, errorCode: String(code), errorMessage: messages[code] || json?.error?.message || json?.message || `Envoi refusé (HTTP ${res.status}).` };
    } catch (err) {
      return { success: false, errorCode: 'UNREACHABLE', errorMessage: 'SasPay est injoignable pour le moment.' };
    }
  }

  async verifyWebhook(rawBody: string | Buffer, headers: Record<string, string | string[] | undefined>): Promise<WebhookVerificationResult> {
    const raw = typeof rawBody === 'string' ? rawBody : rawBody.toString('utf8');
    const h = (n: string) => {
      const v = headers[n] ?? headers[n.toLowerCase()];
      return Array.isArray(v) ? v[0] : v;
    };
    if (!config.saspayWebhookSecret) return { isValid: false, reason: 'SASPAY_WEBHOOK_SECRET non configuré sur le serveur.' };
    const signature = (h('x-webhook-signature') || '').trim().toLowerCase();
    const timestamp = h('x-webhook-timestamp') || '';
    if (!signature || !/^\d{9,11}$/.test(timestamp)) return { isValid: false, reason: 'En-têtes de signature manquants.' };
    if (Math.abs(Date.now() / 1000 - Number(timestamp)) > 300) return { isValid: false, reason: 'Horodatage hors tolérance (anti-rejeu).' };
    const expected = crypto.createHmac('sha256', config.saspayWebhookSecret).update(`${timestamp}.${raw}`).digest('hex');
    const a = Buffer.from(expected);
    const b = Buffer.from(signature);
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return { isValid: false, reason: 'Signature cryptographique invalide.' };

    let payload: any;
    try {
      payload = JSON.parse(raw);
    } catch {
      return { isValid: false, reason: 'Payload JSON malformé.' };
    }
    const event = String(payload.event || h('x-webhook-event') || '');
    const data = payload.data || {};
    const type = String(data.type || '').toUpperCase();
    // Seuls les encaissements nous concernent (pas les retraits ni les transferts)
    const relevant = event.startsWith('transaction.') && (!type || type === 'PAYIN' || type === 'PAIEMENT');
    return {
      isValid: true,
      eventType: event,
      eventId: `saspay_${data.id}_${event}`,
      providerTransactionId: data.id ? String(data.id) : undefined,
      status: relevant ? SasPayProvider.mapStatus(event.replace('transaction.', '')) : 'pending',
      amount: Number(data.amount || 0),
      currency: data.currency || 'XOF',
      rawPayload: payload
    };
  }
}
