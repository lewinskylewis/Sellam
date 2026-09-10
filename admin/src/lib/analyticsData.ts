// Real Supabase-backed data layer for the Analytics module. Every exported
// type/function signature here is unchanged from the module's original
// design so that admin/src/components/analytics/**/*.tsx (10 section
// components + FiltersBar) keep working untouched — only the *source* of
// AnalyticsEvent[] changed, from a synthetic seeded-RNG generator to
// fetchAnalyticsEvents(), which reads real contacts/property_enquiries/
// properties/communities/contact_activities rows.
//
// There is no page-view/session/social-media data anywhere in this project
// (no GA4, Search Console, Meta/Instagram/TikTok integration, no pageview
// logging table) — see WebsitePerformanceSection.tsx, which now shows an
// "integration required" state instead of fabricated traffic numbers.

import { supabase } from "./supabase";
import { SOURCES, type LeadSource } from "./leads";

export { SOURCES };
export type { LeadSource };

export type PropertyType = string;
export type ListingType = string;
export type FunnelStage = "Enquiry" | "Contacted" | "Qualified" | "Viewing" | "Negotiation" | "Won" | "Lost";

export type AnalyticsProperty = {
  id: string;
  title: string;
  community: string | null;
  propertyType: PropertyType | null;
  listingType: ListingType | null;
};

export type AnalyticsEvent = {
  id: string;
  date: Date; // contacts.date_added — when this lead/client relationship started
  property: AnalyticsProperty | null; // resolved via a matched property_enquiries row, if any
  community: string | null; // property's community, falling back to the contact's first preferred location
  propertyType: PropertyType | null; // property's type, falling back to the contact's stated property_type
  source: LeadSource;
  agent: string; // "" when unassigned
  finalStage: FunnelStage; // contacts.stage ("New" is presented as "Enquiry")
  lost: boolean;
  lostAt: Date | null;
  contactedAt: Date | null;
  qualifiedAt: Date | null;
  viewingAt: Date | null;
  negotiationAt: Date | null;
  closedAt: Date | null;
  responseMinutes: number | null; // date_added -> first "→ Contacted" stage_change activity
  budgetValue: number | null; // contact's stated budget_max (or budget_min) — a real declared figure, not a confirmed transaction value
  followUpsCompleted: number; // count of logged "Follow-up completed" activities for this contact
};

const DAY_MS = 86_400_000;

// --------------------------------------------------------------------
// Fetch + map real data
// --------------------------------------------------------------------

type ContactRow = {
  id: string;
  email: string | null;
  date_added: string;
  type: string;
  stage: string;
  source: string;
  assigned_agent: string | null;
  budget_min: number | null;
  budget_max: number | null;
  property_type: string | null;
  preferred_locations: string[];
  archived: boolean;
};

// properties.property_type and properties.letting were both relaxed from
// NOT NULL to nullable by 202608251500_amend_properties_international_support.sql
// (international listings with no clean classification) — so a real row can
// legitimately have either as null. Passing that straight to `.split()`
// crashed in production; this returns null instead of fabricating a label.
function titleCase(s: string | null): string | null {
  if (!s) return null;
  return s
    .split(/[\s-]+/)
    .filter(Boolean)
    .map((w) => w[0].toUpperCase() + w.slice(1))
    .join(" ");
}

function extractStageTimestamps(activities: { type: string; detail: string | null; created_at: string }[]) {
  const out: Partial<Record<FunnelStage, Date>> = {};
  for (const a of activities) {
    if (a.type !== "stage_change" || !a.detail) continue;
    const parts = a.detail.split("→");
    const target = parts[1]?.trim();
    if (!target) continue;
    // First occurrence only — later re-entries into the same stage don't
    // overwrite when it was first reached.
    if (!out[target as FunnelStage]) out[target as FunnelStage] = new Date(a.created_at);
  }
  return out;
}

