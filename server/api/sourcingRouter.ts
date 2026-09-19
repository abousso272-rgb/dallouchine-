import { Router, Request, Response } from 'express';
import { requireAuth, requireAdmin, optionalAuth, getSupabaseServerClient } from '../middleware/auth';
import { SourcingService } from '../services/SourcingService';

export const sourcingRouter = Router();
const sourcingService = new SourcingService();

/**
 * 1. Création d'une demande de sourcing
 * POST /api/sourcing/requests
 */
sourcingRouter.post('/requests', optionalAuth, async (req: Request, res: Response) => {
  try {
    const {
      title,
      productName,
      description,
      productDescription,
      productUrl,
      productLink,
      imageUrl,
      additionalImages,
      category,
      quantity,
      budgetXof,
      targetBudget,
      currency,
      customization,
      customizationDetails,
      specifications,
      desiredDeadline,
      destination,
      attachments,
      clientName,
      clientPhone,
      clientEmail,
      clientCompany
    } = req.body;

    const finalTitle = title || productName;
    const finalDescription = description || productDescription;
    const finalUrl = productUrl || productLink;
    const finalBudget = budgetXof !== undefined ? budgetXof : targetBudget;

    const token = req.headers.authorization?.startsWith('Bearer ')
      ? req.headers.authorization.substring(7)
      : undefined;

    const result = await sourcingService.createRequest({
      title: finalTitle,
      description: finalDescription,
      productUrl: finalUrl,
      imageUrl,
      additionalImages,
      category,
      quantity: Number(quantity) || 1,
      budgetXof: finalBudget ? Number(finalBudget) : undefined,
      currency: currency || 'XOF',
      customization: Boolean(customization),
      customizationDetails,
      specifications,
      desiredDeadline,
      destination,
      attachments,
      clientName,
      clientPhone,
      clientEmail,
      clientCompany,
      userId: req.user?.id,
      token
    });

    if (!result.success) {
      const status = result.errorCode === 'INVALID_URL' || result.errorCode === 'INVALID_TITLE' || result.errorCode === 'INVALID_QUANTITY' ? 400 : 422;
      res.status(status).json(result);
      return;
    }

    res.status(201).json(result);
  } catch (err: any) {
    console.error('[sourcingRouter] Erreur création demande:', err);
    res.status(500).json({ success: false, error: err.message || 'Erreur serveur.' });
  }
});

/**
 * 2. Liste des demandes de sourcing
 * GET /api/sourcing/requests
 */
sourcingRouter.get('/requests', requireAuth, async (req: Request, res: Response) => {
  try {
    const token = req.headers.authorization?.substring(7);
    const result = await sourcingService.getRequests({
      userId: req.user?.id,
      isAdmin: req.user?.isAdmin || false,
      token
    });

    res.json(result);
  } catch (err: any) {
    console.error('[sourcingRouter] Erreur liste demandes:', err);
    res.status(500).json({ success: false, error: err.message || 'Erreur serveur.' });
  }
});

/**
 * 3. Détail d'une demande de sourcing
 * GET /api/sourcing/requests/:id
 */
sourcingRouter.get('/requests/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const token = req.headers.authorization?.substring(7);
    const result = await sourcingService.getRequestDetails({
      requestId: req.params.id,
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
    console.error('[sourcingRouter] Erreur détail demande:', err);
    res.status(500).json({ success: false, error: err.message || 'Erreur serveur.' });
  }
});

/**
 * 4. Transition de statut d'une demande (Admin / Sourcer)
 * PATCH /api/sourcing/requests/:id/status
 */
sourcingRouter.patch('/requests/:id/status', requireAuth, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { status, notes } = req.body;
    if (!status) {
      res.status(400).json({ success: false, error: 'Le champ status est requis.' });
      return;
    }

    const token = req.headers.authorization?.substring(7);
    const result = await sourcingService.updateStatus({
      requestId: req.params.id,
      newStatus: status,
      notes,
      actorId: req.user?.id,
      actorRole: req.user?.role || 'admin',
      token
    });

    if (!result.success) {
      let code = 400;
      if (result.errorCode === 'TERMINAL_STATE') code = 409;
      else if (result.errorCode === 'INVALID_TRANSITION') code = 422;
      else if (result.errorCode === 'REQUEST_NOT_FOUND') code = 404;

      res.status(code).json(result);
      return;
    }

    res.json(result);
  } catch (err: any) {
    console.error('[sourcingRouter] Erreur transition statut:', err);
    res.status(500).json({ success: false, error: err.message || 'Erreur serveur.' });
  }
});

