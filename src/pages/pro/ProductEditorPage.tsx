import React, { useEffect, useState } from 'react';
import { ExternalLink, Plus, Save, Trash2 } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useAsync } from '../../lib/hooks';
import { deleteProduct, getProduct, getProductCost, saveProduct, type ProductCost, type ProductInput } from '../../services/catalog';
import { friendlyError } from '../../lib/db';
import { formatXOF, percent, slugify } from '../../lib/format';
import { PageHeader, Card, CardTitle } from '../../components/ui/Layout';
import { Button } from '../../components/ui/Button';
import { Checkbox, Input, Select, Textarea } from '../../components/ui/Field';
import { MediaGalleryInput } from '../../components/ui/Uploads';
import { Badge } from '../../components/ui/Badge';
import { ErrorState, InlineAlert, PageLoader } from '../../components/ui/States';

const EMPTY: ProductInput = {
  name: '',
  slug: '',
  sku: '',
  categoryId: '',
  shortDescription: '',
  description: '',
  priceXOF: 0,
  compareAtPriceXOF: null,
  moq: 1,
  stockQuantity: 0,
  weightKg: 0,
  transportMode: 'air',
  deliveryDelay: '',
  features: [],
  specifications: {},
  isActive: false,
  isFeatured: false,
  isAutoMobility: false,
  images: []
};

const EMPTY_COST: ProductCost = { purchasePriceCNY: null, purchasePriceXOF: 0, logisticsCostXOF: 0, supplierName: '', supplierUrl: '', notes: '' };

