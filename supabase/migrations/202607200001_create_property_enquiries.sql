create table if not exists public.property_enquiries (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  phone text not null,
  message text not null,
  property_id text not null,
  property_title text not null,
  property_url text not null,
  listing_category text not null,
  source_page text not null,
  submitted_at timestamptz not null default now(),
  status text not null default 'new',

  constraint property_enquiries_name_length check (char_length(name) between 2 and 120),
  constraint property_enquiries_email_length check (char_length(email) between 3 and 254),
  constraint property_enquiries_phone_length check (char_length(phone) between 7 and 40),
  constraint property_enquiries_message_length check (char_length(message) between 10 and 4000),
  constraint property_enquiries_property_id_length check (char_length(property_id) between 1 and 120),
  constraint property_enquiries_property_title_length check (char_length(property_title) between 1 and 200),
  constraint property_enquiries_property_url_length check (char_length(property_url) between 1 and 2048),
  constraint property_enquiries_listing_category_length check (char_length(listing_category) between 1 and 80),
  constraint property_enquiries_source_page_length check (char_length(source_page) between 1 and 2048),
  constraint property_enquiries_status_allowed check (
    status in ('new', 'notified', 'email_failed', 'contacted', 'closed', 'spam')
  )
);

-- CREATE TABLE IF NOT EXISTS does not add columns to an older table. Keep this
-- migration safe to rerun when property_enquiries was created from an earlier
-- schema that did not yet include the submission metadata columns.
alter table public.property_enquiries
  add column if not exists submitted_at timestamptz not null default now(),
  add column if not exists status text not null default 'new';

create index if not exists property_enquiries_status_submitted_at_idx
  on public.property_enquiries (status, submitted_at desc);

alter table public.property_enquiries enable row level security;

-- The browser roles have no table privileges and there are deliberately no RLS
-- policies. Enquiries can only be accessed with a server-side Supabase secret key.
revoke all on table public.property_enquiries from public, anon, authenticated;
grant select, insert, update on table public.property_enquiries to service_role;

comment on table public.property_enquiries is
  'Private property enquiries received by the server-side Vercel Function.';
