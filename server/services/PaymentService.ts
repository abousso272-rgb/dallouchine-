import { getSupabaseServerClient } from '../middleware/auth';
import { PaymentProvider } from '../providers/PaymentProvider';
import { GeniusPayProvider } from '../providers/GeniusPayProvider';
import {
  PaymentItem,
  PaymentStatus
} from '../types/payment';
import { config } from '../config';

export class PaymentService {
  private provider: PaymentProvider;

  constructor(customProvider?: PaymentProvider) {
    this.provider = customProvider || new GeniusPayProvider();
  }

  /**
   * 1. Initialise une tentative de paiement certifiée et sécurisée
   * Exécute les 10 vérifications strictes via la fonction PostgreSQL atomique create_payment_attempt.
   * Le montant serveur fait foi ; aucun montant client n'est accepté.
   */
  async createPaymentForOrder(params: {
    orderId: string;
    userId?: string;
    clientIp?: string;
    userAgent?: string;
    returnUrl?: string;
    cancelUrl?: string;
    paymentMethod?: string;
  }): Promise<{
    success: boolean;
    checkoutUrl?: string;
    paymentId?: string;
    attemptId?: string;
    merchantReference?: string;
    providerTransactionId?: string;
    amount?: number;
    currency?: string;
    errorCode?: string;
    errorMessage?: string;
  }> {
    const supabase = getSupabaseServerClient();

    // 1. Appel de la procédure stockée PostgreSQL transactionnelle create_payment_attempt
    const { data: attemptResult, error: attemptError } = await supabase.rpc('create_payment_attempt', {
      p_order_id: params.orderId,
      p_user_id: params.userId || null,
      p_ip: params.clientIp || null,
      p_user_agent: params.userAgent || null
    });

    if (attemptError || !attemptResult?.success) {
      console.warn('[PaymentService] Payment attempt creation rejected:', attemptError || attemptResult);
      return {
        success: false,
        errorCode: attemptResult?.error_code || 'ATTEMPT_CREATION_FAILED',
        errorMessage: attemptResult?.error_message || attemptError?.message || 'Impossible d\'initialiser la tentative de paiement.'
      };
    }

    console.log('[PaymentService] Payment attempt initiated in Supabase:', {
      orderId: attemptResult.order_id,
      trackingCode: attemptResult.tracking_code,
      merchantReference: attemptResult.merchant_reference,
      amount: attemptResult.amount_xof
    });

    // 2. Appel de la passerelle GeniusPay avec le montant certifié serveur
    const returnUrl = params.returnUrl || `${config.appUrl}/payment/success?orderId=${attemptResult.order_id}&paymentId=${attemptResult.payment_id}`;
    const cancelUrl = params.cancelUrl || `${config.appUrl}/payment/cancelled?orderId=${attemptResult.order_id}`;

    const sessionResult = await this.provider.createPaymentSession({
      orderId: attemptResult.order_id,
      orderCode: attemptResult.tracking_code,
      userId: params.userId,
      merchantReference: attemptResult.merchant_reference,
      amount: attemptResult.amount_xof,
      currency: attemptResult.currency || 'XOF',
      paymentMethod: params.paymentMethod,
      description: `Commande ${attemptResult.tracking_code} - Dallou Chine`,
      customer: {
        name: attemptResult.customer_name || 'Client Dallou Chine',
        email: attemptResult.customer_email || 'client@dallouchine.sn',
        phone: attemptResult.customer_phone || ''
      },
      returnUrl,
      cancelUrl,
      metadata: {
        payment_id: attemptResult.payment_id,
        attempt_id: attemptResult.attempt_id,
        merchant_reference: attemptResult.merchant_reference
      }
    });

    if (!sessionResult.success || !sessionResult.checkoutUrl) {
      console.error('[PaymentService] Provider session creation failed:', sessionResult.errorMessage);
      return {
        success: false,
        errorCode: 'PROVIDER_SESSION_FAILED',
        errorMessage: sessionResult.errorMessage || 'Le paiement n\'a pas pu être initialisé auprès de la passerelle GeniusPay.'
      };
    }

    // 3. Mise à jour certifiée en base avec la réponse du fournisseur
    const nowIso = new Date().toISOString();
    await supabase.from('payments').update({
      checkout_url: sessionResult.checkoutUrl,
      provider_transaction_id: sessionResult.providerTransactionId || null,
      provider_reference: sessionResult.providerReference || attemptResult.merchant_reference,
      updated_at: nowIso
    }).eq('id', attemptResult.payment_id);

    await supabase.from('payment_attempts').update({
      provider_payment_id: sessionResult.providerTransactionId || null,
      provider_reference: sessionResult.providerReference || attemptResult.merchant_reference,
      updated_at: nowIso
    }).eq('id', attemptResult.attempt_id);

    return {
      success: true,
      checkoutUrl: sessionResult.checkoutUrl,
      paymentId: attemptResult.payment_id,
      attemptId: attemptResult.attempt_id,
      merchantReference: attemptResult.merchant_reference,
      providerTransactionId: sessionResult.providerTransactionId,
      amount: attemptResult.amount_xof,
      currency: 'XOF'
    };
  }

