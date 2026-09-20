import crypto from 'crypto';
import {
  PaymentProvider,
  WebhookVerificationResult
} from './PaymentProvider';
import {
  CreatePaymentSessionParams,
  CreatePaymentSessionResult,
  ProviderPaymentStatusResult,
  PaymentStatus,
  GeniusPayAccountInfo,
  GeniusPayAccountBalance,
  GeniusPayTransactionItem
} from '../types/payment';
import { config } from '../config';

export class GeniusPayProvider implements PaymentProvider {
  public readonly name = 'geniuspay';

  private readonly apiKey: string;
  private readonly apiSecret: string;
  private readonly webhookSecret: string;
  private readonly baseUrl: string;
  private readonly environment: 'sandbox' | 'production';

  constructor(customConfig?: {
    apiKey?: string;
    apiSecret?: string;
    webhookSecret?: string;
    baseUrl?: string;
    environment?: 'sandbox' | 'production';
  }) {
    this.apiKey = customConfig?.apiKey || config.geniusPayApiKey;
    this.apiSecret = customConfig?.apiSecret || config.geniusPayApiSecret;
    this.webhookSecret = customConfig?.webhookSecret || config.geniusPayWebhookSecret;
    this.baseUrl = (customConfig?.baseUrl || config.geniusPayBaseUrl).replace(/\/+$/, '');
    this.environment = customConfig?.environment || config.geniusPayEnvironment;
  }

  /**
   * En-têtes HTTP requis par l'API GeniusPay
   * X-API-Key : Clé publique (pk_sandbox_... ou pk_live_...)
   * X-API-Secret : Clé secrète (sk_sandbox_... ou sk_live_...)
   */
  private getHeaders(): Record<string, string> {
    return {
      'X-API-Key': this.apiKey,
      'X-API-Secret': this.apiSecret,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };
  }

