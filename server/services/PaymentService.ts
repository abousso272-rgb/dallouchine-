import crypto from 'crypto';
import type { SupabaseClient } from '@supabase/supabase-js';
import { getSupabaseServerClient } from '../middleware/auth';
import { SasPayProvider } from '../providers/SasPayProvider';
import { PaymentItem, PaymentStatus, ProviderPaymentStatusResult } from '../types/payment';
import { config, hasSasPayCredentials, hasSasPayWebhookSecret } from '../config';

type ProviderName = 'saspay';

export interface CreatePaymentResult {
  success: boolean;
  checkoutUrl?: string;
  paymentId?: string;
  attemptId?: string;
  merchantReference?: string;
  providerTransactionId?: string;
  provider?: ProviderName;
  amount?: number;
  currency?: string;
  orderCode?: string;
  customerName?: string;
  customerPhone?: string;
  errorCode?: string;
  errorMessage?: string;
}

export class PaymentService {
  private saspay = new SasPayProvider();

  /** Fournisseur unique : SasPay. */
  readonly activeProvider: ProviderName = 'saspay';

  get isConfigured(): boolean {
    return hasSasPayCredentials && hasSasPayWebhookSecret;
  }

  private readyCache: { at: number; status: string } | null = null;

  /**
   * Prêt à encaisser ? Clé et secret présents côté serveur ET secret identique dans la base (Vault).
   * Sans cela, un client pourrait payer sans que sa commande soit confirmée : on refuse de démarrer.
   */
  async readiness(): Promise<'ok' | 'no_key' | 'no_webhook_secret' | 'missing' | 'mismatch' | 'error'> {
    if (!hasSasPayCredentials) return 'no_key';
    if (!hasSasPayWebhookSecret) return 'no_webhook_secret';
    if (this.readyCache && this.readyCache.status === 'ok' && Date.now() - this.readyCache.at < 5 * 60_000) return 'ok';
    try {
      const probe = `ready:${Date.now()}`;
      const signature = crypto.createHmac('sha256', config.saspayWebhookSecret).update(probe).digest('hex');
      const { data, error } = await getSupabaseServerClient().rpc('payment_provider_ready', { p_provider: 'saspay', p_probe: probe, p_signature: signature });
      const status = error ? 'error' : (String(data) as 'ok' | 'missing' | 'mismatch');
      this.readyCache = { at: Date.now(), status };
      return status;
    } catch {
      return 'error';
    }
  }

  static readinessMessage(status: string): string {
    switch (status) {
      case 'missing':
      case 'mismatch':
        return 'Le paiement en ligne est en cours d’activation (confirmation sécurisée non prête). Réessayez dans quelques minutes ou contactez-nous.';
      case 'error':
        return 'Le service de paiement est momentanément indisponible. Réessayez dans un instant.';
      default:
        return 'Le paiement en ligne est en cours de configuration. Contactez-nous pour finaliser votre commande.';
    }
  }

  private baseUrl() {
    return config.appUrl && !config.appUrl.includes('localhost') ? config.appUrl.replace(/\/+$/, '') : 'https://dallouchine.vercel.app';
  }

