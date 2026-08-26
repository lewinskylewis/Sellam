-- Admin dashboard, Phase 5B: Homepage Hero Manager.
-- NOT YET APPLIED — write-only per instruction, wait for manual approval.
--
-- Existing hero carousel (script.js heroProperties, index.html .hero
-- section) is NOT a generic "slide with heading/subtitle/CTA" model. Each
-- entry is an EXISTING property (by id) plus up to 3 hand-curated
-- interior/exterior photo "sections" (label + image) used for the 3 preview
-- tiles and the swappable background. The big-hero heading/meta/CTA link
-- are never hand-authored per slide — they're resolved LIVE off the
-- properties table (title, price, location, unit types, url) by
-- resolveHeroProperty() in script.js, specifically so the hero can never
-- drift out of sync with the real inventory. This table preserves that
-- exact shape: it stores WHICH property and WHICH curated photos, nothing
-- that would fork from the live property record.

create table if not exists public.homepage_hero_slides (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties (id) on delete cascade,
  sections jsonb not null,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  -- One hero slide per property — matches the "curate existing properties"
  -- brief (a property shouldn't appear twice in the same carousel).
  constraint homepage_hero_slides_property_unique unique (property_id),

  -- Exactly 3 sections: the public site hard-codes 3 preview tile buttons
  -- (script.js buildHeroControls loops sectionIndex 0..2), so anything else
  -- would leave tiles blank or drop curated photos silently.
  constraint homepage_hero_slides_sections_shape check (
    jsonb_typeof(sections) = 'array' and jsonb_array_length(sections) = 3
  )
);

comment on table public.homepage_hero_slides is
  'Curates which existing properties appear in the homepage hero carousel and which 3 interior/exterior photos represent each ("sections": [{label, image}, ...]). Heading, price, location and the CTA link are intentionally NOT stored here — the public site resolves those live from public.properties via property_id, exactly as script.js''s resolveHeroProperty() does today.';

create index if not exists homepage_hero_slides_sort_order_idx on public.homepage_hero_slides (sort_order);

-- ============================================================================
-- Row Level Security
-- ============================================================================
-- Same philosophy as public.properties (202608251200): RLS grants
-- unconditional read to anon/authenticated, and presentation filtering
-- (is_active, ordering) is the consuming query's job, not RLS's — exactly
-- how listings.js filters properties by status today. The future public
-- homepage query is expected to add `where is_active = true order by
-- sort_order` itself, same pattern as the existing Buy/Rent grids.
--
-- Writes: only the dashboard's authenticated admin session (see
-- 202608261200_add_properties_admin_write.sql — same "authenticated means
-- signed-in dashboard admin" reasoning). No anon write, ever.

alter table public.homepage_hero_slides enable row level security;

revoke all on table public.homepage_hero_slides from public, anon, authenticated;

grant select on table public.homepage_hero_slides to anon, authenticated;
grant insert, update, delete on table public.homepage_hero_slides to authenticated;
grant select, insert, update, delete on table public.homepage_hero_slides to service_role;

create policy homepage_hero_slides_public_read on public.homepage_hero_slides
  for select
  to anon, authenticated
  using (true);

create policy homepage_hero_slides_admin_insert on public.homepage_hero_slides
  for insert
  to authenticated
  with check (true);

create policy homepage_hero_slides_admin_update on public.homepage_hero_slides
  for update
  to authenticated
  using (true)
  with check (true);

create policy homepage_hero_slides_admin_delete on public.homepage_hero_slides
  for delete
  to authenticated
  using (true);

-- ============================================================================
-- Storage — dedicated bucket for hero section photos
-- ============================================================================
-- Kept separate from `property-images` on purpose: a hero "section" photo
-- (e.g. a specific curated Gym/Living Room shot picked for the carousel) is
-- conceptually different media from a property's own gallery, and mixing
-- them would make both harder to manage/clean up independently. Public bucket
-- so images render via a plain URL exactly like property-images; RLS below
-- only governs who can write. Mirrors 202608261800_add_property_images_storage.sql.

insert into storage.buckets (id, name, public)
values ('hero-images', 'hero-images', true)
on conflict (id) do nothing;

create policy hero_images_admin_insert on storage.objects
  for insert
  to authenticated
  with check (bucket_id = 'hero-images');

create policy hero_images_admin_update on storage.objects
  for update
  to authenticated
  using (bucket_id = 'hero-images')
  with check (bucket_id = 'hero-images');

create policy hero_images_admin_delete on storage.objects
  for delete
  to authenticated
  using (bucket_id = 'hero-images');

create policy hero_images_admin_select on storage.objects
  for select
  to authenticated
  using (bucket_id = 'hero-images');
