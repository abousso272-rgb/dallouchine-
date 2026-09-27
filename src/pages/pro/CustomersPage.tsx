import React, { useState } from 'react';
import { Search, UsersRound } from 'lucide-react';
import { useAsync, useDebounced } from '../../lib/hooks';
import { listCustomers, type CustomerRow } from '../../services/admin';
import { formatDate } from '../../lib/format';
import { ROLE_LABEL } from '../../lib/status';
import { PageHeader } from '../../components/ui/Layout';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { DataTable } from '../../components/ui/DataTable';
import { EmptyState, ErrorState, Skeleton } from '../../components/ui/States';
import { RoleEditor, normalizeRole } from '../../components/pro/RoleEditor';

export default function CustomersPage() {
  const [search, setSearch] = useState('');
  const q = useDebounced(search, 350);
  const { data, loading, error, reload } = useAsync(() => listCustomers(q), [q]);
  const [editing, setEditing] = useState<CustomerRow | null>(null);

  return (
    <div>
      <PageHeader title="Clients & comptes" description="Tous les comptes inscrits. Vous pouvez donner un accès équipe à un compte existant." />
      <div className="relative mb-5 max-w-md">
        <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Nom, email, téléphone…" className="h-11 w-full rounded-xl border border-line-2 bg-white pl-10 pr-3 focus:border-ink focus:outline-none" aria-label="Rechercher un compte" />
      </div>
      {error ? (
        <ErrorState message={error} onRetry={reload} />
      ) : loading ? (
        <Skeleton className="h-72" />
      ) : !data?.length ? (
        <div className="card">
          <EmptyState icon={<UsersRound className="h-5 w-5" />} title="Aucun compte trouvé" />
        </div>
      ) : (
        <DataTable<CustomerRow>
          rows={data}
          rowKey={c => c.id}
          columns={[
            {
              key: 'n',
              header: 'Compte',
              cell: c => (
                <div>
                  <p className="font-semibold">{c.fullName || '—'}</p>
                  <p className="text-[12px] text-muted">{c.email}</p>
                </div>
              )
            },
            { key: 'p', header: 'Téléphone', cell: c => <span className="text-muted">{c.phone || '—'}</span> },
            { key: 'c', header: 'Ville / entreprise', cell: c => <span className="text-muted">{[c.city, c.companyName].filter(Boolean).join(' · ') || '—'}</span> },
            { key: 'd', header: 'Inscrit le', cell: c => <span className="text-muted">{formatDate(c.createdAt)}</span> },
            {
              key: 'r',
              header: 'Rôle',
              cell: c => (
                <div className="flex gap-1.5">
                  <Badge tone={normalizeRole(c.role) === 'client' ? 'neutral' : 'brand'}>{ROLE_LABEL[normalizeRole(c.role)]}</Badge>
                  {c.status === 'suspended' && <Badge tone="danger">Suspendu</Badge>}
                </div>
              )
            },
            {
              key: 'a',
              header: '',
              align: 'right',
              cell: c => (
                <Button size="sm" variant="ghost" onClick={() => setEditing(c)}>
                  Accès
                </Button>
              )
            }
          ]}
          mobile={c => (
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">{c.fullName || c.email}</p>
                <p className="truncate text-[12.5px] text-muted">{[c.phone, c.city].filter(Boolean).join(' · ')}</p>
              </div>
              <Button size="sm" variant="secondary" onClick={() => setEditing(c)}>
                {ROLE_LABEL[normalizeRole(c.role)]}
              </Button>
            </div>
          )}
        />
      )}
      {editing && <RoleEditor target={{ ...editing, permissions: [] }} onClose={() => setEditing(null)} onSaved={reload} />}
    </div>
  );
}
