import React from 'react';
import { AlertTriangle, ExternalLink, Globe, Plus, Sparkles } from 'lucide-react';
import { Card, CardTitle } from '../ui/Layout';
import { Button } from '../ui/Button';
import { formatDateTime } from '../../lib/format';

interface Comparable {
  title: string;
  url: string;
  price: string | null;
  moq: string | null;
  supplier: string | null;
}

/** Analyse IA jointe par le client : point de départ de la recherche fournisseurs (à vérifier). */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function AiAnalysisCard({ analysis: a, onAddFinding }: { analysis: any; onAddFinding: (c: Comparable) => void }) {
  const l = a.listing || {};
  const comparables: Comparable[] = Array.isArray(a.comparables) ? a.comparables : [];
  const fmt = (n: number) => new Intl.NumberFormat('fr-FR').format(n);
  return (
    <Card>
      <CardTitle
        action={a.attached_at ? <span className="text-[11.5px] text-subtle">{formatDateTime(a.attached_at)}</span> : undefined}
      >
        <span className="inline-flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-brand" /> Analyse IA du client
        </span>
      </CardTitle>
      <p className="text-[15px] font-semibold">{a.productName}</p>
      {a.productNameZh && <p className="text-[13px] text-muted">{a.productNameZh}</p>}
      {a.description && <p className="mt-2 text-[13.5px] text-muted">{a.description}</p>}

      <div className="mt-3 flex flex-wrap gap-2 text-[12.5px]">
        {l.priceMin != null && (
          <span className="rounded-full bg-jade-50 px-2.5 py-1 font-semibold text-jade">
            Prix lu : {fmt(l.priceMin)}
            {l.priceMax && l.priceMax !== l.priceMin ? `–${fmt(l.priceMax)}` : ''} {l.currency || ''}
          </span>
        )}
        {l.moq != null && <span className="rounded-full bg-jade-50 px-2.5 py-1 font-semibold text-jade">MOQ {fmt(l.moq)}</span>}
        {l.supplierName && <span className="rounded-full bg-paper px-2.5 py-1 font-semibold">{l.supplierName}</span>}
        {a.estimate?.unitPriceCnyMin != null && (
          <span className="rounded-full bg-ochre-50 px-2.5 py-1 font-semibold text-ochre">
            Estimation {fmt(a.estimate.unitPriceCnyMin)}–{fmt(a.estimate.unitPriceCnyMax ?? a.estimate.unitPriceCnyMin)} CNY
          </span>
        )}
        {(a.searchKeywords?.zh || []).map((k: string) => (
          <span key={k} className="rounded-full bg-paper px-2.5 py-1">
            {k}
          </span>
        ))}
      </div>

      {(a.warnings || []).length > 0 && (
        <ul className="mt-3 space-y-1">
          {a.warnings.map((w: string, i: number) => (
            <li key={i} className="flex gap-2 text-[12.5px] text-red-700">
              <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" /> {w}
            </li>
          ))}
        </ul>
      )}

      {comparables.length > 0 && (
        <div className="mt-4">
          <p className="flex items-center gap-1.5 text-[13px] font-bold">
            <Globe className="h-4 w-4 text-brand" /> Offres repérées sur le web
          </p>
          <ul className="mt-2 divide-y divide-line rounded-2xl ring-1 ring-line">
            {comparables.map(c => (
              <li key={c.url} className="flex flex-wrap items-center gap-2 px-3.5 py-2.5 text-[13px]">
                <a href={c.url} target="_blank" rel="noopener noreferrer" className="inline-flex min-w-0 flex-1 items-center gap-1 truncate font-semibold hover:text-brand-600">
                  <span className="truncate">{c.title}</span> <ExternalLink className="h-3 w-3 shrink-0" />
                </a>
                <span className="text-muted">{[c.price, c.moq && `MOQ ${c.moq}`, c.supplier].filter(Boolean).join(' · ')}</span>
                <Button size="sm" variant="ghost" icon={<Plus className="h-3.5 w-3.5" />} onClick={() => onAddFinding(c)}>
                  Résultat
                </Button>
              </li>
            ))}
          </ul>
        </div>
      )}
      <p className="mt-3 text-[11.5px] text-subtle">Informations indicatives produites par l’IA à partir de la photo / du lien du client : à vérifier auprès des fournisseurs.</p>
    </Card>
  );
}
