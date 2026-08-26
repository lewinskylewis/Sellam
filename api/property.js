"use strict";

/* ============================================================================
   SELLAM — PROPERTY PAGE RENDERER
   ============================================================================
   property.html used to be a static file: the browser painted its hardcoded
   "DG WEST" placeholder markup first, then property-detail.js swapped in the
   real title/price/gallery/etc. after DOMContentLoaded. On a slow connection
   that swap was visibly late, so visitors briefly saw the wrong property.

   This function removes that gap. It runs the *actual* client scripts
   (property-detail.js and friends, unmodified) inside a virtual DOM (jsdom)
   on the server, for the requested ?id=, and returns the fully-populated
   HTML. The browser now gets the correct property on the very first byte.
   property-detail.js still runs client-side afterward exactly as before —
   it just re-renders identical content, so gallery/lightbox/menu behavior
   is untouched, and there is nothing left to visibly swap in.

   templates/property.html is the single template shared by every property
   (reached via property.html?id=<slug>) — same source of truth as before,
   just rendered here instead of in the browser. data/properties.js is still
   the only file you edit to add/change a property.
   ========================================================================== */

const fs = require("fs");
const path = require("path");
const vm = require("vm");
const { JSDOM } = require("jsdom");

const ROOT = path.join(__dirname, "..");
const TEMPLATE_PATH = path.join(ROOT, "templates", "property.html");
const ADAPTER_PATH = path.join(ROOT, "data", "supabase-adapter.js");

// Loaded into the virtual page in this exact order — matches the <head>/
// <body> script order in templates/property.html so globals (window.SELLAM_
// PROPERTIES, window.SellamUnits, window.SellamSearch, ...) are defined
// before the scripts that read them run.
//
// data/properties.js is intentionally NOT in this list any more (Phase 2,
// Step 4): window.SELLAM_PROPERTIES is now populated from Supabase before
// these run (see loadPropertiesForRender()), falling back to evaluating
// data/properties.js itself — unchanged, still on disk — only if that
// fetch fails. data/property-units.js is unconditional either way: it only
// defines window.SellamUnits's helper functions and has no data dependency
// of its own.
const HEAD_SCRIPT = "site-motion.js";
const DATA_UNIT_SCRIPT = "data/property-units.js";
const STATIC_PROPERTIES_SCRIPT = "data/properties.js";
const REMAINING_BODY_SCRIPTS = [
  "property-search.js",
  "enquiry-config.js",
  "enquiry-modal.js",
  "property-detail.js",
  "nav-active.js",
  "newsletter.js"
];

let templateCache = null;
function readTemplate() {
  if (!templateCache) templateCache = fs.readFileSync(TEMPLATE_PATH, "utf8");
  return templateCache;
}

const scriptCache = new Map();
function readScript(relativePath) {
  if (!scriptCache.has(relativePath)) {
    scriptCache.set(relativePath, fs.readFileSync(path.join(ROOT, relativePath), "utf8"));
  }
  return scriptCache.get(relativePath);
}

/* ============================================================================
   Supabase server-side read (Phase 2, Step 4)
   ============================================================================
   Replaces the eval of data/properties.js with a server-side fetch,
   reconstructed into the exact same window.SELLAM_PROPERTIES shape using
   data/supabase-adapter.js's own, already-verified reconstruction functions
   — not a reimplementation. Falls back to evaluating data/properties.js
   itself (unchanged, still on disk, exactly today's behavior) if the fetch
   or validation fails for any reason, so a Supabase outage or RLS/schema
   surprise degrades to the current production behavior rather than breaking
   the page.

   Credential: the public anon/publishable key, not SUPABASE_SECRET_KEY.
   RLS already grants unrestricted SELECT on communities/properties/
   property_units to anon (verified in Phase 2, Steps 1–2) — including
   sold/let statuses, which this renderer needs so those properties keep
   resolving by direct URL — so the least-privileged credential is
   sufficient and preferred over the server-only secret.
   ========================================================================== */

