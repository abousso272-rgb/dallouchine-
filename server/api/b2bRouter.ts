import { Router, Request, Response } from 'express';
import { requireAuth, requireAdmin, optionalAuth, getSupabaseServerClient } from '../middleware/auth';
import { B2BService } from '../services/B2BService';
import { B2BStatus, B2BProductionStage } from '../types/b2b';

export const b2bRouter = Router();
const b2bService = new B2BService();

/**
 * 1. Création d'une entreprise
 * POST /api/b2b/companies
 */
b2bRouter.post('/companies', requireAuth, async (req: Request, res: Response) => {
  try {
    const {
      legalName,
      tradeName,
      registrationNumber,
      sector,
      country,
      city,
      address,
      website,
      phone,
      email,
      notes
    } = req.body;

    if (!legalName || !legalName.trim()) {
      res.status(400).json({ success: false, error: 'La raison sociale est requise.' });
      return;
    }

    const token = req.headers.authorization?.substring(7);
    const result = await b2bService.createCompany({
      userId: req.user?.id,
      legalName: legalName.trim(),
      tradeName: tradeName?.trim(),
      registrationNumber: registrationNumber?.trim(),
      sector: sector?.trim(),
      country: country?.trim() || 'Sénégal',
      city: city?.trim() || 'Dakar',
      address: address?.trim(),
      website: website?.trim(),
      phone: phone?.trim(),
      email: email?.trim(),
      notes: notes?.trim(),
      token
    });

    if (!result.success) {
      res.status(400).json(result);
      return;
    }

    res.status(201).json(result);
  } catch (err: any) {
    console.error('[b2bRouter] Erreur création entreprise:', err);
    res.status(500).json({ success: false, error: err.message || 'Erreur serveur.' });
  }
});

/**
 * 2. Liste des entreprises
 * GET /api/b2b/companies
 */
b2bRouter.get('/companies', requireAuth, async (req: Request, res: Response) => {
  try {
    const token = req.headers.authorization?.substring(7);
    const result = await b2bService.getCompanies({
      userId: req.user?.id,
      isAdmin: req.user?.isAdmin || false,
      token
    });

    res.json(result);
  } catch (err: any) {
    console.error('[b2bRouter] Erreur liste entreprises:', err);
    res.status(500).json({ success: false, error: err.message || 'Erreur serveur.' });
  }
});

/**
 * 3. Ajout d'un contact entreprise
 * POST /api/b2b/companies/:id/contacts
 */
b2bRouter.post('/companies/:id/contacts', requireAuth, async (req: Request, res: Response) => {
  try {
    const companyId = req.params.id;
    const {
      firstName,
      lastName,
      role,
      email,
      phone,
      whatsapp,
      preferredContactMethod,
      isPrimary
    } = req.body;

    if (!firstName || !lastName || !phone) {
      res.status(400).json({
        success: false,
        error: 'Le prénom, le nom et le numéro de téléphone sont requis.'
      });
      return;
    }

    const token = req.headers.authorization?.substring(7);
    const result = await b2bService.addCompanyContact({
      companyId,
      userId: req.user?.id,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      role: role?.trim(),
      email: email?.trim(),
      phone: phone.trim(),
      whatsapp: whatsapp?.trim(),
      preferredContactMethod: preferredContactMethod || 'whatsapp',
      isPrimary: Boolean(isPrimary),
      token
    });

    if (!result.success) {
      res.status(400).json(result);
      return;
    }

    res.status(201).json(result);
  } catch (err: any) {
    console.error('[b2bRouter] Erreur ajout contact entreprise:', err);
    res.status(500).json({ success: false, error: err.message || 'Erreur serveur.' });
  }
});

/**
 * 4. Liste des contacts d'une entreprise
 * GET /api/b2b/companies/:id/contacts
 */
