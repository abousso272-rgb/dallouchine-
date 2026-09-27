import React, { useEffect, useState } from 'react';
import { ExternalLink, Save, Trash2 } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useAsync } from '../../lib/hooks';
import { deleteVehicle, getVehicle, saveVehicle, type VehicleInput } from '../../services/vehicles';
import { friendlyError } from '../../lib/db';
import { slugify } from '../../lib/format';
import { CONDITION_LABEL, FUEL_LABEL, TRANSMISSION_LABEL, VEHICLE_STATUS, VEHICLE_TYPE_LABEL } from '../../lib/status';
import { PageHeader, Card, CardTitle } from '../../components/ui/Layout';
import { Button } from '../../components/ui/Button';
import { Checkbox, Input, Select, Textarea } from '../../components/ui/Field';
import { MediaGalleryInput } from '../../components/ui/Uploads';
import { ErrorState, PageLoader } from '../../components/ui/States';

const EMPTY: VehicleInput = {
  slug: '',
  title: '',
  vehicleType: 'car',
  brand: '',
  model: '',
  year: new Date().getFullYear(),
  condition: 'new',
  mileageKm: null,
  fuel: 'petrol',
  transmission: 'automatic',
  engine: '',
  powerHp: null,
  seats: null,
  color: '',
  priceXOF: null,
  priceOnRequest: true,
  status: 'available',
  isPublished: false,
  isFeatured: false,
  description: '',
  features: [],
  images: [],
  location: 'Chine',
  leadTime: '45 à 60 jours'
};

const opts = (m: Record<string, string>) => Object.entries(m).map(([value, label]) => ({ value, label }));
const num = (v: string) => (v.replace(/\D/g, '') ? Number(v.replace(/\D/g, '')) : null);

