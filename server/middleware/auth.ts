import { Request, Response, NextFunction } from 'express';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { config } from '../config';

// Lazy initialized server Supabase client
let serverSupabase: SupabaseClient | null = null;

export function getSupabaseServerClient(): SupabaseClient {
  if (!serverSupabase) {
    const url = config.supabaseUrl || 'https://splsjtguapquznbiacad.supabase.co';
    const key = config.supabaseServiceRoleKey || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNwbHNqdGd1YXBxdXpuYmlhY2FkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk3NzYwNjYsImV4cCI6MjEwNTM1MjA2Nn0.yr8irdxSNMFI-N3K7ueOZV72uKQSVQykDpX9ioY1C4A';
    serverSupabase = createClient(url, key, {
      auth: {
        persistSession: false,
        autoRefreshToken: false
      }
    });
  }
  return serverSupabase;
}

export interface AuthenticatedUser {
  id: string;
  email?: string;
  phone?: string;
  fullName?: string;
  role: string;
  isAdmin: boolean;
}

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

/**
 * Extrait et valide le jeton Bearer Supabase Auth
 */
async function extractUserFromToken(req: Request): Promise<AuthenticatedUser | null> {
  const authHeader = req.headers.authorization || '';
  if (!authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.substring(7).trim();
  if (!token) {
    return null;
  }

  const supabase = getSupabaseServerClient();
  const { data: { user }, error } = await supabase.auth.getUser(token);

  if (error || !user) {
    return null;
  }

  // Client avec jeton d'authentification utilisateur pour satisfaire RLS (auth.uid() = id)
  const url = config.supabaseUrl || 'https://splsjtguapquznbiacad.supabase.co';
  const key = config.supabaseServiceRoleKey || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNwbHNqdGd1YXBxdXpuYmlhY2FkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk3NzYwNjYsImV4cCI6MjEwNTM1MjA2Nn0.yr8irdxSNMFI-N3K7ueOZV72uKQSVQykDpX9ioY1C4A';
  
  const tokenClient = createClient(url, key, {
    global: {
      headers: { Authorization: `Bearer ${token}` }
    },
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  });

  // Récupération certifiée du rôle et profil depuis public.profiles
  const { data: profile } = await tokenClient
    .from('profiles')
    .select('role, full_name, phone, status')
    .eq('id', user.id)
    .single();

  const userRole = (profile?.role || 'client').toLowerCase();
  const adminRoles = ['admin', 'super_admin', 'operations', 'sourcing', 'commercial', 'finance'];

  return {
    id: user.id,
    email: user.email,
    phone: profile?.phone || user.phone || user.user_metadata?.phone,
    fullName: profile?.full_name || user.user_metadata?.full_name,
    role: userRole,
    isAdmin: adminRoles.includes(userRole)
  };
}

/**
 * Middleware d'authentification OBLIGATOIRE
 * Rejette toute requête sans jeton valide
 */
export async function requireAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = await extractUserFromToken(req);
    if (!user) {
      res.status(401).json({
        success: false,
        error: 'Accès non autorisé: Session invalide ou expirée.',
        code: 'UNAUTHORIZED'
      });
      return;
    }

    req.user = user;
    next();
  } catch (err: any) {
    console.error('[AuthMiddleware] Error during authentication:', err);
    res.status(500).json({
      success: false,
      error: 'Erreur interne lors de la vérification de sécurité.'
    });
  }
}

/**
 * Middleware d'authentification OPTIONNELLE
 * Injecte req.user si un jeton est présent, sans bloquer les anonymes
 */
export async function optionalAuth(req: Request, _res: Response, next: NextFunction): Promise<void> {
  try {
    const user = await extractUserFromToken(req);
    if (user) {
      req.user = user;
    }
    next();
  } catch (err: any) {
    console.warn('[AuthMiddleware] Optional auth warning:', err.message);
    next();
  }
}

/**
 * Middleware de protection des routes ADMINISTRATEURS
 * Exige un jeton valide ET un rôle administratif certifié en base
 */
export async function requireAdmin(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = await extractUserFromToken(req);
    if (!user) {
      res.status(401).json({
        success: false,
        error: 'Accès non autorisé: Veuillez vous connecter avec un compte administrateur.',
        code: 'UNAUTHORIZED'
      });
      return;
    }

    if (!user.isAdmin) {
      res.status(403).json({
        success: false,
        error: 'Accès interdit: Droits d\'administration insuffisants.',
        code: 'FORBIDDEN'
      });
      return;
    }

    req.user = user;
    next();
  } catch (err: any) {
    console.error('[AuthMiddleware] Error checking admin role:', err);
    res.status(500).json({
      success: false,
      error: 'Erreur interne lors de la vérification des permissions.'
    });
  }
}
