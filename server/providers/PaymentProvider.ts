import {
  CreatePaymentSessionParams,
  CreatePaymentSessionResult,
  ProviderPaymentStatusResult,
  PaymentStatus
} from '../types/payment';

export interface WebhookVerificationResult {
  isValid: boolean;
  reason?: string;
  eventType?: string;
  eventId?: string;
  providerTransactionId?: string;
  providerReference?: string;
  status?: PaymentStatus;
  amount?: number;
  currency?: string;
  orderId?: string;
  paymentId?: string;
  rawPayload?: any;
}

export interface PaymentProvider {
  name: string;

  /**
   * Initialise une session de paiement hébergée (Hosted Checkout)
   */
  createPaymentSession(params: CreatePaymentSessionParams): Promise<CreatePaymentSessionResult>;

  /**
   * Vérifie la signature cryptographique (HMAC-SHA256) et l'anti-rejeu du webhook
   */
  verifyWebhook(
    rawBody: string | Buffer,
    headers: Record<string, string | string[] | undefined>
  ): Promise<WebhookVerificationResult>;

  /**
   * Interroge l'API du fournisseur pour obtenir le statut certifié d'une transaction
   */
  getPaymentStatus(providerTransactionId: string): Promise<ProviderPaymentStatusResult>;

  /**
   * Remboursement (si supporté)
   */
  refundPayment?(
    providerTransactionId: string,
    amount?: number,
    reason?: string
  ): Promise<{ success: boolean; refundId?: string; errorMessage?: string }>;
}
