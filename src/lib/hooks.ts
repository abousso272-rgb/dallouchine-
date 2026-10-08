import { useCallback, useEffect, useRef, useState } from 'react';
import { friendlyError } from './db';
import { resolveFileUrl } from './storage';

const memoryCache = new Map<string, { data: unknown; at: number }>();

/** Vide le cache mémoire (après une écriture) pour les clés commençant par le préfixe. */
export function invalidateCache(prefix = '') {
  for (const k of [...memoryCache.keys()]) if (k.startsWith(prefix)) memoryCache.delete(k);
}

/**
 * Chargement asynchrone avec états loading / erreur / rechargement.
 * Avec `cacheKey`, les données déjà vues s'affichent instantanément (navigation sans attente)
 * puis sont rafraîchies en arrière-plan si elles ont plus de `maxAge` ms.
 */
export function useAsync<T>(fn: () => Promise<T>, deps: unknown[] = [], opts: { cacheKey?: string; maxAge?: number } = {}) {
  const cached = opts.cacheKey ? (memoryCache.get(opts.cacheKey) as { data: T; at: number } | undefined) : undefined;
  const [data, setData] = useState<T | null>(cached ? cached.data : null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(!cached);
  const fnRef = useRef(fn);
  fnRef.current = fn;
  const keyRef = useRef(opts.cacheKey);
  keyRef.current = opts.cacheKey;
  const seq = useRef(0);

  const run = useCallback(async (silent = false) => {
    const id = ++seq.current;
    if (!silent) setLoading(true);
    setError(null);
    try {
      const result = await fnRef.current();
      if (id === seq.current) {
        setData(result);
        if (keyRef.current) memoryCache.set(keyRef.current, { data: result, at: Date.now() });
      }
    } catch (err) {
      if (id === seq.current) setError(friendlyError(err));
    } finally {
      if (id === seq.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    const hit = keyRef.current ? memoryCache.get(keyRef.current) : undefined;
    if (hit) {
      setData(hit.data as T);
      setLoading(false);
      if (Date.now() - hit.at > (opts.maxAge ?? 15000)) run(true);
      return;
    }
    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return { data, error, loading, reload: () => run(true), setData };
}

/** URL affichable pour une référence de fichier (signée si privée). */
export function useFileUrl(ref?: string | null) {
  const [url, setUrl] = useState<string | null>(ref && !ref.startsWith('sb://') ? ref : null);
  useEffect(() => {
    let active = true;
    if (!ref) {
      setUrl(null);
      return;
    }
    resolveFileUrl(ref).then(u => active && setUrl(u));
    return () => {
      active = false;
    };
  }, [ref]);
  return url;
}

export function useDebounced<T>(value: T, delay = 300): T {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = window.setTimeout(() => setV(value), delay);
    return () => window.clearTimeout(t);
  }, [value, delay]);
  return v;
}

export function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(() => (typeof window !== 'undefined' ? window.matchMedia(query).matches : false));
  useEffect(() => {
    const m = window.matchMedia(query);
    const on = () => setMatches(m.matches);
    m.addEventListener('change', on);
    return () => m.removeEventListener('change', on);
  }, [query]);
  return matches;
}

/**
 * Rafraîchit silencieusement des données à intervalle régulier,
 * uniquement quand l’onglet est visible, et au retour sur l’onglet.
 */
export function usePolling(refresh: () => void, ms = 30000, enabled = true) {
  const ref = useRef(refresh);
  ref.current = refresh;
  useEffect(() => {
    if (!enabled) return;
    const tick = () => {
      if (document.visibilityState === 'visible') ref.current();
    };
    const t = window.setInterval(tick, ms);
    document.addEventListener('visibilitychange', tick);
    return () => {
      window.clearInterval(t);
      document.removeEventListener('visibilitychange', tick);
    };
  }, [ms, enabled]);
}
