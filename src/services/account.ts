import { supabase, unwrap, isMigrationError } from '../lib/db';
import type { Notification } from '../lib/types';

export async function updateProfile(
  userId: string,
  p: { fullName: string; phone: string; city: string; address: string; companyName: string }
): Promise<void> {
  // Les colonnes rôle / permissions / statut sont protégées côté base : seules ces informations sont modifiables.
  const row: Record<string, string | null> = {
    full_name: p.fullName.trim(),
    phone: p.phone.trim() || null,
    city: p.city.trim() || null,
    address: p.address.trim() || null
  };
  const { error } = await supabase.from('profiles').update({ ...row, company_name: p.companyName.trim() || null }).eq('id', userId);
  if (error && error.code === '42703') {
    // Colonne company_name absente tant que la migration n'est pas appliquée
    unwrap(await supabase.from('profiles').update(row).eq('id', userId));
    return;
  }
  if (error) unwrap({ data: null, error });
}

export async function listNotifications(userId: string, limit = 50): Promise<Notification[]> {
  const { data, error } = await supabase
    .from('notifications')
    .select('id, type, title, message, link, is_read, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) {
    if (isMigrationError(error) || error.code === '42703') {
      const fallback = await supabase
        .from('notifications')
        .select('id, type, title, message, is_read, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);
      return (fallback.data || []).map(n => ({ ...mapN(n), link: null }));
    }
    return [];
  }
  return (data || []).map(mapN);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapN(n: any): Notification {
  return {
    id: n.id,
    type: n.type,
    title: n.title,
    message: n.message,
    link: n.link || null,
    isRead: Boolean(n.is_read),
    createdAt: n.created_at
  };
}

export async function markNotificationsRead(userId: string, ids?: string[]): Promise<void> {
  let query = supabase.from('notifications').update({ is_read: true }).eq('user_id', userId).eq('is_read', false);
  if (ids?.length) query = query.in('id', ids);
  await query;
}

export async function countUnreadNotifications(userId: string): Promise<number> {
  const { count } = await supabase
    .from('notifications')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('is_read', false);
  return count || 0;
}