b2bRouter.get('/companies/:id/contacts', requireAuth, async (req: Request, res: Response) => {
  try {
    const companyId = req.params.id;
    const token = req.headers.authorization?.substring(7);
    const result = await b2bService.getCompanyContacts({ companyId, token });

    res.json(result);
  } catch (err: any) {
    console.error('[b2bRouter] Erreur liste contacts entreprise:', err);
    res.status(500).json({ success: false, error: err.message || 'Erreur serveur.' });
  }
});

/**
 * 5. Création d'une demande B2B
 * POST /api/b2b/requests
 */
b2bRouter.post('/requests', optionalAuth, async (req: Request, res: Response) => {
  try {
    const {
      companyId,
      contactId,
      companyName,
      contactName,
      phone,
      email,
      sector,
      productName,
      productDescription,
      productLink,
      productImages,
      attachments,
      quantity,
      budgetXof,
      currency,
      transportPreference,
      destination,
      specifications,
      customization,
      logoInstructions,
      packagingRequested,
      desiredDeadline,
      notes
    } = req.body;

    if (!productName && !productDescription) {
      res.status(400).json({
        success: false,
        errorCode: 'INVALID_PRODUCT',
        error: 'Le nom ou la description du produit est requis.'
      });
      return;
    }

    if (!quantity || Number(quantity) <= 0) {
      res.status(400).json({
        success: false,
        errorCode: 'INVALID_QUANTITY',
        error: 'La quantité demandée doit être supérieure à 0.'
      });
      return;
    }

    const token = req.headers.authorization?.startsWith('Bearer ')
      ? req.headers.authorization.substring(7)
      : undefined;

    const result = await b2bService.createB2BRequest({
      userId: req.user?.id,
      companyId,
      contactId,
      companyName: companyName?.trim(),
      contactName: contactName?.trim(),
      phone: phone?.trim(),
      email: email?.trim(),
      sector: sector?.trim(),
      productName: productName?.trim(),
      productDescription: productDescription?.trim(),
      productLink: productLink?.trim(),
      productImages,
      attachments,
      quantity: Number(quantity),
      budgetXof: budgetXof ? Number(budgetXof) : undefined,
      currency: currency || 'XOF',
      transportPreference: transportPreference || 'recommended',
      destination: destination?.trim() || 'Dakar, Sénégal',
      specifications: specifications?.trim(),
      customization: Boolean(customization),
      logoInstructions: logoInstructions?.trim(),
      packagingRequested: Boolean(packagingRequested),
      desiredDeadline,
      notes: notes?.trim(),
      token
    });

    if (!result.success) {
      const status = result.errorCode === 'INVALID_URL' ? 400 : 422;
      res.status(status).json(result);
      return;
    }

    res.status(201).json({ ...result, ...result.request });
  } catch (err: any) {
    console.error('[b2bRouter] Erreur création demande B2B:', err);
    res.status(500).json({ success: false, error: err.message || 'Erreur serveur.' });
  }
});

/**
 * 6. Liste des demandes B2B
 * GET /api/b2b/requests
 */
b2bRouter.get('/requests', requireAuth, async (req: Request, res: Response) => {
  try {
    const { status, search } = req.query;
    const token = req.headers.authorization?.substring(7);

    const result = await b2bService.getRequests({
      userId: req.user?.id,
      isAdmin: req.user?.isAdmin || false,
      status: typeof status === 'string' ? status : undefined,
      search: typeof search === 'string' ? search : undefined,
      token
    });

    res.json(result);
  } catch (err: any) {
    console.error('[b2bRouter] Erreur liste demandes B2B:', err);
    res.status(500).json({ success: false, error: err.message || 'Erreur serveur.' });
  }
});

/**
 * 7. Détails d'une demande B2B
 * GET /api/b2b/requests/:id
 */
