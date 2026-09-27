import React, { useEffect, useMemo, useState } from 'react';
import { ExternalLink, Phone, Save, Users } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useAsync } from '../../lib/hooks';
import { getGroupage, listGroupageParticipants, saveGroupage, updateGroupageStatus, type GroupageInput } from '../../services/groupages';
import { listProducts } from '../../services/catalog';
import { listTeam } from '../../services/admin';
import { friendlyError } from '../../lib/db';
import { formatDate, formatXOF, percent } from '../../lib/format';
import { GROUPAGE_STATUS, GROUPAGE_STATUS_FLOW, PARTICIPANT_STATUS, PAYMENT_STATUS, statusMeta } from '../../lib/status';
import { PageHeader, Card, CardTitle } from '../../components/ui/Layout';
import { StatusBadge } from '../../components/ui/Badge';
import { GroupageMeter } from '../../components/ui/Progress';
import { Button } from '../../components/ui/Button';
import { Input, Select, Textarea } from '../../components/ui/Field';
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
    assignedManagerId: null
  });
  const [images, setImages] = useState<string[]>([]);
  const [highlights, setHighlights] = useState('');
  const [saving, setSaving] = useState(false);
  const [statusNote, setStatusNote] = useState('');
  const [statusBusy, setStatusBusy] = useState<string | null>(null);

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
      assignedManagerId: g.assignedManagerId
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

  async function changeStatus(status: string) {
    if (status === 'cancelled' && !window.confirm('Annuler ce groupage ? Les participants seront notifiés.')) return;
    setStatusBusy(status);
    try {
      await updateGroupageStatus(id, status, statusNote);
      toast('success', `Groupage : ${statusMeta(GROUPAGE_STATUS, status).label}`, 'Les participants ont été notifiés.');
      setStatusNote('');
      existing.reload();
    } catch (err) {
      toast('error', 'Changement impossible', friendlyError(err));
    } finally {
      setStatusBusy(null);
    }
  }

  const currentIdx = GROUPAGE_STATUS_FLOW.indexOf(g?.status || 'draft');
  const nextStatuses = GROUPAGE_STATUS_FLOW.slice(currentIdx + 1, currentIdx + 3);
  const paidParticipants = (participants.data || []).filter(p => p.status === 'paid');
  const collected = paidParticipants.reduce((s, p) => s + Number(p.total_xof || 0), 0);

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
              Étape actuelle : <span className="font-semibold text-ink">{statusMeta(GROUPAGE_STATUS, g.status).label}</span>. Chaque changement notifie les participants.
            </p>
            <Input value={statusNote} onChange={e => setStatusNote(e.target.value)} placeholder="Information pour les participants (optionnel)" wrapperClassName="mt-3" aria-label="Note d’étape" />
            <div className="mt-3 flex flex-wrap gap-2">
              {nextStatuses.map(s => (
                <Button key={s} size="sm" loading={statusBusy === s} onClick={() => changeStatus(s)}>
                  {s === 'open' ? 'Publier (ouvrir les participations)' : `Passer à « ${statusMeta(GROUPAGE_STATUS, s).label} »`}
                </Button>
              ))}
              <Select
                value=""
                onChange={e => e.target.value && changeStatus(e.target.value)}
                placeholder="Autre étape…"
                options={GROUPAGE_STATUS_FLOW.concat(isAdmin ? ['cancelled'] : [])
                  .filter(s => s !== g.status && !nextStatuses.includes(s))
                  .map(s => ({ value: s, label: statusMeta(GROUPAGE_STATUS, s).label }))}
                className="h-9 text-[13px]"
                aria-label="Autre étape"
              />
            </div>
            {g.status === 'draft' && <p className="mt-3 text-[12.5px] text-muted">En brouillon, le groupage n’est pas visible par les clients.</p>}
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
          <CardTitle>Participants</CardTitle>
          {participants.loading ? (
            <Skeleton className="h-32" />
          ) : participants.error ? (
            <InlineAlert tone="warning">{participants.error}</InlineAlert>
          ) : !(participants.data || []).length ? (
            <p className="py-4 text-sm text-muted">Aucun participant pour le moment.</p>
          ) : (
            <ul className="divide-y divide-line">
              {(participants.data || []).map(p => (
                <li key={p.participant_id} className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between">
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
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {p.phone && (
                      <a href={`tel:${p.phone.replace(/\s/g, '')}`} className="inline-flex items-center gap-1 text-[12.5px] font-semibold text-muted hover:text-ink">
                        <Phone className="h-3.5 w-3.5" /> {p.phone}
                      </a>
                    )}
                    <StatusBadge map={PARTICIPANT_STATUS} status={p.status} />
                    {p.payment_status && <StatusBadge map={PAYMENT_STATUS} status={p.payment_status} />}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      )}
    </div>
  );
}
