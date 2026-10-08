import React, { useEffect, useMemo, useState } from 'react';
import { ArrowRight, Search, SlidersHorizontal, X } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useDebounced } from '../../lib/hooks';
import { listProducts, type ProductSort } from '../../services/catalog';
import type { Product } from '../../lib/types';
import { ProductCard, ProductCardSkeleton } from '../../components/commerce/ProductCard';
import { Button } from '../../components/ui/Button';
import { Select, Checkbox, Input } from '../../components/ui/Field';
import { Modal } from '../../components/ui/Modal';
import { EmptyState, ErrorState } from '../../components/ui/States';
import { friendlyError } from '../../lib/db';
import { formatNumber } from '../../lib/format';

const PAGE_SIZE = 24;

const SORTS: { value: ProductSort; label: string }[] = [
  { value: 'featured', label: 'Sélection DALUCHE' },
  { value: 'newest', label: 'Nouveautés' },
  { value: 'price_asc', label: 'Prix croissant' },
  { value: 'price_desc', label: 'Prix décroissant' }
];

export default function CatalogPage() {
  const { query, navigate, categories, path } = useApp();

  const [search, setSearch] = useState(query.get('q') || '');
  const debounced = useDebounced(search, 350);
  const categorySlug = query.get('categorie') || '';
  const sort = (query.get('tri') as ProductSort) || 'featured';
  const minPrice = Number(query.get('min') || 0) || null;
  const maxPrice = Number(query.get('max') || 0) || null;
  const inStock = query.get('dispo') === '1';
  const transport = (query.get('transport') as 'air' | 'sea' | null) || null;

  const [items, setItems] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const category = categories.find(c => c.slug === categorySlug) || null;

  function setParam(updates: Record<string, string | null>) {
    const p = new URLSearchParams(query);
    Object.entries(updates).forEach(([k, v]) => (v ? p.set(k, v) : p.delete(k)));
    const qs = p.toString();
    navigate(`${path}${qs ? `?${qs}` : ''}`, { replace: true, keepScroll: true });
  }

  // Synchronise la recherche saisie avec l'URL
  useEffect(() => {
    if ((query.get('q') || '') !== debounced) setParam({ q: debounced.trim() || null });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debounced]);

  useEffect(() => {
    setSearch(query.get('q') || '');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query.get('q')]);

  const filterKey = useMemo(
    () => JSON.stringify([query.get('q'), category?.id, sort, minPrice, maxPrice, inStock, transport]),
    [query, category?.id, sort, minPrice, maxPrice, inStock, transport]
  );

  useEffect(() => {
    let active = true;
    if (categorySlug && !category && categories.length === 0) return; // attend les catégories
    setLoading(true);
    setError(null);
    setPage(1);
    listProducts({
      search: query.get('q') || undefined,
      categoryId: category?.id || null,
      sort,
      minPrice,
      maxPrice,
      inStockOnly: inStock,
      transportMode: transport,
      page: 1,
      pageSize: PAGE_SIZE
    })
      .then(res => {
        if (!active) return;
        setItems(res.items);
        setTotal(res.total);
      })
      .catch(err => active && setError(friendlyError(err)))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterKey, categories.length]);

  async function loadMore() {
    setLoadingMore(true);
    try {
      const next = page + 1;
      const res = await listProducts({
        search: query.get('q') || undefined,
        categoryId: category?.id || null,
        sort,
        minPrice,
        maxPrice,
        inStockOnly: inStock,
        transportMode: transport,
        page: next,
        pageSize: PAGE_SIZE
      });
      setItems(prev => [...prev, ...res.items]);
      setPage(next);
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setLoadingMore(false);
    }
  }

  const activeFilters = [
    category && { key: 'categorie', label: category.name },
    minPrice && { key: 'min', label: `Dès ${formatNumber(minPrice)} F` },
    maxPrice && { key: 'max', label: `Jusqu’à ${formatNumber(maxPrice)} F` },
    inStock && { key: 'dispo', label: 'Disponible' },
    transport && { key: 'transport', label: transport === 'sea' ? 'Maritime' : 'Aérien' }
  ].filter(Boolean) as { key: string; label: string }[];

  const filters = (
    <FilterPanel
      sort={sort}
      minPrice={minPrice}
      maxPrice={maxPrice}
      inStock={inStock}
      transport={transport}
      onChange={setParam}
    />
  );

  return (
    <div className="container-page py-8 sm:py-10">
      <div className="flex flex-col gap-2">
        <p className="eyebrow">Catalogue</p>
        <h1 className="text-[28px] font-bold sm:text-4xl">{category ? category.name : 'Tous les produits'}</h1>
        <p className="text-[15px] text-muted">{category?.description || 'Produits sélectionnés en Chine, prix en FCFA, livrés à Dakar.'}</p>
      </div>

      {/* Recherche + filtres mobiles */}
      <div className="sticky top-16 z-30 -mx-4 mt-6 border-b border-line bg-paper/95 px-4 pb-3 pt-2 backdrop-blur lg:static lg:mx-0 lg:border-0 lg:bg-transparent lg:p-0">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Rechercher un produit…"
              className="h-11 w-full rounded-xl border border-line-2 bg-white pl-10 pr-9 focus:border-brand/60 focus:outline-none focus:ring-4 focus:ring-brand/10"
              enterKeyHint="search"
              aria-label="Rechercher un produit"
            />
            {search && (
              <button type="button" onClick={() => setSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-muted hover:text-ink" aria-label="Effacer">
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <Button variant="secondary" className="lg:hidden" icon={<SlidersHorizontal className="h-4 w-4" />} onClick={() => setFiltersOpen(true)}>
            Filtres{activeFilters.length ? ` (${activeFilters.length})` : ''}
          </Button>
        </div>

        {/* Catégories */}
        <div className="scrollbar-none -mx-4 mt-3 flex gap-2 overflow-x-auto px-4 lg:mx-0 lg:flex-wrap lg:px-0">
          <CategoryChip active={!categorySlug} onClick={() => setParam({ categorie: null })}>
            Tout
          </CategoryChip>
          {categories.map(c => (
            <CategoryChip key={c.id} active={c.slug === categorySlug} onClick={() => setParam({ categorie: c.slug })}>
              {c.name}
            </CategoryChip>
          ))}
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-8 lg:grid-cols-[240px_1fr]">
        <aside className="hidden lg:block">
          <div className="sticky top-24">{filters}</div>
        </aside>

        <div>
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <p className="text-[13px] font-medium text-muted" aria-live="polite">
              {loading ? 'Recherche…' : `${formatNumber(total)} produit${total > 1 ? 's' : ''}`}
            </p>
            {activeFilters.map(f => (
              <button
                key={f.key}
                type="button"
                onClick={() => setParam({ [f.key]: null })}
                className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1 text-[12px] font-semibold text-ink ring-1 ring-line hover:ring-ink/30"
              >
                {f.label} <X className="h-3 w-3" />
              </button>
            ))}
          </div>

          {error ? (
            <ErrorState message={error} onRetry={() => setParam({})} />
          ) : loading ? (
            <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <ProductCardSkeleton key={i} />
              ))}
            </div>
          ) : items.length === 0 ? (
            <div className="rounded-[var(--radius-card)] border border-line bg-white">
              <EmptyState
                icon={<Search className="h-5 w-5" />}
                title="Aucun produit ne correspond à votre recherche"
                description="Essayez d’autres mots-clés ou retirez des filtres. Vous cherchez un article précis ? Notre équipe peut le trouver pour vous."
                action={
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <Button variant="secondary" onClick={() => navigate('/catalogue', { replace: true })}>
                      Réinitialiser
                    </Button>
                    <Button to={`/sourcing${search ? `?produit=${encodeURIComponent(search)}` : ''}`} iconRight={<ArrowRight className="h-4 w-4" />}>
                      Demander un sourcing
                    </Button>
                  </div>
                }
              />
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3">
                {items.map(p => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>
              {items.length < total && (
                <div className="mt-8 flex justify-center">
                  <Button variant="secondary" loading={loadingMore} onClick={loadMore}>
                    Afficher plus de produits ({formatNumber(total - items.length)})
                  </Button>
                </div>
              )}
              <div className="mt-10 flex flex-col items-start gap-4 rounded-[var(--radius-card)] border border-line bg-white p-5 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-semibold">Vous ne trouvez pas ce que vous cherchez ?</p>
                  <p className="text-sm text-muted">Envoyez une photo ou un lien : nous trouvons le fournisseur et vous proposons un devis.</p>
                </div>
                <Button to="/sourcing" variant="dark" iconRight={<ArrowRight className="h-4 w-4" />}>
                  Sourcing sur mesure
                </Button>
              </div>
            </>
          )}
        </div>
      </div>

      <Modal
        open={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        title="Filtres"
        footer={
          <>
            <Button variant="secondary" onClick={() => setParam({ tri: null, min: null, max: null, dispo: null, transport: null })}>
              Effacer
            </Button>
            <Button onClick={() => setFiltersOpen(false)}>Voir {formatNumber(total)} produit{total > 1 ? 's' : ''}</Button>
          </>
        }
      >
        {filters}
      </Modal>
    </div>
  );
}

function CategoryChip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`h-9 shrink-0 rounded-full px-4 text-[13px] font-semibold transition-colors ${active ? 'bg-ink text-white' : 'bg-white text-muted ring-1 ring-line hover:text-ink'}`}
    >
      {children}
    </button>
  );
}

