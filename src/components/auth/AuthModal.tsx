import React from 'react';
import { useApp } from '../../context/AppContext';
import { Modal } from '../ui/Modal';
import { AuthForm } from './AuthForm';

/** Connexion / inscription rapide sans quitter la page (réservation, demande, paiement…). */
export function AuthModal() {
  const { authPrompt, closeAuthPrompt } = useApp();
  if (!authPrompt) return null;
  return (
    <Modal
      open
      onClose={closeAuthPrompt}
      title={authPrompt.mode === 'register' ? 'Créez votre compte en 30 secondes' : 'Connectez-vous pour continuer'}
      description={authPrompt.reason}
      size="sm"
    >
      <AuthForm
        compact
        initialMode={authPrompt.mode}
        onSuccess={() => {
          const next = authPrompt.onSuccess;
          closeAuthPrompt();
          // Laisse le temps à la session de se propager avant de reprendre l'action
          if (next) window.setTimeout(next, 250);
        }}
      />
    </Modal>
  );
}
