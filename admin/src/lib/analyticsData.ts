// Local-only mock analytics data for the Analytics module. No Supabase, no
// API calls, no external analytics services — every number on screen is
// computed from the synthetic event dataset generated below, the same way
// real analytics would later be computed from live enquiry/lead records.
// Nothing in this file talks to a backend.

import { AGENTS, COMMUNITIES, SOURCES, type Agent, type LeadSource } from "./leadsData";

export type PropertyType = "Apartment" | "Villa" | "Townhouse" | "Penthouse" | "Land" | "Commercial" | "Other";
export type ListingType = "Sale" | "Rent" | "Lease";
export type FunnelStage = "Enquiry" | "Contacted" | "Qualified" | "Viewing" | "Negotiation" | "Won" | "Lost";

export type AnalyticsProperty = {
  id: string;
  title: string;
  community: string;
  propertyType: PropertyType;
  listingType: ListingType;
  price: number;
  currency: "KES";
  weight: number;
};

// A small, deliberately uneven catalogue — some listings are far more
// popular than others, which is what makes "top performing" vs "low
// engagement" comparisons meaningful rather than arbitrary.
export const ANALYTICS_PROPERTIES: AnalyticsProperty[] = [
  { id: "pr1", title: "Westlands 3BR Apartment", community: "Westlands", propertyType: "Apartment", listingType: "Sale", price: 12_500_000, currency: "KES", weight: 9.5 },
  { id: "pr2", title: "Runda Villa", community: "Runda", propertyType: "Villa", listingType: "Sale", price: 28_000_000, currency: "KES", weight: 7.2 },
  { id: "pr3", title: "Karen Townhouse", community: "Karen", propertyType: "Townhouse", listingType: "Sale", price: 19_500_000, currency: "KES", weight: 5.6 },
  { id: "pr4", title: "Kilimani 2BR", community: "Kilimani", propertyType: "Apartment", listingType: "Sale", price: 8_900_000, currency: "KES", weight: 4.8 },
  { id: "pr5", title: "Karen Estate Villa", community: "Karen", propertyType: "Villa", listingType: "Sale", price: 28_000_000, currency: "KES", weight: 3.4 },
  { id: "pr6", title: "Kileleshwa 2BR Apartment", community: "Kileleshwa", propertyType: "Apartment", listingType: "Sale", price: 8_200_000, currency: "KES", weight: 4.1 },
  { id: "pr7", title: "Vipingo Beach Villa", community: "Vipingo", propertyType: "Villa", listingType: "Rent", price: 220_000, currency: "KES", weight: 3.0 },
  { id: "pr8", title: "Lavington Townhouse", community: "Lavington", propertyType: "Townhouse", listingType: "Sale", price: 16_800_000, currency: "KES", weight: 2.6 },
  { id: "pr9", title: "Runda Townhouse", community: "Runda", propertyType: "Townhouse", listingType: "Sale", price: 15_200_000, currency: "KES", weight: 2.9 },
  { id: "pr10", title: "Gigiri 4BR Apartment", community: "Gigiri", propertyType: "Apartment", listingType: "Rent", price: 280_000, currency: "KES", weight: 2.2 },
  { id: "pr11", title: "Muthaiga Villa", community: "Muthaiga", propertyType: "Villa", listingType: "Sale", price: 42_000_000, currency: "KES", weight: 1.4 },
  { id: "pr12", title: "Ridgeways Apartment", community: "Ridgeways", propertyType: "Apartment", listingType: "Sale", price: 7_100_000, currency: "KES", weight: 1.9 },
  { id: "pr13", title: "Kilimani Penthouse", community: "Kilimani", propertyType: "Penthouse", listingType: "Sale", price: 34_500_000, currency: "KES", weight: 1.1 },
  { id: "pr14", title: "Westlands Commercial Suite", community: "Westlands", propertyType: "Commercial", listingType: "Lease", price: 450_000, currency: "KES", weight: 0.9 },
];

export type AnalyticsEvent = {
  id: string;
  date: Date; // when the enquiry was received
  property: AnalyticsProperty;
  source: LeadSource;
  agent: Agent;
  finalStage: FunnelStage; // furthest stage genuinely reached
  lost: boolean;
  lostAt: Date | null;
  contactedAt: Date | null;
  qualifiedAt: Date | null;
  viewingAt: Date | null;
  negotiationAt: Date | null;
  closedAt: Date | null; // Won only
  responseMinutes: number | null;
  dealValue: number | null; // Won only
};

