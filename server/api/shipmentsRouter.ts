import { Router, Request, Response } from 'express';
import { requireAuth, requireAdmin } from '../middleware/auth';
import { ShipmentService } from '../services/ShipmentService';

export const shipmentsRouter = Router();
const shipmentService = new ShipmentService();

/**
 * 1. Recherche publique / client d'un suivi logistique par tracking code
 * Zéro fuite de données financières, de marges ou de prix d'achat
 * GET /api/shipments/tracking/:trackingCode
 */
shipmentsRouter.get('/tracking/:trackingCode', async (req: Request, res: Response) => {
  try {
    const { trackingCode } = req.params;
    if (!trackingCode || !trackingCode.trim()) {
      res.status(400).json({
        success: false,
        error: 'Le numéro de suivi est obligatoire.'
      });
      return;
    }

    const result = await shipmentService.getPublicTracking(trackingCode.trim());
    if (!result.found) {
      res.status(404).json({
        success: false,
        error: 'Aucune expédition trouvée pour ce numéro de suivi.'
      });
      return;
    }

    res.json({
      success: true,
      data: result.data
    });
  } catch (err: any) {
    console.error('[shipmentsRouter] Erreur tracking:', err);
    res.status(500).json({
      success: false,
      error: 'Erreur interne lors de la consultation du suivi.'
    });
  }
});

/**
 * 2. Création d'une expédition pour une commande
 * POST /api/shipments
 * Réservé aux équipes Opérations et Administrateurs (requireAdmin)
 */
shipmentsRouter.post('/', requireAdmin, async (req: Request, res: Response) => {
  try {
    const { orderId, carrierId, hubId, origin, destination, notes } = req.body;
    const token = req.headers.authorization?.substring(7);

    if (!orderId) {
      res.status(400).json({
        success: false,
        error: 'L\'identifiant de commande (orderId) est obligatoire.'
      });
      return;
    }

    const result = await shipmentService.createShipment({
      orderId,
      carrierId,
      hubId,
      origin,
      destination,
      notes,
      token
    });

    if (!result.success) {
      res.status(result.errorCode === 'ORDER_NOT_FOUND' ? 404 : 400).json({
        success: false,
        errorCode: result.errorCode,
        error: result.errorMessage
      });
      return;
    }

    res.status(201).json({
      success: true,
      shipment: result.shipment
    });
  } catch (err: any) {
    console.error('[shipmentsRouter] Erreur création expédition:', err);
    res.status(500).json({
      success: false,
      error: 'Erreur serveur lors de la création de l\'expédition.'
    });
  }
});

/**
 * 3. Liste des expéditions
 * GET /api/shipments
 * Authentification requise (Client voit uniquement ses expéditions, Admin voit tout)
 */
shipmentsRouter.get('/', requireAuth, async (req: Request, res: Response) => {
  try {
    const token = req.headers.authorization?.substring(7);
    const user = req.user;

    const { status, carrierId, hubId, orderId, search, limit, offset } = req.query;

    const result = await shipmentService.listShipments({
      status: status as string,
      carrierId: carrierId as string,
      hubId: hubId as string,
      orderId: orderId as string,
      search: search as string,
      limit: limit ? parseInt(limit as string, 10) : 50,
      offset: offset ? parseInt(offset as string, 10) : 0
    }, token, user);

    res.json(result);
  } catch (err: any) {
    console.error('[shipmentsRouter] Erreur liste expéditions:', err);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération des expéditions.'
    });
  }
});

/**
 * 4. Détails d'une expédition avec événements et documents
 * GET /api/shipments/:id
 * Authentification requise (contrôle d'appartenance RLS)
 */
shipmentsRouter.get('/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const token = req.headers.authorization?.substring(7);
    const user = req.user;

    const result = await shipmentService.getShipmentById(id, token, user);

    if (!result.success) {
      res.status(404).json({
        success: false,
        error: result.error || 'Expédition introuvable.'
      });
      return;
    }

    res.json({
      success: true,
      shipment: result.shipment,
      events: result.events,
      documents: result.documents
    });
  } catch (err: any) {
    console.error('[shipmentsRouter] Erreur détails expédition:', err);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération de l\'expédition.'
    });
  }
});

/**
 * 5. Changement de statut d'une expédition (State Machine)
 * PATCH /api/shipments/:id/status
 * Réservé aux équipes Opérations et Administrateurs (requireAdmin)
 */
shipmentsRouter.patch('/:id/status', requireAdmin, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status, location, description, metadata } = req.body;
    const token = req.headers.authorization?.substring(7);

    if (!status) {
      res.status(400).json({
        success: false,
        error: 'Le statut cible est obligatoire.'
      });
      return;
    }

    const result = await shipmentService.updateStatus({
      shipmentId: id,
      newStatus: status,
      location,
      description,
      metadata,
      token
    });

    if (!result.success) {
      const isNotFound = result.errorCode === 'SHIPMENT_NOT_FOUND';
      const isTerminal = result.errorCode === 'TERMINAL_STATE';
      const isInvalid = result.errorCode === 'INVALID_TRANSITION';

      res.status(isNotFound ? 404 : isTerminal ? 409 : isInvalid ? 422 : 400).json({
        success: false,
        errorCode: result.errorCode,
        error: result.errorMessage
      });
      return;
    }

    res.json({
      success: true,
      result: result.result
    });
  } catch (err: any) {
    console.error('[shipmentsRouter] Erreur mise à jour statut:', err);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la mise à jour du statut.'
    });
  }
});

/**
 * 6. Ajout d'un événement opérationnel manuel
 * POST /api/shipments/:id/events
 * Réservé aux équipes Opérations et Administrateurs (requireAdmin)
 */
shipmentsRouter.post('/:id/events', requireAdmin, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { eventType, status, location, description, metadata } = req.body;
    const token = req.headers.authorization?.substring(7);

    if (!eventType || !location || !description) {
      res.status(400).json({
        success: false,
        error: 'eventType, location et description sont obligatoires.'
      });
      return;
    }

    const result = await shipmentService.addEvent({
      shipmentId: id,
      eventType,
      status,
      location,
      description,
      metadata,
      token
    });

    if (!result.success) {
      res.status(400).json({
        success: false,
        error: result.error
      });
      return;
    }

    res.status(201).json({
      success: true,
      event: result.event
    });
  } catch (err: any) {
    console.error('[shipmentsRouter] Erreur ajout événement:', err);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de l\'ajout de l\'événement.'
    });
  }
});
