import { supabase } from "./supabase";

// Matches public.communities exactly (see
// 202608251200_create_properties_schema.sql +
// 202608272200_add_communities_admin_management.sql). key/label/image/
// image_alt/description are the existing, authoritative fields — never
// renamed or duplicated here. hero_image/sort_order/is_active are the only
// new columns, added because no existing field already covered them.
//
// NOTE: the original migration's `url text` column was never actually
// live — this table predates that migration file (create table if not
// exists no-op'd against it), confirmed by querying the real row shape
// directly. data/supabase-adapter.js's reconstructCommunity() already
// never reads row.url for exactly this reason, deriving `communities/{key}`
// itself instead — the admin does the same below rather than writing to a
// column that doesn't exist.
export type Community = {
  key: string;
  label: string;
  image: string;
  image_alt: string;
  description: string;
  hero_image: string | null;
  // Longer "about this community" copy shown below the hero, distinct from
  // `description` (the short carousel/intro summary) — see
  // 202608272300_add_community_overview.sql.
  overview: string | null;
  sort_order: number;
  is_active: boolean;
};

export type CommunityListItem = Community & { propertyCount: number; url: string };

function withUrl<T extends { key: string }>(row: T): T & { url: string } {
  return { ...row, url: `communities/${row.key}` };
}

export function errorMessage(err: unknown, fallback: string): string {
  return err && typeof err === "object" && "message" in err && typeof (err as { message: unknown }).message === "string"
    ? (err as { message: string }).message
    : fallback;
}

// properties(count) is a PostgREST reverse-relationship aggregate over the
// existing properties.community -> communities.key foreign key — the
// "number of current properties" the brief asks for, with no second
// relationship system and no extra round trip.
export async function fetchCommunitiesList(): Promise<CommunityListItem[]> {
  const { data, error } = await supabase
    .from("communities")
    .select("*, properties(count)")
    .order("sort_order", { ascending: true });
  if (error) throw error;

  return (data ?? []).map((row) => {
    const { properties, ...community } = row as Community & { properties: { count: number }[] };
    return withUrl({ ...community, propertyCount: properties?.[0]?.count ?? 0 });
  });
}

export async function fetchCommunity(key: string): Promise<Community | null> {
  const { data, error } = await supabase.from("communities").select("*").eq("key", key).maybeSingle();
  if (error) throw error;
  return data;
}

export type CommunityWritePayload = {
  label: string;
  image: string;
  image_alt: string;
  description: string;
  hero_image: string | null;
  overview: string | null;
  is_active: boolean;
};

export async function createCommunity(key: string, payload: CommunityWritePayload): Promise<void> {
  const { error } = await supabase.from("communities").insert({ key, ...payload });
  if (error) throw error;
}

export async function updateCommunity(key: string, payload: CommunityWritePayload): Promise<void> {
  const { error } = await supabase.from("communities").update(payload).eq("key", key);
  if (error) throw error;
}

// Plain per-row UPDATEs, not upsert — an upsert payload that omits the
// table's other NOT NULL columns (label/image/image_alt/description)
// fails validation against the proposed INSERT row before Postgres even
// checks for a conflict, even though every row here always already exists
// and only sort_order ever changes. Same fix already applied to
// reorderHeroSlides in lib/hero.ts.
export async function reorderCommunities(orderedKeys: string[]): Promise<void> {
  const results = await Promise.all(
    orderedKeys.map((key, index) => supabase.from("communities").update({ sort_order: index }).eq("key", key)),
  );
  const failed = results.find((r) => r.error);
  if (failed?.error) throw failed.error;
}
