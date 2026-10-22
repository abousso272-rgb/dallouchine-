import { computePricing, DEFAULT_FEES, type FeesStructure, type FreightRate, type TransportMode } from './pricing';

/**
 * Rentabilité d'un groupage : les frais fixes (douane fixe, contrôle qualité, frais engagés) et les minimums
 * de perception du transporteur sont partagés entre les unités vendues. Plus il y a de participants,
 * plus le coût par unité baisse : d'où un seuil de rentabilité à calculer avant de lancer la campagne.
 */

export interface GroupageEconomicsInput {
  purchasePriceCNY: number;
  cnyToXof: number;
  weightKg: number;
  cbm: number;
  mode: TransportMode;
  /** Cargo par unité connu (tarif transporteur). Vide : estimé avec la grille de fret. */
  cargoUnitXOF: number | null;
  /** Frais fixes de la campagne : dédouanement groupé, transport local, publicité, etc. */
  fixedCostsXOF: number;
  paymentFeePct: number;
  unitPriceXOF: number;
  originalPriceXOF: number;
  supplierMoq: number;
  targetQuantity: number;
  targetMarginPct: number;
  minMarginPct: number;
  rate: FreightRate | undefined;
  fees: Partial<FeesStructure>;
}

export interface Scenario {
  quantity: number;
  label: string;
  landedUnitXOF: number;
  revenueXOF: number;
  costXOF: number;
  profitXOF: number;
  marginPct: number;
}

export type CheckTone = 'danger' | 'warning' | 'success' | 'info';

export interface Check {
  tone: CheckTone;
  text: string;
}

export interface GroupageEconomicsResult {
  ok: boolean;
  missing: string[];
  scenarios: Scenario[];
  atMoq: Scenario | null;
  atTarget: Scenario | null;
  /** Nombre d'unités à vendre pour ne pas perdre d'argent (null si jamais rentable à ce prix). */
  breakevenQuantity: number | null;
  /** Prix qui donne la marge visée dès la quantité minimale du fournisseur (prudent). */
  suggestedPriceXOF: number | null;
  clientSavingPct: number | null;
  checks: Check[];
}

function scenarioAt(i: GroupageEconomicsInput, q: number, label: string): Scenario | null {
  const res = computePricing({
    quantity: q,
    unitPriceCNY: i.purchasePriceCNY,
    weightKg: i.weightKg,
    cbm: i.cbm,
    mode: i.mode,
    cnyToXof: i.cnyToXof,
    rate: i.rate,
    fees: { ...DEFAULT_FEES, ...i.fees },
    marginPct: 0,
    paymentFeePct: 0,
    extraCostXOF: Math.max(0, i.fixedCostsXOF),
    freightPerUnitOverrideXOF: i.cargoUnitXOF && i.cargoUnitXOF > 0 ? i.cargoUnitXOF : undefined
  });
  if (!res.ok) return null;
  const revenue = i.unitPriceXOF * q;
  const cost = res.landedCostXOF + (revenue * Math.max(0, i.paymentFeePct)) / 100;
  const profit = revenue - cost;
  return {
    quantity: q,
    label,
    landedUnitXOF: Math.round(res.landedCostXOF / q),
    revenueXOF: Math.round(revenue),
    costXOF: Math.round(cost),
    profitXOF: Math.round(profit),
    marginPct: revenue > 0 ? Math.round((profit / revenue) * 1000) / 10 : 0
  };
}

