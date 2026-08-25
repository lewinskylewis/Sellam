# Supabase Migration — Phase 1 Audit

**Status: audit only. No application code was changed to produce this document.**

This is the field/dependency map requested for Phase 1 of the JS→Supabase property
migration. It supersedes `PROPERTY-GUIDE.md` where the two disagree — that guide is a
good maintainer manual but has drifted from the code in a few places (noted below).
Treat *this* document as the ground truth for what the code actually does today.

---

## 1. The two data files

| File | Global | Shape | Role |
|---|---|---|---|
| `data/properties.js` | `window.SELLAM_PROPERTIES` | Array of property objects | The property inventory — **the migration target** |
| `data/communities.js` | `window.SELLAM_COMMUNITIES` | Array of community objects | Community reference data — properties link to it via `community` key |
| `data/property-units.js` | `window.SellamUnits` | Helper functions (no data) | Reads bedrooms/bathrooms/price off a property, abstracting flat fields vs. `units[]` — **every** consumer goes through this, not the raw fields |

`data/property-units.js` matters for the migration because it's the abstraction
boundary: any Supabase-backed replacement data layer only needs to reproduce this
module's *output* (`unitsOf`, `bedroomCounts`, `minPrice`, etc.), not the raw
flat-vs-units shape, and every downstream script keeps working unchanged.

---

## 2. Every property field actually in use (code-verified)

Extracted by scanning every record in `data/properties.js`, then tracing each field to
its reader(s). Fields marked **⚠ undocumented** exist in real records and are read by
live code, but are missing from `PROPERTY-GUIDE.md` entirely.

