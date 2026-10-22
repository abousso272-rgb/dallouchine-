import { Router, Request, Response } from 'express';
import { readFile } from 'fs/promises';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import { config } from '../config';
import { optionalAuth } from '../middleware/auth';
import { recordEvent } from '../services/AudienceService';

/**
 * Référencement et mesure d'audience.
 * - /sitemap.xml et /robots.txt (servis via une réécriture Vercel vers l'API)
 * - /produit/:slug, /groupages/:id, /automobile/:slug : la page de l'application avec titre, description,
 *   image et données structurées déjà présents dans le HTML (aperçus WhatsApp / Facebook et Google)
 * - POST /api/track : statistiques de visite maison
 */
export const seoRouter = Router();

const publicDb = createClient(config.supabaseUrl, config.supabaseAnonKey, { auth: { persistSession: false, autoRefreshToken: false } });
const SITE = 'Dallou Chine';
const BASE = () => config.appUrl;

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const clip = (s: string, n: number) => (s.length > n ? s.slice(0, n - 1).trimEnd() + '…' : s);
const plain = (s: string | null | undefined) => (s || '').replace(/\s+/g, ' ').trim();

// ---------------------------------------------------------------------------
// robots.txt et sitemap.xml
// ---------------------------------------------------------------------------

const PRIVATE = ['/compte', '/espace-pro', '/panier', '/commande', '/paiement', '/connexion', '/inscription', '/mot-de-passe', '/invitation', '/bienvenue', '/api/'];

seoRouter.get('/robots.txt', (_req: Request, res: Response) => {
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=3600');
  res.send(['User-agent: *', 'Allow: /', ...PRIVATE.map(p => `Disallow: ${p}`), '', `Sitemap: ${BASE()}/sitemap.xml`, ''].join('\n'));
});

let sitemapCache: { xml: string; at: number } | null = null;

seoRouter.get('/sitemap.xml', async (_req: Request, res: Response) => {
  try {
    if (!sitemapCache || Date.now() - sitemapCache.at > 30 * 60 * 1000) {
      const [products, groupages, vehicles, categories] = await Promise.all([
        publicDb.from('products').select('slug, updated_at').eq('is_active', true).limit(5000),
        publicDb.from('groupages').select('id, updated_at, status').in('status', ['open', 'almost_full', 'full', 'validated']).limit(2000),
        publicDb.from('vehicles').select('slug, updated_at').eq('is_published', true).limit(2000),
        publicDb.from('categories').select('slug, updated_at').eq('is_active', true).limit(500)
      ]);
      const day = (d?: string | null) => (d ? new Date(d).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10));
      const urls: { loc: string; lastmod?: string; priority: string; freq: string }[] = [
        { loc: '/', priority: '1.0', freq: 'daily' },
        { loc: '/catalogue', priority: '0.9', freq: 'daily' },
        { loc: '/groupages', priority: '0.9', freq: 'daily' },
        { loc: '/sourcing', priority: '0.8', freq: 'monthly' },
        { loc: '/pro', priority: '0.7', freq: 'monthly' },
        { loc: '/automobile', priority: '0.7', freq: 'weekly' },
        { loc: '/guide', priority: '0.6', freq: 'monthly' },
        { loc: '/suivi', priority: '0.4', freq: 'yearly' },
        ...(categories.data || []).map(c => ({ loc: `/catalogue?categorie=${encodeURIComponent(c.slug)}`, lastmod: day(c.updated_at), priority: '0.7', freq: 'weekly' })),
        ...(products.data || []).map(p => ({ loc: `/produit/${encodeURIComponent(p.slug)}`, lastmod: day(p.updated_at), priority: '0.8', freq: 'weekly' })),
        ...(groupages.data || []).map(g => ({ loc: `/groupages/${g.id}`, lastmod: day(g.updated_at), priority: g.status === 'open' || g.status === 'almost_full' ? '0.8' : '0.5', freq: 'daily' })),
        ...(vehicles.data || []).map(v => ({ loc: `/automobile/${encodeURIComponent(v.slug)}`, lastmod: day(v.updated_at), priority: '0.6', freq: 'weekly' }))
      ];
      const xml =
        '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
        urls.map(u => `  <url><loc>${esc(BASE() + u.loc)}</loc>${u.lastmod ? `<lastmod>${u.lastmod}</lastmod>` : ''}<changefreq>${u.freq}</changefreq><priority>${u.priority}</priority></url>`).join('\n') +
        '\n</urlset>\n';
      sitemapCache = { xml, at: Date.now() };
    }
    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=1800');
    res.send(sitemapCache.xml);
  } catch (err) {
    console.error('[seo] sitemap:', (err as Error).message);
    res.status(500).type('text/plain').send('Sitemap indisponible');
  }
});