  /**
   * Crée la tentative de paiement (identité imposée par la base : client connecté, ou équipe pour un lien
   * de paiement) puis la session chez le fournisseur actif. Le montant vient toujours de la commande en base.
   */
  async createPaymentForOrder(params: {
    /** Client Supabase portant le jeton de l'appelant */
    db: SupabaseClient;
    orderId: string;
    userId?: string;
    clientIp?: string;
    userAgent?: string;
    returnUrl?: string;
    cancelUrl?: string;
    paymentMethod?: string;
    /** Lien généré par l'équipe pour le compte d'un client */
    asStaff?: boolean;
  }): Promise<CreatePaymentResult> {
    const ready = await this.readiness();
    if (ready !== 'ok') {
      console.warn('[PaymentService] paiement bloqué, état :', ready);
      return { success: false, errorCode: 'PROVIDER_NOT_CONFIGURED', errorMessage: PaymentService.readinessMessage(ready) };
    }
    const provider = this.activeProvider;

    const { data: attempt, error: attemptError } = params.asStaff
      ? await params.db.rpc('staff_create_payment_attempt', { p_order_id: params.orderId, p_provider: provider, p_ip: params.clientIp || null, p_user_agent: params.userAgent || null })
      : await params.db.rpc('create_payment_attempt_secure', { p_order_id: params.orderId, p_ip: params.clientIp || null, p_user_agent: params.userAgent || null, p_provider: provider });

    if (attemptError || !attempt?.success) {
      console.warn('[PaymentService] tentative refusée :', attemptError?.message || attempt?.error_code);
      return {
        success: false,
        errorCode: attempt?.error_code || 'ATTEMPT_CREATION_FAILED',
        errorMessage: attempt?.error_message || attemptError?.message || "Impossible d'initialiser la tentative de paiement."
      };
    }

    const base = this.baseUrl();
    const returnUrl = params.returnUrl || `${base}/paiement/retour?orderId=${attempt.order_id}`;
    const cancelUrl = params.cancelUrl || `${base}/paiement/retour?orderId=${attempt.order_id}&cancelled=1`;

    const session = await this.saspay.createPaymentSession({
      orderId: attempt.order_id,
      orderCode: attempt.tracking_code,
      userId: params.userId,
      merchantReference: attempt.merchant_reference,
      amount: attempt.amount_xof,
      currency: attempt.currency || 'XOF',
      paymentMethod: params.paymentMethod,
      description: `Commande ${attempt.tracking_code} - Dallou Chine`,
      customer: { name: attempt.customer_name || 'Client Dallou Chine', email: attempt.customer_email || '', phone: attempt.customer_phone || '' },
      returnUrl,
      cancelUrl,
      metadata: { payment_id: attempt.payment_id, attempt_id: attempt.attempt_id }
    });

    if (!session.success || !session.checkoutUrl) {
      console.error('[PaymentService] session refusée :', session.errorMessage);
      return { success: false, errorCode: 'PROVIDER_SESSION_FAILED', errorMessage: session.errorMessage || "Le paiement n'a pas pu être initialisé." };
    }

    const { error: attachError } = await params.db.rpc('attach_payment_checkout', {
      p_payment_id: attempt.payment_id,
      p_attempt_id: attempt.attempt_id,
      p_checkout_url: session.checkoutUrl,
      p_provider_payment_id: session.providerTransactionId || null,
      p_provider_reference: session.providerReference || attempt.merchant_reference
    });
    if (attachError) console.warn('[PaymentService] attach_payment_checkout:', attachError.message);

    return {
      success: true,
      checkoutUrl: session.checkoutUrl,
      paymentId: attempt.payment_id,
      attemptId: attempt.attempt_id,
      merchantReference: attempt.merchant_reference,
      providerTransactionId: session.providerTransactionId,
      provider,
      amount: attempt.amount_xof,
      currency: 'XOF',
      orderCode: attempt.tracking_code,
      customerName: attempt.customer_name,
      customerPhone: attempt.customer_phone
    };
  }

  // -------------------------------------------------------------------------------------------
  // Confirmations
  // -------------------------------------------------------------------------------------------

  /**
   * Transmet à la base un événement de paiement dont les données ont été relues auprès de l'API du
   * fournisseur. L'événement est signé avec le secret partagé (stocké dans Vault côté base) : seul le
   * serveur peut donc marquer une commande payée.
   */
  private async confirmInDatabase(provider: ProviderName, tx: ProviderPaymentStatusResult, orderId: string | undefined, merchantReference: string | undefined, eventId: string) {
    const secret = hasSasPayWebhookSecret ? config.saspayWebhookSecret : '';
    if (!secret) return { ok: false as const, error: 'Secret de signature non configuré.' };
    const body = JSON.stringify({
      id: eventId,
      event: `transaction.${tx.status}`,
      data: {
        transaction: {
          id: tx.providerTransactionId,
          reference: merchantReference || '',
          amount: tx.amount,
          currency: tx.currency || 'XOF',
          status: tx.status,
          net_amount: tx.netAmount,
          charged: tx.chargedAmount,
          fee_charge_mode: tx.feeChargeMode,
          network: tx.network,
          tx_reference: tx.txReference,
          metadata: { order_id: orderId || '' }
        }
      }
    });
    const timestamp = String(Math.floor(Date.now() / 1000));
    const signature = crypto.createHmac('sha256', secret).update(`${timestamp}.${body}`).digest('hex');
    const { data, error } = await getSupabaseServerClient().rpc('payment_ingest', { p_provider: provider, p_raw_body: body, p_signature: signature, p_timestamp: timestamp });
    if (error) return { ok: false as const, error: error.message };
    return { ok: Boolean(data?.success), result: data };
  }

