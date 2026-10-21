/**
 * Calcul du prix de vente d'un import Chine → Sénégal à partir du coût réel livré.
 * Fonctions pures (aucun accès réseau) : testables et réutilisables dans le devis et le calculateur.
 *
 *   coût livré = marchandise (yuans × taux × tampon de change) + fret + douane + contrôle + consolidation + autres
 *   prix de vente = coût livré / (1 − marge cible − frais de paiement)      (marge exprimée sur le prix de vente)
 */

export type TransportMode = 'air' | 'sea' | 'express';

export interface FreightRate {
  transport_mode: TransportMode;
  pricing_unit: 'kg' | 'cbm';
  rate_xof: number;
  min_charge_xof: number;
  volumetric_factor: number;
  days_min: number | null;
  days_max: number | null;
}

export interface FeesStructure {
  buffer_percent: number;
  customs_percent: number;
  customs_fixed_xof: number;
  inspection_fixed_xof: number;
  sourcing_fee_percent: number;
  consolidation_cbm_xof: number;
  default_margin_percent: number;
}

export interface FinanceContext {
  fx: { cny_to_xof?: number; usd_to_xof?: number };
  targets: Partial<FinanceTargets>;
  fees: Partial<FeesStructure>;
  freight: FreightRate[];
  fx_history: { cny_to_xof: number; at: string }[];
}

export interface FinanceTargets {
  min_margin_pct: number;
  target_margin_pct: number;
  quote_conversion_pct: number;
  payment_rate_pct: number;
  abandon_hours: number;
}

export const DEFAULT_FEES: FeesStructure = {
  buffer_percent: 5,
  customs_percent: 6,
  customs_fixed_xof: 25000,
  inspection_fixed_xof: 15000,
  sourcing_fee_percent: 4.5,
  consolidation_cbm_xof: 12000,
  default_margin_percent: 35
};

export interface PricingInput {
  quantity: number;
  unitPriceCNY: number;
  /** Poids et volume d'UNE unité (kg, m³). */
  weightKg: number;
  cbm: number;
  mode: TransportMode;
  cnyToXof: number;
  rate: FreightRate | undefined;
  fees: FeesStructure;
  /** Marge visée, en % du prix de vente. */
  marginPct: number;
  /** Frais de passerelle de paiement, en % du prix de vente (0 si payés par le client). */
  paymentFeePct: number;
  /** Coûts supplémentaires libres (emballage, livraison locale…). */
  extraCostXOF: number;
}

export interface PricingLine {
  key: string;
  label: string;
  amountXOF: number;
  hint?: string;
}

export interface PricingResult {
  ok: boolean;
  errors: string[];
  warnings: string[];
  lines: PricingLine[];
  goodsXOF: number;
  freightXOF: number;
  customsXOF: number;
  /** Contrôle qualité + consolidation + autres. */
  serviceCostsXOF: number;
  landedCostXOF: number;
  sellingPriceXOF: number;
  unitSellingPriceXOF: number;
  unitLandedCostXOF: number;
  paymentFeeXOF: number;
  marginXOF: number;
  marginPct: number;
  chargeableLabel: string;
  /** Répartition prête pour le devis : le total reste égal au prix de vente calculé. */
  quote: { unitPriceXOF: number; shippingXOF: number; customsXOF: number; feesXOF: number };
}

const round = (n: number) => Math.round(n);

/** Fret d'après la grille tarifaire : poids taxable (réel ou volumétrique) ou m³ taxable, avec minimum de perception. */
export function computeFreight(rate: FreightRate | undefined, totalWeightKg: number, totalCbm: number) {
  if (!rate) return { xof: 0, label: '' };
  if (rate.pricing_unit === 'kg') {
    const volumetric = totalCbm > 0 && rate.volumetric_factor > 0 ? (totalCbm * 1_000_000) / rate.volumetric_factor : 0;
    const chargeable = Math.max(totalWeightKg, volumetric);
    return {
      xof: chargeable > 0 ? Math.max(rate.min_charge_xof, chargeable * rate.rate_xof) : 0,
      label: `${chargeable.toLocaleString('fr-FR', { maximumFractionDigits: 1 })} kg taxables${volumetric > totalWeightKg ? ' (poids volumétrique)' : ''}`
    };
  }
  const weightAsCbm = rate.volumetric_factor > 0 ? totalWeightKg / rate.volumetric_factor : 0;
  const chargeable = Math.max(totalCbm, weightAsCbm);
  return {
    xof: chargeable > 0 ? Math.max(rate.min_charge_xof, chargeable * rate.rate_xof) : 0,
    label: `${chargeable.toLocaleString('fr-FR', { maximumFractionDigits: 2 })} m³ taxables`
  };
}

