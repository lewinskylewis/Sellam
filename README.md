# Sellam
A real Estate website selling premium property.

## Enquiry form → Supabase → Resend

Every "Enquire" submission on the site (the popup modal and the plain form on
each property page) POSTs to `/api/enquiry` (`api/enquiry.js`, a Vercel
Function). That function:

1. Validates the submission server-side (name/email/phone/message length and
   format, a honeypot field, same-origin check, JSON content-type, size cap).
2. Stores it in the `public.property_enquiries` table in Supabase
   (`supabase/migrations/202607200001_create_property_enquiries.sql`) with
   `status = "new"`.
3. Emails the team via Resend with the enquiry details, then updates the row
   to `status = "notified"` (or `"email_failed"` if the email couldn't be
   sent — the enquiry itself is never lost even if Resend is down).

No secrets live in the repository. The function reads everything it needs
from environment variables, and `.env.example` documents the names only —
never fill in real values there or commit a `.env` file (`.gitignore` already
excludes `.env` / `.env.*`, keeping `.env.example` as the only tracked one).

### Required environment variables (set in Vercel → Project → Settings →
Environment Variables — Production, and Preview if you want enquiries to work
on preview deployments too)

| Variable | Value | Where to get it |
|---|---|---|
| `SUPABASE_URL` | `https://<project-ref>.supabase.co` | Supabase → Project Settings → API → Project URL |
| `SUPABASE_SECRET_KEY` | The **`service_role`** secret key | Supabase → Project Settings → API → Project API keys. **Must be `service_role`, not `anon`/`publishable`** — the table's Row Level Security has no policies for `anon`/`authenticated`, so an `anon` key will fail every insert with a permission error. This key must never appear in any client-side file. |
| `RESEND_API_KEY` | Your Resend API key | Resend → API Keys |
| `RESEND_FROM_EMAIL` | e.g. `SELLAM Enquiries <enquiries@sellamre.com>` | Must be an address on a domain you've **verified** in Resend (Resend → Domains). Sending from an unverified domain will fail. |
| `ENQUIRY_RECIPIENT_EMAIL` | `office@sellamre.com` | The inbox that should receive enquiry notifications. Accepts a comma-separated list if you ever want more than one recipient. |

If any of these are missing or malformed, `/api/enquiry` fails closed with a
503 and logs the reason server-side — it never falls back to skipping
validation or silently dropping data.

### Verifying the Supabase table matches

The table should already exist per the migration in
`supabase/migrations/202607200001_create_property_enquiries.sql`. It's safe
to re-run that file in the Supabase SQL Editor at any time (every statement
is `if not exists` / idempotent) if you want to double-check the live table's
columns, constraints, and RLS grants match exactly what `api/enquiry.js`
expects: `name`, `email`, `phone`, `message`, `property_id`,
`property_title`, `property_url`, `listing_category`, `source_page`,
`submitted_at`, `status`.

### Building the future admin dashboard

`property_enquiries` has Row Level Security enabled with **no policies** for
`anon` or `authenticated` — only the `service_role` key can read or write it.
That's intentional: it means the dashboard must be a server-side route (a
Vercel Function, same pattern as `api/enquiry.js`) that uses
`SUPABASE_SECRET_KEY` to query the table and returns only what the page
needs. Never expose `SUPABASE_SECRET_KEY` to the browser, and never grant
`anon`/`authenticated` direct table access as a shortcut — that would let
anyone with the public Supabase URL read every enquiry (names, phone
numbers, emails) directly from the browser console.

## Newsletter subscribe → Supabase → Resend

The "Subscribe" email field in the site footer (present on every page, since
the footer is shared) POSTs to `/api/subscribe` (`api/subscribe.js`, a
Vercel Function). `newsletter.js` (loaded on every page) wires the form: it
adds a honeypot field, prevents the default `<form action="#">` navigation,
submits the email as JSON, and shows an inline status message. Same
resilience shape as the enquiry flow:

1. Validates the email server-side (format, honeypot, same-origin check,
   JSON content-type, size cap).
2. Upserts it into the `public.newsletter_subscribers` table in Supabase
   (`supabase/migrations/202608171200_create_newsletter_subscribers.sql`)
   with `status = "new"` — re-submitting the same email updates the existing
   row instead of erroring, so resubscribing is safe.
3. Emails the team via Resend with the new subscriber's address, then sends
   the subscriber a short welcome email, then updates the row to
   `status = "notified"` (or `"email_failed"` if Resend failed — the
   subscription itself is never lost even if Resend is down). The welcome
   email failing on its own does not affect the team notification or the
   stored subscription.

### Required environment variables

Same Supabase/Resend variables as the enquiry flow above, plus one more:

| Variable | Value | Where to get it |
|---|---|---|
| `NEWSLETTER_RECIPIENT_EMAIL` | `office@sellamre.com` | The inbox that should receive new-subscriber notifications. Accepts a comma-separated list. |

`SUPABASE_URL`, `SUPABASE_SECRET_KEY`, `RESEND_API_KEY`, and
`RESEND_FROM_EMAIL` are shared with `/api/enquiry` — no separate values
needed. If any required variable is missing or malformed, `/api/subscribe`
fails closed with a 503 and logs the reason server-side.

