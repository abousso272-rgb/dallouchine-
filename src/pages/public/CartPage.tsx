import React from 'react';
import { ArrowRight, ShoppingBag, Trash2 } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { formatXOF } from '../../lib/format';
import { Button } from '../../components/ui/Button';
import { Link } from '../../components/ui/Link';
import { EmptyState, PageLoader } from '../../components/ui/States';
import { QuantityInput } from '../../components/commerce/QuantityInput';
import { PaymentLogos } from '../../components/commerce/PaymentLogos';

export default function CartPage() {
  const { cart, cartTotal, cartCount, setCartQuantity, removeFromCart, cartLoading, user, requireAuth, navigate } = useApp();

  if (cartLoading && !cart.length) return <PageLoader />;

  if (!cart.length) {
    return (
      <div className="container-page max-w-3xl py-12">
        <div className="card">
          <EmptyState
            icon={<ShoppingBag className="h-5 w-5" />}
            title="Votre panier est vide"
            description="Parcourez le catalogue ou rejoignez un groupage pour profiter du prix usine."
            action={
              <div className="flex gap-2">
                <Button to="/catalogue">Voir le catalogue</Button>
                <Button to="/groupages" variant="secondary">
                  Groupages
                </Button>
              </div>
            }
          />
        </div>
      </div>
    );
  }

  function checkout() {
    if (!requireAuth({ reason: 'Connectez-vous ou créez votre compte pour finaliser la commande.', mode: 'register', onSuccess: () => navigate('/commande') })) return;
    navigate('/commande');
  }

  return (
    <div className="container-page py-8 sm:py-10">
      <h1 className="text-[28px] font-semibold sm:text-4xl">Panier</h1>
      <p className="mt-1 text-[15px] text-muted">
        {cartCount} article{cartCount > 1 ? 's' : ''}
      </p>
      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_360px]">
        <ul className="card divide-y divide-line">
          {cart.map(line => (
            <li key={line.key} className="flex gap-3 p-4 sm:gap-4 sm:p-5">
              <Link to={`/produit/${line.product.slug}`} className="h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-paper-2 sm:h-24 sm:w-24">
                <img src={line.product.images[0]} alt="" className="h-full w-full object-cover" />
              </Link>
              <div className="flex min-w-0 flex-1 flex-col">
                <div className="flex items-start justify-between gap-2">
                  <Link to={`/produit/${line.product.slug}`} className="line-clamp-2 text-[14.5px] font-semibold leading-snug hover:text-brand">
                    {line.product.name}
                  </Link>
                  <button type="button" onClick={() => removeFromCart(line.productId)} className="rounded-lg p-1.5 text-subtle hover:bg-paper hover:text-red-700" aria-label="Retirer du panier">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                <p className="num mt-0.5 text-[13px] text-muted">{formatXOF(line.unitPriceXOF)} / unité</p>
                <div className="mt-auto flex items-end justify-between gap-2 pt-3">
                  <QuantityInput size="sm" value={line.quantity} min={line.product.moq} onChange={q => setCartQuantity(line.productId, q)} />
                  <p className="num font-display text-base font-semibold">{formatXOF(line.unitPriceXOF * line.quantity)}</p>
                </div>
                {line.product.moq > 1 && <p className="mt-1 text-[11.5px] text-muted">Minimum {line.product.moq} unités</p>}
              </div>
            </li>
          ))}
        </ul>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="card p-5 sm:p-6">
            <h2 className="text-base font-semibold">Récapitulatif</h2>
            <dl className="mt-4 space-y-2.5 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted">Sous-total produits</dt>
                <dd className="num font-semibold">{formatXOF(cartTotal)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted">Transport</dt>
                <dd className="text-muted">Calculé à l’étape suivante</dd>
              </div>
            </dl>
            <Button block size="lg" className="mt-5" onClick={checkout} iconRight={<ArrowRight className="h-4 w-4" />}>
              {user ? 'Passer la commande' : 'Continuer'}
            </Button>
            <PaymentLogos className="mt-4 justify-center" />
          </div>
          <Link to="/catalogue" className="mt-4 block text-center text-sm font-semibold text-muted hover:text-ink">
            Continuer mes achats
          </Link>
        </aside>
      </div>
    </div>
  );
}
