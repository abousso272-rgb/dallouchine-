import { AppError, friendlyError, rpc, supabase } from '../lib/db';
import type { FinanceContext } from '../lib/pricing';

// ---------------------------------------------------------------------------
// Vue d'ensemble financière (administration)
// ---------------------------------------------------------------------------

export interface FinanceMonth {
  month: string;
  revenue_xof: number;
  margin_xof: number;
  orders: number;
}

export interface FinanceChannel {
  kind: string;
  orders: number;
  revenue_xof: number;
  margin_xof: number;
  margin_pct: number | null;
}

export interface FinanceOrderRef {
  order_id: string;
  tracking_code: string;
  customer_name: string | null;
  revenue_xof: number;
  margin_xof?: number;
  margin_pct?: number;
}

export interface RiskyGroupage extends GroupageMetrics {}

export interface FinanceOverview {
  revenue_xof: number;
  revenue_with_costs_xof: number;
  coverage_pct: number;
  payment_fees_xof: number;
  purchase_xof: number;
  logistics_xof: number;
  other_costs_xof: number;
  margin_xof: number;
  margin_pct: number | null;
  orders_paid: number;
  orders_missing_costs: number;
  orders_partial_costs: number;
  min_margin_pct: number;
  monthly: FinanceMonth[];
  channels: FinanceChannel[];
  low_margin_orders: FinanceOrderRef[];
  missing_cost_orders: FinanceOrderRef[];
  cash: {
    collected_month_xof: number;
    pending_count: number;
    pending_xof: number;
    abandoned_count: number;
    abandoned_xof: number;
    abandon_hours: number;
    refunded_xof: number;
    refunds_pending_count: number;
    refunds_pending_xof: number;
    orders_created_30d: number;
    orders_paid_30d: number;
    payment_rate_pct: number;
    payment_rate_source: string;
  };
  forecast: {
    quotes_open_count: number;
    quotes_open_xof: number;
    quote_conversion_pct: number;
    quote_conversion_source: string;
    quotes_expected_xof: number;
    pending_orders_xof: number;
    pending_expected_xof: number;
    groupages_expected_xof: number;
    expected_total_xof: number;
    groupages_at_risk: RiskyGroupage[];
    assumptions: string[];
  };
  fx: { cny_to_xof?: number; usd_to_xof?: number };
  fx_history: { cny_to_xof: number; usd_to_xof: number | null; at: string }[];
  targets: Record<string, number>;
}

export function getFinanceOverview(months = 6) {
  return rpc<FinanceOverview>('admin_finance_overview', { p_months: months });
}

export interface OrderFinancials {
  order_id: string;
  revenue_xof: number;
  payment_fee_xof: number;
  purchase_xof: number;
  purchase_source: 'recorded' | 'estimated' | 'missing';
  logistics_xof: number;
  logistics_source: 'recorded' | 'logistics' | 'estimated' | 'missing';
  other_xof: number;
  total_cost_xof: number;
  margin_xof: number | null;
  margin_pct: number | null;
  cost_quality: 'complete' | 'partial' | 'missing';
}

/** Marge détaillée d'une commande payée (null si la commande n'est pas payée). */
export function getOrderFinancials(orderId: string) {
  return rpc<OrderFinancials | null>('staff_order_financials', { p_order_id: orderId });
}

// ---------------------------------------------------------------------------
// Groupages : cockpit du gestionnaire
// ---------------------------------------------------------------------------

export type GroupageRisk = 'inactive' | 'confirmed' | 'reached' | 'failed' | 'on_track' | 'at_risk' | 'critical';

export interface ExpiringReservation {
  participant_id: string;
  user_id: string;
  name: string | null;
  phone: string | null;
  quantity: number;
  total_xof: number;
  expires_at: string;
  hours_left: number;
}

export interface GroupageMetrics {
  id: string;
  code: string;
  title: string;
  status: string;
  deadline: string;
  unit_price_xof: number;
  target_quantity: number | null;
  supplier_moq: number;
  paid_quantity: number;
  reserved_quantity: number;
  active_quantity: number;
  progress_moq_pct: number;
  progress_target_pct: number | null;
  velocity_per_day: number;
  days_left: number;
  projected_quantity: number;
  days_to_moq: number | null;
  risk: GroupageRisk;
  probability: number;
  collected_xof: number;
  pending_xof: number;
  unit_cost_xof: number | null;
  supplier_due_estimate_xof: number | null;
  expiring_count: number;
  expiring_quantity: number;
  expiring_xof: number;
  expiring?: ExpiringReservation[];
}

export interface GroupageCockpit extends GroupageMetrics {
  daily_joins: { day: string; quantity: number }[];
  participants_by_status: Record<string, number>;
  refunds_pending: number;
  margin_visible: boolean;
  unit_margin_xof?: number;
  unit_margin_pct?: number | null;
  margin_collected_xof?: number;
  margin_if_target_xof?: number;
}

export function getGroupageCockpit(groupageId: string) {
  return rpc<GroupageCockpit | null>('groupage_cockpit', { p_groupage_id: groupageId });
}

