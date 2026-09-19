// ==============================================================================
// ROUTEUR API : SOURCING RÉEL, FOURNISSEURS, DEMANDES CLIENT ET DEVIS (ÉTAPE 9)
// ==============================================================================

import { Router, Request, Response } from 'express';
import { sourcingService } from '../services/SourcingService';
import { storage } from '../db/storage';
import { SourcingActor, SourcingStatus } from '../types/sourcing';

export const sourcingRouter = Router();

// Helper d'extraction d'identité et de rôle sécurisé
function getRequestActor(req: Request): SourcingActor {
  const userId = (req.headers['x-user-id'] as string) || (req.query.userId as string) || 'cust-01';
  const role = ((req.headers['x-user-role'] as string) || (req.query.userRole as string) || 'client') as any;
  const name = (req.headers['x-user-name'] as string) || (req.query.userName as string) || 'Client DALLOU';

  return {
    userId,
    role,
    name
  };
}

function isStaffRole(role: string): boolean {
  return ['admin', 'SUPER_ADMIN', 'OPERATIONS', 'SOURCING', 'sourcer'].includes(role);
}

// ==============================================================================
// 1. DEMANDES DE SOURCING (SOURCING_REQUESTS)
// ==============================================================================

// POST /requests : Création d'une nouvelle demande
sourcingRouter.post('/requests', async (req: Request, res: Response) => {
  try {
    const actor = getRequestActor(req);
    const body = req.body || {};

    const newRequest = await sourcingService.createRequest(
      {
        customerId: actor.userId,
        customerName: body.customerName || actor.name,
        customerCompany: body.customerCompany,
        customerPhone: body.customerPhone || '+221 77 000 00 00',
        customerEmail: body.customerEmail,
        productName: body.productName,
        productDescription: body.productDescription,
        productLink: body.productLink,
        productImages: body.productImages || [],
        quantity: body.quantity,
        targetBudget: body.targetBudget,
        currency: body.currency,
        specifications: body.specifications,
        customization: body.customization,
        desiredDeadline: body.desiredDeadline,
        destination: body.destination,
        notes: body.notes
      },
      actor
    );

    res.status(201).json({
      success: true,
      message: 'Demande de sourcing enregistrée avec succès.',
      request: newRequest
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message || 'Erreur lors de la création de la demande de sourcing.'
    });
  }
});

