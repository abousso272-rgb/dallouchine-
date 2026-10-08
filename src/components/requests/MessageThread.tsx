import React, { useEffect, useRef, useState } from 'react';
import { MessageSquareText, Send } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { listMessages, postMessage } from '../../services/requests';
import type { Message } from '../../lib/types';
import type { RequestType } from '../../lib/status';
import { friendlyError } from '../../lib/db';
import { formatDateTime } from '../../lib/format';
import { Spinner } from '../ui/States';

/** Fil d'échange lié à une demande ou une commande (client ↔ équipe Dallou Chine). */
export function MessageThread({
  type,
  threadId,
  viewer,
  title = 'Échanges avec l’équipe',
  emptyText = 'Posez vos questions ici : votre conseiller vous répond dans ce fil.'
}: {
  type: RequestType | 'order';
  threadId: string;
  viewer: 'client' | 'staff';
  title?: string;
  emptyText?: string;
}) {
  const { toast } = useApp();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  async function load(silent = false) {
    try {
      const m = await listMessages(type, threadId);
      setMessages(prev => {
        if (prev.length !== m.length && !silent) window.setTimeout(() => endRef.current?.scrollIntoView({ block: 'nearest' }), 50);
        return m;
      });
    } catch (err) {
      if (!silent) toast('error', 'Messages indisponibles', friendlyError(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    setLoading(true);
    load();
    const t = window.setInterval(() => load(true), 20000);
    return () => window.clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type, threadId]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    const text = body.trim();
    if (!text) return;
    setSending(true);
    try {
      await postMessage(type, threadId, text);
      setBody('');
      await load();
    } catch (err) {
      toast('error', 'Message non envoyé', friendlyError(err));
    } finally {
      setSending(false);
    }
  }

  return (
    <section className="card flex flex-col p-0">
      <div className="flex items-center gap-2 border-b border-line px-5 py-4">
        <MessageSquareText className="h-4 w-4 text-brand" />
        <h2 className="text-base font-semibold">{title}</h2>
      </div>
      <div className="max-h-[420px] min-h-[140px] flex-1 space-y-3 overflow-y-auto px-5 py-4">
        {loading ? (
          <div className="flex justify-center py-6">
            <Spinner />
          </div>
        ) : messages.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted">{emptyText}</p>
        ) : (
          messages.map(m => {
            const mine = m.senderRole === viewer;
            return (
              <div key={m.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 ${mine ? 'rounded-br-md bg-ink text-white' : 'rounded-bl-md bg-paper-2 text-ink'}`}>
                  <p className={`text-[11px] font-semibold ${mine ? 'text-white/60' : 'text-muted'}`}>
                    {m.senderRole === 'staff' ? m.senderName || 'Équipe Dallou Chine' : m.senderName || 'Client'} · {formatDateTime(m.createdAt)}
                  </p>
                  <p className="mt-0.5 whitespace-pre-line text-[14px] leading-relaxed">{m.body}</p>
                </div>
              </div>
            );
          })
        )}
        <div ref={endRef} />
      </div>
      <form onSubmit={send} className="flex items-end gap-2 border-t border-line p-3">
        <textarea
          value={body}
          onChange={e => setBody(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) send(e);
          }}
          placeholder="Écrire un message…"
          rows={1}
          maxLength={4000}
          className="max-h-32 min-h-11 flex-1 resize-y rounded-xl border border-line-2 bg-white px-3.5 py-2.5 focus:border-brand/60 focus:outline-none focus:ring-4 focus:ring-brand/10"
          aria-label="Message"
        />
        <button type="submit" disabled={sending || !body.trim()} className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand text-white disabled:opacity-40" aria-label="Envoyer">
          {sending ? <Spinner className="h-4 w-4 text-white" /> : <Send className="h-4 w-4" />}
        </button>
      </form>
    </section>
  );
}
