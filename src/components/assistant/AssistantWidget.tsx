import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowUp, MessageCircle, PackageSearch, Search, Sparkles, Users, X } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { usePrefs } from '../../context/PrefsContext';
import { askAssistant, type AssistantReply } from '../../services/assistant';
import { whatsappLink } from '../../lib/config';
import { AppError } from '../../lib/db';
import { Link } from '../ui/Link';

interface Msg {
  role: 'user' | 'assistant';
  content: string;
  local?: boolean;
  data?: Pick<AssistantReply, 'products' | 'groupages' | 'actions' | 'mode'>;
}

const KEY = 'dallouchine_assistant_v1';

function load(): Msg[] {
  try {
    const raw = JSON.parse(sessionStorage.getItem(KEY) || '[]');
    return Array.isArray(raw) ? raw.slice(-20) : [];
  } catch {
    return [];
  }
}

/** Assistant flottant : recherche conversationnelle (« mode IA »), aide rapide et lien vers un conseiller. */
export function AssistantWidget() {
  const { navigate } = useApp();
  const { t, lang, money } = usePrefs();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>(load);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const messagesRef = useRef(messages);
  messagesRef.current = messages;

  useEffect(() => {
    try {
      sessionStorage.setItem(KEY, JSON.stringify(messages.slice(-20)));
    } catch {
      /* ignore */
    }
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, busy, open]);

  const send = useCallback(
    async (text: string) => {
      const q = text.trim();
      if (!q || busy) return;
      const next: Msg[] = [...messagesRef.current, { role: 'user', content: q }];
      setMessages(next);
      setInput('');
      setBusy(true);
      try {
        const history = next.filter(m => !m.local).map(m => ({ role: m.role, content: m.content }));
        const res = await askAssistant(history, lang);
        setMessages(m => [...m, { role: 'assistant', content: res.reply, data: { products: res.products, groupages: res.groupages, actions: res.actions, mode: res.mode } }]);
      } catch (err) {
        const limited = err instanceof AppError && err.code === 'RATE_LIMITED';
        setMessages(m => [...m, { role: 'assistant', content: limited ? t('assistant.rateLimit') : t('assistant.error'), local: true, data: { products: [], groupages: [], actions: [], mode: 'simple' } }]);
      } finally {
        setBusy(false);
      }
    },
    [busy, lang, t]
  );

  // Ouverture depuis la recherche de l'en-tête (« IA ») ou le menu mobile
  useEffect(() => {
    const onOpen = (e: Event) => {
      const q = (e as CustomEvent<{ q?: string }>).detail?.q;
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

            {messages.map((m, i) => (
              <div key={i} className="space-y-2">
                <Bubble role={m.role}>{m.content}</Bubble>
                {m.data && (m.data.products.length > 0 || m.data.groupages.length > 0) && (
                  <ul className="space-y-2 pl-1">
                    {m.data.products.map(p => (
                      <li key={p.id}>
                        <Link to={`/produit/${p.slug}`} onClick={() => setOpen(false)} className="lift flex items-center gap-3 rounded-2xl border border-line bg-white p-2.5">
                          <span className="h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-paper-2">{p.image && <img src={p.image} alt="" loading="lazy" className="h-full w-full object-cover" />}</span>
                          <span className="min-w-0 flex-1">
                            <span className="line-clamp-2 text-[13px] font-semibold leading-snug">{p.name}</span>
                            <span className="num mt-0.5 block text-[13px] font-bold text-brand-700">{money(p.priceXOF)}</span>
                          </span>
                        </Link>
                      </li>
                    ))}
                    {m.data.groupages.map(g => (
                      <li key={g.id}>
                        <Link to={`/groupages/${g.id}`} onClick={() => setOpen(false)} className="lift flex items-center gap-3 rounded-2xl border border-ochre/30 bg-ochre-50 p-3">
                          <Users className="h-5 w-5 shrink-0 text-ochre" />
                          <span className="min-w-0 flex-1">
                            <span className="line-clamp-1 text-[13px] font-semibold">{g.title}</span>
                            <span className="num block text-[12px] text-muted">
                              {t('assistant.groupagesTitle')} · {money(g.unitPriceXOF)} · {g.reserved}/{g.target}
                            </span>
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
                {m.data && m.data.actions.length > 0 && (
                  <div className="flex flex-wrap gap-2 pl-1">
                    {m.data.actions.map(a => (
                      <button key={a.to} type="button" onClick={() => go(a.to)} className="rounded-full bg-brand-gradient px-3.5 py-2 text-[12.5px] font-semibold text-white shadow-sm hover:brightness-105">
                        {a.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
            {busy && <Bubble role="assistant">{t('assistant.thinking')}</Bubble>}
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

function Bubble({ role, children }: { role: 'user' | 'assistant'; children: React.ReactNode }) {
  const mine = role === 'user';
  return (
    <div className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
      <p className={`max-w-[88%] whitespace-pre-line rounded-2xl px-3.5 py-2.5 text-[14px] leading-relaxed ${mine ? 'rounded-br-md bg-ink text-white' : 'rounded-bl-md border border-line bg-white text-ink'}`}>{children}</p>
    </div>
  );
}
