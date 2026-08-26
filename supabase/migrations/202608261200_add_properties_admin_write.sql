-- Admin dashboard, Phase 2B: allow the dashboard's authenticated Supabase
-- Auth session to create and edit properties/property_units through the
-- Property Editor. NOT YET APPLIED — see PHASE 2B RESULT report. Additive
-- only, and deliberately does not touch DELETE.
--
-- properties/property_units were previously read-only for `authenticated`
-- (see 202608251200_create_properties_schema.sql: SELECT granted to
-- anon+authenticated, INSERT/UPDATE/DELETE granted only to service_role).
-- The public website only ever reads these tables, so that was correct
-- until now — the admin dashboard is a new consumer that needs to write,
-- authenticating end users directly via Supabase Auth (no server-side
-- secret in the browser).
--
-- Only admin accounts exist in Supabase Auth for this project (same
-- reasoning as 202608260900_add_property_enquiries_admin_read.sql), so
-- `authenticated` here effectively means "signed-in dashboard admin". This
-- grants INSERT and UPDATE only — no DELETE (property/unit deletion is an
-- explicitly later phase) — and does not touch the existing service_role
-- grant, nor anon at all.

grant insert, update on table public.properties to authenticated;
grant insert, update on table public.property_units to authenticated;

create policy properties_admin_write on public.properties
  for insert
  to authenticated
  with check (true);

create policy properties_admin_update on public.properties
  for update
  to authenticated
  using (true)
  with check (true);

create policy property_units_admin_write on public.property_units
  for insert
  to authenticated
  with check (true);

create policy property_units_admin_update on public.property_units
  for update
  to authenticated
  using (true)
  with check (true);
