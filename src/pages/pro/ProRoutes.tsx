import React, { useEffect, useState } from 'react';
import {
  Boxes,
  Car,
  ClipboardList,
  CreditCard,
  ExternalLink,
  FolderTree,
  LayoutDashboard,
  LogOut,
  Menu,
  Package,
  ShieldAlert,
  UserCog,
  Users,
  UsersRound,
  X
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { matchPattern } from '../../lib/router';
import type { AppRole } from '../../lib/types';
import { ROLE_LABEL } from '../../lib/status';
import { initials } from '../../lib/format';
import { Link } from '../../components/ui/Link';
import { Logo } from '../../components/ui/Logo';
import { Button } from '../../components/ui/Button';
import { EmptyState } from '../../components/ui/States';
import { AuthForm } from '../../components/auth/AuthForm';
import DashboardPage from './DashboardPage';
import StaffOrdersPage from './StaffOrdersPage';
import StaffOrderDetailPage from './StaffOrderDetailPage';
import StaffRequestsPage from './StaffRequestsPage';
import StaffRequestDetailPage from './StaffRequestDetailPage';
import StaffGroupagesPage from './StaffGroupagesPage';
import GroupageEditorPage from './GroupageEditorPage';
import StaffProductsPage from './StaffProductsPage';
import ProductEditorPage from './ProductEditorPage';
import CategoriesPage from './CategoriesPage';
import StaffVehiclesPage from './StaffVehiclesPage';
import VehicleEditorPage from './VehicleEditorPage';
import StaffPaymentsPage from './StaffPaymentsPage';
import CustomersPage from './CustomersPage';
import TeamPage from './TeamPage';
import type { RequestType } from '../../lib/status';

const ALL: AppRole[] = ['admin', 'transitaire', 'groupage_manager'];

export const PRO_NAV: { to: string; label: string; icon: React.ElementType; roles: AppRole[]; exact?: boolean }[] = [
  { to: '/espace-pro', label: 'Tableau de bord', icon: LayoutDashboard, roles: ALL, exact: true },
  { to: '/espace-pro/commandes', label: 'Commandes', icon: Package, roles: ALL },
  { to: '/espace-pro/demandes', label: 'Demandes & devis', icon: ClipboardList, roles: ['admin', 'transitaire'] },
  { to: '/espace-pro/groupages', label: 'Groupages', icon: Users, roles: ['admin', 'groupage_manager'] },
  { to: '/espace-pro/produits', label: 'Produits', icon: Boxes, roles: ['admin', 'transitaire'] },
  { to: '/espace-pro/categories', label: 'Catégories', icon: FolderTree, roles: ['admin'] },
  { to: '/espace-pro/vehicules', label: 'Automobile', icon: Car, roles: ['admin', 'transitaire'] },
  { to: '/espace-pro/paiements', label: 'Paiements', icon: CreditCard, roles: ['admin'] },
  { to: '/espace-pro/clients', label: 'Clients', icon: UsersRound, roles: ['admin'] },
  { to: '/espace-pro/equipe', label: 'Équipe', icon: UserCog, roles: ['admin'] }
];

interface ProRoute {
  pattern: string;
  roles: AppRole[];
  render: (p: Record<string, string>) => React.ReactNode;
}

const ROUTES: ProRoute[] = [
  { pattern: '/espace-pro', roles: ALL, render: () => <DashboardPage /> },
  { pattern: '/espace-pro/commandes', roles: ALL, render: () => <StaffOrdersPage /> },
  { pattern: '/espace-pro/commandes/:id', roles: ALL, render: p => <StaffOrderDetailPage id={p.id} /> },
  { pattern: '/espace-pro/demandes', roles: ['admin', 'transitaire'], render: () => <StaffRequestsPage /> },
  {
    pattern: '/espace-pro/demandes/:type/:id',
    roles: ['admin', 'transitaire'],
    render: p => (['sourcing', 'b2b', 'vehicle'].includes(p.type) ? <StaffRequestDetailPage type={p.type as RequestType} id={p.id} /> : <NotFound />)
  },
  { pattern: '/espace-pro/groupages', roles: ['admin', 'groupage_manager'], render: () => <StaffGroupagesPage /> },
  { pattern: '/espace-pro/groupages/:id', roles: ['admin', 'groupage_manager'], render: p => <GroupageEditorPage id={p.id} /> },
  { pattern: '/espace-pro/produits', roles: ['admin', 'transitaire'], render: () => <StaffProductsPage /> },
  { pattern: '/espace-pro/produits/:id', roles: ['admin', 'transitaire'], render: p => <ProductEditorPage id={p.id} /> },
  { pattern: '/espace-pro/categories', roles: ['admin'], render: () => <CategoriesPage /> },
  { pattern: '/espace-pro/vehicules', roles: ['admin', 'transitaire'], render: () => <StaffVehiclesPage /> },
  { pattern: '/espace-pro/vehicules/:id', roles: ['admin', 'transitaire'], render: p => <VehicleEditorPage id={p.id} /> },
  { pattern: '/espace-pro/paiements', roles: ['admin'], render: () => <StaffPaymentsPage /> },
  { pattern: '/espace-pro/clients', roles: ['admin'], render: () => <CustomersPage /> },
  { pattern: '/espace-pro/equipe', roles: ['admin'], render: () => <TeamPage /> }
];

function NotFound() {
  return <EmptyState title="Page introuvable" action={<Button to="/espace-pro">Tableau de bord</Button>} />;
}

export default function ProRoutes({ path }: { path: string }) {
  const { user, signOut } = useApp();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => setMenuOpen(false), [path]);

  if (!user) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-paper px-4 py-10">
        <div className="w-full max-w-md">
          <div className="mb-6 flex justify-center">
            <Logo />
          </div>
          <div className="surface p-5 sm:p-7">
            <h1 className="text-xl font-bold">Espace professionnel</h1>
            <p className="mb-5 mt-1 text-sm text-muted">Réservé à l’équipe DALUCHE : administration, transitaires et gestionnaires de groupages.</p>
            <AuthForm loginOnly />
            <p className="mt-4 border-t border-line pt-4 text-[12.5px] text-muted">Pas encore de compte équipe ? L’accès se fait sur invitation de l’administrateur, via le lien reçu par email.</p>
          </div>
          <p className="mt-4 text-center text-sm">
            <Link to="/" className="font-semibold text-muted hover:text-ink">
              ← Retour au site
            </Link>
          </p>
        </div>
      </div>
    );
  }

  if (user.role === 'client') {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-paper px-4">
        <div className="card max-w-md p-6 text-center sm:p-8">
          <ShieldAlert className="mx-auto h-10 w-10 text-brand" />
          <h1 className="mt-4 text-xl font-bold">Accès réservé à l’équipe</h1>
          <p className="mt-2 text-sm text-muted">Votre compte est un compte client. Si vous faites partie de l’équipe, demandez une invitation à l’administrateur.</p>
          <div className="mt-6 flex justify-center gap-2">
            <Button to="/compte">Mon espace client</Button>
            <Button to="/" variant="secondary">
              Accueil
            </Button>
          </div>
        </div>
      </div>
    );
  }

  let content: React.ReactNode = <NotFound />;
  for (const r of ROUTES) {
    const params = matchPattern(r.pattern, path);
    if (params) {
      content = r.roles.includes(user.role) ? (
        r.render(params)
      ) : (
        <EmptyState icon={<ShieldAlert className="h-5 w-5" />} title="Accès non autorisé" description="Cette section ne fait pas partie de votre rôle." action={<Button to="/espace-pro">Tableau de bord</Button>} />
      );
      break;
    }
  }

  const nav = PRO_NAV.filter(n => n.roles.includes(user.role));
  const isActive = (to: string, exact?: boolean) => (exact ? path === to : path === to || path.startsWith(to + '/'));

  const sidebar = (
    <div className="flex h-full flex-col">
      <div className="flex h-16 items-center justify-between px-5">
        <Link to="/espace-pro">
          <Logo inverted />
        </Link>
        <button type="button" className="rounded-lg p-2 text-white/70 hover:bg-white/10 lg:hidden" onClick={() => setMenuOpen(false)} aria-label="Fermer le menu">
          <X className="h-5 w-5" />
        </button>
      </div>
      <div className="mx-3 mb-4 rounded-2xl bg-white/[0.06] p-3 ring-1 ring-white/10">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-gradient text-[12px] font-bold text-white">{initials(user.fullName || user.email)}</span>
          <div className="min-w-0">
            <p className="truncate text-[13.5px] font-semibold text-white">{user.fullName || user.email}</p>
            <p className="truncate text-[11.5px] text-white/55">{ROLE_LABEL[user.role]}</p>
          </div>
        </div>
      </div>
      <nav className="flex-1 space-y-0.5 overflow-y-auto px-3" aria-label="Espace professionnel">
        {nav.map(item => {
          const active = isActive(item.to, item.exact);
          return (
            <Link
              key={item.to}
              to={item.to}
              className={`flex h-10 items-center gap-3 rounded-full px-3.5 text-[13.5px] font-semibold transition-all ${
                active ? 'bg-brand-gradient text-white shadow-[0_8px_20px_-10px_rgb(242_86_15/0.8)]' : 'text-white/65 hover:bg-white/10 hover:text-white'
              }`}
            >
              <item.icon className="h-[18px] w-[18px]" />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="space-y-0.5 border-t border-white/10 p-3">
        <Link to="/" className="flex h-10 items-center gap-3 rounded-xl px-3 text-[13px] font-semibold text-white/60 hover:bg-white/10 hover:text-white">
          <ExternalLink className="h-4 w-4" /> Voir le site
        </Link>
        <button type="button" onClick={signOut} className="flex h-10 w-full items-center gap-3 rounded-xl px-3 text-[13px] font-semibold text-white/60 hover:bg-white/10 hover:text-white">
          <LogOut className="h-4 w-4" /> Se déconnecter
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-dvh bg-paper lg:grid lg:grid-cols-[256px_1fr]">
      <aside className="sticky top-0 hidden h-dvh overflow-hidden bg-ink lg:block">
        <div className="pointer-events-none absolute -left-20 -top-24 h-64 w-64 rounded-full bg-brand/25 blur-3xl" aria-hidden />
        <div className="relative h-full">{sidebar}</div>
      </aside>

      {menuOpen && (
        <div className="fixed inset-0 z-[70] lg:hidden" role="dialog" aria-modal="true">
          <div className="absolute inset-0 bg-ink/50" onClick={() => setMenuOpen(false)} aria-hidden />
          <aside className="animate-fade-in-up absolute inset-y-0 left-0 w-[82%] max-w-[300px] bg-ink">{sidebar}</aside>
        </div>
      )}

      <div className="min-w-0">
        <header className="glass sticky top-0 z-40 flex h-14 items-center gap-3 border-x-0 border-t-0 px-4 lg:hidden">
          <button type="button" onClick={() => setMenuOpen(true)} className="rounded-xl p-2 hover:bg-ink/5" aria-label="Ouvrir le menu">
            <Menu className="h-5 w-5" />
          </button>
          <Logo compact />
          <span className="truncate text-[13px] font-semibold text-muted">{ROLE_LABEL[user.role]}</span>
        </header>
        <main className="mx-auto w-full max-w-[1280px] px-4 py-6 sm:px-6 sm:py-8 lg:px-10">{content}</main>
      </div>
    </div>
  );
}
