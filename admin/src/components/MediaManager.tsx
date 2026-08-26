import { useRef, useState } from "react";
import { CloseIcon, HousePlusIcon } from "./icons";
import {
  PROPERTY_IMAGES_BUCKET,
  removePropertyImage,
  storagePathFromPublicUrl,
  uploadPropertyImage,
  validateImageFile,
} from "../lib/mediaStorage";

export type MediaState = {
  primaryImage: string;
  heroImage: string;
  galleryImages: string[];
};

// A file picked before the property has been saved (no id yet), so it can't
// be uploaded yet — see the "New Property Flow" in the Phase 2C brief:
// property is created first, then its pending files are uploaded using the
// resulting id. Lives in PropertyEditor's state (not MediaManager's) so it
// survives the initial Create Property save.
export type DeferredFile = { id: string; file: File; name: string; previewUrl: string };

type UploadingFile = { id: string; name: string; previewUrl: string; error: string | null; file: File };

// The public site serves image paths (see data/properties.js /
// data/supabase-adapter.js) relative to its own origin, not this dashboard's
// origin — prefix with the known production domain purely so the admin can
// preview what's already stored. Never sent anywhere; display-only. Storage
// uploads are stored as absolute URLs already, so they pass through as-is.
const PUBLIC_SITE_ORIGIN = "https://sellamre.com/";