b2bRouter.get('/requests/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const requestId = req.params.id;
    const token = req.headers.authorization?.substring(7);

    const result = await b2bService.getRequestDetails({
      requestId,
      userId: req.user?.id,
      isAdmin: req.user?.isAdmin || false,
      token
    });

    if (!result.success) {
      const status = result.errorCode === 'NOT_FOUND' ? 404 : result.errorCode === 'FORBIDDEN' ? 403 : 400;
      res.status(status).json(result);
      return;
    }

    res.json(result);
  } catch (err: any) {
    console.error('[b2bRouter] Erreur détails demande B2B:', err);
    res.status(500).json({ success: false, error: err.message || 'Erreur serveur.' });
  }
});

/**
 * 8. Qualification d'une demande B2B (ADMIN)
 * POST /api/b2b/requests/:id/qualify
 */
b2bRouter.post('/requests/:id/qualify', requireAdmin, async (req: Request, res: Response) => {
  try {
    const requestId = req.params.id;
    const { notes, priority } = req.body;
    const token = req.headers.authorization?.substring(7);

    const result = await b2bService.qualifyRequest({
      requestId,
      qualifiedBy: req.user!.id,
      notes,
      priority,
      token
    });

    if (!result.success) {
      res.status(400).json(result);
      return;
    }

    res.json({ ...result, ...result.result });
  } catch (err: any) {
    console.error('[b2bRouter] Erreur qualification demande B2B:', err);
    res.status(500).json({ success: false, error: err.message || 'Erreur serveur.' });
  }
});

/**
 * 9. Assignation d'un responsable à une demande B2B (ADMIN)
 * POST /api/b2b/requests/:id/assign
 */
b2bRouter.post('/requests/:id/assign', requireAdmin, async (req: Request, res: Response) => {
  try {
    const requestId = req.params.id;
    const { assignedUserId } = req.body;

    if (!assignedUserId) {
      res.status(400).json({ success: false, error: 'assignedUserId est requis.' });
      return;
    }

    const token = req.headers.authorization?.substring(7);
    const result = await b2bService.assignRequest({
      requestId,
      assignedUserId,
      assignedBy: req.user!.id,
      token
    });

    if (!result.success) {
      res.status(400).json(result);
      return;
    }

    res.json({ ...result, ...result.result });
  } catch (err: any) {
    console.error('[b2bRouter] Erreur assignation demande B2B:', err);
    res.status(500).json({ success: false, error: err.message || 'Erreur serveur.' });
  }
});

/**
 * 10. Ajout / Évaluation d'un fournisseur pour une demande B2B (ADMIN)
 * POST /api/b2b/requests/:id/suppliers
 */
b2bRouter.post('/requests/:id/suppliers', requireAdmin, async (req: Request, res: Response) => {
  try {
    const requestId = req.params.id;
    const {
      supplierId,
      productUrl,
      initialPriceCny,
      initialPriceXof,
      negotiatedPriceCny,
      negotiatedPriceXof,
      moq,
      leadTimeDays,
      customizationAvailable,
      sampleAvailable,
      sampleCostXof,
      incoterm,
      internalNotes
    } = req.body;

    if (!supplierId) {
      res.status(400).json({ success: false, error: 'supplierId est requis.' });
      return;
    }

    const token = req.headers.authorization?.substring(7);
    const result = await b2bService.addSupplier({
      requestId,
      supplierId,
      productUrl,
      initialPriceCny: initialPriceCny !== undefined ? Number(initialPriceCny) : undefined,
      initialPriceXof: initialPriceXof !== undefined ? Number(initialPriceXof) : undefined,
      negotiatedPriceCny: negotiatedPriceCny !== undefined ? Number(negotiatedPriceCny) : undefined,
      negotiatedPriceXof: negotiatedPriceXof !== undefined ? Number(negotiatedPriceXof) : undefined,
      moq: moq !== undefined ? Number(moq) : 1,
      leadTimeDays,
      customizationAvailable: Boolean(customizationAvailable),
      sampleAvailable: Boolean(sampleAvailable),
      sampleCostXof: sampleCostXof !== undefined ? Number(sampleCostXof) : 0,
      incoterm,
      internalNotes,
      actorId: req.user!.id,
      token
    });

    if (!result.success) {
      res.status(400).json(result);
      return;
    }

    res.status(201).json({ ...result, ...result.result });
  } catch (err: any) {
    console.error('[b2bRouter] Erreur ajout fournisseur B2B:', err);
    res.status(500).json({ success: false, error: err.message || 'Erreur serveur.' });
  }
});

