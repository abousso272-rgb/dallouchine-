import { supabase, rpc, unwrap, AppError, friendlyError } from '../lib/db';
import type { Order } from '../lib/types';

const ORDER_COLUMNS = `
  *,
  order_items (id, product_id, groupage_id, product_name_snapshot, image_url_snapshot, quantity, unit_price_xof, subtotal_xof),
  order_status_history (id, old_status, new_status, location, description, created_at)
`;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mapOrder(o: any): Order {
  return {
    id: o.id,
    trackingCode: o.tracking_code,
    userId: o.user_id,
    customerName: o.customer_name || '',
    customerPhone: o.customer_phone || '',
    customerEmail: o.customer_email || '',
    customerCity: o.customer_city || '',
    subtotalXOF: Number(o.subtotal_xof || 0),
    shippingFeeXOF: Number(o.shipping_fee_xof || 0),
    discountXOF: Number(o.discount_amount_xof || 0),
    totalXOF: Number(o.total_xof || 0),
    paymentStatus: o.payment_status,
    orderStatus: o.order_status,
    paymentMethod: o.payment_method,
    deliveryType: o.delivery_type,
    hubId: o.hub_location_id || null,
    deliveryAddress: o.delivery_address || null,
    notes: o.notes || null,
    kind: o.order_kind || 'catalog',
    quoteId: o.quote_id || null,
    quotePaymentKind: o.quote_payment_kind || null,
    carrierReference: o.carrier_reference || null,
    logisticsNotes: o.logistics_notes || null,
    estimatedDeliveryDate: o.estimated_delivery_date || null,
    transportMode: o.transport_mode || null,
    paidAt: o.paid_at || null,
    createdAt: o.created_at,
    updatedAt: o.updated_at,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    items: (o.order_items || []).map((i: any) => ({
      id: i.id,
      productId: i.product_id,
      groupageId: i.groupage_id,
      name: i.product_name_snapshot,
      image: i.image_url_snapshot || null,
      quantity: i.quantity,
      unitPriceXOF: Number(i.unit_price_xof || 0),
      subtotalXOF: Number(i.subtotal_xof || 0)
    })),
    events: [...(o.order_status_history || [])]
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .map((e: any) => ({
        id: e.id,
        oldStatus: e.old_status,
        status: e.new_status,
        location: e.location,
        description: e.description,
        createdAt: e.created_at
      }))
  };
}

export interface ShippingEstimate {
  customer_shipping_fee: number;
  estimated_delivery_days?: string;
  chargeable_weight?: number;
  transport_mode?: string;
}

export async function estimateShipping(
  items: { product_id: string; quantity: number }[],
  transportMode: 'air' | 'sea',
  deliveryType: 'hub_pickup' | 'home_delivery'
): Promise<ShippingEstimate | null> {
  if (!items.length) return null;
  const { data, error } = await supabase.rpc('estimate_cart_logistics', {
    p_transport_mode: transportMode,
    p_delivery_type: deliveryType,
    p_items: items
  });
  if (error || !data) return null;
  return data as ShippingEstimate;
}

export interface CheckoutParams {
  items: { product_id: string; quantity: number }[];
  deliveryType: 'hub_pickup' | 'home_delivery';
  hubId: string | null;
  address: { street: string; district: string; city: string; instructions?: string } | null;
  name: string;
  phone: string;
  email: string;
  city: string;
  notes: string;
  transportMode: 'air' | 'sea';
  idempotencyKey: string;
}

/**
 * Crée la commande côté base (prix et frais recalculés par le serveur),
 * puis applique le mode de transport choisi. Retourne la commande finale.
 */
export async function createOrderFromCart(p: CheckoutParams): Promise<Order> {
  const created = await rpc<{ order_id: string }>('create_order_from_cart', {
    p_delivery_type: p.deliveryType,
    p_hub_location_id: p.deliveryType === 'hub_pickup' ? p.hubId : null,
    p_delivery_address: p.deliveryType === 'home_delivery' ? p.address : null,
    p_customer_name: p.name,
    p_customer_phone: p.phone,
    p_customer_email: p.email,
    p_customer_city: p.city,
    p_notes: p.notes || null,
    p_payment_method: 'geniuspay',
    p_idempotency_key: p.idempotencyKey,
    p_items: p.items
  });
  if (!created?.order_id) throw new AppError('La commande n’a pas pu être créée.');

  // Frais logistiques selon le mode de transport choisi (recalcul serveur)
  const { error } = await supabase.rpc('calculate_order_logistics', {
    p_order_id: created.order_id,
    p_transport_mode: p.transportMode,
    p_status: 'estimated'
  });
  if (error) console.warn('[orders] calculate_order_logistics:', error.message);

  const order = await getOrder(created.order_id);
  if (!order) throw new AppError('Commande créée mais introuvable. Consultez votre espace client.');
  return order;
}

