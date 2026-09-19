import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { config } from '../config';
import {
  PaymentItem,
  PaymentAttempt,
  WebhookLogRecord,
  PaymentStatus,
  InternalOrderStatus
} from '../types/payment';

export interface OrderRecord {
  id: string;
  trackingCode: string;
  userId?: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  customerCity: string;
  subtotalXOF: number;
  shippingFeeXOF: number;
  discountAmountXOF: number;
  totalXOF: number;
  paymentMethod: string;
  paymentStatus: PaymentStatus;
  orderStatus: InternalOrderStatus;
  deliveryType: string;
  hubLocationId?: string;
  deliveryAddress?: any;
  items: Array<{
    productId: string;
    productName: string;
    productImage?: string;
    quantity: number;
    unitPriceXOF: number;
    totalPriceXOF: number;
    isGroupage?: boolean;
    groupageId?: string;
  }>;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  paidAt?: string;
}

class StorageManager {
  private supabase: SupabaseClient | null = null;
  private memoryOrders: Map<string, OrderRecord> = new Map();
  private memoryPayments: Map<string, PaymentItem> = new Map();
  private memoryAttempts: PaymentAttempt[] = [];
  private memoryWebhookLogs: Map<string, WebhookLogRecord> = new Map();

  constructor() {
    if (config.supabaseUrl && config.supabaseServiceRoleKey) {
      try {
        this.supabase = createClient(config.supabaseUrl, config.supabaseServiceRoleKey, {
          auth: {
            persistSession: false,
            autoRefreshToken: false
          }
        });
        console.log('[StorageManager] Supabase client initialized.');
      } catch (err) {
        console.warn('[StorageManager] Failed to init Supabase client, using resilient local storage:', err);
      }
    } else {
      console.log('[StorageManager] No Supabase credentials provided, running with resilient local store.');
    }

    this.seedInitialData();
  }

  private seedInitialData() {
    // Exemples d'ordres initiaux
    const sampleOrder: OrderRecord = {
      id: 'ord-10482',
      trackingCode: 'AWP-10482',
      userId: 'cust-01',
      customerName: 'Amadou Diallo',
      customerPhone: '+221 77 540 22 11',
      customerEmail: 'amadou.diallo@gmail.com',
      customerCity: 'Dakar',
      subtotalXOF: 135000,
      shippingFeeXOF: 2000,
      discountAmountXOF: 0,
      totalXOF: 137000,
      paymentMethod: 'wave',
      paymentStatus: 'paid',
      orderStatus: 'purchased_in_china',
      deliveryType: 'home_delivery',
      items: [
        {
          productId: 'prod-01',
          productName: 'Machine à Café Espresso Professionnelle 15 Bars',
          quantity: 1,
          unitPriceXOF: 135000,
          totalPriceXOF: 135000
        }
      ],
      createdAt: new Date(Date.now() - 3 * 86400000).toISOString(),
      updatedAt: new Date(Date.now() - 3 * 86400000).toISOString(),
      paidAt: new Date(Date.now() - 3 * 86400000).toISOString()
    };

    this.memoryOrders.set(sampleOrder.id, sampleOrder);
    this.memoryOrders.set(sampleOrder.trackingCode, sampleOrder);

    const samplePayment: PaymentItem = {
      id: 'pay-001',
      orderId: 'ord-10482',
      orderCode: 'AWP-10482',
      userId: 'cust-01',
      provider: 'geniuspay',
      providerTransactionId: 'gp_tx_10482_sample',
      providerReference: 'GP-REF-89412',
      amount: 137000,
      currency: 'XOF',
      status: 'paid',
      paymentMethod: 'wave',
      customerName: 'Amadou Diallo',
      customerEmail: 'amadou.diallo@gmail.com',
      customerPhone: '+221 77 540 22 11',
      paidAt: new Date(Date.now() - 3 * 86400000).toISOString(),
      createdAt: new Date(Date.now() - 3 * 86400000).toISOString(),
      updatedAt: new Date(Date.now() - 3 * 86400000).toISOString()
    };

    this.memoryPayments.set(samplePayment.id, samplePayment);
  }

