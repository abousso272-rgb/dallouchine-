import React, { useState } from 'react';
import { ChevronDown, HelpCircle, MessageCircle } from 'lucide-react';

export const FaqSection: React.FC = () => {
  const [openIdx, setOpenIdx] = useState<number | null>(0);

  const faqs = [
    {
      question: 'Quels sont les délais réels de livraison entre la Chine et le Sénégal ?',
      answer:
        'Pour le fret aérien express, le délai moyen est de 5 à 7 jours ouvrés à compter du décollage de Guangzhou Baiyun vers Dakar AIBD. Pour le groupage maritime (LCL), le délai d’acheminement par navire cargo est de 35 à 45 jours de mer, plus 3 à 5 jours pour le dépotage et dédouanement au Port de Dakar.'
    },
    {
      question: 'Comment est calculé le volume en CBM (mètre cube) pour le fret maritime ?',
      answer:
        'Le CBM correspond au volume cubique de votre carton : Longueur (m) × Largeur (m) × Hauteur (m). Par exemple, un carton de 80 cm × 60 cm × 50 cm = 0,8 × 0,6 × 0,5 = 0,24 CBM. À 300 000 FCFA / CBM, le coût de transport maritime pour ce carton est de 0,24 × 300 000 = 72 000 FCFA tout compris dédouané.'
    },
    {
      question: 'Pouvez-vous payer mes fournisseurs chinois directement sur 1688 ou WeChat ?',
      answer:
        'Oui, absolument. Dallou Chine propose le service d’achat et recharge en RMB. Vous nous versez les FCFA à Dakar via Wave, Orange Money ou virement bancaire, et notre équipe en Chine règle directement vos fournisseurs chinois via Alipay ou virement bancaire chinois sous 2 heures ouvrées.'
    },
    {
      question: 'Le dédouanement à Dakar est-il réellement inclus dans vos tarifs ?',
      answer:
        'Oui, tous nos prix (au kg pour l’aérien et au CBM pour le maritime) sont affichés en "Tout Compris Rendu Dakar" (TTC). Cela inclut le transport international, le passage douanier officiel Gaindé, le magasinage et la manutention jusqu’à notre agence de Dakar. Vous ne payez aucun frais caché au retrait.'
    },
    {
      question: 'Quels articles sont formellement interdits en fret aérien ?',
      answer:
        'Sont formellement interdits en fret aérien : les produits inflammables, les explosifs, les armes et imitations d’armes, les drogues et médicaments non homologués, les aérosols sous pression et les contrefaçons flagrantes. Les batteries et téléphones sont acceptés uniquement via notre ligne spéciale "Accu & High-Tech" à 12 500 FCFA/kg.'
    },
    {
      question: 'Où se fait le retrait de mes colis à Dakar ? Proposez-vous la livraison à domicile ?',
      answer:
        'Notre hub principal de retrait est situé à Sacré-Cœur (Dakar), facile d’accès avec parking. Nous avons également des points relais partenaires à Sandaga, Pikine, Diamniadio et Thiès. Pour ceux qui le souhaitent, notre service de livraison express à domicile ou boutique dépose vos colis partout dans la région de Dakar sous 24h.'
    }
  ];

  return (
    <section id="faq" className="space-y-8">
      <div className="text-center max-w-3xl mx-auto space-y-3">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FF4500]/10 text-[#FF4500] text-xs font-black tracking-wide uppercase">
          Vos Questions Fréquentes
        </span>
        <h2 className="text-2xl sm:text-4xl font-black text-[#0B192C] tracking-tight">
          Tout savoir sur l'expédition Chine-Sénégal
        </h2>
        <p className="text-xs sm:text-base text-slate-600">
          Des réponses claires et précises pour expédier vos marchandises l'esprit tranquille.
        </p>
      </div>

      <div className="max-w-3xl mx-auto space-y-3">
        {faqs.map((faq, idx) => {
          const isOpen = openIdx === idx;
          return (
            <div
              key={idx}
              className="rounded-2xl bg-white border border-slate-200 overflow-hidden transition-all duration-200"
            >
              <button
                onClick={() => setOpenIdx(isOpen ? null : idx)}
                className="w-full p-4 sm:p-5 text-left font-bold text-xs sm:text-sm text-[#0B192C] flex items-center justify-between gap-4 hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <HelpCircle className="w-4 h-4 text-[#FF4500] shrink-0" />
                  <span>{faq.question}</span>
                </div>
                <ChevronDown
                  className={`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-200 ${
                    isOpen ? 'rotate-180 text-[#FF4500]' : ''
                  }`}
                />
              </button>

              {isOpen && (
                <div className="px-5 pb-5 pt-1 text-xs sm:text-sm text-slate-600 leading-relaxed border-t border-slate-100 bg-slate-50/50">
                  {faq.answer}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="text-center pt-2">
        <a
          href="https://wa.me/221774201819?text=Bonjour%20Dallou%20Chine,%20j'ai%20une%20question%20concernant%20un%20fret%20ou%20sourcing."
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-6 py-3 rounded-xl shadow-md transition-all"
        >
          <MessageCircle className="w-4 h-4" />
          <span>Une question spécifique ? Écrivez-nous sur WhatsApp</span>
        </a>
      </div>
    </section>
  );
};
