import React from 'react';

/** Monogramme DC (sac + caddie) issu du logo officiel. */
export function LogoMark({ className = 'h-9 w-9' }: { className?: string; inverted?: boolean }) {
  return (
    <img
      src="/brand/mark-128.png"
      srcSet="/brand/mark-64.png 64w, /brand/mark-128.png 128w, /brand/mark-256.png 256w"
      sizes="48px"
      alt=""
      width={48}
      height={48}
      className={`${className} object-contain`}
      decoding="async"
    />
  );
}

export function Logo({ inverted, compact }: { inverted?: boolean; compact?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2">
      <LogoMark className="h-10 w-10" />
      {!compact && (
        <span className="flex flex-col leading-none">
          <span className={`font-display text-[18px] font-bold tracking-[0.02em] ${inverted ? 'text-white' : 'text-ink'}`}>
            DALLOU <span className="text-brand-gradient">CHINE</span>
          </span>
          <span className={`mt-1 text-[8.5px] font-bold uppercase tracking-[0.22em] ${inverted ? 'text-white/55' : 'text-muted'}`}>Chine → Afrique</span>
        </span>
      )}
    </span>
  );
}
