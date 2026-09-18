import React from 'react';

export const WaveLogo: React.FC<{ className?: string; size?: number }> = ({ className = "w-7 h-7", size }) => {
  return (
    <div className={`relative flex items-center justify-center rounded-xl bg-[#1DA1F2] p-1 shadow-xs shrink-0 ${className}`} style={size ? { width: size, height: size } : undefined}>
      {/* Wave Icon Symbol: Penguin / Wave Blue & White Wave shape */}
      <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
        {/* Rounded background */}
        <rect width="100" height="100" rx="22" fill="#1DA1F2" />
        {/* Wave stylized Penguin & water ripple */}
        <path
          d="M50 18C37.85 18 28 27.85 28 40C28 48.5 32.8 55.88 39.8 59.54L38.2 68.2C37.9 69.8 39.1 71.3 40.7 71.3H59.3C60.9 71.3 62.1 69.8 61.8 68.2L60.2 59.54C67.2 55.88 72 48.5 72 40C72 27.85 62.15 18 50 18Z"
          fill="#FFFFFF"
        />
        {/* Wave inner blue belly & eye */}
        <circle cx="43" cy="34" r="3.5" fill="#1DA1F2" />
        <circle cx="57" cy="34" r="3.5" fill="#1DA1F2" />
        <ellipse cx="50" cy="42" rx="4.5" ry="3" fill="#FFC800" />
        {/* Wave signature cyan ripple curve below */}
        <path
          d="M20 78C30 74 40 82 50 78C60 74 70 82 80 78"
          stroke="#FFFFFF"
          strokeWidth="6"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
};

export const OrangeMoneyLogo: React.FC<{ className?: string; size?: number }> = ({ className = "w-7 h-7", size }) => {
  return (
    <div className={`relative flex items-center justify-center rounded-xl bg-[#FF6600] p-1 shadow-xs shrink-0 ${className}`} style={size ? { width: size, height: size } : undefined}>
      {/* Official Orange Money branding square & OM stylized typography */}
      <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
        <rect width="100" height="100" rx="22" fill="#FF6600" />
        {/* Orange Money Dual Circle Symbol */}
        <circle cx="42" cy="50" r="22" stroke="#FFFFFF" strokeWidth="8" fill="none" />
        <circle cx="58" cy="50" r="22" stroke="#000000" strokeWidth="8" fill="none" opacity="0.85" />
        <circle cx="58" cy="50" r="22" stroke="#FFFFFF" strokeWidth="8" strokeDasharray="34 100" fill="none" />
      </svg>
    </div>
  );
};

export const VisaMastercardLogo: React.FC<{ className?: string }> = ({ className = "h-5" }) => {
  return (
    <div className={`flex items-center gap-1.5 shrink-0 ${className}`}>
      {/* Visa */}
      <div className="bg-white px-1.5 py-0.5 rounded border border-slate-200 flex items-center justify-center">
        <span className="text-[11px] font-black tracking-tighter text-[#1A1F71] italic font-sans">VISA</span>
      </div>
      {/* Mastercard */}
      <div className="bg-white px-1.5 py-0.5 rounded border border-slate-200 flex items-center justify-center gap-0">
        <div className="w-2.5 h-2.5 rounded-full bg-[#EB001B] opacity-90"></div>
        <div className="w-2.5 h-2.5 rounded-full bg-[#F79E1B] -ml-1 opacity-90"></div>
      </div>
    </div>
  );
};

export const GeniusPayBadge: React.FC<{ className?: string }> = ({ className = "" }) => {
  return (
    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-900/40 border border-blue-500/30 text-blue-300 text-[11px] font-medium ${className}`}>
      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
      <span>Propulsé par <strong>GeniusPay Gateway</strong></span>
    </div>
  );
};