  /**
   * Notification SasPay : signature vérifiée, puis transaction relue auprès de l'API, retrouvée
   * dans les sessions payées (métadonnées = notre commande) et confirmée en base.
   */
  async handleSasPayWebhook(rawBody: string | Buffer, headers: Record<string, string | string[] | undefined>): Promise<{ status: number; message: string; errorCode?: string; data?: unknown }> {
    const verification = await this.saspay.verifyWebhook(rawBody, headers);
    if (!verification.isValid) {
      console.warn('[PaymentService] webhook SasPay rejeté :', verification.reason);
      return { status: 400, errorCode: 'INVALID_SIGNATURE', message: verification.reason || 'Signature invalide.' };
    }
    if (!verification.providerTransactionId || verification.status === 'pending') {
      return { status: 200, message: 'Événement ignoré.' };
    }
    const tx = await this.saspay.verifyTransaction(verification.providerTransactionId);
    if (!tx) return { status: 502, errorCode: 'VERIFY_FAILED', message: 'Transaction introuvable chez le fournisseur : nouvelle tentative attendue.' };
    if (tx.status === 'pending') return { status: 200, message: 'Transaction encore en cours.' };

    const session = await this.saspay.findSessionForTransaction(tx.providerTransactionId);
    const description: string = tx.rawResponse?.description || '';
    const merchantReference = session?.merchantReference || description.match(/DALLOU-\d{6}-[A-Z0-9]{8}/)?.[0];
    if (!session?.orderId && !merchantReference) {
      console.warn('[PaymentService] transaction SasPay sans commande associée :', tx.providerTransactionId);
      return { status: 404, errorCode: 'ORDER_NOT_FOUND', message: 'Aucune commande associée à cette transaction.' };
    }
    const confirmed = await this.confirmInDatabase('saspay', tx, session?.orderId, merchantReference, `saspay_${tx.providerTransactionId}_${tx.status}`);
    if (!confirmed.ok) {
      const code = (confirmed as { result?: { error_code?: string } }).result?.error_code;
      console.warn('[PaymentService] confirmation SasPay refusée :', code || (confirmed as { error?: string }).error);
      // 503 : SasPay relance automatiquement (5 tentatives sur ~2 h) le temps de corriger la configuration
      return { status: code === 'AMOUNT_MISMATCH' ? 422 : code === 'PAYMENT_ATTEMPT_NOT_FOUND' ? 404 : 503, errorCode: code, message: 'Confirmation refusée par la base.' };
    }
    return { status: 200, message: 'Webhook traité avec succès.', data: (confirmed as { result?: unknown }).result };
  }

  // -------------------------------------------------------------------------------------------
  // Statut
  // -------------------------------------------------------------------------------------------

  /** Statut d'un paiement (propriétaire ou équipe, contrôlé en base) ; synchronise les paiements en attente. */
  async getPaymentStatus(db: SupabaseClient, orderRef: string): Promise<{ found: boolean; payment?: any; order?: any }> {
    const { data, error } = await db.rpc('get_my_order_payment', { p_order_id: orderRef });
    if (error || !data || !data.found) return { found: false };

    const ref: string | undefined = data.payment?.provider_payment_id;
    if (data.order && data.order.payment_status !== 'paid' && ref && data.payment?.provider === 'saspay' && this.isConfigured) {
      try {
        const tx = await this.saspay.getPaymentStatus(ref);
        if (tx.status !== 'pending' && tx.amount > 0) {
          const merchantReference = data.payment?.provider_reference || data.attempt?.merchant_reference;
          const done = await this.confirmInDatabase('saspay', tx, data.order.id, merchantReference, `saspay_${tx.providerTransactionId}_${tx.status}`);
          if (done.ok && tx.status === 'paid') {
            data.order.payment_status = 'paid';
            if (data.payment) {
              data.payment.status = 'paid';
              data.payment.paid_at = tx.paidAt || new Date().toISOString();
            }
          }
        }
      } catch (err) {
        console.warn('[PaymentService] synchronisation :', (err as Error)?.message || err);
      }
    }

    return {
      found: true,
      payment: data.payment
        ? {
            id: data.payment.id,
            orderId: data.payment.order_id,
            orderCode: data.order?.tracking_code || '',
            amount: Number(data.payment.amount),
            currency: data.payment.currency,
            status: data.payment.status,
            paymentMethod: data.payment.payment_method,
            provider: data.payment.provider,
            checkoutUrl: data.payment.status === 'pending' ? data.payment.checkout_url : undefined,
            paidAt: data.payment.paid_at,
            createdAt: data.payment.created_at,
            updatedAt: data.payment.updated_at
          }
        : undefined,
      order: data.order
        ? {
            id: data.order.id,
            trackingCode: data.order.tracking_code,
            userId: data.order.user_id,
            customerName: data.order.customer_name,
            paymentStatus: data.order.payment_status,
            orderStatus: data.order.order_status,
            totalXOF: Number(data.order.total_xof),
            shippingFeeXOF: Number(data.order.shipping_fee_xof),
            paidAt: data.order.paid_at
          }
        : undefined
    };
  }

