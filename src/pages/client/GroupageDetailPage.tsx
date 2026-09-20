import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { groupageService } from '../../services/groupageService';
import { Groupage } from '../../types';

export const GroupageDetailPage: React.FC<{ id?: string }> = ({ id }) => {
  const { navigate, currentUser, groupages, reserveGroupage, getGroupageById, openAuthModal } = useApp();

  const [groupage, setGroupage] = useState<Groupage | null>(() => (id ? getGroupageById(id) || null : null));
  const [loading, setLoading] = useState<boolean>(!groupage);
  const [reserving, setReserving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [currentQty, setCurrentQty] = useState(1);
  const [activeFaq, setActiveFaq] = useState<number | null>(null);
  const [showNotification, setShowNotification] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const fetchGroupage = async () => {
      if (id) {
        const live = await groupageService.getGroupageById(id);
        if (isMounted && live) {
          setGroupage(live);
          setCurrentQty(live.minOrderPerUser || 1);
          setLoading(false);
          return;
        }
      }
      if (isMounted) {
        if (groupages.length > 0) {
          const fallback = groupages[0];
          setGroupage(fallback);
          setCurrentQty(fallback.minOrderPerUser || 1);
        }
        setLoading(false);
      }
    };
    fetchGroupage();
    return () => {
      isMounted = false;
    };
  }, [id, groupages]);

  const UNIT_PRICE = groupage?.unitPriceXOF || 480000;
  const ORIGINAL_PRICE = groupage?.originalPriceXOF || Math.round(UNIT_PRICE * 1.35);
  const DEPOSIT_RATE = 0.30;
  const BALANCE_RATE = 0.70;
  const ESTIMATED_SHIPPING_PER_UNIT = groupage?.transportMode === 'air' ? 25000 : 85000;

  const targetUnits = groupage?.targetUnits || groupage?.targetQuantity || 20;
  const currentUnits = groupage?.currentUnits || groupage?.reservedQuantity || 0;
  const availableUnits = groupage?.availableQuantity ?? Math.max(0, targetUnits - currentUnits);
  const progressPercent = Math.min(100, Math.round((currentUnits / (targetUnits || 1)) * 100));

  const MIN_AVAILABLE = groupage?.minOrderPerUser || 1;
  const MAX_AVAILABLE = Math.max(MIN_AVAILABLE, Math.min(groupage?.maxOrderPerUser || 100, availableUnits));

  const isFull = groupage?.status === 'full' || availableUnits <= 0;
  const isClosed = groupage?.status !== 'open' && groupage?.status !== 'almost_full';

  const subtotal = currentQty * UNIT_PRICE;
  const deposit = subtotal * DEPOSIT_RATE;
  const balance = subtotal * BALANCE_RATE;
  const shipping = currentQty * ESTIMATED_SHIPPING_PER_UNIT;
  const savingsPercent = groupage?.savingsPercent || Math.round(((ORIGINAL_PRICE - UNIT_PRICE) / ORIGINAL_PRICE) * 100);

  const formatFCFA = (num: number) => {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + ' FCFA';
  };

  const handleJoinGroupage = async () => {
    if (!currentUser.isLoggedIn) {
      openAuthModal('client');
      return;
    }
    if (!groupage) return;

    if (isFull || isClosed) {
      setErrorMessage('Ce groupage n\'accepte plus de nouvelles réservations.');
      return;
    }

    if (currentQty > availableUnits) {
      setErrorMessage(`Quantité demandée supérieure au disponible (${availableUnits} unités restantes).`);
      return;
    }

    if (currentQty < MIN_AVAILABLE) {
      setErrorMessage(`Quantité minimale de commande : ${MIN_AVAILABLE} unité(s).`);
      return;
    }

    setReserving(true);
    setErrorMessage(null);
    const key = `res_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const res = await reserveGroupage(groupage.id, currentQty, key);
    setReserving(false);

    if (res.success) {
      setShowNotification(true);
      const live = await groupageService.getGroupageById(groupage.id);
      if (live) {
        setGroupage(live);
      }
      setTimeout(() => {
        setShowNotification(false);
      }, 3500);
    } else {
      setErrorMessage(res.error || 'Erreur lors de la réservation');
    }
  };

  const toggleFaq = (index: number) => {
    setActiveFaq(activeFaq === index ? null : index);
  };

  if (loading && !groupage) {
    return (
      <div className="max-w-7xl mx-auto w-full px-4 py-16 flex flex-col items-center justify-center space-y-4">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-sm font-bold text-slate-600">Chargement de la campagne de groupage...</p>
      </div>
    );
  }

  const title = groupage?.title || 'Campagne de Groupage Usine';
  const code = groupage?.code || 'GRP-000';
  const image = groupage?.image || groupage?.product?.images?.[0] || 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=800';
  const closingDate = groupage?.closingDate || '15 jours';
  const logisticsRoute = groupage?.logisticsRoute || 'Port Ningbo-Zhoushan 🇨🇳 → Port Autonome de Dakar 🇸🇳';
  const description = groupage?.description || groupage?.product?.shortDescription || 'Groupage sécurisé pour livraison groupée au Port Autonome de Dakar.';

  return (
    <div className="flex flex-col w-full">
      {/* Toast Notification */}
      {showNotification && (
        <div className="fixed top-24 right-4 sm:right-8 z-50 bg-[#141c24] text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 border border-orange-500/30 animate-in fade-in slide-in-from-top-4 duration-300">
          <span className="material-symbols-outlined text-[#ff8a00] text-2xl">check_circle</span>
          <div>
            <div className="font-bold text-sm">Réservation confirmée sur Supabase !</div>
            <div className="text-xs text-slate-300">
              {currentQty} unité{currentQty > 1 ? 's' : ''} réservée{currentQty > 1 ? 's' : ''} (Acompte 30% : {formatFCFA(deposit)})
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-12 py-4">
        {/* =================================================================== */}
        {/* FIL D'ARIANE MINIMAL & GLASS */}
        {/* =================================================================== */}
        <nav
          aria-label="Fil d'Ariane"
          className="flex items-center gap-1 text-on-surface-variant font-label-md text-label-md mb-6 flex-wrap"
        >
          <button
            onClick={() => navigate('/')}
            className="hover:text-primary transition-colors flex items-center gap-1 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px]">home</span>
            <span>Accueil</span>
          </button>
          <span className="material-symbols-outlined text-[14px] text-outline-variant">chevron_right</span>
          <button
            onClick={() => navigate('/groupages')}
            className="hover:text-primary transition-colors cursor-pointer"
          >
            Groupages
          </button>
          <span className="material-symbols-outlined text-[14px] text-outline-variant">chevron_right</span>
          <span className="text-on-surface font-bold bg-surface-container-high px-2.5 py-0.5 rounded-full">
            #{code}
          </span>
        </nav>

        {/* =================================================================== */}
        {/* BLOC HERO DU GROUPAGE (Liquid Glass 2 colonnes) */}
        {/* =================================================================== */}
        <section className="w-full bg-surface-container-lowest/90 backdrop-blur-xl rounded-3xl shadow-sm border border-slate-100 overflow-hidden mb-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-0">
            {/* COLONNE GAUCHE: Media & Spécifications Fret */}
            <div className="lg:col-span-6 p-6 sm:p-8 flex flex-col justify-between bg-surface-container-low/40">
              <div className="relative w-full aspect-[16/11] rounded-2xl overflow-hidden bg-surface-container shadow-sm mb-4 group">
                <img
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                  alt={title}
                  src={image}
                />

                {/* Badges overlay */}
                <div className="absolute top-4 left-4 flex flex-wrap gap-2">
                  <span className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full font-label-sm text-label-sm uppercase tracking-wider backdrop-blur-md shadow-sm ${
                    isFull
                      ? 'bg-rose-500/90 text-white'
                      : groupage?.status === 'almost_full'
                      ? 'bg-tertiary-container/95 text-on-tertiary'
                      : 'bg-emerald-600/90 text-white'
                  }`}>
                    {!isFull && <span className="w-2 h-2 rounded-full bg-white animate-ping" />}
                    {isFull ? 'Complet — Clôturé' : groupage?.status === 'almost_full' ? 'En cours — Presque complet' : 'Campagne Ouverte'}
                  </span>
                  <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-inverse-surface/90 text-inverse-on-surface text-label-sm font-label-sm">
                    <span className="material-symbols-outlined text-[14px] text-primary-container">
                      verified
                    </span>
                    Contrôle Qualité Usine
                  </span>
                </div>

                <div className="absolute bottom-4 left-4 right-4 bg-surface-container-lowest/90 backdrop-blur-md p-3 rounded-xl flex items-center justify-between shadow-sm">
                  <div className="flex items-center gap-2.5">
                    <span className="material-symbols-outlined text-primary-container text-[22px]">
                      {groupage?.transportMode === 'air' ? 'flight_takeoff' : 'directions_boat'}
                    </span>
                    <div className="flex flex-col">
                      <span className="font-label-sm text-label-sm font-bold text-on-surface">
                        {groupage?.transportMode === 'air' ? 'Fret Aérien Express Dakar' : 'Conteneur Consolidé Maritime'}
                      </span>
                      <span className="font-body-sm text-body-sm text-on-surface-variant truncate max-w-[240px]">
                        {logisticsRoute}
                      </span>
                    </div>
                  </div>
                  <span className="font-label-sm text-label-sm bg-surface-container-high px-2.5 py-1 rounded-full text-on-surface font-semibold">
                    {groupage?.transportMode === 'air' ? 'Aérien' : 'Maritime'}
                  </span>
                </div>
              </div>

              {/* Puces logistiques certifiées */}
              <div className="grid grid-cols-3 gap-2 sm:gap-3">
                <div className="bg-surface-container-lowest p-3 rounded-xl flex flex-col items-center text-center shadow-xs border border-slate-100">
                  <span className="material-symbols-outlined text-primary mb-1 text-[20px]">
                    inventory_2
                  </span>
                  <span className="font-label-sm text-label-sm text-on-surface-variant">Seuil MOQ</span>
                  <span className="font-headline-sm text-headline-sm font-bold text-on-surface">
                    {targetUnits} pcs
                  </span>
                </div>
                <div className="bg-surface-container-lowest p-3 rounded-xl flex flex-col items-center text-center shadow-xs border border-slate-100">
                  <span className="material-symbols-outlined text-primary mb-1 text-[20px]">
                    group
                  </span>
                  <span className="font-label-sm text-label-sm text-on-surface-variant">
                    Participants
                  </span>
                  <span className="font-headline-sm text-headline-sm font-bold text-on-surface">
                    {groupage?.participantsCount || 0}
                  </span>
                </div>
                <div className="bg-surface-container-lowest p-3 rounded-xl flex flex-col items-center text-center shadow-xs border border-slate-100">
                  <span className="material-symbols-outlined text-primary mb-1 text-[20px]">
                    event_available
                  </span>
                  <span className="font-label-sm text-label-sm text-on-surface-variant">Clôture</span>
                  <span className="font-headline-sm text-headline-sm font-bold text-on-surface">
                    {closingDate}
                  </span>
                </div>
              </div>
            </div>

            {/* COLONNE DROITE: Tarification groupée, Jauge Quota & Call-To-Action */}
            <div className="lg:col-span-6 p-6 sm:p-8 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="font-label-sm text-label-sm tracking-wider uppercase text-primary font-bold">
                    Achat groupé interentreprises & particuliers
                  </span>
                  <span className="font-label-sm text-label-sm bg-primary-fixed text-on-primary-fixed px-3 py-1 rounded-full font-bold">
                    Économie de {savingsPercent}%
                  </span>
                </div>

                <h1 className="font-headline-xl text-headline-xl text-on-surface mb-3 leading-tight">
                  {title}
                </h1>

                <p className="font-body-md text-body-md text-on-surface-variant mb-6">
                  {description}
                </p>

                {/* Comparatif Tarification Négociée */}
                <div className="bg-surface-container-low p-4 rounded-2xl mb-6 flex items-center justify-between flex-wrap gap-3">
                  <div>
                    <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider block">
                      Prix groupé négocié usine
                    </span>
                    <div className="flex items-baseline gap-2">
                      <span className="font-price-xl text-price-xl font-bold text-primary">
                        {UNIT_PRICE.toLocaleString('fr-FR')}
                      </span>
                      <span className="font-label-lg text-label-lg font-bold text-primary">
                        FCFA <span className="text-body-sm font-normal text-on-surface-variant">/ unité</span>
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-label-sm text-label-sm text-outline uppercase block">
                      Prix catalogue solo
                    </span>
                    <span className="font-headline-md text-headline-md line-through text-outline">
                      {ORIGINAL_PRICE.toLocaleString('fr-FR')} FCFA
                    </span>
                  </div>
                </div>

                {/* JAUGE & QUOTA PROGRESSION */}
                <div className="bg-surface-container-lowest p-5 rounded-2xl shadow-xs border border-slate-100 mb-6">
                  <div className="flex justify-between items-end mb-2">
                    <div>
                      <span className="font-headline-md text-headline-md font-bold text-on-surface">
                        {currentUnits} <span className="text-headline-sm font-normal text-on-surface-variant">/ {targetUnits} réservées</span>
                      </span>
                      <span className="ml-2 font-label-md text-label-md font-bold text-primary-container">
                        ({progressPercent}% du lot)
                      </span>
                    </div>
                    <span className={`font-label-sm text-label-sm font-bold px-2.5 py-0.5 rounded-full ${
                      isFull ? 'bg-rose-100 text-rose-800' : 'bg-tertiary-fixed text-tertiary'
                    }`}>
                      {isFull ? 'Complet (0 disponible)' : `Plus que ${availableUnits} unité${availableUnits > 1 ? 's disponibles' : ' disponible'}`}
                    </span>
                  </div>

                  {/* Multi-segment gauge */}
                  <div className="w-full h-3 bg-surface-container-highest rounded-full overflow-hidden flex">
                    <div
                      className={`h-full rounded-full transition-all duration-1000 ease-out ${
                        isFull
                          ? 'bg-rose-500'
                          : 'bg-gradient-to-r from-primary via-primary-container to-secondary-container'
                      }`}
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>

                  {/* Dates Clés */}
                  <div className="grid grid-cols-2 gap-3 mt-4 pt-3 border-t border-surface-container-high/60">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-primary text-[20px]">timer</span>
                      <div className="flex flex-col">
                        <span className="font-label-sm text-label-sm text-on-surface-variant">
                          Date limite de clôture :
                        </span>
                        <span className="font-label-lg text-label-lg font-bold text-on-surface">
                          {closingDate}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-secondary text-[20px]">
                        calendar_month
                      </span>
                      <div className="flex flex-col">
                        <span className="font-label-sm text-label-sm text-on-surface-variant">
                          Livraison estimée Dakar :
                        </span>
                        <span className="font-label-lg text-label-lg font-bold text-on-surface">
                          {groupage?.estimatedArrivalDate ? new Date(groupage.estimatedArrivalDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }) : 'Sous 30 jours'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Micro Assurance */}
              <div className="flex items-center gap-3 text-on-surface-variant font-label-md text-label-md bg-surface-container/50 px-4 py-3 rounded-2xl">
                <span className="material-symbols-outlined text-primary text-[20px] shrink-0">
                  verified_user
                </span>
                <span>
                  {groupage?.guaranteeNote || 'Garantie Dallou Chine : Remboursement automatique 100% sous 24h si le seuil minimum n\'est pas consolidé.'}
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* =================================================================== */}
        {/* SECTION INTERACTIVE : SIMULATEUR DE PARTICIPATION & TIMELINE */}
        {/* =================================================================== */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-10">
          {/* SIMULATEUR DE PARTICIPATION AU GROUPAGE (7 colonnes) */}
          <section className="lg:col-span-7 bg-surface-container-lowest/90 backdrop-blur-xl p-6 sm:p-8 rounded-3xl shadow-sm border border-slate-100 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-6 pb-3 border-b border-surface-container">
                <div className="flex items-center gap-2">
                  <span className="w-8 h-8 rounded-full bg-primary-fixed flex items-center justify-center text-on-primary-fixed">
                    <span className="material-symbols-outlined text-[18px]">calculate</span>
                  </span>
                  <h2 className="font-headline-lg text-headline-lg font-bold text-on-surface">
                    Simulateur de réservation
                  </h2>
                </div>
                <span className="font-label-sm text-label-sm bg-surface-container text-on-surface-variant px-3 py-1 rounded-full">
                  Calcul direct Supabase FCFA
                </span>
              </div>

              {errorMessage && (
                <div className="p-4 mb-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold flex items-center gap-2">
                  <span className="material-symbols-outlined text-rose-600">error</span>
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Sélecteur Quantité Interactive */}
              <div className="bg-surface-container-low p-4 sm:p-5 rounded-2xl mb-5 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  <label className="font-headline-sm text-headline-sm font-bold text-on-surface block">
                    Nombre d'unités à commander
                  </label>
                  <span className="font-body-sm text-body-sm text-on-surface-variant">
                    {isFull
                      ? 'Aucune unité restante sur ce lot'
                      : `Minimum : ${MIN_AVAILABLE} • Disponible : ${availableUnits} unité${availableUnits > 1 ? 's' : ''}`}
                  </span>
                </div>

                <div className="flex items-center bg-surface-container-lowest rounded-full shadow-xs p-1">
                  <button
                    aria-label="Diminuer la quantité"
                    disabled={currentQty <= MIN_AVAILABLE || isFull || isClosed}
                    onClick={() => setCurrentQty(Math.max(MIN_AVAILABLE, currentQty - 1))}
                    className="w-10 h-10 rounded-full flex items-center justify-center bg-surface-container-high hover:bg-surface-container-highest text-on-surface transition-all active:scale-95 disabled:opacity-40 cursor-pointer"
                    type="button"
                  >
                    <span className="material-symbols-outlined text-[18px]">remove</span>
                  </button>
                  <span className="w-14 text-center font-headline-md text-headline-md font-bold text-on-surface">
                    {currentQty}
                  </span>
                  <button
                    aria-label="Augmenter la quantité"
                    disabled={currentQty >= MAX_AVAILABLE || isFull || isClosed}
                    onClick={() => setCurrentQty(Math.min(MAX_AVAILABLE, currentQty + 1))}
                    className="w-10 h-10 rounded-full flex items-center justify-center bg-primary-container text-on-primary hover:bg-secondary-container transition-all active:scale-95 disabled:opacity-40 cursor-pointer"
                    type="button"
                  >
                    <span className="material-symbols-outlined text-[18px]">add</span>
                  </button>
                </div>
              </div>

              {/* Décomposition Transparente des Coûts */}
              <div className="space-y-2 mb-6">
                <div className="flex justify-between items-center py-2 px-1">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[18px] text-on-surface-variant">
                      storefront
                    </span>
                    <span className="font-body-md text-body-md text-on-surface-variant">
                      Prix usine consolidé ({currentQty} unité{currentQty > 1 ? 's' : ''})
                    </span>
                  </div>
                  <span className="font-headline-sm text-headline-sm font-bold text-on-surface">
                    {formatFCFA(subtotal)}
                  </span>
                </div>

                <div className="flex justify-between items-center py-2.5 px-3 rounded-xl bg-primary-fixed/30 text-on-primary-fixed-variant">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[18px] text-primary">
                      pie_chart
                    </span>
                    <span className="font-label-lg text-label-lg font-semibold">
                      Acompte requis aujourd'hui (30%)
                    </span>
                  </div>
                  <span className="font-price-md text-price-md font-bold text-primary">
                    {formatFCFA(deposit)}
                  </span>
                </div>

                <div className="flex justify-between items-center py-2 px-1">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[18px] text-on-surface-variant">
                      account_balance_wallet
                    </span>
                    <span className="font-body-md text-body-md text-on-surface-variant">
                      Solde usine à confirmation du lot (70%)
                    </span>
                  </div>
                  <span className="font-headline-sm text-headline-sm font-semibold text-on-surface">
                    {formatFCFA(balance)}
                  </span>
                </div>

                <div className="flex justify-between items-center py-2 px-1 text-on-surface-variant">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[18px]">local_shipping</span>
                    <span className="font-body-md text-body-md">
                      Fret groupé & manutention portuaire (estimé)
                    </span>
                  </div>
                  <span className="font-headline-sm text-headline-sm text-on-surface">
                    ~{formatFCFA(shipping)}
                  </span>
                </div>
              </div>
            </div>

            <div>
              {/* Bouton CTA principal */}
              <button
                disabled={reserving || isFull || isClosed}
                onClick={handleJoinGroupage}
                className={`w-full h-14 rounded-full text-on-primary font-headline-md text-headline-md font-bold shadow-lg flex items-center justify-center gap-3 transition-all hover:scale-[1.01] active:scale-[0.99] mb-3 cursor-pointer ${
                  isFull || isClosed
                    ? 'bg-slate-400 opacity-60 cursor-not-allowed shadow-none'
                    : 'bg-primary-container hover:bg-secondary-container shadow-primary-container/30'
                }`}
                type="button"
              >
                <span>
                  {reserving
                    ? 'Validation transactionnelle...'
                    : isFull
                    ? 'Groupage Complet'
                    : isClosed
                    ? 'Campagne Fermée'
                    : !currentUser.isLoggedIn
                    ? `Réserver ${currentQty} unité${currentQty > 1 ? 's' : ''} (Inscription rapide)`
                    : `Réserver ${currentQty} unité${currentQty > 1 ? 's' : ''} maintenant`}
                </span>
                <span className="material-symbols-outlined text-[22px]">arrow_forward</span>
              </button>
              <p className="font-label-sm text-label-sm text-center text-on-surface-variant">
                Paiement disponible via Wave Sénégal, Orange Money, Virement Bancaire ou au Desk Dallou Almadies Dakar.
              </p>
            </div>
          </section>


          {/* PANNEAU INFORMATIF : CARACTÉRISTIQUES DU CONTENEUR & CONTRÔLE QUALITÉ (5 colonnes) */}
          <section className="lg:col-span-5 bg-surface-container-lowest/90 backdrop-blur-xl p-6 sm:p-8 rounded-3xl shadow-sm border border-slate-100 flex flex-col justify-between">
            <div>
              <h2 className="font-headline-lg text-headline-lg font-bold text-on-surface mb-2 flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary text-[24px]">inventory_2</span>
                <span>Contrôle & Expédition</span>
              </h2>
              <p className="font-body-md text-body-md text-on-surface-variant mb-5">
                Chaque groupage géré par Dallou Chine fait l'objet d'un processus strict d'inspection en atelier avant l'empotage en conteneur.
              </p>

              <div className="space-y-3">
                <div className="p-3.5 rounded-2xl bg-surface-container-low flex items-start gap-3">
                  <span className="material-symbols-outlined text-primary text-[22px] mt-0.5">
                    assignment_turned_in
                  </span>
                  <div>
                    <h3 className="font-headline-sm text-headline-sm font-bold text-on-surface">
                      Inspection SGS en Chine
                    </h3>
                    <p className="font-body-sm text-body-sm text-on-surface-variant">
                      Tests batterie au banc d'essai, vérification du faisceau étanche et contrôle châssis avant fermeture des scellés.
                    </p>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-surface-container-low flex items-start gap-3">
                  <span className="material-symbols-outlined text-primary text-[22px] mt-0.5">
                    security
                  </span>
                  <div>
                    <h3 className="font-headline-sm text-headline-sm font-bold text-on-surface">
                      Assurance Maritime Globale
                    </h3>
                    <p className="font-body-sm text-body-sm text-on-surface-variant">
                      Tous risques avaries communes couverts à 100% de la valeur déclarée de l'usine jusqu'à quai Dakar.
                    </p>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-surface-container-low flex items-start gap-3">
                  <span className="material-symbols-outlined text-primary text-[22px] mt-0.5">
                    description
                  </span>
                  <div>
                    <h3 className="font-headline-sm text-headline-sm font-bold text-on-surface">
                      Dédouanement Groupé Inclus
                    </h3>
                    <p className="font-body-sm text-body-sm text-on-surface-variant">
                      Dallou Chine prend en charge les formalités de transit et déclaration douanière PAD via notre transitaire agréé.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Support Desk Groupages */}
            <div className="mt-6 pt-4 border-t border-surface-container flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-surface-container-high flex items-center justify-center text-primary">
                  <span className="material-symbols-outlined text-[20px]">support_agent</span>
                </div>
                <div>
                  <span className="font-label-sm text-label-sm text-on-surface-variant block">
                    Besoin d'un conseil ?
                  </span>
                  <span className="font-headline-sm text-headline-sm font-bold text-on-surface">
                    +221 77 000 00 00
                  </span>
                </div>
              </div>

              <a
                href="https://wa.me/221770000000"
                target="_blank"
                rel="noopener noreferrer"
                className="px-3.5 py-1.5 rounded-full bg-surface-container-high hover:bg-surface-container-highest text-on-surface font-label-md text-label-md font-semibold transition-colors"
              >
                WhatsApp Desk
              </a>
            </div>
          </section>
        </div>

        {/* =================================================================== */}
        {/* TIMELINE HORIZONTALE DU CYCLE DE VIE DU GROUPAGE */}
        {/* =================================================================== */}
        <section className="w-full bg-surface-container-lowest/90 backdrop-blur-xl p-6 sm:p-8 rounded-3xl shadow-sm border border-slate-100 mb-10">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
            <div>
              <span className="font-label-sm text-label-sm uppercase tracking-wider text-primary font-bold">
                Transparence logistique de bout en bout
              </span>
              <h2 className="font-headline-lg text-headline-lg font-bold text-on-surface">
                Cycle de vie de votre groupage
              </h2>
            </div>
            <div className="flex items-center gap-2 text-on-surface-variant font-label-md text-label-md">
              <span className="w-2.5 h-2.5 rounded-full bg-primary-container animate-pulse" />
              <span>Étape 1 active actuellement</span>
            </div>
          </div>

          {/* Horizontal Flow Steps */}
          <div className="grid grid-cols-1 md:grid-cols-7 gap-3 relative">
            {/* Étape 1 : Actif */}
            <div className="p-3.5 rounded-2xl bg-primary-fixed/40 flex flex-col justify-between relative overflow-hidden">
              <div className="flex items-center justify-between mb-2">
                <span className="w-7 h-7 rounded-full bg-primary text-on-primary font-bold text-label-md flex items-center justify-center">
                  1
                </span>
                <span className="material-symbols-outlined text-primary text-[18px]">how_to_reg</span>
              </div>
              <div>
                <h3 className="font-headline-sm text-headline-sm font-bold text-on-primary-fixed">
                  Ouvert
                </h3>
                <p className="font-body-sm text-body-sm text-on-primary-fixed-variant mt-0.5">
                  Souscriptions en cours (84%)
                </p>
              </div>
              <div className="mt-3 text-[11px] font-bold text-primary uppercase">En cours</div>
            </div>

            {/* Étape 2 */}
            <div className="p-3.5 rounded-2xl bg-surface-container-low flex flex-col justify-between">
              <div className="flex items-center justify-between mb-2">
                <span className="w-7 h-7 rounded-full bg-surface-container-high text-on-surface-variant font-bold text-label-md flex items-center justify-center">
                  2
                </span>
                <span className="material-symbols-outlined text-outline text-[18px]">lock</span>
              </div>
              <div>
                <h3 className="font-headline-sm text-headline-sm font-semibold text-on-surface">
                  Clôture MOQ
                </h3>
                <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">28 Juin 2026</p>
              </div>
              <div className="mt-3 text-[11px] font-semibold text-outline uppercase">À venir</div>
            </div>

            {/* Étape 3 */}
            <div className="p-3.5 rounded-2xl bg-surface-container-low flex flex-col justify-between">
              <div className="flex items-center justify-between mb-2">
                <span className="w-7 h-7 rounded-full bg-surface-container-high text-on-surface-variant font-bold text-label-md flex items-center justify-center">
                  3
                </span>
                <span className="material-symbols-outlined text-outline text-[18px]">fact_check</span>
              </div>
              <div>
                <h3 className="font-headline-sm text-headline-sm font-semibold text-on-surface">
                  Inspection
                </h3>
                <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">
                  Audit usine Ningbo
                </p>
              </div>
              <div className="mt-3 text-[11px] font-semibold text-outline uppercase">À venir</div>
            </div>

            {/* Étape 4 */}
            <div className="p-3.5 rounded-2xl bg-surface-container-low flex flex-col justify-between">
              <div className="flex items-center justify-between mb-2">
                <span className="w-7 h-7 rounded-full bg-surface-container-high text-on-surface-variant font-bold text-label-md flex items-center justify-center">
                  4
                </span>
                <span className="material-symbols-outlined text-outline text-[18px]">forklift</span>
              </div>
              <div>
                <h3 className="font-headline-sm text-headline-sm font-semibold text-on-surface">
                  Empotage 40HC
                </h3>
                <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">
                  Chargement conteneur
                </p>
              </div>
              <div className="mt-3 text-[11px] font-semibold text-outline uppercase">10 Juil 2026</div>
            </div>

            {/* Étape 5 */}
            <div className="p-3.5 rounded-2xl bg-surface-container-low flex flex-col justify-between">
              <div className="flex items-center justify-between mb-2">
                <span className="w-7 h-7 rounded-full bg-surface-container-high text-on-surface-variant font-bold text-label-md flex items-center justify-center">
                  5
                </span>
                <span className="material-symbols-outlined text-outline text-[18px]">
                  directions_boat
                </span>
              </div>
              <div>
                <h3 className="font-headline-sm text-headline-sm font-semibold text-on-surface">
                  Transit Mer
                </h3>
                <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">
                  32-35 jours de mer
                </p>
              </div>
              <div className="mt-3 text-[11px] font-semibold text-outline uppercase">Traversée</div>
            </div>

            {/* Étape 6 */}
            <div className="p-3.5 rounded-2xl bg-surface-container-low flex flex-col justify-between">
              <div className="flex items-center justify-between mb-2">
                <span className="w-7 h-7 rounded-full bg-surface-container-high text-on-surface-variant font-bold text-label-md flex items-center justify-center">
                  6
                </span>
                <span className="material-symbols-outlined text-outline text-[18px]">anchor</span>
              </div>
              <div>
                <h3 className="font-headline-sm text-headline-sm font-semibold text-on-surface">
                  Douane Dakar
                </h3>
                <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">Formalités PAD</p>
              </div>
              <div className="mt-3 text-[11px] font-semibold text-outline uppercase">~15 Août 2026</div>
            </div>

            {/* Étape 7 */}
            <div className="p-3.5 rounded-2xl bg-surface-container-low flex flex-col justify-between">
              <div className="flex items-center justify-between mb-2">
                <span className="w-7 h-7 rounded-full bg-surface-container-high text-on-surface-variant font-bold text-label-md flex items-center justify-center">
                  7
                </span>
                <span className="material-symbols-outlined text-outline text-[18px]">package_2</span>
              </div>
              <div>
                <h3 className="font-headline-sm text-headline-sm font-semibold text-on-surface">
                  Réception
                </h3>
                <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">
                  Hub Almadies / Domicile
                </p>
              </div>
              <div className="mt-3 text-[11px] font-semibold text-outline uppercase">Livraison</div>
            </div>
          </div>
        </section>

        {/* =================================================================== */}
        {/* SECTION DERNIERS PARTICIPANTS & FAQ COMPACTE */}
        {/* =================================================================== */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-12">
          {/* AVATARS & PARTICIPANTS RÉCENTS (5 colonnes) */}
          <section className="lg:col-span-5 bg-surface-container-lowest/90 backdrop-blur-xl p-6 sm:p-8 rounded-3xl shadow-sm border border-slate-100 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-5">
                <h2 className="font-headline-lg text-headline-lg font-bold text-on-surface flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-[24px]">group</span>
                  <span>Participants récents</span>
                </h2>
                <span className="font-label-sm text-label-sm bg-surface-container px-2.5 py-1 rounded-full text-on-surface font-semibold">
                  Sénégal 🇸🇳
                </span>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-2xl bg-surface-container-low">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary-fixed flex items-center justify-center font-bold text-on-primary-fixed">
                      AD
                    </div>
                    <div>
                      <span className="font-headline-sm text-headline-sm font-bold text-on-surface block">
                        Amadou D.
                      </span>
                      <span className="font-body-sm text-body-sm text-on-surface-variant">
                        Dakar Plateau
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-label-lg text-label-lg font-bold text-primary block">
                      2 unités
                    </span>
                    <span className="font-label-sm text-label-sm text-outline">Il y a 3h</span>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 rounded-2xl bg-surface-container-low">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-secondary-fixed flex items-center justify-center font-bold text-on-secondary-fixed">
                      KL
                    </div>
                    <div>
                      <span className="font-headline-sm text-headline-sm font-bold text-on-surface block">
                        Société K. Logistics SARL
                      </span>
                      <span className="font-body-sm text-body-sm text-on-surface-variant">
                        Parc Flotte Livraison
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-label-lg text-label-lg font-bold text-primary block">
                      5 unités
                    </span>
                    <span className="font-label-sm text-label-sm text-outline">Hier</span>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 rounded-2xl bg-surface-container-low">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-surface-container-high flex items-center justify-center font-bold text-on-surface">
                      MS
                    </div>
                    <div>
                      <span className="font-headline-sm text-headline-sm font-bold text-on-surface block">
                        Moustapha S.
                      </span>
                      <span className="font-body-sm text-body-sm text-on-surface-variant">Thiès</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-label-lg text-label-lg font-bold text-primary block">
                      1 unité
                    </span>
                    <span className="font-label-sm text-label-sm text-outline">Il y a 2 jours</span>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 rounded-2xl bg-surface-container-low">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-surface-container-high flex items-center justify-center font-bold text-on-surface">
                      FN
                    </div>
                    <div>
                      <span className="font-headline-sm text-headline-sm font-bold text-on-surface block">
                        Fatou N.
                      </span>
                      <span className="font-body-sm text-body-sm text-on-surface-variant">
                        Almadies
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-label-lg text-label-lg font-bold text-primary block">
                      2 unités
                    </span>
                    <span className="font-label-sm text-label-sm text-outline">Il y a 3 jours</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-5 p-3 rounded-2xl bg-surface-container text-center">
              <span className="font-label-md text-label-md text-on-surface-variant font-medium">
                Rejoignez les 18 acheteurs déjà inscrits sur ce lot.
              </span>
            </div>
          </section>

          {/* FAQ GROUPAGES DALLOU CHINE (7 colonnes) */}
          <section className="lg:col-span-7 bg-surface-container-lowest/90 backdrop-blur-xl p-6 sm:p-8 rounded-3xl shadow-sm border border-slate-100 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-5">
                <h2 className="font-headline-lg text-headline-lg font-bold text-on-surface flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-[24px]">quiz</span>
                  <span>Questions fréquentes sur ce groupage</span>
                </h2>
              </div>

              <div className="space-y-3">
                {[
                  {
                    q: 'Que se passe-t-il si les 50 unités ne sont pas atteintes ?',
                    a: "Si à la date de clôture le quota minimum n'est pas rempli, Dallou Chine vous rembourse intégralement l'acompte sous 24h ouvrées sur votre compte initial (Wave/OM/Banque), sans aucune retenue de frais administratifs."
                  },
                  {
                    q: 'Les motos sont-elles livrées prêtes à rouler avec carte grise ?',
                    a: "Les véhicules sont livrés dédouanés au Port de Dakar avec le certificat de conformité constructeur et la quittance douanière. Notre service administratif aux Almadies peut se charger de l'immatriculation sénégalaise en option."
                  },
                  {
                    q: 'Quelle est la garantie sur la batterie et le moteur ?',
                    a: 'Le lot négocié intègre une garantie constructeur pièces de 12 mois sur la batterie LFP et le moteur brushless. Un stock de pièces détachées de rechange (contrôleurs, pneus, chargeurs rapides) est importé dans le même conteneur.'
                  },
                  {
                    q: 'Comment suivre mon conteneur après le départ de Chine ?',
                    a: "Dès l'empotage à Ningbo, un numéro de connaissement maritime (Bill of Lading) et un lien de tracking satellite en direct sont injectés dans votre espace client Dallou Chine et transmis par SMS/WhatsApp."
                  }
                ].map((item, idx) => {
                  const isOpen = activeFaq === idx;
                  return (
                    <div
                      key={idx}
                      className="bg-surface-container-low p-4 rounded-2xl cursor-pointer transition-all border border-slate-100"
                      onClick={() => toggleFaq(idx)}
                    >
                      <div className="flex items-center justify-between font-headline-sm text-headline-sm font-bold text-on-surface select-none">
                        <span>{item.q}</span>
                        <span
                          className={`material-symbols-outlined transition-transform duration-300 text-primary ${
                            isOpen ? 'rotate-180' : ''
                          }`}
                        >
                          expand_more
                        </span>
                      </div>
                      {isOpen && (
                        <p className="font-body-md text-body-md text-on-surface-variant mt-2.5 pt-2 border-t border-slate-200/60 leading-relaxed">
                          {item.a}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-surface-container flex items-center justify-between flex-wrap gap-2">
              <span className="font-body-sm text-body-sm text-on-surface-variant">
                Une question spécifique relative à ce modèle ?
              </span>
              <button
                onClick={() => navigate('/products/moto-electrique-urbaine-72v-3000w')}
                className="font-label-lg text-label-lg font-bold text-primary hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>Consulter la fiche technique complète</span>
                <span className="material-symbols-outlined text-[16px]">arrow_outward</span>
              </button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default GroupageDetailPage;
