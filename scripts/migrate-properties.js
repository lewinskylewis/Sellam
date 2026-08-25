#!/usr/bin/env node
"use strict";

/* ============================================================================
   SELLAM — property catalogue migration (Phase 1, Step 6)
   ============================================================================
   Reads the existing JS data sources (read-only — never modifies them),
   transforms the confirmed live records into the approved Supabase schema
   (public.communities / public.properties / public.property_units), and
   writes them ONLY when run with --commit. Default mode is a dry run that
   performs zero database writes and prints a report.

   Usage:
     node scripts/migrate-properties.js            dry run (no writes)
     node scripts/migrate-properties.js --commit    validate, then write

   Source datasets (read-only):
     - data/communities.js        window.SELLAM_COMMUNITIES
     - data/properties.js         window.SELLAM_PROPERTIES  (42 records today)
     - property-detail.js         propertyData (legacy fallback dataset) —
       only the 4 keys in LIVE_LEGACY_KEYS below are used (the 4 genuine
       international properties); grosvenor-westlands is a confirmed
       duplicate of SELLAM_PROPERTIES sl-017 and the other ~25 keys are
       template/placeholder content — none of those are read into the
       migration set

   data/property-units.js is NOT executed by this script. Its unitsOf()
   behaviour is reimplemented in unitsOfSellamProperty() below, exactly, so
   the transformation matches what the live site already does with the same
   source records — see that function for the one-to-one correspondence.
   ============================================================================ */

const fs = require("fs");
const path = require("path");
const vm = require("vm");

const ROOT = path.resolve(__dirname, "..");
const ARGV = process.argv.slice(2);
const COMMIT = ARGV.includes("--commit");

// The approved final migration scope (Phase 1, Step 6): 42 canonical
// SELLAM_PROPERTIES + 4 confirmed genuine international properties. This is
// compared against the deterministically-computed count; the script never
// forces the number to match by dropping or adding records.
const EXPECTED_LIVE_COUNT = 46;
const EXPECTED_SELLAM_COUNT = 42;
const EXPECTED_INTERNATIONAL_COUNT = 4;

// ============================================================================
// 0. Environment (server-side Supabase credentials only)
// ============================================================================
// Mirrors api/enquiry.js's pattern: raw fetch() against the PostgREST API
// with the secret key in the `apikey`/`Authorization` headers. Never import
// this file, or its credential-reading code, from any frontend script.

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

function readSupabaseConfig() {
  // SELLAM_SUPABASE_URL, not SUPABASE_URL — property/community data lives in
  // the listings environment, distinct from the enquiry system's URL, which
  // this script must never read or write to.
  const url = String(process.env.SELLAM_SUPABASE_URL || "").replace(/\/$/, "");
  const key = String(process.env.SUPABASE_SECRET_KEY || "");
  if (!url || !key) return null;
  return { url, key };
}

// ============================================================================
// 1. Loading source data (read-only)
// ============================================================================

function loadWindowAssignedArray(relativePath, globalName) {
  const file = path.join(ROOT, relativePath);
  const code = fs.readFileSync(file, "utf8");
  const sandbox = { window: {} };
  vm.createContext(sandbox);
  new vm.Script(code, { filename: relativePath }).runInContext(sandbox);
  const value = sandbox.window[globalName];
  if (!Array.isArray(value)) {
    throw new Error(`${relativePath}: expected window.${globalName} to be an array, got ${typeof value}`);
  }
  return value;
}

// Extracts one balanced {...} or [...] region starting exactly at
// source[openIndex] (which must be "{", "[" or "("), respecting string and
// template literals and comments so that braces inside description text
// never desync the match. Used to pull just the data literals we need out of
// property-detail.js WITHOUT executing the rest of that file (which expects
// a browser `document`/`window` and has real DOM side effects at load time).
function extractBalancedRegion(source, openIndex) {
  const pairs = { "{": "}", "[": "]", "(": ")" };
  const openChar = source[openIndex];
  if (!(openChar in pairs)) throw new Error(`extractBalancedRegion: offset ${openIndex} is not an opening bracket`);
  const stack = [pairs[openChar]];
  let i = openIndex + 1;
  while (i < source.length && stack.length) {
    const ch = source[i];
    if (ch === "/" && source[i + 1] === "/") {
      const nl = source.indexOf("\n", i);
      i = nl === -1 ? source.length : nl;
      continue;
    }
    if (ch === "/" && source[i + 1] === "*") {
      const close = source.indexOf("*/", i + 2);
      if (close === -1) throw new Error("extractBalancedRegion: unterminated block comment");
      i = close + 2;
      continue;
    }
    if (ch === '"' || ch === "'" || ch === "`") {
      const quote = ch;
      i += 1;
      while (i < source.length && source[i] !== quote) {
        i += source[i] === "\\" ? 2 : 1;
      }
      i += 1;
      continue;
    }
    if (ch === "{" || ch === "[" || ch === "(") {
      stack.push(pairs[ch]);
      i += 1;
      continue;
    }
    if (ch === "}" || ch === "]" || ch === ")") {
      if (stack[stack.length - 1] !== ch) {
        throw new Error(`extractBalancedRegion: bracket mismatch at offset ${i}: expected '${stack[stack.length - 1]}', found '${ch}'`);
      }
      stack.pop();
      i += 1;
      continue;
    }
    i += 1;
  }
  if (stack.length) throw new Error("extractBalancedRegion: source ended before brackets closed");
  return source.slice(openIndex, i);
}

