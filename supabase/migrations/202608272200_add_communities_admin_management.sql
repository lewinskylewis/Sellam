-- Admin dashboard: Communities module.
-- NOT YET APPLIED — write-only per instruction, wait for manual approval.
--
-- Existing communities table (202608251200_create_properties_schema.sql)
-- was read-only for authenticated (SELECT only; INSERT/UPDATE/DELETE were
-- service_role-only, same as properties before 202608261200). This grants
-- the dashboard's authenticated admin session the same insert/update
-- capability properties already has, and adds the two minimum columns
-- genuinely missing from the existing schema:
--
--   hero_image — the individual community PAGE's hero background. Verified
--     against the live templates (communities/*.html): each page's
--     .premium-hero-image background and h1/intro-copy are currently
--     hardcoded per file. The h1 and intro-copy already match `label` and
--     `description` exactly on every page checked (Karen, Muthaiga) — so
--     those do NOT get new columns, per the "don't duplicate label/
--     description" instruction. The hero background image, however, is a
--     genuinely different image per page from the existing `image` column
--     (which is the homepage carousel thumbnail) — e.g. Karen's carousel
--     image is "OSTREA Karen Villas.jpeg" but its page hero is
--     "diaspora-miami.webp". No existing column stores this, so it's new.
--
--   sort_order, is_active — the homepage carousel currently renders every
--     row in community-render.js with no visibility or ordering control at
--     all. Named to match the exact convention already established for the
--     same concept on homepage_hero_slides (202608271500).
--
-- No key/label/description/image/image_alt/url changes — those fields are
-- authoritative as-is and are reused unchanged.

alter table public.communities
  add column if not exists hero_image text,
  add column if not exists sort_order integer not null default 0,
  add column if not exists is_active boolean not null default true;

comment on column public.communities.hero_image is
  'Background image for the individual community page hero (communities/<key>.html .premium-hero-image) — distinct from `image`, which is the homepage carousel thumbnail.';
comment on column public.communities.sort_order is
  'Display order in the homepage community carousel (community-render.js). Lower first.';
comment on column public.communities.is_active is
  'Whether this community appears in the homepage carousel. A community can still have its own page and hold properties while hidden from the carousel (e.g. no properties yet).';

-- Same "authenticated means signed-in dashboard admin" reasoning as
-- 202608261200_add_properties_admin_write.sql. Additive only — no DELETE
-- (not requested), existing anon/authenticated SELECT grant is untouched.

grant insert, update on table public.communities to authenticated;

create policy communities_admin_insert on public.communities
  for insert
  to authenticated
  with check (true);

create policy communities_admin_update on public.communities
  for update
  to authenticated
  using (true)
  with check (true);
