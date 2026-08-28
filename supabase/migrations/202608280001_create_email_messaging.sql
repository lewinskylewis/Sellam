-- Admin dashboard: Messages module (email integration for sales@ / office@).
-- NOT YET APPLIED. Additive only — does not touch property_enquiries,
-- newsletter_subscribers, or any existing table/policy.
--
-- Architecture (see the Messages module architecture report for the full
-- reasoning): IMAP-in / Resend-out hybrid. A scheduled server-side function
-- polls both real mailboxes via IMAP using mailbox credentials that live
-- only as Vercel environment variables, and writes what it finds here.
-- Replies are sent via Resend's already-verified sellamre.com domain and
-- recorded here as outbound messages. No browser code ever touches mailbox
-- credentials or the service_role key — the same boundary property_enquiries
-- already relies on.
--
-- There are exactly two mailboxes (sales@sellamre.com, office@sellamre.com).
-- That's a fixed, small enum, not a table of its own — email_conversations.
-- mailbox is a plain text CHECK constraint instead of a foreign key to a
-- one-row-per-account table that would only ever hold two rows.

create table if not exists public.email_conversations (
  id uuid primary key default gen_random_uuid(),
  mailbox text not null check (mailbox in ('sales', 'office')),
  subject text not null default '',
  participant_email text not null,
  participant_name text,
  -- Soft link only — property_enquiries.id is bigint (confirmed live; the
  -- original property_enquiries migration file declares uuid, but the table
  -- predates that file and was never actually created with that type — see
  -- 202608262100_add_enquiry_status_write_and_appointments.sql for the same
  -- discovery). No foreign key constraint on purpose: this is a best-effort
  -- match by email address computed at write time, not a hard relationship
  -- the enquiry system needs to know about or maintain.
  enquiry_id bigint,
  last_message_at timestamptz not null default now(),
  is_read boolean not null default false,
  is_starred boolean not null default false,
  is_archived boolean not null default false,
  created_at timestamptz not null default now(),

  constraint email_conversations_subject_length check (char_length(subject) <= 500),
  constraint email_conversations_participant_email_length check (char_length(participant_email) between 3 and 254)
);

create index if not exists email_conversations_mailbox_last_message_idx
  on public.email_conversations (mailbox, last_message_at desc);

create index if not exists email_conversations_participant_email_idx
  on public.email_conversations (participant_email);

create index if not exists email_conversations_enquiry_id_idx
  on public.email_conversations (enquiry_id)
  where enquiry_id is not null;

create table if not exists public.email_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.email_conversations(id) on delete cascade,
  direction text not null check (direction in ('inbound', 'outbound')),
  -- RFC 5322 Message-ID / In-Reply-To — the actual thread identity. Unique
  -- because IMAP re-sync must be able to detect "already have this one"
  -- (message_id, not imap_uid, since imap_uid is only meaningful per-mailbox
  -- and would collide across sales/office).
  message_id text not null unique,
  in_reply_to text,
  from_address text not null,
  to_addresses text not null,
  subject text not null default '',
  body_text text,
  body_html text,
  -- Only set for inbound messages, and only unique within one mailbox's
  -- polling cursor — used purely to resume IMAP sync from the right point,
  -- never for identity (message_id owns that).
  imap_uid bigint,
  occurred_at timestamptz not null default now(),
  created_at timestamptz not null default now(),

  constraint email_messages_subject_length check (char_length(subject) <= 500)
);

create index if not exists email_messages_conversation_id_idx
  on public.email_messages (conversation_id, occurred_at);

create table if not exists public.email_attachments (
  id uuid primary key default gen_random_uuid(),
  message_id uuid not null references public.email_messages(id) on delete cascade,
  filename text not null,
  content_type text,
  size_bytes bigint,
  storage_path text not null,
  created_at timestamptz not null default now(),

  constraint email_attachments_filename_length check (char_length(filename) between 1 and 255)
);

create index if not exists email_attachments_message_id_idx
  on public.email_attachments (message_id);

alter table public.email_conversations enable row level security;
alter table public.email_messages enable row level security;
alter table public.email_attachments enable row level security;

-- service_role (the IMAP-sync and send-reply Vercel Functions) gets full
-- access, same as property_enquiries' existing service_role grant.
revoke all on table public.email_conversations from public, anon, authenticated;
revoke all on table public.email_messages from public, anon, authenticated;
revoke all on table public.email_attachments from public, anon, authenticated;

grant select, insert, update on table public.email_conversations to service_role;
grant select, insert on table public.email_messages to service_role;
grant select, insert on table public.email_attachments to service_role;

-- The dashboard's authenticated admin session reads everything directly
-- (same pattern as property_enquiries_admin_read), and may only toggle
-- read/starred/archived on a conversation — never rewrite message content,
-- sender, or subject. Sending a reply always goes through the server-side
-- send-message Function (it needs the Resend key), never a direct insert.
grant select on table public.email_conversations to authenticated;
grant select on table public.email_messages to authenticated;
grant select on table public.email_attachments to authenticated;
grant update (is_read, is_starred, is_archived) on table public.email_conversations to authenticated;

create policy email_conversations_admin_read on public.email_conversations
  for select to authenticated using (true);

create policy email_conversations_admin_update on public.email_conversations
  for update to authenticated using (true) with check (true);

create policy email_messages_admin_read on public.email_messages
  for select to authenticated using (true);

create policy email_attachments_admin_read on public.email_attachments
  for select to authenticated using (true);

comment on table public.email_conversations is
  'Email threads for sales@sellamre.com / office@sellamre.com, synced via IMAP by a server-side Vercel Function. Never written to directly by the browser except is_read/is_starred/is_archived.';
comment on table public.email_messages is
  'Individual inbound (IMAP) and outbound (sent via Resend) messages within an email_conversations thread.';
comment on table public.email_attachments is
  'Attachment metadata for email_messages; binary content lives in the message-attachments Storage bucket.';

-- Attachments are private (unlike property-images) — customer documents,
-- not marketing photos. No public read; only the authenticated dashboard
-- session or service_role (the sync function, writing) can access objects.
insert into storage.buckets (id, name, public)
values ('message-attachments', 'message-attachments', false)
on conflict (id) do nothing;

create policy message_attachments_admin_select on storage.objects
  for select to authenticated
  using (bucket_id = 'message-attachments');

create policy message_attachments_service_insert on storage.objects
  for insert to service_role
  with check (bucket_id = 'message-attachments');
