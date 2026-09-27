import React, { useState } from 'react';
import { CreditCard, MapPin, Package, Truck } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useAsync } from '../../lib/hooks';
import { getOrder } from '../../services/orders';
import { listMyParticipations, cancelMyParticipation } from '../../services/groupages';
import { listHubs } from '../../services/catalog';
import { startPayment } from '../../lib/api';
import { friendlyError } from '../../lib/db';
import { formatDate, formatDateTime, formatXOF } from '../../lib/format';
import { ORDER_STATUS, ORDER_STEPS, PAYMENT_STATUS, TRANSPORT_LABEL, currentStepIndex, statusMeta } from '../../lib/status';
import { PageHeader, Card, CardTitle, DefinitionList } from '../../components/ui/Layout';
import { StatusBadge } from '../../components/ui/Badge';
import { Stepper, Timeline } from '../../components/ui/Stepper';
import { Button } from '../../components/ui/Button';
import { EmptyState, ErrorState, InlineAlert, PageLoader } from '../../components/ui/States';
import { MessageThread } from '../../components/requests/MessageThread';
import { PaymentLogos } from '../../components/commerce/PaymentLogos';

export default function OrderDetailPage({ id }: { id: string }) {
  const { user, toast } = useApp();
  const { data: order, loading, error, reload } = useAsync(() => getOrder(id), [id]);
  const participation = useAsync(async () => (order?.kind === 'groupage' ? (await listMyParticipations(user!.id)).find(p => p.orderId === order.id) || null : null), [order?.id]);
  const hubs = useAsync(() => listHubs(), []);
  const [busy, setBusy] = useState<'pay' | 'cancel' | null>(null);

  if (loading) return <PageLoader />;
  if (error) return <ErrorState message={error} onRetry={reload} />;
  if (!order) return <EmptyState icon={<Package className="h-5 w-5" />} title="Commande introuvable" action={<Button to="/compte/commandes">Mes commandes</Button>} />;

  const unpaid = order.orderStatus === 'pending_payment' && !['paid', 'cancelled'].includes(order.paymentStatus);
  const step = order.orderStatus === 'cancelled' ? 0 : currentStepIndex(ORDER_STEPS, order.orderStatus, ['delivered']);
  const hub = hubs.data?.find(h => h.id === order.hubId);

  async function pay() {
    setBusy('pay');
    try {
      await startPayment(order!.id);
    } catch (err) {
      toast('error', 'Paiement non démarré', friendlyError(err));
      setBusy(null);
    }
  }

  async function cancel() {
    if (!participation.data) return;
    if (!window.confirm('Annuler votre participation à ce groupage ? Votre place sera libérée.')) return;
    setBusy('cancel');
    try {
      await cancelMyParticipation(participation.data.id);
      toast('info', 'Participation annulée');
      reload();
    } catch (err) {
      toast('error', 'Annulation impossible', friendlyError(err));
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="space-y-5">
      <PageHeader
        back={{ to: '/compte/commandes', label: 'Mes commandes' }}
        eyebrow={`Commande du ${formatDate(order.createdAt)}`}
        title={<span className="num">{order.trackingCode}</span>}
        actions={<StatusBadge map={ORDER_STATUS} status={order.orderStatus} />}
      />

      {unpaid && (
        <Card className="border-brand/30 bg-brand-50/40">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-semibold">Paiement en attente</p>
              <p className="text-sm text-muted">Réglez {formatXOF(order.totalXOF)} pour lancer votre commande.</p>
              <PaymentLogos className="mt-3" />
            </div>
            <div className="flex flex-col gap-2 sm:items-end">
              <Button size="lg" onClick={pay} loading={busy === 'pay'} icon={<CreditCard className="h-4 w-4" />}>
                Payer {formatXOF(order.totalXOF)}
              </Button>
              {participation.data && ['reserved', 'confirmed'].includes(participation.data.status) && (
                <button type="button" onClick={cancel} disabled={busy !== null} className="text-[13px] font-semibold text-muted hover:text-red-700">
                  Annuler ma participation
                </button>
              )}
            </div>
          </div>
        </Card>
      )}

      {order.orderStatus !== 'cancelled' ? (
        <Card>
          <CardTitle>Suivi</CardTitle>
          <Stepper steps={ORDER_STEPS} current={step} />
          <p className="mt-5 text-sm text-muted">{statusMeta(ORDER_STATUS, order.orderStatus).hint}</p>
          {(order.estimatedDeliveryDate || order.carrierReference) && (
            <div className="mt-4 flex flex-wrap gap-x-6 gap-y-1 text-sm">
              {order.estimatedDeliveryDate && (
                <p>
                  <span className="text-muted">Livraison estimée : </span>
                  <span className="font-semibold">{formatDate(order.estimatedDeliveryDate)}</span>
                </p>
              )}
              {order.carrierReference && (
                <p>
                  <span className="text-muted">Référence transport : </span>
                  <span className="num font-semibold">{order.carrierReference}</span>
                </p>
              )}
            </div>
          )}
        </Card>
      ) : (
        <InlineAlert tone="warning" title="Commande annulée">
          Cette commande a été annulée. Pour toute question, écrivez-nous dans le fil ci-dessous.
        </InlineAlert>
      )}

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1.3fr_1fr]">
        <Card>
          <CardTitle>Articles</CardTitle>
          <ul className="divide-y divide-line">
            {order.items.map(i => (
              <li key={i.id} className="flex gap-3 py-3">
                <span className="h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-paper-2">{i.image && <img src={i.image} alt="" className="h-full w-full object-cover" />}</span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold">{i.name}</p>
                  <p className="num text-[13px] text-muted">
                    {i.quantity} × {formatXOF(i.unitPriceXOF)}
                  </p>
                </div>
                <p className="num text-sm font-semibold">{formatXOF(i.subtotalXOF)}</p>
              </li>
            ))}
          </ul>
          <dl className="mt-3 space-y-1.5 border-t border-line pt-3 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted">Sous-total</dt>
              <dd className="num">{formatXOF(order.subtotalXOF)}</dd>
            </div>
            {order.shippingFeeXOF > 0 && (
              <div className="flex justify-between">
                <dt className="text-muted">Transport</dt>
                <dd className="num">{formatXOF(order.shippingFeeXOF)}</dd>
              </div>
            )}
            {order.discountXOF > 0 && (
              <div className="flex justify-between">
                <dt className="text-muted">Remise</dt>
                <dd className="num">−{formatXOF(order.discountXOF)}</dd>
              </div>
            )}
            <div className="flex items-baseline justify-between pt-1.5">
              <dt className="font-semibold">Total</dt>
              <dd className="num font-display text-xl font-semibold">{formatXOF(order.totalXOF)}</dd>
            </div>
            <div className="flex items-center justify-between pt-1">
              <dt className="text-muted">Paiement</dt>
              <dd>
                <StatusBadge map={PAYMENT_STATUS} status={order.paymentStatus} />
              </dd>
            </div>
          </dl>
        </Card>

        <Card>
          <CardTitle>Livraison</CardTitle>
          <div className="mb-4 flex items-start gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-paper-2">{order.deliveryType === 'home_delivery' ? <Truck className="h-4 w-4" /> : <MapPin className="h-4 w-4" />}</span>
            <div className="text-sm">
              <p className="font-semibold">{order.deliveryType === 'home_delivery' ? 'Livraison à domicile' : 'Retrait en point relais'}</p>
              <p className="text-muted">
                {order.deliveryType === 'home_delivery'
                  ? [order.deliveryAddress?.street, order.deliveryAddress?.district, order.deliveryAddress?.city].filter(Boolean).join(', ') || order.customerCity
                  : hub
                    ? `${hub.name} — ${hub.address}`
                    : 'Hub DALUCHE, Dakar'}
              </p>
            </div>
          </div>
          <DefinitionList
            items={[
              { label: 'Destinataire', value: order.customerName },
              { label: 'Téléphone', value: order.customerPhone },
              { label: 'Transport', value: order.transportMode ? TRANSPORT_LABEL[order.transportMode] || order.transportMode : null },
              { label: 'Payée le', value: order.paidAt ? formatDateTime(order.paidAt) : null }
            ]}
          />
        </Card>
      </div>

      {order.events.length > 0 && (
        <Card>
          <CardTitle>Historique</CardTitle>
          <Timeline
            items={[...order.events].reverse().map((e, i) => ({
              id: e.id,
              title: statusMeta(ORDER_STATUS, e.status).label,
              meta: `${formatDateTime(e.createdAt)}${e.location ? ` · ${e.location}` : ''}`,
              body: e.description,
              active: i === 0
            }))}
          />
        </Card>
      )}

      <MessageThread type="order" threadId={order.id} viewer="client" title="Une question sur cette commande ?" />
    </div>
  );
}
