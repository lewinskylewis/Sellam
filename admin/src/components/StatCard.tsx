import type { ReactNode } from "react";

export default function StatCard({
  label,
  value,
  icon,
  loading,
  unavailable,
}: {
  label: string;
  value: number | null;
  icon: ReactNode;
  loading: boolean;
  unavailable?: boolean;
}) {
  return (
    <div className="surface-glass flex items-center gap-4 rounded-2xl p-5 shadow-[0_8px_30px_rgba(15,23,42,0.1)]">
      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-brand text-white">
        {icon}
      </span>
      <span className="min-w-0">
        <span className="block text-sm leading-snug text-ink">{label}</span>
        {loading ? (
          <span className="mt-1 block h-7 w-10 animate-pulse rounded bg-line" />
        ) : unavailable ? (
          <span className="block text-lg text-ink-soft/60">—</span>
        ) : (
          <span className="block text-2xl leading-tight font-bold text-ink">{value}</span>
        )}
      </span>
    </div>
  );
}
