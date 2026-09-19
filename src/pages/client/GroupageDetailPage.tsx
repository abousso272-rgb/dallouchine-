import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';

export const GroupageDetailPage: React.FC<{ id?: string }> = () => {
  const { navigate, addToCart, products } = useApp();

  // Quantity for calculation (Max 8 available)
  const [currentQty, setCurrentQty] = useState(1);
  const [activeFaq, setActiveFaq] = useState<number | null>(null);
  const [showNotification, setShowNotification] = useState(false);

  const UNIT_PRICE = 480000;
  const DEPOSIT_RATE = 0.30;
  const BALANCE_RATE = 0.70;
  const ESTIMATED_SHIPPING_PER_UNIT = 115000;
  const MAX_AVAILABLE = 8;
  const MIN_AVAILABLE = 1;

  const subtotal = currentQty * UNIT_PRICE;
  const deposit = subtotal * DEPOSIT_RATE;
  const balance = subtotal * BALANCE_RATE;
  const shipping = currentQty * ESTIMATED_SHIPPING_PER_UNIT;

  const formatFCFA = (num: number) => {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + ' FCFA';
  };

  const handleJoinGroupage = () => {
    const motoProduct = products.find(p => p.id === 'prod-moto') || products[0];
    addToCart(
      {
        ...motoProduct,
        name: `Réservation Groupage : Moto Électrique 2000W (${currentQty} unité${currentQty > 1 ? 's' : ''})`,
        priceXOF: deposit
      },
      currentQty,
      true,
      'grp-moto'
    );
    setShowNotification(true);
    setTimeout(() => {
      setShowNotification(false);
      navigate('/checkout');
    }, 1200);
  };

  const toggleFaq = (index: number) => {
    setActiveFaq(activeFaq === index ? null : index);
  };

  return (
    <div className="flex flex-col w-full">
      {/* Toast Notification */}
      {showNotification && (
        <div className="fixed top-24 right-4 sm:right-8 z-50 bg-[#141c24] text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 border border-orange-500/30 animate-in fade-in slide-in-from-top-4 duration-300">
          <span className="material-symbols-outlined text-[#ff8a00] text-2xl">check_circle</span>
          <div>
            <div className="font-bold text-sm">Réservation confirmée !</div>
            <div className="text-xs text-slate-300">
              Acompte de {formatFCFA(deposit)} ({currentQty} unité{currentQty > 1 ? 's' : ''})
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
          <button
            onClick={() => navigate('/products?cat=Auto%20%26%20Mobilit%C3%A9')}
            className="hover:text-primary transition-colors cursor-pointer"
          >
            Auto & Mobilité
          </button>
          <span className="material-symbols-outlined text-[14px] text-outline-variant">chevron_right</span>
          <span className="text-on-surface font-bold bg-surface-container-high px-2.5 py-0.5 rounded-full">
            #GRP-2026-MOTO
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
                  alt="Moto électrique 2000W haute autonomie conteneur Dakar"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuDlQqylgoGw2WXN3dA57e5MsqhuwQnXZfr5y_qz6GcxxAar95GZk8_wUhLyroMi8_8YTaNfdQrGv-g2-rl952OPHwEVkN5y_IHBYtaCfCOuB2sdHCnl-Cw5bxTXMx6ekmenml_xG_n5XvjWBvGtt2FlDTJaaisEoNVcwrtNxi6yC_ojrPX7-x4smQ93uysmEVjPwoee7ECi2IV_eMx2LJJf2qsdskmWSyadLMXlET3XXk7dCTMK5dNvjg"
                />

                {/* Badges overlay */}
                <div className="absolute top-4 left-4 flex flex-wrap gap-2">
                  <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-tertiary-container/95 text-on-tertiary text-label-sm font-label-sm uppercase tracking-wider backdrop-blur-md shadow-sm">
                    <span className="w-2 h-2 rounded-full bg-on-tertiary animate-ping" />
                    En cours — Dernières places
                  </span>
                  <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-inverse-surface/90 text-inverse-on-surface text-label-sm font-label-sm">
                    <span className="material-symbols-outlined text-[14px] text-primary-container">
                      verified
                    </span>
                    Audit SGS Usine Chine
                  </span>
                </div>

                <div className="absolute bottom-4 left-4 right-4 bg-surface-container-lowest/90 backdrop-blur-md p-3 rounded-xl flex items-center justify-between shadow-sm">
                  <div className="flex items-center gap-2.5">
                    <span className="material-symbols-outlined text-primary-container text-[22px]">
                      directions_boat
                    </span>
                    <div className="flex flex-col">
                      <span className="font-label-sm text-label-sm font-bold text-on-surface">
                        Conteneur 40HC Dédié Dakar
                      </span>
                      <span className="font-body-sm text-body-sm text-on-surface-variant">
                        Port Ningbo-Zhoushan 🇨🇳 → PAD Sénégal 🇸🇳
                      </span>
                    </div>
                  </div>
                  <span className="font-label-sm text-label-sm bg-surface-container-high px-2.5 py-1 rounded-full text-on-surface font-semibold">
                    Fret direct
                  </span>
                </div>
              </div>

              {/* Puces logistiques certifiées */}
              <div className="grid grid-cols-3 gap-2 sm:gap-3">
                <div className="bg-surface-container-lowest p-3 rounded-xl flex flex-col items-center text-center shadow-xs border border-slate-100">
                  <span className="material-symbols-outlined text-primary mb-1 text-[20px]">
                    electric_bolt
                  </span>
                  <span className="font-label-sm text-label-sm text-on-surface-variant">Puissance</span>
                  <span className="font-headline-sm text-headline-sm font-bold text-on-surface">
                    2000W Brushless
                  </span>
                </div>
                <div className="bg-surface-container-lowest p-3 rounded-xl flex flex-col items-center text-center shadow-xs border border-slate-100">
                  <span className="material-symbols-outlined text-primary mb-1 text-[20px]">
                    battery_charging_full
                  </span>
                  <span className="font-label-sm text-label-sm text-on-surface-variant">
                    Batterie Amovible
                  </span>
                  <span className="font-headline-sm text-headline-sm font-bold text-on-surface">
                    72V 35Ah LFP
                  </span>
                </div>
                <div className="bg-surface-container-lowest p-3 rounded-xl flex flex-col items-center text-center shadow-xs border border-slate-100">
                  <span className="material-symbols-outlined text-primary mb-1 text-[20px]">
                    speed
                  </span>
                  <span className="font-label-sm text-label-sm text-on-surface-variant">Autonomie</span>
                  <span className="font-headline-sm text-headline-sm font-bold text-on-surface">
                    85 - 100 km
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
                    Économie de 26%
                  </span>
                </div>

                <h1 className="font-headline-xl text-headline-xl text-on-surface mb-3 leading-tight">
                  Groupage Spécial : Moto électrique 2000W haute autonomie
                </h1>

                <p className="font-body-md text-body-md text-on-surface-variant mb-6">
                  Groupage sécurisé pour livraison groupée au Port Autonome de Dakar. Véhicule homologué, batterie interchangeable Lithium Phosphate haute résistance à la chaleur sahélienne.
                </p>

                {/* Comparatif Tarification Négociée */}
                <div className="bg-surface-container-low p-4 rounded-2xl mb-6 flex items-center justify-between flex-wrap gap-3">
                  <div>
                    <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider block">
                      Prix groupé négocié usine
                    </span>
                    <div className="flex items-baseline gap-2">
                      <span className="font-price-xl text-price-xl font-bold text-primary">
                        480 000
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
                      650 000 FCFA
                    </span>
                  </div>
                </div>

                {/* JAUGE & QUOTA PROGRESSION */}
                <div className="bg-surface-container-lowest p-5 rounded-2xl shadow-xs border border-slate-100 mb-6">
                  <div className="flex justify-between items-end mb-2">
                    <div>
                      <span className="font-headline-md text-headline-md font-bold text-on-surface">
                        42 <span className="text-headline-sm font-normal text-on-surface-variant">/ 50 réservées</span>
                      </span>
                      <span className="ml-2 font-label-md text-label-md font-bold text-primary-container">
                        (84% du MOQ atteint)
                      </span>
                    </div>
                    <span className="font-label-sm text-label-sm text-tertiary font-bold bg-tertiary-fixed px-2.5 py-0.5 rounded-full">
                      Plus que 8 unités disponibles
                    </span>
                  </div>

                  {/* Multi-segment gauge */}
                  <div className="w-full h-3 bg-surface-container-highest rounded-full overflow-hidden flex">
                    <div
                      className="h-full bg-gradient-to-r from-primary via-primary-container to-secondary-container rounded-full transition-all duration-1000 ease-out"
                      style={{ width: '84%' }}
                    />
                  </div>

                  {/* Dates Clés */}
                  <div className="grid grid-cols-2 gap-3 mt-4 pt-3 border-t border-surface-container-high/60">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-primary text-[20px]">timer</span>
                      <div className="flex flex-col">
                        <span className="font-label-sm text-label-sm text-on-surface-variant">
                          Clôture souscriptions :
                        </span>
                        <span className="font-label-lg text-label-lg font-bold text-on-surface">
                          Dans 4 jours (28 Juin 2026)
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-secondary text-[20px]">
                        calendar_month
                      </span>
                      <div className="flex flex-col">
                        <span className="font-label-sm text-label-sm text-on-surface-variant">
                          ETA estimée Dakar :
                        </span>
                        <span className="font-label-lg text-label-lg font-bold text-on-surface">
                          ~15 Août 2026
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
                  Garantie Dallou Chine : Remboursement automatique 100% sous 24h si le seuil minimum n'est pas consolidé.
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
                  Calcul en direct FCFA
                </span>
              </div>

              {/* Sélecteur Quantité Interactive */}
              <div className="bg-surface-container-low p-4 sm:p-5 rounded-2xl mb-5 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  <label className="font-headline-sm text-headline-sm font-bold text-on-surface block">
                    Nombre d'unités à commander
                  </label>
                  <span className="font-body-sm text-body-sm text-on-surface-variant">
                    Maximum 8 unités disponibles sur ce conteneur
                  </span>
                </div>

                <div className="flex items-center bg-surface-container-lowest rounded-full shadow-xs p-1">
                  <button
                    aria-label="Diminuer la quantité"
                    disabled={currentQty <= MIN_AVAILABLE}
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
                    disabled={currentQty >= MAX_AVAILABLE}
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
                      Solde usine à confirmation du MOQ (70%)
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
                      Fret maritime groupé & manutention portuaire (estimé)
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
                onClick={handleJoinGroupage}
                className="w-full h-14 rounded-full bg-primary-container hover:bg-secondary-container text-on-primary font-headline-md text-headline-md font-bold shadow-lg shadow-primary-container/30 flex items-center justify-center gap-3 transition-all hover:scale-[1.01] active:scale-[0.99] mb-3 cursor-pointer"
                type="button"
              >
                <span>Rejoindre ce groupage maintenant</span>
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
