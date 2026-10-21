import { rpc } from '../lib/db';
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

export function getFinanceContext() {
  return rpc<FinanceContext>('get_finance_context');
}

export function setExchangeRate(cnyToXof: number, usdToXof?: number | null) {
  return rpc('admin_set_exchange_rate', { p_cny_to_xof: cnyToXof, p_usd_to_xof: usdToXof ?? null });
}

export function updateFinanceTargets(targets: Record<string, number>) {
  return rpc('admin_update_finance_targets', { p_targets: targets });
}
