import { supabase } from './supabase';
import { Product, CategoryItem, ProductAutoSpecs, PublicGroupageInfo, TransportMode } from '../types';

export interface CatalogFilterParams {
  categorySlug?: string;
  categoryName?: string;
  search?: string;
  transportMode?: 'air' | 'sea' | 'all';
  isGroupageOnly?: boolean;
  isAutoMobility?: boolean;
  minPrice?: number;
  maxPrice?: number;
  sortBy?: 'popular' | 'price_asc' | 'price_desc' | 'rating' | 'newest';
  page?: number;
  limit?: number;
}

export interface ProductListResponse {
  products: Product[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * Maps a raw Supabase product row (with joined relations) to the application Product type.
 * STRICT SECURITY: Never includes supplier_id, sourcer_id, internal cost or margin fields.
 */
export function mapDatabaseProductToProduct(
  raw: any,
  categoryNameFallback?: string,
  imagesList?: any[],
  autoSpecsRaw?: any,
  groupageRaw?: any
): Product {
  // Extract images
  let images: string[] = [];
  if (imagesList && imagesList.length > 0) {
    images = [...imagesList]
      .sort((a, b) => {
        if (a.is_primary && !b.is_primary) return -1;
        if (!a.is_primary && b.is_primary) return 1;
        return (a.sort_order || 0) - (b.sort_order || 0);
      })
      .map(img => img.image_url)
      .filter(Boolean);
  } else if (raw.product_images && Array.isArray(raw.product_images) && raw.product_images.length > 0) {
    images = [...raw.product_images]
      .sort((a, b) => {
        if (a.is_primary && !b.is_primary) return -1;
        if (!a.is_primary && b.is_primary) return 1;
        return (a.sort_order || 0) - (b.sort_order || 0);
      })
      .map(img => img.image_url)
      .filter(Boolean);
  }

  // Fallback placeholder image if none exists
  if (images.length === 0) {
    images = ['https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop'];
  }

  // Category name resolution
  let categoryName = categoryNameFallback || 'Général';
  if (raw.categories?.name) {
    categoryName = raw.categories.name;
  }

  // Compute availability
  const stockQty = Number(raw.stock_quantity ?? 0);
  const reservedQty = Number(raw.reserved_quantity ?? 0);
  const availableQty = Math.max(0, stockQty - reservedQty);

  // Determine stockStatus
  let stockStatus: Product['stockStatus'] = 'in_stock';
  if (raw.is_groupage && availableQty <= 0) {
    stockStatus = 'groupage_only';
  } else if (availableQty <= 0) {
    stockStatus = 'on_demand';
  } else if (availableQty <= 5) {
    stockStatus = 'low_stock';
  }

  // Auto specs mapping if available
  let autoSpecs: ProductAutoSpecs | null = null;
  const rawSpecs = autoSpecsRaw || raw.product_auto_specs?.[0] || raw.product_auto_specs;
  if (rawSpecs && (raw.is_auto_mobility || rawSpecs.vehicle_type)) {
    autoSpecs = {
      vehicleType: rawSpecs.vehicle_type || undefined,
      brand: rawSpecs.brand || undefined,
      model: rawSpecs.model || undefined,
      modelYear: rawSpecs.model_year ? Number(rawSpecs.model_year) : undefined,
      batteryCapacityKwh: rawSpecs.battery_capacity_kwh ? Number(rawSpecs.battery_capacity_kwh) : undefined,
      rangeKm: rawSpecs.range_km ? Number(rawSpecs.range_km) : undefined,
      motorPowerKw: rawSpecs.motor_power_kw ? Number(rawSpecs.motor_power_kw) : undefined,
      motorPowerHp: rawSpecs.motor_power_hp ? Number(rawSpecs.motor_power_hp) : undefined,
      chargingTime: rawSpecs.charging_time || undefined,
      topSpeedKmh: rawSpecs.top_speed_kmh ? Number(rawSpecs.top_speed_kmh) : undefined,
      weightKg: rawSpecs.weight_kg ? Number(rawSpecs.weight_kg) : undefined,
      dimensions: rawSpecs.dimensions || undefined,
      certification: rawSpecs.certification || undefined
    };
  }

  // Public groupage mapping if linked
  let publicGroupage: PublicGroupageInfo | null = null;
  const rawGrp = groupageRaw || raw.groupages?.[0] || raw.groupages;
  if (rawGrp) {
    publicGroupage = {
      id: rawGrp.id,
      code: rawGrp.code,
      title: rawGrp.title,
      targetQuantity: Number(rawGrp.target_quantity ?? 0),
      reservedQuantity: Number(rawGrp.reserved_quantity ?? 0),
      unitPriceXOF: Number(rawGrp.unit_price_xof ?? 0),
      deadline: rawGrp.deadline || undefined,
      estimatedDepartureDate: rawGrp.estimated_departure_date || undefined,
      transportMode: rawGrp.transport_mode || undefined,
      status: rawGrp.status || 'open'
    };
  }

  const priceXOF = Number(raw.price_xof ?? 0);
  const compareAtPriceXOF = raw.compare_at_price_xof ? Number(raw.compare_at_price_xof) : undefined;

  return {
    id: raw.id,
    slug: raw.slug || raw.id,
    name: raw.name,
    sku: raw.sku || undefined,
    categoryId: raw.category_id || null,
    category: categoryName,
    images,
    shortDescription: raw.short_description || '',
    fullDescription: raw.description || '',
    specifications: (raw.specifications as Record<string, string>) || {},
    features: (raw.features as string[]) || [],
    unitWeightKg: Number(raw.weight_kg ?? 0),
    dimensionsCm: {
      length: Number(raw.length_cm ?? 0),
      width: Number(raw.width_cm ?? 0),
      height: Number(raw.height_cm ?? 0)
    },
    cbm: Number(raw.cbm ?? 0),
    moq: Number(raw.moq ?? 1),
    basePriceCNY: 0, // Not exposed to public client
    basePriceUSD: 0, // Not exposed to public client
    priceXOF,
    productPriceXOF: Math.round(priceXOF * 0.65), // Visual component decomposition
    estimatedLogisticsXOF: Math.round(priceXOF * 0.35),
    previousPriceXOF: compareAtPriceXOF,
    compareAtPriceXOF,
    currency: raw.currency || 'XOF',
    isGroupage: Boolean(raw.is_groupage || publicGroupage),
    activeGroupageId: publicGroupage?.id || undefined,
    // Supplier and sourcer identities are strictly hidden from public
    supplierId: undefined,
    sourcerId: undefined,
    defaultTransportMode: (raw.default_transport_mode as TransportMode) || 'air',
    estimatedDeliveryDays: raw.estimated_delivery_days || '12-18 jours',
    stockStatus,
    stockQuantity: stockQty,
    reservedQuantity: reservedQty,
    availableQuantity: availableQty,
    isActive: Boolean(raw.is_active),
    isFeatured: Boolean(raw.is_featured),
    isAutoMobility: Boolean(raw.is_auto_mobility),
    rating: Number(raw.rating ?? 4.8),
    reviewsCount: Number(raw.reviews_count ?? 12),
    tags: (raw.tags as string[]) || [],
    isCustomizable: Boolean(raw.is_customizable),
    createdAt: raw.created_at || new Date().toISOString(),
    autoSpecs,
    publicGroupage
  };
}

/**
 * Public catalog service interacting with Supabase PostgreSQL.
 */
export const catalogService = {
  /**
   * Fetch paginated and filtered active products.
   * Public safety: only is_active = true products are returned.
   */
  async getProducts(params?: CatalogFilterParams): Promise<ProductListResponse> {
    const page = Math.max(1, params?.page || 1);
    const limit = Math.min(100, Math.max(1, params?.limit || 24));
    const offset = (page - 1) * limit;

    // Base query: Only active products, safe projection
    let query = supabase
      .from('products')
      .select(
        `
        id,
        name,
        slug,
        sku,
        description,
        short_description,
        category_id,
        price_xof,
        compare_at_price_xof,
        currency,
        moq,
        stock_quantity,
        reserved_quantity,
        weight_kg,
        length_cm,
        width_cm,
        height_cm,
        cbm,
        is_active,
        is_featured,
        is_auto_mobility,
        is_groupage,
        default_transport_mode,
        estimated_delivery_days,
        features,
        specifications,
        rating,
        reviews_count,
        tags,
        is_customizable,
        created_at,
        categories (id, name, slug),
        product_images (id, image_url, alt_text, sort_order, is_primary)
      `,
        { count: 'exact' }
      )
      .eq('is_active', true);

    // Filter by category slug or name
    if (params?.categorySlug && params.categorySlug !== 'all') {
      const { data: catData } = await supabase
        .from('categories')
        .select('id')
        .or(`slug.eq.${params.categorySlug},name.ilike.%${params.categorySlug}%`)
        .limit(1)
        .maybeSingle();

      if (catData?.id) {
        query = query.eq('category_id', catData.id);
      } else {
        query = query.ilike('name', `%${params.categorySlug}%`);
      }
    } else if (params?.categoryName && params.categoryName !== 'all') {
      const { data: catData } = await supabase
        .from('categories')
        .select('id')
        .ilike('name', `%${params.categoryName}%`)
        .limit(1)
        .maybeSingle();

      if (catData?.id) {
        query = query.eq('category_id', catData.id);
      }
    }

    // Filter by search term across name, description, and sku
    if (params?.search && params.search.trim()) {
      const cleanSearch = params.search.trim();
      query = query.or(`name.ilike.%${cleanSearch}%,description.ilike.%${cleanSearch}%,sku.ilike.%${cleanSearch}%`);
    }

    // Filter by transport mode
    if (params?.transportMode && params.transportMode !== 'all') {
      query = query.eq('default_transport_mode', params.transportMode);
    }

    // Filter by groupage only
    if (params?.isGroupageOnly) {
      query = query.eq('is_groupage', true);
    }

    // Filter by auto & mobility
    if (params?.isAutoMobility) {
      query = query.eq('is_auto_mobility', true);
    }

    // Filter by price range
    if (params?.minPrice !== undefined && params.minPrice > 0) {
      query = query.gte('price_xof', params.minPrice);
    }
    if (params?.maxPrice !== undefined && params.maxPrice > 0) {
      query = query.lte('price_xof', params.maxPrice);
    }

    // Sorting
    switch (params?.sortBy) {
      case 'price_asc':
        query = query.order('price_xof', { ascending: true });
        break;
      case 'price_desc':
        query = query.order('price_xof', { ascending: false });
        break;
      case 'rating':
        query = query.order('rating', { ascending: false, nullsFirst: false });
        break;
      case 'newest':
        query = query.order('created_at', { ascending: false });
        break;
      case 'popular':
      default:
        query = query.order('is_featured', { ascending: false }).order('rating', { ascending: false, nullsFirst: false });
        break;
    }

    // Pagination
    query = query.range(offset, offset + limit - 1);

    const { data, count, error } = await query;

    if (error) {
      console.error('[catalogService.getProducts] Query error:', error);
      return { products: [], total: 0, page, limit, totalPages: 0 };
    }

    const total = count ?? (data?.length || 0);
    const totalPages = Math.ceil(total / limit);
    const products = (data || []).map(row => mapDatabaseProductToProduct(row));

    return {
      products,
      total,
      page,
      limit,
      totalPages
    };
  },

  /**
   * Fetch a single active product by its unique slug or UUID.
   * Joins images, category, auto specs (if auto), and public groupage (if linked).
   */
  async getProductBySlug(slugOrId: string): Promise<Product | null> {
    if (!slugOrId) return null;

    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slugOrId);

    let query = supabase
      .from('products')
      .select(
        `
        id,
        name,
        slug,
        sku,
        description,
        short_description,
        category_id,
        price_xof,
        compare_at_price_xof,
        currency,
        moq,
        stock_quantity,
        reserved_quantity,
        weight_kg,
        length_cm,
        width_cm,
        height_cm,
        cbm,
        is_active,
        is_featured,
        is_auto_mobility,
        is_groupage,
        default_transport_mode,
        estimated_delivery_days,
        features,
        specifications,
        rating,
        reviews_count,
        tags,
        is_customizable,
        created_at,
        categories (id, name, slug),
        product_images (id, image_url, alt_text, sort_order, is_primary)
      `
      )
      .eq('is_active', true);

    if (isUuid) {
      query = query.or(`id.eq.${slugOrId},slug.eq.${slugOrId}`);
    } else {
      query = query.eq('slug', slugOrId);
    }

    const { data: rawProduct, error } = await query.maybeSingle();

    if (error || !rawProduct) {
      if (!isUuid) {
        const { data: fallbackById } = await supabase
          .from('products')
          .select(
            `
            id, name, slug, sku, description, short_description, category_id,
            price_xof, compare_at_price_xof, currency, moq, stock_quantity,
            reserved_quantity, weight_kg, length_cm, width_cm, height_cm, cbm,
            is_active, is_featured, is_auto_mobility, is_groupage,
            default_transport_mode, estimated_delivery_days, features,
            specifications, rating, reviews_count, tags, is_customizable,
            created_at, categories (id, name, slug),
            product_images (id, image_url, alt_text, sort_order, is_primary)
          `
          )
          .eq('is_active', true)
          .eq('id', slugOrId)
          .maybeSingle();

        if (fallbackById) {
          return this._enrichProductDetails(fallbackById);
        }
      }
      return null;
    }

    return this._enrichProductDetails(rawProduct);
  },

  /**
   * Internal helper to load auto specs and groupage for a product.
   */
  async _enrichProductDetails(rawProduct: any): Promise<Product> {
    let autoSpecs: any = null;
    if (rawProduct.is_auto_mobility) {
      const { data: specs } = await supabase
        .from('product_auto_specs')
        .select('*')
        .eq('product_id', rawProduct.id)
        .maybeSingle();
      autoSpecs = specs;
    }

    // Check for linked active groupage
    let groupageInfo: any = null;
    const { data: grp } = await supabase
      .from('groupages')
      .select('id, code, title, target_quantity, reserved_quantity, unit_price_xof, deadline, estimated_departure_date, transport_mode, status')
      .eq('product_id', rawProduct.id)
      .eq('status', 'open')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (grp) {
      groupageInfo = grp;
    }

    return mapDatabaseProductToProduct(rawProduct, undefined, undefined, autoSpecs, groupageInfo);
  },

  /**
   * Fetch single product by its UUID.
   */
  async getProductById(id: string): Promise<Product | null> {
    return this.getProductBySlug(id);
  },

  /**
   * Fetch active categories with live product count.
   */
  async getCategories(): Promise<CategoryItem[]> {
    const { data: dbCategories, error } = await supabase
      .from('categories')
      .select('id, name, slug, description, image_url, sort_order, is_active')
      .eq('is_active', true)
      .order('sort_order', { ascending: true })
      .order('name', { ascending: true });

    if (error || !dbCategories) {
      console.error('[catalogService.getCategories] Error:', error);
      return [];
    }

    const { data: productCounts } = await supabase
      .from('products')
      .select('category_id')
      .eq('is_active', true);

    const countMap: Record<string, number> = {};
    (productCounts || []).forEach(p => {
      if (p.category_id) {
        countMap[p.category_id] = (countMap[p.category_id] || 0) + 1;
      }
    });

    return dbCategories.map(cat => ({
      id: cat.id,
      name: cat.name,
      slug: cat.slug,
      description: cat.description || '',
      image: cat.image_url || 'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=800&auto=format&fit=crop',
      productCount: countMap[cat.id] || 0,
      popularSearchTerms: [cat.name, cat.slug]
    }));
  },

  /**
   * Fetch category by slug.
   */
  async getCategoryBySlug(slug: string): Promise<CategoryItem | null> {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('slug', slug)
      .eq('is_active', true)
      .maybeSingle();

    if (error || !data) return null;

    return {
      id: data.id,
      name: data.name,
      slug: data.slug,
      description: data.description || '',
      image: data.image_url || 'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=800&auto=format&fit=crop',
      productCount: 0,
      popularSearchTerms: [data.name]
    };
  },

  /**
   * Fetch featured products for home & spotlight sections.
   */
  async getFeaturedProducts(limit = 8): Promise<Product[]> {
    const res = await this.getProducts({ sortBy: 'popular', limit });
    return res.products;
  },

  /**
   * Fetch Auto & Mobilité products.
   */
  async getAutoMobilityProducts(limit = 12): Promise<Product[]> {
    const res = await this.getProducts({ isAutoMobility: true, limit });
    return res.products;
  },

  /**
   * Search active products by keyword.
   */
  async searchProducts(query: string, limit = 20): Promise<Product[]> {
    if (!query || !query.trim()) {
      const res = await this.getProducts({ limit });
      return res.products;
    }
    const res = await this.getProducts({ search: query.trim(), limit });
    return res.products;
  },

  /**
   * Get user favorites for the authenticated user.
   * RLS ensures users can only read their own favorites.
   */
  async getUserFavorites(): Promise<string[]> {
    const { data: sessionData } = await supabase.auth.getSession();
    const user = sessionData?.session?.user;
    if (!user) return [];

    const { data, error } = await supabase
      .from('favorites')
      .select('product_id')
      .eq('user_id', user.id);

    if (error) {
      console.error('[catalogService.getUserFavorites] Error:', error);
      return [];
    }

    return (data || []).map(f => f.product_id);
  },

  /**
   * Add a product to favorites for the authenticated user.
   * RLS policy enforces (auth.uid() = user_id).
   */
  async addFavorite(productId: string): Promise<{ success: boolean; error?: string }> {
    const { data: sessionData } = await supabase.auth.getSession();
    const user = sessionData?.session?.user;
    if (!user) {
      return { success: false, error: 'Authentification requise pour synchroniser vos favoris.' };
    }

    const { error } = await supabase.from('favorites').insert({
      user_id: user.id,
      product_id: productId
    });

    if (error) {
      if (error.code === '23505') {
        return { success: true };
      }
      console.error('[catalogService.addFavorite] Error:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  },

  /**
   * Remove a product from favorites for the authenticated user.
   * RLS policy enforces (auth.uid() = user_id).
   */
  async removeFavorite(productId: string): Promise<{ success: boolean; error?: string }> {
    const { data: sessionData } = await supabase.auth.getSession();
    const user = sessionData?.session?.user;
    if (!user) {
      return { success: false, error: 'Authentification requise' };
    }

    const { error } = await supabase
      .from('favorites')
      .delete()
      .eq('user_id', user.id)
      .eq('product_id', productId);

    if (error) {
      console.error('[catalogService.removeFavorite] Error:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  }
};
