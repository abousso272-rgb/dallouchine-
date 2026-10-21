import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowRight, Camera, Search, Sparkles, Truck, Users, FileText } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { usePrefs } from '../../context/PrefsContext';
import { assistantStore, useAssistant } from '../../lib/assistantStore';
import { readRecent } from '../../lib/recent';
import type { TranslationKey } from '../../lib/i18n';
import { Link } from '../ui/Link';
import { Price } from '../ui/Price';
import { AssistantMessages } from '../assistant/AssistantMessages';

type Tab = 'ai' | 'products' | 'groupages';

const SUGGESTIONS: TranslationKey[] = ['home.ai.s1', 'home.ai.s2', 'home.ai.s3', 'home.ai.s4'];

/**
 * Recherche d'accueil à trois modes : « Mode IA » (conversation avec l'assistant, affichée dans la page),
 * produits et groupages. Le Mode IA est ouvert par défaut. Les catégories sont personnalisées selon les réponses du client.
 */
export function AiSearchBand() {
  const { user, categories, navigate } = useApp();
  const { t, lang } = usePrefs();
  const { messages, busy } = useAssistant();
  const [tab, setTab] = useState<Tab>('ai');
  const [q, setQ] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const history = useMemo(() => readRecent().slice(0, 6), []);
  const first = (user?.fullName || '').split(' ')[0];

  const roots = categories.filter(c => c.isActive !== false && !c.parentId).sort((a, b) => a.sortOrder - b.sortOrder);
  const interests = user?.onboarding.categories || [];
  const ordered = [...roots].sort((a, b) => Number(interests.includes(b.slug)) - Number(interests.includes(a.slug)));
  const top = ordered.slice(0, 8);
  const personalised = interests.length > 0;

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, busy]);

  const ask = (text: string) => assistantStore.send(text, lang, { generic: t('assistant.error'), rateLimited: t('assistant.rateLimit') });

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const term = q.trim();
    if (tab === 'ai') {
      if (!term) return;
      setQ('');
      void ask(term);
    } else if (tab === 'products') {
      navigate(term ? `/catalogue?q=${encodeURIComponent(term)}` : '/catalogue');
    } else {
      navigate('/groupages');
    }
  }

  const tabs: { id: Tab; label: string; ai?: boolean }[] = [
    { id: 'ai', label: t('home.ai.tabAi'), ai: true },
    { id: 'products', label: t('home.ai.tabProducts') },
    { id: 'groupages', label: t('home.ai.tabGroupages') }
  ];
  const placeholder = tab === 'ai' ? t('home.ai.placeholderAi') : tab === 'products' ? t('home.ai.placeholderProducts') : t('home.ai.placeholderGroupages');
  const showConversation = tab === 'ai' && messages.length > 0;

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
            <Link to="/suivi" className="inline-flex items-center gap-1.5 hover:text-brand-700">
              <Truck className="h-4 w-4 text-brand" /> {t('home.quickTrack')}
            </Link>
          </div>
        </div>
      )}

      <div className="relative overflow-hidden rounded-[30px] border border-brand-100 bg-gradient-to-b from-brand-50 via-white to-white px-4 pb-5 pt-7 sm:px-10 sm:pb-8 sm:pt-9">
        <div className="pointer-events-none absolute -left-16 -top-20 h-60 w-60 rounded-full bg-brand-400/20 blur-3xl" aria-hidden />
        <h2 id="home-search-title" className="sr-only">
          {t('home.ai.title')}
        </h2>

        <div role="tablist" aria-label={t('home.ai.title')} className="relative mb-5 flex flex-wrap items-end justify-center gap-x-7 gap-y-1 sm:gap-x-10">
          {tabs.map(x => (
            <button
              key={x.id}
              type="button"
              role="tab"
              aria-selected={tab === x.id}
              onClick={() => {
                setTab(x.id);
                inputRef.current?.focus();
              }}
              className={`relative pb-2 font-display text-[20px] font-bold transition-colors sm:text-[28px] ${tab === x.id ? 'text-brand' : 'text-ink hover:text-brand-700'}`}
            >
              {x.label}
              {x.ai && <Sparkles className="absolute -right-4 -top-1 h-4 w-4 text-brand sm:-right-5 sm:h-5 sm:w-5" aria-hidden />}
              {tab === x.id && <span className="absolute inset-x-0 -bottom-0.5 h-[3px] rounded-full bg-brand-gradient" aria-hidden />}
            </button>
          ))}
        </div>

        <form onSubmit={submit} role="search" className="relative mx-auto max-w-[860px] rounded-[26px] border-2 border-brand/70 bg-white p-3 shadow-[0_18px_44px_-24px_rgb(232_72_13/0.55)] sm:p-4">
          <label htmlFor="home-ai-input" className="sr-only">
            {placeholder}
          </label>
          <input
            id="home-ai-input"
            ref={inputRef}
            value={q}
            onChange={e => setQ(e.target.value)}
            placeholder={placeholder}
            maxLength={300}
            enterKeyHint={tab === 'ai' ? 'send' : 'search'}
            className="h-12 w-full bg-transparent px-2 text-[15.5px] placeholder:text-muted focus:outline-none sm:text-[16.5px]"
          />
          <div className="mt-1 flex items-center justify-between gap-3">
            <Link to="/sourcing#analyse" className="inline-flex items-center gap-2 rounded-full px-2.5 py-2 text-[13.5px] font-semibold hover:bg-paper">
              <Camera className="h-[18px] w-[18px]" /> {t('home.ai.image')}
            </Link>
            <button
              type="submit"
              disabled={busy && tab === 'ai'}
              className="inline-flex h-11 items-center gap-2 rounded-full bg-brand-gradient px-5 text-[14.5px] font-bold text-white shadow-[var(--shadow-glow)] transition-[filter] hover:brightness-105 disabled:opacity-60 sm:px-7"
            >
              {tab === 'ai' ? <Sparkles className="h-4 w-4" /> : <Search className="h-4 w-4" />}
              {tab === 'ai' ? t('home.ai.ask') : t('home.ai.search')}
            </button>
          </div>
        </form>

        {tab === 'ai' && !showConversation && (
          <div className="relative mx-auto mt-4 flex max-w-[860px] flex-wrap items-center justify-center gap-2">
            <span className="text-[12.5px] font-semibold text-muted">{t('home.ai.try')} :</span>
            {SUGGESTIONS.map(k => (
              <button key={k} type="button" onClick={() => void ask(t(k))} className="rounded-full border border-line bg-white px-3.5 py-1.5 text-[13px] font-medium hover:border-brand/40 hover:text-brand-700">
                {t(k)}
              </button>
            ))}
          </div>
        )}

        {showConversation && (
          <div className="relative mx-auto mt-5 max-w-[860px] rounded-[22px] border border-line bg-paper/70 p-3 sm:p-4">
            <div ref={listRef} className="max-h-[440px] space-y-3 overflow-y-auto pr-1" aria-live="polite">
              <AssistantMessages messages={messages} busy={busy} onNavigate={navigate} />
            </div>
            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-line pt-3 text-[12px] text-muted">
              <span>{t('home.ai.note')}</span>
              <button type="button" onClick={() => assistantStore.reset()} className="font-semibold text-ink hover:text-brand-700">
                {t('home.ai.reset')}
              </button>
            </div>
          </div>
        )}
      </div>

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
