import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { PriceDisplay } from '../../components/common/PriceDisplay';
import { PaymentApiClient } from '../../services/paymentApiClient';
import {
  ShieldCheck,
  MapPin,
  Building,
  Truck,
  CreditCard,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Lock,
  Phone,
  User,
  Sparkles,
  AlertCircle
} from 'lucide-react';
import { WaveLogo, OrangeMoneyLogo, VisaMastercardLogo, GeniusPayBadge } from '../../components/common/PaymentOperatorLogos';

export const CheckoutPage: React.FC = () => {
  const { cart, cartTotalXOF, createOrder, hubLocations, navigate, currentUser } = useApp();

  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Form State
  const [customerInfo, setCustomerInfo] = useState({
    fullName: currentUser.name || 'Amadou Diallo',
    phone: currentUser.phone || '+221 77 540 22 11',
    email: currentUser.email || 'amadou.diallo@gmail.com',
    city: currentUser.city || 'Dakar'
  });

  const [deliveryType, setDeliveryType] = useState<'hub_pickup' | 'home_delivery'>('hub_pickup');
  const [selectedHubId, setSelectedHubId] = useState<string>(hubLocations[0]?.id || 'hub-almadies');
  const [homeAddress, setHomeAddress] = useState({
    street: '',
    neighborhood: '',
    notes: ''
  });

  const [paymentMethod, setPaymentMethod] = useState<'wave' | 'orange_money' | 'free_money' | 'card'>('wave');
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const shippingFee = deliveryType === 'home_delivery' ? 2000 : 0;
  const grandTotal = cartTotalXOF + shippingFee;

  if (cart.length === 0) {
    return (
      <div className="max-w-md mx-auto py-20 text-center space-y-4">
        <p className="text-sm text-slate-600">Votre panier est actuellement vide.</p>
        <button
          onClick={() => navigate('/products')}
          className="bg-[#0D2C7A] text-white text-xs font-bold px-6 py-3 rounded-xl"
        >
          Retourner au catalogue
        </button>
      </div>
    );
  }

  const handleCompleteOrder = async () => {
    if (isProcessing) return;
    setIsProcessing(true);
    setErrorMessage(null);

    try {
      const order = createOrder({
        items: cart,
        customer: customerInfo,
        deliveryType,
        hubLocationId: deliveryType === 'hub_pickup' ? selectedHubId : undefined,
        deliveryAddress:
          deliveryType === 'home_delivery'
            ? {
                fullName: customerInfo.fullName,
                phone: customerInfo.phone,
                city: customerInfo.city,
                district: homeAddress.neighborhood,
                streetAddress: homeAddress.street,
                notes: homeAddress.notes
              }
            : undefined,
        paymentMethod
      });

      // Appel sécurisé au backend pour initialiser le paiement GeniusPay
      const res = await PaymentApiClient.createPayment({
        orderId: order.id,
        userId: currentUser.id,
        orderData: order
      });

      if (res.success && res.checkoutUrl) {
        // Redirection vers le Hosted Checkout GeniusPay
        if (
          res.checkoutUrl.startsWith('/') ||
          res.checkoutUrl.startsWith('http://localhost') ||
          res.checkoutUrl.includes(window.location.host)
        ) {
          const urlObj = new URL(res.checkoutUrl, window.location.origin);
          navigate(`${urlObj.pathname}${urlObj.search}`);
        } else {
          window.location.href = res.checkoutUrl;
        }
      } else {
        setIsProcessing(false);
        setErrorMessage(res.errorMessage || 'Le paiement n\'a pas pu être initialisé. Veuillez réessayer.');
      }
    } catch (err: any) {
      setIsProcessing(false);
      setErrorMessage('Une erreur de communication est survenue. Veuillez vérifier votre connexion et réessayer.');
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-16">
      {/* Checkout Stepper Header */}
      <div className="glass-panel bg-white/80 rounded-3xl p-6 border border-white shadow-xs">
        <div className="flex items-center justify-between max-w-2xl mx-auto">
          {/* Step 1 */}
          <div className="flex items-center gap-2">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
                step >= 1 ? 'bg-[#0D2C7A] text-white' : 'bg-slate-200 text-slate-500'
              }`}
            >
              1
            </div>
            <span className={`text-xs font-bold hidden sm:inline ${step >= 1 ? 'text-[#0D2C7A]' : 'text-slate-400'}`}>
              Coordonnées
            </span>
          </div>

          <div className={`h-0.5 flex-1 mx-3 ${step >= 2 ? 'bg-[#0D2C7A]' : 'bg-slate-200'}`} />

          {/* Step 2 */}
          <div className="flex items-center gap-2">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
                step >= 2 ? 'bg-[#0D2C7A] text-white' : 'bg-slate-200 text-slate-500'
              }`}
            >
              2
            </div>
            <span className={`text-xs font-bold hidden sm:inline ${step >= 2 ? 'text-[#0D2C7A]' : 'text-slate-400'}`}>
              Livraison / Hub
            </span>
          </div>

          <div className={`h-0.5 flex-1 mx-3 ${step >= 3 ? 'bg-[#0D2C7A]' : 'bg-slate-200'}`} />

          {/* Step 3 */}
          <div className="flex items-center gap-2">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
                step === 3 ? 'bg-[#2A6DFF] text-white animate-pulse' : 'bg-slate-200 text-slate-500'
              }`}
            >
              3
            </div>
            <span className={`text-xs font-bold hidden sm:inline ${step === 3 ? 'text-[#2A6DFF]' : 'text-slate-400'}`}>
              Paiement Local
            </span>
          </div>
        </div>
      </div>

      {/* Main Grid: Form Steps (7 cols) + Summary (5 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Step Contents */}
        <div className="lg:col-span-7 space-y-6">
          {/* STEP 1: Coordonnées */}
          {step === 1 && (
            <div className="glass-panel bg-white/90 rounded-3xl p-6 sm:p-8 border border-white shadow-md space-y-5 animate-in fade-in">
              <div className="space-y-1">
                <h2 className="text-xl font-black text-[#0D2C7A]">1. Vos Coordonnées de Contact</h2>
                <p className="text-xs text-slate-500">
                  Ces informations permettront de vous notifier par SMS/WhatsApp lors des différentes étapes d'acheminement.
                </p>
              </div>

              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Nom complet *</label>
                  <input
                    type="text"
                    required
                    value={customerInfo.fullName}
                    onChange={e => setCustomerInfo({ ...customerInfo, fullName: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 outline-hidden focus:border-[#2A6DFF]"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">Numéro WhatsApp (Suivi SMS/WhatsApp) *</label>
                    <input
                      type="tel"
                      required
                      value={customerInfo.phone}
                      onChange={e => setCustomerInfo({ ...customerInfo, phone: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 outline-hidden focus:border-[#2A6DFF]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">Email pour le reçu</label>
                    <input
                      type="email"
                      value={customerInfo.email}
                      onChange={e => setCustomerInfo({ ...customerInfo, email: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 outline-hidden focus:border-[#2A6DFF]"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Ville de résidence *</label>
                  <select
                    value={customerInfo.city}
                    onChange={e => setCustomerInfo({ ...customerInfo, city: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 outline-hidden focus:border-[#2A6DFF] cursor-pointer"
                  >
                    <option value="Dakar">Dakar</option>
                    <option value="Thiès">Thiès</option>
                    <option value="Rufisque">Rufisque / Diamniadio</option>
                    <option value="Mbour">Mbour / Saly</option>
                    <option value="Saint-Louis">Saint-Louis</option>
                    <option value="Autre région">Autre région du Sénégal</option>
                  </select>
                </div>
              </div>

              <div className="pt-4 flex justify-between">
                <button
                  type="button"
                  onClick={() => navigate('/cart')}
                  className="text-xs font-bold text-slate-500 hover:text-[#0D2C7A]"
                >
                  ← Retour au panier
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (!customerInfo.fullName || !customerInfo.phone) {
                      alert('Veuillez remplir votre nom et numéro de téléphone.');
                      return;
                    }
                    setStep(2);
                  }}
                  className="bg-[#0D2C7A] hover:bg-[#2A6DFF] text-white font-bold text-xs px-6 py-3 rounded-xl shadow-md flex items-center gap-1.5"
                >
                  <span>Continuer vers la livraison</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: Mode de Réception */}
          {step === 2 && (
            <div className="glass-panel bg-white/90 rounded-3xl p-6 sm:p-8 border border-white shadow-md space-y-6 animate-in fade-in">
              <div className="space-y-1">
                <h2 className="text-xl font-black text-[#0D2C7A]">2. Choix du Mode de Réception</h2>
                <p className="text-xs text-slate-500">
                  Choisissez un retrait sans frais dans l'un de nos Hubs de stockage ou une livraison directe à domicile.
                </p>
              </div>

              {/* Delivery Type Option Selector */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <label
                  onClick={() => setDeliveryType('hub_pickup')}
                  className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex flex-col justify-between ${
                    deliveryType === 'hub_pickup'
                      ? 'border-[#0D2C7A] bg-blue-50/50 shadow-sm'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Building className="w-5 h-5 text-[#2A6DFF]" />
                      <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800">
                        0 FCFA (Gratuit)
                      </span>
                    </div>
                    <strong className="text-sm font-bold text-[#0D2C7A] block">Retrait en Hub Relais</strong>
                    <p className="text-xs text-slate-500">
                      Vos colis vous attendent en lieu sécurisé dès leur dédouanement.
                    </p>
                  </div>
                </label>

                <label
                  onClick={() => setDeliveryType('home_delivery')}
                  className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex flex-col justify-between ${
                    deliveryType === 'home_delivery'
                      ? 'border-[#0D2C7A] bg-blue-50/50 shadow-sm'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Truck className="w-5 h-5 text-[#2A6DFF]" />
                      <span className="text-[10px] font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md">
                        +2 000 FCFA
                      </span>
                    </div>
                    <strong className="text-sm font-bold text-[#0D2C7A] block">Livraison à domicile (Dakar)</strong>
                    <p className="text-xs text-slate-500">
                      Un coursier vous livre directement à votre porte ou bureau.
                    </p>
                  </div>
                </label>
              </div>

              {/* Hub Selection List */}
              {deliveryType === 'hub_pickup' && (
                <div className="space-y-3 pt-2">
                  <label className="text-xs font-bold text-slate-700 block">
                    Sélectionnez votre Hub de retrait préféré :
                  </label>
                  <div className="space-y-2">
                    {hubLocations.map(hub => (
                      <div
                        key={hub.id}
                        onClick={() => setSelectedHubId(hub.id)}
                        className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex items-center justify-between ${
                          selectedHubId === hub.id
                            ? 'border-[#2A6DFF] bg-blue-50/80 shadow-xs'
                            : 'border-slate-200 bg-white hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <MapPin className="w-4 h-4 text-[#2A6DFF] shrink-0" />
                          <div>
                            <strong className="text-xs font-bold text-[#0D2C7A] block">{hub.name}</strong>
                            <span className="text-[11px] text-slate-500">{hub.address}</span>
                          </div>
                        </div>

                        <span className="text-[11px] text-slate-500 font-mono-numeric shrink-0">
                          {hub.openingHours}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Home delivery address */}
              {deliveryType === 'home_delivery' && (
                <div className="space-y-3 pt-2">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">Quartier à Dakar *</label>
                    <input
                      type="text"
                      placeholder="Ex: Sacré-Cœur 3, Mermoz, Yoff, Ouakam..."
                      value={homeAddress.neighborhood}
                      onChange={e => setHomeAddress({ ...homeAddress, neighborhood: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs outline-hidden"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">Adresse précise / Repère</label>
                    <input
                      type="text"
                      placeholder="Ex: Villa n°12 près de la Pharmacie..."
                      value={homeAddress.street}
                      onChange={e => setHomeAddress({ ...homeAddress, street: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs outline-hidden"
                    />
                  </div>
                </div>
              )}

              <div className="pt-4 flex justify-between">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="text-xs font-bold text-slate-500 hover:text-[#0D2C7A]"
                >
                  ← Étape précédente
                </button>

                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="bg-[#0D2C7A] hover:bg-[#2A6DFF] text-white font-bold text-xs px-6 py-3 rounded-xl shadow-md flex items-center gap-1.5"
                >
                  <span>Continuer vers le paiement</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: Paiement Local Sécurisé */}
          {step === 3 && (
            <div className="glass-panel bg-white/90 rounded-3xl p-6 sm:p-8 border border-white shadow-md space-y-6 animate-in fade-in">
              <div className="space-y-1">
                <h2 className="text-xl font-black text-[#0D2C7A]">3. Paiement Sécurisé Sénégal</h2>
                <p className="text-xs text-slate-500">
                  Validez votre achat pour lancer la préparation en usine et l'attribution de votre numéro AWP.
                </p>
              </div>

              {/* Payment Methods Grid */}
              <div className="space-y-2.5">
                {/* Wave */}
                <label
                  onClick={() => setPaymentMethod('wave')}
                  className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex items-center justify-between ${
                    paymentMethod === 'wave'
                      ? 'border-[#2A6DFF] bg-blue-50/70 shadow-sm ring-2 ring-[#2A6DFF]/20'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <WaveLogo className="w-10 h-10 shadow-sm" />
                    <div>
                      <div className="flex items-center gap-2">
                        <strong className="text-sm font-bold text-[#0D2C7A] block">Wave Sénégal</strong>
                        <span className="text-[10px] font-bold text-blue-600 bg-blue-100 px-2 py-0.5 rounded-full">Sans frais 1%</span>
                      </div>
                      <span className="text-xs text-slate-500">Paiement instantané via App Wave Sénégal</span>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-[#2A6DFF]">Recommandé</span>
                </label>

                {/* Orange Money */}
                <label
                  onClick={() => setPaymentMethod('orange_money')}
                  className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex items-center justify-between ${
                    paymentMethod === 'orange_money'
                      ? 'border-[#FF6600] bg-orange-50/70 shadow-sm ring-2 ring-[#FF6600]/20'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <OrangeMoneyLogo className="w-10 h-10 shadow-sm" />
                    <div>
                      <div className="flex items-center gap-2">
                        <strong className="text-sm font-bold text-[#0D2C7A] block">Orange Money Sénégal</strong>
                        <span className="text-[10px] font-bold text-orange-600 bg-orange-100 px-2 py-0.5 rounded-full">#144# / App</span>
                      </div>
                      <span className="text-xs text-slate-500">Validation sécurisée par code de confirmation OTP</span>
                    </div>
                  </div>
                </label>

                {/* Carte Bancaire */}
                <label
                  onClick={() => setPaymentMethod('card')}
                  className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex items-center justify-between ${
                    paymentMethod === 'card'
                      ? 'border-[#0D2C7A] bg-slate-50 shadow-sm ring-2 ring-[#0D2C7A]/20'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center text-white shadow-sm">
                      <CreditCard className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <strong className="text-sm font-bold text-[#0D2C7A] block">Carte Bancaire Internationale</strong>
                        <VisaMastercardLogo />
                      </div>
                      <span className="text-xs text-slate-500">Cartes Visa & Mastercard via protocole 3D Secure</span>
                    </div>
                  </div>
                </label>
              </div>

              {/* GeniusPay Security Banner */}
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/80 flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs text-slate-600">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Transactions chiffrées & certifiées SSL 256-bit</span>
                </div>
                <GeniusPayBadge />
              </div>

              {/* Error Notification */}
              {errorMessage && (
                <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2.5 text-xs text-rose-700 animate-in fade-in">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Confirm CTA */}
              <div className="pt-4 space-y-3">
                <button
                  type="button"
                  disabled={isProcessing}
                  onClick={handleCompleteOrder}
                  className="w-full bg-gradient-to-r from-[#0D2C7A] to-[#2A6DFF] hover:from-[#2A6DFF] hover:to-blue-500 text-white font-black text-base py-4 px-6 rounded-2xl shadow-xl flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50"
                >
                  {isProcessing ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                      <span>Génération de votre bordereau AWP...</span>
                    </span>
                  ) : (
                    <span>Confirmer et Payer ({(grandTotal || 0).toLocaleString('fr-FR')} FCFA)</span>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="w-full text-center text-xs font-bold text-slate-500 hover:text-[#0D2C7A]"
                >
                  ← Modifier les options de livraison
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right Side: Fixed Order Summary (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="glass-panel bg-white/95 rounded-3xl p-6 border border-white shadow-md space-y-5">
            <h3 className="text-base font-black text-[#0D2C7A] border-b border-slate-100 pb-3">
              Votre Commande ({cart.length} articles)
            </h3>

            <div className="space-y-3 max-h-60 overflow-y-auto no-scrollbar">
              {cart.filter(item => item && item.product).map((item, idx) => (
                <div key={idx} className="flex items-center gap-3 text-xs">
                  <img
                    src={item.product?.images?.[0] || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=200'}
                    alt={item.product?.name || 'Produit'}
                    className="w-12 h-12 rounded-xl object-cover border border-slate-200"
                  />
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-[#0D2C7A] truncate">{item.product?.name}</h4>
                    <span className="text-slate-500 font-mono-numeric">
                      x{item.quantity} • {(((item.product?.priceXOF || 0) * item.quantity) || 0).toLocaleString('fr-FR')} FCFA
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-2 pt-3 border-t border-slate-100 text-xs text-slate-600">
              <div className="flex justify-between">
                <span>Sous-total articles :</span>
                <span className="font-mono-numeric font-bold">{(cartTotalXOF || 0).toLocaleString('fr-FR')} FCFA</span>
              </div>
              <div className="flex justify-between">
                <span>Mode de transport :</span>
                <span className="text-emerald-700 font-bold">Fret & Douane Inclus</span>
              </div>
              <div className="flex justify-between">
                <span>Frais de réception :</span>
                <span className="font-mono-numeric font-bold">
                  {deliveryType === 'home_delivery' ? '2 000 FCFA' : '0 FCFA (Gratuit)'}
                </span>
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-baseline justify-between">
                <strong className="text-sm font-black text-[#0D2C7A]">Total Général :</strong>
                <span className="text-xl font-black text-[#0D2C7A] font-mono-numeric">
                  {(grandTotal || 0).toLocaleString('fr-FR')} FCFA
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
