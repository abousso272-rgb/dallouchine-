import React from 'react';
import { CheckCircle2, Info, X, XCircle } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export function Toasts() {
  const { toasts, dismissToast } = useApp();
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-[84px] z-[90] flex flex-col items-center gap-2 px-4 lg:bottom-auto lg:left-auto lg:right-6 lg:top-20 lg:items-end" aria-live="polite">
      {toasts.map(t => {
        const Icon = t.type === 'success' ? CheckCircle2 : t.type === 'error' ? XCircle : Info;
        const color = t.type === 'success' ? 'text-jade' : t.type === 'error' ? 'text-red-600' : 'text-sky-700';
        return (
          <div
            key={t.id}
            className="animate-fade-in-up pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-2xl border border-line bg-white p-3.5 pr-2.5 shadow-[var(--shadow-lift)]"
            role={t.type === 'error' ? 'alert' : 'status'}
          >
            <Icon className={`mt-0.5 h-5 w-5 shrink-0 ${color}`} />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-ink">{t.title}</p>
              {t.message && <p className="mt-0.5 text-[13px] leading-snug text-muted">{t.message}</p>}
            </div>
            <button type="button" onClick={() => dismissToast(t.id)} className="rounded-lg p-1 text-subtle hover:bg-paper hover:text-ink" aria-label="Fermer">
              <X className="h-4 w-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
