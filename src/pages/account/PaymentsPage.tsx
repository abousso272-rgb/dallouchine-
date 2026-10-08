import React from 'react';
import { CreditCard } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useAsync } from '../../lib/hooks';
import { listMyPayments } from '../../services/orders';
import { formatDateTime, formatXOF } from '../../lib/format';
import { PAYMENT_STATUS } from '../../lib/status';
import { PageHeader, Stat } from '../../components/ui/Layout';
import { StatusBadge } from '../../components/ui/Badge';
import { Link } from '../../components/ui/Link';
import { EmptyState, ErrorState, Skeleton } from '../../components/ui/States';

const METHOD: Record<string, string> = { wave: 'Wave', orange_money: 'Orange Money', mtn_money: 'MTN MoMo', card: 'Carte', geniuspay: 'Paiement en ligne', saspay: 'Paiement en ligne' };

export default function PaymentsPage() {
  const { user } = useApp();
  const { data, loading, error, reload } = useAsync(() => listMyPayments(user!.id), [user?.id]);
  const paid = (data || []).filter(p => p.status === 'paid');

  return (
    <div>
      <PageHeader title="Mes paiements" description="Historique de vos transactions." />
      <div className="mb-5 grid grid-cols-2 gap-3">
        <Stat label="Total payé" value={formatXOF(paid.reduce((s, p) => s + p.amountXOF, 0))} />
        <Stat label="Transactions réussies" value={paid.length} />
      </div>
      {error ? (
        <ErrorState message={error} onRetry={reload} />
      ) : loading ? (
        <Skeleton className="h-48" />
      ) : !data?.length ? (
        <div className="card">
          <EmptyState icon={<CreditCard className="h-5 w-5" />} title="Aucun paiement" description="Vos paiements apparaîtront ici après votre première commande." />
        </div>
      ) : (
        <div className="card overflow-hidden p-0">
          <ul className="divide-y divide-line">
            {data.map(p => (
              <li key={p.id}>
                <Link to={`/compte/commandes/${p.orderId}`} className="flex items-center gap-4 px-4 py-3.5 hover:bg-paper/60 sm:px-5">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-paper-2">
                    <CreditCard className="h-4 w-4 text-muted" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="num text-sm font-semibold">{p.orderCode || 'Commande'}</p>
                    <p className="text-[12.5px] text-muted">
                      {formatDateTime(p.paidAt || p.createdAt)} · {METHOD[p.method] || p.method || 'Paiement en ligne'}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <p className="num text-sm font-semibold">{formatXOF(p.amountXOF)}</p>
                    <StatusBadge map={PAYMENT_STATUS} status={p.status} />
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