export async function fetchAnalyticsEvents(): Promise<AnalyticsEvent[]> {
  const [{ data: contactRows, error: contactsError }, { data: activityRows, error: activityError }, { data: enquiryRows, error: enquiryError }, { data: propertyRows, error: propertiesError }, { data: communityRows, error: communitiesError }] =
    await Promise.all([
      supabase
        .from("contacts")
        .select("id, email, date_added, type, stage, source, assigned_agent, budget_min, budget_max, property_type, preferred_locations, archived"),
      supabase.from("contact_activities").select("contact_id, type, title, detail, created_at").order("created_at", { ascending: true }),
      supabase.from("property_enquiries").select("id, contact_id, email, property_id, submitted_at"),
      supabase.from("properties").select("id, legacy_id, title, community, property_type, letting"),
      supabase.from("communities").select("key, label"),
    ]);

  if (contactsError) throw contactsError;
  if (activityError) throw activityError;
  if (enquiryError) throw enquiryError;
  if (propertiesError) throw propertiesError;
  if (communitiesError) throw communitiesError;

  const communityLabelByKey = new Map((communityRows ?? []).map((c) => [c.key, c.label]));
  const propertyByLegacyId = new Map(
    (propertyRows ?? []).map((p) => [
      p.legacy_id,
      {
        id: p.id,
        title: p.title,
        community: communityLabelByKey.get(p.community) ?? p.community,
        propertyType: titleCase(p.property_type),
        listingType: titleCase(p.letting),
      } satisfies AnalyticsProperty,
    ]),
  );

  const enquiries = enquiryRows ?? [];
  const enquiriesByContactId = new Map<string, typeof enquiries>();
  const enquiriesByEmail = new Map<string, typeof enquiries>();
  for (const e of enquiries) {
    if (e.contact_id) {
      const list = enquiriesByContactId.get(e.contact_id) ?? [];
      list.push(e);
      enquiriesByContactId.set(e.contact_id, list);
    }
    const email = (e.email ?? "").trim().toLowerCase();
    if (email) {
      const list = enquiriesByEmail.get(email) ?? [];
      list.push(e);
      enquiriesByEmail.set(email, list);
    }
  }

  const activitiesByContactId = new Map<string, { type: string; title: string; detail: string | null; created_at: string }[]>();
  for (const a of activityRows ?? []) {
    const list = activitiesByContactId.get(a.contact_id) ?? [];
    list.push(a);
    activitiesByContactId.set(a.contact_id, list);
  }

  const contacts = (contactRows ?? []) as ContactRow[];

  return contacts
    .filter((c) => !c.archived)
    .map((c) => {
      const linked = enquiriesByContactId.get(c.id) ?? [];
      const byEmail = c.email ? (enquiriesByEmail.get(c.email.trim().toLowerCase()) ?? []) : [];
      const seen = new Set<number>();
      const matched = [...linked, ...byEmail].filter((e) => (seen.has(e.id) ? false : (seen.add(e.id), true))).sort((a, b) => new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime());

      let property: AnalyticsProperty | null = null;
      for (const e of matched) {
        const p = propertyByLegacyId.get(e.property_id);
        if (p) {
          property = p;
          break;
        }
      }

      const activities = activitiesByContactId.get(c.id) ?? [];
      const stageTimestamps = extractStageTimestamps(activities);
      const dateAdded = new Date(c.date_added);
      const contactedAt = stageTimestamps.Contacted ?? null;
      const followUpsCompleted = activities.filter((a) => a.type === "follow_up" && a.title === "Follow-up completed").length;

      const finalStage: FunnelStage = c.stage === "New" ? "Enquiry" : (c.stage as FunnelStage);
      const lost = c.stage === "Lost";
      const budgetValue = c.budget_max ?? c.budget_min ?? null;

      return {
        id: c.id,
        date: dateAdded,
        property,
        community: property?.community ?? c.preferred_locations?.[0] ?? null,
        propertyType: property?.propertyType ?? (c.property_type ? titleCase(c.property_type) : null),
        source: c.source as LeadSource,
        agent: c.assigned_agent ?? "",
        finalStage,
        lost,
        lostAt: stageTimestamps.Lost ?? null,
        contactedAt,
        qualifiedAt: stageTimestamps.Qualified ?? null,
        viewingAt: stageTimestamps.Viewing ?? null,
        negotiationAt: stageTimestamps.Negotiation ?? null,
        closedAt: stageTimestamps.Won ?? null,
        responseMinutes: contactedAt ? Math.round((contactedAt.getTime() - dateAdded.getTime()) / 60_000) : null,
        budgetValue,
        followUpsCompleted,
      } satisfies AnalyticsEvent;
    });
}

