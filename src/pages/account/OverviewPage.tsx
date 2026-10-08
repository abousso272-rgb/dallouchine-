import React from 'react';
import { ArrowRight, Bell, ClipboardList, CreditCard, FileText, Package, Search, Users } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useAsync } from '../../lib/hooks';
import { listMyOrders } from '../../services/orders';
import { listMyParticipations } from '../../services/groupages';
import { listAllMyRequests, listMyQuotes } from '../../services/requests';
import { listNotifications } from '../../services/account';
import { formatDate, formatXOF, timeAgo } from '../../lib/format';
import { ORDER_STATUS, REQUEST_STATUS, REQUEST_TYPE_LABEL, REQUEST_CLOSED_STATUSES, REQUEST_FINAL_STATUSES } from '../../lib/status';
import { Stat } from '../../components/ui/Layout';
import { StatusBadge } from '../../components/ui/Badge';
import { Link } from '../../components/ui/Link';
import { Button } from '../../components/ui/Button';
import { Skeleton } from '../../components/ui/States';

export default function OverviewPage() {
  const { user } = useApp();
  const uid = user!.id;
  const data = useAsync(async () => {
    const [orders, parts, requests, quotes, notifs] = await Promise.all([
      listMyOrders(uid),
      listMyParticipations(uid).catch(() => []),
      listAllMyRequests(uid),
      listMyQuotes(uid),
      listNotifications(uid, 6).catch(() => [])
    ]);
    return { orders, parts, requests, quotes, notifs };
  }, [uid]);

  const d = data.data;
  const activeOrders = (d?.orders || []).filter(o => !['delivered', 'cancelled'].includes(o.orderStatus));
  const toPay = (d?.orders || []).filter(o => o.orderStatus === 'pending_payment' && o.paymentStatus !== 'cancelled');
  const activeGroupages = (d?.parts || []).filter(p => !['cancelled', 'refunded'].includes(p.status) && !['completed', 'cancelled'].includes(p.groupage?.status || ''));
  const openRequests = (d?.requests || []).filter(r => !REQUEST_CLOSED_STATUSES.includes(r.status) && !REQUEST_FINAL_STATUSES[r.type].includes(r.status));
  const quotesToReview = (d?.quotes || []).filter(q => ['sent', 'viewed'].includes(q.status));
  const paidTotal = (d?.orders || []).filter(o => o.paymentStatus === 'paid').reduce((s, o) => s + o.totalXOF, 0);
  const firstName = (user?.fullName || '').split(' ')[0];

  return (
    <div className="space-y-6">
      <div>
        <p className="eyebrow">Mon espace</p>
        <h1 className="mt-1 text-[26px] font-bold sm:text-3xl">Bonjour{firstName ? ` ${firstName}` : ''} 👋</h1>
        <p className="mt-1 text-[15px] text-muted">Voici où en sont vos achats et vos demandes.</p>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {data.loading ? (
          Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-[112px] rounded-[var(--radius-card)]" />)
        ) : (
          <>
            <Stat label="Commandes en cours" value={activeOrders.length} icon={<Package className="h-4 w-4" />} to="/compte/commandes" />
            <Stat label="Groupages" value={activeGroupages.length} icon={<Users className="h-4 w-4" />} to="/compte/groupages" />
            <Stat label="Demandes en cours" value={openRequests.length} icon={<ClipboardList className="h-4 w-4" />} to="/compte/demandes" />
            <Stat tone="brand" label="Total payé" value={formatXOF(paidTotal)} icon={<CreditCard className="h-4 w-4" />} to="/compte/paiements" />
          </>
        )}
      </div>

      {(toPay.length > 0 || quotesToReview.length > 0) && (
        <section className="card p-5">
          <h2 className="text-base font-semibold">À faire</h2>
          <ul className="mt-3 divide-y divide-line">
            {quotesToReview.map(q => (
              <li key={q.id}>
                <Link to={q.requestType && q.requestId ? `/compte/demandes/${q.requestType}/${q.requestId}` : '/compte/demandes'} className="flex items-center gap-3 py-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-amber-700">
                    <FileText className="h-4 w-4" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold">Devis {q.number} à valider</span>
                    <span className="block truncate text-[12.5px] text-muted">
                      {q.title || 'Votre demande'} · {formatXOF(q.totalXOF)} · valable jusqu’au {formatDate(q.validUntil)}
                    </span>
                  </span>
                  <ArrowRight className="h-4 w-4 text-subtle" />
                </Link>
              </li>
            ))}
            {toPay.map(o => (
              <li key={o.id}>
                <Link to={`/compte/commandes/${o.id}`} className="flex items-center gap-3 py-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-50 text-brand">
                    <CreditCard className="h-4 w-4" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold">Paiement en attente · {o.trackingCode}</span>
                    <span className="block truncate text-[12.5px] text-muted">{formatXOF(o.totalXOF)} · {o.notes || `${o.items.length} article(s)`}</span>
                  </span>
                  <ArrowRight className="h-4 w-4 text-subtle" />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <section className="card p-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-base font-semibold">Commandes récentes</h2>
            <Link to="/compte/commandes" className="text-[13px] font-semibold hover:text-brand">
              Tout voir
            </Link>
          </div>
          {data.loading ? (
            <Skeleton className="h-32" />
          ) : (d?.orders || []).length === 0 ? (
            <div className="py-6 text-center">
              <p className="text-sm text-muted">Aucune commande pour le moment.</p>
              <Button to="/catalogue" size="sm" className="mt-3">
                Découvrir le catalogue
              </Button>
            </div>
          ) : (
            <ul className="divide-y divide-line">
              {(d?.orders || []).slice(0, 4).map(o => (
                <li key={o.id}>
                  <Link to={`/compte/commandes/${o.id}`} className="flex items-center justify-between gap-3 py-3">
                    <div className="min-w-0">
                      <p className="num text-sm font-semibold">{o.trackingCode}</p>
                      <p className="truncate text-[12.5px] text-muted">
                        {formatDate(o.createdAt)} · {formatXOF(o.totalXOF)}
                      </p>
                    </div>
                    <StatusBadge map={ORDER_STATUS} status={o.orderStatus} />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="card p-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-base font-semibold">Demandes en cours</h2>
            <Link to="/compte/demandes" className="text-[13px] font-semibold hover:text-brand">
              Tout voir
            </Link>
          </div>
          {data.loading ? (
            <Skeleton className="h-32" />
          ) : openRequests.length === 0 ? (
            <div className="py-6 text-center">
              <p className="text-sm text-muted">Aucune demande en cours.</p>
              <Button to="/sourcing" size="sm" variant="secondary" className="mt-3" icon={<Search className="h-3.5 w-3.5" />}>
                Demander un sourcing
              </Button>
            </div>
          ) : (
            <ul className="divide-y divide-line">
              {openRequests.slice(0, 4).map(r => (
                <li key={r.type + r.id}>
                  <Link to={`/compte/demandes/${r.type}/${r.id}`} className="flex items-center justify-between gap-3 py-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">{r.title}</p>
                      <p className="text-[12.5px] text-muted">
                        {REQUEST_TYPE_LABEL[r.type]} · <span className="num">{r.code}</span>
                      </p>
                    </div>
                    <StatusBadge map={REQUEST_STATUS[r.type]} status={r.status} />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <section className="card p-5">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-semibold">Dernières activités</h2>
          <Link to="/compte/notifications" className="text-[13px] font-semibold hover:text-brand">
            Toutes les notifications
          </Link>
        </div>
        {(d?.notifs || []).length === 0 ? (
          <p className="py-4 text-sm text-muted">Vos notifications (paiements, statuts, messages) apparaîtront ici.</p>
        ) : (
          <ul className="divide-y divide-line">
            {(d?.notifs || []).map(n => {
              const inner = (
                <div className="flex gap-3 py-3">
                  <span className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${n.isRead ? 'bg-paper-2 text-muted' : 'bg-brand-50 text-brand'}`}>
                    <Bell className="h-4 w-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold">{n.title}</p>
                    <p className="text-[13px] text-muted">{n.message}</p>
                  </div>
                  <span className="shrink-0 text-[12px] text-subtle">{timeAgo(n.createdAt)}</span>
                </div>
              );
              return <li key={n.id}>{n.link ? <Link to={n.link}>{inner}</Link> : inner}</li>;
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
