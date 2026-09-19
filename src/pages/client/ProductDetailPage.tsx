import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';

interface ProductDetailPageProps {
  slug?: string;
}

export const ProductDetailPage: React.FC<ProductDetailPageProps> = () => {
  const { navigate, addToCart, products } = useApp();

  const [activeThumb, setActiveThumb] = useState(0);
  const [selectedColor, setSelectedColor] = useState('Blanc Nacré');
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState(0);
  const [notification, setNotification] = useState<string | null>(null);

  const images = [
    {
      label: 'Vue de profil studio',
      tag: 'Profil',
      src: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC4R1YEyKlm5SuqW41sZ7W5Bar2AkMSIzvWGEbcFLkE0JYoXtGeg2wzFM7G9S_WtwPvC0wx2itsN0WD8t-70-v-hZcptUMUCYDQ7xnGccSfDBRrMKvKs6O5pmUJrwGxrPQu4tnXxZk_wSsMHiLFmTBDX1fWw5v5s0FFzMgRrxd-Fubq4_B4hYIpCWX7erUTvvouh2DBs3YWCZVlLVUtmDRB91NXFBiynkQentcc91sLFESjY5pk9QLP2A'
    },
    {
      label: 'Cockpit LED',
      tag: 'Cockpit LED',
      src: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCM3Fwk7umGrOrb06kl4Srn42itiKH322fH4blnhPLI_fR8-ZCMZU9KPEFkfm4MJyUidRO-AewEdpHalg3gpd4BkKeJapRQdvaNU86Sjt0OEVGASDwNfH59R3cKNvPolvGaFECuO-KruAwSQs7uIduEcQaDaniSABYxiT6YSJgwVQ-qXUI3djWJ8zDh9FK1NzFOSxgF9WXXNQ6q7XORnen1oO-eclr7KFM7I2gm2_tBvNPCmchL9hfX6g'
    },
    {
      label: 'Batterie Lithium Amovible',
      tag: 'Batterie LiFe',
      src: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDi3eJN7ZePnuSo4FPjrtQbDhwhwYuT8UM-P45HIt2lX2pcclJNIw5ekVEGrTvX3irvO9gdtrvqDhZp2pSlTsIcw9slKUy2FZj-Alt_CSZzbvl6y4KSV_rU_xr-7nHXdKhyRCN_V6E53wpbHT3e2TOe4uMP7Z0kAdJHJp4j-GGHDH0BxXlJRvgkXvhEC0XTryWHDL2xbwJZfRAqhntDQ9KJAQRxdJ1F-weHAO7RmhLKC8tGRBgv-j1Czw'
    },
    {
      label: 'Conditionnement caisse export',
      tag: 'Caisse Export',
      src: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBKkFm0B8J0JvK8Hmd6RUVpHwmmpQO5J7ANtZX4gMlrQ9RvuZN_VfIJD9SOL1gKXP9Plz7BPdwqe5FxKnYfO0QsMcpcw7bNy9OUqdGHiAvS58ZgFKBKpHVuBwN3w7vQaZjkXYpgKo9HeGNIPTYo6Hbg0eJ4VSkV03kb7IWkqDvdwM91R0t2Bq0pwgJrw6nq13qWGM-SUvDHv1mfR_2lFsjngqP_1pE0-giJpdplCYfLpAnTxjV8G0vJOg'
    }
  ];

  const motoProduct = products.find(p => p.id === 'prod-moto') || products[0];

  const handleOrder = () => {
    addToCart(
      {
        ...motoProduct,
        name: `Moto électrique 2000W (${selectedColor})`,
        priceXOF: 480000
      },
      quantity,
      false
    );
    setNotification('Produit ajouté au panier !');
    setTimeout(() => {
      setNotification(null);
      navigate('/cart');
    }, 900);
  };

  const handleJoinGroupage = () => {
    navigate('/groupages/grp-moto');
  };

  return (
    <div className="flex flex-col w-full">
      {/* Dynamic Toast */}
      {notification && (
        <div className="fixed top-24 right-4 sm:right-8 z-50 bg-[#141c24] text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 border border-orange-500/30">
          <span className="material-symbols-outlined text-[#ff8a00] text-2xl">check_circle</span>
          <span className="font-bold text-sm">{notification}</span>
        </div>
      )}

      {/* Dynamic Atmospheric Underlay Decor */}
      <div className="relative w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        {/* Breadcrumb Navigation */}
        <nav className="flex items-center space-x-2 text-on-surface-variant font-label-md text-label-md mb-8 flex-wrap">
          <button
            onClick={() => navigate('/')}
            className="hover:text-primary transition-colors flex items-center gap-1 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px]">home</span>
            <span>Accueil</span>
          </button>
          <span className="text-outline-variant font-bold">/</span>
          <button
            onClick={() => navigate('/products')}
            className="hover:text-primary transition-colors cursor-pointer"
          >
            Marketplace
          </button>
          <span className="text-outline-variant font-bold">/</span>
          <button
            onClick={() => navigate('/products?cat=Auto%20%26%20Mobilit%C3%A9')}
            className="hover:text-primary transition-colors cursor-pointer"
          >
            Auto & Mobilité
          </button>
          <span className="text-outline-variant font-bold">/</span>
          <span className="text-on-surface font-bold">Moto électrique 2000W</span>
        </nav>

        {/* Main Product Grid: 2 High-End Asymmetrical Columns */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          {/* LEFT COLUMN: High-Gloss Media Gallery & Freight Badges */}
          <div className="lg:col-span-6 xl:col-span-7 flex flex-col space-y-6 lg:sticky lg:top-28">
            {/* Primary Display Canvas with Liquid Glass Finish */}
            <div className="relative w-full aspect-[4/3] sm:aspect-[16/11] rounded-3xl overflow-hidden bg-surface-container-lowest/80 backdrop-blur-xl shadow-[0_20px_50px_-12px_rgba(16,24,32,0.08)] flex items-center justify-center p-6 group border border-slate-100">
              {/* Ambient lighting reflection inside glass container */}
              <div className="absolute -top-24 -left-24 w-80 h-80 bg-primary-container/15 rounded-full blur-2xl pointer-events-none" />
              <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/80 to-transparent" />

              {/* Main Product Image */}
              <img
                alt="Moto électrique 2000W - Sourcing Chine vers Afrique de l'Ouest"
                className="w-full h-full object-contain object-center transition-all duration-500 transform group-hover:scale-105"
                src={images[activeThumb].src}
              />

              {/* Floating Badges Layered on Visual */}
              <div className="absolute top-5 left-5 flex flex-col gap-2.5 z-20 pointer-events-none">
                <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-surface-container-lowest/90 backdrop-blur-md shadow-md text-on-surface font-label-sm text-label-sm tracking-wide">
                  <span className="w-2 h-2 rounded-full bg-primary-container animate-pulse" />
                  <span className="font-bold">100% Électrique & Certifié CE</span>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-container-high/90 backdrop-blur-md text-on-surface-variant font-label-sm text-label-sm">
                  <span className="material-symbols-outlined text-[16px] text-primary">verified</span>
                  <span>Usine Auditée Jiangsu</span>
                </div>
              </div>

              <div className="absolute bottom-5 right-5 z-20">
                <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-inverse-surface/90 text-inverse-on-surface backdrop-blur-md shadow-lg font-label-sm text-label-sm">
                  <span className="material-symbols-outlined text-[18px] text-primary-fixed-dim">
                    sailing
                  </span>
                  <span>Option Fret Maritime / Aérien Dakar</span>
                </div>
              </div>

              {/* Magnifier / Fullscreen quick trigger */}
              <button
                aria-label="Agrandir la vue"
                className="absolute top-5 right-5 w-10 h-10 rounded-full bg-surface-container-lowest/80 backdrop-blur-md hover:bg-white text-on-surface flex items-center justify-center shadow-md transition-transform hover:scale-110 cursor-pointer"
                type="button"
                onClick={() => setActiveThumb((activeThumb + 1) % images.length)}
              >
                <span className="material-symbols-outlined text-[20px]">fullscreen</span>
              </button>
            </div>

            {/* Interactive 4-Thumbnail Reel */}
            <div className="grid grid-cols-4 gap-3 sm:gap-4">
              {images.map((thumb, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveThumb(idx)}
                  className={`group relative aspect-square rounded-2xl overflow-hidden bg-surface-container-lowest shadow-sm hover:shadow-md transition-all p-2 cursor-pointer border ${
                    activeThumb === idx
                      ? 'border-primary-container bg-gradient-to-b from-surface-container-lowest to-surface-container-low ring-2 ring-primary-container/20'
                      : 'border-slate-100 hover:border-slate-300'
                  }`}
                  type="button"
                >
                  <img alt={thumb.tag} className="w-full h-full object-contain" src={thumb.src} />
                  {activeThumb === idx && (
                    <div className="absolute inset-0 bg-primary-container/10 pointer-events-none rounded-2xl" />
                  )}
                  <span className="absolute bottom-1.5 inset-x-1 truncate text-center font-label-sm text-[10px] text-on-surface font-semibold bg-surface-container-lowest/80 rounded-md py-0.5">
                    {thumb.tag}
                  </span>
                </button>
              ))}
            </div>

            {/* Micro Assurance Strip */}
            <div className="grid grid-cols-3 gap-3 p-4 rounded-2xl bg-surface-container-low/70 border border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-primary-container/20 text-primary flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[18px]">verified_user</span>
                </div>
                <div className="flex flex-col">
                  <span className="font-label-sm text-label-sm font-bold text-on-surface">
                    Audit Usine
                  </span>
                  <span className="font-body-sm text-[11px] text-on-surface-variant leading-tight">
                    Vérifié sur site
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-primary-container/20 text-primary flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[18px]">inventory</span>
                </div>
                <div className="flex flex-col">
                  <span className="font-label-sm text-label-sm font-bold text-on-surface">
                    Emballage Pro
                  </span>
                  <span className="font-body-sm text-[11px] text-on-surface-variant leading-tight">
                    Châssis acier scellé
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-primary-container/20 text-primary flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[18px]">hub</span>
                </div>
                <div className="flex flex-col">
                  <span className="font-label-sm text-label-sm font-bold text-on-surface">
                    Hub Almadies
                  </span>
                  <span className="font-body-sm text-[11px] text-on-surface-variant leading-tight">
                    Retrait sécurisé
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Pricing, Real-time Groupage Status, Customization & Orders */}
          <div className="lg:col-span-6 xl:col-span-5 flex flex-col space-y-6">
            {/* Title & Identification Area */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-3 py-1 rounded-full bg-secondary-fixed text-on-secondary-fixed-variant font-label-sm text-label-sm font-bold uppercase tracking-wider">
                  Auto & Mobilité — Deux-roues
                </span>
                <span className="font-label-md text-label-md text-on-surface-variant">
                  Réf: <strong className="text-on-surface">DC-MOTO-2000X</strong>
                </span>
                <span className="text-outline-variant">•</span>
                <span className="font-label-md text-label-md text-on-surface-variant flex items-center gap-1">
                  <span className="material-symbols-outlined text-[15px] text-primary">factory</span>
                  Usine certifiée Jiangsu
                </span>
              </div>
              <h1 className="font-headline-xl text-headline-xl text-on-surface font-extrabold tracking-tight">
                Moto électrique 2000W — Haute autonomie urbaine
              </h1>
              <p className="font-body-md text-body-md text-on-surface-variant">
                Solution idéale pour les flottes de livraison urbaines, mototaxis écologiques et trajets quotidiens à Dakar. Zéro carburant, maintenance quasi nulle.
              </p>
            </div>

            {/* Transparent Pricing & Consolidated Groupage Card (Liquid Glass) */}
            <div className="p-6 rounded-3xl bg-surface-container-lowest/90 backdrop-blur-2xl shadow-[0_16px_40px_-10px_rgba(16,24,32,0.06)] space-y-6 relative overflow-hidden border border-slate-100">
              {/* Glass Top Highlight Line */}
              <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white to-transparent" />

              {/* Price Header & MOQ Tag */}
              <div className="flex items-baseline justify-between gap-4 border-b border-surface-container-high/60 pb-5">
                <div>
                  <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wide block font-semibold">
                    Prix usine unitaire brut
                  </span>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="font-price-xl text-price-xl font-black text-on-surface tracking-tight">
                      480 000
                    </span>
                    <span className="font-headline-sm text-headline-sm font-bold text-primary">
                      FCFA
                    </span>
                  </div>
                  <span className="font-body-sm text-[12px] text-on-surface-variant">
                    ≈ 730 € / ~790 USD départ usine
                  </span>
                </div>
                <div className="flex flex-col items-end">
                  <span className="px-3 py-1 rounded-full bg-inverse-surface text-inverse-on-surface font-label-sm text-label-sm font-bold flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary-container" />
                    MOQ Usine : 5 unités
                  </span>
                  <span className="font-label-sm text-label-sm text-secondary font-semibold mt-1">
                    Disponible à l'unité en groupage
                  </span>
                </div>
              </div>

              {/* Groupage Status & Visual Progress Bar */}
              <div className="p-4 rounded-2xl bg-surface-container-low/90 space-y-2.5">
                <div className="flex items-center justify-between text-on-surface font-label-md text-label-md">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-primary-container animate-ping" />
                    <span className="font-bold text-on-surface">Groupage ouvert (Reste 8 places)</span>
                  </div>
                  <span className="font-bold text-primary">84% réservé</span>
                </div>
                {/* Custom Progress Gauge */}
                <div className="w-full h-2 rounded-full bg-surface-container-highest overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-primary to-primary-container rounded-full transition-all duration-1000"
                    style={{ width: '84%' }}
                  />
                </div>
                <div className="flex items-center justify-between font-label-sm text-label-sm text-on-surface-variant">
                  <span>
                    Départ Ningbo : <strong>12 Nov 2025</strong>
                  </span>
                  <span>
                    Arrivée estimée Dakar : <strong>18 Déc 2025</strong>
                  </span>
                </div>
              </div>

              {/* Transparent Breakdown of Costs (Dallou Chine Core Value) */}
              <div className="space-y-3 pt-1">
                <span className="font-label-md text-label-md font-bold text-on-surface uppercase tracking-wide block">
                  Décomposition des coûts & Transparence logistique
                </span>
                <div className="space-y-2.5 font-body-sm text-body-sm">
                  {/* Item 1: Confirmed */}
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-surface-container-lowest shadow-xs border border-slate-100">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-[18px] text-primary">
                        precision_manufacturing
                      </span>
                      <span className="text-on-surface font-medium">Prix matériel usine</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-on-surface">480 000 FCFA</span>
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-label-sm text-[11px] font-bold flex items-center gap-1">
                        <span className="material-symbols-outlined text-[13px]">check_circle</span>
                        CONFIRMÉ
                      </span>
                    </div>
                  </div>

                  {/* Item 2: Estimated */}
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-surface-container-lowest shadow-xs border border-slate-100">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-[18px] text-primary">
                        directions_boat
                      </span>
                      <span className="text-on-surface font-medium">
                        Fret maritime & assurance (Guangzhou → Dakar)
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-on-surface">
                        ~115 000 FCFA <span className="font-normal text-[11px] text-on-surface-variant">/ unité</span>
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 font-label-sm text-[11px] font-bold flex items-center gap-1">
                        <span className="material-symbols-outlined text-[13px]">schedule</span>
                        ESTIMATIF
                      </span>
                    </div>
                  </div>

                  {/* Item 3: To Be Confirmed */}
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-surface-container-lowest shadow-xs border border-slate-100">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-[18px] text-primary">
                        account_balance
                      </span>
                      <span className="text-on-surface font-medium">
                        Dédouanement et taxes locales Dakar
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-medium text-on-surface">Selon formule choisie</span>
                      <span className="px-2.5 py-0.5 rounded-full bg-surface-container-high text-on-surface-variant font-label-sm text-[11px] font-bold flex items-center gap-1">
                        <span className="material-symbols-outlined text-[13px]">help_outline</span>
                        À CONFIRMER
                      </span>
                    </div>
                  </div>
                </div>

                {/* Trust Note */}
                <p className="font-body-sm text-[12px] text-on-surface-variant italic bg-surface-container-low/50 p-2.5 rounded-xl flex items-start gap-2">
                  <span className="material-symbols-outlined text-[16px] text-primary mt-0.5 shrink-0">
                    info
                  </span>
                  <span>
                    Le coût logistique définitif dépend du volume total consolidé et des formalités douanières choisies (Dakar Port autonome ou dédouanement tout compris).
                  </span>
                </p>
              </div>

              {/* Color & Branding Customizer */}
              <div className="pt-2 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-label-md text-label-md font-bold text-on-surface">
                    Sélectionnez la couleur usine :
                  </span>
                  <span className="font-label-md text-label-md text-primary font-semibold">
                    {selectedColor}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  {/* Option 1: Blanc Nacré */}
                  <button
                    className={`relative w-11 h-11 rounded-full bg-white shadow-md flex items-center justify-center p-0.5 transition-all cursor-pointer ${
                      selectedColor === 'Blanc Nacré' ? 'scale-105 ring-2 ring-primary' : 'hover:scale-105'
                    }`}
                    onClick={() => setSelectedColor('Blanc Nacré')}
                    title="Blanc Nacré"
                    type="button"
                  >
                    <span className="w-full h-full rounded-full bg-slate-100 shadow-inner flex items-center justify-center">
                      {selectedColor === 'Blanc Nacré' && (
                        <span className="material-symbols-outlined text-[16px] text-primary font-bold">
                          check
                        </span>
                      )}
                    </span>
                  </button>

                  {/* Option 2: Noir Mat */}
                  <button
                    className={`relative w-11 h-11 rounded-full bg-surface-dim flex items-center justify-center p-0.5 transition-all cursor-pointer ${
                      selectedColor === 'Noir Mat' ? 'scale-105 ring-2 ring-primary' : 'hover:scale-105'
                    }`}
                    onClick={() => setSelectedColor('Noir Mat')}
                    title="Noir Mat"
                    type="button"
                  >
                    <span className="w-full h-full rounded-full bg-[#1b2229] shadow-inner flex items-center justify-center">
                      {selectedColor === 'Noir Mat' && (
                        <span className="material-symbols-outlined text-[16px] text-white font-bold">
                          check
                        </span>
                      )}
                    </span>
                  </button>

                  {/* Option 3: Orange Dallou Signature */}
                  <button
                    className={`relative w-11 h-11 rounded-full bg-primary-container flex items-center justify-center p-0.5 shadow-[0_4px_12px_rgba(255,138,0,0.3)] transition-all cursor-pointer ${
                      selectedColor === 'Orange Dallou Signature' ? 'scale-105 ring-2 ring-[#0B192C]' : 'hover:scale-105'
                    }`}
                    onClick={() => setSelectedColor('Orange Dallou Signature')}
                    title="Orange Dallou Signature"
                    type="button"
                  >
                    <span className="w-full h-full rounded-full bg-gradient-to-tr from-secondary-container to-primary-container flex items-center justify-center">
                      {selectedColor === 'Orange Dallou Signature' && (
                        <span className="material-symbols-outlined text-[16px] text-white font-bold">
                          check
                        </span>
                      )}
                    </span>
                  </button>

                  {/* Branding Option Badge */}
                  <div className="ml-auto px-3 py-1.5 rounded-xl bg-surface-container-high/60 text-on-surface font-label-sm text-[11px] font-semibold flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[15px] text-secondary">
                      branding_watermark
                    </span>
                    <span>Logo revendeur dès 10 unités</span>
                  </div>
                </div>
              </div>

              {/* Quantity Selector & Action Controls */}
              <div className="pt-3 space-y-3">
                <div className="flex items-center gap-3">
                  {/* Counter Pill */}
                  <div className="h-12 px-3 rounded-full bg-surface-container flex items-center justify-between gap-4">
                    <button
                      className="w-8 h-8 rounded-full bg-surface-container-lowest text-on-surface hover:bg-white flex items-center justify-center font-bold shadow-xs transition-transform active:scale-95 cursor-pointer"
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      type="button"
                    >
                      -
                    </button>
                    <span className="font-headline-sm text-headline-sm font-bold text-on-surface min-w-[20px] text-center">
                      {quantity}
                    </span>
                    <button
                      className="w-8 h-8 rounded-full bg-surface-container-lowest text-on-surface hover:bg-white flex items-center justify-center font-bold shadow-xs transition-transform active:scale-95 cursor-pointer"
                      onClick={() => setQuantity(quantity + 1)}
                      type="button"
                    >
                      +
                    </button>
                  </div>

                  {/* Main Direct Order Pill */}
                  <button
                    onClick={handleOrder}
                    className="flex-1 h-12 px-6 rounded-full bg-primary-container hover:bg-secondary-container text-on-primary font-label-lg text-label-lg font-bold shadow-[0_8px_24px_-4px_rgba(255,138,0,0.4)] flex items-center justify-center gap-2 transform hover:scale-[1.02] active:scale-95 transition-all cursor-pointer"
                    type="button"
                  >
                    <span className="material-symbols-outlined text-[20px]">shopping_cart_checkout</span>
                    <span>Commander ce produit</span>
                  </button>
                </div>

                {/* Secondary Actions */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {/* Groupage Pill */}
                  <button
                    onClick={handleJoinGroupage}
                    className="h-12 px-4 rounded-full bg-surface-container-lowest hover:bg-surface-container-high/60 text-on-surface font-label-md text-label-md font-bold shadow-xs hover:shadow-sm flex items-center justify-center gap-2 transition-all cursor-pointer border border-slate-200"
                    type="button"
                  >
                    <span className="material-symbols-outlined text-[18px] text-primary">groups_3</span>
                    <span>Rejoindre le groupage (dès 1 unité)</span>
                  </button>

                  {/* B2B Quote Pill */}
                  <button
                    onClick={() => navigate('/b2b')}
                    className="h-12 px-4 rounded-full bg-surface-container-lowest hover:bg-surface-container-high/60 text-on-surface font-label-md text-label-md font-bold shadow-xs hover:shadow-sm flex items-center justify-center gap-2 transition-all cursor-pointer border border-slate-200"
                    type="button"
                  >
                    <span className="material-symbols-outlined text-[18px] text-primary">request_quote</span>
                    <span>Devis B2B volume</span>
                  </button>
                </div>

                {/* WhatsApp Direct Advisor Touchpoint */}
                <a
                  className="w-full h-11 px-4 rounded-full bg-[#EBF9F1] hover:bg-[#D5F2E2] text-[#0A5C36] font-label-md text-label-md font-bold flex items-center justify-center gap-2 shadow-xs transition-all"
                  href="https://wa.me/221770000000"
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  <span className="material-symbols-outlined text-[20px]">chat</span>
                  <span>Poser une question logistique sur WhatsApp</span>
                </a>
              </div>
            </div>

            {/* Dedicated B2B & Fleets Notice Card */}
            <div className="p-5 rounded-2xl bg-gradient-to-br from-surface-container-low to-surface-container-high/70 shadow-xs space-y-2 border border-slate-100">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[22px]">corporate_fare</span>
                <h3 className="font-headline-sm text-headline-sm font-bold text-on-surface">
                  Besoin de 10 unités ou plus pour votre flotte ou concession ?
                </h3>
              </div>
              <p className="font-body-md text-body-md text-on-surface-variant">
                Tarifs dégressifs négociés directement avec le fabricant, inspection vidéo avant chargement en usine et gestion douanière intégrale à Dakar.
              </p>
              <button
                onClick={() => navigate('/b2b')}
                className="inline-flex items-center gap-1 font-label-lg text-label-lg font-bold text-primary hover:text-secondary-container transition-colors pt-1 cursor-pointer"
              >
                <span>Demander une cotation grand compte</span>
                <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
              </button>
            </div>
          </div>
        </div>

        {/* LOWER SECTION: Comprehensive Technical Dossier & Cross-Sell Module */}
        <div className="mt-16 space-y-16">
          {/* Technical Dossier Tabbed Container (Liquid Glass) */}
          <div className="rounded-3xl bg-surface-container-lowest/80 backdrop-blur-2xl shadow-[0_16px_36px_-8px_rgba(16,24,32,0.05)] p-6 sm:p-10 space-y-8 border border-slate-100">
            {/* Tab Selectors Bar */}
            <div className="flex items-center gap-2 border-b border-surface-container-high/80 pb-3 overflow-x-auto no-scrollbar">
              {[
                'Fiche technique Auto & Mobilité',
                'Garanties & Contrôle Qualité Chine',
                'Logistique & Retrait à Dakar'
              ].map((label, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveTab(idx)}
                  className={`px-5 py-2.5 rounded-full font-label-lg text-label-lg transition-all shrink-0 cursor-pointer ${
                    activeTab === idx
                      ? 'bg-primary-container text-on-primary font-bold shadow-xs'
                      : 'bg-surface-container-low text-on-surface-variant hover:text-on-surface font-semibold'
                  }`}
                  type="button"
                >
                  {label}
                </button>
              ))}
            </div>

            {/* TAB CONTENT 0: Technical Specifications Bento Grid */}
            {activeTab === 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Spec 1: Engine */}
                <div className="p-5 rounded-2xl bg-surface-container-low flex flex-col justify-between">
                  <span className="material-symbols-outlined text-primary text-[28px] mb-3">
                    electric_bolt
                  </span>
                  <div>
                    <span className="font-label-sm text-label-sm text-on-surface-variant uppercase font-bold">
                      Puissance moteur
                    </span>
                    <p className="font-headline-md text-headline-md font-bold text-on-surface mt-1">
                      2000W Brushless
                    </p>
                    <p className="font-body-sm text-[12px] text-on-surface-variant mt-0.5">
                      Haute efficacité énergétique 92%
                    </p>
                  </div>
                </div>

                {/* Spec 2: Battery */}
                <div className="p-5 rounded-2xl bg-surface-container-low flex flex-col justify-between">
                  <span className="material-symbols-outlined text-primary text-[28px] mb-3">
                    battery_charging_full
                  </span>
                  <div>
                    <span className="font-label-sm text-label-sm text-on-surface-variant uppercase font-bold">
                      Pack Batterie
                    </span>
                    <p className="font-headline-md text-headline-md font-bold text-on-surface mt-1">
                      LiFePO4 72V 35Ah
                    </p>
                    <p className="font-body-sm text-[12px] text-on-surface-variant mt-0.5">
                      Amovible avec verrouillage clé
                    </p>
                  </div>
                </div>

                {/* Spec 3: Range */}
                <div className="p-5 rounded-2xl bg-surface-container-low flex flex-col justify-between">
                  <span className="material-symbols-outlined text-primary text-[28px] mb-3">route</span>
                  <div>
                    <span className="font-label-sm text-label-sm text-on-surface-variant uppercase font-bold">
                      Autonomie Réelle
                    </span>
                    <p className="font-headline-md text-headline-md font-bold text-on-surface mt-1">
                      85 à 110 km
                    </p>
                    <p className="font-body-sm text-[12px] text-on-surface-variant mt-0.5">
                      Testée en conditions de circulation
                    </p>
                  </div>
                </div>

                {/* Spec 4: Speed */}
                <div className="p-5 rounded-2xl bg-surface-container-low flex flex-col justify-between">
                  <span className="material-symbols-outlined text-primary text-[28px] mb-3">speed</span>
                  <div>
                    <span className="font-label-sm text-label-sm text-on-surface-variant uppercase font-bold">
                      Vitesse Maximale
                    </span>
                    <p className="font-headline-md text-headline-md font-bold text-on-surface mt-1">
                      75 km/h
                    </p>
                    <p className="font-body-sm text-[12px] text-on-surface-variant mt-0.5">
                      3 modes de conduite sélectables
                    </p>
                  </div>
                </div>

                {/* Spec 5: Charging Time */}
                <div className="p-5 rounded-2xl bg-surface-container-low flex flex-col justify-between">
                  <span className="material-symbols-outlined text-primary text-[28px] mb-3">timer</span>
                  <div>
                    <span className="font-label-sm text-label-sm text-on-surface-variant uppercase font-bold">
                      Temps de charge
                    </span>
                    <p className="font-headline-md text-headline-md font-bold text-on-surface mt-1">
                      4 à 5 heures
                    </p>
                    <p className="font-body-sm text-[12px] text-on-surface-variant mt-0.5">
                      Chargeur rapide secteur 220V inclus
                    </p>
                  </div>
                </div>

                {/* Spec 6: Payload */}
                <div className="p-5 rounded-2xl bg-surface-container-low flex flex-col justify-between">
                  <span className="material-symbols-outlined text-primary text-[28px] mb-3">weight</span>
                  <div>
                    <span className="font-label-sm text-label-sm text-on-surface-variant uppercase font-bold">
                      Charge utile max
                    </span>
                    <p className="font-headline-md text-headline-md font-bold text-on-surface mt-1">
                      180 kg
                    </p>
                    <p className="font-body-sm text-[12px] text-on-surface-variant mt-0.5">
                      Cadre tubulaire acier renforcé
                    </p>
                  </div>
                </div>

                {/* Spec 7: Braking */}
                <div className="p-5 rounded-2xl bg-surface-container-low flex flex-col justify-between">
                  <span className="material-symbols-outlined text-primary text-[28px] mb-3">disc_full</span>
                  <div>
                    <span className="font-label-sm text-label-sm text-on-surface-variant uppercase font-bold">
                      Système de freinage
                    </span>
                    <p className="font-headline-md text-headline-md font-bold text-on-surface mt-1">
                      Double disque CBS
                    </p>
                    <p className="font-body-sm text-[12px] text-on-surface-variant mt-0.5">
                      Hydraulique avant et arrière
                    </p>
                  </div>
                </div>

                {/* Spec 8: Certification */}
                <div className="p-5 rounded-2xl bg-surface-container-low flex flex-col justify-between">
                  <span className="material-symbols-outlined text-primary text-[28px] mb-3">approval</span>
                  <div>
                    <span className="font-label-sm text-label-sm text-on-surface-variant uppercase font-bold">
                      Homologation
                    </span>
                    <p className="font-headline-md text-headline-md font-bold text-on-surface mt-1">
                      Certifié CE & ISO
                    </p>
                    <p className="font-body-sm text-[12px] text-on-surface-variant mt-0.5">
                      Dossier carte grise fourni
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* TAB CONTENT 1: Quality Control */}
            {activeTab === 1 && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-6 rounded-2xl bg-surface-container-low space-y-3">
                  <div className="w-10 h-10 rounded-full bg-primary-container/20 text-primary flex items-center justify-center">
                    <span className="material-symbols-outlined">videocam</span>
                  </div>
                  <h4 className="font-headline-sm text-headline-sm font-bold text-on-surface">
                    Inspection vidéo avant scellage
                  </h4>
                  <p className="font-body-md text-body-md text-on-surface-variant">
                    Nos agents Dallou Chine basés à Ningbo réalisent une vidéo complète de conformité du véhicule avant fermeture et scellement du conteneur maritime.
                  </p>
                </div>

                <div className="p-6 rounded-2xl bg-surface-container-low space-y-3">
                  <div className="w-10 h-10 rounded-full bg-primary-container/20 text-primary flex items-center justify-center">
                    <span className="material-symbols-outlined">build</span>
                  </div>
                  <h4 className="font-headline-sm text-headline-sm font-bold text-on-surface">
                    Stock pièces de rechange
                  </h4>
                  <p className="font-body-md text-body-md text-on-surface-variant">
                    Plaquettes, amortisseurs, contrôleurs et batteries de remplacement sont sourcés continuellement et disponibles au stock central de Dakar.
                  </p>
                </div>

                <div className="p-6 rounded-2xl bg-surface-container-low space-y-3">
                  <div className="w-10 h-10 rounded-full bg-primary-container/20 text-primary flex items-center justify-center">
                    <span className="material-symbols-outlined">security</span>
                  </div>
                  <h4 className="font-headline-sm text-headline-sm font-bold text-on-surface">
                    Garantie Usine 12 Mois
                  </h4>
                  <p className="font-body-md text-body-md text-on-surface-variant">
                    Garantie constructeur complète sur le bloc moteur brushless et les cellules de batterie LiFePO4 avec prise en charge contractuelle B2B.
                  </p>
                </div>
              </div>
            )}

            {/* TAB CONTENT 2: Logistics & Dakar Pick-Up */}
            {activeTab === 2 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                <div className="space-y-4">
                  <h4 className="font-headline-md text-headline-md font-bold text-on-surface">
                    Hub de distribution Dallou Chine — Almadies Dakar
                  </h4>
                  <p className="font-body-md text-body-md text-on-surface-variant">
                    Dès le déchargement au Port Autonome de Dakar (PAD) et l'accomplissement des formalités de transit, votre moto est préparée, vérifiée et mise à disposition dans notre entrepôt sécurisé.
                  </p>
                  <ul className="space-y-2.5 font-body-md text-body-md text-on-surface">
                    <li className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-primary text-[18px]">check_circle</span>
                      <span>Retrait direct au showroom Almadies (sur rendez-vous)</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-primary text-[18px]">check_circle</span>
                      <span>Option livraison par remorque plateau partout au Sénégal</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-primary text-[18px]">check_circle</span>
                      <span>Aide complète à l'immatriculation sénégalaise</span>
                    </li>
                  </ul>
                </div>

                <div className="p-6 rounded-2xl bg-surface-container-low border border-surface-container-highest space-y-3">
                  <span className="font-label-sm text-label-sm text-primary font-bold uppercase tracking-wider">
                    Durée standard de transit
                  </span>
                  <div className="flex items-baseline gap-2">
                    <span className="font-price-xl text-price-xl font-black text-on-surface">30 - 35</span>
                    <span className="font-headline-sm text-headline-sm font-bold text-on-surface-variant">
                      jours
                    </span>
                  </div>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">
                    Du port de chargement de Ningbo/Guangzhou au quai de débarquement de Dakar. Suivi par GPS conteneur accessible sur votre espace client.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Cross-Sell Vertical: "Vous aimerez aussi" */}
          <div className="space-y-6">
            <div className="flex items-end justify-between">
              <div>
                <span className="font-label-sm text-label-sm text-primary font-bold uppercase tracking-wider block">
                  Écosystème Mobilité & Énergie
                </span>
                <h2 className="font-headline-lg text-headline-lg font-bold text-on-surface tracking-tight mt-1">
                  Vous aimerez aussi
                </h2>
              </div>
              <button
                onClick={() => navigate('/products')}
                className="font-label-lg text-label-lg font-bold text-primary hover:text-secondary-container flex items-center gap-1 transition-colors cursor-pointer"
              >
                <span>Voir tout le catalogue Auto</span>
                <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Card 1 */}
              <div
                onClick={() => navigate('/groupages/grp-scooter-1200')}
                className="group rounded-3xl bg-surface-container-lowest/80 backdrop-blur-xl shadow-xs hover:shadow-lg transition-all duration-300 overflow-hidden flex flex-col justify-between border border-slate-100 cursor-pointer"
              >
                <div className="relative aspect-[4/3] w-full overflow-hidden bg-surface-container-high">
                  <img
                    alt="Scooter électrique Smart City"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuD5zh6zz6gZ7XPLjvwP_QcXlzXkITp15kdpRdRv7Td8q3lEnQsF5JV2x9yXX0_UupDiv6OO5iBURiDv0rfUtfN9W8gd7D5-JW_Jlj2vlg2ecE36xnPMDJMJV4qWrUuH0JPo78iCjylevKfYXhLfZlZEXBY9qG-9z3JwyJ17AWcbKl0Xmk3Xxy2Ank1FmQ7NCuW0AKIzeI9bSz0Yv7a-lAM23X54gix8yI3fqWxgK2jA43X1CyMe17Iuqw"
                  />
                  <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-inverse-surface/80 backdrop-blur-md text-inverse-on-surface font-label-sm text-[11px] font-bold">
                    1200W
                  </span>
                </div>
                <div className="p-5 flex flex-col justify-between flex-1">
                  <div>
                    <span className="font-label-sm text-label-sm text-on-surface-variant">
                      Mobilité Urbaine
                    </span>
                    <h3 className="font-headline-sm text-headline-sm font-bold text-on-surface line-clamp-1 mt-0.5">
                      Scooter électrique Smart City
                    </h3>
                  </div>
                  <div className="pt-4 flex items-baseline justify-between border-t border-surface-container-high/60 mt-4">
                    <span className="font-price-md text-price-md font-bold text-primary">
                      340 000 FCFA
                    </span>
                    <span className="font-label-sm text-label-sm text-on-surface-variant font-medium">
                      Usine
                    </span>
                  </div>
                </div>
              </div>

              {/* Card 2 */}
              <div className="group rounded-3xl bg-surface-container-lowest/80 backdrop-blur-xl shadow-xs hover:shadow-lg transition-all duration-300 overflow-hidden flex flex-col justify-between border border-slate-100 cursor-pointer">
                <div className="relative aspect-[4/3] w-full overflow-hidden bg-surface-container-high">
                  <img
                    alt="Casque connecté Bluetooth"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuDzLXOxhAZUdSGRrsb8TOpfNWLPDEUel1QRKMttdTFd60nS-gVCQsnwy0kZbYmsP1L2fnw-M4Sfpnho9bjPgQiIBkrsa1eWi_c9o2whLj3mBB7BiCKjYYHV6iolF6IbNM8i6wzxaYHnn9Bkh0puZp3-kSlXzKy0tIaPTfooAG1TS1siVAy9Xg_LopGSi_10ucgT8CeywhTYSobmqBWq9Qew04CQ9QUf23DMdNKkb2DbYjHZ7PIyLekIlw"
                  />
                  <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-inverse-surface/80 backdrop-blur-md text-inverse-on-surface font-label-sm text-[11px] font-bold">
                    Accessoires
                  </span>
                </div>
                <div className="p-5 flex flex-col justify-between flex-1">
                  <div>
                    <span className="font-label-sm text-label-sm text-on-surface-variant">
                      Sécurité Conducteur
                    </span>
                    <h3 className="font-headline-sm text-headline-sm font-bold text-on-surface line-clamp-1 mt-0.5">
                      Casque connecté Bluetooth
                    </h3>
                  </div>
                  <div className="pt-4 flex items-baseline justify-between border-t border-surface-container-high/60 mt-4">
                    <span className="font-price-md text-price-md font-bold text-primary">
                      28 000 FCFA
                    </span>
                    <span className="font-label-sm text-label-sm text-on-surface-variant font-medium">
                      MOQ: 10
                    </span>
                  </div>
                </div>
              </div>

              {/* Card 3 */}
              <div className="group rounded-3xl bg-surface-container-lowest/80 backdrop-blur-xl shadow-xs hover:shadow-lg transition-all duration-300 overflow-hidden flex flex-col justify-between border border-slate-100 cursor-pointer">
                <div className="relative aspect-[4/3] w-full overflow-hidden bg-surface-container-high">
                  <img
                    alt="Batterie de secours Lithium 72V"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuBt2qxR9eck3Q--NgqJZ1zSplM-7WTo2NzxYmW3p6Ejy3hUWFHVDKe1cI1gmX5A4DNKpvYLO0KyZm2UzhOblJLeYL9bEK4KciMnqSmyzRVj671Lpd-17Ryd29qK18zmJwugEjhAdPjtTsUxvprGgJmhmQxgOWRD6WoJgjP_qT1ZP4ApdBeAg6t7eIAH8_t3wUoJfzenNjhrs-WFpi08VunpB5Z1ajFMz2lPA3xUmUr8pSevQd-XlhygOg"
                  />
                  <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-inverse-surface/80 backdrop-blur-md text-inverse-on-surface font-label-sm text-[11px] font-bold">
                    72V 35Ah
                  </span>
                </div>
                <div className="p-5 flex flex-col justify-between flex-1">
                  <div>
                    <span className="font-label-sm text-label-sm text-on-surface-variant">
                      Énergie & Rechange
                    </span>
                    <h3 className="font-headline-sm text-headline-sm font-bold text-on-surface line-clamp-1 mt-0.5">
                      Batterie secours lithium 72V
                    </h3>
                  </div>
                  <div className="pt-4 flex items-baseline justify-between border-t border-surface-container-high/60 mt-4">
                    <span className="font-price-md text-price-md font-bold text-primary">
                      175 000 FCFA
                    </span>
                    <span className="font-label-sm text-label-sm text-on-surface-variant font-medium">
                      LiFePO4
                    </span>
                  </div>
                </div>
              </div>

              {/* Card 4 */}
              <div className="group rounded-3xl bg-surface-container-lowest/80 backdrop-blur-xl shadow-xs hover:shadow-lg transition-all duration-300 overflow-hidden flex flex-col justify-between border border-slate-100 cursor-pointer">
                <div className="relative aspect-[4/3] w-full overflow-hidden bg-surface-container-high">
                  <img
                    alt="Kit Panneau Solaire de Recharge"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuBJPrh8uGnzxcd69eRtSgokRa-S-2omFKIBwH3TO_RXjmlXJPmT7GD9lgHm9OqRi_Ghhdm-sZAzejhEB6ojAd-2C0MQFu56a0l9Jr8VmjJAjO5sTtgrkLh2DROl62vTEsrGQ4cT5VZE5vxgP9XEhEyCoHR8USCaaKTGBVpEKBAQdlDXAOqy6666C1cFeajfKjd5QPVLzv1dXM2izS-vaNKdCPHbnueAdAmNZJ-4j8DQxgidtkirksNLyg"
                  />
                  <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-inverse-surface/80 backdrop-blur-md text-inverse-on-surface font-label-sm text-[11px] font-bold">
                    Solaire 550W
                  </span>
                </div>
                <div className="p-5 flex flex-col justify-between flex-1">
                  <div>
                    <span className="font-label-sm text-label-sm text-on-surface-variant">
                      Recharge Autonome
                    </span>
                    <h3 className="font-headline-sm text-headline-sm font-bold text-on-surface line-clamp-1 mt-0.5">
                      Panneau solaire de recharge
                    </h3>
                  </div>
                  <div className="pt-4 flex items-baseline justify-between border-t border-surface-container-high/60 mt-4">
                    <span className="font-price-md text-price-md font-bold text-primary">
                      85 000 FCFA
                    </span>
                    <span className="font-label-sm text-label-sm text-on-surface-variant font-medium">
                      Usine
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetailPage;