export function computeGroupageEconomics(i: GroupageEconomicsInput): GroupageEconomicsResult {
  const missing: string[] = [];
  if (!(i.purchasePriceCNY > 0)) missing.push('le prix d’achat (¥)');
  if (!(i.cnyToXof > 0)) missing.push('le taux de change');
  if (!(i.cargoUnitXOF && i.cargoUnitXOF > 0) && !(i.weightKg > 0) && !(i.cbm > 0)) missing.push('le poids ou le volume (ou le cargo par unité)');
  if (!(i.cargoUnitXOF && i.cargoUnitXOF > 0) && !i.rate) missing.push('une grille de fret pour ce transport');
  const moq = Math.max(1, Math.floor(i.supplierMoq || 1));
  const target = Math.max(1, Math.floor(i.targetQuantity || 1));
  const empty: GroupageEconomicsResult = { ok: false, missing, scenarios: [], atMoq: null, atTarget: null, breakevenQuantity: null, suggestedPriceXOF: null, clientSavingPct: null, checks: [] };
  if (missing.length) return empty;

  const fee = Math.max(0, i.paymentFeePct);
  const atMoqCost = scenarioAt({ ...i, unitPriceXOF: 0 }, moq, '');
  const suggested = atMoqCost ? Math.ceil(atMoqCost.landedUnitXOF / (1 - (Math.min(90, i.targetMarginPct) + fee) / 100) / 100) * 100 : null;

  const checks: Check[] = [];
  const clientSaving = i.originalPriceXOF > 0 && i.unitPriceXOF > 0 && i.originalPriceXOF > i.unitPriceXOF ? Math.round(((i.originalPriceXOF - i.unitPriceXOF) / i.originalPriceXOF) * 100) : null;

  if (!(i.unitPriceXOF > 0)) {
    return { ...empty, ok: true, missing: [], suggestedPriceXOF: suggested, checks: [{ tone: 'info', text: 'Fixez le prix de vente par unité (ou appliquez le prix conseillé) pour voir le bénéfice.' }] };
  }

  const qs = [...new Set([moq, Math.round((moq + target) / 2), target, Math.round(target * 1.5)].filter(q => q >= 1))].sort((a, b) => a - b);
  const scenarios = qs
    .map(q => scenarioAt(i, q, q === moq && q === target ? 'Minimum = objectif' : q === moq ? 'Minimum fournisseur' : q === target ? 'Objectif' : q > target ? 'Au-delà de l’objectif' : 'Intermédiaire'))
    .filter((s): s is Scenario => Boolean(s));
  const atMoq = scenarios.find(s => s.quantity === moq) || null;
  const atTarget = scenarios.find(s => s.quantity === target) || null;

  // Seuil de rentabilité : première quantité sans perte (jusqu'à 3 fois l'objectif)
  let breakeven: number | null = null;
  const limit = Math.max(target * 3, moq * 3, 50);
  const step = limit > 3000 ? Math.ceil(limit / 3000) : 1;
  for (let q = 1; q <= limit; q += step) {
    const s = scenarioAt(i, q, '');
    if (s && s.profitXOF >= 0) {
      breakeven = q;
      break;
    }
  }

  if (moq > target) checks.push({ tone: 'danger', text: `La quantité minimale du fournisseur (${moq}) dépasse l’objectif (${target}) : même complet, le groupage ne peut pas être commandé. Montez l’objectif à ${moq} au moins.` });
  if (breakeven === null) checks.push({ tone: 'danger', text: 'À ce prix, le groupage perd de l’argent quelle que soit la quantité : augmentez le prix de vente.' });
  else if (breakeven > target) checks.push({ tone: 'danger', text: `Il faut vendre ${breakeven} unités pour ne pas perdre d’argent, plus que l’objectif (${target}). Augmentez le prix ou l’objectif.` });
  else if (breakeven > moq) checks.push({ tone: 'warning', text: `Rentable à partir de ${breakeven} unités : si vous lancez la commande au minimum fournisseur (${moq}), vous perdez de l’argent. Ne validez qu’à ${breakeven} unités ou plus, ou augmentez le prix.` });
  else checks.push({ tone: 'success', text: `Rentable dès ${breakeven} unité${breakeven > 1 ? 's' : ''}, avant même le minimum fournisseur (${moq}).` });

  if (atTarget && atTarget.marginPct < i.minMarginPct && atTarget.profitXOF >= 0) checks.push({ tone: 'warning', text: `Marge de ${atTarget.marginPct} % à l’objectif, sous le minimum de ${i.minMarginPct} % fixé par l’administration.` });
  if (suggested && i.unitPriceXOF < suggested && breakeven !== null && breakeven <= moq) checks.push({ tone: 'info', text: `Prix conseillé pour ${i.targetMarginPct} % de marge dès le minimum fournisseur : ${suggested.toLocaleString('fr-FR')} FCFA.` });
  if (clientSaving === null && i.originalPriceXOF <= 0) checks.push({ tone: 'info', text: 'Indiquez le prix hors groupage (marché local) : l’économie affichée est ce qui convainc les clients de rejoindre.' });
  else if (clientSaving !== null && clientSaving < 10) checks.push({ tone: 'warning', text: `L’économie pour le client n’est que de ${clientSaving} % : en dessous de 10 %, un groupage attire peu. Visez 15 à 30 %.` });
  else if (clientSaving !== null) checks.push({ tone: 'success', text: `Le client économise ${clientSaving} % par rapport au prix hors groupage.` });

  return { ok: true, missing: [], scenarios, atMoq, atTarget, breakevenQuantity: breakeven, suggestedPriceXOF: suggested, clientSavingPct: clientSaving, checks };
}
