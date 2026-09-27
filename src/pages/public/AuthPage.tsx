import React from 'react';
import { CheckCircle2 } from 'lucide-react';
import { AuthForm } from '../../components/auth/AuthForm';
import { Logo } from '../../components/ui/Logo';

export default function AuthPage({ mode }: { mode: 'login' | 'register' }) {
  return (
    <div className="container-page grid gap-10 py-10 sm:py-14 lg:grid-cols-2 lg:items-center">
      <div className="hidden lg:block">
        <Logo />
        <h1 className="mt-8 text-4xl font-semibold leading-tight">Votre espace DALUCHE</h1>
        <p className="mt-3 max-w-md text-[15.5px] leading-relaxed text-muted">Un seul compte pour acheter, participer aux groupages, demander un sourcing et suivre chaque étape jusqu’à la livraison.</p>
        <ul className="mt-8 space-y-3 text-[15px]">
          {['Suivi de vos commandes en temps réel', 'Devis et échanges avec votre conseiller', 'Historique de vos paiements', 'Notifications à chaque étape'].map(t => (
            <li key={t} className="flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5 text-jade" /> {t}
            </li>
          ))}
        </ul>
      </div>
      <div className="mx-auto w-full max-w-md">
        <h1 className="mb-1 text-2xl font-semibold lg:hidden">{mode === 'login' ? 'Connexion' : 'Créer un compte'}</h1>
        <p className="mb-6 text-sm text-muted lg:hidden">Suivez vos commandes, groupages et devis.</p>
        <div className="card p-5 sm:p-7">
          {/* La redirection après connexion (espace client ou pro, ou ?next=) est gérée par le routeur */}
          <AuthForm key={mode} initialMode={mode} />
        </div>
      </div>
    </div>
  );
}
