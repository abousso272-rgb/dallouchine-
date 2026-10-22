import React, { useState } from 'react';
import { Banknote, Calculator, ClipboardList, FileSpreadsheet, Globe, LineChart, PackagePlus, UserPlus, Users } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useAsync } from '../../lib/hooks';
import { getFinanceContext } from '../../services/finance';
import { Link } from '../ui/Link';
import { Card, CardTitle } from '../ui/Layout';
import { ExchangeRateDialog } from './ExchangeRateDialog';

interface Action {
  icon: React.ElementType;
  title: string;
  hint: string;
  to?: string;
  onClick?: () => void;
}

/** Actions concrètes du quotidien, à portée de clic, selon le rôle : l'équipe n'a besoin de personne pour avancer. */
export function QuickActions() {
  const { user } = useApp();
  const role = user?.role;
  const canFx = role === 'admin' || role === 'transitaire';
  const ctx = useAsync(() => (canFx ? getFinanceContext() : Promise.resolve(null)), [canFx], { cacheKey: 'finance:context', maxAge: 30000 });
  const [fxOpen, setFxOpen] = useState(false);
  const perms = user?.permissions || [];

  const fx = ctx.data?.fx.cny_to_xof;
  const fxAction: Action = { icon: Banknote, title: 'Taux de change', hint: fx ? `1 ¥ = ${fx.toLocaleString('fr-FR')} FCFA · modifier` : 'Mettre à jour le taux', onClick: () => setFxOpen(true) };

  let actions: Action[] = [];
  if (role === 'admin') {
    actions = [
      { icon: PackagePlus, title: 'Ajouter un produit', hint: 'Fiche complète avec photos', to: '/espace-pro/produits/nouveau' },
      { icon: FileSpreadsheet, title: 'Tableur produits', hint: 'Importer ou saisir plusieurs produits', to: '/espace-pro/tableur' },
      fxAction,
      { icon: Users, title: 'Nouveau groupage', hint: 'Lancer une campagne', to: '/espace-pro/groupages/nouveau' },
      { icon: LineChart, title: 'Finance', hint: 'Marges, trésorerie, prévisions', to: '/espace-pro/finance' },
      { icon: Globe, title: 'Audience du site', hint: 'Visites, provenance, pays', to: '/espace-pro/audience' },
      { icon: UserPlus, title: 'Inviter un membre', hint: 'Transitaire, gestionnaire…', to: '/espace-pro/equipe' }
    ];
  } else if (role === 'transitaire') {
    actions = [
      { icon: PackagePlus, title: 'Ajouter un produit', hint: 'Fiche complète avec photos', to: '/espace-pro/produits/nouveau' },
      { icon: FileSpreadsheet, title: 'Tableur produits', hint: 'Importer Excel, saisir plusieurs produits', to: '/espace-pro/tableur' },
      fxAction,
      { icon: Calculator, title: 'Calculateur de prix', hint: 'Prix de vente depuis le coût réel', to: '/espace-pro/calculateur' },
      { icon: Users, title: 'Simuler un groupage', hint: 'Proposer une campagne rentable', to: '/espace-pro/simulateur-groupage' },
      { icon: ClipboardList, title: 'Demandes à traiter', hint: 'Sourcing, B2B, devis', to: '/espace-pro/demandes' }
    ];
  } else if (role === 'groupage_manager') {
    actions = [
      { icon: Users, title: 'Nouveau groupage', hint: 'Produit, coûts, rentabilité, campagne', to: '/espace-pro/groupages/nouveau' },
      ...(perms.includes('manage_products') ? [{ icon: FileSpreadsheet, title: 'Mes produits et coûts', hint: 'Tableur : prix, poids, cargo, marge', to: '/espace-pro/tableur' }] : []),
      { icon: Users, title: 'Mes groupages', hint: 'Progression, relances, participants', to: '/espace-pro/groupages' },
      { icon: Calculator, title: 'Simuler un groupage', hint: 'Tester un prix avant de lancer', to: '/espace-pro/simulateur-groupage' }
    ];
  }
  if (!actions.length) return null;

  return (
    <Card>
      <CardTitle>Actions rapides</CardTitle>
      <ul className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 xl:grid-cols-3">
        {actions.map(a => {
          const inner = (
            <>
              <span className="icon-bubble h-10 w-10 shrink-0">
                <a.icon className="h-[18px] w-[18px]" />
              </span>
              <span className="min-w-0 text-left">
                <span className="block text-[14px] font-semibold">{a.title}</span>
                <span className="block truncate text-[12.5px] text-muted">{a.hint}</span>
              </span>
            </>
          );
          const cls = 'lift flex w-full items-center gap-3 rounded-2xl border border-line bg-white p-3.5';
          return (
            <li key={a.title}>
              {a.to ? (
                <Link to={a.to} className={cls}>
                  {inner}
                </Link>
              ) : (
                <button type="button" onClick={a.onClick} className={cls}>
                  {inner}
                </button>
              )}
            </li>
          );
        })}
      </ul>
      {canFx && ctx.data && <ExchangeRateDialog open={fxOpen} onClose={() => setFxOpen(false)} context={ctx.data} onSaved={ctx.reload} />}
    </Card>
  );
}
