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
  const { navigate, groupages } = useApp();

  const fallbackCards: MockGroupageCardData[] = [
    {
      id: '00000000-0000-0000-0000-000000000001',
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
      id: '00000000-0000-0000-0000-000000000002',
      title: 'Mini Vidéoprojecteur Smart HD',
      category: 'Électronique',
      image: 'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?auto=format&fit=crop&w=600&q=80',
      priceXOF: 15900,
      moq: 50,
      reserved: 37,
      remaining: 13,
      progressPercent: 74,
      deadline: '15 Juin 2026'
    },
    {
      id: '00000000-0000-0000-0000-000000000003',
      title: 'Station Solaire 1000W LiFePO4',
      category: 'Maison',
      image: 'https://images.unsplash.com/photo-1584269600464-37b1b58a9fe7?auto=format&fit=crop&w=600&q=80',
      priceXOF: 450000,
      moq: 15,
      reserved: 11,
      remaining: 4,
      progressPercent: 73,
      deadline: '18 Juin 2026'
    },
    {
      id: 'df2abd0d-af81-4b63-bc11-4ac5e8ffaa16',
      title: 'Scooters Électriques Urbains Pro',
      category: 'Mobilité',
      image: 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=600&q=80',
      priceXOF: 875000,
      moq: 20,
      reserved: 14,
      remaining: 6,
      progressPercent: 70,
      deadline: '20 Juin 2026'
    }
  ];

  const cardsToDisplay: MockGroupageCardData[] = groupages && groupages.length > 0
    ? groupages.slice(0, 4).map(g => {
        const target = g.targetUnits || g.targetQuantity || 20;
        const current = g.currentUnits || g.reservedQuantity || 0;
        const remaining = g.availableQuantity ?? Math.max(0, target - current);
        return {
          id: g.id,
          title: g.title,
          category: g.product?.category || 'Sourcing Direct',
          image: g.image || g.product?.images?.[0] || 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&w=600&q=80',
          priceXOF: g.unitPriceXOF,
          moq: target,
          reserved: current,
          remaining,
          progressPercent: Math.min(100, Math.round((current / (target || 1)) * 100)),
          deadline: g.closingDate || 'En cours'
        };
      })
    : fallbackCards;

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
          {cardsToDisplay.map(card => (
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
