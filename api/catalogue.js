"use strict";

/* ============================================================================
   SELLAM — cached public catalogue proxy
   ============================================================================
   A thin, cached proxy in front of the two Supabase reads every public page
   was making directly (communities, properties+units) via
   data/supabase-adapter.js. Returns the exact same raw shape
   { rawCommunities, rawProperties } that adapter's fetchFromSupabase()
   already produced from those two direct calls — reconstruction/validation
   still happen client-side in data/supabase-adapter.js, completely
   unchanged. Only the SOURCE of the raw JSON moves from "every visitor's
   browser calls Supabase directly" to "every visitor's browser calls this
   endpoint, which Vercel's CDN caches and shares across all of them."

   Cache-Control below is what actually does the work: stale-while-revalidate
   means the CDN can keep serving a slightly-stale (up to 10 more minutes)
   response instantly while refreshing it in the background, so a traffic
   spike never turns into a stampede of concurrent Supabase reads. The
   in-memory `cache` below is a secondary, per-warm-instance layer — same
   60s-TTL pattern api/property.js already uses — for the rare case of a
   simultaneous CDN cache miss.
   ========================================================================== */

async function supabaseGet(supabaseUrl, anonKey, requestPath) {
  const response = await fetch(`${supabaseUrl}${requestPath}`, {
    method: "GET",
    headers: { apikey: anonKey, Authorization: `Bearer ${anonKey}` }
  });
  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(`Supabase GET ${requestPath} failed: ${response.status} ${detail.slice(0, 300)}`);
  }
  return response.json();
}

const CACHE_TTL_MS = 60 * 1000;
let cache = null; // { expiresAt, body }

async function fetchCatalogue() {
  // Same env vars, same distinction from SUPABASE_URL, as api/property.js.
  const supabaseUrl = String(process.env.SELLAM_SUPABASE_URL || "").replace(/\/$/, "");
  const anonKey = String(process.env.SUPABASE_ANON_KEY || "");
  if (!/^https:\/\//.test(supabaseUrl) || !anonKey) {
    throw new Error("SELLAM_SUPABASE_URL / SUPABASE_ANON_KEY are not configured");
  }

  const [rawCommunities, rawProperties] = await Promise.all([
    supabaseGet(supabaseUrl, anonKey, "/rest/v1/communities?select=*"),
    supabaseGet(supabaseUrl, anonKey, "/rest/v1/properties?select=*,property_units(*)&property_units.order=display_order.asc")
  ]);

  return { rawCommunities, rawProperties };
}

module.exports = async function catalogueHandler(request, response) {
  try {
    if (!cache || cache.expiresAt <= Date.now()) {
      const body = await fetchCatalogue();
      cache = { expiresAt: Date.now() + CACHE_TTL_MS, body };
    }
    response.setHeader("Content-Type", "application/json; charset=utf-8");
    response.setHeader("Cache-Control", "public, s-maxage=60, stale-while-revalidate=600");
    response.status(200).json(cache.body);
  } catch (error) {
    console.error("[api/catalogue] failed:", error.message);
    // Never cache a failure — a transient Supabase hiccup must not become a
    // 10-minute outage for every visitor.
    response.setHeader("Cache-Control", "no-store");
    response.status(502).json({ error: "catalogue_unavailable" });
  }
};
