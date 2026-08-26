-- Admin dashboard: property deletion. NOT YET APPLIED.
--
-- Confirmed before writing this: authenticated has no DELETE on properties
-- (403 permission denied on a zero-row test DELETE, id that matches no row).
--
-- Only properties needs a grant — property_units.property_id already has
-- `on delete cascade` (see 202608251200_create_properties_schema.sql), and
-- a cascade delete triggered by a FK constraint doesn't require the calling
-- role to hold its own DELETE privilege on the child table, so units are
-- removed automatically without a separate grant. Uploaded Storage images
-- are cleaned up by the dashboard itself using the DELETE policy already
-- granted on the property-images bucket in
-- 202608261800_add_property_images_storage.sql — nothing new needed there.

grant delete on table public.properties to authenticated;

create policy properties_admin_delete on public.properties
  for delete
  to authenticated
  using (true);
