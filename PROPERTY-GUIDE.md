# SELLAM Property System — How It Works & How to Update It

This is the reference manual for the property listing system: the scripts that power
the homepage search, the Rent/Buy/Exclusive listing pages, the four Leasing pages
(Offices/Retail/Industrial/Land), and every individual property page. Keep this file
in the repo — it's the map for anyone editing properties, including future-you.

---

## 1. The one thing to remember

> **`data/properties.js` is the only file you should ever edit to add, change, or
> remove a property.**

Every other script — the homepage search bar, the Rent page, the Buy/Premium page,
the Exclusive page, and every property detail page — **reads from that one file**.
Nothing else needs to be touched, and nothing else should be hand-edited to change
property content. If you ever find yourself editing a `<div class="property-card">`
by hand in an HTML file, stop — that's the old way, and it's exactly what broke
things before this system existed.

```
                         ┌─────────────────────────┐
                         │   data/properties.js     │   ← YOU EDIT THIS
                         │  (one array, one record  │
                         │   per property)           │
                         └────────────┬──────────────┘
                                      │
     ┌────────────────┬──────────────┼──────────────┬───────────────┬────────────────┐
     ▼                ▼              ▼              ▼               ▼                ▼
property-search.js  listings.js   listings.js    listings.js   listings.js    property-detail.js
(homepage search)   (rent.html)   (premium-      (exclusive-   (4 Leasing      (property.html —
                                   properties)     properties)  pages — §6.2)  every detail page)
```

`listings.js` is the **one shared renderer** behind Rent, Buy/Premium, Exclusive, and
all four Leasing pages — see §6.2 for exactly how it picks which properties go where.

---

## 2. `data/properties.js` — the field reference

Open the file. You'll see `window.SELLAM_PROPERTIES = [ { ... }, { ... }, ... ]` —
one JavaScript object per property. Here is exactly what each field does and what
values are allowed.

| Field | Type | Required | What it controls |
|---|---|---|---|
| `id` | string | ✅ | Stable unique key, e.g. `"sl-017"`. **Never change this once set** — it's what the enquiry form and the future dashboard use to identify the property. Just increment the number for new properties. |
| `slug` | string | ✅ | URL-friendly name, e.g. `"the-oakwood-villa"`. This is the property's clean URL: `sellamre.com/<slug>` (a vercel.json rewrite maps it to `property.html?id=<slug>` behind the scenes). Use lowercase, hyphens, no spaces. |
| `status` | string | ✅ | `"available"` \| `"under-offer"` \| `"sold"` \| `"let"`. Anything other than `"available"` or `"under-offer"` is **hidden from every listing page automatically** (see §6). |
| `collection` | string | ✅ | `"featured"` or `"exclusive"`. Controls the Buy/Premium page vs. the Exclusive page. |
| `title` | string | ✅ | The property's display name. |
| `summary` | string | ✅ | **Short** (one sentence, roughly 120–190 characters) — shown on listing cards (Rent/Buy/Exclusive/Leasing). Card space is tight, so keep it brief. This is a *different* field from `description` below — see §2.4b. |
| `propertyType` | string | ✅ | One of: `apartment`, `townhouse`, `villa`, `mansion`, `bungalow`, `penthouse`, `land`, `commercial`, `office`, `retail`, `industrial`. This exact spelling, lowercase — see §2.1 below. |
| `community` | string | ✅ | One of the canonical community keys — see §2.2 below. |
| `location` | string | ✅ | Human-readable location shown on cards, e.g. `"Karen, Nairobi"`. |
| `letting` | string | ✅ | `"sale"`, `"rent"`, or `"both"`. **This is what puts a property on the Rent page**, and on a Leasing page if the type matches too — see §6.1/§6.2. |
| `salePrice` | number \| `null` | ✅ | Sale price in **KES**, as a plain number (`48000000`, not `"48,000,000"` or `"KES 48M"`). `null` if not for sale. |
| `rentPrice` | number \| `null` | ✅ | Monthly rent in **KES**, as a plain number. `null` if not for rent. |
| `bedrooms` | number \| `null` | ✅ | Plain number, or `null` for commercial types (`office`/`retail`/`industrial`/`land`/`commercial`) where a bedroom count doesn't apply. The card and search result simply omit that line when `null` — never write `0` to mean "not applicable". |
| `bathrooms` | number \| `null` | ✅ | Same rule as `bedrooms`. |
| `units` | array | optional | Only for a development that sells/rents more than one floor plan under one listing (e.g. a building with both 1-bed and 2-bed units). When present, it **replaces** `bedrooms`/`bathrooms`/`salePrice`/`rentPrice` above with one entry per floor plan — see §2.5. |
| `features` | array of strings | ✅ | Any of: `wifi`, `pool`, `gym`, `backup-generator`, `parking`, `security`, `garden`. Can be empty `[]`. |
| `image` | string | ✅ | Card thumbnail — **also** used as the detail page's hero banner. Pick a landscape photo; the hero is a wide banner, not a portrait crop. Deliberately independent from `gallery[0]` — see §2.4. |
| `gallery` | array of strings | ✅ | Paths to every photo for the detail page's carousel + story sections. Any length works, 1 to 20+ — no hard cap, and nothing breaks or shows a blank placeholder with fewer than 20 (see §2.4). |
| `url` | string | ✅ | Always just `"<slug>"` (matching the `slug` field above, no `property.html?id=` prefix — that prefix 404s, since the clean-URL rewrite is what resolves it). Don't point this anywhere else. |
| `description` | string \| `{title, body}` | ✅ | **Long** marketing copy for the detail page's intro paragraph(s). This is the lengthy version — don't reuse `summary` here or vice versa. See §2.4b. Plain string is the common case (no bold lead-in). Use `{ title: "...", body: "..." }` instead when the intro should open with a short bold title, e.g. `{ title: "The Future of Kilimani Living.", body: "Positioned along Maalim Juma Road..." }` — the title renders bold, inline, at the start of the first paragraph; `body` still supports multiple paragraphs (blank-line separated) exactly like a plain string does. |
| `featureLocation` | string | ✅ | One sentence about the location, shown in the blue features banner on the detail page (e.g. *"Karen address near international schools, private clubs, green compounds, and lifestyle destinations."*). |
| `story` | object | optional | Bespoke narrative content for the detail page's four "area" sections (kitchen, bedrooms, lifestyle, location). Omit it entirely for auto-generated text — see §2.3. The auto-generated text is automatically worded for a home when `propertyType` is residential, and worded for a commercial space (no "bedroom"/"buyers" language) when it's `office`/`retail`/`industrial`/`land`/`commercial`. |
| `listedDate` | string | ✅ | ISO date `"YYYY-MM-DD"`. Used for "newest first" sorting. |
| `project` | string | optional | Shared key linking multiple records that are really different unit types in the same development (e.g. Studio/1BR/2BR/Penthouse at different prices). Purely a grouping label — see §2.5. |

