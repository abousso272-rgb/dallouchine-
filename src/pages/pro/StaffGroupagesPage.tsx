import React, { useState } from 'react';
import { Plus, Users } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useAsync } from '../../lib/hooks';
import { listStaffGroupages } from '../../services/groupages';
import { formatDate, formatXOF } from '../../lib/format';
import { GROUPAGE_STATUS } from '../../lib/status';
import { PageHeader } from '../../components/ui/Layout';
import { Tabs } from '../../components/ui/Tabs';
import { StatusBadge } from '../../components/ui/Badge';
import { GroupageMeter } from '../../components/ui/Progress';
import { DataTable } from '../../components/ui/DataTable';
import { Button } from '../../components/ui/Button';
import { EmptyState, ErrorState, Skeleton } from '../../components/ui/States';
import type { Groupage } from '../../lib/types';
import { PLACEHOLDER_IMAGE } from '../../services/catalog';

type View = 'actifs' | 'execution' | 'brouillons' | 'termines';
const VIEWS: Record<View, string[]> = {
  actifs: ['open', 'almost_full', 'full', 'validated'],
  execution: ['supplier_ordered', 'preparing', 'shipped', 'arrived'],
  brouillons: ['draft'],
  termines: ['completed', 'cancelled']
};

export default function StaffGroupagesPage() {
  const { user } = useApp();
  const isAdmin = user?.role === 'admin';
  const canCreate = isAdmin || user?.permissions.includes('create_groupages');
  const { data, loading, error, reload } = useAsync(() => listStaffGroupages(isAdmin ? {} : { managerId: user!.id }), [user?.id, isAdmin]);
  const [view, setView] = useState<View>('actifs');
  const rows = (data || []).filter(g => VIEWS[view].includes(g.status));
  const count = (v: View) => (data || []).filter(g => VIEWS[v].includes(g.status)).length;

  return (
    <div>
      <PageHeader
        title="Groupages"
        description={isAdmin ? 'Toutes les campagnes d’achat groupé.' : 'Les campagnes dont vous avez la charge.'}
        actions={
          canCreate ? (
            <Button to="/espace-pro/groupages/nouveau" icon={<Plus className="h-4 w-4" />}>
              Nouveau groupage
            </Button>
          ) : undefined
        }
      />
      <Tabs
        value={view}
        onChange={setView}
        items={[
          { value: 'actifs', label: 'Collecte', count: count('actifs') },
          { value: 'execution', label: 'En exécution', count: count('execution') },
          { value: 'brouillons', label: 'Brouillons', count: count('brouillons') },
          { value: 'termines', label: 'Terminés', count: count('termines') }
        ]}
      />
      <div className="mt-5">
        {error ? (
          <ErrorState message={error} onRetry={reload} />
        ) : loading ? (
          <Skeleton className="h-72" />
        ) : !rows.length ? (
          <div className="card">
            <EmptyState icon={<Users className="h-5 w-5" />} title="Aucun groupage dans cette vue" />
          </div>
        ) : (
          <DataTable<Groupage>
            rows={rows}
            rowKey={g => g.id}
            rowHref={g => `/espace-pro/groupages/${g.id}`}
            columns={[
              {
                key: 'g',
                header: 'Groupage',
                cell: g => (
                  <div className="flex items-center gap-3">
                    <img src={g.image || PLACEHOLDER_IMAGE} alt="" className="h-10 w-10 rounded-lg object-cover" />
                    <div className="min-w-0">
                      <p className="max-w-[280px] truncate font-semibold">{g.product?.name || g.title}</p>
                      <p className="num text-[12px] text-muted">{g.code}</p>
                    </div>
                  </div>
                )
              },
              { key: 'p', header: 'Progression', className: 'w-[220px]', cell: g => <GroupageMeter reserved={g.reservedQuantity} target={g.targetQuantity} compact /> },
              { key: 'price', header: 'Prix unitaire', align: 'right', cell: g => <span className="num">{formatXOF(g.unitPriceXOF)}</span> },
              { key: 'part', header: 'Participants', align: 'right', cell: g => <span className="num">{g.participantsCount}</span> },
              { key: 'dl', header: 'Date limite', cell: g => <span className="text-muted">{formatDate(g.deadline)}</span> },
              { key: 's', header: 'Statut', cell: g => <StatusBadge map={GROUPAGE_STATUS} status={g.status} /> }
            ]}
            mobile={g => (
              <div className="space-y-2.5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{g.product?.name || g.title}</p>
                    <p className="text-[12.5px] text-muted">
                      <span className="num">{g.code}</span> · {formatXOF(g.unitPriceXOF)} · limite {formatDate(g.deadline)}
                    </p>
                  </div>
                  <StatusBadge map={GROUPAGE_STATUS} status={g.status} />
                </div>
                <GroupageMeter reserved={g.reservedQuantity} target={g.targetQuantity} compact />
              </div>
            )}
          />
        )}
      </div>
    </div>
  );
}