export default function ProductEditorPage({ id }: { id: string }) {
  const { user, categories, toast, navigate } = useApp();
  const isNew = id === 'nouveau';
  const isAdmin = user?.role === 'admin';
  const canPublish = isAdmin || user?.permissions.includes('publish_products');
  const canSetPrice = isAdmin || user?.permissions.includes('set_margins');

  const loaded = useAsync(async () => (isNew ? null : { product: await getProduct(id), cost: await getProductCost(id) }), [id]);
  const [form, setForm] = useState<ProductInput>(EMPTY);
  const [cost, setCost] = useState<ProductCost>(EMPTY_COST);
  const [slugTouched, setSlugTouched] = useState(false);
  const [features, setFeatures] = useState('');
  const [specs, setSpecs] = useState<{ k: string; v: string }[]>([]);
  const [targetMargin, setTargetMargin] = useState('30');
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const p = loaded.data?.product;
    if (!p) return;
    setForm({
      id: p.id,
      name: p.name,
      slug: p.slug,
      sku: p.sku || '',
      categoryId: p.categoryId || '',
      shortDescription: p.shortDescription,
      description: p.description,
      priceXOF: p.priceXOF,
      compareAtPriceXOF: p.compareAtPriceXOF,
      moq: p.moq,
      stockQuantity: p.stockQuantity,
      weightKg: p.weightKg,
      transportMode: p.transportMode,
      deliveryDelay: p.deliveryDelay,
      features: p.features,
      specifications: p.specifications,
      isActive: p.isActive,
      isFeatured: p.isFeatured,
      isAutoMobility: p.isAutoMobility,
      images: p.imageRecords.map(i => i.url)
    });
    setSlugTouched(true);
    setFeatures(p.features.join('\n'));
    setSpecs(Object.entries(p.specifications).map(([k, v]) => ({ k, v })));
    if (loaded.data?.cost) setCost(loaded.data.cost);
  }, [loaded.data]);

  const set = <K extends keyof ProductInput>(k: K, v: ProductInput[K]) => setForm(f => ({ ...f, [k]: v }));
  const unitCost = (cost.purchasePriceXOF || 0) + (cost.logisticsCostXOF || 0);
  const margin = form.priceXOF - unitCost;
  const suggested = unitCost > 0 && Number(targetMargin) < 95 ? Math.ceil(unitCost / (1 - Number(targetMargin) / 100) / 100) * 100 : null;
  const priceLocked = !canSetPrice && !isNew && Boolean(loaded.data?.product?.isActive);

  if (loaded.loading) return <PageLoader />;
  if (loaded.error) return <ErrorState message={loaded.error} onRetry={loaded.reload} />;
  if (!isNew && !loaded.data?.product) return <ErrorState message="Produit introuvable." />;

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (form.name.trim().length < 2) return toast('error', 'Nom du produit requis');
    if (!form.categoryId) return toast('error', 'Choisissez une catégorie');
    if (form.priceXOF <= 0) return toast('error', 'Prix de vente requis');
    if (!form.slug.trim()) return toast('error', 'Adresse (slug) requise');
    setSaving(true);
    try {
      const savedId = await saveProduct(
        {
          ...form,
          features: features.split('\n').map(f => f.trim()).filter(Boolean),
          specifications: Object.fromEntries(specs.filter(s => s.k.trim() && s.v.trim()).map(s => [s.k.trim(), s.v.trim()]))
        },
        cost,
        user!.id
      );
      toast('success', isNew ? 'Produit créé' : 'Produit enregistré', !canPublish && form.isActive ? 'La publication sera validée par l’administration.' : undefined);
      if (isNew) navigate(`/espace-pro/produits/${savedId}`, { replace: true });
      else loaded.reload();
    } catch (err) {
      toast('error', 'Enregistrement impossible', friendlyError(err));
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    if (!window.confirm('Supprimer définitivement ce produit ? Préférez « dépublier » s’il a déjà été vendu.')) return;
    setDeleting(true);
    try {
      await deleteProduct(id);
      toast('success', 'Produit supprimé');
      navigate('/espace-pro/produits', { replace: true });
    } catch (err) {
      toast('error', 'Suppression impossible', friendlyError(err));
      setDeleting(false);
    }
  }

  return (
    <form onSubmit={save} className="space-y-5">
      <PageHeader
        back={{ to: '/espace-pro/produits', label: 'Produits' }}
        title={isNew ? 'Nouveau produit' : form.name}
        actions={
          <div className="flex flex-wrap gap-2">
            {!isNew && (form.isActive ? <Badge tone="success" dot>Publié</Badge> : <Badge dot>Brouillon</Badge>)}
            {!isNew && form.isActive && (
              <Button to={`/produit/${form.slug}`} size="sm" variant="secondary" icon={<ExternalLink className="h-3.5 w-3.5" />}>
                Voir en ligne
              </Button>
            )}
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1.4fr_1fr]">
        <div className="space-y-5">
          <Card>
            <CardTitle>Informations</CardTitle>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input
                label="Nom du produit"
                required
                value={form.name}
                onChange={e => {
                  const name = e.target.value;
                  setForm(f => ({ ...f, name, slug: slugTouched ? f.slug : slugify(name) }));
                }}
                wrapperClassName="sm:col-span-2"
              />
              <Select label="Catégorie" required value={form.categoryId} onChange={e => set('categoryId', e.target.value)} placeholder="Choisir" options={categories.map(c => ({ value: c.id, label: c.name }))} />
              <Input label="Référence (SKU)" value={form.sku} onChange={e => set('sku', e.target.value)} />
              <Input
                label="Adresse de la fiche"
                value={form.slug}
                onChange={e => {
                  setSlugTouched(true);
                  set('slug', slugify(e.target.value));
                }}
                hint={`/produit/${form.slug || '…'}`}
                wrapperClassName="sm:col-span-2"
              />
              <Textarea label="Résumé (affiché sous le titre)" value={form.shortDescription} onChange={e => set('shortDescription', e.target.value)} rows={2} wrapperClassName="sm:col-span-2" />
              <Textarea label="Description détaillée" value={form.description} onChange={e => set('description', e.target.value)} rows={6} wrapperClassName="sm:col-span-2" />
            </div>
          </Card>

          <Card>
            <CardTitle>Images</CardTitle>
            <MediaGalleryInput value={form.images} onChange={v => set('images', v)} onError={m => toast('error', 'Image refusée', m)} folder="produits" />
          </Card>

          <Card>
            <CardTitle>Points forts & caractéristiques</CardTitle>
            <Textarea label="Points forts (un par ligne)" value={features} onChange={e => setFeatures(e.target.value)} rows={4} />
            <p className="mb-2 mt-5 text-[13px] font-semibold">Fiche technique</p>
            <div className="space-y-2">
              {specs.map((s, i) => (
                <div key={i} className="grid grid-cols-[1fr_1fr_auto] gap-2">
                  <Input value={s.k} onChange={e => setSpecs(prev => prev.map((x, k) => (k === i ? { ...x, k: e.target.value } : x)))} placeholder="Caractéristique" aria-label="Caractéristique" />
                  <Input value={s.v} onChange={e => setSpecs(prev => prev.map((x, k) => (k === i ? { ...x, v: e.target.value } : x)))} placeholder="Valeur" aria-label="Valeur" />
                  <button type="button" onClick={() => setSpecs(prev => prev.filter((_, k) => k !== i))} className="flex h-11 w-11 items-center justify-center rounded-xl text-subtle hover:bg-red-50 hover:text-red-700" aria-label="Supprimer">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
              <Button variant="subtle" size="sm" icon={<Plus className="h-4 w-4" />} onClick={() => setSpecs(prev => [...prev, { k: '', v: '' }])}>
                Ajouter une ligne
              </Button>
            </div>
          </Card>
        </div>

        <div className="space-y-5">
          <Card>
            <CardTitle>Prix & marge</CardTitle>
            {priceLocked && <InlineAlert tone="info">Produit publié : le prix public est modifiable par l’administration (ou avec la permission « marges »).</InlineAlert>}
            <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input label="Prix de vente" required inputMode="numeric" value={form.priceXOF || ''} onChange={e => set('priceXOF', Number(e.target.value.replace(/\D/g, '')))} suffix="FCFA" disabled={priceLocked} />
              <Input label="Ancien prix (barré)" inputMode="numeric" value={form.compareAtPriceXOF || ''} onChange={e => set('compareAtPriceXOF', Number(e.target.value.replace(/\D/g, '')) || null)} suffix="FCFA" disabled={priceLocked} />
            </div>
            <div className="mt-5 rounded-2xl bg-paper p-4">
              <p className="text-[12px] font-bold uppercase tracking-wide text-muted">Coûts internes (jamais visibles par les clients)</p>
              <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Input label="Prix d’achat" inputMode="numeric" value={cost.purchasePriceXOF || ''} onChange={e => setCost(c => ({ ...c, purchasePriceXOF: Number(e.target.value.replace(/\D/g, '')) }))} suffix="FCFA" />
                <Input label="Prix d’achat (yuans)" inputMode="decimal" value={cost.purchasePriceCNY ?? ''} onChange={e => setCost(c => ({ ...c, purchasePriceCNY: e.target.value ? Number(e.target.value.replace(/[^\d.]/g, '')) : null }))} suffix="CNY" />
                <Input label="Logistique / unité" inputMode="numeric" value={cost.logisticsCostXOF || ''} onChange={e => setCost(c => ({ ...c, logisticsCostXOF: Number(e.target.value.replace(/\D/g, '')) }))} suffix="FCFA" />
                <Input label="Fournisseur" value={cost.supplierName} onChange={e => setCost(c => ({ ...c, supplierName: e.target.value }))} />
                <Input label="Lien fournisseur" value={cost.supplierUrl} onChange={e => setCost(c => ({ ...c, supplierUrl: e.target.value }))} placeholder="https://" wrapperClassName="sm:col-span-2" />
              </div>
              <div className="mt-4 grid grid-cols-2 gap-2 text-center text-[12.5px]">
                <div className="rounded-xl bg-white p-2.5 ring-1 ring-line">
                  <p className="text-muted">Coût de revient</p>
                  <p className="num text-sm font-semibold">{formatXOF(unitCost)}</p>
                </div>
                <div className="rounded-xl bg-white p-2.5 ring-1 ring-line">
                  <p className="text-muted">Marge unitaire</p>
                  <p className={`num text-sm font-semibold ${margin < 0 ? 'text-red-700' : 'text-jade'}`}>
                    {unitCost > 0 ? `${formatXOF(margin)} · ${percent(Math.max(margin, 0), form.priceXOF || 1)} %` : '—'}
                  </p>
                </div>
              </div>
              {unitCost > 0 && !priceLocked && (
                <div className="mt-3 flex items-end gap-2">
                  <Input label="Marge visée" inputMode="numeric" value={targetMargin} onChange={e => setTargetMargin(e.target.value.replace(/\D/g, '').slice(0, 2))} suffix="%" wrapperClassName="w-28" />
                  {suggested && (
                    <Button variant="secondary" size="md" onClick={() => set('priceXOF', suggested)}>
                      Appliquer {formatXOF(suggested)}
                    </Button>
                  )}
                </div>
              )}
            </div>
          </Card>

          <Card>
            <CardTitle>Stock & logistique</CardTitle>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input label="Stock disponible" inputMode="numeric" value={form.stockQuantity} onChange={e => set('stockQuantity', Number(e.target.value.replace(/\D/g, '')) || 0)} hint="0 = vendu sur commande" />
              <Input label="Quantité minimum" inputMode="numeric" value={form.moq} onChange={e => set('moq', Number(e.target.value.replace(/\D/g, '')) || 1)} />
              <Input label="Poids unitaire" inputMode="decimal" value={form.weightKg || ''} onChange={e => set('weightKg', Number(e.target.value.replace(/[^\d.]/g, '')) || 0)} suffix="kg" hint="Sert au calcul du fret" />
              <Select
                label="Transport par défaut"
                value={form.transportMode}
                onChange={e => set('transportMode', e.target.value as ProductInput['transportMode'])}
                options={[
                  { value: 'air', label: 'Aérien' },
                  { value: 'sea', label: 'Maritime' },
                  { value: 'express', label: 'Express' }
                ]}
              />
              <Input label="Délai affiché" value={form.deliveryDelay} onChange={e => set('deliveryDelay', e.target.value)} placeholder="12–18 jours" wrapperClassName="sm:col-span-2" />
            </div>
          </Card>

          <Card>
            <CardTitle>Publication</CardTitle>
            <div className="space-y-4">
              <Checkbox
                label="Publié dans le catalogue"
                description={canPublish ? 'Visible par tous les visiteurs.' : 'Réservé à l’administration : le produit reste en brouillon jusqu’à validation.'}
                checked={form.isActive}
                onChange={v => set('isActive', v)}
                disabled={!canPublish}
              />
              <Checkbox label="Mis en avant" description="Affiché en priorité sur l’accueil et le catalogue." checked={form.isFeatured} onChange={v => set('isFeatured', v)} disabled={!canPublish} />
              <Checkbox label="Univers auto & mobilité" description="Pièces, accessoires, deux-roues électriques…" checked={form.isAutoMobility} onChange={v => set('isAutoMobility', v)} />
            </div>
          </Card>

          <div className="sticky bottom-3 z-10 flex gap-2 rounded-2xl bg-paper/85 p-1.5 backdrop-blur">
            <Button type="submit" size="lg" className="flex-1" loading={saving} icon={<Save className="h-4 w-4" />}>
              {isNew ? 'Créer le produit' : 'Enregistrer'}
            </Button>
            {isAdmin && !isNew && (
              <Button variant="danger" size="lg" loading={deleting} onClick={remove} aria-label="Supprimer le produit" icon={<Trash2 className="h-4 w-4" />} />
            )}
          </div>
        </div>
      </div>
    </form>
  );
}
