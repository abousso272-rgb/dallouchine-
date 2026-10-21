import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabase';
import { detectLang, translate, type Lang, type TranslationKey } from '../lib/i18n';

export type Currency = 'XOF' | 'EUR' | 'USD' | 'CNY';
export const CURRENCIES: Currency[] = ['XOF', 'EUR', 'USD', 'CNY'];

/** FCFA pour 1 unité de la devise. L'euro est à parité fixe avec le FCFA ; dollar et yuan viennent de la base. */
interface Rates {
  EUR: number;
  USD: number;
  CNY: number;
  updatedAt: string | null;
}

const EUR_XOF = 655.957;
const DEFAULT_RATES: Rates = { EUR: EUR_XOF, USD: 615, CNY: 88.5, updatedAt: null };
const STORAGE_KEY = 'dallouchine_prefs_v1';
const RATES_KEY = 'dallouchine_rates_v1';
const RATES_TTL = 6 * 3600 * 1000;

interface Prefs {
  lang: Lang;
  currency: Currency;
}

interface PrefsValue extends Prefs {
  setLang: (l: Lang) => void;
  setCurrency: (c: Currency) => void;
  t: (key: TranslationKey, vars?: Record<string, string | number>) => string;
  /** Montant en FCFA affiché dans la devise choisie (approximatif hors FCFA). */
  money: (xof: number | null | undefined, opts?: { forceXOF?: boolean }) => string;
  rates: Rates;
}

const Ctx = createContext<PrefsValue | null>(null);

function readPrefs(): Prefs {
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
    if (raw && (raw.lang === 'fr' || raw.lang === 'en') && CURRENCIES.includes(raw.currency)) return raw;
  } catch {
    /* stockage indisponible */
  }
  return { lang: detectLang(), currency: 'XOF' };
}

function readRates(): Rates {
  try {
    const raw = JSON.parse(localStorage.getItem(RATES_KEY) || 'null');
    if (raw && raw.USD > 0 && raw.CNY > 0) return { ...DEFAULT_RATES, ...raw, EUR: EUR_XOF };
  } catch {
    /* ignore */
  }
  return DEFAULT_RATES;
}

const nf = (locale: string, currency: string, max = 2) => new Intl.NumberFormat(locale, { style: 'currency', currency, maximumFractionDigits: max, minimumFractionDigits: 0 });

export function formatMoney(xof: number | null | undefined, currency: Currency, rates: Rates, lang: Lang): string {
  const v = Number(xof);
  if (xof === null || xof === undefined || Number.isNaN(v)) return '—';
  if (currency === 'XOF') return `${new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(Math.round(v))} FCFA`;
  const converted = v / rates[currency];
  const locale = lang === 'en' ? 'en-US' : 'fr-FR';
  // Petits montants : on garde les centimes ; grands montants : arrondi
  return `≈ ${nf(locale, currency, converted >= 100 ? 0 : 2).format(converted)}`;
}

export function PrefsProvider({ children }: { children: React.ReactNode }) {
  const [prefs, setPrefs] = useState<Prefs>(readPrefs);
  const [rates, setRates] = useState<Rates>(readRates);

  useEffect(() => {
    document.documentElement.lang = prefs.lang;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
    } catch {
      /* ignore */
    }
  }, [prefs]);

  // Taux du jour (dollar, yuan) lus dans les réglages publics ; en cas d'échec, les derniers connus restent utilisés
  useEffect(() => {
    let alive = true;
    const cached = (() => {
      try {
        return JSON.parse(localStorage.getItem(RATES_KEY) || 'null');
      } catch {
        return null;
      }
    })();
    if (cached?.fetchedAt && Date.now() - cached.fetchedAt < RATES_TTL) return;
    supabase
      .from('platform_settings')
      .select('value, updated_at')
      .eq('key', 'exchange_rates')
      .maybeSingle()
      .then(({ data }) => {
        const v = data?.value as { usd_to_xof?: number; cny_to_xof?: number } | undefined;
        if (!alive || !v || !(v.usd_to_xof! > 0) || !(v.cny_to_xof! > 0)) return;
        const next: Rates = { EUR: EUR_XOF, USD: Number(v.usd_to_xof), CNY: Number(v.cny_to_xof), updatedAt: data?.updated_at || null };
        setRates(next);
        try {
          localStorage.setItem(RATES_KEY, JSON.stringify({ ...next, fetchedAt: Date.now() }));
        } catch {
          /* ignore */
        }
      });
    return () => {
      alive = false;
    };
  }, []);

  const setLang = useCallback((lang: Lang) => setPrefs(p => ({ ...p, lang })), []);
  const setCurrency = useCallback((currency: Currency) => setPrefs(p => ({ ...p, currency })), []);
  const t = useCallback((key: TranslationKey, vars?: Record<string, string | number>) => translate(prefs.lang, key, vars), [prefs.lang]);
  const money = useCallback(
    (xof: number | null | undefined, opts?: { forceXOF?: boolean }) => formatMoney(xof, opts?.forceXOF ? 'XOF' : prefs.currency, rates, prefs.lang),
    [prefs.currency, prefs.lang, rates]
  );

  const value = useMemo<PrefsValue>(() => ({ ...prefs, setLang, setCurrency, t, money, rates }), [prefs, setLang, setCurrency, t, money, rates]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function usePrefs(): PrefsValue {
  const v = useContext(Ctx);
  if (!v) throw new Error('usePrefs doit être utilisé dans <PrefsProvider>');
  return v;
}
