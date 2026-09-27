import React from 'react';
import { percent, formatNumber } from '../../lib/format';

export function ProgressBar({ value, max, tone = 'brand', size = 'md' }: { value: number; max: number; tone?: 'brand' | 'ink' | 'jade'; size?: 'sm' | 'md' }) {
  const pct = percent(value, max);
  const color = tone === 'ink' ? 'bg-ink' : tone === 'jade' ? 'bg-jade' : 'bg-brand-gradient';
  return (
    <div
      className={`w-full overflow-hidden rounded-full bg-paper-2 ${size === 'sm' ? 'h-1.5' : 'h-2.5'}`}
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={max}
    >
      <div className={`h-full rounded-full ${color} transition-[width] duration-500`} style={{ width: `${Math.max(pct, value > 0 ? 3 : 0)}%` }} />
    </div>
  );
}

/** Bloc de progression d'un groupage : objectif / commandes / progression */
export function GroupageMeter({ reserved, target, compact }: { reserved: number; target: number; compact?: boolean }) {
  const pct = percent(reserved, target);
  const remaining = Math.max(target - reserved, 0);
  if (compact) {
    return (
      <div className="space-y-2">
        <div className="flex items-baseline justify-between text-[13px]">
          <span className="num font-semibold text-ink">
            {formatNumber(reserved)} <span className="font-normal text-muted">/ {formatNumber(target)}</span>
          </span>
          <span className="num font-bold text-ink">{pct}%</span>
        </div>
        <ProgressBar value={reserved} max={target} size="sm" tone={pct >= 100 ? 'jade' : 'brand'} />
      </div>
    );
  }
  return (
    <div className="rounded-2xl border border-line bg-white p-4 sm:p-5">
      <div className="grid grid-cols-3 gap-3 text-center sm:text-left">
        <div>
          <p className="eyebrow">Objectif</p>
          <p className="num mt-1 font-display text-lg font-semibold sm:text-xl">{formatNumber(target)}</p>
        </div>
        <div>
          <p className="eyebrow">Commandes</p>
          <p className="num mt-1 font-display text-lg font-semibold sm:text-xl">
            {formatNumber(reserved)}
            <span className="text-sm font-medium text-muted"> / {formatNumber(target)}</span>
          </p>
        </div>
        <div>
          <p className="eyebrow">Restant</p>
          <p className="num mt-1 font-display text-lg font-semibold sm:text-xl">{formatNumber(remaining)}</p>
        </div>
      </div>
      <div className="mt-4 flex items-center gap-3">
        <div className="flex-1">
          <ProgressBar value={reserved} max={target} tone={pct >= 100 ? 'jade' : 'brand'} />
        </div>
        <span className="num w-12 text-right font-display text-base font-semibold">{pct}%</span>
      </div>
    </div>
  );
}
