import { useState } from "react";
import { AGENTS, COMMUNITIES } from "../../lib/leadsData";
import { ANALYTICS_PROPERTIES, hasActiveFilters, type AnalyticsFilters, type ComparisonKey, type DateRangeKey, type ListingType, type PropertyType } from "../../lib/analyticsData";
import { CalendarIcon, CloseIcon, DownloadIcon, FilterIcon } from "../icons";
import MultiSelectDropdown from "./MultiSelectDropdown";

const DATE_OPTIONS: { value: DateRangeKey; label: string }[] = [
  { value: "today", label: "Today" },
  { value: "7d", label: "7 Days" },
  { value: "30d", label: "30 Days" },
  { value: "90d", label: "90 Days" },
  { value: "12m", label: "12 Months" },
  { value: "custom", label: "Custom" },
];

const COMPARISON_OPTIONS: { value: ComparisonKey; label: string }[] = [
  { value: "previous_period", label: "Previous period" },
  { value: "previous_month", label: "Previous month" },
  { value: "previous_year", label: "Previous year" },
];

const PROPERTY_TYPES: PropertyType[] = ["Apartment", "Villa", "Townhouse", "Penthouse", "Land", "Commercial", "Other"];
const LISTING_TYPES: ListingType[] = ["Sale", "Rent", "Lease"];

const selectClasses = "rounded-xl border border-line bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-brand focus:ring-1 focus:ring-brand";

export type ExportState = "idle" | "preparing" | "ready";

export function ExportButton({ state, onExport }: { state: ExportState; onExport: () => void }) {
  return (
    <button
      type="button"
      onClick={onExport}
      disabled={state === "preparing"}
      className="flex items-center gap-1.5 rounded-xl border border-line bg-surface px-3.5 py-2 text-sm font-medium text-ink hover:bg-paper disabled:opacity-60"
    >
      <DownloadIcon className="h-4 w-4" />
      {state === "preparing" ? "Preparing report…" : state === "ready" ? "Report ready ✓" : "Export Report"}
    </button>
  );
}

function FilterControls({
  filters,
  onFiltersChange,
}: {
  filters: AnalyticsFilters;
  onFiltersChange: (next: AnalyticsFilters) => void;
}) {
  return (
    <>
      <MultiSelectDropdown label="Property" options={ANALYTICS_PROPERTIES.map((p) => ({ value: p.id, label: p.title }))} selected={filters.properties} onChange={(v) => onFiltersChange({ ...filters, properties: v })} />
      <MultiSelectDropdown label="Community" options={COMMUNITIES.map((c) => ({ value: c, label: c }))} selected={filters.communities} onChange={(v) => onFiltersChange({ ...filters, communities: v })} />
      <MultiSelectDropdown label="Type" options={PROPERTY_TYPES.map((t) => ({ value: t, label: t }))} selected={filters.propertyTypes} onChange={(v) => onFiltersChange({ ...filters, propertyTypes: v })} />
      <MultiSelectDropdown label="Listing" options={LISTING_TYPES.map((t) => ({ value: t, label: t }))} selected={filters.listingTypes} onChange={(v) => onFiltersChange({ ...filters, listingTypes: v })} />
      <MultiSelectDropdown
        label="Source"
        options={["Website", "Enquiry Form", "WhatsApp", "Phone", "Referral", "Social Media", "Walk-in", "Other"].map((s) => ({ value: s, label: s }))}
        selected={filters.sources}
        onChange={(v) => onFiltersChange({ ...filters, sources: v as AnalyticsFilters["sources"] })}
      />
      <MultiSelectDropdown label="Agent" options={AGENTS.map((a) => ({ value: a, label: a }))} selected={filters.agents} onChange={(v) => onFiltersChange({ ...filters, agents: v })} />
    </>
  );
}