// Distinct, non-empty option lists for the filter bar — computed from
// whatever is actually in the fetched dataset (not a fixed catalogue), so a
// filter never offers a choice that matches nothing.
export function distinctAgents(events: AnalyticsEvent[]): string[] {
  return Array.from(new Set(events.map((e) => e.agent).filter(Boolean))).sort();
}
export function distinctCommunities(events: AnalyticsEvent[]): string[] {
  return Array.from(new Set(events.map((e) => e.community).filter((c): c is string => !!c))).sort();
}
export function distinctPropertyTypes(events: AnalyticsEvent[]): string[] {
  return Array.from(new Set(events.map((e) => e.propertyType).filter((t): t is string => !!t))).sort();
}
export function distinctListingTypes(events: AnalyticsEvent[]): string[] {
  return Array.from(new Set(events.map((e) => e.property?.listingType).filter((t): t is string => !!t))).sort();
}
export function distinctProperties(events: AnalyticsEvent[]): { id: string; title: string }[] {
  const map = new Map<string, string>();
  for (const e of events) if (e.property) map.set(e.property.id, e.property.title);
  return Array.from(map, ([id, title]) => ({ id, title })).sort((a, b) => a.title.localeCompare(b.title));
}

// ---------- date range + comparison ----------

export type DateRangeKey = "today" | "7d" | "30d" | "90d" | "12m" | "custom";
export type ComparisonKey = "previous_period" | "previous_month" | "previous_year";

export type DateRange = { start: Date; end: Date; label: string };

export function resolveDateRange(key: DateRangeKey, custom?: { start: string; end: string }): DateRange {
  const now = new Date();
  const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);

  switch (key) {
    case "today":
      return { start: startOfToday, end: endOfToday, label: "Today" };
    case "7d":
      return { start: new Date(startOfToday.getTime() - 6 * DAY_MS), end: endOfToday, label: "Last 7 days" };
    case "30d":
      return { start: new Date(startOfToday.getTime() - 29 * DAY_MS), end: endOfToday, label: "Last 30 days" };
    case "90d":
      return { start: new Date(startOfToday.getTime() - 89 * DAY_MS), end: endOfToday, label: "Last 90 days" };
    case "12m":
      return { start: new Date(startOfToday.getTime() - 364 * DAY_MS), end: endOfToday, label: "Last 12 months" };
    case "custom": {
      if (custom?.start && custom?.end) {
        const s = new Date(`${custom.start}T00:00:00`);
        const e = new Date(`${custom.end}T23:59:59`);
        if (!Number.isNaN(s.getTime()) && !Number.isNaN(e.getTime()) && s <= e) {
          return { start: s, end: e, label: "Custom range" };
        }
      }
      return { start: new Date(startOfToday.getTime() - 29 * DAY_MS), end: endOfToday, label: "Custom range" };
    }
  }
}

export function resolveComparisonRange(range: DateRange, key: ComparisonKey): DateRange {
  const spanMs = range.end.getTime() - range.start.getTime();
  if (key === "previous_period") {
    return { start: new Date(range.start.getTime() - spanMs - DAY_MS), end: new Date(range.start.getTime() - DAY_MS), label: "Previous period" };
  }
  if (key === "previous_month") {
    const start = new Date(range.start);
    start.setMonth(start.getMonth() - 1);
    const end = new Date(range.end);
    end.setMonth(end.getMonth() - 1);
    return { start, end, label: "Previous month" };
  }
  const start = new Date(range.start);
  start.setFullYear(start.getFullYear() - 1);
  const end = new Date(range.end);
  end.setFullYear(end.getFullYear() - 1);
  return { start, end, label: "Previous year" };
}

// ---------- filters ----------

export type AnalyticsFilters = {
  properties: string[];
  communities: string[];
  propertyTypes: PropertyType[];
  listingTypes: ListingType[];
  sources: LeadSource[];
  agents: string[];
};

