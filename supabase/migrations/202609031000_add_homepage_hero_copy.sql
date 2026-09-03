-- Admin dashboard: Homepage Hero title/description editor.
--
-- The homepage hero (index.html, .hero-copy — separate from .hero-showcase/
-- .hero-tiles/.hero-dots, which are the existing image carousel and are
-- NOT touched by this migration) has always had a hardcoded two-line
-- heading ("Connecting People" / "With Property") and a description
-- paragraph. This table makes that editable from the dashboard.
--
-- Deliberately a singleton: exactly one row, ever. No insert/delete grant
-- to authenticated — the one-time seed row below is the only row this
-- table will ever hold; the dashboard can only UPDATE it.

create table if not exists public.homepage_hero_copy (
  id uuid primary key default gen_random_uuid(),
  heading_line_1 text not null,
  heading_line_2 text not null,
  description text not null,
  updated_at timestamptz not null default now()
);

comment on table public.homepage_hero_copy is
  'Singleton row holding the homepage hero''s editable title (two lines, matching index.html''s two <span> elements) and description paragraph. Does not touch the hero image carousel (homepage_hero_slides) in any way.';

-- ============================================================================
-- Row Level Security
-- ============================================================================
-- Same philosophy as the other homepage_* tables: public SELECT for the
-- live site (anon key), authenticated-only write for the dashboard. Only
-- UPDATE is granted (no insert/delete) to enforce the singleton at the
-- permission layer — the seed row below is the only row this table should
-- ever contain.

alter table public.homepage_hero_copy enable row level security;

revoke all on table public.homepage_hero_copy from public, anon, authenticated;

grant select on table public.homepage_hero_copy to anon, authenticated;
grant update on table public.homepage_hero_copy to authenticated;
grant select, insert, update, delete on table public.homepage_hero_copy to service_role;

create policy homepage_hero_copy_public_read on public.homepage_hero_copy
  for select
  to anon, authenticated
  using (true);

create policy homepage_hero_copy_admin_update on public.homepage_hero_copy
  for update
  to authenticated
  using (true)
  with check (true);

-- Seed — reproduces the current homepage exactly (index.html:202-204), so
-- applying this migration changes nothing until someone edits it in the
-- dashboard. Only inserted if the table is empty, so re-running this
-- migration is safe.
insert into public.homepage_hero_copy (heading_line_1, heading_line_2, description)
select 'Connecting People', 'With Property', 'Connecting clients to exceptional property opportunities across Kenya and international markets.'
where not exists (select 1 from public.homepage_hero_copy);