// --- deterministic PRNG (mulberry32) so the dataset is stable across
// reloads/renders instead of re-randomizing on every render. ---
function mulberry32(seed: number) {
  let a = seed;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function weightedPick<T>(rng: () => number, items: T[], weight: (item: T) => number): T {
  const total = items.reduce((sum, item) => sum + weight(item), 0);
  let roll = rng() * total;
  for (const item of items) {
    roll -= weight(item);
    if (roll <= 0) return item;
  }
  return items[items.length - 1];
}

const SOURCE_WEIGHTS: Record<LeadSource, number> = {
  Website: 42,
  "Enquiry Form": 12,
  WhatsApp: 20,
  Phone: 11,
  Referral: 9,
  "Social Media": 4,
  "Walk-in": 1.4,
  Other: 0.6,
};

const AGENT_WEIGHTS: Record<Agent, number> = { Alex: 38, Sarah: 33, Brian: 29 };

// Agents differ slightly in speed and follow-through — this is what gives
// Agent Performance something real to compare rather than a flat table.
const AGENT_PROFILE: Record<Agent, { responseFactor: number; contactRate: number; qualifyRate: number }> = {
  Alex: { responseFactor: 0.72, contactRate: 0.82, qualifyRate: 0.6 },
  Sarah: { responseFactor: 0.92, contactRate: 0.76, qualifyRate: 0.55 },
  Brian: { responseFactor: 1.28, contactRate: 0.68, qualifyRate: 0.47 },
};

const DAY_MS = 86_400_000;
const DATASET_DAYS = 450; // ~15 months of history

function generateDataset(): AnalyticsEvent[] {
  const rng = mulberry32(20260829);
  const events: AnalyticsEvent[] = [];
  const now = new Date();
  const start = new Date(now.getTime() - DATASET_DAYS * DAY_MS);
  let counter = 0;

  for (let dayOffset = 0; dayOffset < DATASET_DAYS; dayOffset++) {
    const day = new Date(start.getTime() + dayOffset * DAY_MS);
    const dow = day.getDay();
    const weekendFactor = dow === 0 || dow === 6 ? 0.65 : 1;
    // Gentle organic growth over the dataset lifetime, plus a slow seasonal wave.
    const growthFactor = 0.72 + (dayOffset / DATASET_DAYS) * 0.6;
    const seasonal = 1 + 0.18 * Math.sin((dayOffset / 30) * Math.PI);
    const baseRate = 4.1 * weekendFactor * growthFactor * seasonal;
    const noise = 0.55 + rng() * 0.9;
    const count = Math.max(0, Math.round(baseRate * noise));

    for (let i = 0; i < count; i++) {
      counter++;
      const hour = 7 + Math.floor(rng() * 13);
      const minute = Math.floor(rng() * 60);
      const enquiryDate = new Date(day.getFullYear(), day.getMonth(), day.getDate(), hour, minute);
      const property = weightedPick(rng, ANALYTICS_PROPERTIES, (p) => p.weight);
      const source = weightedPick(rng, SOURCES, (s) => SOURCE_WEIGHTS[s]);
      const agent = weightedPick(rng, AGENTS, (a) => AGENT_WEIGHTS[a]);
      const profile = AGENT_PROFILE[agent];
      const daysSinceEnquiry = (now.getTime() - enquiryDate.getTime()) / DAY_MS;

      let finalStage: FunnelStage = "Enquiry";
      let lost = false;
      let lostAt: Date | null = null;
      let contactedAt: Date | null = null;
      let qualifiedAt: Date | null = null;
      let viewingAt: Date | null = null;
      let negotiationAt: Date | null = null;
      let closedAt: Date | null = null;
      let responseMinutes: number | null = null;
      let dealValue: number | null = null;

      // Response speed trends faster over the dataset's timeline (recent
      // enquiries get answered quicker), matching the "improved by N
      // minutes" insight the module is meant to surface.
      const eraFactor = 1.4 - (dayOffset / DATASET_DAYS) * 0.55;
      const baseResponse = 12 + rng() * 90;
      const thisResponse = Math.max(4, Math.round(baseResponse * eraFactor * profile.responseFactor));

      const contacted = rng() < profile.contactRate;
      if (contacted) {
        responseMinutes = thisResponse;
        contactedAt = new Date(enquiryDate.getTime() + thisResponse * 60_000);
        finalStage = "Contacted";

        const qualified = rng() < profile.qualifyRate;
        if (qualified) {
          qualifiedAt = new Date(contactedAt.getTime() + (1 + rng() * 4) * DAY_MS);
          finalStage = "Qualified";

          const viewed = rng() < 0.63;
          if (viewed) {
            viewingAt = new Date(qualifiedAt.getTime() + (1 + rng() * 6) * DAY_MS);
            finalStage = "Viewing";

            const negotiated = rng() < 0.45;
            if (negotiated) {
              negotiationAt = new Date(viewingAt.getTime() + (1 + rng() * 5) * DAY_MS);
              finalStage = "Negotiation";

              const won = rng() < 0.42;
              if (won) {
                closedAt = new Date(negotiationAt.getTime() + (2 + rng() * 10) * DAY_MS);
                if (closedAt.getTime() <= now.getTime()) {
                  finalStage = "Won";
                  const variance = 0.9 + rng() * 0.18;
                  dealValue = Math.round(property.price * (property.listingType === "Sale" ? variance : variance * 12));
                } else {
                  closedAt = null;
                }
              }
            }
          }
        }
      }

      // Anything that stalled and is old enough to no longer be "active
      // pipeline" is resolved as Lost — recent stalls are left open,
      // representing enquiries still genuinely in progress.
      if (finalStage !== "Won" && daysSinceEnquiry > 21 && rng() < 0.78) {
        lost = true;
        lostAt = new Date(enquiryDate.getTime() + (10 + rng() * 30) * DAY_MS);
      }

      events.push({
        id: `ev${counter}`,
        date: enquiryDate,
        property,
        source,
        agent,
        finalStage,
        lost,
        lostAt,
        contactedAt,
        qualifiedAt,
        viewingAt,
        negotiationAt,
        closedAt,
        responseMinutes,
        dealValue,
      });
    }
  }

  return events;
}

export const ANALYTICS_EVENTS: AnalyticsEvent[] = generateDataset();

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
  agents: Agent[];
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
    if (filters.properties.length && !filters.properties.includes(e.property.id)) return false;
    if (filters.communities.length && !filters.communities.includes(e.property.community)) return false;
    if (filters.propertyTypes.length && !filters.propertyTypes.includes(e.property.propertyType)) return false;
    if (filters.listingTypes.length && !filters.listingTypes.includes(e.property.listingType)) return false;
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
  for (const p of ANALYTICS_PROPERTIES) map.set(p.id, { property: p, enquiries: 0, leads: 0, viewings: 0, closed: 0, conversion: null });
  for (const e of events) {
    const row = map.get(e.property.id);
    if (!row) continue;
    row.enquiries += 1;
    if (reached(e, "Qualified")) row.leads += 1;
    if (reached(e, "Viewing")) row.viewings += 1;
    if (e.finalStage === "Won") row.closed += 1;
  }
  const rows = Array.from(map.values()).filter((r) => r.enquiries > 0);
  for (const r of rows) r.conversion = r.enquiries > 0 ? (r.closed / r.enquiries) * 100 : null;
  return rows;
}

