import React from 'react';

/** Marque DALUCHE : deux rives (Chine / Afrique) reliées par une arche. */
export function LogoMark({ className = 'h-8 w-8', inverted }: { className?: string; inverted?: boolean }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden>
      <rect width="64" height="64" rx="16" fill={inverted ? '#F6F4EF' : '#0E1726'} />
      <path d="M14 42c6-15 30-15 36 0" fill="none" stroke="#D9412B" strokeWidth="5.5" strokeLinecap="round" />
      <circle cx="14" cy="42" r="5.2" fill={inverted ? '#0E1726' : '#F6F4EF'} />
      <circle cx="50" cy="42" r="5.2" fill={inverted ? '#0E1726' : '#F6F4EF'} />
    </svg>
  );
}

export function Logo({ inverted, compact }: { inverted?: boolean; compact?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2.5">
      <LogoMark className="h-8 w-8" inverted={inverted} />
      {!compact && (
        <span className="flex flex-col leading-none">
          <span className={`font-display text-[17px] font-semibold tracking-[0.08em] ${inverted ? 'text-white' : 'text-ink'}`}>DALUCHE</span>
          <span className={`mt-1 text-[9.5px] font-semibold uppercase tracking-[0.2em] ${inverted ? 'text-white/55' : 'text-muted'}`}>Chine · Afrique</span>
        </span>
      )}
    </span>
  );
}
