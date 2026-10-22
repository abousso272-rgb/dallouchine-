import React from 'react';
import { BookOpen } from 'lucide-react';
import { Link } from '../ui/Link';

/** Bouton « Guide » à placer en haut d'un écran : ouvre le guide directement sur le module concerné. */
export function GuideLink({ module, label = 'Guide de cet écran' }: { module: string; label?: string }) {
  return (
    <Link
      to={`/espace-pro/guide?module=${encodeURIComponent(module)}`}
      className="inline-flex h-10 items-center gap-2 rounded-full border border-brand/30 bg-brand-50 px-4 text-[13px] font-semibold text-brand-700 transition-colors hover:border-brand hover:bg-white"
    >
      <BookOpen className="h-4 w-4" /> {label}
    </Link>
  );
}
