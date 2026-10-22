import React, { useState } from 'react';
import { ArrowDownRight, ArrowUpRight, Copy, ExternalLink, Globe, MousePointerClick, RefreshCw, Search, Users } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useAsync } from '../../lib/hooks';
import { getAudience, type Audience } from '../../services/finance';
import { gaConfigured } from '../../lib/analytics';
import { formatNumber } from '../../lib/format';
import { PageHeader, Stat, Card, CardTitle } from '../../components/ui/Layout';
import { Button } from '../../components/ui/Button';
import { ErrorState, InlineAlert, Skeleton } from '../../components/ui/States';

const SOURCE_LABEL: Record<string, string> = {
  direct: 'Accès direct / WhatsApp',
  google: 'Google (recherche)',
  bing: 'Bing',
  whatsapp: 'WhatsApp (liens partagés)',
  facebook: 'Facebook',
  instagram: 'Instagram',
  tiktok: 'TikTok',
  youtube: 'YouTube',
  x: 'X (Twitter)',
  linkedin: 'LinkedIn',
  telegram: 'Telegram',
  snapchat: 'Snapchat'
};
const DEVICE_LABEL: Record<string, string> = { mobile: 'Téléphone', ordinateur: 'Ordinateur', tablette: 'Tablette', inconnu: 'Inconnu' };
const EVENT_LABEL: Record<string, string> = {
  add_to_cart: 'Ajouts au panier',
  begin_checkout: 'Débuts de paiement',
  sign_up: 'Inscriptions',
  login: 'Connexions',
  request_quote: 'Demandes de devis',
  join_groupage: 'Participations aux groupages',
  assistant_question: 'Questions à l’assistant',
  search: 'Recherches',
  whatsapp_click: 'Clics WhatsApp'
};

const regionNames = (() => {
  try {
    return new Intl.DisplayNames(['fr'], { type: 'region' });
  } catch {
    return null;
  }
})();
const countryName = (code: string) => (code === '??' ? 'Inconnu' : regionNames?.of(code) || code);
const flag = (code: string) => (/^[A-Z]{2}$/.test(code) ? String.fromCodePoint(...[...code].map(c => 0x1f1a5 + c.charCodeAt(0))) : '🌐');

const PAGE_LABEL = (path: string) => {
  if (path === '/') return 'Accueil';
  if (path.startsWith('/produit/')) return `Produit : ${decodeURIComponent(path.slice(9)).replace(/-/g, ' ')}`;
  if (path.startsWith('/groupages/')) return 'Fiche groupage';
  const map: Record<string, string> = { '/catalogue': 'Catalogue', '/groupages': 'Groupages', '/sourcing': 'Sourcing', '/pro': 'B2B', '/automobile': 'Automobile', '/guide': 'Comment ça marche', '/suivi': 'Suivi de commande', '/panier': 'Panier', '/compte': 'Espace client', '/espace-pro': 'Espace pro', '/connexion': 'Connexion', '/inscription': 'Inscription' };
  return map[path] || path;
};

