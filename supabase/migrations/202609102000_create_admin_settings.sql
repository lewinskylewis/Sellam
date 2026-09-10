-- Admin dashboard: Settings module persistence.
-- NOT YET APPLIED — run manually in Supabase Studio's SQL editor, same as
-- every other migration in this repo (no linked Supabase CLI project here).
--
-- Singleton jsonb row, same pattern as homepage_hero_copy
-- (202609031000_add_homepage_hero_copy.sql): the Settings UI always reads
-- and writes the whole SettingsState object at once (never queries
-- individual fields), so one jsonb column is the correct fit — not ~40
-- columns spread across 8 unrelated concerns (general/notifications/email/
-- website/propertyDefaults/enquiryLead/privacy/security).
--
-- Appearance and Accessibility are deliberately NOT part of what's stored
-- here — they're genuine per-browser/per-device UI chrome (theme, font
-- size, sidebar state) and stay in localStorage, same as before. Only the
-- account/company-level settings move to Supabase.
--
-- Seeded with an EMPTY settings object ('{}'), not DEFAULT_SETTINGS — the
-- app treats an empty object as "never configured yet" and runs a one-time
-- migration of any existing localStorage settings into this row on first
-- load (see admin/src/lib/adminSettings.ts), rather than the migration file
-- guessing at defaults that belong in application code.

create table if not exists public.admin_settings (
  id text primary key default 'default',
  settings jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.admin_settings is
  'Singleton row (id = ''default'') holding the Settings module''s account/company-level configuration as one jsonb blob, matching SettingsState''s shape minus appearance/accessibility (which stay local-only). An empty settings object means "never configured" — see admin/src/lib/adminSettings.ts for the one-time localStorage migration this triggers.';

-- ============================================================================
-- Row Level Security — private admin config, no anon access at all (same
-- philosophy as contacts/property_enquiries, not the public homepage_* /
-- properties tables).
-- ============================================================================

alter table public.admin_settings enable row level security;

revoke all on table public.admin_settings from public, anon;

-- Only UPDATE is granted (no insert/delete) to enforce the singleton at the
-- permission layer, same as homepage_hero_copy — the seed row below is the
-- only row this table should ever contain.
grant select, update on table public.admin_settings to authenticated;
grant select, insert, update, delete on table public.admin_settings to service_role;

create policy admin_settings_admin_read on public.admin_settings
  for select
  to authenticated
  using (true);

create policy admin_settings_admin_update on public.admin_settings
  for update
  to authenticated
  using (true)
  with check (true);

-- Seed the one singleton row. Safe to re-run: only inserts if the table is
-- empty.
insert into public.admin_settings (id, settings)
select 'default', '{}'::jsonb
where not exists (select 1 from public.admin_settings);
