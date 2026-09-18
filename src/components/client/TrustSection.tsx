import React from 'react';
import { ShieldCheck, Tag, CheckCircle2, Plane, Smartphone, SearchCheck } from 'lucide-react';

export const TrustSection: React.FC = () => {
  const trustPoints = [
    {
      title: 'Produits Sélectionnés & Audités',
      desc: 'Zéro contrefaçon, nous auditons directement les usines et filtrons les vendeurs.',
      icon: <SearchCheck className="w-5 h-5 text-[#2A6DFF]" />
    },
    {
      title: 'Prix Négociés Usine',
      desc: 'Accédez au véritable prix de gros chinois sans marge abusive d\'importateurs locaux.',
      icon: <Tag className="w-5 h-5 text-emerald-600" />
    },
    {
      title: 'Contrôle Qualité Avant Expédition',
      desc: 'Chaque lot est vérifié, testé et photographié à Guangzhou ou Yiwu avant de quitter la Chine.',
      icon: <ShieldCheck className="w-5 h-5 text-indigo-600" />
    },
    {
      title: 'Transport & Douane Optimisés',
      desc: 'Aucune surprise à l\'arrivée : le prix affiché inclut les frais de douane et de fret.',
      icon: <Plane className="w-5 h-5 text-amber-600" />
    },
    {
      title: 'Paiement Sécurisé Local',
      desc: 'Réglez simplement par Wave, Orange Money ou Carte. Compte séquestre garanti.',
      icon: <Smartphone className="w-5 h-5 text-cyan-600" />
    },
    {
      title: 'Suivi AWP en Temps Réel',
      desc: 'Tracez votre colis d\'étape en étape avec notifications WhatsApp et SMS à chaque étape.',
      icon: <CheckCircle2 className="w-5 h-5 text-teal-600" />
    }
  ];

  return (
    <div className="py-12 bg-white rounded-3xl p-6 sm:p-10 border border-slate-200/80 shadow-xs">
      <div className="text-center max-w-2xl mx-auto mb-10">
        <span className="text-xs font-bold uppercase tracking-wider text-[#0D2C7A] bg-[#0D2C7A]/5 px-3 py-1 rounded-full">
          Garantie de Sérénité
        </span>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-[#0D2C7A] mt-2.5 tracking-tight">
          Pourquoi faire confiance à SinoSenegal ?
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 mt-2">
          Nous allions l'expertise terrain en Chine à la proximité client au Sénégal.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {trustPoints.map((point, idx) => (
          <div
            key={idx}
            className="flex items-start gap-4 p-4 rounded-2xl bg-[#F8F6F2] hover:bg-white border border-slate-200/60 hover:border-[#2A6DFF]/30 hover:shadow-md transition-all duration-300"
          >
            <div className="w-11 h-11 rounded-xl bg-white shadow-2xs border border-slate-100 flex items-center justify-center shrink-0">
              {point.icon}
            </div>
            <div>
              <h3 className="text-xs sm:text-sm font-bold text-slate-900">{point.title}</h3>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">{point.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
