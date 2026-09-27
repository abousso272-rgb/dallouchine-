import React, { useEffect, useState } from 'react';
import { ArrowRight, CheckCircle2 } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { submitVehicleRequest } from '../../services/requests';
import { friendlyError } from '../../lib/db';
import { Button } from '../ui/Button';
import { Input, Select, Textarea } from '../ui/Field';
import { InlineAlert } from '../ui/States';
import { VEHICLE_TYPE_LABEL } from '../../lib/status';
import type { Vehicle } from '../../lib/types';

/** Demande de devis automobile : véhicule du catalogue ou recherche personnalisée. */
export function VehicleRequestForm({ vehicle }: { vehicle?: Vehicle | null }) {
  const { user, requireAuth, toast } = useApp();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('');
  const [type, setType] = useState('');
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [yearMin, setYearMin] = useState('');
  const [budget, setBudget] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [message, setMessage] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState<{ id: string; code: string } | null>(null);

  useEffect(() => {
    if (!user) return;
    setName(n => n || user.fullName);
    setPhone(p => p || user.phone);
    setCity(c => c || user.city);
  }, [user]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (name.trim().length < 2) errs.name = 'Nom requis.';
    if (phone.replace(/\D/g, '').length < 8) errs.phone = 'Téléphone requis.';
    if (!vehicle && !brand.trim() && message.trim().length < 5) errs.brand = 'Indiquez au moins la marque ou décrivez le véhicule.';
    setErrors(errs);
    if (Object.keys(errs).length) return;
    if (!requireAuth({ reason: 'Créez votre compte pour recevoir le devis et suivre votre demande.', mode: 'register' })) return;
    setSubmitting(true);
    try {
      const res = await submitVehicleRequest({
        vehicleId: vehicle?.id || null,
        contactName: name,
        phone,
        email: user?.email,
        city,
        message,
        vehicleType: type || undefined,
        brand: brand || undefined,
        model: model || undefined,
        yearMin: yearMin ? Number(yearMin) : null,
        budgetXOF: budget ? Number(budget) : null,
        quantity: Number(quantity) || 1
      });
      setDone(res);
    } catch (err) {
      toast('error', 'Demande non envoyée', friendlyError(err));
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <div className="text-center">
        <CheckCircle2 className="mx-auto h-10 w-10 text-jade" />
        <p className="mt-3 font-display text-lg font-semibold">Demande envoyée</p>
        <p className="mt-1 text-sm text-muted">
          Référence <span className="num font-semibold text-ink">{done.code}</span>. Un conseiller automobile vous contacte et votre devis arrivera dans votre espace.
        </p>
        <Button to={`/compte/demandes/vehicle/${done.id}`} className="mt-5" iconRight={<ArrowRight className="h-4 w-4" />}>
          Suivre ma demande
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-4" noValidate>
      {!vehicle && (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Select
              label="Type de véhicule"
              value={type}
              onChange={e => setType(e.target.value)}
              placeholder="Choisir"
              options={Object.entries(VEHICLE_TYPE_LABEL).map(([value, label]) => ({ value, label }))}
            />
            <Input label="Marque" value={brand} onChange={e => setBrand(e.target.value)} placeholder="Toyota, Haojue, Sinotruk…" error={errors.brand} />
            <Input label="Modèle" value={model} onChange={e => setModel(e.target.value)} placeholder="Hilux, DK150…" />
            <Input label="Année minimum" inputMode="numeric" value={yearMin} onChange={e => setYearMin(e.target.value.replace(/\D/g, '').slice(0, 4))} placeholder="2020" />
          </div>
          <Input label="Budget maximum" inputMode="numeric" value={budget} onChange={e => setBudget(e.target.value.replace(/\D/g, ''))} suffix="FCFA" />
        </>
      )}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Input label="Nom complet" required value={name} onChange={e => setName(e.target.value)} error={errors.name} autoComplete="name" />
        <Input label="Téléphone / WhatsApp" required type="tel" value={phone} onChange={e => setPhone(e.target.value)} error={errors.phone} autoComplete="tel" />
        <Input label="Ville de livraison" value={city} onChange={e => setCity(e.target.value)} placeholder="Dakar" />
        <Input label="Quantité" inputMode="numeric" value={quantity} onChange={e => setQuantity(e.target.value.replace(/\D/g, ''))} />
      </div>
      <Textarea
        label={vehicle ? 'Votre message' : 'Précisions'}
        value={message}
        onChange={e => setMessage(e.target.value)}
        placeholder={vehicle ? 'Couleur souhaitée, options, questions sur le transport…' : 'Usage, motorisation, options indispensables…'}
        rows={3}
      />
      {!user && <InlineAlert tone="info">Un compte gratuit vous permettra de recevoir et valider votre devis en ligne.</InlineAlert>}
      <Button type="submit" size="lg" block loading={submitting} iconRight={<ArrowRight className="h-4 w-4" />}>
        {vehicle ? 'Demander un devis pour ce véhicule' : 'Envoyer ma recherche'}
      </Button>
      <p className="text-center text-[12px] text-muted">Aucun paiement à cette étape. Le devis précise prix, transport et délais.</p>
    </form>
  );
}
