import { useMemo, useState } from "react";
import { agentPerformance, type AnalyticsEvent } from "../../../lib/analyticsData";
import { EmptyState, formatMinutes, formatNumber, formatPct, NavOutLink, SectionCard, SortHeader, TableSkeleton } from "../shared";

type SortKey = "leads" | "viewings" | "closed" | "conversion" | "avgResponseMinutes" | "contactRate" | "leadConversion" | "viewingConversion" | "closeRate" | "followUpsCompleted";

export default function AgentPerformanceSection({ events, loading, onNavigate }: { events: AnalyticsEvent[]; loading: boolean; onNavigate: (path: string) => void }) {
  const [sort, setSort] = useState<{ key: SortKey; dir: "asc" | "desc" }>({ key: "closed", dir: "desc" });
  const rows = useMemo(() => agentPerformance(events), [events]);

  const sorted = useMemo(() => {
    const copy = [...rows];
    copy.sort((a, b) => {
      const av = a[sort.key] ?? -1;
      const bv = b[sort.key] ?? -1;
      return sort.dir === "asc" ? av - bv : bv - av;
    });
    return copy;
  }, [rows, sort]);

  function toggleSort(key: SortKey) {
    setSort((prev) => (prev.key === key ? { key, dir: prev.dir === "desc" ? "asc" : "desc" } : { key, dir: "desc" }));
  }

  if (loading) {
    return (
      <SectionCard title="Agent Performance">
        <TableSkeleton rows={4} />
      </SectionCard>
    );
  }

  if (rows.length === 0) {
    return <EmptyState title="No analytics data available for this period." />;
  }

  return (
    <SectionCard title="Agent Performance" subtitle="Performance is more than lead count — response speed and follow-through matter too.">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-line">
              <th className="px-3 py-2 text-left text-xs font-medium tracking-wide text-ink-soft uppercase">Agent</th>
              <SortHeader label="Leads" sortKey="leads" active={sort} onClick={toggleSort} />
              <SortHeader label="Viewings" sortKey="viewings" active={sort} onClick={toggleSort} />
              <SortHeader label="Closed" sortKey="closed" active={sort} onClick={toggleSort} />
              <SortHeader label="Conversion" sortKey="conversion" active={sort} onClick={toggleSort} />
              <SortHeader label="Avg. Response" sortKey="avgResponseMinutes" active={sort} onClick={toggleSort} />
              <SortHeader label="Contact Rate" sortKey="contactRate" active={sort} onClick={toggleSort} />
              <SortHeader label="Viewing Conv." sortKey="viewingConversion" active={sort} onClick={toggleSort} />
              <SortHeader label="Close Rate" sortKey="closeRate" active={sort} onClick={toggleSort} />
              <SortHeader label="Follow-ups" sortKey="followUpsCompleted" active={sort} onClick={toggleSort} />
              <th className="px-3 py-2" />
            </tr>
          </thead>
          <tbody>
            {sorted.map((row) => (
              <tr key={row.agent} className="border-b border-line/60 last:border-0 hover:bg-paper/40">
                <td className="px-3 py-2.5 font-medium text-ink">{row.agent}</td>
                <td className="px-3 py-2.5 text-right tabular-nums">{formatNumber(row.leads)}</td>
                <td className="px-3 py-2.5 text-right tabular-nums">{formatNumber(row.viewings)}</td>
                <td className="px-3 py-2.5 text-right tabular-nums">{formatNumber(row.closed)}</td>
                <td className="px-3 py-2.5 text-right tabular-nums font-medium">{formatPct(row.conversion)}</td>
                <td className="px-3 py-2.5 text-right tabular-nums">{formatMinutes(row.avgResponseMinutes)}</td>
                <td className="px-3 py-2.5 text-right tabular-nums">{formatPct(row.contactRate, 0)}</td>
                <td className="px-3 py-2.5 text-right tabular-nums">{formatPct(row.viewingConversion, 0)}</td>
                <td className="px-3 py-2.5 text-right tabular-nums">{formatPct(row.closeRate, 0)}</td>
                <td className="px-3 py-2.5 text-right tabular-nums">{formatNumber(row.followUpsCompleted)}</td>
                <td className="px-3 py-2.5 text-right">
                  <NavOutLink label="View in Leads" onClick={() => onNavigate("/leads")} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </SectionCard>
  );
}
