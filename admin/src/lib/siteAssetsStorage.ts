import { supabase } from "./supabase";

// Settings module logo/favicon uploads. See
// supabase/migrations/202609102010_add_site_assets_storage.sql — same
// public-bucket, authenticated-write-only pattern as heroImageStorage.ts's
// hero-images bucket.
export const SITE_ASSETS_BUCKET = "site-assets";

export const MAX_LOGO_BYTES = 4 * 1024 * 1024; // 4MB
export const MAX_FAVICON_BYTES = 1 * 1024 * 1024; // 1MB
export const MAX_BACKGROUND_BYTES = 8 * 1024 * 1024; // 8MB — matches hero-images' cap for a full-bleed photo
const ACCEPTED_PREFIX = "image/";

export function validateSiteAssetFile(file: File, maxBytes: number): string | null {
  if (!file.type.startsWith(ACCEPTED_PREFIX)) {
    return `${file.name}: not an image file.`;
  }
  if (file.size > maxBytes) {
    return `${file.name}: file is too large (max ${Math.round(maxBytes / (1024 * 1024))}MB).`;
  }
  return null;
}

function sanitizeBaseName(name: string) {
  const dot = name.lastIndexOf(".");
  const base = dot > 0 ? name.slice(0, dot) : name;
  const ext = dot > 0 ? name.slice(dot) : "";
  const safeBase = base.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "asset";
  const safeExt = ext.toLowerCase().replace(/[^a-z0-9.]/g, "");
  return safeBase + safeExt;
}

export type UploadResult = { path: string; publicUrl: string };

// Stored under {kind}/{unique}-{filename} (kind = "logo" | "favicon" |
// "background") so replacing one never collides with or disturbs another.
export async function uploadSiteAsset(kind: "logo" | "favicon" | "background", file: File): Promise<UploadResult> {
  const unique = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const path = `${kind}/${unique}-${sanitizeBaseName(file.name)}`;

  const { error } = await supabase.storage.from(SITE_ASSETS_BUCKET).upload(path, file, {
    cacheControl: "3600",
    upsert: false,
  });
  if (error) throw error;

  const { data } = supabase.storage.from(SITE_ASSETS_BUCKET).getPublicUrl(path);
  return { path, publicUrl: data.publicUrl };
}
