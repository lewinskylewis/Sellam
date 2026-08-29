import { useMemo } from "react";
import { funnelConversions, funnelSteps, type AnalyticsEvent } from "../../../lib/analyticsData";
import FunnelChart from "../charts/FunnelChart";
import { ChartSkeleton, EmptyState, SectionCard } from "../shared";

export default function FunnelSection({ events, loading }: { events: AnalyticsEvent[]; loading: boolean }) {
  const steps = useMemo(() => funnelSteps(events), [events]);
  const conversions = useMemo(() => funnelConversions(steps), [steps]);

  if (loading) {
    return (
      <SectionCard title="Lead Funnel">
        <ChartSkeleton height={360} />
      </SectionCard>
    );
  }

  if (events.length === 0) {
    return <EmptyState title="No analytics data available for this period." />;
  }

  const weakest = conversions.filter((c) => c.rate != null).sort((a, b) => (a.rate ?? 100) - (b.rate ?? 100))[0];
  const strongest = conversions.filter((c) => c.rate != null).sort((a, b) => (b.rate ?? 0) - (a.rate ?? 0))[0];

  return (
    <div className="space-y-5">
      <div className="grid gap-5 lg:grid-cols-3">
        <SectionCard title="Lead Funnel" subtitle="Enquiries progressing through each stage of the pipeline." className="lg:col-span-2">
          <FunnelChart steps={steps} conversions={conversions} />
        </SectionCard>

        <div className="space-y-5">
          <SectionCard title="Stage Conversion Rates">
            <ul className="space-y-3">
              {conversions.map((c) => (
                <li key={`${c.from}-${c.to}`} className="flex items-center justify-between text-sm">
                  <span className="text-ink-soft">
                    {c.from} → {c.to}
                  </span>
                  <span className={`font-semibold ${c.rate != null && c.rate < 40 ? "text-rose-600" : "text-ink"}`}>{c.rate != null ? `${c.rate.toFixed(0)}%` : "—"}</span>
                </li>
              ))}
            </ul>
          </SectionCard>

          {weakest && weakest.rate != null && (
            <SectionCard title="Biggest drop-off">
              <p className="text-sm text-ink">
                <span className="font-semibold">{(100 - weakest.rate).toFixed(0)}%</span> of {weakest.from.toLowerCase()} enquiries do not progress to {weakest.to.toLowerCase()}. This is the largest single loss point in the pipeline for the selected period.
              </p>
            </SectionCard>
          )}
          {strongest && strongest.rate != null && (
            <SectionCard title="Strongest conversion">
              <p className="text-sm text-ink">
                {strongest.from} is converting to {strongest.to.toLowerCase()} at <span className="font-semibold">{strongest.rate.toFixed(0)}%</span> — the strongest step in the current funnel.
              </p>
            </SectionCard>
          )}
        </div>
      </div>
    </div>
  );
}
