import React, { useEffect, useRef, useState } from 'react';
import { ArrowRight, ChevronDown, ChevronRight, LayoutDashboard, LogOut, Menu, PackageSearch, Search, ShoppingBag, Sparkles, User, X } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Link } from '../ui/Link';
import { Logo } from '../ui/Logo';
import { initials } from '../../lib/format';
import { usePrefs } from '../../context/PrefsContext';
import type { TranslationKey } from '../../lib/i18n';
import { PrefsMenu, PrefsPanel } from './PrefsMenu';
import { MegaMenu } from './MegaMenu';

export const MAIN_NAV: { to: string; labelKey: TranslationKey; match: string[]; mega?: boolean; wide?: boolean }[] = [
  { to: '/catalogue', labelKey: 'nav.catalog', match: ['/catalogue', '/produit'], mega: true },
  { to: '/groupages', labelKey: 'nav.groupages', match: ['/groupages'] },
  { to: '/sourcing', labelKey: 'nav.sourcing', match: ['/sourcing'] },
  { to: '/automobile', labelKey: 'nav.auto', match: ['/automobile'] },
  { to: '/pro', labelKey: 'nav.b2b', match: ['/pro'] },
  { to: '/guide', labelKey: 'nav.guide', match: ['/guide'], wide: true }
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
  const { t } = usePrefs();
  const [megaOpen, setMegaOpen] = useState(false);
  const megaTimer = useRef<number | undefined>(undefined);
  const searchRef = useRef<HTMLInputElement>(null);
  const accountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMenuOpen(false);
    setSearchOpen(false);
    setAccountOpen(false);
    setMegaOpen(false);
  }, [path]);

  useEffect(() => {
    if (!megaOpen) return;
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && setMegaOpen(false);
    document.addEventListener('keydown', esc);
    return () => document.removeEventListener('keydown', esc);
  }, [megaOpen]);

  const openMega = () => {
    window.clearTimeout(megaTimer.current);
    megaTimer.current = window.setTimeout(() => setMegaOpen(true), 90);
  };
  const closeMega = () => {
    window.clearTimeout(megaTimer.current);
    megaTimer.current = window.setTimeout(() => setMegaOpen(false), 160);
  };
  const askAssistant = () => window.dispatchEvent(new CustomEvent('dc:assistant', { detail: { q: q.trim() } }));

  useEffect(() => {
    if (searchOpen) searchRef.current?.focus();
  }, [searchOpen]);

  // ⌘K / Ctrl+K : recherche
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        const desk = document.getElementById('header-search') as HTMLInputElement | null;
        if (desk && desk.offsetParent) desk.focus();
        else setSearchOpen(true);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

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
    <header className="sticky top-0 z-50 px-2 pt-2 sm:px-4 sm:pt-3" onMouseLeave={closeMega}>
      <div className="glass mx-auto flex h-[60px] max-w-7xl items-center gap-2 rounded-2xl pl-2.5 pr-2 shadow-[0_12px_32px_-18px_rgb(120_60_20/0.45)] sm:h-16 sm:rounded-full sm:pl-4 sm:pr-2.5">
        <Link to="/" className="shrink-0" aria-label="Dallou Chine — accueil">
          <Logo />
        </Link>

        <nav className="ml-2 hidden items-center gap-0 xl:ml-4 xl:gap-0.5 lg:flex" aria-label="Navigation principale">
          {MAIN_NAV.map(item => {
            const active = isActive(path, item.match);
            return (
              <div key={item.to} className={item.wide ? 'hidden 2xl:block' : undefined} onMouseEnter={item.mega ? openMega : closeMega} onFocus={item.mega ? openMega : undefined}>
                <Link
                  to={item.to}
                  aria-haspopup={item.mega ? 'true' : undefined}
                  aria-expanded={item.mega ? megaOpen : undefined}
                  onClick={e => {
                    // Écran tactile sans survol : le premier appui ouvre le méga-menu au lieu de naviguer
                    if (item.mega && !megaOpen && !window.matchMedia('(hover: hover)').matches) {
                      e.preventDefault();
                      setMegaOpen(true);
                    }
                  }}
                  className={`inline-flex items-center gap-1 whitespace-nowrap rounded-full px-3 py-2 text-[13.5px] font-semibold transition-all xl:px-3.5 ${
                    active || (item.mega && megaOpen) ? 'bg-brand-gradient text-white shadow-[var(--shadow-glow)]' : 'text-ink/75 hover:bg-white hover:text-ink'
                  }`}
                >
                  {t(item.labelKey)}
                  {item.mega && <ChevronDown className={`h-3.5 w-3.5 transition-transform ${megaOpen ? 'rotate-180' : ''}`} />}
                </Link>
              </div>
            );
          })}
        </nav>

        <form onSubmit={submitSearch} className="relative ml-auto hidden 2xl:block" role="search">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <input
            id="header-search"
            value={q}
            onChange={e => setQ(e.target.value)}
            placeholder={t('header.search')}
            aria-label={t('header.searchAria')}
            className="h-10 w-40 rounded-full border border-line bg-white/80 pl-10 pr-16 text-[13.5px] transition-all focus:w-56 2xl:w-56 2xl:focus:w-72 focus:border-brand/50 focus:bg-white focus:outline-none"
            enterKeyHint="search"
          />
          <button
            type="button"
            onClick={askAssistant}
            title={t('header.ai')}
            aria-label={t('header.ai')}
            className="absolute right-1.5 top-1/2 flex h-7 -translate-y-1/2 items-center gap-1 rounded-full bg-brand-gradient px-2.5 text-[11.5px] font-bold text-white shadow-sm hover:brightness-105"
          >
            <Sparkles className="h-3 w-3" /> IA
          </button>
        </form>

        <div className="ml-auto flex items-center gap-1 2xl:ml-2">
          <PrefsMenu />
          <button
            type="button"
            onClick={() => setSearchOpen(v => !v)}
            className="flex h-10 w-10 items-center justify-center rounded-full text-ink hover:bg-white 2xl:hidden"
            aria-label="Rechercher un produit"
          >
            <Search className="h-[19px] w-[19px]" />
          </button>
          <Link to="/suivi" className="hidden h-10 w-10 items-center justify-center rounded-full text-ink hover:bg-white md:flex" aria-label="Suivre une commande" title="Suivre une commande">
            <PackageSearch className="h-[19px] w-[19px]" />
          </Link>
          <Link to="/panier" className="relative flex h-10 w-10 items-center justify-center rounded-full text-ink hover:bg-white" aria-label={`Panier (${cartCount})`}>
            <ShoppingBag className="h-[19px] w-[19px]" />
            {cartCount > 0 && (
              <span className="num absolute -right-0.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-brand-gradient px-1 text-[10.5px] font-bold text-white ring-2 ring-white">
                {cartCount > 99 ? '99+' : cartCount}
              </span>
            )}
          </Link>

          {isStaff && (
            <Link to="/espace-pro" className="ml-1 hidden h-10 items-center gap-2 rounded-full bg-ink px-4 text-[13px] font-semibold text-white hover:bg-ink-2 md:flex">
              <LayoutDashboard className="h-4 w-4" /> Espace pro
            </Link>
          )}

          {user ? (
            <div className="relative hidden lg:block" ref={accountRef}>
              <button
                type="button"
                onClick={() => setAccountOpen(v => !v)}
                className="relative ml-1 flex h-10 items-center gap-2 rounded-full border border-line bg-white pl-1 pr-3 hover:border-brand/40"
                aria-expanded={accountOpen}
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-gradient text-[12px] font-bold text-white">{initials(user.fullName || user.email)}</span>
                <span className="max-w-[120px] truncate text-[13px] font-semibold">{(user.fullName || 'Mon compte').split(' ')[0]}</span>
                {unreadCount > 0 && <span className="absolute left-7 top-0.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-brand" />}
              </button>
              {accountOpen && (
                <div className="animate-fade-in-up absolute right-0 top-12 w-64 overflow-hidden rounded-2xl border border-line bg-white p-1.5 shadow-[var(--shadow-lift)]">
                  <div className="px-3 py-2.5">
                    <p className="truncate text-sm font-semibold">{user.fullName || 'Mon compte'}</p>
                    <p className="truncate text-[12px] text-muted">{user.email || user.phone}</p>
                  </div>
                  {[
                    { to: '/compte', label: 'Tableau de bord' },
                    { to: '/compte/commandes', label: 'Mes commandes' },
                    { to: '/compte/groupages', label: 'Mes groupages' },
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
            <Link to="/connexion" className="ml-1 hidden h-10 items-center gap-2 rounded-full border border-brand/30 bg-white px-4 text-[13px] font-semibold text-brand-600 hover:border-brand hover:bg-brand-50 lg:flex">
              <User className="h-4 w-4" /> {t('header.login')}
            </Link>
          )}

          <Link
            to="/pro"
            className="ml-1 hidden h-10 items-center gap-1.5 rounded-full bg-brand-gradient px-4 text-[13px] font-semibold text-white shadow-[var(--shadow-glow)] transition-[filter] hover:brightness-105 2xl:flex"
          >
            {t('header.quote')} <ArrowRight className="h-3.5 w-3.5" />
          </Link>

          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            className="relative flex h-10 w-10 items-center justify-center rounded-full text-ink hover:bg-white lg:hidden"
            aria-label="Ouvrir le menu"
          >
            <Menu className="h-5 w-5" />
            {unreadCount > 0 && <span className="absolute right-1.5 top-1.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-brand" />}
          </button>
        </div>
      </div>

      {megaOpen && (
        <div onMouseEnter={openMega} onMouseLeave={closeMega}>
          <MegaMenu onClose={() => setMegaOpen(false)} />
        </div>
      )}

      {searchOpen && (
        <div className="animate-fade-in-up mx-auto mt-2 max-w-7xl 2xl:hidden">
          <form onSubmit={submitSearch} className="glass flex gap-2 rounded-2xl p-2 shadow-[var(--shadow-warm)]" role="search">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
              <input
                ref={searchRef}
                value={q}
                onChange={e => setQ(e.target.value)}
                placeholder="Rechercher un produit, une catégorie…"
                className="h-11 w-full rounded-full border border-line bg-white pl-10 pr-3 focus:border-brand/50 focus:outline-none"
                enterKeyHint="search"
              />
            </div>
            <button type="button" onClick={askAssistant} aria-label={t('header.ai')} className="flex h-11 items-center gap-1.5 rounded-full border border-brand/30 bg-white px-3.5 text-sm font-semibold text-brand-700">
              <Sparkles className="h-4 w-4" /> IA
            </button>
            <button type="submit" className="h-11 rounded-full bg-brand-gradient px-5 text-sm font-semibold text-white">
              OK
            </button>
          </form>
        </div>
      )}

      {menuOpen && <MobileMenu onClose={() => setMenuOpen(false)} />}
    </header>
  );
}

function MobileMenu({ onClose }: { onClose: () => void }) {
  const { user, isStaff, signOut, path, unreadCount, categories } = useApp();
  const { t } = usePrefs();
  const [catsOpen, setCatsOpen] = useState(false);
  const roots = categories.filter(c => c.isActive && !c.parentId).sort((a, b) => a.sortOrder - b.sortOrder);
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
              <Link to="/inscription" className="flex h-11 items-center justify-center rounded-xl bg-brand-gradient text-sm font-semibold text-white">
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
            {[{ to: '/', labelKey: 'nav.home' as TranslationKey, match: [] as string[], mega: false }, ...MAIN_NAV, { to: '/suivi', labelKey: 'nav.tracking' as TranslationKey, match: ['/suivi'], mega: false }].map(item => {
              const active = item.to === '/' ? path === '/' : isActive(path, item.match);
              const row = `flex items-center justify-between rounded-xl px-3 py-3 text-[15px] font-semibold ${active ? 'bg-white text-brand-600 ring-1 ring-brand/20' : 'text-ink'}`;
              if (item.mega && roots.length) {
                return (
                  <div key={item.to}>
                    <div className={row}>
                      <Link to={item.to} className="flex-1">
                        {t(item.labelKey)}
                      </Link>
                      <button type="button" onClick={() => setCatsOpen(v => !v)} aria-expanded={catsOpen} aria-label={t('mega.allCategories')} className="-mr-2 rounded-lg p-2 hover:bg-ink/5">
                        <ChevronDown className={`h-4 w-4 text-subtle transition-transform ${catsOpen ? 'rotate-180' : ''}`} />
                      </button>
                    </div>
                    {catsOpen && (
                      <ul className="mb-1 ml-3 border-l border-line pl-2">
                        {roots.map(c => (
                          <li key={c.id}>
                            <Link to={`/catalogue?categorie=${c.slug}`} className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[14px] font-medium text-ink/85 hover:bg-white">
                              <span className="h-6 w-6 shrink-0 overflow-hidden rounded-md bg-paper-2">{c.imageUrl && <img src={c.imageUrl} alt="" loading="lazy" className="h-full w-full object-cover" />}</span>
                              <span className="truncate">{c.name}</span>
                            </Link>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                );
              }
              return (
                <Link key={item.to} to={item.to} className={row}>
                  {t(item.labelKey)}
                  <ChevronRight className="h-4 w-4 text-subtle" />
                </Link>
              );
            })}
          </nav>
          <button
            type="button"
            onClick={() => {
              onClose();
              window.dispatchEvent(new CustomEvent('dc:assistant', { detail: { q: '' } }));
            }}
            className="mt-3 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-brand-gradient text-sm font-semibold text-white"
          >
            <Sparkles className="h-4 w-4" /> {t('header.ai')}
          </button>
          <div className="mt-6 rounded-2xl bg-white p-4 ring-1 ring-line">
            <p className="mb-3 text-sm font-bold">{t('prefs.title')}</p>
            <PrefsPanel />
          </div>
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
