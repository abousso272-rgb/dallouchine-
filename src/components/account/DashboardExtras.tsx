import React, { useState } from 'react';
import { CheckCircle2, Circle, Heart, History } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useAsync } from '../../lib/hooks';
import { listFavoriteIds } from '../../services/favorites';
import { listProductsByIds } from '../../services/catalog';
import { clearRecent, readRecent } from '../../lib/recent';
import { Link } from '../ui/Link';
import { Price } from '../ui/Price';
import { Skeleton } from '../ui/States';

/** Invite à compléter le profil : adresse et téléphone accélèrent la livraison et les alertes. */
export function ProfileChecklist() {
  const { user } = useApp();
  if (!user) return null;
  const items = [
    { done: Boolean(user.phone), label: 'Ajouter votre numéro de téléphone', hint: 'Pour être prévenu par WhatsApp à chaque étape.' },
    { done: Boolean(user.city), label: 'Indiquer votre ville', hint: 'Pour estimer la livraison et proposer le bon point de retrait.' },
    { done: Boolean(user.address), label: 'Renseigner votre adresse de livraison', hint: 'Pour commander plus vite, sans ressaisir vos informations.' }
  ];
  const done = items.filter(i => i.done).length;
  if (done === items.length) return null;
  return (
    <section className="card p-5" aria-labelledby="profile-check">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 id="profile-check" className="text-base font-semibold">
          Complétez votre profil <span className="num text-muted">({done}/{items.length})</span>
        </h2>
        <Link to="/compte/profil" className="text-[13px] font-semibold text-brand-700 hover:underline">
          Compléter
        </Link>
      </div>
      <div className="mb-4 h-1.5 overflow-hidden rounded-full bg-paper-2" role="progressbar" aria-valuenow={done} aria-valuemin={0} aria-valuemax={items.length}>
        <div className="h-full rounded-full bg-brand-gradient transition-all" style={{ width: `${(done / items.length) * 100}%` }} />
      </div>
      <ul className="space-y-2.5">
        {items.map(i => (
          <li key={i.label} className="flex items-start gap-3">
            {i.done ? <CheckCircle2 className="mt-0.5 h-[18px] w-[18px] shrink-0 text-jade" /> : <Circle className="mt-0.5 h-[18px] w-[18px] shrink-0 text-line-2" />}
            <span className={i.done ? 'text-muted line-through' : ''}>
              <span className="block text-sm font-semibold">{i.label}</span>
              {!i.done && <span className="block text-[12.5px] text-muted">{i.hint}</span>}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}

function MiniProducts({ items }: { items: { id: string; slug: string; name: string; image: string | null; priceXOF: number }[] }) {
  return (
    <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
      {items.map(p => (
        <li key={p.id}>
          <Link to={`/produit/${p.slug}`} className="lift block overflow-hidden rounded-2xl border border-line bg-white">
            <span className="block aspect-[4/3] overflow-hidden bg-paper-2">{p.image && <img src={p.image} alt="" loading="lazy" className="h-full w-full object-cover" />}</span>
            <span className="block p-2.5">
              <span className="line-clamp-2 min-h-[2.4em] text-[12.5px] font-semibold leading-snug">{p.name}</span>
              <span className="mt-1 block">
                <Price value={p.priceXOF} size="sm" />
              </span>
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

/** Favoris (enregistrés sur le compte) et produits consultés récemment (stockés sur l'appareil). */
export function FavoritesAndRecent() {
  const { user } = useApp();
  const favs = useAsync(async () => {
    const ids = await listFavoriteIds(user!.id);
    return listProductsByIds(ids.slice(0, 8));
  }, [user?.id]);
  const [recent, setRecent] = useState(readRecent);

  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
      <section className="card p-5">
        <h2 className="mb-3 flex items-center gap-2 text-base font-semibold">
          <Heart className="h-4 w-4 text-brand" /> Mes favoris
        </h2>
        {favs.loading ? (
          <Skeleton className="h-32" />
        ) : !favs.data?.length ? (
          <p className="py-4 text-sm text-muted">
            Touchez le cœur sur une fiche produit pour la retrouver ici. <Link to="/catalogue" className="font-semibold text-brand-700 hover:underline">Explorer le catalogue</Link>
          </p>
        ) : (
          <MiniProducts items={favs.data.map(p => ({ id: p.id, slug: p.slug, name: p.name, image: p.images[0] || null, priceXOF: p.priceXOF }))} />
        )}
      </section>

      <section className="card p-5">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="flex items-center gap-2 text-base font-semibold">
            <History className="h-4 w-4 text-brand" /> Consultés récemment
          </h2>
          {recent.length > 0 && (
            <button
              type="button"
              onClick={() => {
                clearRecent();
                setRecent([]);
              }}
              className="text-[12.5px] font-semibold text-muted hover:text-ink"
            >
              Effacer
            </button>
          )}
        </div>
        {recent.length === 0 ? <p className="py-4 text-sm text-muted">Les produits que vous consultez apparaîtront ici, sur cet appareil.</p> : <MiniProducts items={recent.slice(0, 8)} />}
      </section>
    </div>
  );
}
