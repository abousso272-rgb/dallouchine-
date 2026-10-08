import React, { useEffect, useState } from 'react';
import { CheckCircle2, ClipboardList, ExternalLink, FilePlus2, Mail, MessageCircle, Phone, Plus, Star, Trash2, UserCheck } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useAsync } from '../../lib/hooks';
import { addFinding, deleteFinding, getRequest, listFindings, listStaffQuotes, selectFinding, staffUpdateRequest } from '../../services/requests';
import { listTeam } from '../../services/admin';
import { friendlyError } from '../../lib/db';
import { formatDate, formatNumber, formatXOF } from '../../lib/format';
import { REQUEST_STATUS, REQUEST_TYPE_LABEL, ROLE_LABEL, statusMeta, type RequestType } from '../../lib/status';
import { PageHeader, Card, CardTitle, DefinitionList } from '../../components/ui/Layout';
import { StatusBadge, Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Input, Select, Textarea } from '../../components/ui/Field';
import { EmptyState, ErrorState, PageLoader } from '../../components/ui/States';
import { FileThumb } from '../../components/ui/Uploads';
import { Link } from '../../components/ui/Link';
import { QuoteCard } from '../../components/requests/QuoteCard';
import { MessageThread } from '../../components/requests/MessageThread';
import { QuoteBuilder } from '../../components/pro/QuoteBuilder';
import { AiAnalysisCard } from '../../components/pro/AiAnalysisCard';

// Statuts que le personnel peut positionner manuellement (les autres découlent du devis et du paiement)
const MANUAL_STATUSES: Record<RequestType, string[]> = {
  sourcing: ['new', 'researching', 'supplier_found', 'negotiating', 'quote_ready', 'ordered', 'completed', 'cancelled'],
  b2b: ['new', 'qualified', 'sourcing', 'negotiation', 'production', 'shipping', 'completed', 'cancelled'],
  vehicle: ['new', 'in_review', 'ordered', 'shipped', 'delivered', 'cancelled']
};

