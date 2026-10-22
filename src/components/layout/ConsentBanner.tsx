import React, { useEffect, useState } from 'react';
import { gaConfigured, readConsent, setConsent } from '../../lib/analytics';

/** Accord pour la mesure d'audience Google (affiché seulement si Google Analytics est configuré). */
export function ConsentBanner() {
  const [show, setShow] = useState(false);
  useEffect(() => {
    if (!gaConfigured || readConsent() !== null) return;
    const id = window.setTimeout(() => setShow(true), 1500);
    return () => window.clearTimeout(id);
  }, []);
  if (!show) return null;
  const answer = (v: 'granted' | 'denied') => {
    setConsent(v);
    setShow(false);
  };
  return (
    <div role="dialog" aria-label="Mesure d’audience" className="animate-fade-in-up fixed inset-x-2 bottom-[92px] z-[60] mx-auto max-w-xl rounded-2xl border border-line bg-white p-4 shadow-[var(--shadow-lift)] sm:inset-x-4 lg:bottom-6">
      <p className="text-[13.5px] leading-relaxed text-ink">
        Nous utilisons Google Analytics pour comprendre comment le site est utilisé et l’améliorer. Aucune donnée n’est vendue. Acceptez-vous cette mesure d’audience ?
      </p>
      <div className="mt-3 flex justify-end gap-2">
        <button type="button" onClick={() => answer('denied')} className="h-10 rounded-full border border-line px-4 text-[13px] font-semibold text-muted hover:text-ink">
          Refuser
        </button>
        <button type="button" onClick={() => answer('granted')} className="h-10 rounded-full bg-brand-gradient px-5 text-[13px] font-semibold text-white">
          Accepter
        </button>
      </div>
    </div>
  );
}
