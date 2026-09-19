import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { getSupabaseServerClient, AuthenticatedUser } from '../middleware/auth';
import { config } from '../config';

export class ShipmentService {
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
   * Création d'une expédition pour une commande payée (Admin & Operations uniquement)
   */
  async createShipment(params: {
    orderId: string;
    carrierId?: string;
    hubId?: string;
    origin?: string;
    destination?: string;
    notes?: string;
    token?: string;
  }): Promise<{
    success: boolean;
    shipment?: any;
    errorCode?: string;
    errorMessage?: string;
  }> {
    const client = this.getClient(params.token);

    const { data, error } = await client.rpc('create_shipment_for_order', {
      p_order_id: params.orderId,
      p_carrier_id: params.carrierId || null,
      p_hub_id: params.hubId || null,
      p_origin: params.origin || 'Chine (Yiwu/Guangzhou)',
      p_destination: params.destination || 'Sénégal (Dakar)',
      p_notes: params.notes || null
    });

    if (error || !data?.success) {
      console.warn('[ShipmentService] Création expédition rejetée:', error || data);
      return {
        success: false,
        errorCode: data?.errorCode || 'SHIPMENT_CREATION_FAILED',
        errorMessage: data?.errorMessage || error?.message || 'Impossible de créer l\'expédition.'
      };
    }

    return {
      success: true,
      shipment: data
    };
  }

  /**
   * Transition d'état atomique d'une expédition via State Machine (Admin & Operations uniquement)
   */
  async updateStatus(params: {
    shipmentId: string;
    newStatus: string;
    location?: string;
    description?: string;
    metadata?: any;
    token?: string;
  }): Promise<{
    success: boolean;
    result?: any;
    errorCode?: string;
    errorMessage?: string;
  }> {
    const client = this.getClient(params.token);

    const { data, error } = await client.rpc('update_shipment_status', {
      p_shipment_id: params.shipmentId,
      p_new_status: params.newStatus,
      p_location: params.location || null,
      p_description: params.description || null,
      p_metadata: params.metadata || {}
    });

    if (error || !data?.success) {
      console.warn('[ShipmentService] Transition statut rejetée:', error || data);
      const errMsg = error?.message || data?.errorMessage || '';
      let code = data?.errorCode || 'STATUS_UPDATE_FAILED';
      if (errMsg.includes('TERMINAL_STATE')) code = 'TERMINAL_STATE';
      else if (errMsg.includes('INVALID_TRANSITION')) code = 'INVALID_TRANSITION';
      else if (errMsg.includes('SHIPMENT_NOT_FOUND')) code = 'SHIPMENT_NOT_FOUND';
      else if (errMsg.includes('PERMISSION_DENIED')) code = 'PERMISSION_DENIED';

      return {
        success: false,
        errorCode: code,
        errorMessage: errMsg || 'Transition de statut non autorisée.'
      };
    }

    return {
      success: true,
      result: data
    };
  }

  /**
   * Récupération publique du suivi logistique d'une expédition (zéro fuite de coût)
   */
  async getPublicTracking(trackingCode: string): Promise<{
    found: boolean;
    data?: any;
  }> {
    const serverClient = getSupabaseServerClient();
    const { data, error } = await serverClient.rpc('get_public_shipment_tracking', {
      p_tracking_code: trackingCode
    });

    if (error || !data?.found) {
      return { found: false };
    }

    return {
      found: true,
      data
    };
  }