// ---------------------------------------------------------------------------
// Pages avec métadonnées dans le HTML
// ---------------------------------------------------------------------------

let shell: { html: string; at: number } | null = null;

async function getShell(): Promise<string | null> {
  if (shell && Date.now() - shell.at < 10 * 60 * 1000) return shell.html;
  // Serveur Node classique : le HTML construit est sur le disque. Sur Vercel, il est servi par le CDN.
  if (!process.env.VERCEL) {
    try {
      const html = await readFile(path.resolve(process.cwd(), 'dist', 'index.html'), 'utf8');
      shell = { html, at: Date.now() };
      return html;
    } catch {
      /* pas de build local : on tente l'adresse publique */
    }
  }
  try {
    const r = await fetch(`${BASE()}/index.html`, { signal: AbortSignal.timeout(3500) });
    if (r.ok) {
      const html = await r.text();
      if (html.includes('id="root"')) {
        shell = { html, at: Date.now() };
        return html;
      }
    }
  } catch (err) {
    console.warn('[seo] index.html indisponible:', (err as Error).message);
  }
  return shell?.html ?? null; // dernière copie connue
}

export interface PageMeta {
  title: string;
  description: string;
  path: string;
  image?: string | null;
  type?: 'website' | 'product';
  jsonLd?: Record<string, unknown>;
}