// ---------- community performance ----------

export type CommunityPerformance = { community: string; enquiries: number; leads: number; viewings: number; closed: number; conversion: number | null };

export function communityPerformance(events: AnalyticsEvent[]): CommunityPerformance[] {
  const map = new Map<string, CommunityPerformance>();
  for (const c of COMMUNITIES) map.set(c, { community: c, enquiries: 0, leads: 0, viewings: 0, closed: 0, conversion: null });
  for (const e of events) {
    const row = map.get(e.property.community);
    if (!row) continue;
    row.enquiries += 1;
    if (reached(e, "Qualified")) row.leads += 1;
    if (reached(e, "Viewing")) row.viewings += 1;
    if (e.finalStage === "Won") row.closed += 1;
  }
  const rows = Array.from(map.values()).filter((r) => r.enquiries > 0);
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
  agent: Agent;
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
  return AGENTS.map((agent) => {
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
      // Deterministic mock — proportional to lead volume with a per-agent modifier.
      followUpsCompleted: Math.round(qualified.length * (agent === "Alex" ? 0.86 : agent === "Sarah" ? 0.79 : 0.68)),
    };
  }).filter((a) => a.leads > 0 || a.viewings > 0);
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

// ---------- website performance (simulated, not derived from CRM events) ----------

export type WebsitePerformance = {
  visitors: number;
  pageViews: number;
  enquirySubmissions: number;
  conversionRate: number | null;
  series: { key: string; label: string; date: Date; visitors: number }[];
  mostViewed: { property: AnalyticsProperty; views: number; enquiries: number; leads: number }[];
  trafficSources: { source: string; pct: number }[];
};

