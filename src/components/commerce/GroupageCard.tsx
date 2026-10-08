import React from 'react';
import { ArrowRight, Clock, Users } from 'lucide-react';
import type { Groupage } from '../../lib/types';
import { Link } from '../ui/Link';
import { StatusBadge } from '../ui/Badge';
import { ProgressBar } from '../ui/Progress';
import { GROUPAGE_STATUS } from '../../lib/status';
import { daysUntil, formatNumber, formatXOF, percent } from '../../lib/format';
import { PLACEHOLDER_IMAGE } from '../../services/catalog';
import { isJoinable } from '../../services/groupages';

export function deadlineLabel(deadline: string | null): string | null {
  const d = daysUntil(deadline);
  if (d === null) return null;
  if (d < 0) return 'Clôturé';
  if (d === 0) return 'Dernier jour';
  if (d === 1) return 'Clôture demain';
  return `${d} jours restants`;
}

export function GroupageCard({ groupage }: { groupage: Groupage }) {
  const joinable = isJoinable(groupage);
  const savings =
    groupage.originalPriceXOF > groupage.unitPriceXOF
      ? Math.round(((groupage.originalPriceXOF - groupage.unitPriceXOF) / groupage.originalPriceXOF) * 100)
      : 0;
  const deadline = deadlineLabel(groupage.deadline);
  const pct = percent(groupage.reservedQuantity, groupage.targetQuantity);
  const remaining = Math.max(groupage.targetQuantity - groupage.reservedQuantity, 0);
  return (
    <Link to={`/groupages/${groupage.id}`} className="lift group flex h-full flex-col overflow-hidden rounded-[var(--radius-card)] border border-line bg-white shadow-[var(--shadow-soft)]">
      <div className="relative m-1.5 aspect-[16/10] overflow-hidden rounded-[18px] bg-paper-2">
        <img src={groupage.image || PLACEHOLDER_IMAGE} alt={groupage.title} loading="lazy" decoding="async" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.05]" />
        <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-ink/40 to-transparent" aria-hidden />
        <div className="absolute left-2.5 top-2.5 flex items-center gap-1.5">
          <span className="rounded-full bg-brand-gradient px-2.5 py-1 text-[10.5px] font-bold uppercase tracking-wide text-white shadow-sm">Groupage</span>
          <StatusBadge map={GROUPAGE_STATUS} status={groupage.status} className="bg-white/95" />
        </div>
        {savings > 0 && <span className="absolute bottom-2.5 right-2.5 rounded-full bg-white px-2.5 py-0.5 text-[11px] font-bold text-brand-600 shadow-sm">−{savings}%</span>}
        {groupage.product?.categoryName && (
          <span className="absolute bottom-2.5 left-2.5 rounded-full bg-white/90 px-2.5 py-0.5 text-[10.5px] font-semibold text-ink">{groupage.product.categoryName}</span>
        )}
      </div>
      <div className="flex flex-1 flex-col px-4 pb-4 pt-2 sm:px-5 sm:pb-5">
        <h3 className="line-clamp-2 font-sans text-[15px] font-semibold leading-snug">{groupage.product?.name || groupage.title}</h3>
        <p className="mt-1 text-[13.5px] text-muted">
          À partir de <span className="num font-bold text-brand-600">{formatXOF(groupage.unitPriceXOF)}</span>
        </p>
        <dl className="mt-3 grid grid-cols-3 gap-2 rounded-2xl bg-paper px-3 py-2.5 text-center text-[11px]">
          <div>
            <dt className="text-muted">Objectif</dt>
            <dd className="num mt-0.5 text-[13px] font-bold">{formatNumber(groupage.targetQuantity)}</dd>
          </div>
          <div>
            <dt className="text-muted">Réservé</dt>
            <dd className="num mt-0.5 text-[13px] font-bold">{formatNumber(groupage.reservedQuantity)}</dd>
          </div>
          <div>
            <dt className="text-muted">Restant</dt>
            <dd className="num mt-0.5 text-[13px] font-bold text-brand-600">{formatNumber(remaining)}</dd>
          </div>
        </dl>
        <div className="mt-3 flex items-center gap-3">
          <div className="flex-1">
            <ProgressBar value={groupage.reservedQuantity} max={groupage.targetQuantity} size="sm" tone={pct >= 100 ? 'jade' : 'brand'} />
          </div>
          <span className="num text-[12.5px] font-bold">{pct}%</span>
        </div>
        <div className="mt-3 flex items-center justify-between text-[11.5px] text-muted">
          <span className="inline-flex items-center gap-1">
            <Users className="h-3.5 w-3.5" /> {groupage.participantsCount} participant{groupage.participantsCount > 1 ? 's' : ''}
          </span>
          {deadline && joinable && (
            <span className="inline-flex items-center gap-1 font-semibold text-ink">
              <Clock className="h-3.5 w-3.5 text-brand" /> {deadline}
            </span>
          )}
        </div>
        <span
          className={`mt-4 inline-flex h-10 items-center justify-center gap-1.5 rounded-full text-[13px] font-semibold transition-all ${
            joinable ? 'bg-brand-gradient text-white shadow-[var(--shadow-glow)] group-hover:brightness-105' : 'bg-paper-2 text-ink'
          }`}
        >
          {joinable ? 'Rejoindre le groupage' : 'Voir le suivi'} <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
        </span>
      </div>
    </Link>
  );
}
