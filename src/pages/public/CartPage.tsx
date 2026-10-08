import React from 'react';
import { ArrowRight, ShoppingBag, Trash2 } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { formatXOF } from '../../lib/format';
import { Button } from '../../components/ui/Button';
import { Link } from '../../components/ui/Link';
import { EmptyState, PageLoader } from '../../components/ui/States';
import { QuantityInput } from '../../components/commerce/QuantityInput';
import { PaymentLogos } from '../../components/commerce/PaymentLogos';
import { CheckoutSteps } from './CheckoutPage';

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
    <div className="container-page pb-40 pt-6 sm:pt-8 lg:pb-12">
      <CheckoutSteps current={0} />
      <h1 className="mt-6 text-[28px] font-bold sm:text-4xl">Panier</h1>
      <p className="mt-1 text-[15px] text-muted">
        {cartCount} article{cartCount > 1 ? 's' : ''}
      </p>
      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[1fr_360px]">
        <ul className="surface divide-y divide-line overflow-hidden">
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
          <div className="surface p-5 sm:p-6">
            <h2 className="text-base font-bold">Récapitulatif</h2>
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
            <Button block size="lg" className="mt-5 hidden lg:inline-flex" onClick={checkout} iconRight={<ArrowRight className="h-4 w-4" />}>
              {user ? 'Passer la commande' : 'Continuer'}
            </Button>
            <PaymentLogos className="mt-4 justify-center" />
          </div>
          <Link to="/catalogue" className="mt-4 block text-center text-sm font-semibold text-muted hover:text-ink">
            Continuer mes achats
          </Link>
        </aside>
      </div>

      <div className="safe-bottom fixed inset-x-0 bottom-0 z-40 px-2 pb-2 lg:hidden">
        <div className="glass flex items-center gap-3 rounded-[22px] p-2.5 pl-4 shadow-[0_-4px_30px_-12px_rgb(120_60_20/0.4)]">
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">Sous-total</p>
            <p className="num truncate font-display text-[19px] font-bold leading-tight">{formatXOF(cartTotal)}</p>
          </div>
          <Button size="lg" onClick={checkout} iconRight={<ArrowRight className="h-4 w-4" />}>
            Commander
          </Button>
        </div>
      </div>
    </div>
  );
}
