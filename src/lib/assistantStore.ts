import { useSyncExternalStore } from 'react';
import { askAssistant, type AssistantReply } from '../services/assistant';
import { AppError } from './db';
import { trackEvent } from './analytics';

export interface AssistantMsg {
  role: 'user' | 'assistant';
  content: string;
  /** Message produit par l'interface (accueil, erreur) : jamais renvoyé au serveur. */
  local?: boolean;
  data?: Pick<AssistantReply, 'products' | 'groupages' | 'actions' | 'mode'>;
}

interface State {
  messages: AssistantMsg[];
  busy: boolean;
}

const KEY = 'dallouchine_assistant_v1';

function load(): AssistantMsg[] {
  try {
    const raw = JSON.parse(sessionStorage.getItem(KEY) || '[]');
    return Array.isArray(raw) ? raw.slice(-20) : [];
  } catch {
    return [];
  }
}

let state: State = { messages: load(), busy: false };
const listeners = new Set<() => void>();

function set(next: Partial<State>) {
  state = { ...state, ...next };
  try {
    sessionStorage.setItem(KEY, JSON.stringify(state.messages.slice(-20)));
  } catch {
    /* stockage indisponible : la conversation reste en mémoire */
  }
  listeners.forEach(l => l());
}

export const assistantStore = {
  subscribe(l: () => void) {
    listeners.add(l);
    return () => listeners.delete(l);
  },
  getState: () => state,

  /** Envoie une question ; la conversation est partagée entre l'accueil et le chat flottant. */
  async send(text: string, lang: 'fr' | 'en', errors: { generic: string; rateLimited: string }) {
    const q = text.trim();
    if (!q || state.busy) return;
    trackEvent('assistant_question');
    const next: AssistantMsg[] = [...state.messages, { role: 'user', content: q }];
    set({ messages: next, busy: true });
    try {
      const history = next.filter(m => !m.local).map(m => ({ role: m.role, content: m.content }));
      const res = await askAssistant(history, lang);
      set({ messages: [...state.messages, { role: 'assistant', content: res.reply, data: { products: res.products, groupages: res.groupages, actions: res.actions, mode: res.mode } }], busy: false });
    } catch (err) {
      const limited = err instanceof AppError && err.code === 'RATE_LIMITED';
      set({ messages: [...state.messages, { role: 'assistant', content: limited ? errors.rateLimited : errors.generic, local: true }], busy: false });
    }
  },

  reset() {
    set({ messages: [], busy: false });
  }
};

export function useAssistant() {
  return useSyncExternalStore(assistantStore.subscribe, assistantStore.getState, assistantStore.getState);
}
