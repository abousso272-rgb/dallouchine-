import React, { useEffect, useState } from 'react';
import { ArrowRight, ChevronDown } from 'lucide-react';
import { usePrefs } from '../../context/PrefsContext';
import type { TranslationKey } from '../../lib/i18n';
import { Button } from '../../components/ui/Button';
import { whatsappLink } from '../../lib/config';
import { DeliveryScene, GroupageScene, PaymentScene, ShippingScene, SourcingScene, TrackingScene } from '../../components/guide/Scenes';
import { applySeo } from '../../lib/seo';

const STEPS: { n: number; Scene: React.ComponentType<{ label: string }>; to: string; cta: TranslationKey }[] = [
  { n: 1, Scene: SourcingScene, to: '/sourcing', cta: 'guide.ctaSourcing' },
  { n: 2, Scene: GroupageScene, to: '/groupages', cta: 'guide.ctaGroupages' },
  { n: 3, Scene: PaymentScene, to: '/catalogue', cta: 'nav.catalog' },
  { n: 4, Scene: ShippingScene, to: '/suivi', cta: 'nav.tracking' },
  { n: 5, Scene: TrackingScene, to: '/suivi', cta: 'nav.tracking' },
  { n: 6, Scene: DeliveryScene, to: '/catalogue', cta: 'nav.catalog' }
];

const FAQ: [TranslationKey, TranslationKey][] = [
  ['guide.faq1.q', 'guide.faq1.a'],
  ['guide.faq2.q', 'guide.faq2.a'],
  ['guide.faq3.q', 'guide.faq3.a'],
  ['guide.faq4.q', 'guide.faq4.a'],
  ['guide.faq5.q', 'guide.faq5.a']
];

export default function GuidePage() {
  const { t } = usePrefs();
  const [active, setActive] = useState(1);

  useEffect(() => {
    applySeo({
      title: t('guide.title'),
      description: t('guide.subtitle'),
      path: '/guide',
      jsonLd: {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: FAQ.map(([q, a]) => ({ '@type': 'Question', name: t(q), acceptedAnswer: { '@type': 'Answer', text: t(a) } }))
      }
    });
  }, [t]);

  // Étape visible : met en avant la bonne entrée du sommaire
  useEffect(() => {
    const els = STEPS.map(s => document.getElementById(`etape-${s.n}`)).filter(Boolean) as HTMLElement[];
    if (!('IntersectionObserver' in window) || !els.length) return;
    const io = new IntersectionObserver(
      entries => {
        const visible = entries.filter(e => e.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible) setActive(Number(visible.target.id.replace('etape-', '')));
      },
      { rootMargin: '-35% 0px -45% 0px', threshold: [0, 0.25, 0.5, 1] }
    );
    els.forEach(el => io.observe(el));
    return () => io.disconnect();
  }, []);

  return (
    <div>
      <section className="relative overflow-hidden border-b border-line bg-gradient-to-b from-brand-50 to-paper">
        <div className="container-page py-12 sm:py-16 lg:py-20">
          <p className="eyebrow">{t('guide.eyebrow')}</p>
          <h1 className="mt-3 max-w-3xl text-[32px] font-bold leading-[1.1] sm:text-[46px]">{t('guide.title')}</h1>
          <p className="mt-4 max-w-2xl text-[16px] leading-relaxed text-muted sm:text-[17px]">{t('guide.subtitle')}</p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Button size="lg" to="/sourcing" icon={<ArrowRight className="h-4 w-4" />}>
              {t('guide.ctaSourcing')}
            </Button>
            <Button size="lg" variant="secondary" to="/groupages">
              {t('guide.ctaGroupages')}
            </Button>
          </div>
        </div>
      </section>

      <div className="container-page grid gap-10 py-10 lg:grid-cols-[220px_1fr] lg:gap-14 lg:py-16">
        <aside className="hidden lg:block">
          <ol className="sticky top-28 space-y-1" aria-label={t('guide.eyebrow')}>
            {STEPS.map(s => (
              <li key={s.n}>
                <a
                  href={`#etape-${s.n}`}
                  onClick={e => {
                    e.preventDefault();
                    document.getElementById(`etape-${s.n}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                  }}
                  aria-current={active === s.n ? 'step' : undefined}
                  className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13.5px] font-semibold transition-colors ${active === s.n ? 'bg-white text-brand-700 shadow-sm ring-1 ring-line' : 'text-muted hover:text-ink'}`}
                >
                  <span className={`num flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[12px] ${active === s.n ? 'bg-brand-gradient text-white' : 'bg-paper-2 text-muted'}`}>{s.n}</span>
                  <span className="line-clamp-2">{t(`guide.s${s.n}.title` as TranslationKey)}</span>
                </a>
              </li>
            ))}
          </ol>
        </aside>

        <div className="space-y-16 sm:space-y-24">
          {STEPS.map(({ n, Scene, to, cta }, i) => (
            <section key={n} id={`etape-${n}`} className="grid scroll-mt-28 items-center gap-6 md:grid-cols-2 md:gap-12">
              <div className={i % 2 ? 'md:order-2' : undefined}>
                <p className="eyebrow">{t('guide.step', { n })}</p>
                <h2 className="mt-2 text-[26px] font-bold leading-tight sm:text-[32px]">{t(`guide.s${n}.title` as TranslationKey)}</h2>
                <p className="mt-3 text-[15.5px] leading-relaxed text-muted">{t(`guide.s${n}.text` as TranslationKey)}</p>
                <Button className="mt-5" variant="secondary" size="sm" to={to} icon={<ArrowRight className="h-3.5 w-3.5" />}>
                  {t(cta)}
                </Button>
              </div>
              <div className={`overflow-hidden rounded-[26px] border border-line bg-white p-2 shadow-[var(--shadow-soft)] ${i % 2 ? 'md:order-1' : ''}`}>
                <Scene label={t(`guide.s${n}.title` as TranslationKey)} />
              </div>
            </section>
          ))}

          <section aria-labelledby="faq-title">
            <h2 id="faq-title" className="text-[26px] font-bold sm:text-[32px]">
              {t('guide.faq')}
            </h2>
            <div className="mt-6 divide-y divide-line rounded-[22px] border border-line bg-white">
              {FAQ.map(([q, a]) => (
                <details key={q} className="group px-5 py-4 sm:px-6">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-[15.5px] font-semibold">
                    {t(q)}
                    <ChevronDown className="h-4 w-4 shrink-0 text-muted transition-transform group-open:rotate-180" />
                  </summary>
                  <p className="mt-2 text-[14.5px] leading-relaxed text-muted">{t(a)}</p>
                </details>
              ))}
            </div>
            <div className="mt-8 flex flex-wrap items-center gap-3 rounded-[22px] bg-ink p-6 text-white sm:p-8">
              <p className="min-w-[220px] flex-1 text-[17px] font-semibold">{t('product.helpTitle')}</p>
              <Button variant="whatsapp" to={whatsappLink('Bonjour Dallou Chine, j’ai une question sur le fonctionnement.')}>
                {t('product.helpCta')}
              </Button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
