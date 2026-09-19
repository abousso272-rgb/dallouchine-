/**
 * Service Commandes Réelles Supabase — DALLOU CHINE
 * Source de vérité : public.orders, public.order_items, public.order_status_history
 */
import { supabase } from './supabase';
import type { Order, OrderItem, TrackingEvent, TrackingStatus } from '../types';

export interface CreateOrderParams {
  deliveryType: 'hub_pickup' | 'home_delivery';
  hubLocationId?: string;
  deliveryAddress?: any;
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
  customerCity?: string;
  notes?: string;
  paymentMethod?: 'wave' | 'orange_money' | 'free_money' | 'card' | 'hub_cash';
  idempotencyKey?: string;
  items?: Array<{ product_id: string; quantity: number; groupage_id?: string | null }>;
}

export interface CartValidationResult {
  valid: boolean;
  subtotal_xof: number;
  items_count: number;
  items: Array<{
    cart_item_id: string;
    product_id: string;
    groupage_id?: string | null;
    product_name: string;
    quantity: number;
    unit_price_xof: number;
    subtotal_xof: number;
    valid: boolean;
    error?: string | null;
  }>;
  errors: string[];
}

export const orderService = {
  /**
   * Valide le panier courant côté serveur
   */
  async validateCart(): Promise<CartValidationResult> {
    const { data, error } = await (supabase as any).rpc('validate_cart');
    if (error) {
      console.error('[orderService] Erreur validation panier:', error);
      return {
        valid: false,
        subtotal_xof: 0,
        items_count: 0,
        items: [],
        errors: [error.message]
      };
    }
    return data as CartValidationResult;
  },

  /**
   * Crée une commande transactionnelle à partir du panier
   */
  async createOrderFromCart(params: CreateOrderParams): Promise<{
    success: boolean;
    orderId?: string;
    trackingCode?: string;
    totalXof?: number;
    subtotalXof?: number;
    shippingFeeXof?: number;
    orderStatus?: string;
    paymentStatus?: string;
    replayed?: boolean;
    error?: string;
  }> {
    const { data, error } = await (supabase as any).rpc('create_order_from_cart', {
      p_delivery_type: params.deliveryType || 'hub_pickup',
      p_hub_location_id: params.hubLocationId || null,
      p_delivery_address: params.deliveryAddress || null,
      p_customer_name: params.customerName || null,
      p_customer_phone: params.customerPhone || null,
      p_customer_email: params.customerEmail || null,
      p_customer_city: params.customerCity || 'Dakar',
      p_notes: params.notes || null,
      p_payment_method: params.paymentMethod || 'wave',
      p_idempotency_key: params.idempotencyKey || null,
      p_items: params.items && params.items.length > 0 ? params.items : null
    });

    if (error) {
      console.error('[orderService] Erreur création commande:', error);
      return { success: false, error: error.message };
    }

    return {
      success: true,
      orderId: data.order_id,
      trackingCode: data.tracking_code,
      totalXof: data.total_xof,
      subtotalXof: data.subtotal_xof,
      shippingFeeXof: data.shipping_fee_xof,
      orderStatus: data.order_status,
      paymentStatus: data.payment_status,
      replayed: Boolean(data.replayed)
    };
  },

  /**
   * Récupère une commande par son ID avec ses articles et son historique
   */
  async getOrderById(orderId: string): Promise<Order | null> {
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        order_items (*),
        order_status_history (*)
      `)
      .eq('id', orderId)
      .maybeSingle();

    if (error || !data) {
      console.error('[orderService] Commande introuvable par ID:', error);
      return null;
    }

    return mapDbOrderToFrontend(data);
  },

  /**
   * Récupère une commande par son code de suivi AWP
   */
  async getOrderByTrackingCode(trackingCode: string): Promise<Order | null> {
    const clean = trackingCode.trim().toUpperCase();
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        order_items (*),
        order_status_history (*)
      `)
      .ilike('tracking_code', clean)
      .maybeSingle();

    if (error || !data) {
      return null;
    }

    return mapDbOrderToFrontend(data);
  },

  /**
   * Récupère les commandes de l'utilisateur connecté
   */
  async getUserOrders(): Promise<Order[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        order_items (*),
        order_status_history (*)
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[orderService] Erreur commandes utilisateur:', error);
      return [];
    }

    return (data || []).map(mapDbOrderToFrontend);
  },

  /**
   * Récupère toutes les commandes (administrateur uniquement)
   */
  async getAllOrders(): Promise<Order[]> {
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        order_items (*),
        order_status_history (*)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[orderService] Erreur commandes globales:', error);
      return [];
    }

    return (data || []).map(mapDbOrderToFrontend);
  }
};

