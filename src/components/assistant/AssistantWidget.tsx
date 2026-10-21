import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowUp, MessageCircle, PackageSearch, Search, Sparkles, Users, X } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { usePrefs } from '../../context/PrefsContext';
import { assistantStore, useAssistant } from '../../lib/assistantStore';
import { whatsappLink } from '../../lib/config';
import { AssistantMessages, Bubble } from './AssistantMessages';

/** Assistant flottant : recherche conversationnelle (« mode IA »), aide rapide et lien vers un conseiller. */
export function AssistantWidget() {
  const { navigate } = useApp();
  const { t, lang } = usePrefs();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const { messages, busy } = useAssistant();
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, busy, open]);

  const send = useCallback(
    async (text: string) => {
      setInput('');
      await assistantStore.send(text, lang, { generic: t('assistant.error'), rateLimited: t('assistant.rateLimit') });
    },
    [lang, t]
  );

  // Ouverture depuis la recherche de l'en-tête (« IA ») ou le menu mobile
  useEffect(() => {
    const onOpen = (e: Event) => {
      const q = (e as CustomEvent<{ q?: string }>).detail?.q;
      // Sur l'accueil, la recherche IA de la page prend le relais (même conversation)
      const band = document.getElementById('home-ai-search');
      if (band) {
        band.scrollIntoView({ behavior: 'smooth', block: 'start' });
        window.setTimeout(() => document.getElementById('home-ai-input')?.focus({ preventScroll: true }), 350);
        if (q) void send(q);
        return;
      }
      setOpen(true);
      if (q) void send(q);
    };
    window.addEventListener('dc:assistant', onOpen);
    return () => window.removeEventListener('dc:assistant', onOpen);
  }, [send]);

  useEffect(() => {
    if (!open) return;
    inputRef.current?.focus();
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('keydown', esc);
    return () => document.removeEventListener('keydown', esc);
  }, [open]);

  const quick = [
    { icon: PackageSearch, label: t('assistant.quick.track'), to: '/suivi' },
    { icon: Search, label: t('assistant.quick.quote'), to: '/sourcing' },
    { icon: Users, label: t('assistant.quick.groupages'), to: '/groupages' }
  ];
  const showQuick = messages.filter(m => m.role === 'user').length === 0;

  function go(to: string) {
    navigate(to);
    setOpen(false);
  }

  return (
    <>
      {!open && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label={t('assistant.open')}
          className="fixed bottom-[92px] right-4 z-[55] flex h-14 items-center gap-2 rounded-full bg-brand-gradient pl-4 pr-4 text-sm font-semibold text-white shadow-[0_14px_34px_-10px_rgb(232_72_13/0.7)] transition-transform hover:scale-[1.03] sm:pr-5 lg:bottom-6 lg:right-6"
        >
          <Sparkles className="h-5 w-5" />
          <span className="hidden sm:inline">{t('assistant.short')}</span>
        </button>
      )}

      {open && (
        <div
          role="dialog"
          aria-label={t('assistant.title')}
          className="animate-fade-in-up fixed inset-x-2 bottom-2 top-20 z-[65] flex flex-col overflow-hidden rounded-[26px] border border-line bg-white shadow-[var(--shadow-lift)] sm:inset-x-auto sm:bottom-6 sm:right-6 sm:top-auto sm:h-[620px] sm:max-h-[calc(100dvh-48px)] sm:w-[400px]"
        >
          <div className="flex items-center gap-3 bg-ink px-4 py-3.5 text-white">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-gradient">
              <Sparkles className="h-[18px] w-[18px]" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[14.5px] font-bold leading-tight">{t('assistant.title')}</p>
              <p className="truncate text-[12px] text-white/65">{t('assistant.subtitle')}</p>
            </div>
            <button type="button" onClick={() => setOpen(false)} aria-label={t('assistant.close')} className="rounded-full p-2 hover:bg-white/10">
              <X className="h-5 w-5" />
            </button>
          </div>

          <div ref={listRef} className="flex-1 space-y-3 overflow-y-auto bg-paper/60 px-3.5 py-4" aria-live="polite">
            <Bubble role="assistant">{t('assistant.hello')}</Bubble>
            {showQuick && (
              <div className="flex flex-wrap gap-2 pl-1">
                {quick.map(q => (
                  <button key={q.to} type="button" onClick={() => go(q.to)} className="inline-flex items-center gap-1.5 rounded-full border border-line bg-white px-3.5 py-2 text-[13px] font-semibold hover:border-brand/40 hover:text-brand-700">
                    <q.icon className="h-3.5 w-3.5" /> {q.label}
                  </button>
                ))}
                <a href={whatsappLink('Bonjour Dallou Chine, j’ai une question.')} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 rounded-full border border-[#25d366]/40 bg-white px-3.5 py-2 text-[13px] font-semibold text-[#128c4a] hover:bg-[#effbf3]">
                  <MessageCircle className="h-3.5 w-3.5" /> {t('assistant.quick.human')}
                </a>
              </div>
            )}

            <AssistantMessages messages={messages} busy={busy} onNavigate={go} />
          </div>

          <form
            onSubmit={e => {
              e.preventDefault();
              void send(input);
            }}
            className="flex items-center gap-2 border-t border-line bg-white p-3"
          >
            <input
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              maxLength={300}
              placeholder={t('assistant.placeholder')}
              aria-label={t('assistant.placeholder')}
              className="h-11 min-w-0 flex-1 rounded-full border border-line bg-paper px-4 text-[14px] focus:border-brand/50 focus:bg-white focus:outline-none"
              enterKeyHint="send"
            />
            <button type="submit" disabled={busy || !input.trim()} aria-label={t('assistant.send')} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand-gradient text-white shadow-sm disabled:opacity-40">
              <ArrowUp className="h-5 w-5" />
            </button>
          </form>
        </div>
      )}
    </>
  );
}
