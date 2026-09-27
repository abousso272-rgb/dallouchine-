import React from 'react';

export function Tabs<const T extends string>({
  value,
  onChange,
  items,
  className = ''
}: {
  value: T;
  onChange: (v: NoInfer<T>) => void;
  items: { value: NoInfer<T>; label: string; count?: number }[];
  className?: string;
}) {
  return (
    <div className={`scrollbar-none -mx-4 flex gap-1.5 overflow-x-auto px-4 sm:mx-0 sm:px-0 ${className}`} role="tablist">
      {items.map(it => {
        const active = it.value === value;
        return (
          <button
            key={it.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(it.value)}
            className={`inline-flex h-9 shrink-0 items-center gap-2 rounded-full px-4 text-[13px] font-semibold transition-colors ${
              active ? 'bg-ink text-white' : 'bg-white text-muted ring-1 ring-line hover:text-ink'
            }`}
          >
            {it.label}
            {it.count !== undefined && (
              <span className={`num rounded-full px-1.5 text-[11px] ${active ? 'bg-white/15 text-white' : 'bg-paper-2 text-muted'}`}>{it.count}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}