  /**
   * 2. Traitement sécurisé, transactionnel et idempotent des Webhooks GeniusPay
   * Valide la signature cryptographique sur le payload brut, compare les montants au centime près,
   * garantit l'idempotence et applique les transitions d'état en une seule transaction PostgreSQL.
   */
  async handleWebhook(
    rawBody: string | Buffer,
    headers: Record<string, string | string[] | undefined>
  ): Promise<{ status: number; message: string; data?: any; errorCode?: string }> {
    console.log('[PaymentService] Processing incoming webhook...');
    const supabase = getSupabaseServerClient();

    // 1. Vérification cryptographique et temporelle de la signature HMAC-SHA256
    const verification = await this.provider.verifyWebhook(rawBody, headers);

    if (!verification.isValid) {
      console.warn('[PaymentService] Webhook rejected (invalid signature):', verification.reason);

      // Audit de l'événement rejeté
      try {
        await supabase.rpc('process_geniuspay_webhook', {
          p_event_id: verification.eventId || `evt_invalid_${Date.now()}`,
          p_event_type: verification.eventType || 'webhook.signature_failed',
          p_provider_payment_id: verification.providerTransactionId || null,
          p_merchant_reference: verification.providerReference || null,
          p_order_id: verification.orderId || null,
          p_status: 'failed',
          p_amount_xof: verification.amount || 0,
          p_currency: verification.currency || 'XOF',
          p_payload: verification.rawPayload || {},
          p_signature_verified: false
        });
      } catch (err: any) {
        console.warn('[PaymentService] Failed to record invalid signature event:', err.message);
      }

      return {
        status: 400,
        errorCode: 'INVALID_SIGNATURE',
        message: verification.reason || 'Signature de webhook invalide.'
      };
    }

    // 2. Exécution de la transaction PostgreSQL complète (RPC process_geniuspay_webhook)
    const { data: rpcResult, error: rpcError } = await supabase.rpc('process_geniuspay_webhook', {
      p_event_id: verification.eventId || null,
      p_event_type: verification.eventType || 'payment_intent.confirmed',
      p_provider_payment_id: verification.providerTransactionId || null,
      p_merchant_reference: verification.providerReference || null,
      p_order_id: verification.orderId || null,
      p_status: verification.status || 'paid',
      p_amount_xof: verification.amount,
      p_currency: verification.currency || 'XOF',
      p_payload: verification.rawPayload || {},
      p_signature_verified: true
    });

    if (rpcError) {
      console.error('[PaymentService] PostgreSQL transaction error during webhook processing:', rpcError);
      return {
        status: 500,
        message: 'Erreur interne de base de données lors du traitement du webhook.'
      };
    }

    // 3. Gestion des réponses selon le résultat transactionnel
    if (rpcResult.already_processed) {
      console.log(`[PaymentService] [Idempotence] Event ${verification.eventId} was already processed.`);
      return {
        status: 200,
        message: 'Événement déjà traité avec succès (idempotence).',
        data: rpcResult
      };
    }

    if (!rpcResult.success) {
      const code = rpcResult.error_code;
      console.warn('[PaymentService] [Security Rejection] Webhook validation failed in database:', {
        errorCode: code,
        errorMessage: rpcResult.error_message
      });

      let statusCode = 400;
      if (code === 'AMOUNT_MISMATCH' || code === 'REFERENCE_MISMATCH' || code === 'CURRENCY_MISMATCH') {
        statusCode = 422;
      } else if (code === 'PAYMENT_ATTEMPT_NOT_FOUND' || code === 'ORDER_NOT_FOUND') {
        statusCode = 404;
      } else if (code === 'ORDER_CANCELLED') {
        statusCode = 409;
      }

      return {
        status: statusCode,
        errorCode: code,
        message: rpcResult.error_message || 'Échec de traitement du webhook.',
        data: rpcResult
      };
    }

    console.log(`[PaymentService] [payment_confirmed] Order ${rpcResult.tracking_code} payment status updated to: ${rpcResult.payment_status}`);
    return {
      status: 200,
      message: 'Webhook traité avec succès.',
      data: rpcResult
    };
  }

