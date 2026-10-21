import { apiFetch } from '../lib/api';

export interface AssistantProduct {
  id: string;
  slug: string;
  name: string;
  priceXOF: number;
  moq: number;
  image: string | null;
  delay: string | null;
}

export interface AssistantGroupage {
  id: string;
  title: string;
  unitPriceXOF: number;
  reserved: number;
  target: number;
  deadline: string | null;
}

export interface AssistantReply {
  reply: string;
  mode: 'ai' | 'simple';
  products: AssistantProduct[];
  groupages: AssistantGroupage[];
  actions: { label: string; to: string }[];
}

export function askAssistant(messages: { role: 'user' | 'assistant'; content: string }[], lang: 'fr' | 'en') {
  return apiFetch<AssistantReply & { success: boolean }>('/api/assistant/chat', { method: 'POST', body: { messages, lang } });
}
