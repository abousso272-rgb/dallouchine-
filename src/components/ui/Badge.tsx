import React from 'react';
import type { Tone } from '../../lib/status';
import { statusMeta } from '../../lib/status';

const TONES: Record<Tone, string> = {
  neutral: 'bg-paper-2 text-muted ring-line',
  brand: 'bg-brand-50 text-brand-700 ring-brand-100',
  info: 'bg-sky-50 text-sky-800 ring-sky-100',
  success: 'bg-jade-50 text-jade ring-emerald-100',
  warning: 'bg-amber-50 text-amber-800 ring-amber-100',
  danger: 'bg-red-50 text-red-700 ring-red-100',
  ochre: 'bg-ochre-50 text-ochre ring-amber-100'
};

const DOTS: Record<Tone, string> = {
  neutral: 'bg-subtle',
  brand: 'bg-brand',
  info: 'bg-sky-600',
  success: 'bg-jade',
  warning: 'bg-amber-500',
  danger: 'bg-red-600',
  ochre: 'bg-ochre'
};

export function Badge({
  tone = 'neutral',
  dot,
  children,
  className = ''
}: {
  tone?: Tone;
  dot?: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11.5px] font-semibold leading-none ring-1 ring-inset ${TONES[tone]} ${className}`}
    >
      {dot && <span className={`h-1.5 w-1.5 rounded-full ${DOTS[tone]}`} aria-hidden />}
      {children}
    </span>
  );
}

export function StatusBadge({ map, status, className }: { map: Parameters<typeof statusMeta>[0]; status?: string | null; className?: string }) {
  const meta = statusMeta(map, status);
  return (
    <Badge tone={meta.tone} dot className={className}>
      {meta.label}
    </Badge>
  );
}
