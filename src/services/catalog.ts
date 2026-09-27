import { supabase, unwrap, AppError, friendlyError } from '../lib/db';
import type { Category, Hub, Product, ProductImage } from '../lib/types';

const PRODUCT_COLUMNS = `
  id, name, slug, sku, short_description, description, category_id, price_xof, compare_at_price_xof,
  moq, stock_quantity, reserved_quantity, weight_kg, default_transport_mode, estimated_delivery_days,
  features, specifications, tags, is_active, is_featured, is_groupage, is_auto_mobility, created_at,
  categories (id, name, slug),
  product_images (id, image_url, sort_order, is_primary)
`;

export const PLACEHOLDER_IMAGE =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400"><rect width="400" height="400" fill="#efebe3"/><path d="M130 230c20-46 120-46 140 0" fill="none" stroke="#d6cfc2" stroke-width="14" stroke-linecap="round"/><circle cx="130" cy="230" r="14" fill="#d6cfc2"/><circle cx="270" cy="230" r="14" fill="#d6cfc2"/></svg>'
  );

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mapProduct(raw: any): Product {
  const imageRecords: ProductImage[] = [...(raw.product_images || [])]
    .sort((a, b) => Number(b.is_primary) - Number(a.is_primary) || (a.sort_order || 0) - (b.sort_order || 0))
    .map(img => ({ id: img.id, url: img.image_url, isPrimary: Boolean(img.is_primary), sortOrder: img.sort_order || 0 }))
    .filter(img => Boolean(img.url));
  const stock = Number(raw.stock_quantity ?? 0);
  const reserved = Number(raw.reserved_quantity ?? 0);
  const specs = raw.specifications && typeof raw.specifications === 'object' ? raw.specifications : {};
  return {
    id: raw.id,
    slug: raw.slug || raw.id,
    name: raw.name,
    sku: raw.sku,
    shortDescription: raw.short_description || '',
    description: raw.description || '',
    categoryId: raw.category_id || null,
    categoryName: raw.categories?.name || 'Catalogue',
    categorySlug: raw.categories?.slug || '',
    priceXOF: Number(raw.price_xof || 0),
    compareAtPriceXOF: raw.compare_at_price_xof ? Number(raw.compare_at_price_xof) : null,
    moq: Math.max(1, Number(raw.moq || 1)),
    stockQuantity: stock,
    reservedQuantity: reserved,
    availableQuantity: Math.max(0, stock - reserved),
    weightKg: Number(raw.weight_kg || 0),
    transportMode: raw.default_transport_mode || 'air',
    deliveryDelay: raw.estimated_delivery_days || '',
    features: Array.isArray(raw.features) ? raw.features.filter(Boolean) : [],
    specifications: Object.fromEntries(
      Object.entries(specs as Record<string, unknown>)
        .filter(([, v]) => v !== null && v !== undefined && String(v).trim() !== '')
        .map(([k, v]) => [k, String(v)])
    ),
    tags: Array.isArray(raw.tags) ? raw.tags : [],
    images: imageRecords.length ? imageRecords.map(i => i.url) : [PLACEHOLDER_IMAGE],
    imageRecords,
    isActive: Boolean(raw.is_active),
    isFeatured: Boolean(raw.is_featured),
    isGroupage: Boolean(raw.is_groupage),
    isAutoMobility: Boolean(raw.is_auto_mobility),
    createdAt: raw.created_at
  };
}

export type ProductSort = 'featured' | 'newest' | 'price_asc' | 'price_desc';

export interface ProductQuery {
  search?: string;
  categoryId?: string | null;
  minPrice?: number | null;
  maxPrice?: number | null;
  inStockOnly?: boolean;
  transportMode?: 'air' | 'sea' | null;
  autoMobilityOnly?: boolean;
  sort?: ProductSort;
  page?: number;
  pageSize?: number;
  includeInactive?: boolean;
}

function sanitizeSearch(s: string) {
  // Les caractères , ( ) ont un sens dans la syntaxe de filtre PostgREST
  return s.replace(/[,()%*]/g, ' ').trim();
}

