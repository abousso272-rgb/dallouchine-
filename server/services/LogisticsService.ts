import { storage } from '../db/storage';
import {
  ShipmentRecord,
  ShipmentEventRecord,
  ShipmentStatus,
  ALLOWED_SHIPMENT_TRANSITIONS,
  CarrierRecord,
  HubRecord,
  PublicShipmentDTO,
  ShipmentDocumentRecord
} from '../types/logistics';
import { TransportMode, AdminRole } from '../../src/types';

export const MAJOR_NOTIFICATION_STATUSES: ShipmentStatus[] = [
  'shipped_from_china',
  'arrived_senegal',
  'customs',
  'at_hub',
  'out_for_delivery',
  'delivered'
];

export const STATUS_LABELS_FR: Record<ShipmentStatus, string> = {
  awaiting_supplier: 'Attente Fournisseur Chine',
  supplier_confirmed: 'Confirmé par Fournisseur',
  preparing_in_china: 'Préparation & Emballage en Chine',
  ready_to_ship: 'Prêt à Expédier (Hub Export Chine)',
  shipped_from_china: 'Expédié de Chine (Fret Parti)',
  in_transit: 'En Transit International',
  arrived_senegal: 'Arrivé au Sénégal',
  customs: 'Dédouanement GAINDE en cours',
  at_hub: 'Réceptionné au Hub Sénégal',
  out_for_delivery: 'En cours de Livraison',
  delivered: 'Livré avec Succès',
  cancelled: 'Expédition Annulée'
};

export class LogisticsService {
  /**
   * Vérifie si un rôle possède les droits de gestion logistique
   */
  isAuthorizedOperator(role?: string): boolean {
    if (!role) return false;
    const allowed = ['SUPER_ADMIN', 'OPERATIONS', 'LOGISTICS', 'admin'];
    return allowed.includes(role);
  }

  /**
   * Générateur de code de suivi unique et standardisé
   */
  private generateUniqueTrackingCode(transportMode: TransportMode): string {
    const prefix = 'DLC';
    const mode = transportMode === 'air' ? 'AIR' : transportMode === 'sea' ? 'SEA' : 'EXP';
    const year = new Date().getFullYear();
    const random = Math.floor(10000 + Math.random() * 90000);
    return `${prefix}-${mode}-${year}-${random}`;
  }

