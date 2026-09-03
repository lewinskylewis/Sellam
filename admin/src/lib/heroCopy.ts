import { supabase } from "./supabase";
import { errorMessage, isMissingTableError } from "./hero";

// The homepage hero's editable title/description (index.html, .hero-copy —
// separate from .hero-showcase/.hero-tiles/.hero-dots, the existing image
// carousel, which this never touches). Singleton table: exactly one row.
// See supabase/migrations/202609031000_add_homepage_hero_copy.sql.
export type HeroCopy = {
  id: string;
  heading_line_1: string;
  heading_line_2: string;
  description: string;
  updated_at: string;
};

export { errorMessage, isMissingTableError };

export async function fetchHeroCopy(): Promise<HeroCopy | null> {
  const { data, error } = await supabase
    .from("homepage_hero_copy")
    .select("id, heading_line_1, heading_line_2, description, updated_at")
    .order("updated_at", { ascending: true })
    .limit(1);
  if (error) throw error;
  return data && data.length > 0 ? data[0] : null;
}

export async function updateHeroCopy(
  id: string,
  patch: { heading_line_1: string; heading_line_2: string; description: string },
): Promise<void> {
  const { error } = await supabase
    .from("homepage_hero_copy")
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw error;
}