// GET /requests : Liste des demandes
sourcingRouter.get('/requests', async (req: Request, res: Response) => {
  try {
    const actor = getRequestActor(req);
    const isStaff = isStaffRole(actor.role);

    let list = await storage.getAllSourcingRequests();

    // Si client normal : filtrer uniquement ses propres demandes
    if (!isStaff) {
      list = list.filter(r => r.customerId === actor.userId);
    }

    // Filtrage optionnel par statut
    const statusFilter = req.query.status as string;
    if (statusFilter) {
      list = list.filter(r => r.status === statusFilter);
    }

    // Transformation en DTO public si client
    if (!isStaff) {
      const sanitized = await Promise.all(
        list.map(async r => {
          const quotes = await storage.getQuotesByRequestId(r.id);
          const events = await storage.getSourcingEvents(r.id);
          const attachments = await storage.getSourcingAttachments(r.id);
          return sourcingService.toPublicRequestDTO(r, quotes, events, attachments);
        })
      );
      return res.json({ success: true, count: sanitized.length, requests: sanitized });
    }

    res.json({ success: true, count: list.length, requests: list });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /requests/:id : Détail complet d'une demande
sourcingRouter.get('/requests/:id', async (req: Request, res: Response) => {
  try {
    const actor = getRequestActor(req);
    const isStaff = isStaffRole(actor.role);
    const id = req.params.id;

    let request = await storage.getSourcingRequestById(id);
    if (!request) {
      request = await storage.getSourcingRequestByCode(id);
    }

    if (!request) {
      return res.status(404).json({ success: false, error: `Demande de sourcing introuvable (${id}).` });
    }

    // Sécurité RLS : client ne peut voir que sa propre demande
    if (!isStaff && request.customerId && request.customerId !== actor.userId) {
      return res.status(403).json({ success: false, error: 'Accès non autorisé à cette demande de sourcing.' });
    }

    const quotes = await storage.getQuotesByRequestId(request.id);
    const suppliers = await storage.getSuppliersByRequestId(request.id);
    const events = await storage.getSourcingEvents(request.id);
    const attachments = await storage.getSourcingAttachments(request.id);

    if (!isStaff) {
      const publicRequest = sourcingService.toPublicRequestDTO(request, quotes, events, attachments);
      const publicQuotes = quotes.map(q => sourcingService.toPublicQuoteDTO(q));
      const publicSuppliers = suppliers.map(s => sourcingService.toPublicSupplierDTO(s));

      return res.json({
        success: true,
        request: publicRequest,
        quotes: publicQuotes,
        suppliers: publicSuppliers
      });
    }

    // Vue Staff / Admin : accès complet aux marges et notes confidentielles
    res.json({
      success: true,
      request,
      quotes,
      suppliers,
      events,
      attachments
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// PATCH /requests/:id : Mise à jour du statut ou des données
sourcingRouter.patch('/requests/:id', async (req: Request, res: Response) => {
  try {
    const actor = getRequestActor(req);
    const id = req.params.id;
    const body = req.body || {};

    let request = await storage.getSourcingRequestById(id);
    if (!request) request = await storage.getSourcingRequestByCode(id);
    if (!request) return res.status(404).json({ success: false, error: 'Demande introuvable.' });

    if (body.status) {
      request = await sourcingService.transitionStatus(request.id, body.status as SourcingStatus, actor, body.reason);
    }

    // Mise à jour d'autres attributs si autorisée
    if (isStaffRole(actor.role)) {
      if (body.notes !== undefined) request.notes = body.notes;
      if (body.specifications !== undefined) request.specifications = body.specifications;
      request.updatedAt = new Date().toISOString();
      await storage.saveSourcingRequest(request);
    }

    res.json({ success: true, request });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// POST /requests/:id/assign : Assignation d'un sourceur dédié
sourcingRouter.post('/requests/:id/assign', async (req: Request, res: Response) => {
  try {
    const actor = getRequestActor(req);
    const id = req.params.id;
    const { sourcerId, sourcerName } = req.body || {};

    if (!sourcerId || !sourcerName) {
      return res.status(400).json({ success: false, error: 'Identifiant et nom du sourceur obligatoires.' });
    }

    let request = await storage.getSourcingRequestById(id);
    if (!request) request = await storage.getSourcingRequestByCode(id);
    if (!request) return res.status(404).json({ success: false, error: 'Demande introuvable.' });

    const updated = await sourcingService.assignSourcer(request.id, sourcerId, sourcerName, actor);
    res.json({ success: true, message: `Dossier assigné au sourceur ${sourcerName}.`, request: updated });
  } catch (error: any) {
    res.status(403).json({ success: false, error: error.message });
  }
});

// ==============================================================================
// 2. MULTI-FOURNISSEURS CANDIDATS
// ==============================================================================

// GET /requests/:id/suppliers : Liste des fournisseurs associés
sourcingRouter.get('/requests/:id/suppliers', async (req: Request, res: Response) => {
  try {
    const actor = getRequestActor(req);
    const id = req.params.id;

    let request = await storage.getSourcingRequestById(id);
    if (!request) request = await storage.getSourcingRequestByCode(id);
    if (!request) return res.status(404).json({ success: false, error: 'Demande introuvable.' });

    const suppliers = await storage.getSuppliersByRequestId(request.id);

    if (!isStaffRole(actor.role)) {
      const sanitized = suppliers.map(s => sourcingService.toPublicSupplierDTO(s));
      return res.json({ success: true, count: sanitized.length, suppliers: sanitized });
    }

    res.json({ success: true, count: suppliers.length, suppliers });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /requests/:id/suppliers : Ajout d'un fournisseur candidat
sourcingRouter.post('/requests/:id/suppliers', async (req: Request, res: Response) => {
  try {
    const actor = getRequestActor(req);
    const id = req.params.id;
    const body = req.body || {};

    let request = await storage.getSourcingRequestById(id);
    if (!request) request = await storage.getSourcingRequestByCode(id);
    if (!request) return res.status(404).json({ success: false, error: 'Demande introuvable.' });

    const supplierItem = await sourcingService.addSupplierToRequest(request.id, body, actor);
    res.status(201).json({ success: true, supplier: supplierItem });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// DELETE /requests/:id/suppliers/:linkId : Suppression d'un fournisseur candidat
sourcingRouter.delete('/requests/:id/suppliers/:linkId', async (req: Request, res: Response) => {
  try {
    const actor = getRequestActor(req);
    if (!isStaffRole(actor.role)) {
      return res.status(403).json({ success: false, error: 'Réservé aux administrateurs et sourceurs.' });
    }

    const linkId = req.params.linkId;
    await storage.deleteSourcingRequestSupplier(linkId);
    res.json({ success: true, message: 'Fournisseur candidat retiré de la demande.' });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==============================================================================
// 3. DEVIS (QUOTES) & VERSIONNAGE
// ==============================================================================

// POST /requests/:id/quotes : Création d'un devis
sourcingRouter.post('/requests/:id/quotes', async (req: Request, res: Response) => {
  try {
    const actor = getRequestActor(req);
    const id = req.params.id;
    const body = req.body || {};

    let request = await storage.getSourcingRequestById(id);
    if (!request) request = await storage.getSourcingRequestByCode(id);
    if (!request) return res.status(404).json({ success: false, error: 'Demande introuvable.' });

    const quote = await sourcingService.createQuote(
      {
        sourcingRequestId: request.id,
        selectedSupplierId: body.selectedSupplierId,
        quantity: body.quantity,
        unitProductPriceXOF: body.unitProductPriceXOF,
        sourcingFeeXOF: body.sourcingFeeXOF,
        inspectionFeeXOF: body.inspectionFeeXOF,
        estimatedLogisticsXOF: body.estimatedLogisticsXOF,
        estimatedCustomsXOF: body.estimatedCustomsXOF,
        additionalFeesXOF: body.additionalFeesXOF,
        depositRequiredPercent: body.depositRequiredPercent,
        internalMarginXOF: body.internalMarginXOF,
        internalNotes: body.internalNotes,
        leadTimeDays: body.leadTimeDays,
        transportMode: body.transportMode,
        conditions: body.conditions,
        validityDays: body.validityDays,
        items: body.items
      },
      actor
    );

    res.status(201).json({ success: true, quote });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// GET /requests/:id/quotes : Liste des devis d'une demande
sourcingRouter.get('/requests/:id/quotes', async (req: Request, res: Response) => {
  try {
    const actor = getRequestActor(req);
    const id = req.params.id;

    let request = await storage.getSourcingRequestById(id);
    if (!request) request = await storage.getSourcingRequestByCode(id);
    if (!request) return res.status(404).json({ success: false, error: 'Demande introuvable.' });

    const quotes = await storage.getQuotesByRequestId(request.id);

    if (!isStaffRole(actor.role)) {
      const publicQuotes = quotes.map(q => sourcingService.toPublicQuoteDTO(q));
      return res.json({ success: true, quotes: publicQuotes });
    }

    res.json({ success: true, quotes });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /quotes/:id : Consultation d'un devis
sourcingRouter.get('/quotes/:id', async (req: Request, res: Response) => {
  try {
    const actor = getRequestActor(req);
    const id = req.params.id;

    let quote = await storage.getSourcingQuoteById(id);
    if (!quote) quote = await storage.getSourcingQuoteByCode(id);
    if (!quote) return res.status(404).json({ success: false, error: 'Devis introuvable.' });

    if (!isStaffRole(actor.role)) {
      const reqRecord = await storage.getSourcingRequestById(quote.sourcingRequestId);
      if (reqRecord && reqRecord.customerId && reqRecord.customerId !== actor.userId) {
        return res.status(403).json({ success: false, error: 'Accès interdit à ce devis.' });
      }
      return res.json({ success: true, quote: sourcingService.toPublicQuoteDTO(quote) });
    }

    res.json({ success: true, quote });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /quotes/:id/send : Transmission du devis au client
sourcingRouter.post('/quotes/:id/send', async (req: Request, res: Response) => {
  try {
    const actor = getRequestActor(req);
    const id = req.params.id;

    let quote = await storage.getSourcingQuoteById(id);
    if (!quote) quote = await storage.getSourcingQuoteByCode(id);
    if (!quote) return res.status(404).json({ success: false, error: 'Devis introuvable.' });

    const sent = await sourcingService.sendQuote(quote.id, actor);
    res.json({ success: true, message: `Devis officiel ${sent.code} envoyé au client.`, quote: sent });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// POST /quotes/:id/accept : Validation du devis par le client
sourcingRouter.post('/quotes/:id/accept', async (req: Request, res: Response) => {
  try {
    const actor = getRequestActor(req);
    const id = req.params.id;

    let quote = await storage.getSourcingQuoteById(id);
    if (!quote) quote = await storage.getSourcingQuoteByCode(id);
    if (!quote) return res.status(404).json({ success: false, error: 'Devis introuvable.' });

    const accepted = await sourcingService.acceptQuote(quote.id, actor);
    res.json({
      success: true,
      message: `Devis ${accepted.code} accepté avec succès ! Le dossier passe en préparation de commande.`,
      quote: isStaffRole(actor.role) ? accepted : sourcingService.toPublicQuoteDTO(accepted)
    });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// POST /quotes/:id/reject : Refus du devis par le client
sourcingRouter.post('/quotes/:id/reject', async (req: Request, res: Response) => {
  try {
    const actor = getRequestActor(req);
    const id = req.params.id;
    const { reason } = req.body || {};

    let quote = await storage.getSourcingQuoteById(id);
    if (!quote) quote = await storage.getSourcingQuoteByCode(id);
    if (!quote) return res.status(404).json({ success: false, error: 'Devis introuvable.' });

    const rejected = await sourcingService.rejectQuote(quote.id, reason, actor);
    res.json({
      success: true,
      message: `Devis ${rejected.code} refusé.`,
      quote: isStaffRole(actor.role) ? rejected : sourcingService.toPublicQuoteDTO(rejected)
    });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// ==============================================================================
// 4. PIÈCES JOINTES & ATTACHMENTS
// ==============================================================================

sourcingRouter.post('/requests/:id/attachments', async (req: Request, res: Response) => {
  try {
    const actor = getRequestActor(req);
    const id = req.params.id;
    const body = req.body || {};

    let request = await storage.getSourcingRequestById(id);
    if (!request) request = await storage.getSourcingRequestByCode(id);
    if (!request) return res.status(404).json({ success: false, error: 'Demande introuvable.' });

    if (!body.fileName || !body.fileUrl) {
      return res.status(400).json({ success: false, error: 'Nom et URL du fichier requis.' });
    }

    const att = await sourcingService.addAttachment(
      request.id,
      {
        fileName: body.fileName,
        fileUrl: body.fileUrl,
        fileType: body.fileType || 'application/octet-stream',
        fileSizeBytes: Number(body.fileSizeBytes) || 1024,
        isInternal: body.isInternal
      },
      actor
    );

    res.status(201).json({ success: true, attachment: att });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// ==============================================================================
// 5. FOURNISSEURS (ANNUAIRE GLOBAL)
// ==============================================================================

sourcingRouter.get('/suppliers', async (req: Request, res: Response) => {
  try {
    const actor = getRequestActor(req);
    const isStaff = isStaffRole(actor.role);
    const suppliers = await storage.getAllSuppliers();

    if (!isStaff) {
      // Masquer les contacts privés et notes internes
      const publicSuppliers = suppliers.map(s => ({
        id: s.id,
        name: s.name,
        platform: s.platform,
        country: s.country,
        city: s.city,
        supplierCode: s.supplierCode,
        moq: s.moq,
        rating: s.rating,
        verificationStatus: s.verificationStatus
      }));
      return res.json({ success: true, count: publicSuppliers.length, suppliers: publicSuppliers });
    }

    res.json({ success: true, count: suppliers.length, suppliers });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

sourcingRouter.post('/suppliers', async (req: Request, res: Response) => {
  try {
    const actor = getRequestActor(req);
    if (!isStaffRole(actor.role)) {
      return res.status(403).json({ success: false, error: 'Action réservée aux équipes sourcing et admin.' });
    }

    const body = req.body || {};
    if (!body.name) {
      return res.status(400).json({ success: false, error: 'Le nom du fournisseur est obligatoire.' });
    }

    const newSupplier = {
      id: `sup-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      name: body.name.trim(),
      platform: body.platform || '1688',
      productUrl: body.productUrl,
      contactPerson: body.contactPerson,
      contactPhone: body.contactPhone,
      contactWeChat: body.contactWeChat,
      contactEmail: body.contactEmail,
      country: body.country || 'Chine',
      city: body.city || 'Guangzhou',
      supplierCode: body.supplierCode || `SUP-${Math.floor(1000 + Math.random() * 9000)}`,
      moq: Number(body.moq) || 1,
      supplierPriceCNY: body.supplierPriceCNY ? Number(body.supplierPriceCNY) : undefined,
      supplierPriceXOF: body.supplierPriceXOF ? Number(body.supplierPriceXOF) : undefined,
      currency: body.currency || 'CNY',
      leadTimeDays: Number(body.leadTimeDays) || 15,
      customizationAvailable: !!body.customizationAvailable,
      rating: Number(body.rating) || 4.8,
      verificationStatus: body.verificationStatus || 'verified',
      internalNotes: body.internalNotes,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await storage.saveSupplier(newSupplier);
    res.status(201).json({ success: true, supplier: newSupplier });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});