function resolvePreviewUrl(path: string) {
  if (!path) return "";
  if (/^https?:\/\//i.test(path) || path.startsWith("data:") || path.startsWith("blob:")) return path;
  return PUBLIC_SITE_ORIGIN + path.replace(/^\/+/, "");
}

function isUploadedPath(path: string) {
  return path.includes(`/object/public/${PROPERTY_IMAGES_BUCKET}/`);
}

function Thumbnail({
  path,
  badge,
  onSetPrimary,
  onSetHero,
  onRemove,
  onMoveUp,
  onMoveDown,
}: {
  path: string;
  badge?: string;
  onSetPrimary?: () => void;
  onSetHero?: () => void;
  onRemove?: () => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
}) {
  const [broken, setBroken] = useState(false);
  const uploaded = isUploadedPath(path);

  return (
    <div className="group relative overflow-hidden rounded-xl border border-line bg-paper">
      <div className="aspect-[4/3] w-full">
        {broken ? (
          <div className="flex h-full w-full flex-col items-center justify-center gap-1 p-2 text-center">
            <span className="text-xs text-ink-soft">Preview unavailable</span>
            <span className="truncate text-[10px] text-ink-soft/70">{path}</span>
          </div>
        ) : (
          <img
            src={resolvePreviewUrl(path)}
            alt=""
            className="h-full w-full object-cover"
            onError={() => setBroken(true)}
          />
        )}
      </div>

      <div className="absolute top-2 left-2 flex gap-1">
        {badge && (
          <span className="rounded-full bg-brand px-2 py-0.5 text-[10px] font-semibold tracking-wide text-white uppercase">
            {badge}
          </span>
        )}
        {uploaded && (
          <span className="rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-medium tracking-wide text-ink-soft uppercase">
            Uploaded
          </span>
        )}
      </div>

      <div className="absolute inset-x-0 bottom-0 flex flex-wrap items-center gap-1 bg-black/55 p-1.5 opacity-0 transition-opacity group-hover:opacity-100">
        {onSetPrimary && (
          <button type="button" onClick={onSetPrimary} className="rounded bg-white/90 px-1.5 py-0.5 text-[10px] font-medium text-ink hover:bg-white">
            Set Primary
          </button>
        )}
        {onSetHero && (
          <button type="button" onClick={onSetHero} className="rounded bg-white/90 px-1.5 py-0.5 text-[10px] font-medium text-ink hover:bg-white">
            Set Hero
          </button>
        )}
        {onMoveUp && (
          <button type="button" onClick={onMoveUp} className="rounded bg-white/90 px-1.5 py-0.5 text-[10px] font-medium text-ink hover:bg-white">
            ↑
          </button>
        )}
        {onMoveDown && (
          <button type="button" onClick={onMoveDown} className="rounded bg-white/90 px-1.5 py-0.5 text-[10px] font-medium text-ink hover:bg-white">
            ↓
          </button>
        )}
        {onRemove && (
          <button type="button" onClick={onRemove} className="ml-auto rounded bg-white/90 px-1.5 py-0.5 text-[10px] font-medium text-red-600 hover:bg-white">
            Remove
          </button>
        )}
      </div>
    </div>
  );
}

export default function MediaManager({
  value,
  onChange,
  propertyId,
  deferredFiles,
  onDeferredFilesChange,
}: {
  value: MediaState;
  onChange: (value: MediaState | ((prev: MediaState) => MediaState)) => void;
  propertyId: string | null;
  deferredFiles: DeferredFile[];
  onDeferredFilesChange: (files: DeferredFile[]) => void;
}) {
  const [uploading, setUploading] = useState<UploadingFile[]>([]);
  const [pickError, setPickError] = useState<string | null>(null);
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [manualPath, setManualPath] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const hasAnyExisting = Boolean(value.primaryImage) || Boolean(value.heroImage) || value.galleryImages.length > 0;

  // Uses the functional-updater form, not the closure-captured `value` prop
  // — with multiple uploads finishing close together, two updates each
  // computed from the same stale `value` would race and the second onChange
  // would silently discard the first's addition. React applies queued
  // functional updates in order against the true latest state, so neither
  // upload's result gets lost regardless of completion order.
  function addToGalleryOrPrimary(publicUrl: string) {
    onChange((prev) =>
      prev.primaryImage
        ? { ...prev, galleryImages: [...prev.galleryImages, publicUrl] }
        : { ...prev, primaryImage: publicUrl },
    );
  }

  async function uploadOne(item: UploadingFile) {
    if (!propertyId) return;
    try {
      const { publicUrl } = await uploadPropertyImage(propertyId, item.file);
      setUploading((list) => list.filter((f) => f.id !== item.id));
      URL.revokeObjectURL(item.previewUrl);
      addToGalleryOrPrimary(publicUrl);
    } catch (err) {
      const message = err && typeof err === "object" && "message" in err ? String((err as { message: unknown }).message) : "Upload failed.";
      setUploading((list) => list.map((f) => (f.id === item.id ? { ...f, error: message } : f)));
    }
  }

  function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setPickError(null);

    const validFiles: File[] = [];
    const errors: string[] = [];
    Array.from(files).forEach((file) => {
      const err = validateImageFile(file);
      if (err) errors.push(err);
      else validFiles.push(file);
    });
    if (errors.length > 0) setPickError(errors.join(" "));
    if (validFiles.length === 0) return;

    if (propertyId) {
      const items: UploadingFile[] = validFiles.map((file) => ({
        id: Math.random().toString(36).slice(2),
        name: file.name,
        previewUrl: URL.createObjectURL(file),
        error: null,
        file,
      }));
      setUploading((list) => [...list, ...items]);
      items.forEach((item) => uploadOne(item));
    } else {
      const items: DeferredFile[] = validFiles.map((file) => ({
        id: Math.random().toString(36).slice(2),
        file,
        name: file.name,
        previewUrl: URL.createObjectURL(file),
      }));
      onDeferredFilesChange([...deferredFiles, ...items]);
    }
  }

  function retryUpload(id: string) {
    const item = uploading.find((f) => f.id === id);
    if (item) uploadOne({ ...item, error: null });
  }

  function removeUploading(id: string) {
    setUploading((list) => {
      const target = list.find((f) => f.id === id);
      if (target) URL.revokeObjectURL(target.previewUrl);
      return list.filter((f) => f.id !== id);
    });
  }

  function removeDeferred(id: string) {
    const target = deferredFiles.find((f) => f.id === id);
    if (target) URL.revokeObjectURL(target.previewUrl);
    onDeferredFilesChange(deferredFiles.filter((f) => f.id !== id));
  }

  function setPrimary(path: string) {
    onChange((prev) => {
      // Swap: whatever was primary goes back into the gallery so it isn't lost.
      const next: MediaState = { ...prev, galleryImages: prev.galleryImages.filter((g) => g !== path) };
      if (prev.primaryImage && prev.primaryImage !== path) {
        next.galleryImages = [prev.primaryImage, ...next.galleryImages];
      }
      next.primaryImage = path;
      if (next.heroImage === path) next.heroImage = "";
      return next;
    });
  }

  function moveGalleryImage(index: number, dir: -1 | 1) {
    onChange((prev) => {
      const next = prev.galleryImages.slice();
      const target = index + dir;
      if (target < 0 || target >= next.length) return prev;
      [next[index], next[target]] = [next[target], next[index]];
      return { ...prev, galleryImages: next };
    });
  }

  function setHero(path: string) {
    onChange((prev) => {
      if (prev.heroImage === path) {
        // Toggling off: return it to the gallery so it isn't lost (unless
        // it's the primary image, which is displayed separately anyway).
        const restore = path !== prev.primaryImage && !prev.galleryImages.includes(path);
        return { ...prev, heroImage: "", galleryImages: restore ? [...prev.galleryImages, path] : prev.galleryImages };
      }
      // Setting a gallery image as hero removes it from the gallery list so
      // it doesn't render twice; whatever was hero before goes back into
      // the gallery so it isn't lost, mirroring setPrimary's swap above.
      let gallery = prev.galleryImages.filter((g) => g !== path);
      if (prev.heroImage && prev.heroImage !== prev.primaryImage && !gallery.includes(prev.heroImage)) {
        gallery = [prev.heroImage, ...gallery];
      }
      return { ...prev, heroImage: path, galleryImages: gallery };
    });
  }

  // Best-effort: also deletes the underlying Storage object if this path is
  // one we uploaded. Never attempted for the existing local site paths —
  // those aren't Storage objects and this app has no business touching
  // them. The field is detached either way, even if the Storage delete
  // itself fails (e.g. already gone).
  function removeImage(path: string, detach: (prev: MediaState) => MediaState) {
    onChange(detach);
    if (isUploadedPath(path)) {
      const storagePath = storagePathFromPublicUrl(path);
      if (storagePath) removePropertyImage(storagePath).catch((err) => console.warn("Storage delete failed:", err));
    }
  }

  function addManualPath() {
    const path = manualPath.trim();
    if (!path) return;
    onChange((prev) =>
      prev.primaryImage ? { ...prev, galleryImages: [...prev.galleryImages, path] } : { ...prev, primaryImage: path },
    );
    setManualPath("");
  }

  return (
    <div className="space-y-5">
      <div
        onClick={() => fileInputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          handleFiles(e.dataTransfer.files);
        }}
        className="flex cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-line bg-paper px-6 py-10 text-center transition-colors hover:border-brand"
      >
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-brand text-white">
          <HousePlusIcon className="h-6 w-6" />
        </span>
        <span className="text-sm font-semibold text-ink">+ Add Images</span>
        <span className="text-xs text-ink-soft">Choose images from your device, or drag and drop them here.</span>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => {
            handleFiles(e.target.files);
            e.target.value = "";
          }}
        />
      </div>

      {pickError && <p className="rounded-md bg-red-50 px-3 py-2 text-xs text-red-700">{pickError}</p>}

      {!propertyId && deferredFiles.length > 0 && (
        <div>
          <p className="mb-2 text-sm font-medium text-ink">
            Selected images <span className="font-normal text-ink-soft">— will upload once you save</span>
          </p>
          <p className="mb-3 rounded-md bg-amber-50 px-3 py-2 text-xs text-amber-800">
            This property hasn't been created yet, so these can't be uploaded until you click Create Property. They'll
            upload automatically right after.
          </p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {deferredFiles.map((f) => (
              <div key={f.id} className="relative overflow-hidden rounded-xl border border-line bg-paper">
                <div className="aspect-[4/3] w-full">
                  <img src={f.previewUrl} alt={f.name} className="h-full w-full object-cover" />
                </div>
                <button
                  type="button"
                  onClick={() => removeDeferred(f.id)}
                  className="absolute top-1.5 right-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80"
                  aria-label="Remove"
                >
                  <CloseIcon className="h-3.5 w-3.5" />
                </button>
                <p className="truncate px-2 py-1 text-[10px] text-ink-soft">{f.name}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {uploading.length > 0 && (
        <div>
          <p className="mb-2 text-sm font-medium text-ink">Uploading</p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {uploading.map((f) => (
              <div key={f.id} className="relative overflow-hidden rounded-xl border border-line bg-paper">
                <div className="aspect-[4/3] w-full">
                  <img src={f.previewUrl} alt={f.name} className="h-full w-full object-cover opacity-60" />
                </div>
                {!f.error ? (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                    <span className="rounded-full bg-white/90 px-2 py-1 text-[10px] font-medium text-ink">Uploading…</span>
                  </div>
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-black/50 p-2 text-center">
                    <span className="text-[10px] font-medium text-white">{f.error}</span>
                    <div className="flex gap-1">
                      <button
                        type="button"
                        onClick={() => retryUpload(f.id)}
                        className="rounded bg-white/90 px-1.5 py-0.5 text-[10px] font-medium text-ink hover:bg-white"
                      >
                        Retry
                      </button>
                      <button
                        type="button"
                        onClick={() => removeUploading(f.id)}
                        className="rounded bg-white/90 px-1.5 py-0.5 text-[10px] font-medium text-red-600 hover:bg-white"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                )}
                <p className="truncate px-2 py-1 text-[10px] text-ink-soft">{f.name}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {!hasAnyExisting && deferredFiles.length === 0 && uploading.length === 0 && (
        <p className="text-sm text-ink-soft">No images yet.</p>
      )}

      {hasAnyExisting && (
        <div>
          <p className="mb-2 text-sm font-medium text-ink">Existing images</p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {value.primaryImage && (
              <Thumbnail
                path={value.primaryImage}
                badge="Primary"
                onSetHero={() => setHero(value.primaryImage)}
              />
            )}
            {value.heroImage && (
              <Thumbnail
                path={value.heroImage}
                badge="Hero"
                onSetPrimary={() => setPrimary(value.heroImage)}
                onRemove={() => removeImage(value.heroImage, (prev) => ({ ...prev, heroImage: "" }))}
              />
            )}
            {value.galleryImages.map((path, index) => (
              <Thumbnail
                key={path + index}
                path={path}
                onSetPrimary={() => setPrimary(path)}
                onSetHero={() => setHero(path)}
                onRemove={() =>
                  removeImage(path, (prev) => ({ ...prev, galleryImages: prev.galleryImages.filter((g) => g !== path) }))
                }
                onMoveUp={index > 0 ? () => moveGalleryImage(index, -1) : undefined}
                onMoveDown={index < value.galleryImages.length - 1 ? () => moveGalleryImage(index, 1) : undefined}
              />
            ))}
          </div>
        </div>
      )}

      <div>
        <button
          type="button"
          onClick={() => setAdvancedOpen((v) => !v)}
          className="text-xs font-medium text-link hover:underline"
        >
          {advancedOpen ? "Hide" : "Advanced: add by path"}
        </button>
        {advancedOpen && (
          <div className="mt-2 flex gap-2">
            <input
              className="flex-1 rounded-xl border border-line bg-white px-3 py-2 text-sm text-ink outline-none focus:border-brand focus:ring-1 focus:ring-brand"
              placeholder="assets/images/example.jpg"
              value={manualPath}
              onChange={(e) => setManualPath(e.target.value)}
            />
            <button
              type="button"
              onClick={addManualPath}
              className="rounded-xl border border-line px-3 py-2 text-sm font-medium text-ink hover:bg-paper"
            >
              Add
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
