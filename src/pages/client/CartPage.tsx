import React from 'react';
import { useApp } from '../../context/AppContext';
import { PriceDisplay } from '../../components/common/PriceDisplay';
import {
  ShoppingBag,
  Trash2,
  Plus,
  Minus,
  ArrowRight,
  ShieldCheck,
  MapPin,
  Flame,
  CheckCircle2,
  ChevronRight
} from 'lucide-react';

export const CartPage: React.FC = () => {
  const { cart, removeFromCart, updateCartQuantity, clearCart, cartTotalXOF, cartCount, navigate } = useApp();

  if (cart.length === 0) {
    return (
      <div className="max-w-2xl mx-auto py-16 text-center space-y-6">
        <div className="w-20 h-20 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto text-3xl">
          <ShoppingBag className="w-10 h-10 text-slate-300" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-black text-[#0B192C]">Votre panier est vide</h2>
          <p className="text-xs sm:text-sm text-slate-500 max-w-sm mx-auto">
            Découvrez nos produits sélectionnés et nos achats groupés pour commencer vos commandes de Chine.
          </p>
        </div>
        <button
          onClick={() => navigate('/products')}
          className="bg-[#FF4500] hover:bg-[#E03D00] text-white font-bold text-sm px-8 py-3.5 rounded-2xl shadow-md inline-flex items-center gap-2 transition-all active:scale-95"
        >
          <span>Découvrir le catalogue</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-16 max-w-6xl mx-auto">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-xs font-semibold text-slate-500">
        <button onClick={() => navigate('/')} className="hover:text-[#0B192C]">
          Accueil
        </button>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-[#0B192C] font-bold">Mon Panier ({cartCount})</span>
      </nav>

      <div className="flex items-center justify-between">
        <h1 className="text-2xl sm:text-3xl font-black text-[#0B192C]">
          Panier d'achats ({cartCount} articles)
        </h1>
        <button
          onClick={clearCart}
          className="text-xs font-bold text-slate-400 hover:text-rose-600 transition-colors"
        >
          Vider le panier
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Side: Cart Items List (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          {cart.filter(item => item && item.product).map((item, idx) => (
            <div
              key={item.product?.id || idx}
              className="glass-panel bg-white/90 rounded-3xl p-4 sm:p-5 border border-white shadow-xs flex flex-col sm:flex-row gap-4 items-center sm:items-start transition-all"
            >
              <img
                src={item.product?.images?.[0] || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=200'}
                alt={item.product?.name || 'Produit'}
                className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl object-cover bg-slate-100 shrink-0"
              />

              <div className="flex-1 w-full space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    {item.isGroupage && (
                      <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-900 border border-amber-500/30 inline-flex items-center gap-1 mb-1">
                        <Flame className="w-3 h-3 text-amber-600 fill-amber-600" />
                        <span>Achat groupé négocié</span>
                      </span>
                    )}
                    <h3
                      onClick={() => navigate(`/products/${item.product?.slug || item.product?.id}`)}
                      className="text-sm sm:text-base font-bold text-[#0B192C] hover:text-[#FF4500] cursor-pointer line-clamp-2 leading-snug"
                    >
                      {item.product?.name}
                    </h3>
                  </div>

                  <button
                    onClick={() => removeFromCart(item.product?.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors shrink-0"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex items-baseline justify-between pt-1">
                  <PriceDisplay priceXOF={item.product?.priceXOF || 0} size="md" />

                  {/* Quantity Counter */}
                  <div className="flex items-center border border-slate-200 rounded-xl bg-white p-0.5">
                    <button
                      onClick={() => updateCartQuantity(item.product?.id, item.quantity - 1)}
                      className="w-7 h-7 rounded-lg bg-slate-100 font-bold text-slate-600 flex items-center justify-center"
                    >
                      -
                    </button>
                    <span className="w-8 text-center text-xs font-bold text-[#0B192C] font-mono-numeric">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateCartQuantity(item.product?.id, item.quantity + 1)}
                      className="w-7 h-7 rounded-lg bg-slate-100 font-bold text-slate-600 flex items-center justify-center"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Right Side: Order Summary & Checkout Trigger (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="glass-panel bg-white/95 rounded-3xl p-6 sm:p-7 border border-white shadow-md space-y-6">
            <h3 className="text-lg font-black text-[#0B192C] border-b border-slate-100 pb-3">
              Récapitulatif de la commande
            </h3>

            <div className="space-y-3 text-xs sm:text-sm">
              <div className="flex justify-between text-slate-600">
                <span>Sous-total articles ({cartCount})</span>
                <span className="font-mono-numeric font-bold text-[#0B192C]">
                  {(cartTotalXOF || 0).toLocaleString('fr-FR')} FCFA
                </span>
              </div>

              <div className="flex justify-between text-slate-600">
                <span className="flex items-center gap-1">
                  <span>Fret international & Douane Gaindé</span>
                </span>
                <span className="text-emerald-700 font-bold">100% Inclus</span>
              </div>

              <div className="flex justify-between text-slate-600">
                <span>Retrait en Hub Relais Dakar</span>
                <span className="text-emerald-700 font-bold">Gratuit</span>
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-baseline justify-between">
                <div>
                  <strong className="text-base sm:text-lg font-black text-[#0B192C] block">
                    Total TTC à régler
                  </strong>
                  <span className="text-[11px] text-slate-500">Sans frais cachés à l'arrivée</span>
                </div>

                <div className="text-right">
                  <span className="text-xl sm:text-2xl font-black text-[#0B192C] font-mono-numeric block">
                    {(cartTotalXOF || 0).toLocaleString('fr-FR')} FCFA
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={() => navigate('/checkout')}
              className="w-full bg-[#FF4500] hover:bg-[#E03D00] text-white font-black text-sm sm:text-base py-4 px-6 rounded-2xl shadow-xl flex items-center justify-center gap-2 transition-all active:scale-95"
            >
              <span>Passer la commande sécurisée</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            {/* Payment & Guarantees */}
            <div className="pt-4 border-t border-slate-100 space-y-2 text-xs text-slate-500">
              <div className="flex items-center gap-2 text-emerald-800 font-semibold">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Paiement 100% sécurisé via Wave, OM ou Carte</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#FF4500] shrink-0" />
                <span>Numéro de suivi AWP émis dès validation</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