export function websitePerformance(events: AnalyticsEvent[], range: DateRange, granularity: Granularity): WebsitePerformance {
  const rng = mulberry32(Math.floor(range.start.getTime() / DAY_MS) + 7);
  const websiteEvents = events.filter((e) => e.source === "Website" || e.source === "Enquiry Form");

  const series = buildTimeSeries(events, range, granularity).map((point) => ({
    key: point.key,
    label: point.label,
    date: point.date,
    // Each website enquiry implies a much larger visitor/browsing base.
    visitors: Math.round(point.enquiries * (34 + rng() * 22) + rng() * 12),
  }));
  const visitors = series.reduce((sum, s) => sum + s.visitors, 0);
  const pageViews = Math.round(visitors * (2.1 + rng() * 0.8));
  const enquirySubmissions = websiteEvents.length;

  const perf = propertyPerformance(events);
  const mostViewed = perf
    .map((row) => ({
      property: row.property,
      views: Math.round(row.enquiries * (55 + rng() * 40) + row.property.weight * 20),
      enquiries: row.enquiries,
      leads: row.leads,
    }))
    .sort((a, b) => b.views - a.views)
    .slice(0, 6);

  const src = sourceBreakdown(events);
  const trafficSources = src.map((s) => ({ source: s.source, pct: s.pct }));

  return {
    visitors,
    pageViews,
    enquirySubmissions,
    conversionRate: visitors > 0 ? (enquirySubmissions / visitors) * 100 : null,
    series,
    mostViewed,
    trafficSources,
  };
}

// ---------- commercial performance ----------

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

function estimatedValue(e: AnalyticsEvent): number {
  return e.property.listingType === "Sale" ? e.property.price : e.property.price * 12;
}

export function commercialPerformance(events: AnalyticsEvent[]): CommercialPerformance {
  const active = events.filter((e) => !e.lost && e.finalStage !== "Won" && reached(e, "Qualified"));
  const won = events.filter((e) => e.finalStage === "Won" && e.dealValue != null);

  const pipelineValue = active.reduce((sum, e) => sum + estimatedValue(e), 0);
  const closedValue = won.reduce((sum, e) => sum + (e.dealValue ?? 0), 0);

  function breakdown(keyFn: (e: AnalyticsEvent) => string): CommercialBreakdownRow[] {
    const map = new Map<string, CommercialBreakdownRow>();
    for (const e of active) {
      const key = keyFn(e);
      if (!map.has(key)) map.set(key, { label: key, pipelineValue: 0, closedValue: 0, closedDeals: 0 });
      map.get(key)!.pipelineValue += estimatedValue(e);
    }
    for (const e of won) {
      const key = keyFn(e);
      if (!map.has(key)) map.set(key, { label: key, pipelineValue: 0, closedValue: 0, closedDeals: 0 });
      const row = map.get(key)!;
      row.closedValue += e.dealValue ?? 0;
      row.closedDeals += 1;
    }
    return Array.from(map.values()).sort((a, b) => b.pipelineValue + b.closedValue - (a.pipelineValue + a.closedValue));
  }

  return {
    pipelineValue,
    closedValue,
    avgDealValue: won.length ? closedValue / won.length : null,
    closedDeals: won.length,
    byListingType: breakdown((e) => e.property.listingType),
    byCommunity: breakdown((e) => e.property.community),
    byPropertyType: breakdown((e) => e.property.propertyType),
    byAgent: breakdown((e) => e.agent),
  };
}

// ---------- insights (deterministic, derived from the mock dataset) ----------

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

  const properties = propertyPerformance(events).sort((a, b) => b.enquiries - a.enquiries);
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