export default function AudiencePage() {
  const { toast } = useApp();
  const [days, setDays] = useState(30);
  const q = useAsync(() => getAudience(days), [days], { cacheKey: `audience:${days}`, maxAge: 60000 });
  const sitemap = `${window.location.origin}/sitemap.xml`;

  return (
    <>
      <PageHeader
        eyebrow="Pilotage"
        title="Audience du site"
        description="Combien de personnes visitent le site, d’où elles viennent (Google, WhatsApp, Facebook…), de quel pays, et combien deviennent clientes."
        actions={
          <>
            <div className="flex rounded-full bg-paper-2 p-1" role="tablist" aria-label="Période">
              {[7, 30, 90].map(d => (
                <button key={d} type="button" role="tab" aria-selected={days === d} onClick={() => setDays(d)} className={`h-9 rounded-full px-4 text-[13px] font-semibold ${days === d ? 'bg-white text-brand-700 shadow-sm' : 'text-muted hover:text-ink'}`}>
                  {d} jours
                </button>
              ))}
            </div>
            <Button variant="secondary" icon={<RefreshCw className="h-4 w-4" />} onClick={q.reload} loading={q.loading}>
              Actualiser
            </Button>
          </>
        }
      />

      {q.loading && !q.data ? (
        <div className="space-y-4">
          <Skeleton className="h-28" />
          <Skeleton className="h-72" />
        </div>
      ) : q.error || !q.data ? (
        <ErrorState message={q.error || 'Statistiques indisponibles.'} onRetry={q.reload} />
      ) : (
        <AudienceView a={q.data} />
      )}

      <Card className="mt-6">
        <CardTitle>Google</CardTitle>
        <div className="grid gap-3 text-[13.5px] md:grid-cols-3">
          <div className="rounded-2xl bg-paper p-4">
            <p className="flex items-center gap-2 font-semibold">
              <Search className="h-4 w-4 text-brand" /> Search Console
            </p>
            <p className="mt-1 text-muted">Voir sur quels mots-clés le site apparaît dans Google et combien de clics il reçoit.</p>
            <p className="mt-2 text-[12.5px] text-muted">Plan du site à déclarer :</p>
            <button
              type="button"
              onClick={() => {
                navigator.clipboard?.writeText(sitemap).then(() => toast('success', 'Adresse copiée'));
              }}
              className="num mt-1 inline-flex max-w-full items-center gap-1.5 truncate rounded-lg bg-white px-2 py-1 text-[12px] ring-1 ring-line hover:ring-brand/40"
            >
              <Copy className="h-3.5 w-3.5 shrink-0" /> {sitemap}
            </button>
            <a href="https://search.google.com/search-console" target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex items-center gap-1 font-semibold text-brand-700 hover:underline">
              Ouvrir Search Console <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>
          <div className="rounded-2xl bg-paper p-4">
            <p className="flex items-center gap-2 font-semibold">
              <Globe className="h-4 w-4 text-brand" /> Google Analytics
            </p>
            <p className="mt-1 text-muted">{gaConfigured ? 'Actif : les visiteurs qui l’acceptent sont mesurés par Google.' : 'Pas encore relié : ajoutez l’identifiant de mesure (G-…) pour l’activer.'}</p>
            <a href="https://analytics.google.com" target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex items-center gap-1 font-semibold text-brand-700 hover:underline">
              Ouvrir Google Analytics <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>
          <div className="rounded-2xl bg-paper p-4">
            <p className="flex items-center gap-2 font-semibold">
              <MousePointerClick className="h-4 w-4 text-brand" /> Mesurer une campagne
            </p>
            <p className="mt-1 text-muted">Ajoutez à vos liens publicitaires : <span className="num rounded bg-white px-1 text-[12px] ring-1 ring-line">?utm_source=facebook&amp;utm_campaign=ramadan</span>. Les visites apparaîtront dans « Campagnes ».</p>
          </div>
        </div>
      </Card>
    </>
  );
}