  /**
   * Récupération d'une expédition détaillée (sécurisée par RLS ou rôle)
   */
  async getShipmentById(shipmentId: string, token?: string, user?: AuthenticatedUser): Promise<{
    success: boolean;
    shipment?: any;
    events?: any[];
    documents?: any[];
    error?: string;
  }> {
    const client = this.getClient(token);

    // Récupérer le shipment
    const { data: shipment, error: sErr } = await client
      .from('shipments')
      .select(`
        *,
        carrier:carriers(id, name, mode, base_transit_days_min, base_transit_days_max, departure_frequency, status),
        hub:hubs(id, name, city, district, address, opening_hours, manager_name, manager_phone, status),
        order:orders(id, tracking_code, total_xof, order_status, payment_status, customer_name, customer_email, customer_phone, user_id)
      `)
      .eq('id', shipmentId)
      .single();

    if (sErr || !shipment) {
      return { success: false, error: 'Expédition introuvable ou accès non autorisé.' };
    }

    // Récupérer les événements
    const { data: events } = await client
      .from('shipment_events')
      .select('*')
      .eq('shipment_id', shipmentId)
      .order('created_at', { ascending: true });

    // Récupérer les documents autorisés
    let docQuery = client
      .from('documents')
      .select('id, reference, title, document_type, file_path, file_name, mime_type, file_size, visibility, created_at')
      .eq('shipment_id', shipmentId);

    // Si client, filtrer strictly non-internal
    if (!user?.isAdmin) {
      docQuery = docQuery.neq('visibility', 'internal');
    }

    const { data: documents } = await docQuery;

    return {
      success: true,
      shipment,
      events: events || [],
      documents: documents || []
    };
  }

  /**
   * Liste des expéditions (avec filtres statut, transporteur, hub, recherche)
   */
  async listShipments(filters: {
    status?: string;
    carrierId?: string;
    hubId?: string;
    orderId?: string;
    search?: string;
    limit?: number;
    offset?: number;
  }, token?: string, user?: AuthenticatedUser): Promise<{
    success: boolean;
    shipments: any[];
    total: number;
  }> {
    const client = this.getClient(token);

    let query = client
      .from('shipments')
      .select(`
        *,
        carrier:carriers(id, name, mode),
        hub:hubs(id, name, city),
        order:orders(id, tracking_code, customer_name, user_id)
      `, { count: 'exact' });

    if (filters.status) {
      query = query.eq('status', filters.status);
    }
    if (filters.carrierId) {
      query = query.eq('carrier_id', filters.carrierId);
    }
    if (filters.hubId) {
      query = query.eq('hub_id', filters.hubId);
    }
    if (filters.orderId) {
      query = query.eq('order_id', filters.orderId);
    }
    if (filters.search) {
      query = query.ilike('tracking_code', `%${filters.search.trim()}%`);
    }

    query = query.order('created_at', { ascending: false });

    if (filters.limit) {
      query = query.limit(filters.limit);
    }
    if (filters.offset) {
      query = query.range(filters.offset, filters.offset + (filters.limit || 20) - 1);
    }

    const { data, error, count } = await query;

    if (error) {
      console.error('[ShipmentService] Erreur liste expéditions:', error);
      return { success: false, shipments: [], total: 0 };
    }

    return {
      success: true,
      shipments: data || [],
      total: count || 0
    };
  }

  /**
   * Ajout d'un événement opérationnel manuel (ex: inspection, retard météo)
   */
  async addEvent(params: {
    shipmentId: string;
    eventType: string;
    status?: string;
    location: string;
    description: string;
    metadata?: any;
    token?: string;
  }): Promise<{ success: boolean; event?: any; error?: string }> {
    const client = this.getClient(params.token);

    // Vérifier l'existence de l'expédition
    const { data: shipment, error: sErr } = await client
      .from('shipments')
      .select('id, status')
      .eq('id', params.shipmentId)
      .single();

    if (sErr || !shipment) {
      return { success: false, error: 'Expédition introuvable.' };
    }

    const currentStatus = params.status || shipment.status;

    const { data: event, error: eErr } = await client
      .from('shipment_events')
      .insert({
        shipment_id: params.shipmentId,
        status: currentStatus,
        event_type: params.eventType,
        previous_status: shipment.status,
        new_status: currentStatus,
        location: params.location,
        description: params.description,
        metadata: params.metadata || {}
      })
      .select()
      .single();

    if (eErr) {
      return { success: false, error: eErr.message };
    }

    return { success: true, event };
  }
}