| Field | Type | Read by | Purpose |
|---|---|---|---|
| `id` | string | `property-detail.js` (`findInventoryProperty`), `enquiry-modal.js`, `script.js` (hero) | Stable key. Detail-page lookup, enquiry submission, hero carousel entry lookup. |
| `slug` | string | `property-detail.js` (`findInventoryProperty`), `enquiry-modal.js` | Alternate detail-page lookup key (`?id=<slug>` also matches this). |
| `status` | string | `listings.js` (`selectProperties`) | `"sold"`/`"let"` excludes from **listing grids only**. See §4 gap. |
| `collection` | string | `listings.js` (`selectProperties`, `cardHTML`), `enquiry-modal.js` (`categoryFromReferrer`) | `"exclusive"` routes to the Exclusive page and out of the Buy/Premium page; also used to pick the enquiry category label. |
| `title` | string | `listings.js`, `property-search.js`, `property-detail.js`, `script.js` (hero), `enquiry-modal.js` | Card heading, detail-page `<title>`/heading, hero copy, enquiry lookup-by-title fallback. |
| `summary` | string | `listings.js` (`cardHTML`, falls back to `description` if absent) | Listing-card blurb only. |
| `propertyType` | string | `listings.js` (buy-category/leasing filtering, card `data-property-type`), `property-search.js` (`types` filter, `metaLine`), `property-detail.js` (`isLandProperty`, `COMMERCIAL_TYPES` check for story wording + enquiry heading) | Filtering key everywhere; also branches detail-page copy tone (residential vs. commercial). |
| `community` | string | `listings.js` (`data-community` sectioning), `property-search.js` (`communities` filter), `community-render.js` (cross-check warning) | Must match a `key` in `data/communities.js` — checked at runtime, warns on mismatch (console only, doesn't block render). |
| `location` | string | `listings.js`, `property-search.js`, `property-detail.js` (`heroAlt`, `location || "Nairobi"` fallback in story copy), `script.js` (hero meta line, `district` = text before first comma) | Free text; `script.js` additionally parses it (`split(",")[0]`) to get a "district" for the hero meta line. |
| `letting` | string | `listings.js` (mode matching — sale/rent/leasing/buy-category), `property-search.js` (`letting` filter, `"both"` satisfies either), `property-detail.js` (enquiry heading text), `enquiry-modal.js` (category label) | **Not optional in practice** — a record missing this is silently excluded from every listing page (confirmed live bug on `sl-029`, see §4). |
| `salePrice` / `rentPrice` | number \| null | Everything, via `data/property-units.js` (`unitsOf` wraps flat fields into a one-item list) | Never read raw except inside `unitsOf()` itself. |
| `bedrooms` / `bathrooms` | number \| null | Same — via `unitsOf()` | Same. |
| `units` | array | `data/property-units.js` (`unitsOf`, all the count/price helpers), `property-detail.js` (`buildPriceRows`) | See §3 for the sub-fields inside each unit entry. |
| `features` | array of strings | `property-search.js` (`features` filter — property must have ALL selected) | Not shown on cards or detail page in the current code — filter-only. |
| `image` | string | `listings.js` (card thumbnail), `property-detail.js` (`inventoryToLegacyShape`: hero fallback `heroImage \|\| image`, and gallery fallback `[image]` if `gallery` is empty) | |
| `heroImage` ⚠ **undocumented** | string, optional | `property-detail.js` line 876 | Dedicated detail-page hero banner, distinct from the card thumbnail (`image`). Falls back to `image` when absent. |
| `gallery` | array of strings | `property-detail.js` (carousel, 4 story-section images, wide image, image pair — see `PROPERTY-GUIDE.md` §2.4 for the exact 8 slot roles, still accurate) | |
| `url` | string | `listings.js` (card link + enquiry `data-property-url`), `property-search.js` (result card link), `enquiry-modal.js` (fallback `property?.url`) | Must equal `slug` — no `property.html?id=` prefix (see `vercel.json` rewrite). |
| `description` | string \| `{title, body}` | `property-detail.js` (`renderDescription`), `listings.js` (`cardHTML`, only if `summary` is absent) | Long-form. Two shapes accepted: plain string, or `{title, body}` for a bold inline lead-in — `renderDescription()` handles both. |
| `featureLocation` | string | `property-detail.js` (`renderFeatureHighlights`, overrides item 0 of the default/bespoke highlight list) | |
| `story` | `{rows: [{title, body}]}`, optional | `property-detail.js` (`inventoryToLegacyShape` → `storyText`, consumed by `buildStoryContent`) | 0–4 rows; unset rows fall back to auto-generated text. Images always come from `gallery[1..4]`, never from `story` itself. |
| `listedDate` | ISO date string | *(not found in any reader — see §4)* | Documented as driving "newest first" sorting; **no sort-by-date code exists anywhere in the current scripts.** Likely aspirational/for a future feature. |
| `project` | string, optional | *(not found in any reader — see §4)* | Documented in `PROPERTY-GUIDE.md` §2.5 as a grouping label; no current code reads it. Also: **no record currently in `data/properties.js` sets it.** |
| `featureHighlights` ⚠ **undocumented** | array of `{title, text}`, optional | `property-detail.js` (`renderFeatureHighlights`) | Overrides the entire default 5-item highlight grid on the detail page (`DEFAULT_FEATURE_HIGHLIGHTS`). |
| `closingParagraphs` ⚠ **undocumented** | string, optional | `property-detail.js` (`renderClosingParagraphs`) | Optional 1–3 paragraph section between the features banner and the enquiry form; section stays `hidden` entirely when absent. |
| `paymentPlan` ⚠ **undocumented** | array of `{percent, label}`, optional | `property-detail.js` (`renderPaymentPlan`) | Off-plan payment schedule breakdown; section hidden when absent. |
| `leasePricing` ⚠ **undocumented** | object, optional | `property-detail.js` (`renderLeasePricing`) | Per-sq-ft commercial leasing rate breakdown (zones, service charge, parking); section hidden when absent. Shape: `{saleAndLeaseAvailable, space, zones[], notes}` (inferred from reader — see file for exact sub-fields, lines 986–1054). |

### 2.1 — `units[]` entry sub-fields (all optional except `bedrooms`/`bathrooms`/`salePrice`/`rentPrice`)

| Field | Read by | Purpose |
|---|---|---|
| `bedrooms`, `bathrooms`, `salePrice`, `rentPrice` | `data/property-units.js` (every helper) | Core per-floor-plan values. |
| `unitType` | `data/property-units.js` (`unitLabel`, via `UNIT_TYPE_LABELS`) | Named label (Bedsitter/Studio/Mini 1 Bedroom/...) distinguishing units that share a `bedrooms` count. |
| `residenceLabel` ⚠ **undocumented in guide (only in code comments)** | `property-detail.js` (`buildPriceRows` — takes priority over `unitType`/bedroom-count wording) | Detail-page-only override for numbered/named individual residences (e.g. `"Villa 1"`) or land parcels (e.g. `"1.2 Acres"`). **Deliberately not read by `property-units.js`**, so listing cards still show the generic bedroom count/label — only the detail-page price table shows the custom label. |
| `area` ⚠ | `property-detail.js` (`buildPriceRows`) | Free-text floor/plot area shown in the price table (e.g. `"376 SQM"`). |
| `note` ⚠ | `property-detail.js` (`buildPriceRows`) | Free-text note shown in the price table (e.g. `"Fully Furnished"`). |

---

## 3. File → Function → Field(s) → Purpose map

### `listings.js` — renders every listing grid (Rent, Buy/Premium, Exclusive, 4 Leasing pages, 4 Buy-category pages, 3 sections per community page = **35 HTML pages** load this)

| Function | Fields read | Purpose |
|---|---|---|
| `selectProperties(config)` | `status`, `community`, `propertyType`, `letting`, `collection` | Filters the inventory per container mode (`rent`/`sale`/`exclusive`/`leasing`/`buy-category`) + optional `data-community`/`data-exclude-types` |
| `cardHTML(p, index, config)` | `title`, `location`, `url`, `slug`, `id`, `image`, `summary` (falls back to `description`) | Builds one card's HTML, plus `data-*` attributes consumed by `rent-filter.js` |
| `bedroomsHTML(p)` | via `SellamUnits.unitLabels`/`bedroomCounts` | Card's bedroom-count line |
| `priceHTML(p, mode)` | via `SellamUnits.minPrice`/`unitsOf` | Card's price line ("Starting" prefix for multi-unit) |

⚠ **Undocumented mode**: `buy-category` (matches `data-buy-types` against `propertyType`, requires `letting` sale/both, excludes `collection: "exclusive"`) — powers `buy-commercial.html`, `buy-land.html`, `buy-residential.html`. `PROPERTY-GUIDE.md` §6.2 only documents `rent`/`sale`/`exclusive`/`leasing`.

⚠ **Undocumented attributes**: `data-community`, `data-exclude-types`, `data-hide-empty-section`, `data-community-empty` — power the 22 `communities/*.html` pages (each with up to 3 independent listing sections stacked on one page). Not mentioned anywhere in the guide.

### `property-search.js` — homepage search bar (`window.SellamSearch`)

| Function | Fields read | Purpose |
|---|---|---|
| `filter(criteria, list)` | `propertyType`, `community`, `features`, `letting` (via `SellamUnits` for bedrooms/bathrooms/price) | ⚠ **Does not check `status`** — a `"sold"`/`"let"` property is filterable via homepage search even though it's excluded from every listing grid. Real behavioral inconsistency, not something to "fix" in Phase 1, just note it. |
| `cardHTML(p)` | `url`, `image`, `title`, `location` | Search-result card |
| `priceLine`, `metaLine` | via `SellamUnits` + `propertyType` | Result card price/meta text |

Also called directly by `script.js`'s homepage hero carousel via `resolveHeroProperty()` (in `script.js`, not this file) — reads `title`, `url`, `location`, `letting`, plus `SellamUnits.minPrice`/`unitLabels` off the record matching a hand-authored `id`.

### `property-detail.js` — the single template renderer for every property's own page (`property.html`, plus `api/property.js`'s server-side jsdom re-execution of the same script for the clean-URL SSR path)

This is the field-hungriest consumer — see §2 above for the full table; every
documented and undocumented field except `status`/`collection`/`community`/`features`
flows through here via `inventoryToLegacyShape()` (property-detail.js:856), which
adapts an inventory record into the shape the (pre-migration) render functions expect.

Key functions: `findInventoryProperty` (by `id` or `slug`) → `inventoryToLegacyShape`
→ `buildPriceRows` (bed/bath/price table, one row per unit per price) →
`setupPropertyContent` / `buildStoryContent` / `renderFeatureHighlights` /
`renderClosingParagraphs` / `renderPaymentPlan` / `renderLeasePricing` (each paints
one section of the page, each independently optional/hide-when-absent).

A **separate, fully hardcoded fallback dataset** (`propertyData`, defined inline at
the top of this same file, ~700 lines) still exists for a handful of legacy
"diaspora" template properties that were never migrated into `data/properties.js`
(e.g. `dg-west`, `grosvenor-westlands`, `dg-jkia`, `crespoint-towers`, plus several
international listings with their own `featureHighlights`/`paymentPlan` already in
this shape). `getProperty()` only falls back to this map when no match is found in
`window.SELLAM_PROPERTIES` — **this is a second property data source the Supabase
migration needs to decide about** (migrate it in, or leave it as a permanent
non-Supabase fallback). See §4.

Also references `window.SELLAM_PROPERTY_PAGE` as a second-priority fallback before
`propertyData` — **dead code**: nothing in the current codebase ever sets this
global. Confirmed via repo-wide search.

### `community-render.js` — homepage community checklist + carousel, reads `data/communities.js`

Also performs the only cross-file integrity check in the system: on every page that
loads both data files, it warns to `console.warn` (does not block anything) if any
property's `community` doesn't match a known community `key`.

### `rent-filter.js` / `enquiry-modal.js` — do not read the data files directly

Both read `data-*` attributes already stamped onto the DOM by `listings.js`
(bedrooms/bathrooms/price as comma-separated lists for multi-unit support) —
**except** `enquiry-modal.js` has one direct fallback path: `resolveProperty()`
(enquiry-modal.js:70-76) searches `window.SELLAM_PROPERTIES` by `id`/`slug`/`title`
when the DOM doesn't already carry the needed `data-property-*` attributes (this is
the path used on `property.html` itself, where there's no listing card to read from).

### `script.js` — homepage only

`heroProperties` (hand-authored array of `{id, sections: [{label, image}]}`) +
`resolveHeroProperty()` join hand-picked hero image sections to the live inventory
record matching each `id`, reading `title`, `url`, `location`, `letting`, and
(via `SellamUnits`) bedroom labels + minimum price. This is a **third, small,
hand-maintained property reference** (currently 6 entries) — not part of
`data/properties.js` itself, but tightly coupled to it via `id` lookup.

### `api/enquiry.js` — does not read property data at all

Receives already-extracted `property_id`/`property_title`/`property_url`/
`listing_category` strings from the client (built by `enquiry-modal.js`), validates
and stores them. No dependency on `data/properties.js` shape.

### `api/property.js` — no independent field reads

Purely re-executes `property-detail.js` (and its dependencies) inside a server-side
jsdom instance for SSR of the clean-URL property route. Everything it does is
covered by the `property-detail.js` row above.

---

## 4. Discrepancies found vs. `PROPERTY-GUIDE.md` (verify before Phase 2 schema design)

1. **`letting` is documented as "✅ Required" but the code doesn't enforce it, and a
   real record is currently missing it** (`sl-029`, Ostrea Villas) — silently
   excluded from every listing grid (`listings.js`) because `undefined` never equals
   `"sale"`/`"rent"`/`"both"`. Confirms this field needs a NOT NULL constraint (or an
   equivalent validation step) in the Supabase schema, since the JS layer has none.
2. **Five real, live fields are completely undocumented**: `heroImage`,
   `featureHighlights`, `closingParagraphs`, `paymentPlan`, `leasePricing` — all
   optional, all detail-page-only, all with clean "hide section if absent" behavior
   in the code. These need schema columns.
3. **Three `units[]` sub-fields are undocumented**: `residenceLabel`, `area`, `note`
   — detail-page price-table-only, deliberately invisible to listing cards.
4. **`listedDate` and `project` are documented but appear to be dead** — no current
   script reads either. Worth confirming with whoever wrote the guide before
   deciding whether to carry them into the schema as real columns or drop them.
5. **`buy-category` listing mode and the community-page-specific attributes
   (`data-community`, `data-exclude-types`, `data-hide-empty-section`,
   `data-community-empty`) are entirely missing from the guide's §6.2 mode table.**
6. **The guide's §6.4 "legacy standalone `properties/*.html` pages" no longer
   exist** — `properties/` is an empty directory. That migration is already done;
   the guide just wasn't updated.
7. **`property-search.js`'s `filter()` does not check `status`** — inconsistent with
   `listings.js`, which excludes `sold`/`let` everywhere. A sold property can still
   surface via homepage search. Not a migration blocker, just a real inconsistency
   to be aware of (the Supabase-backed replacement should probably decide
   deliberately whether to preserve or fix this quirk, not carry it forward by
   accident).
8. **A second, fully separate hardcoded property dataset exists**
   (`propertyData` inside `property-detail.js`) for legacy pages never migrated into
   `data/properties.js`. This isn't mentioned in the guide's file map at all. Phase
   2 needs an explicit decision: migrate these too, or leave this fallback
   permanently outside Supabase.
9. **`window.SELLAM_PROPERTY_PAGE` fallback in `property-detail.js` is dead code** —
   nothing sets it. Not a migration concern, just noted so it isn't mistaken for a
   real data source later.

---

## 5. Full consumer file list (for reference)

**Reads `data/properties.js` directly:** `script.js`, `property-detail.js`,
`listings.js`, `property-search.js`, `community-render.js` (cross-check only),
`enquiry-modal.js` (fallback lookup only).

**HTML pages that load `data/properties.js`** (35 total): `index.html`,
`rent.html`, `premium-properties.html`, `exclusive-properties.html`,
`buy-commercial.html`, `buy-land.html`, `buy-residential.html`,
`leasing-offices.html`, `leasing-retail.html`, `leasing-industrial.html`,
`leasing-land.html`, `templates/property.html` (the shared detail-page template,
reached via `property.html?id=<slug>` and the `/<slug>` clean-URL rewrite in
`vercel.json` → `api/property.js`), and all 22 `communities/*.html` pages.

**Reads `data/communities.js` directly:** `community-render.js`.

**Reads `data/property-units.js`'s exported helpers:** `listings.js`,
`property-search.js`, `property-detail.js`, `script.js`.

---

## 6. Not part of this phase (flagged only, not acted on)

Also discovered during this audit, separate from the field/dependency map itself:
- `sl-029` (Ostrea Villas) missing `letting` — see finding #1 above. Live bug, not
  caused by anything in this audit.
- A pending, uncommitted diff to `data/properties.js` (predates this session) has
  content mix-ups on 2 of ~5 new listings (`Belgravia Place`/`Paradise Haven
  Residence` share copy-pasted `description`/`story` text). Unrelated to the
  Supabase migration; flagged separately in conversation.

Neither is fixed here — Phase 1 is audit-only, per the instructions for this task.
