import React, { useEffect, useMemo, useState } from 'react';
import { Ban, BellRing, Download, ExternalLink, Lock, Megaphone, MessageCircle, Phone, ReceiptText, Save, UserMinus, Users } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useAsync } from '../../lib/hooks';
import {
  cancelParticipant,
  getGroupage,
  listGroupageEvents,
  listGroupageParticipants,
  markParticipantRefunded,
  postGroupageUpdate,
  saveGroupage,
  supportsGroupageRules,
  updateGroupageStatus,
  type GroupageInput,
  type GroupageParticipantRow
} from '../../services/groupages';
import { listProducts } from '../../services/catalog';
import { listTeam } from '../../services/admin';
import { friendlyError } from '../../lib/db';
import { formatDate, formatDateTime, formatXOF, percent } from '../../lib/format';
import { GROUPAGE_NEXT, GROUPAGE_STATUS, PARTICIPANT_STATUS, PAYMENT_STATUS, statusMeta } from '../../lib/status';
import { PageHeader, Card, CardTitle } from '../../components/ui/Layout';
import { StatusBadge } from '../../components/ui/Badge';
import { GroupageMeter } from '../../components/ui/Progress';
import { Button } from '../../components/ui/Button';
import { Checkbox, Input, Select, Textarea } from '../../components/ui/Field';
import { Modal } from '../../components/ui/Modal';
import { MediaGalleryInput } from '../../components/ui/Uploads';
import { EmptyState, ErrorState, InlineAlert, PageLoader, Skeleton } from '../../components/ui/States';
import { Link } from '../../components/ui/Link';

