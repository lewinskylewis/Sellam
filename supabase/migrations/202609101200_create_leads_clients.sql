-- Admin dashboard: Leads & Clients (CRM) module.
-- NOT YET APPLIED — additive only, run manually in Supabase Studio's SQL
-- editor (this repo has no linked Supabase CLI project; every prior
-- migration here was applied the same way — see the "NOT YET APPLIED"
-- headers on 202608262100 and 202608272200).
--
-- Nothing here touches properties, property_units, communities, or
-- newsletter_subscribers. It adds:
--   1. contacts            — the core CRM record (a lead or a client)
--   2. contact_notes       — free-text notes timeline per contact
--   3. contact_activities  — auto + manual activity timeline per contact
--   4. property_enquiries.contact_id — optional link from a real public
--      enquiry back to a CRM contact, so "Associated Enquiries" and
--      "Interested Properties" can be derived from the real enquiry ->
--      property relationship instead of inventing a parallel table with no
--      UI to populate it.
--
-- Like property_enquiries, this is private admin data — no anon access at
-- all (unlike properties/communities, which are intentionally public-read).
-- "authenticated" means "signed-in dashboard admin" throughout this project
-- (see 202608260900's comment) since only admin accounts exist in Supabase
-- Auth here.

-- ============================================================================
-- contacts
-- ============================================================================

create table public.contacts (
  id uuid primary key default gen_random_uuid(),

  first_name text not null,
  last_name text not null,
  email text,
  phone text,
  alt_phone text,
  preferred_contact text not null default 'Phone',
  location text,

  date_added timestamptz not null default now(),
  type text not null default 'Lead',
  stage text not null default 'New',
  source text not null default 'Website',
  assigned_agent text,

  intent text not null default 'Buy',
  budget_min numeric,
  budget_max numeric,
  currency text not null default 'KES',
  preferred_locations text[] not null default '{}',
  property_type text,
  bedrooms integer,
  bathrooms integer,
  furnished text not null default 'Either',
  preferred_size text,
  other_requirements text,

  last_activity_at timestamptz not null default now(),

  -- A single upcoming follow-up per contact (matches the existing UI's
  -- one-at-a-time FollowUp model, not a list) — completing or rescheduling
  -- simply overwrites these columns; the fact that it happened is preserved
  -- separately as a contact_activities row.
  next_follow_up_title text,
  next_follow_up_date date,
  next_follow_up_time text,
  next_follow_up_notes text,
  next_follow_up_reminder boolean not null default true,

  archived boolean not null default false,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint contacts_email_or_phone check (
    coalesce(email, '') <> '' or coalesce(phone, '') <> ''
  ),
  constraint contacts_preferred_contact_allowed check (
    preferred_contact in ('Phone', 'Email', 'WhatsApp')
  ),
  constraint contacts_type_allowed check (type in ('Lead', 'Client')),
  constraint contacts_stage_allowed check (
    stage in ('New', 'Contacted', 'Qualified', 'Viewing', 'Negotiation', 'Won', 'Lost')
  ),
  constraint contacts_intent_allowed check (
    intent in ('Buy', 'Rent', 'Sell', 'Lease', 'Invest')
  ),
  constraint contacts_currency_allowed check (currency in ('KES', 'USD')),
  constraint contacts_furnished_allowed check (
    furnished in ('Furnished', 'Unfurnished', 'Either')
  )
);

comment on table public.contacts is
  'Leads & Clients CRM record. One row per prospect/client relationship, independent of (but optionally linked to, via property_enquiries.contact_id, or matched by email) the public property_enquiries table.';

create index contacts_stage_idx on public.contacts (stage);
create index contacts_type_idx on public.contacts (type);
create index contacts_archived_idx on public.contacts (archived);
create index contacts_next_follow_up_date_idx on public.contacts (next_follow_up_date);

-- ============================================================================
-- contact_notes
-- ============================================================================

create table public.contact_notes (
  id uuid primary key default gen_random_uuid(),
  contact_id uuid not null references public.contacts (id) on delete cascade,
  body text not null,
  author text,
  created_at timestamptz not null default now()
);

create index contact_notes_contact_id_idx on public.contact_notes (contact_id);

-- ============================================================================
-- contact_activities
-- ============================================================================

create table public.contact_activities (
  id uuid primary key default gen_random_uuid(),
  contact_id uuid not null references public.contacts (id) on delete cascade,
  type text not null,
  title text not null,
  detail text,
  created_at timestamptz not null default now(),

  constraint contact_activities_type_allowed check (
    type in ('enquiry', 'message', 'call', 'note', 'viewing', 'follow_up', 'stage_change', 'conversion')
  )
);

create index contact_activities_contact_id_idx on public.contact_activities (contact_id);

-- ============================================================================
-- Link real public enquiries to a CRM contact (optional, nullable)
-- ============================================================================

alter table public.property_enquiries
  add column if not exists contact_id uuid references public.contacts (id) on delete set null;

create index if not exists property_enquiries_contact_id_idx on public.property_enquiries (contact_id);

-- Same pattern as the existing column-scoped status grant (202608262100):
-- authenticated can link/unlink an enquiry to a contact, nothing else about
-- the enquiry changes.
grant update (contact_id) on table public.property_enquiries to authenticated;

-- ============================================================================
-- Row Level Security — private CRM data, no anon access at all.
-- ============================================================================

alter table public.contacts enable row level security;
alter table public.contact_notes enable row level security;
alter table public.contact_activities enable row level security;

revoke all on table public.contacts from public, anon;
revoke all on table public.contact_notes from public, anon;
revoke all on table public.contact_activities from public, anon;

grant select, insert, update, delete on table public.contacts to authenticated;
grant select, insert, update, delete on table public.contact_notes to authenticated;
grant select, insert, update, delete on table public.contact_activities to authenticated;

grant select, insert, update, delete on table public.contacts to service_role;
grant select, insert, update, delete on table public.contact_notes to service_role;
grant select, insert, update, delete on table public.contact_activities to service_role;

create policy contacts_admin_all on public.contacts
  for all
  to authenticated
  using (true)
  with check (true);

create policy contact_notes_admin_all on public.contact_notes
  for all
  to authenticated
  using (true)
  with check (true);

create policy contact_activities_admin_all on public.contact_activities
  for all
  to authenticated
  using (true)
  with check (true);
