import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import { paymentService } from '../services/PaymentService';
import { config } from '../config';
import { requireAuth, requireAdmin, getSupabaseServerClient } from '../middleware/auth';

export const paymentsRouter = Router();

/**
 * 1. POST /api/payments/create
 * Initialisation d'une tentative de paiement certifiée.
 * SÉCURITÉ ABSOLUE :
 * - L'utilisateur doit être obligatoirement authentifié (requireAuth)
 * - L'identité provient exclusivement du jeton Supabase Auth (req.user.id)
 * - Le montant, la devise, et le statut sont recalculés côté serveur depuis la commande
 * - AUCUN montant, total ou statut envoyé par le frontend n'est accepté.
 */
paymentsRouter.post('/create', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const orderId = req.body.orderId || req.body.order_id;
    let { returnUrl, cancelUrl, paymentMethod } = req.body;

    if (!orderId) {
      res.status(400).json({
        success: false,
        errorCode: 'MISSING_ORDER_ID',
        errorMessage: 'Identifiant de commande manquant.'
      });
      return;
    }

    // Détection dynamique et sécurisée de l'origine de l'application
    const rawHost = (req.headers['x-forwarded-host'] || req.headers.host || 'dallouchine.vercel.app').toString();
    const rawProto = (req.headers['x-forwarded-proto'] || (req.secure ? 'https' : 'https')).toString();
    const cleanHost = rawHost.split(',')[0].trim();
    const requestOrigin = cleanHost.startsWith('http') ? cleanHost : `${rawProto}://${cleanHost}`;
    const safeBase = cleanHost.includes('localhost') 
      ? (config.appUrl || 'https://dallouchine.vercel.app') 
      : `https://${cleanHost}`;

    if (!returnUrl || returnUrl.includes('localhost')) {
      returnUrl = `${safeBase}/payment/success?orderId=${orderId}`;
    }
    if (!cancelUrl || cancelUrl.includes('localhost')) {
      cancelUrl = `${safeBase}/payment/cancelled?orderId=${orderId}`;
    }

    const userId = req.user!.id;
    const clientIp = req.headers['x-forwarded-for']?.toString() || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];

    // Appel du service de paiement : validation stricte serveur
    const result = await paymentService.createPaymentForOrder({
      orderId,
      userId,
      clientIp,
      userAgent,
      returnUrl,
      cancelUrl,
      paymentMethod
    });

    if (!result.success) {
      let statusCode = 400;
      if (result.errorCode === 'FORBIDDEN') statusCode = 403;
      else if (result.errorCode === 'ORDER_NOT_FOUND') statusCode = 404;
      else if (result.errorCode === 'ALREADY_PAID' || result.errorCode === 'ORDER_CANCELLED') statusCode = 409;

      res.status(statusCode).json(result);
      return;
    }

    res.json(result);
  } catch (error: any) {
    console.error('[Payments API] Error in /api/payments/create:', error.message || error);
    res.status(500).json({
      success: false,
      errorCode: 'INTERNAL_ERROR',
      errorMessage: 'Erreur interne lors de l\'initialisation du paiement.'
    });
  }
});

/**
 * 2. GET /api/payments/:id/status
 * Récupération du statut certifié d'un paiement ou d'une commande
 */
paymentsRouter.get('/:id/status', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const statusData = await paymentService.getPaymentStatus(id);

    if (!statusData.found) {
      res.status(404).json({
        success: false,
        errorMessage: 'Paiement ou commande introuvable.'
      });
      return;
    }

    res.json({
      success: true,
      payment: statusData.payment,
      order: statusData.order
    });
  } catch (error: any) {
    console.error('[Payments API] Error in /api/payments/:id/status:', error.message || error);
    res.status(500).json({
      success: false,
      errorMessage: 'Erreur lors de la récupération du statut de paiement.'
    });
  }
});

/**
 * 3. GET /api/payments/order/:orderId
 * Récupération du paiement associé à une commande
 */