function AudienceView({ a }: { a: Audience }) {
  if (!a.first_event_at) {
    return (
      <InlineAlert tone="info" title="Les statistiques démarrent">
        Aucune visite enregistrée pour le moment. Elles s’afficheront ici dès les premières visites du site en ligne (les visites de l’équipe comptent aussi).
      </InlineAlert>
    );
  }
  const trend = a.visits_prev > 0 ? Math.round(((a.visits - a.visits_prev) / a.visits_prev) * 100) : null;
  const max = Math.max(1, ...a.daily.map(d => d.visits));
  const totalSources = a.sources.reduce((s, x) => s + x.visits, 0) || 1;
  const totalCountries = a.countries.reduce((s, x) => s + x.visits, 0) || 1;
  const totalDevices = a.devices.reduce((s, x) => s + x.visits, 0) || 1;
  const funnel = [
    { label: 'Visites', value: a.visits },
    { label: 'Demandes de devis', value: a.requests },
    { label: 'Comptes créés', value: a.signups },
    { label: 'Commandes', value: a.orders },
    { label: 'Commandes payées', value: a.orders_paid }
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat
          tone="brand"
          label={`Visites (${a.days} jours)`}
          value={formatNumber(a.visits)}
          hint={
            trend === null ? (
              `dont ${a.visits_today} aujourd’hui`
            ) : (
              <span className="inline-flex items-center gap-1">
                {trend >= 0 ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownRight className="h-3.5 w-3.5" />} {trend >= 0 ? '+' : ''}
                {trend} % vs période précédente
              </span>
            )
          }
          icon={<Users className="h-4 w-4" />}
        />
        <Stat label="Pages vues" value={formatNumber(a.pageviews)} hint={a.pages_per_visit ? `${a.pages_per_visit} pages par visite` : undefined} />
        <Stat label="Visites d’une seule page" value={a.bounce_pct !== null ? `${a.bounce_pct} %` : '—'} hint="Plus c’est bas, mieux c’est" />
        <Stat label="Visiteurs devenus clients" value={a.visits ? `${((a.orders_paid / a.visits) * 100).toFixed(1)} %` : '—'} hint={`${a.orders_paid} commande(s) payée(s)`} />
      </div>

      <Card>
        <CardTitle>Visites par jour</CardTitle>
        <div className="flex h-44 items-end gap-[3px]" role="img" aria-label="Visites par jour">
          {a.daily.map(d => (
            <div key={d.day} className="group relative flex-1">
              <div className="w-full rounded-t-md bg-brand/80 transition-colors group-hover:bg-brand" style={{ height: `${Math.max(2, (d.visits / max) * 168)}px` }} />
              <span className="pointer-events-none absolute -top-7 left-1/2 hidden -translate-x-1/2 whitespace-nowrap rounded-md bg-ink px-2 py-0.5 text-[11px] text-white group-hover:block">
                {new Date(d.day).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })} : {d.visits}
              </span>
            </div>
          ))}
        </div>
        <div className="mt-2 flex justify-between text-[11.5px] text-muted">
          <span>{new Date(a.daily[0]?.day).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}</span>
          <span>aujourd’hui</span>
        </div>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardTitle>D’où viennent les visiteurs</CardTitle>
          <Bars rows={a.sources.map(s => ({ key: s.source, label: SOURCE_LABEL[s.source] || s.source, value: s.visits, pct: (s.visits / totalSources) * 100 }))} />
          <p className="mt-3 text-[12px] text-muted">WhatsApp ne transmet souvent pas son origine : ces visites apparaissent en « accès direct », sauf pour les liens partagés depuis le site.</p>
        </Card>
        <Card>
          <CardTitle>Pays</CardTitle>
          <Bars rows={a.countries.map(c => ({ key: c.country, label: `${flag(c.country)} ${countryName(c.country)}`, value: c.visits, pct: (c.visits / totalCountries) * 100 }))} />
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card>
          <CardTitle>Appareils</CardTitle>
          <Bars rows={a.devices.map(d => ({ key: d.device, label: DEVICE_LABEL[d.device] || d.device, value: d.visits, pct: (d.visits / totalDevices) * 100 }))} />
        </Card>
        <Card className="lg:col-span-2">
          <CardTitle>Du visiteur au client</CardTitle>
          <ol className="space-y-2.5">
            {funnel.map((f, i) => (
              <li key={f.label} className="flex items-center gap-3">
                <span className="w-40 shrink-0 text-[13px] text-muted">{f.label}</span>
                <span className="relative h-7 flex-1 overflow-hidden rounded-lg bg-paper-2">
                  <span className="absolute inset-y-0 left-0 rounded-lg bg-brand-gradient" style={{ width: `${Math.max(1.5, (f.value / Math.max(1, funnel[0].value)) * 100)}%`, opacity: 1 - i * 0.12 }} />
                </span>
                <span className="num w-14 shrink-0 text-right text-[13.5px] font-semibold">{formatNumber(f.value)}</span>
              </li>
            ))}
          </ol>
          {Object.keys(a.events).length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2 border-t border-line pt-4">
              {Object.entries(a.events).map(([k, v]) => (
                <span key={k} className="rounded-full bg-paper px-3 py-1.5 text-[12.5px]">
                  {EVENT_LABEL[k] || k} : <strong className="num">{v}</strong>
                </span>
              ))}
            </div>
          )}
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardTitle>Pages les plus vues</CardTitle>
          <List rows={a.pages.map(p => ({ key: p.path, label: PAGE_LABEL(p.path), value: p.views }))} />
        </Card>
        <Card>
          <CardTitle>Pages d’arrivée</CardTitle>
          <List rows={a.landings.map(p => ({ key: p.path, label: PAGE_LABEL(p.path), value: p.visits }))} />
          {a.campaigns.length > 0 && (
            <>
              <p className="mb-2 mt-5 text-[13px] font-bold">Campagnes</p>
              <List rows={a.campaigns.map(c => ({ key: c.campaign, label: `${c.campaign} · ${SOURCE_LABEL[c.source] || c.source}`, value: c.visits }))} />
            </>
          )}
        </Card>
      </div>
    </div>
  );
}

function Bars({ rows }: { rows: { key: string; label: string; value: number; pct: number }[] }) {
  if (!rows.length) return <p className="text-sm text-muted">Pas encore de données.</p>;
  return (
    <ul className="space-y-2.5">
      {rows.map(r => (
        <li key={r.key}>
          <div className="flex justify-between gap-3 text-[13px]">
            <span className="truncate">{r.label}</span>
            <span className="num shrink-0 font-semibold">
              {formatNumber(r.value)} <span className="font-normal text-muted">· {Math.round(r.pct)} %</span>
            </span>
          </div>
          <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-paper-2">
            <div className="h-full rounded-full bg-brand" style={{ width: `${Math.max(1, r.pct)}%` }} />
          </div>
        </li>
      ))}
    </ul>
  );
}

function List({ rows }: { rows: { key: string; label: string; value: number }[] }) {
  if (!rows.length) return <p className="text-sm text-muted">Pas encore de données.</p>;
  return (
    <ul className="divide-y divide-line">
      {rows.map(r => (
        <li key={r.key} className="flex justify-between gap-3 py-2 text-[13px]">
          <span className="min-w-0 truncate" title={r.key}>
            {r.label}
          </span>
          <span className="num shrink-0 font-semibold">{formatNumber(r.value)}</span>
        </li>
      ))}
    </ul>
  );
}
