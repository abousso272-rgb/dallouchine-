import React, { useEffect, useState } from 'react';
import { BellRing, CalendarClock, ChevronRight, Info, MapPin, Plane, ScrollText, Ship, ShieldCheck, Users } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useAsync, usePolling } from '../../lib/hooks';
import { getGroupage, isJoinable, joinGroupage, listGroupageEvents, listMyParticipations } from '../../services/groupages';
import { listHubs, PLACEHOLDER_IMAGE } from '../../services/catalog';
import { startPayment } from '../../lib/api';
import { friendlyError } from '../../lib/db';
import { formatDate, formatDateTime, formatXOF } from '../../lib/format';
import { GROUPAGE_STATUS, GROUPAGE_STEPS, PARTICIPANT_STATUS, TRANSPORT_LABEL, currentStepIndex } from '../../lib/status';
import { Link } from '../../components/ui/Link';
import { Button } from '../../components/ui/Button';
import { StatusBadge } from '../../components/ui/Badge';
import { GroupageMeter } from '../../components/ui/Progress';
import { Stepper } from '../../components/ui/Stepper';
import { QuantityInput } from '../../components/commerce/QuantityInput';
import { PaymentLogos } from '../../components/commerce/PaymentLogos';
import { deadlineLabel } from '../../components/commerce/GroupageCard';
import { EmptyState, ErrorState, InlineAlert, PageLoader } from '../../components/ui/States';
import { Select } from '../../components/ui/Field';