export default function FiltersBar({
  dateRangeKey,
  onDateRangeKey,
  customRange,
  onCustomRange,
  comparisonKey,
  onComparisonKey,
  filters,
  onFiltersChange,
  onClearFilters,
  exportState,
  onExport,
  rangeLabel,
}: {
  dateRangeKey: DateRangeKey;
  onDateRangeKey: (v: DateRangeKey) => void;
  customRange: { start: string; end: string };
  onCustomRange: (v: { start: string; end: string }) => void;
  comparisonKey: ComparisonKey;
  onComparisonKey: (v: ComparisonKey) => void;
  filters: AnalyticsFilters;
  onFiltersChange: (next: AnalyticsFilters) => void;
  onClearFilters: () => void;
  exportState: ExportState;
  onExport: () => void;
  rangeLabel: string;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const active = hasActiveFilters(filters);

  return (
    <div className="mt-5">
      <div className="hidden flex-wrap items-center gap-2.5 md:flex">
        <div className="flex items-center gap-1 rounded-xl border border-line bg-surface p-1">
          {DATE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => onDateRangeKey(opt.value)}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${dateRangeKey === opt.value ? "bg-brand text-white" : "text-ink-soft hover:text-ink"}`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {dateRangeKey === "custom" && (
          <div className="flex items-center gap-1.5">
            <CalendarIcon className="h-4 w-4 text-ink-soft" />
            <input type="date" value={customRange.start} onChange={(e) => onCustomRange({ ...customRange, start: e.target.value })} className={selectClasses} />
            <span className="text-ink-soft">–</span>
            <input type="date" value={customRange.end} onChange={(e) => onCustomRange({ ...customRange, end: e.target.value })} className={selectClasses} />
          </div>
        )}

        <select value={comparisonKey} onChange={(e) => onComparisonKey(e.target.value as ComparisonKey)} className={selectClasses}>
          {COMPARISON_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              vs {o.label}
            </option>
          ))}
        </select>

        <div className="mx-1 h-6 w-px bg-line" />

        <FilterControls filters={filters} onFiltersChange={onFiltersChange} />

        {active && (
          <button type="button" onClick={onClearFilters} className="text-xs font-medium text-ink-soft underline decoration-line underline-offset-2 hover:text-brand">
            Clear Filters
          </button>
        )}

        <div className="ml-auto flex items-center gap-2">
          <ExportButton state={exportState} onExport={onExport} />
        </div>
      </div>

      {/* Mobile: compact bar with a bottom-sheet trigger */}
      <div className="flex items-center gap-2 md:hidden">
        <div className="flex flex-1 items-center gap-1 overflow-x-auto rounded-xl border border-line bg-surface p-1">
          {DATE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => onDateRangeKey(opt.value)}
              className={`shrink-0 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors ${dateRangeKey === opt.value ? "bg-brand text-white" : "text-ink-soft"}`}
            >
              {opt.label}
            </button>
          ))}
        </div>
        <button type="button" onClick={() => setMobileOpen(true)} className={`relative flex shrink-0 items-center gap-1 rounded-xl border px-3 py-2 text-sm ${active ? "border-brand/40 bg-brand/5" : "border-line bg-surface"}`}>
          <FilterIcon className="h-4 w-4" />
          {active && <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-accent" />}
        </button>
      </div>

      <p className="mt-2 text-xs text-ink-soft">
        Showing <span className="font-medium text-ink">{rangeLabel}</span> · comparing to {COMPARISON_OPTIONS.find((o) => o.value === comparisonKey)?.label.toLowerCase()}
      </p>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 flex items-end md:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMobileOpen(false)} />
          <div className="relative max-h-[85vh] w-full overflow-y-auto rounded-t-3xl bg-white p-5 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-base font-semibold text-ink">Filters</h3>
              <button type="button" onClick={() => setMobileOpen(false)} className="rounded-lg p-1.5 text-ink-soft hover:bg-paper">
                <CloseIcon className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-ink-soft uppercase">Comparison</label>
                <select value={comparisonKey} onChange={(e) => onComparisonKey(e.target.value as ComparisonKey)} className={`${selectClasses} w-full`}>
                  {COMPARISON_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      vs {o.label}
                    </option>
                  ))}
                </select>
              </div>
              {dateRangeKey === "custom" && (
                <div className="flex items-center gap-2">
                  <input type="date" value={customRange.start} onChange={(e) => onCustomRange({ ...customRange, start: e.target.value })} className={`${selectClasses} flex-1`} />
                  <input type="date" value={customRange.end} onChange={(e) => onCustomRange({ ...customRange, end: e.target.value })} className={`${selectClasses} flex-1`} />
                </div>
              )}
              <div className="flex flex-wrap gap-2">
                <FilterControls filters={filters} onFiltersChange={onFiltersChange} />
              </div>
            </div>

            <div className="mt-5 flex gap-2 border-t border-line pt-4">
              <button type="button" onClick={onClearFilters} className="flex-1 rounded-xl border border-line px-4 py-2.5 text-sm font-medium text-ink hover:bg-paper">
                Clear Filters
              </button>
              <button type="button" onClick={() => setMobileOpen(false)} className="flex-1 rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90">
                Show Results
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
