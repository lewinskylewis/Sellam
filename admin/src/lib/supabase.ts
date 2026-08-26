import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!url || !anonKey) {
  throw new Error(
    "Missing VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY. Copy admin/.env.example to admin/.env.local and fill in the values.",
  );
}

// Anon/publishable key only — never the service_role key. RLS on the
// Supabase project is the security boundary for every query this client
// makes; see supabase/migrations/ for the policies that govern what an
// authenticated dashboard session can read.
export const supabase = createClient(url, anonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});
