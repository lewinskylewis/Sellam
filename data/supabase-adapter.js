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

  // Fetched via /api/catalogue rather than Supabase directly — a thin,
  // CDN-cached proxy (see api/catalogue.js) that makes the same two reads
  // (communities, properties+property_units) on the server and shares the
  // result across every visitor for up to a minute, instead of every
  // browser hitting Supabase independently. Returns the exact same
  // { rawCommunities, rawProperties } shape the two direct calls used to,
  // so nothing below this point (validateRaw, reconstructProperty,
  // reconstructCommunity) needed to change.
  function fetchFromSupabase(cfg) {
    return fetch("/api/catalogue", { method: "GET" }).then(function (response) {
      if (!response.ok) {
        return response.text().then(function (detail) {
          throw new Error("GET /api/catalogue failed: " + response.status + " " + detail.slice(0, 300));
        });
      }
      return response.json();
    });
  }

  // Homepage hero carousel (Hero Manager). Fetched separately from
  // fetchFromSupabase() above and never allowed to fail the main
  // properties/communities load — see the .catch() around its call site in
  // init(). properties(legacy_id) is a PostgREST resource embed across the
  // property_id foreign key; only legacy_id is needed here because the
  // title/price/link/etc. a hero slide displays are resolved live off
  // window.SELLAM_PROPERTIES by script.js's resolveHeroProperty(), exactly
  // as before — this table only ever supplies WHICH property and WHICH 3
  // curated photos.
  function fetchHeroSlides(cfg) {
    return supabaseGet(
      cfg,
      "/rest/v1/homepage_hero_slides?select=sections,sort_order,properties(legacy_id)&is_active=eq.true&order=sort_order.asc"
    );
  }

  // Homepage "Featured Properties" / "Exclusive Properties" teasers
  // (Property Highlights admin page). Same isolation contract as
  // fetchHeroSlides above: fetched separately, never allowed to fail the
  // main properties/communities load — see the .catch() around its call
  // site in init(). caption/image are the only hand-curated fields; which
  // property and its link are what this table is really curating.
  function fetchPropertyHighlights(cfg) {
    return supabaseGet(
      cfg,
      "/rest/v1/homepage_property_highlights?select=section,caption,image,sort_order,properties(legacy_id)&is_active=eq.true&order=section.asc,sort_order.asc"
    );
  }

  // Homepage hero title/description (Homepage Hero admin page's new
  // editor). Singleton table — at most one row. Same isolation contract as
  // the two fetches above: never allowed to fail the main load; on any
  // problem script.js simply leaves the homepage's existing static
  // heading/description text untouched. Does not touch the hero image
  // carousel (homepage_hero_slides) in any way.
  function fetchHeroCopy(cfg) {
    return supabaseGet(
      cfg,
      "/rest/v1/homepage_hero_copy?select=heading,description&limit=1"
    );
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

  // Reproduces the exact { id, sections } shape script.js's heroProperties
  // array already uses — id here is the property's legacy_id (what
  // resolveHeroProperty() matches window.SELLAM_PROPERTIES against), not
  // the homepage_hero_slides row's own uuid.
  function reconstructHeroSlide(row) {
    return {
      id: row.properties ? row.properties.legacy_id : null,
      sections: Array.isArray(row.sections) ? row.sections : []
    };
  }

  // id here is the property's legacy_id, exactly like reconstructHeroSlide
  // above — script.js resolves title/link/etc. off window.SELLAM_PROPERTIES
  // the same way it already does for hero entries. caption/image are null
  // when not overridden, meaning "use the property's own title/image".
  function reconstructPropertyHighlight(row) {
    return {
      id: row.properties ? row.properties.legacy_id : null,
      caption: row.caption || null,
      image: row.image || null
    };
  }

  function reconstructHeroCopy(row) {
    if (!row || !row.heading || !row.description) return null;
    return {
      heading: row.heading,
      description: row.description
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
      url: "communities/" + row.key + ".html",
      // Admin dashboard Communities module (202608272200): homepage carousel
      // visibility/order, and the individual community page's own hero
      // background — see community-render.js for both consumers.
      heroImage: row.hero_image || null,
      overview: row.overview || null,
      sortOrder: typeof row.sort_order === "number" ? row.sort_order : 0,
      isActive: row.is_active !== false
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

        // Best-effort and isolated on purpose: a problem fetching the hero
        // table (not yet migrated in some environment, RLS not applied,
        // etc.) must never take down the properties/communities load that
        // every other page depends on. On failure this simply leaves
        // window.SELLAM_HERO_SLIDES unset, and script.js falls back to its
        // own hardcoded set — same graceful-degradation shape as
        // loadStaticFallback() above.
        var heroSlidesLoaded = fetchHeroSlides(cfg)
          .then(function (rawHeroSlides) {
            window.SELLAM_HERO_SLIDES = rawHeroSlides
              .filter(function (row) { return row.properties && row.properties.legacy_id; })
              .map(reconstructHeroSlide);
          })
          .catch(function (heroError) {
            console.warn("[SellamData] Hero slides fetch failed, falling back to script.js's hardcoded set:", heroError.message);
          });

        // Same isolation contract as hero slides directly above: a problem
        // here must never take down the properties/communities load. On
        // failure this simply leaves window.SELLAM_PROPERTY_HIGHLIGHTS unset,
        // and script.js leaves the homepage's existing static Featured/
        // Exclusive markup untouched.
        var propertyHighlightsLoaded = fetchPropertyHighlights(cfg)
          .then(function (rawHighlights) {
            var bySection = { featured: [], exclusive: [] };
            rawHighlights
              .filter(function (row) { return row.properties && row.properties.legacy_id && bySection[row.section]; })
              .forEach(function (row) { bySection[row.section].push(reconstructPropertyHighlight(row)); });
            window.SELLAM_PROPERTY_HIGHLIGHTS = bySection;
          })
          .catch(function (highlightsError) {
            console.warn("[SellamData] Property highlights fetch failed, homepage keeps its existing static Featured/Exclusive cards:", highlightsError.message);
          });

        // Same isolation contract again. On failure this simply leaves
        // window.SELLAM_HERO_COPY unset, and script.js leaves the
        // homepage's existing static heading/description text untouched.
        var heroCopyLoaded = fetchHeroCopy(cfg)
          .then(function (rawHeroCopy) {
            window.SELLAM_HERO_COPY = reconstructHeroCopy(rawHeroCopy && rawHeroCopy[0]);
          })
          .catch(function (heroCopyError) {
            console.warn("[SellamData] Hero title/description fetch failed, homepage keeps its existing static text:", heroCopyError.message);
          });

        return Promise.all([heroSlidesLoaded, propertyHighlightsLoaded, heroCopyLoaded]).then(function () {
          return { source: "supabase", communities: communities.length, properties: properties.length };
        });
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
