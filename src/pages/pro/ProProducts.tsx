import React, { useEffect, useState } from 'react';
import { 
  Package, 
  Plus, 
  Search, 
  Filter, 
  Edit3, 
  Trash2, 
  Check, 
  X, 
  Upload, 
  Eye, 
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { listProducts, listCategories, setProductPublished, saveProduct, deleteProduct, type ProductInput } from '../../services/catalog';
import type { Product, Category } from '../../lib/types';
import { formatXOF } from '../../lib/format';
import { Button } from '../../components/ui/Button';
import { Spinner } from '../../components/ui/States';

export default function ProProducts() {
  const { toast, user } = useApp();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCat, setSelectedCat] = useState('');
  
  // Modal création/édition
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [formName, setFormName] = useState('');
  const [formCatId, setFormCatId] = useState('');
  const [formPrice, setFormPrice] = useState('');
  const [formMoq, setFormMoq] = useState('1');
  const [formStock, setFormStock] = useState('100');
  const [formTransport, setFormTransport] = useState<'sea' | 'air' | 'express'>('sea');
  const [formDelay, setFormDelay] = useState('25 à 35 jours');
  const [formShortDesc, setFormShortDesc] = useState('');
  const [formImages, setFormImages] = useState('');

  const load = () => {
    setLoading(true);
    Promise.all([
      listProducts({ pageSize: 100 }),
      listCategories()
    ])
      .then(([prodRes, catRes]) => {
        setProducts(prodRes.items || []);
        setCategories(catRes || []);
      })
      .catch(err => {
        console.warn('[pro] listProducts fallback:', err);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const openNew = () => {
    setEditingId(null);
    setFormName('');
    setFormCatId(categories[0]?.id || '');
    setFormPrice('');
    setFormMoq('1');
    setFormStock('100');
    setFormTransport('sea');
    setFormDelay('25 à 35 jours');
    setFormShortDesc('');
    setFormImages('');
    setModalOpen(true);
  };

  const openEdit = (p: Product) => {
    setEditingId(p.id);
    setFormName(p.name);
    setFormCatId(p.categoryId || '');
    setFormPrice(String(p.priceXOF));
    setFormMoq(String(p.moq));
    setFormStock(String(p.stockQuantity));
    setFormTransport(p.transportMode);
    setFormDelay(p.deliveryDelay);
    setFormShortDesc(p.shortDescription);
    setFormImages((p.images || []).join('\n'));
    setModalOpen(true);
  };

  const handleToggleActive = async (p: Product) => {
    const next = !p.isActive;
    try {
      await setProductPublished(p.id, next);
      setProducts(list => list.map(item => item.id === p.id ? { ...item, isActive: next } : item));
      toast('success', next ? 'Produit publié' : 'Produit masqué');
    } catch (err: any) {
      toast('error', 'Erreur', err.message || 'Impossible de changer le statut.');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Voulez-vous vraiment supprimer ce produit ?')) return;
    try {
      await deleteProduct(id);
      setProducts(list => list.filter(item => item.id !== id));
      toast('success', 'Produit supprimé');
    } catch (err: any) {
      toast('error', 'Erreur', err.message || 'Impossible de supprimer.');
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);

    const imagesArray = formImages
      .split('\n')
      .map(s => s.trim())
      .filter(Boolean);

    const input: ProductInput = {
      id: editingId || undefined,
      name: formName.trim(),
      slug: formName.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-') || `produit-${Date.now()}`,
      categoryId: formCatId || categories[0]?.id || '',
      priceXOF: parseInt(formPrice, 10) || 0,
      compareAtPriceXOF: null,
      moq: parseInt(formMoq, 10) || 1,
      stockQuantity: parseInt(formStock, 10) || 0,
      weightKg: 1,
      transportMode: formTransport,
      deliveryDelay: formDelay,
      shortDescription: formShortDesc,
      description: formShortDesc,
      features: [],
      specifications: {},
      images: imagesArray.length > 0 ? imagesArray : ['https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=600&q=80'],
      isActive: true,
      isFeatured: false,
      isAutoMobility: false
    };

    try {
      await saveProduct(input, null, user.id);
      toast('success', editingId ? 'Produit modifié' : 'Produit créé avec succès');
      setModalOpen(false);
      load();
    } catch (err: any) {
      toast('error', 'Erreur d’enregistrement', err.message || 'Impossible d’enregistrer le produit.');
    } finally {
      setSaving(false);
    }
  };

  const filtered = products.filter(p => {
    const s = search.toLowerCase();
    const matchSearch = p.name.toLowerCase().includes(s) || (p.shortDescription && p.shortDescription.toLowerCase().includes(s));
    const matchCat = !selectedCat || p.categoryId === selectedCat;
    return matchSearch && matchCat;
  });

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-ink sm:text-3xl">Catalogue Produits & Import</h1>
          <p className="mt-1 text-sm text-muted">
            Gestion des articles en provenance directe de Chine (usines, grossistes Yiwu & Canton)
          </p>
        </div>
        <Button variant="primary" size="sm" onClick={openNew} icon={<Plus className="h-4 w-4" />}>
          Ajouter un produit
        </Button>
      </div>

      {/* Barre de recherche et filtres */}
      <div className="card p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <input
              type="text"
              placeholder="Rechercher un produit Chine par nom ou mot-clé…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="h-10 w-full rounded-xl border border-line bg-paper pl-10 pr-4 text-sm text-ink outline-none transition focus:border-brand"
            />
          </div>

          <select
            value={selectedCat}
            onChange={e => setSelectedCat(e.target.value)}
            className="h-10 rounded-xl border border-line bg-paper px-3 text-xs font-semibold text-ink outline-none focus:border-brand sm:w-48"
          >
            <option value="">Toutes les catégories</option>
            {categories.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Tableau des produits */}
      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <Spinner className="h-8 w-8 text-brand" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="card p-12 text-center">
          <Package className="mx-auto h-12 w-12 text-muted" />
          <h3 className="mt-3 text-base font-semibold text-ink">Aucun produit dans le catalogue</h3>
          <p className="mt-1 text-sm text-muted">Ajoutez votre premier produit importé depuis la Chine.</p>
          <Button variant="primary" size="sm" onClick={openNew} className="mt-4" icon={<Plus className="h-4 w-4" />}>
            Ajouter un produit
          </Button>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-line bg-paper-2 text-xs font-semibold uppercase tracking-wider text-muted">
                <tr>
                  <th className="px-4 py-3.5">Produit</th>
                  <th className="px-4 py-3.5">Catégorie</th>
                  <th className="px-4 py-3.5">Prix Public</th>
                  <th className="px-4 py-3.5">MOQ & Stock</th>
                  <th className="px-4 py-3.5">Transport</th>
                  <th className="px-4 py-3.5">Statut Visibilité</th>
                  <th className="px-4 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {filtered.map(prod => (
                  <tr key={prod.id} className="hover:bg-paper/50">
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-3">
                        <img
                          src={prod.images?.[0] || 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=150&q=80'}
                          alt={prod.name}
                          className="h-11 w-11 shrink-0 rounded-xl object-cover bg-paper-2"
                        />
                        <div>
                          <div className="font-semibold text-ink max-w-[240px] truncate">{prod.name}</div>
                          <div className="text-xs text-muted max-w-[240px] truncate">{prod.shortDescription}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-xs font-medium text-ink">
                      {prod.categoryName || 'Général'}
                    </td>
                    <td className="px-4 py-3.5 font-semibold text-ink">
                      {formatXOF(prod.priceXOF)}
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="text-xs font-medium text-ink">MOQ: {prod.moq} pcs</div>
                      <div className="text-[11px] text-muted">Stock: {prod.stockQuantity}</div>
                    </td>
                    <td className="px-4 py-3.5 text-xs font-medium text-ink">
                      {prod.transportMode === 'air' ? '✈ Fret Aérien' : '🚢 Fret Maritime'}
                    </td>
                    <td className="px-4 py-3.5">
                      <button
                        type="button"
                        onClick={() => handleToggleActive(prod)}
                        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold transition ${
                          prod.isActive
                            ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                            : 'bg-paper-2 text-muted hover:bg-line'
                        }`}
                      >
                        <span className={`h-1.5 w-1.5 rounded-full ${prod.isActive ? 'bg-emerald-600' : 'bg-muted'}`} />
                        {prod.isActive ? 'Actif (En ligne)' : 'Masqué (Brouillon)'}
                      </button>
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => openEdit(prod)}
                          className="rounded-lg p-2 text-muted hover:bg-paper hover:text-ink"
                          title="Modifier"
                        >
                          <Edit3 className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(prod.id)}
                          className="rounded-lg p-2 text-muted hover:bg-red-50 hover:text-red-600"
                          title="Supprimer"
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

      {/* Modal Créer / Modifier Produit */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="card w-full max-w-xl max-h-[90vh] overflow-y-auto p-6 shadow-xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-line pb-4">
              <div>
                <h3 className="text-lg font-bold text-ink">
                  {editingId ? 'Modifier le produit' : 'Nouveau produit Chine'}
                </h3>
                <p className="text-xs text-muted">Informations commerciales et paramètres logistiques</p>
              </div>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="rounded-lg p-1.5 text-muted hover:bg-paper hover:text-ink"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted">
                  Nom du produit *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex : Panneaux solaires 550W Tier 1 Monocristallin"
                  value={formName}
                  onChange={e => setFormName(e.target.value)}
                  className="mt-1.5 h-11 w-full rounded-xl border border-line bg-paper px-3 text-sm text-ink outline-none focus:border-brand"
                />
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-muted">
                    Catégorie
                  </label>
                  <select
                    value={formCatId}
                    onChange={e => setFormCatId(e.target.value)}
                    className="mt-1.5 h-11 w-full rounded-xl border border-line bg-paper px-3 text-sm text-ink outline-none focus:border-brand"
                  >
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-muted">
                    Prix de vente (FCFA) *
                  </label>
                  <input
                    type="number"
                    required
                    placeholder="Ex : 85000"
                    value={formPrice}
                    onChange={e => setFormPrice(e.target.value)}
                    className="mt-1.5 h-11 w-full rounded-xl border border-line bg-paper px-3 text-sm text-ink outline-none focus:border-brand"
                  />
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-muted">
                    MOQ (Min. commande)
                  </label>
                  <input
                    type="number"
                    value={formMoq}
                    onChange={e => setFormMoq(e.target.value)}
                    className="mt-1.5 h-11 w-full rounded-xl border border-line bg-paper px-3 text-sm text-ink outline-none focus:border-brand"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-muted">
                    Quantité en stock
                  </label>
                  <input
                    type="number"
                    value={formStock}
                    onChange={e => setFormStock(e.target.value)}
                    className="mt-1.5 h-11 w-full rounded-xl border border-line bg-paper px-3 text-sm text-ink outline-none focus:border-brand"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-muted">
                    Mode d'acheminement
                  </label>
                  <select
                    value={formTransport}
                    onChange={e => setFormTransport(e.target.value as any)}
                    className="mt-1.5 h-11 w-full rounded-xl border border-line bg-paper px-3 text-sm text-ink outline-none focus:border-brand"
                  >
                    <option value="sea">Maritime (25-35j)</option>
                    <option value="air">Aérien (7-12j)</option>
                    <option value="express">Express (3-5j)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted">
                  Description courte / Caractéristiques
                </label>
                <textarea
                  rows={2}
                  placeholder="Ex : Haute performance, garantie constructeur 10 ans, certifié CE/TUV."
                  value={formShortDesc}
                  onChange={e => setFormShortDesc(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-line bg-paper p-3 text-sm text-ink outline-none focus:border-brand"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted">
                  URLs des images (une par ligne)
                </label>
                <textarea
                  rows={3}
                  placeholder="https://images.unsplash.com/..."
                  value={formImages}
                  onChange={e => setFormImages(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-line bg-paper p-3 text-sm text-ink font-mono text-xs outline-none focus:border-brand"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-line">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setModalOpen(false)}
                >
                  Annuler
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  loading={saving}
                  icon={<CheckCircle2 className="h-4 w-4" />}
                >
                  {editingId ? 'Enregistrer les modifications' : 'Créer le produit'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
