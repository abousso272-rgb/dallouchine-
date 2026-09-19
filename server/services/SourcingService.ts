import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { getSupabaseServerClient, AuthenticatedUser } from '../middleware/auth';
import { config } from '../config';

export class SourcingService {
  private getClient(token?: string): SupabaseClient {
    if (token) {
      const url = config.supabaseUrl || 'https://splsjtguapquznbiacad.supabase.co';
      const key = config.supabaseServiceRoleKey || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNwbHNqdGd1YXBxdXpuYmlhY2FkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk3NzYwNjYsImV4cCI6MjEwNTM1MjA2Nn0.yr8irdxSNMFI-N3K7ueOZV72uKQSVQykDpX9ioY1C4A';
      return createClient(url, key, {
        global: { headers: { Authorization: `Bearer ${token}` } },
        auth: { persistSession: false, autoRefreshToken: false }
      });
    }
    return getSupabaseServerClient();
  }

  /**
   * Création d'une demande de sourcing
   */
  async createRequest(params: {
    title: string;
    description?: string;
    productUrl?: string;
    imageUrl?: string;
    additionalImages?: string[];
    category?: string;
    quantity: number;
    budgetXof?: number;
    currency?: string;
    customization?: boolean;
    customizationDetails?: string;
    specifications?: string;
    desiredDeadline?: string;
    destination?: string;
    attachments?: Array<{ name: string; url: string; size?: number; mimeType?: string }>;
    clientName?: string;
    clientPhone?: string;
    clientEmail?: string;
    clientCompany?: string;
    userId?: string;
    token?: string;
  }): Promise<{
    success: boolean;
    request?: any;
    errorCode?: string;
    errorMessage?: string;
  }> {
    // 1. Validation basique
    if (!params.title || params.title.trim().length === 0) {
      return { success: false, errorCode: 'INVALID_TITLE', errorMessage: 'Le titre du produit est obligatoire.' };
    }
    if (!params.quantity || params.quantity <= 0) {
      return { success: false, errorCode: 'INVALID_QUANTITY', errorMessage: 'La quantité doit être supérieure à 0.' };
    }

    // 2. Validation URL si fournie
    if (params.productUrl && params.productUrl.trim().length > 0) {
      try {
        const parsed = new URL(params.productUrl.trim());
        if (!['http:', 'https:'].includes(parsed.protocol)) {
          return { success: false, errorCode: 'INVALID_URL', errorMessage: 'Le lien produit doit débuter par http:// ou https://.' };
        }
      } catch {
        return { success: false, errorCode: 'INVALID_URL', errorMessage: 'Format d\'URL produit invalide.' };
      }
    }

    const client = this.getClient(params.token);

    const { data, error } = await client.rpc('create_sourcing_request', {
      p_title: params.title.trim(),
      p_description: params.description || '',
      p_product_url: params.productUrl?.trim() || null,
      p_image_url: params.imageUrl || null,
      p_additional_images: params.additionalImages || [],
      p_category: params.category || 'Général',
      p_quantity: params.quantity,
      p_budget_xof: params.budgetXof || null,
      p_currency: params.currency || 'XOF',
      p_customization: params.customization || false,
      p_customization_details: params.customizationDetails || null,
      p_specifications: params.specifications || null,
      p_desired_deadline: params.desiredDeadline || null,
      p_destination: params.destination || 'Dakar, Sénégal',
      p_attachments: params.attachments || [],
      p_client_name: params.clientName || '',
      p_client_phone: params.clientPhone || '',
      p_client_email: params.clientEmail || null,
      p_client_company: params.clientCompany || null,
      p_user_id: params.userId || null
    });

    if (error || !data?.success) {
      console.warn('[SourcingService] Erreur création demande:', error || data);
      return {
        success: false,
        errorCode: 'CREATION_FAILED',
        errorMessage: error?.message || data?.errorMessage || 'Erreur lors de la création de la demande.'
      };
    }

    return {
      success: true,
      request: data
    };
  }

  /**
   * Récupération des demandes (filtrées selon le rôle)
   */
  async getRequests(params: {
    userId?: string;
    isAdmin: boolean;
    token?: string;
  }): Promise<{
    success: boolean;
    requests: any[];
  }> {
    const client = this.getClient(params.token);

    let query = client
      .from('sourcing_requests')
      .select(`
        *,
        assigned_sourcer:sourcers!sourcing_requests_assigned_sourcer_id_fkey(id, name, location_city),
        quotes:quotes(id, quote_number, version, total_xof, status, valid_until)
      `)
      .order('created_at', { ascending: false });

    // Client normal: ses propres demandes uniquement
    if (!params.isAdmin) {
      if (!params.userId) {
        return { success: true, requests: [] };
      }
      query = query.eq('user_id', params.userId);
    }

    const { data, error } = await query;
    if (error) {
      console.error('[SourcingService] Erreur récupération demandes:', error);
      return { success: false, requests: [] };
    }

    return {
      success: true,
      requests: data || []
    };
  }

