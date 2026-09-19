import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { AdminHeader } from '../admin/AdminHeader';
import { UnifiedAuthForm } from '../auth/UnifiedAuthForm';
import {
  LayoutDashboard,
  Package,
  Layers,
  ShoppingBag,
  Compass,
  Factory,
  Truck,
  Warehouse,
  Users,
  Briefcase,
  CreditCard,
  BarChart3,
  Calculator,
  Bot,
  Sliders,
  ChevronDown,
  ChevronRight,
  Menu,
  X,
  ShieldCheck,
  ArrowLeft,
  LogOut,
  AlertTriangle,
  Tag,
  Users2,
  GitCompare,
  Send,
  PanelLeftClose,
  PanelLeft
} from 'lucide-react';

export const AdminLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const {
    currentPath,
    navigate,
    currentRole,
    currentUser,
    logoutUser,
    alerts = []
  } = useApp() as any;

  const unreadAlertsCount = (alerts || []).filter((a: any) => !a.isRead).length;

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [openSubmenus, setOpenSubmenus] = useState<Record<string, boolean>>({
    ventes: true,
    appro: false,
    logistique: false,
    clients: false,
    finances: false,
    outils: false
  });

  const toggleSubmenu = (key: string) => {
    setOpenSubmenus(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // If user is not authenticated or not in admin role, display the unified login portal with Admin tab
  if (!currentUser?.isLoggedIn || currentUser?.role !== 'admin') {
    return (
      <div className="min-h-screen bg-[#071330] text-slate-100 flex flex-col justify-center items-center p-4 relative overflow-hidden">
        <div className="absolute top-1/4 -left-20 w-96 h-96 bg-orange-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-[#FF4500]/15 rounded-full blur-3xl pointer-events-none" />

        <div className="w-full max-w-xl relative z-10 space-y-6">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate('/')}
              className="flex items-center gap-2 text-xs font-bold text-blue-300 hover:text-white bg-white/5 hover:bg-white/10 px-3.5 py-2 rounded-xl border border-white/10 transition-all"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Retour au Site Public</span>
            </button>

            <span className="text-xs text-blue-300/80 font-mono">
              Portail Administratif Sécurisé
            </span>
          </div>

          <UnifiedAuthForm
            defaultTab="admin"
            title="Connexion Espace Administrateur"
            subtitle="Accès réservé à l'équipe HQ Dakar, au Sourcing Chine et aux Gestionnaires de Hubs"
            redirectTo={currentPath}
          />
        </div>
      </div>
    );
  }

  // Simplified navigation categories following prompt structure:
  // ACCUEIL, VENTES, APPROVISIONNEMENT, LOGISTIQUE, CLIENTS, FINANCES, OUTILS, PARAMÈTRES
  const navSections = [
    {
      type: 'single',
      label: 'Accueil',
      path: '/admin',
      icon: <LayoutDashboard className="w-4 h-4" />,
      badge: unreadAlertsCount > 0 ? `${unreadAlertsCount}` : undefined,
      badgeColor: 'amber'
    },
    {
      type: 'group',
      key: 'ventes',
      label: 'Ventes',
      icon: <ShoppingBag className="w-4 h-4" />,
      items: [
        { label: 'Produits', path: '/admin/products', icon: <Package className="w-3.5 h-3.5" /> },
        { label: 'Commandes', path: '/admin/orders', icon: <ShoppingBag className="w-3.5 h-3.5" /> },
        { label: 'Groupages', path: '/admin/groupages', icon: <Layers className="w-3.5 h-3.5" />, badge: 'Actifs' }
      ]
    },
    {
      type: 'group',
      key: 'appro',
      label: 'Approvisionnement',
      icon: <Compass className="w-4 h-4" />,
      items: [
        { label: 'Sourcing Chine', path: '/admin/sourcing', icon: <Compass className="w-3.5 h-3.5" /> },
        { label: 'Fournisseurs', path: '/admin/suppliers', icon: <Factory className="w-3.5 h-3.5" /> },
        { label: 'Équipe Sourceurs', path: '/admin/sourcers', icon: <Users2 className="w-3.5 h-3.5" /> }
      ]
    },
    {
      type: 'group',
      key: 'logistique',
      label: 'Logistique',
      icon: <Truck className="w-4 h-4" />,
      items: [
        { label: 'Expéditions Fret', path: '/admin/logistics', icon: <Truck className="w-3.5 h-3.5" /> },
        { label: 'Hub Sénégal', path: '/admin/hub', icon: <Warehouse className="w-3.5 h-3.5" /> },
        { label: 'Transporteurs', path: '/admin/transporters', icon: <Truck className="w-3.5 h-3.5" /> }
      ]
    },
    {
      type: 'group',
      key: 'clients',
      label: 'Clients',
      icon: <Users className="w-4 h-4" />,
      items: [
        { label: 'Clients CRM', path: '/admin/customers', icon: <Users className="w-3.5 h-3.5" /> },
        { label: 'Demandes B2B', path: '/admin/b2b', icon: <Briefcase className="w-3.5 h-3.5" /> }
      ]
    },
    {
      type: 'group',
      key: 'finances',
      label: 'Finances',
      icon: <CreditCard className="w-4 h-4" />,
      items: [
        { label: 'Paiements', path: '/admin/payments', icon: <CreditCard className="w-3.5 h-3.5" /> },
        { label: 'Rentabilité & Analytics', path: '/admin/analytics', icon: <BarChart3 className="w-3.5 h-3.5" /> },
        { label: 'Écarts & Variance', path: '/admin/cost-variance', icon: <GitCompare className="w-3.5 h-3.5" /> },
        { label: 'Promotions', path: '/admin/promotions', icon: <Tag className="w-3.5 h-3.5" /> }
      ]
    },
    {
      type: 'group',
      key: 'outils',
      label: 'Outils',
      icon: <Calculator className="w-4 h-4" />,
      items: [
        { label: 'Calculateur Coût', path: '/admin/calculator', icon: <Calculator className="w-3.5 h-3.5 text-blue-300" />, highlight: true },
        { label: 'Assistant IA', path: '/admin/ai-assistant', icon: <Bot className="w-3.5 h-3.5 text-blue-400" /> },
        { label: 'Alertes & Alerting', path: '/admin/alerts', icon: <AlertTriangle className="w-3.5 h-3.5" /> },
        { label: 'Notifications', path: '/admin/notifications', icon: <Send className="w-3.5 h-3.5" /> }
      ]
    },
    {
      type: 'single',
      label: 'Paramètres',
      path: '/admin/settings',
      icon: <Sliders className="w-4 h-4" />
    }
  ];

  return (
    <div className="min-h-screen bg-[#071330] text-slate-100 flex flex-col lg:flex-row antialiased">
      {/* Mobile backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-xs z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:sticky top-0 left-0 z-50 h-screen bg-[#091842] border-r border-blue-900/40 flex flex-col transition-all duration-300 shrink-0 lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } ${collapsed ? 'w-20' : 'w-64'}`}
      >
        {/* Top Logo / Brand & Collapse button */}
        <div className="p-4 border-b border-blue-900/50 flex items-center justify-between bg-[#071330]">
          <div
            onClick={() => navigate('/admin')}
            className="flex items-center gap-2.5 cursor-pointer group min-w-0"
          >
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#FF4500] to-[#FF8A00] flex items-center justify-center text-white shadow-md shrink-0">
              <ShieldCheck className="w-4 h-4" />
            </div>
            {!collapsed && (
              <div className="truncate">
                <span className="font-extrabold text-sm tracking-tight text-white flex items-center gap-1">
                  Dallou Chine <span className="text-[10px] bg-[#FF4500] px-1.5 py-0.2 rounded font-bold">ADMIN</span>
                </span>
                <p className="text-[9px] text-orange-300/80 font-medium">Centre de Contrôle</p>
              </div>
            )}
          </div>

          <div className="flex items-center gap-1">
            {/* Desktop Collapse Toggle */}
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="hidden lg:flex p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
              title={collapsed ? "Agrandir le menu" : "Réduire le menu"}
            >
              {collapsed ? <PanelLeft className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
            </button>

            {/* Mobile close */}
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Navigation items */}
        <div className="flex-1 px-2.5 py-3 overflow-y-auto space-y-1.5 custom-scrollbar">
          {navSections.map((section: any) => {
            if (section.type === 'single') {
              const isActive = currentPath === section.path;
              return (
                <button
                  key={section.path}
                  onClick={() => {
                    navigate(section.path);
                    setSidebarOpen(false);
                  }}
                  title={collapsed ? section.label : undefined}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-[#FF4500] text-white shadow-md'
                      : 'text-slate-300 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className={isActive ? 'text-white' : 'text-blue-400'}>{section.icon}</span>
                    {!collapsed && <span className="truncate">{section.label}</span>}
                  </div>
                  {!collapsed && section.badge && (
                    <span className="text-[9px] px-1.5 py-0.2 rounded font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      {section.badge}
                    </span>
                  )}
                </button>
              );
            }

            // Group section with sub-items
            const isAnySubActive = section.items.some((i: any) => currentPath === i.path);
            const isOpen = openSubmenus[section.key] || isAnySubActive;

            return (
              <div key={section.key} className="space-y-0.5">
                <button
                  onClick={() => {
                    if (collapsed) {
                      setCollapsed(false);
                      setOpenSubmenus(prev => ({ ...prev, [section.key]: true }));
                    } else {
                      toggleSubmenu(section.key);
                    }
                  }}
                  title={collapsed ? section.label : undefined}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                    isAnySubActive && !isOpen
                      ? 'bg-blue-600/20 text-blue-300 border border-blue-500/30'
                      : 'text-slate-300 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className={isAnySubActive ? 'text-blue-300' : 'text-blue-400'}>{section.icon}</span>
                    {!collapsed && <span className="truncate">{section.label}</span>}
                  </div>
                  {!collapsed && (
                    <span className="text-slate-400">
                      {isOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                    </span>
                  )}
                </button>

                {/* Submenu links */}
                {isOpen && !collapsed && (
                  <div className="pl-6 pr-1 py-1 space-y-0.5 border-l border-blue-900/50 ml-4">
                    {section.items.map((sub: any) => {
                      const isSubActive = currentPath === sub.path;
                      return (
                        <button
                          key={sub.path}
                          onClick={() => {
                            navigate(sub.path);
                            setSidebarOpen(false);
                          }}
                          className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                            isSubActive
                              ? 'bg-[#FF4500] text-white font-bold shadow-xs'
                              : 'text-slate-400 hover:text-slate-100 hover:bg-white/5'
                          } ${sub.highlight && !isSubActive ? 'text-orange-300 font-semibold' : ''}`}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <span className={isSubActive ? 'text-white' : 'text-slate-400'}>{sub.icon}</span>
                            <span className="truncate">{sub.label}</span>
                          </div>
                          {sub.badge && (
                            <span className="text-[9px] px-1.5 py-0.2 rounded font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                              {sub.badge}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* User Profile & Public link footer */}
        <div className="p-3 border-t border-blue-900/50 bg-[#071330] space-y-2">
          {!collapsed ? (
            <>
              <div className="flex items-center gap-2.5 px-2 py-1.5 rounded-xl bg-white/5 border border-white/5">
                <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center font-bold text-xs text-white shrink-0">
                  {currentUser?.name ? currentUser.name.charAt(0) : 'A'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-bold text-white truncate">{currentUser?.name || 'Amadou Diallo'}</div>
                  <div className="text-[10px] text-blue-300 truncate">HQ Dakar • {currentRole || 'ADMIN'}</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-1.5 pt-1">
                <button
                  onClick={() => navigate('/')}
                  className="flex items-center justify-center gap-1 py-1.5 px-2 rounded-xl bg-white/5 hover:bg-white/10 text-[11px] font-semibold text-blue-200 hover:text-white border border-white/10 transition-all group"
                  title="Aller sur le catalogue client"
                >
                  <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
                  <span>Site Public</span>
                </button>

                <button
                  onClick={() => logoutUser()}
                  className="flex items-center justify-center gap-1 py-1.5 px-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-[11px] font-bold text-rose-300 hover:text-rose-200 border border-rose-500/20 transition-all"
                  title="Se déconnecter de l'administration"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Quitter</span>
                </button>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <button
                onClick={() => navigate('/')}
                className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-blue-200"
                title="Site Public"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => logoutUser()}
                className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300"
                title="Déconnexion"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* Main Content Container with Sticky Header */}
      <div className="flex-1 flex flex-col min-w-0 bg-[#081538] min-h-screen">
        <AdminHeader onOpenMobileMenu={() => setSidebarOpen(true)} />
        <main className="flex-1 p-4 lg:p-6 max-w-7xl w-full mx-auto space-y-6">
          {children}
        </main>
      </div>
    </div>
  );
};
