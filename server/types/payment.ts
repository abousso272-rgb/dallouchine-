export type PaymentStatus = 
  | 'pending'
  | 'paid'
  | 'failed'
  | 'cancelled'
  | 'refunded'
  | 'expired';

export type InternalOrderStatus =
  | 'pending_payment'
  | 'paid'
  | 'processing'
  | 'purchased_in_china'
  | 'quality_control_passed'
  | 'shipped_from_china'
  | 'in_transit'
  | 'arrived_in_senegal'
  | 'customs_cleared'
  | 'arrived_at_hub'
  | 'ready_for_pickup'
  | 'out_for_delivery'
  | 'delivered'
  | 'cancelled';

export interface PaymentItem {
  id: string;
  orderId: string;
  orderCode: string;
  userId?: string;
  provider: 'geniuspay' | 'mock_sandbox';
  providerTransactionId?: string;
  providerReference?: string;
  amount: number;
  currency: 'XOF' | 'USD' | 'EUR';
  status: PaymentStatus;
  paymentMethod?: string;
  checkoutUrl?: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  metadata?: Record<string, any>;
  expiresAt?: string;
  paidAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PaymentAttempt {
  id: string;
  paymentId: string;
  orderId: string;
  attemptNumber: number;
  status: PaymentStatus;
  providerTransactionId?: string;
  errorDetails?: string;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
}

export interface WebhookLogRecord {
  id: string;
  provider: string;
  eventType: string;
  eventId?: string;
  providerTransactionId?: string;
  signatureHeader?: string;
  payload: any;
  processed: boolean;
  processingError?: string;
  processedAt?: string;
  createdAt: string;
}

export interface CreatePaymentSessionParams {
  orderId: string;
  orderCode: string;
  userId?: string;
  amount: number;
  currency: string;
  customer: {
    name: string;
    email: string;
    phone: string;
  };
  returnUrl: string;
  cancelUrl: string;
  webhookUrl?: string;
  metadata?: Record<string, any>;
}

export interface CreatePaymentSessionResult {
  success: boolean;
  paymentId: string;
  checkoutUrl: string;
  providerTransactionId?: string;
  providerReference?: string;
  expiresAt?: string;
  errorMessage?: string;
}

export interface ProviderPaymentStatusResult {
  providerTransactionId: string;
  status: PaymentStatus;
  amount: number;
  currency: string;
  paymentMethod?: string;
  paidAt?: string;
  rawResponse?: any;
}
