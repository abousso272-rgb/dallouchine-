import crypto from 'crypto';
import type { SupabaseClient } from '@supabase/supabase-js';
import { getSupabaseServerClient } from '../middleware/auth';
import { PaymentProvider } from '../providers/PaymentProvider';
import { GeniusPayProvider } from '../providers/GeniusPayProvider';
import {
  PaymentItem,
  PaymentStatus
} from '../types/payment';
import { config, hasGeniusPayCredentials, hasServiceRole } from '../config';

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
    /** Client Supabase de l'utilisateur (jeton) : l'identité est imposée par la base. */
    db: SupabaseClient;
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
    if (!hasGeniusPayCredentials) {
      return {
        success: false,
        errorCode: 'PROVIDER_NOT_CONFIGURED',
        errorMessage: 'Le paiement en ligne n\'est pas encore configuré. Contactez DALUCHE pour finaliser votre commande.'
      };
    }

    // 1. Tentative créée au nom de l'utilisateur authentifié (auth.uid() côté base)
    const { data: attemptResult, error: attemptError } = await params.db.rpc('create_payment_attempt_secure', {
      p_order_id: params.orderId,
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
    const defaultAppUrl = (config.appUrl && !config.appUrl.includes('localhost'))
      ? config.appUrl.replace(/\/+$/, '')
      : 'https://dallouchine.vercel.app';

    const returnUrl = params.returnUrl || `${defaultAppUrl}/paiement/retour?orderId=${attemptResult.order_id}`;
    const cancelUrl = params.cancelUrl || `${defaultAppUrl}/paiement/retour?orderId=${attemptResult.order_id}&cancelled=1`;

    const sessionResult = await this.provider.createPaymentSession({
      orderId: attemptResult.order_id,
      orderCode: attemptResult.tracking_code,
      userId: params.userId,
      merchantReference: attemptResult.merchant_reference,
      amount: attemptResult.amount_xof,
      currency: attemptResult.currency || 'XOF',
      paymentMethod: params.paymentMethod,
      description: `Commande ${attemptResult.tracking_code} - DALUCHE`,
      customer: {
        name: attemptResult.customer_name || 'Client DALUCHE',
        email: attemptResult.customer_email || '',
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

    // 3. Enregistrement de l'URL de paiement (seuls champs modifiables, tentative en attente uniquement)
    const { error: attachError } = await params.db.rpc('attach_payment_checkout', {
      p_payment_id: attemptResult.payment_id,
      p_attempt_id: attemptResult.attempt_id,
      p_checkout_url: sessionResult.checkoutUrl,
      p_provider_payment_id: sessionResult.providerTransactionId || null,
      p_provider_reference: sessionResult.providerReference || attemptResult.merchant_reference
    });
    if (attachError) console.warn('[PaymentService] attach_payment_checkout:', attachError.message);

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

      return {
        status: 400,
        errorCode: 'INVALID_SIGNATURE',
        message: verification.reason || 'Signature de webhook invalide.'
      };
    }

    // 2. La base revérifie elle-même la signature (secret Vault) avant tout changement d'état
    const rawString = typeof rawBody === 'string' ? rawBody : rawBody.toString('utf8');
    const header = (name: string) => {
      const v = headers[name];
      return Array.isArray(v) ? v[0] : v;
    };
    let { data: rpcResult, error: rpcError } = await supabase.rpc('geniuspay_ingest', {
      p_raw_body: rawString,
      p_signature: header('x-webhook-signature') || header('x-geniuspay-signature') || header('x-signature') || header('signature') || '',
      p_timestamp: header('x-webhook-timestamp') || header('x-geniuspay-timestamp') || header('x-timestamp') || header('timestamp') || null,
      p_event_header: header('x-webhook-event') || header('x-geniuspay-event') || null
    });

    // Transition : secret pas encore enregistré en base → ancienne fonction (service_role recommandé)
    if (!rpcError && rpcResult?.error_code === 'SECRET_NOT_CONFIGURED') {
      console.warn('[PaymentService] Secret Vault absent : traitement via process_geniuspay_webhook' + (hasServiceRole ? '' : ' (clé publique, à sécuriser)'));
      ({ data: rpcResult, error: rpcError } = await supabase.rpc('process_geniuspay_webhook', {
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
      }));
    }

    if (rpcError) {
      console.error('[PaymentService] PostgreSQL transaction error during webhook processing:', rpcError);
      return {
        status: 500,
        message: 'Erreur interne de base de données lors du traitement du webhook.'
      };
    }

    // 3. Gestion des réponses selon le résultat transactionnel
    if (rpcResult.already_processed || rpcResult.ignored) {
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
  async getPaymentStatus(db: SupabaseClient, paymentIdOrOrderId: string): Promise<{
    found: boolean;
    payment?: any;
    order?: any;
  }> {
    // Propriétaire ou équipe uniquement (contrôle en base)
    const { data, error } = await db.rpc('get_my_order_payment', { p_order_id: paymentIdOrOrderId });

    if (error || !data || !data.found) {
      return { found: false };
    }

    // Paiement encore en attente : on interroge GeniusPay. La confirmation passe par le même
    // point d'entrée signé que les webhooks (HMAC avec GENIUSPAY_WEBHOOK_SECRET) : la base
    // reste seule juge, et le montant retenu est celui renvoyé par GeniusPay.
    const ref = data.payment?.provider_payment_id || data.payment?.provider_reference;
    if (data.order && data.order.payment_status !== 'paid' && ref && config.geniusPayWebhookSecret) {
      try {
        const provStatus = await this.provider.getPaymentStatus(ref);
        if (provStatus && provStatus.status === 'paid' && provStatus.amount > 0) {
          const body = JSON.stringify({
            id: `sync_${provStatus.providerTransactionId || ref}_paid`,
            event: 'payment.success',
            data: {
              transaction: {
                id: provStatus.providerTransactionId || ref,
                reference: data.payment?.provider_reference || ref,
                amount: provStatus.amount,
                currency: provStatus.currency || 'XOF',
                status: 'completed',
                metadata: { order_id: data.order.id }
              }
            }
          });
          const timestamp = String(Math.floor(Date.now() / 1000));
          const signature = crypto.createHmac('sha256', config.geniusPayWebhookSecret).update(`${timestamp}.${body}`).digest('hex');
          const { data: synced } = await getSupabaseServerClient().rpc('geniuspay_ingest', {
            p_raw_body: body,
            p_signature: signature,
            p_timestamp: timestamp,
            p_event_header: 'payment.success'
          });
          if (synced?.success && !synced.ignored) {
            data.order.payment_status = 'paid';
            if (data.payment) {
              data.payment.status = 'paid';
              data.payment.paid_at = provStatus.paidAt || new Date().toISOString();
            }
          }
        }
      } catch (syncErr: any) {
        console.warn('[PaymentService] Synchronisation GeniusPay :', syncErr.message || syncErr);
      }
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
  async getAdminPayments(db: SupabaseClient): Promise<PaymentItem[]> {
    const { data, error } = await db
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
      providerTransactionId: d.provider_payment_id || d.provider_transaction_id,
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
}

export const paymentService = new PaymentService();