/** Remplace les balises de référencement du HTML de l'application par celles de la page. */
export function injectMeta(html: string, m: PageMeta): string {
  const url = BASE() + m.path;
  const image = m.image && /^https?:\/\//.test(m.image) ? m.image : `${BASE()}/brand/og.jpg`;
  // Titre trop long : on sacrifie le nom du site plutôt que l'information utile
  const title = m.title.length <= 70 ? m.title : clip(m.title.replace(/\s*\|\s*Dallou Chine[^|]*$/, ''), 70);
  const description = clip(m.description, 160);
  const block = [
    `<title>${esc(title)}</title>`,
    `<meta name="description" content="${esc(description)}" />`,
    `<link rel="canonical" href="${esc(url)}" />`,
    `<meta property="og:site_name" content="${SITE}" />`,
    `<meta property="og:type" content="${m.type || 'website'}" />`,
    `<meta property="og:title" content="${esc(title)}" />`,
    `<meta property="og:description" content="${esc(description)}" />`,
    `<meta property="og:url" content="${esc(url)}" />`,
    `<meta property="og:image" content="${esc(image)}" />`,
    `<meta property="og:locale" content="fr_SN" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${esc(title)}" />`,
    `<meta name="twitter:description" content="${esc(description)}" />`,
    `<meta name="twitter:image" content="${esc(image)}" />`,
    m.jsonLd ? `<script type="application/ld+json" id="seo-jsonld">${JSON.stringify(m.jsonLd).replace(/</g, '\\u003c')}</script>` : ''
  ]
    .filter(Boolean)
    .join('\n    ');
  return html
    .replace(/<title>[\s\S]*?<\/title>\s*/i, '')
    .replace(/<meta\s+(?:name|property)="(?:description|og:[^"]+|twitter:[^"]+)"[^>]*>\s*/gi, '')
    .replace(/<link\s+rel="canonical"[^>]*>\s*/gi, '')
    .replace(/<script type="application\/ld\+json"[^>]*>[\s\S]*?<\/script>\s*/gi, '')
    .replace(/(<meta charset="[^"]*"\s*\/?>)/i, `$1\n    ${block}`);
}

function fallbackPage(m: PageMeta): string {
  // Copie de l'application indisponible : métadonnées pour les robots, redirection immédiate pour les visiteurs
  return injectMeta(
    `<!doctype html><html lang="fr"><head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width, initial-scale=1" /></head><body><p><a href="/#!${esc(m.path)}">${esc(m.title)}</a></p><script>location.replace('/#!' + ${JSON.stringify(m.path)})</script></body></html>`,
    m
  );
}

async function sendPage(res: Response, meta: PageMeta | null, path: string) {
  const html = await getShell();
  const m = meta || { title: `${SITE} — Votre passerelle entre la Chine et l’Afrique`, description: 'Catalogue, groupages, sourcing sur mesure, B2B et automobile : l’import Chine–Afrique, simple et suivi.', path };
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=0, s-maxage=300, stale-while-revalidate=86400');
  if (!meta) res.status(404);
  res.send(html ? injectMeta(html, m) : fallbackPage(m));
}

const xof = (n: unknown) => `${new Intl.NumberFormat('fr-FR').format(Math.round(Number(n) || 0))} FCFA`;

seoRouter.get('/produit/:slug', async (req: Request, res: Response) => {
  const path = `/produit/${encodeURIComponent(req.params.slug)}`;
  try {
    const { data: p } = await publicDb
      .from('products')
      .select('id, name, slug, sku, short_description, description, price_xof, moq, stock_quantity, estimated_delivery_days, categories(name), product_images(image_url, sort_order, is_primary)')
      .eq('slug', req.params.slug)
      .eq('is_active', true)
      .maybeSingle();
    if (!p) return sendPage(res, null, path);
    const imgs = ((p as any).product_images || []).sort((a: any, b: any) => Number(b.is_primary) - Number(a.is_primary) || a.sort_order - b.sort_order).map((i: any) => i.image_url);
    const desc = plain(p.short_description) || plain(p.description) || `${p.name} importé de Chine, livré à Dakar.`;
    await sendPage(
      res,
      {
        title: `${p.name} — ${xof(p.price_xof)} | ${SITE}`,
        description: `${clip(desc, 110)} Prix : ${xof(p.price_xof)}${p.moq > 1 ? `, dès ${p.moq} unités` : ''}. Livraison à Dakar.`,
        path,
        image: imgs[0],
        type: 'product',
        jsonLd: {
          '@context': 'https://schema.org',
          '@type': 'Product',
          name: p.name,
          sku: p.sku || undefined,
          description: clip(desc, 500),
          image: imgs.slice(0, 5),
          category: (p as any).categories?.name || undefined,
          offers: {
            '@type': 'Offer',
            url: BASE() + path,
            priceCurrency: 'XOF',
            price: Math.round(Number(p.price_xof) || 0),
            availability: Number(p.stock_quantity) > 0 ? 'https://schema.org/InStock' : 'https://schema.org/PreOrder',
            seller: { '@type': 'Organization', name: SITE }
          }
        }
      },
      path
    );
  } catch (err) {
    console.error('[seo] produit:', (err as Error).message);
    await sendPage(res, { title: SITE, description: 'Import Chine–Afrique', path }, path);
  }
});

seoRouter.get('/groupages/:id', async (req: Request, res: Response) => {
  const path = `/groupages/${encodeURIComponent(req.params.id)}`;
  try {
    if (!/^[0-9a-f-]{36}$/i.test(req.params.id)) return sendPage(res, null, path);
    const { data: g } = await publicDb
      .from('groupages')
      .select('id, title, description, unit_price_xof, original_price_xof, target_quantity, reserved_quantity, deadline, status, image_url, products(name, product_images(image_url, is_primary, sort_order))')
      .eq('id', req.params.id)
      .neq('status', 'draft')
      .maybeSingle();
    if (!g) return sendPage(res, null, path);
    const prod = (g as any).products;
    const img = g.image_url || (prod?.product_images || []).sort((a: any, b: any) => Number(b.is_primary) - Number(a.is_primary))[0]?.image_url;
    const name = prod?.name || g.title;
    const saving = Number(g.original_price_xof) > Number(g.unit_price_xof) ? Math.round(((g.original_price_xof - g.unit_price_xof) / g.original_price_xof) * 100) : 0;
    await sendPage(
      res,
      {
        title: `Groupage ${name} — ${xof(g.unit_price_xof)}${saving ? ` (−${saving} %)` : ''} | ${SITE}`,
        description: `${clip(plain(g.description) || `Commande groupée : ${name}.`, 100)} ${g.reserved_quantity}/${g.target_quantity} réservés. Rejoignez avant le ${g.deadline ? new Date(g.deadline).toLocaleDateString('fr-FR') : 'bouclage'}.`,
        path,
        image: img,
        type: 'product',
        jsonLd: {
          '@context': 'https://schema.org',
          '@type': 'Product',
          name: `Groupage : ${name}`,
          image: img ? [img] : undefined,
          description: clip(plain(g.description) || name, 500),
          offers: {
            '@type': 'Offer',
            url: BASE() + path,
            priceCurrency: 'XOF',
            price: Math.round(Number(g.unit_price_xof) || 0),
            availability: ['open', 'almost_full'].includes(g.status) ? 'https://schema.org/LimitedAvailability' : 'https://schema.org/SoldOut',
            priceValidUntil: g.deadline ? new Date(g.deadline).toISOString().slice(0, 10) : undefined
          }
        }
      },
      path
    );
  } catch (err) {
    console.error('[seo] groupage:', (err as Error).message);
    await sendPage(res, { title: SITE, description: 'Groupages Chine–Afrique', path }, path);
  }
});

seoRouter.get('/automobile/:slug', async (req: Request, res: Response) => {
  const path = `/automobile/${encodeURIComponent(req.params.slug)}`;
  try {
    const { data: v } = await publicDb.from('vehicles').select('*').eq('slug', req.params.slug).eq('is_published', true).maybeSingle();
    if (!v) return sendPage(res, null, path);
    const price = v.price_xof && !v.price_on_request ? ` — ${xof(v.price_xof)}` : '';
    await sendPage(
      res,
      {
        title: `${v.title}${price} | ${SITE} Automobile`,
        description: clip(plain(v.description) || `${v.title} importé de Chine, livré au Sénégal. Devis sur demande.`, 160),
        path,
        image: Array.isArray(v.images) ? v.images[0] : null,
        type: 'product'
      },
      path
    );
  } catch (err) {
    console.error('[seo] véhicule:', (err as Error).message);
    await sendPage(res, { title: SITE, description: 'Automobile', path }, path);
  }
});

// ---------------------------------------------------------------------------
// Statistiques de visite
// ---------------------------------------------------------------------------

seoRouter.post('/api/track', optionalAuth, async (req: Request, res: Response) => {
  const b = req.body || {};
  const str = (v: unknown, n: number) => (typeof v === 'string' ? v.slice(0, n) : '');
  let ownHost = '';
  try {
    ownHost = new URL(BASE()).hostname.replace(/^www\./, '');
  } catch {
    /* ignore */
  }
  await recordEvent(
    {
      sid: str(b.sid, 64),
      event: str(b.event, 40) || 'page_view',
      path: str(b.path, 300),
      referrer: str(b.referrer, 500),
      utmSource: str(b.utm_source, 60),
      utmMedium: str(b.utm_medium, 60),
      utmCampaign: str(b.utm_campaign, 100),
      lang: str(b.lang, 12),
      newSession: Boolean(b.new_session)
    },
    {
      ip: String(req.headers['x-forwarded-for'] || req.socket.remoteAddress || '').split(',')[0].trim(),
      ua: String(req.headers['user-agent'] || ''),
      country: String(req.headers['x-vercel-ip-country'] || req.headers['cf-ipcountry'] || '') || null,
      ownHost,
      userId: (req as any).user?.id || null
    }
  ).catch(err => console.warn('[audience] track:', (err as Error).message));
  res.status(204).end();
});