  /**
   * Détail complet d'une demande de sourcing
   */
  async getRequestDetails(params: {
    requestId: string;
    userId?: string;
    isAdmin: boolean;
    token?: string;
  }): Promise<{
    success: boolean;
    request?: any;
    events?: any[];
    quotes?: any[];
    suppliers?: any[];
    errorCode?: string;
    errorMessage?: string;
  }> {
    const client = this.getClient(params.token);

    // 1. Demande de sourcing
    const { data: req, error: reqErr } = await client
      .from('sourcing_requests')
      .select(`
        *,
        assigned_sourcer:sourcers!sourcing_requests_assigned_sourcer_id_fkey(id, name, location_city, phone, email)
      `)
      .eq('id', params.requestId)
      .single();

    if (reqErr || !req) {
      return { success: false, errorCode: 'NOT_FOUND', errorMessage: 'Demande de sourcing introuvable.' };
    }

    // Contrôle RLS ownership
    if (!params.isAdmin && req.user_id !== params.userId) {
      return { success: false, errorCode: 'FORBIDDEN', errorMessage: 'Accès interdit à cette demande.' };
    }

    // 2. Événements chronologiques
    let eventsQuery = client
      .from('sourcing_events')
      .select('*')
      .eq('sourcing_request_id', params.requestId)
      .order('created_at', { ascending: true });

    if (!params.isAdmin) {
      // Filtrer les événements internes pour le client
      eventsQuery = eventsQuery.or('metadata->>visibility.is.null,metadata->>visibility.neq.internal');
    }
    const { data: events } = await eventsQuery;

    // 3. Devis associés
    let quotesQuery = client
      .from('quotes')
      .select(`
        *,
        items:quote_items(*)
      `)
      .eq('sourcing_request_id', params.requestId)
      .order('version', { ascending: false });

    if (!params.isAdmin) {
      // Pour le client: devis envoyés ou validés (pas les brouillons internes)
      quotesQuery = quotesQuery.neq('status', 'draft');
    }
    const { data: quotes } = await quotesQuery;

    // 4. Fournisseurs comparés (ADMIN UNIQUEMENT - STRICTEMENT MASQUÉ AU CLIENT)
    let suppliers: any[] = [];
    if (params.isAdmin) {
      const { data: sups } = await client
        .from('sourcing_request_suppliers')
        .select(`
          *,
          supplier:suppliers(*)
        `)
        .eq('sourcing_request_id', params.requestId);
      suppliers = sups || [];
    }

    return {
      success: true,
      request: req,
      events: events || [],
      quotes: quotes || [],
      suppliers
    };
  }

  /**
   * Transition de statut d'une demande
   */
  async updateStatus(params: {
    requestId: string;
    newStatus: string;
    notes?: string;
    actorId?: string;
    actorRole?: string;
    token?: string;
  }): Promise<{
    success: boolean;
    result?: any;
    errorCode?: string;
    errorMessage?: string;
  }> {
    const client = this.getClient(params.token);

    const { data, error } = await client.rpc('update_sourcing_status', {
      p_request_id: params.requestId,
      p_new_status: params.newStatus,
      p_notes: params.notes || null,
      p_actor_id: params.actorId || null,
      p_actor_role: params.actorRole || 'admin'
    });

    if (error || !data?.success) {
      const msg = error?.message || data?.errorMessage || '';
      let code = 'STATUS_UPDATE_FAILED';
      if (msg.includes('TERMINAL_STATE')) code = 'TERMINAL_STATE';
      else if (msg.includes('INVALID_TRANSITION')) code = 'INVALID_TRANSITION';
      else if (msg.includes('REQUEST_NOT_FOUND')) code = 'REQUEST_NOT_FOUND';

      return {
        success: false,
        errorCode: code,
        errorMessage: msg || 'Transition de statut refusée.'
      };
    }

    return {
      success: true,
      result: data
    };
  }