function extractRegionAfter(source, startPattern) {
  const match = startPattern.exec(source);
  if (!match) throw new Error(`Could not locate pattern: ${startPattern}`);
  const openIndex = match.index + match[0].length - 1;
  return extractBalancedRegion(source, openIndex);
}

// Loads ONLY the propertyData object and the INTERNATIONAL_PAYMENT_PLAN
// constant it references, by locating and re-assembling those two data
// literals as an isolated snippet, then evaluating that snippet alone (no
// DOM, no other module state). This never runs any of property-detail.js's
// page-rendering logic.
function loadLegacyPropertyData() {
  const file = path.join(ROOT, "property-detail.js");
  const source = fs.readFileSync(file, "utf8");

  // commonGallery is a shared const defined near the top of property-detail.js
  // (generic stock photos) that several propertyData entries reference
  // directly (e.g. `gallery: commonGallery` or `commonGallery[3]`) — it must
  // be defined in the evaluated snippet or evaluating propertyData throws a
  // ReferenceError, even for entries this script never migrates, since the
  // whole propertyData object literal is evaluated before any allowlist
  // filtering happens.
  const galleryRegion = extractRegionAfter(source, /const\s+commonGallery\s*=\s*\[/);
  const baseRegion = extractRegionAfter(source, /const\s+propertyData\s*=\s*\{/);
  const planRegion = extractRegionAfter(source, /const\s+INTERNATIONAL_PAYMENT_PLAN\s*=\s*\[/);
  const mergedRegion = extractRegionAfter(source, /Object\.assign\(\s*propertyData\s*,\s*\{/);

  const snippet = [
    `const commonGallery = ${galleryRegion};`,
    `const propertyData = ${baseRegion};`,
    `const INTERNATIONAL_PAYMENT_PLAN = ${planRegion};`,
    `Object.assign(propertyData, ${mergedRegion});`,
    `propertyData;`
  ].join("\n");

  const sandbox = {};
  vm.createContext(sandbox);
  const result = new vm.Script(snippet, { filename: "property-detail.js (extracted propertyData)" }).runInContext(sandbox);
  if (!result || typeof result !== "object") {
    throw new Error("Failed to extract propertyData from property-detail.js");
  }
  return result;
}

// ============================================================================
// 2. Live-scope allowlist
// ============================================================================
// Deterministic identification of the confirmed live records. This script
// never migrates "every object found" — only what is named here.

// Every record in data/properties.js (window.SELLAM_PROPERTIES) is confirmed
// live inventory (Step 2 audit §C; every record has status "available", a
// unique slug, and is reachable from at least one live listing page).

// propertyData (property-detail.js) has ~30 keys total. Only these four are
// confirmed genuine international live inventory (Step 2 audit §C.4 +
// Step 5 scope-resolution report):
const LIVE_LEGACY_KEYS = [
  { key: "ShomaBay", reason: "Homepage diaspora-grid carousel, real international listing (Miami)." },
  { key: "Brabus-Villas", reason: "Homepage diaspora-grid carousel, real international listing (Dubai)." },
  { key: "Afra-Park", reason: "Homepage diaspora-grid carousel, real international listing (Istanbul)." },
  { key: "Indabyo-Heights", reason: "Homepage diaspora-grid carousel, real international listing (Kigali)." }
];

// grosvenor-westlands was reconsidered in the Step 5 scope-resolution
// report: same title ("Grosvenor") and same location ("Westlands, Nairobi")
// as SELLAM_PROPERTIES' sl-017 ("Grosvenor Residences"), which has real
// structured per-unit KES pricing that grosvenor-westlands lacks (a single
// flat USD placeholder figure) — and grosvenor-westlands's gallery reuses
// the same generic commonGallery[...] stock photos as the confirmed-dead
// template records. Determined to be a legacy/template representation of
// the same real property, not a second one. Canonical: sl-017. Excluded.
const KNOWN_DUPLICATE_KEYS = ["grosvenor-westlands"];

// The one confirmed dead/shadowed record: propertyData["dg-west"] is
// permanently unreachable because SELLAM_PROPERTIES' sl-007 ("dg-west"
// slug) is checked first by findInventoryProperty() (Step 2 audit §C.2).
// Folded into the "template/placeholder" report bucket below along with
// every other never-migrated propertyData key.
const KNOWN_DEAD_KEYS = ["dg-west"];

// Brabus Villas' three unit prices are explicitly labeled by the source's
// own code comment as guessed estimates pending real developer figures —
// never confirmed pricing (see property-detail.js, "Brabus-Villas" priceRows
// comment). They must never be written as sale_price, however numeric they
// look, and must never be presented as confirmed.
const ESTIMATED_PRICE_KEYS = ["Brabus-Villas"];

// ============================================================================
// 3. Vocabulary (must match the deployed schema, including the Step 5A amendment)
// ============================================================================

const STATUS_VALUES = ["available", "under-offer", "sold", "let"];
const COLLECTION_VALUES = ["featured", "exclusive"];
const PROPERTY_TYPE_VALUES = [
  "apartment", "townhouse", "villa", "mansion", "bungalow", "penthouse",
  "land", "commercial", "office", "retail", "industrial"
];
const LETTING_VALUES = ["sale", "rent", "both"];
const FEATURES_VALUES = [
  "wifi", "pool", "gym", "backup-generator", "parking", "security",
  "garden", "restaurant", "spa", "lounge"
];
const UNIT_TYPE_VALUES = [
  "bedsitter", "studio", "mini-1-bedroom", "1-bedroom", "2-bedroom",
  "3-bedroom", "4-bedroom", "5-bedroom", "6-bedroom", "7-bedroom", "penthouse"
];
const CURRENCY_VALUES = ["KES", "USD"];

// ============================================================================
// 4. Transformation
// ============================================================================

function isFiniteNumber(value) {
  return typeof value === "number" && Number.isFinite(value);
}

function bumpPriceStat(priceStats, status) {
  priceStats[status] = (priceStats[status] || 0) + 1;
}

// Exact re-implementation of data/property-units.js's unitsOf(): a property
// with a non-empty units[] uses it verbatim; otherwise its own flat
// bedrooms/bathrooms/salePrice/rentPrice fields are wrapped as the sole unit.
// This is what every consumer of SellamUnits already does with these same
// source records — reproduced here, not reinvented.
function unitsOfSellamProperty(p) {
  if (Array.isArray(p.units) && p.units.length) return p.units;
  return [{ bedrooms: p.bedrooms, bathrooms: p.bathrooms, salePrice: p.salePrice, rentPrice: p.rentPrice }];
}

function splitDescription(raw) {
  if (typeof raw === "string" && raw.trim()) return { title: null, body: raw };
  if (raw && typeof raw === "object" && typeof raw.body === "string" && raw.body.trim()) {
    const title = typeof raw.title === "string" && raw.title.trim() ? raw.title : null;
    return { title, body: raw.body };
  }
  // Deliberately null, not "" — an unrecognised/empty description shape must
  // fail the NOT NULL validation below rather than silently pass as content.
  return { title: null, body: null };
}

// Canonical SELLAM_PROPERTIES units are always KES — confirmed for all 42
// records (PROPERTY-GUIDE.md, and no currency marker ever appears in this
// dataset's prices). Every one of these units already has a real, confirmed
// number in source, so it always counts as "confirmed" for the price-status
// report.
function sellamUnitToRow(u, displayOrder, warnings, context, priceStats) {
  const salePrice = u.salePrice === null || u.salePrice === undefined ? null : u.salePrice;
  const rentPrice = u.rentPrice === null || u.rentPrice === undefined ? null : u.rentPrice;
  if (salePrice !== null && !isFiniteNumber(salePrice)) {
    warnings.push(`${context}: unit ${displayOrder} salePrice is not numeric (${JSON.stringify(salePrice)}) — left null, not coerced to 0`);
  }
  if (rentPrice !== null && !isFiniteNumber(rentPrice)) {
    warnings.push(`${context}: unit ${displayOrder} rentPrice is not numeric (${JSON.stringify(rentPrice)}) — left null, not coerced to 0`);
  }
  const finalSale = isFiniteNumber(salePrice) ? salePrice : null;
  const finalRent = isFiniteNumber(rentPrice) ? rentPrice : null;
  bumpPriceStat(priceStats, finalSale !== null || finalRent !== null ? "confirmed" : "missing");
  return {
    display_order: displayOrder,
    unit_type: typeof u.unitType === "string" ? u.unitType : null,
    bedrooms: isFiniteNumber(u.bedrooms) ? u.bedrooms : null,
    bathrooms: isFiniteNumber(u.bathrooms) ? u.bathrooms : null,
    sale_price: finalSale,
    rent_price: finalRent,
    currency: "KES",
    residence_label: typeof u.residenceLabel === "string" ? u.residenceLabel : null,
    area: typeof u.area === "string" ? u.area : null,
    note: typeof u.note === "string" ? u.note : null
  };
}

function transformSellamProperty(p, warnings, priceStats) {
  const desc = splitDescription(p.description);
  const property = {
    legacy_id: typeof p.id === "string" ? p.id : null,
    slug: typeof p.slug === "string" ? p.slug : null,
    status: typeof p.status === "string" ? p.status : null,
    collection: typeof p.collection === "string" ? p.collection : null,
    title: typeof p.title === "string" ? p.title.trim() : null,
    summary: typeof p.summary === "string" && p.summary.trim() ? p.summary : null,
    property_type: typeof p.propertyType === "string" ? p.propertyType : null,
    community: typeof p.community === "string" ? p.community : null,
    location: typeof p.location === "string" ? p.location : null,
    letting: typeof p.letting === "string" ? p.letting : null,
    features: Array.isArray(p.features) ? p.features.slice() : [],
    image: typeof p.image === "string" ? p.image : null,
    hero_image: typeof p.heroImage === "string" ? p.heroImage : null,
    gallery: Array.isArray(p.gallery) ? p.gallery.slice() : [],
    description_title: desc.title,
    description_body: desc.body,
    feature_location: typeof p.featureLocation === "string" ? p.featureLocation : null,
    story: p.story ?? null,
    feature_highlights: p.featureHighlights ?? null,
    closing_paragraphs: typeof p.closingParagraphs === "string" ? p.closingParagraphs : null,
    payment_plan: p.paymentPlan ?? null,
    lease_pricing: p.leasePricing ?? null,
    listed_date: typeof p.listedDate === "string" ? p.listedDate : null
  };

  const context = `properties.js:${p.id || p.slug || "?"}`;
  const units = unitsOfSellamProperty(p).map((u, i) => sellamUnitToRow(u, i, warnings, context, priceStats));

  return { source: "data/properties.js", sourceKey: p.id || p.slug, property, units, international: false };
}

// Parses a legacy priceRows "bedrooms" label ("Studio", "1 Bedroom", ...)
// into { unitType, bedrooms }, using only the known, deterministic
// vocabulary — never a guess. Unrecognised labels return nulls.
function parseLegacyUnitLabel(label) {
  if (typeof label !== "string") return { unitType: null, bedrooms: null };
  const trimmed = label.trim().toLowerCase();
  if (trimmed === "studio") return { unitType: "studio", bedrooms: 0 };
  if (trimmed === "bedsitter") return { unitType: "bedsitter", bedrooms: 0 };
  if (trimmed === "penthouse") return { unitType: "penthouse", bedrooms: null };
  const match = /^(\d+)\s*bedroom/.exec(trimmed);
  if (match) {
    const n = Number(match[1]);
    if (n >= 1 && n <= 5) return { unitType: `${n}-bedroom`, bedrooms: n };
  }
  return { unitType: null, bedrooms: null };
}

// Extracts a confirmed numeric USD price already explicit in the source
// string ("USD 703,500", "From USD 420,000"). This is a mechanical
// extraction of digits already present in the text, not an invention, and
// is safe to store now that property_units.currency (added in the Step 5A
// schema amendment) disambiguates it from KES. Returns null for
// "Price on Application" or any string that doesn't match this pattern —
// never a guess, never 0.
function parseUsdConfirmedPrice(raw) {
  if (typeof raw !== "string") return null;
  if (/price on application/i.test(raw)) return null;
  const match = /USD\s*([\d,]+)/i.exec(raw);
  if (!match) return null;
  const n = Number(match[1].replace(/,/g, ""));
  return isFiniteNumber(n) && n > 0 ? n : null;
}

function transformLegacyProperty(key, entry, warnings, priceStats) {
  const missing = [];
  const desc = splitDescription(entry.description);
  if (desc.body === null) missing.push("description");

  const image = typeof entry.hero === "string" ? entry.hero : null;
  if (!image) missing.push("image (no `hero` field in source)");

  const gallery = Array.isArray(entry.gallery)
    ? entry.gallery.map((g) => (g && typeof g === "object" ? g.src : g)).filter((src) => typeof src === "string")
    : [];

  const featureLocation = typeof entry.featureLocation === "string" ? entry.featureLocation : null;
  if (!featureLocation) missing.push("feature_location");

  const title = typeof entry.title === "string" ? entry.title.trim() : null;
  if (!title) missing.push("title");

  const location = typeof entry.location === "string" ? entry.location : null;
  if (!location) missing.push("location");

  // collection / property_type / letting / community are DELIBERATELY left
  // null and are NOT reported as missing: the Step 5A schema amendment made
  // all four nullable specifically so genuine international properties like
  // this one can exist without inventing values for concepts (Kenyan
  // community, featured/exclusive collection, sale/rent/both letting) that
  // simply don't apply to them. validateCandidate() treats these as
  // optional only when candidate.international is true.

  const property = {
    legacy_id: key,
    slug: key,
    // status is deliberately OMITTED (not set to null) so the database's
    // NOT NULL DEFAULT 'available' applies. A column default only takes
    // effect when the column is absent from the insert payload — sending an
    // explicit `null` on a NOT NULL column has no fallback and is rejected
    // (23502), which is exactly what happened on the first --commit attempt
    // for these four records. properties.status was deliberately NOT made
    // nullable, so this must stay an omission, not a null value.
    collection: null,
    title,
    summary: null,
    property_type: null,
    community: null,
    location,
    letting: null,
    features: [],
    image,
    hero_image: null,
    gallery,
    description_title: desc.title,
    description_body: desc.body,
    feature_location: featureLocation,
    story: null,
    feature_highlights: entry.featureHighlights ?? null,
    closing_paragraphs: null,
    payment_plan: entry.paymentPlan ?? null,
    lease_pricing: null,
    listed_date: null
  };

  const isEstimatedProperty = ESTIMATED_PRICE_KEYS.includes(key);
  const priceRows = Array.isArray(entry.priceRows) ? entry.priceRows : [];
  const units = priceRows.map((row, i) => {
    const { unitType, bedrooms } = parseLegacyUnitLabel(row.bedrooms);
    if (!unitType) {
      warnings.push(`propertyData.${key}: unit ${i} label ${JSON.stringify(row.bedrooms)} does not match the known unit_type vocabulary — left null`);
    }

    let salePrice = null;
    let status;
    if (isEstimatedProperty) {
      status = "estimated-withheld";
      warnings.push(`propertyData.${key}: unit ${i} price (${JSON.stringify(row.price)}) is source-labeled as an estimate pending real developer figures — recorded as null, never presented as confirmed pricing; disclaimer preserved verbatim in note (${JSON.stringify(row.note ?? null)})`);
    } else if (typeof row.price === "string" && /price on application/i.test(row.price)) {
      status = "application";
    } else {
      salePrice = parseUsdConfirmedPrice(row.price);
      if (salePrice === null) {
        status = "application";
        warnings.push(`propertyData.${key}: unit ${i} price ${JSON.stringify(row.price)} did not match a confirmed-numeric USD pattern — recorded as null`);
      } else {
        status = "confirmed";
      }
    }
    bumpPriceStat(priceStats, status);

    return {
      display_order: i,
      unit_type: unitType,
      bedrooms,
      bathrooms: null,
      sale_price: salePrice,
      rent_price: null,
      // Every international candidate's source pricing context is USD, even
      // on rows where no number was given (e.g. "Price on Application") —
      // the currency is still known, only the amount isn't.
      currency: "USD",
      residence_label: null,
      area: null,
      note: typeof row.note === "string" ? row.note : null
    };
  });

  return {
    source: "property-detail.js propertyData",
    sourceKey: key,
    property,
    units,
    international: true,
    missingRequiredFields: missing
  };
}

// ============================================================================
// 5. Communities
// ============================================================================

function transformCommunity(c) {
  return {
    key: c.key,
    label: c.label,
    image: c.image,
    image_alt: c.imageAlt,
    description: c.description
  };
}

// ============================================================================
// 6. Validation (runs BEFORE any database write, in both modes)
// ============================================================================
// Standard (Kenyan) candidates must satisfy every required field. Genuine
// international candidates (candidate.international === true) are allowed
// NULL for community/collection/property_type/letting — everything else
// (identity fields, CHECK vocabularies, currency, price sanity, JSON
// validity) is enforced identically for both kinds.

const REQUIRED_ALWAYS = [
  "legacy_id", "slug", "title", "location", "image", "description_body"
];
const REQUIRED_STANDARD_ONLY = ["collection", "property_type", "community", "letting"];

function validateCandidate(candidate, communityKeys, seenLegacyIds, seenSlugs) {
  const errors = [];
  const p = candidate.property;

  const requiredFields = candidate.international ? REQUIRED_ALWAYS : REQUIRED_ALWAYS.concat(REQUIRED_STANDARD_ONLY);
  for (const field of requiredFields) {
    const value = p[field];
    if (value === null || value === undefined || value === "") {
      errors.push(`missing required field '${field}'`);
    }
  }

  if (p.legacy_id) {
    if (seenLegacyIds.has(p.legacy_id)) errors.push(`duplicate legacy_id '${p.legacy_id}'`);
    seenLegacyIds.add(p.legacy_id);
  }
  if (p.slug) {
    if (seenSlugs.has(p.slug)) errors.push(`duplicate slug '${p.slug}'`);
    seenSlugs.add(p.slug);
  }

  // status is omitted (undefined), not null, on international candidates —
  // see transformLegacyProperty() — so both must be treated as "no value
  // sent, DB default applies" here, not as an invalid value.
  if (p.status !== null && p.status !== undefined && !STATUS_VALUES.includes(p.status)) errors.push(`invalid status '${p.status}'`);
  if (p.collection !== null && !COLLECTION_VALUES.includes(p.collection)) errors.push(`invalid collection '${p.collection}'`);
  if (p.property_type !== null && !PROPERTY_TYPE_VALUES.includes(p.property_type)) errors.push(`invalid property_type '${p.property_type}'`);
  if (p.letting !== null && !LETTING_VALUES.includes(p.letting)) errors.push(`invalid letting '${p.letting}'`);
  if (p.community !== null && !communityKeys.has(p.community)) {
    errors.push(`community '${p.community}' does not exist in public.communities — STOP (not auto-created)`);
  }
  const badFeatures = (p.features || []).filter((f) => !FEATURES_VALUES.includes(f));
  if (badFeatures.length) errors.push(`features contain unrecognised value(s): ${badFeatures.join(", ")}`);

  for (const field of ["story", "feature_highlights", "payment_plan", "lease_pricing"]) {
    if (p[field] != null) {
      try {
        JSON.stringify(p[field]);
      } catch (_e) {
        errors.push(`'${field}' is not JSON-serialisable`);
      }
    }
  }

  const seenDisplayOrders = new Set();
  for (const u of candidate.units) {
    if (seenDisplayOrders.has(u.display_order)) errors.push(`duplicate unit display_order ${u.display_order}`);
    seenDisplayOrders.add(u.display_order);
    if (u.unit_type !== null && !UNIT_TYPE_VALUES.includes(u.unit_type)) errors.push(`unit ${u.display_order}: invalid unit_type '${u.unit_type}'`);
    if (u.sale_price !== null && !(isFiniteNumber(u.sale_price) && u.sale_price > 0)) errors.push(`unit ${u.display_order}: invalid sale_price`);
    if (u.rent_price !== null && !(isFiniteNumber(u.rent_price) && u.rent_price > 0)) errors.push(`unit ${u.display_order}: invalid rent_price`);
    if (u.currency === null || u.currency === undefined) {
      errors.push(`unit ${u.display_order}: missing currency`);
    } else if (!CURRENCY_VALUES.includes(u.currency)) {
      errors.push(`unit ${u.display_order}: invalid currency '${u.currency}'`);
    }
  }

  // Brabus Villas specifically must never end up with a numeric sale_price —
  // this is a hard invariant, not just a warning, given the source itself
  // disclaims these as unconfirmed estimates.
  if (ESTIMATED_PRICE_KEYS.includes(candidate.sourceKey)) {
    for (const u of candidate.units) {
      if (u.sale_price !== null) errors.push(`unit ${u.display_order}: Brabus Villas estimated price must remain null, found ${u.sale_price}`);
    }
  }

  return errors;
}

// ============================================================================
// 7. Load + build the candidate set
// ============================================================================

function buildCandidates() {
  const warnings = [];
  const priceStats = { confirmed: 0, application: 0, "estimated-withheld": 0, missing: 0 };

  const rawCommunities = loadWindowAssignedArray("data/communities.js", "SELLAM_COMMUNITIES");
  const rawProperties = loadWindowAssignedArray("data/properties.js", "SELLAM_PROPERTIES");
  const legacyData = loadLegacyPropertyData();

  const communities = rawCommunities.map(transformCommunity);

  const sellamCandidates = rawProperties.map((p) => transformSellamProperty(p, warnings, priceStats));

  const legacyKeysPresent = Object.keys(legacyData);
  const excludedTemplateKeys = legacyKeysPresent.filter(
    (k) => !LIVE_LEGACY_KEYS.some((l) => l.key === k) && !KNOWN_DUPLICATE_KEYS.includes(k)
  );
  const excludedDuplicateKeys = legacyKeysPresent.filter((k) => KNOWN_DUPLICATE_KEYS.includes(k));

  const legacyCandidates = LIVE_LEGACY_KEYS.map(({ key, reason }) => {
    if (!(key in legacyData)) {
      warnings.push(`LIVE_LEGACY_KEYS entry '${key}' not found in propertyData — nothing migrated for it`);
      return null;
    }
    const candidate = transformLegacyProperty(key, legacyData[key], warnings, priceStats);
    candidate.allowlistReason = reason;
    return candidate;
  }).filter(Boolean);

  return {
    communities,
    sellamCandidates,
    legacyCandidates,
    candidates: sellamCandidates.concat(legacyCandidates),
    excludedTemplateKeys,
    excludedDuplicateKeys,
    priceStats,
    warnings
  };
}

// ============================================================================
// 8. Report
// ============================================================================

function buildReport(built) {
  const communityKeys = new Set(built.communities.map((c) => c.key));
  const seenLegacyIds = new Set();
  const seenSlugs = new Set();

  const results = built.candidates.map((candidate) => {
    const errors = validateCandidate(candidate, communityKeys, seenLegacyIds, seenSlugs);
    return { candidate, errors };
  });

  const passed = results.filter((r) => r.errors.length === 0);
  const failed = results.filter((r) => r.errors.length > 0);
  const totalUnits = built.candidates.reduce((sum, c) => sum + c.units.length, 0);

  const kesUnits = built.candidates.reduce((sum, c) => sum + c.units.filter((u) => u.currency === "KES").length, 0);
  const usdUnits = built.candidates.reduce((sum, c) => sum + c.units.filter((u) => u.currency === "USD").length, 0);

  const sellamCount = built.sellamCandidates.length;
  const internationalCount = built.legacyCandidates.length;
  const totalCount = built.candidates.length;

  const countMatches =
    totalCount === EXPECTED_LIVE_COUNT &&
    sellamCount === EXPECTED_SELLAM_COUNT &&
    internationalCount === EXPECTED_INTERNATIONAL_COUNT;
  const readyToCommit = countMatches && failed.length === 0;

  return {
    results, passed, failed, totalUnits, kesUnits, usdUnits,
    sellamCount, internationalCount, totalCount,
    communityKeys, countMatches, readyToCommit
  };
}

function printReport(built, report) {
  const lines = [];
  lines.push("============================================================");
  lines.push("SELLAM PROPERTY MIGRATION — " + (COMMIT ? "COMMIT MODE" : "DRY RUN"));
  lines.push("============================================================");
  lines.push("");
  lines.push("CANONICAL PROPERTIES");
  lines.push(`  SELLAM_PROPERTIES: ${report.sellamCount}`);
  lines.push(`  International:      ${report.internationalCount}`);
  lines.push(`  Total:              ${report.totalCount}`);
  if (!report.countMatches) {
    lines.push(`  ⚠ DISCREPANCY: expected ${EXPECTED_SELLAM_COUNT} + ${EXPECTED_INTERNATIONAL_COUNT} = ${EXPECTED_LIVE_COUNT}.`);
  }
  lines.push("");
  lines.push("EXCLUDED");
  lines.push(`  Duplicate:             ${built.excludedDuplicateKeys.join(", ") || "none"}`);
  lines.push(`  Template/placeholder:  ${built.excludedTemplateKeys.length}`);
  lines.push("");
  lines.push("COMMUNITIES");
  lines.push(`  Found: ${built.communities.length}`);
  lines.push("");
  lines.push("UNITS");
  lines.push(`  Total: ${report.totalUnits}`);
  lines.push("");
  lines.push("CURRENCY");
  lines.push(`  KES units: ${report.kesUnits}`);
  lines.push(`  USD units: ${report.usdUnits}`);
  lines.push("");
  lines.push("PRICE STATUS");
  lines.push(`  Confirmed numeric prices:            ${built.priceStats.confirmed || 0}`);
  lines.push(`  Price on Application:                ${built.priceStats.application || 0}`);
  lines.push(`  Unconfirmed/estimated prices withheld: ${built.priceStats["estimated-withheld"] || 0}`);
  if (built.priceStats.missing) {
    lines.push(`  ⚠ Missing price with no recognised status: ${built.priceStats.missing}`);
  }
  lines.push("");
  lines.push("VALIDATION");
  lines.push(`  Passed: ${report.passed.length}`);
  lines.push(`  Failed: ${report.failed.length}`);
  if (report.failed.length) {
    for (const { candidate, errors } of report.failed) {
      lines.push(`    - ${candidate.source} :: ${candidate.sourceKey}`);
      for (const e of errors) lines.push(`        · ${e}`);
    }
  }
  lines.push("");
  if (built.warnings.length) {
    lines.push("WARNINGS");
    for (const w of built.warnings) lines.push(`  - ${w}`);
    lines.push("");
  }
  lines.push(`READY TO COMMIT: ${report.readyToCommit ? "YES" : "NO"}`);
  lines.push("============================================================");
  console.log(lines.join("\n"));
}

// ============================================================================
// 9. Commit (writes only when --commit AND validation passed)
// ============================================================================
// Idempotent upsert strategy:
//   - communities: PostgREST upsert on_conflict=key (real UNIQUE constraint)
//   - properties:  PostgREST upsert on_conflict=legacy_id (real UNIQUE constraint)
//   - property_units: the approved schema has NO unique constraint over
//     (property_id, display_order) — only a random-per-insert uuid PK — so a
//     native upsert has no conflict target to key off. To stay idempotent
//     WITHOUT ever deleting (required by these instructions), units are
//     synced by explicit read-then-write: existing rows for a property are
//     fetched and matched by display_order; a match is PATCHed, a new
//     display_order is POSTed, and any pre-existing row beyond the current
//     unit count is left untouched and reported as a warning, never removed.
//   This remains a script-level limitation, not a schema change — a future
//   migration adding UNIQUE(property_id, display_order) would allow a true
//   native upsert here, but that's out of scope for this step.

async function supabaseFetch(config, pathAndQuery, options) {
  const response = await fetch(`${config.url}${pathAndQuery}`, {
    ...options,
    headers: {
      apikey: config.key,
      Authorization: `Bearer ${config.key}`,
      "Content-Type": "application/json",
      ...options.headers
    }
  });
  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(`Supabase ${options.method || "GET"} ${pathAndQuery} failed: ${response.status} ${detail.slice(0, 500)}`);
  }
  const text = await response.text();
  return text ? JSON.parse(text) : null;
}

async function upsertCommunities(config, communities) {
  return supabaseFetch(config, "/rest/v1/communities?on_conflict=key", {
    method: "POST",
    headers: { Prefer: "resolution=merge-duplicates,return=representation" },
    body: JSON.stringify(communities)
  });
}

// PostgREST's bulk-insert endpoint requires every object in one POSTed
// array to have identical keys (it derives the column list from the first
// row and rejects the whole batch — error PGRST102 — if any row's shape
// differs). The 42 Kenyan records send an explicit `status`; the 4
// international records deliberately omit it so the column's
// `DEFAULT 'available'` applies (see transformLegacyProperty()) — those two
// shapes can't share one POST, so they're upserted as two separate,
// internally-homogeneous batches. A single combined GET afterward resolves
// every id by legacy_id — a SELECT filter isn't subject to this constraint.
async function upsertPropertiesBatch(config, properties) {
  if (!properties.length) return;
  await supabaseFetch(config, "/rest/v1/properties?on_conflict=legacy_id", {
    method: "POST",
    headers: { Prefer: "resolution=merge-duplicates,return=minimal" },
    body: JSON.stringify(properties)
  });
}

async function upsertProperties(config, properties) {
  const withStatus = properties.filter((p) => "status" in p);
  const withoutStatus = properties.filter((p) => !("status" in p));

  await upsertPropertiesBatch(config, withStatus);
  await upsertPropertiesBatch(config, withoutStatus);

  const ids = properties.map((p) => encodeURIComponent(p.legacy_id));
  return supabaseFetch(config, `/rest/v1/properties?legacy_id=in.(${ids.join(",")})&select=id,legacy_id`, {
    method: "GET"
  });
}

async function syncUnitsForProperty(config, propertyId, units, syncWarnings) {
  const existing = await supabaseFetch(
    config,
    `/rest/v1/property_units?property_id=eq.${propertyId}&select=id,display_order&order=display_order.asc`,
    { method: "GET" }
  );
  const existingByOrder = new Map(existing.map((row) => [row.display_order, row.id]));

  for (const unit of units) {
    const payload = { property_id: propertyId, ...unit };
    if (existingByOrder.has(unit.display_order)) {
      const id = existingByOrder.get(unit.display_order);
      await supabaseFetch(config, `/rest/v1/property_units?id=eq.${id}`, {
        method: "PATCH",
        headers: { Prefer: "return=minimal" },
        body: JSON.stringify(payload)
      });
      existingByOrder.delete(unit.display_order);
    } else {
      await supabaseFetch(config, "/rest/v1/property_units", {
        method: "POST",
        headers: { Prefer: "return=minimal" },
        body: JSON.stringify(payload)
      });
    }
  }

  if (existingByOrder.size) {
    syncWarnings.push(
      `property_id ${propertyId}: ${existingByOrder.size} existing unit row(s) beyond the current source unit count were left untouched (not deleted).`
    );
  }
}

async function commit(built, report) {
  const config = readSupabaseConfig();
  if (!config) {
    console.error("Cannot commit: SELLAM_SUPABASE_URL / SUPABASE_SECRET_KEY are not set (checked process.env and .env).");
    process.exitCode = 1;
    return;
  }

  console.log("Committing communities...");
  await upsertCommunities(config, built.communities);

  console.log("Committing properties...");
  const propertyIdRows = await upsertProperties(config, report.passed.map((r) => r.candidate.property));
  const idByLegacyId = new Map(propertyIdRows.map((r) => [r.legacy_id, r.id]));

  const syncWarnings = [];
  console.log("Syncing property_units...");
  for (const { candidate } of report.passed) {
    const propertyId = idByLegacyId.get(candidate.property.legacy_id);
    if (!propertyId) {
      syncWarnings.push(`Could not resolve id for legacy_id '${candidate.property.legacy_id}' after upsert — units not synced.`);
      continue;
    }
    await syncUnitsForProperty(config, propertyId, candidate.units, syncWarnings);
  }

  console.log(`Done. Upserted ${built.communities.length} communities, ${report.passed.length} properties, and synced units for each.`);
  if (syncWarnings.length) {
    console.log("Warnings:");
    for (const w of syncWarnings) console.log(`  - ${w}`);
  }
}

// ============================================================================
// 10. Entry point
// ============================================================================

async function main() {
  const built = buildCandidates();
  const report = buildReport(built);
  printReport(built, report);

  if (!COMMIT) {
    return;
  }

  if (!report.readyToCommit) {
    console.error("\nAborting: validation did not pass (see VALIDATION/CANONICAL PROPERTIES above). No writes were made.");
    process.exitCode = 1;
    return;
  }

  await commit(built, report);
}

if (require.main === module) {
  main().catch((error) => {
    console.error("Migration script failed:", error.stack || error.message);
    process.exitCode = 1;
  });
}

module.exports = { buildCandidates, buildReport };
