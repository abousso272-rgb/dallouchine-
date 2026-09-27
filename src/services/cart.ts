import { supabase, unwrap } from '../lib/db';
import type { CartLine } from '../lib/types';
import { mapProduct } from './catalog';

const CART_PRODUCT_COLUMNS = `
  id, name, slug, price_xof, compare_at_price_xof, moq, stock_quantity, reserved_quantity, default_transport_mode,
  is_active, categories (id, name, slug), product_images (id, image_url, sort_order, is_primary)
`;

const GUEST_KEY = 'daluche_guest_cart_v1';

export interface GuestCartEntry {
  productId: string;
  quantity: number;
}

// Panier invité : simple commodité locale, fusionné dans le panier en base dès la connexion.
export function readGuestCart(): GuestCartEntry[] {
  try {
    const raw = localStorage.getItem(GUEST_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter(e => e && typeof e.productId === 'string' && e.quantity > 0) : [];
  } catch {
    return [];
  }
}

export function writeGuestCart(entries: GuestCartEntry[]) {
  try {
    if (entries.length) localStorage.setItem(GUEST_KEY, JSON.stringify(entries));
    else localStorage.removeItem(GUEST_KEY);
  } catch {
    /* stockage indisponible (navigation privée) : panier en mémoire uniquement */
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toLine(productRow: any, quantity: number): CartLine {
  const p = mapProduct(productRow);
  return {
    key: p.id,
    productId: p.id,
    groupageId: null,
    quantity,
    unitPriceXOF: p.priceXOF,
    product: {
      id: p.id,
      slug: p.slug,
      name: p.name,
      images: p.images,
      priceXOF: p.priceXOF,
      moq: p.moq,
      availableQuantity: p.availableQuantity,
      transportMode: p.transportMode
    }
  };
}

export async function hydrateGuestCart(entries: GuestCartEntry[]): Promise<CartLine[]> {
  if (!entries.length) return [];
  const { data } = await supabase
    .from('products')
    .select(CART_PRODUCT_COLUMNS)
    .in(
      'id',
      entries.map(e => e.productId)
    )
    .eq('is_active', true);
  return entries
    .map(e => {
      const row = (data || []).find(p => p.id === e.productId);
      return row ? toLine(row, e.quantity) : null;
    })
    .filter((l): l is CartLine => Boolean(l));
}

/** Panier en base (articles catalogue ; les groupages passent par une commande dédiée). */
export async function fetchCart(userId: string): Promise<CartLine[]> {
  const data = unwrap(
    await supabase
      .from('cart_items')
      .select(`id, product_id, groupage_id, quantity, products (${CART_PRODUCT_COLUMNS})`)
      .eq('user_id', userId)
      .is('groupage_id', null)
      .order('created_at', { ascending: true })
  );
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data || []).filter((r: any) => r.products && r.products.is_active).map((r: any) => toLine(r.products, r.quantity));
}

export async function setCartQuantity(userId: string, productId: string, quantity: number): Promise<void> {
  const { data: existing } = await supabase
    .from('cart_items')
    .select('id')
    .eq('user_id', userId)
    .eq('product_id', productId)
    .is('groupage_id', null)
    .limit(1)
    .maybeSingle();

  if (quantity <= 0) {
    if (existing) unwrap(await supabase.from('cart_items').delete().eq('id', existing.id));
    return;
  }
  if (existing) {
    unwrap(await supabase.from('cart_items').update({ quantity }).eq('id', existing.id));
  } else {
    unwrap(await supabase.from('cart_items').insert({ user_id: userId, product_id: productId, quantity, groupage_id: null }));
  }
}

export async function clearCart(userId: string): Promise<void> {
  unwrap(await supabase.from('cart_items').delete().eq('user_id', userId).is('groupage_id', null));
}