paymentsRouter.get('/order/:orderId', async (req: Request, res: Response): Promise<void> => {
  try {
    const { orderId } = req.params;
    const statusData = await paymentService.getPaymentStatus(orderId);

    if (!statusData.found) {
      res.status(404).json({
        success: false,
        errorMessage: 'Aucun paiement associé à cette commande.'
      });
      return;
    }

    res.json({
      success: true,
      payment: statusData.payment,
      order: statusData.order
    });
  } catch (error: any) {
    console.error('[Payments API] Error in /api/payments/order/:orderId:', error.message || error);
    res.status(500).json({
      success: false,
      errorMessage: 'Erreur lors de la récupération du paiement de la commande.'
    });
  }
});

/**
 * 4. POST /api/payments/webhooks/geniuspay (et /api/webhooks/geniuspay)
 * Source unique de vérité pour la confirmation de paiement.
 * Reçoit le webhook, vérifie la signature HMAC-SHA256 sur le rawBody,
 * applique l'idempotence et les transitions transactionnelles.
 */
const handleGeniusPayWebhookRoute = async (req: Request, res: Response): Promise<void> => {
  try {
    const rawBody = (req as any).rawBody || JSON.stringify(req.body);
    const headers = req.headers;

    const result = await paymentService.handleWebhook(rawBody, headers);
    res.status(result.status).json(result);
  } catch (error: any) {
    console.error('[Payments API] Webhook processing exception:', error.message || error);
    res.status(500).json({
      status: 500,
      message: 'Erreur interne du serveur lors du traitement du webhook.'
    });
  }
};

paymentsRouter.post('/webhooks/geniuspay', handleGeniusPayWebhookRoute);

/**
 * 5. GET /api/admin/payments (ou /api/payments/admin/list)
 * Journal certifié des paiements pour l'administration
 */
paymentsRouter.get('/admin/list', requireAdmin, async (_req: Request, res: Response): Promise<void> => {
  try {
    const payments = await paymentService.getAdminPayments();
    res.json({
      success: true,
      payments
    });
  } catch (error: any) {
    console.error('[Payments API] Error in /api/admin/payments:', error.message || error);
    res.status(500).json({
      success: false,
      errorMessage: 'Erreur lors du chargement des paiements.'
    });
  }
});

/**
 * 6. GET /api/payments/admin/geniuspay/balance
 * Solde du compte marchand GeniusPay (GET /account/balance)
 */
paymentsRouter.get('/admin/geniuspay/balance', requireAdmin, async (_req: Request, res: Response): Promise<void> => {
  try {
    const result = await paymentService.getGeniusPayBalance();
    res.json(result);
  } catch (error: any) {
    console.error('[Payments API] Error in /admin/geniuspay/balance:', error.message || error);
    res.status(500).json({
      success: false,
      errorMessage: 'Impossible de récupérer le solde marchand GeniusPay.'
    });
  }
});

/**
 * 7. GET /api/payments/admin/geniuspay/account
 * Informations du compte marchand GeniusPay (GET /account)
 */
paymentsRouter.get('/admin/geniuspay/account', requireAdmin, async (_req: Request, res: Response): Promise<void> => {
  try {
    const result = await paymentService.getGeniusPayAccount();
    res.json(result);
  } catch (error: any) {
    console.error('[Payments API] Error in /admin/geniuspay/account:', error.message || error);
    res.status(500).json({
      success: false,
      errorMessage: 'Impossible de récupérer les informations du compte GeniusPay.'
    });
  }
});

/**
 * 8. GET /api/payments/admin/geniuspay/live-payments
 * Liste en direct des transactions sur la passerelle GeniusPay (GET /payments)
 */
paymentsRouter.get('/admin/geniuspay/live-payments', requireAdmin, async (req: Request, res: Response): Promise<void> => {
  try {
    const { status, from, to, per_page } = req.query;
    const result = await paymentService.getGeniusPayLiveTransactions({
      status: status as any,
      from: from as string,
      to: to as string,
      per_page: per_page ? parseInt(per_page as string, 10) : undefined
    });
    res.json(result);
  } catch (error: any) {
    console.error('[Payments API] Error in /admin/geniuspay/live-payments:', error.message || error);
    res.status(500).json({
      success: false,
      errorMessage: 'Impossible de récupérer la liste des paiements en direct.'
    });
  }
});

