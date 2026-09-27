import React, { useState } from 'react';
import { ArrowRight, ClipboardList, Search } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useAsync } from '../../lib/hooks';
import { listAllMyRequests } from '../../services/requests';
import { formatDate } from '../../lib/format';
import { REQUEST_STATUS, REQUEST_TYPE_LABEL, type RequestType } from '../../lib/status';
import { PageHeader } from '../../components/ui/Layout';
import { Tabs } from '../../components/ui/Tabs';
import { StatusBadge } from '../../components/ui/Badge';
import { Link } from '../../components/ui/Link';
import { Button } from '../../components/ui/Button';
import { EmptyState, ErrorState, Skeleton } from '../../components/ui/States';

export default function RequestsPage() {
  const { user } = useApp();
  const { data, loading, error, reload } = useAsync(() => listAllMyRequests(user!.id), [user?.id]);
  const [tab, setTab] = useState<'all' | RequestType>('all');
  const list = (data || []).filter(r => tab === 'all' || r.type === tab);
  const count = (t: RequestType) => (data || []).filter(r => r.type === t).length;

  return (
    <div>
      <PageHeader
        title="Demandes & devis"
        description="Sourcing, demandes professionnelles et automobile : suivez l’avancement, validez vos devis et échangez avec votre conseiller."
        actions={
          <Button to="/sourcing" icon={<Search className="h-4 w-4" />}>
            Nouvelle demande
          </Button>
        }
      />
      <Tabs
        value={tab}
        onChange={setTab}
        items={[
          { value: 'all', label: 'Toutes', count: data?.length },
          { value: 'sourcing', label: 'Sourcing', count: count('sourcing') },
          { value: 'b2b', label: 'Professionnel', count: count('b2b') },
          { value: 'vehicle', label: 'Automobile', count: count('vehicle') }
        ]}
      />
      <div className="mt-5">
        {error ? (
          <ErrorState message={error} onRetry={reload} />
        ) : loading ? (
          <div className="space-y-3">
            {[0, 1, 2].map(i => (
              <Skeleton key={i} className="h-20" />
            ))}
          </div>
        ) : list.length === 0 ? (
          <div className="card">
            <EmptyState
              icon={<ClipboardList className="h-5 w-5" />}
              title="Aucune demande"
              description="Envoyez une demande de sourcing, un besoin professionnel ou une recherche de véhicule : le suivi apparaîtra ici."
              action={
                <div className="flex flex-wrap justify-center gap-2">
                  <Button to="/sourcing">Sourcing</Button>
                  <Button to="/pro" variant="secondary">
                    B2B
                  </Button>
                  <Button to="/automobile#recherche" variant="secondary">
                    Automobile
                  </Button>
                </div>
              }
            />
          </div>
        ) : (
          <ul className="space-y-3">
            {list.map(r => (
              <li key={r.type + r.id}>
                <Link to={`/compte/demandes/${r.type}/${r.id}`} className="card flex items-center gap-4 p-4 transition-shadow hover:shadow-[var(--shadow-soft)] sm:p-5">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[15px] font-semibold">{r.title}</p>
                    <p className="mt-0.5 text-[13px] text-muted">
                      {REQUEST_TYPE_LABEL[r.type]} · <span className="num">{r.code}</span> · {formatDate(r.createdAt)}
                    </p>
                  </div>
                  <StatusBadge map={REQUEST_STATUS[r.type]} status={r.status} />
                  <ArrowRight className="hidden h-4 w-4 text-subtle sm:block" />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
