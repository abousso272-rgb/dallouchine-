import { Router, Request, Response } from 'express';
import { answer, checkAssistantLimit, type ChatTurn } from '../services/AssistantService';

export const assistantRouter = Router();

/**
 * POST /api/assistant/chat  { messages: [{ role, content }], lang }
 * Ouvert aux visiteurs (conversion) mais plafonné : 20 messages / 10 min par adresse IP et plafond quotidien global.
 */
assistantRouter.post('/chat', async (req: Request, res: Response): Promise<void> => {
  const lang = req.body?.lang === 'en' ? 'en' : 'fr';
  const raw = Array.isArray(req.body?.messages) ? req.body.messages : [];
  const history: ChatTurn[] = raw
    .filter((m: any) => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string' && m.content.trim())
    .slice(-8)
    .map((m: any) => ({ role: m.role, content: String(m.content).trim().slice(0, 800) }));

  if (!history.length || history[history.length - 1].role !== 'user') {
    res.status(400).json({ success: false, error: 'Message manquant.' });
    return;
  }

  const ip = String(req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown').split(',')[0].trim();
  const limit = checkAssistantLimit(ip);
  if (limit !== 'ok') {
    res.status(429).json({ success: false, errorCode: 'RATE_LIMITED', error: limit === 'ip' ? 'Trop de questions en peu de temps.' : 'Assistant momentanément indisponible.' });
    return;
  }

  try {
    res.json({ success: true, ...(await answer(history, lang)) });
  } catch (err) {
    console.error('[assistant] chat:', (err as Error).message);
    res.status(500).json({ success: false, error: 'Assistant indisponible pour le moment.' });
  }
});