  /**
   * 3. Récupération et synchronisation certifiée du statut d'un paiement
   * La source de vérité est la base de données PostgreSQL certifiée.
   */
  async getPaymentStatus(paymentIdOrOrderId: string): Promise<{
    found: boolean;
    payment?: any;
    order?: any;
  }> {
    const supabase = getSupabaseServerClient();

    // Appel direct de la fonction PostgreSQL SECURITY DEFINER get_order_payment_details
    const { data, error } = await supabase.rpc('get_order_payment_details', {
      p_order_id: paymentIdOrOrderId
    });

    if (error || !data || !data.found) {
      return { found: false };
    }

    return {
      found: true,
      payment: data.payment ? {
        id: data.payment.id,
        orderId: data.payment.order_id,
        orderCode: data.order?.tracking_code || 'AWP-N/A',
        amount: Number(data.payment.amount),
        currency: data.payment.currency,
        status: data.payment.status,
        paymentMethod: data.payment.payment_method,
        provider: data.payment.provider,
        providerTransactionId: data.payment.provider_transaction_id,
        providerReference: data.payment.provider_reference,
        paidAt: data.payment.paid_at,
        createdAt: data.payment.created_at,
        updatedAt: data.payment.updated_at
      } : undefined,
      order: data.order ? {
        id: data.order.id,
        trackingCode: data.order.tracking_code,
        userId: data.order.user_id,
        customerName: data.order.customer_name,
        paymentStatus: data.order.payment_status,
        orderStatus: data.order.order_status,
        totalXOF: Number(data.order.total_xof),
        shippingFeeXOF: Number(data.order.shipping_fee_xof),
        paidAt: data.order.paid_at
      } : undefined
    };
  }

  /**
   * 4. Journal des paiements pour l'administration
   */
  async getAdminPayments(): Promise<PaymentItem[]> {
    const supabase = getSupabaseServerClient();
    const { data, error } = await supabase
      .from('payments')
      .select('*, orders(tracking_code, customer_name, customer_email, total_xof)')
      .order('created_at', { ascending: false });

    if (error || !data) {
      return [];
    }

    return data.map((d: any) => ({
      id: d.id,
      orderId: d.order_id,
      orderCode: d.orders?.tracking_code || d.metadata?.order_code || 'AWP-N/A',
      userId: d.user_id,
      provider: d.provider,
      providerTransactionId: d.provider_transaction_id,
      providerReference: d.provider_reference,
      amount: Number(d.amount_xof),
      currency: d.currency,
      status: d.status,
      paymentMethod: d.payment_method,
      checkoutUrl: d.checkout_url,
      customerName: d.customer_name || d.orders?.customer_name || '',
      customerEmail: d.customer_email || d.orders?.customer_email || '',
      customerPhone: d.customer_phone || '',
      paidAt: d.paid_at,
      createdAt: d.created_at,
      updatedAt: d.updated_at
    }));
  }

  /**
   * 5. Consultation du solde marchand GeniusPay (GET /account/balance)
   */
  async getGeniusPayBalance() {
    if (this.provider instanceof GeniusPayProvider) {
      return await this.provider.getAccountBalance();
    }
    return { success: false, error: 'Fournisseur GeniusPay non actif' };
  }

  /**
   * 6. Consultation des informations du compte marchand GeniusPay (GET /account)
   */
  async getGeniusPayAccount() {
    if (this.provider instanceof GeniusPayProvider) {
      return await this.provider.getAccountInfo();
    }
    return { success: false, error: 'Fournisseur GeniusPay non actif' };
  }

  /**
   * 7. Consultation des transactions en direct sur la passerelle GeniusPay (GET /payments)
   */
  async getGeniusPayLiveTransactions(params?: {
    status?: 'pending' | 'completed' | 'failed';
    from?: string;
    to?: string;
    per_page?: number;
  }) {
    if (this.provider instanceof GeniusPayProvider) {
      return await this.provider.listPayments(params);
    }
    return { success: false, data: [] };
  }
}

export const paymentService = new PaymentService();
