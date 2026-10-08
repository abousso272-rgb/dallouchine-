import React from 'react';
import {
  ArrowRight,
  Boxes,
  Car,
  ClipboardList,
  CreditCard,
  FileText,
  Package,
  Plus,
  Search,
  TrendingUp,
  Truck,
  Users,
  Wallet
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useAsync, usePolling } from '../../lib/hooks';
import { getAdminStats, getStaffStats, type ActivityItem } from '../../services/admin';
import { listRequests } from '../../services/requests';
import { listOrders } from '../../services/orders';
import { listStaffGroupages } from '../../services/groupages';
import { formatDate, formatNumber, formatXOF, formatXOFCompact, percent, timeAgo } from '../../lib/format';
import { ORDER_STATUS, REQUEST_STATUS, SOURCING_STATUS, GROUPAGE_STATUS } from '../../lib/status';
import { PageHeader, Stat, Card, CardTitle } from '../../components/ui/Layout';
import { StatusBadge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Link } from '../../components/ui/Link';
import { ErrorState, Skeleton, InlineAlert } from '../../components/ui/States';
import { GroupageMeter } from '../../components/ui/Progress';

export default function DashboardPage() {
  const { user } = useApp();
  if (user?.role === 'admin') return <AdminDashboard />;
  if (user?.role === 'transitaire') return <TransitaireDashboard />;
  return <ManagerDashboard />;
}

function Greeting({ subtitle, actions }: { subtitle: string; actions?: React.ReactNode }) {
  const { user } = useApp();
  const first = (user?.fullName || '').split(' ')[0];
  return (
    <PageHeader
      eyebrow={
        <span className="inline-flex items-center gap-2">
          {formatDate(new Date())}
          <span className="inline-flex items-center gap-1.5 font-semibold normal-case tracking-normal text-jade" title="Les chiffres se mettent à jour automatiquement">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-jade/60 motion-reduce:hidden" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-jade" />
            </span>
            En direct
          </span>
        </span>
      }
      title={`Bonjour${first ? ` ${first}` : ''}`}
      description={subtitle}
      actions={actions}
    />
  );
}

// ---------------------------------------------------------------------------
// Administration générale
// ---------------------------------------------------------------------------

const ACTIVITY_LABEL: Record<ActivityItem['kind'], { label: string; icon: React.ElementType }> = {
  order: { label: 'Nouvelle commande', icon: Package },
  payment: { label: 'Paiement reçu', icon: CreditCard },
  sourcing: { label: 'Demande de sourcing', icon: Search },
  b2b: { label: 'Demande B2B', icon: Boxes },
  vehicle: { label: 'Demande automobile', icon: Car }
};

