import React from 'react';

/**
 * Scènes animées du guide : SVG + CSS, quelques Ko chacune (contre plusieurs Mo pour une vidéo),
 * lisibles sur connexion lente, sans texte incrusté donc valables dans toutes les langues.
 */

const BRAND = 'var(--color-brand)';
const INK = 'var(--color-ink)';
const LINE = 'var(--color-line-2)';
const PAPER = 'var(--color-paper-2)';
const JADE = 'var(--color-jade)';
const d = (s: number) => ({ '--d': `${s}s` }) as React.CSSProperties;

function Frame({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <svg viewBox="0 0 400 260" role="img" aria-label={label} className="h-auto w-full">
      <rect width="400" height="260" rx="22" fill="var(--color-brand-50)" />
      <circle cx="350" cy="30" r="70" fill="var(--color-brand-100)" opacity=".45" />
      {children}
    </svg>
  );
}

/** 1. Une demande (photo / lien) devient un devis clair. */
export function SourcingScene({ label }: { label: string }) {
  return (
    <Frame label={label}>
      <rect x="30" y="34" width="190" height="40" rx="20" fill="#fff" stroke={LINE} />
      <circle cx="54" cy="54" r="9" fill="none" stroke={INK} strokeWidth="2.5" />
      <path d="M61 61l7 7" stroke={INK} strokeWidth="2.5" strokeLinecap="round" />
      <rect x="80" y="49" width="110" height="10" rx="5" fill={LINE} className="gs-grow" style={d(0)} />
      {[0, 1, 2].map(i => (
        <g key={i} className="gs-in" style={d(1 + i * 0.7)}>
          <rect x={30 + i * 62} y="100" width="56" height="70" rx="12" fill="#fff" stroke={LINE} />
          <rect x={38 + i * 62} y="108" width="40" height="28" rx="7" fill={PAPER} />
          <rect x={38 + i * 62} y="144" width="32" height="6" rx="3" fill={LINE} />
          <rect x={38 + i * 62} y="155" width="22" height="6" rx="3" fill={BRAND} opacity=".55" />
        </g>
      ))}
      <g className="gs-in" style={d(3.4)}>
        <rect x="236" y="92" width="134" height="124" rx="16" fill="#fff" stroke={LINE} />
        <rect x="250" y="106" width="60" height="9" rx="4.5" fill={INK} />
        {[0, 1, 2].map(i => (
          <rect key={i} x="250" y={128 + i * 16} width={100 - i * 18} height="7" rx="3.5" fill={LINE} />
        ))}
        <rect x="250" y="184" width="104" height="22" rx="11" fill={BRAND} />
        <path d="M290 195l5 5 10-10" fill="none" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
      </g>
      <path d="M180 135c18 0 26-8 50-8" stroke={BRAND} strokeWidth="2" strokeDasharray="4 5" fill="none" className="gs-in" style={d(2.8)} />
    </Frame>
  );
}

/** 2. Des acheteurs s'ajoutent, la jauge monte jusqu'à la quantité minimale, le prix baisse. */
export function GroupageScene({ label }: { label: string }) {
  return (
    <Frame label={label}>
      {[0, 1, 2, 3, 4, 5].map(i => (
        <g key={i} className="gs-in" style={d(0.4 + i * 0.45)}>
          <circle cx={52 + i * 54} cy="70" r="15" fill={i % 2 ? BRAND : INK} opacity={i % 2 ? 0.9 : 0.85} />
          <circle cx={52 + i * 54} cy="65" r="5" fill="#fff" />
          <path d={`M${43 + i * 54} 80c2-6 16-6 18 0`} fill="#fff" />
        </g>
      ))}
      <rect x="32" y="130" width="336" height="22" rx="11" fill="#fff" stroke={LINE} />
      <rect x="35" y="133" width="330" height="16" rx="8" fill={BRAND} className="gs-grow" style={d(0.4)} />
      <line x1="290" y1="120" x2="290" y2="162" stroke={INK} strokeWidth="2" strokeDasharray="3 4" />
      <g className="gs-in" style={d(3.2)}>
        <rect x="258" y="170" width="64" height="26" rx="13" fill={INK} />
        <path d="M278 183l5 5 10-10" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
      </g>
      <g className="gs-in" style={d(3.4)}>
        <rect x="32" y="188" width="150" height="46" rx="14" fill="#fff" stroke={LINE} />
        <rect x="46" y="200" width="54" height="8" rx="4" fill={LINE} />
        <rect x="46" y="216" width="84" height="10" rx="5" fill={JADE} />
        <path d="M150 212l8 8m0 0v-7m0 7h-7" fill="none" stroke={JADE} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" transform="rotate(0)" />
      </g>
    </Frame>
  );
}

/** 3. Paiement mobile sécurisé. */
export function PaymentScene({ label }: { label: string }) {
  return (
    <Frame label={label}>
      <rect x="64" y="28" width="104" height="196" rx="20" fill={INK} />
      <rect x="72" y="44" width="88" height="164" rx="12" fill="#fff" />
      <rect x="82" y="58" width="48" height="8" rx="4" fill={LINE} />
      <rect x="82" y="76" width="68" height="14" rx="7" fill={INK} />
      <g className="gs-in" style={d(0.6)}>
        <rect x="82" y="104" width="68" height="26" rx="13" fill="#1dc8f2" />
        <rect x="82" y="138" width="68" height="26" rx="13" fill="#ff7900" />
      </g>
      <g className="gs-in" style={d(1.6)}>
        <rect x="82" y="176" width="68" height="22" rx="11" fill={BRAND} />
      </g>
      {[0, 1, 2].map(i => (
        <circle key={i} r="7" cx="0" cy="0" fill="#f5b301" stroke="#c98a00" className="gs-travel" style={{ ...d(1.8 + i * 0.35), offsetPath: 'path("M170 150 C 210 150 220 120 262 120")' }} />
      ))}
      <g className="gs-pulse" style={d(0)}>
        <path d="M310 70l50 18v46c0 32-22 52-50 62-28-10-50-30-50-62V88z" fill="#fff" stroke={LINE} strokeWidth="2" />
      </g>
      <path d="M288 134l16 16 30-32" fill="none" stroke={JADE} strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" className="gs-tick" style={d(2.4)} />
    </Frame>
  );
}

