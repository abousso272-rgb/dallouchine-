import React, { useMemo, useState } from 'react';
import { Package, Search } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useAsync, usePolling, useDebounced } from '../../lib/hooks';
import { listOrders } from '../../services/orders';
import { formatDate, formatXOF } from '../../lib/format';
import { ORDER_STATUS, PAYMENT_STATUS, ORDER_STATUS_FLOW } from '../../lib/status';
import { PageHeader } from '../../components/ui/Layout';
import { Tabs } from '../../components/ui/Tabs';
import { Select } from '../../components/ui/Field';
import { StatusBadge } from '../../components/ui/Badge';
import { DataTable } from '../../components/ui/DataTable';
import { EmptyState, ErrorState, Skeleton } from '../../components/ui/States';
import type { Order } from '../../lib/types';

const KIND: Record<string, string> = { catalog: 'Catalogue', groupage: 'Groupage', quote: 'Devis' };
type View = 'a-traiter' | 'transit' | 'toutes';

export default function StaffOrdersPage() {
  const { query, navigate, path, user } = useApp();
  const view = (query.get('vue') as View) || (query.get('paiement') ? 'toutes' : 'a-traiter');
  const payment = query.get('paiement') || '';
  const status = query.get('statut') || '';
  const kind = query.get('type') || '';
  const [search, setSearch] = useState(query.get('q') || '');
  const q = useDebounced(search, 350);

  const { data, loading, error, reload } = useAsync(() => listOrders({ payment: payment || undefined, status: status || undefined, kind: kind || undefined, search: q, limit: 300 }), [payment, status, kind, q]);
  usePolling(reload, 60000);

  const rows = useMemo(() => {
    const all = data || [];
    if (view === 'a-traiter') return all.filter(o => o.paymentStatus === 'paid' && ['paid', 'supplier_ordered', 'preparing'].includes(o.orderStatus));
    if (view === 'transit') return all.filter(o => ['shipped', 'in_transit', 'arrived', 'ready_for_delivery'].includes(o.orderStatus));
    return all;
  }, [data, view]);

  function setParam(updates: Record<string, string | null>) {
    const p = new URLSearchParams(query);
    Object.entries(updates).forEach(([k, v]) => (v ? p.set(k, v) : p.delete(k)));
    navigate(`${path}${p.toString() ? `?${p}` : ''}`, { replace: true, keepScroll: true });
  }

  return (
    <div>
      <PageHeader
        title="Commandes"
        description={user?.role === 'groupage_manager' ? 'Commandes liées aux groupages dont vous avez la charge.' : 'Suivi des commandes, paiements et acheminement.'}
      />
      <div className="flex flex-col gap-3">
        <Tabs
          value={view}
          onChange={v => setParam({ vue: v, paiement: null })}
          items={[
            { value: 'a-traiter', label: 'À traiter' },
            { value: 'transit', label: 'En acheminement' },
            { value: 'toutes', label: 'Toutes' }
          ]}
        />
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-[1fr_180px_180px_160px]">
          <div className="relative col-span-2 sm:col-span-1">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Code, client, téléphone…"
              className="h-11 w-full rounded-xl border border-line-2 bg-white pl-10 pr-3 focus:border-brand/60 focus:outline-none focus:ring-4 focus:ring-brand/10"
              aria-label="Rechercher une commande"
            />
          </div>
          <Select value={status} onChange={e => setParam({ statut: e.target.value || null, vue: 'toutes' })} placeholder="Tous statuts" options={[...ORDER_STATUS_FLOW, 'cancelled'].map(s => ({ value: s, label: ORDER_STATUS[s].label }))} aria-label="Statut" />
          <Select value={payment} onChange={e => setParam({ paiement: e.target.value || null, vue: 'toutes' })} placeholder="Tous paiements" options={Object.entries(PAYMENT_STATUS).map(([value, m]) => ({ value, label: m.label }))} aria-label="Paiement" />
          <Select value={kind} onChange={e => setParam({ type: e.target.value || null })} placeholder="Tous types" options={Object.entries(KIND).map(([value, label]) => ({ value, label }))} aria-label="Type" />
        </div>
      </div>

      <div className="mt-5">
        {error ? (
          <ErrorState message={error} onRetry={reload} />
        ) : loading ? (
          <Skeleton className="h-72" />
        ) : rows.length === 0 ? (
          <div className="card">
            <EmptyState icon={<Package className="h-5 w-5" />} title="Aucune commande" description="Aucune commande ne correspond à cette vue ou à ces filtres." />
          </div>
        ) : (
          <>
            <p className="mb-2 text-[13px] text-muted">{rows.length} commande(s)</p>
            <DataTable<Order>
              rows={rows}
              rowKey={o => o.id}
              rowHref={o => `/espace-pro/commandes/${o.id}`}
              columns={[
                { key: 'code', header: 'Commande', cell: o => <span className="num font-semibold">{o.trackingCode}</span> },
                {
                  key: 'client',
                  header: 'Client',
                  cell: o => (
                    <div>
                      <p className="font-medium">{o.customerName}</p>
                      <p className="text-[12px] text-muted">{o.customerPhone}</p>
                    </div>
                  )
                },
                { key: 'type', header: 'Type', cell: o => <span className="text-muted">{KIND[o.kind] || o.kind}</span> },
                { key: 'date', header: 'Date', cell: o => <span className="text-muted">{formatDate(o.createdAt)}</span> },
                { key: 'total', header: 'Total', align: 'right', cell: o => <span className="num font-semibold">{formatXOF(o.totalXOF)}</span> },
                { key: 'pay', header: 'Paiement', cell: o => <StatusBadge map={PAYMENT_STATUS} status={o.paymentStatus} /> },
                { key: 'status', header: 'Statut', cell: o => <StatusBadge map={ORDER_STATUS} status={o.orderStatus} /> }
              ]}
              mobile={o => (
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="num text-sm font-semibold">{o.trackingCode}</p>
                    <p className="truncate text-[12.5px] text-muted">
                      {o.customerName} · {KIND[o.kind]} · {formatDate(o.createdAt)}
                    </p>
                    <p className="num mt-1 text-sm font-semibold">{formatXOF(o.totalXOF)}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1.5">
                    <StatusBadge map={ORDER_STATUS} status={o.orderStatus} />
                    <StatusBadge map={PAYMENT_STATUS} status={o.paymentStatus} />
                  </div>
                </div>
              )}
            />
          </>
        )}
      </div>
    </div>
  );
}
