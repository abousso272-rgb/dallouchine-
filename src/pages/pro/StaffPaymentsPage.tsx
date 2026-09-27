import React, { useState } from 'react';
import { CreditCard } from 'lucide-react';
import { useAsync } from '../../lib/hooks';
import { listAllPayments, type AdminPaymentRow } from '../../services/admin';
import { formatDateTime, formatXOF } from '../../lib/format';
import { PAYMENT_STATUS } from '../../lib/status';
import { PageHeader, Stat } from '../../components/ui/Layout';
import { Tabs } from '../../components/ui/Tabs';
import { StatusBadge } from '../../components/ui/Badge';
import { DataTable } from '../../components/ui/DataTable';
import { EmptyState, ErrorState, Skeleton } from '../../components/ui/States';

export default function StaffPaymentsPage() {
  const { data, loading, error, reload } = useAsync(() => listAllPayments(), []);
  const [tab, setTab] = useState<'all' | 'paid' | 'pending' | 'failed'>('all');
  const rows = (data || []).filter(p => (tab === 'all' ? true : tab === 'failed' ? ['failed', 'cancelled', 'expired'].includes(p.status) : p.status === tab));
  const paid = (data || []).filter(p => p.status === 'paid');

  return (
    <div>
      <PageHeader title="Paiements" description="Transactions GeniusPay confirmées par webhook signé ou vérification directe." />
      <div className="mb-5 grid grid-cols-2 gap-3 md:grid-cols-3">
        <Stat tone="dark" label="Total encaissé" value={formatXOF(paid.reduce((s, p) => s + p.amount, 0))} />
        <Stat label="Paiements réussis" value={paid.length} />
        <Stat label="En attente" value={(data || []).filter(p => p.status === 'pending').length} />
      </div>
      <Tabs
        value={tab}
        onChange={setTab}
        items={[
          { value: 'all', label: 'Tous' },
          { value: 'paid', label: 'Payés' },
          { value: 'pending', label: 'En attente' },
          { value: 'failed', label: 'Échoués / annulés' }
        ]}
      />
      <div className="mt-5">
        {error ? (
          <ErrorState message={error} onRetry={reload} />
        ) : loading ? (
          <Skeleton className="h-72" />
        ) : !rows.length ? (
          <div className="card">
            <EmptyState icon={<CreditCard className="h-5 w-5" />} title="Aucun paiement" />
          </div>
        ) : (
          <DataTable<AdminPaymentRow>
            rows={rows}
            rowKey={p => p.id}
            rowHref={p => `/espace-pro/commandes/${p.orderId}`}
            columns={[
              { key: 'o', header: 'Commande', cell: p => <span className="num font-semibold">{p.orderCode}</span> },
              {
                key: 'c',
                header: 'Client',
                cell: p => (
                  <div>
                    <p className="font-medium">{p.customerName || '—'}</p>
                    <p className="text-[12px] text-muted">{p.customerEmail}</p>
                  </div>
                )
              },
              { key: 'd', header: 'Date', cell: p => <span className="text-muted">{formatDateTime(p.paidAt || p.createdAt)}</span> },
              { key: 'm', header: 'Moyen', cell: p => <span className="text-muted">{p.paymentMethod || 'GeniusPay'}</span> },
              { key: 'a', header: 'Montant', align: 'right', cell: p => <span className="num font-semibold">{formatXOF(p.amount)}</span> },
              { key: 's', header: 'Statut', cell: p => <StatusBadge map={PAYMENT_STATUS} status={p.status} /> }
            ]}
            mobile={p => (
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="num text-sm font-semibold">{p.orderCode}</p>
                  <p className="truncate text-[12.5px] text-muted">
                    {p.customerName} · {formatDateTime(p.paidAt || p.createdAt)}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <p className="num text-sm font-semibold">{formatXOF(p.amount)}</p>
                  <StatusBadge map={PAYMENT_STATUS} status={p.status} />
                </div>
              </div>
            )}
          />
        )}
      </div>
    </div>
  );
}
