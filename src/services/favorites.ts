import { supabase } from '../lib/db';
import { AppError, friendlyError } from '../lib/db';

/** Identifiants des produits favoris de l'utilisateur connecté. */
export async function listFavoriteIds(userId: string): Promise<string[]> {
  const { data, error } = await supabase.from('favorites').select('product_id').eq('user_id', userId);
  if (error) throw new AppError(friendlyError(error), error.code);
  return (data || []).map(r => r.product_id as string);
}

export async function addFavorite(userId: string, productId: string): Promise<void> {
  const { error } = await supabase.from('favorites').insert({ user_id: userId, product_id: productId });
  // 23505 : déjà en favori, rien à faire
  if (error && error.code !== '23505') throw new AppError(friendlyError(error), error.code);
}

export async function removeFavorite(userId: string, productId: string): Promise<void> {
  const { error } = await supabase.from('favorites').delete().eq('user_id', userId).eq('product_id', productId);
  if (error) throw new AppError(friendlyError(error), error.code);
}
