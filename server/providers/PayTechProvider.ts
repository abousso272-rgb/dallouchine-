import crypto from 'crypto';
import { PaymentProvider, WebhookVerificationResult } from './PaymentProvider';
import {
  CreatePaymentSessionParams,
  CreatePaymentSessionResult,
  PaymentStatus,
  ProviderPaymentStatusResult
} from '../types/payment';
import { config } from '../config';

/**
 * Connecteur PayTech Sénégal (https://paytech.sn).
 * Encaissement multi-opérateurs : Wave, Orange Money, Free Money, Carte Bancaire.
 * Frais standard : 2% sur Mobile Money.
 * Règle de partage Dallou Chine : 1% pris en charge par le client (+1% au montant réglé),
 * et 1% pris en charge par Dallou Chine sur le versement net.
 */
export class PayTechProvider implements PaymentProvider {
  public readonly name = 'paytech';

  private get baseUrl() {
    return config.paytechBaseUrl;
  }

  private headers() {
    return {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'API_KEY': config.paytechApiKey,
      'API_SECRET': config.paytechApiSecret
    };
  }

  static mapStatus(typeEvent?: string): PaymentStatus {
    const ev = (typeEvent || '').toLowerCase().trim();
    if (ev === 'sale_complete' || ev === 'completed' || ev === 'paid') return 'paid';
    if (ev === 'sale_canceled' || ev === 'canceled' || ev === 'cancelled') return 'cancelled';
    if (ev === 'expired') return 'expired';
    if (ev === 'failed' || ev === 'declined') return 'failed';
    return 'pending';
  }

  /**
   * Crée une demande de paiement PayTech et retourne le lien de redirection de checkout.
   * Ajoute 1% au montant client (partage des 2% de frais : 1% client / 1% Dallou Chine).
   */
  async createPaymentSession(params: CreatePaymentSessionParams): Promise<CreatePaymentSessionResult> {
    const baseAmount = Math.max(0, Math.round(params.amount));
    // Partage 50/50 des 2% : le client supporte 1%
    const clientFeeShare = Math.round(baseAmount * 0.01);
    const totalToCharge = baseAmount + clientFeeShare;

    const metadata = {
      order_id: params.orderId,
      order_code: params.orderCode,
      merchant_reference: params.merchantReference,
      user_id: params.userId || null,
      base_amount: baseAmount,
      client_fee: clientFeeShare,
      charged_amount: totalToCharge,
      platform: 'dallouchine',
      ...(params.metadata || {})
    };

    const payload = {
      item_name: `Commande ${params.orderCode}`,
      item_price: totalToCharge,
      currency: params.currency || 'XOF',
      ref_command: params.merchantReference || params.orderCode,
      command_name: `Paiement ${params.orderCode} · Dallou Chine`,
      env: config.paytechEnv,
      ipn_url: `${config.appUrl}/api/webhooks/paytech`,
      success_url: params.returnUrl,
      cancel_url: params.cancelUrl,
      custom_field: JSON.stringify(metadata)
    };

    try {
      const res = await fetch(`${this.baseUrl}/payment/request-payment`, {
        method: 'POST',
        headers: this.headers(),
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(20_000)
      });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const json: any = await res.json().catch(() => ({}));

      if (!res.ok || json?.success !== 1 || !json?.redirect_url) {
        console.warn('[PayTech] Demande de paiement refusée:', res.status, JSON.stringify(json).slice(0, 400));
        const unavailable = res.status >= 500 || res.status === 429;
        return {
          success: false,
          paymentId: params.orderId,
          checkoutUrl: '',
          errorMessage: unavailable
            ? 'Le service de paiement PayTech est momentanément indisponible. Votre commande est conservée : relancez le paiement dans un instant.'
            : (Array.isArray(json?.errors) ? json.errors.join(', ') : json?.message || `Refus passerelle PayTech (HTTP ${res.status}).`)
        };
      }

      return {
        success: true,
        paymentId: params.orderId,
        checkoutUrl: json.redirect_url,
        providerTransactionId: json.token ? String(json.token) : undefined,
        providerReference: params.merchantReference
      };
    } catch (err) {
      console.error('[PayTech] Passerelle injoignable:', (err as Error)?.message);
      return {
        success: false,
        paymentId: params.orderId,
        checkoutUrl: '',
        errorMessage: 'La passerelle PayTech est inaccessible pour le moment. Réessayez dans quelques instants.'
      };
    }
  }

