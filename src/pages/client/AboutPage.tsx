import React from 'react';
import { useApp } from '../../context/AppContext';
import { ShieldCheck, Users, Globe2, Truck, CheckCircle2, ArrowRight } from 'lucide-react';

export const AboutPage: React.FC = () => {
  const { navigate } = useApp();

  return (
    <div className="space-y-12 sm:space-y-16 pb-16 pt-4 max-w-5xl mx-auto">
      {/* Header */}
      <section className="text-center space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FF4500]/10 text-[#FF4500] text-xs font-black uppercase tracking-wider">
          <span>À propos de Dallou Chine</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-black text-[#0B192C] tracking-tight">
          Votre passerelle de confiance entre la Chine et l’Afrique
        </h1>
        <p className="text-sm sm:text-base text-slate-600 max-w-3xl mx-auto leading-relaxed">
          Dallou Chine a été fondée avec une mission claire : rendre l'importation de produits depuis la Chine accessible, transparente et sécurisée pour tous les entrepreneurs, commerçants et particuliers au Sénégal et en Afrique de l'Ouest.
        </p>
      </section>

      {/* 3 Pillars */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-orange-50 text-[#FF4500] flex items-center justify-center font-black">
            <Globe2 className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-[#0B192C]">Présence binationale</h3>
          <p className="text-sm text-slate-600 leading-relaxed">
            Nos équipes sont basées directement en Chine (Guangzhou & Yiwu) pour la négociation, l'inspection et la réception, et à Dakar pour le dédouanement et la livraison.
          </p>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-orange-50 text-[#FF4500] flex items-center justify-center font-black">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-[#0B192C]">Transparence totale</h3>
          <p className="text-sm text-slate-600 leading-relaxed">
            Zéro frais caché : séparation claire entre prix usine négocié et coûts logistiques réels, avec facture et tracking détaillé à chaque étape.
          </p>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-black">
            <Truck className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-[#0B192C]">Fret Aérien & Maritime</h3>
          <p className="text-sm text-slate-600 leading-relaxed">
            Fret aérien express hebdomadaire (5 à 9 jours) et groupage maritime économique (30 à 45 jours) avec retrait dans nos agences de Dakar ou livraison à domicile.
          </p>
        </div>
      </div>

      {/* CTA Box */}
      <div className="bg-gradient-to-r from-[#0B192C] to-[#1E293B] rounded-3xl p-8 sm:p-12 text-white flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl">
        <div className="space-y-2 text-center md:text-left">
          <h2 className="text-2xl sm:text-3xl font-black">Prêt à démarrer vos achats en Chine ?</h2>
          <p className="text-slate-300 text-sm max-w-xl">
            Découvrez notre marketplace, participez aux groupages ou demandez un devis de sourcing personnalisé.
          </p>
        </div>
        <div className="flex flex-wrap gap-3 shrink-0">
          <button
            onClick={() => navigate('/products')}
            className="px-6 py-3 rounded-full bg-[#FF4500] hover:bg-[#E03D00] text-white font-bold text-sm shadow-md transition-all flex items-center gap-2"
          >
            <span>Explorer le catalogue</span>
            <ArrowRight className="w-4 h-4" />
          </button>
          <button
            onClick={() => navigate('/b2b')}
            className="px-6 py-3 rounded-full bg-white/10 hover:bg-white/20 text-white font-bold text-sm transition-all"
          >
            Demander un devis B2B
          </button>
        </div>
      </div>
    </div>
  );
};
