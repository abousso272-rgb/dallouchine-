import React from 'react';
import { CategoryItem } from '../../types';
import { useApp } from '../../context/AppContext';
import { ArrowUpRight } from 'lucide-react';

interface CategoryCardProps {
  category: CategoryItem;
  className?: string;
}

export const CategoryCard: React.FC<CategoryCardProps> = ({ category, className = '' }) => {
  const { navigate, setSelectedCategorySlug } = useApp();

  const handleClick = () => {
    setSelectedCategorySlug(category.slug);
    navigate(`/products?category=${category.slug}`);
  };

  return (
    <div
      onClick={handleClick}
      className={`glass-panel glass-card-hover group relative rounded-3xl overflow-hidden cursor-pointer border border-white/80 bg-white/70 shadow-sm flex flex-col justify-end p-5 min-h-[220px] sm:min-h-[260px] ${className}`}
    >
      {/* Background Image with smooth zoom on hover */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <img
          src={category.image}
          alt={category.name}
          className="w-full h-full object-cover transform group-hover:scale-108 transition-transform duration-700 ease-out brightness-90 group-hover:brightness-95"
          loading="lazy"
        />
        {/* Soft Glass gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0D2C7A]/90 via-[#0D2C7A]/40 to-transparent" />
      </div>

      {/* Top Tag */}
      {category.featuredTag && (
        <div className="absolute top-3.5 left-3.5 z-10">
          <span className="glass-panel text-[10px] font-bold text-white px-2.5 py-1 rounded-full shadow-xs bg-[#0D2C7A]/60 border-white/30 backdrop-blur-md">
            {category.featuredTag}
          </span>
        </div>
      )}

      {/* Top Right Arrow */}
      <div className="absolute top-3.5 right-3.5 z-10 w-8 h-8 rounded-full glass-panel bg-white/80 text-[#0D2C7A] flex items-center justify-center transform group-hover:rotate-45 group-hover:bg-[#2A6DFF] group-hover:text-white transition-all duration-300 shadow-xs">
        <ArrowUpRight className="w-4 h-4" />
      </div>

      {/* Card Details */}
      <div className="relative z-10 text-white space-y-1">
        <span className="text-[11px] font-semibold text-blue-200 uppercase tracking-wider block font-mono-numeric">
          {category.productCount} articles sourcés
        </span>
        <h3 className="text-base sm:text-lg font-black tracking-tight leading-snug group-hover:text-amber-300 transition-colors">
          {category.name}
        </h3>
        <p className="text-xs text-slate-200 line-clamp-1 opacity-80 group-hover:opacity-100 transition-opacity">
          {category.description}
        </p>
      </div>
    </div>
  );
};
