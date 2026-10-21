import React, { useEffect, useMemo, useState } from 'react';
import { ArrowRight, Car, ChevronRight, Compass, PackageSearch, Search, Users, Briefcase } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { usePrefs } from '../../context/PrefsContext';
import { useAsync } from '../../lib/hooks';
import { listProducts } from '../../services/catalog';
import { Link } from '../ui/Link';
import { Price } from '../ui/Price';

/** Méga-menu du catalogue : catégories à gauche, produits de la catégorie au centre, raccourcis services à droite. */
export function MegaMenu({ onClose }: { onClose: () => void }) {
  const { categories } = useApp();
  const { t } = usePrefs();
  const roots = useMemo(() => categories.filter(c => c.isActive && !c.parentId).sort((a, b) => a.sortOrder - b.sortOrder), [categories]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const products = useAsync(() => listProducts({ pageSize: 60 }), [], { cacheKey: 'mega:products', maxAge: 120000 });

  useEffect(() => {
    if (!activeId && roots.length) setActiveId(roots[0].id);
  }, [roots, activeId]);

  const active = roots.find(c => c.id === activeId) || roots[0];
  const items = (products.data?.items || []).filter(p => p.categoryId === active?.id).slice(0, 6);

  const shortcuts = [
    { to: '/groupages', icon: Users, label: t('mega.groupages'), hint: t('mega.groupagesHint') },
    { to: '/sourcing', icon: Search, label: t('mega.sourcing'), hint: t('mega.sourcingHint') },
    { to: '/automobile', icon: Car, label: t('mega.auto'), hint: t('mega.autoHint') },
    { to: '/pro', icon: Briefcase, label: t('mega.b2b'), hint: t('mega.b2bHint') },
    { to: '/guide', icon: Compass, label: t('mega.guide'), hint: t('mega.guideHint') },
    { to: '/suivi', icon: PackageSearch, label: t('mega.tracking'), hint: t('mega.trackingHint') }
  ];

  return (
    <div
      role="region"
      aria-label={t('mega.allCategories')}
      className="animate-fade-in-up absolute inset-x-0 top-[calc(100%+8px)] mx-auto hidden max-w-7xl overflow-hidden rounded-3xl border border-line bg-white shadow-[var(--shadow-lift)] lg:block"
    >
      <div className="grid grid-cols-[270px_1fr_280px]">
        <ul className="max-h-[480px] overflow-y-auto border-r border-line bg-paper/60 p-2" role="listbox" aria-label={t('mega.allCategories')}>
          {roots.map(c => {
            const on = c.id === active?.id;
            return (
              <li key={c.id}>
                <Link
                  to={`/catalogue?categorie=${c.slug}`}
                  role="option"
                  aria-selected={on}
                  onMouseEnter={() => setActiveId(c.id)}
                  onFocus={() => setActiveId(c.id)}
                  onClick={onClose}
                  className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13.5px] font-semibold transition-colors ${on ? 'bg-white text-brand-700 shadow-sm ring-1 ring-line' : 'text-ink/80 hover:bg-white'}`}
                >
                  <span className="h-8 w-8 shrink-0 overflow-hidden rounded-lg bg-paper-2">{c.imageUrl && <img src={c.imageUrl} alt="" loading="lazy" className="h-full w-full object-cover" />}</span>
                  <span className="min-w-0 flex-1 text-[13px] leading-tight">{c.name}</span>
                  <ChevronRight className={`h-4 w-4 shrink-0 ${on ? 'text-brand' : 'text-subtle'}`} />
                </Link>
              </li>
            );
          })}
          <li className="mt-1 border-t border-line pt-1">
            <Link to="/catalogue" onClick={onClose} className="flex items-center justify-between rounded-xl px-3 py-2.5 text-[13px] font-bold text-brand-700 hover:bg-white">
              {t('mega.allCategories')} <ArrowRight className="h-4 w-4" />
            </Link>
          </li>
        </ul>

        <div className="min-h-[360px] p-5">
          {active && (
            <>
              <div className="mb-4 flex items-baseline justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-[17px] font-bold">{active.name}</p>
                  {active.description && <p className="mt-0.5 line-clamp-1 text-[13px] text-muted">{active.description}</p>}
                </div>
                <Link to={`/catalogue?categorie=${active.slug}`} onClick={onClose} className="shrink-0 text-[13px] font-semibold text-brand-700 hover:underline">
                  {t('mega.seeAll')}
                </Link>
              </div>
              {products.loading && !products.data ? (
                <div className="grid grid-cols-3 gap-3">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="h-44 animate-pulse rounded-2xl bg-paper-2" />
                  ))}
                </div>
              ) : items.length === 0 ? (
                <p className="rounded-2xl bg-paper p-6 text-center text-sm text-muted">{t('mega.empty')}</p>
              ) : (
                <>
                  <p className="mb-2 text-[11.5px] font-bold uppercase tracking-wide text-subtle">{t('mega.popular')}</p>
                  <ul className="grid grid-cols-3 gap-3">
                    {items.map(p => (
                      <li key={p.id}>
                        <Link to={`/produit/${p.slug}`} onClick={onClose} className="lift block overflow-hidden rounded-2xl border border-line bg-white">
                          <span className="block aspect-[4/3] overflow-hidden bg-paper-2">
                            <img src={p.images[0]} alt="" loading="lazy" decoding="async" className="h-full w-full object-cover" />
                          </span>
                          <span className="block p-2.5">
                            <span className="line-clamp-2 min-h-[2.4em] text-[12.5px] font-semibold leading-snug">{p.name}</span>
                            <span className="mt-1 block">
                              <Price value={p.priceXOF} size="sm" />
                            </span>
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </>
          )}
        </div>

        <div className="border-l border-line bg-paper/60 p-3">
          <p className="px-2 pb-1.5 pt-1 text-[11.5px] font-bold uppercase tracking-wide text-subtle">{t('mega.more')}</p>
          <ul>
            {shortcuts.map(s => (
              <li key={s.to}>
                <Link to={s.to} onClick={onClose} className="flex items-start gap-3 rounded-xl px-2.5 py-2.5 hover:bg-white">
                  <span className="icon-bubble mt-0.5 h-8 w-8 shrink-0">
                    <s.icon className="h-4 w-4" />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-[13.5px] font-semibold">{s.label}</span>
                    <span className="block text-[12px] text-muted">{s.hint}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
