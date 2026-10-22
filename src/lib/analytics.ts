/**
 * Mesure d'audience :
 * 1. Statistiques maison (toujours actives, sans cookie ni donnée personnelle) : POST /api/track, identifiant
 *    de visite aléatoire valable pour l'onglet seulement (sessionStorage).
 * 2. Google Analytics 4 (si VITE_GA_MEASUREMENT_ID est défini) : chargé uniquement après accord du visiteur.
 */

const GA_ID = (import.meta.env.VITE_GA_MEASUREMENT_ID as string | undefined)?.trim() || '';
export const gaConfigured = /^G-[A-Z0-9]{6,12}$/.test(GA_ID);

const CONSENT_KEY = 'dallouchine_consent_v1';
const SID_KEY = 'dallouchine_sid';
const UTM_KEY = 'dallouchine_utm';

export type Consent = 'granted' | 'denied' | null;

export function readConsent(): Consent {
  try {
    const v = localStorage.getItem(CONSENT_KEY);
    return v === 'granted' || v === 'denied' ? v : null;
  } catch {
    return null;
  }
}

export function setConsent(v: 'granted' | 'denied') {
  try {
    localStorage.setItem(CONSENT_KEY, v);
  } catch {
    /* ignore */
  }
  if (v === 'granted') loadGa();
  window.dispatchEvent(new CustomEvent('dc:consent', { detail: v }));
}

// ---------------------------------------------------------------------------
// Google Analytics 4
// ---------------------------------------------------------------------------

type Gtag = (...args: unknown[]) => void;
declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: Gtag;
  }
}

let gaLoaded = false;

function loadGa() {
  if (!gaConfigured || gaLoaded || typeof document === 'undefined') return;
  gaLoaded = true;
  window.dataLayer = window.dataLayer || [];
  window.gtag = function gtag() {
    // eslint-disable-next-line prefer-rest-params
    window.dataLayer!.push(arguments);
  };
  window.gtag('js', new Date());
  // Les pages vues sont envoyées à chaque changement d'écran (application à page unique)
  window.gtag('config', GA_ID, { send_page_view: false, anonymize_ip: true });
  const s = document.createElement('script');
  s.async = true;
  s.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(GA_ID)}`;
  document.head.appendChild(s);
  gaPageView(window.location.pathname + window.location.search);
}

function gaPageView(path: string) {
  if (!gaLoaded || !window.gtag) return;
  window.gtag('event', 'page_view', { page_path: path, page_location: window.location.origin + path, page_title: document.title });
}

/** À appeler au démarrage : charge GA si le visiteur a déjà accepté. */
export function initAnalytics() {
  captureUtm();
  if (readConsent() === 'granted') loadGa();
}

// ---------------------------------------------------------------------------
// Statistiques maison
// ---------------------------------------------------------------------------

function sessionId(): { sid: string; isNew: boolean } {
  try {
    const existing = sessionStorage.getItem(SID_KEY);
    if (existing) return { sid: existing, isNew: false };
    const sid = (crypto.randomUUID?.() || `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`).replace(/[^a-z0-9-]/gi, '');
    sessionStorage.setItem(SID_KEY, sid);
    return { sid, isNew: true };
  } catch {
    return { sid: `nostore-${Math.random().toString(36).slice(2, 12)}`, isNew: true };
  }
}

/** Mémorise la provenance de la visite (utm_source…, site d'origine) pour toute la session. */
function captureUtm() {
  try {
    if (sessionStorage.getItem(UTM_KEY)) return;
    const q = new URLSearchParams(window.location.search);
    sessionStorage.setItem(
      UTM_KEY,
      JSON.stringify({
        utm_source: q.get('utm_source') || '',
        utm_medium: q.get('utm_medium') || '',
        utm_campaign: q.get('utm_campaign') || '',
        referrer: document.referrer || ''
      })
    );
  } catch {
    /* ignore */
  }
}

function utm(): Record<string, string> {
  captureUtm();
  try {
    return JSON.parse(sessionStorage.getItem(UTM_KEY) || '{}');
  } catch {
    return {};
  }
}

let lastPath = '';

function send(event: string, path: string) {
  const { sid, isNew } = sessionId();
  const u = utm();
  const body = JSON.stringify({
    sid,
    event,
    path,
    referrer: u.referrer || '',
    utm_source: u.utm_source || '',
    utm_medium: u.utm_medium || '',
    utm_campaign: u.utm_campaign || '',
    lang: (navigator.language || '').slice(0, 8),
    new_session: isNew && event === 'page_view'
  });
  try {
    if (navigator.sendBeacon && navigator.sendBeacon('/api/track', new Blob([body], { type: 'application/json' }))) return;
  } catch {
    /* repli sur fetch */
  }
  fetch('/api/track', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body, keepalive: true }).catch(() => undefined);
}

/** Page vue (appelée par le routeur à chaque changement d'écran). */
export function trackPageView(path: string) {
  if (path === lastPath) return;
  lastPath = path;
  send('page_view', path);
  gaPageView(path);
}

export type TrackedEvent = 'add_to_cart' | 'begin_checkout' | 'sign_up' | 'login' | 'request_quote' | 'join_groupage' | 'search' | 'assistant_question' | 'whatsapp_click';

/** Événement de conversion (ajout au panier, demande de devis…). */
export function trackEvent(event: TrackedEvent, params: Record<string, unknown> = {}) {
  send(event, window.location.pathname);
  if (gaLoaded && window.gtag) window.gtag('event', event, params);
}
