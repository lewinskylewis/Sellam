import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { displayName, useAuth } from "../lib/auth";
import StatCard from "../components/StatCard";
import Avatar from "../components/Avatar";
import StatusPill from "../components/StatusPill";
import { ChatIcon, CommunityIcon, HouseIcon, HousePlusIcon, UserIcon } from "../components/icons";
import {
  fetchOverviewStats,
  fetchRecentEnquiries,
  fetchRecentProperties,
  type OverviewStats,
  type RecentEnquiry,
  type RecentProperty,
} from "../lib/stats";

function formatStatus(status: string) {
  return status
    .split("-")
    .map((w) => w[0].toUpperCase() + w.slice(1))
    .join(" ");
}

function formatDate(iso: string) {
  const d = new Date(iso);
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  return `${dd}-${mm}-${d.getFullYear()}`;
}

function formatRelativeTime(iso: string) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.round(diffMs / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  return `${days}d ago`;
}

export default function Overview() {
  const { session } = useAuth();
  const [stats, setStats] = useState<OverviewStats | null>(null);
  const [properties, setProperties] = useState<RecentProperty[] | null>(null);
  const [enquiries, setEnquiries] = useState<RecentEnquiry[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    Promise.all([fetchOverviewStats(), fetchRecentProperties(), fetchRecentEnquiries()])
      .then(([s, p, e]) => {
        if (cancelled) return;
        setStats(s);
        setProperties(p);
        setEnquiries(e);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message ?? "Failed to load dashboard data.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const name = displayName(session);
  const enquiriesUnavailable = !loading && stats?.enquiries == null;

  return (
    <div>
      <h1 className="font-serif text-4xl font-semibold text-ink">Overview</h1>
      <p className="mt-1 text-ink-soft">Welcome back, {name}</p>

      {error && (
        <p className="mt-4 rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
      )}

      <div className="mt-7 grid grid-cols-2 gap-5 lg:grid-cols-4">
        <StatCard label="Total Properties" value={stats?.properties ?? null} icon={<HouseIcon className="h-6 w-6" />} loading={loading} />
        <StatCard label="Available Properties" value={stats?.available ?? null} icon={<HouseIcon className="h-6 w-6" />} loading={loading} />
        <StatCard label="Enquiries" value={stats?.enquiries ?? null} icon={<ChatIcon className="h-6 w-6" />} loading={loading} unavailable={enquiriesUnavailable} />
        <StatCard label="Communities" value={stats?.communities ?? null} icon={<CommunityIcon className="h-6 w-6" />} loading={loading} />
      </div>

      <section className="mt-6 rounded-2xl border border-line bg-surface shadow-[0_2px_8px_rgba(15,23,42,0.05)]">
        <div className="flex items-center justify-between px-6 py-5">
          <h2 className="text-lg font-bold text-ink">Recent Enquiries</h2>
          <span title="Coming in a future phase" className="cursor-not-allowed text-sm font-medium text-link">
            View all enquiries
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] border-collapse text-sm">
            <thead>
              <tr className="border-y border-line text-left text-xs font-medium text-ink-soft">
                <th className="px-6 py-3 font-medium">Name</th>
                <th className="px-3 py-3 font-medium">Property</th>
                <th className="px-3 py-3 font-medium">Phone</th>
                <th className="px-3 py-3 font-medium">Email</th>
                <th className="px-3 py-3 font-medium">Date</th>
                <th className="px-6 py-3 text-right font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-6 text-ink-soft">
                    Loading…
                  </td>
                </tr>
              ) : enquiries == null ? (
                <tr>
                  <td colSpan={6} className="px-6 py-6 text-ink-soft">
                    Not available yet — the enquiries read policy hasn't been applied to the database.
                  </td>
                </tr>
              ) : enquiries.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-6 text-ink-soft">
                    No enquiries yet.
                  </td>
                </tr>
              ) : (
                enquiries.map((e) => (
                  <tr key={e.id} className="border-b border-line last:border-b-0">
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar name={e.name} size={32} />
                        <span className="font-medium text-ink">{e.name}</span>
                      </div>
                    </td>
                    <td className="max-w-[180px] truncate px-3 py-3 text-ink-soft">{e.property_title}</td>
                    <td className="px-3 py-3 text-ink-soft">{e.phone}</td>
                    <td className="max-w-[220px] truncate px-3 py-3 text-ink-soft">{e.email}</td>
                    <td className="px-3 py-3 whitespace-nowrap text-ink-soft">{formatDate(e.submitted_at)}</td>
                    <td className="px-6 py-3 text-right">
                      <StatusPill status={e.status} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <div className="mt-6 grid grid-cols-1 gap-5 lg:grid-cols-3">
        <Link
          to="/properties/new"
          className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-line bg-surface p-10 text-ink-soft shadow-[0_2px_8px_rgba(15,23,42,0.05)] transition-colors hover:bg-paper"
        >
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-brand text-white">
            <HousePlusIcon className="h-7 w-7" />
          </span>
          <span className="text-base font-semibold text-ink">Add Property</span>
        </Link>

        <section className="rounded-2xl border border-line bg-surface p-6 shadow-[0_2px_8px_rgba(15,23,42,0.05)]">
          <h2 className="text-lg font-bold text-ink">Recent Activities</h2>
          <div className="mt-4 divide-y divide-line">
            {loading ? (
              <p className="py-3 text-sm text-ink-soft">Loading…</p>
            ) : !enquiries || enquiries.length === 0 ? (
              <p className="py-3 text-sm text-ink-soft">No recent activity.</p>
            ) : (
              enquiries.slice(0, 3).map((e) => (
                <div key={e.id} className="flex items-start justify-between gap-4 py-3">
                  <div className="flex items-start gap-3">
                    <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand text-white">
                      <UserIcon className="h-4 w-4" />
                    </span>
                    <span>
                      <span className="block text-sm font-medium text-ink">New enquiry from {e.name}</span>
                      <span className="block text-xs text-ink-soft">{e.property_title}</span>
                    </span>
                  </div>
                  <span className="shrink-0 text-xs text-ink-soft">{formatRelativeTime(e.submitted_at)}</span>
                </div>
              ))
            )}
          </div>
        </section>

        <section className="rounded-2xl border border-line bg-surface p-6 shadow-[0_2px_8px_rgba(15,23,42,0.05)]">
          <h2 className="text-lg font-bold text-ink">Recent Properties</h2>
          <div className="mt-2 divide-y divide-line">
            {loading ? (
              <p className="py-3 text-sm text-ink-soft">Loading…</p>
            ) : !properties || properties.length === 0 ? (
              <p className="py-3 text-sm text-ink-soft">No properties yet.</p>
            ) : (
              properties.map((p) => (
                <div key={p.id} className="flex items-center justify-between gap-3 py-3">
                  <span className="truncate text-sm font-medium text-ink">{p.title}</span>
                  <span className="shrink-0 text-xs text-ink-soft">{formatStatus(p.status)}</span>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
