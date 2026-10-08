import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Check, Clock, Home, Lock, MapPin, Pencil, Plane, Ship, User } from 'lucide-react';
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
  const hubs = useAsync(() => listHubs(), [], { cacheKey: 'hubs', maxAge: 600000 });
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
  const [editContact, setEditContact] = useState(false);

  // Dernier choix de livraison mémorisé sur cet appareil (confort uniquement)
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('dallouchine:checkout') || localStorage.getItem('daluche:checkout') || '{}');
      if (saved.delivery === 'hub_pickup' || saved.delivery === 'home_delivery') setDelivery(saved.delivery);
      if (saved.transport === 'air' || saved.transport === 'sea') setTransport(saved.transport);
      if (typeof saved.hubId === 'string') setHubId(saved.hubId);
      if (typeof saved.street === 'string') setStreet(saved.street);
      if (typeof saved.district === 'string') setDistrict(saved.district);
    } catch {
      /* stockage indisponible : valeurs par défaut */
    }
  }, []);

  useEffect(() => {
    if (!user) return;
    setName(n => n || user.fullName);
    setPhone(p => p || user.phone);
    setEmail(e => e || user.email);
    setCity(c => (c === 'Dakar' && user.city ? user.city : c));
  }, [user]);

  useEffect(() => {
    if (hubs.data?.length && (!hubId || !hubs.data.some(h => h.id === hubId))) setHubId(hubs.data[0].id);
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
        <h1 className="text-2xl font-bold">Finaliser ma commande</h1>
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

  const contactComplete = name.trim().length >= 2 && phone.replace(/\D/g, '').length >= 8;
  const showContactForm = editContact || !contactComplete || Boolean(errors.name || errors.phone || errors.email);
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
      try {
        localStorage.setItem('dallouchine:checkout', JSON.stringify({ delivery, transport, hubId, street, district }));
      } catch {
        /* ignoré */
      }
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

  const stepTitle = (n: number, title: string, done?: boolean) => (
    <h2 className="flex items-center gap-2.5 text-[16px] font-bold">
      <span className={`num flex h-7 w-7 items-center justify-center rounded-full text-[12px] font-bold text-white ${done ? 'bg-jade' : 'bg-brand-gradient'}`}>
        {done ? <Check className="h-3.5 w-3.5" /> : n}
      </span>
      {title}
    </h2>
  );

  return (
    <div className="container-page pb-40 pt-6 sm:pt-8 lg:pb-12">
      <CheckoutSteps current={1} />
      <h1 className="mt-6 text-[28px] font-bold sm:text-4xl">Finaliser ma commande</h1>
      <p className="mt-1 text-[15px] text-muted">Trois vérifications rapides, puis paiement sécurisé.</p>

      <form id="checkout-form" onSubmit={submit} className="mt-6 grid grid-cols-1 gap-5 lg:grid-cols-[1fr_400px] lg:gap-6" noValidate>
        <div className="space-y-4">
          <section className="surface space-y-4 p-5 sm:p-6">
            <div className="flex items-center justify-between gap-3">
              {stepTitle(1, 'Vos coordonnées', !showContactForm)}
              {!showContactForm && (
                <button type="button" onClick={() => setEditContact(true)} className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[13px] font-semibold text-brand-600 hover:bg-brand-50">
                  <Pencil className="h-3.5 w-3.5" /> Modifier
                </button>
              )}
            </div>
            {showContactForm ? (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Input label="Nom complet" required value={name} onChange={e => setName(e.target.value)} error={errors.name} autoComplete="name" />
                <Input label="Téléphone / WhatsApp" required type="tel" inputMode="tel" value={phone} onChange={e => setPhone(e.target.value)} error={errors.phone} autoComplete="tel" placeholder="77 123 45 67" />
                <Input label="Email" type="email" value={email} onChange={e => setEmail(e.target.value)} error={errors.email} hint="Pour recevoir la confirmation de paiement." autoComplete="email" />
                <Input label="Ville" value={city} onChange={e => setCity(e.target.value)} autoComplete="address-level2" />
              </div>
            ) : (
              <div className="flex items-center gap-3 rounded-2xl bg-paper px-4 py-3">
                <span className="icon-bubble h-10 w-10">
                  <User className="h-[18px] w-[18px]" />
                </span>
                <div className="min-w-0 text-[14px]">
                  <p className="truncate font-semibold">{name}</p>
                  <p className="truncate text-muted">
                    {phone}
                    {email ? ` · ${email}` : ''} · {city}
                  </p>
                </div>
              </div>
            )}
          </section>

          <section className="surface space-y-4 p-5 sm:p-6">
            {stepTitle(2, 'Livraison')}
            <ChoiceCards
              value={delivery}
              onChange={setDelivery}
              options={[
                { value: 'hub_pickup', title: 'Retrait en point relais', description: 'Gratuit, dans un hub Dallou Chine à Dakar.', icon: <MapPin className="h-5 w-5" /> },
                { value: 'home_delivery', title: 'Livraison à domicile', description: 'À l’adresse de votre choix (frais inclus au calcul).', icon: <Home className="h-5 w-5" /> }
              ]}
            />
            {delivery === 'hub_pickup' ? (
              hubs.loading && !hubs.data ? (
                <div className="skeleton h-20 rounded-2xl" />
              ) : hubs.data && hubs.data.length > 0 ? (
                <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2" role="radiogroup" aria-label="Point de retrait">
                  {hubs.data.map(h => {
                    const active = h.id === hubId;
                    return (
                      <button
                        key={h.id}
                        type="button"
                        role="radio"
                        aria-checked={active}
                        onClick={() => setHubId(h.id)}
                        className={`rounded-2xl border p-3.5 text-left transition-all ${active ? 'border-brand/60 bg-brand-50/60 ring-4 ring-brand/10' : 'border-line bg-white hover:border-brand/30'}`}
                      >
                        <span className="flex items-center justify-between gap-2">
                          <span className="text-[14px] font-bold">{h.name}</span>
                          <span className={`h-[18px] w-[18px] shrink-0 rounded-full border-2 ${active ? 'border-[5px] border-brand' : 'border-line-2'}`} aria-hidden />
                        </span>
                        <span className="mt-1 block text-[12.5px] text-muted">{[h.address, h.district, h.city].filter(Boolean).join(' · ')}</span>
                        {h.openingHours && (
                          <span className="mt-1 flex items-center gap-1 text-[12px] text-muted">
                            <Clock className="h-3 w-3" /> {h.openingHours}
                          </span>
                        )}
                      </button>
                    );
                  })}
                  {errors.hub && <p className="text-[12.5px] font-medium text-red-700">{errors.hub}</p>}
                </div>
              ) : (
                <InlineAlert tone="warning">Aucun point de retrait disponible pour le moment : choisissez la livraison à domicile.</InlineAlert>
              )
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Input label="Adresse" required value={street} onChange={e => setStreet(e.target.value)} error={errors.street} wrapperClassName="sm:col-span-2" autoComplete="street-address" placeholder="Rue, villa, immeuble…" />
                <Input label="Quartier" value={district} onChange={e => setDistrict(e.target.value)} placeholder="Ex. Mermoz" />
                <Input label="Indications" value={instructions} onChange={e => setInstructions(e.target.value)} placeholder="Repère, étage…" />
              </div>
            )}
          </section>

          <section className="surface space-y-4 p-5 sm:p-6">
            {stepTitle(3, 'Mode de transport')}
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
            <details className="group rounded-2xl bg-paper px-4 py-3">
              <summary className="cursor-pointer text-[13.5px] font-semibold text-muted group-open:text-ink">Ajouter une note pour notre équipe (optionnel)</summary>
              <Textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} wrapperClassName="mt-3" placeholder="Couleur préférée, emballage cadeau, horaires…" />
            </details>
          </section>
        </div>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="surface p-5 sm:p-6">
            <h2 className="text-base font-bold">Votre commande</h2>
            <ul className="mt-4 max-h-64 space-y-3 overflow-y-auto pr-1">
              {cart.map(l => (
                <li key={l.key} className="flex gap-3">
                  <img src={l.product.images[0]} alt="" className="h-12 w-12 shrink-0 rounded-xl object-cover" />
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
            <dl className="mt-5 space-y-2.5 border-t border-dashed border-line-2 pt-4 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted">Produits</dt>
                <dd className="num font-semibold">{formatXOF(cartTotal)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted">Transport ({transport === 'air' ? 'aérien' : 'maritime'})</dt>
                <dd className="num font-semibold">{estimating ? '…' : shipping !== null ? formatXOF(shipping) : 'À confirmer'}</dd>
              </div>
              <div className="flex items-baseline justify-between border-t border-line pt-3">
                <dt className="font-bold">Total</dt>
                <dd className="num font-display text-[26px] font-bold text-brand-600">{formatXOF(total)}</dd>
              </div>
            </dl>
            <p className="mt-2 text-[12px] leading-relaxed text-muted">Montant recalculé par nos serveurs à la validation : c’est lui qui s’affiche sur la page de paiement.</p>
            {submitError && (
              <div className="mt-4">
                <InlineAlert tone="danger">{submitError}</InlineAlert>
              </div>
            )}
            <Button type="submit" block size="lg" className="mt-5 hidden lg:inline-flex" loading={submitting} icon={<Lock className="h-4 w-4" />}>
              Payer {formatXOF(total)}
            </Button>
            <PaymentLogos className="mt-4 justify-center" />
            <p className="mt-3 text-center text-[12px] text-muted">
              Paiement 100 % sécurisé. <Link to="/panier" className="font-semibold text-ink hover:underline">Modifier le panier</Link>
            </p>
          </div>
        </aside>
      </form>

      {/* Barre de paiement mobile */}
      <div className="safe-bottom fixed inset-x-0 bottom-0 z-40 px-2 pb-2 lg:hidden">
        <div className="glass flex items-center gap-3 rounded-[22px] p-2.5 pl-4 shadow-[0_-4px_30px_-12px_rgb(120_60_20/0.4)]">
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">Total</p>
            <p className="num truncate font-display text-[19px] font-bold leading-tight text-brand-600">{formatXOF(total)}</p>
          </div>
          <Button type="submit" form="checkout-form" size="lg" loading={submitting} icon={<Lock className="h-4 w-4" />}>
            Payer
          </Button>
        </div>
      </div>
    </div>
  );
}

/** Étapes du tunnel d’achat. */
export function CheckoutSteps({ current }: { current: 0 | 1 | 2 }) {
  const steps = ['Panier', 'Livraison', 'Paiement'];
  return (
    <ol className="flex items-center gap-2 text-[12.5px] font-semibold sm:gap-3 sm:text-[13px]" aria-label="Étapes de la commande">
      {steps.map((st, i) => (
        <li key={st} className="flex items-center gap-2 sm:gap-3">
          <span className={`flex items-center gap-1.5 ${i <= current ? 'text-ink' : 'text-subtle'}`}>
            <span
              className={`num flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-bold ${
                i < current ? 'bg-jade text-white' : i === current ? 'bg-brand-gradient text-white shadow-[var(--shadow-glow)]' : 'bg-paper-2 text-muted'
              }`}
            >
              {i < current ? <Check className="h-3 w-3" /> : i + 1}
            </span>
            {st}
          </span>
          {i < steps.length - 1 && <span className={`h-px w-6 sm:w-12 ${i < current ? 'bg-jade' : 'bg-line-2'}`} aria-hidden />}
        </li>
      ))}
    </ol>
  );
}
