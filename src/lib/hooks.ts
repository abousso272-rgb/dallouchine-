import { useCallback, useEffect, useRef, useState } from 'react';
import { friendlyError } from './db';
import { resolveFileUrl } from './storage';

/** Chargement asynchrone avec états loading / erreur / rechargement. */
export function useAsync<T>(fn: () => Promise<T>, deps: unknown[] = []) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const fnRef = useRef(fn);
  fnRef.current = fn;
  const seq = useRef(0);

  const run = useCallback(async (silent = false) => {
    const id = ++seq.current;
    if (!silent) setLoading(true);
    setError(null);
    try {
      const result = await fnRef.current();
      if (id === seq.current) setData(result);
    } catch (err) {
      if (id === seq.current) setError(friendlyError(err));
    } finally {
      if (id === seq.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
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
