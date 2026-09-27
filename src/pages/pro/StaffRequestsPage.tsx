import React, { useState } from 'react';
import { ClipboardList, Search } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useAsync, useDebounced } from '../../lib/hooks';
import { listRequests } from '../../services/requests';
import { formatDate, formatXOF, timeAgo } from '../../lib/format';
import { REQUEST_STATUS, type RequestType } from '../../lib/status';
import { PageHeader } from '../../components/ui/Layout';
import { Tabs } from '../../components/ui/Tabs';
import { Select } from '../../components/ui/Field';
import { StatusBadge, Badge } from '../../components/ui/Badge';
import { DataTable } from '../../components/ui/DataTable';
import { EmptyState, ErrorState, Skeleton } from '../../components/ui/States';
import type { ClientRequest } from '../../lib/types';

type Scope = 'toutes' | 'miennes' | 'non-attribuees';

export default function StaffRequestsPage() {
  const { query, navigate, path, user } = useApp();
  const type = (['sourcing', 'b2b', 'vehicle'].includes(query.get('type') || '') ? query.get('type') : 'sourcing') as RequestType;
  const status = query.get('statut') || '';
  const scope = (query.get('vue') as Scope) || 'toutes';
  const [search, setSearch] = useState('');
  const q = useDebounced(search, 350);

  const { data, loading, error, reload } = useAsync(
    () =>
      listRequests(type, {
        status: status || undefined,
        assignedTo: scope === 'miennes' ? user!.id : undefined,
        unassignedOnly: scope === 'non-attribuees',
        search: q
      }),
    [type, status, scope, q, user?.id]
  );

  function setParam(updates: Record<string, string | null>) {
    const p = new URLSearchParams(query);
    Object.entries(updates).forEach(([k, v]) => (v ? p.set(k, v) : p.delete(k)));
    navigate(`${path}${p.toString() ? `?${p}` : ''}`, { replace: true, keepScroll: true });
  }

  const statusMap = REQUEST_STATUS[type];

  return (
    <div>
      <PageHeader title="Demandes & devis" description="Analysez les besoins, recherchez les fournisseurs, envoyez les devis et échangez avec les clients." />
      <Tabs
        value={type}
        onChange={v => setParam({ type: v, statut: null })}
        items={[
          { value: 'sourcing', label: 'Sourcing' },
          { value: 'b2b', label: 'Professionnels (B2B)' },
          { value: 'vehicle', label: 'Automobile' }
        ]}
      />
      <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-[1fr_200px_200px]">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Référence, client, produit…"
            className="h-11 w-full rounded-xl border border-line-2 bg-white pl-10 pr-3 focus:border-ink focus:outline-none"
            aria-label="Rechercher"
          />
        </div>
        <Select value={status} onChange={e => setParam({ statut: e.target.value || null })} placeholder="Tous statuts" options={Object.entries(statusMap).map(([value, m]) => ({ value, label: m.label }))} aria-label="Statut" />
        <Select
          value={scope}
          onChange={e => setParam({ vue: e.target.value === 'toutes' ? null : e.target.value })}
          options={[
            { value: 'toutes', label: 'Toutes les demandes' },
            { value: 'miennes', label: 'Qui me sont attribuées' },
            { value: 'non-attribuees', label: 'Non attribuées' }
          ]}
          aria-label="Attribution"
        />
      </div>

      <div className="mt-5">
        {error ? (
          <ErrorState message={error} onRetry={reload} />
        ) : loading ? (
          <Skeleton className="h-72" />
        ) : !data?.length ? (
          <div className="card">
            <EmptyState icon={<ClipboardList className="h-5 w-5" />} title="Aucune demande" description="Aucune demande ne correspond à ces critères." />
          </div>
        ) : (
          <DataTable<ClientRequest>
            rows={data}
            rowKey={r => r.id}
            rowHref={r => `/espace-pro/demandes/${r.type}/${r.id}`}
            columns={[
              {
                key: 'req',
                header: 'Demande',
                cell: r => (
                  <div className="max-w-[340px]">
                    <p className="truncate font-semibold">{r.title}</p>
                    <p className="num text-[12px] text-muted">{r.code}</p>
                  </div>
                )
              },
              {
                key: 'client',
                header: 'Client',
                cell: r => (
                  <div>
                    <p className="font-medium">{r.company || r.contactName}</p>
                    <p className="text-[12px] text-muted">{r.contactPhone}</p>
                  </div>
                )
              },
              { key: 'qty', header: 'Qté / budget', cell: r => <span className="text-muted">{r.quantity} u.{r.budgetXOF ? ` · ${formatXOF(r.budgetXOF)}` : ''}</span> },
              { key: 'assign', header: 'Suivi', cell: r => (r.assignedTo ? <Badge tone={r.assignedTo === user?.id ? 'brand' : 'neutral'}>{r.assignedTo === user?.id ? 'Moi' : 'Attribuée'}</Badge> : <Badge tone="warning">Non attribuée</Badge>) },
              { key: 'date', header: 'Reçue', cell: r => <span className="text-muted" title={formatDate(r.createdAt)}>{timeAgo(r.createdAt)}</span> },
              { key: 'status', header: 'Statut', cell: r => <StatusBadge map={statusMap} status={r.status} /> }
            ]}
            mobile={r => (
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{r.title}</p>
                  <p className="truncate text-[12.5px] text-muted">
                    <span className="num">{r.code}</span> · {r.company || r.contactName} · {timeAgo(r.createdAt)}
                  </p>
                </div>
                <StatusBadge map={statusMap} status={r.status} />
              </div>
            )}
          />
        )}
      </div>
    </div>
  );
}
