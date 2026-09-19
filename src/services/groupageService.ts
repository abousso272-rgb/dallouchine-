import { supabase } from './supabase';
import { Groupage, GroupageParticipant, GroupageStatus, TransportMode } from '../types';

export interface GroupageFilterParams {
  status?: string;
  category?: string;
  search?: string;
}

export interface ReservationResult {
  success: boolean;
  idempotentReplay?: boolean;
  participantId?: string;
  groupageId?: string;
  groupageCode?: string;
  quantity?: number;
  unitPriceXOF?: number;
  totalXOF?: number;
  newReservedQuantity?: number;
  newStatus?: string;
  availableQuantity?: number;
  error?: string;
}

export interface CancellationResult {
  success: boolean;
  participantId?: string;
  releasedQuantity?: number;
  newReservedQuantity?: number;
  newGroupageStatus?: string;
  error?: string;
}

/**
 * Maps raw database groupage row to unified frontend Groupage interface.
 * Strictly avoids exposing internal margins or supplier costs.
 */
function mapDatabaseGroupage(raw: any, productInfo?: any): Groupage {
  const targetQuantity = Number(raw.target_quantity) || 0;
  const reservedQuantity = Number(raw.reserved_quantity) || 0;
  const availableQuantity = Math.max(0, targetQuantity - reservedQuantity);
  const unitPriceXOF = Number(raw.unit_price_xof) || 0;
  const originalPriceXOF = Number(raw.original_price_xof) || Math.round(unitPriceXOF * 1.35);

  let savingsPercent = 0;
  if (originalPriceXOF > unitPriceXOF && originalPriceXOF > 0) {
    savingsPercent = Math.round(((originalPriceXOF - unitPriceXOF) / originalPriceXOF) * 100);
  }

  // Fallback image from product if available
  const productImage = productInfo?.images?.[0] || raw.product?.images?.[0] || 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=800';

  return {
    id: raw.id,
    code: raw.code || 'GRP-000',
    title: raw.title || productInfo?.name || 'Campagne de Groupage',
    productId: raw.product_id,
    product: productInfo ? {
      id: productInfo.id,
      slug: productInfo.slug,
      name: productInfo.name,
      category: productInfo.category,
      images: productInfo.images || [],
      priceXOF: Number(productInfo.price_xof) || unitPriceXOF,
      shortDescription: productInfo.short_description || '',
      fullDescription: productInfo.full_description || '',
      specifications: {},
      features: [],
      unitWeightKg: 1,
      dimensionsCm: { length: 10, width: 10, height: 10 },
      cbm: 0.01,
      moq: Number(raw.supplier_moq) || 1,
      basePriceCNY: 0,
      basePriceUSD: 0,
      isGroupage: true,
      defaultTransportMode: (raw.transport_mode as TransportMode) || 'sea',
      estimatedDeliveryDays: raw.transport_mode === 'air' ? '10-15 jours' : '35-45 jours',
      stockStatus: 'groupage_only',
      rating: 4.8,
      reviewsCount: 12,
      tags: ['Groupage Actif', 'Tarif Usine Direct'],
      createdAt: raw.created_at
    } : undefined,
    unitPriceXOF,
    originalPriceXOF,
    targetUnits: targetQuantity,
    currentUnits: reservedQuantity,
    targetQuantity,
    reservedQuantity,
    availableQuantity,
    minOrderPerUser: Number(raw.min_order_per_user) || 1,
    maxOrderPerUser: Number(raw.max_order_per_user) || 100,
    participantsCount: Number(raw.participants_count) || 0,
    startDate: raw.start_date || '',
    closingDate: raw.deadline ? new Date(raw.deadline).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }) : '30 jours',
    deadline: raw.deadline || undefined,
    estimatedDepartureDate: raw.estimated_departure_date || '',
    estimatedArrivalDate: raw.estimated_arrival_date || '',
    transportMode: (raw.transport_mode as TransportMode) || 'sea',
    status: raw.status as GroupageStatus,
    statusNote: raw.status_note || undefined,
    supplierMoq: Number(raw.supplier_moq) || undefined,
    description: raw.description || undefined,
    image: productImage,
    savingsPercent,
    logisticsRoute: raw.logistics_route || 'Chine Hub -> Port de Dakar',
    guaranteeNote: raw.guarantee_note || 'Contrôle qualité systématique en usine avant embarquement.',
    keyBenefits: [
      `Économie de ${savingsPercent}% par rapport au prix catalogue standard`,
      'Contrôle qualité et vérification en entrepôt Yiwu / Guangzhou',
      'Formalités douanières et logistique intégrées jusqu’à Dakar',
      'Assurance fret maritime / aérien incluse'
    ]
  };
}

