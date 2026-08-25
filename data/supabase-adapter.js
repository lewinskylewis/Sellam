"use strict";

/* ============================================================================
   SELLAM — Supabase read adapter (Phase 2, Step 2)
   ============================================================================
   NOT YET WIRED INTO ANY PAGE. This file is inert until some future HTML
   integration step loads it (before listings.js / property-search.js /
   community-render.js / script.js / enquiry-modal.js) and sets
   window.SELLAM_SUPABASE_CONFIG. Until that happens, isConfigValid() below
   always fails and every consumer of this file falls straight through to
   the existing static data/properties.js + data/communities.js files —
   the live site's behavior is completely unaffected by this file's mere
   presence in the repo.

   PURPOSE: fetch the public property/community catalogue from Supabase
   (anon key only — RLS already grants public SELECT, see
   supabase/migrations/202608251200_create_properties_schema.sql) and
   reconstruct it into EXACTLY the shape data/properties.js and
   data/communities.js already produce, so every existing consumer
   (listings.js, property-search.js, community-render.js, script.js,
   property-detail.js, enquiry-modal.js — none of which this file modifies)
   keeps working completely unchanged.

   CREDENTIALS: this file must NEVER read or reference SUPABASE_SECRET_KEY /
   service_role — only the public anon/publishable key, which is safe to
   ship to the browser (Supabase's own design: RLS is the security
   boundary, not secrecy of this key).

   ENVIRONMENT-VARIABLE NOTE (see Step 2 report §K for the full writeup):
   this is a plain static site with no build step — there is no mechanism
   for a bare <script src="data/supabase-adapter.js"> to read a server-side
   env var directly. The two non-invented options are (a) a small inline
   <script>window.SELLAM_SUPABASE_CONFIG = {...}</script> block placed in
   HTML before this file loads, or (b) hardcoding the values directly in
   this file. Both are equally safe for a value that's meant to be public;
   neither has been done yet because doing so means editing HTML, which
   this step is explicitly not authorized to do. This file reads
   window.SELLAM_SUPABASE_CONFIG so that whichever option is chosen later
   requires zero changes here.

   READINESS: window.SellamData.ready is a Promise that resolves once
   window.SELLAM_PROPERTIES and window.SELLAM_COMMUNITIES are populated,
   from Supabase or (on any failure) from the existing static files. No
   consumer script is invoked or modified by this file — wiring the 5
   consumer scripts to actually wait on this Promise is a future step.
   ========================================================================== */

