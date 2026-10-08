import React, { useEffect, useRef, useState } from 'react';
import { AlertTriangle, BadgeCheck, Camera, ExternalLink, Globe, ImagePlus, Link2, Loader2, RefreshCcw, Sparkles, X } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { analyzeProduct, prepareImage, supplierSearchLinks, type ProductAnalysis } from '../../services/ai';
import { friendlyError } from '../../lib/db';
import { Button } from '../ui/Button';

const CONFIDENCE: Record<string, { label: string; cls: string }> = {
  high: { label: 'Confiance élevée', cls: 'bg-jade-50 text-jade' },
  medium: { label: 'Confiance moyenne', cls: 'bg-ochre-50 text-ochre' },
  low: { label: 'Confiance faible', cls: 'bg-red-50 text-red-700' }
};

const MAX_PHOTOS = 3;
const isUrl = (v: string) => /^https?:\/\/[^\s.]+\.[^\s]{2,}/i.test(v.trim());

interface Photo {
  file: File;
  mediaType: string;
  data: string;
  previewUrl: string;
}

export interface AnalyzerContext {
  url?: string;
  files: File[];
}

/**
 * Étape « photo ou lien » : l'analyse IA se lance toute seule dès qu'une photo (appareil ou galerie)
 * ou un lien est fourni, puis le résultat est transmis au formulaire.
 */
