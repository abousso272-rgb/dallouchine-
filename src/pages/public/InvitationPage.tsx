import React, { useState } from 'react';
import { ShieldCheck } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useAsync } from '../../lib/hooks';
import { acceptInvitation, getInvitation } from '../../services/admin';
import { friendlyError } from '../../lib/db';
import { ROLE_LABEL } from '../../lib/status';
import { Button } from '../../components/ui/Button';
import { InlineAlert, PageLoader } from '../../components/ui/States';
import { AuthForm } from '../../components/auth/AuthForm';

export default function InvitationPage() {
  const { query, user, authLoading, refreshUser, navigate, toast, signOut } = useApp();
  const token = query.get('token') || '';
  const invite = useAsync(() => (token ? getInvitation(token) : Promise.resolve({ status: 'not_found' } as Awaited<ReturnType<typeof getInvitation>>)), [token]);
  const [accepting, setAccepting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (authLoading || invite.loading) return <PageLoader />;
  const inv = invite.data;

  async function accept() {
    setAccepting(true);
    setError(null);
    try {
      await acceptInvitation(token);
      await refreshUser();
      toast('success', 'Accès activé', 'Bienvenue dans l’équipe DALUCHE.');
      navigate('/espace-pro', { replace: true });
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setAccepting(false);
    }
  }

  return (
    <div className="container-page max-w-md py-12">
      <div className="card p-6 sm:p-8">
        <ShieldCheck className="h-9 w-9 text-brand" />
        <h1 className="mt-4 text-2xl font-semibold">Invitation équipe DALUCHE</h1>
        {!inv || inv.status === 'not_found' || invite.error ? (
          <InlineAlert tone="danger">{invite.error || 'Invitation introuvable. Vérifiez le lien reçu.'}</InlineAlert>
        ) : inv.status !== 'pending' ? (
          <InlineAlert tone="warning">{inv.status === 'expired' ? 'Cette invitation a expiré. Demandez-en une nouvelle à l’administrateur.' : inv.status === 'accepted' ? 'Cette invitation a déjà été utilisée.' : 'Cette invitation a été révoquée.'}</InlineAlert>
        ) : (
          <>
            <p className="mt-2 text-[15px] text-muted">
              Vous êtes invité(e) en tant que <strong className="text-ink">{ROLE_LABEL[inv.role || ''] || inv.role}</strong> avec l’adresse <strong className="text-ink">{inv.email}</strong>.
            </p>
            {user ? (
              user.email.toLowerCase() === (inv.email || '').toLowerCase() ? (
                <div className="mt-6 space-y-3">
                  {error && <InlineAlert tone="danger">{error}</InlineAlert>}
                  <Button block size="lg" loading={accepting} onClick={accept}>
                    Accepter et accéder à l’espace pro
                  </Button>
                </div>
              ) : (
                <div className="mt-6 space-y-3">
                  <InlineAlert tone="warning">
                    Vous êtes connecté(e) avec {user.email || 'un autre compte'}. Déconnectez-vous puis connectez-vous avec {inv.email}.
                  </InlineAlert>
                  <Button variant="secondary" block onClick={signOut}>
                    Me déconnecter
                  </Button>
                </div>
              )
            ) : (
              <div className="mt-6">
                <p className="mb-4 text-sm text-muted">Créez votre compte (ou connectez-vous) avec cette adresse email, puis acceptez l’invitation.</p>
                <AuthForm initialMode="register" compact />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
