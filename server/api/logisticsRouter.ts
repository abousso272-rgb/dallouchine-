import { Router, Request, Response } from 'express';
import { logisticsService } from '../services/LogisticsService';
import { storage } from '../db/storage';
import { ShipmentStatus } from '../types/logistics';
import { TransportMode } from '../../src/types';

export const logisticsRouter = Router();

// Helper d'extraction d'identité et de rôle sécurisé
function getRequestActor(req: Request) {
  const userId = (req.headers['x-user-id'] as string) || (req.query.userId as string) || 'anonymous';
  const role = (req.headers['x-user-role'] as string) || (req.query.userRole as string) || 'client';
  const name = (req.headers['x-user-name'] as string) || (req.query.userName as string) || 'Utilisateur';

  return {
    userId,
    role,
    name
  };
}

// ==========================================
// 1. TRANSPORTEURS (CARRIERS)
// ==========================================

logisticsRouter.get('/carriers', async (req: Request, res: Response) => {
  try {
    const actor = getRequestActor(req);
    const carriers = await storage.getCarriers();
    const isOp = logisticsService.isAuthorizedOperator(actor.role);

    if (isOp) {
      return res.json({ success: true, carriers });
    }

    // Vue publique / client : filtrer transporteurs inactifs et masquer marges/tarifs d'achat confidentiels
    const publicCarriers = carriers
      .filter(c => c.active)
      .map(c => ({
        id: c.id,
        name: c.name,
        code: c.code,
        mode: c.mode,
        baseTransitDaysMin: c.baseTransitDaysMin,
        baseTransitDaysMax: c.baseTransitDaysMax,
        notes: c.notes
      }));

    return res.json({ success: true, carriers: publicCarriers });
  } catch (err: any) {
    console.error('[logisticsRouter] Error GET /carriers:', err);
    return res.status(500).json({ success: false, errorMessage: 'Erreur lors de la récupération des transporteurs.' });
  }
});

// ==========================================
// 2. HUBS LOGISTIQUES
// ==========================================

logisticsRouter.get('/hubs', async (req: Request, res: Response) => {
  try {
    const hubs = await storage.getHubs();
    return res.json({
      success: true,
      hubs: hubs.filter(h => h.active)
    });
  } catch (err: any) {
    console.error('[logisticsRouter] Error GET /hubs:', err);
    return res.status(500).json({ success: false, errorMessage: 'Erreur lors de la récupération des hubs.' });
  }
});

// ==========================================
// 3. EXPÉDITIONS (SHIPMENTS) - LISTE
// ==========================================

logisticsRouter.get('/shipments', async (req: Request, res: Response) => {
  try {
    const actor = getRequestActor(req);
    const isOp = logisticsService.isAuthorizedOperator(actor.role);

    if (!isOp) {
      // Si c'est un client, il ne peut voir QUE ses propres expéditions !
      if (!actor.userId || actor.userId === 'anonymous') {
        return res.status(401).json({ success: false, errorMessage: 'Veuillez vous connecter pour voir vos expéditions.' });
      }
      const userShipments = await storage.getShipmentsByUserId(actor.userId);
      // Masquage strict des coûts internes
      const sanitized = userShipments.map(s => {
        const { internalCostEstimatedXOF, internalCostConfirmedXOF, internalCostActualXOF, ...publicData } = s;
        return publicData;
      });
      return res.json({ success: true, shipments: sanitized });
    }

    // Mode Opérateur / Administrateur : accès global avec filtres
    let all = await storage.getAllShipments();

    const { status, carrierId, hubId, orderId, search } = req.query;

    if (status) {
      all = all.filter(s => s.status === status);
    }
    if (carrierId) {
      all = all.filter(s => s.carrierId === carrierId);
    }
    if (hubId) {
      all = all.filter(s => s.hubId === hubId);
    }
    if (orderId) {
      all = all.filter(s => s.orderId === orderId);
    }
    if (search && typeof search === 'string') {
      const q = search.trim().toLowerCase();
      all = all.filter(s =>
        s.trackingCode.toLowerCase().includes(q) ||
        s.orderCode.toLowerCase().includes(q) ||
        (s.carrierName && s.carrierName.toLowerCase().includes(q)) ||
        (s.hubName && s.hubName.toLowerCase().includes(q))
      );
    }

    return res.json({ success: true, shipments: all });
  } catch (err: any) {
    console.error('[logisticsRouter] Error GET /shipments:', err);
    return res.status(500).json({ success: false, errorMessage: 'Erreur lors de la récupération des expéditions.' });
  }
});

// ==========================================
// 4. SUIVI PUBLIC / CLIENT (TRACKING LOOKUP)
// ==========================================

