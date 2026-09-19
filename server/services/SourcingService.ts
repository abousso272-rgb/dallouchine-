// ==============================================================================
// SERVICE MÉTIER : SOURCING RÉEL, FOURNISSEURS, DEMANDES CLIENT ET DEVIS (ÉTAPE 9)
// ==============================================================================

import { storage } from '../db/storage';
import {
  SourcingStatus,
  SourcingQuoteStatus,
  SourcingRequestRecord,
  SupplierRecord,
  SourcingRequestSupplierRecord,
  SourcingQuoteRecord,
  SourcingAttachmentRecord,
  SourcingEventRecord,
  SourcingActor,
  PublicSourcingRequestDTO,
  PublicQuoteDTO,
  PublicSupplierCandidateDTO
} from '../types/sourcing';

// URL regex sécurisée
const URL_REGEX = /^(https?:\/\/)([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?(\?.*)?$/i;

// Validation des pièces jointes
const MAX_ATTACHMENT_SIZE_BYTES = 10 * 1024 * 1024; // 10 Mo
const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain'
]);

// Matrice stricte des transitions de statuts
const ALLOWED_TRANSITIONS: Record<SourcingStatus, SourcingStatus[]> = {
  new: ['researching', 'cancelled'],
  researching: ['supplier_found', 'cancelled'],
  supplier_found: ['negotiating', 'researching', 'cancelled'],
  negotiating: ['quote_ready', 'supplier_found', 'cancelled'],
  quote_ready: ['quote_sent', 'negotiating', 'cancelled'],
  quote_sent: ['accepted', 'rejected', 'quote_ready', 'cancelled'],
  accepted: ['ordered', 'cancelled'],
  rejected: ['quote_ready', 'researching', 'cancelled'],
  ordered: ['completed', 'cancelled'],
  completed: [],
  cancelled: []
};

export class SourcingService {
  // Mutex simple en mémoire pour éviter les race conditions d'acceptation de devis
  private quoteLocks: Set<string> = new Set();

  private generateCode(prefix: string): string {
    const year = new Date().getFullYear();
    const random = Math.floor(1000 + Math.random() * 9000);
    return `${prefix}-${year}-${random}`;
  }

  // --- 1. CRÉATION D'UNE DEMANDE DE SOURCING ---

