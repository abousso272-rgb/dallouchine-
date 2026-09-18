import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Search, X, TrendingUp, Sparkles, ArrowRight, Package, Tag } from 'lucide-react';

interface SearchBarProps {
  placeholder?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'floating' | 'header' | 'hero';
  className?: string;
  onSearchSubmit?: (term: string) => void;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  placeholder = 'Que recherchez-vous ? (ex: Projecteur, Panneau solaire, Outillage...)',
  size = 'md',
  variant = 'floating',
  className = '',
  onSearchSubmit
}) => {
  const { products, categories, navigate, setSearchQuery } = useApp();
  const [inputValue, setInputValue] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const popularSearches = [
    'Mini Vidéoprojecteur',
    'Compresseur sans fil auto',
    'Panneau solaire pliable 100W',
    'Écouteurs sans fil ANC',
    'Sac à dos antivol imperméable',
    'Armoire modulable pliable',
    'Chargeur GaN 65W'
  ];

  // Filtered matching products
  const matchingProducts = inputValue.trim()
    ? (products || [])
        .filter(
          p =>
            (p?.name || '').toLowerCase().includes((inputValue || '').toLowerCase()) ||
            (p?.category || '').toLowerCase().includes((inputValue || '').toLowerCase()) ||
            (p?.tags || []).some(t => (t || '').toLowerCase().includes((inputValue || '').toLowerCase()))
        )
        .slice(0, 5)
    : [];

  // Filtered matching categories
  const matchingCategories = inputValue.trim()
    ? (categories || [])
        .filter(c => (c?.name || '').toLowerCase().includes((inputValue || '').toLowerCase()))
        .slice(0, 3)
    : [];

  const handleSelectTerm = (term: string) => {
    setInputValue(term);
    setSearchQuery(term);
    setIsOpen(false);
    if (onSearchSubmit) {
      onSearchSubmit(term);
    } else {
      navigate(`/products?search=${encodeURIComponent(term)}`);
    }
  };

  const handleSelectProduct = (slug: string) => {
    setIsOpen(false);
    navigate(`/products/${slug}`);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;
    handleSelectTerm(inputValue.trim());
  };

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const sizeClasses = {
    sm: 'h-10 text-xs px-3.5',
    md: 'h-12 text-sm px-4',
    lg: 'h-14 sm:h-16 text-sm sm:text-base px-5'
  };

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-5 h-5 sm:w-6 sm:h-6'
  };

  return (
    <div ref={dropdownRef} className={`relative w-full ${className}`}>
      <form onSubmit={handleSubmit} className="relative w-full">
        <div
          className={`flex items-center w-full rounded-2xl sm:rounded-3xl transition-all duration-300 ${sizeClasses[size]} ${
            variant === 'hero'
              ? 'glass-panel bg-white/90 border-2 border-[#2A6DFF]/30 shadow-xl focus-within:border-[#2A6DFF] focus-within:bg-white focus-within:shadow-2xl'
              : 'glass-panel bg-white/80 border border-slate-200 shadow-xs focus-within:border-[#2A6DFF] focus-within:bg-white'
          }`}
        >
          <Search
            className={`${iconSizes[size]} text-[#2A6DFF] shrink-0 mr-3 transition-transform group-focus-within:scale-110`}
          />

          <input
            type="text"
            value={inputValue}
            onChange={e => {
              setInputValue(e.target.value);
              setIsOpen(true);
            }}
            onFocus={() => setIsOpen(true)}
            placeholder={placeholder}
            className="w-full bg-transparent text-[#0D2C7A] placeholder:text-slate-400 font-medium outline-hidden"
          />

          {inputValue && (
            <button
              type="button"
              onClick={() => {
                setInputValue('');
                setSearchQuery('');
              }}
              className="p-1 rounded-full hover:bg-slate-200/60 text-slate-400 hover:text-slate-600 transition-colors mr-2"
            >
              <X className="w-4 h-4" />
            </button>
          )}

          {variant === 'header' ? (
            <button
              type="submit"
              className="bg-[#0D2C7A] hover:bg-[#2A6DFF] text-white p-1.5 rounded-lg transition-all shrink-0 flex items-center justify-center shadow-xs"
              title="Rechercher"
            >
              <Search className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              type="submit"
              className="bg-[#0D2C7A] hover:bg-[#2A6DFF] text-white font-bold text-xs sm:text-sm px-4 sm:px-6 py-2 rounded-xl sm:rounded-2xl transition-all duration-200 shrink-0 flex items-center gap-1.5 shadow-md active:scale-95"
            >
              <span>Rechercher</span>
              <ArrowRight className="w-3.5 h-3.5 hidden sm:inline" />
            </button>
          )}
        </div>
      </form>

      {/* Autocomplete & Suggestions Dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 glass-panel bg-white/95 backdrop-blur-2xl border border-white rounded-3xl p-4 sm:p-5 shadow-2xl z-50 animate-in fade-in slide-in-from-top-2 duration-200 max-h-[420px] overflow-y-auto">
          {inputValue.trim() === '' ? (
            <div className="space-y-4">
              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 mb-2.5">
                  <TrendingUp className="w-3.5 h-3.5 text-[#2A6DFF]" />
                  <span>Recherches tendances au Sénégal</span>
                </span>
                <div className="flex flex-wrap gap-2">
                  {popularSearches.map((term, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSelectTerm(term)}
                      className="bg-slate-100 hover:bg-[#2A6DFF]/10 hover:text-[#0D2C7A] hover:border-[#2A6DFF]/30 text-xs font-semibold text-slate-700 px-3 py-1.5 rounded-xl border border-slate-200/80 transition-all duration-150 flex items-center gap-1"
                    >
                      <Sparkles className="w-3 h-3 text-[#2A6DFF]" />
                      <span>{term}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 mb-2">
                  <Tag className="w-3.5 h-3.5 text-[#2A6DFF]" />
                  <span>Catégories Populaires</span>
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {categories.slice(0, 6).map(c => (
                    <button
                      key={c.id}
                      onClick={() => {
                        setIsOpen(false);
                        navigate(`/products?category=${c.slug}`);
                      }}
                      className="text-left text-xs font-semibold text-slate-700 hover:text-[#2A6DFF] p-2 rounded-xl hover:bg-slate-50 transition-colors"
                    >
                      • {c.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {matchingProducts.length > 0 && (
                <div>
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                    Produits correspondants ({matchingProducts.length})
                  </span>
                  <div className="space-y-2">
                    {matchingProducts.map(p => (
                      <div
                        key={p.id}
                        onClick={() => handleSelectProduct(p.slug)}
                        className="flex items-center gap-3 p-2 rounded-2xl hover:bg-slate-100/80 cursor-pointer transition-colors"
                      >
                        <img
                          src={p.images[0]}
                          alt={p.name}
                          className="w-10 h-10 rounded-xl object-cover border border-slate-200"
                        />
                        <div className="flex-1 min-w-0">
                          <h4 className="text-xs font-bold text-[#0D2C7A] truncate">{p.name}</h4>
                          <span className="text-[11px] text-slate-500 font-mono-numeric">
                            {p.priceXOF.toLocaleString('fr-FR')} FCFA • {p.category}
                          </span>
                        </div>
                        {p.isGroupage && (
                          <span className="text-[10px] font-bold bg-amber-500/15 text-amber-800 px-2 py-0.5 rounded-md">
                            Groupage
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {matchingCategories.length > 0 && (
                <div className="pt-2 border-t border-slate-100">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                    Catégories ({matchingCategories.length})
                  </span>
                  <div className="space-y-1">
                    {matchingCategories.map(c => (
                      <button
                        key={c.id}
                        onClick={() => {
                          setIsOpen(false);
                          navigate(`/products?category=${c.slug}`);
                        }}
                        className="w-full text-left flex items-center justify-between p-2 rounded-xl hover:bg-slate-100/80 text-xs font-semibold text-[#0D2C7A]"
                      >
                        <span>{c.name}</span>
                        <span className="text-slate-400 font-mono-numeric">
                          {c.productCount} articles
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {matchingProducts.length === 0 && matchingCategories.length === 0 && (
                <div className="text-center py-6 text-slate-500 text-xs space-y-1">
                  <Package className="w-8 h-8 mx-auto text-slate-300" />
                  <p>Aucun produit ne correspond à "{inputValue}".</p>
                  <button
                    onClick={() => handleSelectTerm(inputValue)}
                    className="text-[#2A6DFF] font-bold underline text-xs"
                  >
                    Voir tous les résultats dans le catalogue
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
