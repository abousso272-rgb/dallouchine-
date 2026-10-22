import React, { useState } from 'react';
import { FolderPlus } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { friendlyError } from '../../lib/db';
import { slugify } from '../../lib/format';
import { saveCategory } from '../../services/catalog';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input, Textarea } from '../ui/Field';
import { InlineAlert } from '../ui/States';
import { MediaGalleryInput } from '../ui/Uploads';

/** Création rapide d'une catégorie sans quitter l'écran en cours (fiche produit, tableur, groupage). */
export function QuickCategoryDialog({ open, onClose, onCreated }: { open: boolean; onClose: () => void; onCreated?: (c: { id: string; name: string }) => void }) {
  const { categories, refreshCategories, toast } = useApp();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    setError(null);
    const n = name.trim();
    if (n.length < 2) return setError('Indiquez le nom de la catégorie.');
    if (categories.some(c => c.name.trim().toLowerCase() === n.toLowerCase())) return setError('Cette catégorie existe déjà : choisissez-la dans la liste.');
    setSaving(true);
    try {
      let slug = slugify(n);
      if (categories.some(c => c.slug === slug)) slug = `${slug}-${Date.now().toString(36).slice(-4)}`;
      const id = await saveCategory({ name: n, slug, description: description.trim() || null, imageUrl: images[0] || null, isActive: true, sortOrder: categories.length + 1 });
      await refreshCategories();
      toast('success', 'Catégorie créée', n);
      onCreated?.({ id, name: n });
      setName('');
      setDescription('');
      setImages([]);
      onClose();
    } catch (err) {
      const msg = friendlyError(err);
      setError(/row-level security|42501|permission/i.test(msg) ? 'Votre profil ne peut pas encore créer de catégorie : la mise à jour de la base doit être appliquée par l’administrateur.' : msg);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Nouvelle catégorie"
      description="Elle apparaît tout de suite dans le catalogue, le menu du site et vos listes."
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Annuler
          </Button>
          <Button onClick={save} loading={saving} icon={<FolderPlus className="h-4 w-4" />}>
            Créer la catégorie
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <Input label="Nom" required value={name} onChange={e => setName(e.target.value)} placeholder="Ex. Électroménager" autoFocus />
        <Textarea label="Description (optionnelle)" value={description} onChange={e => setDescription(e.target.value)} rows={2} placeholder="Une phrase affichée en tête de la catégorie" />
        <div>
          <p className="mb-1.5 text-[13px] font-semibold">Image (optionnelle)</p>
          <MediaGalleryInput value={images} onChange={v => setImages(v.slice(0, 1))} onError={m => toast('error', 'Image refusée', m)} folder="categories" max={1} />
        </div>
        {error && <InlineAlert tone="danger">{error}</InlineAlert>}
      </div>
    </Modal>
  );
}

/** Bouton discret « + Nouvelle catégorie » à placer sous un sélecteur de catégorie. */
export function NewCategoryButton({ onCreated, className = '' }: { onCreated?: (c: { id: string; name: string }) => void; className?: string }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={`inline-flex w-fit items-center gap-1.5 text-[13px] font-semibold text-brand-700 hover:underline ${className}`}>
        <FolderPlus className="h-4 w-4" /> Nouvelle catégorie
      </button>
      <QuickCategoryDialog open={open} onClose={() => setOpen(false)} onCreated={onCreated} />
    </>
  );
}