/**
 * 11. Création d'un devis B2B (ADMIN)
 * POST /api/b2b/requests/:id/quotes
 */
b2bRouter.post('/requests/:id/quotes', requireAdmin, async (req: Request, res: Response) => {
  try {
    const b2bRequestId = req.params.id;
    const {
      items,
      shippingXof,
      customsXof,
      feesXof,
      discountXof,
      depositRequiredPercent,
      validDays,
      transportMode,
      leadTimeDays,
      conditions,
      notes,
      supplierId,
      sourcerId
    } = req.body;

    const token = req.headers.authorization?.substring(7);
    const result = await b2bService.createQuote({
      b2bRequestId,
      items,
      shippingXof: shippingXof !== undefined ? Number(shippingXof) : 0,
      customsXof: customsXof !== undefined ? Number(customsXof) : 0,
      feesXof: feesXof !== undefined ? Number(feesXof) : 0,
      discountXof: discountXof !== undefined ? Number(discountXof) : 0,
      depositRequiredPercent: depositRequiredPercent !== undefined ? Number(depositRequiredPercent) : 50.0,
      validDays: validDays !== undefined ? Number(validDays) : 15,
      transportMode,
      leadTimeDays,
      conditions,
      notes,
      supplierId,
      sourcerId,
      createdBy: req.user!.id,
      token
    });

    if (!result.success) {
      res.status(400).json(result);
      return;
    }

    res.status(201).json({
      ...result,
      ...result.quote,
      id: result.quote?.id || result.quote?.quote_id
    });
  } catch (err: any) {
    console.error('[b2bRouter] Erreur création devis B2B:', err);
    res.status(500).json({ success: false, error: err.message || 'Erreur serveur.' });
  }
});

/**
 * 12. Envoi d'un devis au client (ADMIN)
 * POST /api/b2b/quotes/:id/send
 */
b2bRouter.post('/quotes/:id/send', requireAdmin, async (req: Request, res: Response) => {
  try {
    const quoteId = req.params.id;
    const token = req.headers.authorization?.substring(7);

    const result = await b2bService.sendQuote({
      quoteId,
      actorId: req.user!.id,
      token
    });

    if (!result.success) {
      res.status(400).json(result);
      return;
    }

    res.json(result);
  } catch (err: any) {
    console.error('[b2bRouter] Erreur envoi devis B2B:', err);
    res.status(500).json({ success: false, error: err.message || 'Erreur serveur.' });
  }
});

/**
 * 13. Acceptation d'un devis par le client (CLIENT)
 * POST /api/b2b/quotes/:id/accept
 */
b2bRouter.post('/quotes/:id/accept', requireAuth, async (req: Request, res: Response) => {
  try {
    const quoteId = req.params.id;
    const token = req.headers.authorization?.substring(7);

    const result = await b2bService.acceptQuote({
      quoteId,
      userId: req.user!.id,
      token
    });

    if (!result.success) {
      const status = result.errorCode === 'PERMISSION_DENIED' ? 403 : 400;
      res.status(status).json(result);
      return;
    }

    res.json({ ...result, ...result.result });
  } catch (err: any) {
    console.error('[b2bRouter] Erreur acceptation devis B2B:', err);
    res.status(500).json({ success: false, error: err.message || 'Erreur serveur.' });
  }
});

/**
 * 14. Refus d'un devis par le client (CLIENT)
 * POST /api/b2b/quotes/:id/reject
 */
