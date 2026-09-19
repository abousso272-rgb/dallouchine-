import React from 'react';
import { HeroTools } from '../../components/dallou/HeroTools';
import { ServicesOverview } from '../../components/dallou/ServicesOverview';
import { PricingRatesTable } from '../../components/dallou/PricingRatesTable';
import { WarehousesSection } from '../../components/dallou/WarehousesSection';
import { FaqSection } from '../../components/dallou/FaqSection';
import { DakarHubsAndContact } from '../../components/dallou/DakarHubsAndContact';
import { Plane, Ship, Warehouse, ShieldCheck } from 'lucide-react';

export const TransitPage: React.FC = () => {
  return (
    <div className="space-y-12 sm:space-y-20 pb-16">
      {/* Page Header */}
      <section className="text-center max-w-4xl mx-auto space-y-4 pt-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FF4500]/10 text-[#FF4500] text-xs font-black uppercase tracking-wider">
          <Plane className="w-3.5 h-3.5" />
          <span>Hub Logistique & Fret Chine ➔ Sénégal</span>
          <Ship className="w-3.5 h-3.5" />
        </div>
        <h1 className="text-3xl sm:text-5xl font-black text-[#0B192C] tracking-tight">
          Transit, Fret & Entrepôts en Chine
        </h1>
        <p className="text-xs sm:text-base text-slate-600 max-w-2xl mx-auto leading-relaxed">
          Simulez le coût de vos envois aériens ou maritimes, suivez vos colis en temps réel et copiez les adresses de nos entrepôts de Guangzhou et Yiwu.
        </p>

        {/* Live Tracking & Calculator Hero Tools */}
        <div className="pt-4">
          <HeroTools />
        </div>
      </section>

      {/* Services Overview */}
      <ServicesOverview />

      {/* Tarifs au kg / CBM */}
      <PricingRatesTable />

      {/* Adresses Entrepôts en Chine */}
      <WarehousesSection />

      {/* FAQ Logistique */}
      <FaqSection />

      {/* Agences Dakar & Contact */}
      <DakarHubsAndContact />
    </div>
  );
};
