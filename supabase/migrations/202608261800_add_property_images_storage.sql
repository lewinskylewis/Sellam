-- Admin dashboard, Phase 2C: persistent property image uploads.
-- NOT YET APPLIED — see PHASE 2C report. No Storage bucket currently exists
-- in this project (confirmed via a direct Storage API query, both anon and
-- service_role keys: empty result). This is what's needed to make uploads
-- work; nothing here has been run against the live project.
--
-- Bucket is PUBLIC so uploaded images are viewable via a plain URL exactly
-- like the existing local site images (data/supabase-adapter.js passes the
-- `image`/`hero_image`/`gallery` text columns straight through — an
-- uploaded image's public URL just becomes another value in those same
-- columns, no adapter change needed). Public buckets serve GETs without an
-- RLS check; RLS below only governs who can write.

insert into storage.buckets (id, name, public)
values ('property-images', 'property-images', true)
on conflict (id) do nothing;

-- Only the dashboard's authenticated admin session may upload, replace, or
-- delete objects in this bucket — mirrors the authenticated-write pattern
-- already approved for properties/property_units in
-- 202608261200_add_properties_admin_write.sql. No anon write, ever.

create policy property_images_admin_insert on storage.objects
  for insert
  to authenticated
  with check (bucket_id = 'property-images');

create policy property_images_admin_update on storage.objects
  for update
  to authenticated
  using (bucket_id = 'property-images')
  with check (bucket_id = 'property-images');

create policy property_images_admin_delete on storage.objects
  for delete
  to authenticated
  using (bucket_id = 'property-images');

create policy property_images_admin_select on storage.objects
  for select
  to authenticated
  using (bucket_id = 'property-images');
