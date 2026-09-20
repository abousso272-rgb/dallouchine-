import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import {
  ShoppingBag,
  User,
  Package,
  Plane,
  Menu,
  X,
  Search,
  Building2,
  Users2,
  Sparkles,
  ShieldCheck,
  LogOut,
  ChevronDown,
  ArrowRight,
  Truck,
  Anchor,
  HelpCircle,
  FileText
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const {
    currentPath,
    navigate,
    cartCount,
    currentUser,
    logoutUser,
    openAuthModal
  } = useApp();

  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCatalogOpen, setIsCatalogOpen] = useState(false);
  const [isServicesOpen, setIsServicesOpen] = useState(false);
  const [isSpacesOpen, setIsSpacesOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const [mobileExpandedSection, setMobileExpandedSection] = useState<'catalog' | 'services' | 'spaces' | null>(null);

  const toggleMobileSection = (section: 'catalog' | 'services' | 'spaces') => {
    setMobileExpandedSection(prev => (prev === section ? null : section));
  };

  const catalogRef = useRef<HTMLDivElement>(null);
  const servicesRef = useRef<HTMLDivElement>(null);
  const spacesRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (catalogRef.current && !catalogRef.current.contains(target)) setIsCatalogOpen(false);
      if (servicesRef.current && !servicesRef.current.contains(target)) setIsServicesOpen(false);
      if (spacesRef.current && !spacesRef.current.contains(target)) setIsSpacesOpen(false);
      if (userMenuRef.current && !userMenuRef.current.contains(target)) setIsUserMenuOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close menus on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
    setIsCatalogOpen(false);
    setIsServicesOpen(false);
    setIsSpacesOpen(false);
    setIsUserMenuOpen(false);
  }, [currentPath]);

  return (
    <>
      {/* Floating Header Container */}
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 pointer-events-none px-3 sm:px-6 lg:px-8 ${
          isScrolled ? 'pt-2 sm:pt-3' : 'pt-3 sm:pt-4'
        }`}
      >
        <div
          className={`max-w-7xl mx-auto pointer-events-auto rounded-2xl sm:rounded-3xl transition-all duration-300 border border-white/60 ${
            isScrolled
              ? 'bg-white/95 backdrop-blur-md py-2.5 px-4 sm:px-6 shadow-xl shadow-slate-900/5'
              : 'bg-white/90 backdrop-blur-md py-3 px-4 sm:px-6 shadow-lg shadow-slate-900/5'
          }`}
        >
          <div className="flex items-center justify-between gap-3">
            {/* 1. BRAND LOGO */}
            <div
              onClick={() => navigate('/')}
              className="flex items-center gap-2.5 cursor-pointer select-none shrink-0 group"
            >
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-gradient-to-tr from-[#FF4500] to-amber-500 text-white flex items-center justify-center shadow-md shadow-orange-500/20 group-hover:scale-105 transition-all shrink-0">
                <span className="font-black text-sm sm:text-base tracking-tighter font-mono">DC</span>
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-1 leading-none">
                  <span className="text-base sm:text-lg font-black text-[#0B192C] tracking-tight group-hover:text-[#FF4500] transition-colors">
                    DALLOU <span className="text-[#FF4500]">CHINE</span>
                  </span>
                </div>
                <span className="hidden xl:block text-[9px] text-slate-500 font-bold uppercase tracking-wider mt-0.5">
                  Transit &amp; Sourcing Chine-Afrique
                </span>
              </div>
            </div>

            {/* 2. DESKTOP STRUCTURED NAVIGATION (Organized & Uncluttered) */}
            <nav className="hidden lg:flex items-center gap-1 xl:gap-2">
              {/* Accueil */}
              <button
                onClick={() => navigate('/')}
                className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                  currentPath === '/'
                    ? 'bg-[#0B192C] text-white shadow-xs'
                    : 'text-slate-700 hover:text-[#FF4500] hover:bg-orange-50/60'
                }`}
              >
                Accueil
              </button>

              {/* Catalogue Dropdown */}
              <div className="relative" ref={catalogRef}>
                <button
                  onClick={() => {
                    setIsCatalogOpen(!isCatalogOpen);
                    setIsServicesOpen(false);
                    setIsSpacesOpen(false);
                  }}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                    currentPath.startsWith('/products') || currentPath.startsWith('/auto')
                      ? 'bg-orange-50 text-[#FF4500]'
                      : 'text-slate-700 hover:text-[#FF4500] hover:bg-orange-50/60'
                  }`}
                >
                  <span>Catalogue Usine</span>
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isCatalogOpen ? 'rotate-180' : ''}`} />
                </button>

                {isCatalogOpen && (
                  <div className="absolute top-full left-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-100 p-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                    <button
                      onClick={() => { navigate('/products'); setIsCatalogOpen(false); }}
                      className="w-full text-left p-2.5 rounded-xl hover:bg-slate-50 transition-all flex items-center gap-2.5 cursor-pointer"
                    >
                      <div className="w-8 h-8 rounded-lg bg-orange-100 text-[#FF4500] flex items-center justify-center shrink-0">
                        <Package className="w-4 h-4" />
                      </div>
                      <div>
                        <strong className="text-xs font-bold text-[#0B192C] block">Tous les Produits Usine</strong>
                        <span className="text-[10px] text-slate-500">Tarifs de gros négociés</span>
                      </div>
                    </button>

                    <button
                      onClick={() => { navigate('/auto-mobilite'); setIsCatalogOpen(false); }}
                      className="w-full text-left p-2.5 rounded-xl hover:bg-slate-50 transition-all flex items-center gap-2.5 cursor-pointer"
                    >
                      <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                        <Truck className="w-4 h-4" />
                      </div>
                      <div>
                        <strong className="text-xs font-bold text-[#0B192C] block">Auto &amp; Mobilité</strong>
                        <span className="text-[10px] text-slate-500">Motos électriques, véhicules</span>
                      </div>
                    </button>
                  </div>
                )}
              </div>

              {/* Groupages (with Live Container Dot) */}
              <button
                onClick={() => navigate('/groupages')}
                className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  currentPath.startsWith('/groupage')
                    ? 'bg-[#FF4500] text-white shadow-xs'
                    : 'text-slate-700 hover:text-[#FF4500] hover:bg-orange-50/60'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Groupages Conteneurs</span>
              </button>

              {/* Services & B2B Dropdown */}
              <div className="relative" ref={servicesRef}>
                <button
                  onClick={() => {
                    setIsServicesOpen(!isServicesOpen);
                    setIsCatalogOpen(false);
                    setIsSpacesOpen(false);
                  }}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                    currentPath.startsWith('/sourcing') || currentPath.startsWith('/b2b') || currentPath.startsWith('/devis')
                      ? 'bg-orange-50 text-[#FF4500]'
                      : 'text-slate-700 hover:text-[#FF4500] hover:bg-orange-50/60'
                  }`}
                >
                  <span>Services Pro</span>
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isServicesOpen ? 'rotate-180' : ''}`} />
                </button>

                {isServicesOpen && (
                  <div className="absolute top-full left-0 mt-2 w-72 bg-white rounded-2xl shadow-xl border border-slate-100 p-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                    <button
                      onClick={() => { navigate('/sourcing'); setIsServicesOpen(false); }}
                      className="w-full text-left p-2.5 rounded-xl hover:bg-slate-50 transition-all flex items-center gap-2.5 cursor-pointer"
                    >
                      <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center shrink-0">
                        <Search className="w-4 h-4" />
                      </div>
                      <div>
                        <strong className="text-xs font-bold text-[#0B192C] block">Sourcing Usine 1688</strong>
                        <span className="text-[10px] text-slate-500">Recherche personnalisée &amp; audit SGS</span>
                      </div>
                    </button>

                    <button
                      onClick={() => { navigate('/b2b'); setIsServicesOpen(false); }}
                      className="w-full text-left p-2.5 rounded-xl hover:bg-slate-50 transition-all flex items-center gap-2.5 cursor-pointer"
                    >
                      <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                        <Building2 className="w-4 h-4" />
                      </div>
                      <div>
                        <strong className="text-xs font-bold text-[#0B192C] block">Espace B2B &amp; Grossistes</strong>
                        <span className="text-[10px] text-slate-500">Commandes de volume conteneurisé</span>
                      </div>
                    </button>

                    <button
                      onClick={() => { navigate('/devis-documents'); setIsServicesOpen(false); }}
                      className="w-full text-left p-2.5 rounded-xl hover:bg-slate-50 transition-all flex items-center gap-2.5 cursor-pointer"
                    >
                      <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div>
                        <strong className="text-xs font-bold text-[#0B192C] block">Calculateur &amp; Devis Fret</strong>
                        <span className="text-[10px] text-slate-500">Simulateur rendu Dakar dédouané</span>
                      </div>
                    </button>
                  </div>
                )}
              </div>

              {/* Suivi Colis AWP */}
              <button
                onClick={() => navigate('/suivi')}
                className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                  currentPath.startsWith('/suivi') || currentPath.startsWith('/tracking')
                    ? 'bg-[#0B192C] text-white shadow-xs'
                    : 'text-slate-700 hover:text-[#FF4500] hover:bg-orange-50/60'
                }`}
              >
                Suivi Colis AWP
              </button>

              {/* Séparateur des Espaces */}
              <div className="h-4 w-px bg-slate-200 mx-1" />

              {/* Menu des 3 Espaces Dédiés (Client, Collaborateur, Admin) */}
              <div className="relative" ref={spacesRef}>
                <button
                  onClick={() => {
                    setIsSpacesOpen(!isSpacesOpen);
                    setIsCatalogOpen(false);
                    setIsServicesOpen(false);
                  }}
                  className="px-3 py-1.5 rounded-full text-xs font-bold bg-slate-100 hover:bg-slate-200/80 text-slate-800 transition-all flex items-center gap-1.5 cursor-pointer border border-slate-200"
                >
                  <Users2 className="w-3.5 h-3.5 text-[#FF4500]" />
                  <span>Espaces &amp; Rôles</span>
                  <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${isSpacesOpen ? 'rotate-180' : ''}`} />
                </button>

                {isSpacesOpen && (
                  <div className="absolute top-full right-0 mt-2 w-72 bg-white rounded-2xl shadow-xl border border-slate-100 p-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                    <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Sélectionnez votre espace
                    </div>

                    {/* Espace Client */}
                    <button
                      onClick={() => { navigate('/client'); setIsSpacesOpen(false); }}
                      className="w-full text-left p-2.5 rounded-xl hover:bg-orange-50/50 transition-all flex items-center gap-2.5 cursor-pointer"
                    >
                      <div className="w-8 h-8 rounded-lg bg-orange-100 text-[#FF4500] flex items-center justify-center shrink-0">
                        <User className="w-4 h-4" />
                      </div>
                      <div>
                        <strong className="text-xs font-bold text-[#0B192C] block">Espace Client</strong>
                        <span className="text-[10px] text-slate-500">Mes commandes, acomptes &amp; réservations</span>
                      </div>
                    </button>

                    {/* Espace Collaborateur */}
                    <button
                      onClick={() => { navigate('/collaborateur'); setIsSpacesOpen(false); }}
                      className="w-full text-left p-2.5 rounded-xl hover:bg-blue-50/50 transition-all flex items-center gap-2.5 cursor-pointer"
                    >
                      <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                        <Anchor className="w-4 h-4" />
                      </div>
                      <div>
                        <strong className="text-xs font-bold text-[#0B192C] block">Espace Collaborateur</strong>
                        <span className="text-[10px] text-slate-500">Agents terrain Chine &amp; Port de Dakar</span>
                      </div>
                    </button>

                    {/* Espace Admin */}
                    <button
                      onClick={() => { navigate('/admin'); setIsSpacesOpen(false); }}
                      className="w-full text-left p-2.5 rounded-xl hover:bg-slate-100 transition-all flex items-center gap-2.5 cursor-pointer"
                    >
                      <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center shrink-0">
                        <ShieldCheck className="w-4 h-4 text-emerald-400" />
                      </div>
                      <div>
                        <strong className="text-xs font-bold text-[#0B192C] block">Espace Administration</strong>
                        <span className="text-[10px] text-slate-500">Direction générale &amp; supervision</span>
                      </div>
                    </button>
                  </div>
                )}
              </div>
            </nav>

            {/* 3. RIGHT ACTIONS (Clean & Single User Button) */}
            <div className="flex items-center gap-2 shrink-0">
              {/* Cart Button */}
              <button
                onClick={() => navigate('/cart')}
                aria-label="Mon Panier"
                className="relative p-2 rounded-full hover:bg-slate-100 text-slate-700 transition-all cursor-pointer"
                title="Mon Panier"
              >
                <ShoppingBag className="w-4 h-4 text-slate-700" />
                {cartCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-[#FF4500] text-white text-[9px] font-black flex items-center justify-center font-mono-numeric shadow-xs">
                    {cartCount}
                  </span>
                )}
              </button>

              {/* Single User / Auth Button */}
              {!currentUser.isLoggedIn ? (
                <button
                  onClick={() => openAuthModal('client')}
                  className="hidden sm:flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#FF4500] hover:bg-[#E03D00] text-white text-xs font-bold shadow-xs transition-all cursor-pointer"
                >
                  <User className="w-3.5 h-3.5" />
                  <span>Connexion / Inscription</span>
                </button>
              ) : (
                <div className="relative" ref={userMenuRef}>
                  <button
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200/80 text-xs font-bold text-[#0B192C] transition-all cursor-pointer border border-slate-200"
                  >
                    <div className="w-5 h-5 rounded-full bg-[#0B192C] text-white flex items-center justify-center text-[10px] font-black shrink-0">
                      {currentUser.name ? currentUser.name.charAt(0) : 'U'}
                    </div>
                    <span className="max-w-[100px] truncate">{currentUser.name?.split(' ')[0] || 'Mon Compte'}</span>
                    <ChevronDown className="w-3 h-3 text-slate-400" />
                  </button>

                  {isUserMenuOpen && (
                    <div className="absolute top-full right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-100 p-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                      <div className="px-3 py-2 border-b border-slate-100 mb-1">
                        <strong className="text-xs font-bold text-[#0B192C] block truncate">{currentUser.name}</strong>
                        <span className="text-[10px] text-slate-500 font-mono truncate block">{currentUser.email || currentUser.phone}</span>
                        <span className="mt-1 inline-block text-[9px] font-bold uppercase px-2 py-0.5 rounded bg-orange-100 text-[#FF4500]">
                          {currentUser.role === 'admin' ? 'Administrateur' : currentUser.role === 'collaborateur' ? 'Collaborateur' : 'Client Acheteur'}
                        </span>
                      </div>

                      <button
                        onClick={() => {
                          if (currentUser.role === 'admin') navigate('/admin');
                          else if (currentUser.role === 'collaborateur') navigate('/collaborateur');
                          else navigate('/client');
                          setIsUserMenuOpen(false);
                        }}
                        className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                      >
                        <User className="w-3.5 h-3.5 text-[#FF4500]" />
                        <span>Mon Tableau de bord</span>
                      </button>

                      <button
                        onClick={() => { logoutUser(); setIsUserMenuOpen(false); }}
                        className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 flex items-center gap-2 mt-1"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Se déconnecter</span>
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Mobile Hamburger Button */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="lg:hidden p-2 rounded-xl hover:bg-slate-100 text-slate-700 transition-all cursor-pointer"
                aria-label="Menu"
              >
                {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* 4. MOBILE OVERLAY DRAWER WITH COLLAPSIBLE ACCORDIONS */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="fixed top-18 right-3 left-3 max-h-[85vh] overflow-y-auto bg-white rounded-3xl p-4 sm:p-5 shadow-2xl border border-slate-200 space-y-4">
            {/* Header: User Account Bar */}
            {!currentUser.isLoggedIn ? (
              <div className="p-3.5 rounded-2xl bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200/80 flex items-center justify-between">
                <div>
                  <strong className="text-xs font-bold text-[#0B192C] block">Bienvenue sur Dallou Chine</strong>
                  <span className="text-[10px] text-slate-500">Achetez en Chine, recevez à Dakar</span>
                </div>
                <button
                  onClick={() => { openAuthModal('client'); setIsMobileMenuOpen(false); }}
                  className="px-3.5 py-1.5 rounded-full bg-[#FF4500] text-white text-xs font-bold shadow-xs shrink-0"
                >
                  Connexion
                </button>
              </div>
            ) : (
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-xl bg-[#0B192C] text-white flex items-center justify-center font-bold text-xs shrink-0">
                    {currentUser.name ? currentUser.name.charAt(0) : 'U'}
                  </div>
                  <div className="min-w-0">
                    <strong className="text-xs font-bold text-[#0B192C] block truncate">{currentUser.name}</strong>
                    <span className="text-[10px] text-slate-500 truncate block">{currentUser.email || currentUser.phone}</span>
                  </div>
                </div>
                <button
                  onClick={() => { logoutUser(); setIsMobileMenuOpen(false); }}
                  className="p-2 text-slate-400 hover:text-rose-600 rounded-lg shrink-0"
                  title="Déconnexion"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Quick Primary Actions */}
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => { navigate('/'); setIsMobileMenuOpen(false); }}
                className={`p-2.5 rounded-xl text-left border flex items-center gap-2 transition-all ${
                  currentPath === '/' ? 'bg-[#0B192C] text-white border-[#0B192C]' : 'bg-slate-50 border-slate-200/80 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <div className="w-2 h-2 rounded-full bg-orange-400" />
                <span className="text-xs font-bold">Accueil</span>
              </button>
              <button
                onClick={() => { navigate('/groupages'); setIsMobileMenuOpen(false); }}
                className="p-2.5 rounded-xl text-left border border-orange-200 bg-orange-50 text-[#FF4500] hover:bg-orange-100 flex items-center justify-between transition-all"
              >
                <span className="text-xs font-bold flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  Groupages
                </span>
                <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-[#FF4500] text-white">🔥 Actifs</span>
              </button>
              <button
                onClick={() => { navigate('/b2b'); setIsMobileMenuOpen(false); }}
                className="p-2.5 rounded-xl text-left border border-slate-200/80 bg-slate-50 text-slate-700 hover:bg-slate-100 flex items-center gap-2 transition-all"
              >
                <Building2 className="w-3.5 h-3.5 text-blue-600" />
                <span className="text-xs font-bold">B2B Grossistes</span>
              </button>
              <button
                onClick={() => { navigate('/suivi'); setIsMobileMenuOpen(false); }}
                className="p-2.5 rounded-xl text-left border border-slate-200/80 bg-slate-50 text-slate-700 hover:bg-slate-100 flex items-center gap-2 transition-all"
              >
                <Package className="w-3.5 h-3.5 text-amber-600" />
                <span className="text-xs font-bold">Suivi AWP</span>
              </button>
            </div>

            {/* Accordion 1: Catalogue Usine Chine */}
            <div className="border border-slate-200/80 rounded-2xl overflow-hidden">
              <button
                onClick={() => toggleMobileSection('catalog')}
                className="w-full p-3.5 bg-slate-50 hover:bg-slate-100/80 flex items-center justify-between text-xs font-bold text-[#0B192C] transition-colors"
              >
                <span className="flex items-center gap-2">
                  <Package className="w-4 h-4 text-[#FF4500]" />
                  <span>Catalogue Usine Chine</span>
                </span>
                <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${mobileExpandedSection === 'catalog' ? 'rotate-180' : ''}`} />
              </button>

              {mobileExpandedSection === 'catalog' && (
                <div className="p-2 bg-white border-t border-slate-100 space-y-1 animate-in fade-in duration-150">
                  <button
                    onClick={() => { navigate('/auto-mobilite'); setIsMobileMenuOpen(false); }}
                    className="w-full text-left px-3 py-2 rounded-xl text-xs font-medium text-slate-700 hover:bg-orange-50 hover:text-[#FF4500] flex items-center justify-between"
                  >
                    <span>⚡ Motos &amp; Véhicules Électriques</span>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-300" />
                  </button>
                  <button
                    onClick={() => { navigate('/products'); setIsMobileMenuOpen(false); }}
                    className="w-full text-left px-3 py-2 rounded-xl text-xs font-medium text-slate-700 hover:bg-orange-50 hover:text-[#FF4500] flex items-center justify-between"
                  >
                    <span>📺 Électronique &amp; Multimédia</span>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-300" />
                  </button>
                  <button
                    onClick={() => { navigate('/products'); setIsMobileMenuOpen(false); }}
                    className="w-full text-left px-3 py-2 rounded-xl text-xs font-medium text-slate-700 hover:bg-orange-50 hover:text-[#FF4500] flex items-center justify-between"
                  >
                    <span>☀️ Énergie Solaire &amp; Maison</span>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-300" />
                  </button>
                  <button
                    onClick={() => { navigate('/products'); setIsMobileMenuOpen(false); }}
                    className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold text-[#FF4500] hover:bg-orange-50 flex items-center justify-between"
                  >
                    <span>Tous les produits de la Marketplace</span>
                    <ArrowRight className="w-3.5 h-3.5 text-[#FF4500]" />
                  </button>
                </div>
              )}
            </div>

            {/* Accordion 2: Services Logistiques & Transit */}
            <div className="border border-slate-200/80 rounded-2xl overflow-hidden">
              <button
                onClick={() => toggleMobileSection('services')}
                className="w-full p-3.5 bg-slate-50 hover:bg-slate-100/80 flex items-center justify-between text-xs font-bold text-[#0B192C] transition-colors"
              >
                <span className="flex items-center gap-2">
                  <Plane className="w-4 h-4 text-cyan-600" />
                  <span>Services &amp; Transit Chine-Dakar</span>
                </span>
                <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${mobileExpandedSection === 'services' ? 'rotate-180' : ''}`} />
              </button>

              {mobileExpandedSection === 'services' && (
                <div className="p-2 bg-white border-t border-slate-100 space-y-1 animate-in fade-in duration-150">
                  <button
                    onClick={() => { navigate('/sourcing'); setIsMobileMenuOpen(false); }}
                    className="w-full text-left px-3 py-2 rounded-xl text-xs font-medium text-slate-700 hover:bg-orange-50 flex items-center justify-between"
                  >
                    <span>✈️ Fret Aérien Express (5 à 7j)</span>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-300" />
                  </button>
                  <button
                    onClick={() => { navigate('/groupages'); setIsMobileMenuOpen(false); }}
                    className="w-full text-left px-3 py-2 rounded-xl text-xs font-medium text-slate-700 hover:bg-orange-50 flex items-center justify-between"
                  >
                    <span>🚢 Fret Maritime Conteneurs (35 à 45j)</span>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-300" />
                  </button>
                  <button
                    onClick={() => { navigate('/sourcing'); setIsMobileMenuOpen(false); }}
                    className="w-full text-left px-3 py-2 rounded-xl text-xs font-medium text-slate-700 hover:bg-orange-50 flex items-center justify-between"
                  >
                    <span>🔍 Sourcing Usine 1688 &amp; Négociation</span>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-300" />
                  </button>
                  <button
                    onClick={() => { navigate('/suivi'); setIsMobileMenuOpen(false); }}
                    className="w-full text-left px-3 py-2 rounded-xl text-xs font-medium text-slate-700 hover:bg-orange-50 flex items-center justify-between"
                  >
                    <span>📍 Suivi Expédition AWP</span>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-300" />
                  </button>
                </div>
              )}
            </div>

            {/* Accordion 3: Espaces Métiers & Profils */}
            <div className="border border-slate-200/80 rounded-2xl overflow-hidden">
              <button
                onClick={() => toggleMobileSection('spaces')}
                className="w-full p-3.5 bg-slate-50 hover:bg-slate-100/80 flex items-center justify-between text-xs font-bold text-[#0B192C] transition-colors"
              >
                <span className="flex items-center gap-2">
                  <Users2 className="w-4 h-4 text-emerald-600" />
                  <span>Espaces Métiers &amp; Administration</span>
                </span>
                <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${mobileExpandedSection === 'spaces' ? 'rotate-180' : ''}`} />
              </button>

              {mobileExpandedSection === 'spaces' && (
                <div className="p-2 bg-white border-t border-slate-100 space-y-1 animate-in fade-in duration-150">
                  <button
                    onClick={() => { navigate('/client'); setIsMobileMenuOpen(false); }}
                    className="w-full text-left p-2 rounded-xl bg-orange-50/60 border border-orange-100 flex items-center gap-2.5"
                  >
                    <User className="w-4 h-4 text-[#FF4500] shrink-0" />
                    <div>
                      <strong className="text-xs font-bold text-[#0B192C] block">Espace Client</strong>
                      <span className="text-[10px] text-slate-500">Commandes &amp; Acomptes</span>
                    </div>
                  </button>
                  <button
                    onClick={() => { navigate('/collaborateur'); setIsMobileMenuOpen(false); }}
                    className="w-full text-left p-2 rounded-xl bg-blue-50/60 border border-blue-100 flex items-center gap-2.5 mt-1"
                  >
                    <Anchor className="w-4 h-4 text-blue-700 shrink-0" />
                    <div>
                      <strong className="text-xs font-bold text-[#0B192C] block">Espace Collaborateur</strong>
                      <span className="text-[10px] text-slate-500">Hubs Chine &amp; Port Dakar</span>
                    </div>
                  </button>
                  <button
                    onClick={() => { navigate('/admin'); setIsMobileMenuOpen(false); }}
                    className="w-full text-left p-2 rounded-xl bg-slate-100 border border-slate-200 flex items-center gap-2.5 mt-1"
                  >
                    <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                    <div>
                      <strong className="text-xs font-bold text-[#0B192C] block">Espace Administration</strong>
                      <span className="text-[10px] text-slate-500">Gestion &amp; Finance</span>
                    </div>
                  </button>
                </div>
              )}
            </div>

            {/* Direct WhatsApp Call to Action */}
            <a
              href="https://wa.me/221774201819?text=Bonjour%20Dallou%20Chine,%20je%20souhaite%20des%20renseignements%20sur%20vos%20services."
              target="_blank"
              rel="noreferrer"
              className="w-full py-3 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md transition-all"
            >
              <span>Discuter avec un conseiller WhatsApp</span>
              <span className="text-base">🇸🇳</span>
            </a>
          </div>
        </div>
      )}
    </>
  );
};
