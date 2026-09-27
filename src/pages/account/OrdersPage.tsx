import React, { useState } from 'react';
import { ArrowRight, Package } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useAsync } from '../../lib/hooks';
import { listMyOrders } from '../../services/orders';
import { formatDate, formatXOF } from '../../lib/format';
import { ORDER_STATUS } from '../../lib/status';
import { PageHeader } from '../../components/ui/Layout';
import { Tabs } from '../../components/ui/Tabs';
import { StatusBadge } from '../../components/ui/Badge';
import { Link } from '../../components/ui/Link';
import { Button } from '../../components/ui/Button';
import { EmptyState, ErrorState, Skeleton } from '../../components/ui/States';

const KIND_LABEL: Record<string, string> = { catalog: 'Catalogue', groupage: 'Groupage', quote: 'Devis' };

export default function OrdersPage() {
  const { user } = useApp();
  const { data, loading, error, reload } = useAsync(() => listMyOrders(user!.id), [user?.id]);
  const [tab, setTab] = useState<'active' | 'done' | 'all'>('active');
  const list = (data || []).filter(o =>
    tab === 'all' ? true : tab === 'active' ? !['delivered', 'cancelled'].includes(o.orderStatus) : ['delivered', 'cancelled'].includes(o.orderStatus)
  );

  return (
    <div>
      <PageHeader title="Mes commandes" description="Achats catalogue, participations aux groupages et règlements de devis." />
      <Tabs
        value={tab}
        onChange={setTab}
        items={[
          { value: 'active', label: 'En cours', count: (data || []).filter(o => !['delivered', 'cancelled'].includes(o.orderStatus)).length },
          { value: 'done', label: 'Terminées' },
          { value: 'all', label: 'Toutes' }
        ]}
      />
      <div className="mt-5">
        {error ? (
          <ErrorState message={error} onRetry={reload} />
        ) : loading ? (
          <div className="space-y-3">
            {[0, 1, 2].map(i => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
        ) : list.length === 0 ? (
          <div className="card">
            <EmptyState icon={<Package className="h-5 w-5" />} title="Aucune commande ici" description="Vos commandes apparaîtront ici dès leur création." action={<Button to="/catalogue">Voir le catalogue</Button>} />
          </div>
        ) : (
          <ul className="space-y-3">
            {list.map(o => (
              <li key={o.id}>
                <Link to={`/compte/commandes/${o.id}`} className="card flex items-center gap-4 p-4 transition-shadow hover:shadow-[var(--shadow-soft)] sm:p-5">
                  <div className="flex -space-x-3">
                    {o.items.slice(0, 3).map(i => (
                      <span key={i.id} className="h-12 w-12 overflow-hidden rounded-xl border-2 border-white bg-paper-2">
                        {i.image ? <img src={i.image} alt="" className="h-full w-full object-cover" /> : <Package className="m-3 h-6 w-6 text-subtle" />}
                      </span>
                    ))}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="num text-sm font-semibold">{o.trackingCode}</p>
                      <span className="rounded-md bg-paper-2 px-1.5 py-0.5 text-[11px] font-semibold text-muted">{KIND_LABEL[o.kind] || 'Commande'}</span>
                    </div>
                    <p className="mt-0.5 truncate text-[13px] text-muted">
                      {formatDate(o.createdAt)} · {o.items.length} article{o.items.length > 1 ? 's' : ''} · <span className="num font-semibold text-ink">{formatXOF(o.totalXOF)}</span>
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-2 sm:flex-row sm:items-center">
                    <StatusBadge map={ORDER_STATUS} status={o.orderStatus} />
                    <ArrowRight className="hidden h-4 w-4 text-subtle sm:block" />
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