`newsletter_subscribers` has Row Level Security enabled with the same
`service_role`-only access pattern as `property_enquiries` — see "Building
the future admin dashboard" above; the same constraints apply to any future
subscriber-list UI. There is currently no unsubscribe endpoint — this only
covers signup.

## Dashboard Messages module (real IMAP-in / Resend-out email)

The admin dashboard's Messages page (`admin/src/pages/Messages.tsx`) is a
real inbox for `sales@sellamre.com` and `office@sellamre.com` — not an
internal-only system. It's a hybrid:

- **Inbound**: `api/sync-mailboxes.js` connects to both mailboxes over IMAP
  (GoDaddy/Titan, via `imapflow`), parses new mail with `mailparser`, and
  writes it into `email_conversations` / `email_messages` /
  `email_attachments` (`supabase/migrations/202608280001_create_email_messaging.sql`,
  not yet applied — run it in the Supabase SQL Editor when ready to enable
  this feature). It runs on a Vercel Cron schedule (`vercel.json`, every 10
  minutes — **Vercel's Hobby plan only allows daily crons; a Pro plan or
  above is required for the 10-minute schedule to actually run that often**)
  and can also be triggered on demand from the dashboard.
- **Outbound**: `api/send-message.js` sends dashboard replies via Resend,
  genuinely "from" the conversation's mailbox address (reusing the same
  verified `sellamre.com` domain as the enquiry/newsletter emails — no new
  DNS work needed), and records the reply as an outbound message in the same
  thread. It's gated by a real signed-in admin session, not just any caller.
- **Threading** uses the RFC 5322 `Message-ID` / `In-Reply-To` / `References`
  headers, matching this project's stated non-negotiable: real email
  delivery, not a Supabase-only chat log.
- Each conversation is soft-linked to a `property_enquiries` row by matching
  email address at write time (`email_conversations.enquiry_id`) — a
  best-effort pointer, not a foreign key, so this never touches or
  constrains the existing enquiry table.

### Why IMAP-in / Resend-out, not one provider for both directions

Resend's inbound-email product requires pointing this domain's MX records at
Resend, which would replace the MX records currently pointed at Titan for
these exact mailboxes — disruptive to the live mailboxes and out of scope.
Titan/GoDaddy's own SMTP could send outbound instead, but Resend is already
integrated, proven, and `sellamre.com` is already verified there, so sending
replies through Resend needed zero new DNS work.

### Required environment variables

In addition to the Supabase/Resend variables documented above:

| Variable | Value | Where to get it |
|---|---|---|
| `SUPABASE_ANON_KEY` | The **anon/publishable** key (same value as `admin/.env`'s `VITE_SUPABASE_ANON_KEY`) | Supabase → Project Settings → API. Used server-side only to verify a dashboard session belongs to a real signed-in admin before allowing a mailbox sync or a send — it is a public key by design, safe to duplicate here. |
| `TITAN_IMAP_HOST` | `imap.titan.email` (confirm with GoDaddy/Titan support for this account if unsure) | GoDaddy/Titan mailbox settings |
| `TITAN_IMAP_PORT` | `993` | IMAPS (implicit TLS) |
| `SALES_MAILBOX_PASSWORD` | `sales@sellamre.com`'s mailbox password | Ideally a dedicated app password if Titan supports one, not the account's main login password |
| `OFFICE_MAILBOX_PASSWORD` | `office@sellamre.com`'s mailbox password | Same as above |
| `CRON_SECRET` | Any random string you generate | Also referenced by Vercel's own scheduled cron invocation automatically once set — this is how `/api/sync-mailboxes` tells a real Vercel Cron call apart from an arbitrary internet request |
| `ADMIN_ORIGIN` | e.g. `https://admin.sellamre.com` | Only required if the admin dashboard is deployed as its own Vercel project/domain (the common setup — a separate project with root directory `admin`, since these `api/` routes live at the main project's root and aren't included in that build). Without it, the admin dashboard's browser calls to `/api/send-message` and `/api/sync-mailboxes` will be blocked by CORS. Skip it only if admin is served from this exact same origin. |

Also set `VITE_API_BASE_URL` in `admin/.env` (see `admin/.env.example`) to
this project's origin (e.g. `https://sellamre.com`) — that's where the
dashboard sends its `/api/send-message` and `/api/sync-mailboxes` calls.

If IMAP or the anon-key variables are missing, `/api/sync-mailboxes` fails
closed per-mailbox (each mailbox reports its own error in the response) and
`/api/send-message` fails closed with a 503 — the existing enquiry and
newsletter flows are entirely unaffected either way, since they don't touch
any of these new variables or tables.

### Before this feature works end-to-end

1. Apply `supabase/migrations/202608280001_create_email_messaging.sql` in the
   Supabase SQL Editor (it has not been run against the live database).
2. Set the environment variables above in Vercel.
3. Confirm the IMAP host/port with GoDaddy/Titan support if `imap.titan.email:993`
   doesn't connect for this account.