export function getManagerGroupages() {
  return rpc<GroupageMetrics[]>('manager_groupage_overview');
}

export function remindGroupageReservations(groupageId: string) {
  return rpc<{ success: boolean; notified: number }>('staff_remind_groupage_reservations', { p_groupage_id: groupageId });
}

// ---------------------------------------------------------------------------
// Transitaire : file de demandes et délais de réponse
// ---------------------------------------------------------------------------

export interface TransitaireOverview {
  queue: { type: 'sourcing' | 'b2b' | 'vehicle'; id: string; code: string; label: string | null; age_hours: number }[];
  waiting_over_24h: number;
  waiting_over_48h: number;
  avg_response_hours: number | null;
  quotes_resolved_90d: number;
  quote_conversion_pct: number | null;
  quotes_open_count: number;
  quotes_open_xof: number;
  quotes_expiring_3d: number;
}

export function getTransitaireOverview() {
  return rpc<TransitaireOverview>('transitaire_overview');
}

// ---------------------------------------------------------------------------
// Contexte de prix (taux de change, grille de fret, frais) et réglages
// ---------------------------------------------------------------------------

/**
 * Taux de change, grille de fret et frais. Utilise la fonction SQL dédiée ; tant qu'elle n'est pas installée,
 * lit directement les mêmes réglages (publics) : le tableur, le calculateur et les devis fonctionnent dans les deux cas.
 */
export async function getFinanceContext(): Promise<FinanceContext> {
  const res = await supabase.rpc('get_finance_context');
  if (!res.error) return res.data as FinanceContext;
  if (!(res.error.code === 'PGRST202' || res.error.code === '42883' || /could not find the function|schema cache/i.test(res.error.message))) {
    throw new AppError(friendlyError(res.error), res.error.code);
  }
  const [settings, rates] = await Promise.all([
    supabase.from('platform_settings').select('key, value').in('key', ['exchange_rates', 'fees_structure', 'finance_targets']),
    supabase.from('transport_rates').select('*').eq('active', true)
  ]);
  if (settings.error) throw new AppError(friendlyError(settings.error), settings.error.code);
  const by = Object.fromEntries((settings.data || []).map(r => [r.key as string, r.value])) as Record<string, any>;
  return {
    fx: by.exchange_rates || {},
    targets: by.finance_targets || {},
    fees: by.fees_structure || {},
    freight: ((rates.data || []) as any[])
      .filter(r => !r.valid_until || new Date(r.valid_until) > new Date())
      .map(r => ({
        transport_mode: r.transport_mode,
        pricing_unit: r.pricing_unit,
        rate_xof: Number(r.rate_xof),
        min_charge_xof: Number(r.min_charge_xof || 0),
        volumetric_factor: Number(r.volumetric_factor || 0),
        days_min: r.base_transit_days_min,
        days_max: r.base_transit_days_max
      })),
    fx_history: []
  };
}

export async function setExchangeRate(cnyToXof: number, usdToXof?: number | null) {
  const res = await supabase.rpc('admin_set_exchange_rate', { p_cny_to_xof: cnyToXof, p_usd_to_xof: usdToXof ?? null });
  if (!res.error) return res.data;
  if (!(res.error.code === 'PGRST202' || res.error.code === '42883' || /could not find the function|schema cache/i.test(res.error.message))) {
    throw new AppError(friendlyError(res.error), res.error.code);
  }
  // Fonction SQL pas encore installée : l'administrateur peut modifier le réglage directement, pas le transitaire
  const current = await supabase.from('platform_settings').select('value').eq('key', 'exchange_rates').maybeSingle();
  const value = { ...(current.data?.value as object | undefined), cny_to_xof: cnyToXof, ...(usdToXof ? { usd_to_xof: usdToXof } : {}) };
  const upd = await supabase.from('platform_settings').update({ value }).eq('key', 'exchange_rates').select('key');
  if (upd.error || !upd.data?.length) {
    throw new AppError('Votre profil ne peut pas encore modifier le taux : la mise à jour de la base (migration) doit être appliquée par l’administrateur.');
  }
  return value;
}

export function updateFinanceTargets(targets: Record<string, number>) {
  return rpc('admin_update_finance_targets', { p_targets: targets });
}

// ---------------------------------------------------------------------------
// Audience du site (statistiques maison)
// ---------------------------------------------------------------------------

export interface Audience {
  days: number;
  visits: number;
  pageviews: number;
  visits_today: number;
  visits_prev: number;
  bounce_pct: number | null;
  pages_per_visit: number | null;
  daily: { day: string; visits: number }[];
  sources: { source: string; visits: number }[];
  countries: { country: string; visits: number }[];
  devices: { device: string; visits: number }[];
  pages: { path: string; views: number }[];
  landings: { path: string; visits: number }[];
  campaigns: { campaign: string; source: string; visits: number }[];
  events: Record<string, number>;
  signups: number;
  orders: number;
  orders_paid: number;
  requests: number;
  first_event_at: string | null;
}

export function getAudience(days: number) {
  return rpc<Audience>('admin_audience', { p_days: days });
}
