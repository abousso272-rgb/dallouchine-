import React from 'react';
import { UserCheck, ShoppingBag, PackageSearch, Truck, ArrowRight } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const ProcessSteps: React.FC = () => {
  const { navigate } = useApp();

  const steps = [
    {
      step: '01',
      icon: <UserCheck className="w-6 h-6 text-[#FF4500]" />,
      title: 'Obtenez votre adresse & code client',
      description:
        'Copiez l’adresse de nos entrepôts de Guangzhou ou Yiwu avec votre marquage personnalisé pour commander directement sur 1688, Taobao ou Alibaba.'
    },
    {
      step: '02',
      icon: <ShoppingBag className="w-6 h-6 text-[#0B192C]" />,
      title: 'Vos fournisseurs livrent à l’entrepôt',
      description:
        'Vos colis arrivent à notre hub en Chine sous 1 à 3 jours de transport domestique chinois via SF Express, ZTO, YTO ou J&T.'
    },
    {
      step: '03',
      icon: <PackageSearch className="w-6 h-6 text-[#FF4500]" />,
      title: 'Pesée, contrôle & consolidation',
      description:
        'Notre équipe vérifie l’état extérieur, pèse votre marchandise sur balance certifiée, filme les cartons et consolide vos multiples commandes.'
    },
    {
      step: '04',
      icon: <Truck className="w-6 h-6 text-[#0B192C]" />,
      title: 'Expédition & Réception à Dakar',
      description:
        'Dédouanement Gaindé intégral assuré par nos soins. Vous êtes notifié dès l’arrivée pour un retrait en agence ou une livraison à domicile.'
    }
  ];

  return (
    <section className="rounded-3xl bg-slate-900 text-white p-6 sm:p-12 relative overflow-hidden space-y-10">
      {/* Background glow effects */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-[#FF4500]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#1E3E62]/30 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 text-center max-w-3xl mx-auto space-y-3">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-orange-300 text-xs font-black tracking-wide uppercase">
          Parcours Simple & Sécurisé
        </span>
        <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
          Comment expédier avec Dallou Chine ?
        </h2>
        <p className="text-xs sm:text-base text-slate-300">
          Un processus rodé pour vous faire gagner du temps et éliminer tout risque de perte ou de blocage douanier.
        </p>
      </div>

      <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {steps.map((item, idx) => (
          <div
            key={idx}
            className="rounded-2xl bg-white/5 border border-white/10 p-5 sm:p-6 space-y-4 hover:bg-white/10 transition-colors relative group"
          >
            <div className="flex items-center justify-between">
              <span className="text-2xl font-black text-slate-500 group-hover:text-[#FF4500] transition-colors font-mono">
                {item.step}
              </span>
              <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                {item.icon}
              </div>
            </div>

            <div>
              <h3 className="text-base font-black text-white">{item.title}</h3>
              <p className="text-xs text-slate-300 mt-2 leading-relaxed">{item.description}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="relative z-10 text-center pt-2">
        <button
          onClick={() => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className="inline-flex items-center gap-2 bg-[#FF4500] hover:bg-[#E03D00] text-white font-black text-xs sm:text-sm px-8 py-3.5 rounded-2xl shadow-xl transition-all active:scale-95"
        >
          <span>Commencer maintenant : Voir les adresses Chine</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </section>
  );
};
