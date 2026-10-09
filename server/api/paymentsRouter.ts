import { Router, Request, Response } from 'express';
import { paymentService, PaymentService } from '../services/PaymentService';
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
 * Initialise un paiement SasPay pour une commande de l'utilisateur connecté.
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
 * POST /api/payments/checkout
 * Parcours d'achat en UN appel : création de la commande (prix recalculés en base), frais de transport,
 * vidage du panier et session de paiement SasPay. Le navigateur n'a plus qu'à rediriger.
 */
paymentsRouter.post('/checkout', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const b = req.body || {};
    const items = Array.isArray(b.items) ? b.items.filter((i: any) => i && typeof i.product_id === 'string' && Number(i.quantity) > 0).slice(0, 100) : [];
    if (!items.length) {
      res.status(400).json({ success: false, errorCode: 'EMPTY_CART', errorMessage: 'Votre panier est vide.' });
      return;
    }
    const ready = await paymentService.readiness();
    if (ready !== 'ok') {
      res.status(503).json({ success: false, errorCode: 'PROVIDER_NOT_CONFIGURED', errorMessage: PaymentService.readinessMessage(ready) });
      return;
    }
    const delivery = b.deliveryType === 'home_delivery' ? 'home_delivery' : 'hub_pickup';
    const { data: created, error } = await req.db!.rpc('create_order_from_cart', {
      p_delivery_type: delivery,
      p_hub_location_id: delivery === 'hub_pickup' ? b.hubId || null : null,
      p_delivery_address: delivery === 'home_delivery' ? b.address || null : null,
      p_customer_name: String(b.name || '').slice(0, 120),
      p_customer_phone: String(b.phone || '').slice(0, 40),
      p_customer_email: String(b.email || req.user!.email || '').slice(0, 160),
      p_customer_city: String(b.city || 'Dakar').slice(0, 80),
      p_notes: b.notes ? String(b.notes).slice(0, 1000) : null,
      p_payment_method: 'saspay',
      p_idempotency_key: String(b.idempotencyKey || '').slice(0, 80) || null,
      p_items: items.map((i: any) => ({ product_id: i.product_id, quantity: Math.round(Number(i.quantity)) }))
    });
    if (error || !created?.order_id) {
      res.status(400).json({ success: false, errorCode: 'ORDER_FAILED', errorMessage: error?.message || 'La commande n’a pas pu être créée.' });
      return;
    }
    const orderId: string = created.order_id;
    const transport = b.transportMode === 'sea' ? 'sea' : 'air';
    const { error: logisticsError } = await req.db!.rpc('calculate_order_logistics', { p_order_id: orderId, p_transport_mode: transport, p_status: 'estimated' });
    if (logisticsError) console.warn('[payments] checkout logistics:', logisticsError.message);

    const base = appBaseUrl(req);
    const [payment] = await Promise.all([
      paymentService.createPaymentForOrder({
        db: req.db!,
        orderId,
        userId: req.user!.id,
        clientIp: req.headers['x-forwarded-for']?.toString().split(',')[0].trim() || req.socket.remoteAddress,
        userAgent: req.headers['user-agent'],
        returnUrl: `${base}/paiement/retour?orderId=${encodeURIComponent(orderId)}`,
        cancelUrl: `${base}/paiement/retour?orderId=${encodeURIComponent(orderId)}&cancelled=1`
      }),
      // la commande existe : le panier peut être vidé en parallèle
      req.db!.from('cart_items').delete().eq('user_id', req.user!.id).is('groupage_id', null)
    ]);
    res.status(payment.success ? 200 : 202).json({ success: true, orderId, checkoutUrl: payment.checkoutUrl || null, paymentError: payment.success ? undefined : payment.errorMessage });
  } catch (error: any) {
    console.error('[payments] checkout:', error?.message || error);
    res.status(500).json({ success: false, errorCode: 'INTERNAL_ERROR', errorMessage: 'Erreur interne lors de la commande.' });
  }
});

/** GET /api/payments/warmup : réveille la fonction serveur avant le paiement (aucune donnée). */
paymentsRouter.get('/warmup', (_req: Request, res: Response) => {
  res.json({ ok: true });
});

/**
 * GET /api/payments/order/:orderId
 * Statut certifié du paiement d'une commande (propriétaire ou administration uniquement).
 * Interroge SasPay pour synchroniser un paiement encore en attente.
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
