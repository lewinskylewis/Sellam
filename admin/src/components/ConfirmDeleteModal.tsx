import { useState } from "react";

export default function ConfirmDeleteModal({
  title,
  itemLabel,
  description,
  confirmLabel = "Delete",
  deleting,
  error,
  onConfirm,
  onCancel,
}: {
  title: string;
  itemLabel: string;
  description?: string;
  confirmLabel?: string;
  deleting: boolean;
  error: string | null;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const [typed, setTyped] = useState("");
  const matches = typed.trim() === itemLabel.trim();

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/50" onClick={deleting ? undefined : onCancel} aria-hidden="true" />
      <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
        <div className="w-full max-w-sm rounded-3xl border border-line bg-surface p-6 shadow-[0_8px_30px_rgba(15,23,42,0.14)]">
          <h2 className="font-display text-xl text-ink">{title}</h2>
          <p className="mt-2 text-sm text-ink-soft">
            {description ?? "This action is permanent and cannot be undone."}
          </p>

          <p className="mt-4 text-xs font-medium tracking-wide text-ink-soft uppercase">
            Type <span className="font-semibold text-ink normal-case">"{itemLabel}"</span> to confirm
          </p>
          <input
            autoFocus
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            disabled={deleting}
            className="mt-1.5 w-full rounded-xl border border-line bg-white px-3 py-2 text-sm text-ink outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
          />

          {error && <p className="mt-3 rounded-md bg-red-50 px-3 py-2 text-xs text-red-700">{error}</p>}

          <div className="mt-5 flex gap-2">
            <button
              type="button"
              onClick={onConfirm}
              disabled={!matches || deleting}
              className="rounded-xl bg-red-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {deleting ? "Deleting…" : confirmLabel}
            </button>
            <button
              type="button"
              onClick={onCancel}
              disabled={deleting}
              className="rounded-xl border border-line px-4 py-2.5 text-sm font-medium text-ink hover:bg-paper disabled:opacity-60"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