const handleTrackingLookup = async (req: Request, res: Response) => {
  try {
    const actor = getRequestActor(req);
    const trackingCode = req.params.trackingCode;

    const trackingData = await logisticsService.getSanitizedTracking(trackingCode, {
      id: actor.userId,
      role: actor.role
    });

    if (!trackingData) {
      return res.status(404).json({
        success: false,
        errorMessage: `Aucune expédition trouvée pour la référence ${trackingCode}.`
      });
    }

    return res.json({
      success: true,
      shipment: trackingData,
      tracking: trackingData
    });
  } catch (err: any) {
    console.error('[logisticsRouter] Error GET tracking:', err);
    return res.status(500).json({ success: false, errorMessage: 'Erreur lors du suivi de colis.' });
  }
};

logisticsRouter.get('/shipments/tracking/:trackingCode', handleTrackingLookup);
logisticsRouter.get('/tracking/:trackingCode', handleTrackingLookup);

// ==========================================
// 5. DÉTAIL D'UNE EXPÉDITION (SHIPMENT BY ID)
// ==========================================

logisticsRouter.get('/shipments/:id', async (req: Request, res: Response) => {
  try {
    const actor = getRequestActor(req);
    const isOp = logisticsService.isAuthorizedOperator(actor.role);
    const shipment = await storage.getShipmentById(req.params.id);

    if (!shipment) {
      return res.status(404).json({ success: false, errorMessage: 'Expédition introuvable.' });
    }

    // Vérification RLS client
    if (!isOp) {
      if (shipment.userId && shipment.userId !== actor.userId) {
        return res.status(403).json({ success: false, errorMessage: 'Accès interdit à cette expédition.' });
      }
      const sanitized = await logisticsService.getSanitizedTracking(shipment.id, actor);
      return res.json({ success: true, shipment: sanitized });
    }

    // Administrateur : vue complète avec événements, documents et coûts
    const events = await storage.getShipmentEvents(shipment.id);
    const documents = await storage.getShipmentDocuments(shipment.id);
    const carrier = shipment.carrierId ? await storage.getCarrierById(shipment.carrierId) : null;
    const hub = shipment.hubId ? await storage.getHubById(shipment.hubId) : null;

    return res.json({
      success: true,
      shipment: {
        ...shipment,
        carrier,
        hub,
        events,
        documents
      }
    });
  } catch (err: any) {
    console.error('[logisticsRouter] Error GET shipment by id:', err);
    return res.status(500).json({ success: false, errorMessage: 'Erreur serveur.' });
  }
});

// ==========================================
// 6. CRÉATION D'UNE EXPÉDITION (POST /shipments)
// ==========================================

logisticsRouter.post('/shipments', async (req: Request, res: Response) => {
  try {
    const actor = getRequestActor(req);
    const {
      orderId,
      transportMode = 'air',
      carrierId,
      hubId,
      origin,
      destination,
      notes,
      estimatedDeparture,
      estimatedArrival,
      internalCostEstimatedXOF
    } = req.body;

    if (!orderId) {
      return res.status(400).json({ success: false, errorMessage: 'Le paramètre orderId est obligatoire.' });
    }

    const result = await logisticsService.createShipment({
      orderId,
      transportMode: transportMode as TransportMode,
      carrierId,
      hubId,
      origin,
      destination,
      notes,
      estimatedDeparture,
      estimatedArrival,
      internalCostEstimatedXOF: Number(internalCostEstimatedXOF) || 0,
      actor: {
        userId: actor.userId,
        role: actor.role,
        name: actor.name
      }
    });

    if (!result.success) {
      const status = result.errorMessage?.includes('Accès refusé') ? 403 : 400;
      return res.status(status).json({ success: false, errorMessage: result.errorMessage });
    }

    return res.status(201).json({
      success: true,
      shipment: result.shipment
    });
  } catch (err: any) {
    console.error('[logisticsRouter] Error POST /shipments:', err);
    return res.status(500).json({ success: false, errorMessage: 'Erreur lors de la création de l\'expédition.' });
  }
});

// ==========================================
// 7. TRANSITION ATOMIQUE DE STATUT (PATCH /shipments/:id/status)
// ==========================================

