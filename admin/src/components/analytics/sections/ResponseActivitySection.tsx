import { useMemo } from "react";
import { responseTimeAnalytics, type AnalyticsEvent, type DateRange } from "../../../lib/analyticsData";
import BarList from "../charts/BarList";
import SimpleLineChart from "../charts/SimpleLineChart";
import { ChartSkeleton, EmptyState, formatMinutes, formatPct, KpiSkeleton, KpiTile, SectionCard } from "../shared";

export default function ResponseActivitySection({ events, range, loading }: { events: AnalyticsEvent[]; range: DateRange; loading: boolean }) {
  const stats = useMemo(() => responseTimeAnalytics(events, range), [events, range]);

  if (loading) {
    return (
      <div className="space-y-5">
        <div className="grid grid-cols-3 gap-3">
          <KpiSkeleton />
          <KpiSkeleton />
          <KpiSkeleton />
        </div>
        <SectionCard title="Average Response Time">
          <ChartSkeleton />
        </SectionCard>
      </div>
    );
  }

  if (events.length === 0 || stats.avgMinutes == null) {
    return <EmptyState title="No analytics data available for this period." hint="Not enough responded enquiries to calculate response-time metrics." />;
  }

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <KpiTile label="Average First Response" value={formatMinutes(stats.avgMinutes)} pct={null} comparisonLabel="" />
        <KpiTile label="Fastest Response" value={formatMinutes(stats.fastestMinutes)} pct={null} comparisonLabel="" />
        <KpiTile label="Slowest Response" value={formatMinutes(stats.slowestMinutes)} pct={null} comparisonLabel="" />
      </div>

      <SectionCard title="Average Response Time" subtitle="Weekly average time-to-first-response.">
        <SimpleLineChart data={stats.series.map((s) => ({ key: s.key, label: s.label, date: s.date, value: s.avgMinutes }))} valueLabel="Avg. response" valueFormat={(v) => formatMinutes(v)} />
      </SectionCard>

      <SectionCard title="Response Time vs Conversion" subtitle="Conversion rate by how quickly the first response was sent.">
        <BarList items={stats.byBucket.filter((b) => b.total > 0).map((b) => ({ label: b.bucket, value: b.conversion ?? 0, sublabel: `${b.total} enquiries` }))} valueFormat={(v) => formatPct(v)} color="#3b5bdb" />
        <p className="mt-3 text-xs text-ink-soft">Conversion is measured within each response-time group for the selected period.</p>
      </SectionCard>
    </div>
  );
}
