-- Admin dashboard, Phase 4: enquiry status editing + viewing appointments.
-- NOT YET APPLIED — see PHASE 4 report. Additive only.
--
-- Confirmed before writing this: authenticated has SELECT but not UPDATE on
-- property_enquiries (403 permission denied on a zero-row test PATCH);
-- enquiry_appointments does not exist; property_enquiries.id is bigint
-- (confirmed via a 400 "invalid input syntax for type bigint" probe).

-- 1. Add 'lead' and 'sale' to the allowed status values (additive; existing
-- values new/notified/email_failed/contacted/closed/spam are unchanged).
--
-- The constraint's actual name wasn't "property_enquiries_status_allowed"
-- as originally assumed (confirmed by your SQL Editor error) — this table
-- predates the migration files in this repo (see
-- 202607200001_create_property_enquiries.sql's `create table if not
-- exists`, a no-op against an already-existing table), so its real
-- constraint names were never guaranteed to match what's written there.
-- This drops whatever CHECK constraint actually governs the `status`
-- column, by inspecting pg_constraint directly instead of guessing a name.
do $$
declare
  c record;
begin
  for c in
    select con.conname
    from pg_constraint con
    join pg_class rel on rel.oid = con.conrelid
    join pg_attribute att
      on att.attrelid = con.conrelid
     and att.attnum = any(con.conkey)
    where rel.relname = 'property_enquiries'
      and con.contype = 'c'
      and att.attname = 'status'
  loop
    execute format('alter table public.property_enquiries drop constraint %I', c.conname);
  end loop;
end $$;

alter table public.property_enquiries add constraint property_enquiries_status_allowed check (
  status in ('new', 'notified', 'email_failed', 'contacted', 'closed', 'spam', 'lead', 'sale')
);

-- 2. Let the dashboard's authenticated session update status only — no
-- anon access, doesn't touch the service_role grant api/enquiry.js uses.
grant update (status) on table public.property_enquiries to authenticated;

create policy property_enquiries_admin_update on public.property_enquiries
  for update
  to authenticated
  using (true)
  with check (true);

-- 3. Viewing/appointment history — a new row per scheduled/rescheduled
-- viewing rather than overwriting a single timestamp, so past appointments
-- are never lost. No update/delete policy: reschedule = insert a new row.
create table public.enquiry_appointments (
  id uuid primary key default gen_random_uuid(),
  enquiry_id bigint not null references public.property_enquiries(id) on delete cascade,
  scheduled_at timestamptz not null,
  note text,
  created_at timestamptz not null default now()
);

alter table public.enquiry_appointments enable row level security;

grant select, insert on table public.enquiry_appointments to authenticated;

create policy enquiry_appointments_admin_read on public.enquiry_appointments
  for select
  to authenticated
  using (true);

create policy enquiry_appointments_admin_insert on public.enquiry_appointments
  for insert
  to authenticated
  with check (true);
