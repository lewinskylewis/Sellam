# Sellam Admin Dashboard

React + TypeScript + Vite admin dashboard for sellamre.com — manages properties,
communities, enquiries, and the Messages inbox (see the root `README.md` for
the Messages module's email integration). Talks to Supabase directly with the
anon key under RLS, and to `/api/send-message` / `/api/sync-mailboxes` (Vercel
Functions in the main site's project) for anything needing the service_role
or Resend keys.

## Local development

```
npm install
cp .env.example .env.local   # fill in VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY
npm run dev
```