  /**
   * 1. CRÉATION D'UNE EXPÉDITION (SHIPMENT)
   * Opération serveur contrôlée
   */
  async createShipment(params: {
    orderId: string;
    transportMode: TransportMode;
    carrierId?: string;
    hubId?: string;
    origin?: string;
    destination?: string;
    notes?: string;
    estimatedDeparture?: string;
    estimatedArrival?: string;
    internalCostEstimatedXOF?: number;
    actor: {
      userId: string;
      role: string;
      name?: string;
    };
  }): Promise<{
    success: boolean;
    shipment?: ShipmentRecord;
    errorMessage?: string;
  }> {
    // 1. Contrôle d'autorisation opérationnelle
    if (!this.isAuthorizedOperator(params.actor.role)) {
      return {
        success: false,
        errorMessage: 'Accès refusé. Seuls les opérateurs logistiques ou administrateurs peuvent créer une expédition.'
      };
    }

    // 2. Vérification de la commande associée
    const order = await storage.getOrder(params.orderId);
    if (!order) {
      return {
        success: false,
        errorMessage: `Commande #${params.orderId} introuvable.`
      };
    }

    // 3. Validation de l'éligibilité opérationnelle (Commande payée ou validation spéciale)
    if (order.paymentStatus !== 'paid') {
      return {
        success: false,
        errorMessage: 'Impossible de créer un shipment : la commande n\'a pas encore été payée.'
      };
    }

    // 4. Validation du transporteur si fourni
    let carrier: CarrierRecord | null = null;
    if (params.carrierId) {
      carrier = await storage.getCarrierById(params.carrierId);
      if (!carrier || !carrier.active) {
        return {
          success: false,
          errorMessage: 'Le transporteur spécifié est introuvable ou inactif.'
        };
      }
    }

    // 5. Validation du Hub si fourni
    let hub: HubRecord | null = null;
    if (params.hubId) {
      hub = await storage.getHubById(params.hubId);
      if (!hub || !hub.active) {
        return {
          success: false,
          errorMessage: 'Le hub de destination spécifié est introuvable ou inactif.'
        };
      }
    }

    // 6. Génération d'un code de suivi unique côté serveur
    let trackingCode = this.generateUniqueTrackingCode(params.transportMode);
    let attempts = 0;
    while ((await storage.getShipmentByTrackingCode(trackingCode)) && attempts < 5) {
      trackingCode = this.generateUniqueTrackingCode(params.transportMode);
      attempts++;
    }

    const now = new Date().toISOString();
    const shipmentId = `shp-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;

    const newShipment: ShipmentRecord = {
      id: shipmentId,
      orderId: order.id,
      orderCode: order.trackingCode,
      userId: order.userId,
      trackingCode,
      carrierId: carrier?.id || params.carrierId || '',
      carrierName: carrier?.name,
      carrierCode: carrier?.code,
      origin: params.origin || 'Guangzhou Hub Export, Chine',
      destination: params.destination || (hub ? `${hub.name}, ${hub.city}` : 'Dakar, Sénégal'),
      transportMode: params.transportMode,
      status: 'awaiting_supplier',
      estimatedDeparture: params.estimatedDeparture,
      estimatedArrival: params.estimatedArrival,
      hubId: hub?.id || params.hubId,
      hubName: hub?.name,
      notes: params.notes,
      internalCostEstimatedXOF: params.internalCostEstimatedXOF || 0,
      createdAt: now,
      updatedAt: now
    };

    // 7. Enregistrement atomique du shipment
    await storage.saveShipment(newShipment);

    // 8. Enregistrement du premier événement immuable
    const initialEvent: ShipmentEventRecord = {
      id: `evt-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      shipmentId,
      eventType: 'shipment_created',
      previousStatus: 'none',
      newStatus: 'awaiting_supplier',
      location: 'Bureau Central Dallou Chine Dakar',
      description: `Bordereau d'expédition créé pour la commande ${order.trackingCode}. En attente de préparation fournisseur.`,
      metadata: {
        orderId: order.id,
        transportMode: params.transportMode,
        trackingCode
      },
      actorUserId: params.actor.userId,
      actorRole: params.actor.role,
      actorName: params.actor.name || 'Opérateur Logistique',
      createdAt: now
    };

    await storage.appendShipmentEvent(initialEvent);

    // 9. Notification in-app client
    if (order.userId) {
      await storage.createInAppNotification({
        id: `notif-${Date.now()}`,
        userId: order.userId,
        title: 'Expédition créée',
        message: `Votre commande #${order.trackingCode} fait l'objet de l'expédition de fret ${trackingCode}.`,
        type: 'logistics',
        shipmentId,
        trackingCode,
        isRead: false,
        createdAt: now
      });
    }