  /**
   * Assignation d'un sourceur à une demande
   */
  async assignSourcer(params: {
    requestId: string;
    sourcerId: string;
    assignedBy?: string;
    token?: string;
  }): Promise<{
    success: boolean;
    result?: any;
    errorCode?: string;
    errorMessage?: string;
  }> {
    const client = this.getClient(params.token);

    const { data, error } = await client.rpc('assign_sourcing_request', {
      p_request_id: params.requestId,
      p_sourcer_id: params.sourcerId,
      p_assigned_by: params.assignedBy || null
    });

    if (error || !data?.success) {
      return {
        success: false,
        errorCode: 'ASSIGNMENT_FAILED',
        errorMessage: error?.message || 'Erreur lors de l\'assignation du sourceur.'
      };
    }

    return {
      success: true,
      result: data
    };
  }

  /**
   * Enregistrement d'un fournisseur pour une demande
   */
  async addSupplier(params: {
    requestId: string;
    supplierId: string;
    productUrl?: string;
    initialPriceCny?: number;
    initialPriceXof?: number;
    negotiatedPriceCny?: number;
    negotiatedPriceXof?: number;
    moq?: number;
    leadTimeDays?: string;
    customizationAvailable?: boolean;
    sampleAvailable?: boolean;
    sampleCostXof?: number;
    internalNotes?: string;
    actorId?: string;
    token?: string;
  }): Promise<{
    success: boolean;
    result?: any;
    errorCode?: string;
    errorMessage?: string;
  }> {
    const client = this.getClient(params.token);

    const { data, error } = await client.rpc('add_supplier_to_request', {
      p_sourcing_request_id: params.requestId,
      p_supplier_id: params.supplierId,
      p_product_url: params.productUrl || null,
      p_initial_price_cny: params.initialPriceCny || null,
      p_initial_price_xof: params.initialPriceXof || null,
      p_negotiated_price_cny: params.negotiatedPriceCny || null,
      p_negotiated_price_xof: params.negotiatedPriceXof || null,
      p_moq: params.moq || 1,
      p_lead_time_days: params.leadTimeDays || '10-15 jours',
      p_customization_available: params.customizationAvailable || false,
      p_sample_available: params.sampleAvailable || false,
      p_sample_cost_xof: params.sampleCostXof || 0,
      p_internal_notes: params.internalNotes || null,
      p_actor_id: params.actorId || null
    });

    if (error || !data?.success) {
      return {
        success: false,
        errorCode: 'ADD_SUPPLIER_FAILED',
        errorMessage: error?.message || 'Erreur lors de l\'enregistrement du fournisseur.'
      };
    }

    return {
      success: true,
      result: data
    };
  }

  /**
   * Création d'un devis client avec recalcul serveur
   */
  async createQuote(params: {
    sourcingRequestId: string;
    items: Array<{ description: string; quantity: number; unit_price_xof: number }>;
    shippingXof?: number;
    customsXof?: number;
    feesXof?: number;
    discountXof?: number;
    depositRequiredPercent?: number;
    validDays?: number;
    transportMode?: string;
    leadTimeDays?: string;
    conditions?: string[];
    notes?: string;
    supplierId?: string;
    sourcerId?: string;
    createdBy?: string;
    token?: string;
  }): Promise<{
    success: boolean;
    quote?: any;
    errorCode?: string;
    errorMessage?: string;
  }> {
    if (!params.items || params.items.length === 0) {
      return { success: false, errorCode: 'ITEMS_REQUIRED', errorMessage: 'Au moins un article de devis est requis.' };
    }

    const client = this.getClient(params.token);

    const { data, error } = await client.rpc('create_sourcing_quote', {
      p_sourcing_request_id: params.sourcingRequestId,
      p_items: params.items,
      p_shipping_xof: params.shippingXof || 0,
      p_customs_xof: params.customsXof || 0,
      p_fees_xof: params.feesXof || 0,
      p_discount_xof: params.discountXof || 0,
      p_deposit_required_percent: params.depositRequiredPercent || 50.0,
      p_valid_days: params.validDays || 15,
      p_transport_mode: params.transportMode || 'air',
      p_lead_time_days: params.leadTimeDays || '15-20 jours',
      p_conditions: params.conditions || [],
      p_notes: params.notes || null,
      p_supplier_id: params.supplierId || null,
      p_sourcer_id: params.sourcerId || null,
      p_created_by: params.createdBy || null
    });

    if (error || !data?.success) {
      return {
        success: false,
        errorCode: 'QUOTE_CREATION_FAILED',
        errorMessage: error?.message || 'Erreur lors de la création du devis.'
      };
    }

    return {
      success: true,
      quote: data
    };
  }