// Loads ONLY data/supabase-adapter.js's pure reconstruction/validation
// functions via its guarded module.exports, inside a minimal stub
// environment just complete enough for the file's top-level code not to
// throw (it unconditionally calls init(), which needs `window`/`document`
// to exist). Nothing here makes a network request — init()'s own fetch
// attempt is deliberately given an invalid config so it falls through to
// its internal static-fallback path harmlessly in the background; this
// function never waits on or uses that result, only the synchronously
// available module.exports.
let adapterExportsCache = null;
function loadAdapterExports() {
  if (adapterExportsCache) return adapterExportsCache;
  const stubWindow = {};
  stubWindow.window = stubWindow;
  stubWindow.console = console;
  stubWindow.fetch = () => Promise.reject(new Error("not used"));
  stubWindow.document = {
    querySelector: () => null,
    createElement: () => ({ set src(_v) {}, get src() { return undefined; } }),
    head: { appendChild() {} }
  };
  const moduleObj = { exports: {} };
  stubWindow.module = moduleObj;
  stubWindow.exports = moduleObj.exports;
  vm.createContext(stubWindow);
  new vm.Script(fs.readFileSync(ADAPTER_PATH, "utf8"), { filename: ADAPTER_PATH }).runInContext(stubWindow);
  adapterExportsCache = moduleObj.exports;
  return adapterExportsCache;
}

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

const PROPERTIES_CACHE_TTL_MS = 60 * 1000;
const propertyCacheById = new Map(); // id -> { expiresAt, properties, communities }

// Fetches only the ONE property this render needs, not the whole catalogue.
// property-detail.js only ever looks up a single property by id/slug
// (findInventoryProperty() is the only place it reads window.SELLAM_PROPERTIES
// at all) — nothing on this page cross-references other listings, so
// pulling every property+its units over the wire just to render one page
// wastes exactly the payload/latency this scales worst with as the
// catalogue grows. `id` matches either legacy_id or slug, same as
// findInventoryProperty()'s own lookup, so the query mirrors that exactly.
// Communities stays a full (small, tens-of-rows) fetch — nothing this page
// evals reads it, but it's cheap enough that narrowing it isn't worth the
// added complexity.
async function fetchReconstructedFromSupabase(id) {
  const cached = propertyCacheById.get(id);
  if (cached && cached.expiresAt > Date.now()) {
    return cached;
  }

  // SELLAM_SUPABASE_URL is intentionally distinct from SUPABASE_URL: the
  // latter belongs to the existing enquiry-form Supabase project (used by
  // api/enquiry.js / api/subscribe.js) and must never be touched here.
  const supabaseUrl = String(process.env.SELLAM_SUPABASE_URL || "").replace(/\/$/, "");
  const anonKey = String(process.env.SUPABASE_ANON_KEY || "");
  if (!/^https:\/\//.test(supabaseUrl) || !anonKey) {
    throw new Error("SELLAM_SUPABASE_URL / SUPABASE_ANON_KEY are not configured");
  }

  const { reconstructProperty, reconstructCommunity, validateRaw } = loadAdapterExports();

  const propertiesPath = id
    ? `/rest/v1/properties?or=(legacy_id.eq.${encodeURIComponent(id)},slug.eq.${encodeURIComponent(id)})&select=*,property_units(*)&property_units.order=display_order.asc`
    : null;

  const [rawCommunities, rawProperties] = await Promise.all([
    supabaseGet(supabaseUrl, anonKey, "/rest/v1/communities?select=*"),
    propertiesPath ? supabaseGet(supabaseUrl, anonKey, propertiesPath) : Promise.resolve([])
  ]);

  const validation = validateRaw(rawCommunities, rawProperties);
  if (validation.errors.length) {
    throw new Error(`Supabase data failed validation:\n  ${validation.errors.join("\n  ")}`);
  }
  if (validation.warnings.length) {
    console.warn(`[api/property] Loaded from Supabase with ${validation.warnings.length} content warning(s):\n  ${validation.warnings.join("\n  ")}`);
  }

  const properties = rawProperties.map(reconstructProperty);
  const communities = rawCommunities.map(reconstructCommunity);

  const result = { expiresAt: Date.now() + PROPERTIES_CACHE_TTL_MS, properties, communities };
  // Crude but sufficient bound on a long-lived warm instance: this is a
  // per-property cache now instead of one shared entry, so without a cap it
  // could grow for as long as the instance stays warm and keeps seeing new
  // ids. Simplest safe fix — clear and start over rather than tracking LRU.
  if (propertyCacheById.size > 200) propertyCacheById.clear();
  propertyCacheById.set(id, result);
  return result;
}

