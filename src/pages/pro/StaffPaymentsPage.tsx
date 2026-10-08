import React, { useState } from 'react';
import { CreditCard, Download } from 'lucide-react';
import { useAsync } from '../../lib/hooks';
import { listAllPayments, type AdminPaymentRow } from '../../services/admin';
import { formatDateTime, formatXOF } from '../../lib/format';
import { PAYMENT_METHOD_LABEL, PAYMENT_PROVIDER_LABEL, PAYMENT_STATUS } from '../../lib/status';
import { Button } from '../../components/ui/Button';
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
  const fees = paid.reduce((s, p) => s + (p.feeXOF || 0), 0);
  const gross = paid.reduce((s, p) => s + p.amount, 0);
  const net = paid.reduce((s, p) => s + (p.netXOF ?? p.amount), 0);
  const means = (p: AdminPaymentRow) => p.network || PAYMENT_METHOD_LABEL[p.paymentMethod] || p.paymentMethod || '—';

  function exportCsv() {
    const head = ['Date', 'Commande', 'Client', 'Canal', 'Moyen', 'Montant (FCFA)', 'Frais (FCFA)', 'Net perçu (FCFA)', 'Statut', 'Référence'];
    const lines = rows.map(p => [formatDateTime(p.paidAt || p.createdAt), p.orderCode, p.customerName, PAYMENT_PROVIDER_LABEL[p.provider || ''] || p.provider || '', means(p), p.amount, p.feeXOF || 0, p.netXOF ?? p.amount, p.status, p.providerReference || '']);
    const csv = [head, ...lines].map(r => r.map(v => `"${String(v ?? '').replace(/"/g, '""')}"`).join(';')).join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' }));
    a.download = `paiements-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  return (
    <div>
      <PageHeader
        title="Paiements"
        description="Encaissements confirmés par la passerelle (notification signée, relue auprès de l’API) et règlements enregistrés manuellement."
        actions={
          <Button size="sm" variant="secondary" onClick={exportCsv} icon={<Download className="h-3.5 w-3.5" />}>
            Export CSV
          </Button>
        }
      />
      <div className="mb-5 grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat tone="brand" label="Total encaissé" value={formatXOF(gross)} hint={`${paid.length} paiement(s)`} />
        <Stat label="Frais de passerelle" value={formatXOF(fees)} hint="Prélevés par le fournisseur" />
        <Stat label="Net perçu" value={formatXOF(net)} hint="Montant versé sur votre solde" />
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
              { key: 'm', header: 'Moyen', cell: p => (
                  <div>
                    <p className="text-muted">{means(p)}</p>
                    <p className="text-[11.5px] text-subtle">{PAYMENT_PROVIDER_LABEL[p.provider || ''] || p.provider}</p>
                  </div>
                ) },
              { key: 'f', header: 'Frais', align: 'right', cell: p => <span className="num text-muted">{p.feeXOF ? formatXOF(p.feeXOF) : '—'}</span> },
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
