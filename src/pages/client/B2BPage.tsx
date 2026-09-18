import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { SectionHeader } from '../../components/common/SectionHeader';
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
  Globe2
} from 'lucide-react';

export const B2BPage: React.FC = () => {
  const { submitB2BRequest, navigate } = useApp();

  const [formData, setFormData] = useState({
    companyName: '',
    contactName: '',
    phone: '',
    email: '',
    productType: '',
    quantity: 100,
    targetBudgetXOF: 1500000,
    transportPreference: 'recommended' as 'air' | 'sea' | 'express' | 'recommended',
    specifications: ''
  });

  const [submittedCode, setSubmittedCode] = useState<string | null>(null);

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
      specifications: formData.specifications
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
            Importez des conteneurs complets ou des lots industriels auprès de fabricants chinois audités. Nous gérons la négociation, le contrôle qualité sur place, le fret et le dédouanement Gaindé DDP.
          </p>
        </div>

        {/* 3 Pillars Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-white/10 relative z-10 text-xs sm:text-sm">
          <div className="bg-white/5 p-4 rounded-2xl border border-white/10 space-y-1">
            <strong className="text-white block font-bold">1. Sourcing Usines Vérifiées</strong>
            <span className="text-slate-400">Présence physique à Guangzhou, Shenzhen et Yiwu.</span>
          </div>

          <div className="bg-white/5 p-4 rounded-2xl border border-white/10 space-y-1">
            <strong className="text-white block font-bold">2. Contrôle Qualité Pré-Embarquement</strong>
            <span className="text-slate-400">Rapport d'inspection photos/vidéos avant paiement solde.</span>
          </div>

          <div className="bg-white/5 p-4 rounded-2xl border border-white/10 space-y-1">
            <strong className="text-white block font-bold">3. Acheminement Port de Dakar</strong>
            <span className="text-slate-400">FCL / LCL maritime ou vol cargo avec dédouanement tout inclus.</span>
          </div>
        </div>
      </section>

      {/* Main Quote Request Form + Assistance */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Side: Interactive Quote Form (7 cols) */}
        <div className="lg:col-span-7 glass-panel bg-white/90 rounded-3xl p-6 sm:p-8 border border-white shadow-md space-y-6">
          {submittedCode ? (
            <div className="text-center py-10 space-y-4 animate-in zoom-in-95">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto text-2xl">
                ✓
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-black text-[#0D2C7A]">Demande B2B Enregistrée !</h3>
                <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto">
                  Votre référence dossier est <strong className="text-[#2A6DFF] font-mono-numeric">{submittedCode}</strong>. Nos équipes à Guangzhou et Dakar analysent votre cahier des charges et vous transmettront un devis sous 24 à 48h.
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
                  Demander une cotation personnalisée
                </h2>
                <p className="text-xs text-slate-500">
                  Remplissez ce formulaire pour recevoir une étude de faisabilité et un chiffrage rendu Dakar.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Nom de l'entreprise (ou Particulier)</label>
                  <input
                    type="text"
                    value={formData.companyName}
                    onChange={e => setFormData({ ...formData, companyName: e.target.value })}
                    placeholder="Ex: Société SenDistribution SARL"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 outline-hidden focus:border-[#2A6DFF]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Nom du contact *</label>
                  <input
                    type="text"
                    required
                    value={formData.contactName}
                    onChange={e => setFormData({ ...formData, contactName: e.target.value })}
                    placeholder="Ex: Babacar Ndiaye"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 outline-hidden focus:border-[#2A6DFF]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Téléphone WhatsApp *</label>
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
                    placeholder="contact@societe.sn"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 outline-hidden focus:border-[#2A6DFF]"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Type de produit ou marchandise recherchée *</label>
                <input
                  type="text"
                  required
                  value={formData.productType}
                  onChange={e => setFormData({ ...formData, productType: e.target.value })}
                  placeholder="Ex: 500 Pulvérisateurs agricoles 16L à batterie Li-ion"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 outline-hidden focus:border-[#2A6DFF]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Quantité souhaitée</label>
                  <input
                    type="number"
                    min="10"
                    value={formData.quantity}
                    onChange={e => setFormData({ ...formData, quantity: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 outline-hidden focus:border-[#2A6DFF]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Budget estimé (FCFA)</label>
                  <input
                    type="number"
                    step="50000"
                    value={formData.targetBudgetXOF}
                    onChange={e => setFormData({ ...formData, targetBudgetXOF: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 outline-hidden focus:border-[#2A6DFF]"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Préférence de transport</label>
                <select
                  value={formData.transportPreference}
                  onChange={e => setFormData({ ...formData, transportPreference: e.target.value as any })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 outline-hidden focus:border-[#2A6DFF] cursor-pointer"
                >
                  <option value="recommended">Recommandé par SinoSenegal (Optimal selon volume)</option>
                  <option value="sea">Maritime (Conteneur LCL/FCL - 30 à 45 jours - Très économique)</option>
                  <option value="air">Aérien Cargo (12 à 18 jours - Rapide)</option>
                  <option value="express">Express Prioritaire (5 à 8 jours - Échantillons)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Spécifications techniques ou liens 1688 / Alibaba</label>
                <textarea
                  rows={3}
                  value={formData.specifications}
                  onChange={e => setFormData({ ...formData, specifications: e.target.value })}
                  placeholder="Détaillez vos exigences : matériaux, puissance, couleur, emballage avec logo personnalisé..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-800 outline-hidden focus:border-[#2A6DFF]"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-[#0D2C7A] hover:bg-[#2A6DFF] text-white font-black text-sm py-4 px-6 rounded-2xl shadow-xl flex items-center justify-center gap-2 transition-all active:scale-95"
              >
                <span>Envoyer ma demande de cotation B2B</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}
        </div>

        {/* Right Side: Guarantees & Contact (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="glass-panel bg-white/80 rounded-3xl p-6 border border-white shadow-sm space-y-4">
            <h3 className="text-base font-black text-[#0D2C7A] flex items-center gap-2">
              <Award className="w-5 h-5 text-[#2A6DFF]" />
              <span>Pourquoi confier votre sourcing à SinoSenegal ?</span>
            </h3>

            <div className="space-y-3 text-xs">
              <div className="flex gap-3">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-slate-800 block font-bold">Aucune arnaque usine</strong>
                  <span className="text-slate-600">Vérification de la licence commerciale chinoise et visite in situ avant tout virement.</span>
                </div>
              </div>

              <div className="flex gap-3">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-slate-800 block font-bold">Prix d'usine négociés en RMB</strong>
                  <span className="text-slate-600">Nous négocions directement en chinois avec les fabricants de premier rang.</span>
                </div>
              </div>

              <div className="flex gap-3">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-slate-800 block font-bold">Dédouanement Gaindé DDP Dakar</strong>
                  <span className="text-slate-600">Tarif clé en main rendu à Dakar sans formalité douanière complexe à gérer de votre côté.</span>
                </div>
              </div>
            </div>
          </div>

          <div className="glass-panel bg-blue-50/70 rounded-3xl p-6 border border-blue-200/80 space-y-3 text-xs">
            <h4 className="text-sm font-bold text-[#0D2C7A] flex items-center gap-2">
              <Phone className="w-4 h-4 text-[#2A6DFF]" />
              <span>Besoin d'un accompagnement direct ?</span>
            </h4>
            <p className="text-slate-600">
              Nos conseillers sourcing B2B sont joignables directement pour convenir d'un rendez-vous dans nos bureaux à Dakar ou en visio.
            </p>
            <div className="pt-2 space-y-1 font-bold text-[#0D2C7A]">
              <div>📞 +221 77 420 18 19 (WhatsApp B2B)</div>
              <div>✉️ b2b@sinosenegal.com</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
