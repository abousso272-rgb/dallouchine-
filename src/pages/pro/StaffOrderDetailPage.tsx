import React, { useEffect, useState } from 'react';
import { Package, Plus, Trash2 } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useAsync } from '../../lib/hooks';
import { addOrderCost, deleteOrderCost, getOrder, listOrderCosts, staffUpdateOrder } from '../../services/orders';
import { listHubs } from '../../services/catalog';
import { friendlyError } from '../../lib/db';
import { formatDate, formatDateTime, formatXOF, percent } from '../../lib/format';
import { COST_TYPE_LABEL, ORDER_STATUS, ORDER_STATUS_FLOW, PAYMENT_STATUS, TRANSPORT_LABEL, statusMeta } from '../../lib/status';
import { PageHeader, Card, CardTitle, DefinitionList } from '../../components/ui/Layout';
import { StatusBadge } from '../../components/ui/Badge';
import { Timeline } from '../../components/ui/Stepper';
import { Button } from '../../components/ui/Button';
import { Input, Select, Textarea } from '../../components/ui/Field';
import { EmptyState, ErrorState, InlineAlert, PageLoader } from '../../components/ui/States';
import { MessageThread } from '../../components/requests/MessageThread';
import { Link } from '../../components/ui/Link';
import { OrderPaymentCard } from '../../components/pro/OrderPaymentCard';

const FULFILLMENT = ['supplier_ordered', 'preparing', 'shipped', 'in_transit', 'arrived', 'ready_for_delivery', 'delivered'];

