// Converts between the raw JSONB shapes actually stored in
// properties.story / .feature_highlights / .payment_plan / .lease_pricing
// (confirmed against live data, not guessed) and the structured editor
// drafts in components/StoriesEditor.tsx etc. Nothing here invents a new
// data model — every field name matches what's already in the database.
import type { StoryItem } from "../components/StoriesEditor";
import type { HighlightItem } from "../components/FeatureHighlightsEditor";
import type { PaymentPlanItemDraft } from "../components/PaymentPlanEditor";
import type { LeasePricingDraft } from "../components/LeasePricingEditor";
import { blankLeasePricing } from "../components/LeasePricingEditor";

function makeKey() {
  return Math.random().toString(36).slice(2);
}

// If the admin never touched a section, save the ORIGINAL raw value back
// unchanged rather than round-tripping it through our serializer — this is
// a stronger guarantee of "preserve existing data the form does not modify"
// than re-serializing would be: it survives even a shape our parser doesn't
// fully model (extra keys, different number formatting, etc.), not just the
// shapes we know about.
function unchangedOrReserialize<T>(
  current: T,
  originalRaw: unknown,
  parse: (raw: unknown) => T,
  serialize: (value: T) => unknown,
  stripForCompare: (value: T) => unknown,
): unknown {
  const originalParsed = parse(originalRaw);
  const unchanged = JSON.stringify(stripForCompare(current)) === JSON.stringify(stripForCompare(originalParsed));
  return unchanged ? (originalRaw ?? null) : serialize(current);
}

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

// --- story: { rows: [{ title, body }] } ---------------------------------

export function parseStories(raw: unknown): StoryItem[] {
  if (isObject(raw) && Array.isArray(raw.rows)) {
    return raw.rows.map((r) => ({
      _key: makeKey(),
      title: isObject(r) && typeof r.title === "string" ? r.title : "",
      body: isObject(r) && typeof r.body === "string" ? r.body : "",
    }));
  }
  return [];
}

export function serializeStories(items: StoryItem[]): { rows: { title: string; body: string }[] } | null {
  const rows = items
    .map((i) => ({ title: i.title.trim(), body: i.body.trim() }))
    .filter((r) => r.title || r.body);
  return rows.length > 0 ? { rows } : null;
}

// --- feature_highlights: [{ title, text }] ------------------------------

export function parseHighlights(raw: unknown): HighlightItem[] {
  if (Array.isArray(raw)) {
    return raw.map((r) => ({
      _key: makeKey(),
      title: isObject(r) && typeof r.title === "string" ? r.title : "",
      text: isObject(r) && typeof r.text === "string" ? r.text : "",
    }));
  }
  return [];
}

export function serializeHighlights(items: HighlightItem[]): { title: string; text: string }[] | null {
  const rows = items
    .map((i) => ({ title: i.title.trim(), text: i.text.trim() }))
    .filter((r) => r.title || r.text);
  return rows.length > 0 ? rows : null;
}

// --- payment_plan: [{ label, percent }] -----------------------------------

export function parsePaymentPlan(raw: unknown): PaymentPlanItemDraft[] {
  if (Array.isArray(raw)) {
    return raw.map((r) => ({
      _key: makeKey(),
      label: isObject(r) && typeof r.label === "string" ? r.label : "",
      percent: isObject(r) && typeof r.percent === "number" ? String(r.percent) : "",
    }));
  }
  return [];
}

export function serializePaymentPlan(items: PaymentPlanItemDraft[]): { label: string; percent: number }[] | null {
  const rows = items
    .map((i) => ({ label: i.label.trim(), percent: Number(i.percent) || 0 }))
    .filter((r) => r.label || r.percent);
  return rows.length > 0 ? rows : null;
}

// --- lease_pricing: structured object, fields all optional ---------------

