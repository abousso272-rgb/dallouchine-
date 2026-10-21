import React, { useEffect, useRef, useState } from 'react';
import { Check, Globe } from 'lucide-react';
import { CURRENCIES, usePrefs, type Currency } from '../../context/PrefsContext';
import { LANGS } from '../../lib/i18n';
import { formatDate } from '../../lib/format';

const SYMBOL: Record<Currency, string> = { XOF: 'FCFA', EUR: '€', USD: '$', CNY: '¥' };

/** Choix de la langue et de la devise d'affichage (le paiement reste en FCFA). */
export function PrefsPanel({ onDone }: { onDone?: () => void }) {
  const { lang, setLang, currency, setCurrency, t, rates } = usePrefs();
  return (
    <div className="space-y-5">
      <div>
        <p className="mb-2 text-[12px] font-bold uppercase tracking-wide text-muted">{t('prefs.language')}</p>
        <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label={t('prefs.language')}>
          {LANGS.map(l => (
            <button
              key={l.code}
              type="button"
              role="radio"
              aria-checked={lang === l.code}
              onClick={() => {
                setLang(l.code);
                onDone?.();
              }}
              className={`flex h-11 items-center justify-between rounded-xl border px-3.5 text-sm font-semibold transition-colors ${lang === l.code ? 'border-brand bg-brand-50 text-brand-700' : 'border-line bg-white hover:border-brand/40'}`}
            >
              {l.native}
              {lang === l.code && <Check className="h-4 w-4" />}
            </button>
          ))}
        </div>
      </div>
      <div>
        <p className="mb-2 text-[12px] font-bold uppercase tracking-wide text-muted">{t('prefs.currency')}</p>
        <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label={t('prefs.currency')}>
          {CURRENCIES.map(c => (
            <button
              key={c}
              type="button"
              role="radio"
              aria-checked={currency === c}
              onClick={() => {
                setCurrency(c);
                onDone?.();
              }}
              className={`flex h-11 items-center justify-between rounded-xl border px-3.5 text-sm font-semibold transition-colors ${currency === c ? 'border-brand bg-brand-50 text-brand-700' : 'border-line bg-white hover:border-brand/40'}`}
            >
              <span>
                {SYMBOL[c]} <span className="font-normal text-muted">{t(`currency.${c}` as const)}</span>
              </span>
              {currency === c && <Check className="h-4 w-4" />}
            </button>
          ))}
        </div>
        <p className="mt-3 text-[12px] leading-relaxed text-muted">
          {t('prefs.note')}
          {rates.updatedAt && (
            <span className="block text-subtle">
              {t('prefs.rateUpdated')} : {formatDate(rates.updatedAt)}
            </span>
          )}
        </p>
      </div>
    </div>
  );
}

export function PrefsMenu() {
  const { lang, currency, t } = usePrefs();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', close);
    document.addEventListener('keydown', esc);
    return () => {
      document.removeEventListener('mousedown', close);
      document.removeEventListener('keydown', esc);
    };
  }, [open]);

  return (
    <div className="relative hidden lg:block" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-label={t('prefs.title')}
        className="flex h-10 items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 text-[12.5px] font-semibold text-ink hover:bg-white"
      >
        <Globe className="h-[17px] w-[17px]" />
        <span className="num hidden xl:inline">
          {lang.toUpperCase()} · {SYMBOL[currency]}
        </span>
        <span className="num xl:hidden">{lang.toUpperCase()}</span>
      </button>
      {open && (
        <div role="dialog" aria-label={t('prefs.title')} className="animate-fade-in-up absolute right-0 top-12 z-50 w-[320px] rounded-2xl border border-line bg-white p-4 shadow-[var(--shadow-lift)]">
          <PrefsPanel onDone={() => undefined} />
        </div>
      )}
    </div>
  );
}
