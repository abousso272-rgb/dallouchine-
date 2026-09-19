import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';

export const QuoteRequestPage: React.FC = () => {
  const { navigate, submitB2BRequest } = useApp();

  // Buyer Mode Switcher
  const [buyerMode, setBuyerMode] = useState<'b2c' | 'b2b'>('b2c');

  // Form Fields
  const [clientName, setClientName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [deliveryCity, setDeliveryCity] = useState('dakar-port');

  const [productName, setProductName] = useState('');
  const [productCategory, setProductCategory] = useState('auto');
  const [productQty, setProductQty] = useState('');
  const [indicativeBudget, setIndicativeBudget] = useState('');
  const [referenceLink, setReferenceLink] = useState('');
  const [customNotes, setCustomNotes] = useState('');

  // Logistics & Services
  const [freightType, setFreightType] = useState<'maritime' | 'aerien'>('maritime');
  const [optAudit, setOptAudit] = useState(true);
  const [optCustoms, setOptCustoms] = useState(true);
  const [optLastMile, setOptLastMile] = useState(false);

  // Files
  const [files, setFiles] = useState<File[]>([]);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submissionCode, setSubmissionCode] = useState('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFiles(Array.from(e.target.files));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const newReq = submitB2BRequest({
      companyName: buyerMode === 'b2b' ? (companyName || 'Entreprise B2B') : 'Particulier / Auto-entrepreneur',
      contactName: clientName,
      phone: whatsappNumber,
      email: clientEmail,
      productType: productName,
      quantity: parseInt(productQty, 10) || 1,
      targetBudgetXOF: parseInt(indicativeBudget, 10) || 0,
      transportPreference: freightType === 'maritime' ? 'sea' : 'air',
      specifications: `${productCategory ? `[Catégorie: ${productCategory}] ` : ''}${customNotes} ${referenceLink ? `\n[Lien source: ${referenceLink}]` : ''} \n[Livraison: ${deliveryCity}] \n[Options: ${optAudit ? 'Audit SGS, ' : ''}${optCustoms ? 'Dédouanement Dakar, ' : ''}${optLastMile ? 'Dernier km' : ''}]`
    });

    setSubmissionCode(newReq.code || 'DLC-2026-DEV45');
    setIsSubmitted(true);
  };

  return (
    <div className="flex flex-col w-full">
      {/* Success Modal */}
      {isSubmitted && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-inverse-surface/40 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-surface-container-lowest rounded-3xl p-6 sm:p-10 max-w-lg w-full shadow-2xl border border-slate-100 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
              <span className="material-symbols-outlined text-[36px]">check_circle</span>
            </div>
            <h3 className="font-headline-lg text-headline-lg text-on-surface font-bold">
              Demande de devis enregistrée !
            </h3>
            <p className="font-body-md text-body-md text-on-surface-variant">
              Votre dossier a été transmis à nos équipes de négociation à Guangzhou et à notre desk Almadies Dakar. Une première proposition commerciale chiffrée vous parviendra sous 24h à 36h.
            </p>
            <div className="bg-surface-container-low p-3.5 rounded-2xl flex items-center justify-between">
              <span className="font-label-md text-label-md text-on-surface-variant">N° Dossier :</span>
              <span className="font-headline-sm text-headline-sm text-primary font-mono font-bold">
                {submissionCode}
              </span>
            </div>
            <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
              <button
                onClick={() => {
                  setIsSubmitted(false);
                  navigate('/tracking');
                }}
                className="flex-1 h-12 rounded-full bg-primary-container text-on-primary font-label-lg text-label-lg font-bold hover:bg-secondary-container transition-all cursor-pointer"
                type="button"
              >
                Suivre mon dossier
              </button>
              <button
                onClick={() => {
                  setIsSubmitted(false);
                  navigate('/');
                }}
                className="flex-1 h-12 rounded-full bg-surface-container hover:bg-surface-container-high text-on-surface font-label-lg text-label-lg font-semibold transition-all cursor-pointer"
                type="button"
              >
                Retour à l'accueil
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="w-full max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Breadcrumb & Page Orientation */}
        <div className="flex flex-col gap-2 mb-8">
          <nav className="flex items-center gap-2 font-label-md text-label-md text-on-surface-variant flex-wrap">
            <button
              onClick={() => navigate('/')}
              className="hover:text-primary transition-colors flex items-center gap-1 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">home</span>
              <span>Accueil</span>
            </button>
            <span className="material-symbols-outlined text-[14px]">chevron_right</span>
            <button
              onClick={() => navigate('/sourcing')}
              className="hover:text-primary transition-colors cursor-pointer"
            >
              Sourcing
            </button>
            <span className="material-symbols-outlined text-[14px]">chevron_right</span>
            <span className="text-on-surface font-semibold">Demande de devis</span>
          </nav>

          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pt-2">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-surface-container mb-3">
                <span className="w-2 h-2 rounded-full bg-secondary-container animate-pulse" />
                <span className="font-label-sm text-label-sm text-on-surface font-bold tracking-wider uppercase">
                  Audit Usine & Fret Tout-En-Un
                </span>
              </div>
              <h1 className="font-headline-xl text-headline-xl text-on-surface tracking-tight font-extrabold">
                Demander une cotation personnalisée
              </h1>
              <p className="font-body-lg text-body-lg text-on-surface-variant mt-2 leading-relaxed">
                Recevez sous 24 à 48 heures une proposition commerciale claire et transparente incluant le prix usine négocié, le fret maritime ou aérien et l'estimation des formalités au Port de Dakar.
              </p>
            </div>

            {/* Fast Track Micro-Badge */}
            <div className="flex items-center gap-3 bg-surface-container-lowest/90 backdrop-blur-md p-3.5 rounded-2xl shadow-sm border border-slate-100 self-start lg:self-end">
              <div className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center text-primary-container shrink-0">
                <span className="material-symbols-outlined text-[20px]">timer</span>
              </div>
              <div className="flex flex-col">
                <span className="font-label-sm text-label-sm uppercase font-bold text-on-surface-variant">
                  Délai moyen garanti
                </span>
                <span className="font-label-lg text-label-lg font-bold text-on-surface">
                  36h chrono rendu chiffré
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Two-Column Asymmetrical Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* LEFT COLUMN: Primary Quotation Intake Form */}
          <div className="lg:col-span-8 flex flex-col gap-6">
            <form
              onSubmit={handleSubmit}
              className="bg-surface-container-lowest/90 backdrop-blur-2xl rounded-3xl p-6 sm:p-10 shadow-xl shadow-on-surface/5 border border-slate-100 flex flex-col gap-8"
              id="quote-request-form"
            >
              {/* Segmented Top Mode Switcher */}
              <div className="flex flex-col gap-2">
                <label className="font-label-sm text-label-sm uppercase tracking-wider font-bold text-on-surface-variant">
                  Profil d'acheteur
                </label>
                <div className="grid grid-cols-2 p-1 bg-surface-container rounded-full max-w-md">
                  <button
                    onClick={() => setBuyerMode('b2c')}
                    className={`py-2 px-4 rounded-full font-label-md text-label-md font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                      buyerMode === 'b2c'
                        ? 'bg-surface-container-lowest text-on-surface shadow-sm'
                        : 'text-on-surface-variant hover:text-on-surface'
                    }`}
                    type="button"
                  >
                    <span className="material-symbols-outlined text-[16px]">person</span>
                    <span>Particulier / Entrepreneur</span>
                  </button>
                  <button
                    onClick={() => setBuyerMode('b2b')}
                    className={`py-2 px-4 rounded-full font-label-md text-label-md font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                      buyerMode === 'b2b'
                        ? 'bg-surface-container-lowest text-on-surface shadow-sm'
                        : 'text-on-surface-variant hover:text-on-surface'
                    }`}
                    type="button"
                  >
                    <span className="material-symbols-outlined text-[16px]">domain</span>
                    <span>Entreprise / Grossiste B2B</span>
                  </button>
                </div>
              </div>

              {/* Section 1: Informations de contact */}
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-2 pb-1 border-b border-surface-container">
                  <span className="w-6 h-6 rounded-full bg-primary-container/15 text-primary-container font-label-sm text-label-sm font-bold flex items-center justify-center">
                    1
                  </span>
                  <h2 className="font-headline-sm text-headline-sm text-on-surface font-bold">
                    Vos coordonnées de liaison
                  </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="font-label-sm text-label-sm text-on-surface font-semibold" htmlFor="client-name">
                      Nom & Prénom *
                    </label>
                    <div className="relative flex items-center">
                      <span className="material-symbols-outlined absolute left-3.5 text-on-surface-variant text-[18px]">
                        account_circle
                      </span>
                      <input
                        className="w-full h-12 pl-11 pr-4 bg-surface-container-low rounded-xl font-body-md text-body-md text-on-surface outline-none focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary-container/30 transition-all placeholder:text-on-surface-variant/60 border border-transparent focus:border-primary-container"
                        id="client-name"
                        placeholder="ex: Cheikh Tidiane Diop"
                        required
                        value={clientName}
                        onChange={e => setClientName(e.target.value)}
                        type="text"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="font-label-sm text-label-sm text-on-surface font-semibold" htmlFor="company-name">
                      <span>{buyerMode === 'b2b' ? "Nom de l'entreprise / NINEA *" : "Nom de l'entreprise"}</span>{' '}
                      {buyerMode === 'b2c' && (
                        <span className="text-on-surface-variant font-normal">(Optionnel)</span>
                      )}
                    </label>
                    <div className="relative flex items-center">
                      <span className="material-symbols-outlined absolute left-3.5 text-on-surface-variant text-[18px]">
                        business
                      </span>
                      <input
                        className="w-full h-12 pl-11 pr-4 bg-surface-container-low rounded-xl font-body-md text-body-md text-on-surface outline-none focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary-container/30 transition-all placeholder:text-on-surface-variant/60 border border-transparent focus:border-primary-container"
                        id="company-name"
                        placeholder={buyerMode === 'b2b' ? "ex: Baobab Logistique SARL / NINEA 009281" : "ex: Baobab Commerce"}
                        required={buyerMode === 'b2b'}
                        value={companyName}
                        onChange={e => setCompanyName(e.target.value)}
                        type="text"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="font-label-sm text-label-sm text-on-surface font-semibold" htmlFor="whatsapp-number">
                      Téléphone WhatsApp prioritaire *
                    </label>
                    <div className="flex items-center gap-2">
                      <div className="h-12 px-3 bg-surface-container-low rounded-xl flex items-center gap-1.5 shrink-0 border border-slate-100">
                        <span className="text-[16px]">🇸🇳</span>
                        <span className="font-label-md text-label-md font-bold text-on-surface">+221</span>
                      </div>
                      <div className="relative flex items-center w-full">
                        <span className="material-symbols-outlined absolute left-3.5 text-on-surface-variant text-[18px]">
                          call
                        </span>
                        <input
                          className="w-full h-12 pl-11 pr-4 bg-surface-container-low rounded-xl font-body-md text-body-md text-on-surface outline-none focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary-container/30 transition-all placeholder:text-on-surface-variant/60 border border-transparent focus:border-primary-container"
                          id="whatsapp-number"
                          placeholder="77 000 00 00"
                          required
                          value={whatsappNumber}
                          onChange={e => setWhatsappNumber(e.target.value)}
                          type="tel"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="font-label-sm text-label-sm text-on-surface font-semibold" htmlFor="client-email">
                      Adresse email professionnelle *
                    </label>
                    <div className="relative flex items-center">
                      <span className="material-symbols-outlined absolute left-3.5 text-on-surface-variant text-[18px]">
                        mail
                      </span>
                      <input
                        className="w-full h-12 pl-11 pr-4 bg-surface-container-low rounded-xl font-body-md text-body-md text-on-surface outline-none focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary-container/30 transition-all placeholder:text-on-surface-variant/60 border border-transparent focus:border-primary-container"
                        id="client-email"
                        placeholder="contact@votre-activite.sn"
                        required
                        value={clientEmail}
                        onChange={e => setClientEmail(e.target.value)}
                        type="email"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5 md:col-span-2">
                    <label className="font-label-sm text-label-sm text-on-surface font-semibold" htmlFor="delivery-city">
                      Ville de livraison / Débarquement au Sénégal *
                    </label>
                    <div className="relative flex items-center">
                      <span className="material-symbols-outlined absolute left-3.5 text-on-surface-variant text-[18px]">
                        location_on
                      </span>
                      <select
                        className="w-full h-12 pl-11 pr-10 bg-surface-container-low rounded-xl font-body-md text-body-md text-on-surface outline-none focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary-container/30 transition-all appearance-none cursor-pointer border border-transparent focus:border-primary-container"
                        id="delivery-city"
                        value={deliveryCity}
                        onChange={e => setDeliveryCity(e.target.value)}
                      >
                        <option value="dakar-port">Dakar (Enlèvement direct Port Autonome / Hub Dallou Almadies)</option>
                        <option value="dakar-domicile">Dakar intra-muros (Livraison entrepôt / magasin)</option>
                        <option value="thies">Thiès (Plateforme régionale)</option>
                        <option value="mbour">Mbour & Petite-Côte</option>
                        <option value="saint-louis">Saint-Louis</option>
                        <option value="autre">Autre région / Transit Mali / Guinée</option>
                      </select>
                      <span className="material-symbols-outlined absolute right-3.5 text-on-surface-variant pointer-events-none">
                        expand_more
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 2: Votre besoin produit */}
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-2 pb-1 border-b border-surface-container">
                  <span className="w-6 h-6 rounded-full bg-primary-container/15 text-primary-container font-label-sm text-label-sm font-bold flex items-center justify-center">
                    2
                  </span>
                  <h2 className="font-headline-sm text-headline-sm text-on-surface font-bold">
                    Cahier des charges du produit
                  </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5 md:col-span-2">
                    <label className="font-label-sm text-label-sm text-on-surface font-semibold" htmlFor="product-name">
                      Intitulé du produit, machine ou équipement *
                    </label>
                    <input
                      className="w-full h-12 px-4 bg-surface-container-low rounded-xl font-body-md text-body-md text-on-surface outline-none focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary-container/30 transition-all placeholder:text-on-surface-variant/60 border border-transparent focus:border-primary-container"
                      id="product-name"
                      placeholder="ex: 3 Tricycles utilitaires électriques 1500W avec cabine fermée"
                      required
                      value={productName}
                      onChange={e => setProductName(e.target.value)}
                      type="text"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="font-label-sm text-label-sm text-on-surface font-semibold" htmlFor="product-category">
                      Pôle industriel d'origine *
                    </label>
                    <div className="relative flex items-center">
                      <select
                        className="w-full h-12 px-4 pr-10 bg-surface-container-low rounded-xl font-body-md text-body-md text-on-surface outline-none focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary-container/30 transition-all appearance-none cursor-pointer border border-transparent focus:border-primary-container"
                        id="product-category"
                        value={productCategory}
                        onChange={e => setProductCategory(e.target.value)}
                      >
                        <option value="auto">Auto & Mobilité Électrique (SUV, Motos, Tricycles)</option>
                        <option value="solaire">Énergie, Batteries LFP & Panneaux Solaires</option>
                        <option value="machines">Machines de conditionnement & Lignes de production</option>
                        <option value="btp">Matériaux BTP, Carrelage & Outillage lourd</option>
                        <option value="tech">High-Tech, Informatique & Téléphonie de gros</option>
                        <option value="textile">Textile, Chaussures & Articles ménagers</option>
                        <option value="autre">Autre commande spéciale / Sourcing usine sur-mesure</option>
                      </select>
                      <span className="material-symbols-outlined absolute right-3.5 text-on-surface-variant pointer-events-none">
                        expand_more
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="font-label-sm text-label-sm text-on-surface font-semibold" htmlFor="product-qty">
                      Quantité envisagée *
                    </label>
                    <input
                      className="w-full h-12 px-4 bg-surface-container-low rounded-xl font-body-md text-body-md text-on-surface outline-none focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary-container/30 transition-all placeholder:text-on-surface-variant/60 border border-transparent focus:border-primary-container"
                      id="product-qty"
                      placeholder="ex: 50 pièces ou 1 conteneur 20 pieds"
                      required
                      value={productQty}
                      onChange={e => setProductQty(e.target.value)}
                      type="text"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="font-label-sm text-label-sm text-on-surface font-semibold" htmlFor="indicative-budget">
                      Budget d'achat estimé (FCFA)
                    </label>
                    <div className="relative flex items-center">
                      <input
                        className="w-full h-12 px-4 pr-16 bg-surface-container-low rounded-xl font-body-md text-body-md text-on-surface outline-none focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary-container/30 transition-all placeholder:text-on-surface-variant/60 border border-transparent focus:border-primary-container"
                        id="indicative-budget"
                        placeholder="ex: 8 500 000"
                        value={indicativeBudget}
                        onChange={e => setIndicativeBudget(e.target.value)}
                        type="number"
                      />
                      <span className="absolute right-4 font-label-md text-label-md font-bold text-on-surface-variant">
                        FCFA
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="font-label-sm text-label-sm text-on-surface font-semibold" htmlFor="reference-link">
                      Lien web vers produit similaire
                    </label>
                    <div className="relative flex items-center">
                      <span className="material-symbols-outlined absolute left-3.5 text-on-surface-variant text-[18px]">
                        link
                      </span>
                      <input
                        className="w-full h-12 pl-11 pr-4 bg-surface-container-low rounded-xl font-body-md text-body-md text-on-surface outline-none focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary-container/30 transition-all placeholder:text-on-surface-variant/60 border border-transparent focus:border-primary-container"
                        id="reference-link"
                        placeholder="https://1688.com/... ou alibaba.com/..."
                        value={referenceLink}
                        onChange={e => setReferenceLink(e.target.value)}
                        type="url"
                      />
                    </div>
                  </div>

                  {/* Drag and drop spec sheet */}
                  <div className="md:col-span-2 flex flex-col gap-1.5">
                    <label className="font-label-sm text-label-sm text-on-surface font-semibold">
                      Spécifications techniques, plans ou photos d'exemples
                    </label>
                    <label className="w-full p-6 rounded-2xl bg-surface-container-low flex flex-col items-center justify-center text-center cursor-pointer transition-all hover:bg-surface-container border border-dashed border-slate-300 group">
                      <div className="w-12 h-12 rounded-full bg-surface-container-lowest flex items-center justify-center text-secondary-container shadow-sm mb-2 group-hover:scale-110 transition-transform">
                        <span className="material-symbols-outlined text-[24px]">cloud_upload</span>
                      </div>
                      <p className="font-label-md text-label-md text-on-surface font-bold">
                        Glissez vos documents ici ou <span className="text-secondary-container underline">parcourez vos fichiers</span>
                      </p>
                      <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">
                        PDF, JPG, PNG, Excel, formats techniques acceptés (Max. 25 Mo)
                      </p>
                      <input
                        className="hidden"
                        id="file-input"
                        multiple
                        onChange={handleFileChange}
                        type="file"
                      />
                      {files.length > 0 && (
                        <div className="mt-3 px-4 py-1 bg-surface-container-lowest rounded-full font-label-sm text-label-sm text-emerald-700 font-bold flex items-center gap-1 shadow-sm">
                          <span className="material-symbols-outlined text-[14px]">check_circle</span>
                          <span>{files.length} fichier(s) prêt(s) à l'envoi</span>
                        </div>
                      )}
                    </label>
                  </div>
                </div>
              </div>

              {/* Section 3: Modalités logistiques & Services */}
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-2 pb-1 border-b border-surface-container">
                  <span className="w-6 h-6 rounded-full bg-primary-container/15 text-primary-container font-label-sm text-label-sm font-bold flex items-center justify-center">
                    3
                  </span>
                  <h2 className="font-headline-sm text-headline-sm text-on-surface font-bold">
                    Fret transcontinental & Services douaniers
                  </h2>
                </div>

                {/* Fret toggle pills */}
                <div className="flex flex-col gap-2">
                  <label className="font-label-sm text-label-sm text-on-surface font-semibold">
                    Mode de transit recommandé *
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <label
                      onClick={() => setFreightType('maritime')}
                      className={`relative flex items-start gap-3 p-4 rounded-2xl cursor-pointer transition-all border ${
                        freightType === 'maritime'
                          ? 'bg-primary-fixed/20 border-primary/30 ring-1 ring-primary/20'
                          : 'bg-surface-container-low border-transparent hover:bg-surface-container'
                      }`}
                    >
                      <input
                        checked={freightType === 'maritime'}
                        onChange={() => setFreightType('maritime')}
                        className="mt-1 accent-primary-container"
                        name="freight_type"
                        type="radio"
                        value="maritime"
                      />
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-secondary-container text-[18px]">
                            directions_boat
                          </span>
                          <span className="font-label-lg text-label-lg font-bold text-on-surface">
                            Maritime LCL / FCL
                          </span>
                        </div>
                        <span className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">
                          30 à 40 jours de transit Ningbo/Guangzhou → Port Autonome de Dakar. Ratio coût/volume imbattable.
                        </span>
                      </div>
                    </label>

                    <label
                      onClick={() => setFreightType('aerien')}
                      className={`relative flex items-start gap-3 p-4 rounded-2xl cursor-pointer transition-all border ${
                        freightType === 'aerien'
                          ? 'bg-primary-fixed/20 border-primary/30 ring-1 ring-primary/20'
                          : 'bg-surface-container-low border-transparent hover:bg-surface-container'
                      }`}
                    >
                      <input
                        checked={freightType === 'aerien'}
                        onChange={() => setFreightType('aerien')}
                        className="mt-1 accent-primary-container"
                        name="freight_type"
                        type="radio"
                        value="aerien"
                      />
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-secondary-container text-[18px]">
                            flight
                          </span>
                          <span className="font-label-lg text-label-lg font-bold text-on-surface">
                            Aérien Cargo Express
                          </span>
                        </div>
                        <span className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">
                          7 à 10 jours ouvrés de hub à hub direct vers AIBD Diass. Recommandé pour prototypes et high-tech urgent.
                        </span>
                      </div>
                    </label>
                  </div>
                </div>

                {/* Services Checklist */}
                <div className="flex flex-col gap-2">
                  <label className="font-label-sm text-label-sm text-on-surface font-semibold">
                    Options de sécurisation incluses sur devis
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <label className="flex items-start gap-2.5 p-3 rounded-xl bg-surface-container-low cursor-pointer transition-colors hover:bg-surface-container">
                      <input
                        checked={optAudit}
                        onChange={e => setOptAudit(e.target.checked)}
                        className="mt-1 accent-primary-container rounded"
                        type="checkbox"
                      />
                      <div className="flex flex-col">
                        <span className="font-label-md text-label-md font-bold text-on-surface">
                          Audit & SGS Usine
                        </span>
                        <span className="font-body-sm text-body-sm text-on-surface-variant">
                          Contrôle physique avant départ usine
                        </span>
                      </div>
                    </label>

                    <label className="flex items-start gap-2.5 p-3 rounded-xl bg-surface-container-low cursor-pointer transition-colors hover:bg-surface-container">
                      <input
                        checked={optCustoms}
                        onChange={e => setOptCustoms(e.target.checked)}
                        className="mt-1 accent-primary-container rounded"
                        type="checkbox"
                      />
                      <div className="flex flex-col">
                        <span className="font-label-md text-label-md font-bold text-on-surface">
                          Dédouanement Dakar
                        </span>
                        <span className="font-body-sm text-body-sm text-on-surface-variant">
                          Prise en charge douane intégrale & taxes
                        </span>
                      </div>
                    </label>

                    <label className="flex items-start gap-2.5 p-3 rounded-xl bg-surface-container-low cursor-pointer transition-colors hover:bg-surface-container">
                      <input
                        checked={optLastMile}
                        onChange={e => setOptLastMile(e.target.checked)}
                        className="mt-1 accent-primary-container rounded"
                        type="checkbox"
                      />
                      <div className="flex flex-col">
                        <span className="font-label-md text-label-md font-bold text-on-surface">
                          Livraison Dernier Km
                        </span>
                        <span className="font-body-sm text-body-sm text-on-surface-variant">
                          Dépôt camion sécurisé dans vos locaux
                        </span>
                      </div>
                    </label>
                  </div>
                </div>

                {/* Freeform Notes */}
                <div className="flex flex-col gap-1.5">
                  <label className="font-label-sm text-label-sm text-on-surface font-semibold" htmlFor="custom-notes">
                    Notes, personnalisation de marque (OEM) & contraintes particulières
                  </label>
                  <textarea
                    className="w-full p-4 bg-surface-container-low rounded-xl font-body-md text-body-md text-on-surface outline-none focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary-container/30 transition-all placeholder:text-on-surface-variant/60 resize-none border border-transparent focus:border-primary-container"
                    id="custom-notes"
                    placeholder="Précisez ici vos labels personnalisés, exigences de tension 220V/50Hz, packaging spécifique ou délais impératifs..."
                    rows={3}
                    value={customNotes}
                    onChange={e => setCustomNotes(e.target.value)}
                  />
                </div>
              </div>

              {/* Submit Action & Reassurance */}
              <div className="flex flex-col gap-3 pt-2">
                <button
                  className="w-full h-14 rounded-full bg-primary-container text-on-primary font-label-lg text-label-lg font-bold flex items-center justify-center gap-2 shadow-lg shadow-primary-container/30 hover:bg-secondary-container transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
                  type="submit"
                >
                  <span>Soumettre ma demande de devis gratuit</span>
                  <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
                </button>
                <div className="flex items-center justify-center gap-2 text-center text-on-surface-variant">
                  <span className="material-symbols-outlined text-[16px] text-secondary-container">verified_user</span>
                  <p className="font-body-sm text-body-sm">
                    En soumettant cette demande, vous acceptez d'être recontacté sous 24h par un conseiller commercial Dallou Chine. Zéro frais d'engagement préliminaire.
                  </p>
                </div>
              </div>
            </form>
          </div>

          {/* RIGHT COLUMN: Trust & Transparency Sidebar (Floating Glass Cards) */}
          <div className="lg:col-span-4 flex flex-col gap-5">
            {/* Card 1: Ce qui est inclus dans chaque devis */}
            <div className="bg-surface-container-lowest/80 backdrop-blur-xl rounded-3xl p-6 sm:p-7 shadow-sm border border-slate-100 flex flex-col gap-4">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-full bg-primary-container/15 flex items-center justify-center text-primary-container shrink-0">
                  <span className="material-symbols-outlined text-[20px]">verified</span>
                </div>
                <h3 className="font-headline-sm text-headline-sm text-on-surface font-bold">
                  Inclus dans votre cotation
                </h3>
              </div>
              <div className="flex flex-col gap-3 font-body-sm text-body-sm">
                <div className="flex items-start gap-2.5">
                  <span className="material-symbols-outlined text-secondary-container text-[18px] mt-0.5 shrink-0">
                    policy
                  </span>
                  <div>
                    <strong className="text-on-surface font-semibold block">Audit juridique usine</strong>
                    <p className="text-on-surface-variant">
                      Vérification de la licence commerciale chinoise et statut d'exportateur réel.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <span className="material-symbols-outlined text-secondary-container text-[18px] mt-0.5 shrink-0">
                    price_check
                  </span>
                  <div>
                    <strong className="text-on-surface font-semibold block">Prix d'usine direct sans surcoût</strong>
                    <p className="text-on-surface-variant">
                      Négociation aux tarifs grossistes intérieurs chinois (tarifs 1688 / Canton Fair).
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <span className="material-symbols-outlined text-secondary-container text-[18px] mt-0.5 shrink-0">
                    receipt_long
                  </span>
                  <div>
                    <strong className="text-on-surface font-semibold block">Décomposition 100% transparente</strong>
                    <p className="text-on-surface-variant">
                      Lignes séparées : Achat FOB + Fret maritime/aérien + Douane sénégalaise estimée.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <span className="material-symbols-outlined text-secondary-container text-[18px] mt-0.5 shrink-0">
                    support_agent
                  </span>
                  <div>
                    <strong className="text-on-surface font-semibold block">Interlocuteur dédié Dakar</strong>
                    <p className="text-on-surface-variant">
                      Accompagnement constant en Wolof et Français pour fluidifier vos transactions.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Card 2: Engagement de rapidité */}
            <div className="bg-surface-container rounded-3xl p-6 sm:p-7 shadow-sm border border-slate-100 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="font-label-sm text-label-sm uppercase font-bold text-secondary-container tracking-wider">
                  Norme de service 2026
                </span>
                <span className="material-symbols-outlined text-secondary-container text-[20px]">bolt</span>
              </div>
              <h3 className="font-headline-sm text-headline-sm text-on-surface font-bold">
                Engagement réactivité garanti
              </h3>
              <div className="flex flex-col gap-2 mt-1">
                <div className="flex items-center gap-3 bg-surface-container-lowest/90 px-4 py-3 rounded-2xl shadow-sm">
                  <span className="material-symbols-outlined text-primary-container text-[20px]">mark_email_read</span>
                  <div className="flex flex-col">
                    <span className="font-label-sm text-label-sm text-on-surface-variant">Première confirmation</span>
                    <span className="font-label-md text-label-md font-bold text-on-surface">
                      Accusé de réception sous 2h ouvrées
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-3 bg-surface-container-lowest/90 px-4 py-3 rounded-2xl shadow-sm">
                  <span className="material-symbols-outlined text-secondary text-[20px]">calculate</span>
                  <div className="flex flex-col">
                    <span className="font-label-sm text-label-sm text-on-surface-variant">Chiffrage final audité</span>
                    <span className="font-label-md text-label-md font-bold text-on-surface">
                      Devis sous 24h à 48h max
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Card 3: Direct Desk WhatsApp Desk Dakar */}
            <div className="bg-surface-container-lowest/90 backdrop-blur-xl rounded-3xl p-6 sm:p-7 shadow-sm border border-slate-100 flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <div className="relative w-12 h-12 rounded-full overflow-hidden shrink-0 shadow-sm bg-surface-container">
                  <img
                    className="w-full h-full object-cover"
                    alt="Conseiller sourcing Dallou Chine à Dakar"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuA16LK5m3WIpfNrg_J5MJ7OU9UZqNp5zU7bT4VfhQ8iCZXc7I3xCNMPb3R7UJKRiARoL6tIkYPdvAwDK0vMfV_08cwe5XN-UpRfelnnSQ9AEaUIjf9Qd_hw4dE1G7MXKMCuiCUXZSY7vm1tUJSMyiQe5eihWWr05dNmfXZdeqHVLqCmWkqGvsSOeV6QVtUHvC5KpgcQjfPNo4x61LKhMTiZp61cklX8mW7o0Kp9Lljpvy3KrD7XXAhyLQ"
                  />
                  <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-500 rounded-full ring-2 ring-surface-container-lowest" />
                </div>
                <div className="flex flex-col">
                  <span className="font-label-sm text-label-sm text-on-surface-variant">
                    Besoin d'une réponse immédiate ?
                  </span>
                  <h3 className="font-headline-sm text-headline-sm text-on-surface font-bold">
                    Desk Direct Sourcing Dakar
                  </h3>
                </div>
              </div>
              <p className="font-body-sm text-body-sm text-on-surface-variant">
                Échangez sans délai avec notre équipe bilingue basée aux Almadies. Nous validons vos références de commande sur WhatsApp.
              </p>
              <a
                className="h-12 px-4 rounded-full bg-[#25D366]/10 hover:bg-[#25D366]/20 text-[#128C7E] font-label-md text-label-md font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer"
                href="https://wa.me/221770000000"
                rel="noopener noreferrer"
                target="_blank"
              >
                <span className="material-symbols-outlined text-[20px]">chat</span>
                <span>Ouvrir WhatsApp direct (+221 77 000 00 00)</span>
              </a>
            </div>

            {/* Card 4: Paiement sécurisé & Séquestre */}
            <div className="bg-surface-container-lowest/80 backdrop-blur-xl rounded-3xl p-6 sm:p-7 shadow-sm border border-slate-100 flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary-container text-[20px]">lock</span>
                <h3 className="font-label-lg text-label-lg font-bold text-on-surface">
                  Sécurité des fonds & Cautionnement
                </h3>
              </div>
              <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">
                100% de vos acomptes sont protégés sur un compte séquestre certifié jusqu'à l'inspection positive du lot en usine avant conteneurisation.
              </p>
              <div className="pt-1 flex flex-col gap-1.5">
                <span className="font-label-sm text-label-sm text-on-surface-variant uppercase font-bold">
                  Moyens de paiement acceptés :
                </span>
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="px-3 py-1 rounded-full bg-surface-container font-label-sm text-label-sm font-bold text-on-surface">
                    Wave Sénégal
                  </span>
                  <span className="px-3 py-1 rounded-full bg-surface-container font-label-sm text-label-sm font-bold text-on-surface">
                    Orange Money
                  </span>
                  <span className="px-3 py-1 rounded-full bg-surface-container font-label-sm text-label-sm font-bold text-on-surface">
                    Virement Swift (UBA / BOA)
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuoteRequestPage;
