# Supabase Migration — Phase 1, Step 2: Data Model & Schema Design

**Status: design only. No tables created, no SQL executed, no data migrated, no
application code modified to produce this report.** Every claim below is traced to
a specific file/line in the current codebase, not inferred from `PROPERTY-GUIDE.md`.

---

## A. `property-units.js` analysis

### A.1 — Input structures `SellamUnits` accepts

Exactly one entry point, `unitsOf(p)` (`data/property-units.js:27-35`), which normalizes
**any** property record into an array of unit objects:

```js
function unitsOf(p) {
  if (Array.isArray(p.units) && p.units.length) return p.units;
  return [{ bedrooms: p.bedrooms, bathrooms: p.bathrooms, salePrice: p.salePrice, rentPrice: p.rentPrice }];
}
```

Every other helper (`bedroomCounts`, `bathroomCounts`, `unitLabels`, `prices`,
`minPrice`, `maxPrice`, `anyPriceInRange`) calls `unitsOf()` first, then operates on
the resulting array. **This means the real data model, as the application already
treats it, is "a property always has one or more units" — the flat
`bedrooms`/`bathrooms`/`salePrice`/`rentPrice` fields are not a separate concept
from `units[]`, they're just sugar for the single-unit case.** This is the single
most important fact for schema design: there is no meaningful distinction between
"a property with units" and "a property without units" at the data-model level,
only at the JS-authoring-convenience level.

### A.2 — How it determines each derived value

| Derived value | How | Fields touched |
|---|---|---|
| Bedroom counts (search/filter) | `bedroomCounts()` → distinct, sorted `unit.bedrooms` across all units | `bedrooms` |
| Bathroom counts (search/filter) | `bathroomCounts()` → same, `unit.bathrooms` | `bathrooms` |
| Sale/rent price (cheapest, for cards) | `minPrice(p, field)` → `Math.min` over all units' `field` | `salePrice` or `rentPrice` |
| Sale/rent price (range, for search) | `maxPrice()` / `anyPriceInRange()` | same |
| Unit label (e.g. "2 Bedroom", "Studio") | `unitLabel(u)` → `unit.unitType` looked up in a fixed 9-entry map, else falls back to `"N Bedroom(s)"` from `unit.bedrooms`, else `""` | `unitType`, `bedrooms` |
| All distinct labels a property offers | `unitLabels(p)` → dedup, order-preserving over `unitsOf(p).map(unitLabel)` | `unitType`, `bedrooms` |
| Natural-language join ("1, 2 & 3") | `joinList()` — pure string formatting, no field reads | — |

`area`, `note`, and `residenceLabel` are **not read anywhere inside
`property-units.js`** — confirmed by grep, zero matches for any of the three in that
file. They are read exclusively by `property-detail.js`'s `buildPriceRows()`
(lines 821-845), which walks `unitsOf(p)` itself and then reads those three fields
directly off each raw unit object, bypassing the `SellamUnits` API entirely. This is
a real architectural seam: `property-units.js` only knows about the fields needed
for **search/filter/counts**; `property-detail.js` separately knows about the fields
needed for the **price table display**. A future data layer needs to preserve both
consumers' access to the full unit shape, not just what `SellamUnits` itself reads.

### A.3 — Flat vs. `units[]` vs. both vs. neither

Sampled every record in `data/properties.js` containing a `units:` array (Silva
Gigiri Residences, GTC Office Tower, The Mandrake, Grosvenor Residences, Ostrea
Villas, Naserian Homes, Ridgeways Ambassadorial Estate, Paradise Haven Residence,
Runda Mumwe Villa, Hephé Palace, and the 3 land parcels with `residenceLabel`
acreage): **in every one, the flat `bedrooms`/`bathrooms`/`salePrice`/`rentPrice`
fields are absent — never both present on the same record.** This matches what
`unitsOf()`'s code implies: if a record *did* set both, the flat fields would be
silently ignored (dead data), since `units.length` truthiness short-circuits before
the flat fields are ever read. No case of "both" was found; "neither" doesn't occur
either — every record has one shape or the other. This is good news for the schema:
the two shapes are cleanly disjoint in practice, not just in theory.

### A.4 — Does `units[]` represent independently marketable units, or presentation grouping?

**Independently marketable**, confirmed by the land-parcel and villa records:

```js
// Ridgeways-style development, 4 physically distinct villas, one listing page:
{ unitType: "4-bedroom", residenceLabel: "Villa 1", area: "376 SQM", salePrice: 140000000, ... },
{ unitType: "4-bedroom", residenceLabel: "Villa 2", area: "376 SQM", salePrice: 135000000, ... },
{ unitType: "4-bedroom", residenceLabel: "Villa 3", area: "377 SQM", salePrice: 150000000, ... },
{ unitType: "4-bedroom", residenceLabel: "Villa 4", area: "381 SQM", note: "Fully Furnished", salePrice: 165000000, ... }
```

These aren't 4 floor-plan *options* of one identical unit — they're 4 **different,
individually priced, individually sized physical residences** grouped under one
property page/URL. Same pattern for land: `{ residenceLabel: "1.2 Acres",
salePrice: 125000000 }` as the sole "unit" of a land listing — `residenceLabel` here
does double duty as the size descriptor since bedrooms/bathrooms don't apply.

### A.5 — Does the app expect multiple genuinely-different units per property?

Yes — confirmed above, and also expected structurally: nothing in `unitsOf()`,
`buildPriceRows()`, or the search/filter code caps `units.length` or assumes
uniformity across units. Different `bedrooms`, `bathrooms`, `salePrice`,
`rentPrice`, `area`, `residenceLabel`, and `note` per unit are all live, exercised
behaviors today, not hypothetical.

**One real gap found**: there is no unit-level `status`. If "Villa 3" above sells
while Villas 1/2/4 remain available, the current data model has no way to express
that — `status` (`available`/`under-offer`/`sold`/`let`) only exists at the
**property** level (`data/properties.js` schema; confirmed zero matches for a
`status` field inside any `units[]` entry anywhere in the file). This isn't
something to fix in this migration — the schema must represent what exists today —
but it's worth flagging as a known limitation the eventual admin dashboard will
likely want to close.