function FilterPanel({
  sort,
  minPrice,
  maxPrice,
  inStock,
  transport,
  onChange
}: {
  sort: ProductSort;
  minPrice: number | null;
  maxPrice: number | null;
  inStock: boolean;
  transport: 'air' | 'sea' | null;
  onChange: (u: Record<string, string | null>) => void;
}) {
  const [min, setMin] = useState(minPrice ? String(minPrice) : '');
  const [max, setMax] = useState(maxPrice ? String(maxPrice) : '');
  useEffect(() => setMin(minPrice ? String(minPrice) : ''), [minPrice]);
  useEffect(() => setMax(maxPrice ? String(maxPrice) : ''), [maxPrice]);

  return (
    <div className="space-y-6">
      <Select label="Trier par" value={sort} onChange={e => onChange({ tri: e.target.value === 'featured' ? null : e.target.value })} options={SORTS} />
      <div>
        <p className="mb-2 text-[13px] font-semibold">Prix (FCFA)</p>
        <form
          className="flex items-center gap-2"
          onSubmit={e => {
            e.preventDefault();
            onChange({ min: min || null, max: max || null });
          }}
        >
          <Input inputMode="numeric" placeholder="Min" value={min} onChange={e => setMin(e.target.value.replace(/\D/g, ''))} onBlur={() => onChange({ min: min || null })} aria-label="Prix minimum" />
          <span className="text-muted">–</span>
          <Input inputMode="numeric" placeholder="Max" value={max} onChange={e => setMax(e.target.value.replace(/\D/g, ''))} onBlur={() => onChange({ max: max || null })} aria-label="Prix maximum" />
        </form>
      </div>
      <Checkbox label="Disponible immédiatement" description="Produits en stock chez DALUCHE" checked={inStock} onChange={v => onChange({ dispo: v ? '1' : null })} />
      <div>
        <p className="mb-2 text-[13px] font-semibold">Transport</p>
        <div className="grid grid-cols-3 gap-1.5">
          {[
            { v: null, l: 'Tous' },
            { v: 'air', l: 'Aérien' },
            { v: 'sea', l: 'Maritime' }
          ].map(o => (
            <button
              key={o.l}
              type="button"
              onClick={() => onChange({ transport: o.v })}
              className={`h-9 rounded-xl text-[12.5px] font-semibold ${transport === o.v ? 'bg-ink text-white' : 'bg-white text-muted ring-1 ring-line'}`}
            >
              {o.l}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
