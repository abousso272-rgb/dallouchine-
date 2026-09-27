import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Home, Lock, MapPin, Plane, Ship } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useAsync } from '../../lib/hooks';
import { listHubs } from '../../services/catalog';
import { createOrderFromCart, estimateShipping, type ShippingEstimate } from '../../services/orders';
import { startPayment } from '../../lib/api';
import { friendlyError } from '../../lib/db';
import { formatXOF } from '../../lib/format';
import { Button } from '../../components/ui/Button';
import { ChoiceCards, Input, Select, Textarea } from '../../components/ui/Field';
import { InlineAlert, PageLoader, EmptyState } from '../../components/ui/States';
import { PaymentLogos } from '../../components/commerce/PaymentLogos';
import { AuthForm } from '../../components/auth/AuthForm';
import { Link } from '../../components/ui/Link';

export default function CheckoutPage() {
  const { user, authLoading, cart, cartTotal, clearCart, toast, navigate } = useApp();
  const hubs = useAsync(() => listHubs(), []);
  const idempotencyKey = useRef(typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`);

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [city, setCity] = useState('Dakar');
  const [delivery, setDelivery] = useState<'hub_pickup' | 'home_delivery'>('hub_pickup');
  const [hubId, setHubId] = useState('');
  const [street, setStreet] = useState('');
  const [district, setDistrict] = useState('');
  const [instructions, setInstructions] = useState('');
  const [transport, setTransport] = useState<'air' | 'sea'>('air');
  const [notes, setNotes] = useState('');
  const [estimates, setEstimates] = useState<{ air: ShippingEstimate | null; sea: ShippingEstimate | null }>({ air: null, sea: null });
  const [estimating, setEstimating] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    setName(n => n || user.fullName);
    setPhone(p => p || user.phone);
    setEmail(e => e || user.email);
    setCity(c => (c === 'Dakar' && user.city ? user.city : c));
  }, [user]);

  useEffect(() => {
    if (hubs.data?.length && !hubId) setHubId(hubs.data[0].id);
  }, [hubs.data, hubId]);

  const items = useMemo(() => cart.map(l => ({ product_id: l.productId, quantity: l.quantity })), [cart]);
  const itemsKey = JSON.stringify(items);

  useEffect(() => {
    let active = true;
    if (!items.length) return;
    setEstimating(true);
    Promise.all([estimateShipping(items, 'air', delivery), estimateShipping(items, 'sea', delivery)])
      .then(([air, sea]) => active && setEstimates({ air, sea }))
      .finally(() => active && setEstimating(false));
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [itemsKey, delivery]);

  if (authLoading) return <PageLoader />;

  if (!user) {
    return (
      <div className="container-page max-w-md py-10">
        <h1 className="text-2xl font-semibold">Finaliser ma commande</h1>
        <p className="mb-6 mt-1 text-sm text-muted">Connectez-vous ou créez votre compte pour payer et suivre votre commande.</p>
        <div className="card p-5 sm:p-6">
          <AuthForm initialMode="register" compact />
        </div>
      </div>
    );
  }

  if (!cart.length) {
    return (
      <div className="container-page max-w-2xl py-12">
        <div className="card">
          <EmptyState title="Votre panier est vide" description="Ajoutez des produits avant de passer commande." action={<Button to="/catalogue">Voir le catalogue</Button>} />
        </div>
      </div>
    );
  }

  const shipping = estimates[transport]?.customer_shipping_fee ?? null;
  const total = cartTotal + (shipping || 0);

  function validate() {
    const e: Record<string, string> = {};
    if (name.trim().length < 2) e.name = 'Nom requis.';
    if (phone.replace(/\D/g, '').length < 8) e.phone = 'Téléphone requis.';
    if (email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) e.email = 'Email invalide.';
    if (delivery === 'hub_pickup' && !hubId) e.hub = 'Choisissez un point de retrait.';
    if (delivery === 'home_delivery' && street.trim().length < 3) e.street = 'Adresse requise.';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function submit(ev: React.FormEvent) {
    ev.preventDefault();
    setSubmitError(null);
    if (!validate()) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    setSubmitting(true);
    try {
      const order = await createOrderFromCart({
        items,
        deliveryType: delivery,
        hubId: delivery === 'hub_pickup' ? hubId : null,
        address: delivery === 'home_delivery' ? { street, district, city, instructions } : null,
        name,
        phone,
        email: email || user!.email,
        city,
        notes,
        transportMode: transport,
        idempotencyKey: idempotencyKey.current
      });
      await clearCart();
      try {
        await startPayment(order.id);
      } catch (payErr) {
        toast('error', 'Paiement non démarré', friendlyError(payErr));
        navigate(`/compte/commandes/${order.id}`);
      }
    } catch (err) {
      setSubmitError(friendlyError(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="container-page py-8 sm:py-10">
      <h1 className="text-[28px] font-semibold sm:text-4xl">Finaliser ma commande</h1>
      <p className="mt-1 text-[15px] text-muted">Vérifiez vos informations puis payez en toute sécurité.</p>

      <form onSubmit={submit} className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[1fr_380px]" noValidate>
        <div className="space-y-4">
          <section className="card space-y-4 p-5 sm:p-6">
            <h2 className="flex items-center gap-2 text-base font-semibold">
              <span className="num flex h-6 w-6 items-center justify-center rounded-full bg-ink text-[11px] font-bold text-white">1</span> Vos coordonnées
            </h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input label="Nom complet" required value={name} onChange={e => setName(e.target.value)} error={errors.name} autoComplete="name" />
              <Input label="Téléphone" required type="tel" value={phone} onChange={e => setPhone(e.target.value)} error={errors.phone} autoComplete="tel" />
              <Input label="Email" type="email" value={email} onChange={e => setEmail(e.target.value)} error={errors.email} hint="Pour recevoir la confirmation de paiement." autoComplete="email" />
              <Input label="Ville" value={city} onChange={e => setCity(e.target.value)} autoComplete="address-level2" />
            </div>
          </section>

          <section className="card space-y-4 p-5 sm:p-6">
            <h2 className="flex items-center gap-2 text-base font-semibold">
              <span className="num flex h-6 w-6 items-center justify-center rounded-full bg-ink text-[11px] font-bold text-white">2</span> Livraison
            </h2>
            <ChoiceCards
              value={delivery}
              onChange={setDelivery}
              options={[
                { value: 'hub_pickup', title: 'Retrait en point relais', description: 'Récupérez votre colis dans un hub DALUCHE à Dakar.', icon: <MapPin className="h-5 w-5" /> },
                { value: 'home_delivery', title: 'Livraison à domicile', description: 'Livraison à l’adresse de votre choix (frais inclus au calcul).', icon: <Home className="h-5 w-5" /> }
              ]}
            />
            {delivery === 'hub_pickup' ? (
              hubs.data && hubs.data.length > 0 ? (
                <Select
                  label="Point de retrait"
                  value={hubId}
                  onChange={e => setHubId(e.target.value)}
                  error={errors.hub}
                  options={hubs.data.map(h => ({ value: h.id, label: `${h.name}${h.district ? ` — ${h.district}` : ''}` }))}
                />
              ) : (
                <InlineAlert tone="warning">Aucun point de retrait disponible pour le moment : choisissez la livraison à domicile.</InlineAlert>
              )
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Input label="Adresse" required value={street} onChange={e => setStreet(e.target.value)} error={errors.street} wrapperClassName="sm:col-span-2" autoComplete="street-address" />
                <Input label="Quartier" value={district} onChange={e => setDistrict(e.target.value)} />
                <Input label="Indications" value={instructions} onChange={e => setInstructions(e.target.value)} placeholder="Repère, étage…" />
              </div>
            )}
          </section>

          <section className="card space-y-4 p-5 sm:p-6">
            <h2 className="flex items-center gap-2 text-base font-semibold">
              <span className="num flex h-6 w-6 items-center justify-center rounded-full bg-ink text-[11px] font-bold text-white">3</span> Mode de transport
            </h2>
            <ChoiceCards
              value={transport}
              onChange={setTransport}
              options={[
                {
                  value: 'air',
                  title: 'Fret aérien',
                  description: estimates.air?.estimated_delivery_days ? `Environ ${estimates.air.estimated_delivery_days}` : 'Le plus rapide',
                  icon: <Plane className="h-5 w-5" />,
                  aside: estimating ? '…' : estimates.air ? formatXOF(estimates.air.customer_shipping_fee) : '—'
                },
                {
                  value: 'sea',
                  title: 'Fret maritime',
                  description: estimates.sea?.estimated_delivery_days ? `Environ ${estimates.sea.estimated_delivery_days}` : 'Pour les colis lourds',
                  icon: <Ship className="h-5 w-5" />,
                  aside: estimating ? '…' : estimates.sea ? formatXOF(estimates.sea.customer_shipping_fee) : '—'
                }
              ]}
            />
            <Textarea label="Note pour notre équipe (optionnel)" value={notes} onChange={e => setNotes(e.target.value)} rows={2} />
          </section>
        </div>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="card p-5 sm:p-6">
            <h2 className="text-base font-semibold">Votre commande</h2>
            <ul className="mt-4 max-h-64 space-y-3 overflow-y-auto pr-1">
              {cart.map(l => (
                <li key={l.key} className="flex gap-3">
                  <img src={l.product.images[0]} alt="" className="h-12 w-12 shrink-0 rounded-lg object-cover" />
                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-1 text-[13.5px] font-semibold">{l.product.name}</p>
                    <p className="num text-[12.5px] text-muted">
                      {l.quantity} × {formatXOF(l.unitPriceXOF)}
                    </p>
                  </div>
                  <p className="num text-[13.5px] font-semibold">{formatXOF(l.quantity * l.unitPriceXOF)}</p>
                </li>
              ))}
            </ul>
            <dl className="mt-5 space-y-2.5 border-t border-line pt-4 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted">Produits</dt>
                <dd className="num font-semibold">{formatXOF(cartTotal)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted">Transport ({transport === 'air' ? 'aérien' : 'maritime'})</dt>
                <dd className="num font-semibold">{estimating ? '…' : shipping !== null ? formatXOF(shipping) : 'À confirmer'}</dd>
              </div>
              <div className="flex items-baseline justify-between border-t border-line pt-3">
                <dt className="font-semibold">Total estimé</dt>
                <dd className="num font-display text-2xl font-semibold">{formatXOF(total)}</dd>
              </div>
            </dl>
            <p className="mt-2 text-[12px] leading-relaxed text-muted">Le montant définitif est recalculé par nos serveurs à la validation et affiché sur la page de paiement.</p>
            {submitError && (
              <div className="mt-4">
                <InlineAlert tone="danger">{submitError}</InlineAlert>
              </div>
            )}
            <Button type="submit" block size="lg" className="mt-5" loading={submitting} icon={<Lock className="h-4 w-4" />}>
              Payer {formatXOF(total)}
            </Button>
            <PaymentLogos className="mt-4 justify-center" />
            <p className="mt-3 text-center text-[12px] text-muted">
              Paiement sécurisé par GeniusPay. <Link to="/panier" className="font-semibold text-ink hover:underline">Modifier le panier</Link>
            </p>
          </div>
        </aside>
      </form>
    </div>
  );
}