  /**
   * 1. POST /payments - Initier un paiement
   * Documentation : Crée une transaction et retourne checkout_url (mode Hosted Checkout)
   * ou payment_url (mode direct si payment_method est spécifié).
   */
  async createPaymentSession(params: CreatePaymentSessionParams): Promise<CreatePaymentSessionResult> {
    const endpoint = `${this.baseUrl}/payments`;

    const payload: Record<string, any> = {
      amount: Math.round(params.amount),
      currency: params.currency || 'XOF',
      description: params.description || `Commande ${params.orderCode} - Dallou Chine`,
      customer: {
        name: params.customer.name || 'Client Dallou Chine',
        email: params.customer.email || 'client@dallouchine.sn',
        phone: params.customer.phone || ''
      },
      success_url: params.returnUrl,
      error_url: params.cancelUrl,
      metadata: {
        order_id: params.orderId,
        order_code: params.orderCode,
        merchant_reference: params.merchantReference,
        user_id: params.userId || null,
        platform: 'dallou_chine',
        ...(params.metadata || {})
      }
    };

    // Si une méthode de paiement spécifique est demandée (wave, orange_money, mtn_money, card)
    if (params.paymentMethod && ['wave', 'orange_money', 'mtn_money', 'card', 'paystack'].includes(params.paymentMethod)) {
      payload.payment_method = params.paymentMethod;
    }

    console.log('[GeniusPayProvider] Initiating payment request to GeniusPay:', {
      endpoint,
      amount: payload.amount,
      currency: payload.currency,
      paymentMethod: payload.payment_method || 'hosted_checkout',
      orderId: params.orderId,
      merchantReference: params.merchantReference
    });

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        const json = await response.json();
        const data = json.data || json;
        const checkoutUrl = data.checkout_url || data.payment_url || json.checkout_url || json.payment_url;
        const providerTransactionId = String(data.id || json.id || `gp_tx_${Date.now()}`);
        const providerReference = data.reference || json.reference || params.merchantReference || `GP-REF-${Date.now()}`;

        return {
          success: true,
          paymentId: params.orderId,
          checkoutUrl: checkoutUrl || `/payment/hosted-checkout?tx=${providerTransactionId}&orderId=${params.orderId}&code=${params.orderCode}&amount=${params.amount}&ref=${encodeURIComponent(params.merchantReference || '')}`,
          providerTransactionId,
          providerReference,
          expiresAt: data.expires_at || new Date(Date.now() + 30 * 60 * 1000).toISOString()
        };
      } else {
        const errText = await response.text();
        console.warn(`[GeniusPayProvider] Gateway response error HTTP ${response.status}:`, errText);

        if (this.environment === 'production') {
          return {
            success: false,
            paymentId: params.orderId,
            checkoutUrl: '',
            errorMessage: `La passerelle de paiement a retourné une erreur (HTTP ${response.status}).`
          };
        }

        // Mode Sandbox : simulateur fluide si les clés fournies sont de test ou si l'API distante est indisponible
        console.warn('[GeniusPayProvider] Activating sandbox simulator fallback for development.');
        const mockTxId = `gp_tx_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
        const mockRef = params.merchantReference || `GP-REF-${Math.floor(100000 + Math.random() * 900000)}`;

        return {
          success: true,
          paymentId: params.orderId,
          checkoutUrl: `/payment/hosted-checkout?tx=${mockTxId}&orderId=${params.orderId}&code=${params.orderCode}&amount=${params.amount}&ref=${encodeURIComponent(mockRef)}`,
          providerTransactionId: mockTxId,
          providerReference: mockRef,
          expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString()
        };
      }
    } catch (err: any) {
      if (this.environment === 'production') {
        console.error('[GeniusPayProvider] Production live gateway unreachable:', err.message || err);
        return {
          success: false,
          paymentId: params.orderId,
          checkoutUrl: '',
          errorMessage: 'La passerelle de paiement GeniusPay est temporairement inaccessible.'
        };
      }

      console.warn('[GeniusPayProvider] Remote API unreachable in sandbox, activating simulator:', err.message || err);
      const mockTxId = `gp_tx_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const mockRef = params.merchantReference || `GP-REF-${Math.floor(100000 + Math.random() * 900000)}`;

      return {
        success: true,
        paymentId: params.orderId,
        checkoutUrl: `/payment/hosted-checkout?tx=${mockTxId}&orderId=${params.orderId}&code=${params.orderCode}&amount=${params.amount}&ref=${encodeURIComponent(mockRef)}`,
        providerTransactionId: mockTxId,
        providerReference: mockRef,
        expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString()
      };
    }
  }

  /**
   * 2. Vérification cryptographique de la signature HMAC-SHA256 du Webhook
   * Supporte :
   * - hash_hmac('sha256', payload, secret) (Standard officiel GeniusPay documenté)
   * - hash_hmac('sha256', `${timestamp}.${payload}`, secret) (Avec horodatage anti-rejeu)
   */
  async verifyWebhook(
    rawBody: string | Buffer,
    headers: Record<string, string | string[] | undefined>
  ): Promise<WebhookVerificationResult> {
    const rawString = typeof rawBody === 'string' ? rawBody : rawBody.toString('utf8');

    // Récupération des en-têtes officiels (Supporte X-Webhook-* et X-GeniusPay-*)
    const signatureHeader = (
      headers['x-webhook-signature'] ||
      headers['X-Webhook-Signature'] ||
      headers['x-geniuspay-signature'] ||
      headers['X-GeniusPay-Signature'] ||
      headers['x-signature'] ||
      headers['genius-webhook-token'] ||
      headers['signature']
    ) as string | undefined;

    const timestampHeader = (
      headers['x-webhook-timestamp'] ||
      headers['X-Webhook-Timestamp'] ||
      headers['x-geniuspay-timestamp'] ||
      headers['X-GeniusPay-Timestamp'] ||
      headers['x-timestamp'] ||
      headers['timestamp']
    ) as string | undefined;

    const eventHeader = (
      headers['x-webhook-event'] ||
      headers['X-Webhook-Event'] ||
      headers['x-geniuspay-event'] ||
      headers['X-GeniusPay-Event'] ||
      headers['event']
    ) as string | undefined;

    // RÈGLE CRITIQUE : Un webhook sans signature doit TOUJOURS être rejeté
    if (!signatureHeader) {
      return {
        isValid: false,
        reason: 'En-tête de signature manquant dans la requête webhook.'
      };
    }

    // 1. Protection Anti-Rejeu : Tolérance de 5 minutes (300 secondes) si le timestamp est présent
    if (timestampHeader) {
      const parsedTimestamp = parseInt(timestampHeader, 10);
      const currentTimeSeconds = Math.floor(Date.now() / 1000);
      const diff = Math.abs(currentTimeSeconds - parsedTimestamp);

      if (isNaN(parsedTimestamp) || diff > 300) {
        return {
          isValid: false,
          reason: `Timestamp webhook expiré ou hors fenêtre de tolérance (${diff}s).`
        };
      }
    }

    // 2. Vérification cryptographique HMAC-SHA256
    const expectedDirectSignature = crypto
      .createHmac('sha256', this.webhookSecret)
      .update(rawString)
      .digest('hex');

    const expectedTimestampedSignature = timestampHeader
      ? crypto.createHmac('sha256', this.webhookSecret).update(`${timestampHeader}.${rawString}`).digest('hex')
      : '';

    const isValidSignature =
      this.timingSafeEqual(expectedDirectSignature, signatureHeader) ||
      (Boolean(expectedTimestampedSignature) && this.timingSafeEqual(expectedTimestampedSignature, signatureHeader));

    if (!isValidSignature) {
      return {
        isValid: false,
        reason: 'Signature cryptographique invalide.'
      };
    }

    // 3. Décodage du Payload JSON
    let parsedPayload: any;
    try {
      parsedPayload = JSON.parse(rawString);
    } catch {
      return {
        isValid: false,
        reason: 'Payload JSON malformé.'
      };
    }

    // Extraction selon la spec officielle GeniusPay :
    // payload: { event: "payment.success", timestamp: "...", data: { transaction: { id, reference, amount, status, metadata } } }
    const eventType = (parsedPayload.event || eventHeader || parsedPayload.type || 'payment.success').toString();
    const tx = parsedPayload.data?.transaction || parsedPayload.data || parsedPayload;

    const providerTransactionId = (tx.id || tx.transaction_id || tx.payment_id || `gp_tx_${Date.now()}`).toString();
    const providerReference = tx.reference || tx.merchant_reference || tx.provider_reference || '';
    const rawStatus = (tx.status || tx.payment_status || '').toLowerCase();
    const mappedStatus = this.mapProviderStatus(rawStatus, eventType);

    const amount = Number(tx.amount !== undefined ? tx.amount : (tx.total_amount !== undefined ? tx.total_amount : 0));
    const currency = tx.currency || 'XOF';
    const metadata = tx.metadata || parsedPayload.metadata || {};
    const orderId = metadata.order_id || tx.order_id || parsedPayload.order_id;
    const paymentId = metadata.payment_id || tx.payment_id;
    const eventId = parsedPayload.id || parsedPayload.event_id || `evt_${providerTransactionId}_${Date.now()}`;

    return {
      isValid: true,
      eventType,
      eventId,
      providerTransactionId,
      providerReference,
      status: mappedStatus,
      amount,
      currency,
      orderId,
      paymentId,
      rawPayload: parsedPayload
    };
  }

  /**
   * 3. GET /payments/{reference} - Récupérer un paiement certifié
   */
  async getPaymentStatus(referenceOrId: string): Promise<ProviderPaymentStatusResult> {
    const endpoint = `${this.baseUrl}/payments/${encodeURIComponent(referenceOrId)}`;

    try {
      const response = await fetch(endpoint, {
        method: 'GET',
        headers: this.getHeaders()
      });

      if (response.ok) {
        const json = await response.json();
        const tx = json.data || json;
        const mappedStatus = this.mapProviderStatus(tx.status);

        return {
          providerTransactionId: String(tx.id || referenceOrId),
          status: mappedStatus,
          amount: Number(tx.amount || 0),
          currency: tx.currency || 'XOF',
          paymentMethod: tx.payment_method,
          paidAt: tx.completed_at || tx.paid_at || (mappedStatus === 'paid' ? new Date().toISOString() : undefined),
          rawResponse: json
        };
      }
    } catch (err: any) {
      console.warn('[GeniusPayProvider] Failed to fetch payment status from API:', err.message || err);
    }

    return {
      providerTransactionId: referenceOrId,
      status: 'pending',
      amount: 0,
      currency: 'XOF'
    };
  }

  /**
   * 4. GET /payments - Lister les transactions GeniusPay
   */
  async listPayments(params?: {
    status?: 'pending' | 'completed' | 'failed';
    from?: string;
    to?: string;
    per_page?: number;
  }): Promise<{ success: boolean; data: GeniusPayTransactionItem[]; meta?: any }> {
    const query = new URLSearchParams();
    if (params?.status) query.append('status', params.status);
    if (params?.from) query.append('from', params.from);
    if (params?.to) query.append('to', params.to);
    if (params?.per_page) query.append('per_page', String(params.per_page));

    const endpoint = `${this.baseUrl}/payments${query.toString() ? `?${query.toString()}` : ''}`;

    try {
      const response = await fetch(endpoint, {
        method: 'GET',
        headers: this.getHeaders()
      });

      if (response.ok) {
        const json = await response.json();
        return {
          success: true,
          data: json.data || [],
          meta: json.meta
        };
      }
    } catch (err: any) {
      console.warn('[GeniusPayProvider] Failed to list payments:', err.message || err);
    }

    return { success: false, data: [] };
  }

  /**
   * 5. GET /account - Récupérer les informations du compte marchand
   */
  async getAccountInfo(): Promise<{ success: boolean; account?: GeniusPayAccountInfo; error?: string }> {
    const endpoint = `${this.baseUrl}/account`;

    try {
      const response = await fetch(endpoint, {
        method: 'GET',
        headers: this.getHeaders()
      });

      if (response.ok) {
        const json = await response.json();
        return {
          success: true,
          account: json.data || json
        };
      }
      return { success: false, error: `Erreur API compte marchand HTTP ${response.status}` };
    } catch (err: any) {
      return { success: false, error: err.message || 'Passerelle GeniusPay inaccessible' };
    }
  }

  /**
   * 6. GET /account/balance - Récupérer le solde du compte marchand
   */
  async getAccountBalance(): Promise<{ success: boolean; balance?: GeniusPayAccountBalance; error?: string }> {
    const endpoint = `${this.baseUrl}/account/balance`;

    try {
      const response = await fetch(endpoint, {
        method: 'GET',
        headers: this.getHeaders()
      });

      if (response.ok) {
        const json = await response.json();
        return {
          success: true,
          balance: json.data || json
        };
      }
      return { success: false, error: `Erreur API solde marchand HTTP ${response.status}` };
    } catch (err: any) {
      return { success: false, error: err.message || 'Passerelle GeniusPay inaccessible' };
    }
  }

  /**
   * Mapping des statuts documentés de GeniusPay vers les statuts internes de l'application
   */
  private mapProviderStatus(rawStatus?: string, eventType?: string): PaymentStatus {
    const status = (rawStatus || '').toLowerCase();
    const event = (eventType || '').toLowerCase();

    if (
      status === 'completed' ||
      status === 'paid' ||
      status === 'success' ||
      status === 'successful' ||
      event === 'payment.success' ||
      event === 'payment_success' ||
      event === 'payment_intent.confirmed' ||
      event === 'payment.completed'
    ) {
      return 'paid';
    }

    if (
      status === 'failed' ||
      status === 'declined' ||
      status === 'rejected' ||
      event === 'payment.failed' ||
      event === 'payment_failed' ||
      event === 'payment.declined'
    ) {
      return 'failed';
    }

    if (
      status === 'cancelled' ||
      status === 'canceled' ||
      event === 'payment.cancelled' ||
      event === 'payment_cancelled'
    ) {
      return 'cancelled';
    }

    if (
      status === 'expired' ||
      event === 'payment.expired' ||
      event === 'payment_expired'
    ) {
      return 'expired';
    }

    if (
      status === 'refunded' ||
      status === 'partially_refunded' ||
      event === 'payment.refunded' ||
      event === 'payment_refunded'
    ) {
      return 'refunded';
    }

    return 'pending';
  }

  /**
   * Comparaison en temps constant pour éviter les attaques temporelles (Timing Attacks)
   */
  private timingSafeEqual(a: string, b: string): boolean {
    if (!a || !b) return false;
    try {
      const bufA = Buffer.from(a);
      const bufB = Buffer.from(b);
      if (bufA.length !== bufB.length) return false;
      return crypto.timingSafeEqual(bufA, bufB);
    } catch {
      return a === b;
    }
  }
}