function AdminDashboard() {
  const { data: s, loading, error, reload } = useAsync(() => getAdminStats(), []);
  usePolling(reload, 60000);

  if (error) {
    return (
      <>
        <Greeting subtitle="Vue d’ensemble de l’activité Dallou Chine." />
        <ErrorState message={error} onRetry={reload} />
      </>
    );
  }

  const marginPct = s && s.revenue_xof > 0 ? percent(s.margin_xof, s.revenue_xof) : 0;

  return (
    <div className="space-y-6">
      <Greeting
        subtitle="Vue d’ensemble opérationnelle : ce qui rapporte, ce qui coûte et ce qui attend une action."
        actions={
          <>
            <Button to="/espace-pro/produits/nouveau" variant="secondary" size="sm" icon={<Plus className="h-4 w-4" />}>
              Produit
            </Button>
            <Button to="/espace-pro/groupages/nouveau" size="sm" icon={<Plus className="h-4 w-4" />}>
              Groupage
            </Button>
          </>
        }
      />

      {/* Finances */}
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {loading || !s ? (
          Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-[118px] rounded-[var(--radius-card)]" />)
        ) : (
          <>
            <Stat tone="brand" label="Chiffre d’affaires encaissé" value={formatXOFCompact(s.revenue_xof)} hint={`${formatNumber(s.orders_paid)} commande(s) payée(s)`} icon={<Wallet className="h-4 w-4" />} />
            <Stat label="Encaissé ce mois" value={formatXOFCompact(s.revenue_month_xof)} icon={<TrendingUp className="h-4 w-4" />} to="/espace-pro/paiements" />
            <Stat
              label="Coûts (achats + logistique)"
              value={formatXOFCompact(s.costs_xof)}
              hint={s.estimated_purchase_xof > 0 ? `dont ${formatXOFCompact(s.estimated_purchase_xof)} estimés via fiches coûts` : 'Coûts saisis sur les commandes'}
            />
            <Stat
              label="Marge brute"
              value={formatXOFCompact(s.margin_xof)}
              hint={s.revenue_xof > 0 ? `${marginPct} % du CA encaissé` : 'Aucune vente encaissée'}
              tone={s.margin_xof > 0 ? 'default' : 'default'}
            />
          </>
        )}
      </div>

      {/* Opérations */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {loading || !s ? (
          Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-[100px] rounded-[var(--radius-card)]" />)
        ) : (
          <>
            <Stat label="Commandes à traiter" value={s.orders_to_process} hint="Payées, achat/préparation" to="/espace-pro/commandes?vue=a-traiter" icon={<Package className="h-4 w-4" />} />
            <Stat label="En attente de paiement" value={s.orders_pending_payment} to="/espace-pro/commandes?paiement=pending" icon={<CreditCard className="h-4 w-4" />} />
            <Stat label="En transit" value={s.orders_in_transit} to="/espace-pro/commandes?vue=transit" icon={<Truck className="h-4 w-4" />} />
            <Stat label="Groupages actifs" value={s.groupages_active} hint={s.groupages_full ? `${s.groupages_full} objectif(s) atteint(s)` : undefined} to="/espace-pro/groupages" icon={<Users className="h-4 w-4" />} />
            <Stat label="Sourcing" value={s.sourcing_open} hint={s.sourcing_new ? `${s.sourcing_new} nouvelle(s)` : 'Aucune nouvelle'} to="/espace-pro/demandes?type=sourcing" icon={<Search className="h-4 w-4" />} />
            <Stat label="Demandes B2B" value={s.b2b_open} to="/espace-pro/demandes?type=b2b" icon={<Boxes className="h-4 w-4" />} />
            <Stat label="Demandes automobile" value={s.vehicle_open} to="/espace-pro/demandes?type=vehicle" icon={<Car className="h-4 w-4" />} />
            <Stat label="Devis en attente client" value={s.quotes_awaiting} hint={`${formatNumber(s.clients_count)} clients inscrits`} icon={<FileText className="h-4 w-4" />} />
          </>
        )}
      </div>

      <Card>
        <CardTitle>Activité récente</CardTitle>
        {loading || !s ? (
          <Skeleton className="h-48" />
        ) : s.activity.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted">Aucune activité pour le moment.</p>
        ) : (
          <ul className="divide-y divide-line">
            {s.activity.map(a => {
              const meta = ACTIVITY_LABEL[a.kind];
              return (
                <li key={`${a.kind}-${a.id}-${a.at}`}>
                  <Link to={a.link} className="flex items-center gap-3 py-3">
                    <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${a.kind === 'payment' ? 'bg-jade-50 text-jade' : 'icon-bubble'}`}>
                      <meta.icon className="h-4 w-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">
                        {meta.label} · <span className="num">{a.ref}</span>
                      </p>
                      <p className="truncate text-[12.5px] text-muted">{[a.who, a.amount ? formatXOF(a.amount) : null].filter(Boolean).join(' · ')}</p>
                    </div>
                    <span className="shrink-0 text-[12px] text-subtle">{timeAgo(a.at)}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Transitaire / sourceur
// ---------------------------------------------------------------------------

function TransitaireDashboard() {
  const { user } = useApp();
  const stats = useAsync(() => getStaffStats(), []);
  const lists = useAsync(async () => {
    const [newRequests, mine, toProcess] = await Promise.all([
      listRequests('sourcing', { status: 'new' }),
      listRequests('sourcing', { assignedTo: user!.id }),
      listOrders({ payment: 'paid', limit: 50 })
    ]);
    return {
      newRequests: newRequests.slice(0, 6),
      mine: mine.filter(r => !['completed', 'cancelled', 'rejected'].includes(r.status)).slice(0, 6),
      toProcess: toProcess.filter(o => ['paid', 'supplier_ordered', 'preparing', 'shipped', 'in_transit'].includes(o.orderStatus)).slice(0, 8)
    };
  }, [user?.id]);
  const s = stats.data;
  usePolling(() => {
    stats.reload();
    lists.reload();
  }, 60000);

  return (
    <div className="space-y-6">
      <Greeting subtitle="Vos demandes à traiter, vos recherches en cours et les commandes à expédier." />
      {stats.error && <InlineAlert tone="warning">{stats.error}</InlineAlert>}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {stats.loading || !s ? (
          Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-[100px] rounded-[var(--radius-card)]" />)
        ) : (
          <>
            <Stat tone="dark" label="Nouvelles demandes" value={s.sourcing_new ?? 0} to="/espace-pro/demandes?type=sourcing&statut=new" icon={<Search className="h-4 w-4" />} />
            <Stat label="Mes demandes en cours" value={s.sourcing_mine ?? 0} to="/espace-pro/demandes?type=sourcing&vue=miennes" icon={<ClipboardList className="h-4 w-4" />} />
            <Stat label="Commandes à traiter" value={s.orders_to_process ?? 0} to="/espace-pro/commandes?vue=a-traiter" icon={<Package className="h-4 w-4" />} />
            <Stat label="En transit" value={s.orders_in_transit ?? 0} to="/espace-pro/commandes?vue=transit" icon={<Truck className="h-4 w-4" />} />
            <Stat label="B2B ouvertes" value={s.b2b_open ?? 0} to="/espace-pro/demandes?type=b2b" icon={<Boxes className="h-4 w-4" />} />
            <Stat label="Demandes automobile" value={s.vehicle_open ?? 0} to="/espace-pro/demandes?type=vehicle" icon={<Car className="h-4 w-4" />} />
            <Stat label="Produits en brouillon" value={s.products_draft ?? 0} to="/espace-pro/produits?statut=brouillon" icon={<Boxes className="h-4 w-4" />} />
            <Stat label="Sourcing ouverts" value={s.sourcing_open ?? 0} to="/espace-pro/demandes?type=sourcing" icon={<Search className="h-4 w-4" />} />
          </>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <Card>
          <CardTitle action={<Link to="/espace-pro/demandes?type=sourcing&statut=new" className="text-[13px] font-semibold hover:text-brand">Tout voir</Link>}>Nouvelles demandes de sourcing</CardTitle>
          <RequestMiniList loading={lists.loading} rows={lists.data?.newRequests || []} empty="Aucune nouvelle demande." />
        </Card>
        <Card>
          <CardTitle action={<Link to="/espace-pro/demandes?type=sourcing&vue=miennes" className="text-[13px] font-semibold hover:text-brand">Tout voir</Link>}>Mes demandes en cours</CardTitle>
          <RequestMiniList loading={lists.loading} rows={lists.data?.mine || []} empty="Prenez en charge une demande pour la retrouver ici." />
        </Card>
      </div>

      <Card>
        <CardTitle action={<Link to="/espace-pro/commandes?vue=a-traiter" className="text-[13px] font-semibold hover:text-brand">Toutes les commandes</Link>}>Commandes payées à acheminer</CardTitle>
        {lists.loading ? (
          <Skeleton className="h-40" />
        ) : !lists.data?.toProcess.length ? (
          <p className="py-6 text-center text-sm text-muted">Aucune commande en attente de traitement logistique.</p>
        ) : (
          <ul className="divide-y divide-line">
            {lists.data.toProcess.map(o => (
              <li key={o.id}>
                <Link to={`/espace-pro/commandes/${o.id}`} className="flex items-center justify-between gap-3 py-3">
                  <div className="min-w-0">
                    <p className="num text-sm font-semibold">{o.trackingCode}</p>
                    <p className="truncate text-[12.5px] text-muted">
                      {o.customerName} · {o.items.length} article(s) · {formatDate(o.createdAt)}
                    </p>
                  </div>
                  <StatusBadge map={ORDER_STATUS} status={o.orderStatus} />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}

function RequestMiniList({ loading, rows, empty }: { loading: boolean; rows: Awaited<ReturnType<typeof listRequests>>; empty: string }) {
  if (loading) return <Skeleton className="h-40" />;
  if (!rows.length) return <p className="py-6 text-center text-sm text-muted">{empty}</p>;
  return (
    <ul className="divide-y divide-line">
      {rows.map(r => (
        <li key={r.id}>
          <Link to={`/espace-pro/demandes/${r.type}/${r.id}`} className="flex items-center justify-between gap-3 py-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{r.title}</p>
              <p className="truncate text-[12.5px] text-muted">
                <span className="num">{r.code}</span> · {r.contactName} · {timeAgo(r.createdAt)}
              </p>
            </div>
            <StatusBadge map={r.type === 'sourcing' ? SOURCING_STATUS : REQUEST_STATUS[r.type]} status={r.status} />
          </Link>
        </li>
      ))}
    </ul>
  );
}

// ---------------------------------------------------------------------------
// Gestionnaire des groupages
// ---------------------------------------------------------------------------

function ManagerDashboard() {
  const { user } = useApp();
  const stats = useAsync(() => getStaffStats(), []);
  const groupages = useAsync(() => listStaffGroupages({ managerId: user!.id }), [user?.id]);
  const s = stats.data;
  usePolling(() => {
    stats.reload();
    groupages.reload();
  }, 60000);
  const canCreate = user?.permissions.includes('create_groupages');
  const active = (groupages.data || []).filter(g => !['completed', 'cancelled'].includes(g.status));

  return (
    <div className="space-y-6">
      <Greeting
        subtitle="Vos groupages : progression, participants et prochaines étapes."
        actions={
          canCreate ? (
            <Button to="/espace-pro/groupages/nouveau" size="sm" icon={<Plus className="h-4 w-4" />}>
              Nouveau groupage
            </Button>
          ) : undefined
        }
      />
      {stats.error && <InlineAlert tone="warning">{stats.error}</InlineAlert>}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        {stats.loading || !s ? (
          Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-[100px] rounded-[var(--radius-card)]" />)
        ) : (
          <>
            <Stat tone="dark" label="Mes groupages" value={s.groupages_mine ?? 0} />
            <Stat label="Ouverts" value={s.groupages_active ?? 0} />
            <Stat label="Objectif atteint" value={s.groupages_full ?? 0} />
            <Stat label="Participants" value={s.participants ?? 0} />
            <Stat label="Commandes payées" value={s.orders_paid ?? 0} to="/espace-pro/commandes" />
            <Stat label="Paiements en attente" value={s.orders_pending ?? 0} to="/espace-pro/commandes?paiement=pending" />
          </>
        )}
      </div>

      <Card>
        <CardTitle action={<Link to="/espace-pro/groupages" className="text-[13px] font-semibold hover:text-brand">Tous mes groupages</Link>}>Groupages en cours</CardTitle>
        {groupages.loading ? (
          <Skeleton className="h-48" />
        ) : !active.length ? (
          <p className="py-6 text-center text-sm text-muted">Aucun groupage en cours ne vous est attribué.</p>
        ) : (
          <ul className="divide-y divide-line">
            {active.map(g => (
              <li key={g.id}>
                <Link to={`/espace-pro/groupages/${g.id}`} className="grid grid-cols-1 gap-3 py-4 sm:grid-cols-[1fr_260px_auto] sm:items-center">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{g.product?.name || g.title}</p>
                    <p className="text-[12.5px] text-muted">
                      <span className="num">{g.code}</span> · limite {formatDate(g.deadline)} · {g.participantsCount} participant(s)
                    </p>
                  </div>
                  <GroupageMeter reserved={g.reservedQuantity} target={g.targetQuantity} compact />
                  <div className="flex items-center gap-2">
                    <StatusBadge map={GROUPAGE_STATUS} status={g.status} />
                    <ArrowRight className="hidden h-4 w-4 text-subtle sm:block" />
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