### A.6 — Every unit-entry field actually consumed (complete, verified)

| Field | Consumed by | Required? |
|---|---|---|
| `bedrooms` | `property-units.js` (all helpers), `property-detail.js` (`buildPriceRows`) | Effectively required (commercial/land units use `null` or omit, then `unitLabel` returns `""`/`buildPriceRows` shows `"—"`) |
| `bathrooms` | Same | Same |
| `salePrice` | Same | Optional — omit or `null` for rent-only units |
| `rentPrice` | Same | Optional — omit or `null` for sale-only units |
| `unitType` | `property-units.js` (`unitLabel`) | Optional — falls back to generic bedroom-count wording |
| `residenceLabel` | `property-detail.js` (`buildPriceRows` only — deliberately invisible to `property-units.js`/listing cards) | Optional |
| `area` | `property-detail.js` (`buildPriceRows` only) | Optional |
| `note` | `property-detail.js` (`buildPriceRows` only) | Optional |

No other unit-level fields exist anywhere in the current data.

---

## B. Unit storage recommendation

### The three options, evaluated against *this* app's actual usage (not generic advice)

**A — JSONB column on `properties`.** Fastest to migrate (paste the `units` array
almost verbatim), and matches the fact that the current app does 100% of its
filtering/search **in JavaScript, client-side** — there is zero SQL-level querying
of unit data today, so there's no existing query pattern JSONB would fail to serve.
Downside: the project's own code comments (`data/properties.js` header: *"this is
deliberate: it means the exact same shape could later come from a database/API
instead of a hardcoded file (for an admin dashboard)"*) explicitly anticipate an
admin dashboard. A dashboard that needs to list/edit/sort individual floor
plans/villas across properties — e.g. "show every 2-bedroom unit under KES 15M
regardless of which property it belongs to," or "mark Villa 3 as sold without
touching Villas 1/2/4" — is exactly the kind of query JSONB makes awkward: no
per-unit primary key to update, no foreign key for a future per-unit status/photo,
aggregate queries (MIN/MAX price across all units of all properties) need
`jsonb_array_elements()` gymnastics instead of a plain `GROUP BY`.

**B — Separate `property_units` table.** Gives every unit a real row: a stable id
to reference (future per-unit status, per-unit enquiry tracking, per-unit photos),
native `NOT NULL`/`CHECK` constraints instead of app-level validation, trivial
cross-property aggregate queries, and a natural home for the unit-level `status`
gap identified in A.5 if that's ever added. Downside: every read of a property now
needs a join (or a view) to reconstruct what today is one JS object; migration
requires flattening the array into rows with a `display_order` column to preserve
the array's original ordering (which `unitLabels()`/card rendering depend on —
order is meaningful, not incidental).

**C — Hybrid.** Not evaluated as a real third option here — for this project it's
effectively "B, plus a generated/materialized JSONB view for read convenience,"
which is B with extra moving parts and no benefit over B alone unless a specific
read-performance problem shows up later. Not recommended to design for pre-emptively.

### Recommendation: **B — separate `property_units` table**

This is chosen specifically because of finding A.4/A.5 (units are genuinely
independent marketable sub-assets, not presentational grouping) combined with the
codebase's own stated direction (admin dashboard) — not because "normalized tables
are generally better." If this project had no admin-dashboard ambition and units
were purely cosmetic groupings, JSONB would be the right call instead.

**Advantages for SELLAM specifically:**
- Matches reality: a "unit" here is often a real, distinct, individually-priced
  physical asset (a numbered villa, an acreage parcel) — modeling it as a row, not
  a blob entry, mirrors that.
- Sets up the exact admin-dashboard capability the existing code comments anticipate.
- Closes the door cleanly on the unit-level `status` gap (A.5) if/when it's wanted,
  without a schema migration at that point.
- Cross-property unit queries (search/filter, if the future data layer ever moves
  filtering server-side instead of client-side JS) become plain SQL.

**Disadvantages, honestly stated:**
- More moving parts for what is, in over half of current records, a single row per
  property (the flat-field case, per A.3) — some overhead for the common case.
- Requires a join or view for every property read, where JSONB would need none.
- Migration has to synthesize a stable `id` and `display_order` per unit that
  doesn't exist in the source JS at all (units are positional in an array today).

### Proposed `property_units` schema (see §J for the full column-level table)

One row per unit, one property has 1+ rows, `display_order` preserves the source
array's position (load-bearing for `unitLabels()`/card display order — see A.4).

---

## C. `propertyData` (inside `property-detail.js`) — full investigation

### C.1 — Record count

**30 records total**, in two blocks:
- **16** in the original object literal (lines 42–371): `dg-west`, `grosvenor-westlands`,
  `dg-jkia`, `crespoint-towers`, `seaview`, `grosvenor-ngong`, `dg-west-tower`,
  `grosvenor-karen`, `exclusive-dg-jkia`, `exclusive-crestpoint-karen`,
  `exclusive-dg-west`, `exclusive-aum-residence`, `exclusive-kileleshwa-heights`,
  `exclusive-crystal-oak`, `exclusive-moon-valley`, `exclusive-grosvenor`.
- **14** merged in via `Object.assign(propertyData, {...})` (lines 382–730): 10
  "diaspora template" placeholders (`revenance-residency`, `the-aurelian`,
  `sterling-heights`, `belmont-collection`, `hudson-grove`, `harbour-lane`,
  `regent-park-villas`, `berlin-reserve`, `maison-lumiere`, `riviera-house`) + 4
  labeled in the code's own comment as **"REAL LISTINGS"** (`ShomaBay`,
  `Brabus-Villas`, `Afra-Park`, `Indabyo-Heights` — international properties with
  real photography under `assets/images/International properties/`).

### C.2 — Overlap with `SELLAM_PROPERTIES`

Checked by title and by slug/key:

