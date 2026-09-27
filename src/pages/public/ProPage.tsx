import React, { useEffect, useState } from 'react';
import { ArrowRight, BadgeCheck, Building2, CheckCircle2, Container, Factory, Palette, Percent, UserRound } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { submitB2B } from '../../services/requests';
import { friendlyError } from '../../lib/db';
import { Button } from '../../components/ui/Button';
import { Checkbox, ChoiceCards, Input, Textarea } from '../../components/ui/Field';
import { ClientFilesInput } from '../../components/ui/Uploads';
import { InlineAlert } from '../../components/ui/States';
import { Stepper } from '../../components/ui/Stepper';
import { B2B_STEPS } from '../../lib/status';

export default function ProPage() {
  const { user, requireAuth, toast } = useApp();
  const [company, setCompany] = useState('');
  const [sector, setSector] = useState('');
  const [contact, setContact] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [products, setProducts] = useState('');
  const [quantity, setQuantity] = useState('');
  const [budget, setBudget] = useState('');
  const [destination, setDestination] = useState('Dakar, Sénégal');
  const [transport, setTransport] = useState<'recommended' | 'air' | 'sea'>('recommended');
  const [customization, setCustomization] = useState(false);
  const [logo, setLogo] = useState('');
  const [packaging, setPackaging] = useState(false);
  const [notes, setNotes] = useState('');
  const [files, setFiles] = useState<string[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState<{ id: string; code: string } | null>(null);

  useEffect(() => {
    if (!user) return;
    setContact(c => c || user.fullName);
    setPhone(p => p || user.phone);
    setEmail(e => e || user.email);
    setCompany(c => c || user.companyName);
  }, [user]);

  function validate() {
    const e: Record<string, string> = {};
    if (company.trim().length < 2) e.company = 'Nom de l’entreprise requis.';
    if (contact.trim().length < 2) e.contact = 'Nom du contact requis.';
    if (phone.replace(/\D/g, '').length < 8) e.phone = 'Téléphone requis.';
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim())) e.email = 'Email professionnel requis.';
    if (products.trim().length < 5) e.products = 'Décrivez les produits recherchés.';
    if (!Number(quantity)) e.quantity = 'Quantité requise.';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function submit(ev: React.FormEvent) {
    ev.preventDefault();
    if (!validate()) return;
    if (!requireAuth({ reason: 'Créez votre compte professionnel pour recevoir et valider votre devis en ligne.', mode: 'register' })) return;
    setSubmitting(true);
    try {
      const res = await submitB2B({
        companyName: company,
        contactName: contact,
        phone,
        email,
        sector,
        productDescription: products,
        quantity: Number(quantity),
        budgetXOF: budget ? Number(budget) : null,
        destination,
        customization,
        logoInstructions: logo,
        packaging,
        transport,
        notes,
        attachments: files
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
          <h1 className="mt-4 text-2xl font-semibold sm:text-3xl">Demande professionnelle enregistrée</h1>
          <p className="mt-2 text-muted">
            Référence <span className="num font-semibold text-ink">{done.code}</span>. Un conseiller qualifie votre besoin et vous recontacte. Le devis vous sera envoyé dans votre espace.
          </p>
          <Button to={`/compte/demandes/b2b/${done.id}`} className="mt-7" iconRight={<ArrowRight className="h-4 w-4" />}>
            Suivre ma demande
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <section className="bg-ink text-white">
        <div className="container-page grid gap-10 py-12 sm:py-16 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-white/45">DALUCHE Pro · B2B</p>
            <h1 className="mt-3 text-[30px] font-semibold leading-tight text-white sm:text-[44px]">Approvisionnez votre entreprise directement en Chine.</h1>
            <p className="mt-4 max-w-xl text-[15.5px] leading-relaxed text-white/65">
              Grossistes, distributeurs, commerces et entreprises : nous sourçons, négocions, contrôlons et livrons vos commandes en volume, avec un interlocuteur dédié et un devis ferme.
            </p>
            <Button className="mt-7" size="lg" iconRight={<ArrowRight className="h-4 w-4" />} onClick={() => document.getElementById('demande-pro')?.scrollIntoView({ behavior: 'smooth' })}>
              Demander un devis
            </Button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[
              { icon: Factory, t: 'Multi-usines', d: 'Offres comparées et négociées' },
              { icon: Palette, t: 'Personnalisation', d: 'Logo, couleurs, emballage' },
              { icon: BadgeCheck, t: 'Inspection', d: 'Contrôle qualité avant départ' },
              { icon: Container, t: 'Conteneurs', d: 'Groupage ou complet, aérien' },
              { icon: Percent, t: 'Paiement échelonné', d: 'Acompte puis solde' },
              { icon: UserRound, t: 'Conseiller dédié', d: 'Un fil d’échange unique' }
            ].map(i => (
              <div key={i.t} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <i.icon className="h-5 w-5 text-brand" />
                <p className="mt-2.5 text-[14px] font-semibold text-white">{i.t}</p>
                <p className="text-[12.5px] text-white/55">{i.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="container-page py-10">
        <div className="card p-5 sm:p-6">
          <p className="mb-5 text-sm font-semibold">Le parcours d’une commande professionnelle</p>
          <Stepper steps={B2B_STEPS} current={0} />
        </div>

        <form id="demande-pro" onSubmit={submit} className="mt-8 grid scroll-mt-24 gap-6 lg:grid-cols-[1fr_1.3fr]" noValidate>
          <section className="card space-y-4 self-start p-5 sm:p-7">
            <div className="flex items-center gap-2.5">
              <Building2 className="h-5 w-5 text-brand" />
              <h2 className="text-lg font-semibold">Votre entreprise</h2>
            </div>
            <Input label="Entreprise" required value={company} onChange={e => setCompany(e.target.value)} error={errors.company} autoComplete="organization" />
            <Input label="Secteur d’activité" value={sector} onChange={e => setSector(e.target.value)} placeholder="Ex. BTP, distribution, restauration…" />
            <Input label="Nom du contact" required value={contact} onChange={e => setContact(e.target.value)} error={errors.contact} autoComplete="name" />
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
              <Input label="Téléphone" required type="tel" value={phone} onChange={e => setPhone(e.target.value)} error={errors.phone} autoComplete="tel" />
              <Input label="Email professionnel" required type="email" value={email} onChange={e => setEmail(e.target.value)} error={errors.email} autoComplete="email" />
            </div>
          </section>

          <section className="card space-y-5 p-5 sm:p-7">
            <h2 className="text-lg font-semibold">Votre besoin</h2>
            <Textarea
              label="Produits recherchés"
              required
              value={products}
              onChange={e => setProducts(e.target.value)}
              placeholder="Références, spécifications, qualité attendue, normes…"
              error={errors.products}
              rows={5}
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <Input label="Quantité totale" required inputMode="numeric" value={quantity} onChange={e => setQuantity(e.target.value.replace(/\D/g, ''))} error={errors.quantity} suffix="unités" />
              <Input label="Budget indicatif" inputMode="numeric" value={budget} onChange={e => setBudget(e.target.value.replace(/\D/g, ''))} suffix="FCFA" />
            </div>
            <Input label="Destination de livraison" value={destination} onChange={e => setDestination(e.target.value)} />
            <div>
              <p className="mb-2 text-[13px] font-semibold">Transport</p>
              <ChoiceCards
                columns={3}
                value={transport}
                onChange={setTransport}
                options={[
                  { value: 'recommended', title: 'Au meilleur coût', description: 'Nous recommandons' },
                  { value: 'sea', title: 'Maritime', description: 'Volumes, 30–45 j' },
                  { value: 'air', title: 'Aérien', description: 'Urgent, 12–18 j' }
                ]}
              />
            </div>
            <div className="space-y-3 rounded-2xl bg-paper p-4">
              <Checkbox label="Personnalisation (logo, marquage, couleurs)" checked={customization} onChange={setCustomization} />
              {customization && <Textarea value={logo} onChange={e => setLogo(e.target.value)} placeholder="Emplacement, taille, nombre de couleurs…" rows={2} />}
              <Checkbox label="Emballage personnalisé" checked={packaging} onChange={setPackaging} />
            </div>
            <div>
              <p className="mb-1.5 text-[13px] font-semibold">Pièces jointes (photos, cahier des charges)</p>
              <ClientFilesInput
                userId={user?.id || null}
                value={files}
                onChange={setFiles}
                onError={m => toast('error', 'Fichier refusé', m)}
                requireAuth={() => requireAuth({ reason: 'Connectez-vous pour joindre des fichiers.', mode: 'register' })}
              />
            </div>
            <Textarea label="Précisions" value={notes} onChange={e => setNotes(e.target.value)} placeholder="Délai, échantillons souhaités, conditions particulières…" rows={3} />
            {!user && <InlineAlert tone="info">Un compte gratuit est créé à l’envoi pour suivre votre dossier et valider le devis en ligne.</InlineAlert>}
            <Button type="submit" size="lg" block loading={submitting} iconRight={<ArrowRight className="h-4 w-4" />}>
              Envoyer ma demande de devis
            </Button>
          </section>
        </form>
      </div>
    </div>
  );
}