/**
 * Mappe un enregistrement de commande DB vers l'interface Order attendue par l'UI
 */
function mapDbOrderToFrontend(dbOrder: any): Order {
  const items: OrderItem[] = (dbOrder.order_items || []).map((item: any) => ({
    productId: item.product_id || '',
    productName: item.product_name_snapshot || 'Article commandé',
    productImage: item.image_url_snapshot || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=200',
    quantity: item.quantity,
    unitPriceXOF: Number(item.unit_price_xof),
    totalPriceXOF: Number(item.subtotal_xof),
    isGroupage: Boolean(item.groupage_id),
    groupageId: item.groupage_id || undefined,
    transportMode: item.transport_mode_snapshot || 'air'
  }));

  const history = (dbOrder.order_status_history || []).sort(
    (a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );

  const trackingTimeline: TrackingEvent[] = history.map((h: any, idx: number) => ({
    id: h.id,
    status: h.new_status as TrackingStatus,
    title: h.description || formatStatusTitle(h.new_status),
    description: h.description || '',
    location: h.location || 'Hub Dakar',
    timestamp: new Date(h.created_at).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }),
    completed: idx < history.length - 1,
    current: idx === history.length - 1
  }));

  return {
    id: dbOrder.id,
    trackingCode: dbOrder.tracking_code,
    customer: {
      id: dbOrder.user_id || '',
      fullName: dbOrder.customer_name,
      phone: dbOrder.customer_phone,
      email: dbOrder.customer_email,
      city: dbOrder.customer_city,
      totalOrdersCount: 1
    },
    items,
    subtotalXOF: Number(dbOrder.subtotal_xof),
    shippingFeeXOF: Number(dbOrder.shipping_fee_xof),
    totalXOF: Number(dbOrder.total_xof),
    paymentMethod: dbOrder.payment_method || 'wave',
    paymentStatus: dbOrder.payment_status || 'pending',
    currentStatus: dbOrder.order_status as TrackingStatus,
    deliveryType: dbOrder.delivery_type || 'hub_pickup',
    hubLocationId: dbOrder.hub_location_id || undefined,
    deliveryAddress: dbOrder.delivery_address || undefined,
    createdAt: dbOrder.created_at,
    estimatedDeliveryDate: new Date(new Date(dbOrder.created_at).getTime() + 16 * 86400000).toISOString().split('T')[0],
    trackingTimeline: trackingTimeline.length > 0 ? trackingTimeline : [
      {
        id: 'initial',
        status: dbOrder.order_status as TrackingStatus,
        title: 'Commande enregistrée',
        description: 'En attente de paiement',
        location: 'Plateforme SinoSenegal Dakar',
        timestamp: new Date(dbOrder.created_at).toLocaleDateString('fr-FR'),
        completed: true,
        current: true
      }
    ],
    notes: dbOrder.notes || undefined
  };
}

function formatStatusTitle(status: string): string {
  const map: Record<string, string> = {
    pending_payment: 'Commande créée (Attente de paiement)',
    paid: 'Paiement confirmé',
    supplier_ordered: 'Achat usine validé',
    preparing: 'En cours de préparation usine',
    shipped: 'Expédié Chine',
    in_transit: 'En transit international',
    arrived: 'Arrivé à Dakar',
    ready_for_delivery: 'Prêt pour retrait / livraison',
    delivered: 'Colis livré',
    cancelled: 'Commande annulée'
  };
  return map[status] || status;
}
