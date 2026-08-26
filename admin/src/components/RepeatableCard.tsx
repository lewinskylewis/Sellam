import type { ReactNode } from "react";

export default function RepeatableCard({
  index,
  label,
  onRemove,
  children,
}: {
  index: number;
  label: string;
  onRemove: () => void;
  children: ReactNode;
}) {
  return (
    <div className="rounded-xl border border-line p-4">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-ink">
          {label} {index + 1}
        </span>
        <button type="button" onClick={onRemove} className="text-xs font-medium text-red-600 hover:underline">
          Remove
        </button>
      </div>
      <div className="mt-3 space-y-3">{children}</div>
    </div>
  );
}

export function AddCardButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full rounded-xl border border-dashed border-line py-3 text-sm font-medium text-ink-soft transition-colors hover:border-brand hover:text-brand"
    >
      {label}
    </button>
  );
}
