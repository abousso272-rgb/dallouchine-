import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { SearchBar } from '../common/SearchBar';
import {
  ShoppingBag,
  Heart,
  User,
  Package,
  Plane,
  Menu,
  X,
  Search,
  Building2,
  Users2,
  Sparkles,
  Flame,
  Globe2,
  ShieldCheck,
  LogOut,
  ChevronDown,
  Command,
  ArrowRight
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const { currentPath, navigate, cartCount, favorites, currentUser, logoutUser } = useApp();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const searchModalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Keyboard shortcut Ctrl+K or Cmd+K to open search modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSearchModalOpen(prev => !prev);
      }
      if (e.key === 'Escape') {
        setIsSearchModalOpen(false);
        setIsSearchExpanded(false);
        setIsUserDropdownOpen(false);
        setIsMobileMenuOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Close user dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setIsUserDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const navLinks: { label: string; path: string; badge?: string }[] = [
    { label: 'Accueil', path: '/' },
    { label: 'Marketplace', path: '/products' },
    { label: 'Groupages', path: '/groupages' },
    { label: 'Sourcing', path: '/sourcing' },
    { label: 'B2B', path: '/b2b' },
    { label: 'Comment ça marche', path: '/#comment-ca-marche' },
    { label: 'À propos', path: '/about' }
  ];

  return (
    <>
      {/* Floating Header Container */}
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 pointer-events-none px-2 sm:px-4 md:px-6 lg:px-8 ${
          isScrolled ? 'pt-2 sm:pt-3' : 'pt-2.5 sm:pt-4'
        }`}
      >
        <div
          className={`max-w-7xl mx-auto pointer-events-auto rounded-2xl sm:rounded-3xl transition-all duration-300 ${
            isScrolled
              ? 'glass-nav-scrolled py-2 sm:py-2.5 px-3 sm:px-5 shadow-xl'
              : 'glass-nav-floating py-2.5 sm:py-3.5 px-3 sm:px-5 shadow-md'
          }`}
        >
          <div className="flex items-center justify-between gap-1.5 sm:gap-3">
            {/* 1. BRAND LOGO */}
            <div
              onClick={() => navigate('/')}
              className="flex items-center gap-2 sm:gap-2.5 cursor-pointer select-none shrink-0 group min-w-0"
            >
              {/* Interlocking DC Stylized Icon */}
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-gradient-to-tr from-[#E63900] via-[#FF4500] to-[#FF8A00] text-white flex items-center justify-center shadow-md shadow-orange-500/20 transform group-hover:scale-105 transition-all shrink-0">
                <span className="font-black text-sm sm:text-base tracking-tighter font-mono">DC</span>
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-base sm:text-lg font-black text-[#0B192C] tracking-tight group-hover:text-[#FF4500] transition-colors truncate">
                    DALLOU <span className="text-[#FF4500]">CHINE</span>
                  </span>
                </div>
                <span className="hidden sm:block text-[8px] sm:text-[9px] text-slate-500 font-bold uppercase tracking-wider -mt-0.5">
                  Commandez de la Chine vers l'Afrique en un clic
                </span>
              </div>
            </div>

            {/* 2. DESKTOP CENTER NAVIGATION LINKS (Visible on lg and above) */}
            <nav className="hidden lg:flex items-center gap-1 xl:gap-1.5 shrink-0">
              {navLinks.map(link => {
                const isActive =
                  link.path === '/'
                    ? currentPath === '/'
                    : currentPath.startsWith(link.path.replace('/#comment-ca-marche', ''));
                return (
                  <button
                    key={link.path}
                    onClick={() => {
                      if (link.path === '/#comment-ca-marche') {
                        if (currentPath !== '/') {
                          navigate('/');
                          setTimeout(() => {
                            const el = document.getElementById('comment-ca-marche');
                            if (el) el.scrollIntoView({ behavior: 'smooth' });
                          }, 150);
                        } else {
                          const el = document.getElementById('comment-ca-marche');
                          if (el) el.scrollIntoView({ behavior: 'smooth' });
                        }
                      } else {
                        navigate(link.path);
                      }
                    }}
                    className={`relative px-3.5 py-1.5 rounded-full text-xs font-bold transition-all duration-200 shrink-0 cursor-pointer ${
                      isActive
                        ? 'bg-[#FF4500] text-white shadow-xs'
                        : 'text-slate-700 hover:text-[#FF4500] hover:bg-orange-50/50'
                    }`}
                  >
                    <span>{link.label}</span>
                  </button>
                );
              })}
            </nav>

            {/* 3. SEARCH BAR */}
            <div className="hidden 2xl:block w-48 min-w-0">
              <div
                onClick={() => setIsSearchModalOpen(true)}
                className="flex items-center justify-between px-3 py-1.5 rounded-full bg-slate-50 hover:bg-slate-100/80 border border-slate-200/80 text-xs text-slate-400 cursor-pointer transition-all"
              >
                <div className="flex items-center gap-1.5 truncate">
                  <Search className="w-3.5 h-3.5 text-slate-400" />
                  <span className="text-[11px]">Rechercher...</span>
                </div>
                <kbd className="px-1.5 py-0.2 text-[9px] font-mono font-bold text-slate-400 bg-white rounded border border-slate-200">
                  ⌘K
                </kbd>
              </div>
            </div>

            {/* 4. RIGHT ACTIONS CLUSTER */}
            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              {/* Quick Search Button (< 2xl screens) */}
              <button
                onClick={() => setIsSearchModalOpen(true)}
                className="2xl:hidden flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-50 hover:bg-slate-100 border border-slate-200/80 text-xs text-slate-500 font-medium transition-all"
                title="Rechercher (⌘K)"
              >
                <Search className="w-3.5 h-3.5 text-slate-500" />
                <span className="hidden md:inline text-[11px] text-slate-400">Rechercher...</span>
                <kbd className="hidden lg:inline-flex px-1.5 py-0.2 text-[9px] font-mono text-slate-400 bg-white rounded border border-slate-200">
                  ⌘K
                </kbd>
              </button>

              {/* Connexion Button (as in reference mockup) */}
              <button
                onClick={() => {
                  if (currentUser.isLoggedIn) {
                    navigate('/account');
                  } else {
                    navigate('/login');
                  }
                }}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white hover:bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 transition-all shadow-2xs"
              >
                <User className="w-3.5 h-3.5 text-[#FF4500]" />
                <span className="hidden sm:inline">
                  {currentUser.isLoggedIn ? (currentUser.name?.split(' ')[0] || 'Compte') : 'Connexion'}
                </span>
              </button>

              {/* Demander un devis -> Button (Orange Pill as in reference mockup) */}
              <button
                onClick={() => navigate('/demande-devis')}
                className="flex items-center gap-1.5 px-4 py-1.5 sm:py-2 rounded-full bg-[#FF4500] hover:bg-[#E03D00] text-white text-xs font-bold shadow-xs transition-all cursor-pointer"
              >
                <span>Demander un devis</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>

              {/* Cart Button */}
              <button
                onClick={() => navigate('/cart')}
                aria-label="Panier"
                className="relative p-2 rounded-full hover:bg-slate-100 text-slate-700 transition-all shrink-0"
                title="Mon Panier"
              >
                <ShoppingBag className="w-4 h-4 text-slate-700" />
                {cartCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-[#FF4500] text-white text-[9px] font-black flex items-center justify-center font-mono-numeric shadow-xs">
                    {cartCount}
                  </span>
                )}
              </button>

              {/* Account / User Menu with Dropdown */}
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => {
                    if (currentUser.isLoggedIn) {
                      setIsUserDropdownOpen(!isUserDropdownOpen);
                    } else {
                      navigate('/account');
                    }
                  }}
                  aria-label="Compte"
                  className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl glass-panel bg-white/80 hover:bg-white text-slate-700 hover:text-[#0B192C] transition-all shadow-xs flex items-center gap-1.5"
                >
                  <div className="w-5 h-5 rounded-full bg-[#0B192C] text-white flex items-center justify-center text-[10px] font-black shrink-0">
                    {currentUser?.isLoggedIn && currentUser?.name ? currentUser.name.charAt(0) : <User className="w-3 h-3 text-white" />}
                  </div>
                  <span className="hidden xl:inline text-xs font-bold text-[#0B192C] max-w-[90px] truncate">
                    {currentUser?.isLoggedIn ? (currentUser?.name?.split(' ')[0] || 'Compte') : 'Connexion'}
                  </span>
                  {currentUser?.isLoggedIn && <ChevronDown className="hidden sm:inline w-3 h-3 text-slate-400 shrink-0" />}
                </button>

                {/* User Dropdown */}
                {isUserDropdownOpen && currentUser?.isLoggedIn && (
                  <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-white border border-slate-200 shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95">
                    <div className="px-3 py-2 border-b border-slate-100">
                      <p className="text-xs font-black text-[#0B192C] truncate">{currentUser?.name || 'Mon Compte'}</p>
                      <p className="text-[10px] text-slate-500 truncate">{currentUser?.email || currentUser?.phone || ''}</p>
                    </div>

                    <div className="py-1 space-y-0.5">
                      <button
                        onClick={() => {
                          setIsUserDropdownOpen(false);
                          navigate('/account');
                        }}
                        className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                      >
                        <User className="w-4 h-4 text-[#0B192C]" />
                        <span>Mon Espace Client</span>
                      </button>

                      <button
                        onClick={() => {
                          setIsUserDropdownOpen(false);
                          navigate('/admin');
                        }}
                        className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold text-[#FF4500] bg-orange-50/50 hover:bg-orange-50 flex items-center gap-2"
                      >
                        <ShieldCheck className="w-4 h-4 text-[#FF4500]" />
                        <span>Espace Admin HQ</span>
                      </button>

                      <button
                        onClick={() => {
                          setIsUserDropdownOpen(false);
                          logoutUser();
                        }}
                        className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 flex items-center gap-2"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Se déconnecter</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Mobile / Tablet Menu Button */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                aria-label="Menu de navigation"
                className="lg:hidden p-2 rounded-xl glass-panel text-slate-700 hover:bg-white"
              >
                {isMobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Expandable Search Bar on Mobile */}
          {isSearchExpanded && (
            <div className="sm:hidden mt-2 pt-2 border-t border-slate-200/80 animate-in fade-in slide-in-from-top-2">
              <SearchBar
                size="sm"
                variant="header"
                onSearchSubmit={() => setIsSearchExpanded(false)}
              />
            </div>
          )}
        </div>

        {/* Global Quick Search Modal (⌘K trigger) */}
        {isSearchModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-start justify-center pt-20 px-4 pointer-events-auto">
            <div
              ref={searchModalRef}
              className="bg-white rounded-3xl border border-slate-200 shadow-2xl p-5 max-w-xl w-full space-y-4 animate-in fade-in zoom-in-95 duration-150"
            >
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Search className="w-4 h-4 text-[#FF4500]" />
                  <span className="text-xs font-black text-[#0B192C] uppercase tracking-wider">
                    Recherche Rapide Catalogue Dallou Chine
                  </span>
                </div>
                <button
                  onClick={() => setIsSearchModalOpen(false)}
                  className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <SearchBar
                size="md"
                variant="hero"
                placeholder="Ex: Vidéoprojecteur, Panneau solaire, Outillage..."
                onSearchSubmit={() => setIsSearchModalOpen(false)}
              />

              <div className="flex items-center justify-between text-[10px] text-slate-400 pt-2 border-t border-slate-100">
                <span>Tapez pour rechercher parmi nos 5 000+ usines partenaires</span>
                <span className="font-mono bg-slate-100 px-2 py-0.5 rounded text-slate-600 font-bold">Échap pour fermer</span>
              </div>
            </div>
          </div>
        )}

        {/* Mobile / Tablet Drawer Menu */}
        {isMobileMenuOpen && (
          <div className="lg:hidden max-w-7xl mx-auto mt-2 pointer-events-auto px-2">
            <div className="glass-panel bg-white/95 backdrop-blur-2xl rounded-3xl p-4 sm:p-5 shadow-2xl border border-white space-y-3 animate-in fade-in zoom-in-95">
              <div className="space-y-1">
                {navLinks.map(link => (
                  <button
                    key={link.path}
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      if (link.path.startsWith('/#')) {
                        const hash = link.path.replace('/', '');
                        if (currentPath !== '/') {
                           navigate('/');
                          setTimeout(() => {
                            const el = document.querySelector(hash);
                            if (el) el.scrollIntoView({ behavior: 'smooth' });
                          }, 150);
                        } else {
                          const el = document.querySelector(hash);
                          if (el) el.scrollIntoView({ behavior: 'smooth' });
                        }
                      } else {
                        navigate(link.path);
                      }
                    }}
                    className={`w-full text-left p-3 rounded-2xl text-xs sm:text-sm font-bold flex items-center justify-between ${
                      currentPath === link.path
                        ? 'bg-[#0B192C] text-white'
                        : 'text-slate-800 hover:bg-slate-100'
                    }`}
                  >
                    <span>{link.label}</span>
                    {link.badge && (
                      <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-[#FF4500] text-white">
                        {link.badge}
                      </span>
                    )}
                  </button>
                ))}

                {/* Explicit Admin Button */}
                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    navigate('/admin');
                  }}
                  className="w-full text-left p-3 rounded-2xl text-xs sm:text-sm font-black flex items-center justify-between bg-orange-50/80 text-[#0B192C] border border-orange-200 mt-2"
                >
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-[#FF4500]" />
                    <span>Espace Administrateur HQ</span>
                  </div>
                  <span className="text-[10px] bg-[#0B192C] text-white px-2 py-0.5 rounded font-bold">
                    Admin
                  </span>
                </button>
              </div>

              {/* User Login/Logout in Mobile Menu */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                {currentUser?.isLoggedIn ? (
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-[#0B192C] text-white flex items-center justify-center font-bold text-[10px]">
                        {currentUser.name ? currentUser.name.charAt(0) : 'U'}
                      </div>
                      <span className="font-bold text-[#0B192C] truncate max-w-[150px]">{currentUser.name || 'Mon Compte'}</span>
                    </div>
                    <button
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        logoutUser();
                      }}
                      className="text-rose-600 font-bold hover:underline flex items-center gap-1 shrink-0"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Déconnexion</span>
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      navigate('/account');
                    }}
                    className="w-full py-2.5 rounded-xl bg-[#FF4500] hover:bg-[#E03D00] text-white font-bold text-center"
                  >
                    Se connecter / Créer un compte
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Spacer to prevent page content jump under fixed floating header */}
      <div className="h-16 sm:h-20" />
    </>
  );
};
