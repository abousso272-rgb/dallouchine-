import { supabase, rpc, unwrap, AppError, friendlyError, isMigrationError } from '../lib/db';
import type { ClientRequest, Finding, Message, Quote } from '../lib/types';
import type { RequestType } from '../lib/status';

const TABLE: Record<RequestType, string> = {
  sourcing: 'sourcing_requests',
  b2b: 'b2b_requests',
  vehicle: 'vehicle_requests'
};

const QUOTE_FK: Record<RequestType, string> = {
  sourcing: 'sourcing_request_id',
  b2b: 'b2b_request_id',
  vehicle: 'vehicle_request_id'
};

const SELECT: Record<RequestType, string> = {
  sourcing: '*',
  b2b: '*',
  vehicle: '*, vehicles (id, slug, title, images, price_xof, price_on_request)'
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapRequest(type: RequestType, r: any): ClientRequest {
  if (type === 'sourcing') {
    const links = [r.product_url, r.alibaba_url, r.url_1688].filter(Boolean);
    return {
      id: r.id,
      type,
      code: r.code,
      title: r.title || 'Demande de sourcing',
      description: r.description || '',
      status: r.status,
      quantity: Number(r.quantity || 1),
      budgetXOF: r.budget_xof !== null && r.budget_xof !== undefined ? Number(r.budget_xof) : null,
      userId: r.user_id,
      contactName: r.client_name || '',
      contactPhone: r.client_phone || '',
      contactEmail: r.client_email || null,
      company: r.client_company || null,
      images: [r.image_url, ...(r.additional_images || [])].filter(Boolean),
      links: Array.from(new Set(links)),
      category: r.category || null,
      notes: r.notes || null,
      internalNotes: r.internal_notes || null,
      assignedTo: r.assigned_to || null,
      extra: {},
      aiAnalysis: r.ai_analysis || null,
      createdAt: r.created_at,
      updatedAt: r.updated_at
    };
  }
  if (type === 'b2b') {
    return {
      id: r.id,
      type,
      code: r.code,
      title: r.product_description ? String(r.product_description).split('\n')[0].slice(0, 90) : 'Demande professionnelle',
      description: r.product_description || '',
      status: r.status,
      quantity: Number(r.quantity || 1),
      budgetXOF: r.budget_xof !== null && r.budget_xof !== undefined ? Number(r.budget_xof) : null,
      userId: r.user_id,
      contactName: r.contact_name || '',
      contactPhone: r.phone || '',
      contactEmail: r.email || null,
      company: r.company_name || null,
      images: (r.attachments || []).filter(Boolean),
      links: [],
      category: r.sector || null,
      notes: r.notes || null,
      internalNotes: r.internal_notes || null,
      assignedTo: r.assigned_user_id || null,
      extra: {
        Destination: r.destination || null,
        Transport:
          r.transport_preference === 'air' ? 'Aérien' : r.transport_preference === 'sea' ? 'Maritime' : 'Selon recommandation',
        Personnalisation: r.customization ? r.logo_instructions || 'Oui' : 'Non',
        'Emballage personnalisé': r.packaging_requested ? 'Oui' : 'Non'
      },
      createdAt: r.created_at,
      updatedAt: r.updated_at
    };
  }
  const v = r.vehicles;
  const vehicleLabel = [r.brand, r.model].filter(Boolean).join(' ');
  return {
    id: r.id,
    type,
    code: r.code,
    title: v?.title || vehicleLabel || 'Recherche de véhicule',
    description: r.message || '',
    status: r.status,
    quantity: Number(r.quantity || 1),
    budgetXOF: r.budget_xof !== null && r.budget_xof !== undefined ? Number(r.budget_xof) : null,
    userId: r.user_id,
    contactName: r.contact_name || '',
    contactPhone: r.phone || '',
    contactEmail: r.email || null,
    company: null,
    images: v?.images?.length ? [v.images[0]] : [],
    links: v?.slug ? [`/automobile/${v.slug}`] : [],
    category: r.vehicle_type || null,
    notes: null,
    internalNotes: r.internal_notes || null,
    assignedTo: r.assigned_to || null,
    extra: {
      Type: r.request_type === 'vehicle' ? 'Véhicule du catalogue' : 'Recherche personnalisée',
      Marque: r.brand || null,
      Modèle: r.model || null,
      'Année min.': r.year_min || null,
      Ville: r.city || null
    },
    createdAt: r.created_at,
    updatedAt: r.updated_at
  };
}

// ---------------------------------------------------------------------------
// Création côté client (identité issue de la session, jamais du formulaire)
// ---------------------------------------------------------------------------

export interface SourcingInput {
  title: string;
  description: string;
  quantity: number;
  productUrl?: string;
  images: string[];
  budgetXOF?: number | null;
  category?: string;
  notes?: string;
  name?: string;
  phone?: string;
  email?: string;
}

export function submitSourcing(i: SourcingInput) {
  return rpc<{ id: string; code: string }>('submit_sourcing_request', {
    p_title: i.title,
    p_description: i.description,
    p_quantity: i.quantity,
    p_product_url: i.productUrl || null,
    p_image_url: i.images[0] || null,
    p_additional_images: i.images.slice(1),
    p_budget_xof: i.budgetXOF || null,
    p_category: i.category || null,
    p_notes: i.notes || null,
    p_client_name: i.name || null,
    p_client_phone: i.phone || null,
    p_client_email: i.email || null
  });
}

/** Joint l'analyse IA à la demande de sourcing qui vient d'être envoyée (visible par l'équipe). */
export async function attachSourcingAnalysis(requestId: string, analysis: unknown) {
  try {
    await rpc('attach_sourcing_analysis', { p_request_id: requestId, p_analysis: analysis });
  } catch {
    /* facultatif : la demande reste valide sans l'analyse */
  }
}

export interface B2BInput {
  companyName: string;
  contactName: string;
  phone: string;
  email: string;
  sector?: string;
  productDescription: string;
  quantity: number;
  budgetXOF?: number | null;
  destination?: string;
  customization: boolean;
  logoInstructions?: string;
  packaging: boolean;
  transport: 'recommended' | 'air' | 'sea';
  notes?: string;
  attachments: string[];
}

export function submitB2B(i: B2BInput) {
  return rpc<{ id: string; code: string }>('submit_b2b_request', {
    p_company_name: i.companyName,
    p_contact_name: i.contactName,
    p_phone: i.phone,
    p_email: i.email,
    p_product_description: i.productDescription,
    p_quantity: i.quantity,
    p_sector: i.sector || null,
    p_budget_xof: i.budgetXOF || null,
    p_destination: i.destination || null,
    p_customization: i.customization,
    p_logo_instructions: i.logoInstructions || null,
    p_packaging_requested: i.packaging,
    p_transport_preference: i.transport,
    p_notes: i.notes || null,
    p_attachments: i.attachments
  });
}

export interface VehicleRequestInput {
  vehicleId?: string | null;
  contactName: string;
  phone: string;
  email?: string;
  city?: string;
  message?: string;
  vehicleType?: string;
  brand?: string;
  model?: string;
  yearMin?: number | null;
  budgetXOF?: number | null;
  quantity?: number;
}

export function submitVehicleRequest(i: VehicleRequestInput) {
  return rpc<{ id: string; code: string }>('submit_vehicle_request', {
    p_contact_name: i.contactName,
    p_phone: i.phone,
    p_vehicle_id: i.vehicleId || null,
    p_email: i.email || null,
    p_city: i.city || null,
    p_message: i.message || null,
    p_vehicle_type: i.vehicleType || null,
    p_brand: i.brand || null,
    p_model: i.model || null,
    p_year_min: i.yearMin || null,
    p_budget_xof: i.budgetXOF || null,
    p_quantity: i.quantity || 1
  });
}

// ---------------------------------------------------------------------------
// Lecture (client : ses demandes via RLS ; personnel : toutes)
// ---------------------------------------------------------------------------

export interface RequestFilters {
  status?: string;
  assignedTo?: string | null;
  unassignedOnly?: boolean;
  search?: string;
}

export async function listRequests(type: RequestType, f: RequestFilters & { userId?: string } = {}): Promise<ClientRequest[]> {
  let query = supabase.from(TABLE[type]).select(SELECT[type]).order('created_at', { ascending: false }).limit(300);
  if (f.userId) query = query.eq('user_id', f.userId);
  if (f.status) query = query.eq('status', f.status);
  const assignCol = type === 'b2b' ? 'assigned_user_id' : 'assigned_to';
  if (f.assignedTo) query = query.eq(assignCol, f.assignedTo);
  if (f.unassignedOnly) query = query.is(assignCol, null);
  if (f.search) {
    const s = f.search.replace(/[,()%*]/g, ' ').trim();
    if (s) {
      const cols =
        type === 'sourcing'
          ? ['code', 'title', 'client_name', 'client_phone']
          : type === 'b2b'
            ? ['code', 'company_name', 'contact_name', 'product_description']
            : ['code', 'contact_name', 'brand', 'model', 'phone'];
      query = query.or(cols.map(c => `${c}.ilike.%${s}%`).join(','));
    }
  }
  const { data, error } = await query;
  if (error) {
    if (isMigrationError(error)) return [];
    throw new AppError(friendlyError(error), error.code);
  }
  return (data || []).map(r => mapRequest(type, r));
}

export async function listAllMyRequests(userId: string): Promise<ClientRequest[]> {
  const results = await Promise.all(
    (['sourcing', 'b2b', 'vehicle'] as RequestType[]).map(t => listRequests(t, { userId }).catch(() => [] as ClientRequest[]))
  );
  return results.flat().sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export async function getRequest(type: RequestType, id: string): Promise<ClientRequest | null> {
  if (!TABLE[type]) return null;
  const { data, error } = await supabase.from(TABLE[type]).select(SELECT[type]).eq('id', id).maybeSingle();
  if (error) throw new AppError(friendlyError(error), error.code);
  return data ? mapRequest(type, data) : null;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapQuote(q: any, type: RequestType | null): Quote {
  return {
    id: q.id,
    number: q.quote_number,
    title: q.title || null,
    requestType: type,
    requestId: type ? q[QUOTE_FK[type]] : null,
    subtotalXOF: Number(q.subtotal_xof || 0),
    shippingXOF: Number(q.shipping_xof || 0),
    customsXOF: Number(q.customs_xof || 0),
    feesXOF: Number(q.fees_xof || 0),
    discountXOF: Number(q.discount_xof || 0),
    totalXOF: Number(q.total_xof || 0),
    depositPercent: Number(q.deposit_required_percent || 0),
    depositXOF: Number(q.deposit_amount_xof || 0),
    balanceXOF: Number(q.balance_due_xof || 0),
    validUntil: q.valid_until,
    leadTime: q.lead_time_days || null,
    transportMode: q.transport_mode || null,
    conditions: q.conditions || [],
    version: q.version || 1,
    status: q.status,
    notes: q.notes || null,
    sentAt: q.sent_at || null,
    acceptedAt: q.accepted_at || null,
    rejectionReason: q.rejection_reason || null,
    createdAt: q.created_at,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    items: (q.quote_items || []).map((i: any) => ({
      id: i.id,
      description: i.description,
      quantity: i.quantity,
      unitPriceXOF: Number(i.unit_price_xof || 0),
      subtotalXOF: Number(i.subtotal_xof || 0)
    }))
  };
}

export async function listQuotes(type: RequestType, requestId: string): Promise<Quote[]> {
  const { data, error } = await supabase
    .from('quotes')
    .select('*, quote_items (id, description, quantity, unit_price_xof, subtotal_xof)')
    .eq(QUOTE_FK[type], requestId)
    .order('created_at', { ascending: false });
  if (error) {
    if (isMigrationError(error) || error.code === '42703') return [];
    throw new AppError(friendlyError(error), error.code);
  }
  return (data || []).filter(q => q.status !== 'draft').map(q => mapQuote(q, type));
}

export async function listStaffQuotes(type: RequestType, requestId: string): Promise<Quote[]> {
  const { data, error } = await supabase
    .from('quotes')
    .select('*, quote_items (id, description, quantity, unit_price_xof, subtotal_xof)')
    .eq(QUOTE_FK[type], requestId)
    .order('created_at', { ascending: false });
  if (error) return [];
  return (data || []).map(q => mapQuote(q, type));
}

export async function listMyQuotes(userId: string): Promise<Quote[]> {
  const { data, error } = await supabase
    .from('quotes')
    .select('*, quote_items (id, description, quantity, unit_price_xof, subtotal_xof)')
    .eq('user_id', userId)
    .neq('status', 'draft')
    .order('created_at', { ascending: false });
  if (error) return [];
  return (data || []).map(q =>
    mapQuote(q, q.sourcing_request_id ? 'sourcing' : q.b2b_request_id ? 'b2b' : q.vehicle_request_id ? 'vehicle' : null)
  );
}

export function respondToQuote(quoteId: string, accept: boolean, reason?: string) {
  return rpc('respond_to_quote', { p_quote_id: quoteId, p_accept: accept, p_reason: reason || null });
}

export function createOrderFromQuote(quoteId: string) {
  return rpc<{ order_id: string; amount_xof: number; kind: string }>('create_order_from_quote', { p_quote_id: quoteId });
}

export async function listQuotePayments(quoteId: string): Promise<{ id: string; kind: string; totalXOF: number; paymentStatus: string; orderStatus: string }[]> {
  const { data, error } = await supabase
    .from('orders')
    .select('id, quote_payment_kind, total_xof, payment_status, order_status')
    .eq('quote_id', quoteId)
    .order('created_at');
  if (error) return [];
  return (data || []).map(o => ({
    id: o.id,
    kind: o.quote_payment_kind,
    totalXOF: Number(o.total_xof || 0),
    paymentStatus: o.payment_status,
    orderStatus: o.order_status
  }));
}

// ---------------------------------------------------------------------------
// Messagerie
// ---------------------------------------------------------------------------

export async function listMessages(type: RequestType | 'order', threadId: string): Promise<Message[]> {
  const { data, error } = await supabase
    .from('messages')
    .select('id, sender_id, sender_role, sender_name, body, attachment_url, created_at')
    .eq('thread_type', type)
    .eq('thread_id', threadId)
    .order('created_at');
  if (error) {
    if (isMigrationError(error)) return [];
    throw new AppError(friendlyError(error), error.code);
  }
  return (data || []).map(m => ({
    id: m.id,
    senderId: m.sender_id,
    senderRole: m.sender_role,
    senderName: m.sender_name,
    body: m.body,
    attachmentUrl: m.attachment_url,
    createdAt: m.created_at
  }));
}

export function postMessage(type: RequestType | 'order', threadId: string, body: string, attachmentUrl?: string | null) {
  return rpc('post_message', {
    p_thread_type: type,
    p_thread_id: threadId,
    p_body: body,
    p_attachment_url: attachmentUrl || null
  });
}

// ---------------------------------------------------------------------------
// Espace professionnel : traitement des demandes
// ---------------------------------------------------------------------------

export function staffUpdateRequest(
  type: RequestType,
  id: string,
  u: { status?: string | null; assignedTo?: string | null; unassign?: boolean; internalNotes?: string | null; messageToClient?: string | null }
) {
  return rpc('staff_update_request', {
    p_type: type,
    p_id: id,
    p_status: u.status || null,
    p_assigned_to: u.assignedTo || null,
    p_internal_notes: u.internalNotes ?? null,
    p_message_to_client: u.messageToClient || null,
    p_unassign: Boolean(u.unassign)
  });
}

export async function listFindings(type: RequestType, requestId: string): Promise<Finding[]> {
  const { data, error } = await supabase
    .from('request_findings')
    .select('*')
    .eq('request_type', type)
    .eq('request_id', requestId)
    .order('created_at');
  if (error) return [];
  return (data || []).map(f => ({
    id: f.id,
    supplierName: f.supplier_name,
    supplierUrl: f.supplier_url,
    unitPriceCNY: f.unit_price_cny !== null ? Number(f.unit_price_cny) : null,
    unitPriceXOF: f.unit_price_xof !== null ? Number(f.unit_price_xof) : null,
    moq: f.moq,
    leadTimeDays: f.lead_time_days,
    notes: f.notes,
    photos: f.photos || [],
    isSelected: Boolean(f.is_selected),
    createdAt: f.created_at
  }));
}

export async function addFinding(
  type: RequestType,
  requestId: string,
  userId: string,
  f: Omit<Finding, 'id' | 'createdAt' | 'isSelected' | 'photos'> & { photos?: string[] }
): Promise<void> {
  unwrap(
    await supabase.from('request_findings').insert({
      request_type: type,
      request_id: requestId,
      supplier_name: f.supplierName,
      supplier_url: f.supplierUrl || null,
      unit_price_cny: f.unitPriceCNY,
      unit_price_xof: f.unitPriceXOF,
      moq: f.moq,
      lead_time_days: f.leadTimeDays,
      notes: f.notes || null,
      photos: f.photos || [],
      created_by: userId
    })
  );
}

export async function selectFinding(type: RequestType, requestId: string, findingId: string): Promise<void> {
  unwrap(await supabase.from('request_findings').update({ is_selected: false }).eq('request_type', type).eq('request_id', requestId));
  unwrap(await supabase.from('request_findings').update({ is_selected: true }).eq('id', findingId));
}

export async function deleteFinding(id: string): Promise<void> {
  unwrap(await supabase.from('request_findings').delete().eq('id', id));
}

export interface QuoteDraft {
  items: { description: string; quantity: number; unit_price_xof: number }[];
  shippingXOF: number;
  customsXOF: number;
  feesXOF: number;
  discountXOF: number;
  depositPercent: number;
  validDays: number;
  leadTime: string;
  transportMode: 'air' | 'sea' | 'express';
  conditions: string[];
  notes: string;
  send: boolean;
}

export function createQuote(type: RequestType, requestId: string, d: QuoteDraft) {
  return rpc<{ id: string; quote_number: string; total_xof: number }>('staff_create_quote', {
    p_type: type,
    p_request_id: requestId,
    p_items: d.items,
    p_shipping_xof: d.shippingXOF,
    p_customs_xof: d.customsXOF,
    p_fees_xof: d.feesXOF,
    p_discount_xof: d.discountXOF,
    p_deposit_percent: d.depositPercent,
    p_valid_days: d.validDays,
    p_lead_time: d.leadTime,
    p_transport_mode: d.transportMode,
    p_conditions: d.conditions,
    p_notes: d.notes,
    p_send: d.send
  });
}
