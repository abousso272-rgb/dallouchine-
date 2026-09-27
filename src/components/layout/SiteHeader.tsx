import React, { useEffect, useRef, useState } from 'react';
import { ChevronRight, LayoutDashboard, LogOut, Menu, PackageSearch, Search, ShoppingBag, User, X } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Link } from '../ui/Link';
import { Logo } from '../ui/Logo';
import { initials } from '../../lib/format';

export const MAIN_NAV = [
  { to: '/catalogue', label: 'Catalogue', match: ['/catalogue', '/produit'] },
  { to: '/groupages', label: 'Groupages', match: ['/groupages'] },
  { to: '/sourcing', label: 'Sourcing', match: ['/sourcing'] },
  { to: '/automobile', label: 'Auto & Motos', match: ['/automobile'] },
  { to: '/pro', label: 'Professionnels', match: ['/pro'] }
];

function isActive(path: string, match: string[]) {
  return match.some(m => path === m || path.startsWith(m + '/'));
}

export function SiteHeader() {
  const { path, user, cartCount, navigate, isStaff, signOut, unreadCount } = useApp();
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [q, setQ] = useState('');
  const searchRef = useRef<HTMLInputElement>(null);
  const accountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMenuOpen(false);
    setSearchOpen(false);
    setAccountOpen(false);
  }, [path]);

  useEffect(() => {
    if (searchOpen) searchRef.current?.focus();
  }, [searchOpen]);

  useEffect(() => {
    if (!accountOpen) return;
    const close = (e: MouseEvent) => {
      if (accountRef.current && !accountRef.current.contains(e.target as Node)) setAccountOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [accountOpen]);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [menuOpen]);

  function submitSearch(e: React.FormEvent) {
    e.preventDefault();
    const term = q.trim();
    navigate(term ? `/catalogue?q=${encodeURIComponent(term)}` : '/catalogue');
  }

  return (
    <header className="sticky top-0 z-50 border-b border-line/80 bg-paper/90 backdrop-blur-md">
      <div className="container-page flex h-16 items-center gap-3 lg:h-[72px]">
        <Link to="/" className="shrink-0" aria-label="DALUCHE — accueil">
          <Logo />
        </Link>

        <nav className="ml-6 hidden items-center gap-1 lg:flex" aria-label="Navigation principale">
          {MAIN_NAV.map(item => (
            <Link
              key={item.to}
              to={item.to}
              className={`rounded-xl px-3.5 py-2 text-[14px] font-semibold transition-colors ${
                isActive(path, item.match) ? 'bg-ink/[0.06] text-ink' : 'text-muted hover:text-ink'
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-1 sm:gap-1.5">
          <button
            type="button"
            onClick={() => setSearchOpen(v => !v)}
            className="flex h-10 w-10 items-center justify-center rounded-xl text-ink hover:bg-ink/5"
            aria-label="Rechercher un produit"
          >
            <Search className="h-[19px] w-[19px]" />
          </button>
          <Link
            to="/suivi"
            className="hidden h-10 items-center gap-2 rounded-xl px-3 text-[14px] font-semibold text-muted hover:text-ink md:flex"
          >
            <PackageSearch className="h-[18px] w-[18px]" /> Suivi
          </Link>
          <Link to="/panier" className="relative flex h-10 w-10 items-center justify-center rounded-xl text-ink hover:bg-ink/5" aria-label={`Panier (${cartCount})`}>
            <ShoppingBag className="h-[19px] w-[19px]" />
            {cartCount > 0 && (
              <span className="num absolute right-0.5 top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-brand px-1 text-[10.5px] font-bold text-white">
                {cartCount > 99 ? '99+' : cartCount}
              </span>
            )}
          </Link>

          {isStaff && (
            <Link to="/espace-pro" className="ml-1 hidden h-10 items-center gap-2 rounded-xl bg-ink px-3.5 text-[13px] font-semibold text-white hover:bg-ink-2 md:flex">
              <LayoutDashboard className="h-4 w-4" /> Espace pro
            </Link>
          )}

          {user ? (
            <div className="relative hidden lg:block" ref={accountRef}>
              <button
                type="button"
                onClick={() => setAccountOpen(v => !v)}
                className="relative ml-1 flex h-10 items-center gap-2 rounded-xl pl-1 pr-2.5 hover:bg-ink/5"
                aria-expanded={accountOpen}
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-ink text-[12px] font-bold text-white">{initials(user.fullName || user.email)}</span>
                <span className="max-w-[120px] truncate text-[13px] font-semibold">{(user.fullName || 'Mon compte').split(' ')[0]}</span>
                {unreadCount > 0 && <span className="absolute left-7 top-1 h-2.5 w-2.5 rounded-full border-2 border-paper bg-brand" />}
              </button>
              {accountOpen && (
                <div className="animate-fade-in-up absolute right-0 top-12 w-60 overflow-hidden rounded-2xl border border-line bg-white p-1.5 shadow-[var(--shadow-lift)]">
                  <div className="px-3 py-2.5">
                    <p className="truncate text-sm font-semibold">{user.fullName || 'Mon compte'}</p>
                    <p className="truncate text-[12px] text-muted">{user.email || user.phone}</p>
                  </div>
                  {[
                    { to: '/compte', label: 'Tableau de bord' },
                    { to: '/compte/commandes', label: 'Mes commandes' },
                    { to: '/compte/demandes', label: 'Mes demandes & devis' },
                    { to: '/compte/notifications', label: `Notifications${unreadCount ? ` (${unreadCount})` : ''}` },
                    { to: '/compte/profil', label: 'Profil' }
                  ].map(l => (
                    <Link key={l.to} to={l.to} className="block rounded-xl px-3 py-2 text-[13.5px] font-medium text-ink hover:bg-paper">
                      {l.label}
                    </Link>
                  ))}
                  <button type="button" onClick={signOut} className="mt-1 flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-[13.5px] font-medium text-red-700 hover:bg-red-50">
                    <LogOut className="h-4 w-4" /> Se déconnecter
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link to="/connexion" className="ml-1 hidden h-10 items-center gap-2 rounded-xl border border-line-2 bg-white px-3.5 text-[13px] font-semibold hover:border-ink/40 lg:flex">
              <User className="h-4 w-4" /> Se connecter
            </Link>
          )}

          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            className="relative flex h-10 w-10 items-center justify-center rounded-xl text-ink hover:bg-ink/5 lg:hidden"
            aria-label="Ouvrir le menu"
          >
            <Menu className="h-5 w-5" />
            {unreadCount > 0 && <span className="absolute right-1.5 top-1.5 h-2.5 w-2.5 rounded-full border-2 border-paper bg-brand" />}
          </button>
        </div>
      </div>

      {searchOpen && (
        <div className="animate-fade-in-up border-t border-line bg-paper">
          <form onSubmit={submitSearch} className="container-page flex gap-2 py-3">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
              <input
                ref={searchRef}
                value={q}
                onChange={e => setQ(e.target.value)}
                placeholder="Rechercher un produit, une catégorie…"
                className="h-11 w-full rounded-xl border border-line-2 bg-white pl-10 pr-3 focus:border-ink focus:outline-none"
                enterKeyHint="search"
              />
            </div>
            <button type="submit" className="h-11 rounded-xl bg-ink px-4 text-sm font-semibold text-white">
              Rechercher
            </button>
          </form>
        </div>
      )}

      {menuOpen && <MobileMenu onClose={() => setMenuOpen(false)} />}
    </header>
  );
}

function MobileMenu({ onClose }: { onClose: () => void }) {
  const { user, isStaff, signOut, path, unreadCount } = useApp();
  return (
    <div className="fixed inset-0 z-[70] lg:hidden" role="dialog" aria-modal="true" aria-label="Menu">
      <div className="absolute inset-0 bg-ink/40" onClick={onClose} aria-hidden />
      <div className="animate-fade-in-up absolute inset-y-0 right-0 flex w-[88%] max-w-sm flex-col bg-paper shadow-2xl">
        <div className="flex h-16 items-center justify-between border-b border-line px-4">
          <Logo />
          <button type="button" onClick={onClose} className="rounded-xl p-2 hover:bg-ink/5" aria-label="Fermer le menu">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-3 py-4">
          {user ? (
            <Link to="/compte" className="mb-4 flex items-center gap-3 rounded-2xl bg-white p-3.5 ring-1 ring-line">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-ink text-sm font-bold text-white">{initials(user.fullName || user.email)}</span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold">{user.fullName || 'Mon compte'}</span>
                <span className="block text-[12px] text-muted">{unreadCount ? `${unreadCount} notification(s) non lue(s)` : 'Voir mon espace client'}</span>
              </span>
              <ChevronRight className="h-4 w-4 text-muted" />
            </Link>
          ) : (
            <div className="mb-4 grid grid-cols-2 gap-2">
              <Link to="/connexion" className="flex h-11 items-center justify-center rounded-xl border border-line-2 bg-white text-sm font-semibold">
                Se connecter
              </Link>
              <Link to="/inscription" className="flex h-11 items-center justify-center rounded-xl bg-ink text-sm font-semibold text-white">
                Créer un compte
              </Link>
            </div>
          )}
          {isStaff && (
            <Link to="/espace-pro" className="mb-4 flex h-11 items-center gap-2 rounded-xl bg-ink px-4 text-sm font-semibold text-white">
              <LayoutDashboard className="h-4 w-4" /> Espace professionnel
            </Link>
          )}
          <p className="eyebrow px-3 pb-2">Services</p>
          <nav className="flex flex-col" aria-label="Navigation mobile">
            {[{ to: '/', label: 'Accueil', match: [] as string[] }, ...MAIN_NAV, { to: '/suivi', label: 'Suivre une commande', match: ['/suivi'] }].map(item => {
              const active = item.to === '/' ? path === '/' : isActive(path, item.match);
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`flex items-center justify-between rounded-xl px-3 py-3 text-[15px] font-semibold ${active ? 'bg-white text-ink ring-1 ring-line' : 'text-ink'}`}
                >
                  {item.label}
                  <ChevronRight className="h-4 w-4 text-subtle" />
                </Link>
              );
            })}
          </nav>
        </div>
        {user && (
          <div className="safe-bottom border-t border-line p-3">
            <button type="button" onClick={signOut} className="flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold text-red-700 hover:bg-red-50">
              <LogOut className="h-4 w-4" /> Se déconnecter
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
