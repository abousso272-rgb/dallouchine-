import { Router, Request, Response } from 'express';
import crypto from 'crypto';
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
      p_payment_method: paymentService.activeProvider,
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

/** POST /api/webhooks/paytech : notification IPN PayTech (vérification des hash SHA256 des clés). */
const handlePayTechWebhookRoute = async (req: Request, res: Response): Promise<void> => {
  try {
    const rawBody = (req as any).rawBody || JSON.stringify(req.body);
    const result = await paymentService.handlePayTechWebhook(rawBody, req.headers);
    res.status(result.status).json(result);
  } catch (error: any) {
    console.error('[payments] webhook paytech:', error?.message || error);
    res.status(500).json({ status: 500, message: 'Erreur interne lors du traitement du webhook PayTech.' });
  }
};
paymentsRouter.post('/webhooks/paytech', handlePayTechWebhookRoute);

/**
 * GET /api/payments/test-gateway
 * Diagnostique en direct la connectivité vers la passerelle PayTech (accessible depuis Vercel et en local).
 */
paymentsRouter.get('/test-gateway', async (_req: Request, res: Response) => {
  const t0 = Date.now();
  try {
    const probe = await fetch('https://paytech.sn/api/payment/request-payment', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'API_KEY': config.paytechApiKey,
        'API_SECRET': config.paytechApiSecret
      },
      body: JSON.stringify({
        item_name: 'Diagnostic Dallou Chine',
        item_price: 1000,
        currency: 'XOF',
        ref_command: `DIAG-${Date.now()}`,
        command_name: 'Diagnostic',
        env: config.paytechEnv
      }),
      signal: AbortSignal.timeout(15_000)
    });
    const duration = Date.now() - t0;
    const body = await probe.text().catch(() => '');
    res.json({
      success: probe.ok,
      status: probe.status,
      durationMs: duration,
      env: config.paytechEnv,
      response: body.slice(0, 300)
    });
  } catch (err: any) {
    res.status(502).json({
      success: false,
      durationMs: Date.now() - t0,
      env: config.paytechEnv,
      error: err?.message || String(err)
    });
  }
});

/**
 * GET /api/payments/sandbox
 * Page de checkout sandbox PayTech en environnement de test (utilisée lorsque l'API distante est inaccessible ou pour tester en local).
 */
