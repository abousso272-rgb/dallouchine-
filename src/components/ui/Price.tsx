import React from 'react';
import { formatXOF } from '../../lib/format';

export function Price({
  value,
  compareAt,
  size = 'md',
  suffix
}: {
  value: number | null | undefined;
  compareAt?: number | null;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  suffix?: string;
}) {
  const cls = { sm: 'text-[15px]', md: 'text-lg', lg: 'text-2xl', xl: 'text-[32px] leading-none' }[size];
  const discount = compareAt && value && compareAt > value ? Math.round(((compareAt - value) / compareAt) * 100) : 0;
  return (
    <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
      <span className={`num font-display font-semibold text-ink ${cls}`}>{formatXOF(value)}</span>
      {suffix && <span className="text-[12.5px] text-muted">{suffix}</span>}
      {discount > 0 && (
        <>
          <span className="num text-[13px] text-subtle line-through">{formatXOF(compareAt)}</span>
          <span className="num rounded-md bg-brand-50 px-1.5 py-0.5 text-[11.5px] font-bold text-brand-700">−{discount}%</span>
        </>
      )}
    </div>
  );
}
