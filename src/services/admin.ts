import { supabase, rpc, unwrap } from '../lib/db';
import { apiFetch } from '../lib/api';
import type { TeamMember } from '../lib/types';

export interface ActivityItem {
  kind: 'order' | 'payment' | 'sourcing' | 'b2b' | 'vehicle';
  id: string;
  ref: string;
  who: string | null;
  amount: number | null;
  status: string;
  at: string;
  link: string;
}

export interface AdminStats {
  revenue_xof: number;
  revenue_month_xof: number;
  costs_xof: number;
  recorded_costs_xof: number;
  estimated_purchase_xof: number;
  margin_xof: number;
  orders_total: number;
  orders_paid: number;
  orders_pending_payment: number;
  orders_to_process: number;
  orders_in_transit: number;
  groupages_active: number;
  groupages_full: number;
  sourcing_new: number;
  sourcing_open: number;
  b2b_open: number;
  vehicle_open: number;
  quotes_awaiting: number;
  clients_count: number;
  activity: ActivityItem[];
}

export function getAdminStats() {
  return rpc<AdminStats>('admin_dashboard_stats');
}

export interface StaffStats {
  role: 'transitaire' | 'groupage_manager';
  sourcing_new?: number;
  sourcing_mine?: number;
  sourcing_open?: number;
  b2b_open?: number;
  vehicle_open?: number;
  orders_to_process?: number;
  orders_in_transit?: number;
  products_draft?: number;
  groupages_mine?: number;
  groupages_active?: number;
  groupages_full?: number;
  participants?: number;
  orders_paid?: number;
  orders_pending?: number;
}

export function getStaffStats() {
  return rpc<StaffStats>('staff_dashboard_stats');
}

export async function listTeam(): Promise<TeamMember[]> {
  const rows = await rpc<
    { id: string; full_name: string; email: string; phone: string | null; role: string; permissions: string[]; status: string; created_at: string }[]
  >('list_team_members');
  return (rows || []).map(r => ({
    id: r.id,
    fullName: r.full_name || r.email,
    email: r.email,
    phone: r.phone,
    role: r.role,
    permissions: r.permissions || [],
    status: r.status,
    createdAt: r.created_at
  }));
}

export function setUserRole(userId: string, role: string, permissions?: string[], status?: string) {
  return rpc('admin_set_user_role', {
    p_user_id: userId,
    p_role: role,
    p_permissions: permissions ?? null,
    p_status: status ?? null
  });
}

export interface InviteResult {
  inviteUrl: string;
  accountExists: boolean;
  emailSent: boolean;
  emailError?: string;
}

export function inviteMember(p: { email: string; role: string; fullName?: string; permissions: string[] }) {
  return apiFetch<InviteResult>('/api/team/invite', { method: 'POST', body: p });
}

export interface Invitation {
  id: string;
  email: string;
  fullName: string | null;
  role: string;
  status: string;
  token: string;
  createdAt: string;
  expiresAt: string;
}

export async function listInvitations(): Promise<Invitation[]> {
  const { data, error } = await supabase
    .from('team_invitations')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50);
  if (error) return [];
  return (data || []).map(i => ({
    id: i.id,
    email: i.email,
    fullName: i.full_name,
    role: i.role,
    status: i.status === 'pending' && new Date(i.expires_at).getTime() < Date.now() ? 'expired' : i.status,
    token: i.token,
    createdAt: i.created_at,
    expiresAt: i.expires_at
  }));
}

export async function revokeInvitation(id: string): Promise<void> {
  unwrap(await supabase.from('team_invitations').update({ status: 'revoked' }).eq('id', id));
}

export function getInvitation(token: string) {
  return rpc<{ email?: string; role?: string; full_name?: string; status: string }>('get_team_invitation', { p_token: token });
}

export function acceptInvitation(token: string) {
  return rpc<{ applied: boolean; role: string }>('accept_team_invitation', { p_token: token });
}

export interface CustomerRow {
  id: string;
  fullName: string;
  email: string;
  phone: string | null;
  city: string | null;
  companyName: string | null;
  role: string;
  status: string;
  createdAt: string;
}

export async function listCustomers(search?: string): Promise<CustomerRow[]> {
  let query = supabase.from('profiles').select('*').order('created_at', { ascending: false }).limit(300);
  if (search) {
    const s = search.replace(/[,()%*]/g, ' ').trim();
    if (s) query = query.or(`full_name.ilike.%${s}%,email.ilike.%${s}%,phone.ilike.%${s}%`);
  }
  const data = unwrap(await query);
  return (data || []).map(p => ({
    id: p.id,
    fullName: p.full_name || '',
    email: p.email || '',
    phone: p.phone,
    city: p.city,
    companyName: p.company_name || null,
    role: p.role,
    status: p.status,
    createdAt: p.created_at
  }));
}

export interface AdminPaymentRow {
  id: string;
  orderId: string;
  orderCode: string;
  amount: number;
  status: string;
  paymentMethod: string;
  customerName: string;
  customerEmail: string;
  createdAt: string;
  paidAt?: string;
}

export async function listAllPayments(): Promise<AdminPaymentRow[]> {
  const res = await apiFetch<{ payments: AdminPaymentRow[] }>('/api/payments/admin/list');
  return res.payments || [];
}