paymentsRouter.get('/sandbox', (req: Request, res: Response) => {
  if (config.paytechEnv !== 'test') {
    res.status(403).send('Sandbox uniquement disponible en mode test.');
    return;
  }

  const orderId = String(req.query.orderId || '');
  const orderCode = String(req.query.orderCode || 'COMMANDE');
  const amount = Number(req.query.amount || 0);
  const ref = String(req.query.ref || orderCode);
  const returnUrl = String(req.query.returnUrl || `${appBaseUrl(req)}/paiement/retour?orderId=${encodeURIComponent(orderId)}`);
  const cancelUrl = String(req.query.cancelUrl || `${appBaseUrl(req)}/paiement/retour?orderId=${encodeURIComponent(orderId)}&cancelled=1`);

  const formattedAmount = new Intl.NumberFormat('fr-FR').format(amount);

  const html = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>PayTech Sandbox · Dallou Chine</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      background: #f8fafc;
      color: #0f172a;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }
    .card {
      background: #ffffff;
      width: 100%;
      max-width: 440px;
      border-radius: 24px;
      box-shadow: 0 20px 40px -15px rgba(0,0,0,0.08), 0 0 1px 1px rgba(0,0,0,0.04);
      padding: 32px 28px;
    }
    .badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: #eff6ff;
      color: #2563eb;
      font-size: 12px;
      font-weight: 700;
      padding: 4px 12px;
      border-radius: 999px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .badge::before {
      content: "";
      width: 6px;
      height: 6px;
      background: #2563eb;
      border-radius: 50%;
    }
    .header {
      margin-top: 16px;
      text-align: center;
    }
    .title {
      font-size: 20px;
      font-weight: 800;
      color: #1e293b;
    }
    .order-code {
      font-size: 13px;
      color: #64748b;
      margin-top: 4px;
    }
    .amount-box {
      margin: 24px 0;
      padding: 18px;
      background: #f1f5f9;
      border-radius: 16px;
      text-align: center;
    }
    .amount-label {
      font-size: 12px;
      font-weight: 600;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .amount-value {
      font-size: 30px;
      font-weight: 800;
      color: #0f172a;
      margin-top: 4px;
    }
    .methods-title {
      font-size: 13px;
      font-weight: 700;
      color: #475569;
      margin-bottom: 12px;
    }
    .operators {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    .btn-op {
      display: flex;
      align-items: center;
      justify-content: space-between;
      width: 100%;
      padding: 14px 16px;
      border: 1.5px solid #e2e8f0;
      border-radius: 14px;
      background: #fff;
      font-size: 14px;
      font-weight: 700;
      cursor: pointer;
      transition: all 0.15s ease;
    }
    .btn-op:hover {
      border-color: #3b82f6;
      background: #f8fafc;
      transform: translateY(-1px);
    }
    .btn-wave { color: #0284c7; }
    .btn-om { color: #ea580c; }
    .btn-free { color: #dc2626; }
    .btn-card { color: #475569; }
    .cancel-link {
      display: block;
      margin-top: 20px;
      text-align: center;
      font-size: 13px;
      font-weight: 600;
      color: #94a3b8;
      text-decoration: none;
    }
    .cancel-link:hover { color: #64748b; text-decoration: underline; }
    .footer {
      margin-top: 24px;
      text-align: center;
      font-size: 11px;
      color: #94a3b8;
      line-height: 1.5;
    }
  </style>
</head>
<body>
  <div class="card">
    <div style="text-align: center;">
      <span class="badge">PayTech Sandbox · Test</span>
    </div>
    <div class="header">
      <h1 class="title">Dallou Chine</h1>
      <p class="order-code">Commande #${orderCode}</p>
    </div>

    <div class="amount-box">
      <div class="amount-label">Montant à régler</div>
      <div class="amount-value">${formattedAmount} <span style="font-size: 16px;">FCFA</span></div>
    </div>

    <div class="methods-title">Simuler le règlement avec l'opérateur de votre choix :</div>

    <form method="POST" action="/api/payments/sandbox/confirm" id="payForm">
      <input type="hidden" name="orderId" value="${orderId}">
      <input type="hidden" name="orderCode" value="${orderCode}">
      <input type="hidden" name="amount" value="${amount}">
      <input type="hidden" name="ref" value="${ref}">
      <input type="hidden" name="returnUrl" value="${returnUrl}">
      <input type="hidden" name="operator" id="operatorInput" value="wave">

      <div class="operators">
        <button type="button" class="btn-op btn-wave" onclick="submitOp('wave')">
          <span>🌊 Payer avec Wave (Test)</span>
          <span>→</span>
        </button>
        <button type="button" class="btn-op btn-om" onclick="submitOp('orange_money')">
          <span>🟠 Payer avec Orange Money (Test)</span>
          <span>→</span>
        </button>
        <button type="button" class="btn-op btn-free" onclick="submitOp('free_money')">
          <span>🔴 Payer avec Free Money (Test)</span>
          <span>→</span>
        </button>
        <button type="button" class="btn-op btn-card" onclick="submitOp('card')">
          <span>💳 Payer par Carte Bancaire (Test)</span>
          <span>→</span>
        </button>
      </div>
    </form>

    <a href="${cancelUrl}" class="cancel-link">Annuler la transaction</a>

    <div class="footer">
      Environnement de simulation sécurisé PayTech.<br>
      Aucun débit réel ne sera effectué.
    </div>
  </div>

  <script>
    function submitOp(op) {
      document.getElementById('operatorInput').value = op;
      const btns = document.querySelectorAll('.btn-op');
      btns.forEach(b => { b.disabled = true; b.style.opacity = '0.5'; });
      document.getElementById('payForm').submit();
    }
  </script>
</body>
</html>`;

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send(html);
});

/**
 * POST /api/payments/sandbox/confirm
 * Valide le paiement simulé en déclenchant le webhook PayTech signé avec la clé secrète.
 */
paymentsRouter.post('/sandbox/confirm', async (req: Request, res: Response) => {
  if (config.paytechEnv !== 'test') {
    res.status(403).send('Sandbox uniquement disponible en mode test.');
    return;
  }

  const { orderId, orderCode, amount, ref, returnUrl, operator } = req.body || {};
  const token = `pt_sandbox_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const secretHash = crypto.createHash('sha256').update(config.paytechApiSecret).digest('hex');
  const keyHash = crypto.createHash('sha256').update(config.paytechApiKey).digest('hex');

  const webhookPayload = {
    type_event: 'sale_complete',
    item_name: `Commande ${orderCode}`,
    item_price: Number(amount),
    currency: 'XOF',
    ref_command: ref,
    token,
    api_key_sha256: keyHash,
    api_secret_sha256: secretHash,
    custom_field: JSON.stringify({
      order_id: orderId,
      order_code: orderCode,
      merchant_reference: ref,
      charged_amount: Number(amount),
      operator: operator || 'wave'
    })
  };

  try {
    const hookResult = await paymentService.handlePayTechWebhook(JSON.stringify(webhookPayload), {});
    console.log('[PayTech Sandbox] Validation paiement :', hookResult);
    const dest = returnUrl || `${appBaseUrl(req)}/paiement/retour?orderId=${encodeURIComponent(orderId)}`;
    res.redirect(dest);
  } catch (err: any) {
    console.error('[PayTech Sandbox] Erreur webhook sandbox:', err?.message || err);
    res.status(500).send('Erreur lors de la validation du paiement sandbox.');
  }
});

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