export async function listProducts(q: ProductQuery = {}): Promise<{ items: Product[]; total: number }> {
  const pageSize = q.pageSize || 24;
  const page = Math.max(1, q.page || 1);
  let query = supabase.from('products').select(PRODUCT_COLUMNS, { count: 'exact' });

  if (!q.includeInactive) query = query.eq('is_active', true);
  if (q.categoryId) query = query.eq('category_id', q.categoryId);
  if (q.search && sanitizeSearch(q.search)) {
    const s = sanitizeSearch(q.search);
    query = query.or(`name.ilike.%${s}%,short_description.ilike.%${s}%,sku.ilike.%${s}%`);
  }
  if (q.minPrice) query = query.gte('price_xof', q.minPrice);
  if (q.maxPrice) query = query.lte('price_xof', q.maxPrice);
  if (q.inStockOnly) query = query.gt('stock_quantity', 0);
  if (q.transportMode) query = query.eq('default_transport_mode', q.transportMode);
  if (q.autoMobilityOnly) query = query.eq('is_auto_mobility', true);

  switch (q.sort) {
    case 'newest':
      query = query.order('created_at', { ascending: false });
      break;
    case 'price_asc':
      query = query.order('price_xof', { ascending: true });
      break;
    case 'price_desc':
      query = query.order('price_xof', { ascending: false });
      break;
    default:
      query = query.order('is_featured', { ascending: false }).order('created_at', { ascending: false });
  }

  query = query.range((page - 1) * pageSize, page * pageSize - 1);
  const { data, error, count } = await query;
  if (error) throw new AppError(friendlyError(error), error.code);
  return { items: (data || []).map(mapProduct), total: count ?? (data || []).length };
}

export async function getProduct(slugOrId: string): Promise<Product | null> {
  const isUuid = /^[0-9a-f-]{36}$/i.test(slugOrId);
  const { data, error } = await supabase
    .from('products')
    .select(PRODUCT_COLUMNS)
    .eq(isUuid ? 'id' : 'slug', slugOrId)
    .maybeSingle();
  if (error) throw new AppError(friendlyError(error), error.code);
  return data ? mapProduct(data) : null;
}

export async function listFeaturedProducts(limit = 8): Promise<Product[]> {
  const { items } = await listProducts({ sort: 'featured', pageSize: limit });
  return items;
}

