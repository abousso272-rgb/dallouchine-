import { Router, Request, Response } from 'express';
import { paymentService } from '../services/PaymentService';
import { config } from '../config';
import { requireAuth, requireAdmin, requireRole } from '../middleware/auth';

export const paymentsRouter = Router();

function appBaseUrl(req: Request): string {
  const host = String(req.headers['x-forwarded-host'] || req.headers.host || '').split(',')[0].trim();
  if (!host || host.includes('localhost') || host.startsWith('127.')) return config.appUrl;
  return `https://${host}`;
}

/**
 * POST /api/payments/create
 * Initialise un paiement GeniusPay pour une commande de l'utilisateur connecté.
 * Le montant est toujours recalculé côté base de données ; aucun montant client n'est accepté.
 */
paymentsRouter.post('/create', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const orderId = req.body.orderId || req.body.order_id;
    if (!orderId || typeof orderId !== 'string') {
      res.status(400).json({ success: false, errorCode: 'MISSING_ORDER_ID', errorMessage: 'Identifiant de commande manquant.' });
      return;
    }

    // Vérifie que la commande appartient bien à l'utilisateur (RLS avec son propre jeton)
    const { data: order } = await req.db!.from('orders').select('id, user_id').eq('id', orderId).maybeSingle();
    if (!order || order.user_id !== req.user!.id) {
      res.status(404).json({ success: false, errorCode: 'ORDER_NOT_FOUND', errorMessage: 'Commande introuvable.' });
      return;
    }

    const base = appBaseUrl(req);
    const result = await paymentService.createPaymentForOrder({
      db: req.db!,
      orderId,
      userId: req.user!.id,
      clientIp: req.headers['x-forwarded-for']?.toString().split(',')[0].trim() || req.socket.remoteAddress,
      userAgent: req.headers['user-agent'],
      returnUrl: `${base}/paiement/retour?orderId=${encodeURIComponent(orderId)}`,
      cancelUrl: `${base}/paiement/retour?orderId=${encodeURIComponent(orderId)}&cancelled=1`,
      paymentMethod: typeof req.body.paymentMethod === 'string' ? req.body.paymentMethod : undefined
    });

    if (!result.success) {
      const code = result.errorCode;
      const status =
        code === 'FORBIDDEN' ? 403 : code === 'ORDER_NOT_FOUND' ? 404 : code === 'ALREADY_PAID' || code === 'ORDER_CANCELLED' ? 409 : code === 'TOO_MANY_ATTEMPTS' ? 429 : code === 'PROVIDER_NOT_CONFIGURED' ? 503 : 400;
      res.status(status).json(result);
      return;
    }
    res.json(result);
  } catch (error: any) {
    console.error('[payments] create:', error?.message || error);
    res.status(500).json({ success: false, errorCode: 'INTERNAL_ERROR', errorMessage: 'Erreur interne lors de l\'initialisation du paiement.' });
  }
});

/**
 * GET /api/payments/order/:orderId
 * Statut certifié du paiement d'une commande (propriétaire ou administration uniquement).
 * Interroge GeniusPay pour synchroniser un paiement encore en attente.
 */
async function handleStatus(req: Request, res: Response): Promise<void> {
  try {
    const id = req.params.orderId || req.params.id;
    const statusData = await paymentService.getPaymentStatus(req.db!, id);
    if (!statusData.found || !statusData.order) {
      res.status(404).json({ success: false, errorMessage: 'Paiement ou commande introuvable.' });
      return;
    }
    if (statusData.order.userId !== req.user!.id && !req.user!.isAdmin) {
      res.status(404).json({ success: false, errorMessage: 'Paiement ou commande introuvable.' });
      return;
    }
    res.json({ success: true, payment: statusData.payment, order: statusData.order });
  } catch (error: any) {
    console.error('[payments] status:', error?.message || error);
    res.status(500).json({ success: false, errorMessage: 'Erreur lors de la récupération du statut de paiement.' });
  }
}

paymentsRouter.get('/order/:orderId', requireAuth, handleStatus);
paymentsRouter.get('/:id/status', requireAuth, handleStatus);

/**
 * POST /api/payments/webhooks/geniuspay (et /api/webhooks/geniuspay)
 * Source de vérité de la confirmation de paiement : signature HMAC vérifiée sur le corps brut.
 */
const handleGeniusPayWebhookRoute = async (req: Request, res: Response): Promise<void> => {
  try {
    const rawBody = (req as any).rawBody || JSON.stringify(req.body);
    const result = await paymentService.handleWebhook(rawBody, req.headers);
    res.status(result.status).json(result);
  } catch (error: any) {
    console.error('[payments] webhook:', error?.message || error);
    res.status(500).json({ status: 500, message: 'Erreur interne lors du traitement du webhook.' });
  }
};

