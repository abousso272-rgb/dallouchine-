/**
 * CLIENT SERVICE LOGISTIQUE & EXPÉDITIONS — DALLOU CHINE
 * Communique avec les endpoints certifiés /api/shipments
 * Respecte strictement la séparation entre données publiques et données internes
 */

import { supabase } from './supabase';

export interface PublicTrackingMilestone {
  id: string;
  event_type: string;
  status: string;
  location: string;
  description: string;
  created_at: string;
}

export interface PublicTrackingDetails {
  found: boolean;
  shipment_id?: string;
  tracking_code?: string;
  order_tracking_code?: string;
  status?: string;
  origin?: string;
  destination?: string;
  transport_mode?: 'air' | 'sea' | 'express';
  carrier_name?: string;
  hub_name?: string;
  hub_city?: string;
  hub_address?: string;
  estimated_departure?: string;
  estimated_arrival?: string;
  actual_departure?: string;
  actual_arrival?: string;
  created_at?: string;
  events?: PublicTrackingMilestone[];
}

export interface ShipmentItem {
  id: string;
  order_id?: string;
  tracking_code: string;
  carrier_id?: string;
  hub_id?: string;
  origin: string;
  destination: string;
  transport_mode: 'air' | 'sea' | 'express';
  status: string;
  estimated_departure?: string;
  estimated_arrival?: string;
  actual_departure?: string;
  actual_arrival?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  carrier?: { id: string; name: string; mode: string };
  hub?: { id: string; name: string; city: string };
  order?: { id: string; tracking_code: string; customer_name?: string; user_id?: string };
}

class ShipmentService {
  private baseUrl = '/api/shipments';

  private async getAuthHeader(): Promise<Record<string, string>> {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.access_token) {
      return { Authorization: `Bearer ${session.access_token}` };
    }
    return {};
  }

  /**
   * 1. Recherche publique / client par code de suivi
   */
  async getPublicTracking(trackingCode: string): Promise<PublicTrackingDetails> {
    try {
      const res = await fetch(`${this.baseUrl}/tracking/${encodeURIComponent(trackingCode.trim())}`);
      const data = await res.json();
      if (!res.ok || !data.success) {
        return { found: false };
      }
      return data.data;
    } catch (err) {
      console.error('[ShipmentService] Erreur tracking:', err);
      // Fallback Supabase RPC direct
      const { data } = await (supabase as any).rpc('get_public_shipment_tracking', {
        p_tracking_code: trackingCode.trim()
      });
      return data || { found: false };
    }
  }

  /**
   * 2. Liste des expéditions (filtrée selon les droits de session)
   */
  async getShipments(filters: {
    status?: string;
    carrierId?: string;
    hubId?: string;
    orderId?: string;
    search?: string;
    limit?: number;
    offset?: number;
  } = {}): Promise<{ shipments: ShipmentItem[]; total: number }> {
    try {
      const headers = await this.getAuthHeader();
      const params = new URLSearchParams();
      if (filters.status) params.append('status', filters.status);
      if (filters.carrierId) params.append('carrierId', filters.carrierId);
      if (filters.hubId) params.append('hubId', filters.hubId);
      if (filters.orderId) params.append('orderId', filters.orderId);
      if (filters.search) params.append('search', filters.search);
      if (filters.limit) params.append('limit', String(filters.limit));
      if (filters.offset) params.append('offset', String(filters.offset));

      const res = await fetch(`${this.baseUrl}?${params.toString()}`, { headers });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Erreur lors de la récupération des expéditions.');
      }
      return { shipments: data.shipments || [], total: data.total || 0 };
    } catch (err) {
      console.error('[ShipmentService] getShipments fallback Supabase direct:', err);
      let query = (supabase as any).from('shipments').select(`
        *,
        carrier:carriers(id, name, mode),
        hub:hubs(id, name, city),
        order:orders(id, tracking_code, customer_name, user_id)
      `, { count: 'exact' });

      if (filters.status) query = query.eq('status', filters.status);
      if (filters.carrierId) query = query.eq('carrier_id', filters.carrierId);
      if (filters.hubId) query = query.eq('hub_id', filters.hubId);
      if (filters.orderId) query = query.eq('order_id', filters.orderId);
      if (filters.search) query = query.ilike('tracking_code', `%${filters.search.trim()}%`);

      query = query.order('created_at', { ascending: false });

      const { data, count } = await query;
      return { shipments: data || [], total: count || 0 };
    }
  }

  /**
   * 3. Détails d'une expédition avec timeline et documents
   */
  async getShipmentById(id: string): Promise<{
    shipment: ShipmentItem;
    events: any[];
    documents: any[];
  }> {
    const headers = await this.getAuthHeader();
    const res = await fetch(`${this.baseUrl}/${id}`, { headers });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Expédition introuvable.');
    }
    return {
      shipment: data.shipment,
      events: data.events || [],
      documents: data.documents || []
    };
  }

  /**
   * 4. Création d'une expédition (Équipes Opérations / Admin)
   */
  async createShipment(params: {
    orderId: string;
    carrierId?: string;
    hubId?: string;
    origin?: string;
    destination?: string;
    notes?: string;
  }): Promise<any> {
    const headers = await this.getAuthHeader();
    const res = await fetch(this.baseUrl, {
      method: 'POST',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify(params)
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Impossible de créer l\'expédition.');
    }
    return data.shipment;
  }

  /**
   * 5. Changement de statut (State Machine - Opérations / Admin)
   */
  async updateStatus(params: {
    shipmentId: string;
    status: string;
    location?: string;
    description?: string;
    metadata?: any;
  }): Promise<any> {
    const headers = await this.getAuthHeader();
    const res = await fetch(`${this.baseUrl}/${params.shipmentId}/status`, {
      method: 'PATCH',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        status: params.status,
        location: params.location,
        description: params.description,
        metadata: params.metadata
      })
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Transition de statut refusée.');
    }
    return data.result;
  }

  /**
   * 6. Ajout d'un événement opérationnel manuel
   */
  async addEvent(params: {
    shipmentId: string;
    eventType: string;
    location: string;
    description: string;
    status?: string;
    metadata?: any;
  }): Promise<any> {
    const headers = await this.getAuthHeader();
    const res = await fetch(`${this.baseUrl}/${params.shipmentId}/events`, {
      method: 'POST',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify(params)
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Échec d\'ajout de l\'événement.');
    }
    return data.event;
  }
}

export const shipmentClientService = new ShipmentService();
