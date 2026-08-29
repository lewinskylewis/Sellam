import { useMemo, useState } from "react";
import { buildTimeSeries, sourceBreakdown, type AnalyticsEvent, type DateRange, type Granularity } from "../../../lib/analyticsData";
import BarList from "../charts/BarList";
import LineAreaChart from "../charts/LineAreaChart";
import { ChartSkeleton, EmptyState, formatNumber, formatPct, KpiSkeleton, KpiTile, NavOutLink, SectionCard, SegmentedControl, TableSkeleton } from "../shared";

export default function EnquiriesSection({ events, prevEvents, range, comparisonLabel, loading, onNavigate }: { events: AnalyticsEvent[]; prevEvents: AnalyticsEvent[]; range: DateRange; comparisonLabel: string; loading: boolean; onNavigate: (path: string) => void }) {
  const [granularity, setGranularity] = useState<Granularity>("weekly");
  const series = useMemo(() => buildTimeSeries(events, range, granularity), [events, range, granularity]);
  const sources = useMemo(() => sourceBreakdown(events), [events]);
  const prevSources = useMemo(() => sourceBreakdown(prevEvents), [prevEvents]);

  if (loading) {
    return (
      <div className="space-y-5">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4"><KpiSkeleton /><KpiSkeleton /><KpiSkeleton /><KpiSkeleton /></div>
        <SectionCard title="Enquiry Activity"><ChartSkeleton /></SectionCard>
        <SectionCard title="Enquiry Sources"><TableSkeleton rows={6} /></SectionCard>
      </div>
    );
  }

  if (events.length === 0) {
    return <EmptyState title="No analytics data available for this period." hint="Try widening the date range or clearing filters." />;
  }

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <KpiTile label="Total Enquiries" value={formatNumber(events.length)} pct={prevEvents.length ? ((events.length - prevEvents.length) / prevEvents.length) * 100 : null} comparisonLabel={comparisonLabel} />
        <KpiTile label="Website Share" value={formatPct(sources.find((s) => s.source === "Website")?.pct ?? 0)} pct={null} comparisonLabel={comparisonLabel} />
        <KpiTile label="Distinct Sources" value={formatNumber(sources.length)} pct={null} comparisonLabel={comparisonLabel} />
        <KpiTile label="Avg. per Day" value={(events.length / Math.max(1, Math.round((range.end.getTime() - range.start.getTime()) / 86_400_000))).toFixed(1)} pct={null} comparisonLabel={comparisonLabel} />
      </div>

      <SectionCard
        title="Enquiry Activity"
        subtitle="How enquiry volume is trending across the selected period."
        action={<SegmentedControl value={granularity} onChange={setGranularity} options={[{ value: "daily", label: "Daily" }, { value: "weekly", label: "Weekly" }, { value: "monthly", label: "Monthly" }]} />}
      >
        <LineAreaChart data={series} />
      </SectionCard>

      <div className="grid gap-5 lg:grid-cols-2">
        <SectionCard title="Enquiry Sources" subtitle="Where enquiries are coming from.">
          <BarList items={sources.map((s) => ({ label: s.source, value: s.count, sublabel: formatPct(s.pct, 0) }))} valueFormat={(v) => formatNumber(v)} />
        </SectionCard>

        <SectionCard title="Source Comparison" subtitle={`Change vs ${comparisonLabel.toLowerCase()}.`}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line text-xs text-ink-soft uppercase">
                  <th className="px-2 py-2 text-left">Source</th>
                  <th className="px-2 py-2 text-right">This period</th>
                  <th className="px-2 py-2 text-right">{comparisonLabel}</th>
                  <th className="px-2 py-2 text-right">Change</th>
                </tr>
              </thead>
              <tbody>
                {sources.map((s) => {
                  const prev = prevSources.find((p) => p.source === s.source)?.count ?? 0;
                  const change = prev ? ((s.count - prev) / prev) * 100 : null;
                  return (
                    <tr key={s.source} className="border-b border-line/60 last:border-0">
                      <td className="px-2 py-2 font-medium text-ink">{s.source}</td>
                      <td className="px-2 py-2 text-right tabular-nums">{s.count}</td>
                      <td className="px-2 py-2 text-right tabular-nums text-ink-soft">{prev}</td>
                      <td className={`px-2 py-2 text-right tabular-nums font-medium ${change == null ? "text-ink-soft" : change >= 0 ? "text-status-green-text" : "text-rose-600"}`}>
                        {change == null ? "—" : `${change >= 0 ? "+" : ""}${change.toFixed(0)}%`}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="mt-3">
            <NavOutLink label="View Enquiries" onClick={() => onNavigate("/enquiries")} />
          </div>
        </SectionCard>
      </div>
    </div>
  );
}
