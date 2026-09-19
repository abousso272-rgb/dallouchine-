import React from 'react';
import { useApp } from '../../context/AppContext';
import {
  Package,
  Layers,
  Plane,
  Ship,
  ShieldCheck,
  Building2,
  MapPin,
  Clock,
  HelpCircle,
  ArrowRight,
  CheckCircle2,
  Smartphone
} from 'lucide-react';

export const HowItWorksPage: React.FC = () => {
  const { navigate } = useApp();

  const faqs = [
    {
      q: 'Pourquoi les prix sont-ils beaucoup plus bas que sur le marché local ?',
      a: 'Nous achetons directement auprès des usines fabricantes en Chine (à Shenzhen, Guangzhou et Yiwu) en éliminant les multiples intermédiaires, grossistes et revendeurs locaux qui appliquent chacun leur marge.'
    },
    {
      q: 'Comment sont calculés les délais de livraison ?',
      a: 'Pour le fret aérien régulier, comptez 12 à 18 jours après clôture du lot. Pour le fret maritime, comptez 30 à 45 jours. Ce délai comprend l\'achat usine, l\'inspection qualité, le transport international et le dédouanement à Dakar.'
    },
    {
      q: 'Puis-je choisir le mode de transport pour un groupage ?',
      a: 'Non, pour les achats groupés, le mode de transport (aérien ou maritime) est déterminé par notre équipe logistique afin d\'optimiser le coût unitaire et le délai pour l\'ensemble des participants. En revanche, pour les commandes sur-mesure B2B, vous pouvez choisir votre mode préférentiel.'
    },
    {
      q: 'Que se passe-t-il si un produit arrive défectueux ?',
      a: 'Chaque article est inspecté en Chine avant expédition. Si malgré cela vous constatez un défaut lors du retrait au Hub, nous procédons au remplacement immédiat ou au remboursement intégral.'
    },
    {
      q: 'Quels sont les moyens de paiement acceptés ?',
      a: 'Vous pouvez régler par Wave (sans frais additionnels), Orange Money, Free Money, Carte bancaire VISA/Mastercard ou en espèces directement au Hub.'
    }
  ];

  return (
    <div className="space-y-12 pb-16">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#0B192C] to-[#1E2E45] text-white rounded-3xl p-6 sm:p-12 shadow-xl text-center space-y-3">
        <span className="text-xs font-bold uppercase tracking-wider text-orange-200 bg-white/10 px-3 py-1 rounded-full">
          Transparence Totale
        </span>
        <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
          Comment fonctionne la plateforme SinoSenegal ?
        </h1>
        <p className="text-xs sm:text-sm text-slate-200 max-w-xl mx-auto leading-relaxed">
          Comprenez notre chaîne d'approvisionnement complète de la négociation en usine jusqu'à la remise de votre colis à Dakar.
        </p>
      </div>

      {/* Visual Supply Chain Steps */}
      <div className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200/80 shadow-xs space-y-8">
        <h2 className="text-lg font-bold text-[#0B192C] text-center">
          Le trajet de votre commande étape par étape
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="p-5 rounded-2xl bg-[#F8F6F2] border border-slate-200/60 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-[#0B192C] text-white flex items-center justify-center font-bold text-sm">
              1
            </div>
            <h3 className="text-sm font-bold text-slate-900">Sourcing & Négociation Usine</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Nos sourceurs basés à Guangzhou et Yiwu négocient les prix de gros directement avec les fabricants certifiés.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-[#F8F6F2] border border-slate-200/60 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-[#FF4500] text-white flex items-center justify-center font-bold text-sm">
              2
            </div>
            <h3 className="text-sm font-bold text-slate-900">Inspection & Contrôle Qualité</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              À la réception dans nos hubs chinois, nous testons les appareils et vérifions l'état des emballages.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-[#F8F6F2] border border-slate-200/60 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-sm">
              3
            </div>
            <h3 className="text-sm font-bold text-slate-900">Fret & Dédouanement Dakar</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Acheminement par vol cargo ou conteneur maritime. Notre transitaire prend en charge toutes les taxes douanières.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-[#F8F6F2] border border-slate-200/60 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-teal-600 text-white flex items-center justify-center font-bold text-sm">
              4
            </div>
            <h3 className="text-sm font-bold text-slate-900">Mise à Disposition au Hub</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Réceptionnez votre commande dans l'un de nos 5 hubs au Sénégal ou optez pour la livraison express à domicile.
            </p>
          </div>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200/80 shadow-xs space-y-6">
        <div className="flex items-center gap-2 text-[#0B192C]">
          <HelpCircle className="w-5 h-5 text-[#FF4500]" />
          <h2 className="text-lg font-bold">Foire Aux Questions Fréquentes</h2>
        </div>

        <div className="divide-y divide-slate-100">
          {faqs.map((faq, idx) => (
            <div key={idx} className="py-4 space-y-1.5">
              <h3 className="text-xs sm:text-sm font-bold text-slate-900">{faq.q}</h3>
              <p className="text-xs text-slate-600 leading-relaxed">{faq.a}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