### 2.1 — Valid `propertyType` values

```
apartment · townhouse · villa · mansion · bungalow · penthouse · land · commercial
office · retail · industrial
```

These match the homepage search bar's Property Type filter exactly. If you type
anything else (wrong case, a typo, a made-up type), that property simply won't
match when a visitor filters by type — it won't error, it'll just silently not show up.

The last three — `office`, `retail`, `industrial` — plus `land`, are the four
**Leasing** categories (see §6.2). A property with one of these types and
`letting: "rent"` or `"both"` appears on:
- its dedicated Leasing page (`leasing-offices.html`, `leasing-retail.html`,
  `leasing-industrial.html`, or `leasing-land.html`), **and**
- the general Rent page (same as any other rental), **and**
- the homepage search, if that type checkbox is selected.

> ⚠️ **Rent page filter caveat**: the Rent page's own filter bar offers
> `Apartment`, `Villa`, `Mansion`, `Bungalow`, `Penthouse`, and `Offices`. It does
> **not** have Retail/Industrial/Land/Commercial checkboxes. If you list one of
> those types with `letting: "rent"` or `"both"`, it still appears as a card on
> the Rent page, but visitors can't filter it in *by* type there (it just always
> shows, regardless of which type checkboxes are ticked). If you need that,
> add a matching checkbox the same way §7.4 describes.

### 2.2 — Valid `community` values

