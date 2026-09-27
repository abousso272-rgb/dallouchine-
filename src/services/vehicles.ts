import { supabase, unwrap, AppError, friendlyError, isMigrationError } from '../lib/db';
import type { Vehicle } from '../lib/types';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mapVehicle(v: any): Vehicle {
  return {
    id: v.id,
    slug: v.slug,
    title: v.title,
    vehicleType: v.vehicle_type,
    brand: v.brand,
    model: v.model,
    year: v.year ?? null,
    condition: v.condition,
    mileageKm: v.mileage_km ?? null,
    fuel: v.fuel ?? null,
    transmission: v.transmission ?? null,
    engine: v.engine ?? null,
    powerHp: v.power_hp ?? null,
    seats: v.seats ?? null,
    color: v.color ?? null,
    priceXOF: v.price_xof !== null && v.price_xof !== undefined ? Number(v.price_xof) : null,
    priceOnRequest: Boolean(v.price_on_request),
    status: v.status,
    isPublished: Boolean(v.is_published),
    isFeatured: Boolean(v.is_featured),
    description: v.description || '',
    features: v.features || [],
    images: v.images || [],
    location: v.location ?? null,
    leadTime: v.lead_time ?? null,
    createdAt: v.created_at
  };
}

export interface VehicleQuery {
  type?: string | null;
  search?: string;
  includeUnpublished?: boolean;
  limit?: number;
  featuredFirst?: boolean;
}

export async function listVehicles(q: VehicleQuery = {}): Promise<{ items: Vehicle[]; unavailable: boolean }> {
  let query = supabase.from('vehicles').select('*').limit(q.limit || 200);
  if (!q.includeUnpublished) query = query.eq('is_published', true);
  if (q.type) query = query.eq('vehicle_type', q.type);
  if (q.search) {
    const s = q.search.replace(/[,()%*]/g, ' ').trim();
    if (s) query = query.or(`title.ilike.%${s}%,brand.ilike.%${s}%,model.ilike.%${s}%`);
  }
  query = q.featuredFirst ? query.order('is_featured', { ascending: false }).order('created_at', { ascending: false }) : query.order('created_at', { ascending: false });
  const { data, error } = await query;
  if (error) {
    if (isMigrationError(error)) return { items: [], unavailable: true };
    throw new AppError(friendlyError(error), error.code);
  }
  return { items: (data || []).map(mapVehicle), unavailable: false };
}

export async function getVehicle(slugOrId: string): Promise<Vehicle | null> {
  const isUuid = /^[0-9a-f-]{36}$/i.test(slugOrId);
  const { data, error } = await supabase.from('vehicles').select('*').eq(isUuid ? 'id' : 'slug', slugOrId).maybeSingle();
  if (error) {
    if (isMigrationError(error)) return null;
    throw new AppError(friendlyError(error), error.code);
  }
  return data ? mapVehicle(data) : null;
}

export type VehicleInput = Omit<Vehicle, 'id' | 'createdAt'> & { id?: string };

export async function saveVehicle(v: VehicleInput, userId: string): Promise<string> {
  const row = {
    slug: v.slug.trim(),
    title: v.title.trim(),
    vehicle_type: v.vehicleType,
    brand: v.brand.trim(),
    model: v.model.trim(),
    year: v.year || null,
    condition: v.condition,
    mileage_km: v.mileageKm ?? null,
    fuel: v.fuel || null,
    transmission: v.transmission || null,
    engine: v.engine || null,
    power_hp: v.powerHp || null,
    seats: v.seats || null,
    color: v.color || null,
    price_xof: v.priceOnRequest ? null : v.priceXOF ? Math.round(v.priceXOF) : null,
    price_on_request: v.priceOnRequest || !v.priceXOF,
    status: v.status,
    is_published: v.isPublished,
    is_featured: v.isFeatured,
    description: v.description.trim() || null,
    features: v.features.map(f => f.trim()).filter(Boolean),
    images: v.images.filter(Boolean),
    location: v.location || null,
    lead_time: v.leadTime || null
  };
  if (v.id) {
    unwrap(await supabase.from('vehicles').update(row).eq('id', v.id));
    return v.id;
  }
  const created = unwrap(await supabase.from('vehicles').insert({ ...row, created_by: userId }).select('id').single());
  return created.id as string;
}

export async function deleteVehicle(id: string): Promise<void> {
  unwrap(await supabase.from('vehicles').delete().eq('id', id));
}
