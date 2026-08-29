import { useMemo, useState } from "react";
import { communityPerformance, type AnalyticsEvent } from "../../../lib/analyticsData";
import BarList from "../charts/BarList";
import { EmptyState, formatNumber, formatPct, NavOutLink, SectionCard, SortHeader, TableSkeleton } from "../shared";

type SortKey = "enquiries" | "leads" | "viewings" | "closed" | "conversion";

export default function CommunitiesSection({ events, loading, onNavigate }: { events: AnalyticsEvent[]; loading: boolean; onNavigate: (path: string) => void }) {
  const [sort, setSort] = useState<{ key: SortKey; dir: "asc" | "desc" }>({ key: "enquiries", dir: "desc" });
  const rows = useMemo(() => communityPerformance(events), [events]);

  const sorted = useMemo(() => {
    const copy = [...rows];
    copy.sort((a, b) => {
      const av = sort.key === "conversion" ? a.conversion ?? -1 : a[sort.key];
      const bv = sort.key === "conversion" ? b.conversion ?? -1 : b[sort.key];
      return sort.dir === "asc" ? av - bv : bv - av;
    });
    return copy;
  }, [rows, sort]);

  function toggleSort(key: SortKey) {
    setSort((prev) => (prev.key === key ? { key, dir: prev.dir === "desc" ? "asc" : "desc" } : { key, dir: "desc" }));
  }

  if (loading) {
    return (
      <SectionCard title="Most Requested Communities">
        <TableSkeleton rows={6} />
      </SectionCard>
    );
  }

  if (rows.length === 0) {
    return <EmptyState title="No analytics data available for this period." />;
  }

  const byDemand = [...rows].sort((a, b) => b.enquiries - a.enquiries);
  const byConversion = [...rows].filter((r) => r.enquiries >= 3 && r.conversion != null).sort((a, b) => (b.conversion ?? 0) - (a.conversion ?? 0));

  return (
    <div className="space-y-5">
      <div className="grid gap-5 lg:grid-cols-2">
        <SectionCard title="Most Requested Communities" subtitle="Relative demand by enquiry volume.">
          <BarList items={byDemand.slice(0, 8).map((c) => ({ label: c.community, value: c.enquiries }))} valueFormat={(v) => formatNumber(v)} color="#b08d57" />
        </SectionCard>

        <SectionCard title="Demand vs Conversion" subtitle="High demand and high conversion are not always the same community.">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line text-xs text-ink-soft uppercase">
                  <th className="px-2 py-2 text-left">Community</th>
                  <th className="px-2 py-2 text-right">Enquiries</th>
                  <th className="px-2 py-2 text-right">Conversion</th>
                </tr>
              </thead>
              <tbody>
                {byConversion.slice(0, 8).map((c) => (
                  <tr key={c.community} className="border-b border-line/60 last:border-0">
                    <td className="px-2 py-2 font-medium text-ink">{c.community}</td>
                    <td className="px-2 py-2 text-right tabular-nums">{c.enquiries}</td>
                    <td className="px-2 py-2 text-right tabular-nums font-medium">{formatPct(c.conversion)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </SectionCard>
      </div>

      <SectionCard title="Community Performance" subtitle="Full breakdown for the selected period.">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line">
                <th className="px-3 py-2 text-left text-xs font-medium tracking-wide text-ink-soft uppercase">Community</th>
                <SortHeader label="Enquiries" sortKey="enquiries" active={sort} onClick={toggleSort} />
                <SortHeader label="Leads" sortKey="leads" active={sort} onClick={toggleSort} />
                <SortHeader label="Viewings" sortKey="viewings" active={sort} onClick={toggleSort} />
                <SortHeader label="Closed" sortKey="closed" active={sort} onClick={toggleSort} />
                <SortHeader label="Conversion" sortKey="conversion" active={sort} onClick={toggleSort} />
                <th className="px-3 py-2" />
              </tr>
            </thead>
            <tbody>
              {sorted.map((c) => (
                <tr key={c.community} className="border-b border-line/60 last:border-0 hover:bg-paper/40">
                  <td className="px-3 py-2.5 font-medium text-ink">{c.community}</td>
                  <td className="px-3 py-2.5 text-right tabular-nums">{formatNumber(c.enquiries)}</td>
                  <td className="px-3 py-2.5 text-right tabular-nums">{formatNumber(c.leads)}</td>
                  <td className="px-3 py-2.5 text-right tabular-nums">{formatNumber(c.viewings)}</td>
                  <td className="px-3 py-2.5 text-right tabular-nums">{formatNumber(c.closed)}</td>
                  <td className="px-3 py-2.5 text-right tabular-nums font-medium">{formatPct(c.conversion)}</td>
                  <td className="px-3 py-2.5 text-right">
                    <NavOutLink label="View Communities" onClick={() => onNavigate("/communities")} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>
    </div>
  );
}