b2bRouter.post('/quotes/:id/reject', requireAuth, async (req: Request, res: Response) => {
  try {
    const quoteId = req.params.id;
    const { reason } = req.body;
    const token = req.headers.authorization?.substring(7);

    const result = await b2bService.rejectQuote({
      quoteId,
      userId: req.user!.id,
      reason,
      token
    });

    if (!result.success) {
      const status = result.errorCode === 'PERMISSION_DENIED' ? 403 : 400;
      res.status(status).json(result);
      return;
    }

    res.json({ ...result, ...result.result });
  } catch (err: any) {
    console.error('[b2bRouter] Erreur refus devis B2B:', err);
    res.status(500).json({ success: false, error: err.message || 'Erreur serveur.' });
  }
});

/**
 * 15. Transition manuelle du statut (ADMIN)
 * POST /api/b2b/requests/:id/status
 */
b2bRouter.post('/requests/:id/status', requireAdmin, async (req: Request, res: Response) => {
  try {
    const requestId = req.params.id;
    const { status, notes } = req.body;

    if (!status) {
      res.status(400).json({ success: false, error: 'status est requis.' });
      return;
    }

    const token = req.headers.authorization?.substring(7);
    const result = await b2bService.updateStatus({
      requestId,
      newStatus: status as B2BStatus,
      actorId: req.user!.id,
      notes,
      token
    });

    if (!result.success) {
      res.status(400).json(result);
      return;
    }

    res.json({ ...result, ...result.result });
  } catch (err: any) {
    console.error('[b2bRouter] Erreur mise à jour statut B2B:', err);
    res.status(500).json({ success: false, error: err.message || 'Erreur serveur.' });
  }
});

/**
 * 16. Démarrage de la production (ADMIN)
 * POST /api/b2b/requests/:id/production/start
 */
b2bRouter.post('/requests/:id/production/start', requireAdmin, async (req: Request, res: Response) => {
  try {
    const requestId = req.params.id;
    const { expectedCompletionDate, notes } = req.body;
    const token = req.headers.authorization?.substring(7);

    const result = await b2bService.startProduction({
      requestId,
      expectedCompletionDate,
      notes,
      actorId: req.user!.id,
      token
    });

    if (!result.success) {
      res.status(400).json(result);
      return;
    }

    res.json({
      ...result,
      ...result.result,
      production_stage: result.result?.production_stage || 'in_production',
      stage: result.result?.stage || result.result?.production_stage || 'in_production'
    });
  } catch (err: any) {
    console.error('[b2bRouter] Erreur lancement production B2B:', err);
    res.status(500).json({ success: false, error: err.message || 'Erreur serveur.' });
  }
});

/**
 * 17. Mise à jour du jalon de production (ADMIN)
 * POST /api/b2b/requests/:id/production/stage
 */
b2bRouter.post('/requests/:id/production/stage', requireAdmin, async (req: Request, res: Response) => {
  try {
    const requestId = req.params.id;
    const { stage, notes } = req.body;

    const ALLOWED_STAGES = [
      'in_production',
      'production_started',
      'sample_ready',
      'sample_approved',
      'qc_inspection',
      'ready_to_ship',
      'production_completed',
      'completed'
    ];

    if (!stage || !ALLOWED_STAGES.includes(stage)) {
      res.status(400).json({
        success: false,
        errorCode: 'INVALID_STAGE',
        errorMessage: `Jalon de production invalide : ${stage || 'vide'}. Valeurs acceptées: ${ALLOWED_STAGES.join(', ')}`
      });
      return;
    }

    const token = req.headers.authorization?.substring(7);
    const result = await b2bService.updateProductionStage({
      requestId,
      stage: stage as B2BProductionStage,
      notes,
      actorId: req.user!.id,
      token
    });

    if (!result.success) {
      res.status(400).json(result);
      return;
    }

    res.json({
      ...result,
      ...result.result,
      stage: result.result?.stage || result.result?.production_stage || stage,
      production_stage: result.result?.production_stage || stage
    });
  } catch (err: any) {
    console.error('[b2bRouter] Erreur mise à jour étape production B2B:', err);
    res.status(500).json({ success: false, error: err.message || 'Erreur serveur.' });
  }
});

