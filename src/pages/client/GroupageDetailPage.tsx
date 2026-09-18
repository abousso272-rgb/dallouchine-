import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { PriceDisplay } from '../../components/common/PriceDisplay';
import { ProgressBar } from '../../components/common/ProgressBar';
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
  Sparkles
} from 'lucide-react';

interface GroupageDetailPageProps {
  id?: string;
}

export const GroupageDetailPage: React.FC<GroupageDetailPageProps> = ({ id }) => {
  const { groupages, products, navigate, addToCart, currentPath } = useApp();

  const currentId = id || currentPath.split('/').filter(Boolean).pop() || '';
  const safeCurrentId = (currentId || '').toLowerCase();
  const groupage = groupages.find(g => g.id === currentId || (g?.code && g.code.toLowerCase() === safeCurrentId)) || groupages[0];
  const product = groupage?.product || products.find(p => p.id === groupage?.productId) || products[0];

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

  const handleJoin = () => {
    addToCart(product, quantity, true, groupage.id);
    navigate('/cart');
  };

  return (
    <div className="space-y-10 pb-16">
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

      {/* Hero Groupage Overview Card */}
      <div className="glass-panel bg-white/90 rounded-3xl p-6 sm:p-10 border border-white shadow-md space-y-8">
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
          <div className="lg:col-span-7 space-y-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-[#2A6DFF]">
                <Clock className="w-4 h-4" />
                <span>Clôture des inscriptions : {groupage.closingDate}</span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-black text-[#0D2C7A] tracking-tight">
                {groupage.title}
              </h1>

              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                {product.shortDescription}
              </p>
            </div>

            {/* Pricing */}
            <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-amber-900 block">Tarif groupage négocié TTC :</span>
                <PriceDisplay
                  priceXOF={groupage.unitPriceXOF}
                  previousPriceXOF={groupage.originalPriceXOF}
                  size="lg"
                />
              </div>
              <span className="text-sm font-black text-amber-800 bg-amber-200/80 px-3 py-1.5 rounded-xl">
                -{groupage.savingsPercent}% Économisés
              </span>
            </div>

            {/* Live Progress Tracker */}
            <div className="space-y-2">
              <ProgressBar
                current={groupage.currentUnits}
                target={groupage.targetUnits}
                size="lg"
                variant="amber"
              />
              <div className="flex justify-between text-xs font-medium text-slate-600">
                <span>{groupage.participantsCount} participants confirmés</span>
                <span>Départ fret : {groupage.estimatedArrivalDate}</span>
              </div>
            </div>

            {/* Transport details */}
            <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs">
              {isAir ? <Plane className="w-5 h-5 text-[#2A6DFF]" /> : <Ship className="w-5 h-5 text-cyan-600" />}
              <div>
                <strong className="text-[#0D2C7A] block">
                  {isAir ? 'Transport Aérien Optimisé SinoSenegal (12-18j)' : 'Ligne Maritime Directe (30-45j)'}
                </strong>
                <span className="text-slate-500">Contrôle qualité usine + Dédouanement Gaindé inclus</span>
              </div>
            </div>

            {/* Quantity Selector & Join CTA */}
            <div className="flex flex-col sm:flex-row items-center gap-4 pt-2 border-t border-slate-100">
              <div className="flex items-center border border-slate-200 rounded-xl bg-white p-1">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-9 h-9 rounded-lg bg-slate-100 font-bold text-slate-700 flex items-center justify-center"
                >
                  -
                </button>
                <span className="w-12 text-center font-bold text-[#0D2C7A] font-mono-numeric">
                  {quantity}
                </span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="w-9 h-9 rounded-lg bg-slate-100 font-bold text-slate-700 flex items-center justify-center"
                >
                  +
                </button>
              </div>

              <button
                onClick={handleJoin}
                className="w-full sm:flex-1 bg-[#0D2C7A] hover:bg-[#2A6DFF] text-white font-black text-sm py-4 px-6 rounded-2xl shadow-xl flex items-center justify-center gap-2 transition-all active:scale-95"
              >
                <span>Rejoindre ce groupage ({(((groupage?.unitPriceXOF || 0) * quantity) || 0).toLocaleString('fr-FR')} FCFA)</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
