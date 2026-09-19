import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { ProductCard } from '../../components/common/ProductCard';
import { SearchBar } from '../../components/common/SearchBar';
import {
  SlidersHorizontal,
  X,
  Plane,
  Ship,
  Flame,
  CheckCircle2,
  ArrowUpDown,
  Layers,
  Sparkles,
  LayoutGrid,
  ListFilter
} from 'lucide-react';

export const CatalogPage: React.FC = () => {
  const { products, categories, searchQuery, setSearchQuery, currentPath } = useApp();

  // Filter States
  const [selectedCategory, setSelectedCategory] = useState<string>(() => {
    if (currentPath === '/auto-mobilite') return 'Auto';
    if (currentPath.includes('category=')) {
      return decodeURIComponent(currentPath.split('category=')[1]?.split('&')[0] || 'all');
    }
    return 'all';
  });
  const [selectedTransport, setSelectedTransport] = useState<string>('all'); // all | air | sea
  const [onlyGroupages, setOnlyGroupages] = useState<boolean>(false);
  const [maxPrice, setMaxPrice] = useState<number>(1500000);
  const [sortBy, setSortBy] = useState<string>('popular');
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState<boolean>(false);

  // Sync category when path changes
  React.useEffect(() => {
    if (currentPath === '/auto-mobilite') {
      setSelectedCategory('Auto');
    } else if (currentPath.includes('category=')) {
      setSelectedCategory(decodeURIComponent(currentPath.split('category=')[1]?.split('&')[0] || 'all'));
    }
  }, [currentPath]);

  // Filter products
  const filteredProducts = useMemo(() => {
    return products
      .filter(p => {
        // Search term
        if (searchQuery.trim()) {
          const q = (searchQuery || '').toLowerCase();
          const matchesName = (p?.name || '').toLowerCase().includes(q);
          const matchesCat = (p?.category || '').toLowerCase().includes(q);
          const matchesTags = (p?.tags || []).some(t => (t || '').toLowerCase().includes(q));
          if (!matchesName && !matchesCat && !matchesTags) return false;
        }

        // Category
        if (selectedCategory !== 'all') {
          if (!(p?.category || '').toLowerCase().includes((selectedCategory || '').toLowerCase())) {
            return false;
          }
        }

        // Transport
        if (selectedTransport !== 'all') {
          if (p.defaultTransportMode !== selectedTransport) return false;
        }

        // Only groupages
        if (onlyGroupages && !p.isGroupage) {
          return false;
        }

        // Price
        if (p.priceXOF > maxPrice) {
          return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'price_asc') return a.priceXOF - b.priceXOF;
        if (sortBy === 'price_desc') return b.priceXOF - a.priceXOF;
        if (sortBy === 'rating') return b.rating - a.rating;
        if (sortBy === 'newest') return (b.id > a.id ? 1 : -1);
        return b.moq * 5 - a.moq * 5; // default popular
      });
  }, [products, searchQuery, selectedCategory, selectedTransport, onlyGroupages, maxPrice, sortBy]);

  const resetFilters = () => {
    setSelectedCategory('all');
    setSelectedTransport('all');
    setOnlyGroupages(false);
    setMaxPrice(300000);
    setSearchQuery('');
  };

  return (
    <div className="space-y-8 pb-16">
      {/* Header Banner */}
      <div className="glass-panel bg-white/70 rounded-3xl p-6 sm:p-8 border border-white/90 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-[#FF4500] block">
              Catalogue Produits SinoSenegal
            </span>
            <h1 className="text-2xl sm:text-4xl font-black text-[#0B192C] tracking-tight">
              Explorer tous les articles ({filteredProducts.length})
            </h1>
            <p className="text-xs sm:text-sm text-slate-600">
              Achetez à l'unité ou profitez des remises groupées sur des centaines de références.
            </p>
          </div>

          <div className="w-full md:w-80">
            <SearchBar size="sm" variant="floating" placeholder="Filtrer par mot-clé..." />
          </div>
        </div>
      </div>

      {/* Main Catalog Layout: Sidebar + Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
        {/* Mobile Filter Toggle Button */}
        <div className="lg:hidden flex items-center justify-between gap-2">
          <button
            onClick={() => setIsMobileFilterOpen(true)}
            className="flex-1 bg-white glass-panel text-[#0B192C] font-bold text-xs py-3 px-4 rounded-2xl border border-slate-200 flex items-center justify-center gap-2 shadow-xs"
          >
            <SlidersHorizontal className="w-4 h-4 text-[#FF4500]" />
            <span>Filtres ({onlyGroupages ? '1 actif' : 'Personnaliser'})</span>
          </button>

          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value)}
            className="bg-white text-xs font-bold text-[#0B192C] border border-slate-200 rounded-2xl px-4 py-3 outline-hidden"
          >
            <option value="popular">Popularité</option>
            <option value="rating">Meilleures notes ★</option>
            <option value="price_asc">Prix croissant</option>
            <option value="price_desc">Prix décroissant</option>
          </select>
        </div>

        {/* Desktop Sidebar Filters */}
        <aside
          className={`lg:block ${
            isMobileFilterOpen
              ? 'fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex justify-end'
              : 'hidden'
          }`}
        >
          <div
            className={`w-full max-w-xs bg-white lg:bg-white/80 lg:glass-panel rounded-3xl p-6 border border-slate-200/80 shadow-md space-y-6 overflow-y-auto max-h-[90vh] ${
              isMobileFilterOpen ? 'h-full m-3 rounded-3xl' : ''
            }`}
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-black text-[#0B192C] flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-[#FF4500]" />
                <span>Filtres</span>
              </h3>

              <div className="flex items-center gap-2">
                <button
                  onClick={resetFilters}
                  className="text-xs font-bold text-slate-500 hover:text-[#FF4500]"
                >
                  Réinitialiser
                </button>
                {isMobileFilterOpen && (
                  <button
                    onClick={() => setIsMobileFilterOpen(false)}
                    className="p-1 rounded-full bg-slate-100 text-slate-500"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Category Filter */}
            <div className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
                Catégorie
              </span>
              <div className="space-y-1">
                <button
                  onClick={() => setSelectedCategory('all')}
                  className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold transition-colors flex items-center justify-between ${
                    selectedCategory === 'all'
                      ? 'bg-[#0B192C] text-white'
                      : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <span>Toutes les catégories</span>
                  <span className="font-mono-numeric text-[11px] opacity-80">{products.length}</span>
                </button>

                {categories.map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory((cat.name || '').split('&')[0].trim())}
                    className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold transition-colors flex items-center justify-between ${
                      (selectedCategory || '').toLowerCase().includes(((cat?.name || '').split('&')[0] || '').trim().toLowerCase())
                        ? 'bg-[#0B192C] text-white'
                        : 'text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <span className="truncate">{cat.name}</span>
                    <span className="font-mono-numeric text-[11px] opacity-80">{cat.productCount}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Groupage Only Switch */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
                Type d'achat
              </span>
              <label className="flex items-center gap-2.5 p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 cursor-pointer">
                <input
                  type="checkbox"
                  checked={onlyGroupages}
                  onChange={e => setOnlyGroupages(e.target.checked)}
                  className="w-4 h-4 text-[#FF4500] rounded-md accent-[#FF4500]"
                />
                <div className="text-xs">
                  <strong className="text-amber-950 font-bold block flex items-center gap-1">
                    <Flame className="w-3.5 h-3.5 text-amber-600 fill-amber-600" />
                    Groupages uniquement
                  </strong>
                  <span className="text-[11px] text-amber-800">Économisez jusqu'à 40%</span>
                </div>
              </label>
            </div>

            {/* Transport Mode Filter */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
                Mode d'expédition
              </span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setSelectedTransport(selectedTransport === 'air' ? 'all' : 'air')}
                  className={`p-2.5 rounded-xl text-xs font-bold border transition-all flex flex-col items-center gap-1 ${
                    selectedTransport === 'air'
                      ? 'bg-[#0B192C] text-white border-[#0B192C]'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <Plane className="w-4 h-4" />
                  <span>Aérien (12-18j)</span>
                </button>

                <button
                  onClick={() => setSelectedTransport(selectedTransport === 'sea' ? 'all' : 'sea')}
                  className={`p-2.5 rounded-xl text-xs font-bold border transition-all flex flex-col items-center gap-1 ${
                    selectedTransport === 'sea'
                      ? 'bg-[#0B192C] text-white border-[#0B192C]'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <Ship className="w-4 h-4" />
                  <span>Maritime (30-45j)</span>
                </button>
              </div>
            </div>

            {/* Price Filter Slider */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="uppercase tracking-wider text-slate-400">Prix max</span>
                <span className="text-[#0B192C] font-mono-numeric">
                  {(maxPrice || 0).toLocaleString('fr-FR')} FCFA
                </span>
              </div>
              <input
                type="range"
                min="5000"
                max="300000"
                step="5000"
                value={maxPrice}
                onChange={e => setMaxPrice(Number(e.target.value))}
                className="w-full accent-[#FF4500]"
              />
            </div>

            {isMobileFilterOpen && (
              <button
                onClick={() => setIsMobileFilterOpen(false)}
                className="w-full bg-[#0B192C] text-white font-bold text-xs py-3 rounded-2xl shadow-md hover:bg-[#FF4500] transition-colors"
              >
                Appliquer les filtres ({filteredProducts.length} résultats)
              </button>
            )}
          </div>
        </aside>

        {/* Right Product Grid */}
        <main className="lg:col-span-3 space-y-6">
          {/* Top Desktop Controls */}
          <div className="hidden lg:flex items-center justify-between glass-panel bg-white/70 px-4 py-3 rounded-2xl border border-slate-200">
            <span className="text-xs font-bold text-slate-600 font-mono-numeric">
              Affichage de <strong>{filteredProducts.length}</strong> produits trouvés
            </span>

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 font-medium">Trier par :</span>
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value)}
                className="bg-white text-xs font-bold text-[#0B192C] border border-slate-200 rounded-xl px-3 py-1.5 outline-hidden cursor-pointer"
              >
                <option value="popular">Popularité & Commandes</option>
                <option value="rating">Meilleures notes ★</option>
                <option value="price_asc">Prix croissant</option>
                <option value="price_desc">Prix décroissant</option>
                <option value="newest">Nouveautés</option>
              </select>
            </div>
          </div>

          {/* Grid Products (2 cols mobile, 3 cols desktop) */}
          {filteredProducts.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
              {filteredProducts.map(prod => (
                <ProductCard key={prod.id} product={prod} />
              ))}
            </div>
          ) : (
            <div className="glass-panel bg-white/80 rounded-3xl p-12 text-center space-y-4 border border-slate-200">
              <div className="w-16 h-16 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto text-2xl">
                🔍
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-[#0B192C]">Aucun produit trouvé</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Aucun article ne correspond à vos critères de recherche. Essayez d'ajuster vos filtres.
                </p>
              </div>
              <button
                onClick={resetFilters}
                className="bg-[#0B192C] text-white text-xs font-bold px-6 py-2.5 rounded-xl shadow-xs hover:bg-[#FF4500] transition-colors"
              >
                Réinitialiser tous les filtres
              </button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};
