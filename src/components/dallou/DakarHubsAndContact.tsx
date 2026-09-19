import React, { useState } from 'react';
import { MapPin, Phone, MessageCircle, Mail, Clock, Send, CheckCircle2 } from 'lucide-react';

export const DakarHubsAndContact: React.FC = () => {
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    transportMode: 'air',
    weightOrVolume: '',
    notes: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormSubmitted(true);
    setTimeout(() => {
      setFormSubmitted(false);
      setFormData({
        fullName: '',
        phone: '',
        transportMode: 'air',
        weightOrVolume: '',
        notes: ''
      });
    }, 4000);
  };

  const hubs = [
    {
      name: 'Hub Central Dallou Dakar (Sacré-Cœur)',
      address: 'Sacré-Cœur 3, VDN en face Immeuble FAIS, Dakar',
      hours: 'Lun - Sam : 08h30 - 19h30',
      phone: '+221 77 420 18 19 / +221 33 820 00 00',
      tag: 'Siège Principal & Retrait Express'
    },
    {
      name: 'Relais Commerçants Sandaga',
      address: 'Avenue Peytavin angle Boulevard de la République, Dakar Plateau',
      hours: 'Lun - Sam : 09h00 - 18h30',
      phone: '+221 78 115 44 22',
      tag: 'Idéal Grossistes & Boutiques'
    },
    {
      name: 'Hub Banlieue & Pikine',
      address: 'Tally Boumack, près de la station Total, Pikine',
      hours: 'Lun - Sam : 09h00 - 18h00',
      phone: '+221 76 902 33 11',
      tag: 'Dépôt & Retrait'
    },
    {
      name: 'Relais Régions (Thiès & Touba)',
      address: 'Avenue de Caen, Thiès & Agence Mbacké/Touba',
      hours: 'Lun - Ven : 09h00 - 17h30',
      phone: '+221 77 540 22 11',
      tag: 'Expédition Inter-Régions'
    }
  ];

  return (
    <section id="contact" className="space-y-8">
      <div className="text-center max-w-3xl mx-auto space-y-3">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#0B192C]/10 text-[#0B192C] text-xs font-black tracking-wide uppercase">
          Proximité & Disponibilité
        </span>
        <h2 className="text-2xl sm:text-4xl font-black text-[#0B192C] tracking-tight">
          Nos Agences à Dakar et au Sénégal
        </h2>
        <p className="text-xs sm:text-base text-slate-600">
          Venez retirer vos colis ou déposer vos demandes de sourcing directement auprès de nos conseillers sénégalais.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Hubs List */}
        <div className="lg:col-span-7 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {hubs.map((hub, idx) => (
              <div
                key={idx}
                className="bg-white border border-slate-200 p-5 rounded-2xl shadow-2xs space-y-3 hover:border-[#FF4500] transition-colors"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-wider text-[#FF4500] bg-orange-50 px-2 py-0.5 rounded">
                    {hub.tag}
                  </span>
                  <MapPin className="w-4 h-4 text-[#0B192C]" />
                </div>

                <div>
                  <h4 className="text-sm font-black text-[#0B192C]">{hub.name}</h4>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">{hub.address}</p>
                </div>

                <div className="pt-2 border-t border-slate-100 space-y-1 text-[11px] text-slate-600">
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{hub.hours}</span>
                  </div>
                  <div className="flex items-center gap-1.5 font-semibold text-slate-800">
                    <Phone className="w-3.5 h-3.5 text-[#FF4500] shrink-0" />
                    <span>{hub.phone}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Direct WhatsApp Callout Banner */}
          <div className="rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-700 text-white p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-lg">
            <div className="space-y-1">
              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-200">
                Service Client 7j/7
              </span>
              <h4 className="text-base sm:text-lg font-black text-white">
                Besoin d'une réponse immédiate ?
              </h4>
              <p className="text-xs text-emerald-100">
                Nos agents vous répondent en Wolof, Français ou Chinois sur WhatsApp.
              </p>
            </div>

            <a
              href="https://wa.me/221774201819?text=Bonjour%20Dallou%20Chine,%20je%20souhaite%20obtenir%20des%20informations%20sur%20vos%20tarifs%20et%20adresses."
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center gap-2 bg-white hover:bg-emerald-50 text-emerald-800 font-black text-xs px-5 py-3 rounded-xl shadow-md transition-all shrink-0"
            >
              <MessageCircle className="w-4 h-4 text-emerald-600" />
              <span>Discuter sur WhatsApp</span>
            </a>
          </div>
        </div>

        {/* Right: Quick Quote Inquiry Form */}
        <div className="lg:col-span-5 bg-white border border-slate-200 p-6 sm:p-8 rounded-3xl shadow-sm space-y-4">
          <div>
            <h3 className="text-base sm:text-lg font-black text-[#0B192C]">
              Demande de Cotation Rapide
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Recevez une estimation personnalisée sous 30 minutes par WhatsApp ou SMS.
            </p>
          </div>

          {formSubmitted ? (
            <div className="p-6 bg-emerald-50 border border-emerald-200 rounded-2xl text-center space-y-2 animate-in fade-in">
              <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
              <h4 className="text-sm font-black text-emerald-900">Demande transmise avec succès !</h4>
              <p className="text-xs text-emerald-700">
                Notre équipe logistique Dallou Chine va vous contacter sur le numéro fourni.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nom et Prénom *
                </label>
                <input
                  type="text"
                  required
                  value={formData.fullName}
                  onChange={e => setFormData({ ...formData, fullName: e.target.value })}
                  placeholder="Ex: Babacar Ndiaye"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 outline-hidden focus:border-[#FF4500]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Numéro de Téléphone (WhatsApp) *
                </label>
                <input
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={e => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+221 77 000 00 00"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 outline-hidden focus:border-[#FF4500]"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Mode souhaité
                  </label>
                  <select
                    value={formData.transportMode}
                    onChange={e => setFormData({ ...formData, transportMode: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2.5 text-xs text-slate-900 font-semibold outline-hidden cursor-pointer"
                  >
                    <option value="air">Fret Aérien (5-7 j)</option>
                    <option value="sea">Maritime LCL (35-45 j)</option>
                    <option value="fcl">Conteneur Plein (FCL)</option>
                    <option value="sourcing">Achat 1688 / Taobao</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Poids (kg) ou CBM (m³)
                  </label>
                  <input
                    type="text"
                    value={formData.weightOrVolume}
                    onChange={e => setFormData({ ...formData, weightOrVolume: e.target.value })}
                    placeholder="Ex: 15 kg ou 1.2 CBM"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-900 outline-hidden focus:border-[#FF4500]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Description de la marchandise ou lien 1688
                </label>
                <textarea
                  rows={2}
                  value={formData.notes}
                  onChange={e => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Ex: 3 cartons de chaussures, ou lien d'une usine 1688..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 outline-hidden focus:border-[#FF4500]"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-[#0B192C] hover:bg-[#FF4500] text-white font-black text-xs rounded-xl shadow-md transition-colors flex items-center justify-center gap-2"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Envoyer ma demande de devis</span>
              </button>
            </form>
          )}
        </div>
      </div>
    </section>
  );
};
