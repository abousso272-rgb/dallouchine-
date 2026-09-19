import crypto from 'crypto';
import {
  PaymentProvider,
  WebhookVerificationResult
} from './PaymentProvider';
import {
  CreatePaymentSessionParams,
  CreatePaymentSessionResult,
  ProviderPaymentStatusResult,
  PaymentStatus
} from '../types/payment';
import { config } from '../config';

export class GeniusPayProvider implements PaymentProvider {
  public readonly name = 'geniuspay';

  private readonly apiKey: string;
  private readonly webhookSecret: string;
  private readonly baseUrl: string;
  private readonly environment: 'sandbox' | 'production';

  constructor(customConfig?: {
    apiKey?: string;
    webhookSecret?: string;
    baseUrl?: string;
    environment?: 'sandbox' | 'production';
  }) {
    this.apiKey = customConfig?.apiKey || config.geniusPayApiKey;
    this.webhookSecret = customConfig?.webhookSecret || config.geniusPayWebhookSecret;
    this.baseUrl = (customConfig?.baseUrl || config.geniusPayBaseUrl).replace(/\/+$/, '');
    this.environment = customConfig?.environment || config.geniusPayEnvironment;
  }

  /**
   * Crée une session de paiement hébergée (Hosted Checkout) auprès de GeniusPay
   */
  async createPaymentSession(params: CreatePaymentSessionParams): Promise<CreatePaymentSessionResult> {
    const endpoint = `${this.baseUrl}/merchant/payments`;

    const payload = {
      amount: params.amount,
      currency: params.currency || 'XOF',
      description: `Commande ${params.orderCode} - SinoSenegal Sourcing & Transit`,
      customer_name: params.customer.name,
      customer_email: params.customer.email,
      customer_phone: params.customer.phone,
      redirect_url: params.returnUrl,
      cancel_url: params.cancelUrl,
      webhook_url: params.webhookUrl || `${config.appUrl}/api/payments/webhooks/geniuspay`,
      merchant_reference: params.merchantReference,
      metadata: {
        order_id: params.orderId,
        order_code: params.orderCode,
        merchant_reference: params.merchantReference,
        user_id: params.userId || null,
        created_by: 'sinosenegal_platform',
        ...(params.metadata || {})
      }
    };

    console.log('[GeniusPayProvider] Initiating payment session for order:', {
      orderId: params.orderId,
      orderCode: params.orderCode,
      merchantReference: params.merchantReference,
      amount: params.amount,
      currency: params.currency
    });

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
          'X-API-KEY': this.apiKey
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        const data = await response.json();
        const checkoutUrl = data.checkout_url || data.payment_url || data.url || data.data?.checkout_url;
        const providerTransactionId = data.id || data.transaction_id || data.data?.id || `gp_tx_${Date.now()}`;
        const providerReference = data.reference || data.data?.reference || params.merchantReference || `GP-REF-${Date.now()}`;

        return {
          success: true,
          paymentId: params.orderId,
          checkoutUrl: checkoutUrl || `/payment/hosted-checkout?tx=${providerTransactionId}&orderId=${params.orderId}&code=${params.orderCode}&amount=${params.amount}&ref=${encodeURIComponent(params.merchantReference || '')}`,
          providerTransactionId,
          providerReference,
          expiresAt: data.expires_at || new Date(Date.now() + 30 * 60 * 1000).toISOString()
        };
      } else {
        if (this.environment === 'production') {
          console.error('[GeniusPayProvider] Production API error:', response.status);
          return {
            success: false,
            paymentId: params.orderId,
            checkoutUrl: '',
            errorMessage: `La passerelle de paiement a retourné une erreur (HTTP ${response.status}).`
          };
        }

        console.warn('[GeniusPayProvider] Provider returned status', response.status, '- activating sandbox checkout session.');
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

      console.warn('[GeniusPayProvider] Live gateway unreachable in sandbox, activating simulator:', err.message || err);
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
   * Vérification de la signature HMAC-SHA256 et protection anti-rejeu du Webhook
   */
  async verifyWebhook(
    rawBody: string | Buffer,
    headers: Record<string, string | string[] | undefined>
  ): Promise<WebhookVerificationResult> {
    const rawString = typeof rawBody === 'string' ? rawBody : rawBody.toString('utf8');

    // Récupération des en-têtes de signature
    const signatureHeader = (
      headers['x-geniuspay-signature'] ||
      headers['x-signature'] ||
      headers['genius-webhook-token'] ||
      headers['signature']
    ) as string | undefined;

    const timestampHeader = (
      headers['x-geniuspay-timestamp'] ||
      headers['x-timestamp'] ||
      headers['timestamp']
    ) as string | undefined;

    // RÈGLE CRITIQUE : Un webhook sans signature doit TOUJOURS être rejeté
    if (!signatureHeader) {
      return {
        isValid: false,
        reason: 'En-tête de signature manquant dans la requête webhook.'
      };
    }

    // 1. Protection Anti-Rejeu (Replay Attack Prevention) : Tolérance de 5 minutes (300 secondes)
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
    const payloadToSign = timestampHeader ? `${timestampHeader}.${rawString}` : rawString;
    const expectedSignature = crypto
      .createHmac('sha256', this.webhookSecret)
      .update(payloadToSign)
      .digest('hex');

    const isValidSignature = this.timingSafeEqual(expectedSignature, signatureHeader);

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

    const eventType = parsedPayload.event || parsedPayload.type || parsedPayload.event_type || 'payment_intent.confirmed';
    const eventId = parsedPayload.id || parsedPayload.event_id || parsedPayload.data?.id || `evt_${Date.now()}`;
    const dataObj = parsedPayload.data || parsedPayload;

    const providerTransactionId = dataObj.transaction_id || dataObj.id || dataObj.payment_id;
    const providerReference = dataObj.merchant_reference || dataObj.metadata?.merchant_reference || dataObj.reference || dataObj.provider_reference;
    const rawStatus = (dataObj.status || dataObj.payment_status || '').toLowerCase();

    const mappedStatus = this.mapProviderStatus(rawStatus, eventType);
    const amount = Number(dataObj.amount !== undefined ? dataObj.amount : (dataObj.total_amount !== undefined ? dataObj.total_amount : 0));
    const currency = dataObj.currency || 'XOF';
    const orderId = dataObj.metadata?.order_id || parsedPayload.order_id || dataObj.order_id;
    const paymentId = dataObj.metadata?.payment_id;

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
   * Consultation du statut d'une transaction directement auprès de GeniusPay
   */
  async getPaymentStatus(providerTransactionId: string): Promise<ProviderPaymentStatusResult> {
    const endpoint = `${this.baseUrl}/merchant/payments/${providerTransactionId}`;

    try {
      const response = await fetch(endpoint, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
          'X-API-KEY': this.apiKey
        }
      });

      if (response.ok) {
        const data = await response.json();
        const paymentData = data.data || data;
        const mappedStatus = this.mapProviderStatus(paymentData.status);

        return {
          providerTransactionId,
          status: mappedStatus,
          amount: Number(paymentData.amount || 0),
          currency: paymentData.currency || 'XOF',
          paymentMethod: paymentData.payment_method,
          paidAt: paymentData.paid_at || (mappedStatus === 'paid' ? new Date().toISOString() : undefined),
          rawResponse: data
        };
      }
    } catch (err: any) {
      console.warn('[GeniusPayProvider] Failed to fetch payment status from API:', err.message || err);
    }

    return {
      providerTransactionId,
      status: 'pending',
      amount: 0,
      currency: 'XOF'
    };
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
      event === 'payment_failed' ||
      event === 'payment.declined'
    ) {
      return 'failed';
    }

    if (
      status === 'cancelled' ||
      status === 'canceled' ||
      event === 'payment_cancelled' ||
      event === 'payment.cancelled'
    ) {
      return 'cancelled';
    }

    if (
      status === 'expired' ||
      event === 'payment_expired' ||
      event === 'payment_intent.expired'
    ) {
      return 'expired';
    }

    if (
      status === 'refunded' ||
      status === 'partially_refunded' ||
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
