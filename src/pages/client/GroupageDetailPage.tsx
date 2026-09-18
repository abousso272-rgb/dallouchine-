import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { PriceDisplay } from '../../components/common/PriceDisplay';
import { ProgressBar } from '../../components/common/ProgressBar';
import { LogisticsPriceSplit } from '../../components/common/LogisticsPriceSplit';
import {
  Flame,
  Clock,
  Plane,
  Ship,
  Users2,
  ShieldCheck,
  ShoppingBag,
  ArrowRight,
  ChevronRight,
  CheckCircle2,
  Package,
  Sparkles,
  AlertTriangle,
  RotateCcw,
  FileCheck,
  Building,
  Truck
} from 'lucide-react';

interface GroupageDetailPageProps {
  id?: string;
}

export const GroupageDetailPage: React.FC<GroupageDetailPageProps> = ({ id }) => {
  const { groupages, products, navigate, addToCart, currentPath, openDocumentModal } = useApp();

  const currentId = id || currentPath.split('/').filter(Boolean).pop() || '';
  const safeCurrentId = (currentId || '').toLowerCase();
  const groupage =
    groupages.find(
      g => g.id === currentId || (g?.code && g.code.toLowerCase() === safeCurrentId)
    ) || groupages[0];
  const product =
    groupage?.product || products.find(p => p.id === groupage?.productId) || products[0];

  const [quantity, setQuantity] = useState(1);

  if (!groupage || !product) {
    return (
      <div className="text-center py-20">
        <p>Groupage non trouvé.</p>
        <button onClick={() => navigate('/groupages')} className="text-[#2A6DFF] font-bold mt-2">
          Retour aux groupages
        </button>
      </div>
    );
  }

  const isAir = groupage.transportMode === 'air';
  const unitProductPrice = groupage.productPriceXOF || Math.round(groupage.unitPriceXOF * 0.65);
  const unitLogisticsPrice = groupage.estimatedLogisticsXOF || Math.round(groupage.unitPriceXOF * 0.35);

  const totalProductPrice = unitProductPrice * quantity;
  const totalLogisticsPrice = unitLogisticsPrice * quantity;
  const totalOrderPrice = groupage.unitPriceXOF * quantity;

  const handleJoin = () => {
    addToCart(product, quantity, true, groupage.id);
    navigate('/cart');
  };

  // 7 Workflow steps
  const steps = [
    { title: 'Inscriptions Ouvertes', desc: 'Campagne de groupage ouverte aux commandes', active: groupage.status === 'open' || groupage.status === 'almost_full' },
    { title: 'Quota Atteint', desc: 'MOQ usine complété à 100%', active: groupage.status === 'full' },
    { title: 'Commande Usine', desc: 'Achat ferme lancé chez le fabricant', active: groupage.status === 'supplier_ordered' },
    { title: 'Contrôle Qualité', desc: 'Inspection physique au Hub Chine', active: groupage.status === 'supplier_ordered' },
    { title: 'Fret International', desc: isAir ? 'Vol cargo vers AIBD' : 'Conteneur en mer vers Dakar', active: groupage.status === 'in_transit' || groupage.status === 'shipped' },
    { title: 'Dédouanement Gaindé', desc: 'Formalités douanières DDP', active: groupage.status === 'arrived' },
    { title: 'Arrivée & Retrait Hub', desc: 'Disponible au Hub Sénégal', active: groupage.status === 'delivered' }
  ];

  return (
    <div className="space-y-8 pb-16">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-xs font-semibold text-slate-500 overflow-x-auto no-scrollbar py-1">
        <button onClick={() => navigate('/')} className="hover:text-[#0D2C7A]">
          Accueil
        </button>
        <ChevronRight className="w-3.5 h-3.5" />
        <button onClick={() => navigate('/groupages')} className="hover:text-[#0D2C7A]">
          Groupages
        </button>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-[#0D2C7A] font-bold">{groupage.code}</span>
      </nav>

      {/* Exception Banner if MOQ not reached */}
      {groupage.status === 'moq_unreached' && (
        <div className="p-4 rounded-2xl bg-amber-50 border-2 border-amber-300 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-6 h-6 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <strong className="text-sm text-amber-900 block font-black">
                Avis d'échéance : Quota Minimum (MOQ) non complété
              </strong>
              <p className="text-xs text-amber-800 leading-relaxed">
                Ce lot compte 4 unités sur les 10 requises. Conformément à notre engagement de transparence, vous avez le choix : prolonger votre participation de 10 jours, basculer en cotation individuelle B2B, ou recevoir un remboursement intégral immédiat par Wave / Orange Money sans frais.
              </p>
            </div>
          </div>

          <button
            onClick={() => navigate('/b2b')}
            className="shrink-0 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition-colors flex items-center gap-1.5"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Options ou Remboursement</span>
          </button>
        </div>
      )}

      {/* Hero Groupage Overview Card */}
      <div className="glass-panel bg-white/95 rounded-3xl p-6 sm:p-10 border border-white shadow-md space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Product Image */}
          <div className="lg:col-span-5 relative aspect-square rounded-2xl overflow-hidden bg-slate-100 p-3">
            <img
              src={product.images[0]}
              alt={groupage.title}
              className="w-full h-full object-cover rounded-xl"
            />
            <div className="absolute top-6 left-6 bg-amber-500 text-white font-black text-xs px-3 py-1 rounded-full flex items-center gap-1.5 shadow-md">
              <Flame className="w-3.5 h-3.5 fill-white" />
              <span>LOT {groupage.code}</span>
            </div>
          </div>

          {/* Details */}
          <div className="lg:col-span-7 space-y-5">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-3 text-xs">
                <span className="font-bold text-[#2A6DFF] flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  <span>Clôture : {groupage.closingDate}</span>
                </span>
                <span className="text-slate-400">•</span>
                <span className="font-bold text-slate-600">
                  Départ estimé : {groupage.estimatedDepartureDate || 'Sous 7 jours'}
                </span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-black text-[#0D2C7A] tracking-tight">
                {groupage.title}
              </h1>

              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                {product.shortDescription}
              </p>
            </div>

            {/* Price Separation Component */}
            <LogisticsPriceSplit
              productPriceXOF={totalProductPrice}
              logisticsPriceXOF={totalLogisticsPrice}
              totalPriceXOF={totalOrderPrice}
              productStatus="confirmed"
              logisticsStatus="estimated"
              transportMode={groupage.transportMode}
              weightKg={product.unitWeightKg ? product.unitWeightKg * quantity : undefined}
              cbm={product.cbm ? product.cbm * quantity : undefined}
            />

            {/* Live Progress Tracker */}
            <div className="space-y-2 pt-2">
              <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                <span>Progression du lot</span>
                <span className="font-mono-numeric text-[#0D2C7A]">
                  {groupage.currentUnits} / {groupage.targetUnits} unités ({Math.round((groupage.currentUnits / groupage.targetUnits) * 100)}%)
                </span>
              </div>
              <ProgressBar
                current={groupage.currentUnits}
                target={groupage.targetUnits}
                size="lg"
                variant="amber"
              />
              <div className="flex justify-between text-xs font-medium text-slate-500">
                <span>{groupage.participantsCount} participants déjà inscrits</span>
                <span>Arrivée Dakar prévue le {groupage.estimatedArrivalDate}</span>
              </div>
            </div>

            {/* Quantity Selector & Join CTA */}
            <div className="flex flex-col sm:flex-row items-center gap-4 pt-4 border-t border-slate-100">
              <div className="flex items-center border border-slate-200 rounded-xl bg-white p-1">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-9 h-9 rounded-lg bg-slate-100 font-bold text-slate-700 flex items-center justify-center hover:bg-slate-200"
                >
                  -
                </button>
                <span className="w-12 text-center font-bold text-[#0D2C7A] font-mono-numeric">
                  {quantity}
                </span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="w-9 h-9 rounded-lg bg-slate-100 font-bold text-slate-700 flex items-center justify-center hover:bg-slate-200"
                >
                  +
                </button>
              </div>

              <button
                onClick={handleJoin}
                className="w-full sm:flex-1 bg-[#0D2C7A] hover:bg-[#2A6DFF] text-white font-black text-sm py-4 px-6 rounded-2xl shadow-xl flex items-center justify-center gap-2 transition-all active:scale-95"
              >
                <span>Rejoindre ce groupage ({totalOrderPrice.toLocaleString('fr-FR')} FCFA)</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Workflow Timeline Steps */}
        <div className="pt-8 border-t border-slate-200 space-y-4">
          <h3 className="text-sm font-black uppercase tracking-wider text-[#0D2C7A]">
            Étapes Logistiques & Acheminement de ce Groupage
          </h3>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5">
            {steps.map((s, idx) => (
              <div
                key={idx}
                className={`p-3 rounded-xl border text-xs space-y-1 transition-all ${
                  s.active
                    ? 'bg-blue-50 border-[#2A6DFF] text-[#0D2C7A] shadow-xs'
                    : 'bg-slate-50 border-slate-200 text-slate-400'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono-numeric font-bold text-[10px]">
                    0{idx + 1}
                  </span>
                  {s.active && <CheckCircle2 className="w-3.5 h-3.5 text-[#2A6DFF]" />}
                </div>
                <strong className="block font-bold text-[11px] leading-tight">
                  {s.title}
                </strong>
                <p className="text-[10px] leading-snug line-clamp-2">
                  {s.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