export function emptyFilters(): AnalyticsFilters {
  return { properties: [], communities: [], propertyTypes: [], listingTypes: [], sources: [], agents: [] };
}

export function hasActiveFilters(f: AnalyticsFilters): boolean {
  return f.properties.length > 0 || f.communities.length > 0 || f.propertyTypes.length > 0 || f.listingTypes.length > 0 || f.sources.length > 0 || f.agents.length > 0;
}

export function filterEvents(events: AnalyticsEvent[], range: DateRange, filters: AnalyticsFilters): AnalyticsEvent[] {
  return events.filter((e) => {
    if (e.date < range.start || e.date > range.end) return false;
    if (filters.properties.length && !(e.property && filters.properties.includes(e.property.id))) return false;
    if (filters.communities.length && !(e.community && filters.communities.includes(e.community))) return false;
    if (filters.propertyTypes.length && !(e.propertyType && filters.propertyTypes.includes(e.propertyType))) return false;
    if (filters.listingTypes.length && !(e.property?.listingType && filters.listingTypes.includes(e.property.listingType))) return false;
    if (filters.sources.length && !filters.sources.includes(e.source)) return false;
    if (filters.agents.length && !filters.agents.includes(e.agent)) return false;
    return true;
  });
}

// ---------- reached-stage helpers ----------

const STAGE_ORDER: FunnelStage[] = ["Enquiry", "Contacted", "Qualified", "Viewing", "Negotiation", "Won"];

function reachedIndex(e: AnalyticsEvent): number {
  return STAGE_ORDER.indexOf(e.finalStage);
}

export function reached(e: AnalyticsEvent, stage: FunnelStage): boolean {
  return reachedIndex(e) >= STAGE_ORDER.indexOf(stage);
}

export function currentLifecycleStage(e: AnalyticsEvent): FunnelStage {
  if (e.finalStage === "Won") return "Won";
  if (e.lost) return "Lost";
  return e.finalStage;
}

// ---------- KPIs ----------

export function pctChange(current: number, previous: number): number | null {
  if (previous === 0) return current === 0 ? 0 : null;
  return ((current - previous) / previous) * 100;
}

export type Kpis = {
  enquiries: number;
  qualifiedLeads: number;
  viewings: number;
  closed: number;
  conversionRate: number | null;
  avgResponseMinutes: number | null;
};

export function computeKpis(events: AnalyticsEvent[]): Kpis {
  const enquiries = events.length;
  const qualifiedLeads = events.filter((e) => reached(e, "Qualified")).length;
  const viewings = events.filter((e) => reached(e, "Viewing")).length;
  const closed = events.filter((e) => e.finalStage === "Won").length;
  const responses = events.filter((e) => e.responseMinutes != null).map((e) => e.responseMinutes as number);
  return {
    enquiries,
    qualifiedLeads,
    viewings,
    closed,
    conversionRate: enquiries > 0 ? (closed / enquiries) * 100 : null,
    avgResponseMinutes: responses.length ? responses.reduce((a, b) => a + b, 0) / responses.length : null,
  };
}

// ---------- time series ----------

export type Granularity = "daily" | "weekly" | "monthly";
export type SeriesPoint = { key: string; date: Date; label: string; enquiries: number; leads: number; viewings: number };

function bucketKey(d: Date, granularity: Granularity): { key: string; bucketDate: Date } {
  if (granularity === "daily") {
    const key = d.toISOString().slice(0, 10);
    return { key, bucketDate: new Date(d.getFullYear(), d.getMonth(), d.getDate()) };
  }
  if (granularity === "monthly") {
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    return { key, bucketDate: new Date(d.getFullYear(), d.getMonth(), 1) };
  }
  // weekly — bucket to the Monday of that week
  const day = d.getDay();
  const diff = (day === 0 ? -6 : 1) - day;
  const monday = new Date(d.getFullYear(), d.getMonth(), d.getDate() + diff);
  return { key: monday.toISOString().slice(0, 10), bucketDate: monday };
}

