import { useEffect } from 'react';

/**
 * Titre, description, adresse canonique, image de partage et données structurées de la page affichée.
 * Le serveur pose déjà ces balises pour les fiches produit, groupage et véhicule (aperçus WhatsApp) ;
 * ce crochet les tient à jour pendant la navigation dans l'application.
 */

export interface Seo {
  title: string;
  description?: string;
  /** Adresse sans le domaine, par ex. /catalogue. Par défaut : l'adresse actuelle sans paramètres. */
  path?: string;
  image?: string | null;
  type?: 'website' | 'product' | 'article';
  noindex?: boolean;
  jsonLd?: Record<string, unknown> | null;
}

const SITE = 'Dallou Chine';
const DEFAULT_DESCRIPTION = 'Catalogue, groupages, sourcing sur mesure, B2B et automobile : l’import Chine–Afrique, simple et suivi, livré à Dakar.';

function setMeta(attr: 'name' | 'property', key: string, content: string | null) {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
  if (content === null) {
    el?.remove();
    return;
  }
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.content = content;
}

function setCanonical(href: string) {
  let el = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!el) {
    el = document.createElement('link');
    el.rel = 'canonical';
    document.head.appendChild(el);
  }
  el.href = href;
}

function setJsonLd(data: Record<string, unknown> | null | undefined) {
  const id = 'seo-jsonld';
  let el = document.getElementById(id) as HTMLScriptElement | null;
  if (!data) {
    el?.remove();
    return;
  }
  if (!el) {
    el = document.createElement('script');
    el.type = 'application/ld+json';
    el.id = id;
    document.head.appendChild(el);
  }
  el.textContent = JSON.stringify(data);
}

export function applySeo(s: Seo) {
  const origin = window.location.origin;
  const title = s.title.includes(SITE) ? s.title : `${s.title} | ${SITE}`;
  const description = (s.description || DEFAULT_DESCRIPTION).replace(/\s+/g, ' ').trim().slice(0, 160);
  const url = origin + (s.path ?? window.location.pathname);
  const image = s.image && /^https?:\/\//.test(s.image) ? s.image : `${origin}/brand/og.jpg`;
  document.title = title;
  setMeta('name', 'description', description);
  setMeta('name', 'robots', s.noindex ? 'noindex, nofollow' : 'index, follow, max-image-preview:large');
  setMeta('property', 'og:title', title);
  setMeta('property', 'og:description', description);
  setMeta('property', 'og:url', url);
  setMeta('property', 'og:image', image);
  setMeta('property', 'og:type', s.type || 'website');
  setMeta('name', 'twitter:title', title);
  setMeta('name', 'twitter:description', description);
  setMeta('name', 'twitter:image', image);
  setCanonical(url);
  setJsonLd(s.jsonLd);
}

/** À appeler dans chaque page publique. Les dépendances déclenchent la mise à jour (données chargées…). */
export function useSeo(s: Seo | null, deps: unknown[] = []) {
  useEffect(() => {
    if (s) applySeo(s);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}

/** Pages privées (espace client, espace pro, panier…) : jamais indexées. */
const PRIVATE = /^\/(compte|espace-pro|panier|commande|paiement|connexion|inscription|mot-de-passe|invitation|bienvenue)(\/|$)/;
export const isPrivatePath = (path: string) => PRIVATE.test(path);

export function productJsonLd(p: { name: string; description: string; images: string[]; sku?: string | null; priceXOF: number; inStock: boolean; category?: string; url: string }) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: p.name,
    description: p.description.slice(0, 500),
    image: p.images.slice(0, 5),
    sku: p.sku || undefined,
    category: p.category || undefined,
    offers: {
      '@type': 'Offer',
      url: p.url,
      priceCurrency: 'XOF',
      price: Math.round(p.priceXOF),
      availability: p.inStock ? 'https://schema.org/InStock' : 'https://schema.org/PreOrder',
      seller: { '@type': 'Organization', name: SITE }
    }
  };
}
