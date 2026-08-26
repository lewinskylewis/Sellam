import { supabase } from "./supabase";

// See PHASE 2C report: this bucket does not exist yet. Uploads will fail
// with a clear "Bucket not found" error until it's created and the storage
// RLS policies below are applied — both require your explicit approval,
// per the no-silent-infrastructure instruction.
export const PROPERTY_IMAGES_BUCKET = "property-images";

export const MAX_IMAGE_BYTES = 8 * 1024 * 1024; // 8MB
const ACCEPTED_PREFIX = "image/";

export function validateImageFile(file: File): string | null {
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

// Stores under {propertyId}/{unique}-{filename} — matches the "property is
// created first, then images use its stable ID" flow from the Phase 2C
// brief. The public URL (not just the path) is written into the existing
// image/hero_image/gallery text columns, so it renders exactly like any
// other value in those columns — no adapter changes needed on the public
// site (see data/supabase-adapter.js, which already passes these fields
// through unchanged).
export async function uploadPropertyImage(propertyId: string, file: File): Promise<UploadResult> {
  const unique = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const path = `${propertyId}/${unique}-${sanitizeBaseName(file.name)}`;

  const { error } = await supabase.storage.from(PROPERTY_IMAGES_BUCKET).upload(path, file, {
    cacheControl: "3600",
    upsert: false,
  });
  if (error) throw error;

  const { data } = supabase.storage.from(PROPERTY_IMAGES_BUCKET).getPublicUrl(path);
  return { path, publicUrl: data.publicUrl };
}

// Only ever called on a path this app itself uploaded (see MediaManager) —
// never on the existing local site paths, which aren't Storage objects.
export async function removePropertyImage(path: string): Promise<void> {
  const { error } = await supabase.storage.from(PROPERTY_IMAGES_BUCKET).remove([path]);
  if (error) throw error;
}

// Recovers the storage path from a public URL we generated, so a remove
// only ever targets an object this bucket actually owns.
export function storagePathFromPublicUrl(url: string): string | null {
  const marker = `/object/public/${PROPERTY_IMAGES_BUCKET}/`;
  const idx = url.indexOf(marker);
  if (idx === -1) return null;
  return decodeURIComponent(url.slice(idx + marker.length));
}
