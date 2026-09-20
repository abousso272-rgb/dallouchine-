import React from 'react';

/**
 * LOGOS OFFICIELS DES OPÉRATEURS DE PAIEMENT (WAVE, ORANGE MONEY, MTN, VISA, MASTERCARD, GENIUSPAY)
 * Utilise les vecteurs officiels extraits directement de la passerelle GeniusPay
 */

export const WaveLogo: React.FC<{ className?: string; size?: number }> = ({ className = "w-7 h-7", size }) => {
  return (
    <div
      className={`inline-flex items-center justify-center rounded-xl bg-white p-1 border border-slate-200/80 shadow-2xs shrink-0 ${className}`}
      style={size ? { width: size, height: size } : undefined}
    >
      <img
        src="/logos/wave.svg"
        alt="Wave Mobile Money Sénégal"
        className="w-full h-full object-contain"
        loading="eager"
      />
    </div>
  );
};

export const OrangeMoneyLogo: React.FC<{ className?: string; size?: number }> = ({ className = "w-7 h-7", size }) => {
  return (
    <div
      className={`inline-flex items-center justify-center rounded-xl bg-white p-1 border border-slate-200/80 shadow-2xs shrink-0 ${className}`}
      style={size ? { width: size, height: size } : undefined}
    >
      <img
        src="/logos/orange.svg"
        alt="Orange Money Sénégal"
        className="w-full h-full object-contain"
        loading="eager"
      />
    </div>
  );
};

export const MtnMoneyLogo: React.FC<{ className?: string; size?: number }> = ({ className = "w-7 h-7", size }) => {
  return (
    <div
      className={`inline-flex items-center justify-center rounded-xl bg-white p-1 border border-slate-200/80 shadow-2xs shrink-0 ${className}`}
      style={size ? { width: size, height: size } : undefined}
    >
      <img
        src="/logos/mtn.svg"
        alt="MTN Mobile Money"
        className="w-full h-full object-contain"
        loading="eager"
      />
    </div>
  );
};

export const VisaLogo: React.FC<{ className?: string }> = ({ className = "h-5" }) => {
  return (
    <div className={`inline-flex items-center justify-center px-1.5 py-1 rounded-md bg-white border border-slate-200 shadow-2xs shrink-0 ${className}`}>
      <img
        src="/logos/visa.svg"
        alt="Visa"
        className="h-3.5 w-auto object-contain"
        loading="eager"
      />
    </div>
  );
};

export const MastercardLogo: React.FC<{ className?: string }> = ({ className = "h-5" }) => {
  return (
    <div className={`inline-flex items-center justify-center px-1.5 py-1 rounded-md bg-white border border-slate-200 shadow-2xs shrink-0 ${className}`}>
      <img
        src="/logos/mastercard.svg"
        alt="Mastercard"
        className="h-4 w-auto object-contain"
        loading="eager"
      />
    </div>
  );
};

export const VisaMastercardLogo: React.FC<{ className?: string }> = ({ className = "h-6" }) => {
  return (
    <div className={`flex items-center gap-1.5 shrink-0 ${className}`}>
      <VisaLogo />
      <MastercardLogo />
    </div>
  );
};

export const GeniusPayLogo: React.FC<{ className?: string; size?: number }> = ({ className = "w-8 h-8", size }) => {
  return (
    <div
      className={`inline-flex items-center justify-center rounded-xl bg-white p-1 border border-slate-200 shadow-2xs shrink-0 ${className}`}
      style={size ? { width: size, height: size } : undefined}
    >
      <img
        src="/logos/geniuspay.svg"
        alt="GeniusPay"
        className="w-full h-full object-contain"
        loading="eager"
      />
    </div>
  );
};

export const GeniusPayBadge: React.FC<{ className?: string }> = ({ className = "" }) => {
  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700/80 text-white text-xs font-semibold shadow-xs ${className}`}>
      <img src="/logos/geniuspay.svg" alt="GeniusPay" className="w-4 h-4 object-contain brightness-0 invert" />
      <span className="tracking-tight font-bold">GeniusPay Checkout</span>
      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse ml-0.5"></span>
    </div>
  );
};