  /** Journal des paiements pour l'administration (RLS : administrateurs uniquement). */
  async getAdminPayments(db: SupabaseClient): Promise<PaymentItem[]> {
    const { data, error } = await db
      .from('payments')
      .select('*, orders(tracking_code, customer_name, customer_email, total_xof)')
      .order('created_at', { ascending: false })
      .limit(1000);
    if (error || !data) return [];
    return data.map((d: any) => ({
      id: d.id,
      orderId: d.order_id,
      orderCode: d.orders?.tracking_code || d.metadata?.order_code || '',
      userId: d.user_id,
      provider: d.provider,
      providerTransactionId: d.provider_payment_id || undefined,
      providerReference: d.provider_reference || undefined,
      amount: Number(d.amount_xof),
      feeXOF: Number(d.fee_xof || 0),
      netXOF: d.net_xof !== null && d.net_xof !== undefined ? Number(d.net_xof) : null,
      feeChargeMode: d.fee_charge_mode,
      network: d.network,
      currency: d.currency,
      status: d.status as PaymentStatus,
      paymentMethod: d.payment_method,
      customerName: d.customer_name || d.orders?.customer_name || '',
      customerEmail: d.customer_email || d.orders?.customer_email || '',
      customerPhone: d.customer_phone || '',
      paidAt: d.paid_at,
      createdAt: d.created_at,
      updatedAt: d.updated_at
    }));
  }

  /** Réseaux mobile money disponibles sur le compte SasPay (Sénégal). */
  async listNetworks() {
    return this.isConfigured ? this.saspay.listNetworks('SN') : [];
  }

  /**
   * Remboursement automatique (administration) : envoi SasPay vers le mobile money du client,
   * puis enregistrement en base (commande ou participation de groupage) avec la référence d'envoi.
   */
  async refundOrder(
    db: SupabaseClient,
    p: { orderId: string; participantId?: string; networkCode: string; msisdn: string }
  ): Promise<{ success: boolean; payoutId?: string; errorCode?: string; errorMessage?: string; warning?: string }> {
    if (!this.isConfigured) return { success: false, errorCode: 'PROVIDER_NOT_CONFIGURED', errorMessage: 'SasPay n’est pas configuré.' };
    const { data: order, error } = await db
      .from('orders')
      .select('id, tracking_code, total_xof, payment_status, customer_name, customer_email, customer_phone')
      .eq('id', p.orderId)
      .maybeSingle();
    if (error || !order) return { success: false, errorCode: 'ORDER_NOT_FOUND', errorMessage: 'Commande introuvable.' };
    if (order.payment_status !== 'paid') return { success: false, errorCode: 'NOT_REFUNDABLE', errorMessage: 'Seule une commande payée peut être remboursée.' };
    const msisdn = p.msisdn.replace(/\D/g, '').replace(/^221(?=\d{9}$)/, '');
    if (!/^\d{9}$/.test(msisdn)) return { success: false, errorCode: 'INVALID_PHONE', errorMessage: 'Numéro mobile money invalide (9 chiffres).' };
    const [firstName, ...rest] = String(order.customer_name || 'Client').trim().split(/\s+/);
    const out = await this.saspay.payout({
      idempotencyKey: `refund_${order.id}`,
      amount: Number(order.total_xof),
      networkCode: p.networkCode,
      msisdn,
      customer: { firstName: firstName || 'Client', lastName: rest.join(' ') || '-', email: order.customer_email || `client+${String(order.tracking_code).toLowerCase()}@dallouchine.vercel.app`, phone: `+221${msisdn}` },
      description: `Remboursement commande ${order.tracking_code}`,
      metadata: { order_id: order.id, participant_id: p.participantId || null }
    });
    if (!out.success) return out;
    const reference = `SasPay ${out.payoutId}`;
    const { error: markError } = p.participantId
      ? await db.rpc('admin_mark_participant_refunded', { p_participant_id: p.participantId, p_reference: reference })
      : await db.rpc('admin_mark_order_refunded', { p_order_id: order.id, p_reference: reference, p_note: null });
    if (markError) {
      console.error('[PaymentService] remboursement envoyé mais non enregistré :', markError.message);
      return { success: true, payoutId: out.payoutId, warning: `Envoi ${out.payoutId} effectué, mais l’enregistrement a échoué : saisissez cette référence manuellement.` };
    }
    return { success: true, payoutId: out.payoutId };
  }

}

export const paymentService = new PaymentService();
