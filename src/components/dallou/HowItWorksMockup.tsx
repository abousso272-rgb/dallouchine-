import React from 'react';
import { Search, Handshake, FileCheck, Package, Ship, Truck, ChevronRight } from 'lucide-react';

export const HowItWorksMockup: React.FC = () => {
  const steps = [
    {
      num: 1,
      title: 'Vous trouvez un produit',
      icon: Search
    },
    {
      num: 2,
      title: 'Nous recherchons et négocions',
      icon: Handshake
    },
    {
      num: 3,
      title: 'Vous validez votre commande',
      icon: FileCheck
    },
    {
      num: 4,
      title: 'Nous achetons et préparons',
      icon: Package
    },
    {
      num: 5,
      title: 'Transport et suivi',
      icon: Ship
    },
    {
      num: 6,
      title: 'Vous recevez au Sénégal',
      icon: Truck
    }
  ];

  return (
    <section id="comment-ca-marche" className="space-y-6 pt-6">
      {/* Header with red dot & flags */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="w-3 h-3 rounded-full bg-[#FF4500] shrink-0" />
          <div>
            <h2 className="text-2xl sm:text-3xl font-black text-[#0B192C] tracking-tight flex items-center gap-2">
              <span>Comment ça marche ?</span>
              <span className="text-2xl">🇨🇳</span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 font-medium">
              Un processus simple, de la Chine jusqu’à vous.
            </p>
          </div>
        </div>

        {/* Flag Senegal Destination */}
        <div className="hidden sm:flex items-center gap-2 bg-white px-3.5 py-1.5 rounded-full border border-slate-200 text-xs font-bold text-slate-700 shadow-2xs">
          <span>Livraison finale à Dakar</span>
          <span className="text-base">🇸🇳</span>
        </div>
      </div>

      {/* Mobile / Tablet: Responsive 2-column grid (No horizontal overflow) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:hidden gap-2 sm:gap-3 bg-white/80 rounded-2xl p-3 sm:p-4 border border-slate-100 shadow-xs">
        {steps.map((step) => {
          const Icon = step.icon;
          return (
            <div
              key={step.num}
              className="flex flex-col items-center text-center p-2.5 rounded-xl bg-slate-50/70 border border-slate-100/80 relative group"
            >
              <div className="w-5 h-5 rounded-full bg-[#FF4500] text-white text-[10px] font-black flex items-center justify-center mb-1 shadow-xs">
                {step.num}
              </div>
              <div className="w-9 h-9 rounded-full bg-white border border-slate-200 text-[#FF4500] flex items-center justify-center mb-1.5 shadow-2xs">
                <Icon className="w-4 h-4" />
              </div>
              <span className="text-[11px] font-bold text-[#0B192C] leading-tight">
                {step.title}
              </span>
            </div>
          );
        })}
      </div>

      {/* Desktop: Horizontal Chain */}
      <div className="hidden lg:block bg-white/80 rounded-3xl p-6 border border-slate-100 shadow-xs">
        <div className="flex items-center justify-between gap-2">
          {steps.map((step, idx) => {
            const Icon = step.icon;
            return (
              <React.Fragment key={step.num}>
                {/* Step Item */}
                <div className="flex flex-col items-center text-center group flex-1 max-w-[135px]">
                  <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-white border-2 border-slate-100 group-hover:border-[#FF4500] text-[#FF4500] shadow-sm flex items-center justify-center mb-2.5 transition-all duration-300 group-hover:scale-105">
                    <Icon className="w-5 h-5 sm:w-6 sm:h-6" />
                  </div>
                  <span className="text-xs sm:text-[13px] font-bold text-[#0B192C] leading-snug group-hover:text-[#FF4500] transition-colors">
                    {step.num}. {step.title}
                  </span>
                </div>

                {/* Orange Chevron Divider */}
                {idx < steps.length - 1 && (
                  <div className="text-[#FF4500] opacity-80 shrink-0">
                    <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.5]" />
                  </div>
                )}
              </React.Fragment>
            );
          })}

          {/* Destination Flag circle */}
          <div className="w-10 h-10 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center text-xl shrink-0 shadow-2xs ml-2">
            🇸🇳
          </div>
        </div>
      </div>
    </section>
  );
};
