import React from 'react';
import { Check } from 'lucide-react';

export interface StepItem {
  key: string;
  label: string;
  description?: React.ReactNode;
}

/**
 * Parcours par étapes. `current` = index de l'étape en cours (les précédentes sont terminées).
 * current >= steps.length : parcours terminé. `stopped` : parcours interrompu (annulé/refusé).
 */
export function Stepper({ steps, current, stopped, orientation = 'auto' }: { steps: StepItem[]; current: number; stopped?: boolean; orientation?: 'auto' | 'vertical' }) {
  const state = (i: number) => (i < current ? 'done' : i === current && !stopped ? 'current' : 'todo');

  const vertical = (
    <ol className="relative space-y-0">
      {steps.map((s, i) => {
        const st = state(i);
        return (
          <li key={s.key} className="relative flex gap-3.5 pb-5 last:pb-0">
            {i < steps.length - 1 && (
              <span className={`absolute left-[11px] top-7 h-[calc(100%-1.5rem)] w-0.5 ${i < current ? 'bg-ink' : 'bg-line'}`} aria-hidden />
            )}
            <StepDot state={st} index={i} />
            <div className="pt-0.5">
              <p className={`text-sm font-semibold ${st === 'todo' ? 'text-subtle' : 'text-ink'}`}>{s.label}</p>
              {s.description && st !== 'todo' && <div className="mt-0.5 text-[13px] text-muted">{s.description}</div>}
            </div>
          </li>
        );
      })}
    </ol>
  );

  if (orientation === 'vertical') return vertical;

  return (
    <>
      <div className="md:hidden">{vertical}</div>
      <ol className="hidden items-start md:flex">
        {steps.map((s, i) => {
          const st = state(i);
          return (
            <li key={s.key} className="relative flex flex-1 flex-col items-center text-center">
              {i > 0 && <span className={`absolute right-1/2 top-3 h-0.5 w-full ${i <= current ? 'bg-ink' : 'bg-line'}`} aria-hidden />}
              <span className="relative z-10">
                <StepDot state={st} index={i} />
              </span>
              <span className={`mt-2.5 px-1 text-[12.5px] font-semibold leading-tight ${st === 'todo' ? 'text-subtle' : 'text-ink'}`}>{s.label}</span>
            </li>
          );
        })}
      </ol>
    </>
  );
}

function StepDot({ state, index }: { state: 'done' | 'current' | 'todo'; index: number }) {
  if (state === 'done') {
    return (
      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-ink text-white">
        <Check className="h-3.5 w-3.5" strokeWidth={3} />
      </span>
    );
  }
  if (state === 'current') {
    return (
      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand text-[11px] font-bold text-white ring-4 ring-brand-100">
        {index + 1}
      </span>
    );
  }
  return (
    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 border-line bg-white text-[11px] font-bold text-subtle">
      {index + 1}
    </span>
  );
}

/** Journal chronologique (historique de commande, événements) */
export function Timeline({ items }: { items: { id: string; title: React.ReactNode; meta?: React.ReactNode; body?: React.ReactNode; active?: boolean }[] }) {
  return (
    <ol className="space-y-0">
      {items.map((it, i) => (
        <li key={it.id} className="relative flex gap-3.5 pb-5 last:pb-0">
          {i < items.length - 1 && <span className="absolute left-[5px] top-4 h-[calc(100%-0.5rem)] w-px bg-line" aria-hidden />}
          <span className={`mt-1.5 h-[11px] w-[11px] shrink-0 rounded-full border-2 ${it.active ? 'border-brand bg-brand' : 'border-ink/30 bg-white'}`} aria-hidden />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-ink">{it.title}</p>
            {it.meta && <p className="text-[12.5px] text-muted">{it.meta}</p>}
            {it.body && <div className="mt-1 text-[13px] text-muted">{it.body}</div>}
          </div>
        </li>
      ))}
    </ol>
  );
}
