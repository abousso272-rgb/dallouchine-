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
import { getManagerGroupages, getTransitaireOverview, type GroupageMetrics } from '../../services/finance';
import { GroupageRiskBadge } from '../../components/pro/GroupageCockpit';
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

  const revenueWithCosts = s ? (s.revenue_xof * (s.margin_coverage_pct ?? 100)) / 100 : 0;
  const marginPct = s && revenueWithCosts > 0 ? Math.round((s.margin_xof / revenueWithCosts) * 100) : 0;

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
              label="Marge nette"
              value={formatXOFCompact(s.margin_xof)}
              hint={
                s.revenue_xof <= 0
                  ? 'Aucune vente encaissée'
                  : s.orders_missing_costs > 0
                    ? `${marginPct} % · calculée sur ${Math.round(s.margin_coverage_pct)} % du CA (${s.orders_missing_costs} commande(s) sans coût)`
                    : `${marginPct} % du CA encaissé`
              }
              to="/espace-pro/finance"
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

      <ResponseTimes />

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

function ResponseTimes() {
  const o = useAsync(() => getTransitaireOverview(), []);
  usePolling(() => o.reload(), 120000);
  if (o.loading && !o.data) return <Skeleton className="h-40" />;
  if (o.error || !o.data) return null;
  const d = o.data;
  const slow = d.waiting_over_24h > 0;
  const TYPE_LABEL = { sourcing: 'Sourcing', b2b: 'B2B', vehicle: 'Automobile' } as const;
  return (
    <Card>
      <CardTitle>Réactivité</CardTitle>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <div className="rounded-2xl bg-paper p-3.5">
          <p className="text-[12px] text-muted">Délai moyen de premier devis</p>
          <p className="num mt-1 text-xl font-bold">{d.avg_response_hours !== null ? (d.avg_response_hours < 48 ? `${Math.round(d.avg_response_hours)} h` : `${(d.avg_response_hours / 24).toFixed(1)} j`) : '—'}</p>
          <p className="text-[11.5px] text-subtle">sur 90 jours</p>
        </div>
        <div className={`rounded-2xl p-3.5 ${slow ? 'bg-amber-50' : 'bg-paper'}`}>
          <p className="text-[12px] text-muted">Demandes en attente +24 h</p>
          <p className={`num mt-1 text-xl font-bold ${slow ? 'text-ochre' : ''}`}>{d.waiting_over_24h}</p>
          <p className="text-[11.5px] text-subtle">dont {d.waiting_over_48h} depuis plus de 48 h</p>
        </div>
        <div className="rounded-2xl bg-paper p-3.5">
          <p className="text-[12px] text-muted">Devis acceptés</p>
          <p className="num mt-1 text-xl font-bold">{d.quote_conversion_pct !== null ? `${Math.round(d.quote_conversion_pct)} %` : '—'}</p>
          <p className="text-[11.5px] text-subtle">{d.quotes_resolved_90d} devis conclus (90 j)</p>
        </div>
        <div className={`rounded-2xl p-3.5 ${d.quotes_expiring_3d > 0 ? 'bg-amber-50' : 'bg-paper'}`}>
          <p className="text-[12px] text-muted">Devis ouverts</p>
          <p className="num mt-1 text-xl font-bold">{d.quotes_open_count}</p>
          <p className={`text-[11.5px] ${d.quotes_expiring_3d > 0 ? 'text-ochre' : 'text-subtle'}`}>{d.quotes_expiring_3d > 0 ? `${d.quotes_expiring_3d} expirent sous 3 jours : relancez` : formatXOFCompact(d.quotes_open_xof)}</p>
        </div>
      </div>
      {d.queue.length > 0 && (
        <ul className="mt-4 divide-y divide-line">
          {d.queue.map(q => (
            <li key={q.id}>
              <Link to={`/espace-pro/demandes/${q.type}/${q.id}`} className="flex items-center justify-between gap-3 py-2.5 text-sm hover:text-brand">
                <span className="min-w-0 truncate">
                  <span className="num font-semibold">{q.code}</span> <span className="text-muted">{TYPE_LABEL[q.type]}{q.label ? ` · ${q.label}` : ''}</span>
                </span>
                <span className={`num shrink-0 text-[12.5px] font-semibold ${q.age_hours >= 48 ? 'text-red-700' : q.age_hours >= 24 ? 'text-ochre' : 'text-muted'}`}>
                  {q.age_hours < 1 ? 'à l’instant' : q.age_hours < 48 ? `${Math.round(q.age_hours)} h` : `${Math.floor(q.age_hours / 24)} j`}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Gestionnaire des groupages
// ---------------------------------------------------------------------------

function ManagerDashboard() {
  const { user } = useApp();
  const stats = useAsync(() => getStaffStats(), []);
  const groupages = useAsync(() => getManagerGroupages(), [user?.id]);
  const s = stats.data;
  usePolling(() => {
    stats.reload();
    groupages.reload();
  }, 60000);
  const canCreate = user?.permissions.includes('create_groupages');
  const list = groupages.data || [];
  const urgent = list.filter(g => ['critical', 'at_risk', 'failed'].includes(g.risk));
  const expiring = list.reduce((n, g) => n + g.expiring_count, 0);
  const ready = list.filter(g => g.risk === 'reached' && ['open', 'almost_full'].includes(g.status));
  const todo = [
    ...ready.map(g => ({ key: `r${g.id}`, tone: 'success' as const, g, text: 'Quantité minimale atteinte : vous pouvez valider le groupage.' })),
    ...urgent.map(g => ({ key: `u${g.id}`, tone: 'warning' as const, g, text: g.risk === 'failed' ? 'Date limite dépassée sans la quantité minimale.' : `Prévision ${g.projected_quantity} / ${g.supplier_moq} unités : il faut accélérer.` })),
    ...list.filter(g => g.expiring_count > 0).map(g => ({ key: `e${g.id}`, tone: 'warning' as const, g, text: `${g.expiring_count} réservation(s) expirent dans moins de 24 h (${formatXOFCompact(g.expiring_xof)}).` }))
  ];

  return (
    <div className="space-y-6">
      <Greeting
        subtitle="Vos groupages : progression, prévision de la quantité minimale, argent encaissé et ce qui demande votre attention."
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

      {todo.length > 0 && (
        <Card>
          <CardTitle>À traiter aujourd’hui</CardTitle>
          <ul className="space-y-2">
            {todo.map(t => (
              <li key={t.key}>
                <Link to={`/espace-pro/groupages/${t.g.id}`} className="lift flex items-center justify-between gap-3 rounded-2xl border border-line p-3.5">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{t.g.title}</p>
                    <p className={`text-[12.5px] ${t.tone === 'success' ? 'text-jade' : 'text-ochre'}`}>{t.text}</p>
                  </div>
                  <ArrowRight className="h-4 w-4 shrink-0 text-subtle" />
                </Link>
              </li>
            ))}
          </ul>
          {expiring > 0 && <p className="mt-3 text-[12.5px] text-muted">Ouvrez le groupage concerné pour relancer les participants par notification ou WhatsApp.</p>}
        </Card>
      )}

      <Card>
        <CardTitle action={<Link to="/espace-pro/groupages" className="text-[13px] font-semibold hover:text-brand">Tous mes groupages</Link>}>Groupages en cours</CardTitle>
        {groupages.loading && !groupages.data ? (
          <Skeleton className="h-48" />
        ) : groupages.error ? (
          <InlineAlert tone="warning">{groupages.error}</InlineAlert>
        ) : !list.length ? (
          <p className="py-6 text-center text-sm text-muted">Aucun groupage en cours ne vous est attribué.</p>
        ) : (
          <ul className="divide-y divide-line">
            {list.map((g: GroupageMetrics) => (
              <li key={g.id}>
                <Link to={`/espace-pro/groupages/${g.id}`} className="grid grid-cols-1 gap-3 py-4 sm:grid-cols-[1fr_240px_auto] sm:items-center">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{g.title}</p>
                    <p className="text-[12.5px] text-muted">
                      <span className="num">{g.code}</span> · {g.days_left >= 1 ? `${Math.ceil(g.days_left)} j restants` : 'dernier jour'} · encaissé {formatXOFCompact(g.collected_xof)}
                      {g.expiring_count > 0 && <span className="text-ochre"> · {g.expiring_count} réservation(s) expirent</span>}
                    </p>
                  </div>
                  <div>
                    <GroupageMeter reserved={g.active_quantity} target={g.supplier_moq} compact />
                    <p className="mt-1 text-[11.5px] text-muted">
                      {g.active_quantity} / {g.supplier_moq} minimum · prévision {formatNumber(g.projected_quantity)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <GroupageRiskBadge risk={g.risk} />
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