(function () {
  // --------------------------------------------------------------------
  // Config
  // --------------------------------------------------------------------

  function resolveConfig() {
    var cfg = window.SELLAM_SUPABASE_CONFIG || {};
    return {
      url: String(cfg.url || "").replace(/\/$/, ""),
      anonKey: String(cfg.anonKey || cfg.key || "")
    };
  }

  function isConfigValid(cfg) {
    return /^https:\/\//.test(cfg.url) && cfg.anonKey.length > 0;
  }

  // --------------------------------------------------------------------
  // Fetch (raw fetch/PostgREST, same pattern as api/enquiry.js — no SDK)
  // --------------------------------------------------------------------

  function supabaseGet(cfg, path) {
    return fetch(cfg.url + path, {
      method: "GET",
      headers: { apikey: cfg.anonKey, Authorization: "Bearer " + cfg.anonKey }
    }).then(function (response) {
      if (!response.ok) {
        return response.text().then(function (detail) {
          throw new Error("Supabase GET " + path + " failed: " + response.status + " " + detail.slice(0, 300));
        });
      }
      return response.json();
    });
  }

  // Two requests total: communities, and properties with property_units
  // embedded via the existing property_units_property_id_fkey foreign key
  // (PostgREST resource embedding) — avoids a third round trip.
  function fetchFromSupabase(cfg) {
    var communities = supabaseGet(cfg, "/rest/v1/communities?select=*");
    var properties = supabaseGet(
      cfg,
      "/rest/v1/properties?select=*,property_units(*)&property_units.order=display_order.asc"
    );
    return Promise.all([communities, properties]).then(function (results) {
      return { rawCommunities: results[0], rawProperties: results[1] };
    });
  }

  // --------------------------------------------------------------------
  // Reconstruction — reverses the Phase 1 migration's transform exactly,
  // field for field, back into the shape data/properties.js /
  // data/communities.js already produce.
  // --------------------------------------------------------------------

  // Matches renderDescription() in property-detail.js: a plain string when
  // there's no title, {title, body} when there is. Verified directly
  // against that function before writing this.
  function reconstructDescription(descriptionTitle, descriptionBody) {
    if (descriptionTitle) return { title: descriptionTitle, body: descriptionBody };
    return descriptionBody;
  }

  function reconstructUnit(row) {
    return {
      unitType: row.unit_type,
      bedrooms: row.bedrooms,
      bathrooms: row.bathrooms,
      salePrice: row.sale_price,
      rentPrice: row.rent_price,
      residenceLabel: row.residence_label,
      area: row.area,
      note: row.note,
      currency: row.currency
    };
  }

  function reconstructProperty(row) {
    var units = (Array.isArray(row.property_units) ? row.property_units.slice() : [])
      .sort(function (a, b) { return a.display_order - b.display_order; })
      .map(reconstructUnit);

    return {
      id: row.legacy_id,
      slug: row.slug,
      // Derived, never stored (Step 2 audit §G) — every existing consumer
      // that reads property.url gets it here, exactly as it does from the
      // static file today.
      url: row.slug,
      status: row.status,
      collection: row.collection,
      title: row.title,
      summary: row.summary,
      propertyType: row.property_type,
      community: row.community,
      location: row.location,
      letting: row.letting,
      features: Array.isArray(row.features) ? row.features : [],
      image: row.image,
      heroImage: row.hero_image,
      gallery: Array.isArray(row.gallery) ? row.gallery : [],
      description: reconstructDescription(row.description_title, row.description_body),
      featureLocation: row.feature_location,
      story: row.story == null ? null : row.story,
      featureHighlights: row.feature_highlights == null ? null : row.feature_highlights,
      closingParagraphs: row.closing_paragraphs,
      paymentPlan: row.payment_plan == null ? null : row.payment_plan,
      leasePricing: row.lease_pricing == null ? null : row.lease_pricing,
      listedDate: row.listed_date,
      units: units
      // Deliberately NOT reintroduced: project, redundant top-level
      // bedrooms/bathrooms/salePrice/rentPrice — see Step 2 report §D.
      // unitsOf() in data/property-units.js already treats `units[]` as
      // the single representation for both the flat- and multi-unit case,
      // so every migrated record (all now have >=1 property_units row)
      // only ever needs `units` here.
    };
  }

  function reconstructCommunity(row) {
    return {
      key: row.key,
      label: row.label,
      image: row.image,
      imageAlt: row.image_alt,
      description: row.description,
      // Derived, never stored (Step 2 audit §H) — community-render.js
      // reads community.url directly for the "View Community" link.
      url: "communities/" + row.key + ".html"
    };
  }

  // --------------------------------------------------------------------
  // Validation — real assertions against the actual fetched result, never
  // hardcoded to trivially pass. Runs on the RAW rows (still carrying
  // display_order, property_id, etc.) before reconstruction discards them.
  // --------------------------------------------------------------------

  var CURRENCY_VALUES = ["KES", "USD"];

  function isFiniteNumber(value) {
    return typeof value === "number" && isFinite(value);
  }

  // Two tiers, deliberately:
  //   errors   — the fetch itself came back malformed in a way that would
  //              break reconstruction/rendering outright. Only these cause
  //              a fallback to static data.
  //   warnings — content-shape oddities on an individual row (a duplicate
  //              slug, a unit with no price, a stray non-null field). Real
  //              content management — deleting a listing, adding one,
  //              editing prices directly in Supabase — changes row counts
  //              and specific ids by design, so counts/ids are never
  //              validated here. A problem on one row is logged and the
  //              rest of the catalogue still loads; it no longer takes the
  //              entire site down to a frozen migration-day snapshot.
  // The database's own CHECK constraints (see supabase/migrations/) are the
  // real enforcement for vocabulary/format — this is a best-effort sanity
  // pass on top of that, not a duplicate gate.
  function validateRaw(rawCommunities, rawProperties) {
    var errors = [];
    var warnings = [];

    if (!Array.isArray(rawCommunities)) errors.push("communities response was not an array");
    if (!Array.isArray(rawProperties)) errors.push("properties response was not an array");
    if (errors.length) return { errors: errors, warnings: warnings };

    var seenLegacyIds = {};
    var seenSlugs = {};

    rawProperties.forEach(function (p) {
      if (!p.legacy_id || !p.slug) {
        warnings.push("a property row is missing legacy_id or slug — it may not resolve correctly by URL");
        return;
      }
      if (seenLegacyIds[p.legacy_id]) warnings.push("duplicate legacy_id: " + p.legacy_id);
      seenLegacyIds[p.legacy_id] = true;
      if (seenSlugs[p.slug]) warnings.push("duplicate slug: " + p.slug);
      seenSlugs[p.slug] = true;

      var units = Array.isArray(p.property_units) ? p.property_units : [];
      if (units.length === 0) warnings.push(p.legacy_id + ": has no units (bedrooms/price will show as unavailable)");

      var seenOrders = {};
      units.forEach(function (u) {
        if (u.property_id !== p.id) warnings.push(p.legacy_id + ": a unit's property_id doesn't match its parent");
        if (seenOrders[u.display_order]) warnings.push(p.legacy_id + ": duplicate unit display_order " + u.display_order);
        seenOrders[u.display_order] = true;
        if (u.currency !== null && CURRENCY_VALUES.indexOf(u.currency) === -1) {
          warnings.push(p.legacy_id + " unit display_order " + u.display_order + ": unrecognised currency '" + u.currency + "'");
        }
        if (u.sale_price !== null && !(isFiniteNumber(u.sale_price) && u.sale_price > 0)) {
          warnings.push(p.legacy_id + " unit display_order " + u.display_order + ": malformed sale_price");
        }
        if (u.rent_price !== null && !(isFiniteNumber(u.rent_price) && u.rent_price > 0)) {
          warnings.push(p.legacy_id + " unit display_order " + u.display_order + ": malformed rent_price");
        }
      });
    });

    return { errors: errors, warnings: warnings };
  }

  // --------------------------------------------------------------------
  // Fallback — dynamically loads the existing static files, unmodified,
  // exactly as any HTML page already does today. Never uses service_role;
  // this path makes zero Supabase requests at all.
  // --------------------------------------------------------------------

  function loadScriptOnce(src) {
    return new Promise(function (resolve, reject) {
      var existing = document.querySelector('script[src="' + src + '"]');
      if (existing) { resolve(); return; }
      var script = document.createElement("script");
      script.src = src;
      script.onload = function () { resolve(); };
      script.onerror = function () { reject(new Error("Failed to load fallback script: " + src)); };
      document.head.appendChild(script);
    });
  }

  function loadStaticFallback(reason) {
    if (reason) console.warn("[SellamData] Falling back to static data files:", reason);
    return Promise.all([loadScriptOnce("data/properties.js"), loadScriptOnce("data/communities.js")])
      .then(function () {
        if (!Array.isArray(window.SELLAM_PROPERTIES) || !Array.isArray(window.SELLAM_COMMUNITIES)) {
          throw new Error("Static fallback scripts loaded but did not populate the expected globals.");
        }
        return { source: "static-fallback" };
      });
  }

  // --------------------------------------------------------------------
  // Entry point
  // --------------------------------------------------------------------

  function init() {
    var cfg = resolveConfig();

    if (!isConfigValid(cfg)) {
      return loadStaticFallback("no valid window.SELLAM_SUPABASE_CONFIG found (expected {url, anonKey})");
    }

    return fetchFromSupabase(cfg)
      .then(function (raw) {
        var validation = validateRaw(raw.rawCommunities, raw.rawProperties);
        if (validation.errors.length) {
          throw new Error("Supabase data failed validation:\n  " + validation.errors.join("\n  "));
        }
        if (validation.warnings.length) {
          console.warn("[SellamData] Loaded from Supabase with " + validation.warnings.length + " content warning(s):\n  " + validation.warnings.join("\n  "));
        }

        var communities = raw.rawCommunities.map(reconstructCommunity);
        var properties = raw.rawProperties.map(reconstructProperty);

        window.SELLAM_COMMUNITIES = communities;
        window.SELLAM_PROPERTIES = properties;

        return { source: "supabase", communities: communities.length, properties: properties.length };
      })
      .catch(function (error) {
        return loadStaticFallback(error.message);
      });
  }

  window.SellamData = window.SellamData || {};
  window.SellamData.ready = init();

  // Test-only export (guarded — undefined in a plain <script> tag, so this
  // has zero effect on any browser page). Lets scripts/test-supabase-adapter.js
  // reuse these exact functions instead of duplicating them, so the test can
  // never silently drift from what actually ships.
  if (typeof module !== "undefined" && module.exports) {
    module.exports = { reconstructProperty, reconstructCommunity, reconstructUnit, reconstructDescription, validateRaw };
  }
})();