export function buildTimeSeries(events: AnalyticsEvent[], range: DateRange, granularity: Granularity): SeriesPoint[] {
  const buckets = new Map<string, SeriesPoint>();

  function ensure(date: Date) {
    const { key, bucketDate } = bucketKey(date, granularity);
    if (!buckets.has(key)) {
      const label =
        granularity === "monthly"
          ? bucketDate.toLocaleDateString(undefined, { month: "short", year: "numeric" })
          : bucketDate.toLocaleDateString(undefined, { month: "short", day: "numeric" });
      buckets.set(key, { key, date: bucketDate, label, enquiries: 0, leads: 0, viewings: 0 });
    }
    return buckets.get(key)!;
  }

  // Seed buckets across the whole range so gaps render as zero, not missing.
  const cursor = new Date(range.start);
  while (cursor <= range.end) {
    ensure(cursor);
    cursor.setDate(cursor.getDate() + 1);
  }

  for (const e of events) {
    ensure(e.date).enquiries += 1;
    if (e.qualifiedAt && e.qualifiedAt >= range.start && e.qualifiedAt <= range.end) ensure(e.qualifiedAt).leads += 1;
    if (e.viewingAt && e.viewingAt >= range.start && e.viewingAt <= range.end) ensure(e.viewingAt).viewings += 1;
  }

  return Array.from(buckets.values()).sort((a, b) => a.date.getTime() - b.date.getTime());
}

// ---------- source breakdown ----------

export function sourceBreakdown(events: AnalyticsEvent[]): { source: LeadSource; count: number; pct: number }[] {
  const total = events.length;
  const counts = new Map<LeadSource, number>();
  for (const e of events) counts.set(e.source, (counts.get(e.source) ?? 0) + 1);
  return SOURCES.map((source) => ({ source, count: counts.get(source) ?? 0, pct: total ? ((counts.get(source) ?? 0) / total) * 100 : 0 }))
    .filter((r) => r.count > 0)
    .sort((a, b) => b.count - a.count);
}

// ---------- funnel ----------

export type FunnelStep = { stage: FunnelStage; count: number };
export type FunnelConversion = { from: FunnelStage; to: FunnelStage; rate: number | null };

const FUNNEL_STAGES: FunnelStage[] = ["Enquiry", "Contacted", "Qualified", "Viewing", "Negotiation", "Won"];

export function funnelSteps(events: AnalyticsEvent[]): FunnelStep[] {
  return FUNNEL_STAGES.map((stage) => ({
    stage,
    count: stage === "Enquiry" ? events.length : events.filter((e) => reached(e, stage)).length,
  }));
}

export function funnelConversions(steps: FunnelStep[]): FunnelConversion[] {
  const out: FunnelConversion[] = [];
  for (let i = 0; i < steps.length - 1; i++) {
    const from = steps[i];
    const to = steps[i + 1];
    out.push({ from: from.stage, to: to.stage, rate: from.count > 0 ? (to.count / from.count) * 100 : null });
  }
  return out;
}

// ---------- property performance ----------

export type PropertyPerformance = {
  property: AnalyticsProperty;
  enquiries: number;
  leads: number;
  viewings: number;
  closed: number;
  conversion: number | null;
};

export function propertyPerformance(events: AnalyticsEvent[]): PropertyPerformance[] {
  const map = new Map<string, PropertyPerformance>();
  for (const e of events) {
    if (!e.property) continue;
    if (!map.has(e.property.id)) map.set(e.property.id, { property: e.property, enquiries: 0, leads: 0, viewings: 0, closed: 0, conversion: null });
    const row = map.get(e.property.id)!;
    row.enquiries += 1;
    if (reached(e, "Qualified")) row.leads += 1;
    if (reached(e, "Viewing")) row.viewings += 1;
    if (e.finalStage === "Won") row.closed += 1;
  }
  const rows = Array.from(map.values());
  for (const r of rows) r.conversion = r.enquiries > 0 ? (r.closed / r.enquiries) * 100 : null;
  return rows.sort((a, b) => b.enquiries - a.enquiries);
}

// ---------- community performance ----------

export type CommunityPerformance = { community: string; enquiries: number; leads: number; viewings: number; closed: number; conversion: number | null };

