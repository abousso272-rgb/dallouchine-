import React, { useState } from 'react';
import { PackagePlus } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { friendlyError } from '../../lib/db';
import { parseNumber } from '../../lib/costSheet';
import { createDraftProduct } from '../../services/groupages';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input, Select, Textarea } from '../ui/Field';
import { InlineAlert } from '../ui/States';
import { MediaGalleryInput } from '../ui/Uploads';

export interface CreatedProduct {
  id: string;
  name: string;
  image: string | null;
  purchaseCny: string;
  weightKg: string;
  cbm: string;
  cargoUnit: string;
}

/** Nouveau produit pour un groupage, sans quitter la page : créé en brouillon avec ses coûts. */
export function NewGroupageProductModal({
  open,
  onClose,
  onCreated,
  transportMode
}: {
  open: boolean;
  onClose: () => void;
  onCreated: (p: CreatedProduct) => void;
  transportMode: 'air' | 'sea' | 'express';
}) {
  const { categories, toast } = useApp();
  const roots = categories.filter(c => c.isActive);
  const [f, setF] = useState({ name: '', categoryId: '', description: '', purchaseCny: '', listCny: '', weightKg: '', cbm: '', cargoUnit: '', supplier: '', supplierUrl: '' });
  const [images, setImages] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const set = (k: keyof typeof f, v: string) => setF(x => ({ ...x, [k]: v }));
  const numeric = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) => set(k, e.target.value.replace(/[^\d.,\s]/g, ''));

  async function create() {
    setError(null);
    if (f.name.trim().length < 2) return setError('Indiquez le nom du produit.');
    if (!f.categoryId) return setError('Choisissez une catégorie.');
    setSaving(true);
    try {
      const res = await createDraftProduct({
        name: f.name,
        categoryId: f.categoryId,
        description: f.description,
        imageUrl: images[0] || null,
        weightKg: parseNumber(f.weightKg),
        cbm: parseNumber(f.cbm),
        transportMode,
        purchasePriceCNY: parseNumber(f.purchaseCny),
        listPriceCNY: parseNumber(f.listCny),
        cargoUnitXOF: parseNumber(f.cargoUnit),
        supplierName: f.supplier,
        supplierUrl: f.supplierUrl
      });
      toast('success', 'Produit créé', 'En brouillon : il sert à votre groupage et n’apparaît pas seul dans le catalogue.');
      onCreated({ id: res.id, name: f.name.trim(), image: images[0] || null, purchaseCny: f.purchaseCny, weightKg: f.weightKg, cbm: f.cbm, cargoUnit: f.cargoUnit });
      setF({ name: '', categoryId: '', description: '', purchaseCny: '', listCny: '', weightKg: '', cbm: '', cargoUnit: '', supplier: '', supplierUrl: '' });
      setImages([]);
      onClose();
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      title="Nouveau produit pour ce groupage"
      description="Le produit et ses coûts sont enregistrés ensemble. Vous pourrez compléter sa fiche plus tard."
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Annuler
          </Button>
          <Button onClick={create} loading={saving} icon={<PackagePlus className="h-4 w-4" />}>
            Créer le produit
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <Input label="Nom du produit" required value={f.name} onChange={e => set('name', e.target.value)} placeholder="Ex. Station solaire 1000 W" />
          <Select label="Catégorie" required value={f.categoryId} onChange={e => set('categoryId', e.target.value)} placeholder="Choisir" options={roots.map(c => ({ value: c.id, label: c.name }))} />
        </div>
        <div>
          <p className="mb-1.5 text-[13px] font-semibold">Photo</p>
          <MediaGalleryInput value={images} onChange={v => setImages(v.slice(0, 1))} onError={m => toast('error', 'Image refusée', m)} folder="products" max={1} />
        </div>
        <Textarea label="Description courte" value={f.description} onChange={e => set('description', e.target.value)} rows={2} placeholder="Caractéristiques principales, conditionnement…" />
        <div className="rounded-2xl bg-paper p-4">
          <p className="mb-3 text-[13px] font-bold">Coûts et dimensions (visibles par l’équipe uniquement)</p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Input label="Prix négocié" inputMode="decimal" value={f.purchaseCny} onChange={numeric('purchaseCny')} suffix="¥" />
            <Input label="Prix affiché" inputMode="decimal" value={f.listCny} onChange={numeric('listCny')} suffix="¥" hint="Avant négociation" />
            <Input label="Poids / unité" inputMode="decimal" value={f.weightKg} onChange={numeric('weightKg')} suffix="kg" />
            <Input label="Volume / unité" inputMode="decimal" value={f.cbm} onChange={numeric('cbm')} suffix="m³" />
            <Input label="Cargo / unité" inputMode="decimal" value={f.cargoUnit} onChange={numeric('cargoUnit')} suffix="F" hint="Optionnel" />
            <Input label="Fournisseur" value={f.supplier} onChange={e => set('supplier', e.target.value)} />
            <div className="col-span-2">
              <Input label="Lien fournisseur" value={f.supplierUrl} onChange={e => set('supplierUrl', e.target.value)} placeholder="https://detail.1688.com/…" />
            </div>
          </div>
        </div>
        {error && <InlineAlert tone="danger">{error}</InlineAlert>}
      </div>
    </Modal>
  );
}
