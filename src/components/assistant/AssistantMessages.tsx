import React from 'react';
import { Users } from 'lucide-react';
import { usePrefs } from '../../context/PrefsContext';
import type { AssistantMsg } from '../../lib/assistantStore';
import { Link } from '../ui/Link';

export function Bubble({ role, children }: { role: 'user' | 'assistant'; children: React.ReactNode }) {
  const mine = role === 'user';
  return (
    <div className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
      <p className={`max-w-[88%] whitespace-pre-line rounded-2xl px-3.5 py-2.5 text-[14px] leading-relaxed ${mine ? 'rounded-br-md bg-ink text-white' : 'rounded-bl-md border border-line bg-white text-ink'}`}>{children}</p>
    </div>
  );
}

/** Messages de l'assistant avec leurs cartes produits, groupages et boutons d'action. */
export function AssistantMessages({ messages, busy, onNavigate }: { messages: AssistantMsg[]; busy: boolean; onNavigate: (to: string) => void }) {
  const { t, money } = usePrefs();
  return (
    <>
      {messages.map((m, i) => (
        <div key={i} className="space-y-2">
          <Bubble role={m.role}>{m.content}</Bubble>
          {m.data && (m.data.products.length > 0 || m.data.groupages.length > 0) && (
            <ul className="space-y-2 pl-1">
              {m.data.products.map(p => (
                <li key={p.id}>
                  <Link to={`/produit/${p.slug}`} onClick={() => onNavigate(`/produit/${p.slug}`)} className="lift flex items-center gap-3 rounded-2xl border border-line bg-white p-2.5">
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
                  <Link to={`/groupages/${g.id}`} onClick={() => onNavigate(`/groupages/${g.id}`)} className="lift flex items-center gap-3 rounded-2xl border border-ochre/30 bg-ochre-50 p-3">
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
                <button key={a.to} type="button" onClick={() => onNavigate(a.to)} className="rounded-full bg-brand-gradient px-3.5 py-2 text-[12.5px] font-semibold text-white shadow-sm hover:brightness-105">
                  {a.label}
                </button>
              ))}
            </div>
          )}
        </div>
      ))}
      {busy && <Bubble role="assistant">{t('assistant.thinking')}</Bubble>}
    </>
  );
}
