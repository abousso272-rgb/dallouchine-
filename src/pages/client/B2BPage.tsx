import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { SectionHeader } from '../../components/common/SectionHeader';
import { LogisticsPriceSplit } from '../../components/common/LogisticsPriceSplit';
import {
  Building2,
  ShieldCheck,
  Plane,
  Ship,
  CheckCircle2,
  Phone,
  Mail,
  ArrowRight,
  Sparkles,
  Package,
  Layers,
  Award,
  Globe2,
  FileText,
  Eye,
  Sliders,
  Check,
  HelpCircle,
  ExternalLink
} from 'lucide-react';

export const B2BPage: React.FC = () => {
  const { submitB2BRequest, navigate, quotes, openDocumentModal, currentPath } = useApp();

  const [formData, setFormData] = useState({
    companyName: '',
    contactName: '',
    phone: '',
    email: '',
    productType: '',
    quantity: 100,
    targetBudgetXOF: 1500000,
    transportPreference: 'recommended' as 'air' | 'sea' | 'express' | 'recommended',
    specifications: '',
    customizationNeeded: false,
    customizationDetails: '',
    alibabaUrl: '',
    destinationCity: 'Dakar',
    paymentPreference: 'standard_split' // 30% acompte / 70% après contrôle avant embarquement
  });

  const [submittedCode, setSubmittedCode] = useState<string | null>(null);

  // Pre-populate if query params exist (e.g. ?product=...&moq=...)
  useEffect(() => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const productParam = urlParams.get('product');
      const moqParam = urlParams.get('moq');
      if (productParam) {
        setFormData(prev => ({
          ...prev,
          productType: decodeURIComponent(productParam),
          quantity: moqParam ? Number(moqParam) : 100
        }));
      }
    } catch {}
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.contactName || !formData.phone || !formData.productType) {
      alert('Veuillez remplir les champs obligatoires (Nom, Téléphone, Produit).');
      return;
    }

    const newReq = submitB2BRequest({
      companyName: formData.companyName || 'Particulier / Auto-entrepreneur',
      contactName: formData.contactName,
      phone: formData.phone,
      email: formData.email || 'contact@client.sn',
      productType: formData.productType,
      quantity: Number(formData.quantity) || 50,
      targetBudgetXOF: Number(formData.targetBudgetXOF) || 500000,
      transportPreference: formData.transportPreference,
      specifications: `${formData.specifications} ${
        formData.customizationNeeded ? `\n[Personnalisation requise: ${formData.customizationDetails}]` : ''
      } ${formData.alibabaUrl ? `\n[Lien source: ${formData.alibabaUrl}]` : ''} \n[Ville de destination: ${formData.destinationCity}]`,
      customizationNeeded: formData.customizationNeeded,
      customizationDetails: formData.customizationDetails,
      destinationCity: formData.destinationCity,
      sourceUrl: formData.alibabaUrl
    });

    setSubmittedCode(newReq.code);
  };

  return (
    <div className="space-y-16 pb-16">
      {/* Hero Section */}
      <section className="glass-panel-dark rounded-3xl p-8 sm:p-12 text-white border border-white/10 relative overflow-hidden space-y-6">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#2A6DFF]/20 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-3xl space-y-4 relative z-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/20 text-blue-200 border border-blue-400/30 text-xs font-bold uppercase tracking-wider">
            <Building2 className="w-4 h-4 text-[#2A6DFF]" />
            <span>Service Grossistes & Entreprises Sénégalaises</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
            Votre bureau d'achat en Chine,{' '}
            <span className="text-[#2A6DFF]">directement depuis Dakar.</span>
          </h1>

          <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-2xl">
            Importez des conteneurs complets ou des lots industriels auprès de fabricants chinois audités. Nous gérons la négociation, le contrôle qualité sur place, le fret et le dédouanement Gaindé DDP, avec une séparation claire entre prix d'achat usine et coût logistique.
          </p>
        </div>

        {/* 3 Pillars Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-white/10 relative z-10 text-xs sm:text-sm">
          <div className="bg-white/5 p-4 rounded-2xl border border-white/10 space-y-1">
            <strong className="text-white block font-bold">1. Sourcing Usines Vérifiées</strong>
            <span className="text-slate-400">Audits physiques à Guangzhou, Shenzhen, Yiwu et Ningbo.</span>
          </div>

          <div className="bg-white/5 p-4 rounded-2xl border border-white/10 space-y-1">
            <strong className="text-white block font-bold">2. Contrôle Qualité Pré-Embarquement</strong>
            <span className="text-slate-400">Rapport d'inspection photos/vidéos avant paiement du solde.</span>
          </div>

          <div className="bg-white/5 p-4 rounded-2xl border border-white/10 space-y-1">
            <strong className="text-white block font-bold">3. Acheminement Port de Dakar / AIBD</strong>
            <span className="text-slate-400">FCL / LCL maritime ou vol cargo avec dédouanement tout inclus.</span>
          </div>
        </div>
      </section>

      {/* Main Quote Request Form + Assistance */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Side: Interactive Quote Form (7 cols) */}
        <div className="lg:col-span-7 glass-panel bg-white/95 rounded-3xl p-6 sm:p-8 border border-white shadow-md space-y-6">
          {submittedCode ? (
            <div className="text-center py-10 space-y-4 animate-in zoom-in-95">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto text-2xl">
                ✓
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-black text-[#0D2C7A]">Demande B2B Enregistrée !</h3>
                <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto">
                  Votre référence dossier est <strong className="text-[#2A6DFF] font-mono-numeric">{submittedCode}</strong>. Nos équipes à Guangzhou et Dakar analysent votre cahier des charges et vous transmettront un devis détaillé avec séparation stricte prix/logistique sous 24 à 48h.
                </p>
              </div>

              <div className="pt-4 flex justify-center gap-3">
                <button
                  onClick={() => setSubmittedCode(null)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold px-5 py-2.5 rounded-xl"
                >
                  Faire une autre demande
                </button>
                <button
                  onClick={() => navigate('/')}
                  className="bg-[#0D2C7A] text-white text-xs font-bold px-6 py-2.5 rounded-xl shadow-xs"
                >
                  Retour à l'accueil
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-[#0D2C7A]">
                  Demande de Devis B2B / Gros & Personnalisation
                </h2>
                <p className="text-xs text-slate-500">
                  Remplissez ce formulaire pour recevoir une étude de faisabilité et un devis formel rendu Sénégal.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Entreprise / Raison sociale</label>
                  <input
                    type="text"
                    value={formData.companyName}
                    onChange={e => setFormData({ ...formData, companyName: e.target.value })}
                    placeholder="Ex: SenAgri Distribution SARL"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 outline-hidden focus:border-[#2A6DFF]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Nom du responsable *</label>
                  <input
                    type="text"
                    required
                    value={formData.contactName}
                    onChange={e => setFormData({ ...formData, contactName: e.target.value })}
                    placeholder="Ex: Cheikh Tidiane Diop"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 outline-hidden focus:border-[#2A6DFF]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Téléphone WhatsApp joignable *</label>
                  <input
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+221 77 000 00 00"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 outline-hidden focus:border-[#2A6DFF]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Email professionnel</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                    placeholder="direction@senagri.sn"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 outline-hidden focus:border-[#2A6DFF]"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Marchandise ou équipement recherché *</label>
                <input
                  type="text"
                  required
                  value={formData.productType}
                  onChange={e => setFormData({ ...formData, productType: e.target.value })}
                  placeholder="Ex: 200 Panneaux Solaires Monocristallins 550W Tier-1"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 outline-hidden focus:border-[#2A6DFF]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Quantité / Volume</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.quantity}
                    onChange={e => setFormData({ ...formData, quantity: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 outline-hidden focus:border-[#2A6DFF]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Budget cible (FCFA)</label>
                  <input
                    type="number"
                    step="50000"
                    value={formData.targetBudgetXOF}
                    onChange={e => setFormData({ ...formData, targetBudgetXOF: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 outline-hidden focus:border-[#2A6DFF]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Ville de livraison</label>
                  <select
                    value={formData.destinationCity}
                    onChange={e => setFormData({ ...formData, destinationCity: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 outline-hidden focus:border-[#2A6DFF]"
                  >
                    <option value="Dakar">Dakar (Hub principal)</option>
                    <option value="Thiès">Thiès</option>
                    <option value="Touba">Touba / Mbacké</option>
                    <option value="Kaolack">Kaolack</option>
                    <option value="Saint-Louis">Saint-Louis</option>
                    <option value="Ziguinchor">Ziguinchor</option>
                  </select>
                </div>
              </div>

              {/* Lien Alibaba / 1688 optionnel */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                  <span>Lien usine Alibaba / 1688 / Taobao / Made-in-China (optionnel)</span>
                  <span className="text-[10px] text-slate-400 font-normal">Si vous avez repéré le produit</span>
                </label>
                <input
                  type="url"
                  value={formData.alibabaUrl}
                  onChange={e => setFormData({ ...formData, alibabaUrl: e.target.value })}
                  placeholder="https://detail.1688.com/offer/... ou https://french.alibaba.com/..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 outline-hidden focus:border-[#2A6DFF]"
                />
              </div>

              {/* Checkbox Personnalisation / OEM */}
              <div className="p-3.5 rounded-xl bg-blue-50/60 border border-blue-200 space-y-2.5">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.customizationNeeded}
                    onChange={e => setFormData({ ...formData, customizationNeeded: e.target.checked })}
                    className="rounded border-blue-300 text-[#2A6DFF] focus:ring-[#2A6DFF]"
                  />
                  <span className="text-xs font-bold text-[#0D2C7A]">
                    Besoin d'une personnalisation OEM (Logo de marque, emballage personnalisé, notice en français)
                  </span>
                </label>

                {formData.customizationNeeded && (
                  <input
                    type="text"
                    value={formData.customizationDetails}
                    onChange={e => setFormData({ ...formData, customizationDetails: e.target.value })}
                    placeholder="Précisez la personnalisation (ex: Sérigraphie logo entreprise + packaging carton rigide)"
                    className="w-full bg-white border border-blue-300 rounded-xl px-3 py-2 text-xs text-slate-800 outline-hidden focus:border-[#2A6DFF]"
                  />
                )}
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Mode de transport envisagé</label>
                <select
                  value={formData.transportPreference}
                  onChange={e => setFormData({ ...formData, transportPreference: e.target.value as any })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 outline-hidden focus:border-[#2A6DFF] cursor-pointer"
                >
                  <option value="recommended">Recommandé par SinoSenegal (Analyse selon rapport poids/volume)</option>
                  <option value="sea">Maritime (Conteneur LCL/FCL - 30 à 45 jours - Tarif au CBM)</option>
                  <option value="air">Aérien Cargo (12 à 18 jours - Tarif au KG)</option>
                  <option value="express">Express Échantillon (5 à 8 jours - DHL/FedEx)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Cahier des charges & Détails techniques</label>
                <textarea
                  rows={3}
                  value={formData.specifications}
                  onChange={e => setFormData({ ...formData, specifications: e.target.value })}
                  placeholder="Détaillez vos exigences : certification CE/ISO requise, couleur Pantone, tolérances, conditions de test..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-800 outline-hidden focus:border-[#2A6DFF]"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-[#0D2C7A] hover:bg-[#2A6DFF] text-white font-black text-sm py-4 px-6 rounded-2xl shadow-xl flex items-center justify-center gap-2 transition-all active:scale-95"
              >
                <span>Soumettre le dossier de cotation B2B</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}
        </div>

        {/* Right Side: Guarantees & Devis Récents (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Exemples de Devis B2B récents */}
          <div className="glass-panel bg-white/90 rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black uppercase tracking-wider text-[#0D2C7A] flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#2A6DFF]" />
                <span>Exemples de Devis B2B Validés</span>
              </h3>
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                100% Transparent
              </span>
            </div>

            <p className="text-xs text-slate-600">
              Consultez la structure d'un devis officiel SinoSenegal émis pour des entreprises sénégalaises :
            </p>

            <div className="space-y-3">
              {quotes.slice(0, 2).map(quote => (
                <div
                  key={quote.id}
                  className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 hover:border-[#2A6DFF] transition-all space-y-2.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono-numeric font-bold text-xs text-[#0D2C7A]">
                      {quote.code}
                    </span>
                    <span className="text-[10px] font-bold text-[#2A6DFF] uppercase bg-blue-50 px-2 py-0.5 rounded-md">
                      {quote.clientCompany || quote.clientName}
                    </span>
                  </div>

                  <div className="text-xs font-bold text-slate-800 line-clamp-1">
                    {quote.productName} ({quote.quantity} pcs)
                  </div>

                  {/* Price split summary */}
                  <div className="grid grid-cols-2 gap-2 text-[11px] bg-white p-2 rounded-xl border border-slate-100">
                    <div>
                      <span className="text-[10px] text-slate-400 block">Prix Produit Usine</span>
                      <strong className="font-mono-numeric text-[#0D2C7A]">
                        {quote.productTotalXOF.toLocaleString('fr-FR')} F
                      </strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">Fret + Douane</span>
                      <strong className="font-mono-numeric text-amber-700">
                        {quote.logisticsEstimatedTotalXOF.toLocaleString('fr-FR')} F
                      </strong>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => openDocumentModal('quote', { quote })}
                    className="w-full bg-[#0D2C7A] hover:bg-[#2A6DFF] text-white font-bold text-xs py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Visualiser ce devis officiel (Format PDF)</span>
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="glass-panel bg-white/80 rounded-3xl p-6 border border-white shadow-sm space-y-4">
            <h3 className="text-base font-black text-[#0D2C7A] flex items-center gap-2">
              <Award className="w-5 h-5 text-[#2A6DFF]" />
              <span>Pourquoi confier votre sourcing à SinoSenegal ?</span>
            </h3>

            <div className="space-y-3 text-xs">
              <div className="flex gap-3">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-slate-800 block font-bold">Sécurisation des transactions</strong>
                  <span className="text-slate-600">Paiement par acompte sécurisé, inspection physique avant le déblocage du solde usine.</span>
                </div>
              </div>

              <div className="flex gap-3">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-slate-800 block font-bold">Négociation directe en RMB</strong>
                  <span className="text-slate-600">Élimination des intermédiaires avec devis en direct des bassins industriels de Guangzhou et Yiwu.</span>
                </div>
              </div>

              <div className="flex gap-3">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-slate-800 block font-bold">Dédouanement Gaindé DDP Dakar</strong>
                  <span className="text-slate-600">Tarif clé en main rendu à Dakar sans frais surprises à l'arrivée au port.</span>
                </div>
              </div>
            </div>
          </div>

          <div className="glass-panel bg-blue-50/70 rounded-3xl p-6 border border-blue-200/80 space-y-3 text-xs">
            <h4 className="text-sm font-bold text-[#0D2C7A] flex items-center gap-2">
              <Phone className="w-4 h-4 text-[#2A6DFF]" />
              <span>Cellule Grands Comptes & Grossistes</span>
            </h4>
            <p className="text-slate-600">
              Nos gestionnaires d'approvisionnement B2B sont joignables pour vous recevoir à nos bureaux de Dakar Plateau ou organiser un audit usine en Chine.
            </p>
            <div className="pt-2 space-y-1 font-bold text-[#0D2C7A]">
              <div>📞 +221 77 420 18 19 (WhatsApp B2B direct)</div>
              <div>✉️ b2b@sinosenegal.com</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
