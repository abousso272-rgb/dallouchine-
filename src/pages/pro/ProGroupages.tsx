import React, { useEffect, useState } from 'react';
import { 
  Users, 
  Plus, 
  Search, 
  Clock, 
  ChevronRight, 
  CheckCircle2, 
  Truck, 
  X, 
  Eye, 
  Ship,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { listStaffGroupages, updateGroupageStatus, listGroupageParticipants, type GroupageParticipantRow } from '../../services/groupages';
import type { Groupage } from '../../lib/types';
import { formatXOF, formatDateTime } from '../../lib/format';
import { GROUPAGE_STATUS, GROUPAGE_STATUS_FLOW } from '../../lib/status';
import { Badge, StatusBadge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Spinner } from '../../components/ui/States';

export default function ProGroupages() {
  const { toast } = useApp();
  const [groupages, setGroupages] = useState<Groupage[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedGroupage, setSelectedGroupage] = useState<Groupage | null>(null);
  const [participants, setParticipants] = useState<GroupageParticipantRow[]>([]);
  const [loadingParticipants, setLoadingParticipants] = useState(false);
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [statusNote, setStatusNote] = useState('');

  const load = () => {
    setLoading(true);
    listStaffGroupages()
      .then(res => setGroupages(res || []))
      .catch(err => {
        console.warn('[pro] listStaffGroupages fallback:', err);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const openParticipants = async (g: Groupage) => {
    setSelectedGroupage(g);
    setNewStatus(g.status);
    setStatusNote(g.statusNote || '');
    setLoadingParticipants(true);
    try {
      const data = await listGroupageParticipants(g.id);
      setParticipants(data || []);
    } catch (err: any) {
      console.warn('[pro] listParticipants:', err);
      setParticipants([]);
    } finally {
      setLoadingParticipants(false);
    }
  };

  const handleStatusChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGroupage) return;
    setStatusUpdating(true);
    try {
      await updateGroupageStatus(selectedGroupage.id, newStatus, statusNote);
      toast('success', 'Statut du groupage actualisé', `Nouveau statut: ${newStatus}`);
      setSelectedGroupage(null);
      load();
    } catch (err: any) {
      toast('error', 'Erreur de mise à jour', err.message || 'Impossible de mettre à jour le groupage.');
    } finally {
      setStatusUpdating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-ink sm:text-3xl">Gestion des Groupages & Conteneurs</h1>
          <p className="mt-1 text-sm text-muted">
            Suivi des jauges MOQ, quotas de réservation, participants et jalons logistiques
          </p>
        </div>
        <Button variant="secondary" size="sm" onClick={load} icon={<Clock className="h-4 w-4" />}>
          Actualiser
        </Button>
      </div>

      {/* Grille des campagnes de groupage */}
      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <Spinner className="h-8 w-8 text-brand" />
        </div>
      ) : groupages.length === 0 ? (
        <div className="card p-12 text-center">
          <Users className="mx-auto h-12 w-12 text-muted" />
          <h3 className="mt-3 text-base font-semibold text-ink">Aucun groupage en cours</h3>
          <p className="mt-1 text-sm text-muted">Toutes les campagnes sont clôturées ou archivées.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {groupages.map(g => {
            const pct = Math.min(100, Math.round(((g.reservedQuantity || 0) / (g.targetQuantity || 1)) * 100));
            const isFull = pct >= 100;

            return (
              <div key={g.id} className="card flex flex-col justify-between p-5 hover:border-brand/40">
                <div className="space-y-4">
                  {/* Haut de la carte */}
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-semibold text-brand">{g.code}</span>
                        <StatusBadge map={GROUPAGE_STATUS} status={g.status} />
                      </div>
                      <h3 className="mt-1 text-base font-bold text-ink">{g.title}</h3>
                      <p className="text-xs text-muted">Trajet : {g.route || 'Yiwu / Ningbo → Port Autonome de Dakar'}</p>
                    </div>

                    {g.image && (
                      <img
                        src={g.image}
                        alt={g.title}
                        className="h-14 w-14 shrink-0 rounded-xl object-cover bg-paper-2"
                      />
                    )}
                  </div>

                  {/* Jauge MOQ */}
                  <div className="rounded-xl bg-paper-2 p-3.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-muted">Progression MOQ</span>
                      <span className="font-bold text-ink">{g.reservedQuantity} / {g.targetQuantity} réservés ({pct}%)</span>
                    </div>
                    <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-line">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          isFull ? 'bg-emerald-500' : pct > 60 ? 'bg-amber-500' : 'bg-brand'
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <div className="mt-2 flex items-center justify-between text-[11px] text-muted">
                      <span>{g.participantsCount || 0} participants</span>
                      <span>Économie : {formatXOF(g.originalPriceXOF - g.unitPriceXOF)} / unité</span>
                    </div>
                  </div>

                  {/* Détails financiers & transport */}
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="rounded-lg border border-line bg-paper p-2.5">
                      <span className="text-[11px] text-muted block">Prix groupage</span>
                      <span className="font-bold text-ink">{formatXOF(g.unitPriceXOF)}</span>
                    </div>
                    <div className="rounded-lg border border-line bg-paper p-2.5">
                      <span className="text-[11px] text-muted block">Transport</span>
                      <span className="font-semibold text-ink flex items-center gap-1">
                        <Ship className="h-3 w-3 text-muted" />
                        {g.transportMode === 'sea' ? 'Fret Maritime' : 'Fret Aérien'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Bouton d'action */}
                <div className="mt-5 pt-3 border-t border-line flex items-center justify-between">
                  <div className="text-xs text-muted">
                    {g.deadline ? `Clôture : ${formatDateTime(g.deadline)}` : 'Campagne active'}
                  </div>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => openParticipants(g)}
                    icon={<Users className="h-3.5 w-3.5" />}
                  >
                    Gérer & Participants
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Participants & Évolution du jalon */}
      {selectedGroupage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="card w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 shadow-xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-line pb-4">
              <div>
                <h3 className="text-lg font-bold text-ink">Pilotage : {selectedGroupage.title}</h3>
                <p className="text-xs text-muted">Code : {selectedGroupage.code} · Trajet : {selectedGroupage.route}</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedGroupage(null)}
                className="rounded-lg p-1.5 text-muted hover:bg-paper hover:text-ink"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Formulaire statut */}
            <form onSubmit={handleStatusChange} className="mt-4 rounded-xl border border-line bg-paper p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-ink">Faire avancer l'étape</span>
                <StatusBadge map={GROUPAGE_STATUS} status={selectedGroupage.status} />
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold text-muted">Nouveau jalon</label>
                  <select
                    value={newStatus}
                    onChange={e => setNewStatus(e.target.value)}
                    className="mt-1 h-10 w-full rounded-xl border border-line bg-paper px-3 text-xs font-semibold text-ink outline-none focus:border-brand"
                  >
                    <option value="open">Ouvert aux réservations</option>
                    <option value="almost_full">Presque complet</option>
                    <option value="full">Objectif atteint (Prêt)</option>
                    <option value="validated">Validé pour production</option>
                    <option value="supplier_ordered">Commandé à l'usine Chine</option>
                    <option value="preparing">En consolidation entrepôt</option>
                    <option value="shipped">Expédié en mer/air</option>
                    <option value="arrived">Arrivé Port Dakar</option>
                    <option value="completed">Terminé & distribué</option>
                    <option value="cancelled">Annulé</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-muted">Note publique / info client</label>
                  <input
                    type="text"
                    placeholder="Ex : Conteneur embarqué à Ningbo..."
                    value={statusNote}
                    onChange={e => setStatusNote(e.target.value)}
                    className="mt-1 h-10 w-full rounded-xl border border-line bg-paper px-3 text-xs text-ink outline-none focus:border-brand"
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  loading={statusUpdating}
                  icon={<CheckCircle2 className="h-3.5 w-3.5" />}
                >
                  Mettre à jour le statut
                </Button>
              </div>
            </form>

            {/* Liste des participants */}
            <div className="mt-6">
              <h4 className="text-sm font-bold text-ink">
                Participants & Souscriptions ({participants.length})
              </h4>

              {loadingParticipants ? (
                <div className="flex h-32 items-center justify-center">
                  <Spinner className="h-6 w-6 text-brand" />
                </div>
              ) : participants.length === 0 ? (
                <p className="mt-3 text-xs text-muted">Aucun participant enregistré sur ce groupage pour le moment.</p>
              ) : (
                <div className="mt-3 overflow-hidden rounded-xl border border-line">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-paper-2 text-muted font-semibold">
                      <tr>
                        <th className="px-3 py-2.5">Participant</th>
                        <th className="px-3 py-2.5">Contact</th>
                        <th className="px-3 py-2.5">Quantité</th>
                        <th className="px-3 py-2.5">Montant</th>
                        <th className="px-3 py-2.5">Statut</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-line">
                      {participants.map(p => (
                        <tr key={p.participant_id} className="hover:bg-paper/40">
                          <td className="px-3 py-2.5 font-medium text-ink">{p.full_name}</td>
                          <td className="px-3 py-2.5 text-muted">{p.phone || p.email || '—'}</td>
                          <td className="px-3 py-2.5 font-bold text-ink">{p.quantity} pcs</td>
                          <td className="px-3 py-2.5 font-semibold text-ink">{formatXOF(p.total_xof)}</td>
                          <td className="px-3 py-2.5">
                            <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                              p.status === 'paid' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                            }`}>
                              {p.status === 'paid' ? 'Payé' : 'Réservé'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
