import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { setUserRole } from '../../services/admin';
import { friendlyError } from '../../lib/db';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Checkbox, ChoiceCards } from '../ui/Field';
import { InlineAlert } from '../ui/States';

export const PERMISSIONS: Record<string, { key: string; label: string; description: string }[]> = {
  transitaire: [
    { key: 'publish_products', label: 'Publier les produits', description: 'Mettre en ligne / retirer des produits du catalogue.' },
    { key: 'set_margins', label: 'Fixer les prix publics', description: 'Modifier le prix de vente (et donc la marge) des produits publiés.' }
  ],
  groupage_manager: [
    { key: 'set_groupage_prices', label: 'Modifier prix et objectifs', description: 'Changer le prix ou l’objectif d’un groupage déjà publié.' },
    { key: 'manage_products', label: 'Gérer ses produits', description: 'Créer des produits et saisir leurs coûts dans le tableur (toujours en brouillon : la publication reste à l’équipe).' },
    { key: 'view_margins', label: 'Voir la rentabilité', description: 'Afficher la marge par unité et l’argent à verser au fournisseur dans le cockpit de ses groupages.' }
  ],
  admin: []
};

/** Toutes les permissions d'un rôle : profil « autonome » (aucune dépendance à l'administrateur au quotidien). */
export const allPermissions = (role: string) => (PERMISSIONS[role] || []).map(p => p.key);

/** Choix rapide : profil autonome (recommandé) ou encadré (aucune permission complémentaire). */
export function PermissionPresets({ role, perms, onChange }: { role: string; perms: string[]; onChange: (next: string[]) => void }) {
  const all = allPermissions(role);
  if (!all.length) return null;
  const autonomous = all.every(k => perms.includes(k));
  const none = perms.filter(k => all.includes(k)).length === 0;
  const btn = (on: boolean) => `rounded-full border px-3.5 py-1.5 text-[12.5px] font-semibold transition-colors ${on ? 'border-brand bg-brand-50 text-brand-700' : 'border-line bg-white text-muted hover:text-ink'}`;
  return (
    <div className="flex flex-wrap items-center gap-2">
      <button type="button" className={btn(autonomous)} onClick={() => onChange(all)} aria-pressed={autonomous}>
        Autonome (recommandé)
      </button>
      <button type="button" className={btn(none)} onClick={() => onChange([])} aria-pressed={none}>
        Encadré
      </button>
      <span className="text-[12px] text-muted">{autonomous ? 'Travaille sans attendre l’administrateur.' : none ? 'L’administrateur valide publication et prix.' : 'Personnalisé.'}</span>
    </div>
  );
}

export const ROLE_OPTIONS = [
  { value: 'transitaire', title: 'Transitaire / Sourceur', description: 'Sourcing, B2B, automobile, produits, commandes et logistique.' },
  { value: 'groupage_manager', title: 'Gestionnaire groupages', description: 'Groupages attribués, participants et commandes associées.' },
  { value: 'admin', title: 'Administrateur général', description: 'Accès complet, finances, équipe et paramètres.' }
] as const;

export function normalizeRole(role: string): string {
  const r = role.toLowerCase();
  if (['admin', 'super_admin', 'operations', 'commercial', 'finance'].includes(r)) return 'admin';
  if (['transitaire', 'sourcing', 'sourcer'].includes(r)) return 'transitaire';
  if (r === 'groupage_manager') return 'groupage_manager';
  return 'client';
}

/** Modification du rôle, des permissions et du statut d'un compte (administration). */
export function RoleEditor({
  target,
  onClose,
  onSaved
}: {
  target: { id: string; fullName: string; email: string; role: string; permissions: string[]; status: string } | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { user, toast } = useApp();
  const [role, setRole] = useState(normalizeRole(target?.role || 'client'));
  const [perms, setPerms] = useState<string[]>(target?.permissions || []);
  const [suspended, setSuspended] = useState(target?.status === 'suspended');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  if (!target) return null;
  const self = target.id === user?.id;

  async function save() {
    setSaving(true);
    setError(null);
    try {
      const allowed = (PERMISSIONS[role] || []).map(p => p.key);
      await setUserRole(target!.id, role, perms.filter(p => allowed.includes(p)), suspended ? 'suspended' : 'active');
      toast('success', 'Accès mis à jour', `${target!.fullName || target!.email} : les changements s’appliquent à sa prochaine action.`);
      onSaved();
      onClose();
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      title="Rôle et permissions"
      description={`${target.fullName || 'Utilisateur'} · ${target.email}`}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Annuler
          </Button>
          <Button onClick={save} loading={saving}>
            Enregistrer
          </Button>
        </>
      }
    >
      <div className="space-y-5">
        {self && <InlineAlert tone="info">Vous ne pouvez pas retirer vos propres droits d’administration.</InlineAlert>}
        <ChoiceCards
          columns={1}
          value={role}
          onChange={r => {
            setRole(r);
            setPerms(allPermissions(r));
          }}
          options={[...ROLE_OPTIONS.map(o => ({ value: o.value as string, title: o.title, description: o.description })), { value: 'client', title: 'Client (aucun accès équipe)', description: 'Retire l’accès à l’espace professionnel.' }]}
        />
        {(PERMISSIONS[role] || []).length > 0 && (
          <div className="space-y-3 rounded-2xl bg-paper p-4">
            <p className="text-[12px] font-bold uppercase tracking-wide text-muted">Permissions complémentaires</p>
            <PermissionPresets role={role} perms={perms} onChange={setPerms} />
            {PERMISSIONS[role].map(p => (
              <Checkbox
                key={p.key}
                label={p.label}
                description={p.description}
                checked={perms.includes(p.key)}
                onChange={v => setPerms(prev => (v ? [...prev, p.key] : prev.filter(x => x !== p.key)))}
              />
            ))}
          </div>
        )}
        {!self && <Checkbox label="Compte suspendu" description="Bloque la connexion à l’espace professionnel et client." checked={suspended} onChange={setSuspended} />}
        {error && <InlineAlert tone="danger">{error}</InlineAlert>}
      </div>
    </Modal>
  );
}
