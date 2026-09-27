import React, { useEffect, useState } from 'react';
import { 
  Search, 
  ExternalLink, 
  Clock, 
  FileText, 
  Send, 
  CheckCircle2, 
  User, 
  DollarSign, 
  Image as ImageIcon,
  AlertCircle,
  X,
  Plus
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { listRequests, staffUpdateRequest, createQuote, type QuoteDraft } from '../../services/requests';
import type { ClientRequest } from '../../lib/types';
import type { RequestType } from '../../lib/status';
import { formatXOF, formatDateTime } from '../../lib/format';
import { REQUEST_STATUS } from '../../lib/status';
import { StatusBadge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Spinner } from '../../components/ui/States';

export default function ProSourcing() {
  const { toast } = useApp();
  const [activeType, setActiveType] = useState<RequestType>('sourcing');
  const [requests, setRequests] = useState<ClientRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  // Modal de devis
  const [selectedReq, setSelectedReq] = useState<ClientRequest | null>(null);
  const [quoteModal, setQuoteModal] = useState(false);
  const [quoteSubtotal, setQuoteSubtotal] = useState('');
  const [quoteShipping, setQuoteShipping] = useState('');
  const [quoteCustoms, setQuoteCustoms] = useState('');
  const [quoteLeadTime, setQuoteLeadTime] = useState('20 à 25 jours');
  const [quoteNotes, setQuoteNotes] = useState('');
  const [quoteSubmitting, setQuoteSubmitting] = useState(false);

  const load = (t: RequestType) => {
    setLoading(true);
    listRequests(t)
      .then(res => setRequests(res || []))
      .catch(err => {
        console.warn('[pro] listRequests fallback:', err);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load(activeType);
  }, [activeType]);

  const handleStatusUpdate = async (req: ClientRequest, nextStatus: string) => {
    try {
      await staffUpdateRequest(activeType, req.id, { status: nextStatus });
      toast('success', 'Statut mis à jour', `La demande ${req.code} est passée à : ${nextStatus}`);
      load(activeType);
    } catch (err: any) {
      toast('error', 'Erreur', err.message || 'Impossible de mettre à jour le statut.');
    }
  };

  const openQuoteModal = (req: ClientRequest) => {
    setSelectedReq(req);
    setQuoteSubtotal(req.budgetXOF ? String(Math.round(req.budgetXOF * 0.75)) : '500000');
    setQuoteShipping('120000');
    setQuoteCustoms('80000');
    setQuoteLeadTime('20 à 25 jours');
    setQuoteNotes('Offre FOB Guangzhou avec contrôle qualité sur site DALUCHE.');
    setQuoteModal(true);
  };

  const handleCreateQuote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReq) return;
    setQuoteSubmitting(true);

    const sub = parseInt(quoteSubtotal, 10) || 0;
    const ship = parseInt(quoteShipping, 10) || 0;
    const cust = parseInt(quoteCustoms, 10) || 0;
    const tot = sub + ship + cust;

    const draft: QuoteDraft = {
      items: [
        {
          description: selectedReq.title,
          quantity: selectedReq.quantity || 1,
          unit_price_xof: Math.round(sub / (selectedReq.quantity || 1))
        }
      ],
      shippingXOF: ship,
      customsXOF: cust,
      feesXOF: 0,
      discountXOF: 0,
      depositPercent: 70,
      validDays: 14,
      leadTime: quoteLeadTime,
      transportMode: 'sea',
      conditions: [
        'Acompte de 70% à la validation pour lancement de production en Chine',
        'Solde de 30% à l’arrivée au port de Dakar après vérification',
        'Contrôle qualité photos/vidéos fourni avant expédition'
      ],
      notes: quoteNotes,
      send: true
    };

    try {
      await createQuote(activeType, selectedReq.id, draft);
      toast('success', 'Devis envoyé avec succès !', `Le devis officiel a été transmis au client.`);
      setQuoteModal(false);
      load(activeType);
    } catch (err: any) {
      toast('error', 'Erreur d’envoi du devis', err.message || 'Impossible de créer le devis.');
    } finally {
      setQuoteSubmitting(false);
    }
  };

  const filtered = requests.filter(r => {
    const s = search.toLowerCase();
    return (
      r.code.toLowerCase().includes(s) ||
      r.title.toLowerCase().includes(s) ||
      r.contactName.toLowerCase().includes(s) ||
      r.description.toLowerCase().includes(s)
    );
  });

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-ink sm:text-3xl">Pôle Sourcing, B2B & Véhicules</h1>
          <p className="mt-1 text-sm text-muted">
            Traitement des requêtes d'achat sur mesure auprès des fournisseurs chinois (1688, Taobao, usines)
          </p>
        </div>
        <Button variant="secondary" size="sm" onClick={() => load(activeType)} icon={<Clock className="h-4 w-4" />}>
          Actualiser
        </Button>
      </div>

      {/* Onglets des types de requêtes */}
      <div className="flex gap-2 border-b border-line pb-3">
        {[
          { id: 'sourcing' as const, label: 'Sourcing Chine (1688 / Usines)' },
          { id: 'b2b' as const, label: 'Commandes B2B & Gros' },
          { id: 'vehicle' as const, label: 'Véhicules & Motos' }
        ].map(t => (
          <button
            key={t.id}
            type="button"
            onClick={() => setActiveType(t.id)}
            className={`rounded-xl px-4 py-2 text-xs font-semibold transition ${
              activeType === t.id ? 'bg-ink text-white shadow-sm' : 'bg-paper text-muted hover:text-ink'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Barre de recherche */}
      <div className="card p-4">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <input
            type="text"
            placeholder="Rechercher par référence, produit demandé, nom du client…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="h-10 w-full rounded-xl border border-line bg-paper pl-10 pr-4 text-sm text-ink outline-none transition focus:border-brand"
          />
        </div>
      </div>

      {/* Tableau des requêtes */}
      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <Spinner className="h-8 w-8 text-brand" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="card p-12 text-center">
          <Search className="mx-auto h-12 w-12 text-muted" />
          <h3 className="mt-3 text-base font-semibold text-ink">Aucune demande trouvée</h3>
          <p className="mt-1 text-sm text-muted">Toutes les demandes de cette catégorie ont été traitées.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map(req => (
            <div key={req.id} className="card p-5 hover:border-brand/40 space-y-4">
              <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-brand">{req.code}</span>
                    <StatusBadge map={REQUEST_STATUS[activeType]} status={req.status} />
                  </div>
                  <h3 className="mt-1.5 text-base font-bold text-ink">{req.title}</h3>
                  <p className="mt-1 text-xs text-muted max-w-2xl">{req.description}</p>
                </div>

                <div className="flex shrink-0 items-center gap-2">
                  <select
                    value={req.status}
                    onChange={e => handleStatusUpdate(req, e.target.value)}
                    className="h-9 rounded-xl border border-line bg-paper px-2.5 text-xs font-semibold text-ink outline-none focus:border-brand"
                  >
                    <option value="received">Reçue (Nouvelle)</option>
                    <option value="assigned">Assignée à un sourceur</option>
                    <option value="searching">Recherche fournisseurs en cours</option>
                    <option value="quote_ready">Devis prêt</option>
                    <option value="quote_sent">Devis transmis au client</option>
                    <option value="accepted">Acceptée par le client</option>
                    <option value="closed">Clôturée</option>
                  </select>

                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => openQuoteModal(req)}
                    icon={<FileText className="h-3.5 w-3.5" />}
                  >
                    Faire un devis
                  </Button>
                </div>
              </div>

              {/* Détails client & exigences */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-4 rounded-xl bg-paper-2 p-3.5 text-xs">
                <div>
                  <span className="text-muted block text-[11px]">Client & Contact</span>
                  <span className="font-semibold text-ink">{req.contactName}</span>
                </div>
                <div>
                  <span className="text-muted block text-[11px]">Quantité demandée</span>
                  <span className="font-bold text-ink">{req.quantity} unités</span>
                </div>
                <div>
                  <span className="text-muted block text-[11px]">Budget indicatif</span>
                  <span className="font-semibold text-ink">{req.budgetXOF ? formatXOF(req.budgetXOF) : 'À estimer'}</span>
                </div>
                <div>
                  <span className="text-muted block text-[11px]">Date de soumission</span>
                  <span className="text-muted">{formatDateTime(req.createdAt)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Devis */}
      {quoteModal && selectedReq && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="card w-full max-w-lg p-6 shadow-xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-line pb-4">
              <div>
                <h3 className="text-lg font-bold text-ink">Établir une cotation officielle</h3>
                <p className="text-xs text-muted">Pour : {selectedReq.contactName} ({selectedReq.code})</p>
              </div>
              <button
                type="button"
                onClick={() => setQuoteModal(false)}
                className="rounded-lg p-1.5 text-muted hover:bg-paper hover:text-ink"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateQuote} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted">
                  Prix marchandise Chine (FCFA) *
                </label>
                <input
                  type="number"
                  required
                  value={quoteSubtotal}
                  onChange={e => setQuoteSubtotal(e.target.value)}
                  className="mt-1.5 h-11 w-full rounded-xl border border-line bg-paper px-3 text-sm text-ink outline-none focus:border-brand"
                />
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-muted">
                    Fret maritime / aérien (FCFA)
                  </label>
                  <input
                    type="number"
                    value={quoteShipping}
                    onChange={e => setQuoteShipping(e.target.value)}
                    className="mt-1.5 h-11 w-full rounded-xl border border-line bg-paper px-3 text-sm text-ink outline-none focus:border-brand"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-muted">
                    Dédouanement Dakar (FCFA)
                  </label>
                  <input
                    type="number"
                    value={quoteCustoms}
                    onChange={e => setQuoteCustoms(e.target.value)}
                    className="mt-1.5 h-11 w-full rounded-xl border border-line bg-paper px-3 text-sm text-ink outline-none focus:border-brand"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted">
                  Délai indicatif de livraison
                </label>
                <input
                  type="text"
                  value={quoteLeadTime}
                  onChange={e => setQuoteLeadTime(e.target.value)}
                  className="mt-1.5 h-11 w-full rounded-xl border border-line bg-paper px-3 text-sm text-ink outline-none focus:border-brand"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted">
                  Précisions & garanties fournisseur
                </label>
                <textarea
                  rows={2}
                  value={quoteNotes}
                  onChange={e => setQuoteNotes(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-line bg-paper p-3 text-sm text-ink outline-none focus:border-brand"
                />
              </div>

              <div className="rounded-xl bg-brand-50 p-3 text-xs text-brand-900">
                <span className="font-bold">Total estimé client : </span>
                {formatXOF((parseInt(quoteSubtotal, 10) || 0) + (parseInt(quoteShipping, 10) || 0) + (parseInt(quoteCustoms, 10) || 0))}
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-line">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setQuoteModal(false)}
                >
                  Annuler
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  loading={quoteSubmitting}
                  icon={<Send className="h-4 w-4" />}
                >
                  Transmettre le devis
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