export function computePricing(i: PricingInput): PricingResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const qty = Math.max(0, Math.floor(i.quantity));

  if (qty < 1) errors.push('Indiquez une quantité.');
  if (!(i.unitPriceCNY > 0)) errors.push('Indiquez le prix unitaire en yuans.');
  if (!(i.cnyToXof > 0)) errors.push('Le taux de change yuan → FCFA est manquant.');
  if (!i.rate) errors.push('Aucune grille de transport active pour ce mode.');
  if (!(i.weightKg > 0) && !(i.cbm > 0)) errors.push('Indiquez le poids ou le volume d’une unité pour calculer le fret.');
  const feePct = Math.max(0, i.paymentFeePct);
  const marginPct = Math.max(0, i.marginPct);
  if (marginPct + feePct >= 95) errors.push('La marge et les frais de paiement dépassent 95 % du prix.');

  const empty: PricingResult = {
    ok: false, errors, warnings, lines: [], goodsXOF: 0, freightXOF: 0, customsXOF: 0, serviceCostsXOF: 0, landedCostXOF: 0,
    sellingPriceXOF: 0, unitSellingPriceXOF: 0, unitLandedCostXOF: 0, paymentFeeXOF: 0, marginXOF: 0, marginPct: 0, chargeableLabel: '',
    quote: { unitPriceXOF: 0, shippingXOF: 0, customsXOF: 0, feesXOF: 0 }
  };
  if (errors.length) return empty;

  const effectiveFx = i.cnyToXof * (1 + Math.max(0, i.fees.buffer_percent) / 100);
  const goods = i.unitPriceCNY * qty * effectiveFx;
  const totalWeight = i.weightKg * qty;
  const totalCbm = i.cbm * qty;
  const freight = computeFreight(i.rate, totalWeight, totalCbm);
  const customs = (i.fees.customs_percent / 100) * (goods + freight.xof) + i.fees.customs_fixed_xof;
  const inspection = i.fees.inspection_fixed_xof;
  const consolidation = totalCbm > 0 ? i.fees.consolidation_cbm_xof * totalCbm : 0;
  const extra = Math.max(0, i.extraCostXOF);
  const serviceCosts = inspection + consolidation + extra;
  const landed = goods + freight.xof + customs + serviceCosts;

  const sellingRaw = landed / (1 - (marginPct + feePct) / 100);
  const quoteShipping = round(freight.xof);
  const quoteCustoms = round(customs);
  const quoteFees = round(serviceCosts);
  // Prix unitaire arrondi au franc supérieur : le total du devis ne descend jamais sous le prix visé.
  const unitPrice = Math.ceil((sellingRaw - quoteShipping - quoteCustoms - quoteFees) / qty);
  const selling = unitPrice * qty + quoteShipping + quoteCustoms + quoteFees;
  const paymentFee = (selling * feePct) / 100;
  const margin = selling - landed - paymentFee;

  if (!i.weightKg || i.weightKg <= 0) warnings.push('Poids unitaire absent : le fret est calculé sur le volume seul.');
  if (!i.cbm || i.cbm <= 0) warnings.push('Volume unitaire absent : le fret est calculé sur le poids seul (risque de sous-estimer un colis volumineux).');
  if (i.rate && i.rate.min_charge_xof > 0 && freight.xof === i.rate.min_charge_xof) warnings.push('Le minimum de perception du transporteur s’applique : le fret par unité baisse avec la quantité.');

  const lines: PricingLine[] = [
    { key: 'goods', label: 'Marchandise', amountXOF: round(goods), hint: `${qty} × ${i.unitPriceCNY} ¥ × ${effectiveFx.toFixed(2)} (taux + tampon ${i.fees.buffer_percent} %)` },
    { key: 'freight', label: 'Fret international', amountXOF: quoteShipping, hint: freight.label },
    { key: 'customs', label: 'Douane et taxes', amountXOF: quoteCustoms, hint: `${i.fees.customs_percent} % + ${i.fees.customs_fixed_xof.toLocaleString('fr-FR')} F fixes` },
    { key: 'inspection', label: 'Contrôle qualité', amountXOF: round(inspection) },
    ...(consolidation > 0 ? [{ key: 'consolidation', label: 'Consolidation', amountXOF: round(consolidation) }] : []),
    ...(extra > 0 ? [{ key: 'extra', label: 'Autres coûts', amountXOF: round(extra) }] : [])
  ];

  return {
    ok: true,
    errors,
    warnings,
    lines,
    goodsXOF: round(goods),
    freightXOF: quoteShipping,
    customsXOF: quoteCustoms,
    serviceCostsXOF: quoteFees,
    landedCostXOF: round(landed),
    sellingPriceXOF: selling,
    unitSellingPriceXOF: round(selling / qty),
    unitLandedCostXOF: round(landed / qty),
    paymentFeeXOF: round(paymentFee),
    marginXOF: round(margin),
    marginPct: selling > 0 ? Math.round((margin / selling) * 1000) / 10 : 0,
    chargeableLabel: freight.label,
    quote: { unitPriceXOF: unitPrice, shippingXOF: quoteShipping, customsXOF: quoteCustoms, feesXOF: quoteFees }
  };
}

/** Marge réelle d'un devis en cours de saisie, d'après le coût livré calculé. */
export function quoteMargin(landedCostXOF: number, totalXOF: number, paymentFeePct: number) {
  const fee = (totalXOF * Math.max(0, paymentFeePct)) / 100;
  const margin = totalXOF - landedCostXOF - fee;
  return { marginXOF: Math.round(margin), marginPct: totalXOF > 0 ? Math.round((margin / totalXOF) * 1000) / 10 : 0 };
}
