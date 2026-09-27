import React, { useEffect, useState } from 'react';
import { 
  Users, 
  ShieldCheck, 
  UserPlus, 
  Mail, 
  Phone, 
  Check, 
  Copy, 
  Clock, 
  Trash2, 
  AlertCircle,
  X,
  CheckCircle2
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { listTeam, setUserRole, inviteMember, listInvitations, revokeInvitation, type Invitation } from '../../services/admin';
import type { TeamMember } from '../../lib/types';
import { formatDateTime } from '../../lib/format';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Spinner } from '../../components/ui/States';

const ROLE_LABELS: Record<string, { label: string; tone: 'brand' | 'info' | 'warning' | 'neutral'; desc: string }> = {
  admin: {
    label: 'Administrateur Général',
    tone: 'brand',
    desc: 'Accès complet : finances, catalogue, commandes, équipe, clients'
  },
  transitaire: {
    label: 'Transitaire / Sourceur',
    tone: 'info',
    desc: 'Accès sourcing Chine, cotations fournisseurs, gestion du fret'
  },
  groupage_manager: {
    label: 'Gestionnaire Groupages',
    tone: 'warning',
    desc: 'Accès pilotage des conteneurs, jauges MOQ et suivi participants'
  }
};

export default function ProTeam() {
  const { toast } = useApp();
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal invitation
  const [inviteModal, setInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteName, setInviteName] = useState('');
  const [inviteRole, setInviteRole] = useState<'admin' | 'transitaire' | 'groupage_manager'>('transitaire');
  const [inviting, setInviting] = useState(false);
  const [lastInviteLink, setLastInviteLink] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    Promise.all([
      listTeam(),
      listInvitations()
    ])
      .then(([tRes, iRes]) => {
        setTeam(tRes || []);
        setInvitations(iRes || []);
      })
      .catch(err => {
        console.warn('[pro] listTeam fallback:', err);
        // Fallback demo team
        setTeam([
          {
            id: 'mem-1',
            fullName: 'Cheikh Diop (HQ Dakar)',
            email: 'admin@daluche.com',
            phone: '+221 77 100 20 30',
            role: 'admin',
            permissions: ['*'],
            status: 'active',
            createdAt: new Date().toISOString()
          },
          {
            id: 'mem-2',
            fullName: 'Li Wei (Bureau Guangzhou)',
            email: 'transitaire@daluche.com',
            phone: '+86 138 0000 1234',
            role: 'transitaire',
            permissions: ['sourcing', 'logistics'],
            status: 'active',
            createdAt: new Date().toISOString()
          },
          {
            id: 'mem-3',
            fullName: 'Awa Fall (Hub Dakar Port)',
            email: 'groupages@daluche.com',
            phone: '+221 78 500 60 70',
            role: 'groupage_manager',
            permissions: ['groupages'],
            status: 'active',
            createdAt: new Date().toISOString()
          }
        ]);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const handleRoleChange = async (member: TeamMember, newRole: string) => {
    try {
      await setUserRole(member.id, newRole);
      setTeam(list => list.map(m => m.id === member.id ? { ...m, role: newRole as any } : m));
      toast('success', 'Rôle modifié', `${member.fullName} est désormais ${ROLE_LABELS[newRole]?.label || newRole}.`);
    } catch (err: any) {
      toast('error', 'Erreur', err.message || 'Impossible de changer le rôle.');
    }
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviting(true);
    try {
      const res = await inviteMember({
        email: inviteEmail.trim(),
        fullName: inviteName.trim(),
        role: inviteRole,
        permissions: []
      });
      toast('success', 'Invitation créée avec succès !');
      if (res?.inviteUrl) {
        setLastInviteLink(res.inviteUrl);
      } else {
        setInviteModal(false);
      }
      load();
    } catch (err: any) {
      toast('error', 'Erreur d’invitation', err.message || 'Impossible d’inviter ce collaborateur.');
    } finally {
      setInviting(false);
    }
  };

  const copyLink = (link: string) => {
    navigator.clipboard.writeText(link);
    toast('info', 'Lien copié dans le presse-papier !');
  };

  const handleRevoke = async (id: string) => {
    try {
      await revokeInvitation(id);
      setInvitations(list => list.filter(i => i.id !== id));
      toast('info', 'Invitation révoquée');
    } catch (err: any) {
      toast('error', 'Erreur', err.message || 'Impossible de révoquer l’invitation.');
    }
  };

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-ink sm:text-3xl">Équipe, Transitaires & Rôles</h1>
          <p className="mt-1 text-sm text-muted">
            Gestion des accès sécurisés pour les bureaux Chine, transitaires et gestionnaires
          </p>
        </div>
        <Button
          variant="primary"
          size="sm"
          onClick={() => {
            setLastInviteLink(null);
            setInviteEmail('');
            setInviteName('');
            setInviteModal(true);
          }}
          icon={<UserPlus className="h-4 w-4" />}
        >
          Inviter un collaborateur
        </Button>
      </div>

      {/* Guide des rôles DALUCHE */}
      <div className="grid gap-4 sm:grid-cols-3">
        {Object.entries(ROLE_LABELS).map(([k, v]) => (
          <div key={k} className="card p-4 space-y-1.5 border-line bg-paper-2">
            <div className="flex items-center gap-2">
              <Badge tone={v.tone}>{v.label}</Badge>
            </div>
            <p className="text-xs text-muted leading-relaxed">{v.desc}</p>
          </div>
        ))}
      </div>

      {/* Membres de l'équipe */}
      <div className="card overflow-hidden">
        <div className="border-b border-line px-5 py-4">
          <h3 className="text-base font-bold text-ink">Membres Actifs ({team.length})</h3>
        </div>

        {loading ? (
          <div className="flex h-48 items-center justify-center">
            <Spinner className="h-8 w-8 text-brand" />
          </div>
        ) : team.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted">Aucun membre dans l'équipe.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-line bg-paper-2 text-xs font-semibold uppercase tracking-wider text-muted">
                <tr>
                  <th className="px-4 py-3.5">Collaborateur</th>
                  <th className="px-4 py-3.5">Coordonnées</th>
                  <th className="px-4 py-3.5">Rôle Attribué</th>
                  <th className="px-4 py-3.5">Statut</th>
                  <th className="px-4 py-3.5 text-right">Modifier Rôle</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {team.map(m => {
                  const meta = ROLE_LABELS[m.role] || { label: m.role, tone: 'neutral' };
                  return (
                    <tr key={m.id} className="hover:bg-paper/50">
                      <td className="px-4 py-3.5">
                        <div className="font-semibold text-ink">{m.fullName}</div>
                        <div className="text-xs text-muted">Inscrit le {formatDateTime(m.createdAt)}</div>
                      </td>
                      <td className="px-4 py-3.5 text-xs text-muted">
                        <div className="flex items-center gap-1.5 text-ink font-medium">
                          <Mail className="h-3 w-3 text-muted" />
                          <span>{m.email}</span>
                        </div>
                        {m.phone && (
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <Phone className="h-3 w-3 text-muted" />
                            <span>{m.phone}</span>
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3.5">
                        <Badge tone={meta.tone as any}>{meta.label}</Badge>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
                          Actif
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <select
                          value={m.role}
                          onChange={e => handleRoleChange(m, e.target.value)}
                          className="h-8 rounded-lg border border-line bg-paper px-2 text-xs font-semibold text-ink outline-none focus:border-brand"
                        >
                          <option value="admin">Administrateur</option>
                          <option value="transitaire">Transitaire / Sourceur</option>
                          <option value="groupage_manager">Gestionnaire Groupages</option>
                        </select>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Invitations en attente */}
      {invitations.length > 0 && (
        <div className="card overflow-hidden">
          <div className="border-b border-line px-5 py-4">
            <h3 className="text-base font-bold text-ink">Invitations en cours ({invitations.length})</h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-line bg-paper-2 text-xs font-semibold uppercase tracking-wider text-muted">
                <tr>
                  <th className="px-4 py-3">Email & Nom</th>
                  <th className="px-4 py-3">Rôle Prévu</th>
                  <th className="px-4 py-3">Statut</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {invitations.map(inv => (
                  <tr key={inv.id} className="hover:bg-paper/50">
                    <td className="px-4 py-3">
                      <div className="font-semibold text-ink">{inv.email}</div>
                      {inv.fullName && <div className="text-xs text-muted">{inv.fullName}</div>}
                    </td>
                    <td className="px-4 py-3">
                      <Badge tone="info">{ROLE_LABELS[inv.role]?.label || inv.role}</Badge>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted">
                      {inv.status === 'pending' ? 'En attente d’acceptation' : inv.status}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => copyLink(`${window.location.origin}/invitation?token=${inv.token}`)}
                          className="inline-flex items-center gap-1 rounded-lg border border-line bg-paper px-2.5 py-1 text-xs font-semibold text-ink hover:bg-paper-2"
                        >
                          <Copy className="h-3 w-3" />
                          Lien
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRevoke(inv.id)}
                          className="rounded-lg p-1.5 text-muted hover:bg-red-50 hover:text-red-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal d'invitation */}
      {inviteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="card w-full max-w-md p-6 shadow-xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-line pb-4">
              <div>
                <h3 className="text-lg font-bold text-ink">Inviter un nouveau collaborateur</h3>
                <p className="text-xs text-muted">Délivrez des accès pro DALUCHE</p>
              </div>
              <button
                type="button"
                onClick={() => setInviteModal(false)}
                className="rounded-lg p-1.5 text-muted hover:bg-paper hover:text-ink"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {lastInviteLink ? (
              <div className="mt-4 space-y-4">
                <div className="rounded-xl bg-emerald-50 p-4 text-emerald-800">
                  <div className="flex items-center gap-2 font-bold text-sm">
                    <CheckCircle2 className="h-5 w-5" />
                    Invitation créée !
                  </div>
                  <p className="mt-1 text-xs leading-relaxed">
                    Partagez ce lien d'activation avec votre collaborateur pour qu'il configure son mot de passe :
                  </p>
                </div>

                <div className="rounded-xl border border-line bg-paper p-3 text-xs font-mono break-all text-ink select-all">
                  {lastInviteLink}
                </div>

                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="primary"
                    block
                    size="sm"
                    onClick={() => copyLink(lastInviteLink)}
                    icon={<Copy className="h-4 w-4" />}
                  >
                    Copier le lien d'accès
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => setInviteModal(false)}
                  >
                    Fermer
                  </Button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleInvite} className="mt-4 space-y-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-muted">
                    Adresse email professionnelle *
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="ex : sourceur@daluche.com"
                    value={inviteEmail}
                    onChange={e => setInviteEmail(e.target.value)}
                    className="mt-1.5 h-11 w-full rounded-xl border border-line bg-paper px-3 text-sm text-ink outline-none focus:border-brand"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-muted">
                    Nom complet
                  </label>
                  <input
                    type="text"
                    placeholder="ex : Ibrahim Ndao"
                    value={inviteName}
                    onChange={e => setInviteName(e.target.value)}
                    className="mt-1.5 h-11 w-full rounded-xl border border-line bg-paper px-3 text-sm text-ink outline-none focus:border-brand"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-muted">
                    Rôle attribué *
                  </label>
                  <select
                    value={inviteRole}
                    onChange={e => setInviteRole(e.target.value as any)}
                    className="mt-1.5 h-11 w-full rounded-xl border border-line bg-paper px-3 text-sm font-semibold text-ink outline-none focus:border-brand"
                  >
                    <option value="transitaire">Transitaire / Sourceur Chine</option>
                    <option value="groupage_manager">Gestionnaire des Groupages</option>
                    <option value="admin">Administrateur Général (HQ)</option>
                  </select>
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-line">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setInviteModal(false)}
                  >
                    Annuler
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    size="sm"
                    loading={inviting}
                    icon={<UserPlus className="h-4 w-4" />}
                  >
                    Envoyer l'invitation
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
