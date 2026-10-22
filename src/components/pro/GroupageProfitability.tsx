import React from 'react';
import { AlertTriangle, CheckCircle2, Info, Sparkles, XCircle } from 'lucide-react';
import { computeGroupageEconomics, type CheckTone, type GroupageEconomicsResult } from '../../lib/groupageEconomics';
import { parseNumber } from '../../lib/costSheet';
import type { FinanceContext, TransportMode } from '../../lib/pricing';
import { formatXOF } from '../../lib/format';
import { Card, CardTitle } from '../ui/Layout';
import { Input } from '../ui/Field';

/** Saisie libre (texte) : convertie à la volée, virgule acceptée. */
export interface EcoState {
  purchaseCny: string;
  weightKg: string;
  cbm: string;
  cargoUnit: string;
  fixedCosts: string;
  feePct: string;
  targetMargin: string;
  notes: string;
}

export const EMPTY_ECO: EcoState = { purchaseCny: '', weightKg: '', cbm: '', cargoUnit: '', fixedCosts: '', feePct: '2', targetMargin: '', notes: '' };

export interface EcoParams {
  unitPriceXOF: number;
  originalPriceXOF: number;
  supplierMoq: number;
  targetQuantity: number;
  mode: TransportMode;
}

const n = (v: string) => parseNumber(v);

export function runEconomics(eco: EcoState, p: EcoParams, ctx: FinanceContext): GroupageEconomicsResult {
  return computeGroupageEconomics({
    purchasePriceCNY: n(eco.purchaseCny) ?? 0,
    cnyToXof: ctx.fx.cny_to_xof ?? 0,
    weightKg: n(eco.weightKg) ?? 0,
    cbm: n(eco.cbm) ?? 0,
    mode: p.mode,
    cargoUnitXOF: n(eco.cargoUnit),
    fixedCostsXOF: n(eco.fixedCosts) ?? 0,
    paymentFeePct: n(eco.feePct) ?? 2,
    unitPriceXOF: p.unitPriceXOF,
    originalPriceXOF: p.originalPriceXOF,
    supplierMoq: p.supplierMoq,
    targetQuantity: p.targetQuantity,
    targetMarginPct: n(eco.targetMargin) ?? ctx.targets.target_margin_pct ?? 35,
    minMarginPct: ctx.targets.min_margin_pct ?? 15,
    rate: ctx.freight.find(r => r.transport_mode === p.mode),
    fees: ctx.fees
  });
}

const TONE: Record<CheckTone, { cls: string; Icon: React.ElementType }> = {
  danger: { cls: 'bg-red-50 text-red-800', Icon: XCircle },
  warning: { cls: 'bg-amber-50 text-amber-900', Icon: AlertTriangle },
  success: { cls: 'bg-jade-50 text-emerald-900', Icon: CheckCircle2 },
  info: { cls: 'bg-sky-50 text-sky-900', Icon: Info }
};

const MODE_LABEL: Record<TransportMode, string> = { air: 'avion', sea: 'bateau', express: 'express' };

/**
 * Simulateur de rentabilité : coût livré selon le nombre de participants, seuil de rentabilité,
 * bénéfice par scénario, prix conseillé et alertes, avant même de publier le groupage.
 */