  /**
   * Envoi du devis au client (status draft -> sent)
   */
  async sendQuote(params: {
    quoteId: string;
    actorId?: string;
    token?: string;
  }): Promise<{
    success: boolean;
    quote?: any;
    errorCode?: string;
    errorMessage?: string;
  }> {
    const client = this.getClient(params.token);

    const { data: quote, error: qErr } = await client
      .from('quotes')
      .select('*, sourcing_requests(id, code, user_id)')
      .eq('id', params.quoteId)
      .single();

    if (qErr || !quote) {
      return { success: false, errorCode: 'QUOTE_NOT_FOUND', errorMessage: 'Devis introuvable.' };
    }

    // Mise à jour du devis en 'sent'
    const { error: updErr } = await client
      .from('quotes')
      .update({ status: 'sent', updated_at: new Date().toISOString() })
      .eq('id', params.quoteId);

    if (updErr) {
      return { success: false, errorCode: 'UPDATE_FAILED', errorMessage: updErr.message };
    }

    // Mise à jour de la demande en 'quote_sent'
    if (quote.sourcing_request_id) {
      await client
        .from('sourcing_requests')
        .update({ status: 'quote_sent', updated_at: new Date().toISOString() })
        .eq('id', quote.sourcing_request_id);

      // Audit event
      await client.from('sourcing_events').insert({
        sourcing_request_id: quote.sourcing_request_id,
        event_type: 'quote_sent',
        actor_user_id: params.actorId || null,
        actor_role: 'admin',
        title: 'Devis officiel transmis au client',
        description: `Le devis ${quote.quote_number} de ${quote.total_xof} XOF a été émis au client.`,
        metadata: { quote_id: params.quoteId, version: quote.version }
      });

      // Notification au client
      if (quote.user_id) {
        await client.from('notifications').insert({
          user_id: quote.user_id,
          title: 'Devis de sourcing disponible !',
          message: `Le devis officiel pour votre dossier ${quote.quote_number} est prêt. Montant total : ${quote.total_xof} XOF.`,
          type: 'sourcing_quote_sent',
          is_read: false,
          data: {
            quote_id: params.quoteId,
            quote_number: quote.quote_number,
            sourcing_request_id: quote.sourcing_request_id
          }
        });
      }
    }

    return {
      success: true,
      quote: { ...quote, status: 'sent' }
    };
  }

  /**
   * Acceptation d'un devis par le client
   */
  async acceptQuote(params: {
    quoteId: string;
    userId: string;
    token?: string;
  }): Promise<{
    success: boolean;
    result?: any;
    errorCode?: string;
    errorMessage?: string;
  }> {
    const client = this.getClient(params.token);

    const { data, error } = await client.rpc('accept_sourcing_quote', {
      p_quote_id: params.quoteId,
      p_user_id: params.userId
    });

    if (error || !data?.success) {
      const code = data?.code || (error?.message?.includes('PERMISSION_DENIED') ? 'PERMISSION_DENIED' : 'ACCEPT_FAILED');
      return {
        success: false,
        errorCode: code,
        errorMessage: data?.error || error?.message || 'Impossible d\'accepter ce devis.'
      };
    }

    return {
      success: true,
      result: data
    };
  }

  /**
   * Refus d'un devis par le client
   */
  async rejectQuote(params: {
    quoteId: string;
    userId: string;
    reason?: string;
    token?: string;
  }): Promise<{
    success: boolean;
    result?: any;
    errorCode?: string;
    errorMessage?: string;
  }> {
    const client = this.getClient(params.token);

    const { data, error } = await client.rpc('reject_sourcing_quote', {
      p_quote_id: params.quoteId,
      p_user_id: params.userId,
      p_reason: params.reason || null
    });

    if (error || !data?.success) {
      return {
        success: false,
        errorCode: data?.code || 'REJECT_FAILED',
        errorMessage: data?.error || error?.message || 'Erreur lors du refus du devis.'
      };
    }

    return {
      success: true,
      result: data
    };
  }

  /**
   * Consultation d'un devis spécifique
   */
  async getQuote(params: {
    quoteId: string;
    userId?: string;
    isAdmin: boolean;
    token?: string;
  }): Promise<{
    success: boolean;
    quote?: any;
    errorCode?: string;
    errorMessage?: string;
  }> {
    const client = this.getClient(params.token);

    const { data, error } = await client
      .from('quotes')
      .select('*, items:quote_items(*)')
      .eq('id', params.quoteId)
      .single();

    if (error || !data) {
      return { success: false, errorCode: 'NOT_FOUND', errorMessage: 'Devis introuvable.' };
    }

    if (!params.isAdmin && data.user_id !== params.userId) {
      return { success: false, errorCode: 'FORBIDDEN', errorMessage: 'Accès interdit à ce devis.' };
    }

    return {
      success: true,
      quote: data
    };
  }
}
