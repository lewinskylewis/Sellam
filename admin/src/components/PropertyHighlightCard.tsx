import { resolveHighlightImagePreviewUrl, type PropertyHighlight } from "../lib/propertyHighlights";
import { ImageIcon } from "./icons";

export default function PropertyHighlightCard({
  highlight,
  position,
  total,
  busy,
  onEdit,
  onRemove,
  onToggleActive,
  onMoveUp,
  onMoveDown,
}: {
  highlight: PropertyHighlight;
  position: number;
  total: number;
  busy: boolean;
  onEdit: () => void;
  onRemove: () => void;
  onToggleActive: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
}) {
  const property = highlight.property;
  const image = highlight.image || property?.image;
  const imageUrl = image ? resolveHighlightImagePreviewUrl(image) : null;
  const caption = highlight.caption || property?.title || "";

  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-surface shadow-[0_8px_30px_rgba(15,23,42,0.14)]">
      <div className="relative h-40 w-full bg-paper">
        {imageUrl ? (
          <img src={imageUrl} alt={caption} className="h-full w-full object-cover" />
        ) : (
          <span className="flex h-full w-full items-center justify-center text-ink-soft">
            <ImageIcon className="h-8 w-8" />
          </span>
        )}

        <span className="absolute top-3 left-3 flex h-7 w-7 items-center justify-center rounded-full bg-brand text-xs font-bold text-white shadow">
          {position}
        </span>
        {position === 1 && (
          <span className="absolute top-3 left-11 rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-medium text-ink shadow">
            Large tile
          </span>
        )}

        <span
          className="absolute top-3 right-3 rounded-full px-3 py-1 text-xs font-medium shadow"
          style={
            highlight.is_active
              ? { backgroundColor: "var(--color-status-green-bg)", color: "var(--color-status-green-text)" }
              : { backgroundColor: "var(--color-status-gray-bg)", color: "var(--color-status-gray-text)" }
          }
        >
          {highlight.is_active ? "Visible" : "Hidden"}
        </span>
      </div>

      <div className="p-5">
        {property ? (
          <>
            <h3 className="truncate text-base font-semibold text-ink">{caption}</h3>
            <p className="mt-0.5 truncate text-sm text-ink-soft">
              {property.title !== caption ? `${property.title} · ` : ""}
              {property.communityLabel}
              {property.location ? ` · ${property.location}` : ""}
            </p>
          </>
        ) : (
          <p className="text-sm text-red-600">Linked property is missing or was deleted.</p>
        )}

        <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-line pt-4">
          <button
            type="button"
            onClick={onEdit}
            disabled={busy}
            className="rounded-lg border border-line px-3 py-1.5 text-sm font-medium text-ink hover:bg-paper disabled:opacity-60"
          >
            Edit Caption / Photo
          </button>
          <button
            type="button"
            onClick={onToggleActive}
            disabled={busy}
            className="rounded-lg border border-line px-3 py-1.5 text-sm font-medium text-ink hover:bg-paper disabled:opacity-60"
          >
            {highlight.is_active ? "Hide from Website" : "Show on Website"}
          </button>
          <button
            type="button"
            onClick={onRemove}
            disabled={busy}
            className="rounded-lg border border-red-200 px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-60"
          >
            Remove
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
