import React from 'react';

/** Marque DALUCHE : deux rives (Chine / Afrique) reliées par une arche aux couleurs du logo. */
export function LogoMark({ className = 'h-8 w-8', inverted }: { className?: string; inverted?: boolean }) {
  const id = inverted ? 'dlc-arch-inv' : 'dlc-arch';
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden>
      <defs>
        <linearGradient id={id} x1="10" y1="44" x2="54" y2="30" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#FC920C" />
          <stop offset="0.55" stopColor="#F2560F" />
          <stop offset="1" stopColor="#E3180A" />
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx="16" fill={inverted ? '#F7F5F2' : '#0B1620'} />
      <path d="M14 42c6-15 30-15 36 0" fill="none" stroke={`url(#${id})`} strokeWidth="5.5" strokeLinecap="round" />
      <circle cx="14" cy="42" r="5.2" fill={inverted ? '#0B1620' : '#F7F5F2'} />
      <circle cx="50" cy="42" r="5.2" fill={inverted ? '#0B1620' : '#F7F5F2'} />
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