paymentsRouter.post('/webhooks/geniuspay', handleGeniusPayWebhookRoute);

/** POST /api/webhooks/saspay : notification signée (HMAC) ; le paiement est relu auprès de l'API avant confirmation. */
const handleSasPayWebhookRoute = async (req: Request, res: Response): Promise<void> => {
  try {
    const rawBody = (req as any).rawBody || JSON.stringify(req.body);
    const result = await paymentService.handleSasPayWebhook(rawBody, req.headers);
    res.status(result.status).json(result);
  } catch (error: any) {
    console.error('[payments] webhook saspay:', error?.message || error);
    res.status(500).json({ status: 500, message: 'Erreur interne lors du traitement du webhook.' });
  }
};
paymentsRouter.post('/webhooks/saspay', handleSasPayWebhookRoute);

/**
 * POST /api/payments/staff-link  { orderId }
 * L'équipe (administration ou transitaire) génère un lien de paiement pour la commande d'un client :
 * à envoyer par WhatsApp, SMS ou email. Le client paie sur la page sécurisée du fournisseur.
 */
paymentsRouter.post('/staff-link', requireRole('admin', 'transitaire'), async (req: Request, res: Response): Promise<void> => {
  try {
    const orderId = req.body.orderId;
    if (!orderId || typeof orderId !== 'string') {
      res.status(400).json({ success: false, errorCode: 'MISSING_ORDER_ID', errorMessage: 'Identifiant de commande manquant.' });
      return;
    }
    const base = appBaseUrl(req);
    const result = await paymentService.createPaymentForOrder({
      db: req.db!,
      orderId,
      asStaff: true,
      clientIp: req.headers['x-forwarded-for']?.toString().split(',')[0].trim() || req.socket.remoteAddress,
      userAgent: req.headers['user-agent'],
      returnUrl: `${base}/paiement/retour?orderId=${encodeURIComponent(orderId)}`,
      cancelUrl: `${base}/paiement/retour?orderId=${encodeURIComponent(orderId)}&cancelled=1`
    });
    if (!result.success) {
      const code = result.errorCode;
      res.status(code === 'ALREADY_PAID' || code === 'ORDER_CANCELLED' ? 409 : code === 'PROVIDER_NOT_CONFIGURED' ? 503 : 400).json(result);
      return;
    }
    res.json(result);
  } catch (error: any) {
    console.error('[payments] staff-link:', error?.message || error);
    res.status(500).json({ success: false, errorCode: 'INTERNAL_ERROR', errorMessage: 'Erreur lors de la création du lien de paiement.' });
  }
});

/** Réseaux mobile money disponibles (équipe) */
paymentsRouter.get('/networks', requireRole('admin', 'transitaire'), async (_req: Request, res: Response): Promise<void> => {
  try {
    res.json({ success: true, networks: await paymentService.listNetworks() });
  } catch {
    res.json({ success: true, networks: [] });
  }
});

/** POST /api/payments/refund  { orderId, participantId?, networkCode, msisdn } — remboursement automatique (administration) */
paymentsRouter.post('/refund', requireAdmin, async (req: Request, res: Response): Promise<void> => {
  try {
    const { orderId, participantId, networkCode, msisdn } = req.body || {};
    if (typeof orderId !== 'string' || typeof networkCode !== 'string' || typeof msisdn !== 'string') {
      res.status(400).json({ success: false, errorMessage: 'Commande, réseau et numéro requis.' });
      return;
    }
    const result = await paymentService.refundOrder(req.db!, { orderId, participantId: typeof participantId === 'string' ? participantId : undefined, networkCode, msisdn });
    res.status(result.success ? 200 : result.errorCode === 'ip_not_whitelisted' || result.errorCode === 'payout_not_enabled' ? 409 : 400).json(result);
  } catch (error: any) {
    console.error('[payments] refund:', error?.message || error);
    res.status(500).json({ success: false, errorMessage: 'Erreur interne lors du remboursement.' });
  }
});

/** Journal des paiements (administration générale) */
paymentsRouter.get('/admin/list', requireAdmin, async (req: Request, res: Response): Promise<void> => {
  try {
    const payments = await paymentService.getAdminPayments(req.db!);
    res.json({ success: true, payments });
  } catch (error: any) {
    console.error('[payments] admin list:', error?.message || error);
    res.status(500).json({ success: false, errorMessage: 'Erreur lors du chargement des paiements.' });
  }
});

/** Solde et compte marchand GeniusPay (administration générale) */
paymentsRouter.get('/admin/geniuspay/balance', requireAdmin, async (_req: Request, res: Response): Promise<void> => {
  res.json(await paymentService.getGeniusPayBalance());
});

paymentsRouter.get('/admin/geniuspay/account', requireAdmin, async (_req: Request, res: Response): Promise<void> => {
  res.json(await paymentService.getGeniusPayAccount());
});
