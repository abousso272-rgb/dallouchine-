import React from 'react';
import { useApp } from '../../context/AppContext';
import { ArrowRight, MessageCircle, FileText } from 'lucide-react';

export const HeroSectionVisual: React.FC = () => {
  const { navigate } = useApp();

  return (
    <section className="relative pt-6 sm:pt-10 pb-6 sm:pb-12 overflow-hidden">
      {/* Background Decorative Ambient Blobs & Gradient Ribbons */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-full pointer-events-none -z-10 overflow-hidden">
        <div className="absolute top-10 right-0 w-[520px] h-[520px] bg-gradient-to-br from-[#FF4500]/15 via-[#FF8A00]/10 to-transparent rounded-full blur-3xl" />
        <div className="absolute -bottom-10 -left-20 w-[420px] h-[420px] bg-orange-100/60 rounded-full blur-2xl" />
        {/* Stylized fluid swoosh border line */}
        <svg
          className="absolute -right-10 bottom-0 w-[750px] h-[450px] text-[#FF4500]/15 hidden lg:block"
          viewBox="0 0 750 450"
          fill="none"
        >
          <path
            d="M50 450 C 250 350, 450 420, 750 200 C 650 380, 400 440, 50 450 Z"
            fill="currentColor"
          />
        </svg>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center">
        {/* ===================================================================== */}
        {/* LEFT COLUMN: BADGE, HEADLINE, SUBTITLE & 3 CTA BUTTONS */}
        {/* ===================================================================== */}
        <div className="lg:col-span-6 space-y-6 text-left">
          {/* Badge: Chine ➔ Sénégal */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-orange-100/80 border border-orange-200/80 text-[#D84315] text-xs font-black shadow-2xs">
            <span className="text-sm">🇨🇳</span>
            <span className="tracking-wide">Chine ➔ Sénégal</span>
            <span className="text-sm">🇸🇳</span>
          </div>

          {/* Huge Main Headline */}
          <h1 className="text-4xl sm:text-5xl lg:text-[58px] font-black text-[#0B192C] tracking-tight leading-[1.08]">
            Votre passerelle entre<br />
            la <span className="text-[#FF4500]">Chine et l’Afrique</span>
          </h1>

          {/* Subtitle */}
          <p className="text-base sm:text-lg text-slate-600 font-normal leading-relaxed max-w-xl">
            Nous vous aidons à trouver, acheter et faire acheminer vos produits de Chine vers le Sénégal, simplement et en toute transparence.
          </p>

          {/* 3 Call to Action Buttons */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            {/* 1. Explorer les produits -> */}
            <button
              onClick={() => navigate('/products')}
              className="px-7 py-3.5 rounded-full bg-[#FF4500] hover:bg-[#E03D00] active:scale-95 text-white font-bold text-sm sm:text-base shadow-lg shadow-orange-500/25 transition-all flex items-center gap-2.5 cursor-pointer"
            >
              <span>Explorer les produits</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            {/* 2. Demander un devis */}
            <button
              onClick={() => navigate('/b2b')}
              className="px-6 py-3.5 rounded-full bg-white hover:bg-slate-50 active:scale-95 text-slate-800 font-bold text-sm sm:text-base border border-slate-200/90 shadow-xs transition-all flex items-center gap-2 cursor-pointer"
            >
              <FileText className="w-4 h-4 text-slate-400" />
              <span>Demander un devis</span>
            </button>

            {/* 3. Parler sur WhatsApp */}
            <a
              href="https://wa.me/221774201819?text=Bonjour%20Dallou%20Chine,%20je%20souhaite%20des%20renseignements%20sur%20vos%20services%20de%20transit%20et%20sourcing."
              target="_blank"
              rel="noreferrer"
              className="px-5 py-3.5 rounded-full bg-white hover:bg-emerald-50/60 active:scale-95 text-[#10B981] font-bold text-sm sm:text-base border border-emerald-200/80 shadow-xs transition-all flex items-center gap-2 cursor-pointer"
            >
              <div className="w-5 h-5 rounded-full bg-[#10B981] text-white flex items-center justify-center shrink-0 shadow-2xs">
                <MessageCircle className="w-3 h-3 fill-current" />
              </div>
              <span>Parler sur WhatsApp</span>
            </a>
          </div>
        </div>

        {/* ===================================================================== */}
        {/* RIGHT COLUMN: HERO PHOTOGRAPHIC & LOGISTICS COMPOSITE */}
        {/* ===================================================================== */}
        <div className="lg:col-span-6 relative">
          <div className="relative rounded-3xl overflow-hidden shadow-2xl border-4 border-white bg-slate-900 aspect-[16/11] group">
            {/* Base Background Image: Cargo Port with Container Ship, Cranes and Sunset */}
            <img
              src="https://images.unsplash.com/photo-1578575437130-527eed3abbec?auto=format&fit=crop&w=1200&q=80"
              alt="Port maritime et navires de conteneurs Chine-Afrique"
              className="w-full h-full object-cover object-center transform group-hover:scale-102 transition-transform duration-700"
            />

            {/* Sun / Golden Hour Warm Overlay */}
            <div className="absolute inset-0 bg-gradient-to-tr from-[#0B192C]/80 via-transparent to-[#FF8A00]/25 pointer-events-none" />

            {/* Cargo Plane Taking Flight in the Sky */}
            <div className="absolute top-4 right-20 sm:top-6 sm:right-32 flex items-center gap-1 opacity-90 drop-shadow-lg pointer-events-none">
              <svg className="w-10 h-10 sm:w-14 sm:h-14 text-white -rotate-12" viewBox="0 0 24 24" fill="currentColor">
                <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z" />
              </svg>
            </div>

            {/* African Renaissance Monument & Dakar Skyline Silhouette on distant horizon */}
            <div className="absolute top-8 right-4 hidden sm:flex flex-col items-center opacity-85 pointer-events-none">
              <div className="flex items-center gap-1.5 bg-black/40 backdrop-blur-xs px-2.5 py-1 rounded-full text-white text-[10px] font-bold border border-white/20">
                <span>Dakar</span>
                <span className="text-xs">🇸🇳</span>
              </div>
            </div>

            {/* Logistics Supervisor Character Overlay (Orange Vest with DC Logo + White Hard Hat) */}
            <div className="absolute bottom-0 right-0 sm:right-4 w-44 sm:w-60 h-auto pointer-events-none flex flex-col items-center justify-end">
              {/* Cardboard Boxes in foreground */}
              <div className="absolute -bottom-2 -left-12 hidden sm:flex items-end gap-1 opacity-95">
                <div className="w-14 h-12 bg-amber-700/90 rounded-sm border border-amber-600 shadow-md flex items-center justify-center text-[8px] text-amber-200 font-mono">
                  📦 DC-EXP
                </div>
                <div className="w-16 h-16 bg-amber-800/90 rounded-sm border border-amber-600 shadow-md flex items-center justify-center text-[9px] text-amber-200 font-mono">
                  📦 GUANGZHOU
                </div>
              </div>

              {/* Realistic Agent Silhouette with Orange Hi-Viz Vest and DC DALLOU CHINE Badge */}
              <div className="relative flex flex-col items-center">
                {/* White Safety Helmet */}
                <div className="w-14 h-9 sm:w-18 sm:h-12 bg-slate-100 rounded-t-full shadow-lg border border-slate-300 relative z-10 flex items-center justify-center">
                  <div className="w-full h-1 bg-[#FF4500] absolute bottom-1" />
                </div>

                {/* Head/Hair back */}
                <div className="w-10 h-7 sm:w-12 sm:h-8 bg-slate-900 -mt-2 rounded-b-md" />

                {/* High-Visibility Orange Safety Vest with Logo */}
                <div className="w-32 sm:w-44 h-32 sm:h-44 bg-[#FF4500] rounded-t-3xl shadow-2xl relative overflow-hidden flex flex-col items-center justify-start pt-3 border-t-2 border-orange-400">
                  {/* Silver reflective safety stripes */}
                  <div className="absolute top-6 left-0 right-0 h-3 bg-slate-200/90 shadow-xs" />
                  <div className="absolute top-14 left-0 right-0 h-3 bg-slate-200/90 shadow-xs" />
                  <div className="absolute top-0 bottom-0 left-7 w-2.5 bg-slate-200/90" />
                  <div className="absolute top-0 bottom-0 right-7 w-2.5 bg-slate-200/90" />

                  {/* DC DALLOU CHINE Logo Badge printed on the back */}
                  <div className="relative z-10 bg-white/95 px-3 py-1.5 rounded-lg shadow-md border border-white flex flex-col items-center mt-3 text-center">
                    <div className="flex items-center gap-1">
                      <div className="w-3.5 h-3.5 rounded bg-[#FF4500] text-white flex items-center justify-center text-[8px] font-black">
                        DC
                      </div>
                      <span className="text-[10px] sm:text-xs font-black text-[#0B192C] tracking-tighter">
                        DALLOU CHINE
                      </span>
                    </div>
                    <span className="text-[7px] text-[#FF4500] font-bold uppercase tracking-widest -mt-0.5">
                      Logistique & Transit
                    </span>
                  </div>

                  {/* Tablet in hand */}
                  <div className="absolute -left-2 bottom-3 w-16 h-12 bg-slate-800 rounded-md border-2 border-slate-600 shadow-xl rotate-12 flex items-center justify-center">
                    <div className="w-12 h-9 bg-blue-500/30 rounded flex items-center justify-center text-[7px] text-blue-200 font-mono">
                      ✓ MANIFESTE
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom floating banner badge: Live Status */}
            <div className="absolute bottom-3 left-3 bg-white/95 backdrop-blur-md px-3.5 py-2 rounded-2xl shadow-lg border border-white flex items-center gap-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <div className="text-left">
                <p className="text-[11px] font-black text-[#0B192C] leading-none">Départs hebdomadaires</p>
                <p className="text-[9px] text-slate-500 font-semibold mt-0.5">Aérien 5-7j • Maritime 35-45j</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