export async function listRelatedProducts(product: Product, limit = 4): Promise<Product[]> {
  if (!product.categoryId) return [];
  const { data } = await supabase
    .from('products')
    .select(PRODUCT_COLUMNS)
    .eq('is_active', true)
    .eq('category_id', product.categoryId)
    .neq('id', product.id)
    .limit(limit);
  return (data || []).map(mapProduct);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapCategory(c: any): Category {
  return {
    id: c.id,
    name: c.name,
    slug: c.slug,
    description: c.description,
    imageUrl: c.image_url,
    isActive: Boolean(c.is_active),
    sortOrder: c.sort_order || 0,
    parentId: c.parent_id
  };
}

export async function listCategories(includeInactive = false): Promise<Category[]> {
  let query = supabase.from('categories').select('*').order('sort_order').order('name');
  if (!includeInactive) query = query.eq('is_active', true);
  const data = unwrap(await query);
  return (data || []).map(mapCategory);
}

export async function saveCategory(input: Partial<Category> & { name: string; slug: string }): Promise<void> {
  const row = {
    name: input.name.trim(),
    slug: input.slug.trim(),
    description: input.description || null,
    image_url: input.imageUrl || null,
    is_active: input.isActive ?? true,
    sort_order: input.sortOrder ?? 0
  };
  if (input.id) unwrap(await supabase.from('categories').update(row).eq('id', input.id));
  else unwrap(await supabase.from('categories').insert(row));
}

export async function deleteCategory(id: string): Promise<void> {
  const { count } = await supabase.from('products').select('id', { count: 'exact', head: true }).eq('category_id', id);
  if (count && count > 0) {
    throw new AppError('Cette catégorie contient des produits : déplacez-les ou désactivez la catégorie.');
  }
  unwrap(await supabase.from('categories').delete().eq('id', id));
}

export async function listHubs(): Promise<Hub[]> {
  const { data } = await supabase
    .from('hubs')
    .select('id, name, district, city, address, opening_hours')
    .eq('status', 'active')
    .order('name');
  return (data || []).map(h => ({
    id: h.id,
    name: h.name,
    district: h.district,
    city: h.city,
    address: h.address,
    openingHours: h.opening_hours
  }));
}

// ---------------------------------------------------------------------------
// Espace professionnel : produits, images, coûts internes
// ---------------------------------------------------------------------------

export interface ProductCost {
  purchasePriceCNY: number | null;
  purchasePriceXOF: number;
  logisticsCostXOF: number;
  supplierName: string;
  supplierUrl: string;
  notes: string;
}

export interface ProductInput {
  id?: string;
  name: string;
  slug: string;
  sku?: string;
  categoryId: string;
  shortDescription: string;
  description: string;
  priceXOF: number;
  compareAtPriceXOF: number | null;
  moq: number;
  stockQuantity: number;
  weightKg: number;
  transportMode: 'air' | 'sea' | 'express';
  deliveryDelay: string;
  features: string[];
  specifications: Record<string, string>;
  isActive: boolean;
  isFeatured: boolean;
  isAutoMobility: boolean;
  images: string[];
}

export async function getProductCost(productId: string): Promise<ProductCost | null> {
  const { data, error } = await supabase.from('product_costs').select('*').eq('product_id', productId).maybeSingle();
  if (error || !data) return null;
  return {
    purchasePriceCNY: data.purchase_price_cny !== null ? Number(data.purchase_price_cny) : null,
    purchasePriceXOF: Number(data.purchase_price_xof || 0),
    logisticsCostXOF: Number(data.logistics_cost_xof || 0),
    supplierName: data.supplier_name || '',
    supplierUrl: data.supplier_url || '',
    notes: data.notes || ''
  };
}

export async function listProductCosts(): Promise<Record<string, ProductCost>> {
  const { data, error } = await supabase.from('product_costs').select('*');
  if (error || !data) return {};
  return Object.fromEntries(
    data.map(d => [
      d.product_id,
      {
        purchasePriceCNY: d.purchase_price_cny !== null ? Number(d.purchase_price_cny) : null,
        purchasePriceXOF: Number(d.purchase_price_xof || 0),
        logisticsCostXOF: Number(d.logistics_cost_xof || 0),
        supplierName: d.supplier_name || '',
        supplierUrl: d.supplier_url || '',
        notes: d.notes || ''
      }
    ])
  );
}

export async function saveProduct(input: ProductInput, cost: ProductCost | null, userId: string): Promise<string> {
  const row = {
    name: input.name.trim(),
    slug: input.slug.trim(),
    sku: input.sku?.trim() || null,
    category_id: input.categoryId,
    short_description: input.shortDescription.trim(),
    description: input.description.trim(),
    price_xof: Math.round(input.priceXOF),
    compare_at_price_xof: input.compareAtPriceXOF ? Math.round(input.compareAtPriceXOF) : null,
    moq: Math.max(1, Math.round(input.moq)),
    stock_quantity: Math.max(0, Math.round(input.stockQuantity)),
    weight_kg: Math.max(0, input.weightKg),
    default_transport_mode: input.transportMode,
    estimated_delivery_days: input.deliveryDelay.trim() || null,
    features: input.features.map(f => f.trim()).filter(Boolean),
    specifications: input.specifications,
    is_active: input.isActive,
    is_featured: input.isFeatured,
    is_auto_mobility: input.isAutoMobility
  };

  let productId = input.id;
  if (productId) {
    unwrap(await supabase.from('products').update(row).eq('id', productId));
  } else {
    const created = unwrap(await supabase.from('products').insert(row).select('id').single());
    productId = created.id as string;
  }

  // Images : remplacement complet dans l'ordre choisi (la première est l'image principale)
  const { data: existing } = await supabase.from('product_images').select('id, image_url').eq('product_id', productId);
  const wanted = input.images.filter(Boolean);
  const toDelete = (existing || []).filter(e => !wanted.includes(e.image_url)).map(e => e.id);
  if (toDelete.length) unwrap(await supabase.from('product_images').delete().in('id', toDelete));
  for (const [index, url] of wanted.entries()) {
    const match = (existing || []).find(e => e.image_url === url);
    if (match) {
      unwrap(await supabase.from('product_images').update({ sort_order: index, is_primary: index === 0 }).eq('id', match.id));
    } else {
      unwrap(
        await supabase
          .from('product_images')
          .insert({ product_id: productId, image_url: url, sort_order: index, is_primary: index === 0, alt_text: input.name })
      );
    }
  }

  if (cost) {
    unwrap(
      await supabase.from('product_costs').upsert({
        product_id: productId,
        purchase_price_cny: cost.purchasePriceCNY,
        purchase_price_xof: Math.round(cost.purchasePriceXOF || 0),
        logistics_cost_xof: Math.round(cost.logisticsCostXOF || 0),
        supplier_name: cost.supplierName || null,
        supplier_url: cost.supplierUrl || null,
        notes: cost.notes || null,
        updated_by: userId
      })
    );
  }
  return productId as string;
}

export async function setProductPublished(id: string, isActive: boolean): Promise<void> {
  unwrap(await supabase.from('products').update({ is_active: isActive }).eq('id', id));
}

export async function deleteProduct(id: string): Promise<void> {
  const { error } = await supabase.from('products').delete().eq('id', id);
  if (error) {
    if (error.code === '23503') {
      throw new AppError('Ce produit est lié à des commandes ou groupages : dépubliez-le plutôt que de le supprimer.');
    }
    throw new AppError(friendlyError(error), error.code);
  }
}
