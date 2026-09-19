/**
 * SERVICE LOGISTIQUE — DALLOU CHINE
 * Source de vérité : Supabase PostgreSQL (RPC calculate_order_logistics / estimate_cart_logistics)
 * Séparation stricte : Données publiques vs Données internes confidentielles
 */

import { supabase } from './supabase';
import { TransportMode, AmountStatus } from '../types';

export interface PublicLogisticsResult {
  success: boolean;
  order_id?: string;
  tracking_code?: string;
  transport_mode: TransportMode;
  real_weight: number;
  volumetric_weight: number;
  chargeable_weight: number;
  volume_cbm: number;
  customer_shipping_fee: number;
  estimated_delivery_days?: string;
  status: AmountStatus;
  rate_version?: string;
  subtotal_xof?: number;
  total_xof?: number;
  currency: string;
}

export interface InternalLogisticsCosts {
  transport_cost: number;
  customs_cost: number;
  consolidation_cost: number;
  inspection_cost: number;
  other_cost: number;
  total_internal_cost: number;
  margin_estimate_xof?: number;
}

export interface InternalLogisticsResult extends PublicLogisticsResult {
  internal_costs: InternalLogisticsCosts;
}

export interface TransportRate {
  id: string;
  transport_mode: TransportMode;
  origin: string;
  destination: string;
  pricing_unit: 'kg' | 'cbm';
  rate_xof: number;
  min_charge_xof: number;
  volumetric_factor: number;
  base_transit_days_min: number;
  base_transit_days_max: number;
  rate_version: string;
  valid_from: string;
  valid_until?: string | null;
  active: boolean;
}

export const logisticsService = {
  /**
   * Récupère la grille tarifaire active officielle depuis Supabase
   */
  async getActiveTransportRates(): Promise<TransportRate[]> {
    const { data, error } = await (supabase as any)
      .from('transport_rates')
      .select('*')
      .eq('active', true)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('[logisticsService] Erreur récupération tarifs:', error);
      return [];
    }

    return ((data as any[]) || []).map(r => ({
      id: r.id,
      transport_mode: r.transport_mode as TransportMode,
      origin: r.origin,
      destination: r.destination,
      pricing_unit: r.pricing_unit,
      rate_xof: Number(r.rate_xof),
      min_charge_xof: Number(r.min_charge_xof),
      volumetric_factor: r.volumetric_factor,
      base_transit_days_min: r.base_transit_days_min,
      base_transit_days_max: r.base_transit_days_max,
      rate_version: r.rate_version,
      valid_from: r.valid_from,
      valid_until: r.valid_until,
      active: r.active
    }));
  },

  /**
   * Estimation publique pour le panier / checkout avant création de commande
   */
  async estimateCartLogistics(
    transportMode: TransportMode = 'air',
    deliveryType: 'hub_pickup' | 'home_delivery' = 'hub_pickup',
    items?: Array<{ product_id: string; quantity: number }>
  ): Promise<PublicLogisticsResult> {
    const { data, error } = await (supabase as any).rpc('estimate_cart_logistics', {
      p_transport_mode: transportMode,
      p_delivery_type: deliveryType,
      p_items: items && items.length > 0 ? items : null
    });

    if (error) {
      console.error('[logisticsService] Erreur estimation panier:', error);
      throw new Error(error.message);
    }

    return data as PublicLogisticsResult;
  },

  /**
   * Calcule ou recalcule les frais logistiques réels pour une commande (résultat public client)
   */
  async calculateOrderLogistics(
    orderId: string,
    transportMode?: TransportMode,
    status: AmountStatus = 'estimated'
  ): Promise<PublicLogisticsResult> {
    const { data, error } = await (supabase as any).rpc('calculate_order_logistics', {
      p_order_id: orderId,
      p_transport_mode: transportMode || null,
      p_status: status
    });

    if (error) {
      console.error('[logisticsService] Erreur calcul logistique commande:', error);
      throw new Error(error.message);
    }

    return data as PublicLogisticsResult;
  },

  /**
   * Calcule les frais logistiques réels pour une commande (résultat complet pour les administrateurs)
   */
  async calculateOrderLogisticsAdmin(
    orderId: string,
    transportMode?: TransportMode,
    status: AmountStatus = 'estimated'
  ): Promise<InternalLogisticsResult> {
    const { data, error } = await (supabase as any).rpc('calculate_order_logistics', {
      p_order_id: orderId,
      p_transport_mode: transportMode || null,
      p_status: status
    });

    if (error) {
      console.error('[logisticsService] Erreur calcul admin:', error);
      throw new Error(error.message);
    }

    return data as InternalLogisticsResult;
  }
};
