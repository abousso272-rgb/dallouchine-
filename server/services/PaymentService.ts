import { storage, OrderRecord } from '../db/storage';
import { PaymentProvider } from '../providers/PaymentProvider';
import { GeniusPayProvider } from '../providers/GeniusPayProvider';
import {
  PaymentItem,
  PaymentAttempt,
  PaymentStatus,
  InternalOrderStatus
} from '../types/payment';
import { config } from '../config';

export class PaymentService {
  private provider: PaymentProvider;

  constructor(customProvider?: PaymentProvider) {
    this.provider = customProvider || new GeniusPayProvider();
  }

  /**
   * 1. Initialise ou relance un paiement de commande sécurisé
   * Recalcule strictement le montant côté serveur pour empêcher toute manipulation client.
   */
  async createPaymentForOrder(params: {
    orderId: string;
    userId?: string;
    clientIp?: string;
    userAgent?: string;
    returnUrl?: string;
    cancelUrl?: string;
  }): Promise<{
    success: boolean;
    checkoutUrl?: string;
    paymentId?: string;
    providerTransactionId?: string;
    amount?: number;
    currency?: string;
    errorMessage?: string;
  }> {
    // 1. Récupération de la commande
    const order = await storage.getOrder(params.orderId);
    if (!order) {
      console.warn(`[PaymentService] Order ${params.orderId} not found.`);
      return {
        success: false,
        errorMessage: 'Commande introuvable.'
      };
    }

    // 2. Vérification de sécurité utilisateur (Autorisation)
    if (params.userId && order.userId && order.userId !== params.userId) {
      console.warn(`[PaymentService] Security refusal: User ${params.userId} tried to pay for order ${order.id} owned by ${order.userId}`);
      return {
        success: false,
        errorMessage: 'Vous n\'êtes pas autorisé à régler cette commande.'
      };
    }

    // 3. Vérification du statut de la commande
    if (order.paymentStatus === 'paid') {
      console.log(`[PaymentService] Order ${order.trackingCode} is already paid.`);
      return {
        success: false,
        errorMessage: 'Cette commande a déjà été réglée avec succès.'
      };
    }

    // 4. Recalcul et validation serveur du montant (Règle d'or de sécurité)
    const verifiedSubtotal = order.items.reduce((sum, item) => {
      const unit = Number(item.unitPriceXOF) || 0;
      const qty = Number(item.quantity) || 1;
      return sum + (unit * qty);
    }, 0);

    const verifiedShipping = Number(order.shippingFeeXOF) || 0;
    const verifiedDiscount = Number(order.discountAmountXOF) || 0;
    const verifiedFinalAmount = Math.max(0, verifiedSubtotal + verifiedShipping - verifiedDiscount);

    if (verifiedFinalAmount <= 0) {
      return {
        success: false,
        errorMessage: 'Le montant de la commande est invalide.'
      };
    }

    // 5. Prévention des doubles transactions / Concurrence
    const existingPayment = await storage.getPaymentByOrderId(order.id);
    if (
      existingPayment &&
      existingPayment.status === 'pending' &&
      existingPayment.checkoutUrl &&
      existingPayment.expiresAt &&
      new Date(existingPayment.expiresAt).getTime() > Date.now() + 60000
    ) {
      console.log(`[PaymentService] Reusing active pending checkout session for order ${order.trackingCode}`);
      return {
        success: true,
        checkoutUrl: existingPayment.checkoutUrl,
        paymentId: existingPayment.id,
        providerTransactionId: existingPayment.providerTransactionId,
        amount: existingPayment.amount,
        currency: existingPayment.currency
      };
    }

    // 6. Création de l'enregistrement de paiement interne
    const paymentId = `pay_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const returnUrl = params.returnUrl || `${config.appUrl}/payment/success?orderId=${order.id}&paymentId=${paymentId}`;
    const cancelUrl = params.cancelUrl || `${config.appUrl}/payment/cancelled?orderId=${order.id}`;

    const paymentRecord: PaymentItem = {
      id: paymentId,
      orderId: order.id,
      orderCode: order.trackingCode,
      userId: order.userId || params.userId,
      provider: 'geniuspay',
      amount: verifiedFinalAmount,
      currency: 'XOF',
      status: 'pending',
      paymentMethod: order.paymentMethod,
      customerName: order.customerName,
      customerEmail: order.customerEmail,
      customerPhone: order.customerPhone,
      metadata: {
        order_id: order.id,
        order_code: order.trackingCode,
        payment_id: paymentId,
        user_id: order.userId || params.userId
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // 7. Appel du fournisseur GeniusPay
    const sessionResult = await this.provider.createPaymentSession({
      orderId: order.id,
      orderCode: order.trackingCode,
      userId: order.userId || params.userId,
      amount: verifiedFinalAmount,
      currency: 'XOF',
      customer: {
        name: order.customerName,
        email: order.customerEmail,
        phone: order.customerPhone
      },
      returnUrl,
      cancelUrl,
      metadata: {
        payment_id: paymentId,
        order_id: order.id,
        order_code: order.trackingCode
      }
    });

    if (!sessionResult.success || !sessionResult.checkoutUrl) {
      console.error('[PaymentService] Provider session creation failed:', sessionResult.errorMessage);
      return {
        success: false,
        errorMessage: sessionResult.errorMessage || 'Le paiement n\'a pas pu être initialisé. Veuillez réessayer.'
      };
    }

    // 8. Mise à jour de l'enregistrement avec les données du fournisseur
    paymentRecord.checkoutUrl = sessionResult.checkoutUrl;
    paymentRecord.providerTransactionId = sessionResult.providerTransactionId;
    paymentRecord.providerReference = sessionResult.providerReference;
    paymentRecord.expiresAt = sessionResult.expiresAt;

    await storage.savePayment(paymentRecord);

    // 9. Enregistrement de la tentative pour audit log
    const attempt: PaymentAttempt = {
      id: `att_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      paymentId: paymentRecord.id,
      orderId: order.id,
      attemptNumber: 1,
      status: 'pending',
      providerTransactionId: sessionResult.providerTransactionId,
      ipAddress: params.clientIp,
      userAgent: params.userAgent,
      createdAt: new Date().toISOString()
    };
    await storage.recordPaymentAttempt(attempt);

