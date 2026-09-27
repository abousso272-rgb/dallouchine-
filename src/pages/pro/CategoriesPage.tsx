import React, { useState } from 'react';
import { FolderTree, Pencil, Plus, Trash2 } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useAsync } from '../../lib/hooks';
import { deleteCategory, listCategories, saveCategory } from '../../services/catalog';
import { friendlyError } from '../../lib/db';
import { slugify } from '../../lib/format';
import type { Category } from '../../lib/types';
import { PageHeader } from '../../components/ui/Layout';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { Checkbox, Input, Textarea } from '../../components/ui/Field';
import { MediaGalleryInput } from '../../components/ui/Uploads';
import { EmptyState, ErrorState, Skeleton } from '../../components/ui/States';

export default function CategoriesPage() {
  const { toast } = useApp();
  const { data, loading, error, reload } = useAsync(() => listCategories(true), []);
  const [editing, setEditing] = useState<Partial<Category> | null>(null);
  const [saving, setSaving] = useState(false);

  async function save() {
    if (!editing?.name?.trim()) return toast('error', 'Nom requis');
    setSaving(true);
    try {
      await saveCategory({ ...editing, name: editing.name!, slug: editing.slug || slugify(editing.name!) });
      toast('success', 'Catégorie enregistrée');
      setEditing(null);
      reload();
    } catch (err) {
      toast('error', 'Enregistrement impossible', friendlyError(err));
    } finally {
      setSaving(false);
    }
  }

  async function remove(c: Category) {
    if (!window.confirm(`Supprimer la catégorie « ${c.name} » ?`)) return;
    try {
      await deleteCategory(c.id);
      toast('success', 'Catégorie supprimée');
      reload();
    } catch (err) {
      toast('error', 'Suppression impossible', friendlyError(err));
    }
  }

  return (
    <div>
      <PageHeader
        title="Catégories"
        description="Organisation du catalogue (affichées dans les filtres et sur la page d’accueil)."
        actions={
          <Button icon={<Plus className="h-4 w-4" />} onClick={() => setEditing({ isActive: true, sortOrder: (data?.length || 0) + 1 })}>
            Nouvelle catégorie
          </Button>
        }
      />
      {error ? (
        <ErrorState message={error} onRetry={reload} />
      ) : loading ? (
        <Skeleton className="h-64" />
      ) : !data?.length ? (
        <div className="card">
          <EmptyState icon={<FolderTree className="h-5 w-5" />} title="Aucune catégorie" />
        </div>
      ) : (
        <ul className="card divide-y divide-line p-0">
          {data.map(c => (
            <li key={c.id} className="flex items-center gap-3 px-4 py-3 sm:px-5">
              {c.imageUrl ? <img src={c.imageUrl} alt="" className="h-10 w-10 rounded-lg object-cover" /> : <span className="h-10 w-10 rounded-lg bg-paper-2" />}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{c.name}</p>
                <p className="truncate text-[12.5px] text-muted">/{c.slug}</p>
              </div>
              {!c.isActive && <Badge>Masquée</Badge>}
              <button type="button" onClick={() => setEditing(c)} className="rounded-lg p-2 text-muted hover:bg-paper hover:text-ink" aria-label="Modifier">
                <Pencil className="h-4 w-4" />
              </button>
              <button type="button" onClick={() => remove(c)} className="rounded-lg p-2 text-muted hover:bg-red-50 hover:text-red-700" aria-label="Supprimer">
                <Trash2 className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      )}

      <Modal
        open={Boolean(editing)}
        onClose={() => setEditing(null)}
        title={editing?.id ? 'Modifier la catégorie' : 'Nouvelle catégorie'}
        footer={
          <>
            <Button variant="secondary" onClick={() => setEditing(null)}>
              Annuler
            </Button>
            <Button onClick={save} loading={saving}>
              Enregistrer
            </Button>
          </>
        }
      >
        {editing && (
          <div className="space-y-4">
            <Input label="Nom" required value={editing.name || ''} onChange={e => setEditing(c => ({ ...c, name: e.target.value, slug: c?.id ? c.slug : slugify(e.target.value) }))} />
            <Input label="Adresse" value={editing.slug || ''} onChange={e => setEditing(c => ({ ...c, slug: slugify(e.target.value) }))} />
            <Textarea label="Description" value={editing.description || ''} onChange={e => setEditing(c => ({ ...c, description: e.target.value }))} rows={2} />
            <Input label="Ordre d’affichage" inputMode="numeric" value={editing.sortOrder ?? 0} onChange={e => setEditing(c => ({ ...c, sortOrder: Number(e.target.value.replace(/\D/g, '')) || 0 }))} />
            <div>
              <p className="mb-1.5 text-[13px] font-semibold">Image</p>
              <MediaGalleryInput value={editing.imageUrl ? [editing.imageUrl] : []} onChange={v => setEditing(c => ({ ...c, imageUrl: v[0] || null }))} onError={m => toast('error', 'Image refusée', m)} folder="categories" max={1} />
            </div>
            <Checkbox label="Visible sur le site" checked={editing.isActive ?? true} onChange={v => setEditing(c => ({ ...c, isActive: v }))} />
          </div>
        )}
      </Modal>
    </div>
  );
}
