import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';

export const GroupagesPage: React.FC = () => {
  const { navigate, addToCart, products } = useApp();

  // Search & Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Interactive Reservation Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalItem, setModalItem] = useState<{
    id: string;
    title: string;
    subtitle: string;
    priceNum: number;
    price: string;
    deposit: string;
    unitName: string;
  }>({
    id: 'grp-moto',
    title: 'Moto Électrique Urbaine 2000W',
    subtitle: 'Unité réservée au tarif usine de gros',
    priceNum: 480000,
    price: '480 000 FCFA',
    deposit: '144 000 FCFA',
    unitName: 'Moto Électrique Urbaine 2000W'
  });

  const [modalQty, setModalQty] = useState(1);
  const [phone, setPhone] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'wave' | 'om' | 'bank'>('wave');
  const [bookingSuccess, setBookingSuccess] = useState(false);

  const openModal = (
    id: string,
    title: string,
    priceNum: number,
    price: string,
    deposit: string,
    subtitle = 'Unité réservée au tarif usine de gros'
  ) => {
    setModalItem({
      id,
      title,
      subtitle,
      priceNum,
      price,
      deposit,
      unitName: title
    });
    setModalQty(1);
    setBookingSuccess(false);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setBookingSuccess(false);
  };

  const handleConfirmReservation = (e: React.FormEvent) => {
    e.preventDefault();
    const productMatch = products.find(p => p.id === 'prod-moto') || products[0];
    addToCart(
      {
        ...productMatch,
        name: `Réservation Groupage : ${modalItem.title} (${modalQty} unité${modalQty > 1 ? 's' : ''})`,
        priceXOF: modalItem.priceNum * 0.3 // 30% acompte
      },
      modalQty,
      true,
      modalItem.id
    );

    setBookingSuccess(true);
    setTimeout(() => {
      setIsModalOpen(false);
      navigate('/cart');
    }, 1200);
  };

  // Groupage Items
  const cardsData = [
    {
      id: 'grp-smartphone',
      category: 'electronics',
      categoryLabel: 'Électronique',
      status: 'almost',
      title: 'Smartphone Android 5G Pro',
      image:
        'https://lh3.googleusercontent.com/aida-public/AB6AXuAUbcI9nfQosel4v6Imzu-EUHbFe1n6KAZu6RiHf4DuF-uTMgSvesUGoOtmkiMR2IBNE2nHI_Iiu-WrfF3O4fbPT1V_ioKB5iollS_uMWUJwsFmeroq_VuKErW5D7qGG4XvULsk-wFnCHKFen3IngY_UYWwn0sWroO2BWthkL7-bS6KNA52xJCEicnmXPLf2_AJTovKym1ZG8od6XDD3Dfb6P_G1KX-gVme5Ei_2pwODFBWUhuxqwdfoA',
      priceXOF: 48000,
      oldPriceXOF: 68000,
      discount: '-29%',
      moq: 100,
      reserved: 72,
      remaining: 28,
      progress: 72,
      deadline: '15 Juin',
      note: 'Fret maritime inclus'
    },
    {
      id: 'grp-sweatshirt',
      category: 'fashion',
      categoryLabel: 'Mode & Textile',
      status: 'almost',
      title: 'Sweatshirt Oversize Coton 360g',
      image:
        'https://lh3.googleusercontent.com/aida-public/AB6AXuCI5lVpRRYXK7mX7ftMLW6O0ZeCrbXt6W2ahi-pWzJyP1addlse0eMxy2FL7hYwhTpjUKNa-_ucl2ifRGzxi5CmuGuuTmuCulhJKtTq3d8nMgn9fa5r4kPhERju5kQrVvGDO-du9CsaHjdVBKbkC55TJGVQuCZfO4AxtqlI9lhXc-qBhEDgcxIpaYlacAOc0q8i84lsL2QTZIR-pNomXcI0lJU4_5s4nniaqgg1UZG1OrWKQWpR46mj1Q',
      priceXOF: 12500,
      oldPriceXOF: 19000,
      discount: '-34%',
      moq: 200,
      reserved: 150,
      remaining: 50,
      progress: 75,
      deadline: '20 Juin',
      note: 'Cartons sous blister'
    },
    {
      id: 'grp-airfryer',
      category: 'home',
      categoryLabel: 'Maison & Cuisine',
      status: 'almost',
      title: 'Air Fryer XL Tactile 5.5L',
      image:
        'https://lh3.googleusercontent.com/aida-public/AB6AXuDj9ApeAYc4noD2K9NY2B_ydecyxBsMKQ6QbhpxjhQuZwKXcRKXYex0wWdFGcDf-LGT7eOLF54xYaxJy9cQ936fBfiOK-UHVnVlg4T023aMOjHUp8C2hFfOx44i5QTC7zHKCNF8Cn7QSnim1q_q2iIpiI8ZZ7e4yK6Kfk6wqBSd1F5zWVUWg4i0MeSLaoeTVlevM0xvcN_C-Z6kEM061fKHnZTJDd7fzkqvtLWo9FUUj1BVNNLVuhxWKw',
      priceXOF: 28000,
      oldPriceXOF: 42000,
      discount: '-33%',
      moq: 50,
      reserved: 38,
      remaining: 12,
      progress: 76,
      deadline: '18 Juin',
      note: 'Garantie 1 an usine'
    },
    {
      id: 'grp-machine',
      category: 'machinery',
      categoryLabel: 'Équipements B2B',
      status: 'open',
      title: 'Découpe Laser Métal Compacte',
      image:
        'https://lh3.googleusercontent.com/aida-public/AB6AXuA5iKFpfwscfBE-lJ6HMQq8NyieAA81SY6rzo8RV5091CJQZyENyGHcPgU_-l01VZA1ZOyi_ZDTCOFRYEasCqp12dqq9xOVgUFqWHQUr9aQES0cMRVqGufwlxvnL-jtSMo_Oxu36gIsD0ffP5JLykhXmCl4Jg2dQLpJ6knupxcFlXWYJMTisYdv-vD50BRHCc-JkXQzbU6ZfLA32hDsD83yShLa0SY65x85p_d2Fiq7VmA8qeWCnWMHmQ',
      priceXOF: 1250000,
      oldPriceXOF: 1800000,
      discount: '-30%',
      moq: 10,
      reserved: 6,
      remaining: 4,
      progress: 60,
      deadline: '25 Juin',
      note: 'Caisse bois renforcée'
    },
    {
      id: 'grp-solar-panels',
      category: 'machinery',
      categoryLabel: 'Énergie Solaire',
      status: 'almost',
      title: 'Panneau Solaire Mono 450W',
      image:
        'https://lh3.googleusercontent.com/aida-public/AB6AXuCkpm5AZV33z2PZ3VbNxqXzm8eRSfZyJpAeHJFLS_ezHBXuWSNC6rPrBccPt9MkGV_NxajbaNPUdeSQDGXjngsGsBvebwC0z0iTA0XaKLhpGHVFx5oSXnFkrm2jGT8aOjqBKlF1gB5b4EsSZDen8_xivyy3fA09IwDndpUsZHr8UxeOY4bdFhFLoCOIl75x_oR5N9oQgKm0Z8o3gKgG5K7Y205XCvTD9Mu_9Pq_Fn5Rxx_TPihUK6URbA',
      priceXOF: 75000,
      oldPriceXOF: 105000,
      discount: '-28%',
      moq: 60,
      reserved: 48,
      remaining: 12,
      progress: 80,
      deadline: '12 Juin',
      note: 'Certifié Tier 1'
    },
    {
      id: 'grp-projector-solar',
      category: 'machinery',
      categoryLabel: 'Éclairage & Solaire',
      status: 'last',
      title: 'Projecteur LED Solaire 100W IP66',
      image:
        'https://lh3.googleusercontent.com/aida-public/AB6AXuAK3y4p1Zp9mNabqjg4k1aTDeSh_8Iu1K0ZWXHRpKOoXpW-ZaqgtIWhm_Eyl9lE3N1GSBw8KieLtat3rjGPIJhUedVEy0TfYohH7JLTKFnsyZlOJaep9FR4sFsHjYynLaf5n7javyxWCbh_NROqkwz5QKkExWLgrUKr2dqfJANk7_rccHGlLL-ciOYZAR5F6p2bCwvkl5bNnxgoAGTNXkYT_6DjOUzgVrlZa2ooJ1cg_9QQcQ_RtVZJew',
      priceXOF: 18500,
      oldPriceXOF: 26000,
      discount: '-29%',
      moq: 40,
      reserved: 32,
      remaining: 8,
      progress: 80,
      deadline: '16 Juin',
      note: 'Batterie LiFePO4'
    }
  ];

  // Filtering
  const filteredCards = cardsData.filter(card => {
    const matchesCat = selectedCategory === 'all' || card.category === selectedCategory;
    const matchesStatus = selectedStatus === 'all' || card.status === selectedStatus;
    const matchesQuery =
      !searchQuery ||
      card.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      card.categoryLabel.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesStatus && matchesQuery;
  });

  return (
    <div className="flex flex-col w-full">
      {/* =================================================================== */}
      {/* INTERACTIVE MODAL CONTAINER FOR JOINING GROUPAGE */}
      {/* =================================================================== */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-inverse-surface/40 backdrop-blur-md transition-all duration-300 p-4">
          <div className="bg-surface-container-lowest rounded-2xl max-w-lg w-full p-6 sm:p-8 shadow-2xl transform scale-100 transition-transform duration-300 relative border border-slate-100">
            {/* Header */}
            <div className="flex items-start justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary-container/15 flex items-center justify-center text-primary-container">
                  <span className="material-symbols-outlined text-[24px]">group_add</span>
                </div>
                <div>
                  <h3 className="font-headline-sm text-headline-sm text-on-surface">
                    {modalItem.title}
                  </h3>
                  <p className="font-label-md text-label-md text-on-surface-variant">
                    {modalItem.subtitle}
                  </p>
                </div>
              </div>
              <button
                onClick={closeModal}
                className="w-8 h-8 rounded-full bg-surface-container-high flex items-center justify-center text-on-surface-variant hover:text-on-surface cursor-pointer"
                type="button"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            {/* Pricing Summary Box */}
            <div className="bg-surface-container-low rounded-xl p-4 mb-5">
              <div className="flex justify-between items-center mb-2">
                <span className="font-body-sm text-body-sm text-on-surface-variant">
                  Prix unitaire négocié :
                </span>
                <span className="font-price-md text-price-md text-primary-container font-bold">
                  {modalItem.price}
                </span>
              </div>
              <div className="flex justify-between items-center text-on-surface-variant font-label-md text-label-md">
                <span>Acompte initial (30%) :</span>
                <span className="font-semibold text-on-surface">
                  {(Math.round(modalItem.priceNum * 0.3 * modalQty)).toLocaleString('fr-FR')} FCFA
                </span>
              </div>
              <div className="flex justify-between items-center text-on-surface-variant font-label-md text-label-md mt-1">
                <span>Transit maritime estimé :</span>
                <span className="font-semibold text-on-surface">Port de Ningbo ➔ Port de Dakar (32j)</span>
              </div>
            </div>

            {bookingSuccess ? (
              <div className="p-6 text-center space-y-3 bg-emerald-50 rounded-2xl border border-emerald-200">
                <span className="material-symbols-outlined text-4xl text-emerald-600 animate-bounce">
                  check_circle
                </span>
                <h4 className="font-headline-sm font-bold text-emerald-900">
                  Réservation validée avec succès !
                </h4>
                <p className="text-xs text-emerald-700">
                  Votre acompte a été ajouté au panier. Redirection en cours...
                </p>
              </div>
            ) : (
              <form className="space-y-4" onSubmit={handleConfirmReservation}>
                <div>
                  <label className="block font-label-md text-label-md text-on-surface mb-1.5 font-bold">
                    Quantité souhaitée
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      className="w-24 h-12 px-3 rounded-xl bg-surface-container-high text-on-surface font-headline-sm text-center outline-none focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary-container"
                      max={10}
                      min={1}
                      type="number"
                      value={modalQty}
                      onChange={e => setModalQty(Math.max(1, parseInt(e.target.value) || 1))}
                    />
                    <span className="font-body-sm text-body-sm text-on-surface-variant">
                      Unité(s) décomptée(s) du MOQ restant
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block font-label-md text-label-md text-on-surface mb-1.5 font-bold">
                    Numéro WhatsApp / Téléphone (Dakar & Régions)
                  </label>
                  <div className="flex items-center bg-surface-container-high rounded-xl px-3 h-12">
                    <span className="font-label-lg text-label-lg text-on-surface font-bold mr-2">
                      🇸🇳 +221
                    </span>
                    <input
                      className="bg-transparent w-full text-on-surface placeholder:text-outline outline-none font-body-md text-body-md"
                      placeholder="77 000 00 00"
                      required
                      type="tel"
                      value={phone}
                      onChange={e => setPhone(e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-label-md text-label-md text-on-surface mb-1.5 font-bold">
                    Moyen de règlement de l'acompte (30%)
                  </label>
                  <div className="grid grid-cols-3 gap-2 text-xs font-bold">
                    {[
                      { id: 'wave', label: 'Wave Sénégal' },
                      { id: 'om', label: 'Orange Money' },
                      { id: 'bank', label: 'Virement / Desk' }
                    ].map(m => (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setPaymentMethod(m.id as any)}
                        className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                          paymentMethod === m.id
                            ? 'border-primary-container bg-primary-fixed/30 text-on-surface'
                            : 'border-slate-200 bg-white text-slate-600'
                        }`}
                      >
                        {m.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-primary-fixed-dim/25 flex items-start gap-2.5 text-on-primary-container font-body-sm text-body-sm">
                  <span className="material-symbols-outlined text-[18px] text-primary-container shrink-0 mt-0.5">
                    verified_user
                  </span>
                  <span>
                    Votre acompte est consigné sous séquestre chez Dallou Chine jusqu'à validation douanière et départ effectif du navire.
                  </span>
                </div>

                <div className="flex gap-2">
                  <button
                    className="w-full h-12 rounded-full bg-primary-container text-on-primary font-label-lg text-label-lg font-bold shadow-lg hover:bg-secondary-container transition-all flex items-center justify-center gap-2 cursor-pointer"
                    type="submit"
                  >
                    <span>Confirmer ma réservation</span>
                    <span className="material-symbols-outlined text-[18px]">lock</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* HERO SECTION GROUPAGES */}
      {/* =================================================================== */}
      <section className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-12 py-8 sm:py-10">
        <div className="relative bg-surface-container-lowest/80 backdrop-blur-2xl rounded-3xl p-6 sm:p-12 shadow-sm overflow-hidden mb-10 border border-slate-100">
          {/* Ambient glow decor */}
          <div className="absolute -right-20 -bottom-20 w-96 h-96 bg-primary-container/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute top-0 right-1/4 w-72 h-72 bg-secondary-container/10 rounded-full blur-2xl pointer-events-none" />

          <div className="relative z-10 max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-surface-container font-label-sm text-label-sm text-on-surface uppercase tracking-wider mb-6">
              <span className="w-2 h-2 rounded-full bg-primary-container animate-pulse" />
              <span>Logistique Collaborative Transcontinentale</span>
            </div>

            <h1 className="font-display-lg text-display-lg text-on-surface font-extrabold tracking-tight mb-4">
              Commandez ensemble. <br />
              <span className="text-primary-container">Atteignez les MOQ.</span> Optimisez vos coûts.
            </h1>

            <p className="font-body-lg text-body-lg text-on-surface-variant mb-6 max-w-2xl leading-relaxed">
              Rejoignez d'autres acheteurs et entrepreneurs sénégalais pour acheter aux prix usine de Chine sans contrainte de volume individuel. Mutualisez le conteneur maritime 40HQ directement vers Dakar.
            </p>

            {/* Search Capsule and Filter Switch */}
            <div className="bg-surface-container-low/90 backdrop-blur-xl rounded-full p-2 flex flex-col sm:flex-row items-center gap-2 shadow-md">
              <div className="flex items-center gap-3 px-4 w-full sm:w-auto flex-1">
                <span className="material-symbols-outlined text-outline text-[22px]">search</span>
                <input
                  className="w-full bg-transparent text-on-surface placeholder:text-outline font-body-md text-body-md outline-none"
                  placeholder="Rechercher un groupage (ex: Moto, Électrique, Solaire...)"
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto shrink-0 justify-end">
                <span className="hidden md:inline font-label-sm text-label-sm text-on-surface-variant font-semibold px-2">
                  Affichage : 18 conteneurs
                </span>
                <button
                  type="button"
                  className="px-6 py-3 rounded-full bg-primary-container text-on-primary font-label-lg text-label-lg font-bold shadow-md hover:bg-secondary-container transition-all flex items-center gap-2 cursor-pointer"
                >
                  <span>Filtrer</span>
                  <span className="material-symbols-outlined text-[18px]">tune</span>
                </button>
              </div>
            </div>
          </div>

          {/* Live metrics ribbons */}
          <div className="relative z-10 grid grid-cols-2 md:grid-cols-4 gap-4 mt-8 pt-6 border-t border-surface-container-high/40">
            <div>
              <span className="block font-price-xl text-price-xl font-bold text-on-surface">32</span>
              <span className="font-label-sm text-label-sm text-on-surface-variant uppercase">
                Conteneurs en mer
              </span>
            </div>
            <div>
              <span className="block font-price-xl text-price-xl font-bold text-primary-container">
                1 420+
              </span>
              <span className="font-label-sm text-label-sm text-on-surface-variant uppercase">
                PME & Acheteurs actifs
              </span>
            </div>
            <div>
              <span className="block font-price-xl text-price-xl font-bold text-on-surface">-38%</span>
              <span className="font-label-sm text-label-sm text-on-surface-variant uppercase">
                Économie moyenne constatée
              </span>
            </div>
            <div>
              <span className="block font-price-xl text-price-xl font-bold text-on-surface">0 FCFA</span>
              <span className="font-label-sm text-label-sm text-on-surface-variant uppercase">
                Frais de dédouanement imprévus
              </span>
            </div>
          </div>
        </div>

        {/* Filter Control Bars */}
        <div className="space-y-4 mb-10">
          {/* Status Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            <span className="font-label-sm text-label-sm text-on-surface-variant font-bold uppercase shrink-0 mr-2">
              Statut :
            </span>
            {[
              { id: 'all', label: 'Tous' },
              { id: 'open', label: 'En cours / Ouvert' },
              { id: 'almost', label: 'Presque complet 🔥' },
              { id: 'last', label: 'Dernières places' },
              { id: 'transit', label: 'En transit vers Dakar', dot: true }
            ].map(st => (
              <button
                key={st.id}
                onClick={() => setSelectedStatus(st.id)}
                className={`px-4 py-2 rounded-full font-label-lg text-label-lg shrink-0 transition-colors cursor-pointer flex items-center gap-1.5 ${
                  selectedStatus === st.id
                    ? 'bg-inverse-surface text-inverse-on-surface font-bold'
                    : 'bg-surface-container hover:bg-surface-container-high text-on-surface font-semibold'
                }`}
              >
                {st.dot && <span className="w-2 h-2 rounded-full bg-primary-container" />}
                <span>{st.label}</span>
              </button>
            ))}
          </div>

          {/* Categories Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            <span className="font-label-sm text-label-sm text-on-surface-variant font-bold uppercase shrink-0 mr-2">
              Rayon :
            </span>
            {[
              { id: 'all', label: 'Toutes' },
              { id: 'auto', label: 'Auto & Mobilité ⚡' },
              { id: 'electronics', label: 'Électronique' },
              { id: 'home', label: 'Maison & Électroménager' },
              { id: 'fashion', label: 'Mode & Textile' },
              { id: 'machinery', label: 'Équipements & Machines' }
            ].map(cat => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-4 py-1.5 rounded-full font-label-md text-label-md shrink-0 transition-all cursor-pointer ${
                  selectedCategory === cat.id
                    ? 'bg-primary-container text-on-primary font-bold shadow-sm'
                    : 'bg-surface-container-low hover:bg-surface-container text-on-surface font-medium'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* SECTION FEATURED : Groupages Phares — Auto & Mobilité */}
        <div className="mb-12">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-6 gap-2">
            <div>
              <div className="flex items-center gap-2 font-label-sm text-label-sm text-primary-container font-bold uppercase tracking-wider mb-1">
                <span className="material-symbols-outlined text-[16px]">bolt</span>
                <span>Priorité Logistique Express</span>
              </div>
              <h2 className="font-headline-xl text-headline-xl text-on-surface font-extrabold tracking-tight">
                Groupages Phares — Auto & Mobilité
              </h2>
            </div>
            <p className="font-body-md text-body-md text-on-surface-variant max-w-sm text-left sm:text-right">
              Conteneurs sécurisés avec inspection usine certifiée SGS avant scellement maritime.
            </p>
          </div>

          {/* Featured Big Liquid Glass Panel */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Featured Item 1: Moto Électrique Urbaine 2000W */}
            <div className="bg-surface-container-lowest/90 backdrop-blur-2xl rounded-3xl p-6 sm:p-8 shadow-lg flex flex-col justify-between relative overflow-hidden group hover:shadow-xl transition-all border border-slate-100">
              <div className="absolute top-4 right-4 z-20 flex items-center gap-2">
                <span className="px-3 py-1 rounded-full bg-primary-container text-on-primary font-label-sm text-label-sm font-bold shadow-sm">
                  GROUPAGE PHARE
                </span>
                <span className="px-2.5 py-1 rounded-full bg-surface-container-highest text-on-surface font-label-sm text-label-sm font-bold flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px] text-primary">schedule</span> J-3
                </span>
              </div>

              <div
                onClick={() => navigate('/groupages/grp-moto')}
                className="relative w-full h-72 rounded-2xl overflow-hidden bg-surface-container-high mb-6 cursor-pointer"
              >
                <img
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  alt="Moto Électrique Urbaine 2000W"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuDWU-OKoPk35T1oNgpyanc7VmKy_1v1UuXspXMMQfgL0BUDaLJKabGlkNTS_HBkVu9EOGY-9oLSorfIVrNxx2DZ8KDUR0ggQR8W3RcWInNzlo--WICxPq13jUzsS74mcwSQbEaouK-4W3gluxSl5tTm3zDa5u-P7H9TaHlOiVHhzM2tXyZWURe4_NfC8YEtN-tJOKfRw1sYLPaK4g0AaXdQPJBknWzwuDvFkB_O0fVL_Q4LsEQ-A3uIzQ"
                />
                <div className="absolute bottom-3 left-3 flex gap-2 flex-wrap">
                  <span className="px-2.5 py-1 rounded-md bg-inverse-surface/80 backdrop-blur-md text-inverse-on-surface font-label-sm text-label-sm">
                    Autonomie 85 km
                  </span>
                  <span className="px-2.5 py-1 rounded-md bg-inverse-surface/80 backdrop-blur-md text-inverse-on-surface font-label-sm text-label-sm">
                    Batterie LFP Amovible
                  </span>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="font-label-sm text-label-sm text-primary-container font-bold uppercase tracking-wide">
                    Auto & Deux-Roues ⚡
                  </span>
                  <span className="font-body-sm text-body-sm text-on-surface-variant flex items-center gap-1">
                    <span className="material-symbols-outlined text-[16px]">anchor</span> Port de Ningbo
                  </span>
                </div>

                <h3
                  onClick={() => navigate('/groupages/grp-moto')}
                  className="font-headline-lg text-headline-lg text-on-surface font-bold mb-3 cursor-pointer hover:text-primary transition-colors"
                >
                  Moto Électrique Urbaine 2000W (Batterie LFP)
                </h3>

                {/* Price comparison */}
                <div className="bg-surface-container-low rounded-2xl p-4 mb-4 flex items-baseline justify-between">
                  <div>
                    <span className="font-label-sm text-label-sm text-on-surface-variant uppercase block">
                      Prix groupé rendu Dakar
                    </span>
                    <span className="font-price-xl text-price-xl text-primary-container font-extrabold">
                      480 000 FCFA
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="font-label-sm text-label-sm text-outline block line-through">
                      650 000 FCFA
                    </span>
                    <span className="font-label-md text-label-md text-primary font-bold bg-primary-fixed/40 px-2 py-0.5 rounded-full">
                      -26% Usine
                    </span>
                  </div>
                </div>

                {/* Progress Bar Gauge */}
                <div className="space-y-2 mb-6">
                  <div className="flex justify-between items-center font-label-md text-label-md">
                    <span className="text-on-surface font-bold">Quota conteneur : 42 / 50 réservés</span>
                    <span className="text-primary-container font-extrabold">84% complet</span>
                  </div>
                  <div className="w-full h-3 bg-surface-container-high rounded-full overflow-hidden p-0.5">
                    <div
                      className="h-full bg-gradient-to-r from-secondary-container to-primary-container rounded-full transition-all duration-700 shadow-sm"
                      style={{ width: '84%' }}
                    />
                  </div>
                  <div className="flex justify-between items-center font-body-sm text-body-sm text-on-surface-variant pt-1">
                    <span className="flex items-center gap-1 text-tertiary font-bold">
                      <span className="w-1.5 h-1.5 rounded-full bg-tertiary animate-ping" />
                      Plus que 8 unités disponibles
                    </span>
                    <span>Départ conteneur : 14 Juin</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => navigate('/groupages/grp-moto')}
                    className="w-full h-12 rounded-full bg-surface-container-low hover:bg-surface-container text-on-surface font-label-lg text-label-lg font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <span>Voir le dossier</span>
                    <span className="material-symbols-outlined text-[18px]">visibility</span>
                  </button>

                  <button
                    onClick={() =>
                      openModal(
                        'grp-moto',
                        'Moto Électrique Urbaine 2000W',
                        480000,
                        '480 000 FCFA',
                        '144 000 FCFA'
                      )
                    }
                    className="w-full h-12 rounded-full bg-primary-container text-on-primary font-label-lg text-label-lg font-bold shadow-md hover:bg-secondary-container hover:scale-[1.01] transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>Rejoindre</span>
                    <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Featured Item 2: Scooter Électrique Smart City 1200W */}
            <div className="bg-surface-container-lowest/90 backdrop-blur-2xl rounded-3xl p-6 sm:p-8 shadow-lg flex flex-col justify-between relative overflow-hidden group hover:shadow-xl transition-all border border-slate-100">
              <div className="absolute top-4 right-4 z-20 flex items-center gap-2">
                <span className="px-3 py-1 rounded-full bg-primary-container text-on-primary font-label-sm text-label-sm font-bold shadow-sm">
                  GROUPAGE PHARE
                </span>
                <span className="px-2.5 py-1 rounded-full bg-surface-container-highest text-on-surface font-label-sm text-label-sm font-bold flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px] text-primary">schedule</span> J-5
                </span>
              </div>

              <div
                onClick={() =>
                  openModal(
                    'grp-scooter-1200',
                    'Scooter Électrique Smart City 1200W',
                    395000,
                    '395 000 FCFA',
                    '118 500 FCFA'
                  )
                }
                className="relative w-full h-72 rounded-2xl overflow-hidden bg-surface-container-high mb-6 cursor-pointer"
              >
                <img
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  alt="Scooter Électrique Smart City 1200W"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuC3U48FLXKElDapqhQKR-dHWZUGu8_lJa4QbOhm2NVE9DUQlyFnLF0gNkiI4_Wk_udRM9yRd0P7UQBEwc6V9T1RvGeXEkX3cD87gZpk0CkIABZWe72zpOzqG2CuH_tPsbNBCaBlxBy0uYhkbdtvNHH99rlmZVMf1d4FF-HTWCOQhOcE4Lc-n0PijDGmIdgn2jkgFlJlQ8d8UVPG6Qyn9Z-8EfuNDotLbb7T1qz3OtXfGDQ6H5JdNW0MAg"
                />
                <div className="absolute bottom-3 left-3 flex gap-2 flex-wrap">
                  <span className="px-2.5 py-1 rounded-md bg-inverse-surface/80 backdrop-blur-md text-inverse-on-surface font-label-sm text-label-sm">
                    Vitesse max 50 km/h
                  </span>
                  <span className="px-2.5 py-1 rounded-md bg-inverse-surface/80 backdrop-blur-md text-inverse-on-surface font-label-sm text-label-sm">
                    Recharge 220V standard
                  </span>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="font-label-sm text-label-sm text-primary-container font-bold uppercase tracking-wide">
                    Auto & Deux-Roues ⚡
                  </span>
                  <span className="font-body-sm text-body-sm text-on-surface-variant flex items-center gap-1">
                    <span className="material-symbols-outlined text-[16px]">anchor</span> Port de Guangzhou
                  </span>
                </div>

                <h3 className="font-headline-lg text-headline-lg text-on-surface font-bold mb-3">
                  Scooter Électrique Smart City 1200W
                </h3>

                {/* Price comparison */}
                <div className="bg-surface-container-low rounded-2xl p-4 mb-4 flex items-baseline justify-between">
                  <div>
                    <span className="font-label-sm text-label-sm text-on-surface-variant uppercase block">
                      Prix groupé rendu Dakar
                    </span>
                    <span className="font-price-xl text-price-xl text-primary-container font-extrabold">
                      395 000 FCFA
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="font-label-sm text-label-sm text-outline block line-through">
                      520 000 FCFA
                    </span>
                    <span className="font-label-md text-label-md text-primary font-bold bg-primary-fixed/40 px-2 py-0.5 rounded-full">
                      -24% Usine
                    </span>
                  </div>
                </div>

                {/* Progress Bar Gauge */}
                <div className="space-y-2 mb-6">
                  <div className="flex justify-between items-center font-label-md text-label-md">
                    <span className="text-on-surface font-bold">Quota conteneur : 38 / 50 réservés</span>
                    <span className="text-primary-container font-extrabold">76% complet</span>
                  </div>
                  <div className="w-full h-3 bg-surface-container-high rounded-full overflow-hidden p-0.5">
                    <div
                      className="h-full bg-gradient-to-r from-secondary-container to-primary-container rounded-full transition-all duration-700 shadow-sm"
                      style={{ width: '76%' }}
                    />
                  </div>
                  <div className="flex justify-between items-center font-body-sm text-body-sm text-on-surface-variant pt-1">
                    <span className="flex items-center gap-1 text-on-surface font-semibold">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary-container" />
                      12 unités restantes pour valider l'envoi
                    </span>
                    <span>Clôture : 18 Juin</span>
                  </div>
                </div>

                <button
                  onClick={() =>
                    openModal(
                      'grp-scooter-1200',
                      'Scooter Électrique Smart City 1200W',
                      395000,
                      '395 000 FCFA',
                      '118 500 FCFA'
                    )
                  }
                  className="w-full h-12 rounded-full bg-primary-container text-on-primary font-label-lg text-label-lg font-bold shadow-md hover:bg-secondary-container hover:scale-[1.01] transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Rejoindre le groupage</span>
                  <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Grille de Groupages en Cours (6 Cartes en verre dépoli) */}
        <div className="mb-14">
          <div className="flex items-center justify-between mb-6">
            <div>
              <span className="font-label-sm text-label-sm text-on-surface-variant uppercase font-bold tracking-wider">
                Catalogue Actif
              </span>
              <h2 className="font-headline-xl text-headline-xl text-on-surface font-extrabold">
                Commandes Groupées Ouvertes
              </h2>
            </div>
            <div className="hidden sm:flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <span className="font-label-md text-label-md text-on-surface font-medium">
                Conteneurs en cours de constitution pour Dakar
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCards.map(card => (
              <div
                key={card.id}
                className="bg-surface-container-lowest/85 backdrop-blur-xl rounded-2xl p-5 shadow-sm hover:shadow-lg transition-all flex flex-col justify-between border border-slate-100 group"
              >
                <div>
                  <div className="relative h-52 w-full rounded-xl overflow-hidden bg-surface-container-high mb-4">
                    <img
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      src={card.image}
                      alt={card.title}
                    />
                    <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                      <span className="px-2 py-0.5 rounded-full bg-primary-container text-on-primary font-label-sm text-label-sm font-bold shadow-sm">
                        GROUPAGE
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-surface-container-lowest/90 backdrop-blur-md text-on-surface font-label-sm text-label-sm font-semibold">
                        {card.categoryLabel}
                      </span>
                    </div>
                    <div className="absolute bottom-2.5 right-2.5 px-2 py-0.5 rounded-md bg-inverse-surface/85 text-inverse-on-surface font-label-sm text-label-sm font-medium">
                      MOQ {card.moq} pcs
                    </div>
                  </div>

                  <div className="flex items-baseline justify-between mb-1">
                    <h3 className="font-headline-sm text-headline-sm text-on-surface font-bold truncate pr-2">
                      {card.title}
                    </h3>
                    <span className="font-label-md text-label-md text-outline line-through shrink-0">
                      {card.oldPriceXOF.toLocaleString('fr-FR')} F
                    </span>
                  </div>

                  <div className="flex items-center justify-between mb-3">
                    <span className="font-price-xl text-price-xl text-primary-container font-extrabold">
                      {card.priceXOF.toLocaleString('fr-FR')} FCFA
                    </span>
                    <span className="font-label-sm text-label-sm bg-primary-fixed/30 text-on-primary-fixed font-bold px-2 py-0.5 rounded-full">
                      Éco {card.discount}
                    </span>
                  </div>

                  {/* Gauge */}
                  <div className="space-y-1.5 mb-4">
                    <div className="flex justify-between font-label-md text-label-md">
                      <span className="text-on-surface-variant">
                        Réservé : <strong className="text-on-surface">{card.reserved} / {card.moq}</strong> ({card.progress}%)
                      </span>
                      <span className="text-primary-container font-bold">{card.remaining} restants</span>
                    </div>
                    <div className="w-full h-2 bg-surface-container-high rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary-container rounded-full"
                        style={{ width: `${card.progress}%` }}
                      />
                    </div>
                    <div className="flex justify-between items-center font-body-sm text-body-sm text-on-surface-variant pt-1">
                      <span>
                        Clôture : <strong className="text-on-surface">{card.deadline}</strong>
                      </span>
                      <span className="text-primary-container font-medium">{card.note}</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() =>
                    openModal(
                      card.id,
                      card.title,
                      card.priceXOF,
                      `${card.priceXOF.toLocaleString('fr-FR')} FCFA`,
                      `${Math.round(card.priceXOF * 0.3).toLocaleString('fr-FR')} FCFA`
                    )
                  }
                  className="w-full h-11 rounded-full bg-surface-container hover:bg-primary-container hover:text-on-primary text-on-surface font-label-md text-label-md font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <span>Rejoindre le groupage</span>
                  <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Encadré réassurance : 3 Blocs d'explication */}
        <div className="bg-surface-container-lowest/90 backdrop-blur-2xl rounded-3xl p-6 sm:p-10 shadow-sm border border-slate-100 mb-10">
          <div className="max-w-2xl mb-8">
            <span className="font-label-sm text-label-sm text-primary-container font-bold uppercase tracking-wider">
              Sécurité Commerciale Maximale
            </span>
            <h2 className="font-headline-xl text-headline-xl text-on-surface font-extrabold mt-1">
              Comment fonctionne un achat groupé Dallou Chine ?
            </h2>
            <p className="font-body-md text-body-md text-on-surface-variant mt-2">
              Nous éliminons tous les risques inhérents à l'importation directe en structurant contractuellement chaque lot d'acheteurs.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            {/* Step 1 */}
            <div className="flex flex-col">
              <div className="w-12 h-12 rounded-2xl bg-primary-fixed flex items-center justify-center text-on-primary-fixed font-headline-sm font-bold mb-4 shadow-sm">
                01
              </div>
              <h3 className="font-headline-sm text-headline-sm text-on-surface font-bold mb-2">
                1. Vous réservez sans risque
              </h3>
              <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">
                Vous bloquez votre quota par un acompte sécurisé de 30%. Si le seuil MOQ n'est pas atteint à la date limite, vous êtes remboursé intégralement sans aucune pénalité ni frais cachés.
              </p>
              <div className="mt-4 flex items-center gap-2 text-primary font-label-md text-label-md font-semibold">
                <span className="material-symbols-outlined text-[18px]">verified</span>
                <span>Garantie de remboursement 100%</span>
              </div>
            </div>

            {/* Step 2 */}
            <div className="flex flex-col">
              <div className="w-12 h-12 rounded-2xl bg-secondary-fixed flex items-center justify-center text-on-secondary-fixed font-headline-sm font-bold mb-4 shadow-sm">
                02
              </div>
              <h3 className="font-headline-sm text-headline-sm text-on-surface font-bold mb-2">
                2. Quota validé & Inspection usine
              </h3>
              <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">
                Dès l'atteinte du quota, notre équipe sur place à Ningbo ou Guangzhou effectue l'audit qualité physique, vérifie les spécifications techniques et supervise le chargement dans le conteneur scellé.
              </p>
              <div className="mt-4 flex items-center gap-2 text-primary font-label-md text-label-md font-semibold">
                <span className="material-symbols-outlined text-[18px]">fact_check</span>
                <span>Rapport photo & vidéo fourni</span>
              </div>
            </div>

            {/* Step 3 */}
            <div className="flex flex-col">
              <div className="w-12 h-12 rounded-2xl bg-primary-container text-on-primary flex items-center justify-center font-headline-sm font-bold mb-4 shadow-sm">
                03
              </div>
              <h3 className="font-headline-sm text-headline-sm text-on-surface font-bold mb-2">
                3. Expédition maritime & Port de Dakar
              </h3>
              <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">
                Le navire lève l'ancre vers Dakar. Dallou Chine prend en charge l'ensemble du transit maritime, le dédouanement et la mise à disposition dans nos entrepôts des Almadies ou livraison à votre porte.
              </p>
              <div className="mt-4 flex items-center gap-2 text-primary font-label-md text-label-md font-semibold">
                <span className="material-symbols-outlined text-[18px]">local_shipping</span>
                <span>Suivi GPS temps réel du cargo</span>
              </div>
            </div>
          </div>

          {/* FAQ quick strip */}
          <div className="mt-10 pt-6 border-t border-surface-container-high/60 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center text-on-surface">
                <span className="material-symbols-outlined text-[20px]">help_outline</span>
              </div>
              <div>
                <span className="block font-label-lg text-label-lg text-on-surface font-bold">
                  Vous avez un produit spécifique à proposer en groupage ?
                </span>
                <span className="font-body-sm text-body-sm text-on-surface-variant">
                  Ouvrez une initiative avec votre réseau et laissez-nous négocier l'usine.
                </span>
              </div>
            </div>

            <button
              onClick={() => navigate('/sourcing')}
              className="px-5 py-2.5 rounded-full bg-surface-container hover:bg-surface-container-high text-on-surface font-label-lg text-label-lg font-bold shrink-0 transition-colors flex items-center gap-2 cursor-pointer"
            >
              <span>Initier un nouveau groupage</span>
              <span className="material-symbols-outlined text-[18px]">add_circle</span>
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default GroupagesPage;
