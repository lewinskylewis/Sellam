import { useMemo, useState } from "react";
import { propertyPerformance, type AnalyticsEvent, type PropertyPerformance } from "../../../lib/analyticsData";
import { EmptyState, formatNumber, formatPct, NavOutLink, SectionCard, SortHeader, TableSkeleton } from "../shared";

type SortKey = "enquiries" | "leads" | "viewings" | "conversion" | "closed";

export default function PropertiesSection({ events, loading, onNavigate }: { events: AnalyticsEvent[]; loading: boolean; onNavigate: (path: string) => void }) {
  const [sort, setSort] = useState<{ key: SortKey; dir: "asc" | "desc" }>({ key: "enquiries", dir: "desc" });
  const rows = useMemo(() => propertyPerformance(events), [events]);

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
      <SectionCard title="Top Performing Properties">
        <TableSkeleton rows={6} />
      </SectionCard>
    );
  }

  if (rows.length === 0) {
    return <EmptyState title="No analytics data available for this period." />;
  }

  const byEnquiries = [...rows].sort((a, b) => b.enquiries - a.enquiries);
  const highAttention = byEnquiries.slice(0, 2);
  const highConversion = [...rows].filter((r) => r.enquiries >= 3 && r.conversion != null).sort((a, b) => (b.conversion ?? 0) - (a.conversion ?? 0))[0];
  const lowEngagement = [...rows].sort((a, b) => a.enquiries - b.enquiries)[0];

  return (
    <div className="space-y-5">
      <SectionCard title="Top Performing Properties" subtitle="Demand and conversion by listing — analytics only, not a listing editor.">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line">
                <th className="px-3 py-2 text-left text-xs font-medium tracking-wide text-ink-soft uppercase">Property</th>
                <SortHeader label="Enquiries" sortKey="enquiries" active={sort} onClick={toggleSort} />
                <SortHeader label="Leads" sortKey="leads" active={sort} onClick={toggleSort} />
                <SortHeader label="Viewings" sortKey="viewings" active={sort} onClick={toggleSort} />
                <SortHeader label="Closed" sortKey="closed" active={sort} onClick={toggleSort} />
                <SortHeader label="Conversion" sortKey="conversion" active={sort} onClick={toggleSort} />
                <th className="px-3 py-2" />
              </tr>
            </thead>
            <tbody>
              {sorted.map((row) => (
                <PropertyRow key={row.property.id} row={row} onNavigate={onNavigate} />
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>

      <div className="grid gap-5 md:grid-cols-3">
        <SectionCard title="High Attention" subtitle="Generating the largest volume of enquiry activity.">
          <ul className="space-y-2 text-sm">
            {highAttention.map((r) => (
              <li key={r.property.id} className="flex justify-between">
                <span className="text-ink">{r.property.title}</span>
                <span className="text-ink-soft">{r.enquiries} enquiries</span>
              </li>
            ))}
          </ul>
        </SectionCard>
        <SectionCard title="High Conversion" subtitle="Fewer enquiries, but converting strongly.">
          {highConversion ? (
            <div className="text-sm">
              <p className="font-medium text-ink">{highConversion.property.title}</p>
              <p className="mt-1 text-ink-soft">{highConversion.enquiries} enquiries · {formatPct(highConversion.conversion)} conversion</p>
            </div>
          ) : (
            <p className="text-sm text-ink-soft">Not enough data to calculate this metric.</p>
          )}
        </SectionCard>
        <SectionCard title="Low Engagement" subtitle="Receiving relatively little activity this period.">
          {lowEngagement ? (
            <div className="text-sm">
              <p className="font-medium text-ink">{lowEngagement.property.title}</p>
              <p className="mt-1 text-ink-soft">{lowEngagement.enquiries} enquir{lowEngagement.enquiries === 1 ? "y" : "ies"} in this period</p>
            </div>
          ) : (
            <p className="text-sm text-ink-soft">Not enough data to calculate this metric.</p>
          )}
        </SectionCard>
      </div>
    </div>
  );
}

function PropertyRow({ row, onNavigate }: { row: PropertyPerformance; onNavigate: (path: string) => void }) {
  return (
    <tr className="border-b border-line/60 last:border-0 hover:bg-paper/40">
      <td className="px-3 py-2.5">
        <p className="font-medium text-ink">{row.property.title}</p>
        <p className="text-xs text-ink-soft">{row.property.community} · {row.property.propertyType}</p>
      </td>
      <td className="px-3 py-2.5 text-right tabular-nums">{formatNumber(row.enquiries)}</td>
      <td className="px-3 py-2.5 text-right tabular-nums">{formatNumber(row.leads)}</td>
      <td className="px-3 py-2.5 text-right tabular-nums">{formatNumber(row.viewings)}</td>
      <td className="px-3 py-2.5 text-right tabular-nums">{formatNumber(row.closed)}</td>
      <td className="px-3 py-2.5 text-right tabular-nums font-medium">{formatPct(row.conversion)}</td>
      <td className="px-3 py-2.5 text-right">
        <NavOutLink label="View Property" onClick={() => onNavigate("/properties")} />
      </td>
    </tr>
  );
}
