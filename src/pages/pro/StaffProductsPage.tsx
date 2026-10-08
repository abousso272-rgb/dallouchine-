import React, { useState } from 'react';
import { Boxes, Eye, EyeOff, Plus, Search } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useAsync, useDebounced } from '../../lib/hooks';
import { listProducts, listProductCosts, setProductPublished } from '../../services/catalog';
import { friendlyError } from '../../lib/db';
import { formatXOF, percent } from '../../lib/format';
import { PageHeader } from '../../components/ui/Layout';
import { Tabs } from '../../components/ui/Tabs';
import { Select } from '../../components/ui/Field';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { DataTable } from '../../components/ui/DataTable';
import { EmptyState, ErrorState, Skeleton } from '../../components/ui/States';
import type { Product } from '../../lib/types';

export default function StaffProductsPage() {
  const { user, categories, toast, query } = useApp();
  const isAdmin = user?.role === 'admin';
  const canPublish = isAdmin || user?.permissions.includes('publish_products');
  const [tab, setTab] = useState<'tous' | 'publies' | 'brouillons'>(query.get('statut') === 'brouillon' ? 'brouillons' : 'tous');
  const [categoryId, setCategoryId] = useState('');
  const [search, setSearch] = useState('');
  const q = useDebounced(search, 350);
  const { data, loading, error, reload, setData } = useAsync(() => listProducts({ includeInactive: true, search: q, categoryId: categoryId || null, pageSize: 100, sort: 'newest' }), [q, categoryId]);
  const costs = useAsync(() => listProductCosts(), []);

  const rows = (data?.items || []).filter(p => (tab === 'publies' ? p.isActive : tab === 'brouillons' ? !p.isActive : true));

  async function togglePublish(p: Product) {
    try {
      await setProductPublished(p.id, !p.isActive);
      setData(d => (d ? { ...d, items: d.items.map(x => (x.id === p.id ? { ...x, isActive: !p.isActive } : x)) } : d));
      toast('success', p.isActive ? 'Produit dépublié' : 'Produit publié');
    } catch (err) {
      toast('error', 'Action impossible', friendlyError(err));
    }
  }

  function marginCell(p: Product) {
    const c = costs.data?.[p.id];
    if (!c || !c.purchasePriceXOF) return <span className="text-subtle">—</span>;
    const m = p.priceXOF - c.purchasePriceXOF - c.logisticsCostXOF;
    return (
      <span className={`num font-semibold ${m < 0 ? 'text-red-700' : 'text-jade'}`}>
        {formatXOF(m)} <span className="font-normal text-muted">({percent(Math.max(m, 0), p.priceXOF)} %)</span>
      </span>
    );
  }

  return (
    <div>
      <PageHeader
        title="Produits"
        description={canPublish ? 'Catalogue, prix, coûts d’achat et publication.' : 'Ajoutez et complétez les produits : l’administration les publie.'}
        actions={
          <Button to="/espace-pro/produits/nouveau" icon={<Plus className="h-4 w-4" />}>
            Ajouter un produit
          </Button>
        }
      />
      <Tabs
        value={tab}
        onChange={setTab}
        items={[
          { value: 'tous', label: 'Tous', count: data?.items.length },
          { value: 'publies', label: 'Publiés', count: data?.items.filter(p => p.isActive).length },
          { value: 'brouillons', label: 'Brouillons', count: data?.items.filter(p => !p.isActive).length }
        ]}
      />
      <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-[1fr_240px]">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Nom, référence…" className="h-11 w-full rounded-xl border border-line-2 bg-white pl-10 pr-3 focus:border-brand/60 focus:outline-none focus:ring-4 focus:ring-brand/10" aria-label="Rechercher un produit" />
        </div>
        <Select value={categoryId} onChange={e => setCategoryId(e.target.value)} placeholder="Toutes catégories" options={categories.map(c => ({ value: c.id, label: c.name }))} aria-label="Catégorie" />
      </div>
      <div className="mt-5">
        {error ? (
          <ErrorState message={error} onRetry={reload} />
        ) : loading ? (
          <Skeleton className="h-72" />
        ) : !rows.length ? (
          <div className="card">
            <EmptyState icon={<Boxes className="h-5 w-5" />} title="Aucun produit" action={<Button to="/espace-pro/produits/nouveau">Ajouter un produit</Button>} />
          </div>
        ) : (
          <DataTable<Product>
            rows={rows}
            rowKey={p => p.id}
            rowHref={p => `/espace-pro/produits/${p.id}`}
            columns={[
              {
                key: 'p',
                header: 'Produit',
                cell: p => (
                  <div className="flex items-center gap-3">
                    <img src={p.images[0]} alt="" className="h-10 w-10 rounded-lg object-cover" />
                    <div className="min-w-0">
                      <p className="max-w-[300px] truncate font-semibold">{p.name}</p>
                      <p className="text-[12px] text-muted">{p.categoryName}</p>
                    </div>
                  </div>
                )
              },
              { key: 'price', header: 'Prix public', align: 'right', cell: p => <span className="num font-semibold">{formatXOF(p.priceXOF)}</span> },
              { key: 'margin', header: 'Marge unitaire', align: 'right', cell: marginCell },
              { key: 'stock', header: 'Stock dispo', align: 'right', cell: p => <span className="num">{p.availableQuantity}</span> },
              { key: 'status', header: 'Statut', cell: p => (p.isActive ? <Badge tone="success" dot>Publié</Badge> : <Badge dot>Brouillon</Badge>) },
              {
                key: 'act',
                header: '',
                align: 'right',
                cell: p =>
                  canPublish ? (
                    <button type="button" onClick={() => togglePublish(p)} className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-[12.5px] font-semibold text-muted hover:bg-paper hover:text-ink">
                      {p.isActive ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                      {p.isActive ? 'Dépublier' : 'Publier'}
                    </button>
                  ) : null
              }
            ]}
            mobile={p => (
              <div className="flex items-center gap-3">
                <img src={p.images[0]} alt="" className="h-12 w-12 rounded-lg object-cover" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{p.name}</p>
                  <p className="num text-[12.5px] text-muted">
                    {formatXOF(p.priceXOF)} · stock {p.availableQuantity}
                  </p>
                </div>
                {p.isActive ? <Badge tone="success">Publié</Badge> : <Badge>Brouillon</Badge>}
              </div>
            )}
          />
        )}
      </div>
    </div>
  );
}
