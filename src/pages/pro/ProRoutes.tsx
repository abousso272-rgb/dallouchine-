import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  Package, 
  ShoppingBag, 
  Users, 
  Search, 
  ShieldCheck, 
  CreditCard, 
  LogOut, 
  UserCheck, 
  Sparkles,
  ChevronRight,
  Shield,
  Truck
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Link } from '../../components/ui/Link';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { AuthForm } from '../../components/auth/AuthForm';
import NotFoundPage from '../public/NotFoundPage';

import ProOverview from './ProOverview';
import ProOrders from './ProOrders';
import ProProducts from './ProProducts';
import ProGroupages from './ProGroupages';
import ProSourcing from './ProSourcing';
import ProTeam from './ProTeam';
import ProCustomers from './ProCustomers';
import ProPayments from './ProPayments';
import type { AppRole } from '../../lib/types';

export default function ProRoutes({ path }: { path: string }) {
  const { user, signOut, navigate } = useApp();
  
  // Rôle actif (avec possibilité de simulation locale démo)
  const [demoRoleOverride, setDemoRoleOverride] = useState<AppRole | null>(() => {
    return (localStorage.getItem('daluche_demo_role') as AppRole) || null;
  });

  const activeRole: AppRole = demoRoleOverride || (user?.role === 'client' ? 'admin' : (user?.role || 'admin'));

  const handleSwitchDemoRole = (r: AppRole) => {
    setDemoRoleOverride(r);
    localStorage.setItem('daluche_demo_role', r);
  };

  // Si aucun utilisateur n'est connecté et pas de rôle démo actif
  if (!user && !demoRoleOverride) {
    return (
      <div className="container-page max-w-md py-12">
        <div className="text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-ink text-white shadow-lg">
            <ShieldCheck className="h-7 w-7 text-brand" />
          </div>
          <h1 className="mt-4 text-2xl font-bold tracking-tight text-ink">Espace Professionnel DALUCHE</h1>
          <p className="mt-1.5 text-sm text-muted">
            Accès réservé à la Direction, aux Transitaires Chine et aux Gestionnaires de conteneurs.
          </p>
        </div>

        <div className="card mt-6 p-6">
          <AuthForm />

          <div className="mt-6 border-t border-line pt-5 text-center">
            <span className="text-xs font-medium text-muted">Évaluation / Démonstration :</span>
            <div className="mt-2.5 flex flex-col gap-2">
              <Button
                variant="secondary"
                size="sm"
                block
                onClick={() => handleSwitchDemoRole('admin')}
                icon={<Sparkles className="h-4 w-4 text-brand" />}
              >
                Explorer en tant que Super Admin HQ
              </Button>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="subtle"
                  size="sm"
                  onClick={() => handleSwitchDemoRole('transitaire')}
                >
                  Vue Transitaire
                </Button>
                <Button
                  variant="subtle"
                  size="sm"
                  onClick={() => handleSwitchDemoRole('groupage_manager')}
                >
                  Vue Groupages
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Navigation selon le rôle
  const navItems = [
    { to: '/espace-pro', label: 'Tableau de bord', icon: LayoutDashboard, exact: true, roles: ['admin', 'transitaire', 'groupage_manager'] },
    { to: '/espace-pro/commandes', label: 'Commandes & Fret', icon: Truck, roles: ['admin', 'transitaire', 'groupage_manager'] },
    { to: '/espace-pro/sourcing', label: 'Sourcing Chine & B2B', icon: Search, roles: ['admin', 'transitaire'] },
    { to: '/espace-pro/groupages', label: 'Gestion Groupages', icon: Users, roles: ['admin', 'groupage_manager'] },
    { to: '/espace-pro/produits', label: 'Catalogue Import', icon: ShoppingBag, roles: ['admin', 'transitaire'] },
    { to: '/espace-pro/equipe', label: 'Équipe & Rôles', icon: ShieldCheck, roles: ['admin'] },
    { to: '/espace-pro/clients', label: 'Clients', icon: UserCheck, roles: ['admin'] },
    { to: '/espace-pro/paiements', label: 'Paiements', icon: CreditCard, roles: ['admin'] }
  ].filter(item => item.roles.includes(activeRole));

  let page: React.ReactNode = null;
  if (path === '/espace-pro' || path === '/espace-pro/dashboard') page = <ProOverview />;
  else if (path === '/espace-pro/commandes') page = <ProOrders />;
  else if (path === '/espace-pro/produits') page = <ProProducts />;
  else if (path === '/espace-pro/groupages') page = <ProGroupages />;
  else if (path === '/espace-pro/sourcing') page = <ProSourcing />;
  else if (path === '/espace-pro/equipe') page = <ProTeam />;
  else if (path === '/espace-pro/clients') page = <ProCustomers />;
  else if (path === '/espace-pro/paiements') page = <ProPayments />;
  else page = <NotFoundPage />;

  const isActive = (to: string, exact?: boolean) => (exact ? path === to : path === to || path.startsWith(to + '/'));

  return (
    <div className="min-h-[85vh] bg-paper">
      {/* Bannière de sélection de rôle / simulation */}
      <div className="border-b border-line bg-ink text-white">
        <div className="container-page flex flex-col justify-between gap-3 py-2.5 sm:flex-row sm:items-center">
          <div className="flex items-center gap-2.5 text-xs">
            <span className="flex h-2 w-2 rounded-full bg-emerald-400" />
            <span className="font-semibold text-white/90">Espace Opérationnel DALUCHE</span>
            <span className="text-white/40">·</span>
            <span className="text-white/70">
              Rôle actif : <strong className="text-white">{
                activeRole === 'admin' ? 'Super Admin HQ' :
                activeRole === 'transitaire' ? 'Transitaire & Sourceur Chine' :
                'Gestionnaire Groupages'
              }</strong>
            </span>
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto">
            <span className="text-[11px] text-white/60 mr-1 hidden lg:inline">Aperçu rôle :</span>
            {[
              { id: 'admin' as const, label: 'Admin HQ' },
              { id: 'transitaire' as const, label: 'Transitaire' },
              { id: 'groupage_manager' as const, label: 'Groupages' }
            ].map(r => (
              <button
                key={r.id}
                type="button"
                onClick={() => handleSwitchDemoRole(r.id)}
                className={`rounded-lg px-2.5 py-1 text-[11.5px] font-semibold transition ${
                  activeRole === r.id
                    ? 'bg-brand text-white shadow-sm'
                    : 'bg-white/10 text-white/80 hover:bg-white/20'
                }`}
              >
                {r.label}
              </button>
            ))}

            <Link
              to="/compte"
              className="ml-2 rounded-lg bg-white/10 px-2.5 py-1 text-[11.5px] font-semibold text-white/80 hover:bg-white/20"
            >
              Vue Client
            </Link>
          </div>
        </div>
      </div>

      {/* Contenu principal avec barre latérale */}
      <div className="container-page py-6 sm:py-8">
        <div className="grid gap-6 lg:grid-cols-[240px_1fr] lg:gap-8">
          {/* Menu latéral */}
          <aside>
            <nav className="scrollbar-none -mx-4 flex gap-1.5 overflow-x-auto px-4 lg:sticky lg:top-24 lg:mx-0 lg:flex-col lg:gap-1 lg:px-0" aria-label="Espace professionnel">
              {navItems.map(item => {
                const active = isActive(item.to, item.exact);
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    className={`flex h-10 shrink-0 items-center gap-2.5 rounded-xl px-3.5 text-[13px] font-semibold transition-colors ${
                      active
                        ? 'bg-ink text-white shadow-sm'
                        : 'bg-white text-muted ring-1 ring-line hover:text-ink lg:bg-transparent lg:ring-0 lg:hover:bg-white'
                    }`}
                  >
                    <item.icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </aside>

          {/* Page active */}
          <div className="min-w-0">{page}</div>
        </div>
      </div>
    </div>
  );
}