/**
 * 5. Assignation d'un sourceur à une demande (Admin)
 * POST /api/sourcing/requests/:id/assign
 */
sourcingRouter.post('/requests/:id/assign', requireAuth, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { sourcerId } = req.body;
    if (!sourcerId) {
      res.status(400).json({ success: false, error: 'Le champ sourcerId est requis.' });
      return;
    }

    const token = req.headers.authorization?.substring(7);
    const result = await sourcingService.assignSourcer({
      requestId: req.params.id,
      sourcerId,
      assignedBy: req.user?.id,
      token
    });

    if (!result.success) {
      res.status(400).json(result);
      return;
    }

    res.json({ ...result, ...result.result });
  } catch (err: any) {
    console.error('[sourcingRouter] Erreur assignation sourceur:', err);
    res.status(500).json({ success: false, error: err.message || 'Erreur serveur.' });
  }
});

/**
 * 6. Enregistrement / comparaison d'un fournisseur pour une demande (Admin / Sourcer)
 * POST /api/sourcing/requests/:id/suppliers
 */
sourcingRouter.post('/requests/:id/suppliers', requireAuth, requireAdmin, async (req: Request, res: Response) => {
  try {
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
      internalNotes
    } = req.body;

    if (!supplierId) {
      res.status(400).json({ success: false, error: 'Le champ supplierId est requis.' });
      return;
    }

    const token = req.headers.authorization?.substring(7);
    const result = await sourcingService.addSupplier({
      requestId: req.params.id,
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
      internalNotes,
      actorId: req.user?.id,
      token
    });

    if (!result.success) {
      res.status(400).json(result);
      return;
    }

    res.status(201).json({ ...result, ...result.result });
  } catch (err: any) {
    console.error('[sourcingRouter] Erreur ajout fournisseur:', err);
    res.status(500).json({ success: false, error: err.message || 'Erreur serveur.' });
  }
});

/**
 * 7. Consultation des fournisseurs pour une demande (Admin / Sourcer uniquement)
 * GET /api/sourcing/requests/:id/suppliers
 */
sourcingRouter.get('/requests/:id/suppliers', requireAuth, requireAdmin, async (req: Request, res: Response) => {
  try {
    const token = req.headers.authorization?.substring(7);
    const client = getSupabaseServerClient();
    const { data, error } = await client
      .from('sourcing_request_suppliers')
      .select('*, supplier:suppliers(*)')
      .eq('sourcing_request_id', req.params.id);

    if (error) {
      res.status(500).json({ success: false, error: error.message });
      return;
    }

    res.json({ success: true, suppliers: data || [] });
  } catch (err: any) {
    console.error('[sourcingRouter] Erreur récupération fournisseurs:', err);
    res.status(500).json({ success: false, error: err.message || 'Erreur serveur.' });
  }
});

/**
 * 8. Création d'un devis client avec recalcul serveur (Admin / Sourcer)
 * POST /api/sourcing/requests/:id/quotes
 */
sourcingRouter.post('/requests/:id/quotes', requireAuth, requireAdmin, async (req: Request, res: Response) => {
  try {
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
    const result = await sourcingService.createQuote({
      sourcingRequestId: req.params.id,
      items,
      shippingXof: Number(shippingXof) || 0,
      customsXof: Number(customsXof) || 0,
      feesXof: Number(feesXof) || 0,
      discountXof: Number(discountXof) || 0,
      depositRequiredPercent: depositRequiredPercent !== undefined ? Number(depositRequiredPercent) : 50.0,
      validDays: Number(validDays) || 15,
      transportMode,
      leadTimeDays,
      conditions,
      notes,
      supplierId,
      sourcerId,
      createdBy: req.user?.id,
      token
    });

    if (!result.success) {
      res.status(400).json(result);
      return;
    }

    res.status(201).json(result);
  } catch (err: any) {
    console.error('[sourcingRouter] Erreur création devis:', err);
    res.status(500).json({ success: false, error: err.message || 'Erreur serveur.' });
  }
});

/**
 * 9. Envoi d'un devis au client (Admin / Sourcer)
 * POST /api/sourcing/quotes/:id/send
 */
sourcingRouter.post('/quotes/:id/send', requireAuth, requireAdmin, async (req: Request, res: Response) => {
  try {
    const token = req.headers.authorization?.substring(7);
    const result = await sourcingService.sendQuote({
      quoteId: req.params.id,
      actorId: req.user?.id,
      token
    });

    if (!result.success) {
      res.status(400).json(result);
      return;
    }

    res.json(result);
  } catch (err: any) {
    console.error('[sourcingRouter] Erreur envoi devis:', err);
    res.status(500).json({ success: false, error: err.message || 'Erreur serveur.' });
  }
});