export function communityPerformance(events: AnalyticsEvent[]): CommunityPerformance[] {
  const map = new Map<string, CommunityPerformance>();
  for (const e of events) {
    if (!e.community) continue;
    if (!map.has(e.community)) map.set(e.community, { community: e.community, enquiries: 0, leads: 0, viewings: 0, closed: 0, conversion: null });
    const row = map.get(e.community)!;
    row.enquiries += 1;
    if (reached(e, "Qualified")) row.leads += 1;
    if (reached(e, "Viewing")) row.viewings += 1;
    if (e.finalStage === "Won") row.closed += 1;
  }
  const rows = Array.from(map.values());
  for (const r of rows) r.conversion = r.enquiries > 0 ? (r.closed / r.enquiries) * 100 : null;
  return rows.sort((a, b) => b.enquiries - a.enquiries);
}

// ---------- lead lifecycle + source quality ----------

export function leadLifecycle(events: AnalyticsEvent[]): { stage: FunnelStage; count: number }[] {
  const order: FunnelStage[] = ["Enquiry", "Contacted", "Qualified", "Viewing", "Negotiation", "Won", "Lost"];
  const counts = new Map<FunnelStage, number>(order.map((s) => [s, 0]));
  for (const e of events) {
    const stage = currentLifecycleStage(e);
    counts.set(stage, (counts.get(stage) ?? 0) + 1);
  }
  return order.map((stage) => ({ stage, count: counts.get(stage) ?? 0 }));
}

export type SourceQuality = { source: LeadSource; leads: number; viewings: number; closed: number; closeRate: number | null };

export function leadSourceQuality(events: AnalyticsEvent[]): SourceQuality[] {
  const map = new Map<LeadSource, SourceQuality>();
  for (const s of SOURCES) map.set(s, { source: s, leads: 0, viewings: 0, closed: 0, closeRate: null });
  for (const e of events) {
    const row = map.get(e.source);
    if (!row) continue;
    if (reached(e, "Qualified")) row.leads += 1;
    if (reached(e, "Viewing")) row.viewings += 1;
    if (e.finalStage === "Won") row.closed += 1;
  }
  const rows = Array.from(map.values()).filter((r) => r.leads > 0);
  for (const r of rows) r.closeRate = r.leads > 0 ? (r.closed / r.leads) * 100 : null;
  return rows.sort((a, b) => b.leads - a.leads);
}

// ---------- agent performance ----------

export type AgentPerformance = {
  agent: string;
  leads: number;
  viewings: number;
  closed: number;
  conversion: number | null;
  avgResponseMinutes: number | null;
  contactRate: number | null;
  leadConversion: number | null; // contacted -> qualified
  viewingConversion: number | null; // qualified -> viewing
  closeRate: number | null; // viewing -> won
  followUpsCompleted: number;
};

export function agentPerformance(events: AnalyticsEvent[]): AgentPerformance[] {
  const agents = distinctAgents(events);
  return agents
    .map((agent) => {
      const rows = events.filter((e) => e.agent === agent);
      const enquiries = rows.length;
      const contacted = rows.filter((e) => reached(e, "Contacted"));
      const qualified = rows.filter((e) => reached(e, "Qualified"));
      const viewings = rows.filter((e) => reached(e, "Viewing"));
      const closed = rows.filter((e) => e.finalStage === "Won");
      const responses = contacted.map((e) => e.responseMinutes as number).filter((n) => n != null);

      return {
        agent,
        leads: qualified.length,
        viewings: viewings.length,
        closed: closed.length,
        conversion: qualified.length > 0 ? (closed.length / qualified.length) * 100 : null,
        avgResponseMinutes: responses.length ? responses.reduce((a, b) => a + b, 0) / responses.length : null,
        contactRate: enquiries > 0 ? (contacted.length / enquiries) * 100 : null,
        leadConversion: contacted.length > 0 ? (qualified.length / contacted.length) * 100 : null,
        viewingConversion: qualified.length > 0 ? (viewings.length / qualified.length) * 100 : null,
        closeRate: viewings.length > 0 ? (closed.length / viewings.length) * 100 : null,
        followUpsCompleted: rows.reduce((sum, e) => sum + e.followUpsCompleted, 0),
      };
    })
    .filter((a) => a.leads > 0 || a.viewings > 0);
}

// ---------- response time analytics ----------

