import React, { useMemo, useRef, useState } from 'react';
import { ArrowRight, Search, Users, FileText, ShoppingBag, Package } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { usePrefs } from '../../context/PrefsContext';
import { readRecent } from '../../lib/recent';
import { Link } from '../ui/Link';
import { Price } from '../ui/Price';

type Tab = 'products' | 'groupages';

/**
 * Barre de recherche et d'accès rapide d'accueil :
 * Recherche directe de produits dans le catalogue et exploration des groupages en cours.
 */
export function AiSearchBand() {
  const { user, categories, navigate } = useApp();
  const { t } = usePrefs();
  const [tab, setTab] = useState<Tab>('products');
  const [q, setQ] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const history = useMemo(() => readRecent().slice(0, 6), []);
  const first = (user?.fullName || '').split(' ')[0];

  const roots = categories.filter(c => c.isActive !== false && !c.parentId).sort((a, b) => a.sortOrder - b.sortOrder);
  const interests = user?.onboarding.categories || [];
  const ordered = [...roots].sort((a, b) => Number(interests.includes(b.slug)) - Number(interests.includes(a.slug)));
  const top = ordered.slice(0, 8);
  const personalised = interests.length > 0;

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const term = q.trim();
    if (tab === 'products') {
      navigate(term ? `/catalogue?q=${encodeURIComponent(term)}` : '/catalogue');
    } else {
      navigate('/groupages');
    }
  }

  const placeholder =
    tab === 'products'
      ? 'Rechercher un produit, une référence, un article en gros…'
      : 'Rechercher un achat groupé (énergie solaire, high-tech, outillage…)…';

  return (
    <section id="home-ai-search" className="container-page mt-10 scroll-mt-24 sm:mt-14" aria-labelledby="home-search-title">
      {user && (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-white px-5 py-3.5 shadow-[var(--shadow-soft)] ring-1 ring-line">
          <p className="text-[16px] font-bold sm:text-[18px]">{t('home.welcome', { name: first || user.email })}</p>
          <div className="flex flex-wrap gap-x-5 gap-y-2 text-[13.5px] font-semibold">
            <Link to="/sourcing" className="inline-flex items-center gap-1.5 hover:text-brand-700">
              <FileText className="h-4 w-4 text-brand" /> {t('home.quickQuote')}
            </Link>
            <Link to="/groupages" className="inline-flex items-center gap-1.5 hover:text-brand-700">
              <Users className="h-4 w-4 text-brand" /> {t('home.quickGroupages')}
            </Link>
            <Link to="/compte/commandes" className="inline-flex items-center gap-1.5 hover:text-brand-700">
              <ShoppingBag className="h-4 w-4 text-brand" /> Mes commandes
            </Link>
          </div>
        </div>
      )}

      <div className="relative overflow-hidden rounded-[30px] border border-brand-100 bg-gradient-to-b from-brand-50 via-white to-white px-4 pb-6 pt-7 sm:px-10 sm:pb-8 sm:pt-9">
        <div className="pointer-events-none absolute -left-16 -top-20 h-60 w-60 rounded-full bg-brand-400/20 blur-3xl" aria-hidden />
        <h2 id="home-search-title" className="sr-only">
          Recherche directe
        </h2>

        {/* Onglets simples : Produits & Groupages */}
        <div role="tablist" aria-label="Recherche" className="relative mb-5 flex flex-wrap items-end justify-center gap-x-8 gap-y-2 sm:gap-x-12">
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'products'}
            onClick={() => {
              setTab('products');
              inputRef.current?.focus();
            }}
            className={`relative pb-2 font-display text-[20px] font-bold transition-colors sm:text-[28px] ${
              tab === 'products' ? 'text-brand' : 'text-ink hover:text-brand-700'
            }`}
          >
            {t('home.ai.tabProducts')}
            {tab === 'products' && <span className="absolute inset-x-0 -bottom-0.5 h-[3px] rounded-full bg-brand-gradient" aria-hidden />}
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={tab === 'groupages'}
            onClick={() => {
              setTab('groupages');
              inputRef.current?.focus();
            }}
            className={`relative pb-2 font-display text-[20px] font-bold transition-colors sm:text-[28px] ${
              tab === 'groupages' ? 'text-brand' : 'text-ink hover:text-brand-700'
            }`}
          >
            {t('home.ai.tabGroupages')}
            {tab === 'groupages' && <span className="absolute inset-x-0 -bottom-0.5 h-[3px] rounded-full bg-brand-gradient" aria-hidden />}
          </button>
        </div>

        {/* Barre de recherche classique rapide */}
        <form onSubmit={submit} role="search" className="relative mx-auto max-w-[860px] rounded-[26px] border-2 border-brand/70 bg-white p-2.5 shadow-[0_18px_44px_-24px_rgb(232_72_13/0.4)] sm:p-3">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-muted" />
              <input
                id="home-search-input"
                ref={inputRef}
                value={q}
                onChange={e => setQ(e.target.value)}
                placeholder={placeholder}
                maxLength={300}
                enterKeyHint="search"
                className="h-12 w-full bg-transparent pl-11 pr-3 text-[15.5px] placeholder:text-muted focus:outline-none sm:text-[16.5px]"
              />
            </div>
            <button
              type="submit"
              className="inline-flex h-11 shrink-0 items-center gap-2 rounded-full bg-brand-gradient px-5 text-[14.5px] font-bold text-white shadow-[var(--shadow-glow)] transition-[filter] hover:brightness-105 sm:px-7"
            >
              <Search className="h-4 w-4" />
              Rechercher
            </button>
          </div>
        </form>

        {/* Raccourcis utiles sans IA */}
        <div className="relative mx-auto mt-4 flex max-w-[860px] flex-wrap items-center justify-center gap-2.5">
          <Link
            to="/catalogue"
            className="inline-flex items-center gap-1.5 rounded-full border border-line bg-white px-3.5 py-1.5 text-[13px] font-medium text-ink/80 hover:border-brand/40 hover:text-brand-700"
          >
            <Package className="h-3.5 w-3.5 text-brand" /> Voir tout le catalogue
          </Link>
          <Link
            to="/groupages"
            className="inline-flex items-center gap-1.5 rounded-full border border-line bg-white px-3.5 py-1.5 text-[13px] font-medium text-ink/80 hover:border-brand/40 hover:text-brand-700"
          >
            <Users className="h-3.5 w-3.5 text-brand" /> Groupages en cours
          </Link>
          <Link
            to="/sourcing"
            className="inline-flex items-center gap-1.5 rounded-full border border-brand/20 bg-brand-50 px-3.5 py-1.5 text-[13px] font-semibold text-brand-700 hover:bg-brand-100"
          >
            <FileText className="h-3.5 w-3.5 text-brand" /> Demander un devis sur mesure →
          </Link>
        </div>
      </div>

      {/* Catégories principales */}
      {top.length > 0 && (
        <div className="mt-6">
          <p className="mb-3 text-[15px] font-bold">{personalised ? t('home.forYou') : t('home.categories')}</p>
          <ul className="grid grid-cols-4 gap-1 xl:grid-cols-8">
            {top.map(c => (
              <li key={c.id}>
                <Link to={`/catalogue?categorie=${c.slug}`} className="group flex min-w-0 flex-col items-center gap-1.5 rounded-2xl px-1 py-2 text-center text-[11.5px] font-semibold text-ink/80 hover:bg-brand-50">
                  <span className={`h-14 w-14 overflow-hidden rounded-full bg-paper-2 transition-transform group-hover:-translate-y-0.5 ${personalised && interests.includes(c.slug) ? 'ring-2 ring-brand ring-offset-2' : 'ring-1 ring-line'}`}>
                    {c.imageUrl && <img src={c.imageUrl} alt="" loading="lazy" className="h-full w-full object-cover" />}
                  </span>
                  <span className="line-clamp-2 leading-tight">{c.name}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Récemment consultés */}
      {history.length > 0 && (
        <div className="mt-7">
          <p className="mb-3 flex items-center justify-between text-[15px] font-bold">
            {t('home.history')}
            <Link to="/catalogue" className="inline-flex items-center gap-1 text-[13px] font-semibold text-brand-700 hover:underline">
              {t('nav.catalog')} <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </p>
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {history.map(p => (
              <li key={p.id}>
                <Link to={`/produit/${p.slug}`} className="lift block overflow-hidden rounded-2xl border border-line bg-white">
                  <span className="block aspect-[4/3] overflow-hidden bg-paper-2">{p.image && <img src={p.image} alt="" loading="lazy" className="h-full w-full object-cover" />}</span>
                  <span className="block p-2.5">
                    <span className="line-clamp-1 text-[12.5px] font-semibold">{p.name}</span>
                    <Price value={p.priceXOF} size="sm" />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