/** 4. Contrôle qualité puis expédition Chine → Dakar (avion et bateau). */
export function ShippingScene({ label }: { label: string }) {
  return (
    <Frame label={label}>
      <rect x="28" y="30" width="86" height="84" rx="14" fill="#fff" stroke={LINE} />
      <rect x="40" y="44" width="62" height="40" rx="8" fill={PAPER} />
      <g className="gs-in" style={d(0.4)}>
        <circle cx="86" cy="98" r="11" fill={JADE} />
        <path d="M80 98l4 4 8-8" fill="none" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
      </g>
      <path d="M60 210C130 130 250 120 340 170" fill="none" stroke={LINE} strokeWidth="3" strokeDasharray="2 8" strokeLinecap="round" />
      <path d="M60 232C150 200 260 210 340 190" fill="none" stroke={LINE} strokeWidth="3" strokeDasharray="2 8" strokeLinecap="round" />
      <circle cx="60" cy="210" r="9" fill={INK} />
      <circle cx="340" cy="170" r="9" fill={BRAND} className="gs-pulse" />
      <g className="gs-travel" style={{ ...d(0.8), offsetPath: 'path("M60 210C130 130 250 120 340 170")' }}>
        <path d="M-12 0l24-7-6 7 6 7z M-4 -2l-8-12 4 0 10 12z" fill={INK} />
      </g>
      <g className="gs-travel" style={{ ...d(2), offsetPath: 'path("M60 232C150 200 260 210 340 190")' }}>
        <path d="M-14 2h28l-5 8h-18z M-3 2v-9h6v9" fill={BRAND} />
      </g>
    </Frame>
  );
}

/** 5. Suivi : étapes qui s'allument et notification. */
export function TrackingScene({ label }: { label: string }) {
  const steps = [0, 1, 2, 3];
  return (
    <Frame label={label}>
      <line x1="92" y1="62" x2="92" y2="200" stroke={LINE} strokeWidth="4" strokeLinecap="round" />
      <line x1="92" y1="62" x2="92" y2="200" stroke={BRAND} strokeWidth="4" strokeLinecap="round" strokeDasharray="138" className="gs-in" style={d(0.5)} />
      {steps.map(i => (
        <g key={i} className="gs-in" style={d(0.6 + i * 1.1)}>
          <circle cx="92" cy={62 + i * 46} r="12" fill={i === 3 ? BRAND : '#fff'} stroke={i === 3 ? BRAND : INK} strokeWidth="3" />
          <path d={`M86 ${62 + i * 46}l4 4 8-8`} fill="none" stroke={i === 3 ? '#fff' : INK} strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
          <rect x="122" y={52 + i * 46} width={110 - i * 8} height="9" rx="4.5" fill={INK} opacity=".85" />
          <rect x="122" y={67 + i * 46} width={150 - i * 12} height="7" rx="3.5" fill={LINE} />
        </g>
      ))}
      <g className="gs-in" style={d(4.6)}>
        <rect x="262" y="40" width="108" height="46" rx="14" fill="#fff" stroke={LINE} />
        <path d="M286 74c0-10 6-14 6-22a8 8 0 0 0-16 0c0 8 6 12 6 22z" fill={BRAND} transform="translate(8 -2)" />
        <rect x="318" y="54" width="40" height="7" rx="3.5" fill={INK} />
        <rect x="318" y="67" width="28" height="6" rx="3" fill={LINE} />
      </g>
    </Frame>
  );
}

/** 6. Livraison : point relais ou domicile. */
export function DeliveryScene({ label }: { label: string }) {
  return (
    <Frame label={label}>
      <path d="M0 198h400" stroke={LINE} strokeWidth="3" />
      <g>
        <rect x="262" y="104" width="94" height="94" rx="10" fill="#fff" stroke={LINE} />
        <path d="M252 108l57-40 57 40z" fill={BRAND} />
        <rect x="294" y="146" width="30" height="52" rx="5" fill={INK} />
        <circle cx="318" cy="174" r="2.5" fill="#fff" />
      </g>
      <g className="gs-travel" style={{ ...d(0.2), offsetPath: 'path("M40 186 L 250 186")' }}>
        <rect x="-34" y="-30" width="46" height="30" rx="6" fill="#fff" stroke={INK} strokeWidth="2.5" />
        <path d="M12 -22h16l8 12v10H12z" fill={INK} />
        <circle cx="-18" cy="2" r="8" fill={INK} />
        <circle cx="24" cy="2" r="8" fill={INK} />
        <circle cx="-18" cy="2" r="3" fill="#fff" />
        <circle cx="24" cy="2" r="3" fill="#fff" />
        <rect x="-26" y="-22" width="14" height="14" rx="3" fill={BRAND} />
      </g>
      <g className="gs-in" style={d(3.6)}>
        <circle cx="309" cy="62" r="20" fill={JADE} className="gs-pulse" />
        <path d="M299 62l7 7 14-14" fill="none" stroke="#fff" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
      </g>
    </Frame>
  );
}
