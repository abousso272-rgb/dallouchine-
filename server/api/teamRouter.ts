import { Router, Request, Response } from 'express';
import { requireAdmin, getSupabaseServerClient, hasServiceRole } from '../middleware/auth';
import { config } from '../config';

export const teamRouter = Router();

const ROLES = ['admin', 'transitaire', 'groupage_manager'] as const;

/**
 * POST /api/team/invite
 * Crée une invitation (fonction SQL invite_team_member, contrôle admin en base) et,
 * si la clé service_role est configurée et que le compte n'existe pas encore,
 * envoie l'email d'invitation Supabase. Retourne toujours le lien d'invitation
 * pour pouvoir le transmettre manuellement (WhatsApp, email…).
 */
teamRouter.post('/invite', requireAdmin, async (req: Request, res: Response): Promise<void> => {
  try {
    const email = String(req.body.email || '').trim().toLowerCase();
    const role = String(req.body.role || '');
    const fullName = typeof req.body.fullName === 'string' ? req.body.fullName.trim() : null;
    const permissions = Array.isArray(req.body.permissions) ? req.body.permissions.map(String) : [];

    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      res.status(400).json({ success: false, error: 'Adresse email invalide.' });
      return;
    }
    if (!ROLES.includes(role as (typeof ROLES)[number])) {
      res.status(400).json({ success: false, error: 'Rôle invalide.' });
      return;
    }

    const { data, error } = await req.db!.rpc('invite_team_member', {
      p_email: email,
      p_role: role,
      p_full_name: fullName,
      p_permissions: permissions
    });
    if (error || !data) {
      res.status(400).json({ success: false, error: error?.message || 'Invitation impossible.' });
      return;
    }

    const inviteUrl = `${config.appUrl}/invitation?token=${data.token}`;
    let emailSent = false;
    let emailError: string | undefined;

    if (hasServiceRole && !data.account_exists) {
      const { error: mailError } = await getSupabaseServerClient().auth.admin.inviteUserByEmail(email, {
        redirectTo: inviteUrl,
        data: { full_name: fullName || undefined }
      });
      if (mailError) emailError = mailError.message;
      else emailSent = true;
    }

    res.json({
      success: true,
      invitationId: data.invitation_id,
      inviteUrl,
      accountExists: Boolean(data.account_exists),
      emailSent,
      emailError
    });
  } catch (err: any) {
    console.error('[team] invite:', err?.message || err);
    res.status(500).json({ success: false, error: 'Erreur interne lors de l\'invitation.' });
  }
});
