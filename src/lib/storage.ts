import { supabase, AppError, friendlyError } from './db';

const PRIVATE_BUCKET = 'daluche-uploads';
const MEDIA_BUCKET = 'daluche-media';
const PRIVATE_PREFIX = `sb://${PRIVATE_BUCKET}/`;

const MAX_BYTES = 10 * 1024 * 1024;

function randomName(ext: string) {
  const rand = Math.random().toString(36).slice(2, 10);
  return `${Date.now().toString(36)}-${rand}.${ext}`;
}

/**
 * Réduit les photos lourdes (smartphones) à 1600 px max en JPEG :
 * envoi plus rapide sur réseau mobile, qualité suffisante pour un sourcing.
 */
async function compressImage(file: File): Promise<Blob> {
  if (!file.type.startsWith('image/') || file.type === 'image/gif' || file.size < 600 * 1024) return file;
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, 1600 / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    const ctx = canvas.getContext('2d');
    if (!ctx) return file;
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.84));
    return blob && blob.size < file.size ? blob : file;
  } catch {
    return file; // HEIC ou format non décodable par le navigateur : envoi tel quel
  }
}

function validate(file: File, allowPdf: boolean) {
  const okType = file.type.startsWith('image/') || (allowPdf && file.type === 'application/pdf');
  if (!okType) throw new AppError(allowPdf ? 'Formats acceptés : images (JPG, PNG, WEBP) ou PDF.' : 'Formats acceptés : JPG, PNG, WEBP.');
  if (file.size > MAX_BYTES) throw new AppError('Fichier trop volumineux (10 Mo maximum).');
}

/** Fichier client privé (photo produit, pièce jointe). Retourne une référence interne sb://… */
export async function uploadClientFile(userId: string, file: File): Promise<string> {
  validate(file, true);
  const body = file.type === 'application/pdf' ? file : await compressImage(file);
  const ext = body.type === 'image/jpeg' ? 'jpg' : (file.name.split('.').pop() || 'bin').toLowerCase().slice(0, 5);
  const path = `${userId}/${randomName(ext)}`;
  const { error } = await supabase.storage.from(PRIVATE_BUCKET).upload(path, body, {
    contentType: body.type || file.type,
    upsert: false
  });
  if (error) throw new AppError(friendlyError(error));
  return PRIVATE_PREFIX + path;
}

/** Visuel public (produit, véhicule, groupage) — réservé au personnel. Retourne l'URL publique. */
export async function uploadMedia(file: File, folder = 'media'): Promise<string> {
  validate(file, false);
  const body = await compressImage(file);
  const ext = body.type === 'image/jpeg' ? 'jpg' : (file.name.split('.').pop() || 'jpg').toLowerCase().slice(0, 5);
  const path = `${folder}/${new Date().toISOString().slice(0, 7)}/${randomName(ext)}`;
  const { error } = await supabase.storage.from(MEDIA_BUCKET).upload(path, body, {
    contentType: body.type || file.type,
    upsert: false,
    cacheControl: '31536000'
  });
  if (error) throw new AppError(friendlyError(error));
  return supabase.storage.from(MEDIA_BUCKET).getPublicUrl(path).data.publicUrl;
}

export function isPrivateRef(ref: string): boolean {
  return ref.startsWith(PRIVATE_PREFIX);
}

const signedCache = new Map<string, { url: string; expires: number }>();

/** Résout une référence de fichier en URL affichable (URL signée 1 h pour les fichiers privés). */
export async function resolveFileUrl(ref: string): Promise<string | null> {
  if (!ref) return null;
  if (!isPrivateRef(ref)) return ref;
  const cached = signedCache.get(ref);
  if (cached && cached.expires > Date.now()) return cached.url;
  const path = ref.slice(PRIVATE_PREFIX.length);
  const { data, error } = await supabase.storage.from(PRIVATE_BUCKET).createSignedUrl(path, 3600);
  if (error || !data?.signedUrl) return null;
  signedCache.set(ref, { url: data.signedUrl, expires: Date.now() + 50 * 60 * 1000 });
  return data.signedUrl;
}
