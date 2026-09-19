import React from 'react';
import { useApp } from '../../context/AppContext';
import { Home, Compass, Users2, ShoppingBag, User, Flame } from 'lucide-react';

export const MobileBottomNav: React.FC = () => {
  const { currentPath, navigate, cartCount } = useApp();

  const items = [
    { label: 'Accueil', path: '/', icon: Home },
    { label: 'Explorer', path: '/products', icon: Compass },
    { label: 'Groupages', path: '/groupages', icon: Users2, badge: '🔥' },
    { label: 'Panier', path: '/cart', icon: ShoppingBag, count: cartCount },
    { label: 'Compte', path: '/account', icon: User }
  ];

  return (
    <div className="lg:hidden fixed bottom-3 left-3 right-3 z-50 pointer-events-none pb-[env(safe-area-inset-bottom)]">
      <nav className="pointer-events-auto max-w-md mx-auto glass-mobile-bottom rounded-3xl p-1.5 shadow-2xl border border-white/90 bg-white/90">
        <div className="grid grid-cols-5 gap-1">
          {items.map(item => {
            const Icon = item.icon;
            const isActive =
              item.path === '/'
                ? currentPath === '/'
                : currentPath.startsWith(item.path);

            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`relative flex flex-col items-center justify-center py-2 px-1 rounded-2xl transition-all duration-300 ${
                  isActive
                    ? 'bg-[#0B192C] text-white shadow-md scale-102'
                    : 'text-slate-600 hover:text-[#0B192C] hover:bg-slate-100/50'
                }`}
              >
                <div className="relative">
                  <Icon className={`w-5 h-5 transition-transform ${isActive ? 'scale-110' : ''}`} />

                  {/* Cart Counter Badge */}
                  {item.count !== undefined && item.count > 0 && (
                    <span
                      className="absolute -top-1.5 -right-2 min-w-[16px] h-4 px-1 rounded-full text-[10px] font-black flex items-center justify-center font-mono-numeric shadow-xs bg-[#FF4500] text-white"
                    >
                      {item.count}
                    </span>
                  )}

                  {/* Special groupage badge */}
                  {item.badge && !isActive && (
                    <span className="absolute -top-1 -right-2 text-[10px]">
                      {item.badge}
                    </span>
                  )}
                </div>

                <span
                  className={`text-[10px] font-bold mt-1 tracking-tight truncate max-w-full ${
                    isActive ? 'text-white font-black' : 'text-slate-600'
                  }`}
                >
                  {item.label}
                </span>

                {/* Active Underline Pill */}
                {isActive && (
                  <span className="absolute -bottom-0.5 w-3 h-1 bg-amber-400 rounded-full" />
                )}
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
};
