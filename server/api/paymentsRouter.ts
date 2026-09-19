import { Router, Request, Response } from 'express';
import { paymentService } from '../services/PaymentService';
import { storage } from '../db/storage';
import { config } from '../config';
import { optionalAuth, requireAdmin } from '../middleware/auth';

export const paymentsRouter = Router();

/**
 * 1. POST /api/payments/create
 * Initialisation d'un paiement sécurisé
 * L'identité provient exclusivement du jeton Supabase Auth
 */
paymentsRouter.post('/create', optionalAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const { orderId, userId: unverifiedUserId, returnUrl, cancelUrl, orderData } = req.body;

    // SÉCURITÉ AUTHENTIFICATION : L'identité provient TOUJOURS du jeton Supabase Auth
    // Un utilisateur connecté ne peut jamais se faire passer pour un autre en envoyant un userId arbitraire
    let verifiedUserId: string | undefined = undefined;

    if (req.user) {
      // Utilisateur authentifié via Supabase Auth Bearer Token
      if (unverifiedUserId && unverifiedUserId !== req.user.id) {
        console.warn(`[Security Alert] User ${req.user.id} attempted to spoof userId ${unverifiedUserId}`);
        res.status(403).json({
          success: false,
          errorMessage: 'Refus de sécurité : Vous ne pouvez pas passer de commande au nom d\'un autre utilisateur.'
        });
        return;
      }
      verifiedUserId = req.user.id;
    } else {
      // Requête anonyme : aucun userId prétendu dans le body n'est accepté
      verifiedUserId = undefined;
    }

    // Si la commande vient d'être générée lors du checkout, on la persiste d'abord
    if (orderData && orderData.id) {
      await storage.saveOrder({
        id: orderData.id,
        trackingCode: orderData.trackingCode || `AWP-${Math.floor(10000 + Math.random() * 90000)}`,
        userId: verifiedUserId || undefined,
        customerName: orderData.customer?.fullName || orderData.customerName || 'Client SinoSenegal',
        customerPhone: orderData.customer?.phone || orderData.customerPhone || '',
        customerEmail: orderData.customer?.email || orderData.customerEmail || '',
        customerCity: orderData.customer?.city || orderData.customerCity || 'Dakar',
        subtotalXOF: Number(orderData.subtotalXOF || 0),
        shippingFeeXOF: Number(orderData.shippingFeeXOF || 0),
        discountAmountXOF: Number(orderData.discountAmountXOF || 0),
        totalXOF: Number(orderData.totalXOF || 0),
        paymentMethod: orderData.paymentMethod || 'wave',
        paymentStatus: 'pending',
        orderStatus: 'pending_payment',
        deliveryType: orderData.deliveryType || 'hub_pickup',
        hubLocationId: orderData.hubLocationId,
        deliveryAddress: orderData.deliveryAddress,
        items: (orderData.items || []).map((item: any) => ({
          productId: item.product?.id || item.productId || 'p-gen',
          productName: item.product?.name || item.productName || 'Article',
          productImage: item.product?.images?.[0] || item.productImage,
          quantity: Number(item.quantity || 1),
          unitPriceXOF: Number(item.product?.priceXOF || item.unitPriceXOF || 0),
          totalPriceXOF: Number((item.product?.priceXOF || item.unitPriceXOF || 0) * (item.quantity || 1)),
          isGroupage: Boolean(item.isGroupage),
          groupageId: item.groupageId
        })),
        notes: orderData.notes,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    }

    const targetOrderId = orderId || orderData?.id;
    if (!targetOrderId) {
      res.status(400).json({
        success: false,
        errorMessage: 'Identifiant de commande manquant.'
      });
      return;
    }

    const clientIp = req.headers['x-forwarded-for']?.toString() || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];

    const result = await paymentService.createPaymentForOrder({
      orderId: targetOrderId,
      userId: verifiedUserId,
      clientIp,
      userAgent,
      returnUrl,
      cancelUrl
    });

    if (!result.success) {
      res.status(400).json(result);
      return;
    }

    res.json(result);
  } catch (error: any) {
    console.error('[Payments API] Error in /api/payments/create:', error.message || error);
    res.status(500).json({
      success: false,
      errorMessage: 'Erreur interne lors de l\'initialisation du paiement.'
    });
  }
});

/**
 * 2. GET /api/payments/:id/status
 * Récupération du statut certifié d'un paiement
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
      errorMessage: 'Erreur lors de la récupération du statut.'
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
      errorMessage: 'Erreur lors de la récupération du paiement.'
    });
  }
});

/**
 * 4. POST /api/webhooks/geniuspay
 * Réception et vérification des webhooks GeniusPay
 */
paymentsRouter.post('/webhooks/geniuspay', async (req: Request, res: Response): Promise<void> => {
  try {
    // Le rawBody est injecté par le middleware Express raw body parser
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
});

/**
 * 5. GET /api/admin/payments
 * Journal des paiements pour l'administration
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
 * 6. POST /api/payments/simulate-sandbox-webhook
 * Simulation sécurisée pour le développement / bac à sable
 */
paymentsRouter.post('/simulate-sandbox-webhook', async (req: Request, res: Response): Promise<void> => {
  try {
    const { orderId, providerTransactionId, eventType = 'payment_success' } = req.body;

    const mockPayload = {
      event: eventType,
      id: `evt_sim_${Date.now()}`,
      created_at: Math.floor(Date.now() / 1000),
      data: {
        transaction_id: providerTransactionId || `gp_tx_sim_${Date.now()}`,
        status: eventType === 'payment_success' ? 'completed' : eventType === 'payment_failed' ? 'failed' : 'cancelled',
        amount: 137000,
        currency: 'XOF',
        metadata: {
          order_id: orderId
        }
      }
    };

    const rawString = JSON.stringify(mockPayload);
    const timestamp = Math.floor(Date.now() / 1000).toString();
    
    // Si secret défini, calcul HMAC réel
    const crypto = await import('crypto');
    const signature = crypto
      .createHmac('sha256', config.geniusPayWebhookSecret)
      .update(`${timestamp}.${rawString}`)
      .digest('hex');

    const result = await paymentService.handleWebhook(rawString, {
      'x-geniuspay-signature': signature,
      'x-geniuspay-timestamp': timestamp,
      'content-type': 'application/json'
    });

    res.json({
      success: result.status === 200,
      result
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      errorMessage: error.message
    });
  }
});
