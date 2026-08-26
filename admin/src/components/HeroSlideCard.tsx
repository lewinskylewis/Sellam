import { resolveHeroImagePreviewUrl, type HeroSlide } from "../lib/hero";
import { ImageIcon } from "./icons";

export default function HeroSlideCard({
  slide,
  position,
  total,
  busy,
  onEdit,
  onDelete,
  onToggleActive,
  onMoveUp,
  onMoveDown,
}: {
  slide: HeroSlide;
  position: number;
  total: number;
  busy: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onToggleActive: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
}) {
  const coverImage = slide.sections.find((s) => s.image)?.image ?? null;
  const coverImageUrl = coverImage ? resolveHeroImagePreviewUrl(coverImage) : null;
  const property = slide.property;

  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-surface shadow-[0_8px_30px_rgba(15,23,42,0.14)]">
      <div className="relative h-44 w-full bg-paper">
        {coverImageUrl ? (
          <img src={coverImageUrl} alt={property?.title ?? "Hero slide"} className="h-full w-full object-cover" />
        ) : (
          <span className="flex h-full w-full items-center justify-center text-ink-soft">
            <ImageIcon className="h-8 w-8" />
          </span>
        )}

        <span className="absolute top-3 left-3 flex h-7 w-7 items-center justify-center rounded-full bg-brand text-xs font-bold text-white shadow">
          {position}
        </span>

        <span
          className="absolute top-3 right-3 rounded-full px-3 py-1 text-xs font-medium shadow"
          style={
            slide.is_active
              ? { backgroundColor: "var(--color-status-green-bg)", color: "var(--color-status-green-text)" }
              : { backgroundColor: "var(--color-status-gray-bg)", color: "var(--color-status-gray-text)" }
          }
        >
          {slide.is_active ? "Visible" : "Hidden"}
        </span>
      </div>

      <div className="p-5">
        {property ? (
          <>
            <h3 className="truncate text-base font-semibold text-ink">{property.title}</h3>
            <p className="mt-0.5 truncate text-sm text-ink">
              {property.communityLabel}
              {property.location ? ` · ${property.location}` : ""} · {property.priceLabel}
            </p>
          </>
        ) : (
          <p className="text-sm text-red-600">Linked property is missing or was deleted.</p>
        )}

        <div className="mt-3 flex flex-wrap gap-1.5">
          {slide.sections.map((section, i) => (
            <span
              key={i}
              className="rounded-full border border-line bg-white px-2.5 py-1 text-xs text-ink"
            >
              {section.label || `Photo ${i + 1}`}
            </span>
          ))}
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-line pt-4">
          <button
            type="button"
            onClick={onEdit}
            disabled={busy}
            className="rounded-lg border border-line px-3 py-1.5 text-sm font-medium text-ink hover:bg-paper disabled:opacity-60"
          >
            Edit
          </button>
          <button
            type="button"
            onClick={onToggleActive}
            disabled={busy}
            className="rounded-lg border border-line px-3 py-1.5 text-sm font-medium text-ink hover:bg-paper disabled:opacity-60"
          >
            {slide.is_active ? "Hide from Website" : "Show on Website"}
          </button>
          <button
            type="button"
            onClick={onDelete}
            disabled={busy}
            className="rounded-lg border border-red-200 px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-60"
          >
            Delete
          </button>

          <div className="ml-auto flex items-center gap-1">
            <button
              type="button"
              onClick={onMoveUp}
              disabled={busy || position === 1}
              aria-label="Move up"
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-line text-ink hover:bg-paper disabled:opacity-30"
            >
              ↑
            </button>
            <button
              type="button"
              onClick={onMoveDown}
              disabled={busy || position === total}
              aria-label="Move down"
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-line text-ink hover:bg-paper disabled:opacity-30"
            >
              ↓
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
