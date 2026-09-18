import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { TrackingTimeline } from '../../components/common/TrackingTimeline';
import {
  Search,
  Package,
  Plane,
  Ship,
  MapPin,
  Clock,
  Phone,
  CheckCircle2,
  AlertCircle,
  ArrowRight
} from 'lucide-react';

export const TrackingPage: React.FC = () => {
  const { orders, getOrderByTrackingCode } = useApp();
  const [trackingInput, setTrackingInput] = useState<string>('AWP-10482');
  const [searchedOrder, setSearchedOrder] = useState(() => getOrderByTrackingCode('AWP-10482') || orders[0]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!trackingInput.trim()) return;
    const found = getOrderByTrackingCode(trackingInput.trim());
    setSearchedOrder(found);
  };

  const handleQuickSelect = (code: string) => {
    setTrackingInput(code);
    const found = getOrderByTrackingCode(code);
    setSearchedOrder(found);
  };

  return (
    <div className="space-y-12 pb-16 max-w-4xl mx-auto">
      {/* Top Search Hero */}
      <div className="glass-panel-dark rounded-3xl p-8 sm:p-10 text-white border border-white/10 text-center space-y-6 relative overflow-hidden">
        <div className="space-y-2 max-w-xl mx-auto">
          <span className="text-xs font-bold uppercase tracking-wider text-[#2A6DFF]">
            Traçabilité Logistique Internationale
          </span>
          <h1 className="text-2xl sm:text-4xl font-black tracking-tight">
            Suivi de Colis Chine ➔ Sénégal
          </h1>
          <p className="text-xs sm:text-sm text-slate-300">
            Saisissez votre numéro de bordereau AWP pour suivre en direct chaque étape de l'acheminement.
          </p>
        </div>

        {/* Search Bar */}
        <form onSubmit={handleSearch} className="max-w-md mx-auto">
          <div className="flex items-center glass-panel bg-white/95 rounded-2xl p-1.5 shadow-xl border border-white focus-within:ring-2 focus-within:ring-[#2A6DFF]">
            <Search className="w-5 h-5 text-[#2A6DFF] ml-3 shrink-0" />
            <input
              type="text"
              value={trackingInput}
              onChange={e => setTrackingInput(e.target.value)}
              placeholder="Ex: AWP-10482"
              className="w-full bg-transparent text-[#0D2C7A] text-sm font-mono-numeric font-bold px-3 py-2 outline-hidden placeholder:text-slate-400 placeholder:font-normal uppercase"
            />
            <button
              type="submit"
              className="bg-[#0D2C7A] hover:bg-[#2A6DFF] text-white text-xs font-bold px-5 py-2.5 rounded-xl transition-colors shrink-0 shadow-xs"
            >
              Suivre
            </button>
          </div>
        </form>

        {/* Demo Quick Codes */}
        <div className="flex flex-wrap items-center justify-center gap-2 pt-2 text-xs">
          <span className="text-slate-400">Exemples de suivi en cours :</span>
          {orders.slice(0, 3).map(o => (
            <button
              key={o.id}
              onClick={() => handleQuickSelect(o.trackingCode)}
              className="bg-white/10 hover:bg-white/20 text-white font-mono-numeric font-semibold px-2.5 py-1 rounded-lg border border-white/20 transition-colors"
            >
              {o.trackingCode}
            </button>
          ))}
        </div>
      </div>

      {/* Result Container */}
      {searchedOrder ? (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
          {/* Order Summary Header Card */}
          <div className="glass-panel bg-white/90 rounded-3xl p-6 sm:p-8 border border-white shadow-md space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                  Bordereau AWP
                </span>
                <h2 className="text-2xl font-black text-[#0D2C7A] font-mono-numeric">
                  {searchedOrder.trackingCode}
                </h2>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-xs font-black uppercase px-3 py-1 rounded-full bg-[#2A6DFF]/15 text-[#0D2C7A] border border-[#2A6DFF]/30">
                  {searchedOrder.currentStatus.replace(/_/g, ' ')}
                </span>
                <span className="text-xs text-slate-500 font-mono-numeric">
                  Estimé : {searchedOrder.estimatedDeliveryDate}
                </span>
              </div>
            </div>

            {/* Order Items & Destination */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80 space-y-1">
                <span className="text-slate-400 block font-medium">Destinataire</span>
                <strong className="text-[#0D2C7A] text-sm block">{searchedOrder.customer.fullName}</strong>
                <span className="text-slate-500">{searchedOrder.customer.city}, Sénégal</span>
              </div>

              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80 space-y-1">
                <span className="text-slate-400 block font-medium">Mode de retrait / Livraison</span>
                <strong className="text-[#0D2C7A] text-sm block">
                  {searchedOrder.deliveryType === 'home_delivery' ? 'Livraison à domicile' : 'Retrait Hub Relais'}
                </strong>
                <span className="text-slate-500">
                  {searchedOrder.deliveryType === 'home_delivery' ? 'Dakar' : 'Hub Almadies / Sandaga'}
                </span>
              </div>

              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80 space-y-1">
                <span className="text-slate-400 block font-medium">Articles dans ce colis</span>
                <strong className="text-[#0D2C7A] text-sm block font-mono-numeric">
                  {searchedOrder.items.length} article(s) • {(searchedOrder.totalXOF || 0).toLocaleString('fr-FR')} FCFA
                </strong>
                <span className="text-emerald-700 font-semibold">Paiement {(searchedOrder.paymentMethod || 'Wave').toUpperCase()} validé</span>
              </div>
            </div>

            {/* List of articles */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Contenu du colis</span>
              <div className="space-y-2">
                {searchedOrder.items.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-3 p-2 rounded-xl bg-slate-50 border border-slate-100">
                    <img src={item.productImage} alt={item.productName} className="w-10 h-10 rounded-lg object-cover" />
                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs font-bold text-[#0D2C7A] truncate">{item.productName}</h4>
                      <span className="text-[11px] text-slate-500">Qté: {item.quantity} • {(item.unitPriceXOF || 0).toLocaleString('fr-FR')} FCFA / unité</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Timeline Section */}
          <div className="glass-panel bg-white/80 rounded-3xl p-6 sm:p-8 border border-white shadow-sm space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-black text-[#0D2C7A] flex items-center gap-2">
                <Clock className="w-5 h-5 text-[#2A6DFF]" />
                <span>Chronologie de l'acheminement</span>
              </h3>

              <span className="text-xs text-emerald-700 font-bold flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Dédouanement Gaindé inclus
              </span>
            </div>

            <TrackingTimeline timeline={searchedOrder.trackingTimeline} />
          </div>
        </div>
      ) : (
        <div className="glass-panel bg-white/80 rounded-3xl p-12 text-center space-y-3 border border-slate-200">
          <AlertCircle className="w-12 h-12 text-slate-400 mx-auto" />
          <h3 className="text-lg font-bold text-[#0D2C7A]">Numéro de suivi introuvable</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Vérifiez l'orthographe de votre code AWP ou contactez notre assistance avec votre reçu de paiement.
          </p>
        </div>
      )}
    </div>
  );
};
