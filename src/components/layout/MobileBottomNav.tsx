import React from 'react';
import { useApp } from '../../context/AppContext';
import { Home, Compass, Users2, ShoppingBag, User, Flame } from 'lucide-react';

export const MobileBottomNav: React.FC = () => {
  const { currentPath, navigate, cartCount, currentUser, openAuthModal } = useApp();

  const handleAccountClick = () => {
    if (!currentUser.isLoggedIn) {
      openAuthModal('client');
    } else if (currentUser.role === 'admin') {
      navigate('/admin');
    } else if (currentUser.role === 'collaborateur') {
      navigate('/collaborateur');
    } else {
      navigate('/client');
    }
  };

  const items = [
    { label: 'Accueil', path: '/', icon: Home, onClick: () => navigate('/') },
    { label: 'Catalogue', path: '/products', icon: Compass, onClick: () => navigate('/products') },
    { label: 'Groupages', path: '/groupages', icon: Users2, badge: '🔥', onClick: () => navigate('/groupages') },
    { label: 'Panier', path: '/cart', icon: ShoppingBag, count: cartCount, onClick: () => navigate('/cart') },
    { 
      label: currentUser.isLoggedIn ? (currentUser.name?.split(' ')[0] || 'Compte') : 'Connexion', 
      path: '/client', 
      icon: User, 
      onClick: handleAccountClick 
    }
  ];

  return (
    <div className="lg:hidden fixed bottom-3 left-2.5 right-2.5 z-40 pointer-events-none pb-[env(safe-area-inset-bottom)]">
      <nav className="pointer-events-auto max-w-md mx-auto rounded-3xl p-1.5 shadow-2xl border border-white/90 bg-white/95 backdrop-blur-md">
        <div className="grid grid-cols-5 gap-1">
          {items.map(item => {
            const Icon = item.icon;
            const isActive =
              item.path === '/'
                ? currentPath === '/'
                : currentPath.startsWith(item.path) || (item.path === '/client' && (currentPath === '/account' || currentPath === '/collaborateur' || currentPath === '/admin'));

            return (
              <button
                key={item.label}
                onClick={item.onClick}
                className={`relative flex flex-col items-center justify-center py-2 px-0.5 rounded-2xl transition-all duration-200 cursor-pointer ${
                  isActive
                    ? 'bg-[#0B192C] text-white shadow-md'
                    : 'text-slate-600 hover:text-[#0B192C] active:bg-slate-100'
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