  // --- ORDERS ---

  async getOrder(orderIdOrCode: string): Promise<OrderRecord | null> {
    if (this.supabase) {
      try {
        const { data, error } = await this.supabase
          .from('orders')
          .select('*')
          .or(`id.eq.${orderIdOrCode},tracking_code.eq.${orderIdOrCode}`)
          .single();

        if (data && !error) {
          return {
            id: data.id,
            trackingCode: data.tracking_code,
            userId: data.user_id,
            customerName: data.customer_name,
            customerPhone: data.customer_phone,
            customerEmail: data.customer_email,
            customerCity: data.customer_city,
            subtotalXOF: Number(data.subtotal_xof),
            shippingFeeXOF: Number(data.shipping_fee_xof),
            discountAmountXOF: Number(data.discount_amount_xof || 0),
            totalXOF: Number(data.total_xof),
            paymentMethod: data.payment_method,
            paymentStatus: data.payment_status,
            orderStatus: data.order_status,
            deliveryType: data.delivery_type,
            hubLocationId: data.hub_location_id,
            deliveryAddress: data.delivery_address,
            items: data.items || [],
            notes: data.notes,
            createdAt: data.created_at,
            updatedAt: data.updated_at,
            paidAt: data.paid_at
          };
        }
      } catch (err) {
        console.warn('[StorageManager] Supabase getOrder fallback to memory:', err);
      }
    }

    return this.memoryOrders.get(orderIdOrCode) || null;
  }

  async saveOrder(order: OrderRecord): Promise<OrderRecord> {
    this.memoryOrders.set(order.id, order);
    this.memoryOrders.set(order.trackingCode, order);

    if (this.supabase) {
      try {
        await this.supabase.from('orders').upsert({
          id: order.id,
          tracking_code: order.trackingCode,
          user_id: order.userId || null,
          customer_name: order.customerName,
          customer_phone: order.customerPhone,
          customer_email: order.customerEmail,
          customer_city: order.customerCity,
          subtotal_xof: order.subtotalXOF,
          shipping_fee_xof: order.shippingFeeXOF,
          discount_amount_xof: order.discountAmountXOF,
          total_xof: order.totalXOF,
          payment_method: order.paymentMethod,
          payment_status: order.paymentStatus,
          order_status: order.orderStatus,
          delivery_type: order.deliveryType,
          hub_location_id: order.hubLocationId || null,
          delivery_address: order.deliveryAddress || null,
          items: order.items,
          notes: order.notes || null,
          paid_at: order.paidAt || null,
          updated_at: new Date().toISOString()
        });
      } catch (err) {
        console.warn('[StorageManager] Supabase saveOrder fallback:', err);
      }
    }

    return order;
  }

  async updateOrderStatus(
    orderId: string,
    paymentStatus: PaymentStatus,
    orderStatus?: InternalOrderStatus,
    paidAt?: string
  ): Promise<boolean> {
    const order = await this.getOrder(orderId);
    if (!order) return false;

    order.paymentStatus = paymentStatus;
    if (orderStatus) {
      order.orderStatus = orderStatus;
    }
    if (paidAt) {
      order.paidAt = paidAt;
    }
    order.updatedAt = new Date().toISOString();

    await this.saveOrder(order);
    return true;
  }

  // --- PAYMENTS ---

