import { useEffect, useMemo, useState } from "react";
import Avatar from "../components/Avatar";
import EnquiryStatusBadge from "../components/EnquiryStatusBadge";
import EnquiryDetailDrawer from "../components/EnquiryDetailDrawer";
import { SearchIcon } from "../components/icons";
import {
  ADMIN_STATUS_LABELS,
  PRIMARY_ADMIN_STATUSES,
  fetchAppointmentsByEnquiryId,
  fetchEnquiries,
  fetchPropertyIdByLegacyId,
  normalizeStatus,
  type AdminStatus,
  type Enquiry,
  type EnquiryAppointment,
} from "../lib/enquiries";

type SortKey = "newest" | "oldest";

function formatDate(iso: string) {
  const d = new Date(iso);
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  return `${dd}-${mm}-${d.getFullYear()}`;
}

const selectClasses =
  "rounded-xl border border-line bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-brand focus:ring-1 focus:ring-brand";

export default function Enquiries() {
  const [enquiries, setEnquiries] = useState<Enquiry[] | null>(null);
  const [propertyIdByLegacyId, setPropertyIdByLegacyId] = useState<Map<string, string>>(new Map());
  const [appointmentsByEnquiryId, setAppointmentsByEnquiryId] = useState<Map<number, EnquiryAppointment[]>>(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"all" | AdminStatus>("all");
  const [sort, setSort] = useState<SortKey>("newest");
  const [selectedId, setSelectedId] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    Promise.all([
      fetchEnquiries(),
      fetchPropertyIdByLegacyId().catch(() => new Map<string, string>()),
      fetchAppointmentsByEnquiryId().catch(() => new Map<number, EnquiryAppointment[]>()),
    ])
      .then(([enquiryData, legacyMap, appointmentsMap]) => {
        if (cancelled) return;
        setEnquiries(enquiryData);
        setPropertyIdByLegacyId(legacyMap);
        setAppointmentsByEnquiryId(appointmentsMap);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message ?? "Unable to load enquiries.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(() => {
    if (!enquiries) return [];
    const q = search.trim().toLowerCase();

    let rows = enquiries.filter((e) => {
      if (status !== "all" && normalizeStatus(e.status) !== status) return false;
      if (!q) return true;
      return [e.name, e.email, e.phone, e.property_title, e.message].some((field) =>
        (field ?? "").toLowerCase().includes(q),
      );
    });

    rows = rows.slice().sort((a, b) => {
      const diff = new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime();
      return sort === "newest" ? diff : -diff;
    });

    return rows;
  }, [enquiries, search, status, sort]);

  const selected = enquiries?.find((e) => e.id === selectedId) ?? null;

  function handleStatusChange(id: number, rawStatus: string) {
    setEnquiries((prev) => (prev ? prev.map((e) => (e.id === id ? { ...e, status: rawStatus } : e)) : prev));
  }

  function handleAppointmentScheduled(enquiryId: number, appointment: EnquiryAppointment) {
    setAppointmentsByEnquiryId((prev) => {
      const next = new Map(prev);
      next.set(enquiryId, [appointment, ...(next.get(enquiryId) ?? [])]);
      return next;
    });
  }

  return (
    <div>
      <h1 className="font-serif text-4xl font-semibold text-ink">Enquiries</h1>
      <p className="mt-1 text-ink-soft">
        {loading ? "Fetching enquiries…" : `${filtered.length} of ${enquiries?.length ?? 0} enquiries`}
      </p>

      {error && <p className="mt-4 rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">Unable to load enquiries. {error}</p>}

      <div className="mt-6 rounded-2xl border border-line bg-surface p-4 shadow-[0_2px_8px_rgba(15,23,42,0.05)]">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative min-w-[220px] flex-1">
            <SearchIcon className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-ink-soft" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, email, phone, property or message…"
              className="w-full rounded-xl border border-line bg-white py-2 pr-3 pl-9 text-sm text-ink outline-none focus:border-brand focus:ring-1 focus:ring-brand"
            />
          </div>

          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as "all" | AdminStatus)}
            className={selectClasses}
          >
            <option value="all">All statuses</option>
            {PRIMARY_ADMIN_STATUSES.map((s) => (
              <option key={s} value={s}>
                {ADMIN_STATUS_LABELS[s]}
              </option>
            ))}
            <option value="spam">Spam</option>
          </select>

          <select value={sort} onChange={(e) => setSort(e.target.value as SortKey)} className={selectClasses}>
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
          </select>
        </div>
      </div>

      <section className="mt-4 rounded-2xl border border-line bg-surface shadow-[0_2px_8px_rgba(15,23,42,0.05)]">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-line text-left text-xs font-medium text-ink-soft">
                <th className="px-6 py-3 font-medium">Name</th>
                <th className="px-3 py-3 font-medium">Property</th>
                <th className="px-3 py-3 font-medium">Email</th>
                <th className="px-3 py-3 font-medium">Phone</th>
                <th className="px-3 py-3 font-medium">Date</th>
                <th className="px-6 py-3 text-right font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-ink-soft">
                    Fetching enquiries…
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-ink-soft">
                    {enquiries && enquiries.length > 0 ? "No enquiries match your search or filters." : "No enquiries found."}
                  </td>
                </tr>
              ) : (
                filtered.map((e) => (
                  <tr
                    key={e.id}
                    onClick={() => setSelectedId(e.id)}
                    className="cursor-pointer border-b border-line last:border-b-0 hover:bg-paper/60"
                  >
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar name={e.name} size={32} />
                        <span className="font-medium text-ink">{e.name}</span>
                      </div>
                    </td>
                    <td className="max-w-[200px] truncate px-3 py-3 text-ink-soft">{e.property_title}</td>
                    <td className="max-w-[200px] truncate px-3 py-3 text-ink-soft">{e.email}</td>
                    <td className="px-3 py-3 whitespace-nowrap text-ink-soft">{e.phone}</td>
                    <td className="px-3 py-3 whitespace-nowrap text-ink-soft">{formatDate(e.submitted_at)}</td>
                    <td className="px-6 py-3 text-right">
                      <EnquiryStatusBadge status={e.status} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {selected && (
        <EnquiryDetailDrawer
          enquiry={selected}
          propertyDashboardId={propertyIdByLegacyId.get(selected.property_id) ?? null}
          appointments={appointmentsByEnquiryId.get(selected.id) ?? []}
          onStatusChange={(rawStatus) => handleStatusChange(selected.id, rawStatus)}
          onAppointmentScheduled={(appointment) => handleAppointmentScheduled(selected.id, appointment)}
          onClose={() => setSelectedId(null)}
        />
      )}
    </div>
  );
}