| Overlap type | Finding |
|---|---|
| **Exact slug collision** | Only **one**: `propertyData["dg-west"]` vs. `SELLAM_PROPERTIES` record `sl-007` (`slug: "dg-west"`, title "DG West", real KES pricing). Because `findInventoryProperty()` checks `SELLAM_PROPERTIES` first, **`propertyData["dg-west"]` is completely unreachable/shadowed** — dead data, permanently shadowed by the real record. |
| **Same title, different slug (both reachable at different URLs)** | `"Moon Valley"` — `propertyData["exclusive-moon-valley"]` ("Price on Application" placeholder) vs. `SELLAM_PROPERTIES` `sl-016` (`slug: "moon-valley-nyari"`, real KES 132,000,000 price). Two different URLs, same display name — a genuine content-confusion risk for editors, not for end users (only the real one is linked anywhere). |
| **Same brand name, different property entirely** | `"Grosvenor"` — `propertyData` has 4 variants (`grosvenor-westlands`, `grosvenor-ngong`, `grosvenor-karen`, `exclusive-grosvenor`, all USD-priced placeholders) vs. `SELLAM_PROPERTIES` `sl-017` (`slug: "grosvenor-residences"`, "Grosvenor Residences", KES-priced real units — and its `image`/`gallery` point at `assets/images/ENZO Residence (*).jpeg`, suggesting this record was itself repurposed from a different, older listing — a separate, pre-existing data-hygiene note, not part of this migration's scope). |
| **`"DG JKIA"`** | `propertyData["dg-jkia"]` (USD placeholder) vs. `SELLAM_PROPERTIES` `sl-008` (`slug: "dg-jkia-hotel-apartments"`, real listing). Different slugs, so no shadowing — both technically resolve, but only the real one is linked anywhere live. |

**No case of genuinely conflicting data for the *same* reachable record** — the one
true collision (`dg-west`) resolves cleanly to the real record with no ambiguity;
everything else is same-name-different-record, a naming/branding collision rather
than a data-integrity conflict.

### C.3 — Records that exist *only* in `propertyData`

All 30, by definition (none of `propertyData`'s keys except the shadowed `dg-west`
have a real counterpart in `SELLAM_PROPERTIES`) — but "only in propertyData" and
"actually reachable" are different questions, see C.4.

### C.4 — Reachability check (grepped every HTML page for a link to any of the 30 keys)

| Reachable how | Keys | Count |
|---|---|---|
| **Linked from a live page** (`index.html`'s homepage "diaspora-grid" carousel, explicitly commented in the source as the 4 real international listings) | `ShomaBay`, `Brabus-Villas`, `Afra-Park`, `Indabyo-Heights` | 4 |
| **Linked from a live page**, but pointing at the *legacy* dataset rather than the real inventory — homepage "Exclusive Properties" tile section (`index.html:481`), `<a href="grosvenor-westlands">` | `grosvenor-westlands` | 1 |
| **URL-guessable only** — no `<a href>` anywhere in any `.html` file points at these; reachable only if a visitor types the exact clean URL | The remaining 25 (16 original minus the shadowed `dg-west` minus `grosvenor-westlands` = 14, plus the 10 diaspora templates) | 25 |

So: **5 of 30 `propertyData` entries are live, clicked-from-real-pages content**
(4 genuine international listings + 1 orphaned "Grosvenor" homepage tile that
happens to resolve through the legacy fallback instead of the real inventory).
The other 25 are dead weight, reachable only by guessing a URL.

### C.5 — Which pages/functions consume `propertyData`

Only `property-detail.js`'s `getProperty()` (line 902-913), as the final fallback
after (1) `SELLAM_PROPERTIES` lookup fails and (2) the always-`undefined`
`window.SELLAM_PROPERTY_PAGE` global (dead code, see the Step 1 audit). Reached via
`property.html?id=<key>` or the clean-URL rewrite `/<key>` → `/api/property?id=<key>`
(same template, same route as every real property — there's no separate "legacy
page" anymore; `properties/*.html` is confirmed empty).

### C.6 — Legacy fallback, or additional live inventory?

**Both, split cleanly by record**: the 4 international "REAL LISTINGS" plus the
orphaned `grosvenor-westlands` tile (5 records) are genuine live inventory that
happens to be stored in the wrong place. The other 25 are exactly what the code's
own comments call them — legacy/placeholder fallback, safe to treat as such.

### C.7 — Conflicting information for the same property

None found for any *reachable* pair (see C.2) — the only exact collision
(`dg-west`) is fully shadowed, not simultaneously live in two places.

### Dataset comparison table

| Dataset | Record count | Live consumers | Overlap w/ other dataset | Unique + reachable records | Purpose |
|---|---|---|---|---|---|
| `data/properties.js` (`SELLAM_PROPERTIES`) | 42 (counted via `slug:` occurrences) | Every listing page, homepage search, homepage hero, detail pages, enquiry fallback | 1 shadowed collision (`dg-west`), 2 same-name-different-record cases (`Moon Valley`, `Grosvenor`) | 42 | The real, actively maintained catalogue — primary migration target |
| `propertyData` (`property-detail.js`) | 30 | `property-detail.js`'s `getProperty()` fallback only | See above | 5 (4 international + 1 orphaned homepage tile) | Mixed: 5 live records stranded in the wrong place, 25 dead legacy/template placeholders |

---

## D. Recommendation for handling both datasets

**Option C — merge/deduplicate, but narrowly**: migrate `SELLAM_PROPERTIES` in full
(42 records), **plus** the 5 reachable `propertyData` records (`ShomaBay`,
`Brabus-Villas`, `Afra-Park`, `Indabyo-Heights`, `grosvenor-westlands`) into the
same `properties` table. **Do not migrate** the other 25 `propertyData` entries —
they are unlinked, unreachable-except-by-guessing placeholder content with no real
photography or confirmed pricing (10 are explicitly labeled in their own
`description` text as *"a diaspora property template... ready for specific
property copy... to be refined later"*).

No records actually conflict (per C.7), so there's nothing to *resolve* — the 5
records to bring in are simply additive, not competing with anything already in
`SELLAM_PROPERTIES`.

### What's lost under each option, explicitly

| Option | What's lost |
|---|---|
| **A — migrate both datasets whole** | Nothing lost, but pollutes the new catalogue with 25 dead placeholder records that were never live, need a home in a schema built for real listings (fake `salePrice`? `null`? a `status: "template"` value nothing else uses?), and would need to be manually excluded from every future query anyway — trading a data problem for a schema problem. |
| **B — migrate only `SELLAM_PROPERTIES`, keep `propertyData` as permanent legacy** | Loses nothing *today*, but the 5 live records (4 international + `grosvenor-westlands`) stay permanently outside Supabase, meaning the eventual admin dashboard can never manage them without a second, parallel edit path — defeats the point of the migration for exactly the records most likely to need editing (international listings' pricing is explicitly noted as pending confirmation). |
| **C — migrate `SELLAM_PROPERTIES` + the 5 reachable `propertyData` records (recommended)** | Loses the 25 dead placeholders, which is the correct outcome — they were never real inventory, just unused template scaffolding. Nothing genuinely live is lost. |

**Recommendation: Option C**, scoped exactly as above. This is a decision for your
approval, not something to act on in this phase.

---

## E. (folded into D above, per the numbering in your request — no separate content)

---

## F. Complete property field inventory (source-code-verified, not guide-derived)

Legend for **Used by**: `L`=listings.js, `S`=property-search.js, `D`=property-detail.js,
`Sc`=script.js (hero), `C`=community-render.js, `E`=enquiry-modal.js.

| Field | JS name | Example / type | Required? | Used by | Purpose | Proposed Supabase representation |
|---|---|---|---|---|---|---|
| Stable key | `id` | `"sl-017"` string | Yes, de facto (lookup key) | D, E, Sc | Detail-page lookup, enquiry linkage, hero carousel join | Not the PK itself (see §G) — kept as a `text` column, `UNIQUE NOT NULL`, for backward-compatible lookups and any external reference (e.g. old enquiry records) that used it |
| URL slug | `slug` | `"the-oakwood-villa"` | Yes | D (lookup), L/S (indirectly, via `url`) | Clean-URL identity | `text`, `UNIQUE NOT NULL` — becomes the canonical identity; see §G |
| Listing state | `status` | `"available"` enum-ish string | **De facto yes, but not enforced in JS** (see Step 1 finding — `sl-029` shipped without it) | L (excludes sold/let), **not** S (gap, see Step 1 §4.7) | Controls visibility on every listing grid | `text NOT NULL DEFAULT 'available' CHECK (status IN ('available','under-offer','sold','let'))` — the DB should enforce what JS doesn't |
| Grouping | `collection` | `"featured"` \| `"exclusive"` | Yes | L, E | Routes to Buy/Premium page vs. Exclusive page | `text NOT NULL CHECK (collection IN ('featured','exclusive'))` |
| Display name | `title` | string | Yes | L, S, D, Sc, E | Everywhere | `text NOT NULL` |
| Card blurb | `summary` | short string | Yes (falls back to `description` if absent) | L | Listing-card text | `text`, nullable (app already has a fallback) |
| Type | `propertyType` | `"villa"` etc., fixed vocabulary | Yes | L, S, D | Filtering + detail-page copy tone | `text NOT NULL CHECK (property_type IN (...11 known values...))` |
| Community | `community` | key matching `communities.key` | Yes | L, S, C (cross-check) | Filtering, community pages | `text NOT NULL REFERENCES communities(key)` — turns the current console-warning-only check into a real FK constraint |
| Location text | `location` | free text | Yes | L, S, D, Sc | Display + `district` parsing (`Sc` splits on first comma) | `text NOT NULL` |
| Sale/rent mode | `letting` | `"sale"` \| `"rent"` \| `"both"` | **Documented required, NOT enforced — root cause of the `sl-029` bug** | L, S, D, E | Which listing pages a property appears on at all | `text NOT NULL CHECK (letting IN ('sale','rent','both'))` — no default; must be explicit, exactly to prevent a repeat of `sl-029` |
| Flat price/bed/bath | `salePrice`, `rentPrice`, `bedrooms`, `bathrooms` | number \| null | Conditional — only when no `units[]` (§A.3) | via `SellamUnits` everywhere | Single-floor-plan properties | **Not separate top-level columns** — represented as the property's sole row in `property_units` (see §B); keeps one representation for both shapes instead of two |
| Multi-unit | `units` | array (see §A) | Conditional — only when no flat fields | via `SellamUnits`, `property-detail.js` | Multi-floor-plan / multi-residence developments | `property_units` table, §J |
| Search facets | `features` | array of strings, fixed 7-value vocabulary | Yes (can be `[]`) | S only (not shown anywhere) | Homepage search "must have all" filter | `text[] NOT NULL DEFAULT '{}'` with a `CHECK` against the known 7 values, or a lookup table if the vocabulary is expected to grow |
| Card thumbnail | `image` | path string | Yes | L, D (hero fallback, gallery fallback) | Card image + fallback hero/gallery | `text NOT NULL` |
| Dedicated hero | `heroImage` | path string | Optional | D only | Detail-page banner distinct from card thumbnail | `text`, nullable |
| Photo set | `gallery` | array of path strings | Yes | D (8+ specific slot roles, see Step 1 §2.4 — unchanged) | Carousel, story images, wide/pair images | `text[] NOT NULL DEFAULT '{}'`, order-preserving (array, not a child table — order is load-bearing and there's no per-photo metadata beyond the path today) |
| Link target | `url` | string, should equal `slug` | Yes | L, S, E | Card/result links, enquiry fallback | **Not stored** — derive from `slug` at read time (see §G; a real live bug was found from these two drifting apart) |
| Long copy | `description` | string \| `{title, body}` | Yes | D, L (fallback for `summary`) | Detail-page intro | `text` for the plain-string case; the `{title, body}` shape needs either a `jsonb` column or two nullable columns (`description_title text`, `description_body text`) — recommend the two-column form, see §J rationale |
| Location blurb | `featureLocation` | one sentence | Yes | D (`renderFeatureHighlights`, overrides item 0) | Features banner | `text` |
| Narrative | `story` | `{rows: [{title,body}] up to 4}` | Optional | D (`buildStoryContent`) | 4 bespoke "area" sections, else auto-generated | `jsonb`, nullable — genuinely variable-shape (0-4 rows), no query need beyond "does it exist" |
| Sort field | `listedDate` | ISO date string | Documented required; **no reader found anywhere in current code** | — (dead) | Documented as driving "newest first" sort; no such sort exists today | Still worth a `date` column (cheap, obviously useful later, matches existing author habit of always setting it) — **flagging for your decision**, not defaulting to including it |
| Grouping label | `project` | string | Documented optional; **zero current records set it, zero readers found** | — (dead) | Documented as linking multi-record developments — superseded by `units[]` per §2.5 of the guide itself | **Recommend omitting** from the schema unless you have a concrete future use in mind — carrying a column with zero live readers and zero live data is pure risk for no benefit |
| Highlights grid | `featureHighlights` | array of `{title, text}` | Optional | D (`renderFeatureHighlights`, overrides the entire default 5-item grid) | Detail-page features banner content | `jsonb`, nullable |
| Closing note | `closingParagraphs` | string | Optional | D (`renderClosingParagraphs`) | Optional paragraph(s) before the enquiry form | `text`, nullable |
| Payment schedule | `paymentPlan` | array of `{percent, label}` | Optional | D (`renderPaymentPlan`) | Off-plan payment breakdown | `jsonb`, nullable |
| Leasing rates | `leasePricing` | object, shape confirmed exactly (§ below) | Optional, currently used by 2 records (GTC Office Tower, The Mandrake) | D (`renderLeasePricing`) | Commercial per-sq-ft rate breakdown | `jsonb`, nullable — internally variable-shape (`zones[]` is itself a variable-length array) |

### `leasePricing` exact shape (confirmed from the 2 live records + code reader)

```js
leasePricing: {
  saleAndLeaseAvailable: true,               // boolean, optional
  fromPerSqFt: { min: 142, max: 207 },        // headline range, optional
  period: "per sq. ft./month",                 // optional, has a code-level default
  spaceAvailable: { min: 3800, max: 17768, unit: "sq. ft." }, // optional
  zones: [                                     // optional array, any length
    { name: "Low Zone", floors: "F3–F16", minPerSqFt: 214, maxPerSqFt: 246 }
  ],
  serviceChargePerSqFt: 35,                    // optional
  serviceChargeNote: "+ VAT",                  // optional
  parkingRatio: "2 bays : 1,000 sq. ft.",       // optional
  parkingNote: "at a cost"                     // optional
}
```

### Explicit answers to the fields you called out

- **`listedDate`**: documented as required, driving "newest first" sorting.
  **No sort-by-date code exists anywhere in the current scripts** — confirmed by
  searching every consumer file. Every record does set it, so it's not *missing*
  data, just currently *unused* data. Recommend keeping the column (cheap, the
  content team is already disciplined about setting it) but flagging that it
  doesn't power anything live today — your call whether that's worth carrying.
- **`project`**: documented as optional, for grouping multi-record developments.
  **Zero current records set it, and zero current code reads it** — the `units[]`
  pattern (§2.5 of the guide itself) is what actually replaced this need.
  Recommend **not** including it in the schema — reviving a field with no data and
  no readers adds surface area for no benefit. Flagging for your explicit decision
  rather than silently dropping it.
- **`letting`**: confirmed required *in practice* (drives all listing-page
  visibility) but **not enforced anywhere in JS** — this is the exact root cause of
  the `sl-029` bug found in the Step 1 conversation. The schema should enforce
  `NOT NULL` with no default, forcing every future insert to make an explicit
  choice.
- **`url`**: see §G below — full analysis there.

---

## G. Property URL / slug

**A. Stored source data, or derived?** In `data/properties.js`, `url` is **stored,
separately, as its own field** — it is not computed from `slug` at read time
anywhere in the current code. In practice, every consumer that uses `url`
(`listings.js` card links, `property-search.js` result links,
`enquiry-modal.js`'s fallback) reads the `url` field directly, never `slug` +
concatenation. `slug` itself is only used for the **lookup** (`findInventoryProperty`
matches on `id` OR `slug`), never rendered into a link anywhere.

**B. Derived, in `propertyData`?** N/A — that dataset has no `slug`/`url` fields at
all; the object key itself doubles as both identity and (implicitly) the link
target, since `property.html?id=<key>` is constructed by hand wherever these are
linked (only `index.html`'s diaspora-grid and the one Exclusive tile, per §C.4).

**C. Different between datasets?** Yes, structurally — `SELLAM_PROPERTIES` has two
parallel fields expected to match; `propertyData` has one implicit identifier.

**D. Required by any live page?** Yes — `url` is what every card/result link
actually renders as `href`. If it's wrong or missing, the link is broken or points
at the wrong property.

### A real, live bug found during this audit that bears directly on this question

`data/properties.js:1240` and `:1264` — one record has `slug:
"1-acre-land-thigiri-ridge"` but `url: "1-2-acre-land-thigiri-ridge"` — **these two
values have drifted apart**. Because `findInventoryProperty()` only matches on `id`
or `slug` (never `url`), clicking that property's own card link (which renders
`href="1-2-acre-land-thigiri-ridge"`) leads to a URL that **doesn't match any
record's `slug` or `id`**, so the clean-URL rewrite silently falls through to the
`propertyData["dg-west"]` placeholder instead of the real listing. This is a live,
reachable bug — not part of this design task to fix, but directly relevant evidence
for the recommendation below, and worth a separate fix ticket regardless of the
migration.

### Recommendation

**Store `slug` only. Derive `url` at read time as `= slug`, everywhere a future
data layer needs to hand a link to the frontend.** This eliminates the entire class
of bug just demonstrated above by construction — there is no longer a second field
that can drift from the first. The existing public URL structure
(`sellamre.com/<slug>`, via the unchanged `vercel.json` rewrite) is fully preserved;
nothing about the *website's* URLs changes, only that the future database has one
source of truth for what that URL is instead of two fields that are supposed to
agree but currently don't, provably.

---

## H. Community model

**Fields currently used** (from `data/communities.js`, confirmed against every
reader): `key`, `label`, `image`, `imageAlt`, `description`, `url`. All six are
read by `community-render.js` when painting the search-bar checklist and the
homepage carousel.

**Is `community` always a stable key?** Yes as designed — `key` is asserted in the
file's own header comment as "never change... once properties reference it."

**Invalid/missing community references from properties?** **None** — cross-checked
every one of the 40 distinct `community:` values actually used across
`data/properties.js` against all 23 defined `communities.js` keys (`runda`,
`muthaiga`, `ridgeways`, `nyari`, `karen`, `lavington`, `kileleshwa`, `kilimani`,
`westlands`, `thigiri`, `rosslyn`, `parklands`, `lower-kabete`, `muthangari`,
`kitisuru`, `spring-valley`, `loresho`, `riverside`, `nyali`, `vipingo`, `ngong`,
`syokimau`, `gigiri`) — every property value matches an existing key exactly. The
codebase's own `community-render.js` cross-check would currently emit zero console
warnings. (7 communities — `muthaiga`, `rosslyn`, `parklands`, `muthangari`,
`loresho`, `nyali`, `vipingo` — currently have no properties tagged to them at all;
not an error, just unused inventory.)

**Case inconsistencies?** None found — every key and every reference is
lowercase-hyphenated, consistently.

**Are community URLs derived?** `url` (`"communities/<key>.html"`) is **stored**,
not derived, in the current data — but every one of the 22 `communities/*.html`
pages that actually exist follows that exact pattern with no exceptions found, so
it's a candidate for the same "derive, don't store" treatment as property `url`
(§G), for the same reason (one less field that can silently drift).

### Proposed `communities` schema (column-level detail in §J)

`key` (PK), `label`, `image`, `image_alt`, `description` — `url` derived as
`'communities/' || key || '.html'` rather than stored, mirroring the §G
recommendation.

---

## I. Search / filter / sort / rendering — feature-to-field matrix

| Feature | File / function | Fields required | Database field(s) needed |
|---|---|---|---|
| Homepage search — type filter | `property-search.js: filter()` | `propertyType` | `properties.property_type` |
| Homepage search — bedrooms filter | `property-search.js: filter()` → `matchesCount` | `units[].bedrooms` (or flat `bedrooms`) | `property_units.bedrooms` |
| Homepage search — community filter | `property-search.js: filter()` | `community` | `properties.community` |
| Homepage search — features filter | `property-search.js: filter()` | `features` | `properties.features` |
| Homepage search — letting filter | `property-search.js: filter()` | `letting` | `properties.letting` |
| Homepage search — price range | `property-search.js: filter()` → `Units.anyPriceInRange` | `units[].salePrice`/`rentPrice` | `property_units.sale_price`/`rent_price` |
| Homepage search — result cards | `property-search.js: cardHTML/priceLine/metaLine` | `url`(→slug), `image`, `title`, `location`, `propertyType`, units | `properties.slug/image/title/location/property_type`, `property_units.*` |
| Homepage hero carousel | `script.js: resolveHeroProperty` | `id`, `title`, `url`(→slug), `location`, `letting`, units | `properties.id/title/slug/location/letting`, `property_units.*` |
| Homepage community checklist + carousel | `community-render.js` | `communities.*` (all 6 fields) | `communities.*` |
| Listing grids (Rent/Sale/Exclusive/Leasing/Buy-category/Community sections) | `listings.js: selectProperties/cardHTML` | `status`, `community`, `propertyType`, `letting`, `collection`, `title`, `location`, `slug`(→url), `id`, `image`, `summary`/`description`, units | `properties.*` (most columns), `property_units.*` |
| Rent page live filter (client-side, post-render) | `rent-filter.js` | Reads DOM `data-*` attrs only, not the DB directly — but those attrs are generated from `property_units.bedrooms/bathrooms/sale_price\|rent_price` and `properties.property_type` | same as above, indirectly |
| Property detail page — everything | `property-detail.js` (see Step 1 §2 field table, all confirmed again in §F above) | Every field in §F except `status`/`collection`/`community`/`features` | Every corresponding column in §J |
| Community cross-check (console warning only) | `community-render.js` | `properties.community` vs. `communities.key` | Enforceable for real via FK, §J |
| Enquiry submission — property identification | `enquiry-modal.js: resolveProperty` | `id`, `slug`, `title`, `collection`, `letting`, `url`(→slug) | `properties.id/slug/title/collection/letting` |
| Property counts | *(no dedicated "counts" feature found anywhere in the current code — not implemented today; nothing to preserve)* | — | — |
| Related/recommended properties | *(no such feature found anywhere in the current code — not implemented today)* | — | — |

Two rows above are worth calling out explicitly: **"property counts" and
"related/recommended properties" were listed as things to check for in the original
Step 1 audit instructions, and neither exists in the current codebase at all** —
confirmed by searching every JS file for anything resembling a count display or a
"related properties" section. Nothing to preserve for either.

---

## J. Proposed final Supabase schema

Column tables only — **no SQL executed, this is documentation of the proposal**,
per your instructions.

### `public.communities`

| Column | Type | Nullable | Default | Constraint | Source field | Purpose |
|---|---|---|---|---|---|---|
| `key` | `text` | NOT NULL | — | `PRIMARY KEY` | `key` | Stable identifier, referenced by `properties.community` |
| `label` | `text` | NOT NULL | — | — | `label` | Display name |
| `image` | `text` | NOT NULL | — | — | `image` | Carousel card photo path |
| `image_alt` | `text` | NOT NULL | — | — | `imageAlt` | Alt text |
| `description` | `text` | NOT NULL | — | — | `description` | Carousel card copy |
| *(no `url` column — derived as `'communities/' || key || '.html'`, per §H)* | | | | | | |

### `public.properties`

| Column | Type | Nullable | Default | Constraint | Source field | Purpose |
|---|---|---|---|---|---|---|
| `id` | `uuid` | NOT NULL | `gen_random_uuid()` | `PRIMARY KEY` | — (new) | Real primary key — see note below on why not `sl-XXX` |
| `legacy_id` | `text` | NOT NULL | — | `UNIQUE` | `id` (e.g. `"sl-017"`) | Preserves the existing `id` for backward-compatible lookups/enquiry linkage |
| `slug` | `text` | NOT NULL | — | `UNIQUE` | `slug` | Canonical URL identity — `url` is derived from this, per §G |
| `status` | `text` | NOT NULL | `'available'` | `CHECK (status IN ('available','under-offer','sold','let'))` | `status` | Listing visibility |
| `collection` | `text` | NOT NULL | — | `CHECK (collection IN ('featured','exclusive'))` | `collection` | Buy/Premium vs. Exclusive routing |
| `title` | `text` | NOT NULL | — | — | `title` | Display name |
| `summary` | `text` | YES | — | — | `summary` | Card blurb (nullable — app already falls back to `description`) |
| `property_type` | `text` | NOT NULL | — | `CHECK (property_type IN ('apartment','townhouse','villa','mansion','bungalow','penthouse','land','commercial','office','retail','industrial'))` | `propertyType` | Filtering + copy tone |
| `community` | `text` | NOT NULL | — | `REFERENCES communities(key)` | `community` | Real FK — upgrades the current console-warning-only check |
| `location` | `text` | NOT NULL | — | — | `location` | Display text |
| `letting` | `text` | NOT NULL | — | `CHECK (letting IN ('sale','rent','both'))`, **no default** | `letting` | Listing-page visibility — no default, deliberately, to prevent a repeat of the `sl-029` bug |
| `features` | `text[]` | NOT NULL | `'{}'` | `CHECK (features <@ ARRAY['wifi','pool','gym','backup-generator','parking','security','garden'])` | `features` | Search filter facets |
| `image` | `text` | NOT NULL | — | — | `image` | Card thumbnail / hero fallback |
| `hero_image` | `text` | YES | — | — | `heroImage` | Dedicated detail-page banner |
| `gallery` | `text[]` | NOT NULL | `'{}'` | — | `gallery` | Ordered photo paths — order is load-bearing (Step 1 §2.4 slot roles), array preserves it |
| `description_body` | `text` | NOT NULL | — | — | `description` (string case) or `description.body` | Long detail-page copy |
| `description_title` | `text` | YES | — | — | `description.title` | Optional bold inline lead-in — see rationale below |
| `feature_location` | `text` | NOT NULL | — | — | `featureLocation` | Features-banner location line |
| `story` | `jsonb` | YES | — | — | `story` | `{rows: [{title, body}]}`, 0-4 entries |
| `feature_highlights` | `jsonb` | YES | — | — | `featureHighlights` | Array of `{title, text}`, overrides the default grid |
| `closing_paragraphs` | `text` | YES | — | — | `closingParagraphs` | Optional pre-enquiry note |
| `payment_plan` | `jsonb` | YES | — | — | `paymentPlan` | Array of `{percent, label}` |
| `lease_pricing` | `jsonb` | YES | — | — | `leasePricing` | Variable-shape commercial rate breakdown (§F) |
| `listed_date` | `date` | YES | — | — | `listedDate` | Currently unused by any live sort — kept per your decision, see §F/N |
| `created_at` | `timestamptz` | NOT NULL | `now()` | — | — (new) | Standard audit column |
| `updated_at` | `timestamptz` | NOT NULL | `now()` | — | — (new) | Standard audit column |

**On `description_title`/`description_body` vs. a single `jsonb`/`text` column:**
the source data uses two shapes for one field (`description: "plain string"` OR
`description: {title, body}`). Two nullable text columns, with `description_title`
simply `NULL` for the plain-string case, is simpler to query and constrain than a
`jsonb` column that has to be shape-checked on every read, and there's no case
where more than these two pieces are needed (confirmed — `renderDescription()`
only ever handles `title` + `body`, nothing else).

**Why `id uuid` + `legacy_id text` instead of keeping `sl-XXX` as the primary key
directly:** `sl-XXX` is a human-authored, sequential, string identifier — fine for
a hand-edited JS array, but not a great Postgres primary key long-term (no
guaranteed uniqueness enforcement beyond "the person editing the file remembers not
to reuse one" — this is explicitly called out as a manual discipline in
`PROPERTY-GUIDE.md` §7.3: *"Never reuse an id from another property"*). A generated
`uuid` primary key plus a `UNIQUE NOT NULL legacy_id` column gets a real
database-enforced guarantee for the new key while fully preserving every existing
`id` value for lookups, enquiry-record linkage, and the hero carousel's hand-authored
`id` references (`script.js`) — nothing that currently depends on the string `"sl-017"`
breaks. **Flagging this as a design choice for your explicit approval** — the
alternative (keep `sl-XXX` as a `text` primary key) is equally valid if you'd rather
not introduce a new key format at all.

### `public.property_units`

| Column | Type | Nullable | Default | Constraint | Source field | Purpose |
|---|---|---|---|---|---|---|
| `id` | `uuid` | NOT NULL | `gen_random_uuid()` | `PRIMARY KEY` | — (new) | Real per-unit key — enables future per-unit status/photos/enquiries per §A.5 |
| `property_id` | `uuid` | NOT NULL | — | `REFERENCES properties(id) ON DELETE CASCADE` | — (new) | Parent link |
| `display_order` | `integer` | NOT NULL | — | — | Position in source `units[]` array | Preserves array order — load-bearing per §A.4 |
| `unit_type` | `text` | YES | — | `CHECK (unit_type IN ('bedsitter','studio','mini-1-bedroom','1-bedroom','2-bedroom','3-bedroom','4-bedroom','5-bedroom','penthouse'))` | `unitType` | Named label, per the fixed 9-value vocabulary in `property-units.js` |
| `bedrooms` | `integer` | YES | — | — | `bedrooms` | `NULL` = not applicable (commercial/land) |
| `bathrooms` | `integer` | YES | — | — | `bathrooms` | Same |
| `sale_price` | `numeric` | YES | — | `CHECK (sale_price IS NULL OR sale_price > 0)` | `salePrice` | KES, plain number |
| `rent_price` | `numeric` | YES | — | `CHECK (rent_price IS NULL OR rent_price > 0)`, plus a table-level `CHECK (sale_price IS NOT NULL OR rent_price IS NOT NULL)` | `rentPrice` | Monthly KES |
| `residence_label` | `text` | YES | — | — | `residenceLabel` | Detail-page-only override (e.g. "Villa 1", "1.2 Acres") |
| `area` | `text` | YES | — | — | `area` | Free-text floor/plot area |
| `note` | `text` | YES | — | — | `note` | Free-text price-table note |

For a single-unit property (the majority, per §A.3), this is simply **one row** —
the flat-fields case is not a special case of the schema, it's a `property_units`
table with exactly one row per property, matching what `unitsOf()` already treats
it as internally.

### Indexes

- `properties`: `UNIQUE` indexes already implied by `slug`/`legacy_id` constraints
  above. Additional: `CREATE INDEX ON properties (community)`, `CREATE INDEX ON
  properties (property_type)`, `CREATE INDEX ON properties (letting)`, `CREATE
  INDEX ON properties (status)` — these four are exactly the columns every listing
  mode filters on (§I).
- `property_units`: `CREATE INDEX ON property_units (property_id)` (join
  performance), `CREATE INDEX ON property_units (bedrooms)`, `CREATE INDEX ON
  property_units (sale_price)`, `CREATE INDEX ON property_units (rent_price)` — the
  four fields the homepage search's price/bedroom range filtering needs.

### Unique constraints

`properties.slug`, `properties.legacy_id` (both above). `communities.key` (PK,
already unique).

### Check constraints

All listed inline in the tables above — `status`, `collection`, `property_type`,
`letting`, `features` (array-subset check), `unit_type`, plus the two
`property_units` price sanity checks.

### RLS (Row Level Security) strategy

The site is a **public, read-only catalogue** from the browser's perspective — no
user accounts, no per-visitor data, every listing page is publicly visible to
anyone. The only writes today happen via `api/enquiry.js` (a separate `enquiries`
table, out of scope for this properties/communities design) and, in the future, an
admin dashboard.

Recommended policy shape (not implemented — for your approval):
- `properties` and `property_units`: RLS **enabled**, with a public `SELECT` policy
  scoped to `status IN ('available', 'under-offer')` (mirrors what `listings.js`
  already excludes client-side — enforcing it at the database layer too, rather
  than trusting every future client to remember the same filter). `sold`/`let`
  records stay queryable only by an authenticated/service-role connection (matches
  today's actual behavior: sold properties' detail pages still work via direct
  link per `PROPERTY-GUIDE.md` §5, so this policy needs a service-role bypass, not
  a hard exclusion, for the detail-page use case specifically).
- `communities`: RLS enabled, public `SELECT`, unrestricted (nothing about a
  community is ever hidden).
- All `INSERT`/`UPDATE`/`DELETE` restricted to the service role / authenticated
  admin role only — no anonymous writes to either table under any policy.

This is a recommendation for Phase 2+; **not something to enable now**, since no
tables exist yet.

---

## K. Indexes and constraints

Covered inline in §J — not repeated here.

---

## L. RLS strategy

Covered inline in §J — not repeated here.

---

## M. Migration risks

1. **`letting` enforcement will immediately surface `sl-029`-style gaps** — good
   (that's the point), but the transformation step needs a pre-flight validation
   pass that lists every record failing the new `NOT NULL` constraint *before*
   attempting to load, not a load that fails opaquely partway through.
2. **The `slug`/`url` drift bug (§G) means `url` cannot be trusted as migration
   input** — the transformation must derive the new schema's link from `slug`
   only, discarding the stored `url` field entirely (per the §G recommendation),
   or the drifted record migrates its bug forward permanently.
3. **`units[]` order must be preserved as `display_order`** — a naive
   unordered bulk insert of unit rows would silently break `unitLabels()`'s
   documented ordering guarantee (§A.4) the next time someone builds a Supabase-
   backed reader.
4. **The 25 dead `propertyData` records are a judgment call, not a technical one**
   — Option C (§D) is a recommendation, not a determination; getting this wrong in
   either direction (migrating dead placeholders, or losing one of the 5 live ones)
   is purely a matter of which list something ends up on, so the record-by-record
   list in §C.4 should be treated as the actual spec once approved, not
   re-derived later.
5. **`description`'s two shapes (`string` vs. `{title, body}`) must be
   distinguished correctly per-record during transformation** — a naive
   `typeof description === 'object'` check handles it, but this is exactly the
   kind of small branch that's easy to get backwards silently (e.g. writing the
   whole object into `description_body` as `"[object Object]"` for the ~handful of
   records using the object shape).
6. **`community` FK enforcement will pass today** (§H found zero invalid
   references) but any *future* hand-edit to `data/properties.js` before cutover
   (this migration is explicitly non-destructive to the live JS — §10 of your
   instructions) could introduce a new typo between now and whenever the real data
   load happens. The transformation step should re-validate at load time, not
   trust this audit's snapshot.
7. **No existing code sorts by `listedDate`** — if it's included in the schema
   (pending your decision, §F) but the transformation script infers a sort order
   from it, that would be *inventing* behavior the current site doesn't have,
   contrary to your instruction that the database should represent what exists,
   not add new behavior.

---

## N. Unresolved decisions requiring your approval

1. **§D — the `propertyData` handling recommendation (Option C, scoped to exactly
   5 records)** — needs your sign-off before any transformation work assumes it.
2. **§F — `listedDate`**: keep as a column with no current live use, or omit?
3. **§F — `project`**: omit entirely (recommended, zero live data/readers), or
   keep as a placeholder column for a future re-introduction?
4. **§J — `properties.id` as a new `uuid` vs. keeping `sl-XXX` as the primary key
   directly** — both are workable; this changes what a future admin dashboard's
   URLs/API would look like, so it's a real product decision, not just a schema
   detail.
5. **§J — RLS policy shape**, specifically the `sold`/`let` service-role-bypass
   detail needed to keep sold-property detail pages working exactly as they do
   today (`PROPERTY-GUIDE.md` §5's documented intentional behavior).
6. **The two live-but-legacy records found in §C.4**
   (`grosvenor-westlands`, and by extension whether the 4 international listings'
   still-unconfirmed pricing — e.g. ShomaBay's 3 of 4 unit prices are literally
   `"Price on Application"` placeholders per the source comment — should migrate
   as-is with that placeholder state, or wait for real figures first).

---

**Per your instructions: no tables have been created, no SQL has been executed, no
data has been migrated, and no application code (`data/properties.js`,
`data/communities.js`, `property-detail.js`, `property-units.js`, search/filter
logic, or the enquiry system) was modified to produce this report.**

**Stopping here for your approval before proceeding.**
