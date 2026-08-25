-- Phase 1, Step 3: approved property catalogue schema (communities, properties,
-- property_units). Additive only — creates new tables/policies/indexes, does not
-- touch property_enquiries, newsletter_subscribers, or any existing data.
-- No data is migrated by this file. See SUPABASE-MIGRATION-STEP2-SCHEMA-DESIGN.md
-- for the approved field inventory and rationale behind every column below.

-- ============================================================================
-- communities
-- ============================================================================

create table if not exists public.communities (
  key text primary key,
  label text not null,
  image text not null,
  image_alt text not null,
  description text not null
);

comment on table public.communities is
  'Neighbourhoods/areas properties can belong to. `key` is the stable identifier already used throughout the site (communities/<key>.html) and referenced by properties.community.';

-- ============================================================================
-- properties
-- ============================================================================

create table if not exists public.properties (
  id uuid primary key default gen_random_uuid(),
  legacy_id text not null,
  slug text not null,
  status text not null default 'available',
  collection text not null,
  title text not null,
  summary text,
  property_type text not null,
  community text not null references public.communities (key),
  location text not null,
  letting text not null,
  features text[] not null default '{}',
  image text not null,
  hero_image text,
  gallery text[] not null default '{}',
  description_title text,
  description_body text not null,
  feature_location text not null,
  story jsonb,
  feature_highlights jsonb,
  closing_paragraphs text,
  payment_plan jsonb,
  lease_pricing jsonb,
  listed_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint properties_legacy_id_unique unique (legacy_id),
  constraint properties_slug_unique unique (slug),
  constraint properties_status_allowed check (
    status in ('available', 'under-offer', 'sold', 'let')
  ),
  constraint properties_collection_allowed check (
    collection in ('featured', 'exclusive')
  ),
  constraint properties_property_type_allowed check (
    property_type in (
      'apartment', 'townhouse', 'villa', 'mansion', 'bungalow', 'penthouse',
      'land', 'commercial', 'office', 'retail', 'industrial'
    )
  ),
  constraint properties_letting_allowed check (
    letting in ('sale', 'rent', 'both')
  ),
  -- 'restaurant', 'spa', 'lounge' are live in data/properties.js today even
  -- though PROPERTY-GUIDE.md §2.1 only documents the other 7 — see the report
  -- accompanying this migration for detail.
  constraint properties_features_allowed check (
    features <@ array[
      'wifi', 'pool', 'gym', 'backup-generator', 'parking', 'security',
      'garden', 'restaurant', 'spa', 'lounge'
    ]::text[]
  )
);

comment on table public.properties is
  'The live property catalogue (data/properties.js SELLAM_PROPERTIES today). One row per listing; url is intentionally not stored and must be derived as slug at read time. description is split into description_title/description_body, equivalent to the source''s {title, body} shape (description_title is null for the plain-string case).';

create index if not exists properties_community_idx on public.properties (community);
create index if not exists properties_property_type_idx on public.properties (property_type);
create index if not exists properties_letting_idx on public.properties (letting);
create index if not exists properties_status_idx on public.properties (status);

-- ============================================================================
-- property_units
-- ============================================================================

create table if not exists public.property_units (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties (id) on delete cascade,
  display_order integer not null,
  unit_type text,
  bedrooms integer,
  bathrooms integer,
  sale_price numeric,
  rent_price numeric,
  residence_label text,
  area text,
  note text,

  constraint property_units_unit_type_allowed check (
    unit_type is null or unit_type in (
      'bedsitter', 'studio', 'mini-1-bedroom', '1-bedroom', '2-bedroom',
      '3-bedroom', '4-bedroom', '5-bedroom', 'penthouse'
    )
  ),
  constraint property_units_sale_price_positive check (sale_price is null or sale_price > 0),
  constraint property_units_rent_price_positive check (rent_price is null or rent_price > 0)
  -- No "at least one of sale_price/rent_price must be set" constraint: the
  -- approved international-property migration (e.g. ShomaBay) includes units
  -- whose source pricing is genuinely "Price on Application" with no numeric
  -- value at all, sale or rent (property-detail.js's ShomaBay priceRows, 3 of
  -- 4 rows). Both columns null is the safe, non-invented representation of
  -- that state, and mirrors how the live app already treats a missing price
  -- today: buildPriceRows() (property-detail.js:839-840) only adds a price
  -- line `if (unit.salePrice)` / `if (unit.rentPrice)`, so a unit with both
  -- null simply renders with no price line, not a fabricated number.
);

comment on table public.property_units is
  'Independently marketable units/floor plans/residences within a property (data/properties.js units[], or the single implied unit for flat-field properties). display_order preserves the source array order, which unit_type labelling and card display depend on.';

create index if not exists property_units_property_id_idx on public.property_units (property_id);
create index if not exists property_units_bedrooms_idx on public.property_units (bedrooms);
create index if not exists property_units_sale_price_idx on public.property_units (sale_price);
create index if not exists property_units_rent_price_idx on public.property_units (rent_price);

-- ============================================================================
-- Row Level Security
-- ============================================================================
-- Unlike property_enquiries/newsletter_subscribers (private, service-role only),
-- this catalogue is public read data today (every listing is a static JS array
-- shipped to the browser). Read access is granted to anon/authenticated for all
-- rows and all statuses, unconditionally.
--
-- Row visibility (RLS, this file) and listing presentation (which rows a given
-- page's query chooses to show) are deliberately kept as separate concerns:
-- RLS answers "can this role ever read this row at all", not "should this row
-- appear on this page". The current site already makes that same split, just
-- client-side: every property ships to the browser in one flat JS array
-- (nothing is access-controlled by status), and it's listings.js's query logic
-- alone that excludes sold/let from the Buy/Rent/Exclusive grids, while
-- property-detail.js's slug lookup applies no status filter at all, so a
-- sold/let property still resolves by direct URL (PROPERTY-GUIDE.md §5).
--
-- A status-restricted RLS policy would collapse that split and make it
-- impossible to serve a sold/let property's detail page through the same
-- anon-key query path used for everything else. Instead, any future public
-- listing query MUST reproduce today's presentation filter itself, e.g.
-- `where status in ('available','under-offer')`, exactly as listings.js does
-- now -- RLS will not do this for you. Detail-page-by-slug queries should
-- keep applying no status filter, matching current behavior.
--
-- Writes (insert/update/delete) are not granted to anon/authenticated at all,
-- so they are denied by default regardless of status.

alter table public.communities enable row level security;
alter table public.properties enable row level security;
alter table public.property_units enable row level security;

revoke all on table public.communities from public, anon, authenticated;
revoke all on table public.properties from public, anon, authenticated;
revoke all on table public.property_units from public, anon, authenticated;

grant select on table public.communities to anon, authenticated;
grant select on table public.properties to anon, authenticated;
grant select on table public.property_units to anon, authenticated;

grant select, insert, update, delete on table public.communities to service_role;
grant select, insert, update, delete on table public.properties to service_role;
grant select, insert, update, delete on table public.property_units to service_role;

create policy communities_public_read on public.communities
  for select
  to anon, authenticated
  using (true);

create policy properties_public_read on public.properties
  for select
  to anon, authenticated
  using (true);

create policy property_units_public_read on public.property_units
  for select
  to anon, authenticated
  using (true);
