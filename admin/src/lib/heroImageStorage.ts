import { supabase } from "./supabase";

// Not yet applied — see 202608271500_add_homepage_hero_slides.sql. Uploads
// will fail with a clear "Bucket not found" error until it's created.
// Deliberately a separate bucket from property-images: a hero "section"
// photo is curated specifically for the carousel, not part of a property's
// own gallery, and mixing them would make both harder to manage/clean up
// independently.
export const HERO_IMAGES_BUCKET = "hero-images";

export const MAX_IMAGE_BYTES = 8 * 1024 * 1024; // 8MB
const ACCEPTED_PREFIX = "image/";

export function validateHeroImageFile(file: File): string | null {
  if (!file.type.startsWith(ACCEPTED_PREFIX)) {
    return `${file.name}: not an image file.`;
  }
  if (file.size > MAX_IMAGE_BYTES) {
    return `${file.name}: file is too large (max ${MAX_IMAGE_BYTES / (1024 * 1024)}MB).`;
  }
  return null;
}

function sanitizeBaseName(name: string) {
  const dot = name.lastIndexOf(".");
  const base = dot > 0 ? name.slice(0, dot) : name;
  const ext = dot > 0 ? name.slice(dot) : "";
  const safeBase = base.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "image";
  const safeExt = ext.toLowerCase().replace(/[^a-z0-9.]/g, "");
  return safeBase + safeExt;
}

export type UploadResult = { path: string; publicUrl: string };

// Stored under {propertyId}/{unique}-{filename} — the property is always
// chosen before any section image is picked, so its id is already stable
// (unlike a brand-new property row, there's no "create first" step here).
export async function uploadHeroImage(propertyId: string, file: File): Promise<UploadResult> {
  const unique = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const path = `${propertyId}/${unique}-${sanitizeBaseName(file.name)}`;

  const { error } = await supabase.storage.from(HERO_IMAGES_BUCKET).upload(path, file, {
    cacheControl: "3600",
    upsert: false,
  });
  if (error) throw error;

  const { data } = supabase.storage.from(HERO_IMAGES_BUCKET).getPublicUrl(path);
  return { path, publicUrl: data.publicUrl };
}

export function storagePathFromPublicUrl(url: string): string | null {
  const marker = `/object/public/${HERO_IMAGES_BUCKET}/`;
  const idx = url.indexOf(marker);
  if (idx === -1) return null;
  return decodeURIComponent(url.slice(idx + marker.length));
}

// Best-effort cleanup after a hero slide is deleted — every uploaded hero
// image lives under a {propertyId}/ prefix, so this only ever touches that
// one property's own hero-image folder. Failures here are non-fatal: the
// slide row is already gone by the time this runs.
export async function deleteHeroImageFolder(propertyId: string): Promise<void> {
  const { data, error } = await supabase.storage.from(HERO_IMAGES_BUCKET).list(propertyId);
  if (error) throw error;
  if (!data || data.length === 0) return;

  const paths = data.map((f) => `${propertyId}/${f.name}`);
  const { error: removeError } = await supabase.storage.from(HERO_IMAGES_BUCKET).remove(paths);
  if (removeError) throw removeError;
}
