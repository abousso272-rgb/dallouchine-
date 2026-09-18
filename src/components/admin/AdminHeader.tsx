import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Search,
  Bell,
  Sliders,
  ShieldCheck,
  Package,
  Layers,
  ShoppingBag,
  Users,
  Factory,
  ChevronDown,
  X,
  ExternalLink,
  Plus,
  HelpCircle,
  Command,
  ArrowRight,
  TrendingUp,
  AlertTriangle,
  LogOut
} from 'lucide-react';
import { AdminRole } from '../../types';

interface AdminHeaderProps {
  onOpenMobileMenu: () => void;
}

export const AdminHeader: React.FC<AdminHeaderProps> = ({ onOpenMobileMenu }) => {
  const {
    currentPath,
    navigate,
    products,
    orders,
    groupages,
    customers,
    suppliers,
    alerts,
    markAlertAsRead,
    currentRole,
    setCurrentRole,
    logoutUser
  } = useApp();

  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [alertsDropdownOpen, setAlertsDropdownOpen] = useState(false);
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const unreadAlerts = alerts.filter(a => !a.isRead);

  // Keyboard shortcut Ctrl+K or Cmd+K to open search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearchModalOpen(prev => !prev);
      }
      if (e.key === 'Escape') {
        setSearchModalOpen(false);
        setAlertsDropdownOpen(false);
        setRoleDropdownOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    if (searchModalOpen && searchInputRef.current) {
      setTimeout(() => searchInputRef.current?.focus(), 50);
    }
  }, [searchModalOpen]);

  // Global search filtering
  const q = (searchQuery || '').toLowerCase().trim();
  const matchedOrders = q
    ? orders.filter(
        o =>
          (o?.trackingCode || '').toLowerCase().includes(q) ||
          (o?.customer?.fullName || '').toLowerCase().includes(q) ||
          (o?.customer?.phone || '').includes(q)
      )
    : [];

  const matchedProducts = q
    ? products.filter(
        p =>
          (p?.name || '').toLowerCase().includes(q) ||
          (p?.category || '').toLowerCase().includes(q) ||
          (p?.slug || '').toLowerCase().includes(q)
      )
    : [];

  const matchedGroupages = q
    ? groupages.filter(
        g =>
          (g?.code || '').toLowerCase().includes(q) ||
          (g?.title || '').toLowerCase().includes(q)
      )
    : [];

  const matchedCustomers = q
    ? customers.filter(
        c =>
          (c?.fullName || '').toLowerCase().includes(q) ||
          (c?.phone || '').includes(q) ||
          (c?.email || '').toLowerCase().includes(q)
      )
    : [];

  const matchedSuppliers = q
    ? suppliers.filter(
        s =>
          (s?.name || '').toLowerCase().includes(q) ||
          (s?.city || '').toLowerCase().includes(q) ||
          (s?.contactPerson || '').toLowerCase().includes(q)
      )
    : [];

  const hasResults =
    matchedOrders.length > 0 ||
    matchedProducts.length > 0 ||
    matchedGroupages.length > 0 ||
    matchedCustomers.length > 0 ||
    matchedSuppliers.length > 0;

  const rolesList: { id: AdminRole; label: string; desc: string }[] = [
    { id: 'SUPER_ADMIN', label: 'Super Admin', desc: 'Accès complet & configuration' },
    { id: 'OPERATIONS', label: 'Opérations', desc: 'Gestion des lots & commandes' },
    { id: 'SOURCING', label: 'Sourcing & Achats', desc: 'Gestion fournisseurs & prix 1688' },
    { id: 'LOGISTICS', label: 'Logistique & Hubs', desc: 'Fret, transitaires & scan colis' },
    { id: 'FINANCE', label: 'Finance & Marges', desc: 'Rentabilité, devises & trésorerie' },
    { id: 'CUSTOMER_SUPPORT', label: 'Support Client', desc: 'Suivi colis AWP & réclamations' }
  ];

  return (
    <>
      <header className="sticky top-0 z-30 bg-[#071330]/90 backdrop-blur-md border-b border-blue-900/40 px-4 lg:px-6 py-3 flex items-center justify-between gap-4">
        {/* Left Section: Mobile toggle & Global Search bar */}
        <div className="flex items-center gap-3 flex-1 max-w-xl">
          <button
            onClick={onOpenMobileMenu}
            className="lg:hidden p-2 rounded-xl bg-white/5 border border-white/10 text-slate-200 hover:text-white"
            aria-label="Ouvrir le menu"
          >
            <span className="sr-only">Menu</span>
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          {/* Quick Search Launcher */}
          <button
            onClick={() => setSearchModalOpen(true)}
            className="w-full flex items-center justify-between bg-slate-900/80 border border-blue-900/50 hover:border-blue-500/50 text-slate-400 hover:text-slate-200 px-3.5 py-2 rounded-xl text-xs transition-all shadow-inner group min-w-0 overflow-hidden"
          >
            <div className="flex items-center gap-2.5 min-w-0 overflow-hidden">
              <Search className="w-4 h-4 text-blue-400 group-hover:text-blue-300 shrink-0" />
              <span className="truncate">Rechercher (AWP-..., produit, client, lot...)</span>
            </div>
            <div className="hidden sm:flex items-center gap-1 bg-white/5 px-2 py-0.5 rounded text-[10px] font-mono text-slate-400 border border-white/10 shrink-0 ml-2">
              <span>⌘</span>
              <span>K</span>
            </div>
          </button>
        </div>

        {/* Right Section: Role selector, Alerts, Quick Actions, Profile */}
        <div className="flex items-center gap-2.5">
          {/* Quick Calculator Shortcut */}
          <button
            onClick={() => navigate('/admin/calculator')}
            className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600/20 text-blue-300 hover:bg-blue-600/30 border border-blue-500/30 text-xs font-semibold transition-all"
          >
            <TrendingUp className="w-3.5 h-3.5 text-blue-400" />
            <span>Calculateur</span>
          </button>

          {/* Alerts Notification Bell */}
          <div className="relative">
            <button
              onClick={() => {
                setAlertsDropdownOpen(prev => !prev);
                setRoleDropdownOpen(false);
              }}
              className="relative p-2 rounded-xl bg-white/5 border border-white/10 text-slate-300 hover:text-white hover:bg-white/10 transition-all"
              title="Alertes opérationnelles"
            >
              <Bell className="w-4 h-4" />
              {unreadAlerts.length > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-white font-bold text-[10px] flex items-center justify-center animate-pulse">
                  {unreadAlerts.length}
                </span>
              )}
            </button>

            {/* Alerts Dropdown */}
            {alertsDropdownOpen && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-[#0b1b44] border border-blue-800/60 shadow-2xl p-4 z-50 animate-in fade-in zoom-in-95 duration-150">
                <div className="flex items-center justify-between pb-3 border-b border-blue-900/50">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-400" />
                    <span className="font-bold text-xs text-white uppercase tracking-wider">Alertes & Risques</span>
                  </div>
                  <button
                    onClick={() => navigate('/admin/alerts')}
                    className="text-[11px] text-blue-400 hover:text-blue-300 font-semibold flex items-center gap-1"
                  >
                    <span>Tout voir</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>

                <div className="py-2 space-y-2 max-h-72 overflow-y-auto custom-scrollbar">
                  {alerts.length === 0 ? (
                    <p className="text-xs text-slate-400 py-4 text-center">Aucune alerte active.</p>
                  ) : (
                    alerts.slice(0, 5).map(alert => (
                      <div
                        key={alert.id}
                        onClick={() => {
                          markAlertAsRead(alert.id);
                          navigate(alert.linkTo);
                          setAlertsDropdownOpen(false);
                        }}
                        className={`p-2.5 rounded-xl border text-xs cursor-pointer transition-all ${
                          !alert.isRead
                            ? 'bg-blue-950/60 border-blue-500/40 text-white'
                            : 'bg-white/5 border-white/5 text-slate-400'
                        } hover:bg-blue-900/40`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <span className="font-bold text-slate-200">{alert.title}</span>
                          <span className="text-[10px] text-slate-400 shrink-0">{alert.timestamp}</span>
                        </div>
                        <p className="text-[11px] text-slate-300 mt-1 leading-snug">{alert.message}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Role Switcher */}
          <div className="relative">
            <button
              onClick={() => {
                setRoleDropdownOpen(prev => !prev);
                setAlertsDropdownOpen(false);
              }}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-blue-950/80 border border-blue-800/50 hover:border-blue-500/50 text-xs font-semibold text-slate-200 transition-all"
            >
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span className="hidden sm:inline">
                {rolesList.find(r => r.id === currentRole)?.label || 'Super Admin'}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {roleDropdownOpen && (
              <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-[#0b1b44] border border-blue-800/60 shadow-2xl p-2 z-50">
                <div className="px-3 py-2 text-[10px] font-bold text-blue-300 uppercase tracking-wider">
                  Simulation Rôle Utilisateur
                </div>
                {rolesList.map(r => (
                  <button
                    key={r.id}
                    onClick={() => {
                      setCurrentRole(r.id);
                      setRoleDropdownOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-xl text-xs transition-all ${
                      currentRole === r.id
                        ? 'bg-blue-600 text-white font-bold'
                        : 'text-slate-300 hover:bg-white/5'
                    }`}
                  >
                    <div className="font-semibold">{r.label}</div>
                    <div className="text-[10px] opacity-75">{r.desc}</div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Public Store Return */}
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition-all"
            title="Aller sur le catalogue public"
          >
            <ExternalLink className="w-3.5 h-3.5 text-blue-400" />
            <span className="hidden lg:inline">Site Public</span>
          </button>

          {/* Logout Button */}
          <button
            onClick={() => logoutUser()}
            className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 hover:text-rose-200 border border-rose-500/20 transition-all"
            title="Déconnexion de l'administration"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Global Search Modal (Command Palette Style) */}
      {searchModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-start justify-center pt-16 px-4">
          <div className="w-full max-w-2xl bg-[#0a183d] border border-blue-700/50 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Search Input Bar */}
            <div className="p-4 border-b border-blue-900/60 flex items-center gap-3 bg-[#081332]">
              <Search className="w-5 h-5 text-blue-400 shrink-0" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Tapez un numéro AWP (ex: AWP-10482), un produit, un client, un fournisseur..."
                className="w-full bg-transparent text-sm text-white placeholder-slate-400 focus:outline-hidden"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="p-1 rounded-lg text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
              <button
                onClick={() => setSearchModalOpen(false)}
                className="text-xs font-mono bg-white/10 hover:bg-white/20 text-slate-300 px-2 py-1 rounded border border-white/10"
              >
                ESC
              </button>
            </div>

            {/* Quick Filter suggestions if query is empty */}
            {!q && (
              <div className="p-6 space-y-4 text-xs text-slate-400">
                <p className="font-semibold text-slate-300">Raccourcis de recherche rapide :</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <button
                    onClick={() => setSearchQuery('AWP-')}
                    className="p-2.5 rounded-xl bg-white/5 border border-white/10 hover:border-blue-400 hover:text-white text-left transition-all"
                  >
                    <div className="font-bold text-blue-300">Commandes</div>
                    <div className="text-[10px] text-slate-400">Tapez &quot;AWP-&quot;</div>
                  </button>
                  <button
                    onClick={() => setSearchQuery('GRP-')}
                    className="p-2.5 rounded-xl bg-white/5 border border-white/10 hover:border-blue-400 hover:text-white text-left transition-all"
                  >
                    <div className="font-bold text-cyan-300">Groupages</div>
                    <div className="text-[10px] text-slate-400">Tapez &quot;GRP-&quot;</div>
                  </button>
                  <button
                    onClick={() => setSearchQuery('Projecteur')}
                    className="p-2.5 rounded-xl bg-white/5 border border-white/10 hover:border-blue-400 hover:text-white text-left transition-all"
                  >
                    <div className="font-bold text-emerald-300">Produits</div>
                    <div className="text-[10px] text-slate-400">Ex: Projecteur</div>
                  </button>
                  <button
                    onClick={() => setSearchQuery('Diop')}
                    className="p-2.5 rounded-xl bg-white/5 border border-white/10 hover:border-blue-400 hover:text-white text-left transition-all"
                  >
                    <div className="font-bold text-amber-300">Clients</div>
                    <div className="text-[10px] text-slate-400">Ex: Diop</div>
                  </button>
                </div>
              </div>
            )}

            {/* Search Results List */}
            {q && (
              <div className="p-4 max-h-[60vh] overflow-y-auto space-y-4 custom-scrollbar">
                {!hasResults && (
                  <div className="py-8 text-center text-slate-400 text-xs">
                    Aucun résultat trouvé pour &quot;<span className="text-white font-semibold">{searchQuery}</span>&quot;
                  </div>
                )}

                {/* Orders Results */}
                {matchedOrders.length > 0 && (
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-wider text-blue-300 mb-2 flex items-center gap-1.5">
                      <ShoppingBag className="w-3.5 h-3.5" />
                      <span>Commandes ({matchedOrders.length})</span>
                    </div>
                    <div className="space-y-1.5">
                      {matchedOrders.map(order => (
                        <div
                          key={order.id}
                          onClick={() => {
                            navigate('/admin/orders');
                            setSearchModalOpen(false);
                          }}
                          className="p-2.5 rounded-xl bg-white/5 hover:bg-blue-600/30 border border-white/5 hover:border-blue-500/40 flex items-center justify-between cursor-pointer transition-all text-xs"
                        >
                          <div>
                            <span className="font-mono font-bold text-blue-300">{order.trackingCode}</span>
                            <span className="text-slate-300 ml-2">{order.customer.fullName} ({order.customer.city})</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-white">{order.totalXOF.toLocaleString('fr-FR')} FCFA</span>
                            <span className="text-[10px] bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded font-semibold">
                              {order.currentStatus}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Products Results */}
                {matchedProducts.length > 0 && (
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-300 mb-2 flex items-center gap-1.5">
                      <Package className="w-3.5 h-3.5" />
                      <span>Produits ({matchedProducts.length})</span>
                    </div>
                    <div className="space-y-1.5">
                      {matchedProducts.map(product => (
                        <div
                          key={product.id}
                          onClick={() => {
                            navigate('/admin/products');
                            setSearchModalOpen(false);
                          }}
                          className="p-2.5 rounded-xl bg-white/5 hover:bg-emerald-600/30 border border-white/5 hover:border-emerald-500/40 flex items-center justify-between cursor-pointer transition-all text-xs"
                        >
                          <div className="flex items-center gap-2.5">
                            <img src={product.images[0]} alt={product.name} className="w-8 h-8 rounded-lg object-cover" />
                            <div>
                              <div className="font-semibold text-white">{product.name}</div>
                              <div className="text-[10px] text-slate-400">{product.category} • Base {product.basePriceCNY} ¥</div>
                            </div>
                          </div>
                          <span className="font-bold text-emerald-300">{product.priceXOF.toLocaleString('fr-FR')} FCFA</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Groupages Results */}
                {matchedGroupages.length > 0 && (
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-wider text-cyan-300 mb-2 flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5" />
                      <span>Groupages ({matchedGroupages.length})</span>
                    </div>
                    <div className="space-y-1.5">
                      {matchedGroupages.map(groupage => (
                        <div
                          key={groupage.id}
                          onClick={() => {
                            navigate('/admin/groupages');
                            setSearchModalOpen(false);
                          }}
                          className="p-2.5 rounded-xl bg-white/5 hover:bg-cyan-600/30 border border-white/5 hover:border-cyan-500/40 flex items-center justify-between cursor-pointer transition-all text-xs"
                        >
                          <div>
                            <span className="font-mono font-bold text-cyan-300">{groupage.code}</span>
                            <span className="text-slate-300 ml-2">{groupage.title}</span>
                          </div>
                          <span className="text-[11px] font-semibold text-slate-300">
                            {groupage.currentUnits}/{groupage.targetUnits} unités ({groupage.status})
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Customers Results */}
                {matchedCustomers.length > 0 && (
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-wider text-amber-300 mb-2 flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5" />
                      <span>Clients ({matchedCustomers.length})</span>
                    </div>
                    <div className="space-y-1.5">
                      {matchedCustomers.map(customer => (
                        <div
                          key={customer.id}
                          onClick={() => {
                            navigate('/admin/customers');
                            setSearchModalOpen(false);
                          }}
                          className="p-2.5 rounded-xl bg-white/5 hover:bg-amber-600/30 border border-white/5 hover:border-amber-500/40 flex items-center justify-between cursor-pointer transition-all text-xs"
                        >
                          <div>
                            <span className="font-semibold text-white">{customer.fullName}</span>
                            <span className="text-slate-400 ml-2">{customer.city} • {customer.phone}</span>
                          </div>
                          <span className="text-[11px] text-amber-300 font-semibold">{customer.totalOrdersCount} commandes</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};
