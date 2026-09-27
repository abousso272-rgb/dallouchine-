import React from 'react';
import { Home, LayoutGrid, Search as SearchIcon, User, Users } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Link } from '../ui/Link';

const TABS = [
  { to: '/', label: 'Accueil', icon: Home, match: (p: string) => p === '/' },
  { to: '/catalogue', label: 'Catalogue', icon: LayoutGrid, match: (p: string) => p.startsWith('/catalogue') || p.startsWith('/produit') },
  { to: '/groupages', label: 'Groupages', icon: Users, match: (p: string) => p.startsWith('/groupages') },
  { to: '/sourcing', label: 'Sourcing', icon: SearchIcon, match: (p: string) => p.startsWith('/sourcing') || p.startsWith('/pro') },
  { to: '/compte', label: 'Compte', icon: User, match: (p: string) => p.startsWith('/compte') || p === '/connexion' }
];

/** Barre d'onglets mobile (navigation au pouce). */
export function MobileTabBar() {
  const { path, user, unreadCount } = useApp();
  return (
    <nav className="safe-bottom fixed inset-x-0 bottom-0 z-40 border-t border-line bg-white/95 backdrop-blur-md lg:hidden" aria-label="Navigation rapide">
      <div className="grid h-[62px] grid-cols-5">
        {TABS.map(t => {
          const active = t.match(path);
          const Icon = t.icon;
          const to = t.to === '/compte' && !user ? '/connexion' : t.to;
          return (
            <Link key={t.to} to={to} className={`relative flex flex-col items-center justify-center gap-1 text-[10.5px] font-semibold ${active ? 'text-ink' : 'text-subtle'}`}>
              {active && <span className="absolute top-0 h-0.5 w-8 rounded-full bg-brand" aria-hidden />}
              <Icon className="h-[21px] w-[21px]" strokeWidth={active ? 2.3 : 1.9} />
              {t.label}
              {t.to === '/compte' && unreadCount > 0 && <span className="absolute right-[calc(50%-16px)] top-2.5 h-2 w-2 rounded-full bg-brand" />}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
