import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { PriceDisplay } from '../../components/common/PriceDisplay';
import { ProgressBar } from '../../components/common/ProgressBar';
import { ProductCard } from '../../components/common/ProductCard';
import { LogisticsPriceSplit } from '../../components/common/LogisticsPriceSplit';
import {
  ShieldCheck,
  Star,
  Plane,
  Ship,
  Package,
  Heart,
  ShoppingBag,
  Share2,
  CheckCircle2,
  Clock,
  Building,
  Info,
  MapPin,
  ChevronRight,
  Flame,
  ArrowRight,
  Truck,
  FileText,
  BadgePercent,
  Sliders
} from 'lucide-react';

interface ProductDetailPageProps {
  slug?: string;
}

export const ProductDetailPage: React.FC<ProductDetailPageProps> = ({ slug }) => {
  const { products, groupages, navigate, addToCart, isFavorite, toggleFavorite, currentPath } = useApp();

  // Extract slug from URL if not provided directly
  const currentSlug = slug || currentPath.split('/').filter(Boolean).pop() || '';
  const product = products.find(p => p.slug === currentSlug || p.id === currentSlug) || products[0];

  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [selectedQuantity, setSelectedQuantity] = useState(1);
  const [orderMode, setOrderMode] = useState<'individual' | 'groupage'>(
    product?.isGroupage ? 'groupage' : 'individual'
  );
  const [activeTab, setActiveTab] = useState<'specs' | 'quality' | 'reviews' | 'faq'>('specs');

  if (!product) {
    return (
      <div className="text-center py-20">
        <h2 className="text-xl font-bold text-[#0D2C7A]">Produit introuvable</h2>
        <button onClick={() => navigate('/products')} className="mt-4 px-4 py-2 rounded-xl bg-[#0D2C7A] text-white font-bold text-sm">
          Retour au catalogue
        </button>
      </div>
    );
  }

  const groupage = groupages.find(g => g.productId === product.id || g.id === product.activeGroupageId);
  const isAir = product.defaultTransportMode === 'air';
  const fav = isFavorite(product.id);

  // Related products
  const relatedProducts = products
    .filter(p => p.id !== product.id && p.category === product.category)
    .slice(0, 4);

  const handleAddToCart = () => {
    addToCart(
      product,
      selectedQuantity,
      orderMode === 'groupage',
      groupage?.id
    );
  };

  const handleBuyNow = () => {
    addToCart(
      product,
      selectedQuantity,
      orderMode === 'groupage',
      groupage?.id
    );
    navigate('/checkout');
  };

  return (
    <div className="space-y-12 pb-16">
      {/* Breadcrumb Bar */}
      <nav className="flex items-center gap-2 text-xs font-semibold text-slate-500 overflow-x-auto no-scrollbar py-1">
        <button onClick={() => navigate('/')} className="hover:text-[#0D2C7A]">
          Accueil
        </button>
        <ChevronRight className="w-3.5 h-3.5" />
        <button onClick={() => navigate('/products')} className="hover:text-[#0D2C7A]">
          Produits
        </button>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-[#2A6DFF] truncate max-w-xs">{product.category}</span>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-slate-800 font-bold truncate max-w-xs">{product.name}</span>
      </nav>

      {/* Main Top Section: Gallery + Product Buy Box */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Gallery (5 cols) */}
        <div className="lg:col-span-6 space-y-4">
          {/* Main Large Image */}
          <div className="relative aspect-4/3 rounded-2xl sm:rounded-3xl overflow-hidden glass-panel bg-white/80 border border-white/90 shadow-md p-2.5 sm:p-3">
            <img
              src={product.images[activeImageIndex] || product.images[0]}
              alt={product.name}
              className="w-full h-full object-cover rounded-xl sm:rounded-2xl"
            />

            {/* Top Bar with Transport Badge & Favorite Button (No Collision / Responsive) */}
            <div className="absolute top-3 sm:top-4 inset-x-3 sm:inset-x-4 flex items-start justify-between gap-2 z-10 pointer-events-none">
              {/* Transport Badge */}
              <div className="pointer-events-auto max-w-[calc(100%-48px)]">
                <span className="glass-panel text-[10px] sm:text-xs font-black px-2.5 sm:px-3 py-1 rounded-full bg-white/95 text-[#0D2C7A] shadow-xs flex items-center gap-1.5 backdrop-blur-md">
                  {isAir ? <Plane className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#2A6DFF] shrink-0" /> : <Ship className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-cyan-600 shrink-0" />}
                  <span className="truncate">{isAir ? 'Aérien Express (12-18j)' : 'Maritime (30-45j)'}</span>
                </span>
              </div>

              {/* Favorite Button */}
              <button
                onClick={() => toggleFavorite(product.id)}
                aria-label="Favoris"
                className={`pointer-events-auto shrink-0 w-8 h-8 sm:w-10 sm:h-10 rounded-full glass-panel flex items-center justify-center transition-all shadow-sm ${
                  fav
                    ? 'bg-rose-50 text-rose-600 border-rose-200 shadow-md scale-105'
                    : 'bg-white/90 text-slate-600 hover:text-rose-500 hover:bg-white'
                }`}
              >
                <Heart className={`w-4 h-4 sm:w-5 sm:h-5 ${fav ? 'fill-rose-500 text-rose-500' : ''}`} />
              </button>
            </div>
          </div>

          {/* Thumbnails Row */}
          {(product?.images || []).length > 1 && (
            <div className="flex gap-3 overflow-x-auto no-scrollbar py-1">
              {(product?.images || []).map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveImageIndex(idx)}
                  className={`relative w-20 h-20 rounded-2xl overflow-hidden glass-panel shrink-0 p-1 border-2 transition-all ${
                    activeImageIndex === idx
                      ? 'border-[#2A6DFF] ring-2 ring-blue-100 shadow-md scale-102'
                      : 'border-transparent opacity-70 hover:opacity-100'
                  }`}
                >
                  <img src={img} alt="Aperçu" className="w-full h-full object-cover rounded-xl" />
                </button>
              ))}
            </div>
          )}

          {/* Trust Guarantees Strip under gallery */}
          <div className="glass-panel bg-white/70 rounded-2xl p-4 border border-slate-200 grid grid-cols-2 gap-3 text-xs">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-[#2A6DFF] shrink-0" />
              <span className="text-slate-700 font-medium">Contrôle qualité certifié à Guangzhou</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <span className="text-slate-700 font-medium">Dédouanement Gaindé 100% inclus</span>
            </div>
          </div>
        </div>

        {/* Right Column: Product Buy Box & Specs (7 cols) */}
        <div className="lg:col-span-6 space-y-6">
          {/* Header Title & Rating */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-[#2A6DFF] uppercase tracking-wider">
                {product.category}
              </span>
              <div className="flex items-center gap-1.5 text-xs font-bold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
                <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                <span>{product.rating} / 5</span>
                <span className="text-slate-400 font-normal">({product.reviewsCount} avis certifiés)</span>
              </div>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-[#0D2C7A] tracking-tight leading-tight">
              {product.name}
            </h1>

            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              {product.shortDescription}
            </p>
          </div>

          {/* Groupage Choice Box (if applicable) */}
          {groupage && (
            <div className="glass-panel bg-gradient-to-br from-amber-50/80 to-orange-50/50 rounded-3xl p-5 border-2 border-amber-400/50 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Flame className="w-5 h-5 text-amber-500 fill-amber-500" />
                  <span className="text-xs font-black text-amber-950 uppercase tracking-wider">
                    Option Achat Groupé Active ({groupage.code})
                  </span>
                </div>
                <span className="text-xs font-bold text-amber-800 bg-amber-200/80 px-2.5 py-0.5 rounded-full">
                  -{groupage.savingsPercent}% d'économie
                </span>
              </div>

              <div className="space-y-1">
                <ProgressBar
                  current={groupage.currentUnits}
                  target={groupage.targetUnits}
                  size="md"
                  variant="amber"
                />
                <div className="flex justify-between text-[11px] text-amber-900 font-medium pt-1">
                  <span>Clôture du lot : {groupage.closingDate}</span>
                  <span>{groupage.participantsCount} personnes inscrites</span>
                </div>
              </div>
            </div>
          )}

          {/* Pricing Box with Strict Separation */}
          <div className="glass-panel bg-white/95 rounded-3xl p-5 border border-slate-200 space-y-4">
            <LogisticsPriceSplit
              productPriceXOF={(product.productPriceXOF || Math.round(product.priceXOF * 0.65)) * selectedQuantity}
              logisticsPriceXOF={(product.estimatedLogisticsXOF || Math.round(product.priceXOF * 0.35)) * selectedQuantity}
              totalPriceXOF={product.priceXOF * selectedQuantity}
              productStatus="confirmed"
              logisticsStatus="estimated"
              transportMode={product.defaultTransportMode}
              weightKg={product.weightKg ? product.weightKg * selectedQuantity : undefined}
              cbm={product.cbm ? product.cbm * selectedQuantity : undefined}
            />

            {/* Quantity Selector & Order Buttons */}
            <div className="space-y-3 pt-3 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-slate-700">Quantité :</span>
                  <div className="flex items-center border border-slate-200 rounded-xl bg-white p-1">
                    <button
                      onClick={() => setSelectedQuantity(Math.max(1, selectedQuantity - 1))}
                      className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 font-bold text-slate-700 flex items-center justify-center transition-colors"
                    >
                      -
                    </button>
                    <span className="w-12 text-center font-bold text-[#0D2C7A] text-sm font-mono-numeric">
                      {selectedQuantity}
                    </span>
                    <button
                      onClick={() => setSelectedQuantity(selectedQuantity + 1)}
                      className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 font-bold text-slate-700 flex items-center justify-center transition-colors"
                    >
                      +
                    </button>
                  </div>
                </div>

                <span className="text-xs text-slate-500 font-mono-numeric font-medium">
                  MOQ : <strong>{product.moq} pc</strong>
                </span>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <button
                  onClick={handleAddToCart}
                  className="w-full bg-white hover:bg-slate-50 text-[#0D2C7A] font-bold text-sm py-3.5 px-5 rounded-2xl border-2 border-[#0D2C7A] shadow-xs flex items-center justify-center gap-2 transition-all active:scale-95"
                >
                  <ShoppingBag className="w-4 h-4 text-[#0D2C7A]" />
                  <span>Ajouter au panier</span>
                </button>

                <button
                  onClick={handleBuyNow}
                  className="w-full bg-[#0D2C7A] hover:bg-[#2A6DFF] text-white font-black text-sm py-3.5 px-5 rounded-2xl shadow-xl flex items-center justify-center gap-2 transition-all active:scale-95"
                >
                  <span>Commander maintenant</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>

              {/* B2B / Custom Sourcing CTA */}
              <div className="pt-2">
                <button
                  onClick={() => {
                    navigate(`/b2b?product=${encodeURIComponent(product.name)}&moq=${product.moq * 5}`);
                  }}
                  className="w-full bg-blue-50/80 hover:bg-blue-100 text-[#0D2C7A] font-bold text-xs py-2.5 px-4 rounded-xl border border-blue-200 flex items-center justify-center gap-2 transition-colors"
                >
                  <FileText className="w-4 h-4 text-[#2A6DFF]" />
                  <span>Demander un devis B2B / Personnalisation (logo, volume gros)</span>
                </button>
              </div>
            </div>
          </div>

          {/* Logistics Summary Box */}
          <div className="glass-panel bg-slate-50/80 rounded-3xl p-5 border border-slate-200 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#0D2C7A] flex items-center gap-1.5">
              <Truck className="w-4 h-4 text-[#2A6DFF]" />
              <span>Fiche Logistique & Acheminement</span>
            </h4>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-2.5 rounded-xl bg-white border border-slate-200/80">
                <span className="text-slate-400 text-[10px] block">Poids unitaire</span>
                <strong className="text-[#0D2C7A] font-mono-numeric font-bold">
                  {product.weightKg} kg
                </strong>
              </div>

              <div className="p-2.5 rounded-xl bg-white border border-slate-200/80">
                <span className="text-slate-400 text-[10px] block">Dimensions carton</span>
                <strong className="text-[#0D2C7A] font-mono-numeric font-bold">
                  {product.dimensionsCm.length}x{product.dimensionsCm.width}x{product.dimensionsCm.height} cm
                </strong>
              </div>

              <div className="p-2.5 rounded-xl bg-white border border-slate-200/80">
                <span className="text-slate-400 text-[10px] block">Hub Chine</span>
                <strong className="text-[#0D2C7A] font-bold">
                  Guangzhou / Yiwu
                </strong>
              </div>

              <div className="p-2.5 rounded-xl bg-white border border-slate-200/80">
                <span className="text-slate-400 text-[10px] block">Retrait Gratuit</span>
                <strong className="text-[#0D2C7A] font-bold">
                  Hubs Dakar & Thiès
                </strong>
              </div>

              <div className="p-2.5 rounded-xl bg-white border border-slate-200/80">
                <span className="text-slate-400 text-[10px] block">Délai indicatif</span>
                <strong className="text-[#0D2C7A] font-bold">
                  {isAir ? '12 à 18 jours' : '30 à 45 jours'}
                </strong>
              </div>

              <div className="p-2.5 rounded-xl bg-white border border-slate-200/80">
                <span className="text-slate-400 text-[10px] block">Suivi bordereau</span>
                <strong className="text-emerald-700 font-bold">
                  Numéro AWP inclus
                </strong>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Tabs: Description / Technical Specs / Quality Inspection / Certified Reviews */}
      <div className="glass-panel bg-white/80 rounded-3xl p-6 sm:p-8 border border-white shadow-sm space-y-6">
        <div className="flex border-b border-slate-200 overflow-x-auto no-scrollbar gap-2 sm:gap-6">
          <button
            onClick={() => setActiveTab('specs')}
            className={`py-3 px-2 text-xs sm:text-sm font-bold border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'specs'
                ? 'border-[#0D2C7A] text-[#0D2C7A]'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Spécifications & Description
          </button>

          <button
            onClick={() => setActiveTab('quality')}
            className={`py-3 px-2 text-xs sm:text-sm font-bold border-b-2 transition-colors whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'quality'
                ? 'border-[#0D2C7A] text-[#0D2C7A]'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <ShieldCheck className="w-4 h-4 text-[#2A6DFF]" />
            <span>Contrôle Qualité & Usine</span>
          </button>

          <button
            onClick={() => setActiveTab('reviews')}
            className={`py-3 px-2 text-xs sm:text-sm font-bold border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'reviews'
                ? 'border-[#0D2C7A] text-[#0D2C7A]'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Avis Clients Sénégal ({product.reviewsCount})
          </button>

          <button
            onClick={() => setActiveTab('faq')}
            className={`py-3 px-2 text-xs sm:text-sm font-bold border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'faq'
                ? 'border-[#0D2C7A] text-[#0D2C7A]'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            FAQ & Livraison Hubs
          </button>
        </div>

        {/* Tab 1: Specs */}
        {activeTab === 'specs' && (
          <div className="space-y-6">
            <div className="space-y-2">
              <h3 className="text-base font-bold text-[#0D2C7A]">Description détaillée</h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                {product.fullDescription}
              </p>
            </div>

            <div className="space-y-3">
              <h3 className="text-base font-bold text-[#0D2C7A]">Caractéristiques techniques</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {Object.entries(product?.specifications || {}).map(([key, val]) => (
                  <div
                    key={key}
                    className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-200/70 text-xs"
                  >
                    <span className="text-slate-500 font-medium">{key}</span>
                    <strong className="text-[#0D2C7A] text-right font-semibold">{val}</strong>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Quality Inspection */}
        {activeTab === 'quality' && (
          <div className="space-y-4">
            <div className="bg-blue-50/80 p-5 rounded-2xl border border-blue-200/80 space-y-2">
              <h4 className="text-sm font-bold text-[#0D2C7A] flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-[#2A6DFF]" />
                <span>Rapport de Contrôle Qualité en Entrepôt Chine</span>
              </h4>
              <p className="text-xs text-slate-700 leading-relaxed">
                Tous les articles de ce lot sont systématiquement inspectés par nos agents sur place à Guangzhou et Yiwu avant mise en conteneur ou colis aérien.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                <strong className="text-[#0D2C7A] block">1. Test d'allumage & Conformité</strong>
                <span className="text-slate-600">Vérification de la tension 220V et des accessoires inclus.</span>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                <strong className="text-[#0D2C7A] block">2. Emballage Renforcé Export</strong>
                <span className="text-slate-600">Protection bulles et cornières pour résister au transit maritime/aérien.</span>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                <strong className="text-[#0D2C7A] block">3. Scellé de Sécurité SinoSenegal</strong>
                <span className="text-slate-600">Bande de garantie inviolable avec code AWP apposé.</span>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Reviews */}
        {activeTab === 'reviews' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <strong className="text-xl font-black text-[#0D2C7A]">{product.rating} / 5</strong>
                <span className="text-xs text-slate-500 block">Basé sur {product.reviewsCount} avis vérifiés</span>
              </div>
            </div>

            <div className="space-y-3">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <strong className="text-[#0D2C7A]">Mamadou S. (Dakar Almadies)</strong>
                  <span className="text-amber-500 font-bold">★★★★★</span>
                </div>
                <p className="text-xs text-slate-600">
                  "Produit conforme à la description, reçu au Hub Almadies en 14 jours par avion. Rapport qualité-prix imbattable par rapport au marché local."
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <strong className="text-[#0D2C7A]">Awa D. (Plateau)</strong>
                  <span className="text-amber-500 font-bold">★★★★★</span>
                </div>
                <p className="text-xs text-slate-600">
                  "J'ai participé au groupage, le suivi AWP était très clair du départ de Guangzhou jusqu'à Sandaga. Je recommande !"
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: FAQ */}
        {activeTab === 'faq' && (
          <div className="space-y-3 text-xs sm:text-sm">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
              <strong className="text-[#0D2C7A] block font-bold">Où puis-je retirer mon colis ?</strong>
              <p className="text-slate-600">
                Vous pouvez retirer gratuitement votre colis dans nos Hubs de Dakar (Almadies, Sandaga, Pikine, Diamniadio) ou Thiès Escale dès notification SMS/WhatsApp. Une option de livraison à domicile est également disponible à Dakar (+2 000 FCFA).
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
              <strong className="text-[#0D2C7A] block font-bold">Y a-t-il des frais de douane supplémentaires ?</strong>
              <p className="text-slate-600">
                Non. Tous les prix affichés sur SinoSenegal sont TTC et incluent le fret international, l'assurance transport et le dédouanement complet Gaindé au Port ou à l'Aéroport de Dakar.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Related Products Grid */}
      {relatedProducts.length > 0 && (
        <section className="space-y-6">
          <h3 className="text-xl sm:text-2xl font-black text-[#0D2C7A]">
            Articles similaires dans cette catégorie
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {relatedProducts.map(p => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
};
