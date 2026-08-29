import type { ReactNode } from "react";
import { ArrowRightIcon, TrendDownIcon, TrendUpIcon } from "../icons";

export function formatMoneyKES(value: number): string {
  if (value >= 1_000_000_000) return `KES ${(value / 1_000_000_000).toFixed(2)}B`;
  if (value >= 1_000_000) return `KES ${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `KES ${(value / 1_000).toFixed(0)}K`;
  return `KES ${value.toFixed(0)}`;
}

export function formatMinutes(minutes: number | null): string {
  if (minutes == null) return "—";
  if (minutes < 60) return `${Math.round(minutes)} min`;
  const hours = Math.floor(minutes / 60);
  const rest = Math.round(minutes % 60);
  return rest > 0 ? `${hours}h ${rest}m` : `${hours}h`;
}

export function formatPct(value: number | null, digits = 1): string {
  if (value == null) return "—";
  return `${value.toFixed(digits)}%`;
}

export function formatNumber(value: number): string {
  return value.toLocaleString();
}

export function TrendBadge({ pct, comparisonLabel, invert = false }: { pct: number | null; comparisonLabel: string; invert?: boolean }) {
  if (pct == null) {
    return <span className="text-xs text-ink-soft">Not enough data for {comparisonLabel.toLowerCase()}</span>;
  }
  const positive = invert ? pct <= 0 : pct >= 0;
  const flat = Math.abs(pct) < 0.05;
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-medium ${flat ? "text-ink-soft" : positive ? "text-status-green-text" : "text-rose-600"}`}>
      {!flat && (positive ? <TrendUpIcon className="h-3 w-3" /> : <TrendDownIcon className="h-3 w-3" />)}
      {flat ? "No change" : `${pct >= 0 ? "+" : ""}${pct.toFixed(1)}%`} <span className="text-ink-soft">vs {comparisonLabel.toLowerCase()}</span>
    </span>
  );
}

export function KpiTile({ label, value, pct, comparisonLabel, invert }: { label: string; value: string; pct: number | null; comparisonLabel: string; invert?: boolean }) {
  return (
    <div className="rounded-2xl border border-line bg-surface p-4">
      <p className="text-xs font-medium tracking-wide text-ink-soft uppercase">{label}</p>
      <p className="mt-1.5 text-2xl font-semibold tracking-tight text-ink">{value}</p>
      {comparisonLabel && (
        <div className="mt-1.5">
          <TrendBadge pct={pct} comparisonLabel={comparisonLabel} invert={invert} />
        </div>
      )}
    </div>
  );
}

export function KpiSkeleton() {
  return (
    <div className="rounded-2xl border border-line bg-surface p-4">
      <div className="h-2.5 w-20 animate-pulse rounded bg-paper" />
      <div className="mt-2.5 h-6 w-14 animate-pulse rounded bg-paper" />
      <div className="mt-2.5 h-2.5 w-28 animate-pulse rounded bg-paper" />
    </div>
  );
}

export function SectionCard({ title, subtitle, action, children, className = "" }: { title: string; subtitle?: string; action?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={`rounded-2xl border border-line bg-surface p-5 ${className}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-ink">{title}</h2>
          {subtitle && <p className="mt-0.5 text-sm text-ink-soft">{subtitle}</p>}
        </div>
        {action}
      </div>
      <div className="mt-4">{children}</div>
    </section>
  );
}

export function ChartSkeleton({ height = 220 }: { height?: number }) {
  return <div className="w-full animate-pulse rounded-xl bg-paper" style={{ height }} />;
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-9 w-full animate-pulse rounded-lg bg-paper" />
      ))}
    </div>
  );
}

export function EmptyState({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-line px-6 py-10 text-center">
      <p className="text-sm font-medium text-ink">{title}</p>
      {hint && <p className="mt-1 text-xs text-ink-soft">{hint}</p>}
    </div>
  );
}

export function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-line px-6 py-10 text-center">
      <p className="text-sm font-medium text-ink">Analytics couldn't be loaded.</p>
      <button type="button" onClick={onRetry} className="mt-3 rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:opacity-90">
        Try Again
      </button>
    </div>
  );
}

export function NavOutLink({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="inline-flex items-center gap-1 text-xs font-medium text-link hover:underline">
      {label}
      <ArrowRightIcon className="h-3 w-3" />
    </button>
  );
}

export function SegmentedControl<T extends string>({ value, onChange, options }: { value: T; onChange: (v: T) => void; options: { value: T; label: string }[] }) {
  return (
    <div className="inline-flex rounded-lg border border-line bg-paper/60 p-0.5">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
            value === opt.value ? "bg-white text-ink shadow-[0_1px_4px_rgba(15,23,42,0.12)]" : "text-ink-soft hover:text-ink"
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

export function SortHeader<T extends string>({ label, sortKey, active, onClick, align = "right" }: { label: string; sortKey: T; active: { key: T; dir: "asc" | "desc" } | null; onClick: (k: T) => void; align?: "left" | "right" }) {
  const isActive = active?.key === sortKey;
  return (
    <th className={`px-3 py-2 text-xs font-medium tracking-wide text-ink-soft uppercase ${align === "right" ? "text-right" : "text-left"}`}>
      <button type="button" onClick={() => onClick(sortKey)} className={`inline-flex items-center gap-1 hover:text-ink ${isActive ? "text-ink" : ""}`}>
        {label}
        {isActive && <span className="text-[10px]">{active?.dir === "asc" ? "▲" : "▼"}</span>}
      </button>
    </th>
  );
}

export function InsightsList({ insights }: { insights: { text: string; tone: "positive" | "negative" | "neutral" }[] }) {
  if (insights.length === 0) {
    return <EmptyState title="Not enough data to calculate insights." hint="Try a wider date range or fewer filters." />;
  }
  return (
    <ul className="space-y-2.5">
      {insights.map((insight, i) => (
        <li key={i} className="flex gap-2.5 text-sm">
          <span
            className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${
              insight.tone === "positive" ? "bg-status-green-text" : insight.tone === "negative" ? "bg-rose-500" : "bg-accent"
            }`}
          />
          <span className="text-ink">{insight.text}</span>
        </li>
      ))}
    </ul>
  );
}
