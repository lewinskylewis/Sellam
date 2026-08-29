-- Admin dashboard: Property Highlights (Featured & Exclusive homepage teasers).
--
-- The homepage's "Featured Properties" and "Exclusive Properties" sections
-- (index.html, .property-gallery inside #rent and #off-plan) have always
-- been hand-written HTML: 5 and 3 <a class="image-card"> tags respectively,
-- each with its own hand-picked caption and photo. Investigation confirmed
-- these captions/photos frequently do NOT match the linked property's own
-- title/image field in public.properties (e.g. today's Ostrea card uses
-- "Ostrea Villas, Karen Nairobi" / a different photo than the property
-- record's own "Ostrea Villas, Karen" title and image) — this is curated
-- marketing copy layered on top of a real property, not a mirror of it.
-- properties.collection ('featured'/'exclusive') is a much broader listing
-- classification (used by featured-properties.html / exclusive-properties.html)
-- and does not correspond 1:1 with this specific 5+3 homepage curation, so it
-- is not reused here.
--
-- This table follows the exact same shape/philosophy as
-- 202608271500_add_homepage_hero_slides.sql: it stores WHICH property, WHICH
-- section of the homepage, its position, and the two hand-curated overrides
-- (caption, image) — nothing else. Anything not overridden here still
-- resolves live from public.properties via property_id (the link/url always
-- does), so a highlighted property can never point at stale data.

create table if not exists public.homepage_property_highlights (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties (id) on delete cascade,
  section text not null,
  caption text,
  image text,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint homepage_property_highlights_section_allowed check (
    section in ('featured', 'exclusive')
  ),

  -- A property shouldn't appear twice in the same homepage section.
  constraint homepage_property_highlights_property_section_unique unique (property_id, section)
);

comment on table public.homepage_property_highlights is
  'Curates which existing properties appear in the homepage "Featured Properties" and "Exclusive Properties" teaser sections (index.html) and in what order. caption/image are optional hand-curated overrides for the homepage card specifically (fall back to the property''s own title/image when null); the link always resolves live from public.properties via property_id. Same pattern as homepage_hero_slides.';

create index if not exists homepage_property_highlights_section_sort_idx
  on public.homepage_property_highlights (section, sort_order);

-- ============================================================================
-- Row Level Security
-- ============================================================================
-- Same philosophy as homepage_hero_slides: RLS grants unconditional read to
-- anon/authenticated (the public homepage reads with the anon key), and
-- presentation filtering (is_active, ordering) is the consuming query's job.
-- Writes: only the dashboard's authenticated admin session.

alter table public.homepage_property_highlights enable row level security;

revoke all on table public.homepage_property_highlights from public, anon, authenticated;

grant select on table public.homepage_property_highlights to anon, authenticated;
grant insert, update, delete on table public.homepage_property_highlights to authenticated;
grant select, insert, update, delete on table public.homepage_property_highlights to service_role;

create policy homepage_property_highlights_public_read on public.homepage_property_highlights
  for select
  to anon, authenticated
  using (true);

create policy homepage_property_highlights_admin_insert on public.homepage_property_highlights
  for insert
  to authenticated
  with check (true);

create policy homepage_property_highlights_admin_update on public.homepage_property_highlights
  for update
  to authenticated
  using (true)
  with check (true);

create policy homepage_property_highlights_admin_delete on public.homepage_property_highlights
  for delete
  to authenticated
  using (true);

-- ============================================================================
-- Seed — reproduces the current homepage exactly
-- ============================================================================
-- These are today's 5 Featured + 3 Exclusive cards (index.html lines
-- 419-438 and 481-492), in their current order, with their current curated
-- caption/image, so applying this migration changes nothing about what the
-- homepage shows until the wiring step is deployed and someone edits it in
-- the dashboard. property_id values were looked up live against production
-- via legacy_id (sl-001 etc.) immediately before writing this file.

insert into public.homepage_property_highlights (property_id, section, caption, image, sort_order) values
  ('5e5fa3c7-d017-4db2-9744-92bbfef9a0de', 'featured', 'Cheval Riverside', 'assets/images/Cheval Riverside Exterior (3).jpeg', 0),
  ('3500e7ee-3e8d-419d-912d-bd5b095dc208', 'featured', 'Silva Gigiri Residences', 'assets/images/Silva Gigiri Residences Exterior (4).jpeg', 1),
  ('ed3aa245-47aa-4a8c-8fc0-753c9e2ea3a6', 'featured', 'Ostrea Villas, Karen Nairobi', 'assets/images/Premium properties/OSTREA Karen Villas.jpeg', 2),
  ('3fb2669b-cbde-4f54-ac4d-9954c95df913', 'featured', 'DG JKIA Hotel Apartments', 'assets/images/DG JKIA Lounge (6).jpeg', 3),
  ('82e9a5d3-c293-4932-9b7d-41cec4e6c76b', 'featured', 'Gaia Brookside Forest', 'assets/images/Gaia Brookside Forest Exterior.jpeg', 4),
  ('320eab2f-9218-4517-942c-378ce217b69f', 'exclusive', 'Hephé Palace, Westlands Nairobi', 'assets/images/Hephé Palace Swimming Pool (2).jpeg', 0),
  ('8ffb3951-1c78-49de-8374-46a13af944d4', 'exclusive', 'Amethyst Residences, Kilimani Nairobi', 'assets/images/Amethyst Residences Outdoors.jpeg', 1),
  ('2cabe907-0ce6-47c7-88ed-96ee45bc2940', 'exclusive', 'Grosvenor, Westlands Nairobi', 'assets/images/grosvenor.jpg', 2)
on conflict (property_id, section) do nothing;
