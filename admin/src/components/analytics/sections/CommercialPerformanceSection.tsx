import { useMemo } from "react";
import { commercialPerformance, type AnalyticsEvent, type CommercialBreakdownRow } from "../../../lib/analyticsData";
import { EmptyState, formatMoneyKES, formatNumber, KpiSkeleton, KpiTile, SectionCard, TableSkeleton } from "../shared";

function BreakdownTable({ rows }: { rows: CommercialBreakdownRow[] }) {
  if (rows.length === 0) return <p className="text-sm text-ink-soft">Not enough data to calculate this metric.</p>;
  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b border-line text-xs text-ink-soft uppercase">
          <th className="px-2 py-2 text-left">Segment</th>
          <th className="px-2 py-2 text-right">Pipeline Value</th>
          <th className="px-2 py-2 text-right">Closed Value</th>
          <th className="px-2 py-2 text-right">Closed Deals</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r) => (
          <tr key={r.label} className="border-b border-line/60 last:border-0">
            <td className="px-2 py-2 font-medium text-ink">{r.label}</td>
            <td className="px-2 py-2 text-right tabular-nums">{r.pipelineValue > 0 ? formatMoneyKES(r.pipelineValue) : "—"}</td>
            <td className="px-2 py-2 text-right tabular-nums">{r.closedValue > 0 ? formatMoneyKES(r.closedValue) : "—"}</td>
            <td className="px-2 py-2 text-right tabular-nums">{r.closedDeals > 0 ? formatNumber(r.closedDeals) : "—"}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default function CommercialPerformanceSection({ events, loading }: { events: AnalyticsEvent[]; loading: boolean }) {
  const commercial = useMemo(() => commercialPerformance(events), [events]);

  if (loading) {
    return (
      <div className="space-y-5">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <KpiSkeleton />
          <KpiSkeleton />
          <KpiSkeleton />
          <KpiSkeleton />
        </div>
        <SectionCard title="Breakdown">
          <TableSkeleton rows={4} />
        </SectionCard>
      </div>
    );
  }

  if (events.length === 0) {
    return <EmptyState title="No analytics data available for this period." />;
  }

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <KpiTile label="Pipeline Value" value={formatMoneyKES(commercial.pipelineValue)} pct={null} comparisonLabel="" />
        <KpiTile label="Closed Value" value={formatMoneyKES(commercial.closedValue)} pct={null} comparisonLabel="" />
        <KpiTile label="Avg. Deal Value" value={commercial.avgDealValue != null ? formatMoneyKES(commercial.avgDealValue) : "—"} pct={null} comparisonLabel="" />
        <KpiTile label="Closed Deals" value={formatNumber(commercial.closedDeals)} pct={null} comparisonLabel="" />
      </div>

      <p className="rounded-xl border border-line bg-paper/50 px-4 py-2.5 text-xs text-ink-soft">
        <span className="font-medium text-ink">Listing Value</span> (pipeline) is the estimated value of active, qualified opportunities based on listing price. <span className="font-medium text-ink">Closed Value</span> reflects only opportunities that actually reached Won.
        These are estimates from mock data, not real transactions.
      </p>

      <div className="grid gap-5 lg:grid-cols-2">
        <SectionCard title="By Listing Type">
          <BreakdownTable rows={commercial.byListingType} />
        </SectionCard>
        <SectionCard title="By Community">
          <BreakdownTable rows={commercial.byCommunity} />
        </SectionCard>
        <SectionCard title="By Property Type">
          <BreakdownTable rows={commercial.byPropertyType} />
        </SectionCard>
        <SectionCard title="By Agent">
          <BreakdownTable rows={commercial.byAgent} />
        </SectionCard>
      </div>
    </div>
  );
}
