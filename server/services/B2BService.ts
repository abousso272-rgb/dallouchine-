import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { config } from '../config';
import {
  B2BRequestRecord,
  B2BStatus,
  B2BProductionStage,
  CompanyRecord,
  CompanyContactRecord,
  B2BRequestSupplierRecord,
  B2BEventRecord
} from '../types/b2b';

export class B2BService {
  private getClient(token?: string): SupabaseClient {
    const url = config.supabaseUrl || process.env.VITE_SUPABASE_URL || '';
    const anonKey = config.supabaseServiceRoleKey || process.env.VITE_SUPABASE_ANON_KEY || '';

    if (token) {
      return createClient(url, anonKey, {
        global: {
          headers: {
            Authorization: `Bearer ${token}`
          }
        },
        auth: {
          persistSession: false,
          autoRefreshToken: false
        }
      });
    }

    return createClient(url, anonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false
      }
    });
  }

  // ==========================================
  // 1. GESTION DES ENTREPRISES & CONTACTS
  // ==========================================

  async createCompany(params: {
    userId?: string;
    legalName: string;
    tradeName?: string;
    registrationNumber?: string;
    sector?: string;
    country?: string;
    city?: string;
    address?: string;
    website?: string;
    phone?: string;
    email?: string;
    notes?: string;
    token?: string;
  }): Promise<{ success: boolean; company?: CompanyRecord; error?: string }> {
    const client = this.getClient(params.token);

    const { data, error } = await client
      .from('companies')
      .insert({
        user_id: params.userId || null,
        legal_name: params.legalName,
        trade_name: params.tradeName || null,
        registration_number: params.registrationNumber || null,
        sector: params.sector || null,
        country: params.country || 'Sénégal',
        city: params.city || 'Dakar',
        address: params.address || null,
        website: params.website || null,
        phone: params.phone || null,
        email: params.email || null,
        notes: params.notes || null
      })
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, company: data };
  }

  async getCompanies(params: {
    userId?: string;
    isAdmin: boolean;
    token?: string;
  }): Promise<{ success: boolean; companies?: CompanyRecord[]; error?: string }> {
    const client = this.getClient(params.token);
    let query = client.from('companies').select('*');

    if (!params.isAdmin && params.userId) {
      query = query.eq('user_id', params.userId);
    }

    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, companies: data || [] };
  }

  async addCompanyContact(params: {
    companyId: string;
    userId?: string;
    firstName: string;
    lastName: string;
    role?: string;
    email?: string;
    phone: string;
    whatsapp?: string;
    preferredContactMethod?: 'whatsapp' | 'email' | 'phone';
    isPrimary?: boolean;
    token?: string;
  }): Promise<{ success: boolean; contact?: CompanyContactRecord; error?: string }> {
    const client = this.getClient(params.token);

    const { data, error } = await client
      .from('company_contacts')
      .insert({
        company_id: params.companyId,
        user_id: params.userId || null,
        first_name: params.firstName,
        last_name: params.lastName,
        role: params.role || null,
        email: params.email || null,
        phone: params.phone,
        whatsapp: params.whatsapp || null,
        preferred_contact_method: params.preferredContactMethod || 'whatsapp',
        is_primary: params.isPrimary || false
      })
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, contact: data };
  }

  async getCompanyContacts(params: {
    companyId: string;
    token?: string;
  }): Promise<{ success: boolean; contacts?: CompanyContactRecord[]; error?: string }> {
    const client = this.getClient(params.token);

    const { data, error } = await client
      .from('company_contacts')
      .select('*')
      .eq('company_id', params.companyId)
      .order('is_primary', { ascending: false });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, contacts: data || [] };
  }

  // ==========================================
  // 2. DEMANDES B2B
  // ==========================================

  async createB2BRequest(params: {
    userId?: string;
    companyId?: string;
    contactId?: string;
    companyName?: string;
    contactName?: string;
    phone?: string;
    email?: string;
    sector?: string;
    productName?: string;
    productDescription?: string;
    productLink?: string;
    productImages?: Array<string | { url: string; name?: string }>;
    attachments?: Array<{ name: string; url: string; size?: number; mimeType?: string }>;
    quantity: number;
    budgetXof?: number;
    currency?: string;
    transportPreference?: string;
    destination?: string;
    specifications?: string;
    customization?: boolean;
    logoInstructions?: string;
    packagingRequested?: boolean;
    desiredDeadline?: string;
    notes?: string;
    token?: string;
  }): Promise<{
    success: boolean;
    request?: { id: string; code: string; status: string };
    errorCode?: string;
    errorMessage?: string;
  }> {
    const client = this.getClient(params.token);

    if (params.productLink && !/^https?:\/\//i.test(params.productLink.trim())) {
      return {
        success: false,
        errorCode: 'INVALID_URL',
        errorMessage: 'Le lien produit doit commencer par http:// ou https://'
      };
    }

    const { data, error } = await client.rpc('create_b2b_request', {
      p_user_id: params.userId || null,
      p_company_id: params.companyId || null,
      p_contact_id: params.contactId || null,
      p_company_name: params.companyName || null,
      p_contact_name: params.contactName || null,
      p_phone: params.phone || null,
      p_email: params.email || null,
      p_sector: params.sector || null,
      p_product_name: params.productName || null,
      p_product_description: params.productDescription || null,
      p_product_link: params.productLink || null,
      p_product_images: params.productImages || [],
      p_attachments: params.attachments || [],
      p_quantity: params.quantity || 1,
      p_budget_xof: params.budgetXof || null,
      p_currency: params.currency || 'XOF',
      p_transport_preference: params.transportPreference || 'recommended',
      p_destination: params.destination || 'Dakar, Sénégal',
      p_specifications: params.specifications || null,
      p_customization: params.customization || false,
      p_logo_instructions: params.logoInstructions || null,
      p_packaging_requested: params.packagingRequested || false,
      p_desired_deadline: params.desiredDeadline || null,
      p_notes: params.notes || null
    });

    if (error || !data?.success) {
      return {
        success: false,
        errorCode: 'CREATION_FAILED',
        errorMessage: error?.message || 'Erreur lors de la création de la demande B2B.'
      };
    }

    return {
      success: true,
      request: data
    };
  }

  async getRequests(params: {
    userId?: string;
    isAdmin: boolean;
    status?: string;
    search?: string;
    token?: string;
  }): Promise<{
    success: boolean;
    requests?: any[];
    error?: string;
  }> {
    const client = this.getClient(params.token);

    let query = client
      .from('b2b_requests')
      .select(`
        *,
        company:companies(id, legal_name, trade_name, registration_number, phone, email),
        contact:company_contacts(id, first_name, last_name, role, phone, email, whatsapp),
        assigned_to:profiles!b2b_requests_assigned_user_id_fkey(id, full_name, email, role),
        quotes:quotes(id, quote_number, version, status, total_xof, deposit_amount_xof, balance_due_xof, valid_until, created_at)
      `);

    if (!params.isAdmin && params.userId) {
      query = query.eq('user_id', params.userId);
    }

    if (params.status && params.status !== 'all') {
      query = query.eq('status', params.status);
    }

    if (params.search) {
      query = query.or(`code.ilike.%${params.search}%,company_name.ilike.%${params.search}%,contact_name.ilike.%${params.search}%,product_name.ilike.%${params.search}%`);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
      return { success: false, error: error.message };
    }

    const sanitized = data?.map(req => {
      if (!params.isAdmin) {
        return this.sanitizeRequestForClient(req);
      }
      return req;
    });

    return { success: true, requests: sanitized || [] };
  }

  async getRequestDetails(params: {
    requestId: string;
    userId?: string;
    isAdmin: boolean;
    token?: string;
  }): Promise<{
    success: boolean;
    request?: any;
    quotes?: any[];
    suppliers?: any[];
    events?: any[];
    errorCode?: string;
    errorMessage?: string;
  }> {
    const client = this.getClient(params.token);

    const { data: request, error: reqErr } = await client
      .from('b2b_requests')
      .select(`
        *,
        company:companies(*),
        contact:company_contacts(*),
        assigned_to:profiles!b2b_requests_assigned_user_id_fkey(id, full_name, email, role)
      `)
      .eq('id', params.requestId)
      .single();

    if (reqErr || !request) {
      return {
        success: false,
        errorCode: 'NOT_FOUND',
        errorMessage: 'Demande B2B introuvable.'
      };
    }

    if (!params.isAdmin && request.user_id !== params.userId) {
      return {
        success: false,
        errorCode: 'FORBIDDEN',
        errorMessage: 'Accès non autorisé à cette demande.'
      };
    }

    // Récupération des devis
    const { data: quotes } = await client
      .from('quotes')
      .select('*, items:quote_items(*)')
      .eq('b2b_request_id', params.requestId)
      .order('version', { ascending: false });

    // Récupération de l'historique
    const { data: events } = await client
      .from('b2b_events')
      .select('*')
      .eq('b2b_request_id', params.requestId)
      .order('created_at', { ascending: false });

    // Récupération des fournisseurs (ADMIN SEULEMENT)
    let suppliers: any[] = [];
    if (params.isAdmin) {
      const { data: sups } = await client
        .from('b2b_request_suppliers')
        .select('*, supplier:suppliers(*)')
        .eq('b2b_request_id', params.requestId);
      suppliers = sups || [];
    }

    const sanitizedQuotes = (quotes || []).map(q => {
      return params.isAdmin ? q : this.sanitizeQuoteForClient(q);
    });

    return {
      success: true,
      request: params.isAdmin ? request : this.sanitizeRequestForClient(request),
      quotes: sanitizedQuotes,
      suppliers: params.isAdmin ? suppliers : [],
      events: events || []
    };
  }

  // ==========================================
  // 3. QUALIFICATION & ASSIGNATION
  // ==========================================

  async qualifyRequest(params: {
    requestId: string;
    qualifiedBy: string;
    notes?: string;
    priority?: string;
    token?: string;
  }): Promise<{
    success: boolean;
    result?: any;
    errorCode?: string;
    errorMessage?: string;
  }> {
    const client = this.getClient(params.token);

    const { data, error } = await client.rpc('qualify_b2b_request', {
      p_request_id: params.requestId,
      p_qualified_by: params.qualifiedBy,
      p_qualification_notes: params.notes || null,
      p_business_priority: params.priority || 'standard'
    });

    if (error || !data?.success) {
      return {
        success: false,
        errorCode: 'QUALIFY_FAILED',
        errorMessage: error?.message || 'Échec de la qualification.'
      };
    }

    return { success: true, result: data };
  }

  async assignRequest(params: {
    requestId: string;
    assignedUserId: string;
    assignedBy?: string;
    token?: string;
  }): Promise<{
    success: boolean;
    result?: any;
    errorCode?: string;
    errorMessage?: string;
  }> {
    const client = this.getClient(params.token);

    const { data, error } = await client.rpc('assign_b2b_request', {
      p_request_id: params.requestId,
      p_assigned_user_id: params.assignedUserId,
      p_assigned_by: params.assignedBy || null
    });

    if (error || !data?.success) {
      return {
        success: false,
        errorCode: 'ASSIGNMENT_FAILED',
        errorMessage: error?.message || 'Échec de l\'assignation.'
      };
    }

    return { success: true, result: data };
  }

  // ==========================================
  // 4. FOURNISSEURS & NÉGOCIATION
  // ==========================================

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
    incoterm?: string;
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

    const { data, error } = await client.rpc('add_supplier_to_b2b_request', {
      p_b2b_request_id: params.requestId,
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
      p_incoterm: params.incoterm || 'FOB',
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

    return { success: true, result: data };
  }

  // ==========================================
  // 5. DEVIS B2B (Création, Envoi, Acceptation, Refus)
  // ==========================================

  async createQuote(params: {
    b2bRequestId: string;
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
    const client = this.getClient(params.token);

    if (!params.items || !Array.isArray(params.items) || params.items.length === 0) {
      return {
        success: false,
        errorCode: 'INVALID_ITEMS',
        errorMessage: 'Le devis doit comporter au moins une ligne d\'article valide.'
      };
    }

    const { data, error } = await client.rpc('create_b2b_quote', {
      p_b2b_request_id: params.b2bRequestId,
      p_items: params.items,
      p_shipping_xof: params.shippingXof || 0,
      p_customs_xof: params.customsXof || 0,
      p_fees_xof: params.feesXof || 0,
      p_discount_xof: params.discountXof || 0,
      p_deposit_required_percent: params.depositRequiredPercent !== undefined ? params.depositRequiredPercent : 50.0,
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
        errorCode: 'CREATE_QUOTE_FAILED',
        errorMessage: error?.message || 'Erreur lors du calcul et de la création du devis.'
      };
    }

    return {
      success: true,
      quote: data
    };
  }

  async sendQuote(params: {
    quoteId: string;
    actorId?: string;
    token?: string;
  }): Promise<{
    success: boolean;
    errorCode?: string;
    errorMessage?: string;
  }> {
    const client = this.getClient(params.token);

    const { data, error } = await client.rpc('send_b2b_quote', {
      p_quote_id: params.quoteId,
      p_actor_id: params.actorId || null
    });

    if (error || !data?.success) {
      return {
        success: false,
        errorCode: 'SEND_FAILED',
        errorMessage: error?.message || 'Erreur lors de l\'envoi du devis.'
      };
    }

    return { success: true };
  }

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

    const { data, error } = await client.rpc('accept_b2b_quote', {
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

    const { data, error } = await client.rpc('reject_b2b_quote', {
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

  // ==========================================
  // 6. STATUT & TRANSITIONS
  // ==========================================

  async updateStatus(params: {
    requestId: string;
    newStatus: B2BStatus;
    actorId?: string;
    notes?: string;
    token?: string;
  }): Promise<{
    success: boolean;
    result?: any;
    errorCode?: string;
    errorMessage?: string;
  }> {
    const client = this.getClient(params.token);

    const { data, error } = await client.rpc('update_b2b_status', {
      p_request_id: params.requestId,
      p_new_status: params.newStatus,
      p_actor_id: params.actorId || null,
      p_notes: params.notes || null
    });

    if (error || !data?.success) {
      return {
        success: false,
        errorCode: 'TRANSITION_FAILED',
        errorMessage: error?.message || 'Transition de statut invalide.'
      };
    }

    return {
      success: true,
      result: data
    };
  }

  // ==========================================
  // 7. PRODUCTION & EXPÉDITION
  // ==========================================

  async startProduction(params: {
    requestId: string;
    expectedCompletionDate?: string;
    notes?: string;
    actorId?: string;
    token?: string;
  }): Promise<{
    success: boolean;
    result?: any;
    errorCode?: string;
    errorMessage?: string;
  }> {
    const client = this.getClient(params.token);

    const { data, error } = await client.rpc('start_b2b_production', {
      p_request_id: params.requestId,
      p_expected_completion_date: params.expectedCompletionDate || null,
      p_notes: params.notes || null,
      p_actor_id: params.actorId || null
    });

    if (error || !data?.success) {
      return {
        success: false,
        errorCode: 'PRODUCTION_START_FAILED',
        errorMessage: error?.message || 'Impossible de lancer la production.'
      };
    }

    return { success: true, result: data };
  }

  async updateProductionStage(params: {
    requestId: string;
    stage: B2BProductionStage;
    notes?: string;
    actorId?: string;
    token?: string;
  }): Promise<{
    success: boolean;
    result?: any;
    errorCode?: string;
    errorMessage?: string;
  }> {
    const client = this.getClient(params.token);

    const { data, error } = await client.rpc('update_b2b_production_stage', {
      p_request_id: params.requestId,
      p_stage: params.stage,
      p_notes: params.notes || null,
      p_actor_id: params.actorId || null
    });

    if (error || !data?.success) {
      return {
        success: false,
        errorCode: 'PRODUCTION_STAGE_FAILED',
        errorMessage: error?.message || 'Impossible de mettre à jour le jalon de production.'
      };
    }

    return { success: true, result: data };
  }

  async transitionToShipment(params: {
    requestId: string;
    carrierId: string;
    transportMode?: string;
    hubId?: string;
    actorId?: string;
    token?: string;
  }): Promise<{
    success: boolean;
    result?: any;
    errorCode?: string;
    errorMessage?: string;
  }> {
    const client = this.getClient(params.token);

    const { data, error } = await client.rpc('transition_b2b_to_shipment', {
      p_request_id: params.requestId,
      p_carrier_id: params.carrierId,
      p_transport_mode: params.transportMode || 'sea',
      p_hub_id: params.hubId || null,
      p_actor_id: params.actorId || null
    });

    if (error || !data?.success) {
      return {
        success: false,
        errorCode: 'SHIPMENT_CREATION_FAILED',
        errorMessage: error?.message || 'Erreur lors de la création de l\'expédition B2B.'
      };
    }

    return { success: true, result: data };
  }

  // ==========================================
  // SANITISATION (Étanchéité financière)
  // ==========================================

  private sanitizeRequestForClient(request: any): any {
    if (!request) return request;
    const {
      internal_notes,
      ...safe
    } = request;
    return safe;
  }

  private sanitizeQuoteForClient(quote: any): any {
    if (!quote) return quote;
    const {
      supplier_id,
      sourcer_id,
      internal_margin_xof,
      internal_margin_percent,
      cost_price_cny,
      ...safe
    } = quote;
    return safe;
  }
}
