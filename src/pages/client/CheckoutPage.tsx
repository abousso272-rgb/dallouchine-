import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import {
  ShieldCheck,
  MapPin,
  Building,
  Truck,
  CreditCard,
  CheckCircle2,
  ArrowRight,
  Lock,
  Phone,
  User,
  Sparkles,
  Ship,
  HelpCircle,
  FileCheck2,
  Info,
  Check,
  ChevronRight,
  Headphones,
  Plane,
  Clock
} from 'lucide-react';
import { WaveLogo, OrangeMoneyLogo } from '../../components/common/PaymentOperatorLogos';
import { logisticsService, PublicLogisticsResult } from '../../services/logisticsService';
import { PaymentApiClient } from '../../services/paymentApiClient';
import type { TransportMode } from '../../types';

export const CheckoutPage: React.FC = () => {
  const { cart, cartTotalXOF, createOrder, navigate, currentUser, addToast } = useApp();

  // Form State
  const [fullName, setFullName] = useState(currentUser.name || 'Amadou Cheikh Diop');
  const [phone, setPhone] = useState(currentUser.phone || '77 450 12 34');
  const [company, setCompany] = useState('Diop Logistique & E-commerce SARL');
  const [address, setAddress] = useState('Dakar, Almadies / Ngor');
  const [deliveryMode, setDeliveryMode] = useState<'hub_almadies' | 'last_mile'>('hub_almadies');
  const [transportMode, setTransportMode] = useState<TransportMode>('air');
  const [paymentMethod, setPaymentMethod] = useState<'wave' | 'orange_money' | 'virement' | 'desk'>('wave');
  const [isProcessing, setIsProcessing] = useState(false);
  const [logisticsEst, setLogisticsEst] = useState<PublicLogisticsResult | null>(null);

  // Financial calculations
  const isCustomCart = cart.length > 0;
  const factoryPrice = isCustomCart ? cartTotalXOF : 1016000;

  // Calcul logistique réel via Supabase
  useEffect(() => {
    let active = true;
    async function fetchEstimate() {
      try {
        const est = await logisticsService.estimateCartLogistics(
          transportMode,
          deliveryMode === 'hub_almadies' ? 'hub_pickup' : 'home_delivery'
        );
        if (active) setLogisticsEst(est);
      } catch (err) {
        console.warn('[CheckoutPage] Estimation logistique temporaire:', err);
      }
    }
    fetchEstimate();
    return () => { active = false; };
  }, [transportMode, deliveryMode, cart]);

  const realShippingFee = logisticsEst?.customer_shipping_fee || (deliveryMode === 'last_mile' ? 2000 : 0);
  const totalEstimated = factoryPrice + realShippingFee;
  const deposit30 = Math.round(factoryPrice * 0.3);
  const balance70 = factoryPrice - deposit30;

  const handleConfirmOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isProcessing) return;

    if (!currentUser.isLoggedIn) {
      addToast('Veuillez vous connecter pour valider votre commande.', 'warning', 'Connexion requise');
      navigate('/login?redirect=/checkout');
      return;
    }

    if (cart.length === 0) {
      addToast('Votre panier est vide. Veuillez ajouter des articles depuis le catalogue.', 'warning', 'Panier vide');
      navigate('/products');
      return;
    }

    setIsProcessing(true);
    const idempotencyKey = `ord_${currentUser.id}_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

    try {
      const order = await createOrder({
        fullName,
        phone: phone.startsWith('+221') ? phone : `+221 ${phone}`,
        email: currentUser.email || 'client@dallouchine.sn',
        city: address,
        deliveryType: deliveryMode === 'hub_almadies' ? 'hub_pickup' : 'home_delivery',
        paymentMethod: paymentMethod === 'desk' ? 'hub_cash' : paymentMethod,
        idempotencyKey
      });

      if (order && (order.id || order.orderId)) {
        const orderId = order.id || order.orderId;
        // Calcul et enregistrement logistique réel côté serveur
        try {
          await logisticsService.calculateOrderLogistics(orderId, transportMode, 'estimated');
        } catch (logErr) {
          console.warn('[CheckoutPage] Notice logistique calculée:', logErr);
        }

        // Si règlement en ligne sélectionné, redirection vers la session de paiement GeniusPay
        if (paymentMethod !== 'desk' && paymentMethod !== 'virement') {
          try {
            const payRes = await PaymentApiClient.createPayment({ orderId });
            if (payRes.success && payRes.checkoutUrl) {
              window.location.href = payRes.checkoutUrl;
              return;
            }
          } catch (payErr) {
            console.warn('[CheckoutPage] Redirection automatique vers GeniusPay non disponible:', payErr);
          }
        }

        addToast(`Dossier ${order.trackingCode || ''} enregistré avec succès sur les serveurs Dallou Chine.`, 'success', 'Commande créée !');
        navigate(`/order-success/${orderId}`);
      } else {
        addToast('Impossible d\'enregistrer la commande. Veuillez vérifier la disponibilité de vos articles.', 'error', 'Erreur de commande');
      }
    } catch (err: any) {
      addToast(err.message || 'Erreur inattendue lors de la commande.', 'error', 'Erreur');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 py-6 sm:py-8 flex flex-col gap-8 pb-24">
      {/* Breadcrumb & Top Indicator */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <nav className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
          <button onClick={() => navigate('/')} className="hover:text-[#FF4500] transition-colors cursor-pointer">
            Accueil
          </button>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          <button onClick={() => navigate('/cart')} className="hover:text-[#FF4500] transition-colors cursor-pointer">
            Panier
          </button>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-[#0B192C] font-bold">Finalisation de commande</span>
        </nav>

        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-slate-200/80 shadow-2xs">
          <span className="w-2 h-2 rounded-full bg-[#FF4500] animate-pulse" />
          <span className="text-[11px] font-bold text-slate-600">
            Liaison Chiffrée TLS 1.3 • Hubs Ningbo &amp; Dakar
          </span>
        </div>
      </div>

      {/* Main Checkout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* LEFT COLUMN: 8 cols (65%) */}
        <div className="lg:col-span-8 flex flex-col gap-8">
          {/* Section 1: Order Items & Cargo Status */}
          <section className="bg-white rounded-3xl border border-slate-200/90 shadow-md p-6 sm:p-8">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <span className="w-7 h-7 rounded-full bg-[#FF4500] text-white text-xs font-black flex items-center justify-center">
                  1
                </span>
                <h2 className="text-base sm:text-lg font-black text-[#0B192C]">
                  Récapitulatif des réservations &amp; sourcing usine
                </h2>
              </div>
              <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-slate-100 text-[#0B192C]">
                {isCustomCart ? `${cart.length} articles` : '2 articles B2B'}
              </span>
            </div>

            {/* Custom cart items if present */}
            {isCustomCart ? (
              <div className="space-y-4 mb-4">
                {cart.map(item => (
                  <div key={item.product.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                    <div className="flex items-center gap-3.5">
                      <img
                        src={item.product.images[0]}
                        alt={item.product.name}
                        className="w-16 h-16 rounded-xl object-cover bg-white border border-slate-200"
                      />
                      <div>
                        <h4 className="text-xs sm:text-sm font-bold text-[#0B192C]">{item.product.name}</h4>
                        <p className="text-[11px] text-slate-500 mt-0.5">Quantité : {item.quantity} unités</p>
                      </div>
                    </div>
                    <div className="text-right self-end sm:self-auto">
                      <span className="text-sm font-black text-[#FF4500] block">
                        {(item.product.priceXOF * item.quantity).toLocaleString('fr-FR')} FCFA
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {item.product.priceXOF.toLocaleString('fr-FR')} FCFA / unité
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : null}

            {/* Product Item 1: Moto électrique (default or featured B2B) */}
            {!isCustomCart && (
              <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-100 mb-4">
                <div className="flex flex-col sm:flex-row gap-4 items-start">
                  <div className="w-full sm:w-36 h-28 rounded-xl overflow-hidden bg-slate-200 shrink-0 relative shadow-2xs">
                    <img
                      className="w-full h-full object-cover"
                      alt="Moto électrique"
                      src="https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&w=500&q=80"
                    />
                    <span className="absolute top-1.5 left-1.5 px-2 py-0.5 rounded-full bg-[#0B192C] text-white text-[10px] font-bold">
                      MOQ: 2
                    </span>
                  </div>

                  <div className="flex-1 flex flex-col justify-between w-full">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-1">
                      <div>
                        <h3 className="text-sm font-black text-[#0B192C]">
                          Moto électrique 2000W — Batterie LiFePO4 72V 35Ah
                        </h3>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          Catégorie: Auto &amp; Mobilité • Groupage maritime conteneurisé
                        </p>
                      </div>

                      <div className="text-left sm:text-right mt-1 sm:mt-0">
                        <span className="text-sm sm:text-base font-black text-[#FF4500] block">
                          960 000 FCFA
                        </span>
                        <span className="text-[11px] text-slate-400">480 000 FCFA × 2 unités</span>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 mt-2.5">
                      <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-white border border-slate-200 text-[#0B192C]">
                        Finition: Blanc Nacré
                      </span>
                      <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-white border border-slate-200 text-[#0B192C]">
                        Option marquage revendeur Dakar inclus
                      </span>
                    </div>

                    {/* Groupage Progress Gauge */}
                    <div className="mt-3 p-3 rounded-xl bg-white border border-slate-200/80 shadow-2xs">
                      <div className="flex items-center justify-between text-xs mb-1.5">
                        <div className="flex items-center gap-1.5">
                          <Ship className="w-3.5 h-3.5 text-[#FF4500]" />
                          <span className="font-bold text-[#0B192C] text-[11px]">
                            Conteneur Groupé Ningbo → Dakar (LCL-DKR-884)
                          </span>
                        </div>
                        <span className="text-[11px] text-[#FF4500] font-bold">
                          84% rempli (Départ sécurisé sous 72h)
                        </span>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-slate-100 overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-[#0B192C] via-[#FF4500] to-amber-400 rounded-full"
                          style={{ width: '84%' }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Product Item 2: Casque */}
            {!isCustomCart && (
              <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-100">
                <div className="flex flex-col sm:flex-row gap-4 items-start">
                  <div className="w-full sm:w-28 h-24 rounded-xl overflow-hidden bg-slate-200 shrink-0 relative shadow-2xs">
                    <img
                      className="w-full h-full object-cover"
                      alt="Casque connecté"
                      src="https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=400&q=80"
                    />
                  </div>

                  <div className="flex-1 flex flex-col justify-between w-full">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-1">
                      <div>
                        <h3 className="text-sm font-black text-[#0B192C]">
                          Casque connecté Bluetooth intelligent pour livreur
                        </h3>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          Accessoire flotte • Norme DOT &amp; CE • Équipé micro antibruit
                        </p>
                      </div>

                      <div className="text-left sm:text-right mt-1 sm:mt-0">
                        <span className="text-sm sm:text-base font-black text-[#0B192C] block">
                          56 000 FCFA
                        </span>
                        <span className="text-[11px] text-slate-400">28 000 FCFA × 2 unités</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 mt-2.5">
                      <span className="text-[10px] font-medium px-2.5 py-1 rounded-full bg-white border border-slate-200 text-slate-600">
                        Groupage combiné avec conteneur moto (0 frais fret additionnel)
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </section>

          {/* Section 2: Delivery & Hub Selection */}
          <section className="bg-white rounded-3xl border border-slate-200/90 shadow-md p-6 sm:p-8">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <span className="w-7 h-7 rounded-full bg-[#FF4500] text-white text-xs font-black flex items-center justify-center">
                  2
                </span>
                <h2 className="text-base sm:text-lg font-black text-[#0B192C]">
                  Mode de transport international &amp; Réception
                </h2>
              </div>
              <span className="text-xs font-bold text-[#FF4500] flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Chine → Sénégal
              </span>
            </div>

            {/* Transport Mode Selector */}
            <div className="mb-6">
              <label className="block text-xs font-bold text-slate-700 mb-2">
                Sélectionnez votre mode d'acheminement international :
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => setTransportMode('air')}
                  className={`p-3.5 rounded-2xl border text-left transition-all ${
                    transportMode === 'air'
                      ? 'bg-orange-50/50 border-[#FF4500] shadow-sm'
                      : 'bg-slate-50 border-slate-200 hover:bg-slate-100/60'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-[#0B192C]">Aérien Cargo</span>
                    <Plane className={`w-3.5 h-3.5 ${transportMode === 'air' ? 'text-[#FF4500]' : 'text-slate-400'}`} />
                  </div>
                  <span className="text-[10px] text-slate-500 block mt-1">12 à 18 jours • 7 500 F/kg</span>
                </button>

                <button
                  type="button"
                  onClick={() => setTransportMode('sea')}
                  className={`p-3.5 rounded-2xl border text-left transition-all ${
                    transportMode === 'sea'
                      ? 'bg-orange-50/50 border-[#FF4500] shadow-sm'
                      : 'bg-slate-50 border-slate-200 hover:bg-slate-100/60'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-[#0B192C]">Maritime LCL</span>
                    <Ship className={`w-3.5 h-3.5 ${transportMode === 'sea' ? 'text-[#FF4500]' : 'text-slate-400'}`} />
                  </div>
                  <span className="text-[10px] text-slate-500 block mt-1">30 à 45 jours • 185 000 F/m³</span>
                </button>

                <button
                  type="button"
                  onClick={() => setTransportMode('express')}
                  className={`p-3.5 rounded-2xl border text-left transition-all ${
                    transportMode === 'express'
                      ? 'bg-orange-50/50 border-[#FF4500] shadow-sm'
                      : 'bg-slate-50 border-slate-200 hover:bg-slate-100/60'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-[#0B192C]">Express Prioritaire</span>
                    <Plane className={`w-3.5 h-3.5 ${transportMode === 'express' ? 'text-[#FF4500]' : 'text-slate-400'}`} />
                  </div>
                  <span className="text-[10px] text-slate-500 block mt-1">5 à 8 jours • 13 500 F/kg</span>
                </button>
              </div>
            </div>

            {/* Radio Card Options */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              {/* Option A: Hub Almadies */}
              <label
                onClick={() => setDeliveryMode('hub_almadies')}
                className={`cursor-pointer relative p-5 rounded-2xl border transition-all ${
                  deliveryMode === 'hub_almadies'
                    ? 'bg-orange-50/40 border-[#FF4500] shadow-md shadow-orange-500/10'
                    : 'bg-slate-50/70 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`w-5 h-5 rounded-full flex items-center justify-center ${
                        deliveryMode === 'hub_almadies'
                          ? 'bg-[#FF4500] text-white'
                          : 'border border-slate-300'
                      }`}
                    >
                      {deliveryMode === 'hub_almadies' && <Check className="w-3 h-3 stroke-[3]" />}
                    </div>
                    <span className="text-xs sm:text-sm font-black text-[#0B192C]">
                      Enlèvement Hub Almadies
                    </span>
                  </div>
                  <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-[#FF4500]/15 text-[#FF4500]">
                    RECOMMANDÉ
                  </span>
                </div>

                <p className="text-[11px] text-slate-600 mt-2 leading-relaxed">
                  Hub Dallou Chine — Immeuble Horizon Almadies ou terminal Port Autonome de Dakar. Dédouanement assisté direct et inspection sur place.
                </p>

                <div className="mt-3 pt-2.5 border-t border-slate-200/60 flex items-center justify-between text-[11px]">
                  <span className="text-slate-500">Frais logistique locale:</span>
                  <span className="font-bold text-[#0B192C]">Inclus &amp; optimisé</span>
                </div>
              </label>

              {/* Option B: Last-Mile Delivery */}
              <label
                onClick={() => setDeliveryMode('last_mile')}
                className={`cursor-pointer relative p-5 rounded-2xl border transition-all ${
                  deliveryMode === 'last_mile'
                    ? 'bg-orange-50/40 border-[#FF4500] shadow-md shadow-orange-500/10'
                    : 'bg-slate-50/70 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`w-5 h-5 rounded-full flex items-center justify-center ${
                        deliveryMode === 'last_mile'
                          ? 'bg-[#FF4500] text-white'
                          : 'border border-slate-300'
                      }`}
                    >
                      {deliveryMode === 'last_mile' && <Check className="w-3 h-3 stroke-[3]" />}
                    </div>
                    <span className="text-xs sm:text-sm font-black text-[#0B192C]">
                      Livraison Dernier Km
                    </span>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200 text-slate-700">
                    Sur devis
                  </span>
                </div>

                <p className="text-[11px] text-slate-600 mt-2 leading-relaxed">
                  Acheminement sécurisé par camion plateau jusqu’à votre entrepôt ou domicile (Dakar urbain, Thiès, Mbour, Touba ou Saint-Louis).
                </p>

                <div className="mt-3 pt-2.5 border-t border-slate-200/60 flex items-center justify-between text-[11px]">
                  <span className="text-slate-500">Délai post-douane:</span>
                  <span className="font-bold text-[#0B192C]">+24h à 48h</span>
                </div>
              </label>
            </div>

            {/* Contact Inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nom complet ou Représentant légal
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  className="w-full h-11 px-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium text-[#0B192C] focus:bg-white focus:border-[#FF4500] outline-hidden transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Numéro WhatsApp certifié (+221)
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                    +221
                  </span>
                  <input
                    type="text"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    className="w-full h-11 pl-14 pr-4 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium text-[#0B192C] focus:bg-white focus:border-[#FF4500] outline-hidden transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Entreprise / Raison sociale (Optionnel)
                </label>
                <input
                  type="text"
                  value={company}
                  onChange={e => setCompany(e.target.value)}
                  className="w-full h-11 px-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium text-[#0B192C] focus:bg-white focus:border-[#FF4500] outline-hidden transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Ville &amp; Commune de déchargement
                </label>
                <input
                  type="text"
                  value={address}
                  onChange={e => setAddress(e.target.value)}
                  className="w-full h-11 px-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium text-[#0B192C] focus:bg-white focus:border-[#FF4500] outline-hidden transition-all"
                />
              </div>
            </div>
          </section>

          {/* Section 3: West African Payment Selector */}
          <section className="bg-white rounded-3xl border border-slate-200/90 shadow-md p-6 sm:p-8">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <span className="w-7 h-7 rounded-full bg-[#FF4500] text-white text-xs font-black flex items-center justify-center">
                  3
                </span>
                <h2 className="text-base sm:text-lg font-black text-[#0B192C]">
                  Modalité de versement de l'acompte usine (30%)
                </h2>
              </div>
              <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200/60">
                Séquestre Sécurisé
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              {/* Wave */}
              <label
                onClick={() => setPaymentMethod('wave')}
                className={`cursor-pointer flex flex-col justify-between p-4 rounded-2xl border transition-all ${
                  paymentMethod === 'wave'
                    ? 'bg-orange-50/30 border-[#FF4500] shadow-md shadow-orange-500/10'
                    : 'bg-slate-50/70 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <WaveLogo className="w-5 h-5" />
                    <span className="text-sm font-black text-[#00A3FF]">Wave</span>
                  </div>
                  <div
                    className={`w-4 h-4 rounded-full flex items-center justify-center ${
                      paymentMethod === 'wave' ? 'bg-[#FF4500] text-white' : 'border border-slate-300'
                    }`}
                  >
                    {paymentMethod === 'wave' && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                  </div>
                </div>
                <p className="text-[11px] text-slate-600 mt-2">
                  Paiement QR ou push direct instantané. 0% frais applicables.
                </p>
                <span className="mt-2 text-[10px] text-[#FF4500] font-bold">Validation immédiate</span>
              </label>

              {/* Orange Money */}
              <label
                onClick={() => setPaymentMethod('orange_money')}
                className={`cursor-pointer flex flex-col justify-between p-4 rounded-2xl border transition-all ${
                  paymentMethod === 'orange_money'
                    ? 'bg-orange-50/30 border-[#FF4500] shadow-md shadow-orange-500/10'
                    : 'bg-slate-50/70 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <OrangeMoneyLogo className="w-5 h-5" />
                    <span className="text-sm font-black text-[#FF6600]">Orange Money</span>
                  </div>
                  <div
                    className={`w-4 h-4 rounded-full flex items-center justify-center ${
                      paymentMethod === 'orange_money' ? 'bg-[#FF4500] text-white' : 'border border-slate-300'
                    }`}
                  >
                    {paymentMethod === 'orange_money' && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                  </div>
                </div>
                <p className="text-[11px] text-slate-600 mt-2">
                  Code marchand &amp; OTP sécurisé au Sénégal.
                </p>
                <span className="mt-2 text-[10px] text-slate-500 font-medium">Validation immédiate</span>
              </label>

              {/* Bank Transfer */}
              <label
                onClick={() => setPaymentMethod('virement')}
                className={`cursor-pointer flex flex-col justify-between p-4 rounded-2xl border transition-all ${
                  paymentMethod === 'virement'
                    ? 'bg-orange-50/30 border-[#FF4500] shadow-md shadow-orange-500/10'
                    : 'bg-slate-50/70 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-black text-[#0B192C]">Virement Pro</span>
                  <div
                    className={`w-4 h-4 rounded-full flex items-center justify-center ${
                      paymentMethod === 'virement' ? 'bg-[#FF4500] text-white' : 'border border-slate-300'
                    }`}
                  >
                    {paymentMethod === 'virement' && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                  </div>
                </div>
                <p className="text-[11px] text-slate-600 mt-2">
                  CBAO, BOA, UBA Sénégal ou Swift B2B.
                </p>
                <span className="mt-2 text-[10px] text-slate-500 font-medium">Reçu sous 24h</span>
              </label>

              {/* Cash Desk Almadies */}
              <label
                onClick={() => setPaymentMethod('desk')}
                className={`cursor-pointer flex flex-col justify-between p-4 rounded-2xl border transition-all ${
                  paymentMethod === 'desk'
                    ? 'bg-orange-50/30 border-[#FF4500] shadow-md shadow-orange-500/10'
                    : 'bg-slate-50/70 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-black text-[#0B192C]">Desk Almadies</span>
                  <div
                    className={`w-4 h-4 rounded-full flex items-center justify-center ${
                      paymentMethod === 'desk' ? 'bg-[#FF4500] text-white' : 'border border-slate-300'
                    }`}
                  >
                    {paymentMethod === 'desk' && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                  </div>
                </div>
                <p className="text-[11px] text-slate-600 mt-2">
                  Versement physique avec reçu sécurisé signé.
                </p>
                <span className="mt-2 text-[10px] text-slate-500 font-medium">Guichet dédié</span>
              </label>
            </div>

            <div className="mt-4 p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center gap-3">
              <ShieldCheck className="w-5 h-5 text-[#FF4500] shrink-0" />
              <p className="text-xs text-slate-600 leading-relaxed">
                Transactions certifiées conformes aux règlements BCEAO. Vos fonds transitent exclusivement par les comptes séquestres agréés de Dallou Chine SARL.
              </p>
            </div>
          </section>
        </div>

        {/* RIGHT COLUMN: 4 cols (35%) STICKY TRANSPARENT PRICING BREAKDOWN */}
        <aside className="lg:col-span-4 sticky top-24 flex flex-col gap-4">
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xl p-6 sm:p-7 relative overflow-hidden">
            <div className="absolute -top-16 -right-16 w-44 h-44 rounded-full bg-[#FF4500]/10 blur-3xl pointer-events-none" />

            {/* Card Header */}
            <div className="flex items-center justify-between mb-6 pb-3 border-b border-slate-100">
              <div>
                <span className="text-[10px] font-bold text-[#FF4500] uppercase tracking-wider block">
                  Décomposition Transparente
                </span>
                <h3 className="text-lg font-black text-[#0B192C]">Résumé financier</h3>
              </div>
              <div className="flex flex-col items-end">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-[#0B192C] flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-[#FF4500]" /> OHADA
                </span>
                <span className="text-[9px] text-slate-400 mt-0.5">Compte Séquestre</span>
              </div>
            </div>

            {/* Financial Line Items */}
            <div className="flex flex-col gap-3.5 mb-6">
              {/* Item A */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-[#0B192C]">Prix usine fournisseur négocié</span>
                  <span className="text-[11px] text-slate-400">
                    {isCustomCart ? 'Articles sélectionnés panier' : '2 motos + 2 casques connectés'}
                  </span>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-xs font-black text-[#0B192C] block">
                    {factoryPrice.toLocaleString('fr-FR')} FCFA
                  </span>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 text-[9px] font-bold">
                    <Check className="w-2.5 h-2.5" /> CONFIRMÉ
                  </span>
                </div>
              </div>

              {/* Item B: Fret réel calculé */}
              <div className="flex items-start justify-between gap-2 pt-2 border-t border-slate-100">
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-[#0B192C]">
                    {transportMode === 'air'
                      ? 'Fret aérien cargo international'
                      : transportMode === 'sea'
                      ? 'Fret maritime groupé LCL'
                      : 'Fret express prioritaire'}
                  </span>
                  <span className="text-[11px] text-slate-400">
                    {logisticsEst
                      ? `${logisticsEst.chargeable_weight} ${transportMode === 'sea' ? 'm³' : 'kg'} • ${logisticsEst.estimated_delivery_days || 'Chine → Dakar'}`
                      : 'Calculé selon poids/volume réels'}
                  </span>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-xs font-black text-[#0B192C] block">
                    ~{realShippingFee.toLocaleString('fr-FR')} FCFA
                  </span>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 text-amber-900 text-[9px] font-bold">
                    <Info className="w-2.5 h-2.5" /> ESTIMATIF
                  </span>
                </div>
              </div>

              {/* Item C */}
              <div className="flex items-start justify-between gap-2 pt-2 border-t border-slate-100">
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-[#0B192C]">Inspection qualité en usine</span>
                  <span className="text-[11px] text-slate-400">Audit SGS Chine avant empotage</span>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-xs font-black text-[#FF4500] block">OFFERT</span>
                  <span className="text-[9px] text-slate-400">Inclus dans mandat</span>
                </div>
              </div>

              {/* Item D */}
              <div className="flex items-start justify-between gap-2 pt-2 border-t border-slate-100">
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-[#0B192C]">Formalités douanières PAD</span>
                  <span className="text-[11px] text-slate-400">Dédouanement Dakar &amp; manutention Gaindé</span>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-xs font-black text-slate-700 block">
                    Barème officiel
                  </span>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[9px] font-medium">
                    À L'ARRIVÉE
                  </span>
                </div>
              </div>
            </div>

            {/* Total Estimé Highlight */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 mb-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700">Total estimé clé en main</span>
                <span className="text-lg sm:text-xl font-black text-[#0B192C] tracking-tight">
                  {totalEstimated.toLocaleString('fr-FR')} FCFA
                </span>
              </div>
              <p className="text-[10px] text-slate-500 mt-1">
                Rendu Dakar dédouané &amp; certifié, sans frais cachés.
              </p>
            </div>

            {/* Staged Payment Schedule Box */}
            <div className="rounded-2xl bg-slate-50 p-4 mb-6 flex flex-col gap-2.5 border border-slate-200/80">
              <div className="flex items-center justify-between pb-1">
                <span className="text-[11px] uppercase tracking-wide text-[#0B192C] font-bold">
                  Échelonnement des paiements
                </span>
                <span className="text-[10px] text-[#FF4500] font-bold">3 étapes sécurisées</span>
              </div>

              {/* Step 1 */}
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-white border border-orange-200 shadow-2xs">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-[#FF4500] text-white text-[10px] flex items-center justify-center font-bold">
                    1
                  </span>
                  <div>
                    <span className="text-xs text-[#0B192C] block font-bold">
                      Acompte usine (30%)
                    </span>
                    <span className="text-[10px] text-[#FF4500] font-medium">
                      Exigé aujourd’hui pour lancer l'ordre
                    </span>
                  </div>
                </div>
                <span className="text-xs sm:text-sm font-black text-[#FF4500]">
                  {deposit30.toLocaleString('fr-FR')} FCFA
                </span>
              </div>

              {/* Step 2 */}
              <div className="flex items-center justify-between px-2 py-1 text-slate-500 text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-600 text-[10px] flex items-center justify-center font-bold">
                    2
                  </span>
                  <div>
                    <span className="text-xs text-[#0B192C]">Solde usine (70%)</span>
                    <span className="text-[10px] text-slate-400 block">Avant scellage &amp; embarquement</span>
                  </div>
                </div>
                <span className="text-xs font-bold text-[#0B192C]">
                  {balance70.toLocaleString('fr-FR')} FCFA
                </span>
              </div>

              {/* Step 3 */}
              <div className="flex items-center justify-between px-2 py-1 text-slate-500 text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-600 text-[10px] flex items-center justify-center font-bold">
                    3
                  </span>
                  <div>
                    <span className="text-xs text-[#0B192C]">Fret maritime &amp; Douane</span>
                    <span className="text-[10px] text-slate-400 block">Payables lors du déchargement à Dakar</span>
                  </div>
                </div>
                <span className="text-xs font-medium text-slate-600">À l’arrivée</span>
              </div>
            </div>

            {/* Primary CTA Button */}
            <button
              onClick={handleConfirmOrder}
              disabled={isProcessing}
              className="w-full h-14 rounded-xl bg-[#FF4500] hover:bg-[#E03D00] text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-orange-500/30 hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer"
            >
              <span>{isProcessing ? 'Validation en cours...' : `Confirmer et verser l'acompte (${deposit30.toLocaleString('fr-FR')} FCFA)`}</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            {/* Reassurance Notice */}
            <div className="mt-4 p-3 rounded-2xl bg-orange-50/60 border border-orange-200/60 flex items-start gap-2.5">
              <ShieldCheck className="w-4 h-4 text-[#FF4500] shrink-0 mt-0.5" />
              <p className="text-[11px] text-slate-600 leading-relaxed">
                <strong className="text-[#0B192C] font-semibold">Garantie Dallou Chine :</strong> Votre acompte est conservé sous compte tiers séquestre jusqu'à la validation du rapport d'inspection physique en usine avec photos &amp; numéros de châssis.
              </p>
            </div>

            {/* Bottom Micro Logos */}
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-center gap-4 text-slate-400 text-[11px]">
              <div className="flex items-center gap-1">
                <Lock className="w-3.5 h-3.5" /> Chiffrement 256-bit
              </div>
              <span className="w-1 h-1 rounded-full bg-slate-300" />
              <div className="flex items-center gap-1">
                <FileCheck2 className="w-3.5 h-3.5" /> Contrat légalisé
              </div>
            </div>
          </div>

          {/* Quick Help Card */}
          <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-orange-50 text-[#FF4500] flex items-center justify-center">
                <Headphones className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs font-bold text-[#0B192C] block">Besoin d'un desk manager ?</span>
                <span className="text-[11px] text-slate-500">Ligne directe Dakar / Guangzhou</span>
              </div>
            </div>
            <a
              href="https://wa.me/221338000000"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-bold px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-[#0B192C] transition-all"
            >
              Appeler
            </a>
          </div>
        </aside>
      </div>
    </div>
  );
};
