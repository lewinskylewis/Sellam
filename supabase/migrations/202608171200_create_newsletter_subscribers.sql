create table if not exists public.newsletter_subscribers (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  source_page text not null,
  subscribed_at timestamptz not null default now(),
  status text not null default 'new',

  constraint newsletter_subscribers_email_length check (char_length(email) between 3 and 254),
  constraint newsletter_subscribers_source_page_length check (char_length(source_page) between 1 and 2048),
  constraint newsletter_subscribers_status_allowed check (
    status in ('new', 'notified', 'email_failed', 'unsubscribed')
  ),
  constraint newsletter_subscribers_email_unique unique (email)
);

create index if not exists newsletter_subscribers_status_subscribed_at_idx
  on public.newsletter_subscribers (status, subscribed_at desc);

alter table public.newsletter_subscribers enable row level security;

-- The browser roles have no table privileges and there are deliberately no RLS
-- policies. Subscribers can only be accessed with a server-side Supabase secret key.
revoke all on table public.newsletter_subscribers from public, anon, authenticated;
grant select, insert, update on table public.newsletter_subscribers to service_role;

comment on table public.newsletter_subscribers is
  'Private newsletter subscriber list captured by the server-side Vercel Function.';