  async createRequest(
    data: {
      customerId?: string;
      customerName: string;
      customerCompany?: string;
      customerPhone: string;
      customerEmail?: string;
      productName: string;
      productDescription?: string;
      productLink?: string;
      productImages?: string[];
      quantity?: number;
      targetBudget?: number;
      currency?: string;
      specifications?: string;
      customization?: string;
      desiredDeadline?: string;
      destination?: string;
      notes?: string;
    },
    actor: SourcingActor
  ): Promise<SourcingRequestRecord> {
    // Validation produit
    const productName = (data.productName || '').trim();
    if (!productName || productName.length < 2) {
      throw new Error('Le nom du produit est obligatoire (au moins 2 caractères).');
    }

    const description = (data.productDescription || '').trim();
    const link = (data.productLink || '').trim();
    const images = Array.isArray(data.productImages) ? data.productImages : [];

    // Flexibilité : au moins une description, un lien ou une image doit être fourni
    if (!description && !link && images.length === 0) {
      throw new Error('Veuillez fournir au moins une description détaillée, un lien produit (1688, Alibaba) ou une photo.');
    }

    // Validation du format d URL si renseigné
    if (link) {
      if (!URL_REGEX.test(link) && !link.startsWith('http://') && !link.startsWith('https://')) {
        throw new Error('Le lien produit doit être une URL valide (ex: https://detail.1688.com/offer/...).');
      }
    }

    const quantity = Math.max(1, Math.floor(Number(data.quantity) || 1));
    const targetBudget = Math.max(0, Math.round(Number(data.targetBudget) || 0));
    const currency = data.currency || 'XOF';

    const reqId = `src-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const code = this.generateCode('SRC');
    const now = new Date().toISOString();

    const record: SourcingRequestRecord = {
      id: reqId,
      code,
      customerId: data.customerId || actor.userId,
      customerName: (data.customerName || '').trim() || 'Client',
      customerCompany: (data.customerCompany || '').trim() || undefined,
      customerPhone: (data.customerPhone || '').trim() || '+221 77 000 00 00',
      customerEmail: (data.customerEmail || '').trim() || undefined,
      productName,
      productDescription: description || undefined,
      productLink: link || undefined,
      productImages: images,
      quantity,
      targetBudget,
      currency,
      specifications: (data.specifications || '').trim() || undefined,
      customization: (data.customization || '').trim() || undefined,
      desiredDeadline: data.desiredDeadline,
      destination: (data.destination || '').trim() || 'Dakar, Sénégal',
      notes: (data.notes || '').trim() || undefined,
      status: 'new',
      aiMetadata: {
        analysis: undefined,
        suggestedSuppliers: undefined,
        extractedAttributes: undefined,
        searchKeywords: [productName.toLowerCase()]
      },
      createdAt: now,
      updatedAt: now
    };

    await storage.saveSourcingRequest(record);

    // Audit trail immuable
    await storage.appendSourcingEvent({
      id: `evt-src-${Date.now()}`,
      sourcingRequestId: record.id,
      eventType: 'request_submitted',
      newStatus: 'new',
      description: `Demande de sourcing ${record.code} enregistrée pour ${record.productName} (Qté: ${record.quantity}).`,
      actorUserId: actor.userId,
      actorRole: actor.role,
      actorName: actor.name || record.customerName,
      metadata: { code: record.code, quantity: record.quantity, destination: record.destination },
      createdAt: now
    });

    // In-app notification
    await storage.createInAppNotification({
      id: `notif-src-${Date.now()}`,
      userId: record.customerId || actor.userId,
      title: 'Demande de sourcing enregistrée',
      message: `Votre demande ${record.code} (${record.productName}) a été enregistrée. Notre équipe en Chine va procéder à l'analyse préliminaire.`,
      type: 'order',
      trackingCode: record.code,
      isRead: false,
      createdAt: now
    });

    return record;
  }

  // --- 2. TRANSITIONS DE STATUTS ---

  async transitionStatus(
    requestId: string,
    targetStatus: SourcingStatus,
    actor: SourcingActor,
    reason?: string
  ): Promise<SourcingRequestRecord> {
    const req = await storage.getSourcingRequestById(requestId);
    if (!req) {
      throw new Error(`Demande de sourcing introuvable (${requestId}).`);
    }

    if (req.status === targetStatus) {
      return req; // Déjà dans cet état
    }

    // Contrôle des rôles
    const isStaff = ['admin', 'SUPER_ADMIN', 'OPERATIONS', 'SOURCING', 'sourcer'].includes(actor.role);
    const isClient = actor.role === 'client' || actor.userId === req.customerId;

    if (isClient && !isStaff) {
      // Le client ne peut que rejeter ou annuler sa propre demande
      if (targetStatus !== 'cancelled' && targetStatus !== 'rejected') {
        throw new Error('Action non autorisée pour un compte client.');
      }
    }

    // Validation dans la machine d'états
    const allowed = ALLOWED_TRANSITIONS[req.status] || [];
    if (!allowed.includes(targetStatus)) {
      throw new Error(`Transition interdite de '${req.status}' vers '${targetStatus}'.`);
    }

    const previousStatus = req.status;
    req.status = targetStatus;
    req.updatedAt = new Date().toISOString();

    await storage.saveSourcingRequest(req);

    // Enregistrement de l'événement d'audit
    await storage.appendSourcingEvent({
      id: `evt-src-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      sourcingRequestId: req.id,
      eventType: `status_transition_${targetStatus}`,
      previousStatus,
      newStatus: targetStatus,
      description: reason || `Statut mis à jour de '${previousStatus}' vers '${targetStatus}'.`,
      actorUserId: actor.userId,
      actorRole: actor.role,
      actorName: actor.name,
      metadata: { reason },
      createdAt: req.updatedAt
    });

    return req;
  }

  // --- 3. ASSIGNATION D'UN SOURCEUR ---

  async assignSourcer(
    requestId: string,
    sourcerId: string,
    sourcerName: string,
    actor: SourcingActor
  ): Promise<SourcingRequestRecord> {
    const isStaff = ['admin', 'SUPER_ADMIN', 'OPERATIONS', 'SOURCING'].includes(actor.role);
    if (!isStaff) {
      throw new Error('Seul un administrateur ou responsable des opérations peut assigner un sourceur.');
    }

    const req = await storage.getSourcingRequestById(requestId);
    if (!req) {
      throw new Error(`Demande de sourcing introuvable (${requestId}).`);
    }

    const now = new Date().toISOString();
    req.assignedSourcerId = sourcerId;
    req.assignedSourcerName = sourcerName;
    req.assignedAt = now;
    req.assignedBy = actor.userId;

    // Si nouveau, avancer à researching
    const prevStatus = req.status;
    if (req.status === 'new') {
      req.status = 'researching';
    }
    req.updatedAt = now;

    await storage.saveSourcingRequest(req);

    // Audit event
    await storage.appendSourcingEvent({
      id: `evt-src-${Date.now()}`,
      sourcingRequestId: req.id,
      eventType: 'assigned_to_sourcer',
      previousStatus: prevStatus,
      newStatus: req.status,
      description: `Dossier assigné au sourceur ${sourcerName}. Recherche d'usines en cours en Chine.`,
      actorUserId: actor.userId,
      actorRole: actor.role,
      actorName: actor.name,
      metadata: { sourcerId, sourcerName },
      createdAt: now
    });

    // Notification client
    if (req.customerId) {
      await storage.createInAppNotification({
        id: `notif-src-${Date.now()}`,
        userId: req.customerId,
        title: 'Sourceur dédié assigné',
        message: `Votre demande ${req.code} a été assignée à notre sourceur ${sourcerName} en Chine. La prospection usine a démarré.`,
        type: 'order',
        trackingCode: req.code,
        isRead: false,
        createdAt: now
      });
    }

    return req;
  }

  // --- 4. GESTION DES FOURNISSEURS CANDIDATS ---

  async addSupplierToRequest(
    requestId: string,
    supplierData: {
      supplierId?: string;
      name?: string;
      platform?: '1688' | 'alibaba' | 'taobao' | 'direct_factory' | 'yiwu_market' | 'other';
      initialPriceCNY?: number;
      negotiatedPriceCNY?: number;
      unitPriceXOF?: number;
      moq?: number;
      leadTimeDays?: number;
      sampleAvailable?: boolean;
      sampleCostCNY?: number;
      customizationConfirmed?: boolean;
      internalNotes?: string;
      clientVisibleNotes?: string;
      isSelected?: boolean;
    },
    actor: SourcingActor
  ): Promise<SourcingRequestSupplierRecord> {
    const isStaff = ['admin', 'SUPER_ADMIN', 'OPERATIONS', 'SOURCING', 'sourcer'].includes(actor.role);
    if (!isStaff) {
      throw new Error('Action réservée à l équipe sourcing et administration.');
    }

    const req = await storage.getSourcingRequestById(requestId);
    if (!req) throw new Error(`Demande de sourcing introuvable (${requestId}).`);

    let supplierId = supplierData.supplierId;
    let supplierName = supplierData.name;
    let supplierPlatform = supplierData.platform || '1688';

    if (supplierId) {
      const existing = await storage.getSupplierById(supplierId);
      if (existing) {
        supplierName = existing.name;
        supplierPlatform = existing.platform;
      }
    } else if (supplierData.name) {
      // Création automatique d'un nouveau fournisseur dans l'annuaire
      const newSupplier: SupplierRecord = {
        id: `sup-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        name: supplierData.name,
        platform: supplierPlatform,
        country: 'Chine',
        city: 'Guangzhou',
        supplierCode: `SUP-${Math.floor(1000 + Math.random() * 9000)}`,
        moq: Number(supplierData.moq) || 1,
        leadTimeDays: Number(supplierData.leadTimeDays) || 15,
        customizationAvailable: !!supplierData.customizationConfirmed,
        rating: 4.8,
        verificationStatus: 'verified',
        currency: 'CNY',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      await storage.saveSupplier(newSupplier);
      supplierId = newSupplier.id;
      supplierName = newSupplier.name;
    } else {
      throw new Error('Identifiant ou nom du fournisseur requis.');
    }

    const now = new Date().toISOString();
    const linkRecord: SourcingRequestSupplierRecord = {
      id: `req-sup-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      requestId,
      supplierId,
      supplierName,
      supplierPlatform,
      initialPriceCNY: supplierData.initialPriceCNY ? Number(supplierData.initialPriceCNY) : undefined,
      negotiatedPriceCNY: supplierData.negotiatedPriceCNY ? Number(supplierData.negotiatedPriceCNY) : undefined,
      unitPriceXOF: supplierData.unitPriceXOF ? Number(supplierData.unitPriceXOF) : undefined,
      moq: Math.max(1, Number(supplierData.moq) || 1),
      leadTimeDays: Math.max(1, Number(supplierData.leadTimeDays) || 15),
      sampleAvailable: !!supplierData.sampleAvailable,
      sampleCostCNY: supplierData.sampleCostCNY ? Number(supplierData.sampleCostCNY) : undefined,
      customizationConfirmed: !!supplierData.customizationConfirmed,
      internalNotes: supplierData.internalNotes,
      clientVisibleNotes: supplierData.clientVisibleNotes,
      isSelected: !!supplierData.isSelected,
      createdAt: now,
      updatedAt: now
    };

    await storage.saveSourcingRequestSupplier(linkRecord);

    // Si le statut de la demande était 'researching', avancer à 'supplier_found'
    if (req.status === 'researching') {
      req.status = 'supplier_found';
      req.updatedAt = now;
      await storage.saveSourcingRequest(req);
    }

    // Audit event
    await storage.appendSourcingEvent({
      id: `evt-src-${Date.now()}`,
      sourcingRequestId: req.id,
      eventType: 'supplier_added',
      newStatus: req.status,
      description: `Usine partenaire ajoutée : ${supplierName} (${supplierPlatform}).`,
      actorUserId: actor.userId,
      actorRole: actor.role,
      actorName: actor.name,
      metadata: { supplierId, supplierName },
      createdAt: now
    });

    return linkRecord;
  }

  // --- 5. CRÉATION ET CALCUL DE DEVIS (SOURCING QUOTE) ---

  async createQuote(
    data: {
      sourcingRequestId: string;
      selectedSupplierId?: string;
      quantity?: number;
      unitProductPriceXOF: number;
      sourcingFeeXOF?: number;
      inspectionFeeXOF?: number;
      estimatedLogisticsXOF?: number;
      estimatedCustomsXOF?: number;
      additionalFeesXOF?: number;
      depositRequiredPercent?: number;
      internalMarginXOF?: number;
      internalNotes?: string;
      leadTimeDays?: string;
      transportMode?: 'air' | 'sea' | 'express';
      conditions?: string[];
      validityDays?: number;
      items?: Array<{ description: string; quantity: number; unitProductPriceXOF: number }>;
    },
    actor: SourcingActor
  ): Promise<SourcingQuoteRecord> {
    const isStaff = ['admin', 'SUPER_ADMIN', 'OPERATIONS', 'SOURCING', 'sourcer'].includes(actor.role);
    if (!isStaff) {
      throw new Error('Seule l équipe sourcing ou administration peut émettre un devis.');
    }

    const req = await storage.getSourcingRequestById(data.sourcingRequestId);
    if (!req) throw new Error(`Demande de sourcing introuvable (${data.sourcingRequestId}).`);

    // Calculs financiers strictement fiables en entiers XOF (aucun arrondi flottant)
    const quantity = Math.max(1, Math.floor(Number(data.quantity || req.quantity) || 1));
    const unitPrice = Math.max(0, Math.round(Number(data.unitProductPriceXOF) || 0));

    let items = data.items || [];
    if (items.length === 0) {
      items = [
        {
          description: req.productName,
          quantity,
          unitProductPriceXOF: unitPrice
        }
      ];
    }

    const calculatedProductTotal = items.reduce(
      (sum, it) => sum + Math.round((Number(it.quantity) || 0) * (Number(it.unitProductPriceXOF) || 0)),
      0
    );
    const totalProductPriceXOF = calculatedProductTotal > 0 ? calculatedProductTotal : quantity * unitPrice;

    const sourcingFeeXOF = Math.max(0, Math.round(Number(data.sourcingFeeXOF) || 0));
    const inspectionFeeXOF = Math.max(0, Math.round(Number(data.inspectionFeeXOF) || 0));
    const estimatedLogisticsXOF = Math.max(0, Math.round(Number(data.estimatedLogisticsXOF) || 0));
    const estimatedCustomsXOF = Math.max(0, Math.round(Number(data.estimatedCustomsXOF) || 0));
    const additionalFeesXOF = Math.max(0, Math.round(Number(data.additionalFeesXOF) || 0));

    // TOTAL CLIENT RECALCULÉ PAR LE SERVEUR
    const totalClientXOF =
      totalProductPriceXOF +
      sourcingFeeXOF +
      inspectionFeeXOF +
      estimatedLogisticsXOF +
      estimatedCustomsXOF +
      additionalFeesXOF;

    const depositRequiredPercent = Math.min(100, Math.max(10, Math.round(Number(data.depositRequiredPercent) || 40)));
    const depositAmountXOF = Math.round(totalClientXOF * (depositRequiredPercent / 100));
    const balanceDueXOF = totalClientXOF - depositAmountXOF;

    // Détermination de la version
    const existingQuotes = await storage.getQuotesByRequestId(req.id);
    const version = existingQuotes.length > 0 ? existingQuotes[0].version + 1 : 1;

    // Durée de validité
    const validityDays = Math.max(3, Math.min(60, Number(data.validityDays) || 15));
    const validUntil = new Date(Date.now() + validityDays * 86400000).toISOString();

    const quoteId = `quo-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const code = this.generateCode('DEV');
    const now = new Date().toISOString();

    const quoteRecord: SourcingQuoteRecord = {
      id: quoteId,
      code,
      sourcingRequestId: req.id,
      customerId: req.customerId,
      assignedSourcerId: req.assignedSourcerId,
      selectedSupplierId: data.selectedSupplierId,
      version,
      status: 'draft',
      quantity,
      unitProductPriceXOF: unitPrice,
      totalProductPriceXOF,
      sourcingFeeXOF,
      inspectionFeeXOF,
      estimatedLogisticsXOF,
      estimatedCustomsXOF,
      additionalFeesXOF,
      totalClientXOF,
      currency: 'XOF',
      internalMarginXOF: data.internalMarginXOF ? Math.round(Number(data.internalMarginXOF)) : 0,
      internalNotes: data.internalNotes,
      depositRequiredPercent,
      depositAmountXOF,
      balanceDueXOF,
      leadTimeDays: data.leadTimeDays || '15-20 jours',
      transportMode: data.transportMode || 'sea',
      conditions: data.conditions || [
        'Prix usine certifié avec contrôle technique avant expédition',
        'Inspection pré-embarquement à l usine incluse',
        'Assurance transport maritime/aérien incluse',
        'Formalités douanières Gaindé incluses'
      ],
      validUntil,
      items: items.map(it => ({
        description: it.description,
        quantity: Math.max(1, Math.floor(it.quantity)),
        unitProductPriceXOF: Math.round(it.unitProductPriceXOF),
        totalProductPriceXOF: Math.round(it.quantity * it.unitProductPriceXOF)
      })),
      createdAt: now,
      updatedAt: now
    };

    await storage.saveSourcingQuote(quoteRecord);

    // Mettre à jour l'état de la demande vers quote_ready
    if (req.status !== 'quote_sent' && req.status !== 'accepted') {
      req.status = 'quote_ready';
      req.updatedAt = now;
      await storage.saveSourcingRequest(req);
    }

    // Audit event
    await storage.appendSourcingEvent({
      id: `evt-src-${Date.now()}`,
      sourcingRequestId: req.id,
      eventType: 'quote_created',
      newStatus: req.status,
      description: `Devis ${quoteRecord.code} (v${version}) créé : Total client ${totalClientXOF.toLocaleString('fr-FR')} XOF.`,
      actorUserId: actor.userId,
      actorRole: actor.role,
      actorName: actor.name,
      metadata: { quoteId: quoteRecord.id, code: quoteRecord.code, version, totalClientXOF },
      createdAt: now
    });

    return quoteRecord;
  }

  // --- 6. ENVOI DU DEVIS AU CLIENT ---

  async sendQuote(quoteId: string, actor: SourcingActor): Promise<SourcingQuoteRecord> {
    const isStaff = ['admin', 'SUPER_ADMIN', 'OPERATIONS', 'SOURCING', 'sourcer'].includes(actor.role);
    if (!isStaff) {
      throw new Error('Action réservée aux équipes de gestion.');
    }

    const quote = await storage.getSourcingQuoteById(quoteId);
    if (!quote) throw new Error(`Devis introuvable (${quoteId}).`);

    const req = await storage.getSourcingRequestById(quote.sourcingRequestId);
    if (!req) throw new Error(`Demande associée introuvable (${quote.sourcingRequestId}).`);

    const now = new Date().toISOString();
    quote.status = 'sent';
    quote.sentAt = now;
    quote.updatedAt = now;
    await storage.saveSourcingQuote(quote);

    // Si un ancien devis était sent, le marquer superseded
    const otherQuotes = await storage.getQuotesByRequestId(req.id);
    for (const o of otherQuotes) {
      if (o.id !== quote.id && o.status === 'sent') {
        o.status = 'superseded';
        o.updatedAt = now;
        await storage.saveSourcingQuote(o);
      }
    }

    // Mise à jour du statut de la demande
    req.status = 'quote_sent';
    req.updatedAt = now;
    await storage.saveSourcingRequest(req);

    // Audit event
    await storage.appendSourcingEvent({
      id: `evt-src-${Date.now()}`,
      sourcingRequestId: req.id,
      eventType: 'quote_sent',
      previousStatus: 'quote_ready',
      newStatus: 'quote_sent',
      description: `Devis officiel ${quote.code} (v${quote.version}) transmis au client. Montant: ${quote.totalClientXOF.toLocaleString('fr-FR')} XOF.`,
      actorUserId: actor.userId,
      actorRole: actor.role,
      actorName: actor.name,
      metadata: { quoteId: quote.id, code: quote.code, version: quote.version, totalClientXOF: quote.totalClientXOF },
      createdAt: now
    });

    // In-app notification au client
    if (req.customerId) {
      await storage.createInAppNotification({
        id: `notif-src-${Date.now()}`,
        userId: req.customerId,
        title: 'Nouveau devis de sourcing disponible',
        message: `Votre devis officiel ${quote.code} pour "${req.productName}" est prêt : ${quote.totalClientXOF.toLocaleString('fr-FR')} XOF TTC rendu Dakar.`,
        type: 'order',
        trackingCode: quote.code,
        isRead: false,
        createdAt: now
      });
    }

    return quote;
  }

  // --- 7. ACCEPTATION DU DEVIS PAR LE CLIENT (AVEC IDEMPOTENCE & CONCURRENCY) ---

  async acceptQuote(quoteId: string, actor: SourcingActor): Promise<SourcingQuoteRecord> {
    // Protection mutex simple contre les clics doubles ou requêtes simultanées
    if (this.quoteLocks.has(quoteId)) {
      throw new Error('Une opération sur ce devis est déjà en cours. Veuillez patienter.');
    }
    this.quoteLocks.add(quoteId);

    try {
      const quote = await storage.getSourcingQuoteById(quoteId);
      if (!quote) throw new Error(`Devis introuvable (${quoteId}).`);

      const req = await storage.getSourcingRequestById(quote.sourcingRequestId);
      if (!req) throw new Error(`Demande associée introuvable (${quote.sourcingRequestId}).`);

      // Vérification propriétaire ou staff
      const isOwner = req.customerId === actor.userId;
      const isStaff = ['admin', 'SUPER_ADMIN', 'OPERATIONS', 'SOURCING'].includes(actor.role);
      if (!isOwner && !isStaff) {
        throw new Error('Vous n êtes pas autorisé à accepter ce devis.');
      }

      // Idempotence : si déjà accepté, renvoyer sans re-déclencher d événements
      if (quote.status === 'accepted') {
        return quote;
      }

      if (quote.status !== 'sent') {
        throw new Error(`Ce devis ne peut pas être accepté (statut actuel: ${quote.status}).`);
      }

      // Vérification de la date d expiration
      const expirationTime = new Date(quote.validUntil).getTime();
      if (expirationTime < Date.now()) {
        quote.status = 'expired';
        quote.updatedAt = new Date().toISOString();
        await storage.saveSourcingQuote(quote);
        throw new Error('Ce devis a expiré. Veuillez contacter votre sourceur pour une réactualisation.');
      }

      const now = new Date().toISOString();
      quote.status = 'accepted';
      quote.acceptedAt = now;
      quote.acceptedBy = actor.userId;
      quote.updatedAt = now;
      await storage.saveSourcingQuote(quote);

      // La demande passe à 'accepted'
      const prevStatus = req.status;
      req.status = 'accepted';
      req.updatedAt = now;
      await storage.saveSourcingRequest(req);

      // Audit event
      await storage.appendSourcingEvent({
        id: `evt-src-${Date.now()}`,
        sourcingRequestId: req.id,
        eventType: 'quote_accepted',
        previousStatus: prevStatus,
        newStatus: 'accepted',
        description: `Devis ${quote.code} (v${quote.version}) validé par ${actor.name || req.customerName}. Préparation du dossier de commande.`,
        actorUserId: actor.userId,
        actorRole: actor.role,
        actorName: actor.name || req.customerName,
        metadata: {
          quoteId: quote.id,
          code: quote.code,
          version: quote.version,
          totalClientXOF: quote.totalClientXOF,
          depositAmountXOF: quote.depositAmountXOF
        },
        createdAt: now
      });

      // Notification
      if (req.customerId) {
        await storage.createInAppNotification({
          id: `notif-src-${Date.now()}`,
          userId: req.customerId,
          title: 'Devis accepté avec succès',
          message: `Votre confirmation du devis ${quote.code} a été prise en compte. Un bon de commande va être préparé.`,
          type: 'order',
          trackingCode: quote.code,
          isRead: false,
          createdAt: now
        });
      }

      return quote;
    } finally {
      this.quoteLocks.delete(quoteId);
    }
  }

  // --- 8. REFUS DU DEVIS PAR LE CLIENT ---

  async rejectQuote(quoteId: string, reason: string | undefined, actor: SourcingActor): Promise<SourcingQuoteRecord> {
    const quote = await storage.getSourcingQuoteById(quoteId);
    if (!quote) throw new Error(`Devis introuvable (${quoteId}).`);

    const req = await storage.getSourcingRequestById(quote.sourcingRequestId);
    if (!req) throw new Error(`Demande associée introuvable (${quote.sourcingRequestId}).`);

    const isOwner = req.customerId === actor.userId;
    const isStaff = ['admin', 'SUPER_ADMIN', 'OPERATIONS', 'SOURCING'].includes(actor.role);
    if (!isOwner && !isStaff) {
      throw new Error('Vous n êtes pas autorisé à refuser ce devis.');
    }

    if (quote.status === 'rejected') {
      return quote;
    }

    if (quote.status !== 'sent') {
      throw new Error(`Ce devis ne peut pas être refusé (statut: ${quote.status}).`);
    }

    const now = new Date().toISOString();
    quote.status = 'rejected';
    quote.rejectedAt = now;
    quote.rejectedReason = reason || 'Refusé par le client sans motif spécifié';
    quote.updatedAt = now;
    await storage.saveSourcingQuote(quote);

    req.status = 'rejected';
    req.updatedAt = now;
    await storage.saveSourcingRequest(req);

    // Audit event
    await storage.appendSourcingEvent({
      id: `evt-src-${Date.now()}`,
      sourcingRequestId: req.id,
      eventType: 'quote_rejected',
      previousStatus: 'quote_sent',
      newStatus: 'rejected',
      description: `Devis ${quote.code} refusé : "${quote.rejectedReason}".`,
      actorUserId: actor.userId,
      actorRole: actor.role,
      actorName: actor.name || req.customerName,
      metadata: { quoteId: quote.id, code: quote.code, reason: quote.rejectedReason },
      createdAt: now
    });

    return quote;
  }

  // --- 9. PIÈCES JOINTES & ATTACHMENTS ---

  async addAttachment(
    requestId: string,
    fileData: {
      fileName: string;
      fileUrl: string;
      fileType: string;
      fileSizeBytes: number;
      isInternal?: boolean;
    },
    actor: SourcingActor
  ): Promise<SourcingAttachmentRecord> {
    const req = await storage.getSourcingRequestById(requestId);
    if (!req) throw new Error(`Demande de sourcing introuvable (${requestId}).`);

    // Validation taille
    if (fileData.fileSizeBytes > MAX_ATTACHMENT_SIZE_BYTES) {
      throw new Error('Le fichier dépasse la taille maximale autorisée (10 Mo).');
    }

    // Validation type MIME
    if (fileData.fileType && !ALLOWED_MIME_TYPES.has(fileData.fileType.toLowerCase())) {
      // Tolérance générique image/
      if (!fileData.fileType.startsWith('image/')) {
        throw new Error(`Type de fichier non supporté (${fileData.fileType}). Formats acceptés: JPG, PNG, WEBP, PDF, DOC.`);
      }
    }

    // Limite max par demande (10 fichiers)
    const existing = await storage.getSourcingAttachments(requestId);
    if (existing.length >= 10) {
      throw new Error('Nombre maximal de pièces jointes atteint pour cette demande (10 max).');
    }

    const isStaff = ['admin', 'SUPER_ADMIN', 'OPERATIONS', 'SOURCING', 'sourcer'].includes(actor.role);
    const isInternal = isStaff ? !!fileData.isInternal : false;

    const record: SourcingAttachmentRecord = {
      id: `att-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      sourcingRequestId: requestId,
      fileName: fileData.fileName,
      fileUrl: fileData.fileUrl,
      fileType: fileData.fileType || 'application/octet-stream',
      fileSizeBytes: fileData.fileSizeBytes,
      isInternal,
      uploadedBy: actor.userId,
      createdAt: new Date().toISOString()
    };

    await storage.saveSourcingAttachment(record);
    return record;
  }

  // --- 10. SANITISATION DTO CLIENT (MASQUAGE STRICT DES DONNÉES CONFIDENTIELLES) ---

  toPublicRequestDTO(
    req: SourcingRequestRecord,
    quotes: SourcingQuoteRecord[],
    events: SourcingEventRecord[],
    attachments: SourcingAttachmentRecord[]
  ): PublicSourcingRequestDTO {
    // Filtrer les pièces jointes internes
    const publicAttachments = attachments
      .filter(a => !a.isInternal)
      .map(a => ({
        id: a.id,
        fileName: a.fileName,
        fileUrl: a.fileUrl,
        fileType: a.fileType,
        fileSizeBytes: a.fileSizeBytes
      }));

    // Trouver le devis actif (le plus récent sent ou accepted)
    const activeQuoteRecord = quotes.find(q => q.status === 'sent' || q.status === 'accepted') || quotes[0];
    const activeQuote = activeQuoteRecord ? this.toPublicQuoteDTO(activeQuoteRecord) : null;

    const statusLabels: Record<SourcingStatus, string> = {
      new: 'Nouvelle demande',
      researching: 'Recherche usine en Chine',
      supplier_found: 'Fournisseurs identifiés',
      negotiating: 'Négociation tarifaire',
      quote_ready: 'Devis en cours de validation',
      quote_sent: 'Devis disponible',
      accepted: 'Devis accepté',
      rejected: 'Devis refusé',
      ordered: 'Commande usine lancée',
      completed: 'Sourcing finalisé',
      cancelled: 'Demande annulée'
    };

    return {
      id: req.id,
      code: req.code,
      customerId: req.customerId,
      customerName: req.customerName,
      customerCompany: req.customerCompany,
      productName: req.productName,
      productDescription: req.productDescription,
      productLink: req.productLink,
      productImages: req.productImages,
      quantity: req.quantity,
      targetBudget: req.targetBudget,
      currency: req.currency,
      specifications: req.specifications,
      customization: req.customization,
      desiredDeadline: req.desiredDeadline,
      destination: req.destination,
      notes: req.notes,
      status: req.status,
      statusLabel: statusLabels[req.status] || req.status,
      assignedSourcerName: req.assignedSourcerName,
      assignedAt: req.assignedAt,
      quotesCount: quotes.length,
      activeQuote,
      events,
      attachments: publicAttachments,
      createdAt: req.createdAt,
      updatedAt: req.updatedAt
    };
  }

  toPublicQuoteDTO(q: SourcingQuoteRecord): PublicQuoteDTO {
    // STRICTEMENT SANS internalMarginXOF NI internalNotes
    return {
      id: q.id,
      code: q.code,
      sourcingRequestId: q.sourcingRequestId,
      version: q.version,
      status: q.status,
      quantity: q.quantity,
      unitProductPriceXOF: q.unitProductPriceXOF,
      totalProductPriceXOF: q.totalProductPriceXOF,
      sourcingFeeXOF: q.sourcingFeeXOF,
      inspectionFeeXOF: q.inspectionFeeXOF,
      estimatedLogisticsXOF: q.estimatedLogisticsXOF,
      estimatedCustomsXOF: q.estimatedCustomsXOF,
      additionalFeesXOF: q.additionalFeesXOF,
      totalClientXOF: q.totalClientXOF,
      currency: q.currency,
      depositRequiredPercent: q.depositRequiredPercent,
      depositAmountXOF: q.depositAmountXOF,
      balanceDueXOF: q.balanceDueXOF,
      leadTimeDays: q.leadTimeDays,
      transportMode: q.transportMode,
      conditions: q.conditions,
      validUntil: q.validUntil,
      items: q.items,
      createdAt: q.createdAt,
      sentAt: q.sentAt,
      acceptedAt: q.acceptedAt
    };
  }

  toPublicSupplierDTO(item: SourcingRequestSupplierRecord): PublicSupplierCandidateDTO {
    // STRICTEMENT SANS contact personnel, wechat ou marge usine
    return {
      id: item.id,
      supplierId: item.supplierId,
      supplierName: item.supplierName || 'Fournisseur Partenaire Vérifié',
      supplierPlatform: item.supplierPlatform || '1688',
      moq: item.moq,
      leadTimeDays: item.leadTimeDays,
      sampleAvailable: item.sampleAvailable,
      customizationConfirmed: item.customizationConfirmed,
      clientVisibleNotes: item.clientVisibleNotes,
      isSelected: item.isSelected
    };
  }
}

export const sourcingService = new SourcingService();
