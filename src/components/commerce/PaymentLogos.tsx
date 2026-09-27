import React from 'react';

const LOGOS = [
  { src: '/logos/wave.svg', alt: 'Wave' },
  { src: '/logos/orange.svg', alt: 'Orange Money' },
  { src: '/logos/mtn.svg', alt: 'MTN Mobile Money' },
  { src: '/logos/visa.svg', alt: 'Visa' },
  { src: '/logos/mastercard.svg', alt: 'Mastercard' }
];

export function PaymentLogos({ className = '' }: { className?: string }) {
  return (
    <div className={`flex flex-wrap items-center gap-2 ${className}`}>
      {LOGOS.map(l => (
        <span key={l.alt} className="flex h-8 items-center rounded-lg border border-line bg-white px-2">
          <img src={l.src} alt={l.alt} className="h-4 w-auto" loading="lazy" />
        </span>
      ))}
    </div>
  );
}
