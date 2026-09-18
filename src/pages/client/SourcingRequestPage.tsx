import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  FileText,
  Building2,
  Phone,
  Mail,
  User,
  Package,
  Layers,
  Upload,
  CheckCircle2,
  Clock,
  ArrowRight,
  ShieldCheck
} from 'lucide-react';

export const SourcingRequestPage: React.FC = () => {
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
      alert('Veuillez remplir au moins votre nom, téléphone et le produit recherché.');
      return;
    }

    const newReq = submitB2BRequest({
      companyName: formData.companyName || 'Particulier / Commerce Indépendant',
      contactName: formData.contactName,
      phone: formData.phone,
      email: formData.email || 'contact@client.sn',
      productType: formData.productType,
      quantity: Number(formData.quantity) || 50,
      targetBudgetXOF: Number(formData.targetBudgetXOF) || 0,
      transportPreference: formData.transportPreference,
      specifications: formData.specifications
    });

    setSubmittedCode(newReq.code);
  };

  if (submittedCode) {
    return (
      <div className="max-w-2xl mx-auto py-12 px-4">
        <div className="bg-white rounded-3xl p-8 sm:p-12 border border-slate-200 shadow-xl text-center space-y-6 animate-in zoom-in-95">
          <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full">
              Demande Reçue avec Succès
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0D2C7A] mt-3">
              Votre demande est en cours d'analyse
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 mt-2 max-w-md mx-auto leading-relaxed">
              Votre référence dossier est <strong className="font-mono text-slate-900 bg-slate-100 px-2 py-0.5 rounded">{submittedCode}</strong>.
              Nos équipes à Guangzhou et Dakar traitent votre cahier des charges et vous contacteront sous 24 à 48 heures.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-[#F8F6F2] border border-slate-200/80 text-left text-xs space-y-2">
            <div className="font-bold text-slate-800">Prochaines étapes :</div>
            <ul className="space-y-1.5 text-slate-600 list-disc list-inside">
              <li>Recherche et audit de 3 fabricants chinois qualifiés</li>
              <li>Négociation des conditions tarifaires et de MOQ usine</li>
              <li>Envoi d'un devis chiffré incluant le fret jusqu'au Sénégal</li>
            </ul>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              onClick={() => navigate('/b2b')}
              className="w-full sm:w-auto bg-[#0D2C7A] hover:bg-[#2A6DFF] text-white font-bold text-xs px-6 py-3 rounded-xl transition-colors"
            >
              Retour à l'Espace B2B
            </button>
            <button
              onClick={() => navigate('/')}
              className="w-full sm:w-auto bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs px-5 py-3 rounded-xl transition-colors"
            >
              Accueil
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8 pb-16">
      {/* Top Title */}
      <div className="text-center space-y-2">
        <span className="text-xs font-bold uppercase tracking-wider text-[#2A6DFF] bg-[#2A6DFF]/10 px-3 py-1 rounded-full">
          Demande Sur-Mesure
        </span>
        <h1 className="text-2xl sm:text-4xl font-extrabold text-[#0D2C7A] tracking-tight">
          Décrivez votre besoin d'importation en Chine
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 max-w-lg mx-auto">
          Complétez ce formulaire pour obtenir un devis personnalisé, clé en main et sans engagement sous 48h.
        </p>
      </div>

      {/* Form Card */}
      <form onSubmit={handleSubmit} className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200/80 shadow-md space-y-6">
        {/* Contact Info */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#0D2C7A] border-b border-slate-100 pb-2 flex items-center gap-1.5">
            <User className="w-3.5 h-3.5 text-[#2A6DFF]" />
            <span>Vos Coordonnées</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Nom complet / Interlocuteur *
              </label>
              <input
                type="text"
                required
                placeholder="Ex: Amadou Diallo"
                value={formData.contactName}
                onChange={e => setFormData({ ...formData, contactName: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-[#2A6DFF] outline-hidden transition-all"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Entreprise ou Boutique (Optionnel)
              </label>
              <input
                type="text"
                placeholder="Ex: SARL Dakar Électronique"
                value={formData.companyName}
                onChange={e => setFormData({ ...formData, companyName: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-[#2A6DFF] outline-hidden transition-all"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Numéro Téléphone / WhatsApp *
              </label>
              <input
                type="tel"
                required
                placeholder="Ex: +221 77 000 00 00"
                value={formData.phone}
                onChange={e => setFormData({ ...formData, phone: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-[#2A6DFF] outline-hidden transition-all font-mono"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Email
              </label>
              <input
                type="email"
                placeholder="Ex: contact@entreprise.sn"
                value={formData.email}
                onChange={e => setFormData({ ...formData, email: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-[#2A6DFF] outline-hidden transition-all"
              />
            </div>
          </div>
        </div>

        {/* Product specs */}
        <div className="space-y-4 pt-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#0D2C7A] border-b border-slate-100 pb-2 flex items-center gap-1.5">
            <Package className="w-3.5 h-3.5 text-[#2A6DFF]" />
            <span>Détails du Produit & Quantités</span>
          </h3>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Nom ou type de produit recherché *
            </label>
            <input
              type="text"
              required
              placeholder="Ex: Chaises de bureau ergonomiques mesh, panneaux solaires 450W, machines d'emballage..."
              value={formData.productType}
              onChange={e => setFormData({ ...formData, productType: e.target.value })}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-[#2A6DFF] outline-hidden transition-all"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Quantité souhaitée
              </label>
              <input
                type="number"
                min="1"
                value={formData.quantity}
                onChange={e => setFormData({ ...formData, quantity: parseInt(e.target.value) || 1 })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-[#2A6DFF] outline-hidden transition-all"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Budget estimé (FCFA)
              </label>
              <input
                type="number"
                step="50000"
                value={formData.targetBudgetXOF}
                onChange={e => setFormData({ ...formData, targetBudgetXOF: parseInt(e.target.value) || 0 })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-[#2A6DFF] outline-hidden transition-all"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Mode de transport souhaité
              </label>
              <select
                value={formData.transportPreference}
                onChange={e => setFormData({ ...formData, transportPreference: e.target.value as any })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-[#2A6DFF] outline-hidden transition-all"
              >
                <option value="recommended">Recommandé par SinoSenegal</option>
                <option value="air">Fret Aérien (12-18j)</option>
                <option value="sea">Fret Maritime (30-45j)</option>
                <option value="express">Express Courier (5-8j)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Description précise & caractéristiques techniques attendues
            </label>
            <textarea
              rows={4}
              placeholder="Exemple : Je cherche 500 chaises de bureau avec assise respirante noire, support lombaire réglable, vérin certifié classe 4. Packaging neutre avec manuel en français..."
              value={formData.specifications}
              onChange={e => setFormData({ ...formData, specifications: e.target.value })}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-[#2A6DFF] outline-hidden transition-all"
            />
          </div>

          {/* Upload Mock */}
          <div className="border-2 border-dashed border-slate-200 rounded-2xl p-4 text-center hover:bg-slate-50 cursor-pointer transition-colors">
            <Upload className="w-6 h-6 text-slate-400 mx-auto mb-1.5" />
            <span className="text-xs font-bold text-slate-700 block">
              Joindre une photo, un schéma technique ou une fiche fournisseur
            </span>
            <span className="text-[10px] text-slate-400">JPG, PNG, PDF jusqu'à 20 Mo</span>
          </div>
        </div>

        {/* Submit button */}
        <div className="pt-4">
          <button
            type="submit"
            className="w-full bg-gradient-to-r from-[#0D2C7A] to-[#2A6DFF] hover:opacity-95 text-white font-extrabold text-xs sm:text-sm py-4 px-6 rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2 active:scale-98"
          >
            <span>Envoyer la demande de sourcing</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  );
};
