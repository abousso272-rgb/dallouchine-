import React from 'react';

/**
 * LOGOS OFFICIELS DES OPÉRATEURS DE PAIEMENT SÉNÉGAL & AFRIQUE DE L'OUEST
 * Rendu vectoriel SVG haute définition (Wave, Orange Money, MTN MoMo, Visa, Mastercard, GeniusPay)
 */

/**
 * 1. LOGO OFFICIEL WAVE (Le Manchot / Penguin iconique sur fond Cyan #1DC3FF)
 */
export const WaveLogo: React.FC<{ className?: string; size?: number }> = ({ className = "w-7 h-7", size }) => {
  return (
    <div
      className={`relative inline-flex items-center justify-center rounded-xl bg-[#1DC3FF] p-0.5 shadow-xs shrink-0 overflow-hidden ${className}`}
      style={size ? { width: size, height: size } : undefined}
      title="Wave Mobile Money"
    >
      <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
        {/* Fond cyan signature Wave */}
        <rect width="100" height="100" rx="24" fill="#1DC3FF" />
        
        {/* Corps et ailes du manchot (Bleu marine très foncé) */}
        <path
          d="M50 14C37 14 28 23 28 36C28 44 24 53 18 64C16 68 19 72 23 72C26 72 29 70 32 65C34 71 41 78 50 78C59 78 66 71 68 65C71 70 74 72 77 72C81 72 84 68 82 64C76 53 72 44 72 36C72 23 63 14 50 14Z"
          fill="#0B1B3D"
        />

        {/* Ventre blanc arrondi emblématique */}
        <ellipse cx="50" cy="52" rx="15" ry="19" fill="#FFFFFF" />

        {/* Yeux expressifs */}
        <circle cx="43" cy="30" r="3.5" fill="#FFFFFF" />
        <circle cx="44" cy="30" r="2" fill="#0B1B3D" />
        <circle cx="44.5" cy="29.2" r="0.7" fill="#FFFFFF" />

        <circle cx="57" cy="30" r="3.5" fill="#FFFFFF" />
        <circle cx="56" cy="30" r="2" fill="#0B1B3D" />
        <circle cx="55.5" cy="29.2" r="0.7" fill="#FFFFFF" />

        {/* Bec triangulaire orange vif */}
        <polygon points="45,35 55,35 50,43" fill="#FF9F00" />

        {/* Petites pattes orange en bas */}
        <ellipse cx="43" cy="78" rx="5" ry="3" fill="#FF9F00" />
        <ellipse cx="57" cy="78" rx="5" ry="3" fill="#FF9F00" />
      </svg>
    </div>
  );
};

/**
 * Wave Badge complet avec Manchot + Wordmark "wave"
 */