export default function StaffRequestDetailPage({ type, id }: { type: RequestType; id: string }) {
  const { user, toast } = useApp();
  const isAdmin = user?.role === 'admin';
  const req = useAsync(() => getRequest(type, id), [type, id]);
  const findings = useAsync(() => listFindings(type, id), [type, id]);
  const quotes = useAsync(() => listStaffQuotes(type, id), [type, id]);
  const team = useAsync(() => listTeam().catch(() => []), []);

  const [status, setStatus] = useState('');
  const [assignee, setAssignee] = useState('');
  const [internalNotes, setInternalNotes] = useState('');
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);
  const [builderOpen, setBuilderOpen] = useState(false);

  const [fSupplier, setFSupplier] = useState('');
  const [fUrl, setFUrl] = useState('');
  const [fCny, setFCny] = useState('');
  const [fXof, setFXof] = useState('');
  const [fMoq, setFMoq] = useState('');
  const [fLead, setFLead] = useState('');
  const [fNotes, setFNotes] = useState('');
  const [addingFinding, setAddingFinding] = useState(false);

  const r = req.data;
  useEffect(() => {
    if (!r) return;
    setStatus(r.status);
    setAssignee(r.assignedTo || '');
    setInternalNotes(r.internalNotes || '');
  }, [r]);

  if (req.loading) return <PageLoader />;
  if (req.error) return <ErrorState message={req.error} onRetry={req.reload} />;
  if (!r) return <EmptyState icon={<ClipboardList className="h-5 w-5" />} title="Demande introuvable" action={<Button to="/espace-pro/demandes">Retour</Button>} />;

  const staffOptions = (team.data || []).filter(m => ['admin', 'super_admin', 'operations', 'commercial', 'finance', 'transitaire', 'sourcing', 'sourcer'].includes(m.role.toLowerCase()));
  const assignedMember = (team.data || []).find(m => m.id === r.assignedTo);
  const statusOptions = Array.from(new Set([r.status, ...MANUAL_STATUSES[type]]));

  async function save(extra: { assignTo?: string | null; unassign?: boolean } = {}) {
    setSaving(true);
    try {
      await staffUpdateRequest(type, r!.id, {
        status: status !== r!.status ? status : null,
        assignedTo: extra.assignTo !== undefined ? extra.assignTo : assignee && assignee !== r!.assignedTo ? assignee : null,
        unassign: extra.unassign,
        internalNotes: internalNotes !== (r!.internalNotes || '') ? internalNotes : null,
        messageToClient: message || null
      });
      toast('success', 'Demande mise à jour', message ? 'Le message a été envoyé au client.' : undefined);
      setMessage('');
      req.reload();
    } catch (err) {
      toast('error', 'Mise à jour impossible', friendlyError(err));
    } finally {
      setSaving(false);
    }
  }

  async function submitFinding(e: React.FormEvent) {
    e.preventDefault();
    if (fSupplier.trim().length < 2) return toast('error', 'Nom du fournisseur requis');
    if (fUrl && !/^https?:\/\//.test(fUrl)) return toast('error', 'Le lien doit commencer par https://');
    setAddingFinding(true);
    try {
      await addFinding(type, r!.id, user!.id, {
        supplierName: fSupplier.trim(),
        supplierUrl: fUrl.trim() || null,
        unitPriceCNY: fCny ? Number(fCny) : null,
        unitPriceXOF: fXof ? Number(fXof) : null,
        moq: fMoq ? Number(fMoq) : null,
        leadTimeDays: fLead ? Number(fLead) : null,
        notes: fNotes.trim() || null
      });
      setFSupplier('');
      setFUrl('');
      setFCny('');
      setFXof('');
      setFMoq('');
      setFLead('');
      setFNotes('');
      findings.reload();
      if (type === 'sourcing' && ['new', 'researching'].includes(r!.status)) {
        await staffUpdateRequest(type, r!.id, { status: 'supplier_found' }).catch(() => undefined);
        req.reload();
      }
    } catch (err) {
      toast('error', 'Résultat non enregistré', friendlyError(err));
    } finally {
      setAddingFinding(false);
    }
  }

  return (
    <div className="space-y-5">
      <PageHeader
        back={{ to: `/espace-pro/demandes?type=${type}`, label: 'Demandes' }}
        eyebrow={`${REQUEST_TYPE_LABEL[type]} · ${r.code} · reçue le ${formatDate(r.createdAt)}`}
        title={r.title}
        actions={
          <div className="flex flex-wrap gap-2">
            <StatusBadge map={REQUEST_STATUS[type]} status={r.status} />
            <Button size="sm" icon={<FilePlus2 className="h-4 w-4" />} onClick={() => setBuilderOpen(true)}>
              Créer un devis
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1.25fr_1fr]">
        <div className="space-y-5">
          <Card>
            <CardTitle>Besoin du client</CardTitle>
            {r.description && <p className="mb-4 whitespace-pre-line text-[14px] leading-relaxed">{r.description}</p>}
            <DefinitionList
              columns={2}
              items={[
                { label: 'Quantité', value: formatNumber(r.quantity) },
                { label: 'Budget', value: r.budgetXOF ? formatXOF(r.budgetXOF) : 'Non précisé' },
                { label: 'Catégorie / secteur', value: r.category },
                ...Object.entries(r.extra).map(([label, value]) => ({ label, value: value === null ? null : String(value) }))
              ]}
            />
            {r.notes && <p className="mt-4 rounded-xl bg-paper p-3 text-[13.5px] text-muted">{r.notes}</p>}
            {r.links.length > 0 && (
              <div className="mt-4 space-y-1.5">
                {r.links.map(l => (
                  <Link key={l} to={l} className="flex items-center gap-1.5 text-[13.5px] font-semibold text-ink hover:text-brand">
                    <ExternalLink className="h-3.5 w-3.5 shrink-0" /> <span className="truncate">{l}</span>
                  </Link>
                ))}
              </div>
            )}
            {r.images.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {r.images.map(img => (
                  <FileThumb key={img} refUrl={img} className="h-24 w-24" />
                ))}
              </div>
            )}
          </Card>

          {r.aiAnalysis && (
            <AiAnalysisCard
              analysis={r.aiAnalysis}
              onAddFinding={async c => {
                try {
                  await addFinding(type, r.id, user!.id, {
                    supplierName: c.supplier || c.title.slice(0, 80),
                    supplierUrl: c.url,
                    unitPriceCNY: null,
                    unitPriceXOF: null,
                    moq: c.moq ? Number(String(c.moq).replace(/\D/g, '')) || null : null,
                    leadTimeDays: null,
                    notes: [c.title, c.price && `Prix affiché : ${c.price}`, 'Trouvé par l’analyse IA'].filter(Boolean).join(' · ')
                  });
                  toast('success', 'Ajouté aux résultats fournisseurs');
                  findings.reload();
                } catch (err) {
                  toast('error', 'Ajout impossible', friendlyError(err));
                }
              }}
            />
          )}

          <Card>
            <CardTitle>Résultats fournisseurs (interne)</CardTitle>
            {(findings.data || []).length === 0 ? (
              <p className="mb-4 text-sm text-muted">Aucun fournisseur enregistré. Ajoutez vos pistes avec leurs prix d’achat : elles restent invisibles pour le client.</p>
            ) : (
              <ul className="mb-4 space-y-2.5">
                {(findings.data || []).map(f => (
                  <li key={f.id} className={`rounded-2xl border p-3.5 ${f.isSelected ? 'border-ink bg-paper' : 'border-line'}`}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="flex items-center gap-2 text-sm font-semibold">
                          {f.supplierName} {f.isSelected && <Badge tone="success">Retenu</Badge>}
                        </p>
                        <p className="mt-0.5 text-[12.5px] text-muted">
                          {[
                            f.unitPriceXOF ? `${formatXOF(f.unitPriceXOF)} / u.` : null,
                            f.unitPriceCNY ? `¥${formatNumber(f.unitPriceCNY)}` : null,
                            f.moq ? `MOQ ${formatNumber(f.moq)}` : null,
                            f.leadTimeDays ? `${f.leadTimeDays} j de production` : null
                          ]
                            .filter(Boolean)
                            .join(' · ')}
                        </p>
                        {f.notes && <p className="mt-1 text-[12.5px] text-muted">{f.notes}</p>}
                        {f.supplierUrl && (
                          <Link to={f.supplierUrl} className="mt-1 inline-flex items-center gap-1 text-[12.5px] font-semibold hover:text-brand">
                            <ExternalLink className="h-3 w-3" /> Fiche fournisseur
                          </Link>
                        )}
                      </div>
                      <div className="flex shrink-0 gap-1">
                        {!f.isSelected && (
                          <button
                            type="button"
                            onClick={() => selectFinding(type, r.id, f.id).then(findings.reload).catch(err => toast('error', 'Action impossible', friendlyError(err)))}
                            className="rounded-lg p-1.5 text-subtle hover:bg-paper hover:text-ink"
                            aria-label="Retenir ce fournisseur"
                            title="Retenir ce fournisseur"
                          >
                            <Star className="h-4 w-4" />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => window.confirm('Supprimer ce résultat ?') && deleteFinding(f.id).then(findings.reload).catch(err => toast('error', 'Suppression impossible', friendlyError(err)))}
                          className="rounded-lg p-1.5 text-subtle hover:bg-red-50 hover:text-red-700"
                          aria-label="Supprimer"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
            <form onSubmit={submitFinding} className="grid grid-cols-1 gap-3 rounded-2xl bg-paper p-3.5 sm:grid-cols-2">
              <Input label="Fournisseur / usine" value={fSupplier} onChange={e => setFSupplier(e.target.value)} placeholder="Nom, ville" />
              <Input label="Lien (1688, Alibaba…)" value={fUrl} onChange={e => setFUrl(e.target.value)} placeholder="https://" />
              <Input label="Prix d’achat unitaire" inputMode="numeric" value={fXof} onChange={e => setFXof(e.target.value.replace(/\D/g, ''))} suffix="FCFA" />
              <Input label="Prix en yuans" inputMode="decimal" value={fCny} onChange={e => setFCny(e.target.value.replace(/[^\d.]/g, ''))} suffix="CNY" />
              <Input label="MOQ" inputMode="numeric" value={fMoq} onChange={e => setFMoq(e.target.value.replace(/\D/g, ''))} />
              <Input label="Délai de production" inputMode="numeric" value={fLead} onChange={e => setFLead(e.target.value.replace(/\D/g, ''))} suffix="jours" />
              <Textarea label="Observations" value={fNotes} onChange={e => setFNotes(e.target.value)} rows={2} wrapperClassName="sm:col-span-2" placeholder="Qualité, échantillon, certification…" />
              <div className="sm:col-span-2">
                <Button type="submit" variant="dark" size="sm" loading={addingFinding} icon={<Plus className="h-4 w-4" />}>
                  Ajouter ce fournisseur
                </Button>
              </div>
            </form>
          </Card>

          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Devis</h2>
              <Button size="sm" variant="secondary" icon={<FilePlus2 className="h-4 w-4" />} onClick={() => setBuilderOpen(true)}>
                Nouveau devis
              </Button>
            </div>
            {(quotes.data || []).length === 0 ? (
              <div className="card">
                <EmptyState compact title="Aucun devis" description="Créez une proposition chiffrée : le client pourra l’accepter et payer l’acompte en ligne." />
              </div>
            ) : (
              (quotes.data || []).map(q => <QuoteCard key={q.id} quote={q} viewer="staff" onChanged={quotes.reload} />)
            )}
          </section>
        </div>

        <div className="space-y-5">
          <Card>
            <CardTitle>Client</CardTitle>
            <p className="font-semibold">{r.contactName}</p>
            {r.company && <p className="text-sm text-muted">{r.company}</p>}
            <div className="mt-3 flex flex-wrap gap-2">
              {r.contactPhone && (
                <>
                  <Button size="sm" variant="secondary" icon={<Phone className="h-3.5 w-3.5" />} to={`tel:${r.contactPhone.replace(/\s/g, '')}`}>
                    {r.contactPhone}
                  </Button>
                  <Button size="sm" variant="secondary" icon={<MessageCircle className="h-3.5 w-3.5" />} to={`https://wa.me/${r.contactPhone.replace(/\D/g, '').replace(/^(\d{9})$/, '221$1')}`}>
                    WhatsApp
                  </Button>
                </>
              )}
              {r.contactEmail && (
                <Button size="sm" variant="secondary" icon={<Mail className="h-3.5 w-3.5" />} to={`mailto:${r.contactEmail}`}>
                  Email
                </Button>
              )}
            </div>
          </Card>

          <Card>
            <CardTitle>Traitement</CardTitle>
            <div className="mb-4 flex items-center justify-between gap-3 rounded-xl bg-paper p-3 text-sm">
              <span className="text-muted">Pris en charge par</span>
              <span className="font-semibold">{assignedMember ? assignedMember.fullName : r.assignedTo ? 'Membre de l’équipe' : 'Personne'}</span>
            </div>
            {!isAdmin && r.assignedTo !== user?.id && (
              <Button block variant="dark" className="mb-4" icon={<UserCheck className="h-4 w-4" />} loading={saving} onClick={() => save({ assignTo: user!.id })}>
                Prendre en charge
              </Button>
            )}
            <div className="space-y-4">
              <Select label="Statut" value={status} onChange={e => setStatus(e.target.value)} options={statusOptions.map(s => ({ value: s, label: statusMeta(REQUEST_STATUS[type], s).label }))} hint="Devis envoyé / accepté / acompte : mis à jour automatiquement." />
              {isAdmin && (
                <Select
                  label="Attribuer à"
                  value={assignee}
                  onChange={e => setAssignee(e.target.value)}
                  placeholder="Non attribuée"
                  options={staffOptions.map(m => ({ value: m.id, label: `${m.fullName} — ${ROLE_LABEL[['transitaire', 'sourcing', 'sourcer'].includes(m.role) ? 'transitaire' : 'admin']}` }))}
                />
              )}
              <Textarea label="Notes internes" value={internalNotes} onChange={e => setInternalNotes(e.target.value)} rows={3} placeholder="Visibles uniquement par l’équipe" />
              <Textarea label="Message au client (optionnel)" value={message} onChange={e => setMessage(e.target.value)} rows={2} placeholder="Envoyé dans le fil et notifié au client" />
              <div className="flex flex-wrap gap-2">
                <Button loading={saving} onClick={() => save()} icon={<CheckCircle2 className="h-4 w-4" />}>
                  Enregistrer
                </Button>
                {isAdmin && r.assignedTo && (
                  <Button variant="ghost" onClick={() => save({ unassign: true, assignTo: null })}>
                    Retirer l’attribution
                  </Button>
                )}
              </div>
            </div>
          </Card>

          <MessageThread type={type} threadId={r.id} viewer="staff" title="Échanges avec le client" emptyText="Aucun message. Écrivez au client pour préciser son besoin." />
        </div>
      </div>

      {builderOpen && (
        <QuoteBuilder
          open
          onClose={() => setBuilderOpen(false)}
          request={r}
          findings={findings.data || []}
          onCreated={() => {
            quotes.reload();
            req.reload();
          }}
        />
      )}
    </div>
  );
}