/**
 * 10. Consultation d'un devis
 * GET /api/sourcing/quotes/:id
 */
sourcingRouter.get('/quotes/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const token = req.headers.authorization?.substring(7);
    const result = await sourcingService.getQuote({
      quoteId: req.params.id,
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
    console.error('[sourcingRouter] Erreur consultation devis:', err);
    res.status(500).json({ success: false, error: err.message || 'Erreur serveur.' });
  }
});

/**
 * 11. Acceptation d'un devis par le client
 * POST /api/sourcing/quotes/:id/accept
 */
sourcingRouter.post('/quotes/:id/accept', requireAuth, async (req: Request, res: Response) => {
  try {
    const token = req.headers.authorization?.substring(7);
    const result = await sourcingService.acceptQuote({
      quoteId: req.params.id,
      userId: req.user!.id,
      token
    });

    if (!result.success) {
      let status = 400;
      if (result.errorCode === 'PERMISSION_DENIED') status = 403;
      else if (result.errorCode === 'QUOTE_EXPIRED' || result.errorCode === 'INVALID_QUOTE_STATUS') status = 422;

      res.status(status).json(result);
      return;
    }

    res.json({ ...result, ...result.result });
  } catch (err: any) {
    console.error('[sourcingRouter] Erreur acceptation devis:', err);
    res.status(500).json({ success: false, error: err.message || 'Erreur serveur.' });
  }
});

/**
 * 12. Refus d'un devis par le client
 * POST /api/sourcing/quotes/:id/reject
 */
sourcingRouter.post('/quotes/:id/reject', requireAuth, async (req: Request, res: Response) => {
  try {
    const { reason } = req.body;
    const token = req.headers.authorization?.substring(7);
    const result = await sourcingService.rejectQuote({
      quoteId: req.params.id,
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
    console.error('[sourcingRouter] Erreur refus devis:', err);
    res.status(500).json({ success: false, error: err.message || 'Erreur serveur.' });
  }
});


/**
 * 13. Validation & Upload de fichier (image ou document)
 * POST /api/sourcing/upload
 */
sourcingRouter.post('/upload', requireAuth, async (req: Request, res: Response) => {
  try {
    const { fileName, fileType, fileSize, fileBase64, bucket } = req.body;

    if (!fileName || !fileType || !fileBase64) {
      res.status(400).json({ success: false, error: 'fileName, fileType et fileBase64 sont requis.' });
      return;
    }

    // 1. Limite de taille: 10 Mo
    const MAX_SIZE = 10 * 1024 * 1024;
    if (fileSize && Number(fileSize) > MAX_SIZE) {
      res.status(400).json({ success: false, error: 'Fichier trop volumineux. La limite maximale est de 10 Mo.' });
      return;
    }

    // 2. Types MIME autorisés
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
        error: `Type de fichier non autorisé (${fileType}). Formats autorisés : JPG, PNG, WEBP, PDF, DOC, XLS.`
      });
      return;
    }

    const targetBucket = bucket === 'sourcing-attachments' ? 'sourcing-attachments' : 'sourcing-images';
    const client = getSupabaseServerClient();

    // Décodage Base64
    const buffer = Buffer.from(fileBase64, 'base64');
    if (buffer.length > MAX_SIZE) {
      res.status(400).json({ success: false, error: 'Taille du fichier décodé supérieure à 10 Mo.' });
      return;
    }

    const fileExt = fileName.split('.').pop() || 'bin';
    const filePath = `${req.user?.id || 'anon'}/${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${fileExt}`;

    const { data: uploadData, error: uploadErr } = await client.storage
      .from(targetBucket)
      .upload(filePath, buffer, {
        contentType: fileType,
        upsert: true
      });

    if (uploadErr) {
      console.error('[sourcingRouter] Erreur upload Supabase:', uploadErr);
      res.status(500).json({ success: false, error: uploadErr.message });
      return;
    }

    // URL publique ou signée
    let fileUrl = '';
    if (targetBucket === 'sourcing-images') {
      const { data: publicData } = client.storage.from(targetBucket).getPublicUrl(filePath);
      fileUrl = publicData.publicUrl;
    } else {
      // Fichier privé : URL signée 24h
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
    console.error('[sourcingRouter] Erreur upload:', err);
    res.status(500).json({ success: false, error: err.message || 'Erreur serveur.' });
  }
});
