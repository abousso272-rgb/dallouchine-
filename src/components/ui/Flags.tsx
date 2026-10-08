import React from 'react';

/** Drapeaux légers (SVG) : rendu identique sur tous les appareils, contrairement aux émojis. */
export function FlagCN({ className = 'h-4 w-6' }: { className?: string }) {
  return (
    <svg viewBox="0 0 30 20" className={`${className} rounded-[3px] shadow-sm`} aria-label="Chine" role="img">
      <rect width="30" height="20" fill="#DE2910" />
      <path fill="#FFDE00" d="M5 2.2l.9 2.8h2.9L6.5 6.7l.9 2.8L5 7.8 2.6 9.5l.9-2.8L1.2 5h2.9z" />
      <circle cx="10.5" cy="2.6" r=".75" fill="#FFDE00" />
      <circle cx="12.3" cy="4.6" r=".75" fill="#FFDE00" />
      <circle cx="12.3" cy="7.3" r=".75" fill="#FFDE00" />
      <circle cx="10.5" cy="9.2" r=".75" fill="#FFDE00" />
    </svg>
  );
}

export function FlagSN({ className = 'h-4 w-6' }: { className?: string }) {
  return (
    <svg viewBox="0 0 30 20" className={`${className} rounded-[3px] shadow-sm`} aria-label="Sénégal" role="img">
      <rect width="10" height="20" fill="#00853F" />
      <rect x="10" width="10" height="20" fill="#FDEF42" />
      <rect x="20" width="10" height="20" fill="#E31B23" />
      <path fill="#00853F" d="M15 6.2l.95 2.9h3.05l-2.47 1.8.95 2.9L15 12l-2.48 1.8.95-2.9L11 9.1h3.05z" />
    </svg>
  );
}
