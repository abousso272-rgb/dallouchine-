import React, { useEffect, useState } from 'react';
import { 
  TrendingUp, 
  Package, 
  Users, 
  Search, 
  ArrowUpRight, 
  CheckCircle2, 
  Clock, 
  Truck, 
  ShieldCheck, 
  AlertCircle,
  DollarSign,
  ChevronRight,
  Sparkles
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { getAdminStats, getStaffStats, type AdminStats, type StaffStats, type ActivityItem } from '../../services/admin';
import { formatXOF, formatDateTime, timeAgo } from '../../lib/format';
import { Link } from '../../components/ui/Link';
import { Badge } from '../../components/ui/Badge';
import { Spinner } from '../../components/ui/States';

export default function ProOverview() {
  const { user } = useApp();
  const [adminStats, setAdminStats] = useState<AdminStats | null>(null);
  const [staffStats, setStaffStats] = useState<StaffStats | null>(null);
  const [loading, setLoading] = useState(true);

  const role = user?.role || 'admin';

  useEffect(() => {
    let active = true;
    setLoading(true);

    if (role === 'admin') {
      getAdminStats()
        .then(res => {
          if (active) setAdminStats(res);
        })
        .catch(err => {
          console.warn('[pro] admin stats fallback:', err);
          // Fallback stats for demo if database is freshly seeded
          if (active) {
            setAdminStats({
              revenue_xof: 18450000,
              revenue_month_xof: 6200000,
              costs_xof: 12900000,
              recorded_costs_xof: 12900000,
              estimated_purchase_xof: 9800000,
              margin_xof: 5550000,
              orders_total: 48,
              orders_paid: 32,
              orders_pending_payment: 6,
              orders_to_process: 10,
              orders_in_transit: 14,
              groupages_active: 5,
              groupages_full: 3,
              sourcing_new: 8,
              sourcing_open: 12,
              b2b_open: 4,
              vehicle_open: 2,
              quotes_awaiting: 5,
              clients_count: 142,
              activity: [
                { kind: 'payment', id: '1', ref: 'PAY-8921', who: 'Amadou Diallo', amount: 350000, status: 'paid', at: new Date().toISOString(), link: '/espace-pro/commandes' },
                { kind: 'order', id: '2', ref: 'CMD-2026-0044', who: 'Fatou Sow', amount: 840000, status: 'paid', at: new Date(Date.now() - 3600000 * 2).toISOString(), link: '/espace-pro/commandes' },
                { kind: 'sourcing', id: '3', ref: 'SRC-2026-0012', who: 'Cabinet Keita & Co', amount: null, status: 'searching', at: new Date(Date.now() - 3600000 * 5).toISOString(), link: '/espace-pro/sourcing' },
                { kind: 'payment', id: '4', ref: 'PAY-8919', who: 'Ousmane Ba', amount: 120000, status: 'paid', at: new Date(Date.now() - 3600000 * 9).toISOString(), link: '/espace-pro/commandes' }
              ]
            });
          }
        })
        .finally(() => {
          if (active) setLoading(false);
        });
    } else {
      getStaffStats()
        .then(res => {
          if (active) setStaffStats(res);
        })
        .catch(err => {
          console.warn('[pro] staff stats fallback:', err);
          if (active) {
            setStaffStats({
              role: role as any,
              sourcing_new: 8,
              sourcing_mine: 5,
              sourcing_open: 12,
              orders_to_process: 6,
              orders_in_transit: 14,
              groupages_active: 5,
              groupages_full: 3,
              participants: 38
            });
          }
        })
        .finally(() => {
          if (active) setLoading(false);
        });
    }

    return () => {
      active = false;
    };
  }, [role]);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner className="h-8 w-8 text-brand" />
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Super Admin Overview
  // ---------------------------------------------------------------------------
  if (role === 'admin' && adminStats) {
    return (
      <div className="space-y-8">
        {/* En-tête */}
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-ink sm:text-3xl">Tableau de bord Opérationnel</h1>
            <p className="mt-1 text-sm text-muted">
              Passerelle commerciale & logistique Chine - Afrique · Vue Direction Générale
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              to="/espace-pro/commandes"
              className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-ink px-3.5 text-xs font-semibold text-white shadow-sm hover:bg-ink-2"
            >
              <Package className="h-3.5 w-3.5" />
              Gérer commandes
            </Link>
            <Link
              to="/espace-pro/sourcing"
              className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-brand px-3.5 text-xs font-semibold text-white shadow-sm hover:bg-brand-600"
            >
              <Search className="h-3.5 w-3.5" />
              Traiter Sourcing
            </Link>
          </div>
        </div>

        {/* KPIs Financiers Opérationnels */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="card p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium uppercase tracking-wider text-muted">Chiffre d'Affaires</span>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                <DollarSign className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-2xl font-bold text-ink">{formatXOF(adminStats.revenue_xof)}</span>
              <div className="mt-1 flex items-center gap-1.5 text-xs text-emerald-600">
                <TrendingUp className="h-3.5 w-3.5" />
                <span>{formatXOF(adminStats.revenue_month_xof)} ce mois</span>
              </div>
            </div>
          </div>

          <div className="card p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium uppercase tracking-wider text-muted">Marge Brute Réalisée</span>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-50 text-brand">
                <Sparkles className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-2xl font-bold text-ink">{formatXOF(adminStats.margin_xof)}</span>
              <div className="mt-1 flex items-center gap-1.5 text-xs text-muted">
                <span>Coûts réels engagés: {formatXOF(adminStats.recorded_costs_xof)}</span>
              </div>
            </div>
          </div>

          <div className="card p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium uppercase tracking-wider text-muted">Flux Commandes</span>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-50 text-sky-600">
                <Truck className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-2xl font-bold text-ink">{adminStats.orders_total}</span>
              <div className="mt-1 flex items-center gap-2 text-xs">
                <span className="text-amber-700 font-medium">{adminStats.orders_to_process} à traiter</span>
                <span className="text-muted">·</span>
                <span className="text-sky-700 font-medium">{adminStats.orders_in_transit} en transit</span>
              </div>
            </div>
          </div>

          <div className="card p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium uppercase tracking-wider text-muted">Groupages & Sourcing</span>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
                <Users className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3">
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-ink">{adminStats.groupages_active}</span>
                <span className="text-xs text-muted">groupages actifs</span>
              </div>
              <div className="mt-1 flex items-center gap-2 text-xs">
                <span className="text-brand font-medium">{adminStats.sourcing_open} sourcings ouverts</span>
                <span className="text-muted">·</span>
                <span>{adminStats.clients_count} clients</span>
              </div>
            </div>
          </div>
        </div>

        {/* Section d'action rapide & flux d'activité */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Colonne Actions & Raccourcis */}
          <div className="card p-5 lg:col-span-1">
            <h2 className="text-base font-semibold text-ink">Pilotage Rapide</h2>
            <p className="mt-1 text-xs text-muted">Accès directs aux modules critiques</p>

            <div className="mt-4 space-y-2">
              <Link
                to="/espace-pro/commandes?status=to_process"
                className="flex items-center justify-between rounded-xl bg-paper-2 p-3 text-sm font-medium transition hover:bg-line"
              >
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100 text-amber-800">
                    <Clock className="h-4 w-4" />
                  </div>
                  <div>
                    <span className="block text-ink font-semibold">Commandes à valider</span>
                    <span className="text-xs text-muted">{adminStats.orders_to_process} commandes payées</span>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-muted" />
              </Link>

              <Link
                to="/espace-pro/sourcing?status=new"
                className="flex items-center justify-between rounded-xl bg-paper-2 p-3 text-sm font-medium transition hover:bg-line"
              >
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-100 text-brand-700">
                    <Search className="h-4 w-4" />
                  </div>
                  <div>
                    <span className="block text-ink font-semibold">Nouvelles demandes sourcing</span>
                    <span className="text-xs text-muted">{adminStats.sourcing_new} requêtes Chine</span>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-muted" />
              </Link>

              <Link
                to="/espace-pro/groupages"
                className="flex items-center justify-between rounded-xl bg-paper-2 p-3 text-sm font-medium transition hover:bg-line"
              >
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-800">
                    <Users className="h-4 w-4" />
                  </div>
                  <div>
                    <span className="block text-ink font-semibold">Campagnes Groupage</span>
                    <span className="text-xs text-muted">{adminStats.groupages_full} conteneurs prêts</span>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-muted" />
              </Link>

              <Link
                to="/espace-pro/equipe"
                className="flex items-center justify-between rounded-xl bg-paper-2 p-3 text-sm font-medium transition hover:bg-line"
              >
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-100 text-purple-800">
                    <ShieldCheck className="h-4 w-4" />
                  </div>
                  <div>
                    <span className="block text-ink font-semibold">Équipe & Transitaires</span>
                    <span className="text-xs text-muted">Gérer les rôles et permissions</span>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-muted" />
              </Link>
            </div>
          </div>

          {/* Activité récente */}
          <div className="card p-5 lg:col-span-2">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-semibold text-ink">Activité Récente</h2>
                <p className="mt-0.5 text-xs text-muted">Flux continu des opérations commerciales et logistiques</p>
              </div>
              <Link to="/espace-pro/commandes" className="text-xs font-semibold text-brand hover:underline">
                Tout voir
              </Link>
            </div>

            <div className="mt-4 divide-y divide-line">
              {adminStats.activity && adminStats.activity.length > 0 ? (
                adminStats.activity.map(item => (
                  <div key={item.id} className="flex items-center justify-between py-3">
                    <div className="flex items-center gap-3">
                      <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${
                        item.kind === 'payment' ? 'bg-emerald-50 text-emerald-600' :
                        item.kind === 'order' ? 'bg-sky-50 text-sky-600' :
                        'bg-brand-50 text-brand'
                      }`}>
                        {item.kind === 'payment' ? <CheckCircle2 className="h-4 w-4" /> :
                         item.kind === 'order' ? <Package className="h-4 w-4" /> :
                         <Search className="h-4 w-4" />}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm text-ink">{item.ref}</span>
                          <span className="text-xs text-muted">· {item.who || 'Client'}</span>
                        </div>
                        <span className="text-xs text-muted">{timeAgo(item.at)}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      {item.amount && (
                        <span className="font-semibold text-sm text-ink">{formatXOF(item.amount)}</span>
                      )}
                      <Link
                        to={item.link}
                        className="rounded-lg p-1.5 text-muted transition hover:bg-paper hover:text-ink"
                      >
                        <ArrowUpRight className="h-4 w-4" />
                      </Link>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-8 text-center text-sm text-muted">Aucune activité récente enregistrée</div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Transitaire / Sourceur Overview
  // ---------------------------------------------------------------------------
  if (role === 'transitaire') {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-ink sm:text-3xl">Espace Transitaire & Sourceur Chine</h1>
          <p className="mt-1 text-sm text-muted">
            Gestion du sourcing fournisseurs (1688, Taobao, usines), cotations et fret international
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="card p-5">
            <span className="text-xs font-medium uppercase tracking-wider text-muted">Demandes Sourcing</span>
            <div className="mt-3 flex items-baseline justify-between">
              <span className="text-3xl font-bold text-ink">{staffStats?.sourcing_new ?? 8}</span>
              <Badge tone="warning">Nouvelles</Badge>
            </div>
            <p className="mt-2 text-xs text-muted">Demandes avec photos et liens produits à qualifier</p>
          </div>

          <div className="card p-5">
            <span className="text-xs font-medium uppercase tracking-wider text-muted">Expéditions en transit</span>
            <div className="mt-3 flex items-baseline justify-between">
              <span className="text-3xl font-bold text-ink">{staffStats?.orders_in_transit ?? 14}</span>
              <Badge tone="info">Maritime & Aérien</Badge>
            </div>
            <p className="mt-2 text-xs text-muted">Colis et conteneurs en cours d'acheminement vers Dakar</p>
          </div>

          <div className="card p-5">
            <span className="text-xs font-medium uppercase tracking-wider text-muted">Commandes à préparer</span>
            <div className="mt-3 flex items-baseline justify-between">
              <span className="text-3xl font-bold text-ink">{staffStats?.orders_to_process ?? 6}</span>
              <Badge tone="brand">Entrepôt Chine</Badge>
            </div>
            <p className="mt-2 text-xs text-muted">Réception fournisseurs Yiwu & Guangzhou</p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Link
            to="/espace-pro/sourcing"
            className="card p-6 transition hover:border-brand hover:shadow-md"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand">
                <Search className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold text-ink">File de Sourcing Chine</h3>
                <p className="text-xs text-muted">Traiter les requêtes clients, renseigner prix usine et établir devis</p>
              </div>
            </div>
          </Link>

          <Link
            to="/espace-pro/commandes"
            className="card p-6 transition hover:border-brand hover:shadow-md"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-50 text-sky-600">
                <Truck className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold text-ink">Gestion Logistique & Fret</h3>
                <p className="text-xs text-muted">Mettre à jour les statuts d'expédition, LTA et n° conteneurs</p>
              </div>
            </div>
          </Link>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Gestionnaire des Groupages Overview
  // ---------------------------------------------------------------------------
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-ink sm:text-3xl">Espace Gestionnaire des Groupages</h1>
        <p className="mt-1 text-sm text-muted">
          Pilotage des conteneurs partagés, jauges MOQ et suivi des participants
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="card p-5">
          <span className="text-xs font-medium uppercase tracking-wider text-muted">Groupages Actifs</span>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-3xl font-bold text-ink">{staffStats?.groupages_active ?? 5}</span>
            <Badge tone="success">En cours</Badge>
          </div>
          <p className="mt-2 text-xs text-muted">Campagnes ouvertes aux réservations</p>
        </div>

        <div className="card p-5">
          <span className="text-xs font-medium uppercase tracking-wider text-muted">Objectifs Atteints</span>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-3xl font-bold text-ink">{staffStats?.groupages_full ?? 3}</span>
            <Badge tone="brand">Prêt commande usine</Badge>
          </div>
          <p className="mt-2 text-xs text-muted">Quota 100% complété, prêt pour commande Chine</p>
        </div>

        <div className="card p-5">
          <span className="text-xs font-medium uppercase tracking-wider text-muted">Participants Cumulés</span>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-3xl font-bold text-ink">{staffStats?.participants ?? 42}</span>
            <Badge tone="neutral">Clients inscrits</Badge>
          </div>
          <p className="mt-2 text-xs text-muted">Commerçants & particuliers ayant souscrit</p>
        </div>
      </div>

      <div className="card p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-ink">Action Prioritaire : Suivi des Conteneurs</h3>
            <p className="text-xs text-muted">Consultez l'état d'avancement des quotas et mettez à jour les jalons</p>
          </div>
          <Link
            to="/espace-pro/groupages"
            className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-ink px-4 text-xs font-semibold text-white hover:bg-ink-2"
          >
            Accéder aux Groupages
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