export default function GroupagePage({ id }: { id: string }) {
  const { user, requireAuth, toast, navigate } = useApp();
  const { data: g, loading, error, reload } = useAsync(() => getGroupage(id), [id], { cacheKey: `groupage:${id}` });
  usePolling(reload, 30000);
  const mine = useAsync(async () => (user ? (await listMyParticipations(user.id)).filter(p => p.groupageId === g?.id) : []), [user?.id, g?.id]);
  const hubs = useAsync(() => listHubs(), [], { cacheKey: 'hubs', maxAge: 600000 });
  const events = useAsync(() => listGroupageEvents(id, 12), [id], { cacheKey: `groupage-events:${id}` });
  usePolling(events.reload, 60000);
  const [qty, setQty] = useState(1);
  const [hubId, setHubId] = useState('');
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [imageIndex, setImageIndex] = useState(0);

  useEffect(() => {
    if (g) {
      setQty(g.minPerUser);
      document.title = `Groupage ${g.product?.name || g.title} — Dallou Chine`;
    }
  }, [g]);
  useEffect(() => {
    if (hubs.data?.length && !hubId) setHubId(hubs.data[0].id);
  }, [hubs.data, hubId]);

  if (loading) return <PageLoader />;
  if (error) return <ErrorState message={error} onRetry={reload} />;
  if (!g || g.status === 'draft') {
    return (
      <div className="container-page py-16">
        <EmptyState icon={<Users className="h-5 w-5" />} title="Groupage introuvable" description="Ce groupage n’existe pas ou n’est plus visible." action={<Button to="/groupages">Voir les groupages</Button>} />
      </div>
    );
  }

  const joinable = isJoinable(g);
  const remaining = Math.max(g.targetQuantity - g.reservedQuantity, 0);
  const alreadyQty = (mine.data || []).filter(p => !['cancelled', 'refunded'].includes(p.status)).reduce((s, p) => s + p.quantity, 0);
  const maxQty = Math.max(0, Math.min(remaining, g.maxPerUser - alreadyQty));
  const pendingParticipation = (mine.data || []).find(p => p.status === 'reserved' && p.orderId);
  const images = [g.image, ...(g.product?.images || [])].filter((v, i, a): v is string => Boolean(v) && a.indexOf(v) === i);
  const savings = g.originalPriceXOF > g.unitPriceXOF ? g.originalPriceXOF - g.unitPriceXOF : 0;
  const TransportIcon = g.transportMode === 'sea' ? Ship : Plane;
  const step = currentStepIndex(GROUPAGE_STEPS, g.status, ['completed']);

  async function participate() {
    setFormError(null);
    if (!requireAuth({ reason: 'Connectez-vous ou créez votre compte pour réserver votre place et payer en ligne.', mode: 'register' })) return;
    if (qty < g!.minPerUser || qty > maxQty) {
      setFormError(`Choisissez entre ${g!.minPerUser} et ${maxQty} unité(s).`);
      return;
    }
    setBusy(true);
    try {
      const res = await joinGroupage({ groupageId: g!.id, quantity: qty, hubId: hubId || null, name: user?.fullName, phone: user?.phone, city: user?.city });
      toast('success', 'Place réservée', 'Redirection vers le paiement sécurisé…');
      try {
        await startPayment(res.order_id);
      } catch (payErr) {
        toast('error', 'Paiement non démarré', friendlyError(payErr));
        navigate(`/compte/commandes/${res.order_id}`);
      }
    } catch (err) {
      setFormError(friendlyError(err));
      reload();
    } finally {
      setBusy(false);
    }
  }

  async function payPending() {
    if (!pendingParticipation?.orderId) return;
    setBusy(true);
    try {
      await startPayment(pendingParticipation.orderId);
    } catch (err) {
      toast('error', 'Paiement non démarré', friendlyError(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="container-page pb-10 pt-6 sm:pt-8">
      <nav className="mb-5 flex items-center gap-1.5 text-[12.5px] font-medium text-muted" aria-label="Fil d’Ariane">
        <Link to="/groupages" className="hover:text-ink">
          Groupages
        </Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="truncate text-ink">{g.code}</span>
      </nav>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:gap-12">
        <div>
          <div className="relative aspect-[4/3] overflow-hidden rounded-[28px] border border-line bg-white shadow-[var(--shadow-warm)]">
            <img src={images[imageIndex] || PLACEHOLDER_IMAGE} alt={g.title} className="h-full w-full object-cover" />
            <div className="absolute left-4 top-4">
              <StatusBadge map={GROUPAGE_STATUS} status={g.status} className="bg-white/95" />
            </div>
          </div>
          {images.length > 1 && (
            <div className="scrollbar-none mt-3 flex gap-2 overflow-x-auto">
              {images.map((img, i) => (
                <button key={img} type="button" onClick={() => setImageIndex(i)} className={`h-16 w-16 shrink-0 overflow-hidden rounded-xl border-2 ${i === imageIndex ? 'border-ink' : 'border-transparent ring-1 ring-line'}`}>
                  <img src={img} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}

          <div className="mt-8">
            <p className="text-[12px] font-semibold uppercase tracking-wide text-subtle">Groupage {g.code}</p>
            <h1 className="mt-2 text-[26px] font-bold leading-tight sm:text-[32px]">{g.product?.name || g.title}</h1>
            {g.description && <p className="mt-3 whitespace-pre-line text-[15px] leading-relaxed text-muted">{g.description}</p>}
            {g.highlights.length > 0 && (
              <ul className="mt-5 grid grid-cols-1 gap-2 sm:grid-cols-2">
                {g.highlights.map(h => (
                  <li key={h} className="flex gap-2.5 text-[14px]">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-brand" /> {h}
                  </li>
                ))}
              </ul>
            )}
            {g.product && (
              <Link to={`/produit/${g.product.slug}`} className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-ink hover:text-brand">
                Voir la fiche produit complète <ChevronRight className="h-4 w-4" />
              </Link>
            )}
          </div>

          <section className="surface mt-8 p-5 sm:p-6">
            <h2 className="text-base font-bold">Avancement du groupage</h2>
            <div className="mt-5">
              <Stepper steps={GROUPAGE_STEPS} current={step} stopped={g.status === 'cancelled'} />
            </div>
            {g.statusNote && g.status !== 'open' && (
              <p className="mt-5 rounded-xl bg-paper p-3 text-[13.5px] text-muted">
                <span className="font-semibold text-ink">Dernière information : </span>
                {g.statusNote}
              </p>
            )}
          </section>

          {(events.data || []).filter(e => e.isPublic).length > 0 && (
            <section className="surface mt-4 p-5 sm:p-6">
              <h2 className="flex items-center gap-2 text-base font-bold">
                <BellRing className="h-4 w-4 text-brand" /> Actualités du groupage
              </h2>
              <ol className="mt-4 space-y-4 border-l-2 border-brand/20 pl-5">
                {(events.data || [])
                  .filter(e => e.isPublic)
                  .map(e => (
                    <li key={e.id} className="relative">
                      <span className="absolute -left-[27px] top-1 h-3 w-3 rounded-full bg-brand-gradient ring-4 ring-white" aria-hidden />
                      <p className="text-[14px] font-semibold">{e.title}</p>
                      {e.message && <p className="mt-0.5 whitespace-pre-line text-[13.5px] text-muted">{e.message}</p>}
                      <p className="mt-1 text-[11.5px] text-subtle">{formatDateTime(e.createdAt)}</p>
                    </li>
                  ))}
              </ol>
            </section>
          )}

          <section className="surface mt-4 p-5 sm:p-6">
            <h2 className="flex items-center gap-2 text-base font-bold">
              <ScrollText className="h-4 w-4 text-brand" /> Règles du groupage
            </h2>
            <ul className="mt-3 space-y-2 text-[13.5px] text-muted">
              <li className="flex gap-2.5"><span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand" /> Participation de {g.minPerUser} à {g.maxPerUser} unité{g.maxPerUser > 1 ? 's' : ''} par client.</li>
              <li className="flex gap-2.5"><span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand" /> Votre réservation est à régler sous {g.reservationHours} h ; passé ce délai, la place est libérée pour un autre acheteur.</li>
              <li className="flex gap-2.5"><span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand" /> Réservation non payée annulable depuis votre espace tant que le groupage est ouvert.</li>
              <li className="flex gap-2.5"><span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand" /> À la validation, seules les participations payées sont commandées à l’usine.</li>
              <li className="flex gap-2.5"><span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand" /> Si le groupage est annulé, les participations payées sont intégralement remboursées.</li>
            </ul>
            {g.terms && <p className="mt-3 whitespace-pre-line rounded-xl bg-paper p-3 text-[13px] text-muted">{g.terms}</p>}
          </section>

          <section className="surface mt-4 grid grid-cols-1 gap-4 p-5 sm:grid-cols-2 sm:p-6">
            <Detail icon={<TransportIcon className="h-4 w-4" />} label="Transport" value={TRANSPORT_LABEL[g.transportMode]} />
            <Detail icon={<MapPin className="h-4 w-4" />} label="Trajet" value={g.route || 'Chine → Dakar'} />
            <Detail icon={<CalendarClock className="h-4 w-4" />} label="Date limite de participation" value={formatDate(g.deadline)} />
            <Detail icon={<CalendarClock className="h-4 w-4" />} label="Arrivée estimée" value={g.estimatedArrival ? formatDate(g.estimatedArrival) : 'Communiquée au lancement'} />
          </section>

          {g.guaranteeNote && (
            <div className="mt-4 flex gap-3 rounded-2xl border border-emerald-200 bg-jade-50 p-4 text-[14px] text-emerald-900">
              <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0" />
              <p>{g.guaranteeNote}</p>
            </div>
          )}
        </div>

        {/* Participation */}
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="surface p-5 sm:p-6">
            <div className="flex items-end justify-between gap-3">
              <div>
                <p className="num font-display text-[32px] font-bold leading-none text-brand-600">{formatXOF(g.unitPriceXOF)}</p>
                <p className="mt-1.5 text-[13px] text-muted">par unité · prix groupage</p>
              </div>
              {savings > 0 && (
                <div className="text-right">
                  <p className="num text-[13px] text-subtle line-through">{formatXOF(g.originalPriceXOF)}</p>
                  <p className="num text-[13px] font-bold text-brand">−{formatXOF(savings)} / unité</p>
                </div>
              )}
            </div>

            <div className="mt-5">
              <GroupageMeter reserved={g.reservedQuantity} target={g.targetQuantity} />
            </div>

            <div className="mt-4 flex items-center justify-between text-[13px]">
              <span className="inline-flex items-center gap-1.5 text-muted">
                <Users className="h-4 w-4" /> {g.participantsCount} participant{g.participantsCount > 1 ? 's' : ''}
              </span>
              {joinable && deadlineLabel(g.deadline) && <span className="font-semibold text-ink">{deadlineLabel(g.deadline)}</span>}
            </div>

            {alreadyQty > 0 && (
              <div className="mt-5 rounded-xl bg-paper p-3.5 text-[13.5px]">
                <p className="font-semibold">Vous participez déjà ({alreadyQty} unité{alreadyQty > 1 ? 's' : ''}).</p>
                {(mine.data || []).map(p => (
                  <div key={p.id} className="mt-1.5 flex items-center justify-between">
                    <span className="text-muted">
                      {p.quantity} × {formatXOF(p.totalXOF / p.quantity)}
                    </span>
                    <StatusBadge map={PARTICIPANT_STATUS} status={p.status} />
                  </div>
                ))}
                {pendingParticipation && (
                  <Button className="mt-3" block onClick={payPending} loading={busy}>
                    Finaliser mon paiement
                  </Button>
                )}
              </div>
            )}

            {joinable ? (
              maxQty > 0 ? (
                <div className="mt-5 space-y-4 border-t border-dashed border-line pt-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold">Quantité</p>
                      <p className="text-[12px] text-muted">
                        {g.minPerUser > 1 ? `Min. ${g.minPerUser} · ` : ''}max. {maxQty}
                      </p>
                    </div>
                    <QuantityInput value={qty} onChange={setQty} min={g.minPerUser} max={maxQty} />
                  </div>
                  {hubs.data && hubs.data.length > 1 && (
                    <Select
                      label="Point de retrait"
                      value={hubId}
                      onChange={e => setHubId(e.target.value)}
                      options={hubs.data.map(h => ({ value: h.id, label: `${h.name} — ${h.district || h.city}` }))}
                    />
                  )}
                  <div className="flex items-center justify-between rounded-xl bg-paper px-4 py-3">
                    <span className="text-sm font-semibold">Total à payer</span>
                    <span className="num font-display text-xl font-semibold">{formatXOF(qty * g.unitPriceXOF)}</span>
                  </div>
                  {formError && <InlineAlert tone="danger">{formError}</InlineAlert>}
                  <Button block size="lg" loading={busy} onClick={participate}>
                    Participer et payer
                  </Button>
                  <p className="flex items-start gap-2 text-[12px] leading-relaxed text-muted">
                    <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                    Votre place est réservée dès maintenant et confirmée au paiement (à régler sous {g.reservationHours} h). Paiement 100 % sécurisé.
                  </p>
                  <PaymentLogos />
                </div>
              ) : (
                <InlineAlert tone="info">Vous avez atteint la quantité maximale autorisée pour ce groupage.</InlineAlert>
              )
            ) : (
              <div className="mt-5">
                <InlineAlert tone="info" title="Participations closes">
                  Ce groupage est en cours de traitement. Suivez son avancement ci-contre ou découvrez les autres campagnes.
                </InlineAlert>
                <Button to="/groupages" variant="secondary" block className="mt-3">
                  Voir les groupages ouverts
                </Button>
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}

function Detail({ icon, label, value }: { icon: React.ReactNode; label: string; value: React.ReactNode }) {
  return (
    <div className="flex gap-3">
      <span className="icon-bubble h-9 w-9">{icon}</span>
      <div>
        <p className="text-[12px] text-muted">{label}</p>
        <p className="text-sm font-semibold">{value}</p>
      </div>
    </div>
  );
}
