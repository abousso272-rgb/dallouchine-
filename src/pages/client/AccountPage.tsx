import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { ProductCard } from '../../components/common/ProductCard';
import { UnifiedAuthForm } from '../../components/auth/UnifiedAuthForm';
import { sourcingClient, SourcingRequestData } from '../../services/sourcingService';
import {
  User,
  Package,
  Heart,
  Flame,
  MapPin,
  Phone,
  Mail,
  Clock,
  ArrowRight,
  LogOut,
  Sparkles,
  ShieldCheck,
  Building,
  CheckCircle2,
  Lock,
  Users,
  Compass,
  FileText,
  CheckCircle,
  XCircle,
  AlertCircle,
  Eye,
  ExternalLink
} from 'lucide-react';

export const AccountPage: React.FC = () => {
  const {
    currentUser,
    orders,
    products,
    favorites,
    groupages,
    userParticipations,
    cancelParticipation,
    refreshUserParticipations,
    navigate,
    logoutUser,
    currentPath
  } = useApp();

  const [activeTab, setActiveTab] = useState<'orders' | 'favorites' | 'groupages' | 'sourcing' | 'profile'>('orders');
  const [sourcingRequests, setSourcingRequests] = useState<SourcingRequestData[]>([]);
  const [isLoadingSourcing, setIsLoadingSourcing] = useState(false);
  const [selectedQuoteModal, setSelectedQuoteModal] = useState<any | null>(null);
  const [quoteActionLoading, setQuoteActionLoading] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);

  // Charger les demandes de sourcing dès que l'onglet sourcing est actif
  useEffect(() => {
    if (currentUser.isLoggedIn && activeTab === 'sourcing') {
      setIsLoadingSourcing(true);
      sourcingClient.getRequests()
        .then(res => {
          if (res.success) setSourcingRequests(res.requests);
        })
        .finally(() => setIsLoadingSourcing(false));
    }
  }, [currentUser.isLoggedIn, activeTab]);

  const handleAcceptQuote = async (quoteId: string) => {
    setQuoteActionLoading(true);
    try {
      const res = await sourcingClient.acceptQuote(quoteId);
      if (res.success) {
        const refreshed = await sourcingClient.getRequests();
        if (refreshed.success) setSourcingRequests(refreshed.requests);
        if (selectedQuoteModal?.id === quoteId) {
          setSelectedQuoteModal((prev: any) => ({ ...prev, status: 'accepted' }));
        }
      } else {
        alert(res.errorMessage || 'Erreur lors de l\'acceptation du devis.');
      }
    } finally {
      setQuoteActionLoading(false);
    }
  };

  const handleRejectQuote = async (quoteId: string) => {
    setQuoteActionLoading(true);
    try {
      const res = await sourcingClient.rejectQuote(quoteId, rejectionReason);
      if (res.success) {
        setIsRejectModalOpen(false);
        setRejectionReason('');
        const refreshed = await sourcingClient.getRequests();
        if (refreshed.success) setSourcingRequests(refreshed.requests);
        if (selectedQuoteModal?.id === quoteId) {
          setSelectedQuoteModal((prev: any) => ({ ...prev, status: 'rejected' }));
        }
      } else {
        alert(res.errorMessage || 'Erreur lors du refus du devis.');
      }
    } finally {
      setQuoteActionLoading(false);
    }
  };

  // Check if URL specifies admin tab
  const isDefaultAdmin = currentPath.includes('tab=admin') || currentPath.includes('admin');

  // If user is disconnected, display Unified Authentication Form
  if (!currentUser.isLoggedIn) {
    return (
      <div className="max-w-4xl mx-auto py-6 sm:py-10 space-y-8 animate-in fade-in">
        <UnifiedAuthForm
          defaultTab={isDefaultAdmin ? 'admin' : 'client'}
          title="Connexion SinoSenegal"
          subtitle="Formulaire unique pour l'Espace Client et l'Espace Administrateur"
        />
      </div>
    );
  }

  const favoriteProducts = products.filter(p => favorites.includes(p.id));

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-16 animate-in fade-in">
      {/* User Header Profile Card */}
      <div className="glass-panel bg-white/95 rounded-3xl p-6 sm:p-8 border border-white shadow-md flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-4 text-center sm:text-left">
          <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-[#0B192C] to-[#1E293B] text-white flex items-center justify-center text-xl font-black shadow-md border border-[#FF4500]/30">
            {currentUser.name ? currentUser.name.charAt(0) : 'U'}
          </div>

          <div className="space-y-1">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-[#0B192C]">{currentUser.name}</h1>
              {currentUser.role === 'admin' && (
                <span className="px-2.5 py-0.5 rounded-full bg-[#FF4500] text-white text-[10px] font-black uppercase tracking-wide">
                  Admin {currentUser.adminRole || 'HQ'}
                </span>
              )}
            </div>

            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 text-xs text-slate-500">
              <span className="flex items-center gap-1">
                <Phone className="w-3.5 h-3.5 text-[#FF4500]" />
                {currentUser.phone}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Mail className="w-3.5 h-3.5 text-[#FF4500]" />
                {currentUser.email}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1 font-semibold text-[#0B192C]">
                <MapPin className="w-3.5 h-3.5 text-[#FF4500]" />
                {currentUser.city}, Sénégal
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons: Admin Switch & Disconnect */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => navigate('/admin')}
            className="text-xs font-bold bg-[#0B192C] hover:bg-[#FF4500] text-white flex items-center gap-1.5 px-4 py-2.5 rounded-xl shadow-xs transition-colors"
          >
            <ShieldCheck className="w-4 h-4 text-orange-300" />
            <span>Espace Admin</span>
          </button>

          <button
            onClick={() => {
              logoutUser();
            }}
            className="text-xs font-bold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-rose-200 transition-colors"
            title="Se déconnecter"
          >
            <LogOut className="w-4 h-4" />
            <span>Déconnexion</span>
          </button>
        </div>
      </div>

      {/* Tabs Row */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar glass-panel bg-white/70 p-2 rounded-2xl border border-slate-200">
        <button
          onClick={() => setActiveTab('orders')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 ${
            activeTab === 'orders'
              ? 'bg-[#0B192C] text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Package className="w-4 h-4" />
          <span>Mes Commandes & Suivis AWP ({orders.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('favorites')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 ${
            activeTab === 'favorites'
              ? 'bg-[#0B192C] text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Heart className="w-4 h-4" />
          <span>Mes Favoris ({favoriteProducts.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('groupages')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 ${
            activeTab === 'groupages'
              ? 'bg-[#0B192C] text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Flame className="w-4 h-4 text-orange-500" />
          <span>Mes Participations Groupages</span>
        </button>

        <button
          onClick={() => setActiveTab('sourcing')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 ${
            activeTab === 'sourcing'
              ? 'bg-[#0B192C] text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Compass className="w-4 h-4 text-cyan-500" />
          <span>Mes Demandes Sourcing & Devis ({sourcingRequests.length})</span>
        </button>
      </div>

      {/* Tab 1: Orders */}
      {activeTab === 'orders' && (
        <div className="space-y-4">
          {orders.length > 0 ? (
            orders.map(order => (
              <div
                key={order.id}
                className="glass-panel bg-white/90 rounded-3xl p-5 sm:p-6 border border-white shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-black text-[#0B192C] font-mono-numeric">
                      Bordereau : {order.trackingCode}
                    </span>
                    <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-md bg-[#FF4500]/10 text-[#FF4500]">
                      {order.currentStatus.replace(/_/g, ' ')}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                    <span>Passée le {order.createdAt ? new Date(order.createdAt).toLocaleDateString('fr-FR') : 'Récemment'}</span>
                    <span>•</span>
                    <span>{order.items.length} article(s)</span>
                    <span>•</span>
                    <strong className="text-[#0B192C] font-mono-numeric">
                      {(order.totalXOF || 0).toLocaleString('fr-FR')} FCFA
                    </strong>
                    <span>•</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      order.paymentStatus === 'paid'
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-amber-100 text-amber-700'
                    }`}>
                      {order.paymentStatus === 'paid' ? '✓ Payé' : '⏳ Paiement en attente'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 self-start md:self-auto">
                  {order.paymentStatus !== 'paid' && (
                    <button
                      onClick={async () => {
                        const { PaymentApiClient } = await import('../../services/paymentApiClient');
                        const res = await PaymentApiClient.createPayment({ orderId: order.id });
                        if (res.success && res.checkoutUrl) {
                          if (res.checkoutUrl.startsWith('/') || res.checkoutUrl.includes(window.location.host)) {
                            const urlObj = new URL(res.checkoutUrl, window.location.origin);
                            navigate(`${urlObj.pathname}${urlObj.search}`);
                          } else {
                            window.location.href = res.checkoutUrl;
                          }
                        }
                      }}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-xs flex items-center gap-1.5"
                    >
                      <span>Régler</span>
                    </button>
                  )}
                  <button
                    onClick={() => navigate(`/tracking?code=${order.trackingCode}`)}
                    className="bg-[#0B192C] hover:bg-[#FF4500] text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-xs flex items-center gap-1.5 transition-colors"
                  >
                    <span>Suivre mon colis</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="glass-panel bg-white/80 rounded-3xl p-10 text-center space-y-3">
              <Package className="w-10 h-10 text-slate-300 mx-auto" />
              <h3 className="text-sm font-bold text-slate-700">Aucune commande pour le moment</h3>
              <button
                onClick={() => navigate('/products')}
                className="bg-[#0B192C] hover:bg-[#FF4500] text-white text-xs font-bold px-5 py-2.5 rounded-xl transition-colors"
              >
                Découvrir le catalogue
              </button>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Favorites */}
      {activeTab === 'favorites' && (
        <div>
          {favoriteProducts.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              {favoriteProducts.map(p => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          ) : (
            <div className="glass-panel bg-white/80 rounded-3xl p-12 text-center space-y-3">
              <Heart className="w-12 h-12 text-slate-300 mx-auto" />
              <h3 className="text-base font-bold text-[#0B192C]">Aucun article en favoris</h3>
              <p className="text-xs text-slate-500">
                Explorez le catalogue et cliquez sur le cœur pour sauvegarder vos produits.
              </p>
              <button
                onClick={() => navigate('/products')}
                className="bg-[#0B192C] hover:bg-[#FF4500] text-white text-xs font-bold px-6 py-2.5 rounded-xl transition-colors"
              >
                Explorer les produits
              </button>
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Groupages */}
      {activeTab === 'groupages' && (
        <div className="space-y-4">
          <div className="glass-panel bg-white/90 rounded-3xl p-6 border border-white space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-black text-[#0B192C]">Mes Participations Groupages</h3>
                <p className="text-xs text-slate-500">
                  Suivi direct de vos souscriptions conteneurs Chine-Sénégal depuis Supabase.
                </p>
              </div>
              <button
                onClick={() => refreshUserParticipations()}
                className="text-xs font-bold text-slate-500 hover:text-slate-900 flex items-center gap-1 cursor-pointer"
                title="Actualiser les participations"
              >
                <span>Actualiser</span>
              </button>
            </div>

            {userParticipations.length === 0 ? (
              <div className="text-center py-10 space-y-3">
                <Users className="w-12 h-12 text-slate-300 mx-auto" />
                <p className="text-sm font-bold text-slate-700">Aucune participation active</p>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Vous n'avez pas encore réservé d'unités sur les achats groupés en cours.
                </p>
                <button
                  onClick={() => navigate('/groupages')}
                  className="px-5 py-2.5 bg-[#FF4500] hover:bg-[#E03E00] text-white text-xs font-bold rounded-full shadow-md transition-all cursor-pointer"
                >
                  Découvrir les groupages ouverts →
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {userParticipations.map(p => {
                  const grp = p.groupage;
                  const isReserved = p.status === 'reserved';
                  const isCancelled = p.status === 'cancelled';
                  const isConfirmed = p.status === 'confirmed';

                  return (
                    <div
                      key={p.id}
                      className={`p-4 rounded-2xl border transition-all ${
                        isCancelled
                          ? 'bg-slate-50 border-slate-200 opacity-60'
                          : isReserved
                          ? 'bg-amber-50/80 border-amber-200/90 shadow-xs'
                          : 'bg-emerald-50/80 border-emerald-200 shadow-xs'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-start gap-3">
                          {grp?.image && (
                            <img
                              src={grp.image}
                              alt={grp.title}
                              className="w-14 h-14 object-cover rounded-xl border border-slate-200 shrink-0"
                            />
                          )}
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-xs font-black text-slate-900">
                                {grp?.title || 'Campagne de Groupage'}
                              </span>
                              <span
                                className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                                  isCancelled
                                    ? 'bg-rose-100 text-rose-700'
                                    : isReserved
                                    ? 'bg-amber-200 text-amber-900'
                                    : isConfirmed
                                    ? 'bg-emerald-200 text-emerald-900'
                                    : 'bg-blue-100 text-blue-800'
                                }`}
                              >
                                {isCancelled
                                  ? 'Annulé'
                                  : isReserved
                                  ? 'Réservé'
                                  : isConfirmed
                                  ? 'Confirmé'
                                  : p.status}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-600 mt-1">
                              Lot : <strong className="text-slate-800">{grp?.code || 'GRP'}</strong> • Quantité : <strong className="text-slate-900">{p.quantity} unité{p.quantity > 1 ? 's' : ''}</strong>
                            </p>
                            <p className="text-[11px] text-slate-500">
                              Prix unitaire : {p.unitPriceXOF.toLocaleString('fr-FR')} FCFA • Total : <strong className="text-[#FF4500] font-black">{p.totalXOF.toLocaleString('fr-FR')} FCFA</strong>
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 self-end sm:self-center">
                          {isReserved && (
                            <button
                              onClick={async () => {
                                if (window.confirm('Confirmez-vous l\'annulation de votre réservation ? Le quota sera libéré.')) {
                                  await cancelParticipation(p.id);
                                }
                              }}
                              className="text-[11px] font-bold text-rose-600 hover:text-rose-800 hover:underline px-2.5 py-1 rounded-lg border border-rose-200 hover:bg-rose-50 transition-colors cursor-pointer"
                            >
                              Annuler
                            </button>
                          )}
                          <button
                            onClick={() => navigate(`/groupages/${grp?.code || p.groupageId}`)}
                            className="text-xs font-bold text-[#FF4500] hover:text-[#E03E00] hover:underline px-3 py-1 bg-white rounded-lg border border-amber-200 shadow-2xs transition-colors cursor-pointer"
                          >
                            Détails du lot →
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 4: Sourcing & Devis */}
      {activeTab === 'sourcing' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-black text-[#0B192C]">Mes Dossiers de Sourcing</h2>
            <button
              onClick={() => navigate('/sourcing')}
              className="px-4 py-2 rounded-xl bg-[#FF4500] hover:bg-[#E03D00] text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5"
            >
              <span>Nouvelle demande</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {isLoadingSourcing ? (
            <div className="glass-panel bg-white/80 rounded-3xl p-10 text-center space-y-3">
              <Clock className="w-8 h-8 text-cyan-500 animate-spin mx-auto" />
              <p className="text-xs text-slate-500 font-semibold">Chargement de vos demandes de sourcing...</p>
            </div>
          ) : sourcingRequests.length === 0 ? (
            <div className="glass-panel bg-white/80 rounded-3xl p-10 text-center space-y-3">
              <Compass className="w-10 h-10 text-slate-300 mx-auto" />
              <h3 className="text-sm font-bold text-slate-700">Aucune demande de sourcing pour le moment</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Vous recherchez une machine, un véhicule ou un produit spécifique en Chine ? Nos équipes négocient directement en usine pour vous.
              </p>
              <button
                onClick={() => navigate('/sourcing')}
                className="bg-[#0B192C] hover:bg-[#FF4500] text-white text-xs font-bold px-5 py-2.5 rounded-xl transition-colors inline-block"
              >
                Lancer un sourcing sur-mesure
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {sourcingRequests.map(req => {
                const getBadge = (status?: string) => {
                  switch (status) {
                    case 'new':
                      return <span className="bg-slate-100 text-slate-700 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase">Enregistré</span>;
                    case 'researching':
                      return <span className="bg-blue-100 text-blue-800 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase">Recherche Usine</span>;
                    case 'supplier_found':
                      return <span className="bg-indigo-100 text-indigo-800 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase">Fabricant Trouvé</span>;
                    case 'negotiating':
                      return <span className="bg-amber-100 text-amber-800 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase">Négociation</span>;
                    case 'quote_ready':
                    case 'quote_sent':
                      return <span className="bg-cyan-100 text-cyan-800 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase animate-pulse">Devis Disponible</span>;
                    case 'accepted':
                      return <span className="bg-emerald-100 text-emerald-800 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase">Devis Accepté</span>;
                    case 'rejected':
                      return <span className="bg-rose-100 text-rose-800 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase">Devis Refusé</span>;
                    case 'completed':
                      return <span className="bg-emerald-200 text-emerald-900 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase">Mission Clôturée</span>;
                    default:
                      return <span className="bg-slate-100 text-slate-700 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase">{status}</span>;
                  }
                };

                return (
                  <div
                    key={req.id}
                    className="glass-panel bg-white/95 rounded-3xl p-5 sm:p-6 border border-slate-100 shadow-xs space-y-4"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <span className="font-mono text-xs font-black text-[#0B192C] bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200">
                          {req.code}
                        </span>
                        {getBadge(req.status)}
                      </div>
                      <span className="text-[11px] text-slate-400">
                        Créé le {req.created_at ? new Date(req.created_at).toLocaleDateString('fr-FR') : 'Récemment'}
                      </span>
                    </div>

                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="space-y-1.5">
                        <h3 className="text-base font-black text-[#0B192C]">{req.title}</h3>
                        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                          <span>Quantité : <strong className="text-slate-800 font-mono-numeric">{req.quantity} pcs</strong></span>
                          <span>•</span>
                          <span>Destination : <strong className="text-slate-800">{req.destination}</strong></span>
                          {req.budgetXof && (
                            <>
                              <span>•</span>
                              <span>Budget : <strong className="text-[#FF4500] font-mono-numeric">{(req.budgetXof).toLocaleString('fr-FR')} FCFA</strong></span>
                            </>
                          )}
                        </div>

                        {req.assigned_sourcer && (
                          <div className="flex items-center gap-1.5 text-xs text-blue-700 bg-blue-50 px-3 py-1 rounded-xl w-fit mt-1">
                            <span className="material-symbols-outlined text-sm">support_agent</span>
                            <span>Sourceur assigné : <strong>{req.assigned_sourcer.name}</strong> ({req.assigned_sourcer.location_city})</span>
                          </div>
                        )}
                      </div>

                      {req.productUrl && (
                        <a
                          href={req.productUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1 shrink-0"
                        >
                          <span>Lien produit</span>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      )}
                    </div>

                    {/* Section Devis */}
                    {req.quotes && req.quotes.length > 0 && (
                      <div className="mt-3 p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-3">
                        <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                          <FileText className="w-4 h-4 text-[#FF4500]" />
                          <span>Propositions de devis ({req.quotes.length}) :</span>
                        </span>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {req.quotes.map((q: any) => (
                            <div
                              key={q.id}
                              className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between gap-3"
                            >
                              <div className="space-y-0.5">
                                <div className="flex items-center gap-2">
                                  <span className="font-mono text-xs font-bold text-slate-900">{q.quote_number}</span>
                                  <span className={`text-[9px] font-black px-1.5 py-0.5 rounded ${
                                    q.status === 'accepted' ? 'bg-emerald-100 text-emerald-800' :
                                    q.status === 'rejected' ? 'bg-rose-100 text-rose-800' :
                                    q.status === 'sent' ? 'bg-cyan-100 text-cyan-800' : 'bg-slate-100 text-slate-700'
                                  }`}>
                                    {q.status === 'accepted' ? '✓ Accepté' : q.status === 'rejected' ? 'Refusé' : 'À valider'}
                                  </span>
                                </div>
                                <p className="text-xs font-mono font-black text-[#0B192C]">
                                  {(q.total_xof || 0).toLocaleString('fr-FR')} FCFA
                                </p>
                              </div>

                              <button
                                onClick={async () => {
                                  const res = await sourcingClient.getQuote(q.id);
                                  if (res.success && res.quote) {
                                    setSelectedQuoteModal(res.quote);
                                  }
                                }}
                                className="px-3 py-1.5 rounded-lg bg-[#0B192C] hover:bg-[#FF4500] text-white text-xs font-bold transition-colors flex items-center gap-1"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                <span>Consulter</span>
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Modal Consultation & Acceptation Devis */}
      {selectedQuoteModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 sm:p-8 space-y-6 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm font-black text-[#0B192C] bg-slate-100 px-3 py-1 rounded-lg border">
                    {selectedQuoteModal.quote_number}
                  </span>
                  <span className="text-xs font-bold text-slate-400">Version {selectedQuoteModal.version}</span>
                </div>
                <h3 className="text-lg font-black text-[#0B192C] mt-2">Devis Commercial Sourcing Usine</h3>
              </div>
              <button
                onClick={() => setSelectedQuoteModal(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Articles du devis */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Articles chiffrés :</h4>
              <div className="rounded-2xl border border-slate-200 overflow-hidden text-xs">
                <table className="w-full">
                  <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                    <tr>
                      <th className="p-3 text-left">Désignation</th>
                      <th className="p-3 text-center">Quantité</th>
                      <th className="p-3 text-right">Prix Unitaire</th>
                      <th className="p-3 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {selectedQuoteModal.items?.map((item: any) => (
                      <tr key={item.id}>
                        <td className="p-3 font-medium text-slate-900">{item.description}</td>
                        <td className="p-3 text-center font-mono">{item.quantity}</td>
                        <td className="p-3 text-right font-mono">{(item.unit_price_xof || 0).toLocaleString('fr-FR')} F</td>
                        <td className="p-3 text-right font-mono font-bold text-slate-900">{(item.subtotal_xof || 0).toLocaleString('fr-FR')} F</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Décomposition financière certifiée */}
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Sous-total articles :</span>
                <span className="font-mono font-bold text-slate-900">{(selectedQuoteModal.subtotal_xof || 0).toLocaleString('fr-FR')} FCFA</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Fret international ({selectedQuoteModal.transport_mode || 'air'}) :</span>
                <span className="font-mono font-bold text-slate-900">{(selectedQuoteModal.shipping_xof || 0).toLocaleString('fr-FR')} FCFA</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Dédouanement Gaindé Dakar estimé :</span>
                <span className="font-mono font-bold text-slate-900">{(selectedQuoteModal.customs_xof || 0).toLocaleString('fr-FR')} FCFA</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Frais sourcing & contrôle qualité :</span>
                <span className="font-mono font-bold text-slate-900">{(selectedQuoteModal.fees_xof || 0).toLocaleString('fr-FR')} FCFA</span>
              </div>
              <div className="pt-2 border-t border-slate-200 flex justify-between text-sm">
                <strong className="text-slate-900">Total général client :</strong>
                <strong className="text-[#FF4500] font-mono text-base">{(selectedQuoteModal.total_xof || 0).toLocaleString('fr-FR')} FCFA</strong>
              </div>
              <div className="pt-2 border-t border-dashed border-slate-300 flex justify-between text-xs text-emerald-700 bg-emerald-50 p-2 rounded-xl">
                <span>Acompte requis à la commande ({selectedQuoteModal.deposit_required_percent || 50}%) :</span>
                <span className="font-mono font-bold">{(selectedQuoteModal.deposit_amount_xof || 0).toLocaleString('fr-FR')} FCFA</span>
              </div>
            </div>

            <div className="text-[11px] text-slate-400 space-y-1">
              <p>• Validité de l'offre jusqu'au : <strong className="text-slate-700">{selectedQuoteModal.valid_until}</strong></p>
              <p>• Délai de livraison estimé : <strong className="text-slate-700">{selectedQuoteModal.lead_time_days || '15-20 jours'}</strong></p>
            </div>

            {/* Actions d'acceptation / refus */}
            <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row gap-3 justify-end">
              {selectedQuoteModal.status === 'accepted' ? (
                <div className="flex items-center gap-2 text-emerald-700 bg-emerald-100 px-4 py-2.5 rounded-xl font-bold text-xs w-full justify-center">
                  <CheckCircle className="w-4 h-4" />
                  <span>Devis accepté le {new Date(selectedQuoteModal.accepted_at || Date.now()).toLocaleDateString('fr-FR')}</span>
                </div>
              ) : selectedQuoteModal.status === 'rejected' ? (
                <div className="flex items-center gap-2 text-rose-700 bg-rose-100 px-4 py-2.5 rounded-xl font-bold text-xs w-full justify-center">
                  <XCircle className="w-4 h-4" />
                  <span>Devis refusé</span>
                </div>
              ) : (
                <>
                  <button
                    onClick={() => setIsRejectModalOpen(true)}
                    disabled={quoteActionLoading}
                    className="px-5 py-3 rounded-xl border border-rose-300 hover:bg-rose-50 text-rose-700 font-bold text-xs transition-colors"
                  >
                    Refuser la proposition
                  </button>
                  <button
                    onClick={() => handleAcceptQuote(selectedQuoteModal.id)}
                    disabled={quoteActionLoading}
                    className="px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2"
                  >
                    {quoteActionLoading ? (
                      <span>Validation en cours...</span>
                    ) : (
                      <>
                        <CheckCircle className="w-4 h-4" />
                        <span>Accepter formellement ce devis</span>
                      </>
                    )}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal Refus Devis */}
      {isRejectModalOpen && (
        <div className="fixed inset-0 z-60 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <h4 className="text-base font-black text-slate-900">Motif du refus</h4>
            <p className="text-xs text-slate-500">
              Veuillez indiquer brièvement la raison pour permettre à nos équipes d'ajuster l'offre ou de chercher d'autres usines.
            </p>
            <textarea
              value={rejectionReason}
              onChange={e => setRejectionReason(e.target.value)}
              placeholder="Ex: Prix trop élevé, délai trop long, quantité minimale inadaptée..."
              className="w-full h-24 p-3 text-xs border border-slate-200 rounded-xl outline-none focus:border-[#FF4500]"
            />
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setIsRejectModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
              >
                Annuler
              </button>
              <button
                onClick={() => handleRejectQuote(selectedQuoteModal.id)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-xs"
              >
                Confirmer le refus
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

