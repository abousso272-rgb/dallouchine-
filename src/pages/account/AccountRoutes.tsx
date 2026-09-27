import React from 'react';
import { Bell, ClipboardList, CreditCard, LayoutDashboard, Package, User, Users } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { matchPattern } from '../../lib/router';
import { Link } from '../../components/ui/Link';
import { AuthForm } from '../../components/auth/AuthForm';
import NotFoundPage from '../public/NotFoundPage';
import OverviewPage from './OverviewPage';
import OrdersPage from './OrdersPage';
import OrderDetailPage from './OrderDetailPage';
import MyGroupagesPage from './MyGroupagesPage';
import RequestsPage from './RequestsPage';
import RequestDetailPage from './RequestDetailPage';
import PaymentsPage from './PaymentsPage';
import NotificationsPage from './NotificationsPage';
import ProfilePage from './ProfilePage';
import type { RequestType } from '../../lib/status';

const NAV = [
  { to: '/compte', label: 'Tableau de bord', icon: LayoutDashboard, exact: true },
  { to: '/compte/commandes', label: 'Commandes', icon: Package },
  { to: '/compte/groupages', label: 'Groupages', icon: Users },
  { to: '/compte/demandes', label: 'Demandes & devis', icon: ClipboardList },
  { to: '/compte/paiements', label: 'Paiements', icon: CreditCard },
  { to: '/compte/notifications', label: 'Notifications', icon: Bell },
  { to: '/compte/profil', label: 'Profil', icon: User }
];

export default function AccountRoutes({ path }: { path: string }) {
  const { user, unreadCount } = useApp();

  if (!user) {
    return (
      <div className="container-page max-w-md py-10">
        <h1 className="text-2xl font-semibold">Mon espace client</h1>
        <p className="mb-6 mt-1 text-sm text-muted">Connectez-vous pour retrouver vos commandes, groupages, demandes et paiements.</p>
        <div className="card p-5 sm:p-6">
          <AuthForm />
        </div>
      </div>
    );
  }

  let page: React.ReactNode = null;
  let p: Record<string, string> | null;
  if (path === '/compte') page = <OverviewPage />;
  else if (path === '/compte/commandes') page = <OrdersPage />;
  else if ((p = matchPattern('/compte/commandes/:id', path))) page = <OrderDetailPage id={p.id} />;
  else if (path === '/compte/groupages') page = <MyGroupagesPage />;
  else if (path === '/compte/demandes') page = <RequestsPage />;
  else if ((p = matchPattern('/compte/demandes/:type/:id', path)) && ['sourcing', 'b2b', 'vehicle'].includes(p.type)) page = <RequestDetailPage type={p.type as RequestType} id={p.id} />;
  else if (path === '/compte/paiements') page = <PaymentsPage />;
  else if (path === '/compte/notifications') page = <NotificationsPage />;
  else if (path === '/compte/profil') page = <ProfilePage />;
  else return <NotFoundPage />;

  const isActive = (to: string, exact?: boolean) => (exact ? path === to : path === to || path.startsWith(to + '/'));

  return (
    <div className="container-page py-6 sm:py-10">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[230px_1fr] lg:gap-10">
        <aside>
          <nav className="scrollbar-none -mx-4 flex gap-1.5 overflow-x-auto px-4 lg:sticky lg:top-24 lg:mx-0 lg:flex-col lg:gap-0.5 lg:px-0" aria-label="Espace client">
            {NAV.map(item => {
              const active = isActive(item.to, item.exact);
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`flex h-10 shrink-0 items-center gap-2.5 rounded-xl px-3.5 text-[13.5px] font-semibold transition-colors ${
                    active ? 'bg-ink text-white' : 'bg-white text-muted ring-1 ring-line hover:text-ink lg:bg-transparent lg:ring-0 lg:hover:bg-white'
                  }`}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                  {item.to === '/compte/notifications' && unreadCount > 0 && (
                    <span className={`num ml-auto rounded-full px-1.5 text-[11px] ${active ? 'bg-white/20' : 'bg-brand text-white'}`}>{unreadCount}</span>
                  )}
                </Link>
              );
            })}
          </nav>
        </aside>
        <div className="min-w-0">{page}</div>
      </div>
    </div>
  );
}
