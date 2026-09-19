import React from 'react';
import { useApp } from '../../context/AppContext';
import {
  Plane,
  ShieldCheck,
  MapPin,
  Phone,
  Mail,
  Clock,
  ArrowRight,
  Globe2,
  Package,
  Building,
  CheckCircle2
} from 'lucide-react';

export const Footer: React.FC = () => {
  const { navigate } = useApp();

  return (
    <footer className="mt-20 bg-[#0B192C] text-slate-300 pt-16 pb-24 lg:pb-12 border-t border-slate-800 relative overflow-hidden">
      {/* Soft background glow */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-[#FF4500]/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 space-y-12">
        {/* Top Newsletter / Trust Strip */}
        <div className="glass-panel-dark rounded-3xl p-6 sm:p-8 border border-white/10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-1 max-w-xl text-center md:text-left">
            <span className="text-xs font-bold uppercase tracking-wider text-[#FF4500]">
              Alertes Nouveaux Groupages & Usines
            </span>
            <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Ne manquez aucun achat groupé Chine → Sénégal
            </h3>
            <p className="text-xs sm:text-sm text-slate-300">
              Recevez les lancements de lots hebdomadaires et les baisses de prix d'usines directement par WhatsApp / Email.
            </p>
          </div>

          <div className="w-full md:w-auto flex flex-col sm:flex-row gap-2 max-w-md">
            <input
              type="text"
              placeholder="Numéro WhatsApp ou Email"
              className="bg-slate-900/90 border border-white/20 rounded-2xl px-4 py-3 text-xs text-white placeholder:text-slate-400 outline-hidden focus:border-[#FF4500] flex-1"
            />
            <button
              onClick={() => alert('Merci pour votre inscription aux alertes groupages !')}
              className="bg-[#FF4500] hover:bg-[#E03D00] text-white font-bold text-xs px-6 py-3 rounded-2xl transition-colors shadow-md shrink-0"
            >
              S'inscrire
            </button>
          </div>
        </div>

        {/* Main Footer Links Columns */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-6 pt-4">
          {/* Col 1: Brand Info */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#0B192C] to-[#FF4500] text-white flex items-center justify-center shadow-md">
                <Plane className="w-5 h-5 -rotate-45" />
              </div>
              <span className="text-xl font-black text-white tracking-tight">
                Dallou <span className="text-[#FF4500]">Chine</span>
              </span>
            </div>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-sm">
              Votre passerelle logistique et sourcing de référence entre la Chine et l’Afrique. Fret aérien express hebdomadaire, groupage maritime sécurisé et achat direct sur 1688 & Taobao avec livraison à Dakar.
            </p>

            <div className="pt-2 space-y-2 text-xs text-slate-400">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-[#FF4500] shrink-0" />
                <span>Hubs au Sénégal : Sacré-Cœur (Siège), Sandaga, Pikine & Thiès</span>
              </div>
              <div className="flex items-center gap-2">
                <Building className="w-4 h-4 text-[#FF4500] shrink-0" />
                <span>Entrepôts en Chine : Guangzhou (Baiyun) & Yiwu (Zhejiang)</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-[#FF4500] shrink-0" />
                <span>+221 77 420 18 19 / +221 33 820 00 00</span>
              </div>
            </div>
          </div>

          {/* Col 2: Navigation Rapide */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white border-b border-white/10 pb-2">
              Explorer
            </h4>
            <ul className="space-y-2 text-xs text-slate-300">
              <li>
                <button onClick={() => navigate('/products')} className="hover:text-[#FF4500] transition-colors">
                  Catalogue Produits
                </button>
              </li>
              <li>
                <button onClick={() => navigate('/groupages')} className="hover:text-[#FF4500] transition-colors flex items-center gap-1">
                  <span>Achats Groupés</span>
                  <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300">
                    Nouveau
                  </span>
                </button>
              </li>
              <li>
                <button onClick={() => navigate('/b2b')} className="hover:text-[#FF4500] transition-colors">
                  Sourcing B2B & Grossistes
                </button>
              </li>
              <li>
                <button onClick={() => navigate('/suivi')} className="hover:text-[#FF4500] transition-colors">
                  Suivi de Cargaison en Direct
                </button>
              </li>
              <li>
                <button onClick={() => navigate('/paiements')} className="hover:text-[#FF4500] transition-colors">
                  Paiements & Séquestre OHADA
                </button>
              </li>
              <li>
                <button onClick={() => navigate('/devis-documents')} className="hover:text-[#FF4500] transition-colors">
                  Centre de Documents & Certificats
                </button>
              </li>
              <li className="pt-2 border-t border-white/10">
                <button
                  onClick={() => navigate('/admin')}
                  className="text-orange-300 hover:text-white font-bold transition-colors flex items-center gap-1.5"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-[#FF4500]" />
                  <span>Espace Administrateur HQ</span>
                </button>
              </li>
            </ul>
          </div>

          {/* Col 3: Catégories Phares */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white border-b border-white/10 pb-2">
              Catégories
            </h4>
            <ul className="space-y-2 text-xs text-slate-300">
              <li>
                <button onClick={() => navigate('/products?category=electronique-high-tech')} className="hover:text-[#FF4500] transition-colors">
                  Électronique & Vidéo
                </button>
              </li>
              <li>
                <button onClick={() => navigate('/products?category=maison-decoration')} className="hover:text-[#FF4500] transition-colors">
                  Maison & Rangement
                </button>
              </li>
              <li>
                <button onClick={() => navigate('/auto-mobilite')} className="hover:text-[#FF4500] transition-colors">
                  Auto, Motos & Mobilité Électrique
                </button>
              </li>
              <li>
                <button onClick={() => navigate('/products?category=energie-solaire-batteries')} className="hover:text-[#FF4500] transition-colors">
                  Énergie Solaire & LiFePO4
                </button>
              </li>
              <li>
                <button onClick={() => navigate('/products?category=equipements-professionnels')} className="hover:text-[#FF4500] transition-colors">
                  Équipements Professionnels
                </button>
              </li>
            </ul>
          </div>

          {/* Col 4: Paiements & Confiance */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white border-b border-white/10 pb-2">
              Paiements Locaux Sécurisés
            </h4>
            <p className="text-xs text-slate-400">
              Réglez vos commandes facilement avec vos moyens de paiement sénégalais habituels :
            </p>

            <div className="flex flex-wrap gap-2">
              <span className="px-3 py-1.5 rounded-xl bg-slate-900 border border-white/10 text-xs font-bold text-white">
                🌊 Wave Sénégal
              </span>
              <span className="px-3 py-1.5 rounded-xl bg-slate-900 border border-white/10 text-xs font-bold text-orange-400">
                🍊 Orange Money
              </span>
              <span className="px-3 py-1.5 rounded-xl bg-slate-900 border border-white/10 text-xs font-bold text-teal-400">
                💳 Free Money
              </span>
              <span className="px-3 py-1.5 rounded-xl bg-slate-900 border border-white/10 text-xs font-bold text-blue-400">
                💳 Cartes Visa/Mastercard
              </span>
            </div>
          </div>
        </div>

        {/* Bottom Copyright & Guarantee Strip */}
        <div className="pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Contrôle qualité systématique en Chine avant expédition vers Dakar.</span>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/admin')}
              className="hover:text-blue-300 transition-colors flex items-center gap-1"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
              <span>Accès Staff / Admin HQ</span>
            </button>
            <span>•</span>
            <div>
              © 2026 Dallou Chine Logistique & Transit. Tous droits réservés.
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};
