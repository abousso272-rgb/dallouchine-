import React, { useRef, useState } from 'react';
import { AlertTriangle, BadgeCheck, Camera, ExternalLink, Link2, Loader2, RefreshCcw, Search, Sparkles, X } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { analyzeProduct, prepareImage, supplierSearchLinks, type ProductAnalysis } from '../../services/ai';
import { friendlyError } from '../../lib/db';
import { Button } from '../ui/Button';

type Mode = 'photo' | 'link';

const CONFIDENCE: Record<string, { label: string; cls: string }> = {
  high: { label: 'Confiance élevée', cls: 'bg-jade-50 text-jade' },
  medium: { label: 'Confiance moyenne', cls: 'bg-ochre-50 text-ochre' },
  low: { label: 'Confiance faible', cls: 'bg-red-50 text-red-700' }
};

export function ProductAnalyzer({ onUse }: { onUse: (a: ProductAnalysis, ctx: { url?: string }) => void }) {
  const { requireAuth, toast } = useApp();
  const [mode, setMode] = useState<Mode>('photo');
  const [url, setUrl] = useState('');
  const [image, setImage] = useState<{ mediaType: string; data: string; previewUrl: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ analysis: ProductAnalysis; url?: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [drag, setDrag] = useState(false);

  async function pick(file?: File | null) {
    if (!file) return;
    try {
      setImage(await prepareImage(file));
      setError(null);
    } catch (err) {
      toast('error', 'Photo refusée', friendlyError(err));
    }
  }

  async function run() {
    setError(null);
    const useUrl = mode === 'link' ? url.trim() : '';
    if (mode === 'link' && !/^https?:\/\//i.test(useUrl)) return setError('Collez un lien complet, commençant par https://');
    if (mode === 'photo' && !image) return setError('Ajoutez d’abord une photo du produit.');
    if (!requireAuth({ reason: 'Créez votre compte gratuit pour lancer l’analyse et garder votre demande.', mode: 'register' })) return;
    setLoading(true);
    try {
      const analysis = await analyzeProduct({ url: useUrl || undefined, image: mode === 'photo' && image ? { mediaType: image.mediaType, data: image.data } : undefined });
      setResult({ analysis, url: useUrl || undefined });
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setLoading(false);
    }
  }

  if (result) return <AnalysisResult analysis={result.analysis} onUse={() => onUse(result.analysis, { url: result.url })} onReset={() => setResult(null)} />;

  return (
    <section id="analyse" className="relative overflow-hidden rounded-[var(--radius-card)] border border-brand-100 bg-gradient-to-br from-brand-50 via-white to-white p-5 shadow-[var(--shadow-soft)] sm:p-7">
      <div className="pointer-events-none absolute -right-16 -top-16 h-52 w-52 rounded-full bg-brand-400/20 blur-3xl" aria-hidden />
      <div className="relative">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-gradient text-white shadow-sm">
            <Sparkles className="h-5 w-5" />
          </span>
          <div>
            <h2 className="text-lg font-semibold sm:text-xl">Reconnaissance de produit par IA</h2>
            <p className="mt-0.5 text-[14px] text-muted">Une photo ou un lien Alibaba/1688 : l’IA identifie le produit, lit ses caractéristiques et prépare la recherche de fournisseurs.</p>
          </div>
        </div>

        <div className="mt-5 inline-grid grid-cols-2 gap-1 rounded-2xl bg-paper-2 p-1" role="tablist">
          {(['photo', 'link'] as const).map(m => (
            <button
              key={m}
              type="button"
              role="tab"
              aria-selected={mode === m}
              onClick={() => {
                setMode(m);
                setError(null);
              }}
              className={`flex h-10 items-center justify-center gap-2 rounded-xl px-4 text-[13.5px] font-semibold transition-colors ${mode === m ? 'bg-white text-ink shadow-sm' : 'text-muted'}`}
            >
              {m === 'photo' ? <Camera className="h-4 w-4" /> : <Link2 className="h-4 w-4" />}
              {m === 'photo' ? 'Photo' : 'Lien produit'}
            </button>
          ))}
        </div>

        <div className="mt-4">
          {mode === 'photo' ? (
            image ? (
              <div className="flex items-center gap-4 rounded-2xl border border-line bg-white p-3">
                <img src={image.previewUrl} alt="Photo à analyser" className="h-20 w-20 rounded-xl object-cover" />
                <div className="min-w-0 flex-1 text-sm">
                  <p className="font-semibold">Photo prête</p>
                  <p className="text-muted">Elle n’est pas enregistrée tant que vous n’envoyez pas la demande.</p>
                </div>
                <button type="button" onClick={() => setImage(null)} className="rounded-lg p-2 text-muted hover:bg-ink/5" aria-label="Retirer la photo">
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                onDragOver={e => {
                  e.preventDefault();
                  setDrag(true);
                }}
                onDragLeave={() => setDrag(false)}
                onDrop={e => {
                  e.preventDefault();
                  setDrag(false);
                  pick(e.dataTransfer.files?.[0]);
                }}
                className={`flex w-full flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed px-4 py-9 text-center transition-colors ${drag ? 'border-brand bg-brand-50' : 'border-brand-100 bg-white hover:border-brand/50'}`}
              >
                <Camera className="h-7 w-7 text-brand" />
                <span className="font-semibold">Prendre ou choisir une photo</span>
                <span className="text-[13px] text-muted">JPG, PNG ou WebP · une seule vue nette du produit</span>
              </button>
            )
          ) : (
            <div className="relative">
              <Link2 className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
              <input
                type="url"
                inputMode="url"
                value={url}
                onChange={e => setUrl(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), run())}
                placeholder="https://www.alibaba.com/product-detail/…"
                aria-label="Lien du produit"
                className="h-12 w-full rounded-xl border border-line-2 bg-white pl-10 pr-3 focus:border-brand/60 focus:outline-none focus:ring-4 focus:ring-brand/10"
              />
            </div>
          )}
          <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" capture="environment" className="hidden" onChange={e => pick(e.target.files?.[0])} />
        </div>

        {error && (
          <p role="alert" className="mt-3 rounded-xl bg-red-50 px-3.5 py-2.5 text-[13.5px] text-red-700">
            {error}
          </p>
        )}

        <Button type="button" size="lg" className="mt-4 w-full sm:w-auto" onClick={run} loading={loading} icon={!loading ? <Search className="h-4 w-4" /> : undefined}>
          {loading ? 'Analyse en cours…' : 'Analyser le produit'}
        </Button>
        {loading && <p className="mt-3 flex items-center gap-2 text-[13px] text-muted"><Loader2 className="h-3.5 w-3.5 animate-spin" /> Lecture du produit, des caractéristiques et des mots-clés fournisseurs (10 à 20 secondes).</p>}
      </div>
    </section>
  );
}

function AnalysisResult({ analysis: a, onUse, onReset }: { analysis: ProductAnalysis; onUse: () => void; onReset: () => void }) {
  const conf = CONFIDENCE[a.confidence] || CONFIDENCE.low;
  const l = a.listing;
  const hasListing = Object.values(l).some(v => v != null);
  const fmt = (n: number) => new Intl.NumberFormat('fr-FR').format(n);
  const links = supplierSearchLinks(a);
  return (
    <section id="analyse" className="rounded-[var(--radius-card)] border border-brand-100 bg-white p-5 shadow-[var(--shadow-soft)] sm:p-7">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="eyebrow flex items-center gap-1.5"><Sparkles className="h-3.5 w-3.5" /> Produit reconnu</p>
          <h2 className="mt-1 text-xl font-semibold sm:text-2xl">{a.productName}</h2>
          {a.productNameZh && <p className="mt-0.5 text-sm text-muted">{a.productNameZh}</p>}
        </div>
        <span className={`rounded-full px-3 py-1 text-[12px] font-bold ${conf.cls}`}>{conf.label}</span>
      </div>

      <p className="mt-3 text-[14.5px] leading-relaxed text-muted">{a.description}</p>

      {a.pageStatus === 'thin' || a.pageStatus === 'unreachable' ? (
        <p className="mt-4 flex gap-2 rounded-xl bg-ochre-50 px-3.5 py-2.5 text-[13.5px] text-ochre">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          {a.pageStatus === 'unreachable' ? 'Cette page n’a pas pu être lue (site protégé ou indisponible).' : 'Cette page est protégée ou presque vide : peu d’informations ont pu être lues.'} Ajoutez aussi une photo pour une meilleure analyse.
        </p>
      ) : null}

      {a.warnings.length > 0 && (
        <ul className="mt-4 space-y-1.5">
          {a.warnings.map((w, i) => (
            <li key={i} className="flex gap-2 rounded-xl bg-red-50 px-3.5 py-2 text-[13.5px] text-red-700">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" /> {w}
            </li>
          ))}
        </ul>
      )}

      <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
        {hasListing && (
          <div className="rounded-2xl border border-jade/25 bg-jade-50/50 p-4">
            <p className="flex items-center gap-1.5 text-[12px] font-bold uppercase tracking-wide text-jade"><BadgeCheck className="h-4 w-4" /> Lu sur la page du lien</p>
            <dl className="mt-3 space-y-2 text-[14px]">
              {l.priceMin != null && <Row k="Prix affiché" v={`${fmt(l.priceMin)}${l.priceMax && l.priceMax !== l.priceMin ? ` – ${fmt(l.priceMax)}` : ''} ${l.currency || ''}`} />}
              {l.moq != null && <Row k="Commande minimum (MOQ)" v={`${fmt(l.moq)} unités`} />}
              {l.supplierName && <Row k="Fournisseur" v={l.supplierName} />}
              {l.supplierLocation && <Row k="Localisation" v={l.supplierLocation} />}
              {l.ordersSold && <Row k="Ventes" v={l.ordersSold} />}
              {l.leadTime && <Row k="Délai" v={l.leadTime} />}
            </dl>
          </div>
        )}
        {a.estimate && (a.estimate.unitPriceCnyMin != null || a.estimate.unitPriceCnyMax != null) && (
          <div className="rounded-2xl border border-ochre/25 bg-ochre-50/60 p-4">
            <p className="text-[12px] font-bold uppercase tracking-wide text-ochre">Estimation indicative de l’IA</p>
            <p className="mt-2 text-[22px] font-semibold num">
              {a.estimate.unitPriceCnyMin != null ? fmt(a.estimate.unitPriceCnyMin) : '?'} – {a.estimate.unitPriceCnyMax != null ? fmt(a.estimate.unitPriceCnyMax) : '?'} <span className="text-sm font-semibold text-muted">CNY / unité</span>
            </p>
            <p className="mt-1 text-[12.5px] text-muted">Ordre de grandeur en gros, hors transport. Le prix réel sera confirmé par nos recherches fournisseurs.</p>
          </div>
        )}
      </div>

      {a.specs.length > 0 && (
        <div className="mt-5">
          <p className="text-[13px] font-semibold">Caractéristiques</p>
          <dl className="mt-2 grid grid-cols-1 gap-x-6 gap-y-1.5 text-[14px] sm:grid-cols-2">
            {a.specs.map((s, i) => (
              <Row key={i} k={s.label} v={s.value} />
            ))}
          </dl>
        </div>
      )}

      <div className="mt-5">
        <p className="text-[13px] font-semibold">Chercher des fournisseurs</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {links.map(x => (
            <a key={x.label} href={x.url} target="_blank" rel="noopener noreferrer" className="inline-flex h-9 items-center gap-1.5 rounded-full border border-line-2 bg-white px-3.5 text-[13px] font-semibold hover:border-brand hover:text-brand">
              {x.label} <ExternalLink className="h-3 w-3" />
            </a>
          ))}
        </div>
        {(a.searchKeywords.en.length > 0 || a.searchKeywords.zh.length > 0) && (
          <p className="mt-2 text-[12.5px] text-muted">Mots-clés : {[...a.searchKeywords.en, ...a.searchKeywords.zh].join(' · ')}</p>
        )}
      </div>

      {a.supplierQuestions.length > 0 && (
        <details className="mt-5 rounded-xl bg-paper px-4 py-3">
          <summary className="cursor-pointer text-[13.5px] font-semibold">Questions à poser aux fournisseurs</summary>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-[13.5px] text-muted">
            {a.supplierQuestions.map((q, i) => (
              <li key={i}>{q}</li>
            ))}
          </ul>
        </details>
      )}

      <div className="mt-6 flex flex-col gap-2 sm:flex-row">
        <Button size="lg" onClick={onUse}>Utiliser pour ma demande</Button>
        <Button size="lg" variant="secondary" onClick={onReset} icon={<RefreshCcw className="h-4 w-4" />}>Analyser autre chose</Button>
      </div>
      <p className="mt-3 text-[12px] text-subtle">Analyse automatique à titre indicatif : notre équipe vérifie chaque information avant de vous envoyer un devis.</p>
    </section>
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