export function GroupageProfitability({
  eco,
  onEco,
  params,
  context,
  onApplyPrice,
  priceLocked
}: {
  eco: EcoState;
  onEco: (patch: Partial<EcoState>) => void;
  params: EcoParams;
  context: FinanceContext;
  onApplyPrice?: (price: number) => void;
  priceLocked?: boolean;
}) {
  const r = runEconomics(eco, params, context);
  const rate = context.freight.find(x => x.transport_mode === params.mode);
  const fx = context.fx.cny_to_xof ?? 0;
  const input = (k: keyof EcoState, v: string) => onEco({ [k]: v.replace(/[^\d.,\s]/g, '') });

  return (
    <Card>
      <CardTitle>Rentabilité du groupage</CardTitle>
      <p className="-mt-2 mb-4 text-[13px] text-muted">
        Renseignez ce que vous coûte le produit : le calcul montre à partir de combien de participants vous gagnez de l’argent, et quel prix fixer.
      </p>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Input label="Prix d’achat / unité" inputMode="decimal" value={eco.purchaseCny} onChange={e => input('purchaseCny', e.target.value)} suffix="¥" hint="Prix négocié avec le fournisseur" />
        <Input label="Poids / unité" inputMode="decimal" value={eco.weightKg} onChange={e => input('weightKg', e.target.value)} suffix="kg" hint="Emballage compris" />
        <Input label="Volume / unité" inputMode="decimal" value={eco.cbm} onChange={e => input('cbm', e.target.value)} suffix="m³" hint="Ex. 0,05 pour 50 × 40 × 25 cm" />
        <Input label="Cargo / unité" inputMode="decimal" value={eco.cargoUnit} onChange={e => input('cargoUnit', e.target.value)} suffix="F" hint="Vide = estimé avec la grille" />
        <Input label="Frais fixes de la campagne" inputMode="decimal" value={eco.fixedCosts} onChange={e => input('fixedCosts', e.target.value)} suffix="F" hint="Dédouanement groupé, livraison locale, publicité…" />
        <Input label="Frais de paiement" inputMode="decimal" value={eco.feePct} onChange={e => input('feePct', e.target.value)} suffix="%" />
        <Input
          label="Marge visée"
          inputMode="decimal"
          value={eco.targetMargin}
          onChange={e => input('targetMargin', e.target.value)}
          suffix="%"
          placeholder={String(context.targets.target_margin_pct ?? 35)}
        />
        <div className="rounded-xl bg-paper px-3 py-2.5 text-[12px] leading-relaxed text-muted">
          1 ¥ = <strong className="text-ink">{fx.toLocaleString('fr-FR')} F</strong>
          <br />
          Transport {MODE_LABEL[params.mode]} : {rate ? `${rate.rate_xof.toLocaleString('fr-FR')} F / ${rate.pricing_unit === 'kg' ? 'kg' : 'm³'}` : 'pas de grille'}
        </div>
      </div>

      {!r.ok ? (
        <p className="mt-4 rounded-2xl bg-paper p-4 text-[13.5px] text-muted">Pour calculer, indiquez {r.missing.join(', ')}.</p>
      ) : (
        <>
          <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Tile label="Coût livré / unité" value={r.atMoq ? formatXOF(r.atMoq.landedUnitXOF) : '—'} hint={`au minimum fournisseur (${params.supplierMoq})`} />
            <Tile
              label="Seuil de rentabilité"
              value={r.breakevenQuantity !== null ? `${r.breakevenQuantity} unité${r.breakevenQuantity > 1 ? 's' : ''}` : params.unitPriceXOF > 0 ? 'Jamais' : '—'}
              hint="à vendre pour ne rien perdre"
              tone={r.breakevenQuantity === null && params.unitPriceXOF > 0 ? 'danger' : r.breakevenQuantity !== null && r.breakevenQuantity > params.targetQuantity ? 'danger' : undefined}
            />
            <Tile
              label="Bénéfice à l’objectif"
              value={r.atTarget ? formatXOF(r.atTarget.profitXOF) : '—'}
              hint={r.atTarget ? `${r.atTarget.marginPct} % · ${params.targetQuantity} unités` : 'fixez le prix de vente'}
              tone={r.atTarget && r.atTarget.profitXOF < 0 ? 'danger' : undefined}
            />
            <div className="rounded-2xl border border-brand-100 bg-brand-50 p-3.5">
              <p className="text-[12px] font-semibold text-brand-700">Prix conseillé / unité</p>
              <p className="num mt-1 font-display text-[20px] font-bold leading-tight">{r.suggestedPriceXOF ? formatXOF(r.suggestedPriceXOF) : '—'}</p>
              {r.suggestedPriceXOF && onApplyPrice && !priceLocked ? (
                <button type="button" onClick={() => onApplyPrice(r.suggestedPriceXOF!)} className="mt-1.5 inline-flex items-center gap-1 text-[12.5px] font-semibold text-brand-700 hover:underline">
                  <Sparkles className="h-3.5 w-3.5" /> Appliquer ce prix
                </button>
              ) : (
                <p className="mt-0.5 text-[11.5px] text-muted">marge visée dès le minimum</p>
              )}
            </div>
          </div>

          {r.checks.length > 0 && (
            <ul className="mt-4 space-y-2">
              {r.checks.map(c => {
                const t = TONE[c.tone];
                return (
                  <li key={c.text} className={`flex gap-2.5 rounded-xl px-3.5 py-2.5 text-[13px] ${t.cls}`}>
                    <t.Icon className="mt-0.5 h-4 w-4 shrink-0" /> {c.text}
                  </li>
                );
              })}
            </ul>
          )}

          {r.scenarios.length > 0 && (
            <div className="mt-5 overflow-x-auto">
              <table className="w-full min-w-[520px] text-[13px]">
                <caption className="mb-2 text-left text-[12.5px] font-bold uppercase tracking-wide text-muted">Selon le nombre d’unités vendues</caption>
                <thead>
                  <tr className="text-left text-[11.5px] font-semibold uppercase tracking-wide text-subtle">
                    <th className="pb-2 pr-3">Unités</th>
                    <th className="pb-2 pr-3 text-right">Coût / unité</th>
                    <th className="pb-2 pr-3 text-right">Encaissé</th>
                    <th className="pb-2 pr-3 text-right">Coût total</th>
                    <th className="pb-2 text-right">Bénéfice</th>
                  </tr>
                </thead>
                <tbody>
                  {r.scenarios.map(s => (
                    <tr key={s.quantity} className="border-t border-line">
                      <td className="py-2 pr-3">
                        <span className="num font-semibold">{s.quantity}</span> <span className="text-[12px] text-muted">{s.label}</span>
                      </td>
                      <td className="num py-2 pr-3 text-right">{formatXOF(s.landedUnitXOF)}</td>
                      <td className="num py-2 pr-3 text-right">{formatXOF(s.revenueXOF)}</td>
                      <td className="num py-2 pr-3 text-right">{formatXOF(s.costXOF)}</td>
                      <td className={`num py-2 text-right font-semibold ${s.profitXOF < 0 ? 'text-red-700' : 'text-jade'}`}>
                        {formatXOF(s.profitXOF)} <span className="text-[11.5px] font-normal text-muted">({s.marginPct} %)</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <details className="mt-4 text-[12.5px] text-muted">
            <summary className="cursor-pointer font-semibold text-ink">Comment c’est calculé</summary>
            <p className="mt-2 leading-relaxed">
              Coût livré = achat (yuans × taux + tampon de change) + fret (grille ou cargo saisi, avec le minimum du transporteur) + douane + contrôle qualité + frais fixes de la campagne, partagés entre les unités vendues. Le bénéfice
              retire aussi les frais de paiement. C’est pourquoi le coût par unité baisse quand le groupage se remplit.
            </p>
          </details>
        </>
      )}
      <div className="mt-4">
        <Input label="Notes internes (fournisseur, négociation…)" value={eco.notes} onChange={e => onEco({ notes: e.target.value })} placeholder="Visible par l’équipe uniquement" />
      </div>
    </Card>
  );
}

function Tile({ label, value, hint, tone }: { label: string; value: string; hint?: string; tone?: 'danger' }) {
  return (
    <div className="rounded-2xl border border-line bg-white p-3.5">
      <p className="text-[12px] font-semibold text-muted">{label}</p>
      <p className={`num mt-1 font-display text-[20px] font-bold leading-tight ${tone === 'danger' ? 'text-red-700' : ''}`}>{value}</p>
      {hint && <p className="mt-0.5 text-[11.5px] text-muted">{hint}</p>}
    </div>
  );
}
