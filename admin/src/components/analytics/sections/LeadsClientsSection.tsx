import { useMemo } from "react";
import { leadLifecycle, leadSourceQuality, type AnalyticsEvent } from "../../../lib/analyticsData";
import { EmptyState, formatNumber, formatPct, NavOutLink, SectionCard, TableSkeleton } from "../shared";

const LIFECYCLE_ORDER = ["Enquiry", "Contacted", "Qualified", "Viewing", "Negotiation", "Won", "Lost"] as const;

export default function LeadsClientsSection({ events, loading, onNavigate }: { events: AnalyticsEvent[]; loading: boolean; onNavigate: (path: string) => void }) {
  const lifecycle = useMemo(() => leadLifecycle(events), [events]);
  const sourceQuality = useMemo(() => leadSourceQuality(events), [events]);

  if (loading) {
    return (
      <SectionCard title="Lead Lifecycle">
        <TableSkeleton rows={7} />
      </SectionCard>
    );
  }

  if (events.length === 0) {
    return <EmptyState title="No analytics data available for this period." />;
  }

  const max = Math.max(1, ...lifecycle.map((l) => l.count));

  return (
    <div className="space-y-5">
      <SectionCard title="Lead Lifecycle" subtitle="Where prospects currently sit in the relationship — mirrors the Leads & Clients pipeline." action={<NavOutLink label="Open Leads & Clients" onClick={() => onNavigate("/leads")} />}>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
          {LIFECYCLE_ORDER.map((stage) => {
            const row = lifecycle.find((l) => l.stage === stage);
            const count = row?.count ?? 0;
            return (
              <div key={stage} className="rounded-xl border border-line bg-paper/40 p-3">
                <p className="text-xs font-medium tracking-wide text-ink-soft uppercase">{stage}</p>
                <p className="mt-1 text-xl font-semibold text-ink">{count}</p>
                <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-white">
                  <div className="h-full rounded-full bg-brand" style={{ width: `${(count / max) * 100}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </SectionCard>

      <SectionCard title="Lead Sources — Volume vs Quality" subtitle="Source volume and how those leads actually convert.">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line text-xs text-ink-soft uppercase">
                <th className="px-3 py-2 text-left">Source</th>
                <th className="px-3 py-2 text-right">Leads</th>
                <th className="px-3 py-2 text-right">Viewings</th>
                <th className="px-3 py-2 text-right">Closed</th>
                <th className="px-3 py-2 text-right">Close Rate</th>
              </tr>
            </thead>
            <tbody>
              {sourceQuality.map((row) => (
                <tr key={row.source} className="border-b border-line/60 last:border-0">
                  <td className="px-3 py-2.5 font-medium text-ink">{row.source}</td>
                  <td className="px-3 py-2.5 text-right tabular-nums">{formatNumber(row.leads)}</td>
                  <td className="px-3 py-2.5 text-right tabular-nums">{formatNumber(row.viewings)}</td>
                  <td className="px-3 py-2.5 text-right tabular-nums">{formatNumber(row.closed)}</td>
                  <td className="px-3 py-2.5 text-right tabular-nums font-medium">{formatPct(row.closeRate)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-xs text-ink-soft">Volume and quality are different metrics — a source with fewer leads can still close at a higher rate.</p>
      </SectionCard>
    </div>
  );
}
