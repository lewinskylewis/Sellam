import { useMemo, useState } from "react";
import {
  buildInsights,
  buildTimeSeries,
  communityPerformance,
  computeKpis,
  funnelConversions,
  funnelSteps,
  pctChange,
  propertyPerformance,
  sourceBreakdown,
  type AnalyticsEvent,
  type DateRange,
  type Granularity,
} from "../../../lib/analyticsData";
import BarList from "../charts/BarList";
import FunnelChart from "../charts/FunnelChart";
import LineAreaChart from "../charts/LineAreaChart";
import { ChartSkeleton, formatMinutes, formatNumber, formatPct, InsightsList, KpiSkeleton, KpiTile, NavOutLink, SectionCard, SegmentedControl } from "../shared";

function defaultGranularity(range: DateRange): Granularity {
  const days = (range.end.getTime() - range.start.getTime()) / 86_400_000;
  if (days > 95) return "monthly";
  if (days > 16) return "weekly";
  return "daily";
}

export default function OverviewSection({
  events,
  prevEvents,
  range,
  comparisonLabel,
  loading,
  onNavigate,
  onJumpToSection,
}: {
  events: AnalyticsEvent[];
  prevEvents: AnalyticsEvent[];
  range: DateRange;
  comparisonLabel: string;
  loading: boolean;
  onNavigate: (path: string) => void;
  onJumpToSection: (id: string) => void;
}) {
  const [granularity, setGranularity] = useState<Granularity>(() => defaultGranularity(range));

  const kpi = useMemo(() => computeKpis(events), [events]);
  const prevKpi = useMemo(() => computeKpis(prevEvents), [prevEvents]);
  const series = useMemo(() => buildTimeSeries(events, range, granularity), [events, range, granularity]);
  const sources = useMemo(() => sourceBreakdown(events).slice(0, 6), [events]);
  const steps = useMemo(() => funnelSteps(events), [events]);
  const conversions = useMemo(() => funnelConversions(steps), [steps]);
  const insights = useMemo(() => buildInsights(events, prevEvents, comparisonLabel), [events, prevEvents, comparisonLabel]);

  const topProperty = useMemo(() => propertyPerformance(events).sort((a, b) => b.enquiries - a.enquiries)[0] ?? null, [events]);
  const topCommunity = useMemo(() => communityPerformance(events)[0] ?? null, [events]);

  const weakest = useMemo(() => conversions.filter((c) => c.rate != null).sort((a, b) => (a.rate ?? 100) - (b.rate ?? 100))[0], [conversions]);
  const strongest = useMemo(() => conversions.filter((c) => c.rate != null).sort((a, b) => (b.rate ?? 0) - (a.rate ?? 0))[0], [conversions]);

  if (loading) {
    return (
      <div className="space-y-5">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <KpiSkeleton key={i} />
          ))}
        </div>
        <SectionCard title="Enquiry Activity">
          <ChartSkeleton />
        </SectionCard>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
        <KpiTile label="Enquiries" value={formatNumber(kpi.enquiries)} pct={pctChange(kpi.enquiries, prevKpi.enquiries)} comparisonLabel={comparisonLabel} />
        <KpiTile label="Qualified Leads" value={formatNumber(kpi.qualifiedLeads)} pct={pctChange(kpi.qualifiedLeads, prevKpi.qualifiedLeads)} comparisonLabel={comparisonLabel} />
        <KpiTile label="Viewings" value={formatNumber(kpi.viewings)} pct={pctChange(kpi.viewings, prevKpi.viewings)} comparisonLabel={comparisonLabel} />
        <KpiTile label="Closed" value={formatNumber(kpi.closed)} pct={pctChange(kpi.closed, prevKpi.closed)} comparisonLabel={comparisonLabel} />
        <KpiTile label="Conversion Rate" value={formatPct(kpi.conversionRate)} pct={kpi.conversionRate != null && prevKpi.conversionRate != null ? kpi.conversionRate - prevKpi.conversionRate : null} comparisonLabel={comparisonLabel} />
        <KpiTile label="Avg. Response Time" value={formatMinutes(kpi.avgResponseMinutes)} pct={kpi.avgResponseMinutes != null && prevKpi.avgResponseMinutes != null ? pctChange(kpi.avgResponseMinutes, prevKpi.avgResponseMinutes) : null} comparisonLabel={comparisonLabel} invert />
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <SectionCard
          title="Enquiry Activity"
          subtitle="Enquiry volume over time, with leads and viewings for the same period."
          action={<SegmentedControl value={granularity} onChange={setGranularity} options={[{ value: "daily", label: "Daily" }, { value: "weekly", label: "Weekly" }, { value: "monthly", label: "Monthly" }]} />}
          className="lg:col-span-2"
        >
          <LineAreaChart data={series} />
        </SectionCard>

        <SectionCard title="Enquiry Sources" subtitle="Share of enquiries by channel." action={<button type="button" onClick={() => onJumpToSection("enquiries")} className="text-xs font-medium text-link hover:underline">View detail</button>}>
          <BarList items={sources.map((s) => ({ label: s.source, value: s.count, sublabel: formatPct(s.pct, 0) }))} valueFormat={(v) => formatNumber(v)} />
        </SectionCard>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <SectionCard title="Lead Funnel" subtitle="Enquiries progressing through each stage of the pipeline." className="lg:col-span-2" action={<button type="button" onClick={() => onJumpToSection("funnel")} className="text-xs font-medium text-link hover:underline">View detail</button>}>
          <FunnelChart steps={steps} conversions={conversions} />
        </SectionCard>

        <div className="space-y-5">
          {weakest && weakest.rate != null && (
            <SectionCard title="Biggest drop-off">
              <p className="text-sm text-ink">
                <span className="font-semibold">{(100 - weakest.rate).toFixed(0)}%</span> of {weakest.from.toLowerCase()} enquiries do not progress to {weakest.to.toLowerCase()}.
              </p>
            </SectionCard>
          )}
          {strongest && strongest.rate != null && (
            <SectionCard title="Strongest conversion">
              <p className="text-sm text-ink">
                {strongest.from} is converting to {strongest.to.toLowerCase()} at <span className="font-semibold">{strongest.rate.toFixed(0)}%</span>.
              </p>
            </SectionCard>
          )}
        </div>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        {topProperty && (
          <SectionCard title="Highest Demand Property">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-ink">{topProperty.property.title}</p>
                <p className="text-sm text-ink-soft">{topProperty.enquiries} enquiries · {topProperty.leads} leads · {formatPct(topProperty.conversion)} conversion</p>
              </div>
              <NavOutLink label="View Property" onClick={() => onNavigate("/properties")} />
            </div>
          </SectionCard>
        )}
        {topCommunity && (
          <SectionCard title="Most Requested Community">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-ink">{topCommunity.community}</p>
                <p className="text-sm text-ink-soft">{topCommunity.enquiries} enquiries · {formatPct(topCommunity.conversion)} conversion</p>
              </div>
              <NavOutLink label="View Communities" onClick={() => onNavigate("/communities")} />
            </div>
          </SectionCard>
        )}
      </div>

      <SectionCard title="Insights" subtitle="Deterministic observations based on the current filters and date range.">
        <InsightsList insights={insights} />
      </SectionCard>
    </div>
  );
}
