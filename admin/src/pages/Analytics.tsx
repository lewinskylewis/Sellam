import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ANALYTICS_EVENTS,
  emptyFilters,
  filterEvents,
  hasActiveFilters,
  resolveComparisonRange,
  resolveDateRange,
  type AnalyticsFilters,
  type ComparisonKey,
  type DateRangeKey,
} from "../lib/analyticsData";
import FiltersBar, { type ExportState } from "../components/analytics/FiltersBar";
import { ErrorState } from "../components/analytics/shared";
import OverviewSection from "../components/analytics/sections/OverviewSection";
import EnquiriesSection from "../components/analytics/sections/EnquiriesSection";
import FunnelSection from "../components/analytics/sections/FunnelSection";
import PropertiesSection from "../components/analytics/sections/PropertiesSection";
import CommunitiesSection from "../components/analytics/sections/CommunitiesSection";
import LeadsClientsSection from "../components/analytics/sections/LeadsClientsSection";
import AgentPerformanceSection from "../components/analytics/sections/AgentPerformanceSection";
import ResponseActivitySection from "../components/analytics/sections/ResponseActivitySection";
import WebsitePerformanceSection from "../components/analytics/sections/WebsitePerformanceSection";
import CommercialPerformanceSection from "../components/analytics/sections/CommercialPerformanceSection";

type SectionId = "overview" | "enquiries" | "funnel" | "properties" | "communities" | "leads" | "agents" | "response" | "website" | "commercial";

const SECTIONS: { id: SectionId; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "enquiries", label: "Enquiries" },
  { id: "funnel", label: "Lead Funnel" },
  { id: "properties", label: "Properties" },
  { id: "communities", label: "Communities" },
  { id: "leads", label: "Leads & Clients" },
  { id: "agents", label: "Agent Performance" },
  { id: "response", label: "Response & Activity" },
  { id: "website", label: "Website Performance" },
  { id: "commercial", label: "Commercial Performance" },
];

export default function Analytics() {
  const navigate = useNavigate();
  const [section, setSection] = useState<SectionId>("overview");

  const [dateRangeKey, setDateRangeKey] = useState<DateRangeKey>("30d");
  const [customRange, setCustomRange] = useState({ start: "", end: "" });
  const [comparisonKey, setComparisonKey] = useState<ComparisonKey>("previous_period");
  const [filters, setFilters] = useState<AnalyticsFilters>(emptyFilters());

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [exportState, setExportState] = useState<ExportState>("idle");
  const loadToken = useRef(0);

  const range = useMemo(() => resolveDateRange(dateRangeKey, customRange), [dateRangeKey, customRange]);
  const comparisonRange = useMemo(() => resolveComparisonRange(range, comparisonKey), [range, comparisonKey]);
  const comparisonLabel = comparisonKey === "previous_period" ? "Previous period" : comparisonKey === "previous_month" ? "Previous month" : "Previous year";

  function runLoad() {
    const token = ++loadToken.current;
    setLoading(true);
    setError(false);
    const delay = 420 + Math.random() * 380;
    window.setTimeout(() => {
      if (loadToken.current !== token) return;
      // Small simulated failure chance, purely to demonstrate the error/retry
      // state — this is mock/local only, nothing actually failed.
      if (Math.random() < 0.1) {
        setError(true);
        setLoading(false);
        return;
      }
      setLoading(false);
    }, delay);
  }

  useEffect(() => {
    runLoad();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateRangeKey, customRange.start, customRange.end, comparisonKey, JSON.stringify(filters)]);

  const events = useMemo(() => filterEvents(ANALYTICS_EVENTS, range, filters), [range, filters]);
  const prevEvents = useMemo(() => filterEvents(ANALYTICS_EVENTS, comparisonRange, filters), [comparisonRange, filters]);

  function handleExport() {
    setExportState("preparing");
    window.setTimeout(() => {
      setExportState("ready");
      window.setTimeout(() => setExportState("idle"), 2200);
    }, 1100);
  }

  const rangeLabel = `${range.start.toLocaleDateString(undefined, { month: "short", day: "numeric" })} – ${range.end.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}`;

  function renderSection() {
    if (error) return <ErrorState onRetry={runLoad} />;

    switch (section) {
      case "overview":
        return <OverviewSection events={events} prevEvents={prevEvents} range={range} comparisonLabel={comparisonLabel} loading={loading} onNavigate={navigate} onJumpToSection={(id) => setSection(id as SectionId)} />;
      case "enquiries":
        return <EnquiriesSection events={events} prevEvents={prevEvents} range={range} comparisonLabel={comparisonLabel} loading={loading} onNavigate={navigate} />;
      case "funnel":
        return <FunnelSection events={events} loading={loading} />;
      case "properties":
        return <PropertiesSection events={events} loading={loading} onNavigate={navigate} />;
      case "communities":
        return <CommunitiesSection events={events} loading={loading} onNavigate={navigate} />;
      case "leads":
        return <LeadsClientsSection events={events} loading={loading} onNavigate={navigate} />;
      case "agents":
        return <AgentPerformanceSection events={events} loading={loading} onNavigate={navigate} />;
      case "response":
        return <ResponseActivitySection events={events} range={range} loading={loading} />;
      case "website":
        return <WebsitePerformanceSection events={events} range={range} loading={loading} />;
      case "commercial":
        return <CommercialPerformanceSection events={events} loading={loading} />;
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-ink">Analytics</h1>
          <p className="mt-1 text-ink-soft">Understand Sellam's performance, demand and conversion across the business.</p>
        </div>
      </div>

      <FiltersBar
        dateRangeKey={dateRangeKey}
        onDateRangeKey={setDateRangeKey}
        customRange={customRange}
        onCustomRange={setCustomRange}
        comparisonKey={comparisonKey}
        onComparisonKey={setComparisonKey}
        filters={filters}
        onFiltersChange={setFilters}
        onClearFilters={() => setFilters(emptyFilters())}
        exportState={exportState}
        onExport={handleExport}
        rangeLabel={rangeLabel}
      />

      <div className="mt-5 flex gap-1.5 overflow-x-auto border-b border-line pb-px">
        {SECTIONS.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => setSection(s.id)}
            className={`shrink-0 rounded-t-lg border-b-2 px-3.5 py-2.5 text-sm font-medium whitespace-nowrap transition-colors ${
              section === s.id ? "border-brand text-ink" : "border-transparent text-ink-soft hover:text-ink"
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      <div className="mt-5">{renderSection()}</div>

      {!loading && !error && events.length === 0 && (
        <p className="mt-3 text-center text-xs text-ink-soft">
          No activity matches the selected filters. {hasActiveFilters(filters) && "Try clearing filters or widening the date range."}
        </p>
      )}
    </div>
  );
}