// Returns { source: "supabase" | "static-fallback" } plus enough information
// for renderPropertyPage() to know whether it still needs to eval
// data/properties.js itself.
async function loadPropertiesForRender(id) {
  try {
    const { properties, communities } = await fetchReconstructedFromSupabase(id);
    return { source: "supabase", properties, communities };
  } catch (error) {
    console.error("[api/property] Supabase server-side fetch failed, falling back to data/properties.js:", error.message);
    return { source: "static-fallback", properties: null, communities: null };
  }
}

// jsdom has no real layout engine, so IntersectionObserver never fires here
// — every ".reveal" element simply stays un-revealed in the rendered output,
// exactly like a real browser before the visitor has scrolled to it. This
// stub only needs to exist so the "IntersectionObserver" in window checks in
// site-motion.js / property-detail.js take their normal code path instead of
// the no-JS fallback (which would mark everything visible immediately).
class NoopIntersectionObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}

// jsdom has no layout engine, so it doesn't implement matchMedia at all.
// Assume a large desktop viewport (matches nothing in the site's mobile/
// tablet max-width queries, same as most first-time visitors) so the two
// scripts that branch on screen size — site-motion.js's reduced-motion
// check and property-detail.js's gallery visibleCount — take their normal
// desktop path instead of throwing.
function matchMediaStub(query) {
  const maxWidth = /\(max-width:\s*(\d+)px\)/.exec(query);
  const minWidth = /\(min-width:\s*(\d+)px\)/.exec(query);
  const viewportWidth = 1920;
  let matches = false;
  if (maxWidth) matches = viewportWidth <= Number(maxWidth[1]);
  else if (minWidth) matches = viewportWidth >= Number(minWidth[1]);

  return {
    matches,
    media: query,
    addListener() {},
    removeListener() {},
    addEventListener() {},
    removeEventListener() {},
    dispatchEvent() { return true; }
  };
}

async function renderPropertyPage(id) {
  const html = readTemplate();
  const url = `https://sellamre.com/property${id ? `?id=${encodeURIComponent(id)}` : ""}`;

  const dom = new JSDOM(html, { url, runScripts: "outside-only", pretendToBeVisual: true });
  const { window } = dom;

  try {
    window.IntersectionObserver = NoopIntersectionObserver;
    window.matchMedia = matchMediaStub;

    window.eval(readScript(HEAD_SCRIPT));

    // Fetch (or fall back) BEFORE evaluating any script that reads
    // window.SELLAM_PROPERTIES — same ordering guarantee the old
    // synchronous data/properties.js eval provided, just resolved async
    // first instead.
    const data = await loadPropertiesForRender(id);
    if (data.source === "supabase") {
      window.SELLAM_PROPERTIES = data.properties;
      window.SELLAM_COMMUNITIES = data.communities;
      window.eval(readScript(DATA_UNIT_SCRIPT));
    } else {
      window.eval(readScript(STATIC_PROPERTIES_SCRIPT));
      window.eval(readScript(DATA_UNIT_SCRIPT));
    }

    REMAINING_BODY_SCRIPTS.forEach((file) => window.eval(readScript(file)));

    // The scripts above register "DOMContentLoaded" listeners (that's where
    // property-detail.js actually builds the price table, gallery, story
    // content, etc.). jsdom already finished parsing before we could attach
    // those listeners, so the real event is long gone — fire an equivalent
    // one now to trigger the same rendering code.
    window.document.dispatchEvent(new window.Event("DOMContentLoaded", { bubbles: true, cancelable: true }));

    return { html: `<!doctype html>\n${window.document.documentElement.outerHTML}`, source: data.source };
  } finally {
    window.close();
  }
}

module.exports = async function propertyHandler(request, response) {
  const id = typeof request.query?.id === "string" ? request.query.id : "";

  try {
    const { html, source } = await renderPropertyPage(id);
    response.setHeader("Content-Type", "text/html; charset=utf-8");
    response.setHeader("X-Sellam-Data-Source", source);
    response.status(200).send(html);
  } catch (error) {
    console.error("Property render error:", error);
    // Never let a rendering bug take the page down — fall back to the raw
    // template (today's pre-fix behavior) rather than a broken response.
    response.setHeader("Content-Type", "text/html; charset=utf-8");
    response.status(200).send(readTemplate());
  }
};
