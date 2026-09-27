import { supabase, rpc, unwrap, AppError, friendlyError } from '../lib/db';
import type { Groupage } from '../lib/types';
import { mapProduct } from './catalog';

const GROUPAGE_COLUMNS = `
  *,
  products (
    id, name, slug, short_description, price_xof, categories (id, name, slug),
    product_images (id, image_url, sort_order, is_primary)
  )
`;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mapGroupage(raw: any): Groupage {
  const product = raw.products ? mapProduct(raw.products) : null;
  return {
    id: raw.id,
    code: raw.code,
    title: raw.title || product?.name || 'Groupage',
    description: raw.description || '',
    productId: raw.product_id,
    product: product
      ? {
          id: product.id,
          slug: product.slug,
          name: product.name,
          images: product.images,
          priceXOF: product.priceXOF,
          categoryName: product.categoryName,
          shortDescription: product.shortDescription
        }
      : null,
    image: raw.image_url || product?.images[0] || null,
    targetQuantity: Number(raw.target_quantity || 0),
    reservedQuantity: Number(raw.reserved_quantity || 0),
    participantsCount: Number(raw.participants_count || 0),
    minPerUser: Number(raw.min_order_per_user || 1),
    maxPerUser: Number(raw.max_order_per_user || 100),
    unitPriceXOF: Number(raw.unit_price_xof || 0),
    originalPriceXOF: Number(raw.original_price_xof || 0),
    supplierMoq: Number(raw.supplier_moq || 0),
    transportMode: raw.transport_mode || 'sea',
    route: raw.logistics_route || '',
    startDate: raw.start_date || null,
    deadline: raw.deadline || null,
    estimatedDeparture: raw.estimated_departure_date || null,
    estimatedArrival: raw.estimated_arrival_date || null,
    status: raw.status,
    statusNote: raw.status_note || null,
    guaranteeNote: raw.guarantee_note || null,
    highlights: Array.isArray(raw.highlights) ? raw.highlights.filter(Boolean) : [],
    assignedManagerId: raw.assigned_manager_id || null,
    createdBy: raw.created_by || null,
    createdAt: raw.created_at
  };
}

/** Un groupage accepte-t-il encore des participations ? */
export function isJoinable(g: Groupage): boolean {
  const notExpired = !g.deadline || new Date(g.deadline).getTime() > Date.now();
  return ['open', 'almost_full'].includes(g.status) && notExpired && g.reservedQuantity < g.targetQuantity;
}

/** Groupages visibles publiquement : en cours ou en exécution (pas les brouillons, annulés ou expirés sans suite). */
export async function listPublicGroupages(): Promise<Groupage[]> {
  const { data, error } = await supabase
    .from('groupages')
    .select(GROUPAGE_COLUMNS)
    .in('status', ['open', 'almost_full', 'full', 'validated', 'supplier_ordered', 'preparing', 'shipped', 'arrived'])
    .order('deadline', { ascending: true });
  if (error) throw new AppError(friendlyError(error), error.code);
  return (data || [])
    .map(mapGroupage)
    .filter(g => !(['open', 'almost_full'].includes(g.status) && g.deadline && new Date(g.deadline).getTime() < Date.now()));
}

export async function getGroupage(idOrCode: string): Promise<Groupage | null> {
  const isUuid = /^[0-9a-f-]{36}$/i.test(idOrCode);
  const { data, error } = await supabase
    .from('groupages')
    .select(GROUPAGE_COLUMNS)
    .eq(isUuid ? 'id' : 'code', idOrCode)
    .maybeSingle();
  if (error) throw new AppError(friendlyError(error), error.code);
  return data ? mapGroupage(data) : null;
}

export interface JoinResult {
  order_id: string;
  tracking_code: string;
  participant_id: string;
  total_xof: number;
}

export function joinGroupage(params: {
  groupageId: string;
  quantity: number;
  name?: string;
  phone?: string;
  city?: string;
  hubId?: string | null;
}): Promise<JoinResult> {
  return rpc<JoinResult>('join_groupage', {
    p_groupage_id: params.groupageId,
    p_quantity: params.quantity,
    p_customer_name: params.name || null,
    p_customer_phone: params.phone || null,
    p_customer_city: params.city || null,
    p_hub_id: params.hubId || null
  });
}