logisticsRouter.patch('/shipments/:id/status', async (req: Request, res: Response) => {
  try {
    const actor = getRequestActor(req);
    const { id } = req.params;
    const {
      newStatus,
      expectedCurrentStatus,
      location,
      description,
      metadata,
      eta,
      actualDeparture,
      actualArrival
    } = req.body;

    if (!newStatus) {
      return res.status(400).json({ success: false, errorMessage: 'Le nouveau statut newStatus est obligatoire.' });
    }

    const result = await logisticsService.transitionShipmentStatus({
      shipmentId: id,
      expectedCurrentStatus: expectedCurrentStatus as ShipmentStatus,
      newStatus: newStatus as ShipmentStatus,
      location: location || 'Plateforme Dallou Chine Dakar',
      description: description || `Mise à jour logistique vers : ${newStatus}`,
      metadata,
      eta,
      actualDeparture,
      actualArrival,
      actor: {
        userId: actor.userId,
        role: actor.role,
        name: actor.name
      }
    });

    if (!result.success) {
      let status = 400;
      if (result.errorMessage?.includes('Accès refusé')) status = 403;
      if (result.errorMessage?.includes('Conflit de concurrence')) status = 409;
      return res.status(status).json({ success: false, errorMessage: result.errorMessage });
    }

    return res.json({
      success: true,
      shipment: result.shipment,
      event: result.event
    });
  } catch (err: any) {
    console.error('[logisticsRouter] Error PATCH status:', err);
    return res.status(500).json({ success: false, errorMessage: 'Erreur lors de la mise à jour du statut.' });
  }
});

// ==========================================
// 8. ÉVÉNEMENT CHECKPOINT INTERMÉDIAIRE (POST /shipments/:id/events)
// ==========================================

logisticsRouter.post('/shipments/:id/events', async (req: Request, res: Response) => {
  try {
    const actor = getRequestActor(req);
    const { id } = req.params;
    const { eventType, location, description, metadata } = req.body;

    if (!eventType || !location || !description) {
      return res.status(400).json({
        success: false,
        errorMessage: 'Les champs eventType, location et description sont obligatoires.'
      });
    }

    const result = await logisticsService.addCheckpointEvent({
      shipmentId: id,
      eventType,
      location,
      description,
      metadata,
      actor: {
        userId: actor.userId,
        role: actor.role,
        name: actor.name
      }
    });

    if (!result.success) {
      const status = result.errorMessage?.includes('Accès refusé') ? 403 : 400;
      return res.status(status).json({ success: false, errorMessage: result.errorMessage });
    }

    return res.status(201).json({ success: true, event: result.event });
  } catch (err: any) {
    console.error('[logisticsRouter] Error POST event:', err);
    return res.status(500).json({ success: false, errorMessage: 'Erreur lors de l\'ajout de l\'événement.' });
  }
});

// ==========================================
// 9. ASSIGNATION TRANSPORTEUR (PATCH /shipments/:id/carrier)
// ==========================================

logisticsRouter.patch('/shipments/:id/carrier', async (req: Request, res: Response) => {
  try {
    const actor = getRequestActor(req);
    const { carrierId } = req.body;

    if (!carrierId) {
      return res.status(400).json({ success: false, errorMessage: 'carrierId est requis.' });
    }

    const result = await logisticsService.assignCarrier({
      shipmentId: req.params.id,
      carrierId,
      actor: { userId: actor.userId, role: actor.role, name: actor.name }
    });

    if (!result.success) {
      return res.status(400).json({ success: false, errorMessage: result.errorMessage });
    }

    return res.json({ success: true, message: 'Transporteur assigné avec succès.' });
  } catch (err: any) {
    return res.status(500).json({ success: false, errorMessage: 'Erreur serveur.' });
  }
});

// ==========================================
// 10. ASSIGNATION HUB (PATCH /shipments/:id/hub)
// ==========================================

logisticsRouter.patch('/shipments/:id/hub', async (req: Request, res: Response) => {
  try {
    const actor = getRequestActor(req);
    const { hubId } = req.body;

    if (!hubId) {
      return res.status(400).json({ success: false, errorMessage: 'hubId est requis.' });
    }

    const result = await logisticsService.assignHub({
      shipmentId: req.params.id,
      hubId,
      actor: { userId: actor.userId, role: actor.role, name: actor.name }
    });

    if (!result.success) {
      return res.status(400).json({ success: false, errorMessage: result.errorMessage });
    }

    return res.json({ success: true, message: 'Hub assigné avec succès.' });
  } catch (err: any) {
    return res.status(500).json({ success: false, errorMessage: 'Erreur serveur.' });
  }
});

// ==========================================
// 11. NOTIFICATIONS IN-APP
// ==========================================

logisticsRouter.get('/notifications', async (req: Request, res: Response) => {
  try {
    const actor = getRequestActor(req);
    if (!actor.userId || actor.userId === 'anonymous') {
      return res.json({ success: true, notifications: [] });
    }
    const notifs = await storage.getUserNotifications(actor.userId);
    return res.json({ success: true, notifications: notifs });
  } catch (err: any) {
    return res.status(500).json({ success: false, errorMessage: 'Erreur notifications.' });
  }
});

logisticsRouter.patch('/notifications/:id/read', async (req: Request, res: Response) => {
  try {
    await storage.markNotificationAsRead(req.params.id);
    return res.json({ success: true });
  } catch (err: any) {
    return res.status(500).json({ success: false, errorMessage: 'Erreur mise à jour notification.' });
  }
});