    console.log('[PaymentService] Payment created successfully:', {
      paymentId: paymentRecord.id,
      orderCode: order.trackingCode,
      providerTransactionId: sessionResult.providerTransactionId
    });

    return {
      success: true,
      checkoutUrl: sessionResult.checkoutUrl,
      paymentId: paymentRecord.id,
      providerTransactionId: sessionResult.providerTransactionId,
      amount: verifiedFinalAmount,
      currency: 'XOF'
    };
  }

  /**
   * 2. Traitement sécurisé et idempotent des Webhooks GeniusPay
   */
  async handleWebhook(
    rawBody: string | Buffer,
    headers: Record<string, string | string[] | undefined>
  ): Promise<{ status: number; message: string; data?: any }> {
    console.log('[PaymentService] Processing incoming webhook...');

    // 1. Vérification cryptographique et temporelle
    const verification = await this.provider.verifyWebhook(rawBody, headers);

    if (!verification.isValid) {
      console.warn('[PaymentService] Webhook verification failed:', verification.reason);
      return {
        status: 400,
        message: verification.reason || 'Signature de webhook invalide.'
      };
    }

    const {
      eventId,
      eventType = 'payment_intent.confirmed',
      providerTransactionId,
      status: mappedPaymentStatus,
      orderId,
      paymentId,
      rawPayload
    } = verification;

    // 2. Vérification d'idempotence (Anti-doublon)
    if (eventId) {
      const alreadyProcessed = await storage.isWebhookEventProcessed(eventId);
      if (alreadyProcessed) {
        console.log(`[PaymentService] Idempotency: Webhook event ${eventId} already processed.`);
        return {
          status: 200,
          message: 'Événement déjà traité avec succès.'
        };
      }
    }

    // 3. Recherche du paiement associé
    let payment: PaymentItem | null = null;
    if (paymentId) {
      payment = await storage.getPaymentById(paymentId);
    }
    if (!payment && providerTransactionId) {
      payment = await storage.getPaymentByProviderTxId(providerTransactionId);
    }
    if (!payment && orderId) {
      payment = await storage.getPaymentByOrderId(orderId);
    }

    const targetOrderId = orderId || payment?.orderId;
    if (!targetOrderId) {
      console.error('[PaymentService] Webhook does not map to any known order:', {
        providerTransactionId,
        orderId,
        paymentId
      });

      // On enregistre le log pour audit même si orphelin
      await storage.recordWebhookLog({
        id: `whlog_${Date.now()}`,
        provider: this.provider.name,
        eventType,
        eventId,
        providerTransactionId,
        payload: rawPayload,
        processed: false,
        processingError: 'Commande associée introuvable.',
        createdAt: new Date().toISOString()
      });

      return {
        status: 404,
        message: 'Commande introuvable pour ce webhook.'
      };
    }

    const targetOrder = await storage.getOrder(targetOrderId);
    if (!targetOrder) {
      return {
        status: 404,
        message: 'Commande ciblée introuvable.'
      };
    }

    const effectiveStatus: PaymentStatus = mappedPaymentStatus || 'paid';
    const nowIso = new Date().toISOString();

    // 4. Mise à jour transaction & commande selon le statut
    if (effectiveStatus === 'paid') {
      // Confirmation de paiement
      if (payment) {
        payment.status = 'paid';
        payment.paidAt = nowIso;
        payment.updatedAt = nowIso;
        if (providerTransactionId) payment.providerTransactionId = providerTransactionId;
        await storage.savePayment(payment);
      }

      const newOrderStatus: InternalOrderStatus = targetOrder.orderStatus === 'pending_payment'
        ? 'paid'
        : targetOrder.orderStatus;

      await storage.updateOrderStatus(targetOrder.id, 'paid', newOrderStatus, nowIso);

      console.log(`[PaymentService] [payment_confirmed] Order ${targetOrder.trackingCode} marked as PAID. Amount: ${targetOrder.totalXOF} XOF`);
    } else if (effectiveStatus === 'failed') {
      if (payment) {
        payment.status = 'failed';
        payment.updatedAt = nowIso;
        await storage.savePayment(payment);
      }
      await storage.updateOrderStatus(targetOrder.id, 'failed');
      console.log(`[PaymentService] [payment_failed] Order ${targetOrder.trackingCode} payment failed.`);
    } else if (effectiveStatus === 'cancelled') {
      if (payment) {
        payment.status = 'cancelled';
        payment.updatedAt = nowIso;
        await storage.savePayment(payment);
      }
      await storage.updateOrderStatus(targetOrder.id, 'cancelled');
    } else if (effectiveStatus === 'expired') {
      if (payment) {
        payment.status = 'expired';
        payment.updatedAt = nowIso;
        await storage.savePayment(payment);
      }
      await storage.updateOrderStatus(targetOrder.id, 'expired');
    } else if (effectiveStatus === 'refunded') {
      if (payment) {
        payment.status = 'refunded';
        payment.updatedAt = nowIso;
        await storage.savePayment(payment);
      }
      await storage.updateOrderStatus(targetOrder.id, 'refunded');
    }

    // 5. Enregistrement de l'idempotence et du log d'audit
    await storage.recordWebhookLog({
      id: `whlog_${Date.now()}`,
      provider: this.provider.name,
      eventType,
      eventId,
      providerTransactionId,
      payload: rawPayload,
      processed: true,
      processedAt: nowIso,
      createdAt: nowIso
    });

    return {
      status: 200,
      message: 'Webhook traité avec succès.',
      data: {
        orderId: targetOrder.id,
        orderCode: targetOrder.trackingCode,
        paymentStatus: effectiveStatus
      }
    };
  }

  /**
   * 3. Récupération et synchronisation du statut d'un paiement
   */
  async getPaymentStatus(paymentIdOrOrderId: string): Promise<{
    found: boolean;
    payment?: PaymentItem;
    order?: OrderRecord;
  }> {
    let payment = await storage.getPaymentById(paymentIdOrOrderId);
    let order: OrderRecord | null = null;

    if (!payment) {
      payment = await storage.getPaymentByOrderId(paymentIdOrOrderId);
    }

    if (payment) {
      order = await storage.getOrder(payment.orderId);
    } else {
      order = await storage.getOrder(paymentIdOrOrderId);
      if (order) {
        payment = await storage.getPaymentByOrderId(order.id);
      }
    }

    if (!payment && !order) {
      return { found: false };
    }

    // Si le paiement est en statut 'pending' mais a un providerTransactionId, on peut interroger le provider
    if (payment && payment.status === 'pending' && payment.providerTransactionId) {
      try {
        const liveStatus = await this.provider.getPaymentStatus(payment.providerTransactionId);
        if (liveStatus.status && liveStatus.status !== 'pending') {
          payment.status = liveStatus.status;
          if (liveStatus.status === 'paid') {
            payment.paidAt = liveStatus.paidAt || new Date().toISOString();
            if (order) {
              await storage.updateOrderStatus(order.id, 'paid', 'paid', payment.paidAt);
              order.paymentStatus = 'paid';
            }
          }
          await storage.savePayment(payment);
        }
      } catch (err) {
        // Silently continue with current recorded status
      }
    }

    return {
      found: true,
      payment: payment || undefined,
      order: order || undefined
    };
  }

  /**
   * 4. Récupère tous les paiements (Pour l'administration)
   */
  async getAdminPayments(): Promise<PaymentItem[]> {
    return storage.getAllPayments();
  }
}

export const paymentService = new PaymentService();
