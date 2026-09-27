import React from 'react';
import { Clock, Users } from 'lucide-react';
import type { Groupage } from '../../lib/types';
import { Link } from '../ui/Link';
import { StatusBadge } from '../ui/Badge';
import { GroupageMeter } from '../ui/Progress';
import { GROUPAGE_STATUS } from '../../lib/status';
import { daysUntil, formatXOF } from '../../lib/format';
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
  return (
    <Link
      to={`/groupages/${groupage.id}`}
      className="group flex h-full flex-col overflow-hidden rounded-[var(--radius-card)] border border-line bg-white transition-shadow duration-200 hover:shadow-[var(--shadow-lift)]"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-paper-2">
        <img src={groupage.image || PLACEHOLDER_IMAGE} alt={groupage.title} loading="lazy" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]" />
        <div className="absolute left-3 top-3">
          <StatusBadge map={GROUPAGE_STATUS} status={groupage.status} className="bg-white/95" />
        </div>
        {savings > 0 && (
          <span className="absolute right-3 top-3 rounded-lg bg-ink px-2 py-1 text-[11.5px] font-bold text-white">−{savings}% vs prix unitaire</span>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-4 p-4 sm:p-5">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-subtle">{groupage.code}</p>
          <h3 className="mt-1 line-clamp-2 font-sans text-[15px] font-semibold leading-snug">{groupage.product?.name || groupage.title}</h3>
        </div>
        <GroupageMeter reserved={groupage.reservedQuantity} target={groupage.targetQuantity} compact />
        <div className="mt-auto flex items-end justify-between gap-3 border-t border-dashed border-line pt-3.5">
          <div>
            <p className="num font-display text-lg font-semibold leading-none">{formatXOF(groupage.unitPriceXOF)}</p>
            <p className="mt-1 text-[11.5px] text-muted">par unité, livré au hub</p>
          </div>
          <div className="flex flex-col items-end gap-1 text-[11.5px] text-muted">
            {deadline && joinable && (
              <span className="inline-flex items-center gap-1 font-semibold text-ink">
                <Clock className="h-3.5 w-3.5" /> {deadline}
              </span>
            )}
            <span className="inline-flex items-center gap-1">
              <Users className="h-3.5 w-3.5" /> {groupage.participantsCount} participant{groupage.participantsCount > 1 ? 's' : ''}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
