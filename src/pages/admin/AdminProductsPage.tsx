import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Product, TransportMode } from '../../types';
import { computeCostAndProfitability } from '../../services/calculationEngine';
import {
  Package,
  Plus,
  Search,
  Layers,
  Edit2,
  Copy,
  Trash2,
  ExternalLink,
  ChevronRight,
  ChevronLeft,
  X,
  CheckCircle2,
  Plane,
  Ship,
  Sparkles,
  DollarSign,
  TrendingUp,
  Tag,
  Eye,
  Info
} from 'lucide-react';

export const AdminProductsPage: React.FC = () => {
  const {
    products,
    addProduct,
    updateProduct,
    deleteProduct,
    suppliers,
    carriers,
    calcSettings,
    addGroupage,
    navigate,
    showToast
  } = useApp();

  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  // Drawer for fast Level 2 inspection
  const [inspectProduct, setInspectProduct] = useState<Product | null>(null);

  // Modal Wizard in 6 steps for creation / edition
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState<number>(1);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    category: 'Électronique & High-Tech',
    shortDescription: '',
    fullDescription: '',
    images: ['https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80'],
    supplierId: suppliers[0]?.id || '',
    supplierPlatform: '1688',
    supplierUrl: 'https://detail.1688.com/offer/71829104.html',
    basePriceCNY: 85,
    basePriceUSD: 12,
    moq: 10,
    unitWeightKg: 0.85,
    lengthCm: 20,
    widthCm: 15,
    heightCm: 10,
    defaultTransportMode: 'air' as TransportMode,
    selectedCarrierId: carriers[0]?.id || '',
    estimatedDeliveryDays: '12-18 jours',
    targetMarginPercent: 35,
    priceXOF: 24500,
    stockStatus: 'in_stock' as Product['stockStatus'],
    isGroupage: false,
    publicationStatus: 'published'
  });

  const [calculationPreview, setCalculationPreview] = useState<{
    totalUnitCostXOF: number;
    suggestedUnitPriceXOF: number;
    unitMarginXOF: number;
    actualMarginPercent: number;
  } | null>(null);

  const resetForm = () => {
    setFormData({
      name: '',
      slug: '',
      category: 'Électronique & High-Tech',
      shortDescription: '',
      fullDescription: '',
      images: ['https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80'],
      supplierId: suppliers[0]?.id || '',
      supplierPlatform: '1688',
      supplierUrl: 'https://detail.1688.com/offer/71829104.html',
      basePriceCNY: 85,
      basePriceUSD: 12,
      moq: 10,
      unitWeightKg: 0.85,
      lengthCm: 20,
      widthCm: 15,
      heightCm: 10,
      defaultTransportMode: 'air',
      selectedCarrierId: carriers[0]?.id || '',
      estimatedDeliveryDays: '12-18 jours',
      targetMarginPercent: 35,
      priceXOF: 24500,
      stockStatus: 'in_stock',
      isGroupage: false,
      publicationStatus: 'published'
    });
    setCalculationPreview(null);
    setEditingProductId(null);
    setCurrentStep(1);
  };

  const handleOpenCreateModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (p: Product) => {
    setEditingProductId(p.id);
    setFormData({
      name: p.name,
      slug: p.slug,
      category: p.category,
      shortDescription: p.shortDescription || '',
      fullDescription: p.fullDescription || '',
      images: p.images,
      supplierId: p.supplierId,
      supplierPlatform: '1688',
      supplierUrl: 'https://detail.1688.com/offer/71829104.html',
      basePriceCNY: p.basePriceCNY,
      basePriceUSD: p.basePriceUSD,
      moq: p.moq,
      unitWeightKg: p.unitWeightKg,
      lengthCm: p.dimensionsCm.length,
      widthCm: p.dimensionsCm.width,
      heightCm: p.dimensionsCm.height,
      defaultTransportMode: p.defaultTransportMode,
      selectedCarrierId: carriers[0]?.id || '',
      estimatedDeliveryDays: p.estimatedDeliveryDays,
      targetMarginPercent: p.targetMarginPercent,
      priceXOF: p.priceXOF,
      stockStatus: p.stockStatus,
      isGroupage: p.isGroupage,
      publicationStatus: 'published'
    });
    runCalculation({
      basePriceCNY: p.basePriceCNY,
      unitWeightKg: p.unitWeightKg,
      lengthCm: p.dimensionsCm.length,
      widthCm: p.dimensionsCm.width,
      heightCm: p.dimensionsCm.height,
      targetMarginPercent: p.targetMarginPercent
    });
    setCurrentStep(1);
    setIsModalOpen(true);
  };

  const runCalculation = (overrides?: Partial<typeof formData>) => {
    const data = { ...formData, ...overrides };
    const carrier = carriers.find(c => c.id === data.selectedCarrierId) || carriers[0];

    const result = computeCostAndProfitability(
      {
        productPriceCNY: data.basePriceCNY,
        quantity: Math.max(1, data.moq),
        weightKgPerUnit: data.unitWeightKg,
        lengthCm: data.lengthCm,
        widthCm: data.widthCm,
        heightCm: data.heightCm,
        exchangeRateCNY_XOF: calcSettings.exchangeRateCNY_XOF,
        exchangeRateUSD_XOF: calcSettings.exchangeRateUSD_XOF,
        sourcingFeePercent: calcSettings.defaultSourcingFeePercent,
        sourcerInspectionFixedXOF: calcSettings.defaultInspectionFeeXOF,
        consolidationFeePerCbmXOF: calcSettings.defaultConsolidationCbmFeeXOF,
        consolidationHandlingFixedXOF: calcSettings.defaultConsolidationFixedFeeXOF,
        selectedCarrierId: data.selectedCarrierId,
        customsClearanceRatePercent: calcSettings.defaultCustomsClearancePercent,
        customsFixedPerShipmentXOF: calcSettings.defaultCustomsFixedFeeXOF,
        safetyBufferPercent: calcSettings.defaultSafetyBufferPercent,
        targetMarginPercent: data.targetMarginPercent,
        minMarginPercent: calcSettings.defaultMinMarginPercent
      },
      carrier
    );

    setCalculationPreview({
      totalUnitCostXOF: result.totalUnitCostXOF,
      suggestedUnitPriceXOF: result.suggestedUnitPriceXOF,
      unitMarginXOF: result.unitMarginXOF,
      actualMarginPercent: result.actualMarginPercent
    });

    setFormData(prev => ({
      ...prev,
      priceXOF: result.suggestedUnitPriceXOF
    }));
  };

  const handleSaveProduct = () => {
    if (!formData.name.trim()) {
      showToast('error', 'Champ requis', 'Veuillez saisir un nom pour le produit.');
      return;
    }

    const cbm = (formData.lengthCm * formData.widthCm * formData.heightCm) / 1_000_000;
    const slug = formData.slug || (formData.name || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    if (editingProductId) {
      updateProduct(editingProductId, {
        name: formData.name,
        slug,
        category: formData.category,
        shortDescription: formData.shortDescription,
        fullDescription: formData.fullDescription,
        images: formData.images,
        supplierId: formData.supplierId,
        basePriceCNY: Number(formData.basePriceCNY),
        basePriceUSD: Number(formData.basePriceUSD),
        priceXOF: Number(formData.priceXOF),
        moq: Number(formData.moq),
        unitWeightKg: Number(formData.unitWeightKg),
        dimensionsCm: {
          length: Number(formData.lengthCm),
          width: Number(formData.widthCm),
          height: Number(formData.heightCm)
        },
        cbm,
        defaultTransportMode: formData.defaultTransportMode,
        targetMarginPercent: Number(formData.targetMarginPercent),
        stockStatus: formData.stockStatus,
        isGroupage: formData.isGroupage
      });
      showToast('success', 'Produit mis à jour', `${formData.name} a été actualisé.`);
    } else {
      addProduct({
        slug,
        name: formData.name,
        category: formData.category,
        images: formData.images,
        shortDescription: formData.shortDescription,
        fullDescription: formData.fullDescription,
        specifications: { 'Garantie': '1 An Usine', 'Origine': 'Chine (Guangdong/Zhejiang)' },
        features: ['Testé et approuvé en usine', 'Contrôle qualité SinoSenegal', 'Livraison sécurisée Hub Dakar'],
        unitWeightKg: Number(formData.unitWeightKg),
        dimensionsCm: {
          length: Number(formData.lengthCm),
          width: Number(formData.widthCm),
          height: Number(formData.heightCm)
        },
        cbm,
        moq: Number(formData.moq),
        basePriceCNY: Number(formData.basePriceCNY),
        basePriceUSD: Number(formData.basePriceUSD),
        priceXOF: Number(formData.priceXOF),
        isGroupage: formData.isGroupage,
        supplierId: formData.supplierId,
        defaultTransportMode: formData.defaultTransportMode,
        estimatedDeliveryDays: formData.estimatedDeliveryDays,
        stockStatus: formData.stockStatus,
        targetMarginPercent: Number(formData.targetMarginPercent),
        rating: 4.8,
        reviewsCount: 1,
        tags: ['Nouveauté', 'Direct Usine']
      });
      showToast('success', 'Nouveau produit créé', `${formData.name} est disponible.`);
    }

    setIsModalOpen(false);
  };

  const handleDuplicateProduct = (p: Product) => {
    addProduct({
      ...p,
      name: `${p.name} (Copie)`,
      slug: `${p.slug}-copie-${Date.now().toString().slice(-4)}`
    });
    showToast('info', 'Produit dupliqué', 'Une copie a été ajoutée au catalogue.');
  };

  const handleCreateGroupBuyFromProduct = (p: Product) => {
    const discountPrice = Math.round(p.priceXOF * 0.72);
    addGroupage({
      code: `GRP-0${Math.floor(27 + Math.random() * 70)}`,
      title: `Groupage Spécial : ${p.name}`,
      productId: p.id,
      unitPriceXOF: discountPrice,
      originalPriceXOF: p.priceXOF,
      targetUnits: 50,
      currentUnits: 1,
      participantsCount: 1,
      startDate: new Date().toISOString().split('T')[0],
      closingDate: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
      estimatedDepartureDate: new Date(Date.now() + 18 * 86400000).toISOString().split('T')[0],
      estimatedArrivalDate: new Date(Date.now() + 35 * 86400000).toISOString().split('T')[0],
      transportMode: p.defaultTransportMode,
      status: 'open',
      minOrderPerUser: 1,
      maxOrderPerUser: 10,
      savingsPercent: 28,
      logisticsRoute: 'Guangzhou / Yiwu ➔ Hub Dakar',
      guaranteeNote: 'Remboursement garanti si quota non atteint',
      keyBenefits: ['Tarif négocié usine', 'Contrôle qualité 100%', 'Dédouanement inclus']
    });
    showToast('success', 'Groupage créé', `Campagne lancée pour ${p.name}`);
    navigate('/admin/groupages');
  };

  // Filtered Products
  const filteredProducts = products.filter(p => {
    const searchLower = (search || '').toLowerCase();
    const matchSearch =
      (p?.name || '').toLowerCase().includes(searchLower) ||
      (p?.category || '').toLowerCase().includes(searchLower);
    const matchCategory = selectedCategory === 'all' || p.category === selectedCategory;
    const matchStatus = selectedStatus === 'all' || p.stockStatus === selectedStatus;
    return matchSearch && matchCategory && matchStatus;
  });

  const categories = Array.from(new Set((products || []).map(p => p.category)));

  const wizardSteps = [
    { step: 1, title: 'Informations' },
    { step: 2, title: 'Fournisseur' },
    { step: 3, title: 'Produit' },
    { step: 4, title: 'Logistique' },
    { step: 5, title: 'Prix' },
    { step: 6, title: 'Publication' }
  ];

  return (
    <div className="space-y-6">
      {/* 1. TOP HEADER: Single primary action & count */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#0a1945] p-5 rounded-3xl border border-blue-900/40 shadow-xl">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-black text-white tracking-tight">Catalogue Produits</h1>
            <span className="bg-blue-500/20 text-blue-300 border border-blue-500/30 text-xs px-2.5 py-0.5 rounded-full font-bold">
              {products.length} articles
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Gérez vos références d'importation Chine, leurs coûts de revient et marges.
          </p>
        </div>

        {/* PRIMARY ACTION */}
        <button
          onClick={handleOpenCreateModal}
          className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-2xl bg-[#FF4500] hover:bg-[#E03D00] text-white font-bold text-xs shadow-lg shadow-orange-500/25 transition-all self-start sm:self-auto shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Ajouter un produit</span>
        </button>
      </div>

      {/* 2. SEARCH & FILTERS BAR */}
      <div className="flex flex-col md:flex-row gap-3 items-center justify-between bg-[#0B192C] p-3 rounded-2xl border border-orange-500/20">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Rechercher par nom..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-[#FF4500]"
          />
        </div>

        {/* Category & Status pills */}
        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0 custom-scrollbar">
          <select
            value={selectedCategory}
            onChange={e => setSelectedCategory(e.target.value)}
            className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs text-slate-200 focus:outline-none focus:border-[#FF4500]"
          >
            <option value="all" className="bg-[#0B192C]">Toutes catégories</option>
            {categories.map(cat => (
              <option key={cat} value={cat} className="bg-[#0B192C]">{cat}</option>
            ))}
          </select>

          <select
            value={selectedStatus}
            onChange={e => setSelectedStatus(e.target.value)}
            className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs text-slate-200 focus:outline-none focus:border-[#FF4500]"
          >
            <option value="all" className="bg-[#0B192C]">Tous statuts</option>
            <option value="in_stock" className="bg-[#0B192C]">En stock</option>
            <option value="preorder" className="bg-[#0B192C]">Sur commande</option>
            <option value="out_of_stock" className="bg-[#0B192C]">Rupture</option>
          </select>
        </div>
      </div>

      {/* 3. PRODUCTS TABLE (LEVEL 1 INFO ONLY: Image, Nom, Prix, Marge, Commandes, Statut) */}
      <div className="bg-[#0a1945] rounded-3xl border border-blue-900/40 shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-blue-900/50 bg-[#071330] text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                <th className="py-3 px-4">Produit</th>
                <th className="py-3 px-4">Prix Vente</th>
                <th className="py-3 px-4">Marge Cible</th>
                <th className="py-3 px-4">Transport</th>
                <th className="py-3 px-4">Statut</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-blue-900/30 text-slate-200">
              {filteredProducts.map(p => (
                <tr
                  key={p.id}
                  onClick={() => setInspectProduct(p)}
                  className="hover:bg-white/5 cursor-pointer transition-colors group"
                >
                  {/* Product Info */}
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3 min-w-[220px]">
                      <img
                        src={p.images[0] || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=200'}
                        alt=""
                        className="w-10 h-10 rounded-xl object-cover border border-white/10 shrink-0"
                      />
                      <div className="min-w-0">
                        <div className="font-bold text-white group-hover:text-blue-300 transition-colors truncate">
                          {p.name}
                        </div>
                        <div className="text-[10px] text-slate-400 truncate">{p.category}</div>
                      </div>
                    </div>
                  </td>

                  {/* Prix */}
                  <td className="py-3 px-4 font-mono-numeric font-bold text-white whitespace-nowrap">
                    {(p.priceXOF || 0).toLocaleString('fr-FR')} FCFA
                  </td>

                  {/* Marge */}
                  <td className="py-3 px-4 whitespace-nowrap">
                    <span className="text-emerald-400 font-bold font-mono">
                      +{p.targetMarginPercent}%
                    </span>
                  </td>

                  {/* Transport */}
                  <td className="py-3 px-4 whitespace-nowrap">
                    <span className="inline-flex items-center gap-1 text-[11px] text-slate-300">
                      {p.defaultTransportMode === 'air' ? (
                        <>
                          <Plane className="w-3.5 h-3.5 text-blue-400" />
                          <span>Aérien</span>
                        </>
                      ) : (
                        <>
                          <Ship className="w-3.5 h-3.5 text-cyan-400" />
                          <span>Maritime</span>
                        </>
                      )}
                    </span>
                  </td>

                  {/* Statut */}
                  <td className="py-3 px-4 whitespace-nowrap">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold inline-block ${
                      p.stockStatus === 'in_stock'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : p.stockStatus === 'preorder'
                        ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                        : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                    }`}>
                      {p.stockStatus === 'in_stock' ? 'En stock' : p.stockStatus === 'preorder' ? 'Sur commande' : 'Rupture'}
                    </span>
                  </td>

                  {/* Actions */}
                  <td className="py-3 px-4 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-1" onClick={e => e.stopPropagation()}>
                      <button
                        onClick={() => handleOpenEditModal(p)}
                        className="p-1.5 rounded-lg bg-white/5 hover:bg-blue-600/30 text-slate-300 hover:text-white transition-colors"
                        title="Modifier"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDuplicateProduct(p)}
                        className="p-1.5 rounded-lg bg-white/5 hover:bg-emerald-600/30 text-slate-300 hover:text-white transition-colors"
                        title="Dupliquer"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => deleteProduct(p.id)}
                        className="p-1.5 rounded-lg bg-white/5 hover:bg-rose-600/30 text-slate-300 hover:text-rose-300 transition-colors"
                        title="Supprimer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. DRAWER PREVIEW FOR FAST LEVEL 2 INSPECTION */}
      {inspectProduct && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex justify-end">
          <div className="w-full max-w-md bg-[#0a1945] h-full shadow-2xl border-l border-blue-900/50 p-6 flex flex-col justify-between overflow-y-auto animate-in slide-in-from-right duration-200">
            <div className="space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-blue-900/40">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Aperçu Rapide</span>
                <button
                  onClick={() => setInspectProduct(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <img
                src={inspectProduct.images[0] || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=200'}
                alt=""
                className="w-full h-48 rounded-2xl object-cover border border-white/10"
              />

              <div>
                <span className="text-xs font-semibold text-blue-400">{inspectProduct.category}</span>
                <h2 className="text-lg font-black text-white mt-0.5">{inspectProduct.name}</h2>
                <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                  {inspectProduct.shortDescription || 'Produit d\'importation directe avec contrôle qualité et acheminement vers le Hub SinoSenegal.'}
                </p>
              </div>

              {/* Specs Grid */}
              <div className="grid grid-cols-2 gap-3 p-4 rounded-2xl bg-white/5 text-xs">
                <div>
                  <span className="text-slate-400 block text-[10px]">Prix Vente</span>
                  <strong className="text-white font-mono">{(inspectProduct.priceXOF || 0).toLocaleString('fr-FR')} FCFA</strong>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Marge Cible</span>
                  <strong className="text-emerald-400 font-mono">+{inspectProduct.targetMarginPercent}%</strong>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Prix Usine Chine</span>
                  <strong className="text-slate-200 font-mono">{inspectProduct.basePriceCNY} CNY (~{(((inspectProduct.basePriceCNY || 0) * 88.5) || 0).toLocaleString('fr-FR')} F)</strong>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Poids Unitaire</span>
                  <strong className="text-slate-200 font-mono">{inspectProduct.unitWeightKg} kg</strong>
                </div>
              </div>

              <div className="space-y-2">
                <button
                  onClick={() => {
                    handleCreateGroupBuyFromProduct(inspectProduct);
                    setInspectProduct(null);
                  }}
                  className="w-full py-2.5 rounded-xl bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 border border-cyan-500/30 font-bold text-xs flex items-center justify-center gap-2 transition-all"
                >
                  <Layers className="w-4 h-4" />
                  <span>Lancer un groupage sur ce produit</span>
                </button>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="pt-4 border-t border-blue-900/40 flex items-center justify-between gap-3">
              <button
                onClick={() => {
                  handleOpenEditModal(inspectProduct);
                  setInspectProduct(null);
                }}
                className="flex-1 py-2.5 rounded-xl bg-[#FF4500] hover:bg-[#E03D00] text-white font-bold text-xs transition-all flex items-center justify-center gap-1.5"
              >
                <Edit2 className="w-4 h-4" />
                <span>Modifier la fiche</span>
              </button>
              <button
                onClick={() => {
                  navigate(`/products/${inspectProduct.slug || inspectProduct.id}`);
                  setInspectProduct(null);
                }}
                className="py-2.5 px-3 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white text-xs font-bold border border-white/10"
                title="Voir sur le site public"
              >
                <ExternalLink className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. 6-STEP WIZARD MODAL FOR CREATION / EDITING */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="w-full max-w-2xl bg-[#0B192C] rounded-3xl border border-orange-500/20 shadow-2xl p-6 space-y-6 animate-in zoom-in-95 duration-150 my-auto">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div>
                <h3 className="text-base font-black text-white">
                  {editingProductId ? 'Modifier le produit' : 'Création Produit en 6 étapes'}
                </h3>
                <p className="text-xs text-slate-400">Étape {currentStep} sur 6 : {wizardSteps[currentStep - 1].title}</p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Step Progress Bar (1 -> 6) */}
            <div className="grid grid-cols-6 gap-1.5 text-center">
              {wizardSteps.map(ws => (
                <div key={ws.step} className="space-y-1">
                  <div
                    className={`h-1.5 rounded-full transition-all ${
                      ws.step === currentStep
                        ? 'bg-[#FF4500]'
                        : ws.step < currentStep
                        ? 'bg-emerald-500'
                        : 'bg-slate-800'
                    }`}
                  />
                  <span className={`text-[10px] font-bold block truncate ${
                    ws.step === currentStep ? 'text-white' : ws.step < currentStep ? 'text-emerald-400' : 'text-slate-500'
                  }`}>
                    {ws.step}. {ws.title}
                  </span>
                </div>
              ))}
            </div>

            {/* Step Content */}
            <div className="py-2 min-h-[260px] flex flex-col justify-center">
              {/* STEP 1: INFORMATIONS */}
              {currentStep === 1 && (
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-slate-300 block mb-1">Nom du produit *</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={e => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Ex: Montre Connectée AMOLED V8"
                      className="w-full p-2.5 rounded-xl bg-white/5 border border-white/10 text-xs text-white focus:outline-none focus:border-[#FF4500]"
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-bold text-slate-300 block mb-1">Catégorie</label>
                      <select
                        value={formData.category}
                        onChange={e => setFormData({ ...formData, category: e.target.value })}
                        className="w-full p-2.5 rounded-xl bg-[#0B192C] border border-white/10 text-xs text-white focus:outline-none focus:border-[#FF4500]"
                      >
                        <option value="Électronique & High-Tech">Électronique & High-Tech</option>
                        <option value="Maison, Cuisine & Électroménager">Maison, Cuisine & Électroménager</option>
                        <option value="Mode, Maroquinerie & Montres">Mode, Maroquinerie & Montres</option>
                        <option value="Beauté, Bien-être & Cosmétiques">Beauté, Bien-être & Cosmétiques</option>
                        <option value="Outillage & Industrie">Outillage & Industrie</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-300 block mb-1">Image URL</label>
                      <input
                        type="text"
                        value={formData.images[0]}
                        onChange={e => setFormData({ ...formData, images: [e.target.value] })}
                        placeholder="https://..."
                        className="w-full p-2.5 rounded-xl bg-white/5 border border-white/10 text-xs text-white focus:outline-none focus:border-[#FF4500]"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-300 block mb-1">Brève Description</label>
                    <textarea
                      rows={2}
                      value={formData.shortDescription}
                      onChange={e => setFormData({ ...formData, shortDescription: e.target.value })}
                      placeholder="Description accrocheuse pour le catalogue..."
                      className="w-full p-2.5 rounded-xl bg-white/5 border border-white/10 text-xs text-white focus:outline-none focus:border-[#FF4500]"
                    />
                  </div>
                </div>
              )}

              {/* STEP 2: FOURNISSEUR */}
              {currentStep === 2 && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-bold text-slate-300 block mb-1">Fournisseur Usine</label>
                      <select
                        value={formData.supplierId}
                        onChange={e => setFormData({ ...formData, supplierId: e.target.value })}
                        className="w-full p-2.5 rounded-xl bg-[#0B192C] border border-white/10 text-xs text-white focus:outline-none focus:border-[#FF4500]"
                      >
                        {suppliers.map(s => (
                          <option key={s.id} value={s.id}>{s.name} ({s.city})</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-300 block mb-1">Prix Usine (RMB / CNY)</label>
                      <input
                        type="number"
                        value={formData.basePriceCNY}
                        onChange={e => {
                          const val = Number(e.target.value);
                          setFormData({ ...formData, basePriceCNY: val });
                          runCalculation({ basePriceCNY: val });
                        }}
                        className="w-full p-2.5 rounded-xl bg-white/5 border border-white/10 text-xs text-white font-mono focus:outline-none focus:border-[#FF4500]"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-300 block mb-1">Lien fiche 1688 / Usine</label>
                    <input
                      type="text"
                      value={formData.supplierUrl}
                      onChange={e => setFormData({ ...formData, supplierUrl: e.target.value })}
                      placeholder="https://detail.1688.com/..."
                      className="w-full p-2.5 rounded-xl bg-white/5 border border-white/10 text-xs text-white focus:outline-none focus:border-[#FF4500]"
                    />
                  </div>
                </div>
              )}

              {/* STEP 3: PRODUIT (POIDS & DIMENSIONS) */}
              {currentStep === 3 && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-bold text-slate-300 block mb-1">Poids unitaire (kg)</label>
                      <input
                        type="number"
                        step="0.05"
                        value={formData.unitWeightKg}
                        onChange={e => {
                          const val = Number(e.target.value);
                          setFormData({ ...formData, unitWeightKg: val });
                          runCalculation({ unitWeightKg: val });
                        }}
                        className="w-full p-2.5 rounded-xl bg-white/5 border border-white/10 text-xs text-white font-mono focus:outline-none focus:border-[#FF4500]"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-300 block mb-1">Quantité minimale (MOQ)</label>
                      <input
                        type="number"
                        value={formData.moq}
                        onChange={e => setFormData({ ...formData, moq: Number(e.target.value) })}
                        className="w-full p-2.5 rounded-xl bg-white/5 border border-white/10 text-xs text-white font-mono focus:outline-none focus:border-[#FF4500]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-300 block mb-1">Dimensions carton (L x l x h en cm)</label>
                    <div className="grid grid-cols-3 gap-2">
                      <input
                        type="number"
                        placeholder="L (cm)"
                        value={formData.lengthCm}
                        onChange={e => {
                          const val = Number(e.target.value);
                          setFormData({ ...formData, lengthCm: val });
                          runCalculation({ lengthCm: val });
                        }}
                        className="p-2 rounded-xl bg-white/5 border border-white/10 text-xs text-white font-mono text-center"
                      />
                      <input
                        type="number"
                        placeholder="l (cm)"
                        value={formData.widthCm}
                        onChange={e => {
                          const val = Number(e.target.value);
                          setFormData({ ...formData, widthCm: val });
                          runCalculation({ widthCm: val });
                        }}
                        className="p-2 rounded-xl bg-white/5 border border-white/10 text-xs text-white font-mono text-center"
                      />
                      <input
                        type="number"
                        placeholder="h (cm)"
                        value={formData.heightCm}
                        onChange={e => {
                          const val = Number(e.target.value);
                          setFormData({ ...formData, heightCm: val });
                          runCalculation({ heightCm: val });
                        }}
                        className="p-2 rounded-xl bg-white/5 border border-white/10 text-xs text-white font-mono text-center"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 4: LOGISTIQUE */}
              {currentStep === 4 && (
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-slate-300 block mb-1">Mode de Transport par défaut</label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, defaultTransportMode: 'air', estimatedDeliveryDays: '12-18 jours' })}
                        className={`p-3 rounded-2xl border text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                          formData.defaultTransportMode === 'air'
                            ? 'bg-blue-600/30 border-blue-500 text-white shadow-md'
                            : 'bg-white/5 border-white/10 text-slate-400'
                        }`}
                      >
                        <Plane className="w-4 h-4 text-blue-400" />
                        <span>Fret Aérien (12-18j)</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, defaultTransportMode: 'sea', estimatedDeliveryDays: '35-45 jours' })}
                        className={`p-3 rounded-2xl border text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                          formData.defaultTransportMode === 'sea'
                            ? 'bg-cyan-600/30 border-cyan-500 text-white shadow-md'
                            : 'bg-white/5 border-white/10 text-slate-400'
                        }`}
                      >
                        <Ship className="w-4 h-4 text-cyan-400" />
                        <span>Fret Maritime (35-45j)</span>
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-300 block mb-1">Délai estimé</label>
                    <input
                      type="text"
                      value={formData.estimatedDeliveryDays}
                      onChange={e => setFormData({ ...formData, estimatedDeliveryDays: e.target.value })}
                      className="w-full p-2.5 rounded-xl bg-white/5 border border-white/10 text-xs text-white"
                    />
                  </div>
                </div>
              )}

              {/* STEP 5: PRIX & MARGES */}
              {currentStep === 5 && (
                <div className="space-y-4">
                  <div className="p-3 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between text-xs">
                    <div>
                      <span className="text-slate-400 text-[10px] block">Coût de Revient Estimé</span>
                      <strong className="text-white font-mono text-sm">
                        {calculationPreview ? `${(calculationPreview.totalUnitCostXOF || 0).toLocaleString('fr-FR')} FCFA` : `${(Math.round((formData.basePriceCNY || 0) * 88.5 * 1.45) || 0).toLocaleString('fr-FR')} FCFA`}
                      </strong>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[10px] block">Marge Cible</span>
                      <input
                        type="number"
                        value={formData.targetMarginPercent}
                        onChange={e => {
                          const val = Number(e.target.value);
                          setFormData({ ...formData, targetMarginPercent: val });
                          runCalculation({ targetMarginPercent: val });
                        }}
                        className="w-16 p-1 rounded-lg bg-blue-950 border border-blue-800 text-emerald-400 font-mono font-bold text-xs text-center"
                      />
                      <span className="text-emerald-400 font-bold ml-1">%</span>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-300 block mb-1">Prix de Vente Final au Client (FCFA)</label>
                    <input
                      type="number"
                      value={formData.priceXOF}
                      onChange={e => setFormData({ ...formData, priceXOF: Number(e.target.value) })}
                      className="w-full p-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-emerald-300 font-mono font-black focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>
              )}

              {/* STEP 6: PUBLICATION */}
              {currentStep === 6 && (
                <div className="space-y-4">
                  <div className="p-4 rounded-2xl bg-emerald-950/30 border border-emerald-800/40 text-xs space-y-2">
                    <div className="flex items-center gap-2 text-emerald-400 font-bold">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Récapitulatif de publication</span>
                    </div>
                    <p className="text-slate-300">
                      <strong>{formData.name || 'Produit'}</strong> sera disponible au prix de{' '}
                      <strong className="text-white font-mono">{(formData.priceXOF || 0).toLocaleString('fr-FR')} FCFA</strong>.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-bold text-slate-300 block mb-1">Statut Stock</label>
                      <select
                        value={formData.stockStatus}
                        onChange={e => setFormData({ ...formData, stockStatus: e.target.value as any })}
                        className="w-full p-2.5 rounded-xl bg-[#050e26] border border-white/10 text-xs text-white"
                      >
                        <option value="in_stock">En stock</option>
                        <option value="preorder">Sur commande</option>
                        <option value="out_of_stock">Rupture</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-300 block mb-1">Format</label>
                      <select
                        value={formData.isGroupage ? 'groupage' : 'standard'}
                        onChange={e => setFormData({ ...formData, isGroupage: e.target.value === 'groupage' })}
                        className="w-full p-2.5 rounded-xl bg-[#050e26] border border-white/10 text-xs text-white"
                      >
                        <option value="standard">Achat Standard Solo</option>
                        <option value="groupage">Éligible Groupage</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Wizard Navigation Footer */}
            <div className="flex items-center justify-between pt-4 border-t border-blue-900/40">
              <button
                type="button"
                disabled={currentStep === 1}
                onClick={() => setCurrentStep(prev => Math.max(1, prev - 1))}
                className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 ${
                  currentStep === 1 ? 'opacity-40 cursor-not-allowed text-slate-500' : 'text-slate-300 hover:text-white bg-white/5'
                }`}
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Précédent</span>
              </button>

              {currentStep < 6 ? (
                <button
                  type="button"
                  onClick={() => setCurrentStep(prev => Math.min(6, prev + 1))}
                  className="px-5 py-2 rounded-xl bg-[#FF4500] hover:bg-[#E03D00] text-white text-xs font-bold flex items-center gap-1.5 shadow-md"
                >
                  <span>Suivant</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSaveProduct}
                  className="px-6 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-emerald-600/25"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Publier le produit</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
