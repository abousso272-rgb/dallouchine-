import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { Link } from './Link';

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
  back
}: {
  eyebrow?: React.ReactNode;
  title: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  back?: { to: string; label: string };
}) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        {back && (
          <Link to={back.to} className="mb-3 inline-flex items-center gap-1.5 text-[13px] font-semibold text-muted hover:text-ink">
            <ArrowLeft className="h-4 w-4" /> {back.label}
          </Link>
        )}
        {eyebrow && <p className="eyebrow mb-2">{eyebrow}</p>}
        <h1 className="text-[26px] font-bold leading-tight sm:text-[30px]">{title}</h1>
        {description && <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-muted">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function Card({ children, className = '', padded = true }: { children: React.ReactNode; className?: string; padded?: boolean }) {
  return <div className={`card ${padded ? 'p-5 sm:p-6' : ''} ${className}`}>{children}</div>;
}

export function CardTitle({ children, action, className = '' }: { children: React.ReactNode; action?: React.ReactNode; className?: string }) {
  return (
    <div className={`mb-4 flex items-center justify-between gap-3 ${className}`}>
      <h2 className="text-[15.5px] font-bold">{children}</h2>
      {action}
    </div>
  );
}

export function Stat({
  label,
  value,
  hint,
  icon,
  tone = 'default',
  to
}: {
  label: string;
  value: React.ReactNode;
  hint?: React.ReactNode;
  icon?: React.ReactNode;
  tone?: 'default' | 'dark' | 'brand';
  to?: string;
}) {
  const styles =
    tone === 'dark'
      ? 'bg-ink text-white border-ink'
      : tone === 'brand'
        ? 'bg-brand-gradient text-white border-transparent shadow-[0_18px_40px_-20px_rgb(232_72_13/0.8)]'
        : 'bg-white text-ink border-line shadow-[var(--shadow-soft)]';
  const content = (
    <div className={`relative flex h-full flex-col justify-between gap-4 overflow-hidden rounded-[var(--radius-card)] border p-4 sm:p-5 ${styles} ${to ? 'lift' : ''}`}>
      {tone !== 'default' && <div className="pointer-events-none absolute -right-8 -top-10 h-28 w-28 rounded-full bg-white/10 blur-xl" aria-hidden />}
      <div className="relative flex items-center justify-between gap-2">
        <p className={`text-[12.5px] font-semibold ${tone === 'default' ? 'text-muted' : 'text-white/80'}`}>{label}</p>
        {icon && (
          <span className={tone === 'default' ? 'icon-bubble h-8 w-8' : 'flex h-8 w-8 items-center justify-center rounded-full bg-white/15 text-white'}>{icon}</span>
        )}
      </div>
      <div className="relative">
        <p className="num font-display text-[24px] font-bold leading-none sm:text-[28px]">{value}</p>
        {hint && <p className={`mt-1.5 text-[12px] ${tone === 'default' ? 'text-muted' : 'text-white/75'}`}>{hint}</p>}
      </div>
    </div>
  );
  return to ? (
    <Link to={to} className="block h-full">
      {content}
    </Link>
  ) : (
    content
  );
}

/** Liste de propriétés libellé → valeur */
export function DefinitionList({ items, columns = 1 }: { items: { label: string; value: React.ReactNode }[]; columns?: 1 | 2 }) {
  return (
    <dl className={`grid gap-x-6 gap-y-3 ${columns === 2 ? 'sm:grid-cols-2' : ''}`}>
      {items
        .filter(i => i.value !== null && i.value !== undefined && i.value !== '')
        .map(i => (
          <div key={i.label} className="flex items-baseline justify-between gap-4 border-b border-dashed border-line pb-2.5 sm:block sm:border-0 sm:pb-0">
            <dt className="text-[12.5px] font-medium text-muted">{i.label}</dt>
            <dd className="text-right text-sm font-semibold text-ink sm:mt-0.5 sm:text-left">{i.value}</dd>
          </div>
        ))}
    </dl>
  );
}
