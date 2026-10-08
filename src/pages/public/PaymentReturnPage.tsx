import React, { useCallback, useEffect, useRef, useState } from 'react';
import { CheckCircle2, Clock, XCircle } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { getPaymentStatus, startPayment, type PaymentStatusResponse } from '../../lib/api';
import { friendlyError } from '../../lib/db';
import { formatXOF } from '../../lib/format';
import { Button } from '../../components/ui/Button';
import { PageLoader, InlineAlert } from '../../components/ui/States';
import { AuthForm } from '../../components/auth/AuthForm';

type State = 'checking' | 'paid' | 'pending' | 'failed';

/**
 * Retour de la page de paiement sécurisée. Le statut affiché provient du serveur
 * (webhook signé ou vérification directe auprès de la passerelle), jamais des paramètres d'URL.
 */
export default function PaymentReturnPage() {
  const { query, user, authLoading, toast, refreshUnread } = useApp();
  const orderId = query.get('orderId') || '';
  const cancelled = query.get('cancelled') === '1';
  const [state, setState] = useState<State>('checking');
  const [data, setData] = useState<PaymentStatusResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [retrying, setRetrying] = useState(false);
  const attempts = useRef(0);

  const check = useCallback(async () => {
    if (!orderId) return;
    try {
      const res = await getPaymentStatus(orderId);
      setData(res);
      const ps = res.order?.paymentStatus;
      if (ps === 'paid') {
        setState('paid');
        refreshUnread();
        return;
      }
      if (ps === 'failed' || ps === 'cancelled' || ps === 'expired' || cancelled) {
        setState('failed');
        return;
      }
      attempts.current += 1;
      if (attempts.current < 6) window.setTimeout(check, 2500);
      else setState('pending');
    } catch (err) {
      setError(friendlyError(err));
      setState('pending');
    }
  }, [orderId, cancelled, refreshUnread]);

  useEffect(() => {
    if (!authLoading && user && orderId) check();
  }, [authLoading, user, orderId, check]);

  if (!orderId) {
    return (
      <div className="container-page max-w-lg py-16">
        <InlineAlert tone="warning">Lien de retour de paiement incomplet. Retrouvez vos commandes dans votre espace client.</InlineAlert>
        <Button to="/compte/commandes" className="mt-4">
          Mes commandes
        </Button>
      </div>
    );
  }
  if (authLoading) return <PageLoader />;
  if (!user) {
    return (
      <div className="container-page max-w-md py-10">
        <h1 className="text-2xl font-bold">Reconnectez-vous</h1>
        <p className="mb-6 mt-1 text-sm text-muted">Connectez-vous pour afficher le statut de votre paiement.</p>
        <div className="card p-5">
          <AuthForm />
        </div>
      </div>
    );
  }

  async function retry() {
    setRetrying(true);
    try {
      await startPayment(orderId);
    } catch (err) {
      toast('error', 'Paiement non démarré', friendlyError(err));
      setRetrying(false);
    }
  }

  const order = data?.order;

  return (
    <div className="container-page max-w-xl py-12 sm:py-16">
      <div className="card p-6 text-center sm:p-10">
        {state === 'checking' && (
          <>
            <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-line border-t-brand" />
            <h1 className="mt-5 text-2xl font-bold">Confirmation du paiement…</h1>
            <p className="mt-2 text-muted">Nous vérifions votre paiement auprès de l’opérateur. Cela prend quelques secondes.</p>
          </>
        )}
        {state === 'paid' && (
          <>
            <CheckCircle2 className="mx-auto h-14 w-14 text-jade" />
            <h1 className="mt-4 text-2xl font-bold sm:text-3xl">Paiement confirmé</h1>
            <p className="mt-2 text-muted">
              Merci ! Votre commande <span className="num font-semibold text-ink">{order?.trackingCode}</span> de {formatXOF(order?.totalXOF)} est enregistrée. Nous vous tenons informé à chaque étape.
            </p>
            <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
              <Button to={`/compte/commandes/${orderId}`}>Suivre ma commande</Button>
              <Button to="/catalogue" variant="secondary">
                Continuer mes achats
              </Button>
            </div>
          </>
        )}
        {state === 'pending' && (
          <>
            <Clock className="mx-auto h-14 w-14 text-amber-500" />
            <h1 className="mt-4 text-2xl font-bold">Paiement en cours de confirmation</h1>
            <p className="mt-2 text-muted">
              La confirmation de l’opérateur peut prendre quelques minutes. Votre commande sera mise à jour automatiquement : vous recevrez une notification.
            </p>
            {error && <p className="mt-3 text-sm text-red-700">{error}</p>}
            <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
              <Button
                variant="secondary"
                onClick={() => {
                  attempts.current = 0;
                  setState('checking');
                  check();
                }}
              >
                Vérifier à nouveau
              </Button>
              <Button to={`/compte/commandes/${orderId}`}>Voir ma commande</Button>
            </div>
          </>
        )}
        {state === 'failed' && (
          <>
            <XCircle className="mx-auto h-14 w-14 text-red-600" />
            <h1 className="mt-4 text-2xl font-bold">Paiement non abouti</h1>
            <p className="mt-2 text-muted">Aucun montant n’a été débité pour cette tentative. Votre commande est conservée : vous pouvez réessayer.</p>
            <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
              <Button loading={retrying} onClick={retry}>
                Réessayer le paiement
              </Button>
              <Button to={`/compte/commandes/${orderId}`} variant="secondary">
                Voir ma commande
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
