import { useMemo } from "react";
import { websitePerformance, type AnalyticsEvent, type DateRange, type Granularity } from "../../../lib/analyticsData";
import BarList from "../charts/BarList";
import SimpleLineChart from "../charts/SimpleLineChart";
import { ChartSkeleton, EmptyState, formatNumber, formatPct, KpiSkeleton, KpiTile, SectionCard } from "../shared";

export default function WebsitePerformanceSection({ events, range, loading }: { events: AnalyticsEvent[]; range: DateRange; loading: boolean }) {
  const granularity: Granularity = useMemo(() => {
    const days = (range.end.getTime() - range.start.getTime()) / 86_400_000;
    return days > 95 ? "monthly" : days > 16 ? "weekly" : "daily";
  }, [range]);

  const site = useMemo(() => websitePerformance(events, range, granularity), [events, range, granularity]);

  if (loading) {
    return (
      <div className="space-y-5">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <KpiSkeleton />
          <KpiSkeleton />
          <KpiSkeleton />
          <KpiSkeleton />
        </div>
        <SectionCard title="Website Visitors">
          <ChartSkeleton />
        </SectionCard>
      </div>
    );
  }

  if (events.length === 0) {
    return <EmptyState title="No analytics data available for this period." />;
  }

  const withRates = site.mostViewed.map((row) => ({ ...row, viewToEnquiry: row.views > 0 ? (row.enquiries / row.views) * 100 : 0 }));
  const highTrafficLowConversion = [...withRates].sort((a, b) => b.views - a.views).find((r) => r.viewToEnquiry < 1.2);
  const lowTrafficHighConversion = [...withRates].filter((r) => r.views < withRates.reduce((s, x) => s + x.views, 0) / withRates.length).sort((a, b) => b.viewToEnquiry - a.viewToEnquiry)[0];

  return (
    <div className="space-y-5">
      <p className="rounded-xl border border-line bg-paper/50 px-4 py-2.5 text-xs text-ink-soft">
        Website performance is simulated for this demo — it is not connected to Google Analytics, Search Console, or any real traffic source.
      </p>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <KpiTile label="Website Visitors" value={formatNumber(site.visitors)} pct={null} comparisonLabel="" />
        <KpiTile label="Property Page Views" value={formatNumber(site.pageViews)} pct={null} comparisonLabel="" />
        <KpiTile label="Enquiry Submissions" value={formatNumber(site.enquirySubmissions)} pct={null} comparisonLabel="" />
        <KpiTile label="Visitor → Enquiry" value={formatPct(site.conversionRate, 2)} pct={null} comparisonLabel="" />
      </div>

      <SectionCard title="Website Visitors" subtitle="Simulated traffic over the selected period.">
        <SimpleLineChart data={site.series.map((s) => ({ key: s.key, label: s.label, date: s.date, value: s.visitors }))} valueLabel="Visitors" valueFormat={(v) => formatNumber(v)} color="#3b5bdb" />
      </SectionCard>

      <div className="grid gap-5 lg:grid-cols-2">
        <SectionCard title="Property Engagement" subtitle="Views → Enquiries → Leads, most viewed first.">
          <div className="space-y-4">
            {withRates.map((row) => (
              <div key={row.property.id} className="rounded-xl border border-line p-3">
                <p className="text-sm font-medium text-ink">{row.property.title}</p>
                <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-ink-soft">
                  <span className="font-medium text-ink">{formatNumber(row.views)} views</span>
                  <span>↓</span>
                  <span className="font-medium text-ink">{formatNumber(row.enquiries)} enquiries</span>
                  <span>↓</span>
                  <span className="font-medium text-ink">{formatNumber(row.leads)} leads</span>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>

        <div className="space-y-5">
          <SectionCard title="Traffic Sources">
            <BarList items={site.trafficSources.map((s) => ({ label: s.source, value: s.pct }))} valueFormat={(v) => formatPct(v, 0)} color="#1f3a63" />
          </SectionCard>

          {highTrafficLowConversion && (
            <SectionCard title="High Traffic / Low Conversion">
              <p className="text-sm text-ink">
                <span className="font-medium">{highTrafficLowConversion.property.title}</span> is attracting strong traffic but converting at only {highTrafficLowConversion.viewToEnquiry.toFixed(1)}% — a potential listing or CTA indicator, not a confirmed diagnosis.
              </p>
            </SectionCard>
          )}
          {lowTrafficHighConversion && (
            <SectionCard title="Low Traffic / High Conversion">
              <p className="text-sm text-ink">
                <span className="font-medium">{lowTrafficHighConversion.property.title}</span> converts well relative to its traffic ({lowTrafficHighConversion.viewToEnquiry.toFixed(1)}%) and may benefit from more exposure.
              </p>
            </SectionCard>
          )}
        </div>
      </div>
    </div>
  );
}