export function ProductAnalyzer({
  onResult,
  onPhotosChange
}: {
  onResult: (a: ProductAnalysis, ctx: AnalyzerContext) => void;
  onPhotosChange?: (files: File[]) => void;
}) {
  const { user, requireAuth, toast } = useApp();
  const [url, setUrl] = useState('');
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ProductAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [drag, setDrag] = useState(false);
  const cameraRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);
  const lastKey = useRef('');
  const seq = useRef(0);

  useEffect(() => onPhotosChange?.(photos.map(p => p.file)), [photos, onPhotosChange]);

  async function addFiles(list: FileList | File[] | null | undefined) {
    const files = Array.from(list || []).filter(f => f.type.startsWith('image/'));
    if (!files.length) return;
    const room = MAX_PHOTOS - photos.length;
    if (room <= 0) return toast('info', `${MAX_PHOTOS} photos maximum`, 'Retirez une photo pour en ajouter une autre.');
    const prepared: Photo[] = [];
    for (const f of files.slice(0, room)) {
      try {
        const p = await prepareImage(f);
        prepared.push({ ...p, file: f });
      } catch (err) {
        toast('error', 'Photo refusée', friendlyError(err));
      }
    }
    if (prepared.length) setPhotos(prev => [...prev, ...prepared].slice(0, MAX_PHOTOS));
  }

  // Coller une image depuis le presse-papiers
  useEffect(() => {
    const onPaste = (e: ClipboardEvent) => {
      const files = Array.from(e.clipboardData?.files || []).filter(f => f.type.startsWith('image/'));
      if (files.length) addFiles(files);
    };
    window.addEventListener('paste', onPaste);
    return () => window.removeEventListener('paste', onPaste);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [photos.length]);

  // Analyse automatique dès qu'il y a une photo ou un lien valide (léger délai pour la saisie)
  useEffect(() => {
    const link = isUrl(url) ? url.trim() : '';
    if (!photos.length && !link) return;
    const key = `${link}|${photos.map(p => p.data.length).join(',')}`;
    if (key === lastKey.current) return;
    const t = window.setTimeout(() => run(link, key), link && !photos.length ? 900 : 400);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url, photos, user?.id]);

  async function run(link: string, key: string) {
    setError(null);
    if (!user) {
      requireAuth({ reason: 'Connectez-vous (gratuit) pour lancer l’analyse automatique de votre produit.', mode: 'register' });
      return;
    }
    lastKey.current = key;
    const id = ++seq.current;
    setLoading(true);
    try {
      const analysis = await analyzeProduct({ url: link || undefined, images: photos.map(p => ({ mediaType: p.mediaType, data: p.data })) });
      if (id !== seq.current) return;
      setResult(analysis);
      onResult(analysis, { url: link || undefined, files: photos.map(p => p.file) });
    } catch (err) {
      if (id !== seq.current) return;
      lastKey.current = '';
      setError(friendlyError(err));
    } finally {
      if (id === seq.current) setLoading(false);
    }
  }

  function reset() {
    seq.current++;
    lastKey.current = '';
    setResult(null);
    setError(null);
    setUrl('');
    setPhotos([]);
    setLoading(false);
  }

  return (
    <section id="analyse" className="relative scroll-mt-28 overflow-hidden rounded-[var(--radius-card)] border border-brand-100 bg-gradient-to-br from-brand-50 via-white to-white p-5 shadow-[var(--shadow-soft)] sm:p-7">
      <div className="pointer-events-none absolute -right-16 -top-16 h-52 w-52 rounded-full bg-brand-400/20 blur-3xl" aria-hidden />
      <div className="relative">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-gradient text-white shadow-sm">
            <Sparkles className="h-5 w-5" />
          </span>
          <div>
            <h2 className="text-lg font-bold sm:text-xl">1. Votre produit : photo ou lien</h2>
            <p className="mt-0.5 text-[14px] text-muted">
              Ajoutez une photo (appareil ou galerie) et/ou collez un lien Alibaba, 1688, AliExpress… L’IA analyse automatiquement le produit, cherche des offres comparables et remplit la demande pour vous.
            </p>
          </div>
        </div>

        <div className="relative mt-5">
          <Link2 className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <input
            type="url"
            inputMode="url"
            value={url}
            onChange={e => setUrl(e.target.value)}
            placeholder="Collez le lien du produit (facultatif)"
            aria-label="Lien du produit"
            className="h-12 w-full rounded-full border border-line-2 bg-white pl-11 pr-4 focus:border-brand/60 focus:outline-none focus:ring-4 focus:ring-brand/10"
          />
        </div>

        <div
          onDragOver={e => {
            e.preventDefault();
            setDrag(true);
          }}
          onDragLeave={() => setDrag(false)}
          onDrop={e => {
            e.preventDefault();
            setDrag(false);
            addFiles(e.dataTransfer.files);
          }}
          className={`mt-3 rounded-2xl border-2 border-dashed p-3 transition-colors ${drag ? 'border-brand bg-brand-50' : 'border-brand-100 bg-white'}`}
        >
          <div className="flex flex-wrap items-center gap-2.5">
            {photos.map((p, i) => (
              <div key={p.previewUrl} className="relative h-20 w-20 overflow-hidden rounded-xl ring-1 ring-line">
                <img src={p.previewUrl} alt={`Photo ${i + 1}`} className="h-full w-full object-cover" />
                <button
                  type="button"
                  onClick={() => setPhotos(prev => prev.filter(x => x !== p))}
                  className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-ink/70 text-white"
                  aria-label="Retirer la photo"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
            {photos.length < MAX_PHOTOS && (
              <>
                <button
                  type="button"
                  onClick={() => galleryRef.current?.click()}
                  className="flex h-20 min-w-[132px] flex-1 flex-col items-center justify-center gap-1 rounded-xl bg-brand-50/70 px-3 text-[12.5px] font-semibold text-brand-600 hover:bg-brand-50 sm:flex-none"
                >
                  <ImagePlus className="h-5 w-5" /> Galerie / fichiers
                </button>
                <button
                  type="button"
                  onClick={() => cameraRef.current?.click()}
                  className="flex h-20 min-w-[132px] flex-1 flex-col items-center justify-center gap-1 rounded-xl bg-paper px-3 text-[12.5px] font-semibold text-ink hover:bg-paper-2 sm:flex-none"
                >
                  <Camera className="h-5 w-5" /> Prendre une photo
                </button>
              </>
            )}
          </div>
          <p className="mt-2 text-[12px] text-muted">
            Jusqu’à {MAX_PHOTOS} photos (vues différentes du même produit) · JPG, PNG, WebP · glisser-déposer ou coller (Ctrl+V) possible.
          </p>
        </div>
        <input ref={galleryRef} type="file" accept="image/*" multiple className="hidden" onChange={e => { addFiles(e.target.files); e.target.value = ''; }} />
        <input ref={cameraRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={e => { addFiles(e.target.files); e.target.value = ''; }} />

        {loading && (
          <div className="mt-4 flex items-start gap-3 rounded-2xl bg-white p-4 ring-1 ring-brand-100">
            <Loader2 className="mt-0.5 h-5 w-5 shrink-0 animate-spin text-brand" />
            <div className="text-[13.5px]">
              <p className="font-semibold">Analyse en cours…</p>
              <p className="text-muted">Identification du produit, lecture de la page, recherche d’offres comparables (15 à 40 secondes).</p>
            </div>
          </div>
        )}
        {error && !loading && (
          <div role="alert" className="mt-4 flex flex-wrap items-center justify-between gap-2 rounded-xl bg-red-50 px-3.5 py-2.5 text-[13.5px] text-red-700">
            <span>{error}</span>
            <button type="button" className="font-semibold underline" onClick={() => run(isUrl(url) ? url.trim() : '', `${url}|retry${Date.now()}`)}>
              Réessayer
            </button>
          </div>
        )}
        {result && !loading && <AnalysisResult analysis={result} onReset={reset} />}
      </div>
    </section>
  );
}

function AnalysisResult({ analysis: a, onReset }: { analysis: ProductAnalysis; onReset: () => void }) {
  const conf = CONFIDENCE[a.confidence] || CONFIDENCE.low;
  const l = a.listing;
  const hasListing = Object.values(l).some(v => v != null);
  const fmt = (n: number) => new Intl.NumberFormat('fr-FR').format(n);
  const links = supplierSearchLinks(a);
  return (
    <div className="mt-5 rounded-2xl bg-white p-4 ring-1 ring-line sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="eyebrow flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5" /> Produit reconnu · formulaire rempli ci-dessous
          </p>
          <h3 className="mt-1 text-lg font-bold sm:text-xl">{a.productName}</h3>
          {a.productNameZh && <p className="mt-0.5 text-sm text-muted">{a.productNameZh}</p>}
        </div>
        <span className={`rounded-full px-3 py-1 text-[12px] font-bold ${conf.cls}`}>{conf.label}</span>
      </div>
      <p className="mt-2 text-[14px] leading-relaxed text-muted">{a.description}</p>

      {(a.pageStatus === 'thin' || a.pageStatus === 'unreachable') && (
        <p className="mt-3 flex gap-2 rounded-xl bg-ochre-50 px-3.5 py-2.5 text-[13px] text-ochre">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          {a.pageStatus === 'unreachable' ? 'La page n’a pas pu être lue (site protégé).' : 'Page protégée ou presque vide.'}
          {a.webSearchUsed ? ' Les informations ont été complétées par une recherche web.' : ' Ajoutez une photo pour une meilleure analyse.'}
        </p>
      )}
      {a.warnings.length > 0 && (
        <ul className="mt-3 space-y-1.5">
          {a.warnings.map((w, i) => (
            <li key={i} className="flex gap-2 rounded-xl bg-red-50 px-3.5 py-2 text-[13px] text-red-700">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" /> {w}
            </li>
          ))}
        </ul>
      )}

      <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
        {hasListing && (
          <div className="rounded-2xl border border-jade/25 bg-jade-50/50 p-4">
            <p className="flex items-center gap-1.5 text-[12px] font-bold uppercase tracking-wide text-jade">
              <BadgeCheck className="h-4 w-4" /> Lu sur la page du lien
            </p>
            <dl className="mt-2.5 space-y-1.5 text-[13.5px]">
              {l.priceMin != null && <Row k="Prix affiché" v={`${fmt(l.priceMin)}${l.priceMax && l.priceMax !== l.priceMin ? ` – ${fmt(l.priceMax)}` : ''} ${l.currency || ''}`} />}
              {l.moq != null && <Row k="Commande minimum" v={`${fmt(l.moq)} unités`} />}
              {l.supplierName && <Row k="Fournisseur" v={l.supplierName} />}
              {l.supplierLocation && <Row k="Localisation" v={l.supplierLocation} />}
              {l.ordersSold && <Row k="Ventes" v={l.ordersSold} />}
              {l.leadTime && <Row k="Délai" v={l.leadTime} />}
            </dl>
          </div>
        )}
        {a.estimate && (a.estimate.unitPriceCnyMin != null || a.estimate.unitPriceCnyMax != null) && (
          <div className="rounded-2xl border border-ochre/25 bg-ochre-50/60 p-4">
            <p className="text-[12px] font-bold uppercase tracking-wide text-ochre">Estimation indicative</p>
            <p className="num mt-1.5 text-[21px] font-bold">
              {a.estimate.unitPriceCnyMin != null ? fmt(a.estimate.unitPriceCnyMin) : '?'} – {a.estimate.unitPriceCnyMax != null ? fmt(a.estimate.unitPriceCnyMax) : '?'}{' '}
              <span className="text-sm font-semibold text-muted">CNY / unité</span>
            </p>
            <p className="mt-1 text-[12px] text-muted">Prix de gros en Chine, hors transport. Confirmé par notre équipe dans le devis.</p>
          </div>
        )}
      </div>

      {a.comparables.length > 0 && (
        <div className="mt-4">
          <p className="flex items-center gap-1.5 text-[13px] font-bold">
            <Globe className="h-4 w-4 text-brand" /> Offres comparables trouvées sur le web
          </p>
          <ul className="mt-2 divide-y divide-line rounded-2xl ring-1 ring-line">
            {a.comparables.map(c => (
              <li key={c.url} className="flex flex-wrap items-center justify-between gap-2 px-3.5 py-2.5 text-[13px]">
                <a href={c.url} target="_blank" rel="noopener noreferrer" className="min-w-0 flex-1 truncate font-semibold hover:text-brand-600">
                  {c.title}
                </a>
                <span className="text-muted">{[c.price, c.moq && `MOQ ${c.moq}`, c.supplier].filter(Boolean).join(' · ')}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {a.specs.length > 0 && (
        <dl className="mt-4 grid grid-cols-1 gap-x-6 gap-y-1 text-[13.5px] sm:grid-cols-2">
          {a.specs.map((s, i) => (
            <Row key={i} k={s.label} v={s.value} />
          ))}
        </dl>
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        {links.map(x => (
          <a key={x.label} href={x.url} target="_blank" rel="noopener noreferrer" className="inline-flex h-8 items-center gap-1.5 rounded-full border border-line-2 bg-white px-3 text-[12.5px] font-semibold hover:border-brand hover:text-brand">
            {x.label} <ExternalLink className="h-3 w-3" />
          </a>
        ))}
        <Button size="sm" variant="ghost" onClick={onReset} icon={<RefreshCcw className="h-3.5 w-3.5" />}>
          Autre produit
        </Button>
      </div>
      {a.sources.length > 0 && (
        <p className="mt-3 text-[11.5px] text-subtle">
          Sources consultées : {a.sources.slice(0, 4).map((s, i) => (
            <React.Fragment key={s.url}>
              {i > 0 && ' · '}
              <a href={s.url} target="_blank" rel="noopener noreferrer" className="underline hover:text-ink">
                {new URL(s.url).hostname.replace(/^www\./, '')}
              </a>
            </React.Fragment>
          ))}
        </p>
      )}
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-muted">{k}</dt>
      <dd className="text-right font-semibold">{v}</dd>
    </div>
  );
}
