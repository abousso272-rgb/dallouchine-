import React from 'react';
import { MessageCircle } from 'lucide-react';
import { Link } from '../ui/Link';
import { Logo } from '../ui/Logo';
import { CONTACT, whatsappLink } from '../../lib/config';

export function SiteFooter() {
  return (
    <footer className="relative mt-24 overflow-hidden rounded-t-[32px] bg-ink text-white/80 sm:rounded-t-[44px]">
      <div className="pointer-events-none absolute -left-24 -top-32 h-80 w-80 rounded-full bg-brand/25 blur-3xl" aria-hidden />
      <div className="pointer-events-none absolute -right-24 bottom-0 h-72 w-72 rounded-full bg-brand-400/10 blur-3xl" aria-hidden />
      <div className="h-1 w-full bg-brand-gradient" aria-hidden />
      <div className="container-page relative grid grid-cols-1 gap-10 py-14 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div>
          <Logo inverted />
          <p className="mt-5 max-w-xs text-sm leading-relaxed text-white/60">
            Votre passerelle commerciale et logistique entre la Chine et l’Afrique : achat, groupage, sourcing, automobile et suivi jusqu’à la livraison.
          </p>
          <a
            href={whatsappLink('Bonjour DALUCHE, j’ai une question.')}
            target="_blank"
            rel="noreferrer"
            className="mt-6 inline-flex h-11 items-center gap-2 rounded-full bg-[#25d366] px-5 text-sm font-semibold text-[#06361c] shadow-[0_10px_24px_-12px_rgb(37_211_102/0.7)] hover:brightness-105"
          >
            <MessageCircle className="h-4 w-4" /> WhatsApp {CONTACT.phoneDisplay}
          </a>
        </div>
        <FooterCol
          title="Acheter"
          links={[
            ['/catalogue', 'Catalogue'],
            ['/groupages', 'Groupages en cours'],
            ['/automobile', 'Automobile & motos'],
            ['/panier', 'Mon panier']
          ]}
        />
        <FooterCol
          title="Importer sur mesure"
          links={[
            ['/sourcing', 'Sourcing personnalisé'],
            ['/pro', 'Commandes professionnelles'],
            ['/#fonctionnement', 'Comment ça marche']
          ]}
        />
        <FooterCol
          title="Suivi"
          links={[
            ['/suivi', 'Suivre une commande'],
            ['/compte', 'Mon espace client'],
            ['/compte/demandes', 'Mes demandes & devis'],
            ['/espace-pro', 'Espace professionnel']
          ]}
        />
      </div>
      <div className="relative border-t border-white/10">
        <div className="container-page flex flex-col gap-2 py-5 text-[12.5px] text-white/45 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} DALUCHE · {CONTACT.city}</p>
          <p>Paiements sécurisés via GeniusPay · Wave · Orange Money · MTN · Carte</p>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({ title, links }: { title: string; links: [string, string][] }) {
  return (
    <div>
      <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-white/40">{title}</p>
      <ul className="mt-4 space-y-2.5">
        {links.map(([to, label]) => (
          <li key={to}>
            <Link to={to} className="text-sm text-white/75 hover:text-white">
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
