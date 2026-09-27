import { Request, Response, NextFunction } from 'express';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { config, hasServiceRole } from '../config';

export type AppRole = 'admin' | 'transitaire' | 'groupage_manager' | 'client';

const ADMIN_ROLES = ['admin', 'super_admin', 'operations', 'commercial', 'finance'];
const TRANSITAIRE_ROLES = ['transitaire', 'sourcing', 'sourcer'];

export function toAppRole(rawRole?: string | null, roles?: string[] | null): AppRole {
  const all = [String(rawRole || '').toLowerCase(), ...(roles || []).map(r => String(r).toLowerCase())];
  if (all.some(r => ADMIN_ROLES.includes(r))) return 'admin';
  if (all.some(r => TRANSITAIRE_ROLES.includes(r))) return 'transitaire';
  if (all.includes('groupage_manager')) return 'groupage_manager';
  return 'client';
}

let serviceClient: SupabaseClient | null = null;

/**
 * Client serveur privilégié (service_role) pour les opérations que seul le serveur
 * peut réaliser (webhooks, tentatives de paiement). Sans clé service_role, retombe
 * sur la clé publique : l'application reste fonctionnelle tant que la migration de
 * durcissement des paiements n'est pas appliquée.
 */
export function getSupabaseServerClient(): SupabaseClient {
  if (!serviceClient) {
    serviceClient = createClient(config.supabaseUrl, config.supabaseServiceRoleKey || config.supabaseAnonKey, {
      auth: { persistSession: false, autoRefreshToken: false }
    });
  }
  return serviceClient;
}

/** Client agissant au nom de l'utilisateur : toutes les politiques RLS s'appliquent. */
export function getUserClient(accessToken: string): SupabaseClient {
  return createClient(config.supabaseUrl, config.supabaseAnonKey, {
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
    auth: { persistSession: false, autoRefreshToken: false }
  });
}

export { hasServiceRole };

export interface AuthenticatedUser {
  id: string;
  email?: string;
  phone?: string;
  fullName?: string;
  role: AppRole;
  rawRole: string;
  isAdmin: boolean;
  isStaff: boolean;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
      accessToken?: string;
      db?: SupabaseClient;
    }
  }
}

function readBearer(req: Request): string | null {
  const header = req.headers.authorization || '';
  if (!header.startsWith('Bearer ')) return null;
  const token = header.substring(7).trim();
  return token || null;
}

async function resolveUser(req: Request): Promise<AuthenticatedUser | null> {
  const token = readBearer(req);
  if (!token) return null;

  const userClient = getUserClient(token);
  const {
    data: { user },
    error
  } = await userClient.auth.getUser(token);
  if (error || !user) return null;

  // Rôle certifié lu en base avec le jeton de l'utilisateur (RLS : lecture de son propre profil)
  const { data: profile } = await userClient
    .from('profiles')
    .select('role, roles, full_name, phone, status')
    .eq('id', user.id)
    .maybeSingle();

  if (profile?.status === 'suspended') return null;

  const role = toAppRole(profile?.role, profile?.roles);
  req.accessToken = token;
  req.db = userClient;

  return {
    id: user.id,
    email: user.email,
    phone: profile?.phone || user.phone || undefined,
    fullName: profile?.full_name || (user.user_metadata as any)?.full_name,
    role,
    rawRole: String(profile?.role || 'client'),
    isAdmin: role === 'admin',
    isStaff: role !== 'client'
  };
}

function unauthorized(res: Response, message = 'Session invalide ou expirée. Veuillez vous reconnecter.') {
  res.status(401).json({ success: false, code: 'UNAUTHORIZED', error: message, errorMessage: message });
}

export async function requireAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = await resolveUser(req);
    if (!user) return unauthorized(res);
    req.user = user;
    next();
  } catch (err: any) {
    console.error('[auth] requireAuth error:', err?.message || err);
    res.status(500).json({ success: false, error: 'Erreur lors de la vérification de la session.' });
  }
}

export async function optionalAuth(req: Request, _res: Response, next: NextFunction): Promise<void> {
  try {
    const user = await resolveUser(req);
    if (user) req.user = user;
  } catch (err: any) {
    console.warn('[auth] optionalAuth:', err?.message || err);
  }
  next();
}

export function requireRole(...roles: AppRole[]) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = await resolveUser(req);
      if (!user) return unauthorized(res);
      if (!roles.includes(user.role)) {
        res.status(403).json({ success: false, code: 'FORBIDDEN', error: 'Accès non autorisé pour votre rôle.' });
        return;
      }
      req.user = user;
      next();
    } catch (err: any) {
      console.error('[auth] requireRole error:', err?.message || err);
      res.status(500).json({ success: false, error: 'Erreur lors de la vérification des permissions.' });
    }
  };
}

export const requireAdmin = requireRole('admin');
