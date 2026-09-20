import React, { useEffect, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { orderService } from '../../services/orderService';
import type { Order } from '../../types';
import {
  CheckCircle2,
  Package,
  Truck,
  MapPin,
  Clock,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  ExternalLink,
  ChevronRight,
  CreditCard
} from 'lucide-react';
import { PriceDisplay } from '../../components/common/PriceDisplay';
import { PaymentApiClient } from '../../services/paymentApiClient';

interface OrderSuccessPageProps {
  orderId?: string;
}

export const OrderSuccessPage: React.FC<OrderSuccessPageProps> = ({ orderId: propOrderId }) => {
  const { currentPath, navigate, currentUser } = useApp();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPaying, setIsPaying] = useState(false);

  const handlePayNow = async () => {
    if (!order?.id) return;
    setIsPaying(true);
    try {
      const origin = window.location.origin;
      const res = await PaymentApiClient.createPayment({
        orderId: order.id,
        returnUrl: `${origin}/payment/success?orderId=${order.id}`,
        cancelUrl: `${origin}/payment/cancelled?orderId=${order.id}`
      });
      if (res.success && res.checkoutUrl) {
        window.location.href = res.checkoutUrl;
      } else {
        alert(res.errorMessage || 'Impossible de lancer le paiement.');
      }
    } catch (err: any) {
      alert(err.message || 'Erreur réseau lors de la connexion à la passerelle.');
    } finally {
      setIsPaying(false);
    }
  };

  // Extract orderId from URL if not provided directly
  const orderId = propOrderId || (() => {
    if (currentPath.startsWith('/order-success/')) {
      return currentPath.replace('/order-success/', '').split('?')[0];
    }
    const params = new URLSearchParams(window.location.search);
    return params.get('orderId') || '';
  })();

  useEffect(() => {
    let isMounted = true;

    async function loadOrder() {
      if (!orderId) {
        setError('Référence de commande manquante.');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const fetched = await orderService.getOrderById(orderId);
        if (!isMounted) return;

        if (fetched) {
          setOrder(fetched);
        } else {
          setError('Commande introuvable ou accès non autorisé.');
        }
      } catch (err: any) {
        if (!isMounted) return;
        setError(err.message || 'Erreur lors du chargement de la commande.');
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadOrder();

    return () => {
      isMounted = false;
    };
  }, [orderId]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-20 px-4 text-center space-y-4">
        <div className="w-12 h-12 border-4 border-[#FF4500] border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-sm font-bold text-slate-600">Vérification de la commande sur les serveurs Dallou Chine...</p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="max-w-xl mx-auto py-16 px-4 text-center space-y-6">
        <div className="w-16 h-16 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center mx-auto">
          <AlertCircle className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-black text-[#0B192C]">Commande non trouvée</h2>
          <p className="text-sm text-slate-500">{error || 'Cette commande n\'existe pas ou ne vous appartient pas.'}</p>
        </div>
        <div className="flex justify-center gap-4 pt-2">
          <button
            onClick={() => navigate('/products')}
            className="px-6 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm transition-all"
          >
            Retour au catalogue
          </button>
          <button
            onClick={() => navigate('/account')}
            className="px-6 py-3 rounded-xl bg-[#0B192C] hover:bg-slate-800 text-white font-bold text-sm transition-all"
          >
            Mon Espace Compte
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 sm:py-12 space-y-8 pb-24">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-xs font-semibold text-slate-500">
        <button onClick={() => navigate('/')} className="hover:text-[#0B192C]">
          Accueil
        </button>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-[#0B192C] font-bold">Confirmation de commande</span>
      </nav>

      {/* Hero Success Badge */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-lg p-6 sm:p-10 text-center space-y-4 relative overflow-hidden">
        <div className="w-20 h-20 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
          <CheckCircle2 className="w-12 h-12" />
        </div>

        <div className="space-y-1">
          <span className="text-xs font-black uppercase tracking-wider px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 inline-block mb-1">
            Commande confirmée en base
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-[#0B192C]">
            Merci pour votre commande !
          </h1>
          <p className="text-sm text-slate-500 max-w-md mx-auto">
            Votre dossier a été enregistré sur la plateforme sécurisée Dallou Chine.
          </p>
        </div>

        {/* Tracking Code Banner */}
        <div className="mt-4 p-4 rounded-2xl bg-slate-50 border border-slate-200 inline-flex flex-col sm:flex-row items-center gap-3 sm:gap-6">
          <div className="text-left">
            <span className="text-[11px] font-bold text-slate-400 block uppercase">N° de Suivi Unique (AWP)</span>
            <strong className="text-xl font-mono text-[#FF4500] font-black tracking-wider">
              {order.trackingCode}
            </strong>
          </div>
          <div className="h-8 w-px bg-slate-200 hidden sm:block" />
          <div className="text-left">
            <span className="text-[11px] font-bold text-slate-400 block uppercase">Statut Actuel</span>
            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
              <Clock className="w-3 h-3" />
              <span>En attente de paiement</span>
            </span>
          </div>
        </div>
      </div>

      {/* Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Left: Ordered Items (7 cols) */}
        <div className="md:col-span-7 bg-white rounded-3xl border border-slate-200 p-6 space-y-4 shadow-xs">
          <h3 className="text-base font-black text-[#0B192C] flex items-center gap-2 pb-3 border-b border-slate-100">
            <Package className="w-5 h-5 text-[#FF4500]" />
            <span>Articles commandés ({order.items.length})</span>
          </h3>

          <div className="divide-y divide-slate-100">
            {order.items.map((item, idx) => (
              <div key={idx} className="py-3.5 flex items-center gap-3.5">
                <img
                  src={item.productImage}
                  alt={item.productName}
                  className="w-14 h-14 rounded-xl object-cover bg-slate-100 shrink-0 border border-slate-100"
                />
                <div className="flex-1 min-w-0">
                  <h4 className="text-xs sm:text-sm font-bold text-[#0B192C] truncate">
                    {item.productName}
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Quantité : <strong className="text-slate-800">{item.quantity}</strong> × {item.unitPriceXOF.toLocaleString('fr-FR')} FCFA
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-xs sm:text-sm font-black text-[#0B192C] font-mono-numeric block">
                    {item.totalPriceXOF.toLocaleString('fr-FR')} FCFA
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-4 border-t border-slate-100 space-y-2 text-xs">
            <div className="flex justify-between text-slate-500">
              <span>Sous-total articles</span>
              <span className="font-mono-numeric font-bold text-slate-800">
                {order.subtotalXOF.toLocaleString('fr-FR')} FCFA
              </span>
            </div>
            <div className="flex justify-between text-slate-500 items-center">
              <span className="flex items-center gap-1.5">
                <span>Fret international &amp; Logistique</span>
                <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-900 border border-amber-200">
                  {order.logisticsCostStatus === 'confirmed' ? 'CONFIRMÉ' : 'ESTIMATIF'}
                </span>
              </span>
              <span className="font-mono-numeric font-bold text-slate-800">
                {order.shippingFeeXOF > 0 ? `${order.shippingFeeXOF.toLocaleString('fr-FR')} FCFA` : 'Inclus (0 FCFA)'}
              </span>
            </div>
            <div className="pt-2 border-t border-slate-200 flex justify-between items-baseline">
              <strong className="text-sm font-black text-[#0B192C]">Total TTC</strong>
              <strong className="text-lg font-black text-[#FF4500] font-mono-numeric">
                {order.totalXOF.toLocaleString('fr-FR')} FCFA
              </strong>
            </div>
          </div>
        </div>

        {/* Right: Delivery & Actions (5 cols) */}
        <div className="md:col-span-5 space-y-6">
          {/* Customer & Delivery card */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-4 shadow-xs text-xs">
            <h3 className="text-sm font-black text-[#0B192C] flex items-center gap-2 pb-2 border-b border-slate-100">
              <Truck className="w-4 h-4 text-[#FF4500]" />
              <span>Détails de livraison</span>
            </h3>

            <div className="space-y-2.5 text-slate-600">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Client</span>
                <p className="font-bold text-slate-800">{order.customer.fullName}</p>
                <p className="text-[11px] text-slate-500">{order.customer.phone}</p>
              </div>

              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Mode</span>
                <p className="font-bold text-slate-800">
                  {order.deliveryType === 'home_delivery' ? 'Livraison à domicile Dakar' : 'Retrait Hub Relais Dakar'}
                </p>
                <p className="text-[11px] text-slate-500">{order.customer.city}</p>
              </div>

              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Mode de règlement prévu</span>
                <p className="font-bold text-slate-800 uppercase">{order.paymentMethod}</p>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="space-y-3">
            {order.paymentStatus === 'paid' ? (
              <div className="w-full bg-emerald-50 border border-emerald-200 text-emerald-800 font-bold text-xs py-3 px-4 rounded-2xl flex items-center justify-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Paiement intégralement confirmé &amp; validé</span>
              </div>
            ) : (
              <button
                onClick={handlePayNow}
                disabled={isPaying}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm py-4 px-6 rounded-2xl shadow-lg flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer disabled:opacity-50"
              >
                <CreditCard className="w-5 h-5" />
                <span>
                  {isPaying
                    ? 'Connexion sécurisée GeniusPay...'
                    : `Régler ma commande (${order.totalXOF.toLocaleString('fr-FR')} FCFA)`}
                </span>
              </button>
            )}

            <button
              onClick={() => navigate(`/tracking?code=${order.trackingCode}`)}
              className="w-full bg-[#FF4500] hover:bg-[#E03D00] text-white font-bold text-sm py-3.5 px-6 rounded-2xl shadow-md flex items-center justify-center gap-2 transition-all active:scale-95"
            >
              <span>Suivre ma commande en direct</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={() => navigate('/account')}
              className="w-full bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-sm py-3 px-6 rounded-2xl transition-all"
            >
              Voir toutes mes commandes
            </button>
          </div>

          {/* Guarantee pill */}
          <div className="flex items-center gap-2 text-[11px] text-slate-500 justify-center">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Sécurisé par le protocole logistique Sino-Sénégalais</span>
          </div>
        </div>
      </div>
    </div>
  );
};
