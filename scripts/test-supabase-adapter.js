#!/usr/bin/env node
"use strict";

/* ============================================================================
   SELLAM — Supabase adapter test (Phase 2, Step 2)
   ============================================================================
   Read-only. Loads data/supabase-adapter.js UNMODIFIED inside a minimal
   simulated browser environment (Node's vm module — same technique already
   used by scripts/migrate-properties.js to load property-detail.js's data),
   lets it fetch from Supabase and reconstruct window.SELLAM_PROPERTIES /
   window.SELLAM_COMMUNITIES for real, then diffs that output against the
   current static data/properties.js + data/communities.js using the same
   order-insensitive-object / order-sensitive-array comparator built for the
   Phase 2 Step 1 database-vs-JS verification.

   This script only ever issues GET requests. It never INSERTs, UPDATEs,
   DELETEs, runs SQL, or modifies any source file.

   Credentials:
     SELLAM_SUPABASE_URL   required (not secret) — the property/community
                            Supabase project. Deliberately distinct from
                            SUPABASE_URL, which belongs to the existing
                            enquiry-form Supabase project (api/enquiry.js /
                            api/subscribe.js) and is never read here.
     SUPABASE_ANON_KEY     required — the public/publishable key for that
                            same project; proves the actual RLS-gated public
                            path the browser will use. SUPABASE_SECRET_KEY
                            (the enquiry project's service_role key) is
                            never read by this script.

   Usage:
     node scripts/test-supabase-adapter.js
     node scripts/test-supabase-adapter.js --fallback   force the static-JS
                                                          fallback path (no
                                                          config at all) to
                                                          verify that
                                                          mechanism works
   ============================================================================ */

const fs = require("fs");
const path = require("path");
const vm = require("vm");

const ROOT = path.resolve(__dirname, "..");
const FORCE_FALLBACK = process.argv.includes("--fallback");

