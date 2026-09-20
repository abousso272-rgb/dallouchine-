import React from 'react';
import { useApp } from '../../context/AppContext';
import { ShoppingCart, Users, Search, Building2 } from 'lucide-react';

export const FeaturePillsBar: React.FC = () => {
  const { navigate } = useApp();

  const features = [
    {
      id: 'marketplace',
      title: 'Marketplace',
      description: 'Trouvez les produits dont vous avez besoin.',
      icon: ShoppingCart,
      action: () => navigate('/products'),
      iconBg: 'bg-[#FFF2EE]',
      iconColor: 'text-[#FF4500]'
    },
    {
      id: 'groupages',
      title: 'Groupages',
      description: 'Regroupez vos commandes et optimisez vos coûts.',
      icon: Users,
      action: () => navigate('/groupages'),
      iconBg: 'bg-[#FFF2EE]',
      iconColor: 'text-[#FF4500]'
    },
    {
      id: 'sourcing',
      title: 'Sourcing personnalisé',
      description: 'Vous avez une idée ? Nous trouvons le fournisseur.',
      icon: Search,
      action: () => navigate('/request'),
      iconBg: 'bg-[#FFF2EE]',
      iconColor: 'text-[#FF4500]'
    },
    {
      id: 'b2b',
      title: 'B2B',
      description: "Des solutions d'approvisionnement adaptées aux entreprises.",
      icon: Building2,
      action: () => navigate('/b2b'),
      iconBg: 'bg-[#FFF2EE]',
      iconColor: 'text-[#FF4500]'
    }
  ];

  return (
    <section className="relative z-20">
      <div className="bg-white rounded-2xl sm:rounded-3xl p-3 sm:p-7 shadow-lg sm:shadow-xl shadow-slate-200/50 border border-slate-100">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-6 sm:divide-x sm:divide-slate-100">
          {features.map((feat, index) => {
            const Icon = feat.icon;
            return (
              <div
                key={feat.id}
                onClick={feat.action}
                className={`group flex flex-col sm:flex-row items-start gap-2 sm:gap-4 cursor-pointer bg-slate-50/60 sm:bg-transparent hover:bg-orange-50/50 p-2.5 sm:p-3 rounded-xl sm:rounded-2xl transition-all duration-200 border border-slate-100 sm:border-0 ${
                  index > 0 ? 'sm:pl-6' : ''
                }`}
              >
                <div
                  className={`w-9 h-9 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl ${feat.iconBg} ${feat.iconColor} flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-300 shadow-2xs`}
                >
                  <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <div className="space-y-0.5 sm:space-y-1 min-w-0">
                  <h3 className="text-xs sm:text-base font-bold text-[#0B192C] group-hover:text-[#FF4500] transition-colors flex items-center gap-1">
                    <span className="truncate">{feat.title}</span>
                  </h3>
                  <p className="text-[10px] sm:text-[13px] text-slate-500 font-normal leading-tight sm:leading-relaxed line-clamp-2">
                    {feat.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
