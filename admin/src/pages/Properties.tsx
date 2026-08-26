import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import PropertyStatusBadge from "../components/PropertyStatusBadge";
import InsightTile from "../components/InsightTile";
import { ChatIcon, ChartIcon, EyeIcon, HousePlusIcon, SearchIcon } from "../components/icons";
import { fetchPropertiesList, type PropertyListItem } from "../lib/properties";
import { fetchEnquiryCountsByPropertyId } from "../lib/enquiries";

type SortKey = "newest" | "oldest" | "title-asc" | "title-desc" | "price-asc" | "price-desc";

const SORT_LABELS: Record<SortKey, string> = {
  newest: "Newest first",
  oldest: "Oldest first",
  "title-asc": "Title (A–Z)",
  "title-desc": "Title (Z–A)",
  "price-asc": "Price (low to high)",
  "price-desc": "Price (high to low)",
};

const LETTING_LABELS: Record<string, string> = { sale: "Sale", rent: "Rent", both: "Sale & Rent" };

// Schema declares these columns NOT NULL, but `create table if not exists`
// is a no-op against an already-existing table, so that constraint may not
// actually be enforced on the live table — guard against real nulls rather
// than trust the migration file's aspiration.
function titleCase(value: string | null | undefined) {
  if (!value) return "Unspecified";
  return value
    .split("-")
    .map((w) => w[0].toUpperCase() + w.slice(1))
    .join(" ");
}

function formatDate(iso: string | null) {
  if (!iso) return "—";
  const d = new Date(iso);
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  return `${dd}-${mm}-${d.getFullYear()}`;
}

const selectClasses =
  "rounded-xl border border-line bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-brand focus:ring-1 focus:ring-brand";