  async getPaymentById(paymentId: string): Promise<PaymentItem | null> {
    if (this.supabase) {
      try {
        const { data, error } = await this.supabase
          .from('payments')
          .select('*')
          .eq('id', paymentId)
          .single();

        if (data && !error) {
          return {
            id: data.id,
            orderId: data.order_id,
            orderCode: data.metadata?.order_code || 'AWP-N/A',
            userId: data.user_id,
            provider: data.provider,
            providerTransactionId: data.provider_transaction_id,
            providerReference: data.provider_reference,
            amount: Number(data.amount),
            currency: data.currency,
            status: data.status,
            paymentMethod: data.payment_method,
            checkoutUrl: data.checkout_url,
            customerName: data.customer_name || data.metadata?.customer_name || '',
            customerEmail: data.customer_email || '',
            customerPhone: data.customer_phone || '',
            metadata: data.metadata,
            expiresAt: data.expires_at,
            paidAt: data.paid_at,
            createdAt: data.created_at,
            updatedAt: data.updated_at
          };
        }
      } catch (err) {
        console.warn('[StorageManager] Supabase getPaymentById fallback to memory:', err);
      }
    }

    return this.memoryPayments.get(paymentId) || null;
  }

  async getPaymentByOrderId(orderId: string): Promise<PaymentItem | null> {
    for (const p of this.memoryPayments.values()) {
      if (p.orderId === orderId) return p;
    }

    if (this.supabase) {
      try {
        const { data, error } = await this.supabase
          .from('payments')
          .select('*')
          .eq('order_id', orderId)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (data && !error) {
          return {
            id: data.id,
            orderId: data.order_id,
            orderCode: data.metadata?.order_code || 'AWP-N/A',
            userId: data.user_id,
            provider: data.provider,
            providerTransactionId: data.provider_transaction_id,
            providerReference: data.provider_reference,
            amount: Number(data.amount),
            currency: data.currency,
            status: data.status,
            paymentMethod: data.payment_method,
            checkoutUrl: data.checkout_url,
            customerName: data.customer_name || data.metadata?.customer_name || '',
            customerEmail: data.customer_email || '',
            customerPhone: data.customer_phone || '',
            metadata: data.metadata,
            expiresAt: data.expires_at,
            paidAt: data.paid_at,
            createdAt: data.created_at,
            updatedAt: data.updated_at
          };
        }
      } catch (err) {
        console.warn('[StorageManager] Supabase getPaymentByOrderId error:', err);
      }
    }

    return null;
  }

  async getPaymentByProviderTxId(txId: string): Promise<PaymentItem | null> {
    for (const p of this.memoryPayments.values()) {
      if (p.providerTransactionId === txId) return p;
    }

    if (this.supabase) {
      try {
        const { data, error } = await this.supabase
          .from('payments')
          .select('*')
          .eq('provider_transaction_id', txId)
          .single();

        if (data && !error) {
          return {
            id: data.id,
            orderId: data.order_id,
            orderCode: data.metadata?.order_code || 'AWP-N/A',
            userId: data.user_id,
            provider: data.provider,
            providerTransactionId: data.provider_transaction_id,
            providerReference: data.provider_reference,
            amount: Number(data.amount),
            currency: data.currency,
            status: data.status,
            paymentMethod: data.payment_method,
            checkoutUrl: data.checkout_url,
            customerName: data.customer_name || data.metadata?.customer_name || '',
            customerEmail: data.customer_email || '',
            customerPhone: data.customer_phone || '',
            metadata: data.metadata,
            expiresAt: data.expires_at,
            paidAt: data.paid_at,
            createdAt: data.created_at,
            updatedAt: data.updated_at
          };
        }
      } catch (err) {
        console.warn('[StorageManager] Supabase getPaymentByProviderTxId error:', err);
      }
    }

    return null;
  }

  async savePayment(payment: PaymentItem): Promise<PaymentItem> {
    this.memoryPayments.set(payment.id, payment);

    if (this.supabase) {
      try {
        await this.supabase.from('payments').upsert({
          id: payment.id,
          order_id: payment.orderId,
          user_id: payment.userId || null,
          provider: payment.provider,
          provider_transaction_id: payment.providerTransactionId || null,
          provider_reference: payment.providerReference || null,
          amount: payment.amount,
          currency: payment.currency,
          status: payment.status,
          payment_method: payment.paymentMethod || null,
          checkout_url: payment.checkoutUrl || null,
          customer_name: payment.customerName,
          customer_email: payment.customerEmail,
          customer_phone: payment.customerPhone,
          metadata: payment.metadata || {},
          expires_at: payment.expiresAt || null,
          paid_at: payment.paidAt || null,
          updated_at: new Date().toISOString()
        });
      } catch (err) {
        console.warn('[StorageManager] Supabase savePayment fallback:', err);
      }
    }

    return payment;
  }

