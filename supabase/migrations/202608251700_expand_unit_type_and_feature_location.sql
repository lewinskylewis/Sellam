-- Phase 1, Step 8: fix the two genuine source/schema mismatches surfaced by
-- the migration script's dry run. Additive only — no table dropped, no row
-- touched (properties/property_units are still empty; nothing has been
-- migrated yet). Does not touch property_enquiries or newsletter_subscribers.
--
-- Context: the dry run found 8 real records that data/properties.js already
-- contains but the schema couldn't yet represent:
--   - sl-010, sl-015, sl-034 use unitType "6-bedroom" / "7-bedroom", outside
--     property_units.unit_type's original 9-value CHECK (max was 5-bedroom)
--   - sl-012, sl-013, sl-014, sl-018, sl-019 have no featureLocation in
--     source at all, but properties.feature_location was NOT NULL
-- Grepping every `unitType:` value currently in data/properties.js confirms
-- the full live vocabulary is exactly: bedsitter, studio, mini-1-bedroom,
-- 1-bedroom, 2-bedroom, 3-bedroom, 4-bedroom, 5-bedroom, 6-bedroom,
-- 7-bedroom. No 8-bedroom or higher, and no other unrecognised value,
-- appears anywhere in the source — so only 6-bedroom/7-bedroom are added,
-- nothing invented beyond what's actually present.

-- ============================================================================
-- 1. property_units.unit_type — widen the CHECK to include 6-bedroom, 7-bedroom
-- ============================================================================

alter table public.property_units drop constraint property_units_unit_type_allowed;

alter table public.property_units
  add constraint property_units_unit_type_allowed check (
    unit_type is null or unit_type in (
      'bedsitter', 'studio', 'mini-1-bedroom', '1-bedroom', '2-bedroom',
      '3-bedroom', '4-bedroom', '5-bedroom', '6-bedroom', '7-bedroom',
      'penthouse'
    )
  );

-- ============================================================================
-- 2. properties.feature_location — NOT NULL -> nullable
-- ============================================================================
-- No type or other constraint change; five genuine live records simply have
-- no featureLocation in source and none is invented to satisfy NOT NULL.

alter table public.properties alter column feature_location drop not null;
