import React from 'react';
import { Plane, Ship, ShieldCheck, Check, HelpCircle, ArrowRight, Zap, Info } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const PricingRatesTable: React.FC = () => {
  const { navigate } = useApp();

  return (
    <section id="tarifs" className="space-y-8">
      <div className="text-center max-w-3xl mx-auto space-y-3">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#0B192C]/10 text-[#0B192C] text-xs font-black tracking-wide uppercase">
          Transparence Absolue
        </span>
        <h2 className="text-2xl sm:text-4xl font-black text-[#0B192C] tracking-tight">
          Grille Tarifaire Fret Chine ➔ Sénégal
        </h2>
        <p className="text-xs sm:text-base text-slate-600">
          Nos tarifs sont fixés en FCFA, tout compris rendu Dakar : transport international, manutention aéroport/port et dédouanement officiel. Aucun frais caché à l'arrivée.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Card 1: Air Standard */}
        <div className="rounded-3xl bg-white border border-slate-200 p-6 sm:p-7 shadow-sm hover:shadow-lg transition-all flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-orange-50 border border-orange-100 flex items-center justify-center">
                <Plane className="w-5 h-5 text-[#FF4500]" />
              </div>
              <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700">
                Aérien Standard
              </span>
            </div>

            <div>
              <h3 className="text-lg font-black text-[#0B192C]">Fret Aérien Ordinaire</h3>
              <p className="text-xs text-slate-500 mt-1">
                Vêtements, chaussures, sacs, pièces mécaniques, accessoires mode, textiles.
              </p>
            </div>

            <div className="pt-2 border-t border-slate-100">
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-black text-[#FF4500] font-mono">9 500</span>
                <span className="text-xs font-bold text-slate-600">FCFA / kg</span>
              </div>
              <span className="text-[11px] text-slate-400 block mt-0.5">Délai indicatif : 5 à 7 jours ouvrés</span>
            </div>

            <ul className="text-xs text-slate-700 space-y-2.5 pt-3 border-t border-slate-100">
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Dédouanement Gaindé Dakar inclus</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Départs chaque mardi et vendredi</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Pesée précise sur balance homologuée</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Alerte SMS & WhatsApp dès arrivée</span>
              </li>
            </ul>
          </div>

          <button
            onClick={() => {
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="w-full py-3 rounded-xl bg-slate-100 hover:bg-[#FF4500] hover:text-white font-bold text-xs text-[#0B192C] transition-colors flex items-center justify-center gap-1.5"
          >
            <span>Estimer un colis standard</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Card 2: Air High-Tech & Batteries (Featured) */}
        <div className="rounded-3xl bg-gradient-to-b from-[#0B192C] to-[#142A45] text-white p-6 sm:p-7 shadow-xl relative overflow-hidden flex flex-col justify-between space-y-6 border-2 border-[#FF4500]">
          <div className="absolute -top-3 right-6 bg-[#FF4500] text-white text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full shadow-md">
            Ligne Spéciale Sécurisée
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                <Zap className="w-5 h-5 text-[#FF4500]" />
              </div>
              <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-white/10 text-white">
                Électronique & Accu
              </span>
            </div>

            <div>
              <h3 className="text-lg font-black text-white">High-Tech & Batteries</h3>
              <p className="text-xs text-slate-300 mt-1">
                Smartphones, tablettes, montres connectées, écouteurs, batteries, projecteurs, écrans.
              </p>
            </div>

            <div className="pt-2 border-t border-white/10">
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-black text-white font-mono">12 500</span>
                <span className="text-xs font-bold text-slate-300">FCFA / kg</span>
              </div>
              <span className="text-[11px] text-slate-300 block mt-0.5">Délai indicatif : 6 à 8 jours ouvrés</span>
            </div>

            <ul className="text-xs text-slate-200 space-y-2.5 pt-3 border-t border-white/10">
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-[#FF4500] shrink-0" />
                <span>Canal aérien homologué batteries Li-Ion</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-[#FF4500] shrink-0" />
                <span>Protection anti-choc et emballage renforcé</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-[#FF4500] shrink-0" />
                <span>Dédouanement spécifique matériel électronique</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-[#FF4500] shrink-0" />
                <span>Garantie contre la casse et la perte</span>
              </li>
            </ul>
          </div>

          <button
            onClick={() => {
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="w-full py-3 rounded-xl bg-[#FF4500] hover:bg-[#E03D00] text-white font-bold text-xs shadow-lg transition-all flex items-center justify-center gap-1.5"
          >
            <span>Estimer un envoi high-tech</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Card 3: Sea LCL Freight */}
        <div className="rounded-3xl bg-white border border-slate-200 p-6 sm:p-7 shadow-sm hover:shadow-lg transition-all flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center">
                <Ship className="w-5 h-5 text-[#0B192C]" />
              </div>
              <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700">
                Maritime LCL
              </span>
            </div>

            <div>
              <h3 className="text-lg font-black text-[#0B192C]">Groupage Maritime</h3>
              <p className="text-xs text-slate-500 mt-1">
                Mobilier, outillage, électroménager, emballages, panneaux solaires, gros stocks commerciaux.
              </p>
            </div>

            <div className="pt-2 border-t border-slate-100">
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-black text-[#0B192C] font-mono">300 000</span>
                <span className="text-xs font-bold text-slate-600">FCFA / CBM</span>
              </div>
              <span className="text-[11px] text-slate-400 block mt-0.5">Délai indicatif : 35 à 45 jours de mer</span>
            </div>

            <ul className="text-xs text-slate-700 space-y-2.5 pt-3 border-t border-slate-100">
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Facturation au mètre cube réel ($L \times l \times H$)</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Dédouanement Gaindé Port de Dakar inclus</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Conteneurs plombés hermétiques étanches</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Tarif dégressif dès 3 CBM pour commerçants</span>
              </li>
            </ul>
          </div>

          <button
            onClick={() => navigate('/b2b')}
            className="w-full py-3 rounded-xl bg-slate-100 hover:bg-[#0B192C] hover:text-white font-bold text-xs text-[#0B192C] transition-colors flex items-center justify-center gap-1.5"
          >
            <span>Demander un devis maritime B2B</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Trust Guarantee Ribbon */}
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 sm:p-5 flex flex-col md:flex-row items-center justify-between gap-4 text-xs">
        <div className="flex items-center gap-3">
          <ShieldCheck className="w-6 h-6 text-emerald-600 shrink-0" />
          <div>
            <span className="font-bold text-slate-900 block">Zéro mauvaise surprise à la livraison</span>
            <span className="text-slate-500">
              Nos tarifs intègrent l’ensemble de la chaîne : du déchargement à l’aéroport/port jusqu’au dédouanement complet.
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4 text-slate-600 shrink-0">
          <div className="flex items-center gap-1">
            <span className="font-mono font-bold text-[#FF4500]">1 RMB</span>
            <span>≈ 87,5 FCFA</span>
          </div>
          <span>•</span>
          <span>Stockage Chine 30 jours offert</span>
        </div>
      </div>
    </section>
  );
};