  async getAllPayments(): Promise<PaymentItem[]> {
    if (this.supabase) {
      try {
        const { data, error } = await this.supabase
          .from('payments')
          .select('*')
          .order('created_at', { ascending: false });

        if (data && !error) {
          return data.map((d: any) => ({
            id: d.id,
            orderId: d.order_id,
            orderCode: d.metadata?.order_code || 'AWP-N/A',
            userId: d.user_id,
            provider: d.provider,
            providerTransactionId: d.provider_transaction_id,
            providerReference: d.provider_reference,
            amount: Number(d.amount),
            currency: d.currency,
            status: d.status,
            paymentMethod: d.payment_method,
            checkoutUrl: d.checkout_url,
            customerName: d.customer_name || d.metadata?.customer_name || '',
            customerEmail: d.customer_email || '',
            customerPhone: d.customer_phone || '',
            metadata: d.metadata,
            expiresAt: d.expires_at,
            paidAt: d.paid_at,
            createdAt: d.created_at,
            updatedAt: d.updated_at
          }));
        }
      } catch (err) {
        console.warn('[StorageManager] Supabase getAllPayments error:', err);
      }
    }

    return Array.from(this.memoryPayments.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  // --- PAYMENT ATTEMPTS ---

  async recordPaymentAttempt(attempt: PaymentAttempt): Promise<void> {
    this.memoryAttempts.push(attempt);

    if (this.supabase) {
      try {
        await this.supabase.from('payment_attempts').insert({
          id: attempt.id,
          payment_id: attempt.paymentId,
          order_id: attempt.orderId,
          attempt_number: attempt.attemptNumber,
          status: attempt.status,
          provider_transaction_id: attempt.providerTransactionId || null,
          error_details: attempt.errorDetails || null,
          ip_address: attempt.ipAddress || null,
          user_agent: attempt.userAgent || null
        });
      } catch (err) {
        console.warn('[StorageManager] Supabase recordPaymentAttempt error:', err);
      }
    }
  }

  // --- WEBHOOK LOGS & IDEMPOTENCE ---

  async isWebhookEventProcessed(eventId: string): Promise<boolean> {
    const existing = this.memoryWebhookLogs.get(eventId);
    if (existing && existing.processed) return true;

    if (this.supabase) {
      try {
        const { data } = await this.supabase
          .from('webhook_events')
          .select('processed')
          .or(`event_id.eq.${eventId},provider_event_id.eq.${eventId}`)
          .maybeSingle();

        if (data && data.processed) return true;
      } catch {
        // Not found or error
      }
    }

    return false;
  }

  async recordWebhookLog(log: WebhookLogRecord): Promise<void> {
    this.memoryWebhookLogs.set(log.id, log);
    if (log.eventId) {
      this.memoryWebhookLogs.set(log.eventId, log);
    }

    if (this.supabase) {
      try {
        await this.supabase.from('webhook_events').upsert({
          id: log.id.startsWith('whlog_') ? undefined : log.id,
          provider: log.provider,
          event_type: log.eventType,
          event_id: log.eventId || null,
          provider_event_id: log.eventId || null,
          payload: log.payload,
          signature_valid: true,
          signature_verified: true,
          processed: log.processed,
          processing_error: log.processingError || null,
          error: log.processingError || null,
          processed_at: log.processedAt || null
        });
      } catch (err) {
        console.warn('[StorageManager] Supabase recordWebhookLog error:', err);
      }
    }
  }
}

export const storage = new StorageManager();
