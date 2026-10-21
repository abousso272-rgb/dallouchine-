import { config, hasEmailProvider, hasServiceRole } from '../config';
import { getSupabaseServerClient } from '../middleware/auth';

const MAX_ATTEMPTS = 3;
const BATCH = 40;
const FRESH_WINDOW_MS = 48 * 3600 * 1000;

export interface DispatchResult {
  skipped?: string;
  claimed: number;
  sent: number;
  failed: number;
}

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

function absoluteLink(link?: string | null): string {
  if (!link) return config.appUrl + '/compte';
  if (/^https?:\/\//i.test(link)) return link;
  return config.appUrl + (link.startsWith('/') ? link : '/' + link);
}

export function renderEmail(title: string, message: string, link?: string | null) {
  const url = absoluteLink(link);
  const html = `<!doctype html><html lang="fr"><body style="margin:0;background:#faf6f1;font-family:Inter,Segoe UI,Arial,sans-serif;color:#10151f">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:28px 16px">
<table role="presentation" width="100%" style="max-width:520px;background:#fff;border-radius:20px;border:1px solid #eee3d6" cellpadding="0" cellspacing="0">
<tr><td style="padding:26px 28px 8px"><div style="font-weight:800;font-size:17px;letter-spacing:-.01em">DALLOU <span style="color:#f2560f">CHINE</span></div></td></tr>
<tr><td style="padding:6px 28px 4px"><h1 style="margin:14px 0 8px;font-size:20px;line-height:1.3">${esc(title)}</h1>
<p style="margin:0 0 22px;font-size:15px;line-height:1.6;color:#4a5160">${esc(message)}</p>
<a href="${esc(url)}" style="display:inline-block;background:#f2560f;color:#fff;text-decoration:none;font-weight:700;font-size:14px;padding:12px 22px;border-radius:999px">Ouvrir mon espace</a></td></tr>
<tr><td style="padding:22px 28px 26px;font-size:12px;color:#8a909c;line-height:1.5">Vous recevez cet email car une action vous concerne sur Dallou Chine.<br>Chine → Afrique, sourcing, groupages et import sur mesure.</td></tr>
</table></td></tr></table></body></html>`;
  const text = `${title}\n\n${message}\n\nOuvrir mon espace : ${url}\n\n— Dallou Chine`;
  return { html, text };
}

async function sendViaResend(to: string, subject: string, html: string, text: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${config.resendApiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: config.emailFrom, to: [to], subject, html, text })
    });
    if (res.ok) return { ok: true };
    const body = (await res.json().catch(() => ({}))) as { message?: string };
    return { ok: false, error: `Resend ${res.status}: ${body.message || 'erreur'}`.slice(0, 300) };
  } catch (err) {
    return { ok: false, error: `Réseau: ${(err as Error).message}`.slice(0, 300) };
  }
}

/**
 * Envoie par email les notifications récentes non encore envoyées.
 * Chaque notification est « réservée » (emailed_at) avant l'envoi : deux exécutions
 * simultanées ne peuvent pas envoyer deux fois le même email.
 */
export async function dispatchNotificationEmails(): Promise<DispatchResult> {
  if (!hasEmailProvider) return { skipped: 'RESEND_API_KEY absente ou invalide', claimed: 0, sent: 0, failed: 0 };
  if (!hasServiceRole) return { skipped: 'SUPABASE_SERVICE_ROLE_KEY absente', claimed: 0, sent: 0, failed: 0 };

  const db = getSupabaseServerClient();
  const since = new Date(Date.now() - FRESH_WINDOW_MS).toISOString();
  const { data: pending, error } = await db
    .from('notifications')
    .select('id')
    .is('emailed_at', null)
    .lt('email_attempts', MAX_ATTEMPTS)
    .gte('created_at', since)
    .order('created_at')
    .limit(BATCH);
  if (error) throw new Error(`notifications: ${error.message}`);
  if (!pending?.length) return { claimed: 0, sent: 0, failed: 0 };

  const { data: claimed, error: claimError } = await db
    .from('notifications')
    .update({ emailed_at: new Date().toISOString() })
    .in('id', pending.map(p => p.id))
    .is('emailed_at', null)
    .select('id, user_id, title, message, link, email_attempts');
  if (claimError) throw new Error(`réservation: ${claimError.message}`);
  if (!claimed?.length) return { claimed: 0, sent: 0, failed: 0 };

  const userIds = [...new Set(claimed.map(n => n.user_id))];
  const { data: profiles } = await db.from('profiles').select('id, email, status').in('id', userIds);
  const byId = new Map((profiles || []).map(p => [p.id as string, p as { id: string; email: string | null; status: string | null }]));

  let sent = 0;
  let failed = 0;
  for (const n of claimed) {
    const profile = byId.get(n.user_id);
    const email = (profile?.email || '').trim();
    if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email) || email.endsWith('.test') || profile?.status === 'suspended') {
      await db.from('notifications').update({ email_error: 'pas d’email envoyable' }).eq('id', n.id);
      continue;
    }
    const { html, text } = renderEmail(n.title, n.message, n.link);
    const result = await sendViaResend(email, n.title, html, text);
    if (result.ok) {
      sent++;
    } else {
      failed++;
      const attempts = (n.email_attempts || 0) + 1;
      await db
        .from('notifications')
        .update({ emailed_at: attempts >= MAX_ATTEMPTS ? new Date().toISOString() : null, email_attempts: attempts, email_error: result.error })
        .eq('id', n.id);
    }
  }
  return { claimed: claimed.length, sent, failed };
}
