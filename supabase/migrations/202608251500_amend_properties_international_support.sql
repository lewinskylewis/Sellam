-- Phase 1, Step 5A: amend the approved properties schema so genuine
-- international listings (ShomaBay, Brabus Villas, Afra Park, Indabyo
-- Heights) can be represented without inventing data. Additive only — no
-- table is dropped, no existing row is touched (both tables are still
-- empty; no property data has been migrated yet). Does not touch
-- property_enquiries or newsletter_subscribers.
--
-- Context: these four properties have no Kenyan community (they're in
-- Miami/Dubai/Istanbul/Kigali), no featured/exclusive signal, no
-- sale/rent/both concept, and price in USD with no currency column to say
-- so. supabase/migrations/202608251200_create_properties_schema.sql made
-- community/collection/property_type/letting NOT NULL and had no currency
-- column, which was correct for the 42-record Kenyan catalogue it was
-- designed around, but cannot represent these four without fabricating
-- values. This migration relaxes exactly those constraints.

-- ============================================================================
-- 1. properties.community — NOT NULL -> nullable
-- ============================================================================
-- The FK to communities(key) is untouched: a NULL value is simply not
-- checked against it (standard FK semantics), so "no community" is now
-- representable without inventing Miami/Dubai/Istanbul/Kigali community rows.

alter table public.properties alter column community drop not null;

-- ============================================================================
-- 2. properties.collection / property_type / letting — NOT NULL -> nullable
-- ============================================================================
-- Their CHECK constraints (properties_collection_allowed,
-- properties_property_type_allowed, properties_letting_allowed) are
-- untouched and keep working as-is: a CHECK only rejects a FALSE result, and
-- `column in (...)` evaluates to NULL (not FALSE) when column is NULL, so a
-- NULL value already passes each constraint. No vocabulary changes.

alter table public.properties alter column collection drop not null;
alter table public.properties alter column property_type drop not null;
alter table public.properties alter column letting drop not null;

-- ============================================================================
-- 3. property_units.currency
-- ============================================================================
-- Nullable, no default: every row must get an explicit currency from the
-- migration script (KES for SELLAM_PROPERTIES units, USD for the
-- international ones) rather than silently defaulting to KES, which is
-- exactly the "assume KES for international prices" mistake this column
-- exists to prevent. May be set even when sale_price/rent_price are both
-- NULL (e.g. a "Price on Application" unit whose source currency is still
-- known to be USD).

alter table public.property_units add column if not exists currency text;

alter table public.property_units
  add constraint property_units_currency_allowed check (
    currency is null or currency in ('KES', 'USD')
  );

comment on column public.property_units.currency is
  'Currency the unit''s sale_price/rent_price are denominated in (KES or USD today). No conversion is ever performed — a price is stored in its original currency or not stored at all.';

-- ============================================================================
-- Note on Brabus Villas' "estimated" pricing (Step 5A §4)
-- ============================================================================
-- No schema change is needed for this: property_units.note already exists
-- and is the appropriate existing field to record "estimated, unconfirmed
-- pending developer figures" against a unit whose sale_price is left NULL.
-- Not adding a separate pricing-status system, per instructions.
