import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { ProductCard } from '../common/ProductCard';
import {
  Search,
  Shirt,
  Home,
  Smartphone,
  Sparkles,
  Utensils,
  Store,
  Wrench,
  PartyPopper,
  Palette,
  ArrowRight
} from 'lucide-react';

export const MarketplaceMockupSection: React.FC = () => {
  const { products, navigate } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('all');

  const categories = [
    { id: 'mode', label: 'Mode', icon: Shirt, keyword: 'mode' },
    { id: 'maison', label: 'Maison', icon: Home, keyword: 'maison' },
    { id: 'electronique', label: 'Électronique', icon: Smartphone, keyword: 'électronique' },
    { id: 'beaute', label: 'Beauté', icon: Sparkles, keyword: 'beauté' },
    { id: 'restaurant', label: 'Restaurant', icon: Utensils, keyword: 'restaurant' },
    { id: 'commerce', label: 'Commerce', icon: Store, keyword: 'commerce' },
    { id: 'equipements', label: 'Équipements', icon: Wrench, keyword: 'équipement' },
    { id: 'evenementiel', label: 'Événementiel', icon: PartyPopper, keyword: 'événement' },
    { id: 'personnalisation', label: 'Personnalisation', icon: Palette, keyword: 'personnalisation' }
  ];

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchTerm.trim())}`);
    }
  };

  const filteredProducts = products.filter(p => {
    const matchesCategory =
      activeCategory === 'all'
        ? true
        : (p.category || '').toLowerCase().includes(activeCategory.toLowerCase()) ||
          (p.name || '').toLowerCase().includes(activeCategory.toLowerCase());

    const matchesSearch = searchTerm.trim()
      ? p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.category.toLowerCase().includes(searchTerm.toLowerCase())
      : true;

    return matchesCategory && matchesSearch;
  });

  return (
    <section className="space-y-6 pt-4 pb-12">
      {/* ===================================================================== */}
      {/* 1. TOP BAR: NAVY BADGE + SEARCH BAR + CATEGORY ICONS */}
      {/* ===================================================================== */}
      <div className="bg-white rounded-3xl p-4 sm:p-6 border border-slate-100 shadow-sm space-y-5">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
          {/* Left Dark Navy Card with Orange Dot */}
          <div className="bg-[#0B192C] text-white px-5 py-3 rounded-2xl flex items-center gap-3 shrink-0 shadow-sm">
            <span className="w-2.5 h-2.5 rounded-full bg-[#FF4500]" />
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-[#FF4500] block">
                MARKETPLACE
              </span>
              <span className="text-xs sm:text-sm font-bold text-white leading-tight">
                Des milliers de produits venus de Chine
              </span>
            </div>
          </div>

          {/* Search Input Form */}
          <form onSubmit={handleSearchSubmit} className="flex-1 max-w-xl flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Que recherchez-vous ?"
                className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm rounded-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-[#FF4500] focus:ring-1 focus:ring-[#FF4500] outline-hidden transition-all placeholder:text-slate-400"
              />
            </div>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-full bg-[#FF4500] hover:bg-[#E03D00] text-white text-xs sm:text-sm font-bold shadow-xs transition-all shrink-0 cursor-pointer"
            >
              Rechercher
            </button>
          </form>
        </div>

        {/* Categories Horizontal Row with Icons */}
        <div className="pt-2 border-t border-slate-100 overflow-x-auto no-scrollbar">
          <div className="flex items-center justify-between min-w-[700px] gap-2 py-1">
            {/* All Category Pill */}
            <button
              onClick={() => setActiveCategory('all')}
              className={`flex flex-col items-center gap-1.5 p-2 rounded-2xl transition-all shrink-0 cursor-pointer ${
                activeCategory === 'all'
                  ? 'text-[#FF4500] font-bold'
                  : 'text-slate-600 hover:text-[#FF4500]'
              }`}
            >
              <div
                className={`w-11 h-11 rounded-full flex items-center justify-center transition-all ${
                  activeCategory === 'all'
                    ? 'bg-[#FF4500] text-white shadow-md'
                    : 'bg-slate-50 border border-slate-200/80 text-slate-600 hover:bg-orange-50'
                }`}
              >
                <Store className="w-5 h-5" />
              </div>
              <span className="text-[11px] whitespace-nowrap">Tous</span>
            </button>

            {categories.map(cat => {
              const Icon = cat.icon;
              const isSelected = activeCategory.toLowerCase() === cat.keyword.toLowerCase();
              return (
                <button
                  key={cat.id}
                  onClick={() =>
                    setActiveCategory(isSelected ? 'all' : cat.keyword)
                  }
                  className={`flex flex-col items-center gap-1.5 p-2 rounded-2xl transition-all shrink-0 cursor-pointer ${
                    isSelected
                      ? 'text-[#FF4500] font-bold'
                      : 'text-slate-600 hover:text-[#FF4500]'
                  }`}
                >
                  <div
                    className={`w-11 h-11 rounded-full flex items-center justify-center transition-all ${
                      isSelected
                        ? 'bg-[#FF4500] text-white shadow-md'
                        : 'bg-slate-50 border border-slate-200/80 text-slate-600 hover:bg-orange-50'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="text-[11px] whitespace-nowrap">{cat.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* 2. PRODUCTS GRID */}
      {/* ===================================================================== */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
        {(filteredProducts.length > 0 ? filteredProducts : products).slice(0, 8).map(prod => (
          <ProductCard key={prod.id} product={prod} />
        ))}
      </div>

      {/* Bottom Action: Tout le catalogue */}
      <div className="text-center pt-3">
        <button
          onClick={() => navigate('/products')}
          className="px-8 py-3.5 rounded-full bg-white hover:bg-slate-50 text-[#0B192C] font-bold text-xs sm:text-sm border border-slate-200 shadow-xs hover:border-[#FF4500] transition-all inline-flex items-center gap-2 cursor-pointer"
        >
          <span>Découvrir tous les produits sur la Marketplace ({products.length})</span>
          <ArrowRight className="w-4 h-4 text-[#FF4500]" />
        </button>
      </div>
    </section>
  );
};
