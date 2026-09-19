import React from 'react';
import { Plane, Ship, ShoppingCart, PackageCheck, ShieldCheck, Warehouse, ArrowRight, CheckCircle2 } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const ServicesOverview: React.FC = () => {
  const { navigate } = useApp();

  const services = [
    {
      id: 'air',
      icon: <Plane className="w-6 h-6 text-[#FF4500]" />,
      badge: 'Rapidité Maximale',
      title: 'Fret Aérien Express',
      duration: '5 à 7 jours ouvrés',
      description:
        'Départs hebdomadaires mardi et vendredi depuis l’aéroport de Guangzhou Baiyun (CAN) vers Dakar (AIBD). Idéal pour échantillons, prêt-à-porter, high-tech et réapprovisionnements urgents.',
      features: [
        'Départs réguliers 2 fois par semaine',
        'Pesée électronique certifiée au gramme près',
        'Dédouanement officiel Gaindé inclus',
        'Notification WhatsApp à l’atterrissage'
      ],
      ctaText: 'Calculer un envoi aérien',
      ctaAction: () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    },
    {
      id: 'sea',
      icon: <Ship className="w-6 h-6 text-[#0B192C]" />,
      badge: 'Le Plus Économique',
      title: 'Groupage Maritime (LCL)',
      duration: '35 à 45 jours de mer',
      description:
        'Le choix numéro 1 des commerçants et importateurs sénégalais. Tarification au CBM (mètre cube) sans surprise. Conteneurs sécurisés et scellés depuis les ports de Nansha et Ningbo.',
      features: [
        'Tarif fixe à 300 000 FCFA / CBM tout compris',
        'Groupage de colis sans minimum de volume restrictif',
        'Prise en charge intégrale des formalités portuaires',
        'Déchargement sécurisé dans notre entrepôt de Dakar'
      ],
      ctaText: 'Simuler un groupage maritime',
      ctaAction: () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    },
    {
      id: 'sourcing',
      icon: <ShoppingCart className="w-6 h-6 text-[#FF4500]" />,
      badge: 'Assistance Directe Usine',
      title: 'Sourcing & Achat 1688 / Taobao',
      duration: 'Paiement en RMB sous 2h',
      description:
        'Vous ne parlez pas chinois ou n’avez pas de compte Alipay ? Envoyez-nous simplement les liens de vos articles sur 1688, Taobao ou Pinduoduo. Notre équipe en Chine négocie et achète pour vous.',
      features: [
        'Conversion transparente Yuan (RMB) ➔ FCFA',
        'Négociation des quantités minimales (MOQ)',
        'Contrôle de conformité & photos avant emballage',
        'Protection contre les arnaques de faux fournisseurs'
      ],
      ctaText: 'Demander un sourcing',
      ctaAction: () => navigate('/request')
    },
    {
      id: 'warehousing',
      icon: <Warehouse className="w-6 h-6 text-[#0B192C]" />,
      badge: 'Stockage Offert',
      title: 'Consolidation Gratuite (30 jours)',
      duration: 'Jusqu’à 30 jours sans frais',
      description:
        'Commandez auprès de plusieurs fournisseurs différents en Chine : nous recevons tous vos paquets dans nos entrepôts de Guangzhou ou Yiwu, puis nous les regroupons dans un carton unique renforcé.',
      features: [
        'Économisez jusqu’à 35% sur le volume transporté',
        'Reconditionnement sous film étanche et cerclage',
        'Stockage gratuit pendant 30 jours en Chine',
        'Inventaire photo partagé sur votre espace'
      ],
      ctaText: 'Obtenir l’adresse entrepôt',
      ctaAction: () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
  ];

  return (
    <section id="services" className="space-y-8">
      <div className="text-center max-w-3xl mx-auto space-y-3">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FF4500]/10 text-[#FF4500] text-xs font-black tracking-wide uppercase">
          Solutions Logistiques Clé en Main
        </span>
        <h2 className="text-2xl sm:text-4xl font-black text-[#0B192C] tracking-tight">
          Tous nos services pour réussir vos importations
        </h2>
        <p className="text-xs sm:text-base text-slate-600">
          De l’achat auprès des fabricants à la livraison finale à Dakar, Dallou Chine prend en charge chaque étape avec rigueur et transparence.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
        {services.map(svc => (
          <div
            key={svc.id}
            className="rounded-3xl bg-white border border-slate-200/90 p-6 sm:p-8 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between space-y-6 group"
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center group-hover:scale-105 transition-transform">
                  {svc.icon}
                </div>
                <div className="text-right">
                  <span className="inline-block text-[11px] font-black px-2.5 py-1 rounded-full bg-slate-100 text-[#0B192C]">
                    {svc.badge}
                  </span>
                  <span className="block text-[11px] text-[#FF4500] font-bold mt-0.5">
                    ⏱ {svc.duration}
                  </span>
                </div>
              </div>

              <div>
                <h3 className="text-lg sm:text-xl font-black text-[#0B192C] group-hover:text-[#FF4500] transition-colors">
                  {svc.title}
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 mt-2 leading-relaxed">
                  {svc.description}
                </p>
              </div>

              <div className="pt-2 border-t border-slate-100 space-y-2">
                {svc.features.map((feat, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-xs text-slate-700">
                    <CheckCircle2 className="w-4 h-4 text-[#FF4500] shrink-0" />
                    <span>{feat}</span>
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={svc.ctaAction}
              className="w-full py-3 px-4 rounded-xl bg-slate-50 hover:bg-[#0B192C] text-slate-800 hover:text-white font-bold text-xs transition-all flex items-center justify-center gap-2 border border-slate-200 group-hover:border-[#0B192C]"
            >
              <span>{svc.ctaText}</span>
              <ArrowRight className="w-3.5 h-3.5 text-[#FF4500] group-hover:text-white transition-colors" />
            </button>
          </div>
        ))}
      </div>
    </section>
  );
};
