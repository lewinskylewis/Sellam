import { supabase } from "./supabase";
import { fetchPropertiesList, type PropertyListItem } from "./properties";
import { errorMessage, isMissingTableError } from "./hero";

// Curates which existing properties appear in the homepage's "Featured
// Properties" and "Exclusive Properties" teaser sections (index.html,
// .property-gallery[data-highlight-section]) and in what order. caption/
// image are optional hand-curated overrides for the homepage card only —
// when null, the public site falls back to the property's own title/image.
// See supabase/migrations/202608291400_add_homepage_property_highlights.sql
// for the full rationale (same shape/philosophy as homepage_hero_slides).
export type HighlightSection = "featured" | "exclusive";

export type PropertyHighlightRow = {
  id: string;
  property_id: string;
  section: HighlightSection;
  caption: string | null;
  image: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
};

export type PropertyHighlight = PropertyHighlightRow & { property: PropertyListItem | null };

// Same problem/fix as hero.ts's resolveHeroImagePreviewUrl — a curated
// highlight's `image` override stores a plain relative path (resolved
// against the public site's own origin there); without this it 404s in the
// admin preview. Absolute URLs and data/blob URIs pass through unchanged.
const PUBLIC_SITE_ORIGIN = "https://sellamre.com/";

export function resolveHighlightImagePreviewUrl(path: string): string {
  if (!path) return "";
  if (/^https?:\/\//i.test(path) || path.startsWith("data:") || path.startsWith("blob:")) return path;
  return PUBLIC_SITE_ORIGIN + path.replace(/^\/+/, "");
}

export { errorMessage, isMissingTableError };

export async function fetchPropertyHighlights(): Promise<PropertyHighlight[]> {
  const [{ data, error }, properties] = await Promise.all([
    supabase
      .from("homepage_property_highlights")
      .select("id, property_id, section, caption, image, sort_order, is_active, created_at")
      .order("section", { ascending: true })
      .order("sort_order", { ascending: true }),
    fetchPropertiesList(),
  ]);
  if (error) throw error;

  const byId = new Map(properties.map((p) => [p.id, p]));
  return (data ?? []).map((row) => ({
    ...row,
    section: row.section as HighlightSection,
    property: byId.get(row.property_id) ?? null,
  }));
}

export async function addPropertyHighlight(propertyId: string, section: HighlightSection): Promise<void> {
  const { data: existing, error: maxError } = await supabase
    .from("homepage_property_highlights")
    .select("sort_order")
    .eq("section", section)
    .order("sort_order", { ascending: false })
    .limit(1);
  if (maxError) throw maxError;
  const nextOrder = existing && existing.length > 0 ? existing[0].sort_order + 1 : 0;

  const { error } = await supabase
    .from("homepage_property_highlights")
    .insert({ property_id: propertyId, section, sort_order: nextOrder, is_active: true });
  if (error) throw error;
}

export async function updatePropertyHighlight(
  id: string,
  patch: Partial<{ caption: string | null; image: string | null; is_active: boolean }>,
): Promise<void> {
  const { error } = await supabase.from("homepage_property_highlights").update(patch).eq("id", id);
  if (error) throw error;
}

export async function removePropertyHighlight(id: string): Promise<void> {
  const { error } = await supabase.from("homepage_property_highlights").delete().eq("id", id);
  if (error) throw error;
}

// Persists a full reorder within one section. Deliberately plain per-row
// UPDATEs rather than upsert — same reasoning as hero.ts's
// reorderHeroSlides: an upsert payload with only {id, sort_order} fails
// NOT NULL validation on property_id/section even though every row already
// exists and only sort_order would ever actually change.
export async function reorderPropertyHighlights(orderedIds: string[]): Promise<void> {
  const results = await Promise.all(
    orderedIds.map((id, index) =>
      supabase.from("homepage_property_highlights").update({ sort_order: index }).eq("id", id),
    ),
  );
  const failed = results.find((r) => r.error);
  if (failed?.error) throw failed.error;
}
