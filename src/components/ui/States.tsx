import React from 'react';
import { AlertTriangle, Loader2, RotateCw } from 'lucide-react';
import { Button } from './Button';

export function Spinner({ className = 'h-5 w-5' }: { className?: string }) {
  return <Loader2 className={`animate-spin text-muted ${className}`} aria-label="Chargement" />;
}

export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`skeleton rounded-xl ${className}`} aria-hidden />;
}

export function PageLoader({ label = 'Chargement…' }: { label?: string }) {
  return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 text-sm text-muted" role="status">
      <Spinner className="h-6 w-6" />
      {label}
    </div>
  );
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  compact
}: {
  icon?: React.ReactNode;
  title: string;
  description?: React.ReactNode;
  action?: React.ReactNode;
  compact?: boolean;
}) {
  return (
    <div className={`flex flex-col items-center text-center ${compact ? 'px-4 py-8' : 'px-6 py-14'}`}>
      {icon && <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-paper-2 text-muted">{icon}</div>}
      <p className="font-display text-base font-semibold text-ink">{title}</p>
      {description && <p className="mt-1.5 max-w-sm text-sm leading-relaxed text-muted">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center px-6 py-12 text-center" role="alert">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 text-red-700">
        <AlertTriangle className="h-5 w-5" />
      </div>
      <p className="font-display text-base font-semibold">Impossible de charger ces données</p>
      <p className="mt-1.5 max-w-md text-sm text-muted">{message}</p>
      {onRetry && (
        <Button variant="secondary" size="sm" className="mt-5" icon={<RotateCw className="h-4 w-4" />} onClick={onRetry}>
          Réessayer
        </Button>
      )}
    </div>
  );
}

export function InlineAlert({
  tone = 'info',
  title,
  children,
  action
}: {
  tone?: 'info' | 'warning' | 'danger' | 'success';
  title?: React.ReactNode;
  children?: React.ReactNode;
  action?: React.ReactNode;
}) {
  const styles = {
    info: 'border-sky-100 bg-sky-50/70 text-sky-900',
    warning: 'border-amber-200 bg-amber-50 text-amber-900',
    danger: 'border-red-200 bg-red-50 text-red-900',
    success: 'border-emerald-200 bg-jade-50 text-emerald-900'
  }[tone];
  return (
    <div className={`flex flex-col gap-3 rounded-2xl border p-4 text-sm sm:flex-row sm:items-center ${styles}`} role={tone === 'danger' ? 'alert' : 'status'}>
      <div className="flex-1">
        {title && <p className="font-semibold">{title}</p>}
        {children && <div className={title ? 'mt-0.5 opacity-90' : ''}>{children}</div>}
      </div>
      {action}
    </div>
  );
}
