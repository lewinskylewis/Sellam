import type { ReactNode } from "react";

export default function InsightTile({
  label,
  icon,
  loading,
  title,
  metric,
  unavailableReason,
}: {
  label: string;
  icon: ReactNode;
  loading: boolean;
  /** The property title to headline, or null if there's nothing to show. */
  title: string | null;
  /** Small supporting line, e.g. "12 enquiries", "From KES 45,000,000". */
  metric?: string;
  /** Shown instead of title/metric when this tile genuinely has no data to
   *  report (e.g. no metric is trackable yet) — never fabricated. */
  unavailableReason?: string;
}) {
  return (
    <div className="surface-glass flex items-start gap-4 rounded-2xl p-5 shadow-[0_8px_30px_rgba(15,23,42,0.1)]">
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand text-white">
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-xs font-medium tracking-wide text-ink uppercase">{label}</span>
        {loading ? (
          <span className="mt-1.5 block h-5 w-28 animate-pulse rounded bg-line" />
        ) : unavailableReason ? (
          <span className="mt-1 block text-sm text-ink">{unavailableReason}</span>
        ) : title ? (
          <>
            <span className="mt-0.5 block truncate text-sm font-semibold text-ink">{title}</span>
            {metric && <span className="block text-xs text-ink">{metric}</span>}
          </>
        ) : (
          <span className="mt-1 block text-sm text-ink">—</span>
        )}
      </span>
    </div>
  );
}
