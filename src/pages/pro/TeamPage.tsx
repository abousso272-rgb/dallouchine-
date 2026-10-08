import React, { useState } from 'react';
import { Copy, Mail, MessageCircle, Send, UserCog, XCircle } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useAsync } from '../../lib/hooks';
import { inviteMember, listInvitations, listTeam, revokeInvitation, type InviteResult } from '../../services/admin';
import { friendlyError } from '../../lib/db';
import { formatDate } from '../../lib/format';
import { ROLE_LABEL } from '../../lib/status';
import { PageHeader, Card, CardTitle } from '../../components/ui/Layout';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Checkbox, ChoiceCards, Input } from '../../components/ui/Field';
import { EmptyState, ErrorState, InlineAlert, Skeleton } from '../../components/ui/States';
import { PERMISSIONS, ROLE_OPTIONS, RoleEditor, normalizeRole } from '../../components/pro/RoleEditor';
import type { TeamMember } from '../../lib/types';

const PERM_LABEL = Object.fromEntries(Object.values(PERMISSIONS).flat().map(p => [p.key, p.label]));

export default function TeamPage() {
  const { toast } = useApp();
  const team = useAsync(() => listTeam(), []);
  const invitations = useAsync(() => listInvitations(), []);
  const [editing, setEditing] = useState<TeamMember | null>(null);

  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<string>('transitaire');
  const [perms, setPerms] = useState<string[]>([]);
  const [inviting, setInviting] = useState(false);
  const [result, setResult] = useState<(InviteResult & { email: string }) | null>(null);

  async function invite(e: React.FormEvent) {
    e.preventDefault();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim())) return toast('error', 'Adresse email invalide');
    setInviting(true);
    try {
      const allowed = (PERMISSIONS[role] || []).map(p => p.key);
      const res = await inviteMember({ email: email.trim().toLowerCase(), role, fullName: fullName.trim(), permissions: perms.filter(p => allowed.includes(p)) });
      setResult({ ...res, email: email.trim().toLowerCase() });
      setEmail('');
      setFullName('');
      setPerms([]);
      invitations.reload();
    } catch (err) {
      toast('error', 'Invitation impossible', friendlyError(err));
    } finally {
      setInviting(false);
    }
  }

  async function copy(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      toast('success', 'Lien copié');
    } catch {
      window.prompt('Copiez le lien :', text);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Équipe" description="Membres, rôles, permissions et invitations. Chaque rôle n’accède qu’aux données utiles à son travail." />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.2fr_1fr]">
        <Card>
          <CardTitle>Membres de l’équipe</CardTitle>
          {team.error ? (
            <ErrorState message={team.error} onRetry={team.reload} />
          ) : team.loading ? (
            <Skeleton className="h-48" />
          ) : !team.data?.length ? (
            <EmptyState compact icon={<UserCog className="h-5 w-5" />} title="Aucun membre" />
          ) : (
            <ul className="divide-y divide-line">
              {team.data.map(m => (
                <li key={m.id} className="flex items-start gap-3 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold">{m.fullName}</p>
                    <p className="truncate text-[12.5px] text-muted">{m.email}</p>
                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                      <Badge tone={normalizeRole(m.role) === 'admin' ? 'brand' : 'info'}>{ROLE_LABEL[normalizeRole(m.role)]}</Badge>
                      {m.status === 'suspended' && <Badge tone="danger">Suspendu</Badge>}
                      {m.permissions.map(p => (
                        <Badge key={p}>{PERM_LABEL[p] || p}</Badge>
                      ))}
                    </div>
                  </div>
                  <Button size="sm" variant="secondary" onClick={() => setEditing(m)}>
                    Modifier
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <CardTitle>Inviter un collaborateur</CardTitle>
          {result ? (
            <div className="space-y-4">
              <InlineAlert tone="success" title="Invitation créée">
                {result.emailSent
                  ? `Un email d’invitation a été envoyé à ${result.email}.`
                  : `Transmettez ce lien à ${result.email}. ${result.accountExists ? 'Son compte existe : il suffit de se connecter puis d’ouvrir le lien.' : 'La personne crée son compte avec cette adresse puis accepte l’invitation.'}`}
                {result.emailError && <span className="mt-1 block text-[12.5px]">Email non envoyé : {result.emailError}</span>}
              </InlineAlert>
              <div className="flex gap-2">
                <input readOnly value={result.inviteUrl} className="num h-11 min-w-0 flex-1 rounded-xl border border-line-2 bg-paper px-3 text-[13px]" aria-label="Lien d’invitation" onFocus={e => e.target.select()} />
                <Button variant="dark" onClick={() => copy(result.inviteUrl)} icon={<Copy className="h-4 w-4" />}>
                  Copier
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="secondary" icon={<MessageCircle className="h-3.5 w-3.5" />} to={`https://wa.me/?text=${encodeURIComponent(`Invitation à rejoindre l’équipe Dallou Chine : ${result.inviteUrl}`)}`}>
                  Partager sur WhatsApp
                </Button>
                <Button size="sm" variant="secondary" icon={<Mail className="h-3.5 w-3.5" />} to={`mailto:${result.email}?subject=${encodeURIComponent('Invitation équipe Dallou Chine')}&body=${encodeURIComponent(`Bonjour,\n\nVous êtes invité(e) à rejoindre l’espace professionnel Dallou Chine :\n${result.inviteUrl}\n\nCréez votre compte avec cette adresse email puis acceptez l’invitation.`)}`}>
                  Envoyer par email
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setResult(null)}>
                  Nouvelle invitation
                </Button>
              </div>
            </div>
          ) : (
            <form onSubmit={invite} className="space-y-4">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Input label="Email" required type="email" value={email} onChange={e => setEmail(e.target.value)} />
                <Input label="Nom (optionnel)" value={fullName} onChange={e => setFullName(e.target.value)} />
              </div>
              <ChoiceCards columns={1} value={role} onChange={setRole} options={ROLE_OPTIONS.map(o => ({ value: o.value as string, title: o.title, description: o.description }))} />
              {(PERMISSIONS[role] || []).map(p => (
                <Checkbox key={p.key} label={p.label} description={p.description} checked={perms.includes(p.key)} onChange={v => setPerms(prev => (v ? [...prev, p.key] : prev.filter(x => x !== p.key)))} />
              ))}
              <Button type="submit" block loading={inviting} icon={<Send className="h-4 w-4" />}>
                Créer l’invitation
              </Button>
              <p className="text-[12px] leading-relaxed text-muted">Le rôle n’est attribué que lorsque la personne ouvre le lien sécurisé en étant connectée avec cette adresse email.</p>
            </form>
          )}
        </Card>
      </div>

      <Card>
        <CardTitle>Invitations</CardTitle>
        {invitations.loading ? (
          <Skeleton className="h-24" />
        ) : !invitations.data?.length ? (
          <p className="text-sm text-muted">Aucune invitation envoyée.</p>
        ) : (
          <ul className="divide-y divide-line">
            {invitations.data.map(i => (
              <li key={i.id} className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{i.fullName ? `${i.fullName} · ` : ''}{i.email}</p>
                  <p className="text-[12.5px] text-muted">
                    {ROLE_LABEL[i.role]} · envoyée le {formatDate(i.createdAt)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge tone={i.status === 'accepted' ? 'success' : i.status === 'pending' ? 'warning' : 'neutral'}>
                    {i.status === 'accepted' ? 'Acceptée' : i.status === 'pending' ? 'En attente' : i.status === 'expired' ? 'Expirée' : 'Révoquée'}
                  </Badge>
                  {i.status === 'pending' && (
                    <>
                      <Button size="sm" variant="ghost" icon={<Copy className="h-3.5 w-3.5" />} onClick={() => copy(`${window.location.origin}/invitation?token=${i.token}`)}>
                        Lien
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        icon={<XCircle className="h-3.5 w-3.5" />}
                        onClick={() =>
                          revokeInvitation(i.id)
                            .then(() => invitations.reload())
                            .catch(err => toast('error', 'Action impossible', friendlyError(err)))
                        }
                      >
                        Révoquer
                      </Button>
                    </>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {editing && <RoleEditor target={editing} onClose={() => setEditing(null)} onSaved={team.reload} />}
    </div>
  );
}
