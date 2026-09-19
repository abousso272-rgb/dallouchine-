import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { b2bService } from '../../services/b2bService';

export const B2BPage: React.FC = () => {
  const { navigate, submitB2BRequest } = useApp();

  const [companyName, setCompanyName] = useState('');
  const [contactName, setContactName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [productName, setProductName] = useState('');
  const [productLink, setProductLink] = useState('');
  const [quantity, setQuantity] = useState<number>(50);
  const [budgetXof, setBudgetXof] = useState<number>(15000000);
  const [industrySector, setIndustrySector] = useState('auto-ev');
  const [expectedVolume, setExpectedVolume] = useState('40hq');
  const [specifications, setSpecifications] = useState('');
  const [sampleNeeded, setSampleNeeded] = useState(false);
  const [customization, setCustomization] = useState(false);
  const [packagingRequested, setPackagingRequested] = useState(false);
  const [desiredDeadline, setDesiredDeadline] = useState('');
  const [destination, setDestination] = useState('Dakar, Sénégal');

  const [attachments, setAttachments] = useState<Array<{ name: string; url: string; size?: number; mimeType?: string }>>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [submittedCode, setSubmittedCode] = useState<string | null>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    setErrorMessage(null);
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const res = await b2bService.uploadFile(file, 'b2b-attachments');
        if (res.success) {
          setAttachments(prev => [...prev, {
            name: file.name,
            url: res.url,
            size: file.size,
            mimeType: file.type
          }]);
        } else {
          setErrorMessage(res.error || `Erreur lors de l'upload de ${file.name}`);
        }
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Erreur lors de l'envoi des documents.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactName || !phone) {
      alert('Veuillez renseigner votre nom et votre numéro de téléphone.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const pName = productName.trim() || `[B2B ${industrySector}] Volume: ${expectedVolume}`;
      const specsFull = `${specifications} \n[Filière: ${industrySector}] \n[Volume prévisionnel: ${expectedVolume}] \n[Échantillon requis: ${sampleNeeded ? 'Oui' : 'Non'}]`;

      const res = await b2bService.createRequest({
        companyName: companyName.trim() || 'Société Grands Comptes',
        contactName: contactName.trim(),
        phone: phone.trim(),
        email: email.trim() || 'b2b@entreprise.sn',
        sector: industrySector,
        productName: pName,
        productDescription: specifications.trim() || pName,
        productLink: productLink.trim() || undefined,
        quantity: Number(quantity) || 50,
        budgetXof: Number(budgetXof) || undefined,
        transportPreference: 'sea',
        destination,
        specifications: specsFull,
        customization,
        packagingRequested,
        desiredDeadline: desiredDeadline || undefined,
        attachments
      });

      if (!res.success) {
        setErrorMessage(res.error || res.errorMessage || 'Erreur lors de la création de la demande B2B.');
        setIsSubmitting(false);
        return;
      }

      // Synchroniser avec le contexte pour rétro-compatibilité
      submitB2BRequest({
        companyName: companyName || 'Société Grands Comptes',
        contactName,
        phone,
        email: email || 'b2b@entreprise.sn',
        productType: pName,
        quantity: Number(quantity) || 50,
        targetBudgetXOF: Number(budgetXof) || 15000000,
        transportPreference: 'sea',
        specifications: specsFull
      });

      setSubmittedCode(res.code || 'DLC-B2B-CONFIRMED');
    } catch (err: any) {
      setErrorMessage(err.message || 'Erreur de connexion au serveur.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const scrollToDevis = () => {
    const el = document.getElementById('devis-b2b');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="flex flex-col w-full space-y-16 pb-16">
      {/* Success Modal */}
      {submittedCode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-inverse-surface/40 backdrop-blur-md">
          <div className="bg-surface-container-lowest rounded-3xl p-6 sm:p-10 max-w-lg w-full shadow-2xl border border-slate-100 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
              <span className="material-symbols-outlined text-[36px]">verified</span>
            </div>
            <h3 className="font-headline-lg text-headline-lg text-on-surface font-bold">
              Demande Grands Comptes Validée
            </h3>
            <p className="font-body-md text-body-md text-on-surface-variant">
              Votre dossier B2B prioritaire a été transmis à la direction commerciale Dakar et au desk achats de Guangzhou. Votre code de référence est :
            </p>
            <div className="bg-surface-container-low p-3.5 rounded-2xl flex items-center justify-between">
              <span className="font-label-md text-label-md text-on-surface-variant">Réf. Contrat B2B :</span>
              <span className="font-headline-sm text-headline-sm text-primary font-mono font-bold">
                {submittedCode}
              </span>
            </div>
            <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
              <button
                onClick={() => {
                  setSubmittedCode(null);
                  navigate('/tracking');
                }}
                className="flex-1 h-12 rounded-full bg-primary-container text-on-primary font-label-lg text-label-lg font-bold hover:bg-secondary-container transition-all cursor-pointer"
                type="button"
              >
                Suivre mon dossier
              </button>
              <button
                onClick={() => setSubmittedCode(null)}
                className="flex-1 h-12 rounded-full bg-surface-container hover:bg-surface-container-high text-on-surface font-label-lg text-label-lg font-semibold transition-all cursor-pointer"
                type="button"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* 1. HERO B2B CORPORATE & DIRECT USINE */}
      {/* =================================================================== */}
      <section className="relative rounded-3xl overflow-hidden bg-surface-container-lowest/80 backdrop-blur-2xl p-6 sm:p-12 lg:p-16 border border-slate-100 shadow-xl shadow-on-surface/5">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary-container/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        <div className="absolute bottom-0 left-0 w-[350px] h-[350px] bg-secondary-container/10 rounded-full blur-3xl pointer-events-none -ml-20 -mb-20" />

        <div className="relative z-10 max-w-4xl space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary-fixed/20 border border-primary/20">
            <span className="w-2 h-2 rounded-full bg-primary-container animate-pulse" />
            <span className="font-label-sm text-label-sm uppercase font-extrabold tracking-wider text-primary">
              Division Corporate • FCL & Projets Industriels
            </span>
          </div>

          <h1 className="font-display-lg text-display-lg text-on-surface tracking-tight font-extrabold leading-tight">
            Votre approvisionnement professionnel direct depuis les usines en Chine.
          </h1>

          <p className="font-body-lg text-body-lg text-on-surface-variant max-w-2xl leading-relaxed">
            Pour les grossistes, concessionnaires, entreprises de logistique, revendeurs et industriels d'Afrique de l'Ouest. Bénéficiez de prix FOB usine, d'un contrôle qualité physique sur site et d'une logistique conteneurisée de bout en bout vers le Port de Dakar.
          </p>

          <div className="flex flex-wrap items-center gap-4 pt-2">
            <button
              onClick={scrollToDevis}
              className="h-14 px-8 rounded-full bg-primary-container text-on-primary font-label-lg text-label-lg font-bold flex items-center gap-2 shadow-lg shadow-primary-container/30 hover:bg-secondary-container hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
              type="button"
            >
              <span>Demander un devis B2B Grands Comptes</span>
              <span className="material-symbols-outlined text-[20px]">arrow_downward</span>
            </button>

            <a
              href="https://wa.me/221338000000"
              target="_blank"
              rel="noopener noreferrer"
              className="h-14 px-7 rounded-full bg-surface-container hover:bg-surface-container-high text-on-surface font-label-lg text-label-lg font-semibold flex items-center gap-2.5 transition-all border border-slate-200/80 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[20px] text-emerald-600">call</span>
              <span>Planifier un échange Desk B2B Dakar</span>
            </a>
          </div>
        </div>

        {/* Live Key Metrics Strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-12 pt-8 border-t border-surface-container">
          <div className="flex flex-col">
            <span className="font-display-lg text-display-lg font-extrabold text-primary-container">40HQ</span>
            <span className="font-label-md text-label-md text-on-surface-variant mt-1">
              FCL Direct Ningbo • Dakar
            </span>
          </div>
          <div className="flex flex-col">
            <span className="font-display-lg text-display-lg font-extrabold text-on-surface">100%</span>
            <span className="font-label-md text-label-md text-on-surface-variant mt-1">
              Audit Usine & Licences
            </span>
          </div>
          <div className="flex flex-col">
            <span className="font-display-lg text-display-lg font-extrabold text-secondary-container">0% Risque</span>
            <span className="font-label-md text-label-md text-on-surface-variant mt-1">
              Assurance Maritime CIF
            </span>
          </div>
          <div className="flex flex-col">
            <span className="font-display-lg text-display-lg font-extrabold text-on-surface">OHADA</span>
            <span className="font-label-md text-label-md text-on-surface-variant mt-1">
              Facturation avec TVA légale
            </span>
          </div>
        </div>
      </section>

      {/* =================================================================== */}
      {/* 2. FILIÈRE STRATÉGIQUE : FLOTTES & MOBILITÉ DÉCARBONÉE */}
      {/* =================================================================== */}
      <section className="space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 text-secondary-container font-label-sm text-label-sm font-bold uppercase tracking-wider mb-1">
              <span className="material-symbols-outlined text-[16px]">electric_bolt</span>
              <span>Filière Stratégique Prioritaire</span>
            </div>
            <h2 className="font-headline-xl text-headline-xl text-on-surface font-extrabold">
              Flottes, Concessions & Mobilité Décarbonée
            </h2>
            <p className="font-body-md text-body-md text-on-surface-variant mt-1">
              Approvisionnement direct usine pour les professionnels du transport, de la livraison et les revendeurs auto-moto au Sénégal.
            </p>
          </div>
          <button
            onClick={() => navigate('/products?cat=Auto%20%26%20Mobilit%C3%A9')}
            className="self-start sm:self-auto font-label-md text-label-md font-bold text-primary flex items-center gap-1 hover:underline cursor-pointer"
          >
            <span>Voir le catalogue Mobilité</span>
            <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Card 1 */}
          <div className="bg-surface-container-lowest rounded-3xl p-6 border border-slate-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-primary-fixed/30 text-primary flex items-center justify-center">
                <span className="material-symbols-outlined text-[24px]">electric_car</span>
              </div>
              <div>
                <h3 className="font-headline-sm text-headline-sm text-on-surface font-bold">
                  Concessionnaires & Revendeurs Véhicules
                </h3>
                <p className="font-body-sm text-body-sm text-on-surface-variant mt-2 leading-relaxed">
                  Citadines électriques, SUV à autonomie étendue (450km WLTP) et pick-ups utilitaires adaptés aux températures sahéliennes.
                </p>
              </div>
              <ul className="space-y-2 font-label-sm text-label-sm text-on-surface font-medium pt-2">
                <li className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[16px] text-emerald-600">check_circle</span>
                  <span>MOQ dès 2 unités conteneurisées</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[16px] text-emerald-600">check_circle</span>
                  <span>Dossier d'homologation Dakar inclus</span>
                </li>
              </ul>
            </div>
            <button
              onClick={() => {
                setIndustrySector('auto-ev');
                scrollToDevis();
              }}
              className="mt-6 w-full py-2.5 rounded-full bg-surface-container hover:bg-surface-container-high text-on-surface font-label-sm text-label-sm font-bold transition-colors cursor-pointer"
            >
              Demander cotation Concession
            </button>
          </div>

          {/* Card 2 */}
          <div className="bg-surface-container-lowest rounded-3xl p-6 border border-slate-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-secondary-fixed/30 text-secondary-container flex items-center justify-center">
                <span className="material-symbols-outlined text-[24px]">two_wheeler</span>
              </div>
              <div>
                <h3 className="font-headline-sm text-headline-sm text-on-surface font-bold">
                  Opérateurs Flottes & Dernier Kilomètre
                </h3>
                <p className="font-body-sm text-body-sm text-on-surface-variant mt-2 leading-relaxed">
                  Motos de livraison 2000W à 4000W avec batteries LiFePO4 interchangeables (swap battery) pour livreurs et coursiers.
                </p>
              </div>
              <ul className="space-y-2 font-label-sm text-label-sm text-on-surface font-medium pt-2">
                <li className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[16px] text-emerald-600">check_circle</span>
                  <span>MOQ 20GP (24 à 28 motos)</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[16px] text-emerald-600">check_circle</span>
                  <span>Stations de swap clé en main</span>
                </li>
              </ul>
            </div>
            <button
              onClick={() => {
                setIndustrySector('flottes-motos');
                scrollToDevis();
              }}
              className="mt-6 w-full py-2.5 rounded-full bg-surface-container hover:bg-surface-container-high text-on-surface font-label-sm text-label-sm font-bold transition-colors cursor-pointer"
            >
              Demander cotation Flotte
            </button>
          </div>

          {/* Card 3 */}
          <div className="bg-surface-container-lowest rounded-3xl p-6 border border-slate-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-primary-fixed/30 text-primary flex items-center justify-center">
                <span className="material-symbols-outlined text-[24px]">handyman</span>
              </div>
              <div>
                <h3 className="font-headline-sm text-headline-sm text-on-surface font-bold">
                  Garages & Pièces Détachées OEM
                </h3>
                <p className="font-body-sm text-body-sm text-on-surface-variant mt-2 leading-relaxed">
                  Moteurs brushless, contrôleurs sinusoïdaux, BMS intelligents, amortisseurs renforcés et pièces d'usure en direct usines.
                </p>
              </div>
              <ul className="space-y-2 font-label-sm text-label-sm text-on-surface font-medium pt-2">
                <li className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[16px] text-emerald-600">check_circle</span>
                  <span>Contrats cadre d'approvisionnement annuel</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[16px] text-emerald-600">check_circle</span>
                  <span>Stock tampon pièces critiques</span>
                </li>
              </ul>
            </div>
            <button
              onClick={() => {
                setIndustrySector('pieces-oem');
                scrollToDevis();
              }}
              className="mt-6 w-full py-2.5 rounded-full bg-surface-container hover:bg-surface-container-high text-on-surface font-label-sm text-label-sm font-bold transition-colors cursor-pointer"
            >
              Demander cotation Pièces
            </button>
          </div>

          {/* Card 4 */}
          <div className="bg-surface-container-lowest rounded-3xl p-6 border border-slate-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-secondary-fixed/30 text-secondary-container flex items-center justify-center">
                <span className="material-symbols-outlined text-[24px]">solar_power</span>
              </div>
              <div>
                <h3 className="font-headline-sm text-headline-sm text-on-surface font-bold">
                  Stations Solaires & Bornes de Recharge
                </h3>
                <p className="font-body-sm text-body-sm text-on-surface-variant mt-2 leading-relaxed">
                  Écosystèmes photovoltaïques autonomes, onduleurs hybrides 10kW à 50kW et armoires de recharge rapide IoT.
                </p>
              </div>
              <ul className="space-y-2 font-label-sm text-label-sm text-on-surface font-medium pt-2">
                <li className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[16px] text-emerald-600">check_circle</span>
                  <span>Garantie fabricants Tier 1</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[16px] text-emerald-600">check_circle</span>
                  <span>Supervision à distance intégrée</span>
                </li>
              </ul>
            </div>
            <button
              onClick={() => {
                setIndustrySector('stations-solaires');
                scrollToDevis();
              }}
              className="mt-6 w-full py-2.5 rounded-full bg-surface-container hover:bg-surface-container-high text-on-surface font-label-sm text-label-sm font-bold transition-colors cursor-pointer"
            >
              Demander cotation Énergie
            </button>
          </div>
        </div>
      </section>

      {/* =================================================================== */}
      {/* 3. 6 FILIÈRES MAÎTRESSES POUR LES GRANDS COMPTES */}
      {/* =================================================================== */}
      <section className="space-y-8">
        <div>
          <span className="font-label-sm text-label-sm text-primary font-bold uppercase tracking-wider block">
            Étendue Industrielle
          </span>
          <h2 className="font-headline-xl text-headline-xl text-on-surface font-extrabold mt-1">
            6 Filières Maîtresses pour les Grands Comptes
          </h2>
          <p className="font-body-md text-body-md text-on-surface-variant mt-1 max-w-2xl">
            Du conteneur complet FCL 40HQ jusqu'à la chaîne de production industrielle automatisée sur mesure.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-surface-container-lowest p-6 rounded-3xl border border-slate-100 shadow-sm space-y-3">
            <span className="material-symbols-outlined text-primary-container text-[28px]">inventory_2</span>
            <h3 className="font-headline-sm text-headline-sm text-on-surface font-bold">
              Grossistes & Importateurs (FCL 40HQ)
            </h3>
            <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">
              Consolidation de conteneurs complets de marchandises générales, bazar, quincaillerie et électroménager au meilleur tarif maritime direct.
            </p>
          </div>

          <div className="bg-surface-container-lowest p-6 rounded-3xl border border-slate-100 shadow-sm space-y-3">
            <span className="material-symbols-outlined text-secondary-container text-[28px]">branding_watermark</span>
            <h3 className="font-headline-sm text-headline-sm text-on-surface font-bold">
              Boutiques & Distribution (OEM / Marque Blanche)
            </h3>
            <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">
              Sérigraphie, packaging sur mesure, logos embossés et conditionnement commercial prêt à la vente dans vos réseaux de boutiques.
            </p>
          </div>

          <div className="bg-surface-container-lowest p-6 rounded-3xl border border-slate-100 shadow-sm space-y-3">
            <span className="material-symbols-outlined text-primary text-[28px]">apartment</span>
            <h3 className="font-headline-sm text-headline-sm text-on-surface font-bold">
              Hôtellerie & CHR (Mobilier & Équipements Pro)
            </h3>
            <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">
              Mobilier haut de gamme pour hôtels et restaurants, literie hôtelière 5 étoiles, vaisselle pro et cuisines inox industrielles.
            </p>
          </div>

          <div className="bg-surface-container-lowest p-6 rounded-3xl border border-slate-100 shadow-sm space-y-3">
            <span className="material-symbols-outlined text-secondary-container text-[28px]">foundation</span>
            <h3 className="font-headline-sm text-headline-sm text-on-surface font-bold">
              Énergie Solaire & BTP (Tier-1 Bloomberg)
            </h3>
            <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">
              Carrelage grand format, menuiserie aluminium, panneaux solaires bifaciaux 550W+, onduleurs industriels et outillage lourd de chantier.
            </p>
          </div>

          <div className="bg-surface-container-lowest p-6 rounded-3xl border border-slate-100 shadow-sm space-y-3">
            <span className="material-symbols-outlined text-primary-container text-[28px]">precision_manufacturing</span>
            <h3 className="font-headline-sm text-headline-sm text-on-surface font-bold">
              Agro & Packaging (Lignes Automatisées)
            </h3>
            <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">
              Lignes de remplissage, ensacheuses automatiques, presses à huile, étiqueteuses et machines de scellage sous vide certifiées CE.
            </p>
          </div>

          <div className="bg-surface-container-lowest p-6 rounded-3xl border border-slate-100 shadow-sm space-y-3">
            <span className="material-symbols-outlined text-on-surface text-[28px]">tv</span>
            <h3 className="font-headline-sm text-headline-sm text-on-surface font-bold">
              Événementiel & Digital (High-End LED)
            </h3>
            <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">
              Murs d'images LED indoor/outdoor P2.5 à P3.9, régies vidéo pro, totems tactiles et systèmes audio de forte puissance.
            </p>
          </div>
        </div>
      </section>

      {/* =================================================================== */}
      {/* 4. WORKFLOW / PROTOCOLE B2B EN 6 JALONS */}
      {/* =================================================================== */}
      <section className="bg-surface-container-low rounded-3xl p-6 sm:p-12 border border-slate-100 space-y-8">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <span className="font-label-sm text-label-sm text-primary font-bold uppercase tracking-wider">
            Rigueur & Processus Audité
          </span>
          <h2 className="font-headline-xl text-headline-xl text-on-surface font-extrabold">
            Le Protocole B2B Dallou Chine en 6 Jalons
          </h2>
          <p className="font-body-md text-body-md text-on-surface-variant">
            Un cheminement sécurisé de la validation du cahier des charges jusqu'à l'entrée en vos entrepôts à Dakar.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-surface-container-lowest p-6 rounded-2xl border border-slate-100 relative">
            <span className="font-price-xl text-price-xl font-mono text-primary/30 font-bold absolute top-4 right-4">
              01
            </span>
            <h3 className="font-headline-sm text-headline-sm text-on-surface font-bold">
              Cahier des Charges & Volumes
            </h3>
            <p className="font-body-sm text-body-sm text-on-surface-variant mt-2">
              Étude approfondie de vos spécifications techniques, de vos exigences normatives et du plan de livraison annuel.
            </p>
          </div>

          <div className="bg-surface-container-lowest p-6 rounded-2xl border border-slate-100 relative">
            <span className="font-price-xl text-price-xl font-mono text-primary/30 font-bold absolute top-4 right-4">
              02
            </span>
            <h3 className="font-headline-sm text-headline-sm text-on-surface font-bold">
              Audit d'Usines en Chine
            </h3>
            <p className="font-body-sm text-body-sm text-on-surface-variant mt-2">
              Visite in situ de 2 à 3 fabricants qualifiés par nos inspecteurs Dallou basés à Guangzhou, Ningbo et Yiwu.
            </p>
          </div>

          <div className="bg-surface-container-lowest p-6 rounded-2xl border border-slate-100 relative">
            <span className="font-price-xl text-price-xl font-mono text-primary/30 font-bold absolute top-4 right-4">
              03
            </span>
            <h3 className="font-headline-sm text-headline-sm text-on-surface font-bold">
              Contrat B2B International
            </h3>
            <p className="font-body-sm text-body-sm text-on-surface-variant mt-2">
              Signature du contrat avec pénalités de retard usine, conditions FOB/CIF transparentes et acompte séquestre.
            </p>
          </div>

          <div className="bg-surface-container-lowest p-6 rounded-2xl border border-slate-100 relative">
            <span className="font-price-xl text-price-xl font-mono text-primary/30 font-bold absolute top-4 right-4">
              04
            </span>
            <h3 className="font-headline-sm text-headline-sm text-on-surface font-bold">
              Production & Contrôle Vidéo HD
            </h3>
            <p className="font-body-sm text-body-sm text-on-surface-variant mt-2">
              Suivi de chaîne, tests d'endurance, pesée, cubage certifié et rapport de pré-embarquement avant solde usine.
            </p>
          </div>

          <div className="bg-surface-container-lowest p-6 rounded-2xl border border-slate-100 relative">
            <span className="font-price-xl text-price-xl font-mono text-primary/30 font-bold absolute top-4 right-4">
              05
            </span>
            <h3 className="font-headline-sm text-headline-sm text-on-surface font-bold">
              Transit Maritime & Dédouanement
            </h3>
            <p className="font-body-sm text-body-sm text-on-surface-variant mt-2">
              Expédition maritime directe via Maersk, CMA-CGM ou MSC. Formalités en douane GAINDE gérées par notre équipe.
            </p>
          </div>

          <div className="bg-surface-container-lowest p-6 rounded-2xl border border-slate-100 relative">
            <span className="font-price-xl text-price-xl font-mono text-primary/30 font-bold absolute top-4 right-4">
              06
            </span>
            <h3 className="font-headline-sm text-headline-sm text-on-surface font-bold">
              Livraison Directe sur Site
            </h3>
            <p className="font-body-sm text-body-sm text-on-surface-variant mt-2">
              Acheminement par camion plateau vers vos entrepôts, usines ou concessions à Dakar, Thiès ou dans la sous-région.
            </p>
          </div>
        </div>
      </section>

      {/* =================================================================== */}
      {/* 5. GARANTIES INSTITUTIONNELLES POUR GRANDS COMPTES */}
      {/* =================================================================== */}
      <section className="space-y-8">
        <div>
          <span className="font-label-sm text-label-sm text-primary font-bold uppercase tracking-wider block">
            Cadre de Confiance
          </span>
          <h2 className="font-headline-xl text-headline-xl text-on-surface font-extrabold mt-1">
            Garanties Institutionnelles pour Grands Comptes
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-surface-container-lowest p-6 rounded-3xl border border-slate-100 shadow-sm space-y-3">
            <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
              <span className="material-symbols-outlined text-[20px]">currency_exchange</span>
            </div>
            <h3 className="font-headline-sm text-headline-sm text-on-surface font-bold">
              Paiement Multi-Devises
            </h3>
            <p className="font-body-sm text-body-sm text-on-surface-variant">
              Règlement en FCFA local (Virement BOA / UBA / Wave Business), EUR, USD ou directement en Yuan RMB sans commission cachée.
            </p>
          </div>

          <div className="bg-surface-container-lowest p-6 rounded-3xl border border-slate-100 shadow-sm space-y-3">
            <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
              <span className="material-symbols-outlined text-[20px]">receipt</span>
            </div>
            <h3 className="font-headline-sm text-headline-sm text-on-surface font-bold">
              Facturation OHADA Complète
            </h3>
            <p className="font-body-sm text-body-sm text-on-surface-variant">
              Facture normalisée avec TVA récupérable, code NINEA sénégalais et déclarations en douane conformes aux normes UEMOA.
            </p>
          </div>

          <div className="bg-surface-container-lowest p-6 rounded-3xl border border-slate-100 shadow-sm space-y-3">
            <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
              <span className="material-symbols-outlined text-[20px]">shield</span>
            </div>
            <h3 className="font-headline-sm text-headline-sm text-on-surface font-bold">
              Assurance Maritime CIF 100%
            </h3>
            <p className="font-body-sm text-body-sm text-on-surface-variant">
              Toutes les expéditions FCL et LCL bénéficient d'une police d'assurance tous risques couvrant avarie commune, casse et perte totale.
            </p>
          </div>

          <div className="bg-surface-container-lowest p-6 rounded-3xl border border-slate-100 shadow-sm space-y-3">
            <div className="w-10 h-10 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
              <span className="material-symbols-outlined text-[20px]">support_agent</span>
            </div>
            <h3 className="font-headline-sm text-headline-sm text-on-surface font-bold">
              Desk B2B Dakar Dédié 6j/7
            </h3>
            <p className="font-body-sm text-body-sm text-on-surface-variant">
              Un chargé d'affaires senior affecté à votre compte, joignable directement aux Almadies, sur WhatsApp et par téléphone direct.
            </p>
          </div>
        </div>
      </section>

      {/* =================================================================== */}
      {/* 6. FORMULAIRE INTERACTIF DE DEVIS B2B GRANDS COMPTES */}
      {/* =================================================================== */}
      <section
        id="devis-b2b"
        className="bg-surface-container-lowest rounded-3xl p-6 sm:p-12 border border-slate-100 shadow-xl shadow-on-surface/5 space-y-8"
      >
        <div className="max-w-3xl space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-fixed/20 text-primary font-label-sm text-label-sm font-bold uppercase">
            <span>Cotation Grands Comptes</span>
          </div>
          <h2 className="font-headline-xl text-headline-xl text-on-surface font-extrabold">
            Transmettez Votre Appel d'Offres ou Cahier des Charges
          </h2>
          <p className="font-body-md text-body-md text-on-surface-variant">
            Remplissez ce formulaire pour recevoir un chiffrage FOB/CIF personnalisé sous 24 à 48 heures ouvrées.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="font-label-sm text-label-sm text-on-surface font-semibold">
                Raison Sociale de l'Entreprise *
              </label>
              <input
                type="text"
                required
                value={companyName}
                onChange={e => setCompanyName(e.target.value)}
                placeholder="ex: Sahel Logistique SARL / NINEA..."
                className="w-full h-12 px-4 bg-surface-container-low rounded-xl font-body-md text-body-md text-on-surface outline-none focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary-container/30 transition-all border border-transparent focus:border-primary-container"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-label-sm text-label-sm text-on-surface font-semibold">
                Nom & Titre du Responsable *
              </label>
              <input
                type="text"
                required
                value={contactName}
                onChange={e => setContactName(e.target.value)}
                placeholder="ex: Mamadou Ndiaye (Directeur des Achats)"
                className="w-full h-12 px-4 bg-surface-container-low rounded-xl font-body-md text-body-md text-on-surface outline-none focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary-container/30 transition-all border border-transparent focus:border-primary-container"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-label-sm text-label-sm text-on-surface font-semibold">
                Ligne Téléphonique / WhatsApp Corporate *
              </label>
              <div className="flex items-center gap-2">
                <div className="h-12 px-3 bg-surface-container-low rounded-xl flex items-center gap-1.5 shrink-0 border border-slate-100">
                  <span>🇸🇳</span>
                  <span className="font-label-md text-label-md font-bold text-on-surface">+221</span>
                </div>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="33 800 00 00 / 77..."
                  className="w-full h-12 px-4 bg-surface-container-low rounded-xl font-body-md text-body-md text-on-surface outline-none focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary-container/30 transition-all border border-transparent focus:border-primary-container"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="font-label-sm text-label-sm text-on-surface font-semibold">
                Email Corporate *
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="achats@votre-entreprise.sn"
                className="w-full h-12 px-4 bg-surface-container-low rounded-xl font-body-md text-body-md text-on-surface outline-none focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary-container/30 transition-all border border-transparent focus:border-primary-container"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-label-sm text-label-sm text-on-surface font-semibold">
                Secteur d'Activité & Filière *
              </label>
              <select
                value={industrySector}
                onChange={e => setIndustrySector(e.target.value)}
                className="w-full h-12 px-4 bg-surface-container-low rounded-xl font-body-md text-body-md text-on-surface outline-none focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary-container/30 transition-all border border-transparent focus:border-primary-container"
              >
                <option value="auto-ev">Mobilité Électrique, Auto, Motos & Flottes</option>
                <option value="grossiste-fcl">Importation Gros Volume (FCL 40HQ)</option>
                <option value="energie-solaire">Solaire, Batteries Industrielles & Énergie</option>
                <option value="btp-materiaux">BTP, Outillage Lourd & Matériaux de Construction</option>
                <option value="agro-packaging">Agro-industrie, Lignes Automatisées & Packaging</option>
                <option value="chr-hotellerie">Hôtellerie, Restauration & Collectivités</option>
                <option value="autre">Autre Projet Industriel Spécial</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="font-label-sm text-label-sm text-on-surface font-semibold">
                Volume Prévisionnel *
              </label>
              <select
                value={expectedVolume}
                onChange={e => setExpectedVolume(e.target.value)}
                className="w-full h-12 px-4 bg-surface-container-low rounded-xl font-body-md text-body-md text-on-surface outline-none focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary-container/30 transition-all border border-transparent focus:border-primary-container"
              >
                <option value="40hq">1 Conteneur 40HQ Complet</option>
                <option value="multi-40hq">Plusieurs Conteneurs 40HQ (Multi-FCL)</option>
                <option value="20gp">1 Conteneur 20GP</option>
                <option value="lcl-gros">Groupage Maritime LCL Gros Volume (&gt; 15 CBM)</option>
                <option value="aerien-cargo">Cargo Aérien Lourd (&gt; 500 kg)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="font-label-sm text-label-sm text-on-surface font-semibold">
                Désignation du Produit ou Équipement *
              </label>
              <input
                type="text"
                value={productName}
                onChange={e => setProductName(e.target.value)}
                placeholder="ex: Groupes électrogènes industriels 100kVA, Motos électriques..."
                className="w-full h-12 px-4 bg-surface-container-low rounded-xl font-body-md text-body-md text-on-surface outline-none focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary-container/30 transition-all border border-transparent focus:border-primary-container"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-label-sm text-label-sm text-on-surface font-semibold">
                Lien Produit / Référence Fournisseur (Optionnel)
              </label>
              <input
                type="url"
                value={productLink}
                onChange={e => setProductLink(e.target.value)}
                placeholder="https://alibaba.com/product/... ou lien 1688"
                className="w-full h-12 px-4 bg-surface-container-low rounded-xl font-body-md text-body-md text-on-surface outline-none focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary-container/30 transition-all border border-transparent focus:border-primary-container"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-label-sm text-label-sm text-on-surface font-semibold">
                Quantité Prévisionnelle (Unités) *
              </label>
              <input
                type="number"
                min="1"
                required
                value={quantity}
                onChange={e => setQuantity(Number(e.target.value))}
                className="w-full h-12 px-4 bg-surface-container-low rounded-xl font-body-md text-body-md text-on-surface outline-none focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary-container/30 transition-all border border-transparent focus:border-primary-container"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-label-sm text-label-sm text-on-surface font-semibold">
                Budget Cible Indicatif (FCFA)
              </label>
              <input
                type="number"
                min="0"
                value={budgetXof}
                onChange={e => setBudgetXof(Number(e.target.value))}
                placeholder="ex: 20000000"
                className="w-full h-12 px-4 bg-surface-container-low rounded-xl font-body-md text-body-md text-on-surface outline-none focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary-container/30 transition-all border border-transparent focus:border-primary-container"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-label-sm text-label-sm text-on-surface font-semibold">
                Délai Souhaité / Date Limite
              </label>
              <input
                type="date"
                value={desiredDeadline}
                onChange={e => setDesiredDeadline(e.target.value)}
                className="w-full h-12 px-4 bg-surface-container-low rounded-xl font-body-md text-body-md text-on-surface outline-none focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary-container/30 transition-all border border-transparent focus:border-primary-container"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-label-sm text-label-sm text-on-surface font-semibold">
                Destination de Livraison
              </label>
              <input
                type="text"
                value={destination}
                onChange={e => setDestination(e.target.value)}
                placeholder="ex: Port de Dakar / Entrepôt Diamniadio"
                className="w-full h-12 px-4 bg-surface-container-low rounded-xl font-body-md text-body-md text-on-surface outline-none focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary-container/30 transition-all border border-transparent focus:border-primary-container"
              />
            </div>

            <div className="md:col-span-2 space-y-1.5">
              <label className="font-label-sm text-label-sm text-on-surface font-semibold">
                Spécifications Techniques ou Description des Besoins
              </label>
              <textarea
                rows={4}
                value={specifications}
                onChange={e => setSpecifications(e.target.value)}
                placeholder="Détaillez les références requises, les normes industrielles, les quantités souhaitées, les personnalisations de marque (OEM) ou les délais contractuels..."
                className="w-full p-4 bg-surface-container-low rounded-xl font-body-md text-body-md text-on-surface outline-none focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary-container/30 transition-all border border-transparent focus:border-primary-container resize-none"
              />
            </div>

            <div className="md:col-span-2 space-y-2">
              <label className="font-label-sm text-label-sm text-on-surface font-semibold">
                Pièces Jointes & Cahier des Charges (PDF, DOCX, Images, max 10 Mo)
              </label>
              <div className="flex items-center gap-3">
                <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface font-label-md text-label-md font-semibold transition-all">
                  <span className="material-symbols-outlined text-[18px]">upload_file</span>
                  <span>{isUploading ? 'Téléversement en cours...' : 'Ajouter des fichiers'}</span>
                  <input
                    type="file"
                    multiple
                    disabled={isUploading}
                    onChange={handleFileUpload}
                    className="hidden"
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg,.webp"
                  />
                </label>
                {attachments.length > 0 && (
                  <span className="text-xs text-emerald-600 font-semibold">
                    {attachments.length} document(s) joint(s)
                  </span>
                )}
              </div>

              {attachments.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-2">
                  {attachments.map((att, idx) => (
                    <div key={idx} className="inline-flex items-center gap-2 px-3 py-1 bg-surface-container-low rounded-lg text-xs border border-slate-200">
                      <span className="material-symbols-outlined text-[14px] text-primary">description</span>
                      <span className="truncate max-w-[180px]">{att.name}</span>
                      <button
                        type="button"
                        onClick={() => setAttachments(prev => prev.filter((_, i) => i !== idx))}
                        className="text-slate-400 hover:text-rose-500"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-2 pt-2">
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="sample-needed"
                checked={sampleNeeded}
                onChange={e => setSampleNeeded(e.target.checked)}
                className="accent-primary-container rounded w-4 h-4 cursor-pointer"
              />
              <label htmlFor="sample-needed" className="font-body-sm text-body-sm text-on-surface cursor-pointer">
                Nous souhaitons recevoir un échantillon pré-série ou organiser une validation vidéo en usine avant signature définitive.
              </label>
            </div>

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="customization"
                checked={customization}
                onChange={e => setCustomization(e.target.checked)}
                className="accent-primary-container rounded w-4 h-4 cursor-pointer"
              />
              <label htmlFor="customization" className="font-body-sm text-body-sm text-on-surface cursor-pointer">
                Personnalisation industrielle requise (Logo entreprise, marquage sérigraphie OEM).
              </label>
            </div>

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="packaging-requested"
                checked={packagingRequested}
                onChange={e => setPackagingRequested(e.target.checked)}
                className="accent-primary-container rounded w-4 h-4 cursor-pointer"
              />
              <label htmlFor="packaging-requested" className="font-body-sm text-body-sm text-on-surface cursor-pointer">
                Conditionnement et emballage sur-mesure aux couleurs de notre marque.
              </label>
            </div>
          </div>

          {errorMessage && (
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">error</span>
              <span>{errorMessage}</span>
            </div>
          )}

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4">
            <button
              type="submit"
              disabled={isSubmitting || isUploading}
              className={`w-full sm:w-auto h-14 px-8 rounded-full bg-primary-container text-on-primary font-label-lg text-label-lg font-bold flex items-center justify-center gap-2 shadow-lg shadow-primary-container/30 hover:bg-secondary-container transition-all cursor-pointer ${
                isSubmitting ? 'opacity-70 cursor-wait' : ''
              }`}
            >
              <span>{isSubmitting ? 'Traitement en cours...' : 'Transmettre ma Demande B2B'}</span>
              <span className="material-symbols-outlined text-[20px]">{isSubmitting ? 'hourglass_empty' : 'send'}</span>
            </button>

            <div className="text-on-surface-variant font-body-sm text-body-sm flex items-center gap-2">
              <span className="material-symbols-outlined text-emerald-600 text-[18px]">lock</span>
              <span>Ligne directe Desk Entreprise : +221 33 800 00 00 • b2b@dallouchine.sn</span>
            </div>
          </div>
        </form>
      </section>

      {/* =================================================================== */}
      {/* 7. BOTTOM REASSURANCE BANNER */}
      {/* =================================================================== */}
      <section className="bg-gradient-to-r from-primary-fixed/30 to-secondary-fixed/30 rounded-3xl p-8 sm:p-10 border border-primary/20 flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="space-y-2 text-center sm:text-left">
          <h3 className="font-headline-lg text-headline-lg text-on-surface font-extrabold">
            Un doute sur une usine en Chine ou un devis existant ?
          </h3>
          <p className="font-body-md text-body-md text-on-surface-variant max-w-xl">
            Nos inspecteurs basés à Guangzhou vérifient gratuitement la solvabilité légale, la licence export et l'adresse physique de votre fournisseur.
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => navigate('/demande-devis')}
            className="h-12 px-6 rounded-full bg-primary-container text-on-primary font-label-md text-label-md font-bold hover:bg-secondary-container transition-all cursor-pointer"
          >
            Contre-expertise gratuite
          </button>
          <a
            href="https://wa.me/221338000000"
            target="_blank"
            rel="noopener noreferrer"
            className="h-12 px-5 rounded-full bg-surface-container-lowest text-on-surface font-label-md text-label-md font-bold border border-slate-200 hover:bg-surface-container transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px] text-emerald-600">chat</span>
            <span>WhatsApp dédié</span>
          </a>
        </div>
      </section>
    </div>
  );
};

export default B2BPage;
