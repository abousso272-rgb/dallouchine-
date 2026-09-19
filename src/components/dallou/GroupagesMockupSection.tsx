import React from 'react';
import { useApp } from '../../context/AppContext';
import { ArrowRight, Calendar } from 'lucide-react';

interface MockGroupageCardData {
  id: string;
  title: string;
  category: string;
  image: string;
  priceXOF: number;
  moq: number;
  reserved: number;
  remaining: number;
  progressPercent: number;
  deadline: string;
}

export const GroupagesMockupSection: React.FC = () => {
  const { navigate } = useApp();

  const mockCards: MockGroupageCardData[] = [
    {
      id: 'grp-moto',
      title: 'Moto Électrique Urbaine 72V',
      category: 'Mobilité',
      image: 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&w=600&q=80',
      priceXOF: 850000,
      moq: 20,
      reserved: 14,
      remaining: 6,
      progressPercent: 70,
      deadline: '28 Octobre 2026'
    },
    {
      id: 'grp-smartphone',
      title: 'Smartphone Android 5G',
      category: 'Électronique',
      image: 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?auto=format&fit=crop&w=600&q=80',
      priceXOF: 48000,
      moq: 100,
      reserved: 72,
      remaining: 28,
      progressPercent: 72,
      deadline: '15 Juin 2025'
    },
    {
      id: 'grp-airfryer',
      title: 'Air Fryer Numérique 5L',
      category: 'Maison',
      image: 'https://images.unsplash.com/photo-1584269600464-37b1b58a9fe7?auto=format&fit=crop&w=600&q=80',
      priceXOF: 28000,
      moq: 50,
      reserved: 38,
      remaining: 12,
      progressPercent: 76,
      deadline: '18 Juin 2025'
    },
    {
      id: 'grp-sweatshirt',
      title: 'Sweatshirt Coton Unisexe',
      category: 'Mode',
      image: 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&w=600&q=80',
      priceXOF: 12500,
      moq: 200,
      reserved: 150,
      remaining: 50,
      progressPercent: 75,
      deadline: '20 Juin 2025'
    }
  ];

  return (
    <section className="space-y-6 pt-4">
      {/* Container with Left Promo Column and Right 4 Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* =================================================================== */}
        {/* LEFT COLUMN: HERO CALLOUT FOR GROUPAGES */}
        {/* =================================================================== */}
        <div className="lg:col-span-3 flex flex-col justify-between p-6 sm:p-8 rounded-3xl bg-white border border-slate-100 shadow-sm space-y-6">
          <div className="space-y-4">
            {/* Tag badge */}
            <div className="inline-flex items-center gap-2 text-xs font-black text-[#FF4500] uppercase tracking-wider">
              <span className="w-2.5 h-2.5 rounded-full bg-[#FF4500]" />
              <span>GROUPAGES</span>
            </div>

            {/* Headline */}
            <h2 className="text-2xl sm:text-3xl font-black text-[#0B192C] leading-tight tracking-tight">
              Commandez ensemble. Atteignez les MOQ. Optimisez vos coûts.
            </h2>

            {/* Description */}
            <p className="text-xs sm:text-sm text-slate-600 font-normal leading-relaxed">
              Rejoignez d’autres acheteurs pour atteindre les quantités minimales et bénéficier de meilleurs prix sur le transport.
            </p>
          </div>

          {/* Action Button */}
          <div>
            <button
              onClick={() => navigate('/groupages')}
              className="w-full sm:w-auto px-6 py-3 rounded-full bg-[#FF4500] hover:bg-[#E03D00] text-white font-bold text-xs sm:text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Voir tous les groupage</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* =================================================================== */}
        {/* RIGHT COLUMN: 4 CARDS AS IN THE REFERENCE MOCKUP */}
        {/* =================================================================== */}
        <div className="lg:col-span-9 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {mockCards.map(card => (
            <div
              key={card.id}
              className="bg-white rounded-3xl overflow-hidden border border-slate-100 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group"
            >
              {/* Image Container with Badges */}
              <div className="relative aspect-[4/3] bg-slate-100 overflow-hidden">
                <img
                  src={card.image}
                  alt={card.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />

                {/* Category Pill Tag (top-right) */}
                <span className="absolute top-2.5 right-2.5 px-2.5 py-0.5 rounded-full bg-slate-900/80 backdrop-blur-xs text-white text-[10px] font-bold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#FF4500]" />
                  <span>{card.category}</span>
                </span>

                {/* "Groupage" Badge (bottom-left of image) */}
                <div className="absolute bottom-2.5 left-2.5 px-2.5 py-0.5 rounded-full bg-[#FF4500] text-white text-[10px] font-black tracking-wider uppercase shadow-xs">
                  Groupage
                </div>
              </div>

              {/* Card Body */}
              <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="text-sm font-bold text-[#0B192C] truncate" title={card.title}>
                    {card.title}
                  </h3>

                  {/* Price */}
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    À partir de{' '}
                    <strong className="text-sm font-black text-[#FF4500] font-mono-numeric">
                      {card.priceXOF.toLocaleString('fr-FR')} FCFA
                    </strong>
                  </p>
                </div>

                {/* Progress & Quota Breakdown */}
                <div className="space-y-1.5 pt-1 text-[11px] text-slate-600">
                  <div className="flex justify-between font-semibold">
                    <span>MOQ : {card.moq} unités</span>
                  </div>
                  <div className="flex justify-between text-slate-500 text-[10px]">
                    <span>Réservé : <strong className="text-slate-800">{card.reserved} unités</strong></span>
                    <span>Restant : <strong className="text-[#FF4500]">{card.remaining} unités</strong></span>
                  </div>

                  {/* Progress Bar in Orange */}
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden relative">
                    <div
                      className="h-full bg-[#FF4500] rounded-full transition-all duration-700"
                      style={{ width: `${card.progressPercent}%` }}
                    />
                  </div>
                  <div className="text-right text-[10px] font-bold text-slate-500">
                    {card.progressPercent}%
                  </div>

                  {/* Deadline */}
                  <div className="flex items-center gap-1.5 text-[10px] text-slate-500 pt-0.5">
                    <Calendar className="w-3 h-3 text-slate-400" />
                    <span>Date limite : <strong className="text-slate-700">{card.deadline}</strong></span>
                  </div>
                </div>

                {/* CTA Button: Rejoindre le groupage -> */}
                <button
                  onClick={() => navigate(`/groupages/${card.id}`)}
                  className="w-full py-2.5 rounded-full bg-[#FF4500] hover:bg-[#E03D00] text-white text-xs font-bold shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer mt-2"
                >
                  <span>Rejoindre le groupage</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
