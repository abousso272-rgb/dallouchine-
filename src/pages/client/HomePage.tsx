import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { SearchBar } from '../../components/common/SearchBar';
import { ProductCarousel } from '../../components/common/ProductCarousel';
import { TrustCard } from '../../components/common/TrustCard';
import { CategoryCard } from '../../components/common/CategoryCard';
import { GroupBuyCard } from '../../components/common/GroupBuyCard';
import { ProductCard } from '../../components/common/ProductCard';
import { SectionHeader } from '../../components/common/SectionHeader';
import {
  ShieldCheck,
  Search,
  Package,
  Plane,
  Building,
  ArrowRight,
  Sparkles,
  Users2,
  TrendingUp,
  CheckCircle2,
  Clock,
  Layers,
  ChevronRight,
  HelpCircle,
  Truck,
  DollarSign,
  PlusCircle,
  Flame,
  Award
} from 'lucide-react';

export const HomePage: React.FC = () => {
  const { products, categories, groupages, navigate } = useApp();

  // Active filter tab for the embedded catalog section
  const [catalogCategory, setCatalogCategory] = useState<string>('all');
  const [catalogSort, setCatalogSort] = useState<string>('popular');

  const filteredCatalogProducts = products
    .filter(p => (catalogCategory === 'all' ? true : (p?.category || '').toLowerCase().includes((catalogCategory || '').toLowerCase())))
    .sort((a, b) => {
      if (catalogSort === 'price_asc') return a.priceXOF - b.priceXOF;
      if (catalogSort === 'price_desc') return b.priceXOF - a.priceXOF;
      if (catalogSort === 'rating') return b.rating - a.rating;
      return (b.moq * 5) - (a.moq * 5); // popular
    });

  return (
    <div className="space-y-16 sm:space-y-24 pb-16 overflow-x-hidden">
      {/* ========================================================================= */}
      {/* 1. HERO SECTION */}
      {/* ========================================================================= */}
      <section className="relative pt-2 sm:pt-6 text-center max-w-5xl mx-auto space-y-6 sm:space-y-8 px-1">
        {/* Top Eyebrow Chip */}
        <div className="inline-flex items-center justify-center gap-2 px-3 sm:px-4 py-1.5 rounded-full glass-panel bg-white/95 border border-[#2A6DFF]/30 text-[#0D2C7A] text-[11px] sm:text-sm font-bold shadow-xs max-w-full">
          <span className="w-2 h-2 rounded-full bg-[#2A6DFF] animate-ping shrink-0" />
          <span className="truncate">Sourcing Direct Chine 🇨🇳 ➔ Hubs Relais Sénégal 🇸🇳</span>
        </div>

        {/* Hero Title & Subtitle */}
        <div className="space-y-3 sm:space-y-4 max-w-4xl mx-auto px-2">
          <h1 className="text-2xl sm:text-5xl lg:text-6xl font-black text-[#0D2C7A] tracking-tight leading-[1.15]">
            Les meilleurs produits de Chine,{' '}
            <span className="bg-gradient-to-r from-[#0D2C7A] via-[#2A6DFF] to-blue-600 bg-clip-text text-transparent">
              directement au Sénégal.
            </span>
          </h1>

          <p className="text-xs sm:text-lg text-slate-600 font-normal max-w-2xl mx-auto leading-relaxed">
            Produits sélectionnés, achats groupés négociés et sourcing direct depuis les plus grandes usines chinoises.
          </p>
        </div>

        {/* Hero Central Search Box */}
        <div className="max-w-2xl mx-auto w-full px-1 sm:px-2">
          <SearchBar
            size="lg"
            variant="hero"
            placeholder="Que recherchez-vous ? (ex: Projecteur, Solaire, Outillage...)"
          />
        </div>

        {/* Hero CTA Buttons - Responsive Stacked on Mobile, Inline on Desktop */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-2.5 sm:gap-4 pt-1 sm:pt-2 w-full max-w-md sm:max-w-none mx-auto px-2 sm:px-0">
          <button
            onClick={() => navigate('/products')}
            className="w-full sm:w-auto bg-[#0D2C7A] hover:bg-[#2A6DFF] text-white font-black text-xs sm:text-base px-6 sm:px-8 py-3.5 sm:py-4 rounded-xl sm:rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 transform active:scale-95 flex items-center justify-center gap-2"
          >
            <span>Explorer les produits</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <button
            onClick={() => navigate('/groupages')}
            className="w-full sm:w-auto glass-panel hover:bg-white text-[#0D2C7A] font-extrabold text-xs sm:text-base px-5 sm:px-8 py-3.5 sm:py-4 rounded-xl sm:rounded-2xl border-2 border-slate-200/80 shadow-md hover:border-[#2A6DFF] transition-all duration-300 flex items-center justify-center gap-2"
          >
            <Flame className="w-4 h-4 text-amber-500 fill-amber-500 shrink-0" />
            <span>Voir les groupages (-40%)</span>
          </button>
        </div>

        {/* ========================================================================= */}
        {/* 2. HERO — PRODUITS TENDANCE CAROUSEL */}
        {/* ========================================================================= */}
        <div className="pt-4 sm:pt-8">
          <div className="flex items-center justify-between px-2 mb-2 sm:mb-3">
            <span className="text-xs sm:text-sm font-bold text-[#0D2C7A] uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#2A6DFF]" />
              <span>Articles tendances cette semaine</span>
            </span>
            <span className="text-[11px] sm:text-xs text-slate-500 font-medium">Glisser pour voir plus →</span>
          </div>

          <ProductCarousel products={products} />
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 3. SECTION CONFIANCE / RASSURANCE */}
      {/* ========================================================================= */}
      <section className="space-y-6 sm:space-y-8">
        <SectionHeader
          badge="Sécurité & Transparence"
          title="Pourquoi acheter avec nous ?"
          subtitle="Nous combinons présence directe en Chine et réseau logistique au Sénégal pour sécuriser chacun de vos achats."
          align="center"
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5 sm:gap-6">
          <TrustCard
            icon={<ShieldCheck className="w-6 h-6 sm:w-7 sm:h-7 text-[#2A6DFF]" />}
            title="Paiement local sécurisé"
            description="Vos paiements sont traités via des moyens locaux fiables (Wave, Orange Money, Free Money, Carte)."
            badge="Local & Sûr"
          />

          <TrustCard
            icon={<Search className="w-6 h-6 sm:w-7 sm:h-7 text-[#2A6DFF]" />}
            title="Transparence totale"
            description="Vous suivez votre commande étape par étape avec un bordereau de transport AWP en temps réel."
            badge="Traçabilité AWP"
          />

          <TrustCard
            icon={<CheckCircle2 className="w-6 h-6 sm:w-7 sm:h-7 text-[#2A6DFF]" />}
            title="Produits sélectionnés"
            description="Nous sélectionnons et vérifions rigoureusement la qualité usine avant tout départ vers le Sénégal."
            badge="Contrôle Qualité"
          />

          <TrustCard
            icon={<Plane className="w-6 h-6 sm:w-7 sm:h-7 text-[#2A6DFF]" />}
            title="Logistique optimisée"
            description="Nous choisissons le mode de transport le plus rentable (Aérien express ou Maritime groupé)."
            badge="Fret Direct"
          />

          <TrustCard
            icon={<Building className="w-6 h-6 sm:w-7 sm:h-7 text-[#2A6DFF]" />}
            title="Sourcing en Chine"
            description="Nous travaillons directement avec nos équipes et fabricants partenaires basés à Guangzhou et Yiwu."
            badge="Direct Usines"
          />
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 4. SECTION CATÉGORIES */}
      {/* ========================================================================= */}
      <section className="space-y-6 sm:space-y-8">
        <SectionHeader
          badge="Catalogue Complet"
          title="Explorez nos catégories"
          subtitle="Des milliers d'articles sourcés aux prix d'usine les plus compétitifs du marché."
          actionText="Voir tout"
          onAction={() => navigate('/products')}
        />

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-5">
          {categories.map(cat => (
            <CategoryCard key={cat.id} category={cat} />
          ))}
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 5. SECTION GROUPAGES DU MOMENT */}
      {/* ========================================================================= */}
      <section className="space-y-6 sm:space-y-8 bg-gradient-to-br from-blue-900/5 via-transparent to-amber-500/5 p-4 sm:p-10 rounded-2xl sm:rounded-3xl border border-blue-900/10">
        <SectionHeader
          badge="Achats Groupés en Cours"
          title="Les achats groupés du moment"
          subtitle="Plus nous commandons ensemble, plus nous pouvons négocier auprès des fabricants chinois."
          actionText="Voir tous les groupages"
          onAction={() => navigate('/groupages')}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          {groupages.slice(0, 4).map(grp => (
            <GroupBuyCard key={grp.id} groupage={grp} />
          ))}
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 6. SECTION CATALOGUE PRODUITS */}
      {/* ========================================================================= */}
      <section className="space-y-6 sm:space-y-8">
        <SectionHeader
          badge="Catalogue E-Commerce"
          title="Découvrez nos produits"
          subtitle="Des nouveautés vérifiées, disponibles en commande individuelle ou groupée."
          actionText="Grand catalogue"
          onAction={() => navigate('/products')}
        />

        {/* Filter Pills & Sorting Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 glass-panel bg-white/70 p-3 sm:p-4 rounded-2xl border border-slate-200">
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5">
            <button
              onClick={() => setCatalogCategory('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                catalogCategory === 'all'
                  ? 'bg-[#0D2C7A] text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Tous ({products.length})
            </button>

            <button
              onClick={() => setCatalogCategory('High-Tech')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                catalogCategory === 'High-Tech'
                  ? 'bg-[#0D2C7A] text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              High-Tech
            </button>

            <button
              onClick={() => setCatalogCategory('Auto')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                catalogCategory === 'Auto'
                  ? 'bg-[#0D2C7A] text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Auto & Outils
            </button>

            <button
              onClick={() => setCatalogCategory('Maison')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                catalogCategory === 'Maison'
                  ? 'bg-[#0D2C7A] text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Maison & Solaire
            </button>
          </div>

          {/* Sort Selector */}
          <div className="flex items-center justify-between sm:justify-end gap-2 shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-100">
            <span className="text-xs text-slate-500 font-medium">Trier :</span>
            <select
              value={catalogSort}
              onChange={e => setCatalogSort(e.target.value)}
              className="bg-white text-xs font-bold text-[#0D2C7A] border border-slate-200 rounded-xl px-2.5 py-1.5 outline-hidden cursor-pointer"
            >
              <option value="popular">Popularité</option>
              <option value="rating">Notes ★</option>
              <option value="price_asc">Prix croissant</option>
              <option value="price_desc">Prix décroissant</option>
            </select>
          </div>
        </div>

        {/* Products Grid (2 columns on mobile, 4 columns on desktop) */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
          {filteredCatalogProducts.slice(0, 8).map(prod => (
            <ProductCard key={prod.id} product={prod} />
          ))}
        </div>

        <div className="text-center pt-2 sm:pt-4">
          <button
            onClick={() => navigate('/products')}
            className="w-full sm:w-auto bg-white hover:bg-slate-50 text-[#0D2C7A] font-black text-xs sm:text-sm px-6 sm:px-8 py-3.5 rounded-2xl border-2 border-slate-200 shadow-xs hover:border-[#2A6DFF] transition-all inline-flex items-center justify-center gap-2"
          >
            <span>Explorer tout le catalogue ({products.length} produits)</span>
            <ArrowRight className="w-4 h-4 text-[#2A6DFF]" />
          </button>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 7. SECTION COMMENT ÇA MARCHE */}
      {/* ========================================================================= */}
      <section className="glass-panel bg-white/80 rounded-2xl sm:rounded-3xl p-5 sm:p-12 border border-white/90 shadow-sm space-y-8 sm:space-y-10">
        <SectionHeader
          badge="Processus Simplifié"
          title="De la Chine jusqu'à votre porte."
          subtitle="Un parcours d'achat fluide, transparent et sécurisé du premier clic jusqu'à la livraison finale."
          align="center"
        />

        {/* 5 Steps Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 sm:gap-6 relative">
          <div className="relative text-center space-y-2.5 p-4 rounded-2xl bg-white/50 border border-slate-100 group hover:bg-white transition-colors">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-[#0D2C7A] text-white font-black text-base sm:text-lg flex items-center justify-center mx-auto shadow-md group-hover:scale-105 group-hover:bg-[#2A6DFF] transition-all">
              1
            </div>
            <h4 className="text-sm sm:text-base font-bold text-[#0D2C7A]">Vous choisissez</h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              Sélectionnez un produit individuel ou participez à un groupage actif.
            </p>
          </div>

          <div className="relative text-center space-y-2.5 p-4 rounded-2xl bg-white/50 border border-slate-100 group hover:bg-white transition-colors">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-[#0D2C7A] text-white font-black text-base sm:text-lg flex items-center justify-center mx-auto shadow-md group-hover:scale-105 group-hover:bg-[#2A6DFF] transition-all">
              2
            </div>
            <h4 className="text-sm sm:text-base font-bold text-[#0D2C7A]">Paiement Sécurisé</h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              Payez en FCFA en toute confiance via Wave, Orange Money ou Carte.
            </p>
          </div>

          <div className="relative text-center space-y-2.5 p-4 rounded-2xl bg-white/50 border border-slate-100 group hover:bg-white transition-colors">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-[#0D2C7A] text-white font-black text-base sm:text-lg flex items-center justify-center mx-auto shadow-md group-hover:scale-105 group-hover:bg-[#2A6DFF] transition-all">
              3
            </div>
            <h4 className="text-sm sm:text-base font-bold text-[#0D2C7A]">Audit Usine</h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              Nos agents vérifient la conformité avant le départ depuis Guangzhou/Yiwu.
            </p>
          </div>

          <div className="relative text-center space-y-2.5 p-4 rounded-2xl bg-white/50 border border-slate-100 group hover:bg-white transition-colors">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-[#0D2C7A] text-white font-black text-base sm:text-lg flex items-center justify-center mx-auto shadow-md group-hover:scale-105 group-hover:bg-[#2A6DFF] transition-all">
              4
            </div>
            <h4 className="text-sm sm:text-base font-bold text-[#0D2C7A]">Acheminement</h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              Suivi AWP en direct avec dédouanement officiel Gaindé assuré.
            </p>
          </div>

          <div className="relative text-center space-y-2.5 p-4 rounded-2xl bg-white/50 border border-slate-100 group hover:bg-white transition-colors sm:col-span-2 lg:col-span-1">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-[#2A6DFF] text-white font-black text-base sm:text-lg flex items-center justify-center mx-auto shadow-md group-hover:scale-105 transition-all">
              5
            </div>
            <h4 className="text-sm sm:text-base font-bold text-[#0D2C7A]">Retrait ou Domicile</h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              Retrait sans frais dans un Hub Dakar/Régions ou livraison à domicile.
            </p>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 8. SECTION B2B & GROSSISTES */}
      {/* ========================================================================= */}
      <section className="relative rounded-2xl sm:rounded-3xl overflow-hidden bg-gradient-to-br from-[#0D2C7A] via-[#12368D] to-[#0A1F52] text-white p-6 sm:p-12 shadow-2xl">
        <div className="relative z-10 max-w-3xl space-y-5 sm:space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-blue-200 text-xs font-bold backdrop-blur-md">
            <Building className="w-3.5 h-3.5 text-blue-300" />
            <span>Offre Dédiée aux Professionnels & Commerçants</span>
          </div>

          <h2 className="text-2xl sm:text-4xl font-black tracking-tight leading-tight">
            Vous achetez en gros volume ou par conteneur ?
          </h2>

          <p className="text-xs sm:text-base text-blue-100 leading-relaxed">
            Profitez de nos services de sourcing sur-mesure, de négociation directe en usine chinoise, d'audits qualité avec vidéos et d'une logistique conteneur complète vers le Port Autonome de Dakar.
          </p>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
            <button
              onClick={() => navigate('/b2b')}
              className="bg-white text-[#0D2C7A] hover:bg-blue-50 font-black text-xs sm:text-sm px-6 py-3.5 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2"
            >
              <span>Demander un devis B2B</span>
              <ArrowRight className="w-4 h-4 text-[#2A6DFF]" />
            </button>

            <button
              onClick={() => navigate('/request')}
              className="glass-panel text-white hover:bg-white/10 font-bold text-xs sm:text-sm px-6 py-3.5 rounded-xl border border-white/20 transition-all flex items-center justify-center gap-2"
            >
              <span>Demande de Sourcing Spécifique</span>
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
