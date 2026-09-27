import React, { useEffect, useState } from 'react';
import { ArrowRight, CheckCircle2, FileSearch, Link2, MessageSquareText, ShieldCheck, Wallet } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { submitSourcing } from '../../services/requests';
import { friendlyError } from '../../lib/db';
import { Button } from '../../components/ui/Button';
import { Input, Select, Textarea } from '../../components/ui/Field';
import { ClientFilesInput } from '../../components/ui/Uploads';
import { InlineAlert } from '../../components/ui/States';
import { Stepper } from '../../components/ui/Stepper';
import { SOURCING_STEPS } from '../../lib/status';

export default function SourcingPage() {
  const { user, requireAuth, query, categories, toast } = useApp();
  const [title, setTitle] = useState(query.get('produit') || '');
  const [description, setDescription] = useState('');
  const [link, setLink] = useState('');
  const [quantity, setQuantity] = useState('');
  const [budget, setBudget] = useState('');
  const [category, setCategory] = useState('');
  const [notes, setNotes] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [phone, setPhone] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState<{ id: string; code: string } | null>(null);

  useEffect(() => {
    if (user && !phone) setPhone(user.phone);
  }, [user, phone]);

  function validate() {
    const e: Record<string, string> = {};
    if (title.trim().length < 2) e.title = 'Indiquez le nom du produit recherché.';
    if (description.trim().length < 10 && images.length === 0 && !link.trim()) e.description = 'Décrivez le produit (au moins quelques mots) ou ajoutez une photo / un lien.';
    if (!Number(quantity) || Number(quantity) <= 0) e.quantity = 'Quantité requise.';
    if (link.trim() && !/^https?:\/\//i.test(link.trim())) e.link = 'Le lien doit commencer par https://';
    if (user && phone.replace(/\D/g, '').length < 8) e.phone = 'Numéro nécessaire pour vous recontacter.';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    if (!requireAuth({ reason: 'Créez votre compte (30 s) pour envoyer votre demande et suivre la réponse de notre équipe.', mode: 'register' })) return;
    setSubmitting(true);
    try {
      const res = await submitSourcing({
        title: title.trim(),
        description: description.trim(),
        quantity: Number(quantity),
        productUrl: link.trim() || undefined,
        images,
        budgetXOF: budget ? Number(budget) : null,
        category: category || undefined,
        notes: notes.trim() || undefined,
        name: user?.fullName,
        phone: phone.trim() || user?.phone,
        email: user?.email
      });
      setDone(res);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      toast('error', 'Demande non envoyée', friendlyError(err));
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <div className="container-page max-w-2xl py-12 sm:py-16">
        <div className="card p-6 text-center sm:p-10">
          <CheckCircle2 className="mx-auto h-12 w-12 text-jade" />
          <h1 className="mt-4 text-2xl font-semibold sm:text-3xl">Demande envoyée</h1>
          <p className="mt-2 text-muted">
            Référence <span className="num font-semibold text-ink">{done.code}</span>. Notre équipe analyse votre besoin et revient vers vous avec une proposition. Vous serez notifié à chaque étape.
          </p>
          <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
            <Button to={`/compte/demandes/sourcing/${done.id}`} iconRight={<ArrowRight className="h-4 w-4" />}>
              Suivre ma demande
            </Button>
            <Button
              variant="secondary"
              onClick={() => {
                setDone(null);
                setTitle('');
                setDescription('');
                setLink('');
                setQuantity('');
                setBudget('');
                setNotes('');
                setImages([]);
              }}
            >
              Nouvelle demande
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container-page py-8 sm:py-10">
      <div className="max-w-3xl">
        <p className="eyebrow">Sourcing personnalisé</p>
        <h1 className="mt-2 text-[30px] font-semibold leading-tight sm:text-[42px]">Décrivez le produit. Nous trouvons le fournisseur.</h1>
        <p className="mt-3 text-[15.5px] leading-relaxed text-muted">
          Une photo, un lien Alibaba/1688 ou une simple description suffit. Vous recevez une proposition chiffrée — produit, transport et frais — avant tout engagement.
        </p>
      </div>

      <div className="card mt-8 p-5 sm:p-6">
        <Stepper steps={SOURCING_STEPS} current={0} mobile="scroll" />
      </div>

      <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-[1fr_340px]">
        <form onSubmit={submit} className="card space-y-5 p-5 sm:p-7" noValidate>
          <Input label="Produit recherché" required value={title} onChange={e => setTitle(e.target.value)} placeholder="Ex. Chaises pliantes en métal pour événements" error={errors.title} />
          <Textarea
            label="Description"
            required
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="Dimensions, matière, couleur, usage, qualité attendue…"
            error={errors.description}
            rows={4}
          />
          <div>
            <p className="mb-1.5 text-[13px] font-semibold">Photos ou documents</p>
            <ClientFilesInput
              userId={user?.id || null}
              value={images}
              onChange={setImages}
              onError={m => toast('error', 'Fichier refusé', m)}
              requireAuth={() => requireAuth({ reason: 'Connectez-vous pour joindre des photos à votre demande.', mode: 'register' })}
            />
            <p className="mt-1.5 text-[12.5px] text-muted">Jusqu’à 5 fichiers (JPG, PNG, PDF · 10 Mo). Visibles uniquement par vous et notre équipe.</p>
          </div>
          <Input
            label="Lien du produit (Alibaba, 1688, autre)"
            type="url"
            inputMode="url"
            value={link}
            onChange={e => setLink(e.target.value)}
            placeholder="https://"
            prefix={<Link2 className="h-4 w-4" />}
            error={errors.link}
          />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input label="Quantité souhaitée" required inputMode="numeric" value={quantity} onChange={e => setQuantity(e.target.value.replace(/\D/g, ''))} placeholder="Ex. 200" error={errors.quantity} />
            <Input label="Budget total (optionnel)" inputMode="numeric" value={budget} onChange={e => setBudget(e.target.value.replace(/\D/g, ''))} placeholder="Ex. 500000" suffix="FCFA" />
          </div>
          <Select
            label="Catégorie"
            value={category}
            onChange={e => setCategory(e.target.value)}
            placeholder="Choisir (optionnel)"
            options={[...categories.map(c => ({ value: c.name, label: c.name })), { value: 'Autre', label: 'Autre' }]}
          />
          <Textarea label="Informations complémentaires" value={notes} onChange={e => setNotes(e.target.value)} placeholder="Délai souhaité, personnalisation, destination finale…" rows={3} />
          {user && (
            <Input
              label="Téléphone / WhatsApp pour vous recontacter"
              type="tel"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              error={errors.phone}
            />
          )}
          {!user && <InlineAlert tone="info">Vous créerez votre compte gratuit en validant : il vous permet de suivre la demande et de valider le devis en ligne.</InlineAlert>}
          <Button type="submit" size="lg" block loading={submitting} iconRight={<ArrowRight className="h-4 w-4" />}>
            Envoyer ma demande
          </Button>
        </form>

        <aside className="space-y-4">
          <div className="card p-5">
            <h2 className="text-base font-semibold">Ce que vous recevez</h2>
            <ul className="mt-4 space-y-4 text-[14px]">
              <Perk icon={<FileSearch className="h-4 w-4" />} title="Une recherche comparée" text="Plusieurs fournisseurs vérifiés, prix et délais négociés." />
              <Perk icon={<Wallet className="h-4 w-4" />} title="Un devis tout compris" text="Produit, transport, frais : un montant clair en FCFA." />
              <Perk icon={<MessageSquareText className="h-4 w-4" />} title="Un fil de discussion" text="Échangez avec votre conseiller depuis votre espace." />
            </ul>
          </div>
          <div className="rounded-[var(--radius-card)] bg-ink p-5 text-white">
            <ShieldCheck className="h-5 w-5 text-brand" />
            <p className="mt-3 font-semibold">Aucun paiement à cette étape</p>
            <p className="mt-1 text-[13.5px] text-white/65">Le sourcing n’est pas un achat. Vous ne payez qu’après avoir validé le devis (acompte puis solde).</p>
          </div>
          <div className="card p-5">
            <p className="font-semibold">Gros volumes ou produit personnalisé ?</p>
            <p className="mt-1 text-[13.5px] text-muted">Conteneurs, marquage logo, emballage : utilisez le parcours professionnel.</p>
            <Button to="/pro" variant="secondary" size="sm" className="mt-3" iconRight={<ArrowRight className="h-3.5 w-3.5" />}>
              Espace professionnels
            </Button>
          </div>
        </aside>
      </div>
    </div>
  );
}

function Perk({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
  return (
    <li className="flex gap-3">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand">{icon}</span>
      <span>
        <span className="block font-semibold">{title}</span>
        <span className="text-[13px] text-muted">{text}</span>
      </span>
    </li>
  );
}