export default function VehicleEditorPage({ id }: { id: string }) {
  const { user, toast, navigate } = useApp();
  const isNew = id === 'nouveau';
  const loaded = useAsync(() => (isNew ? Promise.resolve(null) : getVehicle(id)), [id]);
  const [v, setV] = useState<VehicleInput>(EMPTY);
  const [features, setFeatures] = useState('');
  const [slugTouched, setSlugTouched] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!loaded.data) return;
    const { createdAt: _c, ...rest } = loaded.data;
    setV(rest);
    setFeatures(loaded.data.features.join('\n'));
    setSlugTouched(true);
  }, [loaded.data]);

  const set = <K extends keyof VehicleInput>(k: K, val: VehicleInput[K]) =>
    setV(prev => {
      const next = { ...prev, [k]: val };
      if (!slugTouched && (k === 'brand' || k === 'model' || k === 'year' || k === 'title')) {
        next.slug = slugify(`${next.brand} ${next.model} ${next.year || ''}`);
      }
      return next;
    });

  if (loaded.loading) return <PageLoader />;
  if (loaded.error) return <ErrorState message={loaded.error} onRetry={loaded.reload} />;
  if (!isNew && !loaded.data) return <ErrorState message="Véhicule introuvable." />;

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!v.brand.trim() || !v.model.trim()) return toast('error', 'Marque et modèle requis');
    const title = v.title.trim() || `${v.brand} ${v.model}${v.year ? ` ${v.year}` : ''}`;
    setSaving(true);
    try {
      const savedId = await saveVehicle(
        { ...v, title, slug: v.slug || slugify(title), features: features.split('\n').map(f => f.trim()).filter(Boolean) },
        user!.id
      );
      toast('success', isNew ? 'Véhicule ajouté' : 'Véhicule enregistré');
      if (isNew) navigate(`/espace-pro/vehicules/${savedId}`, { replace: true });
      else loaded.reload();
    } catch (err) {
      toast('error', 'Enregistrement impossible', friendlyError(err));
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    if (!window.confirm('Supprimer ce véhicule ?')) return;
    try {
      await deleteVehicle(id);
      navigate('/espace-pro/vehicules', { replace: true });
    } catch (err) {
      toast('error', 'Suppression impossible', friendlyError(err));
    }
  }

  return (
    <form onSubmit={save} className="space-y-5">
      <PageHeader
        back={{ to: '/espace-pro/vehicules', label: 'Automobile' }}
        title={isNew ? 'Nouveau véhicule' : v.title}
        actions={
          !isNew && v.isPublished ? (
            <Button to={`/automobile/${v.slug}`} size="sm" variant="secondary" icon={<ExternalLink className="h-3.5 w-3.5" />}>
              Voir en ligne
            </Button>
          ) : undefined
        }
      />
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1.4fr_1fr]">
        <div className="space-y-5">
          <Card>
            <CardTitle>Identification</CardTitle>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Select label="Type" value={v.vehicleType} onChange={e => set('vehicleType', e.target.value)} options={opts(VEHICLE_TYPE_LABEL)} />
              <Select label="État" value={v.condition} onChange={e => set('condition', e.target.value)} options={opts(CONDITION_LABEL)} />
              <Input label="Marque" required value={v.brand} onChange={e => set('brand', e.target.value)} />
              <Input label="Modèle" required value={v.model} onChange={e => set('model', e.target.value)} />
              <Input label="Année" inputMode="numeric" value={v.year ?? ''} onChange={e => set('year', num(e.target.value.slice(0, 4)))} />
              <Input label="Kilométrage" inputMode="numeric" value={v.mileageKm ?? ''} onChange={e => set('mileageKm', num(e.target.value))} suffix="km" />
              <Input label="Titre de l’annonce" value={v.title} onChange={e => set('title', e.target.value)} placeholder={`${v.brand} ${v.model} ${v.year || ''}`.trim() || 'Toyota Hilux 2022 double cabine'} wrapperClassName="sm:col-span-2" />
              <Input
                label="Adresse de la fiche"
                value={v.slug}
                onChange={e => {
                  setSlugTouched(true);
                  setV(p => ({ ...p, slug: slugify(e.target.value) }));
                }}
                hint={`/automobile/${v.slug || '…'}`}
                wrapperClassName="sm:col-span-2"
              />
            </div>
          </Card>
          <Card>
            <CardTitle>Caractéristiques</CardTitle>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <Select label="Carburant" value={v.fuel || ''} onChange={e => set('fuel', e.target.value || null)} placeholder="—" options={opts(FUEL_LABEL)} />
              <Select label="Boîte" value={v.transmission || ''} onChange={e => set('transmission', e.target.value || null)} placeholder="—" options={opts(TRANSMISSION_LABEL)} />
              <Input label="Moteur" value={v.engine || ''} onChange={e => set('engine', e.target.value)} placeholder="2.8 L Turbo" />
              <Input label="Puissance" inputMode="numeric" value={v.powerHp ?? ''} onChange={e => set('powerHp', num(e.target.value))} suffix="ch" />
              <Input label="Places" inputMode="numeric" value={v.seats ?? ''} onChange={e => set('seats', num(e.target.value))} />
              <Input label="Couleur" value={v.color || ''} onChange={e => set('color', e.target.value)} />
            </div>
            <Textarea label="Description" value={v.description} onChange={e => set('description', e.target.value)} rows={4} wrapperClassName="mt-4" />
            <Textarea label="Équipements (un par ligne)" value={features} onChange={e => setFeatures(e.target.value)} rows={4} wrapperClassName="mt-4" />
          </Card>
          <Card>
            <CardTitle>Photos</CardTitle>
            <MediaGalleryInput value={v.images} onChange={val => set('images', val)} onError={m => toast('error', 'Image refusée', m)} folder="vehicules" max={12} />
          </Card>
        </div>
        <div className="space-y-5">
          <Card>
            <CardTitle>Prix & disponibilité</CardTitle>
            <div className="space-y-4">
              <Checkbox label="Prix sur devis" description="Affiche « Prix sur devis » au lieu d’un montant." checked={v.priceOnRequest} onChange={val => set('priceOnRequest', val)} />
              {!v.priceOnRequest && <Input label="Prix indicatif" inputMode="numeric" value={v.priceXOF ?? ''} onChange={e => set('priceXOF', num(e.target.value))} suffix="FCFA" hint="Hors transport et dédouanement" />}
              <Select label="Disponibilité" value={v.status} onChange={e => set('status', e.target.value)} options={Object.entries(VEHICLE_STATUS).map(([value, m]) => ({ value, label: m.label }))} />
              <Input label="Localisation" value={v.location || ''} onChange={e => set('location', e.target.value)} />
              <Input label="Délai de livraison" value={v.leadTime || ''} onChange={e => set('leadTime', e.target.value)} />
            </div>
          </Card>
          <Card>
            <CardTitle>Publication</CardTitle>
            <div className="space-y-4">
              <Checkbox label="Publié sur le site" checked={v.isPublished} onChange={val => set('isPublished', val)} />
              <Checkbox label="Mis en avant" description="Affiché en priorité, y compris sur l’accueil." checked={v.isFeatured} onChange={val => set('isFeatured', val)} />
            </div>
          </Card>
          <div className="sticky bottom-3 z-10 flex gap-2 rounded-2xl bg-paper/85 p-1.5 backdrop-blur">
            <Button type="submit" size="lg" className="flex-1" loading={saving} icon={<Save className="h-4 w-4" />}>
              {isNew ? 'Ajouter le véhicule' : 'Enregistrer'}
            </Button>
            {!isNew && user?.role === 'admin' && <Button variant="danger" size="lg" onClick={remove} aria-label="Supprimer" icon={<Trash2 className="h-4 w-4" />} />}
          </div>
        </div>
      </div>
    </form>
  );
}
