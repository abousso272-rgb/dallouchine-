import React from 'react';
import { ArrowRight, Users } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useAsync, usePolling } from '../../lib/hooks';
import { listMyParticipations } from '../../services/groupages';
import { formatDate, formatXOF } from '../../lib/format';
import { GROUPAGE_STATUS, PARTICIPANT_STATUS } from '../../lib/status';
import { PageHeader } from '../../components/ui/Layout';
import { StatusBadge } from '../../components/ui/Badge';
import { GroupageMeter } from '../../components/ui/Progress';
import { Link } from '../../components/ui/Link';
import { Button } from '../../components/ui/Button';
import { EmptyState, ErrorState, Skeleton } from '../../components/ui/States';
import { PLACEHOLDER_IMAGE } from '../../services/catalog';

export default function MyGroupagesPage() {
  const { user } = useApp();
  const { data, loading, error, reload } = useAsync(() => listMyParticipations(user!.id), [user?.id]);
  usePolling(reload, 60000);

  return (
    <div>
      <PageHeader title="Mes groupages" description="Vos participations aux commandes collectives et leur avancement." actions={<Button to="/groupages" variant="secondary">Voir les groupages</Button>} />
      {error ? (
        <ErrorState message={error} onRetry={reload} />
      ) : loading ? (
        <div className="space-y-3">
          {[0, 1].map(i => (
            <Skeleton key={i} className="h-36" />
          ))}
        </div>
      ) : !data?.length ? (
        <div className="card">
          <EmptyState icon={<Users className="h-5 w-5" />} title="Aucune participation" description="Rejoignez un groupage pour acheter au prix usine." action={<Button to="/groupages">Voir les groupages ouverts</Button>} />
        </div>
      ) : (
        <ul className="space-y-3">
          {data.map(p => (
            <li key={p.id} className="card p-4 sm:p-5">
              <div className="flex gap-4">
                <img src={p.groupage?.image || PLACEHOLDER_IMAGE} alt="" className="h-20 w-20 shrink-0 rounded-xl object-cover" />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="truncate text-[15px] font-semibold">{p.groupage?.product?.name || p.groupage?.title}</p>
                  </div>
                  <p className="mt-0.5 text-[13px] text-muted">
                    <span className="num">{p.groupage?.code}</span> · {p.quantity} unité{p.quantity > 1 ? 's' : ''} · <span className="num font-semibold text-ink">{formatXOF(p.totalXOF)}</span> · le {formatDate(p.createdAt)}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <StatusBadge map={PARTICIPANT_STATUS} status={p.status} />
                    {p.groupage && <StatusBadge map={GROUPAGE_STATUS} status={p.groupage.status} />}
                  </div>
                </div>
              </div>
              {p.groupage && (
                <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
                  <GroupageMeter reserved={p.groupage.reservedQuantity} target={p.groupage.targetQuantity} compact />
                  <div className="flex gap-2">
                    {p.status === 'reserved' && p.orderId && (
                      <Button to={`/compte/commandes/${p.orderId}`} size="sm">
                        Payer ma part
                      </Button>
                    )}
                    <Button to={`/groupages/${p.groupageId}`} size="sm" variant="secondary" iconRight={<ArrowRight className="h-3.5 w-3.5" />}>
                      Suivre
                    </Button>
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