export interface MyParticipation {
  id: string;
  groupageId: string;
  quantity: number;
  totalXOF: number;
  status: string;
  orderId: string | null;
  createdAt: string;
  groupage: Groupage | null;
}

export async function listMyParticipations(userId: string): Promise<MyParticipation[]> {
  const data = unwrap(
    await supabase
      .from('groupage_participants')
      .select(`id, groupage_id, quantity, total_xof, status, order_id, created_at, groupages (${GROUPAGE_COLUMNS})`)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
  );
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data || []).map((p: any) => ({
    id: p.id,
    groupageId: p.groupage_id,
    quantity: p.quantity,
    totalXOF: Number(p.total_xof || 0),
    status: p.status,
    orderId: p.order_id || null,
    createdAt: p.created_at,
    groupage: p.groupages ? mapGroupage(p.groupages) : null
  }));
}

export function cancelMyParticipation(participantId: string) {
  return rpc('cancel_my_groupage_participation', { p_participant_id: participantId });
}

// ---------------------------------------------------------------------------
// Espace professionnel
// ---------------------------------------------------------------------------

export async function listStaffGroupages(opts: { managerId?: string } = {}): Promise<Groupage[]> {
  let query = supabase.from('groupages').select(GROUPAGE_COLUMNS).order('created_at', { ascending: false });
  if (opts.managerId) query = query.or(`assigned_manager_id.eq.${opts.managerId},created_by.eq.${opts.managerId}`);
  const data = unwrap(await query);
  return (data || []).map(mapGroupage);
}

export interface GroupageInput {
  id?: string;
  code: string;
  productId: string;
  title: string;
  description: string;
  targetQuantity: number;
  minPerUser: number;
  maxPerUser: number;
  unitPriceXOF: number;
  originalPriceXOF: number;
  supplierMoq: number;
  transportMode: 'air' | 'sea' | 'express';
  route: string;
  deadline: string;
  estimatedDeparture: string | null;
  estimatedArrival: string | null;
  status: string;
  guaranteeNote: string;
  highlights: string[];
  imageUrl: string | null;
  assignedManagerId?: string | null;
}

export async function saveGroupage(input: GroupageInput, isAdmin: boolean): Promise<string> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const row: Record<string, any> = {
    code: input.code.trim().toUpperCase(),
    product_id: input.productId,
    title: input.title.trim(),
    description: input.description.trim(),
    target_quantity: Math.max(1, Math.round(input.targetQuantity)),
    min_order_per_user: Math.max(1, Math.round(input.minPerUser)),
    max_order_per_user: Math.max(Math.round(input.minPerUser), Math.round(input.maxPerUser)),
    unit_price_xof: Math.round(input.unitPriceXOF),
    original_price_xof: Math.round(input.originalPriceXOF || input.unitPriceXOF),
    supplier_moq: Math.max(1, Math.round(input.supplierMoq || input.targetQuantity)),
    transport_mode: input.transportMode,
    logistics_route: input.route.trim() || null,
    deadline: new Date(input.deadline).toISOString(),
    estimated_departure_date: input.estimatedDeparture || null,
    estimated_arrival_date: input.estimatedArrival || null,
    guarantee_note: input.guaranteeNote.trim() || null,
    highlights: input.highlights.map(h => h.trim()).filter(Boolean),
    image_url: input.imageUrl || null
  };
  if (isAdmin) row.assigned_manager_id = input.assignedManagerId || null;

  if (input.id) {
    unwrap(await supabase.from('groupages').update(row).eq('id', input.id));
    return input.id;
  }
  row.status = input.status || 'draft';
  const created = unwrap(await supabase.from('groupages').insert(row).select('id').single());
  return created.id as string;
}

export function updateGroupageStatus(id: string, status: string, note?: string) {
  return rpc('staff_update_groupage_status', { p_groupage_id: id, p_status: status, p_note: note || null });
}

export interface GroupageParticipantRow {
  participant_id: string;
  user_id: string;
  full_name: string;
  phone: string;
  email: string;
  quantity: number;
  total_xof: number;
  status: string;
  order_id: string | null;
  order_code: string | null;
  payment_status: string | null;
  order_status: string | null;
  created_at: string;
}

export function listGroupageParticipants(groupageId: string): Promise<GroupageParticipantRow[]> {
  return rpc<GroupageParticipantRow[]>('get_groupage_participants', { p_groupage_id: groupageId });
}
