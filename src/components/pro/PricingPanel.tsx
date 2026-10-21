import React, { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle2, Clock } from 'lucide-react';
import { computePricing, DEFAULT_FEES, type FeesStructure, type FinanceContext, type PricingResult, type TransportMode } from '../../lib/pricing';
import { formatXOF } from '../../lib/format';
import { Button } from '../ui/Button';
import { Input, Select } from '../ui/Field';
import { InlineAlert } from '../ui/States';

export interface PricingSeed {
  quantity?: number;
  unitPriceCNY?: number | null;
  mode?: TransportMode;
}

export interface AppliedPricing {
  result: PricingResult;
  quantity: number;
  paymentFeePct: number;
  mode: TransportMode;
}

const MODE_LABEL: Record<TransportMode, string> = { air: 'Aérien', sea: 'Maritime', express: 'Express' };
const dec = (v: string) => Number(v.replace(/\s/g, '').replace(',', '.')) || 0;

/** Calcul du prix de vente à partir du coût réel livré : change, fret, douane, marge cible. */
export function PricingPanel({
  context,
  seed,
  onApply,
  applyLabel = 'Appliquer au devis'
}: {
  context: FinanceContext;
  seed?: PricingSeed;
  onApply?: (applied: AppliedPricing) => void;
  applyLabel?: string;
}) {
  const fees: FeesStructure = { ...DEFAULT_FEES, ...context.fees };
  const defaultMargin = context.targets.target_margin_pct ?? fees.default_margin_percent;
  const minMargin = context.targets.min_margin_pct ?? 15;
  const fx = context.fx.cny_to_xof ?? 0;

  const [quantity, setQuantity] = useState(String(seed?.quantity ?? 100));
  const [priceCny, setPriceCny] = useState(seed?.unitPriceCNY ? String(seed.unitPriceCNY) : '');
  const [weight, setWeight] = useState('');
  const [cbm, setCbm] = useState('');
  const [mode, setMode] = useState<TransportMode>(seed?.mode ?? 'sea');
  const [margin, setMargin] = useState(String(defaultMargin));
  const [feePct, setFeePct] = useState('2');
  const [extra, setExtra] = useState('');

  useEffect(() => {
    if (seed?.unitPriceCNY) setPriceCny(String(seed.unitPriceCNY));
  }, [seed?.unitPriceCNY]);
  useEffect(() => {
    if (seed?.quantity) setQuantity(String(seed.quantity));
  }, [seed?.quantity]);
  useEffect(() => {
    if (seed?.mode) setMode(seed.mode);
  }, [seed?.mode]);

  const rate = context.freight.find(r => r.transport_mode === mode);
  const result = useMemo(
    () =>
      computePricing({
        quantity: Math.floor(dec(quantity)),
        unitPriceCNY: dec(priceCny),
        weightKg: dec(weight),
        cbm: dec(cbm),
        mode,
        cnyToXof: fx,
        rate,
        fees,
        marginPct: dec(margin),
        paymentFeePct: dec(feePct),
        extraCostXOF: dec(extra)
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [quantity, priceCny, weight, cbm, mode, fx, rate, margin, feePct, extra, context.fees]
  );

  const belowMin = result.ok && result.marginPct < minMargin;
  const showErrors = Boolean(priceCny || weight || cbm);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Input label="Quantité" inputMode="numeric" value={quantity} onChange={e => setQuantity(e.target.value.replace(/\D/g, ''))} />
        <Input label="Prix unitaire" inputMode="decimal" value={priceCny} onChange={e => setPriceCny(e.target.value.replace(/[^\d.,]/g, ''))} suffix="¥" />
        <Input label="Poids d’une unité" inputMode="decimal" value={weight} onChange={e => setWeight(e.target.value.replace(/[^\d.,]/g, ''))} suffix="kg" placeholder="0,3" />
        <Input label="Volume d’une unité" inputMode="decimal" value={cbm} onChange={e => setCbm(e.target.value.replace(/[^\d.,]/g, ''))} suffix="m³" placeholder="0,002" />
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Select
          label="Transport"
          value={mode}
          onChange={e => setMode(e.target.value as TransportMode)}
          options={(['sea', 'air', 'express'] as TransportMode[]).map(m => {
            const r = context.freight.find(x => x.transport_mode === m);
            return { value: m, label: `${MODE_LABEL[m]}${r?.days_min ? ` · ${r.days_min}-${r.days_max} j` : ''}` };
          })}
        />
        <Input label="Marge visée" inputMode="decimal" value={margin} onChange={e => setMargin(e.target.value.replace(/[^\d.,]/g, ''))} suffix="%" />
        <Input label="Frais de paiement" inputMode="decimal" value={feePct} onChange={e => setFeePct(e.target.value.replace(/[^\d.,]/g, ''))} suffix="%" />
        <Input label="Autres coûts" inputMode="numeric" value={extra} onChange={e => setExtra(e.target.value.replace(/\D/g, ''))} suffix="F" />
      </div>
      <p className="text-[12px] text-muted">
        Taux appliqué : <strong className="text-ink">1 ¥ = {fx ? fx.toLocaleString('fr-FR') : '—'} F</strong> + tampon de change {fees.buffer_percent} %. Douane {fees.customs_percent} % + {formatXOF(fees.customs_fixed_xof)}, contrôle qualité {formatXOF(fees.inspection_fixed_xof)}.
      </p>

      {!result.ok && showErrors && (
        <ul className="rounded-2xl bg-paper p-3 text-[13px] text-muted">
          {result.errors.map(e => (
            <li key={e}>• {e}</li>
          ))}
        </ul>
      )}

      {result.ok && (
        <div className="grid gap-4 rounded-2xl border border-line bg-white p-4 sm:grid-cols-[1.1fr_1fr]">
          <div>
            <p className="text-[12px] font-semibold uppercase tracking-wide text-muted">Prix de vente conseillé</p>
            <p className="num font-display text-[30px] font-bold leading-tight">{formatXOF(result.sellingPriceXOF)}</p>
            <p className="text-[13px] text-muted">
              soit <strong className="text-ink">{formatXOF(result.unitSellingPriceXOF)}</strong> l’unité, livré · coût réel {formatXOF(result.unitLandedCostXOF)} l’unité
            </p>
            <p className={`mt-3 inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12.5px] font-semibold ${belowMin ? 'bg-amber-50 text-amber-800' : 'bg-jade-50 text-jade'}`}>
              {belowMin ? <AlertTriangle className="h-3.5 w-3.5" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
              Marge {formatXOF(result.marginXOF)} · {result.marginPct} %
            </p>
            {rate?.days_min ? (
              <p className="mt-3 flex items-center gap-1.5 text-[12.5px] text-muted">
                <Clock className="h-3.5 w-3.5" /> Transit {MODE_LABEL[mode].toLowerCase()} : {rate.days_min} à {rate.days_max} jours
              </p>
            ) : null}
          </div>
          <dl className="space-y-1.5 text-[13px]">
            {result.lines.map(l => (
              <div key={l.key} className="flex items-baseline justify-between gap-3">
                <dt className="text-muted">
                  {l.label}
                  {l.hint && <span className="block text-[11px] text-subtle">{l.hint}</span>}
                </dt>
                <dd className="num font-semibold">{formatXOF(l.amountXOF)}</dd>
              </div>
            ))}
            <div className="flex justify-between gap-3 border-t border-line pt-1.5 font-semibold">
              <dt>Coût livré</dt>
              <dd className="num">{formatXOF(result.landedCostXOF)}</dd>
            </div>
            {result.paymentFeeXOF > 0 && (
              <div className="flex justify-between gap-3 text-muted">
                <dt>Frais de paiement</dt>
                <dd className="num">{formatXOF(result.paymentFeeXOF)}</dd>
              </div>
            )}
          </dl>
        </div>
      )}

      {result.ok && belowMin && (
        <InlineAlert tone="warning">
          La marge ({result.marginPct} %) est sous le seuil de {minMargin} % fixé par l’administration. Augmentez la marge visée ou revoyez le coût d’achat.
        </InlineAlert>
      )}
      {result.warnings.map(w => (
        <p key={w} className="flex gap-2 text-[12.5px] text-muted">
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-ochre" /> {w}
        </p>
      ))}

      {onApply && (
        <div className="flex justify-end">
          <Button disabled={!result.ok} onClick={() => onApply({ result, quantity: Math.floor(dec(quantity)), paymentFeePct: dec(feePct), mode })}>
            {applyLabel}
          </Button>
        </div>
      )}
    </div>
  );
}
