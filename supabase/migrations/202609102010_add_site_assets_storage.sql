-- Admin dashboard: Settings — Logo/Favicon upload storage.
-- NOT YET APPLIED — see 202608261800_add_property_images_storage.sql for
-- the identical pattern this mirrors exactly (same public-bucket,
-- authenticated-write-only shape).
--
-- Public bucket: an uploaded logo/favicon needs to be renderable by a plain
-- <img src> both in the dashboard and (eventually, if wired) the public
-- site — same reasoning as property-images. RLS below only governs writes;
-- public buckets serve GETs without an RLS check.

insert into storage.buckets (id, name, public)
values ('site-assets', 'site-assets', true)
on conflict (id) do nothing;

create policy site_assets_admin_insert on storage.objects
  for insert
  to authenticated
  with check (bucket_id = 'site-assets');

create policy site_assets_admin_update on storage.objects
  for update
  to authenticated
  using (bucket_id = 'site-assets')
  with check (bucket_id = 'site-assets');

create policy site_assets_admin_delete on storage.objects
  for delete
  to authenticated
  using (bucket_id = 'site-assets');

create policy site_assets_admin_select on storage.objects
  for select
  to authenticated
  using (bucket_id = 'site-assets');
