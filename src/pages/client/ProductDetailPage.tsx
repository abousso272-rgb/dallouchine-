import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { catalogService } from '../../services/catalogService';
import { Product } from '../../types';

interface ProductDetailPageProps {
  slug?: string;
}

export const ProductDetailPage: React.FC<ProductDetailPageProps> = ({ slug }) => {
  const { navigate, addToCart, products } = useApp();

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeThumb, setActiveThumb] = useState<number>(0);
  const [selectedColor, setSelectedColor] = useState<string>('Standard');
  const [quantity, setQuantity] = useState<number>(1);
  const [activeTab, setActiveTab] = useState<number>(0);
  const [notification, setNotification] = useState<string | null>(null);

  // Determine current slug from props or window location
  useEffect(() => {
    const rawPath = window.location.pathname;
    const resolvedSlug =
      slug ||
      rawPath.replace('/products/', '').replace('/product/', '').split('?')[0] ||
      '';

    if (!resolvedSlug) {
      setLoading(false);
      return;
    }

    setLoading(true);
    catalogService
      .getProductBySlug(resolvedSlug)
      .then(fetchedProd => {
        if (fetchedProd) {
          setProduct(fetchedProd);
          setQuantity(fetchedProd.moq || 1);
        } else {
          // Fallback to local products in context if any
          const localMatch = products.find(p => p.slug === resolvedSlug || p.id === resolvedSlug);
          if (localMatch) {
            setProduct(localMatch);
            setQuantity(localMatch.moq || 1);
          } else {
            setProduct(null);
          }
        }
      })
      .catch(err => {
        console.error('[ProductDetailPage] Error fetching product by slug:', err);
        setProduct(null);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [slug, products]);

  const handleOrder = () => {
    if (!product) return;
    addToCart(
      {
        ...product,
        name: selectedColor !== 'Standard' ? `${product.name} (${selectedColor})` : product.name
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
    if (product?.publicGroupage?.id) {
      navigate(`/groupages/${product.publicGroupage.id}`);
    } else {
      navigate('/groupages');
    }
  };

  // Loading Skeleton State
  if (loading) {
    return (
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-pulse">
        <div className="h-6 bg-slate-200 rounded-md w-1/4" />
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-6 xl:col-span-7 space-y-4">
            <div className="w-full aspect-[4/3] bg-slate-200 rounded-3xl" />
            <div className="grid grid-cols-4 gap-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="aspect-square bg-slate-200 rounded-2xl" />
              ))}
            </div>
          </div>
          <div className="lg:col-span-6 xl:col-span-5 space-y-4">
            <div className="h-8 bg-slate-200 rounded-md w-3/4" />
            <div className="h-4 bg-slate-200 rounded-md w-full" />
            <div className="h-24 bg-slate-200 rounded-2xl" />
            <div className="h-12 bg-slate-200 rounded-full" />
          </div>
        </div>
      </div>
    );
  }

  // Not Found State
  if (!product) {
    return (
      <div className="w-full max-w-4xl mx-auto px-4 py-20 text-center space-y-6">
        <div className="w-20 h-20 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto text-3xl">
          🔍
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl sm:text-3xl font-black text-[#0B192C]">Produit introuvable ou désactivé</h1>
          <p className="text-slate-500 text-sm max-w-md mx-auto">
            Cet article n'est plus disponible dans le catalogue actif de Dallou Chine.
          </p>
        </div>
        <button
          onClick={() => navigate('/products')}
          className="bg-[#0B192C] text-white px-6 py-3 rounded-2xl font-bold text-sm shadow-md hover:bg-[#FF4500] transition-colors"
        >
          Retourner au catalogue Marketplace
        </button>
      </div>
    );
  }

  // Format images array
  const displayImages = (product.images && product.images.length > 0 ? product.images : [
    'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop'
  ]).map((src, idx) => ({
    label: `${product.name} vue ${idx + 1}`,
    tag: idx === 0 ? 'Principal' : `Vue ${idx + 1}`,
    src
  }));

  const activeImageSrc = displayImages[activeThumb]?.src || displayImages[0].src;
  const isAvailable = (product.availableQuantity ?? (product.stockQuantity || 0) - (product.reservedQuantity || 0)) > 0;
  const availableQty = product.availableQuantity ?? Math.max(0, (product.stockQuantity || 0) - (product.reservedQuantity || 0));

  return (
    <div className="flex flex-col w-full">
      {/* Dynamic Toast */}
      {notification && (
        <div className="fixed top-24 right-4 sm:right-8 z-50 bg-[#141c24] text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 border border-orange-500/30 animate-in fade-in">
          <span className="material-symbols-outlined text-[#ff8a00] text-2xl">check_circle</span>
          <span className="font-bold text-sm">{notification}</span>
        </div>
      )}

      {/* Main Container */}
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
            onClick={() => navigate(`/products?category=${encodeURIComponent(product.category)}`)}
            className="hover:text-primary transition-colors cursor-pointer"
          >
            {product.category}
          </button>
          <span className="text-outline-variant font-bold">/</span>
          <span className="text-on-surface font-bold truncate max-w-xs">{product.name}</span>
        </nav>

        {/* Main Product Grid: 2 High-End Asymmetrical Columns */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          {/* LEFT COLUMN: Media Gallery & Freight Badges */}
          <div className="lg:col-span-6 xl:col-span-7 flex flex-col space-y-6 lg:sticky lg:top-28">
            {/* Primary Display Canvas */}
            <div className="relative w-full aspect-[4/3] sm:aspect-[16/11] rounded-3xl overflow-hidden bg-surface-container-lowest/80 backdrop-blur-xl shadow-[0_20px_50px_-12px_rgba(16,24,32,0.08)] flex items-center justify-center p-6 group border border-slate-100">
              <div className="absolute -top-24 -left-24 w-80 h-80 bg-primary-container/15 rounded-full blur-2xl pointer-events-none" />
              <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/80 to-transparent" />

              {/* Main Product Image */}
              <img
                alt={product.name}
                className="w-full h-full object-contain object-center transition-all duration-500 transform group-hover:scale-105"
                src={activeImageSrc}
              />

              {/* Floating Badges */}
              <div className="absolute top-5 left-5 flex flex-col gap-2.5 z-20 pointer-events-none">
                {product.isAutoMobility && (
                  <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-surface-container-lowest/90 backdrop-blur-md shadow-md text-on-surface font-label-sm text-label-sm tracking-wide">
                    <span className="w-2 h-2 rounded-full bg-primary-container animate-pulse" />
                    <span className="font-bold">Auto & Mobilité Vérifiée</span>
                  </div>
                )}
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-container-high/90 backdrop-blur-md text-on-surface-variant font-label-sm text-label-sm">
                  <span className="material-symbols-outlined text-[16px] text-primary">verified</span>
                  <span>Usine Contrôlée Chine</span>
                </div>
              </div>

              <div className="absolute bottom-5 right-5 z-20">
                <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-inverse-surface/90 text-inverse-on-surface backdrop-blur-md shadow-lg font-label-sm text-label-sm">
                  <span className="material-symbols-outlined text-[18px] text-primary-fixed-dim">
                    {product.defaultTransportMode === 'air' ? 'flight_takeoff' : 'sailing'}
                  </span>
                  <span>
                    Fret {product.defaultTransportMode === 'air' ? 'Aérien (12-18j)' : 'Maritime (30-45j)'} Dakar
                  </span>
                </div>
              </div>

              {/* Magnifier / Fullscreen quick trigger */}
              <button
                aria-label="Agrandir la vue"
                className="absolute top-5 right-5 w-10 h-10 rounded-full bg-surface-container-lowest/80 backdrop-blur-md hover:bg-white text-on-surface flex items-center justify-center shadow-md transition-transform hover:scale-110 cursor-pointer"
                type="button"
                onClick={() => setActiveThumb((activeThumb + 1) % displayImages.length)}
              >
                <span className="material-symbols-outlined text-[20px]">fullscreen</span>
              </button>
            </div>

            {/* Interactive Thumbnail Reel */}
            {displayImages.length > 1 && (
              <div className="grid grid-cols-4 gap-3 sm:gap-4">
                {displayImages.map((thumb, idx) => (
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
                    <span className="absolute bottom-1.5 inset-x-1 truncate text-center font-label-sm text-[10px] text-on-surface font-semibold bg-surface-container-lowest/80 rounded-md py-0.5">
                      {thumb.tag}
                    </span>
                  </button>
                ))}
              </div>
            )}

            {/* Micro Assurance Strip */}
            <div className="grid grid-cols-3 gap-3 p-4 rounded-2xl bg-surface-container-low/70 border border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-primary-container/20 text-primary flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[18px]">verified_user</span>
                </div>
                <div className="flex flex-col">
                  <span className="font-label-sm text-label-sm font-bold text-on-surface">Audit Usine</span>
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
                  <span className="font-label-sm text-label-sm font-bold text-on-surface">Emballage Pro</span>
                  <span className="font-body-sm text-[11px] text-on-surface-variant leading-tight">
                    Export sécurisé
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-primary-container/20 text-primary flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[18px]">hub</span>
                </div>
                <div className="flex flex-col">
                  <span className="font-label-sm text-label-sm font-bold text-on-surface">Hub Almadies</span>
                  <span className="font-body-sm text-[11px] text-on-surface-variant leading-tight">
                    Retrait Dakar
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Pricing, Groupage, Customization & Orders */}
          <div className="lg:col-span-6 xl:col-span-5 flex flex-col space-y-6">
            {/* Title & Identification Area */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-3 py-1 rounded-full bg-secondary-fixed text-on-secondary-fixed-variant font-label-sm text-label-sm font-bold uppercase tracking-wider">
                  {product.category}
                </span>
                {product.sku && (
                  <span className="font-label-md text-label-md text-on-surface-variant">
                    SKU: <strong className="text-on-surface font-mono">{product.sku}</strong>
                  </span>
                )}
                <span className="text-outline-variant">•</span>
                <span className="font-label-md text-label-md text-on-surface-variant flex items-center gap-1">
                  <span className="material-symbols-outlined text-[15px] text-primary">factory</span>
                  Sourcing Chine Direct
                </span>
              </div>
              <h1 className="font-headline-xl text-headline-xl text-on-surface font-extrabold tracking-tight">
                {product.name}
              </h1>
              {product.shortDescription && (
                <p className="font-body-md text-body-md text-on-surface-variant">
                  {product.shortDescription}
                </p>
              )}
            </div>

            {/* Pricing & Stock Card */}
            <div className="p-6 rounded-3xl bg-surface-container-lowest/90 backdrop-blur-2xl shadow-[0_16px_40px_-10px_rgba(16,24,32,0.06)] space-y-6 relative overflow-hidden border border-slate-100">
              <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white to-transparent" />

              {/* Price Header & MOQ Tag */}
              <div className="flex items-baseline justify-between gap-4 border-b border-surface-container-high/60 pb-5">
                <div>
                  <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wide block font-semibold">
                    Prix catalogue unitaire
                  </span>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="font-price-xl text-price-xl font-black text-on-surface tracking-tight font-mono-numeric">
                      {product.priceXOF.toLocaleString('fr-FR')}
                    </span>
                    <span className="font-headline-sm text-headline-sm font-bold text-primary">
                      FCFA
                    </span>
                  </div>
                  {product.compareAtPriceXOF && (
                    <span className="font-body-sm text-[12px] text-slate-400 line-through">
                      Prix habituel : {product.compareAtPriceXOF.toLocaleString('fr-FR')} FCFA
                    </span>
                  )}
                </div>

                <div className="flex flex-col items-end gap-1.5">
                  {/* MOQ Display (Obligatory section 13) */}
                  <span className="px-3 py-1 rounded-full bg-inverse-surface text-inverse-on-surface font-label-sm text-label-sm font-bold flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary-container" />
                    MOQ : {product.moq} {product.moq > 1 ? 'unités' : 'unité'}
                  </span>

                  {/* Availability Display (Obligatory section 12) */}
                  <div className="flex items-center gap-1.5 text-[11px] font-bold">
                    {isAvailable ? (
                      <span className="text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        Dispo : {availableQty} en stock
                      </span>
                    ) : (
                      <span className="text-amber-800 bg-amber-50 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                        Sur commande usine
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Groupage Active Card (Obligatory section 14: public data only) */}
              {product.publicGroupage && (
                <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 space-y-2.5">
                  <div className="flex items-center justify-between text-on-surface font-label-md text-label-md">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#FF4500] animate-ping" />
                      <span className="font-bold text-amber-950 truncate max-w-[220px]">
                        {product.publicGroupage.title}
                      </span>
                    </div>
                    <span className="font-bold text-[#FF4500]">
                      {Math.min(
                        100,
                        Math.round(
                          (product.publicGroupage.reservedQuantity /
                            (product.publicGroupage.targetQuantity || 1)) *
                            100
                        )
                      )}
                      % réservé
                    </span>
                  </div>

                  <div className="w-full h-2 rounded-full bg-amber-200/60 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-amber-500 to-[#FF4500] rounded-full transition-all duration-1000"
                      style={{
                        width: `${Math.min(
                          100,
                          Math.round(
                            (product.publicGroupage.reservedQuantity /
                              (product.publicGroupage.targetQuantity || 1)) *
                              100
                          )
                        )}%`
                      }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-xs text-amber-900 font-medium">
                    <span>
                      Réservé : <strong>{product.publicGroupage.reservedQuantity}</strong> / {product.publicGroupage.targetQuantity} unités
                    </span>
                    <span>
                      Prix groupage : <strong>{product.publicGroupage.unitPriceXOF.toLocaleString('fr-FR')} FCFA</strong>
                    </span>
                  </div>
                </div>
              )}

              {/* Cost Transparency Breakdown */}
              <div className="space-y-3 pt-1">
                <span className="font-label-md text-label-md font-bold text-on-surface uppercase tracking-wide block">
                  Décomposition des coûts & Transparence logistique
                </span>
                <div className="space-y-2.5 font-body-sm text-body-sm">
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-surface-container-lowest shadow-xs border border-slate-100">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-[18px] text-primary">
                        precision_manufacturing
                      </span>
                      <span className="text-on-surface font-medium">Marchandise usine</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-on-surface font-mono-numeric">
                        {(product.productPriceXOF || Math.round(product.priceXOF * 0.65)).toLocaleString('fr-FR')} FCFA
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-label-sm text-[11px] font-bold flex items-center gap-1">
                        <span className="material-symbols-outlined text-[13px]">check_circle</span>
                        CONFIRMÉ
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-surface-container-lowest shadow-xs border border-slate-100">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-[18px] text-primary">
                        {product.defaultTransportMode === 'air' ? 'flight' : 'directions_boat'}
                      </span>
                      <span className="text-on-surface font-medium">
                        Fret {product.defaultTransportMode === 'air' ? 'aérien' : 'maritime'} & transit Dakar
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-on-surface font-mono-numeric">
                        ~{(product.estimatedLogisticsXOF || Math.round(product.priceXOF * 0.35)).toLocaleString('fr-FR')} FCFA
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 font-label-sm text-[11px] font-bold flex items-center gap-1">
                        <span className="material-symbols-outlined text-[13px]">schedule</span>
                        ESTIMATIF
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quantity Selector & Action Controls */}
              <div className="pt-3 space-y-3">
                <div className="flex items-center gap-3">
                  {/* Quantity Counter */}
                  <div className="h-12 px-3 rounded-full bg-surface-container flex items-center justify-between gap-4">
                    <button
                      className="w-8 h-8 rounded-full bg-surface-container-lowest text-on-surface hover:bg-white flex items-center justify-center font-bold shadow-xs transition-transform active:scale-95 cursor-pointer"
                      onClick={() => setQuantity(Math.max(product.moq || 1, quantity - 1))}
                      type="button"
                    >
                      -
                    </button>
                    <span className="font-headline-sm text-headline-sm font-bold text-on-surface min-w-[20px] text-center font-mono-numeric">
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

                  {/* Main Order Button */}
                  <button
                    onClick={handleOrder}
                    className="flex-1 h-12 px-6 rounded-full bg-primary-container hover:bg-secondary-container text-on-primary font-label-lg text-label-lg font-bold shadow-[0_8px_24px_-4px_rgba(255,138,0,0.4)] flex items-center justify-center gap-2 transform hover:scale-[1.02] active:scale-95 transition-all cursor-pointer"
                    type="button"
                  >
                    <span className="material-symbols-outlined text-[20px]">shopping_cart_checkout</span>
                    <span>Ajouter au panier</span>
                  </button>
                </div>

                {/* Secondary Actions */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {product.publicGroupage ? (
                    <button
                      onClick={handleJoinGroupage}
                      className="h-12 px-4 rounded-full bg-surface-container-lowest hover:bg-surface-container-high/60 text-on-surface font-label-md text-label-md font-bold shadow-xs hover:shadow-sm flex items-center justify-center gap-2 transition-all cursor-pointer border border-slate-200"
                      type="button"
                    >
                      <span className="material-symbols-outlined text-[18px] text-primary">groups_3</span>
                      <span>Voir le groupage ouvert</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => navigate('/products')}
                      className="h-12 px-4 rounded-full bg-surface-container-lowest hover:bg-surface-container-high/60 text-on-surface font-label-md text-label-md font-bold shadow-xs hover:shadow-sm flex items-center justify-center gap-2 transition-all cursor-pointer border border-slate-200"
                      type="button"
                    >
                      <span className="material-symbols-outlined text-[18px] text-primary">storefront</span>
                      <span>Autres produits similaires</span>
                    </button>
                  )}

                  <button
                    onClick={() => navigate('/b2b')}
                    className="h-12 px-4 rounded-full bg-surface-container-lowest hover:bg-surface-container-high/60 text-on-surface font-label-md text-label-md font-bold shadow-xs hover:shadow-sm flex items-center justify-center gap-2 transition-all cursor-pointer border border-slate-200"
                    type="button"
                  >
                    <span className="material-symbols-outlined text-[18px] text-primary">request_quote</span>
                    <span>Devis B2B volume</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* LOWER SECTION: Technical Dossier Tabbed Container */}
        <div className="mt-16 space-y-16">
          <div className="rounded-3xl bg-surface-container-lowest/80 backdrop-blur-2xl shadow-[0_16px_36px_-8px_rgba(16,24,32,0.05)] p-6 sm:p-10 space-y-8 border border-slate-100">
            {/* Tab Selectors Bar */}
            <div className="flex items-center gap-2 border-b border-surface-container-high/80 pb-3 overflow-x-auto no-scrollbar">
              {[
                product.isAutoMobility && product.autoSpecs
                  ? 'Fiche technique Auto & Mobilité'
                  : 'Spécifications & Détails du Produit',
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

            {/* TAB CONTENT 0: Technical Specifications */}
            {activeTab === 0 && (
              <>
                {product.isAutoMobility && product.autoSpecs ? (
                  /* Auto & Mobilité Specifications Bento Grid (Test 6) */
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Spec: Brand & Model */}
                    {(product.autoSpecs.brand || product.autoSpecs.model) && (
                      <div className="p-5 rounded-2xl bg-surface-container-low flex flex-col justify-between">
                        <span className="material-symbols-outlined text-primary text-[28px] mb-3">directions_car</span>
                        <div>
                          <span className="font-label-sm text-label-sm text-on-surface-variant uppercase font-bold">
                            Marque & Modèle
                          </span>
                          <p className="font-headline-md text-headline-md font-bold text-on-surface mt-1">
                            {product.autoSpecs.brand} {product.autoSpecs.model}
                          </p>
                          <p className="font-body-sm text-[12px] text-on-surface-variant mt-0.5">
                            Millésime {product.autoSpecs.modelYear || 2026}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Spec: Motor Power */}
                    {product.autoSpecs.motorPowerKw && (
                      <div className="p-5 rounded-2xl bg-surface-container-low flex flex-col justify-between">
                        <span className="material-symbols-outlined text-primary text-[28px] mb-3">electric_bolt</span>
                        <div>
                          <span className="font-label-sm text-label-sm text-on-surface-variant uppercase font-bold">
                            Puissance moteur
                          </span>
                          <p className="font-headline-md text-headline-md font-bold text-on-surface mt-1">
                            {product.autoSpecs.motorPowerKw} kW {product.autoSpecs.motorPowerHp ? `(${product.autoSpecs.motorPowerHp} ch)` : ''}
                          </p>
                          <p className="font-body-sm text-[12px] text-on-surface-variant mt-0.5">
                            Rendement électrique certifié
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Spec: Battery */}
                    {product.autoSpecs.batteryCapacityKwh && (
                      <div className="p-5 rounded-2xl bg-surface-container-low flex flex-col justify-between">
                        <span className="material-symbols-outlined text-primary text-[28px] mb-3">battery_charging_full</span>
                        <div>
                          <span className="font-label-sm text-label-sm text-on-surface-variant uppercase font-bold">
                            Pack Batterie
                          </span>
                          <p className="font-headline-md text-headline-md font-bold text-on-surface mt-1">
                            {product.autoSpecs.batteryCapacityKwh} kWh LiFePO4
                          </p>
                          <p className="font-body-sm text-[12px] text-on-surface-variant mt-0.5">
                            Tropicalisée haute résistance
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Spec: Range */}
                    {product.autoSpecs.rangeKm && (
                      <div className="p-5 rounded-2xl bg-surface-container-low flex flex-col justify-between">
                        <span className="material-symbols-outlined text-primary text-[28px] mb-3">route</span>
                        <div>
                          <span className="font-label-sm text-label-sm text-on-surface-variant uppercase font-bold">
                            Autonomie Réelle
                          </span>
                          <p className="font-headline-md text-headline-md font-bold text-on-surface mt-1">
                            {product.autoSpecs.rangeKm} km
                          </p>
                          <p className="font-body-sm text-[12px] text-on-surface-variant mt-0.5">
                            Cycle urbain mixte
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Spec: Speed */}
                    {product.autoSpecs.topSpeedKmh && (
                      <div className="p-5 rounded-2xl bg-surface-container-low flex flex-col justify-between">
                        <span className="material-symbols-outlined text-primary text-[28px] mb-3">speed</span>
                        <div>
                          <span className="font-label-sm text-label-sm text-on-surface-variant uppercase font-bold">
                            Vitesse Maximale
                          </span>
                          <p className="font-headline-md text-headline-md font-bold text-on-surface mt-1">
                            {product.autoSpecs.topSpeedKmh} km/h
                          </p>
                          <p className="font-body-sm text-[12px] text-on-surface-variant mt-0.5">
                            Modes de conduite réglables
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Spec: Charging Time */}
                    {product.autoSpecs.chargingTime && (
                      <div className="p-5 rounded-2xl bg-surface-container-low flex flex-col justify-between">
                        <span className="material-symbols-outlined text-primary text-[28px] mb-3">timer</span>
                        <div>
                          <span className="font-label-sm text-label-sm text-on-surface-variant uppercase font-bold">
                            Temps de charge
                          </span>
                          <p className="font-headline-md text-headline-md font-bold text-on-surface mt-1">
                            {product.autoSpecs.chargingTime}
                          </p>
                          <p className="font-body-sm text-[12px] text-on-surface-variant mt-0.5">
                            Prise domestique & borne rapide
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Spec: Certification */}
                    {product.autoSpecs.certification && (
                      <div className="p-5 rounded-2xl bg-surface-container-low flex flex-col justify-between">
                        <span className="material-symbols-outlined text-primary text-[28px] mb-3">approval</span>
                        <div>
                          <span className="font-label-sm text-label-sm text-on-surface-variant uppercase font-bold">
                            Homologation
                          </span>
                          <p className="font-headline-md text-headline-md font-bold text-on-surface mt-1">
                            {product.autoSpecs.certification}
                          </p>
                          <p className="font-body-sm text-[12px] text-on-surface-variant mt-0.5">
                            Dossier GAINDE / Immatriculation
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  /* General Product Specifications (Test 7: No unnecessary Auto blocks) */
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="p-4 rounded-2xl bg-surface-container-low">
                        <span className="text-xs text-slate-500 block uppercase font-bold">Poids unitaire</span>
                        <strong className="text-base text-[#0B192C] font-mono-numeric block mt-1">
                          {product.unitWeightKg} kg
                        </strong>
                      </div>
                      <div className="p-4 rounded-2xl bg-surface-container-low">
                        <span className="text-xs text-slate-500 block uppercase font-bold">Dimensions</span>
                        <strong className="text-base text-[#0B192C] font-mono-numeric block mt-1">
                          {product.dimensionsCm.length} × {product.dimensionsCm.width} × {product.dimensionsCm.height} cm
                        </strong>
                      </div>
                      <div className="p-4 rounded-2xl bg-surface-container-low">
                        <span className="text-xs text-slate-500 block uppercase font-bold">Volume unitaire</span>
                        <strong className="text-base text-[#0B192C] font-mono-numeric block mt-1">
                          {product.cbm} CBM (m³)
                        </strong>
                      </div>
                      <div className="p-4 rounded-2xl bg-surface-container-low">
                        <span className="text-xs text-slate-500 block uppercase font-bold">Mode d'expédition</span>
                        <strong className="text-base text-[#0B192C] block mt-1">
                          {product.defaultTransportMode === 'air' ? 'Aérien (12-18j)' : 'Maritime (30-45j)'}
                        </strong>
                      </div>
                    </div>

                    {product.fullDescription && (
                      <div className="p-6 rounded-2xl bg-surface-container-low/50 space-y-2">
                        <h4 className="font-bold text-[#0B192C] text-sm">Description détaillée</h4>
                        <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-line">
                          {product.fullDescription}
                        </p>
                      </div>
                    )}

                    {product.features && product.features.length > 0 && (
                      <div className="space-y-3">
                        <h4 className="font-bold text-[#0B192C] text-sm">Points forts & Caractéristiques</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {product.features.map((feat, i) => (
                            <div key={i} className="flex items-center gap-2 p-2.5 rounded-xl bg-white border border-slate-100 text-xs text-slate-700">
                              <span className="material-symbols-outlined text-emerald-600 text-[16px]">check_circle</span>
                              <span>{feat}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </>
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
                    Nos agents Dallou Chine basés à Guangzhou et Yiwu réalisent un contrôle qualité et une vidéo de conformité avant fermeture du conteneur.
                  </p>
                </div>

                <div className="p-6 rounded-2xl bg-surface-container-low space-y-3">
                  <div className="w-10 h-10 rounded-full bg-primary-container/20 text-primary flex items-center justify-center">
                    <span className="material-symbols-outlined">build</span>
                  </div>
                  <h4 className="font-headline-sm text-headline-sm font-bold text-on-surface">
                    Emballage renforcé export
                  </h4>
                  <p className="font-body-md text-body-md text-on-surface-variant">
                    Palettisation, cerclage thermique et calage adapté aux trajets maritimes et aux conditions climatiques sahéliennes.
                  </p>
                </div>

                <div className="p-6 rounded-2xl bg-surface-container-low space-y-3">
                  <div className="w-10 h-10 rounded-full bg-primary-container/20 text-primary flex items-center justify-center">
                    <span className="material-symbols-outlined">security</span>
                  </div>
                  <h4 className="font-headline-sm text-headline-sm font-bold text-on-surface">
                    Garantie constructeur
                  </h4>
                  <p className="font-body-md text-body-md text-on-surface-variant">
                    Assurance cargaison intégrée et support direct avec les fabricants partenaires en Chine.
                  </p>
                </div>
              </div>
            )}

            {/* TAB CONTENT 2: Logistics & Dakar Pick-Up */}
            {activeTab === 2 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                <div className="space-y-4">
                  <h4 className="font-headline-md text-headline-md font-bold text-on-surface">
                    Hub central Dallou Chine — Almadies Dakar
                  </h4>
                  <p className="font-body-md text-body-md text-on-surface-variant">
                    Dès l'arrivée au Port Autonome de Dakar (PAD) ou à l'AIBD et le dédouanement effectué, votre marchandise est préparée et disponible dans notre entrepôt sécurisé.
                  </p>
                  <ul className="space-y-2.5 font-body-md text-body-md text-on-surface">
                    <li className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-primary text-[18px]">check_circle</span>
                      <span>Retrait direct au Hub Almadies (sur notification SMS/WhatsApp)</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-primary text-[18px]">check_circle</span>
                      <span>Option livraison à domicile partout à Dakar et dans les régions</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-primary text-[18px]">check_circle</span>
                      <span>Formalités douanières GAINDE 100% prises en charge</span>
                    </li>
                  </ul>
                </div>

                <div className="p-6 rounded-2xl bg-surface-container-low border border-surface-container-highest space-y-3">
                  <span className="font-label-sm text-label-sm text-primary font-bold uppercase tracking-wider">
                    Délai standard d'acheminement
                  </span>
                  <div className="flex items-baseline gap-2">
                    <span className="font-price-xl text-price-xl font-black text-on-surface">
                      {product.estimatedDeliveryDays}
                    </span>
                  </div>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">
                    Du hub d'empotage en Chine jusqu'à la mise à disposition à Dakar. Suivi des étapes disponible en temps réel dans votre espace.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetailPage;