export const WaveBadge: React.FC<{ className?: string }> = ({ className = "" }) => {
  return (
    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-[#1DC3FF]/15 border border-[#1DC3FF]/40 text-[#008AC5] ${className}`}>
      <WaveLogo className="w-5 h-5" />
      <span className="text-xs font-black tracking-tight text-[#007EA7]">wave</span>
    </div>
  );
};

/**
 * 2. LOGO OFFICIEL ORANGE MONEY (Carré Orange #FF7900 + Anneaux OM Interconnectés)
 */
export const OrangeMoneyLogo: React.FC<{ className?: string; size?: number }> = ({ className = "w-7 h-7", size }) => {
  return (
    <div
      className={`relative inline-flex items-center justify-center rounded-xl bg-[#FF7900] p-0.5 shadow-xs shrink-0 overflow-hidden ${className}`}
      style={size ? { width: size, height: size } : undefined}
      title="Orange Money Sénégal"
    >
      <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
        {/* Fond carré Orange officiel */}
        <rect width="100" height="100" rx="22" fill="#FF7900" />
        
        {/* Symbole iconique des deux cercles enlacés Orange Money */}
        {/* Cercle gauche : Blanc pur */}
        <circle cx="39" cy="50" r="22" stroke="#FFFFFF" strokeWidth="8" fill="none" />
        
        {/* Cercle droit : Noir profond */}
        <circle cx="61" cy="50" r="22" stroke="#000000" strokeWidth="8" fill="none" />
        
        {/* Intersection dynamique supérieure en blanc */}
        <path
          d="M50 35.8C53.3 40 55.2 44.8 55.2 50C55.2 55.2 53.3 60 50 64.2"
          stroke="#FFFFFF"
          strokeWidth="8"
          strokeLinecap="round"
        />

        {/* Micro-mention 'om' au centre bas */}
        <rect x="42" y="78" width="16" height="4" rx="2" fill="#FFFFFF" opacity="0.9" />
      </svg>
    </div>
  );
};

/**
 * Orange Money Badge complet
 */
export const OrangeMoneyBadge: React.FC<{ className?: string }> = ({ className = "" }) => {
  return (
    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-[#FF7900]/15 border border-[#FF7900]/40 text-[#D95B00] ${className}`}>
      <OrangeMoneyLogo className="w-5 h-5" />
      <span className="text-xs font-black tracking-tight text-[#D95B00]">Orange Money</span>
    </div>
  );
};

/**
 * 3. LOGO OFFICIEL MTN MOBILE MONEY (Fond Jaune #FFCC00 + Ovale Bleu Marine MoMo)
 */
export const MtnMoneyLogo: React.FC<{ className?: string; size?: number }> = ({ className = "w-7 h-7", size }) => {
  return (
    <div
      className={`relative inline-flex items-center justify-center rounded-xl bg-[#FFCC00] p-0.5 shadow-xs shrink-0 overflow-hidden ${className}`}
      style={size ? { width: size, height: size } : undefined}
      title="MTN Mobile Money"
    >
      <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
        {/* Fond jaune MTN */}
        <rect width="100" height="100" rx="22" fill="#FFCC00" />
        
        {/* Ovale Bleu Marine MoMo */}
        <ellipse cx="50" cy="50" rx="40" ry="26" fill="#002B49" />
        
        {/* Texte stylisé MoMo */}
        <text
          x="50"
          y="56"
          textAnchor="middle"
          fill="#FFCC00"
          fontFamily="system-ui, -apple-system, sans-serif"
          fontWeight="900"
          fontSize="22"
          letterSpacing="-0.5"
        >
          MoMo
        </text>
      </svg>
    </div>
  );
};

/**
 * 4. LOGO OFFICIEL VISA (Logo vectoriel officiel avec accent doré sur le V)
 */
export const VisaLogo: React.FC<{ className?: string }> = ({ className = "h-5" }) => {
  return (
    <div className={`inline-flex items-center justify-center px-1.5 py-0.5 rounded-md bg-white border border-slate-200 shadow-2xs shrink-0 ${className}`}>
      <svg viewBox="0 0 48 16" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-auto">
        <path
          d="M18.8 1.5L12.5 15.5H8.3L5.1 4.5C4.9 3.7 4.7 3.4 4.1 3C3.1 2.5 1.5 2 0 1.7L0.1 1.5H7C7.9 1.5 8.7 2.1 8.9 3.1L10.6 12L14.7 1.5H18.8ZM35.3 11C35.3 7.3 30.2 7.1 30.2 5.3C30.2 4.7 30.8 4.1 31.9 3.9C32.4 3.8 34 3.7 35.7 4.5L36.4 1.3C35.4 0.9 34.2 0.6 32.6 0.6C28.5 0.6 25.7 2.7 25.7 5.7C25.7 8 27.8 9.2 29.4 10C31.1 10.8 31.7 11.3 31.7 12C31.7 13.1 30.4 13.6 29.2 13.6C27.2 13.6 26 13.2 24.8 12.7L24 16C25.3 16.6 27.5 17 29.6 17C34 17 35.3 14.8 35.3 11ZM45.8 15.5H49.5L46.3 1.5H42.9C42 1.5 41.3 2 40.9 2.9L35 15.5H39.4L40.3 13H45.2L45.8 15.5ZM41.5 9.7L43.5 4.3L44.7 9.7H41.5ZM24.4 1.5L21.1 15.5H17L20.3 1.5H24.4Z"
          fill="#1434CB"
        />
        {/* Aile dorée sur le V initial */}
        <path d="M7 1.5H0.1L0 1.7C3.5 2.5 6.2 4.7 7.2 7.7L8.9 3.1C9.1 2.1 8.3 1.5 7 1.5Z" fill="#F7B600" />
      </svg>
    </div>
  );
};

/**
 * 5. LOGO OFFICIEL MASTERCARD (Deux cercles imbriqués Rouge #EB001B et Jaune #F79E1B)
 */
export const MastercardLogo: React.FC<{ className?: string }> = ({ className = "h-5" }) => {
  return (
    <div className={`inline-flex items-center justify-center px-1.5 py-0.5 rounded-md bg-white border border-slate-200 shadow-2xs shrink-0 ${className}`}>
      <svg viewBox="0 0 36 22" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-auto">
        <rect width="36" height="22" rx="3" fill="#FFFFFF" />
        {/* Cercle rouge gauche */}
        <circle cx="13" cy="11" r="8" fill="#EB001B" />
        {/* Cercle orange-jaune droite */}
        <circle cx="23" cy="11" r="8" fill="#F79E1B" />
        {/* Lentille d'intersection centrale */}
        <path
          d="M18 5.7C19.7 7.1 20.8 8.9 20.8 11C20.8 13.1 19.7 14.9 18 16.3C16.3 14.9 15.2 13.1 15.2 11C15.2 8.9 16.3 7.1 18 5.7Z"
          fill="#FF5F00"
        />
      </svg>
    </div>
  );
};

/**
 * 6. BADGE COMBINÉ VISA & MASTERCARD
 */
export const VisaMastercardLogo: React.FC<{ className?: string }> = ({ className = "h-5" }) => {
  return (
    <div className={`flex items-center gap-1.5 shrink-0 ${className}`}>
      <VisaLogo />
      <MastercardLogo />
    </div>
  );
};

/**
 * 7. LOGO OFFICIEL GENIUSPAY GATEWAY
 */
export const GeniusPayLogo: React.FC<{ className?: string; size?: number }> = ({ className = "w-7 h-7", size }) => {
  return (
    <div
      className={`relative inline-flex items-center justify-center rounded-xl bg-gradient-to-tr from-[#0B192C] via-[#1E3E62] to-[#FF4500] p-1 shadow-xs shrink-0 ${className}`}
      style={size ? { width: size, height: size } : undefined}
      title="Passerelle GeniusPay"
    >
      <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
        {/* Bouclier de sécurité Fintech */}
        <path
          d="M50 12L78 24V50C78 68 66 82 50 88C34 82 22 68 22 50V24L50 12Z"
          fill="url(#gp_grad)"
          stroke="#FFFFFF"
          strokeWidth="4"
          strokeLinejoin="round"
        />
        {/* Éclair / Checkmark au centre */}
        <path
          d="M44 48L52 32L48 50L58 50L46 68L49 54L44 48Z"
          fill="#FFD700"
        />
        <defs>
          <linearGradient id="gp_grad" x1="22" y1="12" x2="78" y2="88" gradientUnits="userSpaceOnUse">
            <stop stopColor="#0B192C" />
            <stop offset="0.6" stopColor="#1E3E62" />
            <stop offset="1" stopColor="#FF4500" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
};

/**
 * Badge GeniusPay Certifié
 */
export const GeniusPayBadge: React.FC<{ className?: string }> = ({ className = "" }) => {
  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700/80 text-white text-xs font-semibold shadow-xs ${className}`}>
      <GeniusPayLogo className="w-4 h-4" />
      <span className="tracking-tight font-bold">GeniusPay Checkout</span>
      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse ml-0.5"></span>
    </div>
  );
};