function toLocalInput(iso?: string | null) {
  if (!iso) return '';
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function newCode() {
  const d = new Date();
  return `GRP-${String(d.getFullYear()).slice(2)}${String(d.getMonth() + 1).padStart(2, '0')}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
}

export default function GroupageEditorPage({ id }: { id: string }) {
  const { user, toast, navigate } = useApp();
  const isNew = id === 'nouveau';
  const isAdmin = user?.role === 'admin';
  const canSetPrices = isAdmin || user?.permissions.includes('set_groupage_prices');

  const existing = useAsync(() => (isNew ? Promise.resolve(null) : getGroupage(id)), [id]);
  const products = useAsync(() => listProducts({ includeInactive: true, pageSize: 100, sort: 'newest' }).then(r => r.items), []);
  const team = useAsync(() => (isAdmin ? listTeam() : Promise.resolve([])), [isAdmin]);
  const participants = useAsync(() => (isNew ? Promise.resolve([]) : listGroupageParticipants(id)), [id]);
  const events = useAsync(() => (isNew ? Promise.resolve([]) : listGroupageEvents(id, 40)), [id]);
  const rules = useAsync(() => supportsGroupageRules(), []);

  const [form, setForm] = useState<GroupageInput>({
    code: newCode(),
    productId: '',
    title: '',
    description: '',
    targetQuantity: 50,
    minPerUser: 1,
    maxPerUser: 20,
    unitPriceXOF: 0,
    originalPriceXOF: 0,
    supplierMoq: 50,
    transportMode: 'sea',
    route: 'Chine (Guangzhou / Yiwu) → Dakar',
    deadline: toLocalInput(new Date(Date.now() + 21 * 86400000).toISOString()),
    estimatedDeparture: null,
    estimatedArrival: null,
    status: 'draft',
    guaranteeNote: '',
    highlights: [],
    imageUrl: null,
    assignedManagerId: null,
    reservationHours: 48,
    terms: ''
  });
  const [images, setImages] = useState<string[]>([]);
  const [highlights, setHighlights] = useState('');
  const [saving, setSaving] = useState(false);
  const [statusNote, setStatusNote] = useState('');
  const [statusBusy, setStatusBusy] = useState<string | null>(null);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [removeTarget, setRemoveTarget] = useState<GroupageParticipantRow | null>(null);
  const [refundTarget, setRefundTarget] = useState<GroupageParticipantRow | null>(null);
  const [reason, setReason] = useState('');
  const [actionBusy, setActionBusy] = useState(false);
  const [news, setNews] = useState({ title: '', message: '', isPublic: true, notify: true });
  const [posting, setPosting] = useState(false);

  const g = existing.data;
  useEffect(() => {
    if (!g) return;
    setForm({
      id: g.id,
      code: g.code,
      productId: g.productId,
      title: g.title,
      description: g.description,
      targetQuantity: g.targetQuantity,
      minPerUser: g.minPerUser,
      maxPerUser: g.maxPerUser,
      unitPriceXOF: g.unitPriceXOF,
      originalPriceXOF: g.originalPriceXOF,
      supplierMoq: g.supplierMoq,
      transportMode: g.transportMode,
      route: g.route,
      deadline: toLocalInput(g.deadline),
      estimatedDeparture: g.estimatedDeparture,
      estimatedArrival: g.estimatedArrival,
      status: g.status,
      guaranteeNote: g.guaranteeNote || '',
      highlights: g.highlights,
      imageUrl: g.image,
      assignedManagerId: g.assignedManagerId,
      reservationHours: g.reservationHours,
      terms: g.terms || ''
    });
    setImages(g.image && g.image !== g.product?.images[0] ? [g.image] : []);
    setHighlights(g.highlights.join('\n'));
  }, [g]);

  const product = useMemo(() => (products.data || []).find(p => p.id === form.productId), [products.data, form.productId]);
  const set = <K extends keyof GroupageInput>(k: K, v: GroupageInput[K]) => setForm(f => ({ ...f, [k]: v }));
  const priceLocked = !isNew && !canSetPrices && form.status !== 'draft';

  if (existing.loading) return <PageLoader />;
  if (existing.error) return <ErrorState message={existing.error} onRetry={existing.reload} />;
  if (!isNew && !g) return <EmptyState icon={<Users className="h-5 w-5" />} title="Groupage introuvable" action={<Button to="/espace-pro/groupages">Retour</Button>} />;
  if (isNew && !isAdmin && !user?.permissions.includes('create_groupages')) {
    return <EmptyState title="Création non autorisée" description="Votre rôle permet de gérer les groupages qui vous sont attribués. Demandez la permission « créer des groupages » à l’administrateur." action={<Button to="/espace-pro/groupages">Retour</Button>} />;
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!form.productId) return toast('error', 'Choisissez le produit du groupage');
    if (!form.title.trim()) return toast('error', 'Titre requis');
    if (form.unitPriceXOF <= 0 || form.targetQuantity <= 0) return toast('error', 'Prix et objectif doivent être positifs');
    if (!form.deadline) return toast('error', 'Date limite requise');
    setSaving(true);
    try {
      const savedId = await saveGroupage(
        { ...form, imageUrl: images[0] || null, highlights: highlights.split('\n').map(h => h.trim()).filter(Boolean) },
        isAdmin
      );
      toast('success', isNew ? 'Groupage créé (brouillon)' : 'Groupage enregistré', isNew ? 'Publiez-le quand il est prêt.' : undefined);
      if (isNew) navigate(`/espace-pro/groupages/${savedId}`, { replace: true });
      else existing.reload();
    } catch (err) {
      toast('error', 'Enregistrement impossible', friendlyError(err));
    } finally {
      setSaving(false);
    }
  }

  async function changeStatus(status: string, note = statusNote) {
    if (status === 'validated' && !window.confirm('Valider le groupage ? Les réservations non payées seront annulées et seuls les participants qui ont payé continueront.')) return;
    setStatusBusy(status);
    try {
      await updateGroupageStatus(id, status, note);
      toast('success', `Groupage : ${statusMeta(GROUPAGE_STATUS, status).label}`, 'Les participants ont été notifiés.');
      setStatusNote('');
      setCancelOpen(false);
      setReason('');
      existing.reload();
      participants.reload();
      events.reload();
    } catch (err) {
      toast('error', 'Changement impossible', friendlyError(err));
    } finally {
      setStatusBusy(null);
    }
  }

  async function removeParticipant() {
    if (!removeTarget || reason.trim().length < 3) return toast('error', 'Indiquez le motif (envoyé au client)');
    setActionBusy(true);
    try {
      const res = await cancelParticipant(removeTarget.participant_id, reason.trim());
      toast('success', 'Participation retirée', res?.refund_required ? 'Paiement à rembourser : visible dans la liste.' : 'Le client a été prévenu.');
      setRemoveTarget(null);
      setReason('');
      existing.reload();
      participants.reload();
      events.reload();
    } catch (err) {
      toast('error', 'Action impossible', friendlyError(err));
    } finally {
      setActionBusy(false);
    }
  }

  async function confirmRefund() {
    if (!refundTarget || reason.trim().length < 3) return toast('error', 'Indiquez la référence du remboursement');
    setActionBusy(true);
    try {
      await markParticipantRefunded(refundTarget.participant_id, reason.trim());
      toast('success', 'Remboursement enregistré', 'Le client a été notifié.');
      setRefundTarget(null);
      setReason('');
      participants.reload();
      events.reload();
    } catch (err) {
      toast('error', 'Action impossible', friendlyError(err));
    } finally {
      setActionBusy(false);
    }
  }

  async function publishNews(e: React.FormEvent) {
    e.preventDefault();
    if (news.title.trim().length < 3) return toast('error', 'Donnez un titre à votre actualité');
    setPosting(true);
    try {
      const res = await postGroupageUpdate(id, news.title.trim(), news.message.trim(), news.isPublic, news.isPublic && news.notify);
      toast('success', news.isPublic ? 'Actualité publiée' : 'Note interne ajoutée', res?.notified ? `${res.notified} participant(s) notifié(s).` : undefined);
      setNews({ title: '', message: '', isPublic: true, notify: true });
      events.reload();
    } catch (err) {
      toast('error', 'Publication impossible', friendlyError(err));
    } finally {
      setPosting(false);
    }
  }

  function exportCsv() {
    const rows = (participants.data || []).map(p => [p.full_name, p.phone, p.email, p.quantity, p.total_xof, p.status, p.payment_status || '', p.order_code || '', formatDate(p.created_at)]);
    const head = ['Nom', 'Téléphone', 'Email', 'Quantité', 'Montant (FCFA)', 'Participation', 'Paiement', 'Commande', 'Date'];
    const csv = [head, ...rows].map(r => r.map(v => `"${String(v ?? '').replace(/"/g, '""')}"`).join(';')).join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `participants-${g?.code || 'groupage'}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  const nextStatuses = GROUPAGE_NEXT[g?.status || 'draft'] || [];
  const canCancel = isAdmin && g && !['completed', 'cancelled', 'shipped', 'arrived'].includes(g.status);
  const paidParticipants = (participants.data || []).filter(p => p.status === 'paid');
  const collected = paidParticipants.reduce((s, p) => s + Number(p.total_xof || 0), 0);
  const pendingRefunds = (participants.data || []).filter(p => p.refund_status === 'pending');
  const lockedForRemoval = g ? ['shipped', 'arrived', 'completed', 'cancelled'].includes(g.status) : true;

  return (
    <div className="space-y-5">
      <PageHeader
        back={{ to: '/espace-pro/groupages', label: 'Groupages' }}
        eyebrow={isNew ? 'Nouveau groupage' : g?.code}
        title={isNew ? 'Créer un groupage' : g?.product?.name || g?.title}
        actions={
          !isNew && g ? (
            <div className="flex flex-wrap gap-2">
              <StatusBadge map={GROUPAGE_STATUS} status={g.status} />
              {g.status !== 'draft' && (
                <Button to={`/groupages/${g.id}`} size="sm" variant="secondary" icon={<ExternalLink className="h-3.5 w-3.5" />}>
                  Page publique
                </Button>
              )}
            </div>
          ) : undefined
        }
      />

      {!isNew && g && (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_1.1fr]">
          <Card>
            <CardTitle>Progression</CardTitle>
            <GroupageMeter reserved={g.reservedQuantity} target={g.targetQuantity} />
            <div className="mt-4 grid grid-cols-3 gap-2 text-center text-[12.5px]">
              <div className="rounded-xl bg-paper p-2.5">
                <p className="text-muted">Participants</p>
                <p className="num text-base font-semibold">{g.participantsCount}</p>
              </div>
              <div className="rounded-xl bg-paper p-2.5">
                <p className="text-muted">Payés</p>
                <p className="num text-base font-semibold">
                  {paidParticipants.length}/{(participants.data || []).filter(p => !['cancelled', 'refunded'].includes(p.status)).length}
                </p>
              </div>
              <div className="rounded-xl bg-paper p-2.5">
                <p className="text-muted">Encaissé</p>
                <p className="num text-base font-semibold">{formatXOF(collected)}</p>
              </div>
            </div>
          </Card>
          <Card>
            <CardTitle>Étape du groupage</CardTitle>
            <p className="text-sm text-muted">
              Étape actuelle : <span className="font-semibold text-ink">{statusMeta(GROUPAGE_STATUS, g.status).label}</span>. Chaque changement est journalisé et notifié aux participants.
            </p>
            {nextStatuses.length > 0 && (
              <>
                <Input value={statusNote} onChange={e => setStatusNote(e.target.value)} placeholder="Message pour les participants (optionnel)" wrapperClassName="mt-3" aria-label="Note d’étape" />
                <div className="mt-3 flex flex-wrap gap-2">
                  {nextStatuses.map(st => (
                    <Button key={st} size="sm" loading={statusBusy === st} onClick={() => changeStatus(st)}>
                      {st === 'open' ? 'Publier : ouvrir les participations' : st === 'validated' ? 'Valider le groupage' : `Passer à « ${statusMeta(GROUPAGE_STATUS, st).label} »`}
                    </Button>
                  ))}
                  {g.status === 'open' && g.reservedQuantity === 0 && (
                    <Button size="sm" variant="secondary" loading={statusBusy === 'draft'} onClick={() => changeStatus('draft')}>
                      Repasser en brouillon
                    </Button>
                  )}
                </div>
              </>
            )}
            {['open', 'almost_full', 'full'].includes(g.status) && (
              <p className="mt-3 rounded-xl bg-paper p-3 text-[12.5px] text-muted">
                La validation lance la commande usine avec les participations <strong className="text-ink">payées</strong> ({formatXOF(collected)} encaissés). Les réservations non réglées sont annulées automatiquement.
              </p>
            )}
            {g.status === 'draft' && <p className="mt-3 text-[12.5px] text-muted">En brouillon, le groupage n’est pas visible par les clients. Prix et date limite future sont requis pour publier.</p>}
            {canCancel ? (
              <button type="button" onClick={() => setCancelOpen(true)} className="mt-4 inline-flex items-center gap-1.5 text-[13px] font-semibold text-red-700 hover:underline">
                <Ban className="h-3.5 w-3.5" /> Annuler le groupage…
              </button>
            ) : (
              !isAdmin &&
              !['completed', 'cancelled'].includes(g.status) && (
                <p className="mt-4 flex items-center gap-1.5 text-[12px] text-subtle">
                  <Lock className="h-3 w-3" /> L’annulation d’un groupage est réservée à l’administration.
                </p>
              )
            )}
          </Card>
        </div>
      )}

      {!isNew && g && rules.data && (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_1fr]">
          <Card>
            <CardTitle>
              <span className="inline-flex items-center gap-2">
                <Megaphone className="h-4 w-4 text-brand" /> Informer les participants
              </span>
            </CardTitle>
            <form onSubmit={publishNews} className="space-y-3">
              <Input label="Titre" value={news.title} onChange={e => setNews(n => ({ ...n, title: e.target.value }))} placeholder="Ex. Commande passée à l’usine" maxLength={140} />
              <Textarea label="Message" value={news.message} onChange={e => setNews(n => ({ ...n, message: e.target.value }))} rows={3} maxLength={2000} placeholder="Détails utiles : délais, photos de production, date de départ…" />
              <div className="flex flex-wrap gap-x-6 gap-y-2">
                <Checkbox label="Visible sur la page publique" checked={news.isPublic} onChange={v => setNews(n => ({ ...n, isPublic: v }))} />
                {news.isPublic && <Checkbox label="Notifier les participants" checked={news.notify} onChange={v => setNews(n => ({ ...n, notify: v }))} />}
              </div>
              <Button type="submit" size="sm" loading={posting} icon={<BellRing className="h-3.5 w-3.5" />}>
                {news.isPublic ? 'Publier l’actualité' : 'Ajouter une note interne'}
              </Button>
            </form>
          </Card>
          <Card>
            <CardTitle>Journal</CardTitle>
            {events.loading ? (
              <Skeleton className="h-32" />
            ) : !(events.data || []).length ? (
              <p className="text-sm text-muted">Les étapes, actualités, retraits et remboursements apparaîtront ici.</p>
            ) : (
              <ol className="max-h-[320px] space-y-3 overflow-y-auto pr-1">
                {(events.data || []).map(ev => (
                  <li key={ev.id} className="rounded-xl bg-paper px-3.5 py-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-[13.5px] font-semibold">{ev.title}</p>
                      <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10.5px] font-bold ${ev.isPublic ? 'bg-jade-50 text-jade' : 'bg-white text-muted ring-1 ring-line'}`}>
                        {ev.isPublic ? 'Public' : 'Interne'}
                      </span>
                    </div>
                    {ev.message && <p className="mt-0.5 whitespace-pre-line text-[12.5px] text-muted">{ev.message}</p>}
                    <p className="mt-1 text-[11px] text-subtle">{formatDateTime(ev.createdAt)}</p>
                  </li>
                ))}
              </ol>
            )}
          </Card>
        </div>
      )}

      <form onSubmit={save} className="grid grid-cols-1 gap-5 xl:grid-cols-[1.3fr_1fr]">
        <div className="space-y-5">
          <Card>
            <CardTitle>Produit & présentation</CardTitle>
            <div className="grid gap-4">
              <Select
                label="Produit du catalogue"
                required
                value={form.productId}
                onChange={e => {
                  const p = (products.data || []).find(x => x.id === e.target.value);
                  setForm(f => ({
                    ...f,
                    productId: e.target.value,
                    title: f.title || (p ? `Groupage : ${p.name}` : ''),
                    originalPriceXOF: f.originalPriceXOF || p?.priceXOF || 0
                  }));
                }}
                placeholder={products.loading ? 'Chargement…' : 'Choisir un produit'}
                options={(products.data || []).map(p => ({ value: p.id, label: `${p.name}${p.isActive ? '' : ' (brouillon)'} — ${formatXOF(p.priceXOF)}` }))}
                hint={!isNew ? undefined : 'Le produit apporte photos et fiche technique. Créez-le d’abord dans Produits si besoin.'}
              />
              <Input label="Titre" required value={form.title} onChange={e => set('title', e.target.value)} />
              <Textarea label="Description" value={form.description} onChange={e => set('description', e.target.value)} rows={4} placeholder="Ce que comprend le groupage, qualité, conditionnement…" />
              <Textarea label="Points forts (un par ligne)" value={highlights} onChange={e => setHighlights(e.target.value)} rows={3} />
              <div>
                <p className="mb-1.5 text-[13px] font-semibold">Visuel dédié (optionnel)</p>
                <MediaGalleryInput value={images} onChange={v => setImages(v.slice(0, 1))} onError={m => toast('error', 'Image refusée', m)} folder="groupages" max={1} />
                {!images.length && product && <p className="mt-1.5 text-[12.5px] text-muted">Par défaut, la photo principale du produit est utilisée.</p>}
              </div>
            </div>
          </Card>

          <Card>
            <CardTitle>Prix & objectif</CardTitle>
            {priceLocked && <InlineAlert tone="info">Groupage publié : prix et objectif ne sont modifiables que par l’administration.</InlineAlert>}
            <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input label="Prix groupage / unité" required inputMode="numeric" value={form.unitPriceXOF || ''} onChange={e => set('unitPriceXOF', Number(e.target.value.replace(/\D/g, '')))} suffix="FCFA" disabled={priceLocked} />
              <Input label="Prix de référence (hors groupage)" inputMode="numeric" value={form.originalPriceXOF || ''} onChange={e => set('originalPriceXOF', Number(e.target.value.replace(/\D/g, '')))} suffix="FCFA" disabled={priceLocked} hint={form.originalPriceXOF > form.unitPriceXOF && form.unitPriceXOF > 0 ? `Économie affichée : ${percent(form.originalPriceXOF - form.unitPriceXOF, form.originalPriceXOF)} %` : undefined} />
              <Input label="Objectif (unités)" required inputMode="numeric" value={form.targetQuantity || ''} onChange={e => set('targetQuantity', Number(e.target.value.replace(/\D/g, '')))} disabled={priceLocked} />
              <Input label="MOQ fournisseur" inputMode="numeric" value={form.supplierMoq || ''} onChange={e => set('supplierMoq', Number(e.target.value.replace(/\D/g, '')))} />
              <Input label="Minimum par participant" inputMode="numeric" value={form.minPerUser || ''} onChange={e => set('minPerUser', Number(e.target.value.replace(/\D/g, '')) || 1)} />
              <Input label="Maximum par participant" inputMode="numeric" value={form.maxPerUser || ''} onChange={e => set('maxPerUser', Number(e.target.value.replace(/\D/g, '')) || 1)} />
            </div>
          </Card>
        </div>

        <div className="space-y-5">
          <Card>
            <CardTitle>Calendrier & logistique</CardTitle>
            <div className="grid gap-4">
              <Input label="Date limite de participation" required type="datetime-local" value={form.deadline} onChange={e => set('deadline', e.target.value)} />
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Input label="Départ estimé" type="date" value={form.estimatedDeparture || ''} onChange={e => set('estimatedDeparture', e.target.value || null)} />
                <Input label="Arrivée estimée" type="date" value={form.estimatedArrival || ''} onChange={e => set('estimatedArrival', e.target.value || null)} />
              </div>
              <Select
                label="Transport"
                value={form.transportMode}
                onChange={e => set('transportMode', e.target.value as GroupageInput['transportMode'])}
                options={[
                  { value: 'sea', label: 'Maritime (conteneur)' },
                  { value: 'air', label: 'Aérien' },
                  { value: 'express', label: 'Express' }
                ]}
              />
              <Input label="Trajet" value={form.route} onChange={e => set('route', e.target.value)} />
              {rules.data && (
                <div className="grid grid-cols-1 gap-4 rounded-2xl bg-paper p-3.5">
                  <Select
                    label="Délai pour payer une réservation"
                    value={String(form.reservationHours || 48)}
                    onChange={e => set('reservationHours', Number(e.target.value))}
                    options={[12, 24, 48, 72, 120, 168].map(h => ({ value: String(h), label: h < 48 ? `${h} heures` : `${h / 24} jours (${h} h)` }))}
                    hint="Passé ce délai, la place non payée est libérée automatiquement."
                  />
                  <Textarea label="Conditions particulières (affichées aux clients)" value={form.terms || ''} onChange={e => set('terms', e.target.value)} rows={2} placeholder="Ex. : couleur au choix à la commande, garantie 12 mois…" />
                </div>
              )}
              <Textarea label="Engagement si l’objectif n’est pas atteint" value={form.guaranteeNote} onChange={e => set('guaranteeNote', e.target.value)} rows={3} placeholder="Ex. : remboursement intégral ou report sur la campagne suivante, au choix du client." />
              <Input label="Code" value={form.code} onChange={e => set('code', e.target.value.toUpperCase())} disabled={!isNew} />
              {isAdmin && (
                <Select
                  label="Gestionnaire attitré"
                  value={form.assignedManagerId || ''}
                  onChange={e => set('assignedManagerId', e.target.value || null)}
                  placeholder="Aucun (administration)"
                  options={(team.data || []).filter(m => m.role === 'groupage_manager').map(m => ({ value: m.id, label: m.fullName }))}
                />
              )}
            </div>
          </Card>
          <div className="sticky bottom-3 z-10 rounded-2xl bg-paper/85 p-1.5 backdrop-blur">
            <Button type="submit" size="lg" block loading={saving} icon={<Save className="h-4 w-4" />}>
              {isNew ? 'Créer le groupage (brouillon)' : 'Enregistrer les modifications'}
            </Button>
          </div>
        </div>
      </form>

      {!isNew && (
        <Card>
          <CardTitle
            action={
              (participants.data || []).length > 0 ? (
                <Button size="sm" variant="secondary" onClick={exportCsv} icon={<Download className="h-3.5 w-3.5" />}>
                  Export CSV
                </Button>
              ) : undefined
            }
          >
            Participants
          </CardTitle>
          {pendingRefunds.length > 0 && (
            <InlineAlert tone="warning" title={`${pendingRefunds.length} remboursement(s) à effectuer`}>
              {isAdmin ? 'Effectuez le remboursement (Wave, OM…) puis enregistrez sa référence.' : 'L’administration doit effectuer ces remboursements.'}
            </InlineAlert>
          )}
          {participants.loading ? (
            <Skeleton className="h-32" />
          ) : participants.error ? (
            <InlineAlert tone="warning">{participants.error}</InlineAlert>
          ) : !(participants.data || []).length ? (
            <p className="py-4 text-sm text-muted">Aucun participant pour le moment.</p>
          ) : (
            <ul className="mt-2 divide-y divide-line">
              {(participants.data || []).map(p => {
                const active = ['reserved', 'confirmed', 'paid'].includes(p.status);
                const wa = p.phone ? `https://wa.me/${p.phone.replace(/\D/g, '').replace(/^(?!221)(\d{9})$/, '221$1')}` : null;
                return (
                  <li key={p.participant_id} className="flex flex-col gap-2 py-3.5 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold">{p.full_name || 'Client'}</p>
                      <p className="text-[12.5px] text-muted">
                        {p.quantity} u. · {formatXOF(p.total_xof)} · {formatDate(p.created_at)}
                        {p.order_code && (
                          <>
                            {' · '}
                            <Link to={`/espace-pro/commandes/${p.order_id}`} className="num font-semibold text-ink hover:text-brand">
                              {p.order_code}
                            </Link>
                          </>
                        )}
                      </p>
                      {p.pay_before && <p className="text-[12px] font-medium text-ochre">À payer avant le {formatDateTime(p.pay_before)}</p>}
                      {p.cancelled_reason && <p className="text-[12px] text-muted">Motif : {p.cancelled_reason}</p>}
                      {p.refund_status === 'done' && <p className="text-[12px] font-medium text-jade">Remboursé · réf. {p.refund_reference}</p>}
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      {p.phone && (
                        <a href={`tel:${p.phone.replace(/\s/g, '')}`} className="inline-flex h-8 items-center gap-1 rounded-full px-2.5 text-[12.5px] font-semibold text-muted hover:bg-paper hover:text-ink">
                          <Phone className="h-3.5 w-3.5" /> {p.phone}
                        </a>
                      )}
                      {wa && (
                        <a href={wa} target="_blank" rel="noreferrer" className="inline-flex h-8 items-center gap-1 rounded-full px-2.5 text-[12.5px] font-semibold text-[#128c4a] hover:bg-[#effbf3]" aria-label="WhatsApp">
                          <MessageCircle className="h-3.5 w-3.5" />
                        </a>
                      )}
                      <StatusBadge map={PARTICIPANT_STATUS} status={p.status} />
                      {p.payment_status && <StatusBadge map={PAYMENT_STATUS} status={p.payment_status} />}
                      {p.refund_status === 'pending' && (
                        <span className="rounded-full bg-red-50 px-2 py-0.5 text-[11px] font-bold text-red-700">À rembourser</span>
                      )}
                      {active && !lockedForRemoval && rules.data && (
                        <Button size="sm" variant="ghost" icon={<UserMinus className="h-3.5 w-3.5" />} onClick={() => { setReason(''); setRemoveTarget(p); }}>
                          Retirer
                        </Button>
                      )}
                      {isAdmin && p.refund_status === 'pending' && (
                        <Button size="sm" variant="secondary" icon={<ReceiptText className="h-3.5 w-3.5" />} onClick={() => { setReason(''); setRefundTarget(p); }}>
                          Remboursé
                        </Button>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>
      )}

      <Modal
        open={cancelOpen}
        onClose={() => setCancelOpen(false)}
        title="Annuler le groupage"
        description="Les réservations sont annulées, les participations payées passent « à rembourser » et chaque participant reçoit le motif."
        footer={
          <>
            <Button variant="secondary" onClick={() => setCancelOpen(false)}>
              Retour
            </Button>
            <Button variant="danger" loading={statusBusy === 'cancelled'} onClick={() => (reason.trim().length < 5 ? toast('error', 'Motif requis (5 caractères min.)') : changeStatus('cancelled', reason.trim()))}>
              Confirmer l’annulation
            </Button>
          </>
        }
      >
        <Textarea label="Motif (envoyé aux participants)" value={reason} onChange={e => setReason(e.target.value)} rows={3} placeholder="Ex. : objectif non atteint à la date limite, fournisseur en rupture…" />
      </Modal>

      <Modal
        open={Boolean(removeTarget)}
        onClose={() => setRemoveTarget(null)}
        title="Retirer la participation"
        description={removeTarget ? `${removeTarget.full_name} · ${removeTarget.quantity} u. · ${formatXOF(removeTarget.total_xof)}${removeTarget.status === 'paid' ? ' — payée : un remboursement sera à effectuer.' : ''}` : undefined}
        footer={
          <>
            <Button variant="secondary" onClick={() => setRemoveTarget(null)}>
              Retour
            </Button>
            <Button variant="danger" loading={actionBusy} onClick={removeParticipant}>
              Retirer
            </Button>
          </>
        }
      >
        <Textarea label="Motif (envoyé au client)" value={reason} onChange={e => setReason(e.target.value)} rows={3} placeholder="Ex. : doublon, demande du client, coordonnées invalides…" />
      </Modal>

      <Modal
        open={Boolean(refundTarget)}
        onClose={() => setRefundTarget(null)}
        title="Enregistrer le remboursement"
        description={refundTarget ? `${refundTarget.full_name} · ${formatXOF(refundTarget.total_xof)}` : undefined}
        footer={
          <>
            <Button variant="secondary" onClick={() => setRefundTarget(null)}>
              Retour
            </Button>
            <Button loading={actionBusy} onClick={confirmRefund}>
              Confirmer
            </Button>
          </>
        }
      >
        <Input label="Référence du remboursement" value={reason} onChange={e => setReason(e.target.value)} placeholder="Ex. ID de transaction Wave / Orange Money" />
      </Modal>
    </div>
  );
}