/**
 * 18. Transition vers l'expédition / Logistique Étape 8 (ADMIN)
 * POST /api/b2b/requests/:id/ship
 */
b2bRouter.post('/requests/:id/ship', requireAdmin, async (req: Request, res: Response) => {
  try {
    const requestId = req.params.id;
    const { carrierId, transportMode, hubId } = req.body;

    if (!carrierId) {
      res.status(400).json({ success: false, error: 'carrierId est requis pour créer l\'expédition.' });
      return;
    }

    const token = req.headers.authorization?.substring(7);
    const result = await b2bService.transitionToShipment({
      requestId,
      carrierId,
      transportMode: transportMode || 'sea',
      hubId,
      actorId: req.user!.id,
      token
    });

    if (!result.success) {
      res.status(400).json(result);
      return;
    }

    res.json({ ...result, ...result.result });
  } catch (err: any) {
    console.error('[b2bRouter] Erreur transition vers expédition B2B:', err);
    res.status(500).json({ success: false, error: err.message || 'Erreur serveur.' });
  }
});

/**
 * 19. Upload de fichier ou image B2B
 * POST /api/b2b/upload
 */
b2bRouter.post('/upload', requireAuth, async (req: Request, res: Response) => {
  try {
    const { fileName, fileType, fileSize, fileBase64, bucket } = req.body;

    if (!fileName || !fileType || !fileBase64) {
      res.status(400).json({ success: false, error: 'fileName, fileType et fileBase64 sont requis.' });
      return;
    }

    const MAX_SIZE = 10 * 1024 * 1024;
    if (fileSize && Number(fileSize) > MAX_SIZE) {
      res.status(400).json({ success: false, error: 'Fichier trop volumineux (max 10 Mo).' });
      return;
    }

    const ALLOWED_IMAGES = ['image/jpeg', 'image/png', 'image/webp'];
    const ALLOWED_DOCS = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];
    const ALL_ALLOWED = [...ALLOWED_IMAGES, ...ALLOWED_DOCS];

    if (!ALL_ALLOWED.includes(fileType.toLowerCase())) {
      res.status(400).json({
        success: false,
        error: `Format de fichier (${fileType}) non autorisé. Formats acceptés : JPG, PNG, WEBP, PDF, DOC, XLS.`
      });
      return;
    }

    const targetBucket = bucket === 'b2b-attachments' ? 'b2b-attachments' : 'b2b-images';
    const client = getSupabaseServerClient();

    const buffer = Buffer.from(fileBase64, 'base64');
    if (buffer.length > MAX_SIZE) {
      res.status(400).json({ success: false, error: 'Taille du fichier supérieure à 10 Mo.' });
      return;
    }

    const fileExt = fileName.split('.').pop() || 'bin';
    const filePath = `${req.user?.id || 'anon'}/${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${fileExt}`;

    const { error: uploadErr } = await client.storage
      .from(targetBucket)
      .upload(filePath, buffer, {
        contentType: fileType,
        upsert: true
      });

    if (uploadErr) {
      console.error('[b2bRouter] Erreur upload Supabase:', uploadErr);
      res.status(500).json({ success: false, error: uploadErr.message });
      return;
    }

    let fileUrl = '';
    if (targetBucket === 'b2b-images') {
      const { data: publicData } = client.storage.from(targetBucket).getPublicUrl(filePath);
      fileUrl = publicData.publicUrl;
    } else {
      const { data: signedData } = await client.storage.from(targetBucket).createSignedUrl(filePath, 86400);
      fileUrl = signedData?.signedUrl || filePath;
    }

    res.json({
      success: true,
      path: filePath,
      url: fileUrl,
      bucket: targetBucket,
      fileName,
      mimeType: fileType,
      size: buffer.length
    });
  } catch (err: any) {
    console.error('[b2bRouter] Erreur upload B2B:', err);
    res.status(500).json({ success: false, error: err.message || 'Erreur serveur.' });
  }
});
