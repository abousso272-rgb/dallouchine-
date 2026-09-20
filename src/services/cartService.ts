/**
 * Service Panier Réel Supabase — DALLOU CHINE
 * Source de vérité : table public.cart_items adossée à Supabase Auth
 */
import { supabase } from './supabase';
import type { CartItem, Product } from '../types';
import { mapDatabaseProductToProduct } from './catalogService';
import { isUUID, resolveGroupageId, resolveProductId } from './groupageService';

export interface DbCartItem {
  id: string;
  user_id: string;
  product_id: string;
  groupage_id: string | null;
  quantity: number;
  created_at: string;
  updated_at: string;
}

export const cartService = {
  /**
   * Récupère le panier de l'utilisateur connecté depuis Supabase
   */
  async getCart(): Promise<CartItem[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from('cart_items')
      .select(`
        id,
        user_id,
        product_id,
        groupage_id,
        quantity,
        created_at,
        products (
          id,
          name,
          slug,
          price_xof,
          compare_at_price_xof,
          moq,
          stock_quantity,
          reserved_quantity,
          default_transport_mode,
          is_active,
          is_groupage,
          product_images (image_url, is_primary, sort_order)
        ),
        groupages (
          id,
          code,
          title,
          unit_price_xof,
          status,
          deadline
        )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('[cartService] Erreur récupération panier:', error);
      return [];
    }

    if (!data) return [];

    return data
      .filter((row: any) => row.products)
      .map((row: any) => {
        const p = row.products;
        const images = (p.product_images || [])
          .sort((a: any, b: any) => (b.is_primary ? 1 : 0) - (a.is_primary ? 1 : 0) || (a.sort_order || 0) - (b.sort_order || 0))
          .map((img: any) => img.image_url);

        const mappedProduct = mapDatabaseProductToProduct(p, 'Catalogue', p.product_images, null, row.groupages);
        if (row.groupages) {
          mappedProduct.priceXOF = Number(row.groupages.unit_price_xof);
          mappedProduct.isGroupage = true;
          mappedProduct.activeGroupageId = row.groupage_id;
        }

        return {
          product: mappedProduct,
          quantity: row.quantity,
          isGroupage: Boolean(row.groupage_id),
          groupageId: row.groupage_id || undefined
        };
      });
  },

  /**
   * Ajoute un produit au panier dans Supabase
   */
  async addToCart(productId: string, quantity = 1, groupageId?: string): Promise<{ success: boolean; error?: string }> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: 'AUTHENTICATION_REQUIRED' };
    }

    const cleanProductId = resolveProductId(productId) || productId;
    const cleanGroupageId = groupageId ? (resolveGroupageId(groupageId) || (isUUID(groupageId) ? groupageId : null)) : null;

    if (!isUUID(cleanProductId)) {
      console.warn('[cartService] ID produit non-UUID ignoré pour la persistance distante:', productId);
      return { success: true };
    }

    // Vérifier si l'article existe déjà
    let query = supabase
      .from('cart_items')
      .select('id, quantity')
      .eq('user_id', user.id)
      .eq('product_id', cleanProductId);

    if (cleanGroupageId) {
      query = query.eq('groupage_id', cleanGroupageId);
    } else {
      query = query.is('groupage_id', null);
    }

    const { data: existing, error: findError } = await query.maybeSingle();

    if (findError) {
      console.error('[cartService] Erreur recherche cart_item:', findError);
      return { success: false, error: findError.message };
    }

    if (existing) {
      const { error: updateError } = await supabase
        .from('cart_items')
        .update({ quantity: existing.quantity + quantity, updated_at: new Date().toISOString() })
        .eq('id', existing.id);

      if (updateError) return { success: false, error: updateError.message };
    } else {
      const { error: insertError } = await supabase
        .from('cart_items')
        .insert({
          user_id: user.id,
          product_id: cleanProductId,
          groupage_id: cleanGroupageId,
          quantity
        });

      if (insertError) return { success: false, error: insertError.message };
    }

    return { success: true };
  },

  /**
   * Met à jour la quantité d'un article du panier
   */
  async updateQuantity(productId: string, quantity: number, groupageId?: string): Promise<{ success: boolean; error?: string }> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'AUTHENTICATION_REQUIRED' };

    if (quantity <= 0) {
      return this.removeFromCart(productId, groupageId);
    }

    const cleanProductId = resolveProductId(productId) || productId;
    const cleanGroupageId = groupageId ? (resolveGroupageId(groupageId) || (isUUID(groupageId) ? groupageId : null)) : null;

    if (!isUUID(cleanProductId)) {
      return { success: true };
    }

    let query = supabase
      .from('cart_items')
      .update({ quantity, updated_at: new Date().toISOString() })
      .eq('user_id', user.id)
      .eq('product_id', cleanProductId);

    if (cleanGroupageId) {
      query = query.eq('groupage_id', cleanGroupageId);
    } else {
      query = query.is('groupage_id', null);
    }

    const { error } = await query;
    if (error) return { success: false, error: error.message };
    return { success: true };
  },

  /**
   * Retire un article du panier
   */
  async removeFromCart(productId: string, groupageId?: string): Promise<{ success: boolean; error?: string }> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'AUTHENTICATION_REQUIRED' };

    const cleanProductId = resolveProductId(productId) || productId;
    const cleanGroupageId = groupageId ? (resolveGroupageId(groupageId) || (isUUID(groupageId) ? groupageId : null)) : null;

    if (!isUUID(cleanProductId)) {
      return { success: true };
    }

    let query = supabase
      .from('cart_items')
      .delete()
      .eq('user_id', user.id)
      .eq('product_id', cleanProductId);

    if (cleanGroupageId) {
      query = query.eq('groupage_id', cleanGroupageId);
    } else {
      query = query.is('groupage_id', null);
    }

    const { error } = await query;
    if (error) return { success: false, error: error.message };
    return { success: true };
  },

  /**
   * Vide entièrement le panier de l'utilisateur connecté
   */
  async clearCart(): Promise<{ success: boolean; error?: string }> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'AUTHENTICATION_REQUIRED' };

    const { error } = await supabase
      .from('cart_items')
      .delete()
      .eq('user_id', user.id);

    if (error) return { success: false, error: error.message };
    return { success: true };
  },

  /**
   * Synchronise le panier local (visiteur déconnecté) vers le compte une fois connecté
   */
  async syncLocalCartToSupabase(localItems: CartItem[]): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || localItems.length === 0) return;

    for (const item of localItems) {
      if (item.product?.id) {
        await this.addToCart(item.product.id, item.quantity, item.groupageId);
      }
    }
  }
};