export default function StaffOrderDetailPage({ id }: { id: string }) {
  const { user, toast } = useApp();
  const isAdmin = user?.role === 'admin';
  const canCosts = isAdmin || user?.role === 'transitaire';
  const { data: order, loading, error, reload } = useAsync(() => getOrder(id), [id]);
  const costs = useAsync(() => (canCosts ? listOrderCosts(id) : Promise.resolve([])), [id, canCosts]);
  const hubs = useAsync(() => listHubs(), []);

  const [status, setStatus] = useState('');
  const [note, setNote] = useState('');
  const [location, setLocation] = useState('');
  const [carrierRef, setCarrierRef] = useState('');
  const [eta, setEta] = useState('');
  const [transport, setTransport] = useState('');
  const [logNotes, setLogNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const [costType, setCostType] = useState('supplier');
  const [costAmount, setCostAmount] = useState('');
  const [costDesc, setCostDesc] = useState('');
  const [addingCost, setAddingCost] = useState(false);

  useEffect(() => {
    if (!order) return;
    setStatus(order.orderStatus);
    setCarrierRef(order.carrierReference || '');
    setEta(order.estimatedDeliveryDate || '');
    setTransport(order.transportMode || '');
    setLogNotes(order.logisticsNotes || '');
  }, [order]);

  if (loading) return <PageLoader />;
  if (error) return <ErrorState message={error} onRetry={reload} />;
  if (!order) return <EmptyState icon={<Package className="h-5 w-5" />} title="Commande introuvable ou hors de votre périmètre" action={<Button to="/espace-pro/commandes">Retour</Button>} />;

  const allowedStatuses = isAdmin ? [...ORDER_STATUS_FLOW, 'cancelled'] : [order.orderStatus, ...FULFILLMENT.filter(s => s !== order.orderStatus)];
  const paid = order.paymentStatus === 'paid';
  const totalCosts = (costs.data || []).reduce((s, c) => s + c.amountXOF, 0);
  const margin = order.totalXOF - totalCosts;
  const hub = hubs.data?.find(h => h.id === order.hubId);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (status === 'cancelled' && !window.confirm('Annuler cette commande ? Les places de groupage non payées seront libérées.')) return;
    setSaving(true);
    try {
      await staffUpdateOrder(order!.id, {
        status: status !== order!.orderStatus ? status : null,
        note,
        location,
        carrierReference: carrierRef,
        logisticsNotes: logNotes,
        estimatedDeliveryDate: eta || null,
        transportMode: transport || null
      });
      toast('success', 'Commande mise à jour', status !== order!.orderStatus ? 'Le client a été notifié du nouveau statut.' : undefined);
      setNote('');
      reload();
    } catch (err) {
      toast('error', 'Mise à jour impossible', friendlyError(err));
    } finally {
      setSaving(false);
    }
  }

  async function addCost(e: React.FormEvent) {
    e.preventDefault();
    const amount = Number(costAmount);
    if (!amount || amount < 0) return toast('error', 'Montant invalide');
    setAddingCost(true);
    try {
      await addOrderCost(order!.id, costType, amount, costDesc);
      setCostAmount('');
      setCostDesc('');
      costs.reload();
    } catch (err) {
      toast('error', 'Coût non enregistré', friendlyError(err));
    } finally {
      setAddingCost(false);
    }
  }

  async function removeCost(costId: string) {
    if (!window.confirm('Supprimer ce coût ?')) return;
    try {
      await deleteOrderCost(costId);
      costs.reload();
    } catch (err) {
      toast('error', 'Suppression impossible', friendlyError(err));
    }
  }

  return (
    <div className="space-y-5">
      <PageHeader
        back={{ to: '/espace-pro/commandes', label: 'Commandes' }}
        eyebrow={`Créée le ${formatDateTime(order.createdAt)}`}
        title={<span className="num">{order.trackingCode}</span>}
        actions={
          <div className="flex gap-2">
            <StatusBadge map={PAYMENT_STATUS} status={order.paymentStatus} />
            <StatusBadge map={ORDER_STATUS} status={order.orderStatus} />
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1.25fr_1fr]">
        <div className="space-y-5">
          <Card>
            <CardTitle>Articles</CardTitle>
            <ul className="divide-y divide-line">
              {order.items.map(i => (
                <li key={i.id} className="flex gap-3 py-3">
                  <span className="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-paper-2">{i.image && <img src={i.image} alt="" className="h-full w-full object-cover" />}</span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold">{i.name}</p>
                    <p className="num text-[12.5px] text-muted">
                      {i.quantity} × {formatXOF(i.unitPriceXOF)}
                      {i.groupageId && (
                        <>
                          {' · '}
                          <Link to={`/espace-pro/groupages/${i.groupageId}`} className="font-semibold text-ink hover:text-brand">
                            groupage
                          </Link>
                        </>
                      )}
                    </p>
                  </div>
                  <p className="num text-sm font-semibold">{formatXOF(i.subtotalXOF)}</p>
                </li>
              ))}
            </ul>
            <dl className="mt-3 space-y-1.5 border-t border-line pt-3 text-sm">
              <Row label="Sous-total" value={formatXOF(order.subtotalXOF)} />
              <Row label="Transport facturé" value={formatXOF(order.shippingFeeXOF)} />
              {order.discountXOF > 0 && <Row label="Remise" value={`−${formatXOF(order.discountXOF)}`} />}
              <div className="flex items-baseline justify-between pt-1">
                <dt className="font-semibold">Total client</dt>
                <dd className="num font-display text-xl font-semibold">{formatXOF(order.totalXOF)}</dd>
              </div>
            </dl>
          </Card>

          <Card>
            <CardTitle>Mettre à jour la commande</CardTitle>
            {!paid && !isAdmin && <InlineAlert tone="warning">Commande non payée : le traitement logistique sera possible après confirmation du paiement.</InlineAlert>}
            <form onSubmit={save} className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Select
                label="Statut"
                value={status}
                onChange={e => setStatus(e.target.value)}
                options={allowedStatuses.filter((v, i, a) => a.indexOf(v) === i).map(s => ({ value: s, label: statusMeta(ORDER_STATUS, s).label }))}
                disabled={!paid && !isAdmin}
              />
              <Input label="Lieu de l’étape" value={location} onChange={e => setLocation(e.target.value)} placeholder="Guangzhou, Port de Dakar…" />
              <Textarea label="Message au client (optionnel)" value={note} onChange={e => setNote(e.target.value)} rows={2} wrapperClassName="sm:col-span-2" placeholder="Visible dans le suivi et la notification du client" />
              <Input label="Référence transport" value={carrierRef} onChange={e => setCarrierRef(e.target.value)} placeholder="N° conteneur, LTA, BL…" />
              <Input label="Livraison estimée" type="date" value={eta} onChange={e => setEta(e.target.value)} />
              <Select label="Mode de transport" value={transport} onChange={e => setTransport(e.target.value)} placeholder="Non défini" options={Object.entries(TRANSPORT_LABEL).map(([value, label]) => ({ value, label }))} />
              <Textarea label="Notes logistiques (internes)" value={logNotes} onChange={e => setLogNotes(e.target.value)} rows={2} wrapperClassName="sm:col-span-2" />
              <div className="sm:col-span-2">
                <Button type="submit" loading={saving}>
                  Enregistrer
                </Button>
              </div>
            </form>
          </Card>

          {canCosts && (
            <Card>
              <CardTitle>Coûts & marge</CardTitle>
              {(costs.data || []).length > 0 && (
                <ul className="mb-4 divide-y divide-line text-sm">
                  {(costs.data || []).map(c => (
                    <li key={c.id} className="flex items-center justify-between gap-3 py-2.5">
                      <div className="min-w-0">
                        <p className="font-semibold">{COST_TYPE_LABEL[c.type] || c.type}</p>
                        {c.description && <p className="truncate text-[12.5px] text-muted">{c.description}</p>}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="num font-semibold">{formatXOF(c.amountXOF)}</span>
                        {isAdmin && (
                          <button type="button" onClick={() => removeCost(c.id)} className="rounded-lg p-1.5 text-subtle hover:bg-red-50 hover:text-red-700" aria-label="Supprimer le coût">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
              <div className="grid grid-cols-3 gap-2 rounded-2xl bg-paper p-3 text-center text-[12.5px]">
                <div>
                  <p className="text-muted">Encaissé</p>
                  <p className="num font-semibold">{paid ? formatXOF(order.totalXOF) : '—'}</p>
                </div>
                <div>
                  <p className="text-muted">Coûts</p>
                  <p className="num font-semibold">{formatXOF(totalCosts)}</p>
                </div>
                <div>
                  <p className="text-muted">Marge</p>
                  <p className={`num font-semibold ${margin < 0 ? 'text-red-700' : 'text-jade'}`}>
                    {formatXOF(margin)} {order.totalXOF > 0 && <span className="text-muted">({percent(Math.max(margin, 0), order.totalXOF)} %)</span>}
                  </p>
                </div>
              </div>
              <form onSubmit={addCost} className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-[160px_150px_1fr_auto] sm:items-end">
                <Select label="Type" value={costType} onChange={e => setCostType(e.target.value)} options={Object.entries(COST_TYPE_LABEL).filter(([k]) => k !== 'payment_fee').map(([value, label]) => ({ value, label }))} />
                <Input label="Montant" inputMode="numeric" value={costAmount} onChange={e => setCostAmount(e.target.value.replace(/\D/g, ''))} suffix="F" />
                <Input label="Détail" value={costDesc} onChange={e => setCostDesc(e.target.value)} placeholder="Fournisseur, facture…" />
                <Button type="submit" variant="dark" loading={addingCost} icon={<Plus className="h-4 w-4" />}>
                  Ajouter
                </Button>
              </form>
            </Card>
          )}
        </div>

        <div className="space-y-5">
          {(isAdmin || user?.role === 'transitaire') && <OrderPaymentCard order={order} onChanged={reload} />}
          <Card>
            <CardTitle>Client & livraison</CardTitle>
            <DefinitionList
              items={[
                { label: 'Client', value: order.customerName },
                { label: 'Téléphone', value: order.customerPhone ? <a href={`tel:${order.customerPhone}`} className="hover:text-brand">{order.customerPhone}</a> : null },
                { label: 'Email', value: order.customerEmail },
                { label: 'Ville', value: order.customerCity },
                { label: 'Livraison', value: order.deliveryType === 'home_delivery' ? 'À domicile' : `Retrait${hub ? ` — ${hub.name}` : ''}` },
                {
                  label: 'Adresse',
                  value: order.deliveryType === 'home_delivery' ? [order.deliveryAddress?.street, order.deliveryAddress?.district, order.deliveryAddress?.city].filter(Boolean).join(', ') : null
                },
                { label: 'Note client', value: order.notes },
                { label: 'Payée le', value: order.paidAt ? formatDateTime(order.paidAt) : null },
                { label: 'Livraison estimée', value: order.estimatedDeliveryDate ? formatDate(order.estimatedDeliveryDate) : null }
              ]}
            />
          </Card>
          <Card>
            <CardTitle>Historique</CardTitle>
            {order.events.length ? (
              <Timeline
                items={[...order.events].reverse().map((e, i) => ({
                  id: e.id,
                  title: statusMeta(ORDER_STATUS, e.status).label,
                  meta: `${formatDateTime(e.createdAt)}${e.location ? ` · ${e.location}` : ''}`,
                  body: e.description,
                  active: i === 0
                }))}
              />
            ) : (
              <p className="text-sm text-muted">Aucun événement.</p>
            )}
          </Card>
          <MessageThread type="order" threadId={order.id} viewer="staff" title="Échanges avec le client" emptyText="Aucun message sur cette commande." />
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <dt className="text-muted">{label}</dt>
      <dd className="num">{value}</dd>
    </div>
  );
}
