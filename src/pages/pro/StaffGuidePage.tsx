import React, { useEffect, useMemo, useState } from 'react';
import { ArrowRight, BookOpen, CheckCircle2, ChevronDown, Lightbulb } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { GUIDE_MODULES, ROLE_INTRO, modulesFor, type StaffRole } from '../../lib/staffGuide';
import { PageHeader } from '../../components/ui/Layout';
import { Button } from '../../components/ui/Button';

const ROLES: StaffRole[] = ['admin', 'transitaire', 'groupage_manager'];

/** Guide de l'espace pro : le parcours de votre rôle, module par module, avec un lien vers chaque écran. */
export default function StaffGuidePage() {
  const { user, query } = useApp();
  const own = (user?.role && user.role !== 'client' ? user.role : 'transitaire') as StaffRole;
  const isAdmin = user?.role === 'admin';
  const requested = query.get('role') as StaffRole | null;
  const [role, setRole] = useState<StaffRole>(isAdmin && requested && ROLES.includes(requested) ? requested : own);
  const modules = useMemo(() => modulesFor(role), [role]);
  const target = query.get('module');
  const [open, setOpen] = useState<Set<string>>(() => new Set(target ? [target] : [modulesFor(role)[0]?.id]));

  // Lien direct vers un module (bouton « Guide » d'un écran) : on l'ouvre et on y descend
  useEffect(() => {
    if (!target) return;
    setOpen(prev => new Set(prev).add(target));
    const id = window.setTimeout(() => document.getElementById(`guide-${target}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 120);
    return () => window.clearTimeout(id);
  }, [target]);

  const toggle = (id: string) =>
    setOpen(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  return (
    <>
      <PageHeader
        eyebrow="Aide"
        title="Guide de mon espace"
        description={`${ROLE_INTRO[role].title} : ${ROLE_INTRO[role].text}`}
        actions={
          <Button variant="secondary" onClick={() => setOpen(prev => (prev.size >= modules.length ? new Set() : new Set(modules.map(m => m.id))))}>
            {open.size >= modules.length ? 'Tout replier' : 'Tout déplier'}
          </Button>
        }
      />

      {isAdmin && (
        <div className="mb-5 flex flex-wrap gap-2" role="tablist" aria-label="Guide par rôle">
          {ROLES.map(r => (
            <button
              key={r}
              type="button"
              role="tab"
              aria-selected={role === r}
              onClick={() => {
                setRole(r);
                setOpen(new Set([modulesFor(r)[0]?.id]));
              }}
              className={`h-10 rounded-full px-4 text-[13.5px] font-semibold transition-colors ${role === r ? 'bg-ink text-white' : 'bg-white text-muted ring-1 ring-line hover:text-ink'}`}
            >
              {ROLE_INTRO[r].title}
              {r === own && <span className="ml-1.5 text-[11.5px] font-normal opacity-70">(vous)</span>}
            </button>
          ))}
          <p className="w-full text-[12.5px] text-muted">Partagez le guide de leur rôle avec vos collaborateurs : chacun voit le sien en ouvrant « Guide de mon espace ».</p>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
        <nav aria-label="Sommaire du guide" className="hidden lg:block">
          <ol className="sticky top-6 space-y-0.5">
            {modules.map((m, i) => (
              <li key={m.id}>
                <a
                  href={`#guide-${m.id}`}
                  onClick={e => {
                    e.preventDefault();
                    setOpen(prev => new Set(prev).add(m.id));
                    document.getElementById(`guide-${m.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }}
                  className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-[13px] font-semibold text-muted hover:bg-white hover:text-ink"
                >
                  <span className="num flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-paper-2 text-[11.5px]">{i + 1}</span>
                  <span className="leading-tight">{m.title}</span>
                </a>
              </li>
            ))}
          </ol>
        </nav>

        <div className="space-y-3">
          {modules.map((m, i) => {
            const isOpen = open.has(m.id);
            return (
              <section key={m.id} id={`guide-${m.id}`} className="scroll-mt-6 overflow-hidden rounded-[var(--radius-card)] border border-line bg-white shadow-[var(--shadow-soft)]">
                <button type="button" onClick={() => toggle(m.id)} aria-expanded={isOpen} className="flex w-full items-start gap-3 p-4 text-left sm:p-5">
                  <span className="num flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-gradient text-[13px] font-bold text-white">{i + 1}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[16px] font-bold">{m.title}</span>
                    <span className="mt-0.5 block text-[13.5px] text-muted">{m.purpose}</span>
                  </span>
                  <ChevronDown className={`mt-1.5 h-5 w-5 shrink-0 text-subtle transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                </button>
                {isOpen && (
                  <div className="border-t border-line px-4 pb-5 pt-4 sm:px-5 sm:pl-[68px]">
                    <ol className="space-y-2.5">
                      {m.steps.map((s, k) => (
                        <li key={k} className="flex gap-2.5 text-[14px] leading-relaxed">
                          <CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-jade" />
                          <span>{s}</span>
                        </li>
                      ))}
                    </ol>
                    {m.tips && m.tips.length > 0 && (
                      <div className="mt-4 rounded-2xl bg-ochre-50 p-3.5">
                        <p className="mb-1.5 flex items-center gap-1.5 text-[12.5px] font-bold text-ochre">
                          <Lightbulb className="h-4 w-4" /> Bons réflexes
                        </p>
                        <ul className="space-y-1 text-[13.5px] text-ink/85">
                          {m.tips.map(t => (
                            <li key={t}>• {t}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {m.link && (
                      <Button className="mt-4" size="sm" to={m.link.to} icon={<ArrowRight className="h-3.5 w-3.5" />}>
                        {m.link.label}
                      </Button>
                    )}
                  </div>
                )}
              </section>
            );
          })}
          <p className="flex items-center gap-2 pt-2 text-[12.5px] text-muted">
            <BookOpen className="h-4 w-4" /> {GUIDE_MODULES.length} modules au total. Une question non couverte ? Écrivez à l’administrateur.
          </p>
        </div>
      </div>
    </>
  );
}
