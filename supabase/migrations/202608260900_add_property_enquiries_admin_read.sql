-- Admin dashboard, Phase 1: allow the dashboard's authenticated Supabase Auth
-- session to read property_enquiries for the Overview page's "Total enquiries"
-- stat and recent-enquiries list. Additive only.
--
-- property_enquiries was previously service_role-only (see
-- 202607200001_create_property_enquiries.sql) because only the server-side
-- /api/enquiry.js function needed access. The admin dashboard is a new
-- consumer that authenticates end users directly via Supabase Auth (no
-- server-side secret in the browser), so it needs its own read policy.
--
-- Only admin accounts will ever exist in Supabase Auth for this project, so
-- `authenticated` here effectively means "signed-in dashboard admin". This
-- grants SELECT only — no insert/update/delete — and does not touch the
-- existing service_role grant used by api/enquiry.js, nor anon at all.

grant select on table public.property_enquiries to authenticated;

create policy property_enquiries_admin_read on public.property_enquiries
  for select
  to authenticated
  using (true);
