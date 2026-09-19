import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { ProductCard } from '../../components/common/ProductCard';
import { UnifiedAuthForm } from '../../components/auth/UnifiedAuthForm';
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
  Users
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

  const [activeTab, setActiveTab] = useState<'orders' | 'favorites' | 'groupages' | 'profile'>('orders');

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
    </div>
  );
};

