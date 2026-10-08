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
  // Le tunnel d’achat et la fiche produit affichent leur propre barre d’action
  if (path === '/panier' || path === '/commande' || path.startsWith('/produit/')) return null;
  return (
    <nav className="safe-bottom fixed inset-x-0 bottom-0 z-40 px-2 pb-2 lg:hidden" aria-label="Navigation rapide">
      <div className="glass grid h-[64px] grid-cols-5 rounded-[22px] shadow-[0_-4px_30px_-12px_rgb(120_60_20/0.35)]">
        {TABS.map(t => {
          const active = t.match(path);
          const Icon = t.icon;
          const to = t.to === '/compte' && !user ? '/connexion' : t.to;
          return (
            <Link key={t.to} to={to} className={`relative flex flex-col items-center justify-center gap-0.5 text-[10.5px] font-semibold transition-colors ${active ? 'text-brand-600' : 'text-ink/55'}`}>
              <span className={`flex h-8 w-11 items-center justify-center rounded-full transition-all ${active ? 'bg-brand-gradient text-white shadow-[var(--shadow-glow)]' : ''}`}>
                <Icon className="h-[19px] w-[19px]" strokeWidth={active ? 2.3 : 1.9} />
              </span>
              {t.label}
              {t.to === '/compte' && unreadCount > 0 && <span className="absolute right-[calc(50%-18px)] top-1.5 h-2 w-2 rounded-full bg-brand ring-2 ring-white" />}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
