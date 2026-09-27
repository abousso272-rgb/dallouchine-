import React from 'react';
import { Minus, Plus } from 'lucide-react';

export function QuantityInput({
  value,
  onChange,
  min = 1,
  max,
  size = 'md'
}: {
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  size?: 'sm' | 'md';
}) {
  const clamp = (n: number) => Math.max(min, max ? Math.min(max, n) : n);
  const h = size === 'sm' ? 'h-9' : 'h-11';
  return (
    <div className={`inline-flex ${h} items-center rounded-xl border border-line-2 bg-white`}>
      <button type="button" onClick={() => onChange(clamp(value - 1))} disabled={value <= min} className="flex h-full w-10 items-center justify-center text-ink disabled:opacity-30" aria-label="Diminuer">
        <Minus className="h-4 w-4" />
      </button>
      <input
        type="number"
        inputMode="numeric"
        value={value}
        min={min}
        max={max}
        onChange={e => onChange(clamp(parseInt(e.target.value || String(min), 10) || min))}
        className="num w-12 border-0 bg-transparent text-center text-sm font-semibold focus:outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
        aria-label="Quantité"
      />
      <button type="button" onClick={() => onChange(clamp(value + 1))} disabled={max !== undefined && value >= max} className="flex h-full w-10 items-center justify-center text-ink disabled:opacity-30" aria-label="Augmenter">
        <Plus className="h-4 w-4" />
      </button>
    </div>
  );
}