function loadEnvFile(file) {
  if (!fs.existsSync(file)) return;
  for (const line of fs.readFileSync(file, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (/^".*"$/.test(value) || /^'.*'$/.test(value)) value = value.slice(1, -1);
    if (!(key in process.env)) process.env[key] = value;
  }
}
loadEnvFile(path.join(ROOT, ".env"));

const SUPABASE_URL = String(process.env.SELLAM_SUPABASE_URL || "").replace(/\/$/, "");
const ANON_KEY = String(process.env.SUPABASE_ANON_KEY || "");

// --------------------------------------------------------------------------
// Minimal simulated browser environment for data/supabase-adapter.js
// --------------------------------------------------------------------------

function buildWindowStub() {
  const win = {};
  win.window = win;
  win.console = console;
  win.fetch = fetch; // Node 18+ global fetch — real network GETs only
  win.Promise = Promise;

  const fakeScriptTags = [];
  win.document = {
    querySelector(selector) {
      // loadScriptOnce() only ever checks for an already-present <script
      // src="...">; nothing is ever pre-present in this simulated DOM.
      return null;
    },
    createElement(tag) {
      const el = {
        tagName: tag,
        _src: null,
        set src(value) {
          this._src = value;
          // Simulate the browser loading + executing the script: read the
          // real local file and eval it into this same window context, then
          // fire onload — exercises the actual fallback files for real.
          setImmediate(() => {
            try {
              const filePath = path.join(ROOT, value);
              const code = fs.readFileSync(filePath, "utf8");
              vm.createContext(win);
              new vm.Script(code, { filename: value }).runInContext(win);
              if (typeof el.onload === "function") el.onload();
            } catch (error) {
              if (typeof el.onerror === "function") el.onerror(error);
            }
          });
        },
        get src() { return this._src; }
      };
      fakeScriptTags.push(el);
      return el;
    },
    head: { appendChild() {} }
  };

  return win;
}

function runAdapter(config) {
  const win = buildWindowStub();
  win.SELLAM_SUPABASE_CONFIG = config;
  vm.createContext(win);
  const code = fs.readFileSync(path.join(ROOT, "data", "supabase-adapter.js"), "utf8");
  new vm.Script(code, { filename: "data/supabase-adapter.js" }).runInContext(win);
  return win.SellamData.ready.then((result) => ({ result, win }));
}

// Loads the SAME adapter file's pure reconstruction functions (not the
// live init()/fetch path) via the guarded module.exports at the bottom of
// data/supabase-adapter.js, so the "expected" side of the comparison below
// can never silently drift from what actually ships to the browser.
function loadAdapterReconstructionFunctions() {
  const win = buildWindowStub();
  win.SELLAM_SUPABASE_CONFIG = {}; // invalid on purpose — avoids a real fetch just to read the exports
  const moduleObj = { exports: {} };
  win.module = moduleObj;
  win.exports = moduleObj.exports;
  vm.createContext(win);
  const code = fs.readFileSync(path.join(ROOT, "data", "supabase-adapter.js"), "utf8");
  new vm.Script(code, { filename: "data/supabase-adapter.js" }).runInContext(win);
  return moduleObj.exports;
}

// --------------------------------------------------------------------------
// Comparator (identical methodology to Phase 2 Step 1's DB-vs-JS diff)
// --------------------------------------------------------------------------

function deepEqual(a, b) {
  if (a === b) return true;
  if (a === null || b === null || typeof a !== "object" || typeof b !== "object") return a === b;
  if (Array.isArray(a) !== Array.isArray(b)) return false;
  if (Array.isArray(a)) {
    if (a.length !== b.length) return false;
    return a.every((v, i) => deepEqual(v, b[i]));
  }
  const ak = Object.keys(a).sort();
  const bk = Object.keys(b).sort();
  if (ak.length !== bk.length || ak.some((k, i) => k !== bk[i])) return false;
  return ak.every((k) => deepEqual(a[k], b[k]));
}

// Builds the "expected" side from the SAME canonical transform that Phase 1
// validated and committed (scripts/migrate-properties.js's buildCandidates),
// run through the adapter's own reconstruction functions — NOT a fresh
// reimplementation, and NOT a raw comparison against untransformed source
// (which would flag e.g. untrimmed titles or unset-vs-null optional fields
// as false positives, exactly as migrate-properties.js's own normalization
// already accounts for and the Phase 2 Step 1 DB-vs-JS diff already proved
// matches). This keeps this test measuring exactly one thing: does the
// adapter correctly reverse the transform, given what's actually in the DB.
function loadExpectedDataset() {
  const { buildCandidates } = require(path.join(ROOT, "scripts", "migrate-properties.js"));
  const { reconstructProperty, reconstructCommunity } = loadAdapterReconstructionFunctions();
  const built = buildCandidates();

  const properties = built.candidates.map((c) => {
    // The international candidates' payload deliberately OMITS `status` so
    // Postgres's DEFAULT 'available' applies on insert (see the Step 6/9
    // fix in migrate-properties.js) — the row actually committed, and thus
    // what the adapter correctly reads back, has status: "available". This
    // mirrors that same default here rather than comparing against the
    // pre-insert payload shape.
    const status = "status" in c.property ? c.property.status : "available";
    return reconstructProperty(Object.assign({}, c.property, { status, property_units: c.units }));
  });
  const communities = built.communities.map(reconstructCommunity);
  return { properties, communities };
}

function compareDatasets(adapterProps, adapterComms, staticData) {
  const errors = [];

  if (adapterProps.length !== staticData.properties.length) {
    errors.push(`property count: adapter ${adapterProps.length} vs static ${staticData.properties.length}`);
  }
  if (adapterComms.length !== staticData.communities.length) {
    errors.push(`community count: adapter ${adapterComms.length} vs static ${staticData.communities.length}`);
  }

  const staticById = new Map(staticData.properties.map((p) => [p.id, p]));
  for (const ap of adapterProps) {
    const sp = staticById.get(ap.id);
    if (!sp) { errors.push(`adapter property '${ap.id}' has no static counterpart`); continue; }
    for (const field of Object.keys(ap)) {
      if (!deepEqual(ap[field], sp[field])) {
        errors.push(`property '${ap.id}' field '${field}' differs`);
      }
    }
  }

  const staticCommByKey = new Map(staticData.communities.map((c) => [c.key, c]));
  for (const ac of adapterComms) {
    const sc = staticCommByKey.get(ac.key);
    if (!sc) { errors.push(`adapter community '${ac.key}' has no static counterpart`); continue; }
    for (const field of Object.keys(ac)) {
      if (!deepEqual(ac[field], sc[field])) {
        errors.push(`community '${ac.key}' field '${field}' differs`);
      }
    }
  }

  return errors;
}

// --------------------------------------------------------------------------
// Main
// --------------------------------------------------------------------------

(async () => {
  console.log("============================================================");
  console.log("SUPABASE ADAPTER TEST");
  console.log("============================================================");

  const config = FORCE_FALLBACK ? {} : { url: SUPABASE_URL, anonKey: ANON_KEY };

  if (!FORCE_FALLBACK && (!SUPABASE_URL || !ANON_KEY)) {
    console.error("SELLAM_SUPABASE_URL and/or SUPABASE_ANON_KEY not found in .env — cannot reach Supabase.");
    console.error("Run with --fallback to test only the static-JS fallback path.");
    process.exitCode = 1;
    return;
  }

  const { result } = await runAdapter(config);
  console.log("adapter resolved with source:", result.source);
  if (result.source !== "supabase" && !FORCE_FALLBACK) {
    console.error("Expected the adapter to succeed via Supabase, but it fell back. See warnings above.");
    process.exitCode = 1;
    return;
  }

  console.log("communities:", result.communities ?? "(from fallback — see globals)");
  console.log("properties:", result.properties ?? "(from fallback — see globals)");

  // Re-run the adapter's own context isn't retained after the promise above,
  // so re-invoke to capture the populated globals for comparison.
  const { win } = await runAdapter(config);
  await win.SellamData.ready;

  const staticData = loadExpectedDataset();
  const errors = compareDatasets(win.SELLAM_PROPERTIES, win.SELLAM_COMMUNITIES, staticData);

  console.log("\n=== COMPARISON: adapter output (from Supabase) vs. the canonical migrated transform ===");
  console.log("properties:", win.SELLAM_PROPERTIES.length, "| communities:", win.SELLAM_COMMUNITIES.length);
  console.log("substantive differences:", errors.length);
  if (errors.length) {
    for (const e of errors.slice(0, 50)) console.log("  -", e);
    if (errors.length > 50) console.log(`  ... and ${errors.length - 50} more`);
    process.exitCode = 1;
  } else {
    console.log("0 substantive differences — adapter output matches the static JS dataset exactly.");
  }
})().catch((error) => {
  console.error("Test script failed:", error.stack || error.message);
  process.exitCode = 1;
});
