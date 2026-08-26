// Mirrors the CHECK constraints in supabase/migrations/ exactly — nothing
// here is invented. See 202608251200_create_properties_schema.sql,
// 202608251500_amend_properties_international_support.sql (nullability) and
// 202608251700_expand_unit_type_and_feature_location.sql (6/7-bedroom).

export const STATUS_OPTIONS = ["available", "under-offer", "sold", "let"] as const;
export const COLLECTION_OPTIONS = ["featured", "exclusive"] as const;
export const PROPERTY_TYPE_OPTIONS = [
  "apartment",
  "townhouse",
  "villa",
  "mansion",
  "bungalow",
  "penthouse",
  "land",
  "commercial",
  "office",
  "retail",
  "industrial",
] as const;
export const LETTING_OPTIONS = ["sale", "rent", "both"] as const;
export const FEATURE_OPTIONS = [
  "wifi",
  "pool",
  "gym",
  "backup-generator",
  "parking",
  "security",
  "garden",
  "restaurant",
  "spa",
  "lounge",
] as const;
export const UNIT_TYPE_OPTIONS = [
  "bedsitter",
  "studio",
  "mini-1-bedroom",
  "1-bedroom",
  "2-bedroom",
  "3-bedroom",
  "4-bedroom",
  "5-bedroom",
  "6-bedroom",
  "7-bedroom",
  "penthouse",
] as const;
export const CURRENCY_OPTIONS = ["KES", "USD"] as const;

export function titleCase(value: string) {
  return value
    .split("-")
    .map((w) => w[0].toUpperCase() + w.slice(1))
    .join(" ");
}