The full, current list lives in **`data/communities.js`** — that file is the single
source of truth for communities, the same way `data/properties.js` is for
properties. See §9 for the complete picture (field reference, how to add one, how
it's wired up). As of this writing, the keys are:

```
runda · muthaiga · ridgeways · nyari · karen · lavington · kileleshwa · kilimani
westlands · thigiri · rosslyn · parklands · lower-kabete · muthangari · kitisuru
spring-valley · loresho · riverside · nyali · vipingo · ngong · syokimau · gigiri
```

Use the exact key, lowercase, hyphenated where shown. If a property is somewhere
not on this list, add it to `data/communities.js` first (§9.2) — the search bar
and the homepage's Featured Communities carousel pick it up automatically, no
HTML editing required.

### 2.3 — The `story` field (optional narrative content)

The detail page has four "story" sections under the gallery — things like *"The
Culinary Atelier"* or *"Private Retreats"* on the 5 Bedroom Mansion page. You have
two options:

**Option A — leave it out entirely.** Just don't include a `story` field. The page
will auto-generate four generic, perfectly readable sections (*"[Title] Residence"*,
*"Design And Finishes"*, *"Lifestyle And Comfort"*, *"Location Advantage"*) using your
`gallery` images. This is the right default for most properties — good enough to
publish, ready to be replaced with real copy later.

**Option B — write bespoke copy.** Add a `story` field with up to four `{title, body}`
pairs:

```js
story: {
  rows: [
    { title: "The Culinary Atelier", body: "The kitchen is thoughtfully designed…" },
    { title: "Private Retreats", body: "All five bedrooms are generously…" },
    { title: "Wellness Sanctuaries", body: "From relaxed daily routines…" },
    { title: "Grand Living", body: "Lower Kabete gives this property…" }
  ]
}
```

You can provide 1, 2, 3, or 4 rows — any row you don't provide falls back to the
generic text automatically. The **images** for these sections always come from your
`gallery` array (images 2–5), regardless of whether you wrote bespoke text — you
never need to specify images for the story section separately.

### 2.4 — How many gallery images do you need?

The detail page's **hero banner** always comes from `image` (the card thumbnail) —
**not** from `gallery`. Keep this deliberate: the hero is a wide landscape banner
and the carousel slides are portrait crops, so reusing one photo for both means
one of the two always looks wrong (stretched or badly cropped). Pick a different,
landscape-oriented photo for `image` than whatever you use as `gallery[0]`.

`gallery` itself feeds three things at once: the carousel, the four story-section
images, and two "detail" images near the bottom. It's built to **never break, show
an error, or leave a blank image slot regardless of how many photos you provide** —
1 photo or 20+, doesn't matter. With fewer than 8, images simply repeat to fill the
story/wide/pair slots below rather than leaving anything empty. With more than 8,
everything past image 8 just becomes additional carousel slides — add as many real
photos as you actually have; there's no cap.

The first 8 positions carry a specific role; anything beyond that is just more
carousel content:

| Position | Used for |
|---|---|
| 1 | First carousel slide (this is *not* the hero — see above) |
| 2–5 | The four story sections |
| 6 | The large "wide" feature image |
| 7–8 | The final two-image pair |
| 9–20+ | Extra carousel slides — no special role, add as many as you have |

### 2.4b — `summary` vs. `description`: two different fields, two different jobs

These look similar but serve opposite purposes, and mixing them up either makes
listing cards overflow or leaves the detail page's intro looking thin:

| Field | Length | Shown where |
|---|---|---|
| `summary` | **Short** — one sentence, ~120–190 characters | Listing cards on Rent, Buy/Premium, Exclusive, and the four Leasing pages |
| `description` | **Long** — one or more full paragraphs | The detail page's intro, right under the title |

Card space is tight, so a long `description` pasted into `summary` will visually
overflow or get awkwardly truncated by the card layout. Conversely, a one-sentence
`summary` pasted into `description` will make the detail page's intro look sparse.
Write each one for its own space — don't reuse the same text for both.

### 2.5 — Multi-unit-type developments (one building, several unit types)

Some developments — like a branded-residences tower with Studio, 1-Bedroom,
2-Bedroom, and Penthouse units, each at a different price with a different
bed/bath count — don't fit the single `bedrooms`/`bathrooms`/`salePrice`/
`rentPrice` shape, because those fields assume ONE price and ONE bed/bath
count per record.

**⚠ Do NOT give each unit type its own full record** (a separate `id`, `slug`
and `url` per floor plan). That was the original pattern here and it grew a
real bug: two records that were supposed to be "the same building, two floor
plans" ended up sharing one `url`, so *both* cards' "View Property" link
opened whichever record happened to come first in the array — the second
floor plan's detail page was unreachable. It also meant every shared field
(image, gallery, description, features, location) had to be hand-kept in sync
across N duplicate records, which is exactly the kind of drift that causes a
listing card to quietly show the wrong photo or an outdated description.

**The pattern: one record for the property, a `units` array for the floor
plans.** Everything shared (title, location, image, gallery, features,
description, `url`, ...) is listed once; only what actually varies by floor
plan — `bedrooms`, `bathrooms`, `salePrice`, `rentPrice` — goes inside `units`:

```js
{
  id: "sl-030",
  slug: "silva-gigiri-residences",
  status: "available",
  collection: "featured",
  title: "Silva Gigiri Residences",
  propertyType: "apartment",
  community: "gigiri",
  location: "Gigiri, Nairobi",
  letting: "sale",
  units: [
    { bedrooms: 0, bathrooms: 1, salePrice: 13000000, rentPrice: null },
    { bedrooms: 1, bathrooms: 1, salePrice: 18500000, rentPrice: null },
    { bedrooms: 2, bathrooms: 2, salePrice: 26000000, rentPrice: null }
  ],
  // …features, image, gallery, url, description, featureLocation, listedDate
  // (each of these is written ONCE — it applies to every unit above)
},
```

Everything downstream reads bedrooms/bathrooms/price through the shared
helpers in `data/property-units.js` (`window.SellamUnits`) instead of the raw
fields, so this works everywhere without special-casing:

- **Listing cards** (`listings.js`) list every bedroom count the property
  comes in — *"0, 1 & 2 Bedrooms"* — and one price: the **cheapest** unit's,
  prefixed *"Starting"* (e.g. *"Starting KES 13,000,000"*). Cards never show
  bathrooms — see §6.2.
- **Filters** (`rent-filter.js`, the homepage search in `property-search.js`)
  match on *any* of the property's units — searching "2 Bedroom" finds this
  property because one of its units has 2 bedrooms, even though others don't.
  Same for price: it matches if any unit's price falls in the searched range.
- **The detail page** (`property.html` via `property-detail.js`) lists the
  full bed/bath/price breakdown, one line per unit — this is where bathrooms
  finally show up.
- There's still exactly **one** `url`/detail page for the whole development —
  no more ambiguity about which record it points to.

Use `bedrooms: 0` for a genuine studio unit (not `null` — `null` means "not
applicable," which is for commercial types; a studio has a real, meaningful
bedroom count of zero).

#### 2.5a — Named unit types (Bedsitter, Studio, Mini 1 Bedroom, ...)

`bedrooms` alone can't tell a Bedsitter from a Studio (both are `bedrooms: 0`),
or a Mini 1 Bedroom from a full 1 Bedroom (both are `bedrooms: 1`) — but they're
different floor plans and should read differently on the listing card and the
detail page's price table. Add an optional `unitType` key to any unit entry:

```js
units: [
  { unitType: "bedsitter", bedrooms: 0, bathrooms: 1, salePrice: 3000000, rentPrice: null },
  { unitType: "studio", bedrooms: 0, bathrooms: 1, salePrice: 2000000, rentPrice: null },
  { unitType: "mini-1-bedroom", bedrooms: 1, bathrooms: 1, salePrice: 10000000, rentPrice: null },
  { unitType: "1-bedroom", bedrooms: 1, bathrooms: 3, salePrice: 13000000, rentPrice: null },
  { unitType: "2-bedroom", bedrooms: 2, bathrooms: 2, salePrice: 20000000, rentPrice: null }
]
```

Recognised keys live in `UNIT_TYPE_LABELS` in `data/property-units.js`:
`bedsitter`, `studio`, `mini-1-bedroom`, `1-bedroom`, `2-bedroom`, `3-bedroom`,
`4-bedroom`, `5-bedroom`, `penthouse`. `unitType` is purely a display label —
`bedrooms` still drives the numeric search/rent-page filters exactly as
before, so a Bedsitter and a Studio both still match the "0 Bedrooms"
checkbox. Omit `unitType` and a unit falls back to the old generic
`"N Bedroom(s)"` wording — every property written before this field existed
needs no changes.

`Units.unitLabel(unit)` returns one unit's label; `Units.unitLabels(property)`
returns every distinct label the property offers, in the order its `units`
array lists them — that's what the card's bedroom line and the price table's
row label both read from now instead of the raw bedroom count.

If a property only ever has one floor plan (the normal case), just keep using
the flat `bedrooms`/`bathrooms`/`salePrice`/`rentPrice` fields as before —
`units` is purely additive, not a replacement you need to adopt everywhere.

---

## 3. How to add a new property — step by step

1. Open `data/properties.js`.
2. Copy an existing record that's closest to your new property (e.g. copy a
   `"both"` featured villa if you're adding another one for sale-and-rent).
3. Paste it as a new entry in the array (don't forget the comma after the
   previous record's closing `}`).
4. Change every field. At minimum:
   - `id`: bump to the next unused number, e.g. `"sl-017"`.
   - `slug`: a new, unique, URL-friendly name.
   - `title`, `propertyType`, `community`, `location`.
   - `letting`, `salePrice`, `rentPrice` (set the one that doesn't apply to `null`).
   - `bedrooms`, `bathrooms` — or, if this property has more than one floor
     plan, a `units` array instead (see §2.5).
   - `image` (landscape — this is also the detail page's hero), `gallery`
     (1 to 20+ photos, `image` again does not need to be repeated in here —
     see §2.4), `url` (url = `slug`, no prefix).
   - `summary` (short, for cards) **and** `description` (long, for the detail
     page) — these are two different fields, see §2.4b. `featureLocation`.
   - `listedDate` (today's date).
5. Set `collection` to `"featured"` (shows on the Buy/Premium page) or
   `"exclusive"` (shows on the Exclusive page).
6. Save the file. **That's it.** No other file needs to change. Reload any page —
   the property will now appear:
   - On the homepage search, if it matches a visitor's filters.
   - On the Rent page, automatically, if `letting` is `"rent"` or `"both"`.
   - On the Buy/Premium page, if `letting` is `"sale"` or `"both"` and
     `collection` is `"featured"`.
   - On the Exclusive page, if `collection` is `"exclusive"`.
   - At its own clean-URL detail page: `sellamre.com/<slug>`.

### Minimal copy-paste template

```js
{
  id: "sl-017",
  slug: "example-property-slug",
  status: "available",
  collection: "featured",
  title: "Example Property",
  summary: "One short sentence about the property, for listing cards.",
  propertyType: "villa",
  community: "karen",
  location: "Karen, Nairobi",
  letting: "both",
  salePrice: 60000000,
  rentPrice: 250000,
  bedrooms: 4,
  bathrooms: 3,
  features: ["pool", "security", "parking"],
  image: "assets/images/example-exterior.jpeg",
  gallery: ["assets/images/example-1.jpeg", "assets/images/example-2.jpeg"],
  url: "example-property-slug",
  description: "A longer marketing paragraph (or several) about the property, for the detail page's intro.",
  featureLocation: "One sentence about the location's access and lifestyle.",
  listedDate: "2026-07-21"
},
```

---

## 4. How to update an existing property

Find its record in `data/properties.js` (search for its `title` or `slug`) and
edit the fields directly. Save. Every page that shows this property — cards,
search results, and its own detail page — updates immediately, because they all
read the same record. There is nothing to "sync."

**Common updates:**

| You want to… | Change this |
|---|---|
| Change the price | `salePrice` and/or `rentPrice` (or the matching field inside `units[n]` if it has multiple floor plans — §2.5) |
| Take it off the rental market (keep it for sale) | `letting: "sale"` |
| Add it to the rental market too | `letting: "both"` |
| Mark it sold | `status: "sold"` (see §6.4) |
| Mark it rented | `status: "let"` |
| Add more photos | Append paths to `gallery` (any length, no cap — §2.4) |
| Rewrite the short card blurb | `summary` (keep it to one sentence — §2.4b) |
| Rewrite the detail page's intro paragraph | `description` (the long version — §2.4b) |
| Add bespoke story sections | Add a `story` field (§2.3) |
| Move it into the exclusive collection | `collection: "exclusive"` |

---

## 5. How to remove a property

**Don't delete the record** unless you're sure it should vanish from history
entirely (old enquiries reference properties by `id`, so deleting breaks that
trail). Instead, set:

```js
status: "sold",   // or "let", or "under-offer"
```

This removes it from every listing page automatically — homepage search, Rent,
Buy/Premium, Exclusive — while its detail page still works if someone has the
direct link (useful for "recently sold" credibility, or you can leave it findable
only via direct URL).

If you genuinely need to delete a property outright, remove its object from the
`window.SELLAM_PROPERTIES` array — just make sure no other property's `id` gets
reused.

---

## 6. How each script works

### 6.1 `data/properties.js` — the data

Just an array of plain JavaScript objects assigned to `window.SELLAM_PROPERTIES`.
No logic, no functions — purely data. This is deliberate: it means the exact same
shape could later come from a database/API instead of a hardcoded file (for an
admin dashboard) without changing any of the scripts below.

### 6.2 `listings.js` — renders every listing page (Rent, Buy/Premium, Exclusive, and all four Leasing pages)

One shared script drives every listing page — seven in total. Each page's card
container tells it which mode (and, for Leasing, which property type) to run in:

```html
<div class="page-shell property-rows" data-property-rows data-listing="rent">
<div class="page-shell property-rows" data-property-rows data-listing="sale">
<div class="page-shell property-rows" data-property-rows data-listing="exclusive">
<div class="page-shell property-rows" data-property-rows data-listing="leasing" data-leasing-type="office">
<div class="page-shell property-rows" data-property-rows data-listing="leasing" data-leasing-type="retail">
<div class="page-shell property-rows" data-property-rows data-listing="leasing" data-leasing-type="industrial">
<div class="page-shell property-rows" data-property-rows data-listing="leasing" data-leasing-type="land">
```

| Mode | Shows properties where… | Price shown |
|---|---|---|
| `rent` | `letting` is `"rent"` or `"both"` | `rentPrice` |
| `sale` | `letting` is `"sale"` or `"both"` **and** `collection` is not `"exclusive"` | `salePrice` |
| `exclusive` | `collection` is `"exclusive"` | `salePrice` |
| `leasing` | `propertyType` matches `data-leasing-type` **and** `letting` is `"rent"` or `"both"` | `rentPrice` |

In every mode, properties with `status` of `"sold"` or `"let"` are excluded.

The script builds each card's HTML (image, title, location, bedroom-count
line, price, "View Property" / "Enquire" links) and writes it into the page.
Buttons are plain gold text links with a thin divider between them, not
pill buttons — see `.card-actions` in `premium-properties.css` if that ever
needs to change.

The bedroom line lists **every** bedroom count the property comes in — a
single-unit property just shows its one count (e.g. *"5 Bedrooms"*); a
property with a `units` array (§2.5) lists all of them (e.g. *"1 & 2
Bedrooms"*, or *"1, 2 & 3 Bedrooms"*). It's rendered via `Units.bedroomCounts()`
+ `Units.joinList()`, and **omitted entirely** when the property has no
bedroom count at all (`bedrooms: null`, i.e. commercial listings) — never a
fake "null Bedrooms".

**Bathrooms are never shown on a listing card.** That's deliberate — cards are
a summary; the full bed/bath breakdown lives on the detail page (§6.4).

The price line always shows the **cheapest** unit's price for the page's mode
(`salePrice` for `sale`/`exclusive`, `rentPrice` for `rent`/`leasing`). A
single-unit property shows it plain (*"KES 165,000,000"*); a `units` property
prefixes it *"Starting"* (*"Starting KES 5,000,000"*) since it's a floor, not
the only price. Everywhere bedrooms/price are read, this script goes through
`data/property-units.js` (`window.SellamUnits`) rather than the raw fields, so
single-unit properties render exactly as before and multi-unit properties
just work.

**It runs synchronously**, placed in the HTML *after* the (now-empty) card
container and *before* the scripts that depend on the cards existing
(`enquiry-modal.js`, `rent-filter.js`). Don't reorder the `<script>` tags at
the bottom of these pages — the order matters, and `data/property-units.js`
must load right after `data/properties.js`, before `listings.js`.

### 6.3 `property-search.js` — the homepage search bar

Reads `window.SELLAM_PROPERTIES` and exposes a small reusable API on
`window.SellamSearch`:

- `SellamSearch.all()` — the full inventory.
- `SellamSearch.filter(criteria)` — filters by `types`, `bedrooms`, `bathrooms`,
  `communities`, `features`, `letting`, `priceMin`/`priceMax`.
- `SellamSearch.renderCards(list, container)` — paints result cards.
- `SellamSearch.formatKES(number)` — turns `48000000` into `"KES 48,000,000"`.

It also wires up the homepage's search form directly: on submit, it reads every
checked checkbox and the price-range dropdowns, filters the inventory, and renders
result cards below the search bar. "Clear search" resets the form and hides the
results.

For a multi-unit property (§2.5), bedroom/bathroom/price filtering matches if
*any* of its units qualifies (via `data/property-units.js`), the result card's
price line shows *"From KES X"* using its cheapest unit, and its bed/bath meta
line shows the range across units (e.g. *"1-2 Bed"*) instead of one count.

### 6.4 `property-detail.js` + `property.html` — every property's individual page

`property.html` is a **single template** used by every property. It works out
*which* property to show like this, in order:

1. `?id=<slug>` in the URL — normally arrives via the clean URL
   `sellamre.com/<slug>` (e.g. `sellamre.com/grosvenor-karen`), which
   vercel.json rewrites to `property.html?id=<slug>` server-side.
2. `data-property-key="<slug>"` on the page's `<body>` tag (used by the handful of
   properties that still have their own standalone HTML file, e.g.
   `properties/5-bedroom-mansion-lower-kabete.html` — for backwards-compatible
   bookmarks/links; it resolves to the exact same data).
3. The page's own filename, as a last resort.

Once it finds the matching record in `data/properties.js`, it fills in the title,
description, a **price table** (one row per price — see below), hero image,
gallery carousel, lightbox, the four story sections (§2.3), and the blue
features banner's location line. **The price table is the only place
bathrooms are shown** — listing cards deliberately omit them (§6.2).

The price table (`<table class="price-table">`, body populated via
`[data-price-rows]`) gets one `<tr>` per price the property actually has —
built by `buildPriceRows()` from `bedrooms`/`bathrooms`/`salePrice`/`rentPrice`
(or `units`, for a multi-unit property, §2.5):

- Single-unit, sale only: one row — *"5 Bedrooms | 5 Bathrooms | KES X"*.
- Single-unit, `letting: "both"`: two rows, same bed/bath, one sale price and
  one rent price (`"KES Y / month"`).
- Multi-unit (§2.5): one row per unit, each unit's own bed/bath/price — e.g.
  *"1 Bedroom | 3 Bathrooms | KES X"* and *"2 Bedrooms | 3 Bathrooms | KES Y"*.

There's still only one detail page for the whole development, since `units`
share a single `id`/`slug`/`url`.

⚠ The handful of standalone legacy pages under `properties/*.html` (see point 2
above) have their own hardcoded `.price-block` markup and their own CSS file,
predating the price table — they don't have `[data-price-rows]`, so
`renderPriceTable()` silently no-ops on them and their price no longer
live-syncs from `data/properties.js`. Their static placeholder text still
shows; it just won't update if you change the price in the inventory. Don't
add new properties this way (see the note at the end of this section) — if
one of these needs updating, migrate it to the inventory (clean URL
`sellamre.com/<slug>`) instead of patching the standalone file.

It also picks the enquiry section's heading based on `letting`: a pure
`"rent"` listing gets **"Enquire To Lease Now"**; anything else (`"sale"` or
`"both"`) keeps **"Enquire To Buy Now"**. You never set this directly — it
follows from `letting` automatically.

A small legacy fallback (`propertyData`, hardcoded inside this same file) still
exists for a handful of older "diaspora" template pages that were never migrated
into `data/properties.js`. New properties should never use this — always add them
to `data/properties.js` instead.

### 6.5 `rent-filter.js` — the Rent page's live filter bar

Reads the property-type / bedrooms / bathrooms checkboxes and the min/max price
selects, and shows/hides the cards `listings.js` already rendered — entirely in
the browser, no page reload. It reads each card's `data-property-type`,
`data-price`, `data-bedrooms`, `data-bathrooms` attributes, which `listings.js`
generates automatically from your `data/properties.js` record. You never edit
this data by hand.

For a multi-unit property (§2.5), `data-price`/`data-bedrooms`/`data-bathrooms`
are comma-separated lists — one value per unit (a single-unit property just
gets a list of one, so nothing changes for the common case) — and a card
matches a filter if *any* value in its list qualifies.

### 6.6 `enquiry-modal.js` + `api/enquiry.js` — the enquiry pipeline

Every "Enquire" button/link (whether the popup modal or the plain form on a
detail page) resolves **which property** it's about by checking, in order: an
explicit `data-property-id`, the card it's inside, or the current page's property
(via the same lookup `property-detail.js` uses). It then sends `property_id`,
`property_title`, `property_url`, and `listing_category` to `/api/enquiry.js`,
which validates the submission, stores it in Supabase, and emails the team via
Resend. You don't need to configure anything per-property for this to work — it's
fully automatic once a property exists in `data/properties.js`.

### 6.7 `site-motion.js` and `nav-active.js` — cosmetic, not data-related

`site-motion.js` handles the scroll-reveal fade-in animation on every page except
the homepage (which has its own copy). `nav-active.js` highlights the current
section in the navbar. Neither reads property data — you can ignore both when
managing listings.

---

## 7. Quick reference

### 7.1 File map

| File | What it's for | Do you ever edit it to change a property? |
|---|---|---|
| `data/properties.js` | The inventory | **Yes — this is the only one** |
| `data/property-units.js` | Shared helpers for reading bedrooms/bathrooms/price off a property, whether it's flat fields or a `units` array (§2.5) | No |
| `data/communities.js` | The community inventory (§9) | **Yes — to add/edit a community** |
| `community-render.js` | Renders the homepage's community checkboxes + carousel | No |
| `listings.js` | Renders Rent/Buy/Exclusive/Leasing cards | No |
| `property-search.js` | Homepage search | No |
| `property-detail.js` | Renders `property.html` | No |
| `rent-filter.js` | Rent page live filtering | No |
| `enquiry-modal.js` / `api/enquiry.js` | Enquiry form + backend | No |
| `site-motion.js` / `nav-active.js` | Animation / nav highlighting | No |

### 7.2 Which pages load which scripts

| Page | Scripts (in order) |
|---|---|
| `index.html` (homepage) | `data/properties.js` → `data/property-units.js` → `data/communities.js` → `community-render.js` → `property-search.js` → `script.js` |
| `rent.html` | `data/properties.js` → `data/property-units.js` → `listings.js` → `enquiry-config.js` → `enquiry-modal.js` → `premium-properties.js` → `rent-filter.js` |
| `premium-properties.html` | `data/properties.js` → `data/property-units.js` → `listings.js` → `enquiry-config.js` → `enquiry-modal.js` → `premium-properties.js` |
| `exclusive-properties.html` | same as above |
| `leasing-offices.html` / `leasing-retail.html` / `leasing-industrial.html` / `leasing-land.html` | same as `premium-properties.html`, but the card container has `data-listing="leasing" data-leasing-type="<office\|retail\|industrial\|land>"` |
| `property.html` (and any `properties/*.html`) | `data/properties.js` → `data/property-units.js` → `property-search.js` → `enquiry-config.js` → `enquiry-modal.js` → `property-detail.js` |

### 7.3 Golden rules

- ✅ **Always** add/edit properties in `data/properties.js`.
- ✅ **Always** use the exact `propertyType` and `community` spellings from §2.1/§2.2.
- ✅ **Always** store prices as plain numbers, in KES, never as strings.
- ✅ To take a property off the market, change its `status` — don't delete the record.
- ❌ **Never** hand-edit a `<article class="property-card">` in an HTML file — it
  will be silently overwritten the next time the page loads (that's `listings.js`
  doing its job), and it means the property won't show up correctly on the other
  pages either.
- ❌ **Never** reuse an `id` from another property, even a deleted one.

### 7.4 Adding a brand-new Property Type or Community

**Property Type** isn't data-driven — if you need a type that isn't in §2.1:

1. Add a new checkbox to the homepage search bar in `index.html` (find the
   `filter-menu checklist-menu` block for Property Type), matching the existing
   markup pattern, with a new lowercase `value="…"`.
2. If it should also be filterable on the Rent page, add the equivalent checkbox
   to `rent.html`'s filter bar — but note the Rent page uses **Title Case**
   values there (`value="Villa"`, not `value="villa"`).
3. Use that same value (lowercase for `data/properties.js`) in your property record.

**Community** *is* data-driven — see §9.2. You only ever edit `data/communities.js`;
nothing needs to be hand-added to `index.html`.

### 7.5 The "Leasing" navbar dropdown

The **Leasing** nav item (desktop and mobile) is a dropdown with four links:
Offices, Retail, Industrial, Land — pointing at `leasing-offices.html`,
`leasing-retail.html`, `leasing-industrial.html`, `leasing-land.html`. It's plain
HTML/CSS (a `.nav-has-dropdown` / `.nav-dropdown` pair, opening on hover or
keyboard focus) plus a matching, always-visible sub-list in the mobile menu
(`.mobile-nav-has-sublist` / `.mobile-nav-sublist`) — there's no JavaScript
behaviour to it. This markup is repeated on every page's navbar (desktop pages use
`styles.css`; `rent.html`/`premium-properties.html`/`exclusive-properties.html`
use `premium-properties.css` — both files carry the same dropdown CSS).

To **add a fifth Leasing category** later:
1. Add its `propertyType` to §2.1 and to `data/properties.js`.
2. Duplicate one of the `leasing-*.html` pages, changing its `<title>`, intro
   copy, and the card container's `data-leasing-type`.
3. Add a new `<li><a href="leasing-<name>.html">…</a></li>` to both the
   `.nav-dropdown` and `.mobile-nav-sublist` blocks, on every page's navbar (this
   is the one piece of the system that *isn't* driven by `data/properties.js` —
   it's site-wide navigation markup, not property data).
4. Add `"leasing-<name>.html"` to the leasing list inside `nav-active.js`'s
   `getActiveSection()` so the nav highlights correctly on the new page.

---

## 9. The Community System

Communities (Runda, Karen, Ngong, etc.) have their own single source of truth,
built the same way as the property system in §1–§6, and feeding the **two**
homepage surfaces that show communities:

- The homepage search bar's **"Communities"** checkbox filter.
- The homepage **"Featured Communities"** carousel.

```
                         ┌──────────────────────────┐
                         │   data/communities.js     │   ← YOU EDIT THIS
                         │  (one array, one record   │
                         │   per community)           │
                         └────────────┬───────────────┘
                                      │
                         community-render.js
                                      │
                    ┌─────────────────┴──────────────────┐
                    ▼                                     ▼
       .community-filter-menu                    .community-track
     (search bar checkboxes,                    (Featured Communities
        index.html)                                carousel cards)
```

> **The Rent page's filter bar deliberately does *not* have a Community filter,
> and this system does not add one.** That was an explicit decision — leave
> `rent.html` alone when working with communities.

### 9.1 — `data/communities.js` — the field reference

| Field | Type | What it controls |
|---|---|---|
| `key` | string | Stable, unique, lowercase, hyphenated. This is the checkbox's `value` **and** the exact string every property's `community` field (§2.2) must match. Never change an existing key once properties reference it. |
| `label` | string | Display name shown next to the checkbox and on the carousel card. |
| `image` | string | Path to the carousel card's photo. |
| `imageAlt` | string | Alt text for that photo. |
| `description` | string | One or two sentences shown on the carousel card. |
| `url` | string | The card's "View Community" link target (`communities/<key>.html`). Note: as of this writing none of these pages actually exist yet on the site — that was already true before this system existed and isn't something this system needs to fix. |

### 9.2 — How to add a new community — step by step

1. Open `data/communities.js`.
2. Copy an existing record and paste it as a new entry in the
   `window.SELLAM_COMMUNITIES` array (don't forget the comma after the previous
   record's closing `}`).
3. Set `key` (lowercase, hyphenated, unique), `label`, `image`, `imageAlt`,
   `description`, and `url`.
4. Save. **That's it.** Reload the homepage:
   - The new community appears as a checkbox in the search bar's Communities
     filter, automatically.
   - The new community appears as a card in the Featured Communities carousel,
     automatically.
5. To actually tag a property with it, use the same `key` in that property's
   `community` field in `data/properties.js` (§2.2). If you typo it, you'll see a
   console warning on the homepage (`community-render.js` cross-checks every
   property's `community` value against `data/communities.js` on load) — nothing
   breaks silently.

### 9.3 — How `community-render.js` works

Reads `window.SELLAM_COMMUNITIES` and, if the homepage has the matching
containers, paints:

- One `<label class="filter-option">` checkbox per community into
  `.community-filter-menu` — markup identical to what `script.js`'s
  `setupSearchFilters()` already expects, so filtering, the auto-generated
  "Clear selection" button, etc. all keep working untouched.
- One `<article class="community-card">` per community into `.community-track` —
  markup identical to what `script.js`'s `setupCommunityCarousel()` already
  expects, so the arrows, dots/pagination, and scroll-reveal animation all keep
  working untouched.

**It runs synchronously**, placed in `index.html` after `data/communities.js` and
*before* `script.js` — the same ordering rule as `listings.js` in §6.2. Don't
reorder these `<script>` tags.

It also exposes `window.SellamCommunities.all()` / `.findByKey(key)` for any
future script that needs to look up a community's label/description from its key.

---

## 10. Troubleshooting

**"I added a property but it's not showing up anywhere."**
Check the browser console for a JavaScript syntax error in `data/properties.js`
(a missing comma is the usual culprit — every record needs a comma after it,
except the last one). Also check `status` is `"available"` or `"under-offer"`.

**"It shows on the Buy page but not the Rent page."**
Check `letting` — it needs to be `"rent"` or `"both"`, not `"sale"`.

**"The price shows as 'Price on application'."**
Both `salePrice` and `rentPrice` are `null`, or the relevant one is `null` for the
page you're viewing (e.g. Rent page needs `rentPrice` set).

**"Filtering by type/community doesn't find my property."**
Double-check the exact spelling against §2.1/§2.2 — these are case-sensitive and
must match exactly, no plurals, no extra spaces.

**"The detail page shows the wrong content, or generic placeholder text."**
Confirm the `slug` in `data/properties.js` matches the URL you're visiting
(`sellamre.com/<slug>`), and that `url` is set to `"<that same slug>"` with
no `property.html?id=` prefix.

**"I want a different price format (e.g. USD)."**
Don't — the whole system (search filtering, price-range dropdowns, card display)
assumes KES as a plain number. Converting currencies would require changes across
multiple scripts; raise it as a proper task rather than hand-editing a price
string.

**"I added a community but it's not showing up in the search bar or carousel."**
Check the browser console for a JavaScript syntax error in `data/communities.js`
(same missing-comma culprit as above). Also confirm `index.html` still loads
`data/communities.js` and `community-render.js` before `script.js` — see §9.3 and
§7.2.

**"The console shows a warning about an unknown community."**
That's `community-render.js`'s cross-check doing its job: some property in
`data/properties.js` has a `community` value that doesn't match any `key` in
`data/communities.js`. Either fix the typo on the property, or add that key as a
new community (§9.2).

**"I added a bunch of gallery images and now the whole page shows the DG West
placeholder / a property that isn't mine."**
This isn't a real "8 image limit" — `gallery` accepts any number of photos (§2.4),
and there's no code path that breaks from having more than 8. What actually
causes this is almost always a JavaScript syntax mistake introduced while
hand-typing many long file paths into the array — a missing comma between two
`"path.jpeg"` entries, a stray or missing closing bracket, or an unescaped quote
inside a filename. A syntax error anywhere in `data/properties.js` breaks the
*entire* file, not just the one record — every property falls back to the legacy
DG West placeholder, since `window.SELLAM_PROPERTIES` never gets defined at all.
Open the browser console: a syntax error shows up immediately, usually naming the
exact line. Double-check the `gallery` array you just edited for a missing comma
first — that's the most common cause.

**"My hero image and my first carousel photo are still the same picture."**
Check `image` — the hero always comes from that field now (§2.4), not from
`gallery[0]`. If `image` and `gallery[0]` happen to point at the same file path,
that's what you'd see; set `image` to a different, landscape-oriented photo.