  /**
   * Vérifie l'authenticité de la notification IPN PayTech via les hash SHA-256 des clés.
   */
  async verifyWebhook(
    rawBody: string | Buffer,
    _headers: Record<string, string | string[] | undefined>
  ): Promise<WebhookVerificationResult> {
    const raw = typeof rawBody === 'string' ? rawBody : rawBody.toString('utf8');

    let payload: any;
    try {
      payload = JSON.parse(raw);
    } catch {
      // Peut arriver si PayTech envoie en format URL-encoded
      const params = new URLSearchParams(raw);
      payload = Object.fromEntries(params.entries());
    }

    if (!payload || typeof payload !== 'object') {
      return { isValid: false, reason: 'Payload PayTech invalide.' };
    }

    if (!config.paytechApiSecret || !config.paytechApiKey) {
      return { isValid: false, reason: 'Clés PAYTECH_API_KEY ou PAYTECH_API_SECRET non configurées sur le serveur.' };
    }

    // PayTech envoie api_secret_sha256 et api_key_sha256 dans l'IPN
    const receivedSecretHash = String(payload.api_secret_sha256 || '').toLowerCase().trim();
    const receivedKeyHash = String(payload.api_key_sha256 || '').toLowerCase().trim();

    const expectedSecretHash = crypto.createHash('sha256').update(config.paytechApiSecret).digest('hex').toLowerCase();
    const expectedKeyHash = crypto.createHash('sha256').update(config.paytechApiKey).digest('hex').toLowerCase();

    // Vérification cryptographique à temps constant
    const secA = Buffer.from(expectedSecretHash);
    const secB = Buffer.from(receivedSecretHash);
    const keyA = Buffer.from(expectedKeyHash);
    const keyB = Buffer.from(receivedKeyHash);

    const secretMatches = secA.length === secB.length && crypto.timingSafeEqual(secA, secB);
    const keyMatches = keyA.length === keyB.length && crypto.timingSafeEqual(keyA, keyB);

    if (!secretMatches || !keyMatches) {
      return { isValid: false, reason: 'Signature de sécurité PayTech invalide.' };
    }

    const typeEvent = String(payload.type_event || '').toLowerCase();
    const status = PayTechProvider.mapStatus(typeEvent);

    let metadata: any = {};
    if (payload.custom_field) {
      try {
        metadata = typeof payload.custom_field === 'string' ? JSON.parse(payload.custom_field) : payload.custom_field;
      } catch {
        /* custom_field brut */
      }
    }

    const chargedAmount = Number(payload.item_price || metadata.charged_amount || 0);
    const orderId = metadata.order_id;
    const merchantReference = String(payload.ref_command || metadata.merchant_reference || '');

    return {
      isValid: true,
      eventType: typeEvent,
      eventId: `paytech_${payload.token || merchantReference}_${typeEvent}`,
      providerTransactionId: payload.token ? String(payload.token) : undefined,
      providerReference: merchantReference,
      status,
      amount: chargedAmount,
      currency: payload.currency || 'XOF',
      orderId,
      rawPayload: payload
    };
  }

  /**
   * Statut certifié d'une transaction PayTech.
   */
  async getPaymentStatus(providerTransactionId: string): Promise<ProviderPaymentStatusResult> {
    return {
      providerTransactionId,
      status: 'pending',
      amount: 0,
      currency: 'XOF'
    };
  }
}

