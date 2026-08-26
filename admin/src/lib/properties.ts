import { supabase } from "./supabase";

export type PropertyUnit = {
  id: string;
  unit_type: string | null;
  bedrooms: number | null;
  bathrooms: number | null;
  sale_price: number | null;
  rent_price: number | null;
  currency: string | null;
};

export type PropertyRow = {
  id: string;
  legacy_id: string;
  slug: string;
  status: string;
  collection: string;
  title: string;
  property_type: string;
  community: string;
  location: string;
  letting: string;
  listed_date: string | null;
  created_at: string;
  property_units: PropertyUnit[];
};

export type PropertyListItem = PropertyRow & {
  communityLabel: string;
  unitCount: number;
  priceLabel: string;
  sortPrice: number;
};

function formatAmount(amount: number, currency: string | null) {
  const formatted = amount.toLocaleString();
  return currency ? `${currency} ${formatted}` : formatted;
}

// Picks a single representative price for the list view: the lowest sale
// price for a for-sale listing, the lowest rent for a for-rent listing, and
// both (sale first) for a listing that offers either. Units with neither
// price (price-on-application, see 202608251200_create_properties_schema.sql)
// are simply excluded rather than shown as a fabricated 0.
function priceInfo(units: PropertyUnit[], letting: string): { label: string; sortValue: number } {
  const sale = units.filter((u) => u.sale_price != null).sort((a, b) => a.sale_price! - b.sale_price!)[0];
  const rent = units.filter((u) => u.rent_price != null).sort((a, b) => a.rent_price! - b.rent_price!)[0];

  const salePart = sale ? `From ${formatAmount(sale.sale_price!, sale.currency)}` : null;
  const rentPart = rent ? `From ${formatAmount(rent.rent_price!, rent.currency)}/mo` : null;

  if (letting === "sale" && salePart) return { label: salePart, sortValue: sale!.sale_price! };
  if (letting === "rent" && rentPart) return { label: rentPart, sortValue: rent!.rent_price! };
  if (salePart && rentPart) return { label: `${salePart} · ${rentPart}`, sortValue: sale!.sale_price! };
  if (salePart) return { label: salePart, sortValue: sale!.sale_price! };
  if (rentPart) return { label: rentPart, sortValue: rent!.rent_price! };
  return { label: "Price on application", sortValue: Number.POSITIVE_INFINITY };
}

export async function fetchPropertiesList(): Promise<PropertyListItem[]> {
  const [{ data: properties, error: propertiesError }, { data: communities, error: communitiesError }] =
    await Promise.all([
      supabase
        .from("properties")
        .select(
          "id, legacy_id, slug, status, collection, title, property_type, community, location, letting, listed_date, created_at, property_units(id, unit_type, bedrooms, bathrooms, sale_price, rent_price, currency)",
        )
        .order("created_at", { ascending: false }),
      supabase.from("communities").select("key, label"),
    ]);

  if (propertiesError) throw propertiesError;
  if (communitiesError) throw communitiesError;

  const labelByKey = new Map((communities ?? []).map((c) => [c.key, c.label]));

  return (properties ?? []).map((p) => {
    const units = p.property_units ?? [];
    const { label, sortValue } = priceInfo(units, p.letting);
    return {
      ...p,
      property_units: units,
      communityLabel: labelByKey.get(p.community) ?? p.community,
      unitCount: units.length,
      priceLabel: label,
      sortPrice: sortValue,
    };
  });
}