export function parseLeasePricing(raw: unknown): LeasePricingDraft {
  const draft = blankLeasePricing();
  if (!isObject(raw)) return draft;

  const num = (v: unknown) => (typeof v === "number" ? String(v) : "");
  const str = (v: unknown) => (typeof v === "string" ? v : "");

  if (isObject(raw.fromPerSqFt)) {
    draft.fromPerSqFtMin = num(raw.fromPerSqFt.min);
    draft.fromPerSqFtMax = num(raw.fromPerSqFt.max);
  }
  if (isObject(raw.spaceAvailable)) {
    draft.spaceAvailableMin = num(raw.spaceAvailable.min);
    draft.spaceAvailableMax = num(raw.spaceAvailable.max);
    draft.spaceAvailableUnit = str(raw.spaceAvailable.unit);
  }
  draft.parkingRatio = str(raw.parkingRatio);
  draft.parkingNote = str(raw.parkingNote);
  draft.serviceChargePerSqFt = num(raw.serviceChargePerSqFt);
  draft.serviceChargeNote = str(raw.serviceChargeNote);
  draft.saleAndLeaseAvailable = raw.saleAndLeaseAvailable === true;
  if (Array.isArray(raw.zones)) {
    draft.zones = raw.zones.map((z) => ({
      _key: makeKey(),
      name: isObject(z) ? str(z.name) : "",
      floors: isObject(z) ? str(z.floors) : "",
      minPerSqFt: isObject(z) ? num(z.minPerSqFt) : "",
      maxPerSqFt: isObject(z) ? num(z.maxPerSqFt) : "",
    }));
  }
  return draft;
}

export function serializeLeasePricing(v: LeasePricingDraft): Record<string, unknown> | null {
  const out: Record<string, unknown> = {};

  if (v.fromPerSqFtMin.trim() || v.fromPerSqFtMax.trim()) {
    out.fromPerSqFt = { min: Number(v.fromPerSqFtMin) || null, max: Number(v.fromPerSqFtMax) || null };
  }
  if (v.spaceAvailableMin.trim() || v.spaceAvailableMax.trim() || v.spaceAvailableUnit.trim()) {
    out.spaceAvailable = {
      min: Number(v.spaceAvailableMin) || null,
      max: Number(v.spaceAvailableMax) || null,
      unit: v.spaceAvailableUnit.trim() || null,
    };
  }
  if (v.parkingRatio.trim()) out.parkingRatio = v.parkingRatio.trim();
  if (v.parkingNote.trim()) out.parkingNote = v.parkingNote.trim();
  if (v.serviceChargePerSqFt.trim()) out.serviceChargePerSqFt = Number(v.serviceChargePerSqFt) || null;
  if (v.serviceChargeNote.trim()) out.serviceChargeNote = v.serviceChargeNote.trim();
  if (v.saleAndLeaseAvailable) out.saleAndLeaseAvailable = true;

  const zones = v.zones
    .map((z) => ({
      name: z.name.trim(),
      floors: z.floors.trim(),
      minPerSqFt: Number(z.minPerSqFt) || null,
      maxPerSqFt: Number(z.maxPerSqFt) || null,
    }))
    .filter((z) => z.name || z.floors || z.minPerSqFt || z.maxPerSqFt);
  if (zones.length > 0) out.zones = zones;

  return Object.keys(out).length > 0 ? out : null;
}

// --- save-time resolution: pass through unchanged sections verbatim ------

const stripKey = <T extends { _key: string }>(i: T) => {
  const { _key, ...rest } = i;
  return rest;
};
const stripKeys = <T extends { _key: string }>(items: T[]) => items.map(stripKey);

export function resolveStoriesForSave(items: StoryItem[], originalRaw: unknown): unknown {
  return unchangedOrReserialize(items, originalRaw, parseStories, serializeStories, stripKeys);
}

export function resolveHighlightsForSave(items: HighlightItem[], originalRaw: unknown): unknown {
  return unchangedOrReserialize(items, originalRaw, parseHighlights, serializeHighlights, stripKeys);
}

export function resolvePaymentPlanForSave(items: PaymentPlanItemDraft[], originalRaw: unknown): unknown {
  return unchangedOrReserialize(items, originalRaw, parsePaymentPlan, serializePaymentPlan, stripKeys);
}

export function resolveLeasePricingForSave(value: LeasePricingDraft, originalRaw: unknown): unknown {
  return unchangedOrReserialize(value, originalRaw, parseLeasePricing, serializeLeasePricing, (v) => ({
    ...v,
    zones: stripKeys(v.zones),
  }));
}