/**
 * 9. POST /api/payments/simulate-sandbox-webhook
 * Simulation strictement réservée à l'environnement de développement / bac à sable.
 * TOTALEMENT DÉSACTIVÉ EN PRODUCTION.
 */
paymentsRouter.post('/simulate-sandbox-webhook', async (req: Request, res: Response): Promise<void> => {
  try {
    // 1. Protection environnementale de production
    if (config.geniusPayEnvironment === 'production') {
      res.status(403).json({
        success: false,
        errorMessage: 'Accès interdit : La simulation sandbox est désactivée lorsque GENIUSPAY_ENVIRONMENT=production.'
      });
      return;
    }

    const { orderId, providerTransactionId, eventType = 'payment_success' } = req.body;

    if (!orderId) {
      res.status(400).json({
        success: false,
        errorMessage: 'Identifiant de commande requis pour la simulation.'
      });
      return;
    }

    // 2. Recherche certifiée de la commande et de la tentative via la fonction RPC
    const supabase = getSupabaseServerClient();
    const { data: details } = await supabase.rpc('get_order_payment_details', {
      p_order_id: orderId
    });

    if (!details || !details.found || !details.order) {
      res.status(404).json({
        success: false,
        errorMessage: 'Commande ciblée introuvable en base de données.'
      });
      return;
    }

    const order = details.order;
    let attempt = details.attempt;
    const realAmount = attempt ? Number(attempt.amount_xof) : Number(order.total_xof);
    const merchantReference = attempt?.merchant_reference || `DALLOU-SIM-${Date.now()}`;
    const txId = providerTransactionId || attempt?.provider_payment_id || `gp_tx_sim_${Date.now()}`;

    if (!attempt) {
      await supabase.from('payment_attempts').insert({
        order_id: order.id,
        attempt_number: 1,
        merchant_reference: merchantReference,
        provider_payment_id: txId,
        amount_xof: realAmount,
        currency: 'XOF',
        status: 'pending'
      });
    }

    const payloadStatus = eventType === 'payment_success' ? 'completed' : eventType === 'payment_failed' ? 'failed' : 'cancelled';
    const officialEvent = eventType === 'payment_success' ? 'payment.success' : eventType === 'payment_failed' ? 'payment.failed' : 'payment.cancelled';

    // 3. Payload conforme à la documentation officielle GeniusPay
    const mockPayload = {
      event: officialEvent,
      id: `evt_sim_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
      created_at: Math.floor(Date.now() / 1000),
      data: {
        // Objet transaction documenté
        transaction: {
          id: txId,
          reference: merchantReference,
          merchant_reference: merchantReference,
          status: payloadStatus,
          amount: realAmount,
          currency: 'XOF',
          customer: {
            name: order.customer_name,
            phone: order.customer_phone,
            email: order.customer_email
          },
          metadata: {
            order_id: order.id,
            order_code: order.tracking_code,
            merchant_reference: merchantReference
          }
        },
        // Rétrocompatibilité avec les tests qui lisent directement data.*
        transaction_id: txId,
        reference: merchantReference,
        merchant_reference: merchantReference,
        status: payloadStatus,
        amount: realAmount,
        currency: 'XOF',
        metadata: {
          order_id: order.id,
          order_code: order.tracking_code,
          merchant_reference: merchantReference
        },
        merchant: {
          id: 'uuid-merchant-dallou',
          name: 'Dallou Chine'
        },
        environment: 'sandbox'
      }
    };

    const rawString = JSON.stringify(mockPayload);
    const timestamp = Math.floor(Date.now() / 1000).toString();

    // 4. Signature HMAC-SHA256 cryptographique conforme (supporte la signature officielle directe et avec horodatage)
    const signature = crypto
      .createHmac('sha256', config.geniusPayWebhookSecret)
      .update(`${timestamp}.${rawString}`)
      .digest('hex');

    // 5. Exécution sécurisée via le flux réel de traitement
    const result = await paymentService.handleWebhook(rawString, {
      'x-geniuspay-signature': signature,
      'x-geniuspay-timestamp': timestamp,
      'x-geniuspay-event': officialEvent,
      'content-type': 'application/json'
    });

    res.json({
      success: result.status === 200,
      result
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      errorMessage: error.message || 'Erreur lors de la simulation sandbox.'
    });
  }
});