    return {
      success: true,
      shipment: newShipment
    };
  }

  /**
   * 2. CHANGEMENT ATOMIQUE DE STATUT AVEC VALIDATION STATE MACHINE ET CONCURRENCE
   */
  async transitionShipmentStatus(params: {
    shipmentId: string;
    expectedCurrentStatus?: ShipmentStatus;
    newStatus: ShipmentStatus;
    location: string;
    description: string;
    metadata?: Record<string, any>;
    eta?: string;
    actualDeparture?: string;
    actualArrival?: string;
    actor: {
      userId: string;
      role: string;
      name?: string;
    };
  }): Promise<{
    success: boolean;
    shipment?: ShipmentRecord;
    event?: ShipmentEventRecord;
    errorMessage?: string;
  }> {
    // 1. Contrôle d'autorisation
    if (!this.isAuthorizedOperator(params.actor.role)) {
      return {
        success: false,
        errorMessage: 'Accès refusé. Opération réservée aux gestionnaires logistiques.'
      };
    }

    // 2. Récupération du shipment
    const shipment = await storage.getShipmentById(params.shipmentId);
    if (!shipment) {
      return {
        success: false,
        errorMessage: 'Expédition introuvable.'
      };
    }

    // 3. Protection contre les accès concurrents
    if (params.expectedCurrentStatus && shipment.status !== params.expectedCurrentStatus) {
      return {
        success: false,
        errorMessage: `Conflit de concurrence : le statut actuel est '${shipment.status}' et ne correspond pas au statut attendu '${params.expectedCurrentStatus}'.`
      };
    }

    const currentStatus = shipment.status;
    const allowedNext = ALLOWED_SHIPMENT_TRANSITIONS[currentStatus] || [];

    // 4. Validation stricte de la machine d'état
    if (!allowedNext.includes(params.newStatus)) {
      return {
        success: false,
        errorMessage: `Transition invalide : passage impossible de '${currentStatus}' à '${params.newStatus}'. Transitions permises : [${allowedNext.join(', ')}].`
      };
    }

    const now = new Date().toISOString();

    // 5. Mise à jour de l'expédition
    shipment.status = params.newStatus;
    shipment.updatedAt = now;

    if (params.eta) {
      shipment.estimatedArrival = params.eta;
    }
    if (params.newStatus === 'shipped_from_china') {
      shipment.actualDeparture = params.actualDeparture || now;
    }
    if (params.newStatus === 'arrived_senegal' || params.newStatus === 'delivered') {
      shipment.actualArrival = params.actualArrival || now;
    }

    await storage.saveShipment(shipment);

    // 6. Écriture immuable de l'événement
    const newEvent: ShipmentEventRecord = {
      id: `evt-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      shipmentId: shipment.id,
      eventType: params.newStatus,
      previousStatus: currentStatus,
      newStatus: params.newStatus,
      location: params.location || 'Hub SinoSenegal',
      description: params.description || `Statut passé à : ${STATUS_LABELS_FR[params.newStatus] || params.newStatus}`,
      metadata: params.metadata || {},
      actorUserId: params.actor.userId,
      actorRole: params.actor.role,
      actorName: params.actor.name || 'Gestionnaire Logistique',
      createdAt: now
    };

    await storage.appendShipmentEvent(newEvent);

    // 7. Notification in-app si jalon majeur
    if (shipment.userId && MAJOR_NOTIFICATION_STATUSES.includes(params.newStatus)) {
      const statusFr = STATUS_LABELS_FR[params.newStatus] || params.newStatus;
      await storage.createInAppNotification({
        id: `notif-${Date.now()}`,
        userId: shipment.userId,
        title: `Suivi Colis : ${statusFr}`,
        message: `Votre expédition ${shipment.trackingCode} : ${params.description || statusFr}. Localisation : ${params.location}.`,
        type: 'logistics',
        shipmentId: shipment.id,
        trackingCode: shipment.trackingCode,
        isRead: false,
        createdAt: now
      });
    }

    return {
      success: true,
      shipment,
      event: newEvent
    };
  }

  /**
   * 3. AJOUT D'UN ÉVÉNEMENT INTERMÉDIAIRE (SANS CHANGEMENT DE STATUT)
   * Ex: Inspection SGS débutée, inspection réussie, empotage LCL, pesée volumétrique
   */
  async addCheckpointEvent(params: {
    shipmentId: string;
    eventType: string;
    location: string;
    description: string;
    metadata?: Record<string, any>;
    actor: {
      userId: string;
      role: string;
      name?: string;
    };
  }): Promise<{
    success: boolean;
    event?: ShipmentEventRecord;
    errorMessage?: string;
  }> {
    if (!this.isAuthorizedOperator(params.actor.role)) {
      return {
        success: false,
        errorMessage: 'Accès refusé.'
      };
    }

    const shipment = await storage.getShipmentById(params.shipmentId);
    if (!shipment) {
      return {
        success: false,
        errorMessage: 'Expédition introuvable.'
      };
    }

    const now = new Date().toISOString();
    const event: ShipmentEventRecord = {
      id: `evt-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      shipmentId: shipment.id,
      eventType: params.eventType,
      previousStatus: shipment.status,
      newStatus: shipment.status,
      location: params.location,
      description: params.description,
      metadata: params.metadata || {},
      actorUserId: params.actor.userId,
      actorRole: params.actor.role,
      actorName: params.actor.name || 'Agent Terrain',
      createdAt: now
    };

    await storage.appendShipmentEvent(event);
    return { success: true, event };
  }

  /**
   * 4. RÉCUPÉRATION DU SUIVI POUR LE CLIENT OU PUBLIC
   * Masque strictement tous les coûts fournisseurs et marges internes
   */
  async getSanitizedTracking(
    trackingCodeOrId: string,
    requestingUser?: { id?: string; role?: string }
  ): Promise<PublicShipmentDTO | null> {
    const shipment = (await storage.getShipmentByTrackingCode(trackingCodeOrId)) ||
      (await storage.getShipmentById(trackingCodeOrId));

    if (!shipment) return null;

    // Si utilisateur connecté en tant que client identifié, vérifier qu'il est propriétaire
    if (requestingUser && requestingUser.role === 'client' && requestingUser.id && requestingUser.id !== 'anonymous') {
      if (shipment.userId && shipment.userId !== requestingUser.id) {
        return null; // Isolation client
      }
    }

    const carrier = shipment.carrierId ? await storage.getCarrierById(shipment.carrierId) : null;
    const hub = shipment.hubId ? await storage.getHubById(shipment.hubId) : null;
    const events = await storage.getShipmentEvents(shipment.id);
    const documents = await storage.getShipmentDocuments(shipment.id);

    // Filtrer les documents strictement publics
    const publicDocs = documents
      .filter(d => !d.isInternal)
      .map(d => ({
        id: d.id,
        title: d.title,
        docType: d.docType,
        fileUrl: d.fileUrl
      }));

    return {
      id: shipment.id,
      orderId: shipment.orderId,
      orderCode: shipment.orderCode,
      trackingCode: shipment.trackingCode,
      carrier: carrier ? {
        id: carrier.id,
        name: carrier.name,
        code: carrier.code,
        mode: carrier.mode
      } : null,
      origin: shipment.origin,
      destination: shipment.destination,
      transportMode: shipment.transportMode,
      status: shipment.status,
      statusLabel: STATUS_LABELS_FR[shipment.status] || shipment.status,
      estimatedDeparture: shipment.estimatedDeparture,
      actualDeparture: shipment.actualDeparture,
      estimatedArrival: shipment.estimatedArrival,
      actualArrival: shipment.actualArrival,
      isEtaEstimated: Boolean(shipment.estimatedArrival && !shipment.actualArrival),
      hub: hub ? {
        id: hub.id,
        name: hub.name,
        city: hub.city,
        address: hub.address
      } : null,
      notes: shipment.notes,
      events: events.map(e => ({
        id: e.id,
        eventType: e.eventType,
        previousStatus: e.previousStatus,
        newStatus: e.newStatus,
        location: e.location,
        description: e.description,
        createdAt: e.createdAt
      })),
      documents: publicDocs,
      createdAt: shipment.createdAt,
      updatedAt: shipment.updatedAt
    };
  }

  /**
   * 5. ASSIGNATION DE TRANSPORTEUR
   */
  async assignCarrier(params: {
    shipmentId: string;
    carrierId: string;
    actor: { userId: string; role: string; name?: string };
  }): Promise<{ success: boolean; errorMessage?: string }> {
    if (!this.isAuthorizedOperator(params.actor.role)) {
      return { success: false, errorMessage: 'Accès non autorisé.' };
    }

    const shipment = await storage.getShipmentById(params.shipmentId);
    if (!shipment) return { success: false, errorMessage: 'Expédition introuvable.' };

    const carrier = await storage.getCarrierById(params.carrierId);
    if (!carrier || !carrier.active) {
      return { success: false, errorMessage: 'Transporteur introuvable ou inactif.' };
    }

    shipment.carrierId = carrier.id;
    shipment.carrierName = carrier.name;
    shipment.carrierCode = carrier.code;
    shipment.updatedAt = new Date().toISOString();

    await storage.saveShipment(shipment);

    await storage.appendShipmentEvent({
      id: `evt-${Date.now()}`,
      shipmentId: shipment.id,
      eventType: 'carrier_assigned',
      previousStatus: shipment.status,
      newStatus: shipment.status,
      location: 'Hub SinoSenegal',
      description: `Transporteur assigné : ${carrier.name} (${carrier.code})`,
      actorUserId: params.actor.userId,
      actorRole: params.actor.role,
      actorName: params.actor.name,
      createdAt: new Date().toISOString()
    });

    return { success: true };
  }

  /**
   * 6. ASSIGNATION DE HUB
   */
  async assignHub(params: {
    shipmentId: string;
    hubId: string;
    actor: { userId: string; role: string; name?: string };
  }): Promise<{ success: boolean; errorMessage?: string }> {
    if (!this.isAuthorizedOperator(params.actor.role)) {
      return { success: false, errorMessage: 'Accès non autorisé.' };
    }

    const shipment = await storage.getShipmentById(params.shipmentId);
    if (!shipment) return { success: false, errorMessage: 'Expédition introuvable.' };

    const hub = await storage.getHubById(params.hubId);
    if (!hub || !hub.active) {
      return { success: false, errorMessage: 'Hub introuvable ou inactif.' };
    }

    shipment.hubId = hub.id;
    shipment.hubName = hub.name;
    shipment.destination = `${hub.name}, ${hub.city}`;
    shipment.updatedAt = new Date().toISOString();

    await storage.saveShipment(shipment);

    await storage.appendShipmentEvent({
      id: `evt-${Date.now()}`,
      shipmentId: shipment.id,
      eventType: 'hub_assigned',
      previousStatus: shipment.status,
      newStatus: shipment.status,
      location: hub.city,
      description: `Hub de destination mis à jour : ${hub.name} (${hub.address})`,
      actorUserId: params.actor.userId,
      actorRole: params.actor.role,
      actorName: params.actor.name,
      createdAt: new Date().toISOString()
    });

    return { success: true };
  }

  /**
   * 7. AJOUT D'UN DOCUMENT SUR UNE EXPÉDITION
   */
  async addDocument(params: {
    shipmentId: string;
    title: string;
    docType: 'packing_list' | 'commercial_invoice' | 'bill_of_lading' | 'airway_bill' | 'customs_declaration' | 'inspection_certificate';
    fileUrl: string;
    isInternal: boolean;
    actor: { userId: string; role: string };
  }): Promise<{ success: boolean; document?: ShipmentDocumentRecord; errorMessage?: string }> {
    if (!this.isAuthorizedOperator(params.actor.role)) {
      return { success: false, errorMessage: 'Accès refusé.' };
    }

    const shipment = await storage.getShipmentById(params.shipmentId);
    if (!shipment) return { success: false, errorMessage: 'Expédition introuvable.' };

    const newDoc: ShipmentDocumentRecord = {
      id: `doc-${Date.now()}`,
      shipmentId: shipment.id,
      title: params.title,
      docType: params.docType,
      fileUrl: params.fileUrl,
      isInternal: params.isInternal,
      uploadedBy: params.actor.userId,
      createdAt: new Date().toISOString()
    };

    await storage.appendShipmentDocument(newDoc);
    return { success: true, document: newDoc };
  }
}

export const logisticsService = new LogisticsService();
