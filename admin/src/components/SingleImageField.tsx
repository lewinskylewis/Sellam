import { useRef, useState } from "react";
import { ImageIcon } from "./icons";
import { uploadPropertyImage, validateImageFile } from "../lib/mediaStorage";

// Reuses the existing property-images Storage bucket/upload function rather
// than a second image system — a community's images are stored under
// {communityKey}/... in the exact same bucket, same as a property's images
// live under {propertyId}/...

// Same problem/fix as MediaManager.tsx's resolvePreviewUrl and
// lib/hero.ts's resolveHeroImagePreviewUrl: existing community image paths
// are plain relative paths (e.g. "assets/images/community-karen.webp"),
// meant to resolve against the public site's own origin, not this
// dashboard's — prefix them for admin preview only, display-only, never
// written back.
const PUBLIC_SITE_ORIGIN = "https://sellamre.com/";

function resolvePreviewUrl(path: string) {
  if (!path) return "";
  if (/^https?:\/\//i.test(path) || path.startsWith("data:") || path.startsWith("blob:")) return path;
  return PUBLIC_SITE_ORIGIN + path.replace(/^\/+/, "");
}

export default function SingleImageField({
  label,
  hint,
  value,
  onChange,
  folderId,
}: {
  label: string;
  hint?: string;
  value: string;
  onChange: (path: string) => void;
  folderId: string;
}) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File | null) {
    if (!file) return;
    setError(null);

    const invalid = validateImageFile(file);
    if (invalid) {
      setError(invalid);
      return;
    }

    setUploading(true);
    try {
      const { publicUrl } = await uploadPropertyImage(folderId, file);
      onChange(publicUrl);
    } catch (err) {
      setError(err && typeof err === "object" && "message" in err ? String((err as { message: unknown }).message) : "Upload failed.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div>
      <span className="mb-1.5 block text-sm font-medium text-ink">{label}</span>
      <div className="flex items-center gap-4">
        <div className="h-20 w-28 shrink-0 overflow-hidden rounded-lg border border-line bg-paper">
          {value ? (
            <img src={resolvePreviewUrl(value)} alt="" className="h-full w-full object-cover" />
          ) : (
            <span className="flex h-full w-full items-center justify-center text-ink-soft">
              <ImageIcon className="h-6 w-6" />
            </span>
          )}
        </div>
        <div>
          <label className="inline-block cursor-pointer rounded-lg border border-line px-3 py-1.5 text-sm font-medium text-ink hover:bg-paper">
            {uploading ? "Uploading…" : value ? "Replace Photo" : "Upload Photo"}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              disabled={uploading}
              onChange={(e) => {
                handleFile(e.target.files?.[0] ?? null);
                e.target.value = "";
              }}
            />
          </label>
          {hint && !error && <p className="mt-1 text-xs text-ink-soft">{hint}</p>}
          {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
        </div>
      </div>
    </div>
  );
}