export type ResponseTimeStats = {
  avgMinutes: number | null;
  fastestMinutes: number | null;
  slowestMinutes: number | null;
  series: { key: string; label: string; date: Date; avgMinutes: number | null }[];
  byBucket: { bucket: string; total: number; closed: number; conversion: number | null }[];
};

export function responseTimeAnalytics(events: AnalyticsEvent[], _range: DateRange): ResponseTimeStats {
  const withResponse = events.filter((e) => e.responseMinutes != null);
  const values = withResponse.map((e) => e.responseMinutes as number);

  const weekly = new Map<string, { date: Date; total: number; count: number }>();
  for (const e of withResponse) {
    const { key, bucketDate } = bucketKey(e.date, "weekly");
    if (!weekly.has(key)) weekly.set(key, { date: bucketDate, total: 0, count: 0 });
    const b = weekly.get(key)!;
    b.total += e.responseMinutes as number;
    b.count += 1;
  }
  const series = Array.from(weekly.entries())
    .map(([key, v]) => ({ key, date: v.date, label: v.date.toLocaleDateString(undefined, { month: "short", day: "numeric" }), avgMinutes: v.count ? v.total / v.count : null }))
    .sort((a, b) => a.date.getTime() - b.date.getTime());

  const bucketDefs: { bucket: string; test: (m: number) => boolean }[] = [
    { bucket: "Under 15 min", test: (m) => m < 15 },
    { bucket: "15–60 min", test: (m) => m >= 15 && m < 60 },
    { bucket: "1–4 hours", test: (m) => m >= 60 && m < 240 },
    { bucket: "4+ hours", test: (m) => m >= 240 },
  ];
  const byBucket = bucketDefs.map(({ bucket, test }) => {
    const rows = withResponse.filter((e) => test(e.responseMinutes as number));
    const closed = rows.filter((e) => e.finalStage === "Won").length;
    return { bucket, total: rows.length, closed, conversion: rows.length ? (closed / rows.length) * 100 : null };
  });

  return {
    avgMinutes: values.length ? values.reduce((a, b) => a + b, 0) / values.length : null,
    fastestMinutes: values.length ? Math.min(...values) : null,
    slowestMinutes: values.length ? Math.max(...values) : null,
    series,
    byBucket,
  };
}

// ---------- commercial performance ----------
//
// There is no "confirmed sale price" field anywhere in the schema — the
// closest real, non-fabricated figure is a contact's own stated budget
// (contacts.budget_max, falling back to budget_min). Pipeline/Closed value
// here are explicitly estimates built from that declared figure, not actual
// transaction values — see the disclaimer text in
// CommercialPerformanceSection.tsx.

export type CommercialBreakdownRow = { label: string; pipelineValue: number; closedValue: number; closedDeals: number };
export type CommercialPerformance = {
  pipelineValue: number;
  closedValue: number;
  avgDealValue: number | null;
  closedDeals: number;
  byListingType: CommercialBreakdownRow[];
  byCommunity: CommercialBreakdownRow[];
  byPropertyType: CommercialBreakdownRow[];
  byAgent: CommercialBreakdownRow[];
};

export function commercialPerformance(events: AnalyticsEvent[]): CommercialPerformance {
  const active = events.filter((e) => !e.lost && e.finalStage !== "Won" && reached(e, "Qualified") && e.budgetValue != null);
  const won = events.filter((e) => e.finalStage === "Won" && e.budgetValue != null);

  const pipelineValue = active.reduce((sum, e) => sum + (e.budgetValue ?? 0), 0);
  const closedValue = won.reduce((sum, e) => sum + (e.budgetValue ?? 0), 0);

  function breakdown(keyFn: (e: AnalyticsEvent) => string | null): CommercialBreakdownRow[] {
    const map = new Map<string, CommercialBreakdownRow>();
    for (const e of active) {
      const key = keyFn(e);
      if (!key) continue;
      if (!map.has(key)) map.set(key, { label: key, pipelineValue: 0, closedValue: 0, closedDeals: 0 });
      map.get(key)!.pipelineValue += e.budgetValue ?? 0;
    }
    for (const e of won) {
      const key = keyFn(e);
      if (!key) continue;
      if (!map.has(key)) map.set(key, { label: key, pipelineValue: 0, closedValue: 0, closedDeals: 0 });
      const row = map.get(key)!;
      row.closedValue += e.budgetValue ?? 0;
      row.closedDeals += 1;
    }
    return Array.from(map.values()).sort((a, b) => b.pipelineValue + b.closedValue - (a.pipelineValue + a.closedValue));
  }

  return {
    pipelineValue,
    closedValue,
    avgDealValue: won.length ? closedValue / won.length : null,
    closedDeals: won.length,
    byListingType: breakdown((e) => e.property?.listingType ?? null),
    byCommunity: breakdown((e) => e.community),
    byPropertyType: breakdown((e) => e.propertyType),
    byAgent: breakdown((e) => e.agent || null),
  };
}