export default function Properties() {
  const [properties, setProperties] = useState<PropertyListItem[] | null>(null);
  const [enquiryCounts, setEnquiryCounts] = useState<Map<string, number>>(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [propertyType, setPropertyType] = useState("all");
  const [letting, setLetting] = useState("all");
  const [sort, setSort] = useState<SortKey>("newest");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    Promise.all([fetchPropertiesList(), fetchEnquiryCountsByPropertyId().catch(() => new Map<string, number>())])
      .then(([data, counts]) => {
        if (cancelled) return;
        setProperties(data);
        setEnquiryCounts(counts);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message ?? "Failed to load properties.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  // Every value here is derived from data already on hand — never
  // fabricated. "Most Viewed" has no real counterpart: nothing in this
  // project tracks property page views anywhere, so that tile says so
  // rather than inventing a number.
  const insights = useMemo(() => {
    if (!properties || properties.length === 0) {
      return { mostEnquired: null, highestValue: null, recentlyAdded: null };
    }

    const mostEnquired = properties.reduce<{ title: string; count: number } | null>((best, p) => {
      const count = enquiryCounts.get(p.legacy_id) ?? 0;
      return count > 0 && (!best || count > best.count) ? { title: p.title, count } : best;
    }, null);

    const priced = properties.filter((p) => Number.isFinite(p.sortPrice));
    const highestValue = priced.length
      ? priced.reduce((max, p) => (p.sortPrice > max.sortPrice ? p : max))
      : null;

    // fetchPropertiesList already orders by created_at desc, so [0] is the
    // most recently added property regardless of the user's chosen sort.
    const recentlyAdded = properties[0];

    return { mostEnquired, highestValue, recentlyAdded };
  }, [properties, enquiryCounts]);

  const statusOptions = useMemo(
    () => Array.from(new Set((properties ?? []).map((p) => p.status).filter(Boolean))).sort(),
    [properties],
  );
  const typeOptions = useMemo(
    () => Array.from(new Set((properties ?? []).map((p) => p.property_type).filter(Boolean))).sort(),
    [properties],
  );

  const filtered = useMemo(() => {
    if (!properties) return [];
    const q = search.trim().toLowerCase();

    let rows = properties.filter((p) => {
      if (status !== "all" && p.status !== status) return false;
      if (propertyType !== "all" && p.property_type !== propertyType) return false;
      if (letting !== "all" && p.letting !== letting) return false;
      if (!q) return true;
      return [p.title, p.communityLabel, p.location, p.legacy_id, p.slug].some((field) =>
        (field ?? "").toLowerCase().includes(q),
      );
    });

    rows = rows.slice().sort((a, b) => {
      switch (sort) {
        case "oldest":
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case "title-asc":
          return a.title.localeCompare(b.title);
        case "title-desc":
          return b.title.localeCompare(a.title);
        case "price-asc":
          return a.sortPrice - b.sortPrice;
        case "price-desc":
          return (b.sortPrice === Infinity ? -1 : b.sortPrice) - (a.sortPrice === Infinity ? -1 : a.sortPrice);
        case "newest":
        default:
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
    });

    return rows;
  }, [properties, search, status, propertyType, letting, sort]);

  return (
    <div>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight text-ink">Properties</h1>
          <p className="mt-1 text-ink-soft">
            {loading ? "Loading…" : `${filtered.length} of ${properties?.length ?? 0} properties`}
          </p>
        </div>
        <Link
          to="/properties/new"
          className="shrink-0 rounded-xl bg-brand px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-brand-soft"
        >
          + Add Property
        </Link>
      </div>

      {error && (
        <p className="mt-4 rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
      )}

      <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <InsightTile
          label="Most Viewed"
          icon={<EyeIcon className="h-5 w-5" />}
          loading={loading}
          title={null}
          unavailableReason="Not tracked yet"
        />
        <InsightTile
          label="Most Enquired"
          icon={<ChatIcon className="h-5 w-5" />}
          loading={loading}
          title={insights.mostEnquired?.title ?? null}
          metric={insights.mostEnquired ? `${insights.mostEnquired.count} enquir${insights.mostEnquired.count === 1 ? "y" : "ies"}` : undefined}
        />
        <InsightTile
          label="Highest Value"
          icon={<ChartIcon className="h-5 w-5" />}
          loading={loading}
          title={insights.highestValue?.title ?? null}
          metric={insights.highestValue?.priceLabel}
        />
        <InsightTile
          label="Recently Added"
          icon={<HousePlusIcon className="h-5 w-5" />}
          loading={loading}
          title={insights.recentlyAdded?.title ?? null}
          metric={insights.recentlyAdded ? formatDate(insights.recentlyAdded.created_at) : undefined}
        />
      </div>

      <div className="mt-4 rounded-2xl border border-line bg-surface p-4 shadow-[0_8px_30px_rgba(15,23,42,0.14)]">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[220px]">
            <SearchIcon className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-ink-soft" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by title, community or location…"
              className="w-full rounded-xl border border-line bg-white py-2 pr-3 pl-9 text-sm text-ink outline-none focus:border-brand focus:ring-1 focus:ring-brand"
            />
          </div>

          <select value={status} onChange={(e) => setStatus(e.target.value)} className={selectClasses}>
            <option value="all">All statuses</option>
            {statusOptions.map((s) => (
              <option key={s} value={s}>
                {titleCase(s)}
              </option>
            ))}
          </select>

          <select value={propertyType} onChange={(e) => setPropertyType(e.target.value)} className={selectClasses}>
            <option value="all">All types</option>
            {typeOptions.map((t) => (
              <option key={t} value={t}>
                {titleCase(t)}
              </option>
            ))}
          </select>

          <select value={letting} onChange={(e) => setLetting(e.target.value)} className={selectClasses}>
            <option value="all">Sale & rent</option>
            {Object.entries(LETTING_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>

          <select value={sort} onChange={(e) => setSort(e.target.value as SortKey)} className={selectClasses}>
            {Object.entries(SORT_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <section className="mt-4 rounded-2xl border border-line bg-surface shadow-[0_8px_30px_rgba(15,23,42,0.14)]">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[880px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-line text-left text-xs font-medium text-ink-soft">
                <th className="px-6 py-3 font-medium">Property</th>
                <th className="px-3 py-3 font-medium">Type</th>
                <th className="px-3 py-3 font-medium">Letting</th>
                <th className="px-3 py-3 font-medium">Units</th>
                <th className="px-3 py-3 font-medium">Price</th>
                <th className="px-3 py-3 font-medium">Listed</th>
                <th className="px-3 py-3 text-right font-medium">Status</th>
                <th className="px-6 py-3 text-right font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-6 py-8 text-center text-ink-soft">
                    Loading properties…
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-8 text-center text-ink-soft">
                    {properties && properties.length > 0
                      ? "No properties match your search or filters."
                      : "No properties yet."}
                  </td>
                </tr>
              ) : (
                filtered.map((p) => (
                  <tr key={p.id} className="border-b border-line transition-colors last:border-b-0 hover:bg-paper/60">
                    <td className="max-w-[280px] px-6 py-3">
                      <span className="block truncate font-medium text-ink">{p.title}</span>
                      <span className="block truncate text-xs text-ink-soft">
                        {p.communityLabel}
                        {p.location ? ` · ${p.location}` : ""}
                      </span>
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap text-ink-soft">{titleCase(p.property_type)}</td>
                    <td className="px-3 py-3 whitespace-nowrap text-ink-soft">
                      {LETTING_LABELS[p.letting] ?? titleCase(p.letting)}
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap text-ink-soft">{p.unitCount}</td>
                    <td className="px-3 py-3 whitespace-nowrap text-ink-soft">{p.priceLabel}</td>
                    <td className="px-3 py-3 whitespace-nowrap text-ink-soft">{formatDate(p.listed_date)}</td>
                    <td className="px-3 py-3 text-right">
                      <PropertyStatusBadge status={p.status} />
                    </td>
                    <td className="px-6 py-3 text-right">
                      <Link to={`/properties/${p.id}/edit`} className="text-sm font-medium text-link hover:underline">
                        Edit
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
