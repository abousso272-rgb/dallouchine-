import React from 'react';
import { useApp } from '../../context/AppContext';
import { ShoppingCart, Users, Factory, PlaneTakeoff, PackageCheck, ArrowRight } from 'lucide-react';

export const HowItWorksSteps: React.FC = () => {
  const { navigate } = useApp();

  const steps = [
    {
      num: '01',
      title: 'Vous Choisissez',
      desc: 'Parcourez nos produits sélectionnés ou participez à un groupage actif avec un prix négocié.',
      icon: <ShoppingCart className="w-5 h-5 text-[#FF4500]" />
    },
    {
      num: '02',
      title: 'Vous Commandez',
      desc: 'Paiement local simple et sécurisé via Wave, Orange Money ou Carte Bancaire.',
      icon: <Users className="w-5 h-5 text-emerald-600" />
    },
    {
      num: '03',
      title: 'Nous Regroupons',
      desc: 'Notre équipe en Chine consolide les commandes et achète directement auprès de fabricants certifiés.',
      icon: <Factory className="w-5 h-5 text-amber-600" />
    },
    {
      num: '04',
      title: 'Nous Acheminons',
      desc: 'Transport optimisé (Aérien ou Maritime) avec dédouanement complet pris en charge par nos soins.',
      icon: <PlaneTakeoff className="w-5 h-5 text-indigo-600" />
    },
    {
      num: '05',
      title: 'Vous Recevez',
      desc: 'Retrait gratuit dans nos Hubs à Dakar/Thiès ou livraison rapide directement à votre porte.',
      icon: <PackageCheck className="w-5 h-5 text-teal-600" />
    }
  ];

  return (
    <div className="py-12">
      <div className="text-center max-w-2xl mx-auto mb-12">
        <span className="text-xs font-bold uppercase tracking-wider text-[#FF4500] bg-[#FF4500]/10 px-3 py-1 rounded-full">
          Simplicité & Transparence
        </span>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-[#0B192C] mt-3 tracking-tight">
          Comment fonctionne Dallou Chine ?
        </h2>
        <p className="text-xs sm:text-sm text-slate-600 mt-2 leading-relaxed">
          Nous éliminons les intermédiaires coûteux et gérons toute la complexité logistique de la Chine jusqu'à vos mains.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 relative">
        {steps.map((step, idx) => (
          <div
            key={idx}
            className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs hover:shadow-lg transition-all duration-300 flex flex-col justify-between relative group hover:-translate-y-1"
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center shadow-2xs group-hover:scale-110 transition-transform">
                  {step.icon}
                </div>
                <span className="text-xl font-black text-slate-200 group-hover:text-[#FF4500]/30 transition-colors">
                  {step.num}
                </span>
              </div>
              <h3 className="text-sm font-bold text-slate-900">{step.title}</h3>
              <p className="text-xs text-slate-500 mt-2 leading-relaxed">{step.desc}</p>
            </div>

            {idx < steps.length - 1 && (
              <div className="hidden md:block absolute -right-2.5 top-1/2 -translate-y-1/2 z-10 text-slate-300 pointer-events-none">
                <ArrowRight className="w-4 h-4" />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