export const groupageService = {
  /**
   * Retrieves active, non-draft groupages from Supabase.
   * Joins product info for gallery thumbnail and metadata.
   */
  async getGroupages(filters?: GroupageFilterParams): Promise<Groupage[]> {
    try {
      let query = supabase
        .from('groupages')
        .select(`
          id, code, product_id, title, description,
          target_quantity, reserved_quantity, min_order_per_user, max_order_per_user,
          participants_count, unit_price_xof, original_price_xof, currency,
          supplier_moq, transport_mode, logistics_route, departure_country, arrival_country,
          start_date, deadline, estimated_departure_date, estimated_arrival_date,
          status, status_note, guarantee_note, created_at,
          product:products (
            id, slug, name, category, images, price_xof, short_description, full_description
          )
        `)
        .order('created_at', { ascending: false });

      // Status filter
      if (filters?.status && filters.status !== 'all') {
        query = query.eq('status', filters.status);
      }

      const { data, error } = await query;

      if (error) {
        console.error('[groupageService.getGroupages] Error:', error);
        return [];
      }

      let results = (data || []).map((row: any) => mapDatabaseGroupage(row, row.product));

      // Client-side text search if requested
      if (filters?.search && filters.search.trim()) {
        const q = filters.search.toLowerCase().trim();
        results = results.filter(g =>
          g.title.toLowerCase().includes(q) ||
          g.code.toLowerCase().includes(q) ||
          (g.description && g.description.toLowerCase().includes(q))
        );
      }

      // Category filter (via linked product)
      if (filters?.category && filters.category !== 'all') {
        const cat = filters.category.toLowerCase().trim();
        results = results.filter(g =>
          g.product?.category?.toLowerCase().includes(cat)
        );
      }

      return results;
    } catch (err) {
      console.error('[groupageService.getGroupages] Exception:', err);
      return [];
    }
  },

  /**
   * Retrieves a single groupage by ID or Code.
   */
  async getGroupageById(idOrCode: string): Promise<Groupage | null> {
    if (!idOrCode) return null;

    try {
      // Determine if idOrCode looks like a UUID or a code (e.g. GRP-EV-026)
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrCode);

      let query = supabase
        .from('groupages')
        .select(`
          id, code, product_id, title, description,
          target_quantity, reserved_quantity, min_order_per_user, max_order_per_user,
          participants_count, unit_price_xof, original_price_xof, currency,
          supplier_moq, transport_mode, logistics_route, departure_country, arrival_country,
          start_date, deadline, estimated_departure_date, estimated_arrival_date,
          status, status_note, guarantee_note, created_at,
          product:products (
            id, slug, name, category, images, price_xof, short_description, full_description
          )
        `);

      if (isUUID) {
        query = query.eq('id', idOrCode);
      } else {
        query = query.or(`code.eq.${idOrCode},id.eq.${idOrCode}`);
      }

      const { data, error } = await query.maybeSingle();

      if (error) {
        console.error('[groupageService.getGroupageById] Error:', error);
        return null;
      }

      if (!data) return null;
      return mapDatabaseGroupage(data, data.product);
    } catch (err) {
      console.error('[groupageService.getGroupageById] Exception:', err);
      return null;
    }
  },

  /**
   * Reserves a quantity atomically on a groupage via Supabase PostgreSQL RPC.
   * Enforces server authentication, server price calculation, anti-over-reservation row lock,
   * deadline verification, and idempotency.
   */
  async reserveGroupage(
    groupageId: string,
    quantity: number,
    idempotencyKey?: string
  ): Promise<ReservationResult> {
    try {
      // Generate a client-side idempotency key if none passed
      const key = idempotencyKey || `req_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;

      const { data, error } = await (supabase as any).rpc('reserve_groupage', {
        p_groupage_id: groupageId,
        p_quantity: quantity,
        p_idempotency_key: key
      });

      if (error) {
        console.error('[groupageService.reserveGroupage] RPC Error:', error);
        return {
          success: false,
          error: error.message || 'Erreur lors de la réservation'
        };
      }

      return {
        success: Boolean(data?.success),
        idempotentReplay: Boolean(data?.idempotent_replay),
        participantId: data?.participant_id,
        groupageId: data?.groupage_id,
        groupageCode: data?.groupage_code,
        quantity: data?.quantity,
        unitPriceXOF: data?.unit_price_xof,
        totalXOF: data?.total_xof,
        newReservedQuantity: data?.new_reserved_quantity,
        newStatus: data?.new_status,
        availableQuantity: data?.available_quantity
      };
    } catch (err: any) {
      console.error('[groupageService.reserveGroupage] Exception:', err);
      return {
        success: false,
        error: err.message || 'Erreur inattendue lors de la réservation'
      };
    }
  },

  /**
   * Cancels a reservation atomically via Supabase PostgreSQL RPC.
   * Releases quota and recalculates groupage status.
   */
  async cancelParticipation(participationId: string): Promise<CancellationResult> {
    try {
      const { data, error } = await (supabase as any).rpc('cancel_groupage_participation', {
        p_participation_id: participationId
      });

      if (error) {
        console.error('[groupageService.cancelParticipation] RPC Error:', error);
        return {
          success: false,
          error: error.message || 'Erreur lors de l\'annulation'
        };
      }

      return {
        success: Boolean(data?.success),
        participantId: data?.participant_id,
        releasedQuantity: data?.released_quantity,
        newReservedQuantity: data?.new_reserved_quantity,
        newGroupageStatus: data?.new_groupage_status
      };
    } catch (err: any) {
      console.error('[groupageService.cancelParticipation] Exception:', err);
      return {
        success: false,
        error: err.message || 'Erreur inattendue lors de l\'annulation'
      };
    }
  },

  /**
   * Retrieves all participations belonging strictly to the authenticated user.
   */
  async getUserParticipations(): Promise<GroupageParticipant[]> {
    try {
      const { data: authData } = await supabase.auth.getUser();
      if (!authData?.user) return [];

      const { data, error } = await supabase
        .from('groupage_participants')
        .select(`
          id, groupage_id, user_id, quantity, unit_price_xof, total_xof,
          status, idempotency_key, created_at, updated_at,
          groupage:groupages (
            id, code, title, transport_mode, deadline, status,
            product:products (
              id, slug, name, category, images
            )
          )
        `)
        .eq('user_id', authData.user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('[groupageService.getUserParticipations] Error:', error);
        return [];
      }

      return (data || []).map((row: any) => {
        const grp = row.groupage ? mapDatabaseGroupage(row.groupage, row.groupage.product) : undefined;
        return {
          id: row.id,
          groupageId: row.groupage_id,
          groupage: grp,
          userId: row.user_id,
          quantity: Number(row.quantity),
          unitPriceXOF: Number(row.unit_price_xof),
          totalXOF: Number(row.total_xof),
          status: row.status,
          idempotencyKey: row.idempotency_key || undefined,
          createdAt: row.created_at,
          updatedAt: row.updated_at
        };
      });
    } catch (err) {
      console.error('[groupageService.getUserParticipations] Exception:', err);
      return [];
    }
  },

  /**
   * Admin-only groupage status update via RPC.
   */
  async adminUpdateGroupageStatus(
    groupageId: string,
    status: string,
    note?: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { data, error } = await (supabase as any).rpc('admin_update_groupage_status', {
        p_groupage_id: groupageId,
        p_status: status,
        p_note: note || null
      });

      if (error) {
        return { success: false, error: error.message };
      }
      return { success: Boolean(data?.success) };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }
};
