import React from 'react';
import { BellRing, CreditCard, MessageSquareText, PackageSearch } from 'lucide-react';
import { AuthForm } from '../../components/auth/AuthForm';
import { LogoMark } from '../../components/ui/Logo';
import { FlagCN, FlagSN } from '../../components/ui/Flags';
import { PHOTOS } from '../../lib/config';

export default function AuthPage({ mode }: { mode: 'login' | 'register' }) {
  const perks = [
    { icon: PackageSearch, text: 'Suivi de vos commandes en temps réel' },
    { icon: MessageSquareText, text: 'Devis et échanges avec votre conseiller' },
    { icon: CreditCard, text: 'Paiements Wave, Orange Money, carte' },
    { icon: BellRing, text: 'Notifications à chaque étape' }
  ];
  return (
    <div className="container-page grid grid-cols-1 gap-8 py-8 sm:py-12 lg:grid-cols-[1.05fr_1fr] lg:items-stretch">
      <div className="relative hidden overflow-hidden rounded-[32px] bg-ink p-10 text-white lg:flex lg:flex-col lg:justify-between">
        <img src={PHOTOS.ship} alt="" className="absolute inset-0 h-full w-full object-cover opacity-30" />
        <div className="absolute inset-0 bg-gradient-to-br from-ink via-ink/85 to-brand/50" aria-hidden />
        <div className="relative">
          <div className="flex items-center gap-3">
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/95">
              <LogoMark className="h-11 w-11" />
            </span>
            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-[12.5px] font-semibold backdrop-blur">
              <FlagCN className="h-3.5 w-5" /> Chine → Sénégal <FlagSN className="h-3.5 w-5" />
            </span>
          </div>
          <h1 className="mt-10 text-[40px] font-bold leading-[1.05] text-white">
            Votre espace <span className="text-brand-gradient">DALUCHE</span>
          </h1>
          <p className="mt-4 max-w-md text-[15.5px] leading-relaxed text-white/70">
            Un seul compte pour acheter, participer aux groupages, demander un sourcing et suivre chaque étape jusqu’à la livraison.
          </p>
        </div>
        <ul className="relative mt-10 grid grid-cols-2 gap-3 text-[13.5px]">
          {perks.map(p => (
            <li key={p.text} className="flex items-start gap-3 rounded-2xl bg-white/[0.07] p-3.5 ring-1 ring-white/10 backdrop-blur">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-gradient">
                <p.icon className="h-4 w-4" />
              </span>
              <span className="text-white/85">{p.text}</span>
            </li>
          ))}
        </ul>
      </div>
      <div className="mx-auto flex w-full max-w-md flex-col justify-center">
        <h1 className="mb-1 text-[28px] font-bold">{mode === 'login' ? 'Bon retour 👋' : 'Créer votre compte'}</h1>
        <p className="mb-6 text-[14.5px] text-muted">{mode === 'login' ? 'Connectez-vous pour suivre vos commandes, groupages et devis.' : 'Gratuit, en 30 secondes. Suivez vos commandes et devis.'}</p>
        <div className="surface p-5 sm:p-7">
          {/* La redirection après connexion (espace client ou pro, ou ?next=) est gérée par le routeur */}
          <AuthForm key={mode} initialMode={mode} />
        </div>
      </div>
    </div>
  );
}
