import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { sourcingClient } from '../../services/sourcingService';

export const SourcingRequestPage: React.FC = () => {
  const { navigate } = useApp();

  // Selected Category Pill State
  const [activeCategory, setActiveCategory] = useState<string>('auto');

  // Form Fields
  const [productDesignation, setProductDesignation] = useState('');
  const [productCategory, setProductCategory] = useState('auto');
  const [sourceUrl, setSourceUrl] = useState('');
  const [quantity, setQuantity] = useState('');
  const [targetBudget, setTargetBudget] = useState('');
  const [technicalDetails, setTechnicalDetails] = useState('');

  // OEM & Options
  const [optBranding, setOptBranding] = useState(false);
  const [optSample, setOptSample] = useState(false);
  const [optInspection, setOptInspection] = useState(true);
  const [optCustoms, setOptCustoms] = useState(true);

  // Contact Info
  const [contactName, setContactName] = useState('');
  const [phone, setPhone] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [deliveryCity, setDeliveryCity] = useState('dakar');

  // Files & State
  const [files, setFiles] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Success Modal
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [trackingCode, setTrackingCode] = useState('DLC-2026-SRC89');

  const categories = [
    { id: 'auto', label: 'Auto & Mobilité ⚡' },
    { id: 'moto', label: 'Véhicule & Moto Électrique' },
    { id: 'machines', label: 'Machines & Équipements Pro' },
    { id: 'solaire', label: 'Panneaux & Solaire' },
    { id: 'tech', label: 'Électronique & High-Tech' },
    { id: 'textile', label: 'Textile & Confection' },
    { id: 'packaging', label: 'Emballage & Packaging' },
    { id: 'autre', label: 'Autre besoin' }
  ];

  const handleCategoryPillClick = (catId: string) => {
    setActiveCategory(catId);
    setProductCategory(catId);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFiles(Array.from(e.target.files));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // Au moins un identifiant produit : nom, description, lien, ou fichier
    if (!productDesignation && !technicalDetails && !sourceUrl && files.length === 0) {
      setErrorMessage('Veuillez fournir au moins une description, un lien ou une photo du produit recherché.');
      return;
    }

    if (!contactName || !whatsapp) {
      setErrorMessage('Veuillez renseigner votre nom et votre numéro WhatsApp.');
      return;
    }

    setIsSubmitting(true);
    try {
      // 1. Upload des fichiers
      const uploadedAttachments: Array<{ name: string; url: string; size?: number; mimeType?: string }> = [];
      let firstImageUrl = '';

      for (const file of files) {
        try {
          const reader = new FileReader();
          const base64Promise = new Promise<string>((resolve, reject) => {
            reader.onload = () => {
              const res = reader.result as string;
              resolve(res.split(',')[1] || '');
            };
            reader.onerror = reject;
          });
          reader.readAsDataURL(file);
          const base64Data = await base64Promise;
          const isImg = file.type.startsWith('image/');
          const uploadRes = await sourcingClient.uploadFile({
            fileName: file.name,
            fileType: file.type || (isImg ? 'image/jpeg' : 'application/pdf'),
            fileSize: file.size,
            fileBase64: base64Data,
            bucket: isImg ? 'sourcing-images' : 'sourcing-attachments'
          });

          if (uploadRes.success) {
            if (isImg && !firstImageUrl) {
              firstImageUrl = uploadRes.url;
            }
            uploadedAttachments.push({
              name: file.name,
              url: uploadRes.url,
              size: file.size,
              mimeType: file.type
            });
          }
        } catch (uploadErr) {
          console.warn('[SourcingForm] Erreur upload fichier individuel:', uploadErr);
        }
      }

      // 2. Détermination du titre du produit
      let title = productDesignation.trim();
      if (!title) {
        if (sourceUrl) {
          try {
            const parsed = new URL(sourceUrl.trim());
            title = `Produit sourcé via ${parsed.hostname}`;
          } catch {
            title = 'Recherche produit sur-mesure';
          }
        } else if (technicalDetails) {
          title = technicalDetails.slice(0, 40) + '...';
        } else {
          title = `Recherche ${categories.find(c => c.id === productCategory)?.label || 'Produit Chine'}`;
        }
      }

      // 3. Appel API réel
      const res = await sourcingClient.createRequest({
        title,
        description: technicalDetails || 'Demande de sourcing sur-mesure',
        productUrl: sourceUrl.trim() || undefined,
        imageUrl: firstImageUrl || undefined,
        additionalImages: uploadedAttachments.filter(a => a.mimeType?.startsWith('image/')).map(a => a.url),
        attachments: uploadedAttachments,
        category: productCategory,
        quantity: parseInt(quantity, 10) || 1,
        budgetXof: parseInt(targetBudget, 10) || undefined,
        destination: deliveryCity === 'dakar' ? 'Dakar, Sénégal' : `${deliveryCity}, Sénégal`,
        customization: optBranding || optSample,
        customizationDetails: [
          optBranding ? 'Branding OEM' : '',
          optSample ? 'Échantillon requis' : '',
          optInspection ? 'Inspection usine' : '',
          optCustoms ? 'Dédouanement Gaindé' : ''
        ].filter(Boolean).join(', '),
        specifications: technicalDetails,
        clientName: contactName,
        clientPhone: whatsapp || phone,
        clientEmail: `${whatsapp.replace(/\D/g, '') || 'client'}@dallouchine.sn`
      });

      if (res.success && res.request?.code) {
        setTrackingCode(res.request.code);
        setIsSuccessModalOpen(true);
      } else {
        setErrorMessage(res.errorMessage || res.error || 'Erreur lors de la création de la demande.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Erreur lors de la transmission.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col w-full space-y-16 pb-16">
      {/* =================================================================== */}
      {/* SUCCESS MODAL */}
      {/* =================================================================== */}
      {isSuccessModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-inverse-surface/40 backdrop-blur-md">
          <div className="bg-surface-container-lowest rounded-3xl p-6 sm:p-10 max-w-lg w-full shadow-2xl border border-slate-100 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
              <span className="material-symbols-outlined text-[36px]">task_alt</span>
            </div>
            <h3 className="font-headline-lg text-headline-lg text-on-surface font-bold">
              Demande de Sourcing Enregistrée !
            </h3>
            <p className="font-body-md text-body-md text-on-surface-variant">
              Nos sourceurs bilingues à Guangzhou et Yiwu ont été notifiés. Vous recevrez les premières options de fabricants sous 24h sur WhatsApp.
            </p>
            <div className="bg-surface-container-low p-4 rounded-2xl flex items-center justify-between">
              <span className="font-label-md text-label-md text-on-surface-variant">Code Dossier :</span>
              <span className="font-headline-sm text-headline-sm text-primary font-mono font-bold">
                {trackingCode}
              </span>
            </div>
            <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
              <button
                onClick={() => {
                  setIsSuccessModalOpen(false);
                  navigate('/tracking');
                }}
                className="flex-1 h-12 rounded-full bg-primary-container text-on-primary font-label-lg text-label-lg font-bold hover:bg-secondary-container transition-all cursor-pointer"
                type="button"
              >
                Suivre mon sourcing
              </button>
              <button
                onClick={() => setIsSuccessModalOpen(false)}
                className="flex-1 h-12 rounded-full bg-surface-container hover:bg-surface-container-high text-on-surface font-label-lg text-label-lg font-semibold transition-all cursor-pointer"
                type="button"
              >
                Nouvelle recherche
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* 1. HERO SECTION & INTRO */}
      {/* =================================================================== */}
      <section className="relative rounded-3xl overflow-hidden bg-surface-container-lowest/80 backdrop-blur-2xl p-6 sm:p-12 lg:p-16 border border-slate-100 shadow-xl shadow-on-surface/5">
        <div className="absolute top-0 right-0 w-[450px] h-[450px] bg-primary-container/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        <div className="absolute bottom-0 left-0 w-[350px] h-[350px] bg-secondary-container/10 rounded-full blur-3xl pointer-events-none -ml-20 -mb-20" />

        <div className="relative z-10 max-w-4xl space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-surface-container border border-slate-200/80">
            <span className="w-2 h-2 rounded-full bg-secondary-container animate-pulse" />
            <span className="font-label-sm text-label-sm uppercase font-extrabold tracking-wider text-on-surface">
              Bureau Permanent Guangzhou & Yiwu
            </span>
          </div>

          <h1 className="font-display-lg text-display-lg text-on-surface tracking-tight font-extrabold leading-tight">
            Vous cherchez un produit en Chine ? <br />
            <span className="bg-gradient-to-r from-primary via-primary-container to-secondary-container bg-clip-text text-transparent">
              Nous le trouvons pour vous.
            </span>
          </h1>

          <p className="font-body-lg text-body-lg text-on-surface-variant max-w-2xl leading-relaxed">
            Envoyez-nous une photo, un lien Alibaba / 1688 / Taobao ou simplement une description technique. Nos équipes basées en Chine négocient en direct avec les fabricants au prix usine réel.
          </p>

          {/* Dynamic Trust Metrics Bar */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-6 border-t border-surface-container">
            <div className="flex flex-col">
              <span className="font-headline-lg text-headline-lg font-extrabold text-primary-container">
                &lt; 24h
              </span>
              <span className="font-label-sm text-label-sm text-on-surface-variant">
                Attribution Sourceur Dédié
              </span>
            </div>
            <div className="flex flex-col">
              <span className="font-headline-lg text-headline-lg font-extrabold text-on-surface">
                500+
              </span>
              <span className="font-label-sm text-label-sm text-on-surface-variant">
                Usines Partenaires Auditées
              </span>
            </div>
            <div className="flex flex-col">
              <span className="font-headline-lg text-headline-lg font-extrabold text-secondary-container">
                100%
              </span>
              <span className="font-label-sm text-label-sm text-on-surface-variant">
                Inspections Physiques
              </span>
            </div>
            <div className="flex flex-col">
              <span className="font-headline-lg text-headline-lg font-extrabold text-on-surface">
                Dakar DDP
              </span>
              <span className="font-label-sm text-label-sm text-on-surface-variant">
                Douane & Fret Maîtrisés
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* =================================================================== */}
      {/* 2. CATEGORY FILTER BAR */}
      {/* =================================================================== */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="font-label-sm text-label-sm text-on-surface-variant uppercase font-bold tracking-wider">
            Sélectionnez votre univers de sourcing :
          </span>
          <span className="font-label-sm text-label-sm text-primary font-semibold">
            Recherche multi-usines
          </span>
        </div>
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => handleCategoryPillClick(cat.id)}
              className={`px-4 py-2.5 rounded-full font-label-md text-label-md font-bold whitespace-nowrap transition-all cursor-pointer border ${
                activeCategory === cat.id
                  ? 'bg-primary-container text-on-primary border-primary-container shadow-md shadow-primary-container/20'
                  : 'bg-surface-container-lowest text-on-surface border-slate-200/80 hover:bg-surface-container'
              }`}
              type="button"
            >
              {cat.label}
            </button>
          ))}
        </div>
      </section>

      {/* =================================================================== */}
      {/* 3. TWO-COLUMN SOURCING INTAKE & HUB */}
      {/* =================================================================== */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Formulaire de Sourcing Personnalisé */}
        <div className="lg:col-span-8">
          <form
            onSubmit={handleSubmit}
            className="bg-surface-container-lowest/90 backdrop-blur-2xl rounded-3xl p-6 sm:p-10 shadow-xl shadow-on-surface/5 border border-slate-100 space-y-8"
          >
            <div className="border-b border-surface-container pb-4">
              <h2 className="font-headline-lg text-headline-lg text-on-surface font-extrabold">
                Fiche de Sourcing Fournisseur
              </h2>
              <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">
                Plus votre demande est détaillée, plus la négociation auprès des usines chinoises sera rapide et avantageuse.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2 space-y-1.5">
                <label className="font-label-sm text-label-sm text-on-surface font-semibold">
                  Intitulé précis du produit ou de la marchandise *
                </label>
                <input
                  type="text"
                  required
                  value={productDesignation}
                  onChange={e => setProductDesignation(e.target.value)}
                  placeholder="ex: Scooter électrique 1500W avec batterie amovible 60V 24Ah..."
                  className="w-full h-12 px-4 bg-surface-container-low rounded-xl font-body-md text-body-md text-on-surface outline-none focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary-container/30 transition-all border border-transparent focus:border-primary-container"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-label-sm text-label-sm text-on-surface font-semibold">
                  Catégorie Industrielle *
                </label>
                <select
                  value={productCategory}
                  onChange={e => {
                    setProductCategory(e.target.value);
                    setActiveCategory(e.target.value);
                  }}
                  className="w-full h-12 px-4 bg-surface-container-low rounded-xl font-body-md text-body-md text-on-surface outline-none focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary-container/30 transition-all border border-transparent focus:border-primary-container"
                >
                  <option value="auto">Auto & Mobilité ⚡</option>
                  <option value="moto">Véhicule & Moto Électrique</option>
                  <option value="machines">Machines & Équipements Pro</option>
                  <option value="solaire">Panneaux & Solaire</option>
                  <option value="tech">Électronique & High-Tech</option>
                  <option value="textile">Textile & Confection</option>
                  <option value="packaging">Emballage & Packaging</option>
                  <option value="autre">Autre besoin</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="font-label-sm text-label-sm text-on-surface font-semibold">
                  Lien produit ou boutique usine (Alibaba, 1688, Taobao...)
                </label>
                <input
                  type="url"
                  value={sourceUrl}
                  onChange={e => setSourceUrl(e.target.value)}
                  placeholder="https://1688.com/offer/... ou Alibaba"
                  className="w-full h-12 px-4 bg-surface-container-low rounded-xl font-body-md text-body-md text-on-surface outline-none focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary-container/30 transition-all border border-transparent focus:border-primary-container"
                />
              </div>

              {/* Dropzone Upload */}
              <div className="md:col-span-2 space-y-1.5">
                <label className="font-label-sm text-label-sm text-on-surface font-semibold">
                  Photos du produit, fiche technique ou croquis
                </label>
                <label className="w-full p-6 rounded-2xl bg-surface-container-low flex flex-col items-center justify-center text-center cursor-pointer hover:bg-surface-container transition-all border border-dashed border-slate-300 group">
                  <div className="w-12 h-12 rounded-full bg-surface-container-lowest flex items-center justify-center text-primary-container shadow-sm mb-2 group-hover:scale-110 transition-transform">
                    <span className="material-symbols-outlined text-[24px]">cloud_upload</span>
                  </div>
                  <p className="font-label-md text-label-md text-on-surface font-bold">
                    Glissez vos photos ici ou <span className="text-primary underline">parcourez vos fichiers</span>
                  </p>
                  <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">
                    PNG, JPG, PDF jusqu'à 25 Mo
                  </p>
                  <input
                    type="file"
                    multiple
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  {files.length > 0 && (
                    <div className="mt-3 px-4 py-1 bg-surface-container-lowest rounded-full font-label-sm text-label-sm text-emerald-700 font-bold flex items-center gap-1 shadow-sm">
                      <span className="material-symbols-outlined text-[14px]">check_circle</span>
                      <span>{files.length} document(s) sélectionné(s)</span>
                    </div>
                  )}
                </label>
              </div>

              <div className="space-y-1.5">
                <label className="font-label-sm text-label-sm text-on-surface font-semibold">
                  Quantité envisagée (MOQ) *
                </label>
                <input
                  type="text"
                  required
                  value={quantity}
                  onChange={e => setQuantity(e.target.value)}
                  placeholder="ex: 100 unités ou 1 conteneur 20 pieds"
                  className="w-full h-12 px-4 bg-surface-container-low rounded-xl font-body-md text-body-md text-on-surface outline-none focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary-container/30 transition-all border border-transparent focus:border-primary-container"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-label-sm text-label-sm text-on-surface font-semibold">
                  Budget indicatif total cible (FCFA ou USD)
                </label>
                <input
                  type="text"
                  value={targetBudget}
                  onChange={e => setTargetBudget(e.target.value)}
                  placeholder="ex: 6 500 000 FCFA"
                  className="w-full h-12 px-4 bg-surface-container-low rounded-xl font-body-md text-body-md text-on-surface outline-none focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary-container/30 transition-all border border-transparent focus:border-primary-container"
                />
              </div>

              <div className="md:col-span-2 space-y-1.5">
                <label className="font-label-sm text-label-sm text-on-surface font-semibold">
                  Spécifications techniques détaillées & exigences
                </label>
                <textarea
                  rows={3}
                  value={technicalDetails}
                  onChange={e => setTechnicalDetails(e.target.value)}
                  placeholder="Précisez les dimensions, matériaux, voltages (220V/50Hz), normes de sécurité ou certifications souhaitées..."
                  className="w-full p-4 bg-surface-container-low rounded-xl font-body-md text-body-md text-on-surface outline-none focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary-container/30 transition-all border border-transparent focus:border-primary-container resize-none"
                />
              </div>
            </div>

            {/* Options OEM & Sécurisation */}
            <div className="space-y-3 pt-2">
              <label className="font-label-sm text-label-sm text-on-surface font-bold uppercase tracking-wider block">
                Services additionnels & Options OEM :
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label className="flex items-start gap-2.5 p-3 rounded-xl bg-surface-container-low cursor-pointer hover:bg-surface-container transition-colors">
                  <input
                    type="checkbox"
                    checked={optBranding}
                    onChange={e => setOptBranding(e.target.checked)}
                    className="mt-1 accent-primary-container rounded"
                  />
                  <div>
                    <span className="font-label-md text-label-md font-bold text-on-surface block">
                      Marquage Logo & Packaging OEM
                    </span>
                    <span className="font-body-sm text-body-sm text-on-surface-variant">
                      Personnalisation à votre marque
                    </span>
                  </div>
                </label>

                <label className="flex items-start gap-2.5 p-3 rounded-xl bg-surface-container-low cursor-pointer hover:bg-surface-container transition-colors">
                  <input
                    type="checkbox"
                    checked={optSample}
                    onChange={e => setOptSample(e.target.checked)}
                    className="mt-1 accent-primary-container rounded"
                  />
                  <div>
                    <span className="font-label-md text-label-md font-bold text-on-surface block">
                      Échantillon Pré-Série Aérien
                    </span>
                    <span className="font-body-sm text-body-sm text-on-surface-variant">
                      Validation physique sous 10 jours
                    </span>
                  </div>
                </label>

                <label className="flex items-start gap-2.5 p-3 rounded-xl bg-surface-container-low cursor-pointer hover:bg-surface-container transition-colors">
                  <input
                    type="checkbox"
                    checked={optInspection}
                    onChange={e => setOptInspection(e.target.checked)}
                    className="mt-1 accent-primary-container rounded"
                  />
                  <div>
                    <span className="font-label-md text-label-md font-bold text-on-surface block">
                      Audit d'Usine & Contrôle Qualité
                    </span>
                    <span className="font-body-sm text-body-sm text-on-surface-variant">
                      Inspection physique avant expédition
                    </span>
                  </div>
                </label>

                <label className="flex items-start gap-2.5 p-3 rounded-xl bg-surface-container-low cursor-pointer hover:bg-surface-container transition-colors">
                  <input
                    type="checkbox"
                    checked={optCustoms}
                    onChange={e => setOptCustoms(e.target.checked)}
                    className="mt-1 accent-primary-container rounded"
                  />
                  <div>
                    <span className="font-label-md text-label-md font-bold text-on-surface block">
                      Dédouanement Dakar DDP
                    </span>
                    <span className="font-body-sm text-body-sm text-on-surface-variant">
                      Prise en charge intégrale de la douane
                    </span>
                  </div>
                </label>
              </div>
            </div>

            {/* Coordonnées de Liaison */}
            <div className="border-t border-surface-container pt-6 space-y-4">
              <h3 className="font-headline-sm text-headline-sm text-on-surface font-bold">
                Vos Coordonnées de Liaison
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="font-label-sm text-label-sm text-on-surface font-semibold">
                    Nom & Prénom / Raison Sociale *
                  </label>
                  <input
                    type="text"
                    required
                    value={contactName}
                    onChange={e => setContactName(e.target.value)}
                    placeholder="ex: Alioune Badara Fall"
                    className="w-full h-12 px-4 bg-surface-container-low rounded-xl font-body-md text-body-md text-on-surface outline-none focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary-container/30 transition-all border border-transparent focus:border-primary-container"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-label-sm text-label-sm text-on-surface font-semibold">
                    Numéro WhatsApp Prioritaire *
                  </label>
                  <div className="flex items-center gap-2">
                    <div className="h-12 px-3 bg-surface-container-low rounded-xl flex items-center gap-1.5 shrink-0 border border-slate-100">
                      <span>🇸🇳</span>
                      <span className="font-label-md text-label-md font-bold text-on-surface">+221</span>
                    </div>
                    <input
                      type="tel"
                      required
                      value={whatsapp}
                      onChange={e => setWhatsapp(e.target.value)}
                      placeholder="77 000 00 00"
                      className="w-full h-12 px-4 bg-surface-container-low rounded-xl font-body-md text-body-md text-on-surface outline-none focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary-container/30 transition-all border border-transparent focus:border-primary-container"
                    />
                  </div>
                </div>

                <div className="md:col-span-2 space-y-1.5">
                  <label className="font-label-sm text-label-sm text-on-surface font-semibold">
                    Ville de Livraison
                  </label>
                  <select
                    value={deliveryCity}
                    onChange={e => setDeliveryCity(e.target.value)}
                    className="w-full h-12 px-4 bg-surface-container-low rounded-xl font-body-md text-body-md text-on-surface outline-none focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary-container/30 transition-all border border-transparent focus:border-primary-container"
                  >
                    <option value="dakar">Dakar (Entrepôts Almadies ou Livraison Magasin)</option>
                    <option value="thies">Thiès</option>
                    <option value="mbour">Mbour & Petite-Côte</option>
                    <option value="saint-louis">Saint-Louis</option>
                    <option value="autre">Autre région / Transit Mali / Guinée</option>
                  </select>
                </div>
              </div>
            </div>

            {errorMessage && (
              <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
                <span className="material-symbols-outlined text-rose-500 text-base">error</span>
                <span>{errorMessage}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full h-14 rounded-full bg-primary-container text-on-primary font-label-lg text-label-lg font-bold flex items-center justify-center gap-2 shadow-lg shadow-primary-container/30 hover:bg-secondary-container hover:scale-[1.01] active:scale-[0.99] transition-all ${
                isSubmitting ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer'
              }`}
            >
              <span>{isSubmitting ? 'Transmission en cours...' : 'Lancer la recherche fournisseur sous 24h'}</span>
              <span className="material-symbols-outlined text-[20px]">
                {isSubmitting ? 'sync' : 'search'}
              </span>
            </button>
          </form>
        </div>

        {/* Right Column: Sourcing Support Hub & Reassurance Cards */}
        <div className="lg:col-span-4 space-y-6">
          {/* Direct WhatsApp Assistant */}
          <div className="bg-gradient-to-br from-emerald-600 to-teal-700 rounded-3xl p-6 sm:p-7 text-white shadow-lg space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center">
                <span className="material-symbols-outlined text-[26px]">chat</span>
              </div>
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-200">
                  Besoin d'un retour immédiat ?
                </span>
                <h3 className="font-headline-sm text-headline-sm font-bold">
                  Sourcing Direct WhatsApp
                </h3>
              </div>
            </div>
            <p className="text-xs sm:text-sm text-emerald-100 leading-relaxed">
              Envoyez directement votre lien Alibaba ou photo à nos sourceurs bilingues de permanence à Dakar et Guangzhou.
            </p>
            <a
              href="https://wa.me/221770000000"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full h-12 rounded-full bg-white text-emerald-800 font-label-md text-label-md font-bold flex items-center justify-center gap-2 shadow-md hover:bg-emerald-50 transition-colors"
            >
              <span>Échanger sur WhatsApp (+221 77 000 00 00)</span>
            </a>
          </div>

          {/* Visual Factory Inspection Proof Card */}
          <div className="bg-surface-container-lowest rounded-3xl overflow-hidden border border-slate-100 shadow-sm space-y-4">
            <div className="relative h-48 w-full overflow-hidden">
              <img
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuCKD772WJp-tZc387L38f8E1b_TzVd0QW6W3P3K27xVjC6fN4V56gH8jK-9LmP8nQ2RtU5vWyZx10ABcD"
                alt="Audit qualité usine Chine"
                className="w-full h-full object-cover"
                onError={(e) => {
                  // Fallback image if needed
                  (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=800&auto=format&fit=crop';
                }}
              />
              <div className="absolute top-3 left-3 px-3 py-1 rounded-full bg-inverse-surface/80 text-inverse-on-surface backdrop-blur-md font-label-sm text-label-sm font-bold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>Audit Guangzhou en direct</span>
              </div>
            </div>
            <div className="p-6 pt-0 space-y-3">
              <h4 className="font-headline-sm text-headline-sm text-on-surface font-bold">
                Inspections Physiques Réelles
              </h4>
              <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">
                Nos inspecteurs qualifiés vérifient chaque lot : conformité aux normes ISO 9001, test de fonctionnement avant départ, pesée et cubage certifiés.
              </p>
            </div>
          </div>

          {/* Physical Footprint Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-3">
            <div className="bg-surface-container p-4 rounded-2xl border border-slate-100 flex items-center gap-3">
              <span className="material-symbols-outlined text-primary-container text-[24px]">apartment</span>
              <div>
                <span className="font-label-sm text-label-sm text-on-surface font-bold block">
                  Guangzhou Hub (Chine)
                </span>
                <span className="font-body-sm text-body-sm text-on-surface-variant">
                  District Baiyun • Équipe trilingue
                </span>
              </div>
            </div>

            <div className="bg-surface-container p-4 rounded-2xl border border-slate-100 flex items-center gap-3">
              <span className="material-symbols-outlined text-secondary-container text-[24px]">location_on</span>
              <div>
                <span className="font-label-sm text-label-sm text-on-surface font-bold block">
                  Dakar Siège (Sénégal)
                </span>
                <span className="font-body-sm text-body-sm text-on-surface-variant">
                  Almadies • Route de Ngor
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =================================================================== */}
      {/* 4. SOURCING PROCESS HORIZONTAL TIMELINE */}
      {/* =================================================================== */}
      <section className="bg-surface-container-low rounded-3xl p-6 sm:p-12 border border-slate-100 space-y-8">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <span className="font-label-sm text-label-sm text-primary font-bold uppercase tracking-wider">
            Processus Étape par Étape
          </span>
          <h2 className="font-headline-xl text-headline-xl text-on-surface font-extrabold">
            Comment se Déroule Votre Sourcing ?
          </h2>
          <p className="font-body-md text-body-md text-on-surface-variant">
            De votre idée initiale jusqu'à la remise des clés en main à Dakar.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
          <div className="bg-surface-container-lowest p-5 rounded-2xl border border-slate-100 relative">
            <span className="font-price-xl text-price-xl font-mono text-primary/30 font-bold block mb-2">01</span>
            <h4 className="font-label-lg text-label-lg font-bold text-on-surface">Votre Demande</h4>
            <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">
              Fiche technique ou lien web transmis
            </p>
          </div>

          <div className="bg-surface-container-lowest p-5 rounded-2xl border border-slate-100 relative">
            <span className="font-price-xl text-price-xl font-mono text-primary/30 font-bold block mb-2">02</span>
            <h4 className="font-label-lg text-label-lg font-bold text-on-surface">Sourcing Usine</h4>
            <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">
              Audit de 3 fabricants chinois qualifiés
            </p>
          </div>

          <div className="bg-surface-container-lowest p-5 rounded-2xl border border-slate-100 relative">
            <span className="font-price-xl text-price-xl font-mono text-primary/30 font-bold block mb-2">03</span>
            <h4 className="font-label-lg text-label-lg font-bold text-on-surface">Négociation</h4>
            <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">
              Tarifs usine de gros & échantillons
            </p>
          </div>

          <div className="bg-surface-container-lowest p-5 rounded-2xl border border-slate-100 relative">
            <span className="font-price-xl text-price-xl font-mono text-primary/30 font-bold block mb-2">04</span>
            <h4 className="font-label-lg text-label-lg font-bold text-on-surface">Devis Tout Compris</h4>
            <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">
              Achat + Fret + Douane Dakar détaillée
            </p>
          </div>

          <div className="bg-surface-container-lowest p-5 rounded-2xl border border-slate-100 relative">
            <span className="font-price-xl text-price-xl font-mono text-primary/30 font-bold block mb-2">05</span>
            <h4 className="font-label-lg text-label-lg font-bold text-on-surface">Audit & Production</h4>
            <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">
              Contrôle physique avant départ
            </p>
          </div>

          <div className="bg-surface-container-lowest p-5 rounded-2xl border border-slate-100 relative">
            <span className="font-price-xl text-price-xl font-mono text-primary/30 font-bold block mb-2">06</span>
            <h4 className="font-label-lg text-label-lg font-bold text-on-surface">Réception Dakar</h4>
            <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">
              Livraison à vos entrepôts ou boutiques
            </p>
          </div>
        </div>
      </section>

      {/* =================================================================== */}
      {/* 5. VERIFIED SOURCING CASE STUDIES */}
      {/* =================================================================== */}
      <section className="space-y-6">
        <div>
          <span className="font-label-sm text-label-sm text-primary font-bold uppercase tracking-wider block">
            Historique & Réalisations
          </span>
          <h2 className="font-headline-xl text-headline-xl text-on-surface font-extrabold mt-1">
            Projets Sourcing Concrètement Réalisés
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-surface-container-lowest p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary-fixed/20 text-primary font-label-sm text-label-sm font-bold">
              <span>Mobilité & Flotte</span>
            </div>
            <h3 className="font-headline-sm text-headline-sm text-on-surface font-bold">
              Lot de 40 Motos Électriques Urbaines
            </h3>
            <div className="space-y-1.5 text-xs text-on-surface-variant font-medium">
              <div className="flex justify-between">
                <span>Client :</span>
                <span className="text-on-surface font-semibold">Opérateur Logistique Dakar</span>
              </div>
              <div className="flex justify-between">
                <span>Économie réalisée :</span>
                <span className="text-emerald-600 font-bold">-34% vs revendeur local</span>
              </div>
              <div className="flex justify-between">
                <span>Délai de livraison :</span>
                <span className="text-on-surface font-semibold">38 jours rendu Port de Dakar</span>
              </div>
            </div>
          </div>

          <div className="bg-surface-container-lowest p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-secondary-fixed/20 text-secondary-container font-label-sm text-label-sm font-bold">
              <span>Agro-Industrie</span>
            </div>
            <h3 className="font-headline-sm text-headline-sm text-on-surface font-bold">
              Unité Semi-Automatique d'Huilerie d'Arachide
            </h3>
            <div className="space-y-1.5 text-xs text-on-surface-variant font-medium">
              <div className="flex justify-between">
                <span>Client :</span>
                <span className="text-on-surface font-semibold">GIE Agro Thiès</span>
              </div>
              <div className="flex justify-between">
                <span>Économie réalisée :</span>
                <span className="text-emerald-600 font-bold">4 200 000 FCFA d'écart</span>
              </div>
              <div className="flex justify-between">
                <span>Délai de livraison :</span>
                <span className="text-on-surface font-semibold">45 jours clés en main</span>
              </div>
            </div>
          </div>

          <div className="bg-surface-container-lowest p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary-fixed/20 text-primary font-label-sm text-label-sm font-bold">
              <span>Énergie Solaire</span>
            </div>
            <h3 className="font-headline-sm text-headline-sm text-on-surface font-bold">
              Parc Solaire Autonome 120kW & Batteries LiFePO4
            </h3>
            <div className="space-y-1.5 text-xs text-on-surface-variant font-medium">
              <div className="flex justify-between">
                <span>Client :</span>
                <span className="text-on-surface font-semibold">Exploitation Agricole Niayes</span>
              </div>
              <div className="flex justify-between">
                <span>Certification :</span>
                <span className="text-emerald-600 font-bold">Tier-1 direct usine</span>
              </div>
              <div className="flex justify-between">
                <span>Délai de livraison :</span>
                <span className="text-on-surface font-semibold">32 jours maritime</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default SourcingRequestPage;