// ---------- insights (derived from real events) ----------

export type Insight = { text: string; tone: "positive" | "negative" | "neutral" };

export function buildInsights(events: AnalyticsEvent[], prevEvents: AnalyticsEvent[], comparisonLabel: string): Insight[] {
  const insights: Insight[] = [];
  const kpi = computeKpis(events);
  const prevKpi = computeKpis(prevEvents);
  const comparisonText = comparisonLabel.toLowerCase();

  const enquiryChange = pctChange(kpi.enquiries, prevKpi.enquiries);
  if (enquiryChange != null && Math.abs(enquiryChange) >= 3) {
    insights.push({
      text: `Enquiry volume ${enquiryChange >= 0 ? "increased" : "decreased"} ${Math.abs(enquiryChange).toFixed(0)}% compared with the ${comparisonText}.`,
      tone: enquiryChange >= 0 ? "positive" : "negative",
    });
  }

  if (kpi.avgResponseMinutes != null && prevKpi.avgResponseMinutes != null) {
    const diff = prevKpi.avgResponseMinutes - kpi.avgResponseMinutes;
    if (Math.abs(diff) >= 2) {
      insights.push({
        text: `Average response time ${diff > 0 ? "improved" : "slowed"} by ${Math.abs(Math.round(diff))} minutes vs the ${comparisonText}.`,
        tone: diff > 0 ? "positive" : "negative",
      });
    }
  }

  const communities = communityPerformance(events).filter((c) => c.enquiries >= 3);
  if (communities.length >= 2) {
    const byDemand = [...communities].sort((a, b) => b.enquiries - a.enquiries);
    const byConversion = [...communities].filter((c) => c.conversion != null).sort((a, b) => (b.conversion ?? 0) - (a.conversion ?? 0));
    const topDemand = byDemand[0];
    const topConversion = byConversion[0];
    if (topConversion && topDemand && topConversion.community !== topDemand.community) {
      insights.push({
        text: `${topConversion.community} has lower enquiry volume than ${topDemand.community} but a higher lead conversion rate (${(topConversion.conversion ?? 0).toFixed(0)}% vs ${(topDemand.conversion ?? 0).toFixed(0)}%).`,
        tone: "neutral",
      });
    }
  }

  const properties = propertyPerformance(events);
  if (properties[0]) {
    insights.push({ text: `${properties[0].property.title} is generating the highest enquiry volume in this period (${properties[0].enquiries} enquiries).`, tone: "neutral" });
  }

  const sources = leadSourceQuality(events).filter((s) => s.leads >= 3).sort((a, b) => (b.closeRate ?? 0) - (a.closeRate ?? 0));
  if (sources[0]) {
    insights.push({ text: `${sources[0].source} leads have the strongest close rate at ${(sources[0].closeRate ?? 0).toFixed(0)}%.`, tone: "positive" });
  }

  const funnel = funnelSteps(events);
  const conversions = funnelConversions(funnel);
  const weakest = conversions.filter((c) => c.rate != null).sort((a, b) => (a.rate ?? 100) - (b.rate ?? 100))[0];
  if (weakest && weakest.rate != null) {
    insights.push({ text: `The biggest drop-off is ${weakest.from} → ${weakest.to}: ${(100 - weakest.rate).toFixed(0)}% do not progress to the next stage.`, tone: "negative" });
  }

  return insights;
}
