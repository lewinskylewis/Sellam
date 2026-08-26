import { supabase } from "./supabase";
import { fetchPropertiesList, type PropertyListItem } from "./properties";

// Matches script.js's heroProperties shape exactly: only WHICH property and
// WHICH 3 curated photos are hand-authored. Heading/price/location/CTA are
// resolved live off the properties table by the public site, never stored
// here — see 202608271500_add_homepage_hero_slides.sql for the full
// rationale.
export type HeroSection = { label: string; image: string };

export type HeroSlideRow = {
  id: string;
  property_id: string;
  sections: HeroSection[];
  sort_order: number;
  is_active: boolean;
  created_at: string;
};

export type HeroSlide = HeroSlideRow & { property: PropertyListItem | null };

export const HERO_SECTION_SLOTS = 3;

export function blankSections(): HeroSection[] {
  return Array.from({ length: HERO_SECTION_SLOTS }, () => ({ label: "", image: "" }));
}

// PGRST205 = PostgREST "table not found in schema cache" — the exact
// signature seen throughout this project whenever a migration hasn't been
// applied yet (see PHASE 2C/4 reports). Surfaced separately so the UI can
// show a clear "not set up yet" state instead of a generic error message.
export function isMissingTableError(err: unknown): boolean {
  return Boolean(err && typeof err === "object" && "code" in err && (err as { code: unknown }).code === "PGRST205");
}

export function errorMessage(err: unknown, fallback: string): string {
  return err && typeof err === "object" && "message" in err && typeof (err as { message: unknown }).message === "string"
    ? (err as { message: string }).message
    : fallback;
}

export async function fetchHeroSlides(): Promise<HeroSlide[]> {
  const [{ data, error }, properties] = await Promise.all([
    supabase
      .from("homepage_hero_slides")
      .select("id, property_id, sections, sort_order, is_active, created_at")
      .order("sort_order", { ascending: true }),
    fetchPropertiesList(),
  ]);
  if (error) throw error;

  const byId = new Map(properties.map((p) => [p.id, p]));
  return (data ?? []).map((row) => ({
    ...row,
    sections: (row.sections ?? []) as HeroSection[],
    property: byId.get(row.property_id) ?? null,
  }));
}

export async function fetchHeroSlideById(id: string): Promise<HeroSlide | null> {
  const slides = await fetchHeroSlides();
  return slides.find((s) => s.id === id) ?? null;
}

export async function createHeroSlide(propertyId: string, sections: HeroSection[]): Promise<void> {
  const { data: existing, error: maxError } = await supabase
    .from("homepage_hero_slides")
    .select("sort_order")
    .order("sort_order", { ascending: false })
    .limit(1);
  if (maxError) throw maxError;
  const nextOrder = existing && existing.length > 0 ? existing[0].sort_order + 1 : 0;

  const { error } = await supabase
    .from("homepage_hero_slides")
    .insert({ property_id: propertyId, sections, sort_order: nextOrder, is_active: true });
  if (error) throw error;
}

export async function updateHeroSlide(
  id: string,
  patch: Partial<{ property_id: string; sections: HeroSection[]; is_active: boolean }>,
): Promise<void> {
  const { error } = await supabase.from("homepage_hero_slides").update(patch).eq("id", id);
  if (error) throw error;
}

export async function deleteHeroSlide(id: string): Promise<void> {
  const { error } = await supabase.from("homepage_hero_slides").delete().eq("id", id);
  if (error) throw error;
}

// Persists a full reorder. Deliberately plain per-row UPDATEs rather than
// upsert: Postgres validates NOT NULL columns (property_id, sections) against
// the proposed row of an INSERT ... ON CONFLICT statement before it even
// checks for a conflict, so an upsert payload with only {id, sort_order}
// fails with a not-null violation even though every row already exists and
// only sort_order would ever actually change.
export async function reorderHeroSlides(orderedIds: string[]): Promise<void> {
  const results = await Promise.all(
    orderedIds.map((id, index) =>
      supabase.from("homepage_hero_slides").update({ sort_order: index }).eq("id", id),
    ),
  );
  const failed = results.find((r) => r.error);
  if (failed?.error) throw failed.error;
}