export async function getOrder(id: string): Promise<Order | null> {
  const { data, error } = await supabase.from('orders').select(ORDER_COLUMNS).eq('id', id).maybeSingle();
  if (error) throw new AppError(friendlyError(error), error.code);
  return data ? mapOrder(data) : null;
}

export async function listMyOrders(userId: string): Promise<Order[]> {
  const data = unwrap(
    await supabase.from('orders').select(ORDER_COLUMNS).eq('user_id', userId).order('created_at', { ascending: false })
  );
  return (data || []).map(mapOrder);
}

export interface PaymentRow {
  id: string;
  orderId: string;
  orderCode: string;
  amountXOF: number;
  status: string;
  method: string;
  provider: string;
  createdAt: string;
  paidAt: string | null;
  customerName?: string;
}

export async function listMyPayments(userId: string): Promise<PaymentRow[]> {
  const { data, error } = await supabase
    .from('payments')
    .select('id, order_id, amount_xof, status, payment_method, provider, created_at, paid_at, orders (tracking_code)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw new AppError(friendlyError(error), error.code);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data || []).map((p: any) => ({
    id: p.id,
    orderId: p.order_id,
    orderCode: p.orders?.tracking_code || '',
    amountXOF: Number(p.amount_xof || 0),
    status: p.status,
    method: p.payment_method,
    provider: p.provider,
    createdAt: p.created_at,
    paidAt: p.paid_at
  }));
}

export interface PublicTracking {
  found: boolean;
  tracking_code?: string;
  order_status?: string;
  payment_status?: string;
  created_at?: string;
  estimated_delivery_date?: string | null;
  items_count?: number;
  events?: { status: string; location: string | null; description: string | null; at: string }[];
}

export function trackOrder(code: string): Promise<PublicTracking> {
  return rpc<PublicTracking>('track_order_public', { p_code: code.trim() });
}

// ---------------------------------------------------------------------------
// Espace professionnel
// ---------------------------------------------------------------------------

export interface OrderFilters {
  status?: string;
  payment?: string;
  kind?: string;
  search?: string;
  limit?: number;
}

export async function listOrders(f: OrderFilters = {}): Promise<Order[]> {
  let query = supabase.from('orders').select(ORDER_COLUMNS).order('created_at', { ascending: false }).limit(f.limit || 200);
  if (f.status) query = query.eq('order_status', f.status);
  if (f.payment) query = query.eq('payment_status', f.payment);
  if (f.kind) query = query.eq('order_kind', f.kind);
  if (f.search) {
    const s = f.search.replace(/[,()%*]/g, ' ').trim();
    if (s) query = query.or(`tracking_code.ilike.%${s}%,customer_name.ilike.%${s}%,customer_phone.ilike.%${s}%`);
  }
  const data = unwrap(await query);
  return (data || []).map(mapOrder);
}

export interface StaffOrderUpdate {
  status?: string | null;
  note?: string;
  location?: string;
  carrierReference?: string;
  logisticsNotes?: string;
  estimatedDeliveryDate?: string | null;
  transportMode?: string | null;
}

export function staffUpdateOrder(orderId: string, u: StaffOrderUpdate) {
  return rpc('staff_update_order', {
    p_order_id: orderId,
    p_status: u.status || null,
    p_note: u.note || null,
    p_location: u.location || null,
    p_carrier_reference: u.carrierReference || null,
    p_logistics_notes: u.logisticsNotes || null,
    p_estimated_delivery_date: u.estimatedDeliveryDate || null,
    p_transport_mode: u.transportMode || null
  });
}

export interface OrderCost {
  id: string;
  type: string;
  amountXOF: number;
  description: string | null;
  createdAt: string;
}

export async function listOrderCosts(orderId: string): Promise<OrderCost[]> {
  const { data, error } = await supabase
    .from('order_costs')
    .select('id, cost_type, amount_xof, description, created_at')
    .eq('order_id', orderId)
    .order('created_at');
  if (error) return [];
  return (data || []).map(c => ({
    id: c.id,
    type: c.cost_type,
    amountXOF: Number(c.amount_xof || 0),
    description: c.description,
    createdAt: c.created_at
  }));
}

export function addOrderCost(orderId: string, type: string, amountXOF: number, description: string) {
  return rpc('staff_add_order_cost', {
    p_order_id: orderId,
    p_cost_type: type,
    p_amount_xof: amountXOF,
    p_description: description || null
  });
}

export async function deleteOrderCost(id: string): Promise<void> {
  unwrap(await supabase.from('order_costs').delete().eq('id', id));
}
