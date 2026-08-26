import { supabase } from "./supabase";

export type Community = { key: string; label: string };

export type EditorUnit = {
  id: string | null; // null = not yet persisted (added this session)
  unit_type: string | null;
  bedrooms: number | null;
  bathrooms: number | null;
  sale_price: number | null;
  rent_price: number | null;
  currency: string | null;
  residence_label: string | null;
  area: string | null;
  note: string | null;
};

export type PropertyDetail = {
  id: string;
  legacy_id: string;
  slug: string;
  status: string;
  collection: string | null;
  title: string;
  summary: string | null;
  property_type: string | null;
  community: string | null;
  location: string;
  letting: string | null;
  features: string[];
  image: string;
  hero_image: string | null;
  gallery: string[];
  description_title: string | null;
  description_body: string;
  feature_location: string | null;
  story: unknown;
  feature_highlights: unknown;
  closing_paragraphs: string | null;
  payment_plan: unknown;
  lease_pricing: unknown;
  listed_date: string | null;
  units: EditorUnit[];
};

export async function fetchCommunities(): Promise<Community[]> {
  const { data, error } = await supabase.from("communities").select("key, label").order("label");
  if (error) throw error;
  return data ?? [];
}

export async function fetchPropertyForEdit(id: string): Promise<PropertyDetail> {
  const { data, error } = await supabase
    .from("properties")
    .select(
      "id, legacy_id, slug, status, collection, title, summary, property_type, community, location, letting, features, image, hero_image, gallery, description_title, description_body, feature_location, story, feature_highlights, closing_paragraphs, payment_plan, lease_pricing, listed_date, property_units(id, unit_type, bedrooms, bathrooms, sale_price, rent_price, currency, residence_label, area, note, display_order)",
    )
    .eq("id", id)
    .single();
  if (error) throw error;

  const units = (data.property_units ?? [])
    .slice()
    .sort((a, b) => a.display_order - b.display_order)
    .map((u) => ({
      id: u.id,
      unit_type: u.unit_type,
      bedrooms: u.bedrooms,
      bathrooms: u.bathrooms,
      sale_price: u.sale_price,
      rent_price: u.rent_price,
      currency: u.currency,
      residence_label: u.residence_label,
      area: u.area,
      note: u.note,
    }));

  return { ...data, units };
}

export type PropertyWritePayload = {
  slug: string;
  status: string;
  collection: string | null;
  title: string;
  summary: string | null;
  property_type: string | null;
  community: string | null;
  location: string;
  letting: string | null;
  features: string[];
  image: string;
  hero_image: string | null;
  gallery: string[];
  description_title: string | null;
  description_body: string;
  feature_location: string | null;
  story: unknown;
  feature_highlights: unknown;
  closing_paragraphs: string | null;
  payment_plan: unknown;
  lease_pricing: unknown;
  listed_date: string | null;
};

type UnitWritePayload = {
  unit_type: string | null;
  bedrooms: number | null;
  bathrooms: number | null;
  sale_price: number | null;
  rent_price: number | null;
  currency: string | null;
  residence_label: string | null;
  area: string | null;
  note: string | null;
};

function unitFields(u: EditorUnit): UnitWritePayload {
  return {
    unit_type: u.unit_type,
    bedrooms: u.bedrooms,
    bathrooms: u.bathrooms,
    sale_price: u.sale_price,
    rent_price: u.rent_price,
    currency: u.currency,
    residence_label: u.residence_label,
    area: u.area,
    note: u.note,
  };
}

// Property first, units second — if the property write fails we never touch
// property_units (no orphaned units). Existing units (have an id) are
// UPDATEd; units added this session (id === null) are INSERTed once the
// parent property id is known, whether the property was just created or
// already existed.
export async function saveProperty(
  propertyId: string | null,
  payload: PropertyWritePayload,
  units: EditorUnit[],
): Promise<{ id: string }> {
  let id = propertyId;

  if (!id) {
    const { data, error } = await supabase
      .from("properties")
      .insert({ ...payload, legacy_id: payload.slug })
      .select("id")
      .single();
    if (error) throw error;
    id = data.id;
  } else {
    const { error } = await supabase
      .from("properties")
      .update({ ...payload, updated_at: new Date().toISOString() })
      .eq("id", id);
    if (error) throw error;
  }

  const existing = units.filter((u) => u.id);
  const fresh = units.filter((u) => !u.id);

  const unitErrors: string[] = [];

  const updateResults = await Promise.all(
    existing.map((u, index) =>
      supabase
        .from("property_units")
        .update({ ...unitFields(u), display_order: index })
        .eq("id", u.id as string),
    ),
  );
  updateResults.forEach((r, i) => {
    if (r.error) unitErrors.push(`Unit ${i + 1}: ${r.error.message}`);
  });

  if (fresh.length > 0) {
    const { error } = await supabase.from("property_units").insert(
      fresh.map((u, index) => ({
        ...unitFields(u),
        property_id: id,
        display_order: existing.length + index,
      })),
    );
    if (error) unitErrors.push(`New unit(s): ${error.message}`);
  }

  if (unitErrors.length > 0) {
    throw new Error(`Property saved, but some units failed to save — ${unitErrors.join("; ")}`);
  }

  return { id: id as string };
}

// property_units has `on delete cascade` on its property_id foreign key
// (see 202608251200_create_properties_schema.sql), so deleting the
// property row alone removes its units too — no separate DELETE grant on
// property_units is needed for that. Uploaded Storage images aren't part
// of this table and are cleaned up separately (see mediaStorage.ts),
// best-effort, after this succeeds.
export async function deleteProperty(id: string): Promise<void> {
  const { error } = await supabase.from("properties").delete().eq("id", id);
  if (error) throw error;
}
