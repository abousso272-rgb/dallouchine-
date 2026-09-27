import React, { useEffect, useState } from 'react';
import { ArrowRight, PackageSearch, Search } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { trackOrder, listMyOrders, type PublicTracking } from '../../services/orders';
import { friendlyError } from '../../lib/db';
import { useAsync } from '../../lib/hooks';
import { formatDate, formatDateTime, formatXOF } from '../../lib/format';
import { ORDER_STATUS, ORDER_STEPS, currentStepIndex, statusMeta } from '../../lib/status';
import { Button } from '../../components/ui/Button';
import { StatusBadge } from '../../components/ui/Badge';
import { Stepper, Timeline } from '../../components/ui/Stepper';
import { EmptyState, InlineAlert } from '../../components/ui/States';
import { Link } from '../../components/ui/Link';

export default function TrackingPage() {
  const { query, navigate, user, path } = useApp();
  const initial = query.get('code') || '';
  const [code, setCode] = useState(initial);
  const [result, setResult] = useState<PublicTracking | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const myOrders = useAsync(async () => (user ? (await listMyOrders(user.id)).slice(0, 5) : []), [user?.id]);

  async function lookup(value: string) {
    const c = value.trim().toUpperCase();
    if (c.length < 6) {
      setError('Saisissez un numéro de suivi complet (ex. AWP-XXXXXXXX).');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      setResult(await trackOrder(c));
    } catch (err) {
      setError(friendlyError(err));
      setResult(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (initial) lookup(initial);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initial]);

  const step = result?.order_status
    ? result.order_status === 'cancelled'
      ? 0
      : currentStepIndex(ORDER_STEPS, result.order_status, ['delivered'])
    : 0;

  return (
    <div className="container-page max-w-4xl py-8 sm:py-12">
      <p className="eyebrow">Suivi</p>
      <h1 className="mt-2 text-[30px] font-semibold sm:text-4xl">Suivre une commande</h1>
      <p className="mt-2 text-[15px] text-muted">Votre numéro de suivi figure dans votre espace client et dans la confirmation de commande.</p>

      <form
        className="mt-6 flex flex-col gap-2 sm:flex-row"
        onSubmit={e => {
          e.preventDefault();
          navigate(`${path}?code=${encodeURIComponent(code.trim().toUpperCase())}`, { replace: true, keepScroll: true });
          lookup(code);
        }}
      >
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <input
            value={code}
            onChange={e => setCode(e.target.value.toUpperCase())}
            placeholder="AWP-XXXXXXXX"
            className="num h-13 w-full rounded-2xl border border-line-2 bg-white pl-11 pr-4 text-[16px] font-semibold tracking-wide focus:border-ink focus:outline-none"
            aria-label="Numéro de suivi"
            autoCapitalize="characters"
          />
        </div>
        <Button type="submit" size="lg" variant="dark" loading={loading}>
          Suivre
        </Button>
      </form>

      {error && (
        <div className="mt-4">
          <InlineAlert tone="danger">{error}</InlineAlert>
        </div>
      )}

      {result && !result.found && (
        <div className="card mt-6">
          <EmptyState icon={<PackageSearch className="h-5 w-5" />} title="Aucune commande trouvée" description="Vérifiez le numéro saisi. Connecté à votre compte, vous retrouvez toutes vos commandes dans votre espace." />
        </div>
      )}

      {result?.found && (
        <div className="mt-6 space-y-4">
          <div className="card p-5 sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-[12px] text-muted">Commande</p>
                <p className="num font-display text-xl font-semibold">{result.tracking_code}</p>
                <p className="mt-1 text-[13px] text-muted">
                  Passée le {formatDate(result.created_at)} · {result.items_count} article{(result.items_count || 0) > 1 ? 's' : ''}
                </p>
              </div>
              <StatusBadge map={ORDER_STATUS} status={result.order_status} />
            </div>
            <p className="mt-4 text-[14px] text-muted">{statusMeta(ORDER_STATUS, result.order_status).hint}</p>
            {result.estimated_delivery_date && (
              <p className="mt-2 text-[14px]">
                Livraison estimée : <span className="font-semibold">{formatDate(result.estimated_delivery_date)}</span>
              </p>
            )}
            <div className="mt-6">
              <Stepper steps={ORDER_STEPS} current={step} stopped={result.order_status === 'cancelled'} />
            </div>
          </div>
          {result.events && result.events.length > 0 && (
            <div className="card p-5 sm:p-6">
              <h2 className="mb-4 text-base font-semibold">Historique</h2>
              <Timeline
                items={[...result.events].reverse().map((ev, i) => ({
                  id: `${ev.at}-${i}`,
                  title: statusMeta(ORDER_STATUS, ev.status).label,
                  meta: `${formatDateTime(ev.at)}${ev.location ? ` · ${ev.location}` : ''}`,
                  body: ev.description,
                  active: i === 0
                }))}
              />
            </div>
          )}
        </div>
      )}

      {user && myOrders.data && myOrders.data.length > 0 && (
        <div className="card mt-8 p-5 sm:p-6">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-base font-semibold">Mes dernières commandes</h2>
            <Link to="/compte/commandes" className="text-[13px] font-semibold text-ink hover:text-brand">
              Tout voir
            </Link>
          </div>
          <ul className="divide-y divide-line">
            {myOrders.data.map(o => (
              <li key={o.id}>
                <Link to={`/compte/commandes/${o.id}`} className="flex items-center justify-between gap-3 py-3">
                  <div className="min-w-0">
                    <p className="num text-sm font-semibold">{o.trackingCode}</p>
                    <p className="truncate text-[12.5px] text-muted">
                      {formatDate(o.createdAt)} · {formatXOF(o.totalXOF)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge map={ORDER_STATUS} status={o.orderStatus} />
                    <ArrowRight className="h-4 w-4 text-subtle" />
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
