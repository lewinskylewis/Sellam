/* ============================================================================
   SELLAM — CENTRAL PROPERTY INVENTORY  (single source of truth)
   ============================================================================
   THIS IS THE ONLY FILE YOU EDIT TO ADD / CHANGE / REMOVE A PROPERTY.

   Every page reads from this list:
     • Homepage search bar     -> filters this array
     • rent.html               -> auto-lists anything with letting "rent"/"both"
     • premium-properties      -> letting "sale" or "both", not "exclusive"
     • exclusive-properties    -> collection "exclusive"
     • leasing-offices.html    -> propertyType "office",     letting rent/both
     • leasing-retail.html     -> propertyType "retail",     letting rent/both
     • leasing-industrial.html -> propertyType "industrial", letting rent/both
     • leasing-land.html       -> propertyType "land",       letting rent/both
     • /<slug> (clean URL)     -> vercel.json rewrites it to
                                   /api/property?id=<slug>, which renders the
                                   single property-detail template, looking
                                   the property up by `id` or `slug`

   DATA ONLY — no logic lives here. This shape is also the future database
   row / API response, so an admin dashboard can write to it unchanged.

   ⚠ PLACEHOLDER DATA: features, some prices, descriptions, galleries and
   listedDate are placeholders so the template is fully wired end-to-end.
   Replace the values with the client's real data — the structure stays.

   ---------------------------------------------------------------------------
   FIELD REFERENCE  (all values in KES)
   ---------------------------------------------------------------------------
   id           Stable unique key. NEVER change once set (dashboard/routing).
   slug         URL-friendly name; this is what appears in the clean URL
                (sellamre.com/<slug>) and is also accepted as the `?id=`
                value on /api/property directly.
   status       "available" | "under-offer" | "sold" | "let"
   collection   "featured" | "exclusive"
   title        Display name.
   summary      SHORT (1 sentence, ~120-190 characters) — shown on listing
                cards (Rent/Buy/Exclusive/Leasing). Keep this brief; card
                space is tight. This is a DIFFERENT field from `description`
                below — don't reuse the long text here.
   propertyType apartment | townhouse | villa | mansion | bungalow |
                penthouse | land | commercial | office | retail | industrial
   community    runda | karen | lavington | westlands | kileleshwa | kilimani |
                muthaiga | nyari | ridgeways | gigiri | lower-kabete | ngong |
                syokimau
   location     Human-readable location shown on cards.
   letting      "sale" | "rent" | "both"   <- controls which pages list it
   salePrice    NUMBER (KES), or null if not for sale
   rentPrice    NUMBER (KES per month), or null if not for rent
   bedrooms     NUMBER, or `null` for commercial types (office/retail/
                industrial/land) where a bedroom count doesn't apply — the
                card and search result simply omit that line when null.
   bathrooms    NUMBER, or `null` — same rule as bedrooms.
   units        OPTIONAL. Only for a development that sells/rents more than
                one floor plan out of the same listing (e.g. a building with
                both 1-bed and 2-bed units). When present, it REPLACES the
                bedrooms/bathrooms/salePrice/rentPrice fields above with an
                array of them, one entry per floor plan:
                  units: [
                    { bedrooms: 1, bathrooms: 3, salePrice: 5000000, rentPrice: null },
                    { bedrooms: 2, bathrooms: 3, salePrice: 12000000, rentPrice: null }
                  ]
                Everything else (title, location, image, gallery, features,
                description, ...) is still shared, listed once. The listing
                card, search filters, and detail page all read bedrooms/
                bathrooms/price through data/property-units.js so both
                shapes work everywhere — don't create one duplicate row per
                floor plan, that's the pattern this replaces.

                unitType  OPTIONAL per-unit key for named floor plans that
                don't map 1:1 onto a bedroom count — a Bedsitter and a Studio
                are both `bedrooms: 0`, a Mini 1 Bedroom and a 1 Bedroom are
                both `bedrooms: 1`, but they should read as different unit
                types on the card and price table. `bedrooms` still drives
                numeric search/filter matching unchanged — `unitType` is
                display-only. Recognised keys (see UNIT_TYPE_LABELS in
                data/property-units.js): bedsitter | studio |
                mini-1-bedroom | 1-bedroom | 2-bedroom | 3-bedroom |
                4-bedroom | 5-bedroom | penthouse. Omit it and the unit just
                falls back to the old generic "N Bedroom(s)" wording. Example:
                  units: [
                    { unitType: "bedsitter", bedrooms: 0, bathrooms: 1, salePrice: 3000000, rentPrice: null },
                    { unitType: "studio", bedrooms: 0, bathrooms: 1, salePrice: 2000000, rentPrice: null },
                    { unitType: "mini-1-bedroom", bedrooms: 1, bathrooms: 1, salePrice: 10000000, rentPrice: null },
                    { unitType: "1-bedroom", bedrooms: 1, bathrooms: 3, salePrice: 13000000, rentPrice: null }
                  ]
   features     wifi | pool | gym | backup-generator | parking | security | garden
   image        Card thumbnail — shown on listing pages (Rent/Buy/Exclusive/
                Leasing/search). Falls back to being the detail page's hero
                banner too, but only when `heroImage` (below) isn't set.
                Pick a landscape shot; the hero is a wide banner, not a
                portrait crop.
   heroImage    OPTIONAL. Dedicated landscape shot for the detail page's hero
                banner, kept separate from the card thumbnail (`image`) above
                — set this whenever you want the listing card and the detail
                page to show different photos. Falls back to `image` when
                omitted.
   gallery      Image paths for the detail page carousel + story sections.
                Any length works, 1 to 20+ — there is no hard cap and no
                error/blank placeholder if you have fewer than 20; the
                carousel and story sections simply use however many you
                provide. Position matters for the first 8:
                  1     -> the FIRST carousel slide (not the hero — see
                           `image` above; keep this photo different from it)
                  2-5   -> the four "story" section images
                  6     -> the large "wide" feature image
                  7-8   -> the final two-image pair
                  9-20+ -> extra carousel slides only (optional, no special
                           role) — add as many real photos as you have.
                Fewer than 8? Nothing breaks — images just repeat to fill
                the story/wide/pair slots rather than showing blank space.
   url          Link target for the card — clean slug only (matches `slug`
                above), e.g. "cheval-riverside". A vercel.json rewrite maps
                /<slug> -> /api/property?id=<slug>, so this must NEVER be
                prefixed with "property?id=" or the link 404s.
   description  LONG marketing copy for the detail page's intro paragraph(s)
                — this is the lengthy version. Separate blank lines start a
                new paragraph. Don't reuse `summary` here or vice versa.
   featureLocation  One-sentence location blurb for the blue features banner.
                Used as the first item's text ("Location:") whenever
                `featureHighlights` (below) isn't set.
   featureHighlights  OPTIONAL. Full custom list for the blue features banner
                on the detail page — an array of { title, text }, e.g.:
                  featureHighlights: [
                    { title: "Location:", text: "..." },
                    { title: "Security:", text: "24/7 manned guard and CCTV." }
                  ]
                Any number of items works, and titles aren't limited to the
                default set (Location/Connectivity/Size Options/Design/
                Architecture/Access/Parking/Amenities Nearby) — use whatever
                titles best describe this property. When omitted, the banner
                falls back to that default 8-item list (with `featureLocation`
                slotted into the first one).
   closingParagraphs  OPTIONAL. 1-3 closing paragraphs shown in a plain text
                block between the features banner and the enquiry form.
                Separate blank lines start a new paragraph, same convention
                as `description`. When omitted entirely, that section of the
                detail page doesn't render at all — no empty gap.
   story        OPTIONAL. Bespoke narrative sections [{title, body}, ...] for
                the detail page's "various areas". When omitted, property.html
                generates sensible generic sections automatically — worded for
                a home when propertyType is residential, and worded for a
                commercial space (no "bedroom"/"buyers" language) when
                propertyType is office/retail/industrial/land/commercial.
   listedDate   ISO date (YYYY-MM-DD) — used for "newest" sorting
   project      OPTIONAL. Shared key linking multiple records that are really
                different unit types within the SAME development (e.g. a
                building that sells Studio / 1BR / 2BR / Penthouse units at
                different prices). Give each unit type its OWN full record
                (own id/slug/bedrooms/bathrooms/price) so search, filtering,
                and cards keep working exactly as they do for any other
                property — `project` is only a label for grouping them (e.g.
                "silva-gigiri-residences"), not a structural change. See
                PROPERTY-GUIDE.md §2.5 for the full pattern.
   leasePricing OPTIONAL. Additive per-sq-ft ("PSF") leasing rate breakdown
                for office/commercial leasing, on top of — not instead of —
                the regular rentPrice/salePrice/letting/status fields above,
                which keep driving every existing card, filter, and page as
                before. When set, property.html shows a dedicated "Leasing
                rates" block below the usual price table; when omitted (the
                default), that block doesn't render at all. All PSF figures
                are in KES. Shape:
                  leasePricing: {
                    saleAndLeaseAvailable: true,   // shows a "Sale & Lease
                                                    // Available" prefix
                    fromPerSqFt: { min: 142, max: 207 }, // headline range
                    period: "per sq. ft./month",   // OPTIONAL, this is the default
                    spaceAvailable: { min: 3800, max: 17768, unit: "sq. ft." },
                    zones: [   // floor-band pricing, in listed order
                      { name: "Low Zone", floors: "F3–F16", minPerSqFt: 214, maxPerSqFt: 246 },
                      { name: "Middle Zone", floors: "F18–F29", minPerSqFt: 246, maxPerSqFt: 311 },
                      { name: "High Zone", floors: "F30–F41", minPerSqFt: 311, maxPerSqFt: 337 }
                    ],
                    serviceChargePerSqFt: 35,
                    serviceChargeNote: "+ VAT",       // OPTIONAL
                    parkingRatio: "2 bays : 1,000 sq. ft.",
                    parkingNote: "at a cost"          // OPTIONAL
                  }
                Any of zones/spaceAvailable/fromPerSqFt/service charge/
                parking may be omitted individually — each renders only when
                present.
   paymentPlan  OPTIONAL. Flexible payment schedule shown as its own block on
                property.html, just above the enquiry form — mostly used for
                off-plan/under-construction residential developments, NOT
                every property. Omitted (the default) means the block simply
                doesn't render, same as closingParagraphs. A flat array, one
                row per line item, in display order:
                  paymentPlan: [
                    { percent: 15, label: "Reservation" },
                    { percent: 15, label: "Upon Sale Agreement" },
                    { percent: 50, label: "During construction (spread over 18 months)" },
                    { percent: 20, label: "Before or upon handover" },
                    { percent: 0, label: "Interest" }
                  ]
                Percentages aren't validated against 100 — copy the
                developer's actual schedule as given.
   ============================================================================ */

window.SELLAM_PROPERTIES = [
  /* ---------------------------------------------------------------- FEATURED
     Listed for BOTH sale and rent — they appear on the premium listing AND
     automatically on the rent page via `letting: "both"`. */

  {
    id: "sl-001",
    slug: "silva-gigiri-residences",
    status: "available",
    collection: "featured",
    title: "Silva Gigiri Residences",
    summary: "Silva Gigiri offers internationally branded luxury residences near the UN Headquarters, blending contemporary design, resort-style amenities, and a prestigious Gigiri address for exceptional living, premium rental demand, and long-term investment in Nairobi.",
    propertyType: "apartment",
    community: "gigiri",
    location: "Gigiri, Nairobi",
    letting: "sale",
    // Two floor plans in this development — see data/property-units.js for
    // how the rest of the site reads bedrooms/bathrooms/price off `units`.
    // NOTE: salePrice is identical for both units in the source data (both
    // 5,000,000) — flagging in case the 2-bedroom price was meant to differ.
    units: [
      { unitType: "studio", bedrooms: 0, bathrooms: 1, salePrice: 2000000, rentPrice: null },
      { unitType: "1-bedroom", bedrooms: 1, bathrooms: 3, salePrice: 13000000, rentPrice: null },
      { unitType: "2-bedroom", bedrooms: 2, bathrooms: 2, salePrice: 20000000, rentPrice: null },
      
    ],
    features: ["pool", "garden", "security", "parking", "backup-generator", "gym", "wifi", "restaurant", "spa", "lounge" ],
    image: "assets/images/Silva Gigiri Residences Exterior.jpeg",
    heroImage: "assets/images/Silva Gigiri Residences Living room.jpeg",
    gallery: [
      "assets/images/Silva Gigiri Residences Gym (2).jpeg",
      "assets/images/Silva Gigiri Residences Living room.jpeg",
      "assets/images/Silva Gigiri Residences Bedroom.jpeg",
      "assets/images/Silva Gigiri Residences Kitchen.jpeg",
      "assets/images/Silva Gigiri Residences Outdoors.jpeg",
      "assets/images/Silva Gigiri Residences Washrooms.jpeg",
      "assets/images/Silva Gigiri Residences Swimming pool.jpeg",
      "assets/images/property-detail-gym.jpg"
      ],

    url: "silva-gigiri-residences",
    description: "An Internationally Branded Residential Sanctuary. Set within Nairobi's prestigious diplomatic enclave, Silva Gigiri redefines contemporary residential living through an exceptional blend of architecture, hospitality, and nature. Positioned moments from the United Nations Headquarters, international embassies, Village Market, and Karura Forest, the development offers a rare opportunity to own a home in one of East Africa's most established and secure addresses. Every residence is thoughtfully designed to deliver refined living, long-term investment value, and the service standards of a globally recognised hospitality brand.",
    featureLocation: "2 Minutes to Westgate Shopping Mall, 3 Minutes to Sarit Centre, 5 Minutes to Westlands CBD, Near The Oval, Delta Corner & major corporate offices, Close to Aga Khan University Hospital",
    story: {
      rows: [
        { title: "Thoughtfully Crafted Residences", 
          body: "Silva's collection of studio, one-bedroom, two-bedroom, and penthouse residences is designed around intentional living. Expansive layouts, abundant natural light, premium finishes, and seamless indoor-outdoor flow create elegant homes that balance comfort, privacy, and timeless design. Every residence has been carefully composed to complement the surrounding forest landscape while delivering sophisticated urban living." },
        { title: "Hospitality-Inspired Living", 
          body: "Beyond the residence, Silva offers an elevated lifestyle shaped by internationally branded hospitality. Residents enjoy attentive service, exceptional security, professionally managed communal spaces, and wellness-focused amenities that transform everyday living into a resort-inspired experience. Private ownership is complemented by the comfort, convenience, and confidence of world-class residential management." },
        { title: "Wellness & Lifestyle", 
          body: "Every shared space has been designed to promote wellbeing, connection, and tranquillity. Landscaped botanical gardens, an infinity swimming pool, wellness facilities, curated social spaces, and immersive green surroundings provide an environment where residents can relax, work, entertain, and reconnect with nature without leaving home." },
        { title: "An Address of Enduring Value", 
          body: "Gigiri remains one of Nairobi's most sought-after residential locations, renowned for its diplomatic presence, international institutions, premier schools, and proximity to world-class lifestyle amenities. Silva combines this exceptional location with internationally branded management and timeless architectural design, creating a residence that appeals equally to homeowners, expatriates, and investors seeking long-term capital appreciation and premium rental demand." }
      ]
    },
    listedDate: "2026-07-22",
    featureHighlights: [
  { title: "Location:", text: "proximity to Westlands, Gigiri, Upper Hill, international schools, leading hospitals, and premium retail destinations" },
  { title: "Security:", text: "24-hour security with controlled access" },
  { title: "Connectivity:", text: "High-speed lifts, Full backup power for common areas" },
  { title: "Community:", text: "Residents' clubhouse, Children's play areas, Sky entertainment spaces" },
  { title: "Amenities:", text: "Infinity swimming pool,Restaurant & café, Business lounge, Landscaped gardens" },
  { title: "Wellness:", text: "Fully equipped fitness centre, Yoga & wellness studio,Spa & sauna" }
],
    closingParagraphs: "Silva Gigiri Residences represents a rare opportunity to own in one of Nairobi's most established diplomatic and residential enclaves, with limited units remaining across the current release.\n\nOur sales team can arrange a private site visit and walk you through the available floor plans, payment structures, and projected rental returns."
  },

  {
    id: "sl-002",
    slug: "cheval-riverside",
    status: "available",
    collection: "featured",
    title: " Cheval Riverside",
    summary: "Experience luxury living at Cheval Riverside, offering contemporary residences, premium amenities, and a prestigious Riverside Drive address near Westlands, delivering exceptional comfort, connectivity, and investment potential in Nairobi.",
    propertyType: "villa",
    community: "riverside",
    location: "Riverside, Nairobi",
    letting: "sale",
    units: [
      { bedrooms: 1, bathrooms: 1, salePrice: 9900000, rentPrice: null },
      { bedrooms: 2, bathrooms: 2, salePrice: 10000000, rentPrice: null },
      { bedrooms: 3, bathrooms: 3, salePrice: 15000000, rentPrice: null }
    ],
    features: ["pool", "garden", "security", "parking", "backup-generator"],
    image: "assets/images/Cheval Riverside Exterior (3).jpeg",
    gallery: [
      "assets/images/Cheval Riverside Couple.jpeg",
      "assets/images/Cheval Riverside.jpeg",
      "assets/images/Cheval Riverside Couple.jpeg",
      "assets/images/Cheval Riverside Exterior (6).jpeg",
      "assets/images/Cheval Riverside Outdoor.jpeg",
      "assets/images/Cheval Riverside Exterior (7).jpeg", /*Large image in the middle*/
      "assets/images/Cheval Riverside Swimming pool.jpeg",
      "assets/images/Cheval Riverside Swimming pool (2).jpeg",
      "assets/images/Cheval Riverside Exterior (2).jpeg"
    ],
    url: "cheval-riverside",
    description: "A New Landmark on Riverside: Inspired by the timeless elegance of luxury yachts, Cheval Riverside introduces a distinctive collection of contemporary residences within one of Nairobi's most prestigious residential addresses. Combining refined architecture, thoughtfully designed interiors, and hospitality-inspired living, the development creates an exceptional environment for homeowners, expatriates, and investors seeking quality, convenience, and enduring value. Positioned along Riverside Drive, residents enjoy immediate access to Westlands, the CBD, Gigiri, international schools, diplomatic missions, premier shopping destinations, and Nairobi's leading business districts, making Cheval Riverside both an outstanding place to live and a compelling long-term investment.",
    featureLocation: "Riverside address near international schools, private clubs, green compounds, and lifestyle destinations.",
    story: {
      rows: [
        { title: "Thoughtfully Designed Residences", 
          body: "Every residence at Cheval Riverside has been carefully planned to maximise natural light, functionality, and contemporary elegance. From intelligently designed one-bedroom apartments to expansive family residences, each home combines efficient layouts with premium finishes, generous living spaces, and floor-to-ceiling glazing that creates a seamless connection between indoor comfort and the surrounding cityscape.Open-plan living and dining areas, designer kitchens, refined bathrooms, and carefully selected materials come together to deliver homes that are both sophisticated and practical for modern urban living." },
        { title: "Contemporary Culinary Spaces", 
          body: "The kitchens reflect a balance of design and functionality, offering premium cabinetry, engineered stone worktops, integrated appliances, generous storage, and efficient layouts that enhance everyday living. Whether preparing family meals or entertaining guests, every detail has been considered to create an elegant and practical culinary environment." },
        { title: "Private Living Spaces", 
          body: "Designed as peaceful retreats from the pace of city life, the bedrooms offer generous proportions, excellent natural lighting, carefully planned wardrobes, and premium finishes throughout. Selected residences feature en-suite bedrooms, private balconies, and flexible layouts that accommodate both owner-occupiers and investment buyers seeking long-term rental appeal." },
        { title: "Wellness & Lifestyle", 
          body: "Cheval Riverside extends beyond the private residence to create a complete lifestyle experience. Residents enjoy carefully curated wellness, leisure, and social spaces designed to support modern urban living, relaxation, and community." }
      ]
    },
    listedDate: "2026-07-22",

     featureHighlights: [
  { title: "Location:", text: "proximity to Westlands, Gigiri, Upper Hill, international schools, leading hospitals, and premium retail destinations" },
  { title: "Security:", text: "24-hour security with controlled access" },
  { title: "Connectivity:", text: "High-speed lifts, Full backup power for common areas" },
  { title: "Community:", text: "Residents' clubhouse, Children's play areas, Sky entertainment spaces" },
  { title: "Amenities:", text: "Infinity swimming pool,Restaurant & café, Business lounge, Landscaped gardens" },
  { title: "Wellness:", text: "Fully equipped fitness centre, Yoga & wellness studio,Spa & sauna" }
],
    closingParagraphs: "Riverside has long been recognised as one of Nairobi's most desirable residential neighbourhoods. Characterised by mature tree-lined avenues, diplomatic residences, international organisations, premium office developments, and excellent connectivity, the location continues to attract homeowners, expatriates, multinational executives, and institutional investors.\n\nCheval Riverside has been conceived to deliver lasting value through exceptional location, distinctive architecture, and professionally managed amenities. The combination of strong rental demand, limited supply within Riverside, and premium lifestyle offerings creates an investment opportunity suited to both capital appreciation and stable rental income."
  },

{
    id: "sl-003",
    slug: "diplomat-residences",
    status: "available",
    collection: "featured",
    title: "Diplomat Residences",
    summary: "Diplomat Residences offers executive apartments on Peponi Road, Westlands, combining hotel-inspired living, premium amenities, and a prime location near diplomatic hubs, delivering exceptional comfort, convenience, and long-term investment value.",
    propertyType: "apartment",
    community: "westlands",
    location: "Peponi Road, Westlands, Nairobi",
    letting: "sale",
    // Two floor plans in this development — see data/property-units.js for
    // how the rest of the site reads bedrooms/bathrooms/price off `units`.
    // NOTE: salePrice is identical for both units in the source data (both
    // 5,000,000) — flagging in case the 2-bedroom price was meant to differ.
    units: [
      { bedrooms: 1, bathrooms: 3, salePrice: 5000000, rentPrice: null },
      { bedrooms: 2, bathrooms: 3, salePrice: 10000000, rentPrice: null }
      
    ],
    features: ["pool", "garden", "security", "parking", "backup-generator", "gym", "wifi", "restaurant", "spa", "lounge" ],
    image: "assets/images/Diplomat Residences Exterior (2).jpeg",
    gallery: [
      "assets/images/Diplomat Residences Exterior (4).jpeg",
      "assets/images/Diplomat Residences Living.jpeg",
      "assets/images/Diplomat Residences Kitchen.jpeg",
      "assets/images/Diplomat Residences Bedroom.jpeg",
      "assets/images/Diplomat Residences (18).jpeg",
      "assets/images/Diplomat Residences Tennis Court.jpeg",
      "assets/images/Diplomat Residences Swimming.jpeg",
      "assets/images/Diplomat Exterior (5).jpeg",
      "assets/images/Diplomat Exterior.jpeg",
      "assets/images/Diplomat Residences (12).jpeg",
      "assets/images/Diplomat Residences Lounge (3).jpeg",
       "assets/images/Diplomat Residences Dinning.jpeg",
        "assets/images/Diplomat Residences Lounge.jpeg"
      ],

    url: "diplomat-residences",
    description: "Executive Living, Reimagined: Diplomat Residences introduces a new benchmark for executive living along Peponi Road, where the sophistication of a luxury hotel meets the comfort and permanence of home. Developed by Wonder Properties and professionally managed with a hospitality-first approach, the development has been conceived for professionals, diplomats, expatriates, and investors seeking an exceptional residential experience in one of Nairobi's most established addresses. Positioned moments from Westgate Mall, Sarit Centre, leading international schools, hospitals, diplomatic missions, and the Westlands business district, Diplomat Residences offers a lifestyle defined by convenience, connectivity, and enduring value.",
    featureLocation: "2 Minutes to Westgate Shopping Mall, 3 Minutes to Sarit Centre, 5 Minutes to Westlands CBD, Near The Oval, Delta Corner & major corporate offices, Close to Aga Khan University Hospital",
    story: {
      rows: [
        { title: "Contemporary Residences", 
          body: "Every residence has been thoughtfully designed to maximise natural light, functionality, and everyday comfort. From intelligently planned mini one-bedroom apartments to spacious two-bedroom residences, each home features refined interiors, open-plan living spaces, quality finishes, generous glazing, and carefully considered layouts that support modern urban lifestyles while maintaining a sense of warmth and privacy." },
        { title: "Modern Culinary Spaces", 
          body: "Designed for contemporary living, each kitchen combines elegant finishes with practical functionality. Quality cabinetry, durable work surfaces, integrated storage, and efficient layouts create an environment equally suited to everyday living and entertaining, while complementing the refined architectural character of every residence." },
        { title: "Comfortable Private Retreats", 
          body: "The bedrooms provide calm and comfortable private spaces, designed with generous proportions, quality finishes, built-in wardrobes, and abundant natural light. Thoughtful planning ensures every residence balances functionality with modern elegance, creating homes that appeal equally to owner-occupiers and long-term investors." },
        { title: "Hospitality-Inspired Lifestyle", 
          body: "Diplomat Residences extends well beyond the private apartment, creating an environment where hospitality and everyday living seamlessly come together. Carefully curated resident facilities promote wellness, productivity, relaxation, and community, delivering a lifestyle comparable to that of an internationally managed hotel while preserving the privacy of home ownership." }
      ]
    },
    listedDate: "2026-07-22",
    featureHighlights: [
  { title: "Location:", text: "proximity to Westlands, Gigiri, Upper Hill, international schools, leading hospitals, and premium retail destinations" },
  { title: "Security:", text: "24-hour security and controlled access" },
  { title: "Connectivity:", text: "Modern high-speed elevators, Backup power, Smart home technology" },
  { title: "Community:", text: "Rooftop swimming pool, Children's playground, Grand hotel-style arrival lobby, Rooftop restaurant " },
  { title: "Amenities:", text: "Backup power,Borehole water supply,Heated water system,Ample resident parking, Meeting room and business facilities" },
  { title: "Wellness:", text: "Fully equipped fitness centre" }
],

     closingParagraphs: "Peponi Road remains one of Nairobi's most established residential corridors, renowned for its mature surroundings, diplomatic presence, excellent connectivity, and proximity to leading commercial, retail, educational, and healthcare facilities. Residents enjoy immediate access to Westgate Mall, Sarit Centre, Westlands CBD, Gigiri, international schools, and major transport routes, making the development equally attractive for homeowners and international tenants. \n\nCombining a prime Westlands location, hospitality-led management, contemporary architecture, and executive-focused amenities, Diplomat Residences presents a compelling opportunity for both homeowners and investors. Strong demand from professionals, expatriates, diplomatic personnel, and corporate tenants supports long-term rental performance, while the development's quality, location, and management philosophy position it for sustained capital appreciation over time."
  },



  {
    id: "sl-004",
    slug: "gaia-brookside-forest-nairobi",
    status: "available",
    collection: "featured",
    title: "Gaia Brookside Forest",
    summary: "Gaia Brookside Forest offers luxury family residences in Westlands, featuring spacious contemporary homes, nature-inspired living, premium amenities, and seamless access to Gigiri, international schools, and Nairobi's leading business and lifestyle destinations.",
    propertyType: "apartment",
    community: "westlands",
    location: "Brookside, Westlands, Nairobi", 
    letting: "sale",
    // Two floor plans in this development — see data/property-units.js for
    // how the rest of the site reads bedrooms/bathrooms/price off `units`.
    // NOTE: salePrice is identical for both units in the source data (both
    // 5,000,000) — flagging in case the 2-bedroom price was meant to differ.
    units: [
      { bedrooms: 3, bathrooms: 3, salePrice: 25000000, rentPrice: null },
      { bedrooms: 4, bathrooms: 3, salePrice: 50000000, rentPrice: null },
      { bedrooms: 5, bathrooms: 3, salePrice: 60000000, rentPrice: null }
      
    ],
    features: ["pool", "gym", "wifi", "security", "parking"],
    image: "assets/images/Gaia Brookside Forest Exterior (6).jpeg",
    gallery: [
      "assets/images/Gaia Brookside Forest Bedroom (2).jpeg",
      "assets/images/Gaia Brookside Forest Living Room.jpeg",
      "assets/images/Gaia Brookside Forest Dinning.jpeg",
      "assets/images/Gaia Brookside Forest (8).jpeg",
      "assets/images/Gaia Brookside Forest Gym.jpeg",
      "assets/images/Gaia Brookside Forest Exterior (2).jpeg",
      "assets/images/Gaia Brookside Forest Swimming pool.jpeg",
      "assets/images/Gaia Brookside Forest.jpeg",
      "assets/images/Gaia Brookside Forest Exterior (3).jpeg",
      "assets/images/Gaia Brookside Forest Exterior (5).jpeg",
      "assets/images/Gaia Brookside Forest Gym (2).jpeg",
      "assets/images/Gaia Brookside Forest (3).jpeg",
      "assets/images/Gaia Brookside Forest (13).jpeg",
      "assets/images/Gaia Brookside Forest Exterior.jpeg",
      "assets/images/Gaia Brookside Forest (7).jpeg"


    
    ],
    url: "gaia-brookside-forest-nairobi",
    description: "Nature-Inspired Family Living: Nestled along the leafy Brookside Gardens Drive in Westlands, Gaia Brookside Forest introduces a new vision of contemporary family living where architecture, nature, and wellness exist in harmony. Developed by Wonder Properties, the project has been thoughtfully designed for homeowners seeking expansive living spaces, refined finishes, and a lifestyle centred on comfort, privacy, and community.",
    featureLocation: "Karen location with proximity to schools, shopping, clubs, hospitals, and calm residential streets.",
    story: {
      rows: [
        { title: "Expansive Contemporary Residences", 
          body: "Every residence has been designed with generous proportions, intelligent layouts, and abundant natural light to create homes that adapt effortlessly to modern family life. Spacious living and dining areas flow seamlessly into large balconies, while premium finishes, all en-suite bedrooms, and thoughtfully integrated storage provide comfort, elegance, and everyday functionality. Selected residences include Domestic Staff Quarters (DSQ), while exclusive penthouses offer elevated living with enhanced privacy and panoramic views of the surrounding neighbourhood." },
        { title: "Elegant Culinary Spaces", 
          body: "The kitchens have been designed to combine refined aesthetics with everyday practicality. Premium cabinetry, generous work surfaces, integrated storage, and contemporary finishes create sophisticated spaces where cooking, entertaining, and family gatherings naturally come together." },
        { title: "Private Family Retreats", 
          body: "Every bedroom is thoughtfully planned as a private sanctuary, offering generous layouts, en-suite bathrooms, quality finishes, and carefully considered storage. The principal suites provide spacious walk-in wardrobes and elegant bathrooms, delivering a calm and luxurious environment designed for everyday comfort." },
        { title: "Wellness, Recreation & Community", 
          body: "Gaia Brookside Forest has been conceived as more than a residential development—it is a complete lifestyle destination. Landscaped courtyards, wellness facilities, sports amenities, and family-focused social spaces encourage residents to relax, connect, and enjoy an active, balanced way of life. The carefully curated amenities support every generation, from children's recreation to fitness, business, and leisure, creating a community where modern urban living meets the tranquillity of nature." }
      ]
    },
    listedDate: "2026-07-23",

    featureHighlights: [
  { title: "Security:", text: "24-hour security and controlled access" },
  { title: "Connectivity:", text: "Smart access systems,High-speed elevators,Ample resident parking" },
  { title: "Community:", text: "Infinity swimming pool, Outdoor jacuzzis, Residents' lounge,Business centre,Private library & quiet reading lounge,Cinema,Landscaped gardens & courtyards,Jogging & walking track,Basketball court,Padel court,Games & recreation areas,Children's day care,Beauty salon,In-building retail convenience store and Laundry services" },
  { title: "Amenities:", text: "Backup power,Borehole water supply,Heated water system,Ample resident parking, Meeting room and business facilities" },
  { title: "Wellness:", text: "Fully equipped fitness centre,Spa & wellness centre,Yoga studio and Health bar" }
],

  closingParagraphs: "Brookside remains one of Nairobi's most established residential neighbourhoods, recognised for its mature tree-lined environment, low-density character, and exceptional connectivity. Residents enjoy convenient access to Westlands, Gigiri, Riverside, Lavington, international schools, healthcare facilities, premium shopping centres, and leading commercial districts, making Brookside one of the city's most desirable addresses for families and professionals alike. \n\nGaia Brookside Forest brings together spacious family residences, thoughtfully curated amenities, and a prime Westlands location to create a compelling long-term investment. The combination of limited large-format homes, strong owner-occupier demand, and the continued growth of Brookside as a premier residential neighbourhood positions the development for sustained capital appreciation and resilient rental performance."
  },

  {
    id: "sl-005",
    slug: "hephé-palace",
    status: "available",
    collection: "exclusive",
    title: "Hephé Palace",
    summary: "Hephé Palace offers luxury residences in Westlands, Nairobi, featuring contemporary design, premium amenities, and a prime location near Westgate, Sarit Centre, and GTC, delivering exceptional lifestyle, convenience, and long-term investment value.",
    propertyType: "mansion",
    community: "lower-kabete",
    location: "Westlands, Nairobi",
    letting: "sale",
    // Two floor plans in this development — see data/property-units.js for
    // how the rest of the site reads bedrooms/bathrooms/price off `units`.
    // NOTE: salePrice is identical for both units in the source data (both
    // 5,000,000) — flagging in case the 2-bedroom price was meant to differ.
    units: [
      { unitType: "studio", bedrooms: 0, bathrooms: 1, salePrice: 6200000, rentPrice: null},
      {unitType: "1-bedroom", bedrooms: 1, bathrooms: 3, salePrice: 8000000, rentPrice: null},
      {unitType: "2-bedroom", bedrooms: 2, bathrooms: 3, salePrice: 9000000, rentPrice: null},
      {unitType: "3-bedroom", bedrooms: 3, bathrooms: 3, salePrice: 10000000, rentPrice: null},
    ],
    features: ["pool", "gym", "wifi", "security", "parking", "backup-generator", "garden"],
    image: "assets/images/Hephé Palace Swimming Pool (2).jpeg",
    gallery: [
      "assets/images/Hephé Palace (6).jpeg",
      "assets/images/Hephé Palace Living room (3).jpeg",
      "assets/images/Hephé Palace  Dinning (2).jpeg",
      "assets/images/Hephé Palace Living room.jpeg",
      "assets/images/Hephé Palace Swimming Pool (2).jpeg",
      "assets/images/Hephé Palace Swimming Pool.jpeg",
      "assets/images/Hephé Palace Washroom (2).jpeg",
      "assets/images/Hephé Palace Bedroom (2).jpeg",
      "assets/images/Hephé Palace Exterior.jpeg",
      "assets/images/Hephé Palace (12).jpeg",
      "assets/images/Hephé Palace Washroom (3).jpeg",
      "assets/images/Hephé Palace Bedroom.jpeg",
      "assets/images/Hephé Palace Bedroom (2).jpeg"
    ],
    url: "hephé-palace",
    description: "Modern Grandeur. Lasting Value.Rising in the heart of Westlands, Hephé Palace is a landmark residential development inspired by timeless architecture and contemporary luxury. Designed around light, space, and refined living, the development brings together elegant residences, exceptional lifestyle amenities, and one of Nairobi's most connected addresses to create a destination for homeowners and investors alike. Positioned just moments from Westgate Mall, Sarit Centre, GTC, and Karura Forest, Hephé Palace places the city's finest conveniences within easy reach.",
    featureLocation: "Lower Kabete address with access to Westlands, schools, private clubs, and established family neighborhoods.",
    /* Bespoke narrative content, hand-authored for this property — preserved
       exactly as it existed on the standalone page (images map to gallery
       indices 1, 2, 3, 4; wide = 5; pair = 6, 7). */
    story: {
      rows: [
        { title: "Thoughtfully Crafted Residences", body: "From efficiently designed studios to expansive three-bedroom homes, every residence has been planned to maximise natural light, generous proportions, and functional living. Open-plan interiors, floor-to-ceiling glazing, spacious balconies, and carefully selected finishes create homes that are both elegant and enduring." },
        { title: "PrivatContemporary Culinary Spaces", body: "Every kitchen is designed as an extension of the living space, combining clean architectural lines with premium finishes and practical functionality. Integrated layouts, quality cabinetry, and thoughtfully planned storage provide a refined setting for everyday living and effortless entertaining." },
        { title: "Private Sanctuaries", body: "Designed to offer comfort and tranquillity, each bedroom provides generous space, abundant natural light, and refined finishes. Principal residences feature spacious layouts and carefully considered details that create calm, sophisticated retreats from the pace of city life." },
        { title: "Elevated Lifestyle", body: "Hephé Palace transforms everyday living through a carefully curated collection of hospitality-inspired amenities. From rooftop wellness experiences to vibrant social spaces, every facility has been designed to encourage relaxation, recreation, and connection while delivering the comfort of a luxury residence." }
      ]
    },
    listedDate: "2026-07-23",

  featureHighlights: [
  { title: "Security:", text: "24-hour security & CCTV" },
  { title: "Connectivity:", text: "High-speed elevators,Full backup power and Smart access control" },
  { title: "Community:", text: "Restaurant & bar, Outdoor lounge spaces, Concierge reception, Children's play area, Mini golf, Padel court, Games & entertainment lounge" },
  { title: "Amenities:", text: "Heated rooftop infinity swimming pool, Courtyard swimming pool, Sky garden & rooftop terrace" },
  { title: "Wellness:", text: "Fully equipped gym and Yoga studio" }
],

  closingParagraphs: "Situated along Ring Road in Westlands, Hephé Palace enjoys one of Nairobi's most prestigious and well-connected locations. Residents are minutes from Westgate Mall, Sarit Centre, GTC, leading international schools, world-class healthcare facilities, premium restaurants, and major business districts, making it an address equally suited to modern city living and long-term investment. \n\n Hephé Palace combines timeless architecture, exceptional amenities, and a prime Westlands location to create a compelling investment opportunity. Flexible payment plans, strong rental demand, and the continued growth of Westlands as Nairobi's premier mixed-use district position the development for sustained capital appreciation and attractive rental returns."
  },

  {
    id: "sl-006",
    slug: "amethyst-residences",
    status: "available",
    collection: "exclusive",
    title: "Amethyst Residences",
    summary: "Amethyst offers contemporary apartments in Kilimani, Nairobi, combining elegant design, premium amenities, and exceptional connectivity to deliver sophisticated urban living and strong long-term investment potential in one of the city's most desirable locations.",
    propertyType: "mansion",
    community: "kilimani",
    location: "Denis Prit Road, Kilimani, Nairobi",
    letting: "sale",
    // Two floor plans in this development — see data/property-units.js for
    // how the rest of the site reads bedrooms/bathrooms/price off `units`.
    // NOTE: salePrice is identical for both units in the source data (both
    // 5,000,000) — flagging in case the 2-bedroom price was meant to differ.
    units: [
      { bedrooms: 1, bathrooms: 3, salePrice: 7000000, rentPrice: null },
      { bedrooms: 2, bathrooms: 3, salePrice: 10500000, rentPrice: null }
           
    ],
    features: ["pool", "gym", "garden", "security", "parking", "backup-generator"],
    image: "assets/images/Amethyst Residences Outdoors.jpeg",
    gallery: [
      "assets/images/Amethyst Residences (10).jpeg",
      "assets/images/Amethyst Residences Living Room (2).jpeg",
      "assets/images/Amethyst Residences Dinning (2).jpeg",
      "assets/images/Amethyst Residences Bedroom (2).jpeg",
      "assets/images/Amethyst Residences Outdoors (2).jpeg",
      "assets/images/Amethyst Residences Swimming Pool (2).jpeg",
      "assets/images/Amethyst Residences (9).jpeg",
      "assets/images/Amethyst Residences Living Room.jpeg",
      "assets/images/Amethyst Residences Bedroom.jpeg",
      "assets/images/Amethyst Residences Exterior (5).jpeg",
      "assets/images/Amethyst Residences Lounge.jpeg",
      "assets/images/Amethyst Residences Exterior (4).jpeg"
    ],
    url: "amethyst-residences",
    description: {
      title: "The Future of Kilimani Living.",
      body: "Positioned along Maalim Juma Road in the heart of Kilimani, Amethyst introduces a refined collection of contemporary residences designed for modern city living. Developed with a focus on timeless architecture, intelligent design, and everyday functionality, Amethyst creates a residential experience where elegant spaces, premium amenities, and exceptional connectivity come together in one of Nairobi's most established neighbourhoods. Whether purchasing your first home or expanding your investment portfolio, Amethyst offers a compelling balance of lifestyle and long-term value."
    },
    featureLocation: "Ngong address with access to schools, shopping, transport links, and green residential settings.",
    story: {
      rows: [
        { title: "Thoughtfully Designed Residences", body: "Every residence has been carefully planned to maximise natural light, efficient layouts, and comfortable living. Expansive windows, open-plan interiors, spacious balconies, and refined finishes create homes that feel bright, functional, and effortlessly sophisticated, while maintaining the flexibility demanded by modern urban lifestyles." },
        { title: "Contemporary Culinary Spaces", body: "Designed as a natural extension of the living area, each kitchen combines clean architectural lines with quality cabinetry, durable worktops, and practical layouts. Every detail has been considered to create an environment equally suited to everyday living and entertaining." },
        { title: "Private Sanctuaries", body: "The bedrooms offer calm, light-filled spaces designed for comfort and privacy. Generous layouts, elegant finishes, built-in storage, and carefully considered proportions create peaceful retreats that complement the development's understated design philosophy." },
        { title: "Elevated Lifestyle", body: "Life at Amethyst extends beyond the residence. Every shared space has been thoughtfully curated to support wellness, creativity, productivity, and relaxation, creating a community where work, leisure, and everyday living exist in perfect balance. From rooftop experiences overlooking the city skyline to quiet wellness spaces below, every amenity has been designed to enrich the resident experience." }
      ]
    },
    listedDate: "2026-07-23",
     featureHighlights: [
  { title: "Security:", text: "24-hour security & controlled access" },
  { title: "Connectivity:", text: "High-speed elevators" },
  { title: "Community:", text: "Rooftop infinity swimming pool, Skyline rooftop bar & lounge,Rooftop garden,Rooftop pickleball court" },
  { title: "Amenities:", text: "Private cinema,Co-working space,Creative & podcast studio,Residents' lounge,Landscaped courtyard,Children's play area, Elegant reception & arrival lobby" },
  { title: "Wellness:", text: "Fully equipped gym, Yoga studio & sauna, Spa & wellness rooms" }
],

  closingParagraphs: "Located on Maalim Juma Road, Amethyst places residents at the centre of one of Nairobi's most connected urban communities. International schools, leading hospitals, business hubs, cafés, restaurants, shopping destinations including Yaya Centre, Prestige Plaza, and Junction Mall, together with convenient transport links, are all within easy reach, making Kilimani one of Nairobi's most desirable places to live and invest. \n\n Kilimani continues to attract strong residential demand from homeowners, professionals, and investors seeking quality developments in a prime urban location. Combining thoughtful architecture, carefully curated amenities, and excellent connectivity, Amethyst is designed to deliver lasting appeal through both capital appreciation and sustained rental demand."
  },

  {
    id: "sl-007",
    slug: "dg-west",
    status: "available",
    collection: "featured",
    title: "DG West",
    summary: "DG West offers luxury hotel apartments for sale in Westlands, Nairobi, featuring premium amenities, flexible payment plans, strong rental income potential, capital appreciation, and professionally managed modern city living.",
    propertyType: "apartment",
    community: "westlands",
    location: "Sports road, Westlands, Nairobi",
    letting: "sale",
    // Two floor plans in this development — see data/property-units.js for
    // how the rest of the site reads bedrooms/bathrooms/price off `units`.
    // NOTE: salePrice is identical for both units in the source data (both
    // 5,000,000) — flagging in case the 2-bedroom price was meant to differ.
    units: [
      { unitType: "studio", bedrooms: 0, bathrooms: 1, salePrice: 11700000, rentPrice: null },
      { unitType: "1-bedroom", bedrooms: 1, bathrooms: 3, salePrice: 13000000, rentPrice: null },
      { unitType: "2-bedroom", bedrooms: 2, bathrooms: 2, salePrice: 20000000, rentPrice: null },
      
    ],
    
    image: "assets/images/Dg West (11).jpeg",
    heroImage: "assets/images/Dg West (4).jpeg",
    gallery: [
      "assets/images/Dg West (6).jpeg",
      "assets/images/Dg West (3).jpeg",
      "assets/images/Dg West (8).jpeg",
      "assets/images/Dg West (9).jpeg",
      "assets/images/Dg West (10).jpeg",
      "assets/images/Dg West (11).jpeg",
      "assets/images/Dg West (12).jpeg",
      "assets/images/Dg West (13).jpeg"
      ],

    url: "dg-west",
    description: {
      title: "Where Investment Meets Lifestyle:",
      body: "Situated along the vibrant Sports Road in the heart of Westlands, DG West introduces a new generation of luxury hotel and residential apartments designed for contemporary city living. Developed by Reportage Kenya, the landmark tower combines sophisticated residences, premium hospitality services, and world-class lifestyle amenities in one of Nairobi's most established commercial and residential districts. Whether purchasing a city residence or an income-generating investment, DG West offers a compelling opportunity in one of East Africa's fastest-growing property markets."
    },
    featureLocation: "2 Minutes to Westgate Shopping Mall, 3 Minutes to Sarit Centre, 5 Minutes to Westlands CBD, Near The Oval, Delta Corner & major corporate offices, Close to Aga Khan University Hospital",
    story: {
      rows: [
        { title: "Contemporary Urban Residences", 
          body: "Every residence has been carefully planned to maximise comfort, efficiency, and modern living. Intelligent layouts, expansive glazing, quality finishes, and open-plan interiors create bright, functional homes that complement today's urban lifestyle. From stylish studio apartments to spacious two-bedroom residences, every home reflects thoughtful design and lasting quality." },
        { title: "Modern Culinary Spaces", 
          body: "The kitchens blend elegant finishes with everyday functionality, featuring premium cabinetry, quality worktops, integrated appliances, and practical layouts that make cooking and entertaining equally enjoyable. Contemporary detailing and efficient use of space ensure every residence feels refined and welcoming." },
        { title: "Comfortable Private Retreats", 
          body: "Designed for comfort and relaxation, every bedroom offers generous natural light, quality finishes, built-in wardrobes, and carefully considered layouts. Selected residences enjoy panoramic city views, creating peaceful spaces above the energy of Westlands." },
        { title: "Hospitality-Inspired Living", 
          body: "DG West extends beyond the residence to deliver a complete lifestyle experience. Residents enjoy professionally managed amenities that support wellness, productivity, recreation, and everyday convenience, creating an environment where luxury living and hospitality seamlessly come together." }
      ]
    },
    listedDate: "2026-07-22",
    featureHighlights: [
  { title: "Security:", text: "24-hour security with controlled access" },
  { title: "Connectivity:", text: "High-speed lifts, Full backup power for common areas" },
  { title: "Community:", text: "Children's daycare and Pet daycare" },
  { title: "Amenities:", text: "Infinity swimming pool, jacuzzi,Restaurant & café, Business lounge, Landscaped gardens" },
  { title: "Wellness:", text: "Fully equipped fitness centre, Yoga & wellness facilities and Spa" }
],
    closingParagraphs: "Located on Sports Road, DG West places residents within Nairobi's premier commercial and lifestyle district. Westgate Mall, Sarit Centre, GTC, leading hotels, international offices, healthcare facilities, restaurants, and entertainment venues are all moments away, while excellent connectivity to Gigiri, Upper Hill, the CBD, and Jomo Kenyatta International Airport makes Westlands one of Nairobi's most desirable addresses for both living and investment\n\nDG West has been conceived to meet the growing demand for professionally managed hotel apartments in Nairobi. Combining a prime Westlands location, premium hospitality services, and flexible ownership options, the development is designed to deliver attractive rental income alongside long-term capital appreciation. The developer projects up to 20% annual return on investment, making it particularly appealing to local and international investors seeking passive income opportunities."
  },

   {
    id: "sl-008",
    slug: "dg-jkia-hotel-apartments",
    status: "available",
    collection: "featured",
    title: " DG JKIA Hotel Apartments",
    summary: "DG JKIA offers fully furnished hotel apartments near Jomo Kenyatta International Airport, Nairobi, featuring professional management, premium amenities, strong occupancy potential, hassle-free rental income, and returns of up to 25%.",
    propertyType: "apartment",
    community: "syokimau",
    location: "JKIA | Mombasa Road",
    letting: "sale",
    // Two floor plans in this development — see data/property-units.js for
    // how the rest of the site reads bedrooms/bathrooms/price off `units`.
    // NOTE: salePrice is identical for both units in the source data (both
    // 5,000,000) — flagging in case the 2-bedroom price was meant to differ.
    units: [
      { unitType: "studio", bedrooms: 0, bathrooms: 1, salePrice: 11700000, rentPrice: null },
      { unitType: "1-bedroom", bedrooms: 1, bathrooms: 3, salePrice: 13000000, rentPrice: null },
      
    ],
    
    image: "assets/images/DG JKIA swimming pool.jpeg",
    heroImage: "assets/images/DG JKIA Lounge (6).jpeg",
    gallery: [
      "assets/images/DG JKIA Lounge (3).jpeg",
      "assets/images/DG JKIA Studio.jpeg",
      "assets/images/DG JKIA (8).jpeg",
      "assets/images/DG JKIA Lounge (5).jpeg",
      "assets/images/DG JKIA Salon.jpeg",
      "assets/images/DG JKIA Gym (2).jpeg",
      "assets/images/DG JKIA exterior (3).jpeg",
      "assets/images/DG JKIA boardroom.jpeg"
      ],

    url: "dg-jkia-hotel-apartments",
    description: {
      title: "Hospitality Investment, Redefined:",
      body: "Positioned directly opposite Jomo Kenyatta International Airport along Mombasa Road, DG JKIA introduces a new generation of fully furnished and professionally managed hotel apartments designed for investors seeking consistent returns without the demands of day-to-day property management. Developed through a collaboration between SSS Developers and Reportage Properties, the development combines contemporary residences, premium hospitality services, and an unrivalled airport location to create one of Nairobi's most compelling investment opportunities. With immediate access to the Nairobi Expressway, SGR Terminus, and key business districts, DG JKIA is strategically placed to serve business travellers, airline crews, diplomats, transit passengers, and international visitors."
    },
    featureLocation: "2 Minutes to Westgate Shopping Mall, 3 Minutes to Sarit Centre, 5 Minutes to Westlands CBD, Near The Oval, Delta Corner & major corporate offices, Close to Aga Khan University Hospital",
    story: {
      rows: [
        { title: "Fully Furnished Contemporary Residences", 
          body: "Every apartment is delivered fully furnished and serviced, allowing investors to begin generating income without the need for additional fit-out. Available in four intelligently designed layouts, each residence combines efficient planning, premium finishes, private balconies, integrated wardrobes, double-glazed windows, high-speed internet connectivity, and modern interiors designed for short and extended stays." },
        { title: "Designed for Effortless Living", 
          body: "Every residence has been thoughtfully equipped to meet international hospitality standards. Contemporary kitchens, quality imported sanitary ware, gypsum ceilings, solar-heated water systems, and elegant finishes create comfortable spaces that balance functionality with modern design, ensuring a seamless experience for every guest." },
        { title: "A Professionally Managed Hospitality Experience", 
          body: "DG JKIA has been conceived as a hospitality-led investment rather than a conventional apartment development. Experienced hotel operators oversee the day-to-day management of the property, allowing owners to benefit from a professionally operated rental programme while enjoying hassle-free ownership. The pooled income model is designed to maximise occupancy and deliver consistent long-term performance." }
        
      ]
    },
    listedDate: "2026-07-22",
    featureHighlights: [
  { title: "Security:", text: "24-hour security with controlled access" },
  { title: "Connectivity:", text: "High-speed Wi-Fi, High-speed elevators" },
  { title: "Community:", text: "Bar & lounge and Landscaped gardens" },
  { title: "Amenities:", text: "Outdoor swimming pool, Hotel reception & concierge,Elegant arrival lobby" },
  { title: "Wellness:", text: "Rooftop yoga garden,Fully equipped fitness centre, Spa, massage rooms, steam & sauna" }
],
    closingParagraphs: "Located opposite Hilton Garden Inn JKIA, DG JKIA enjoys one of Nairobi's most strategic addresses. Residents and guests are only minutes from JKIA, the Nairobi Expressway, the SGR Terminus, Nairobi National Park, Capital Centre, Upper Hill, and Westlands, making the development an ideal base for international travellers and business professionals alike.\n\nDG JKIA has been purpose-built for investors seeking stable, professionally managed hospitality income. The combination of a globally connected airport location, fully furnished residences, hotel management, and a growing demand for quality accommodation places the development in a strong position for sustained occupancy and long-term capital growth. According to the developer, the project is structured to target up to 23% net ROI, while Reportage highlights investment potential of 25%+, reflecting the project's hospitality-focused model.",
    // Flexible off-plan payment schedule — see paymentPlan field reference
    // above. OPTIONAL: most properties omit this entirely.
    paymentPlan: [
      { percent: 15, label: "Reservation" },
      { percent: 15, label: "Upon Sale Agreement" },
      { percent: 50, label: "During construction (spread over 18 months)" },
      { percent: 20, label: "Before or upon handover" },
      { percent: 0, label: "Interest" }
    ]
  },
  
  {
    id: "sl-009",
    slug: "4-bedroom-luxury-villas-runda",
    status: "available",
    collection: "featured",
    title: "4 Bedroom Luxury Villas-Runda",
    summary: "Luxury 4-bedroom villas for sale in Runda, Nairobi, featuring en-suite bedrooms, private lifts, Bosch kitchens, smart infrastructure, premium finishes, 24-hour security, and Karura Forest views.",
    propertyType: "villa",
    community: "runda",
    location: "UN Blue Zone, Runda, Nairobi",
    letting: "sale",
    // Four individually-priced villas of the same floor-plan type, sized
    // and priced differently — see the "Residence Availability" table
    // supplied by the client. `residenceLabel`/`area`/`note` are detail-page
    // -only fields read directly by buildPriceRows() in property-detail.js;
    // they don't feed the shared bedroom-count label logic in
    // data/property-units.js, so listing cards still just show "4 Bedrooms".
    units: [
      { unitType: "4-bedroom", bedrooms: 4, bathrooms: 3, residenceLabel: "Villa 1", area: "376 SQM", salePrice: 140000000, rentPrice: null },
      { unitType: "4-bedroom", bedrooms: 4, bathrooms: 3, residenceLabel: "Villa 2", area: "376 SQM", salePrice: 135000000, rentPrice: null },
      { unitType: "4-bedroom", bedrooms: 4, bathrooms: 3, residenceLabel: "Villa 3", area: "377 SQM", salePrice: 150000000, rentPrice: null },
      { unitType: "4-bedroom", bedrooms: 4, bathrooms: 3, residenceLabel: "Villa 4", area: "381 SQM", note: "Fully Furnished", salePrice: 165000000, rentPrice: null }
    ],

    image: "assets/images/4 Bedroom Luxury Villas- Runda (4).jpeg",
    heroImage: "assets/images/4 Bedroom Luxury Villas- Runda Living room.jpeg",
    gallery: [
      "assets/images/4 Bedroom Luxury Villas- Runda.jpeg",
      "assets/images/4 Bedroom Luxury Villas- Runda Living room.jpeg",
      "assets/images/4 Bedroom Luxury Villas- Runda Living room (2).jpeg",
      "assets/images/4 Bedroom Luxury Villas- Runda Living room (3).jpeg",
      "assets/images/4 Bedroom Luxury Villas- Runda Kitchen.jpeg",
      "assets/images/4 Bedroom Luxury Villas- Runda Dining area.jpeg",
      "assets/images/4 Bedroom Luxury Villas- Runda Bedroom.jpeg",
      "assets/images/4 Bedroom Luxury Villas- Runda Bedroom (2).jpeg",
      "assets/images/4 Bedroom Luxury Villas- Runda Bedroom (3).jpeg",
      "assets/images/4 Bedroom Luxury Villas- Runda Bedroom (4).jpeg",
      "assets/images/4 Bedroom Luxury Villas- Runda study.jpeg",
      "assets/images/4 Bedroom Luxury Villas- Runda study (2).jpeg",
      "assets/images/4 Bedroom Luxury Villas- Runda (2).jpeg",
      "assets/images/4 Bedroom Luxury Villas- Runda (3).jpeg"
      ],

    url: "4-bedroom-luxury-villas-runda",
    description: {
      body: "Nestled along Tala Road in the heart of Runda, this exclusive collection of four luxury villas offers refined living within one of Nairobi's most prestigious and secure residential neighbourhoods. Bordering the tranquil Karura Forest and positioned within the UN Blue Zone, the development combines privacy, architectural excellence, and exceptional connectivity, just minutes from diplomatic missions, international schools, premier shopping destinations, and world-class healthcare facilities."
    },
    featureLocation: "Borders Karura Forest within the UN Blue Zone in Runda, minutes from diplomatic missions, international schools, and premier shopping destinations.",
     story: {
      rows: [
        { title: "Elegant Family Living", 
          body: "Designed for modern family living, each villa features four generously proportioned en-suite bedrooms, a DSQ, expansive open-plan living and dining areas, and seamless indoor-outdoor spaces that maximize natural light and forest views. With only four residences in the development, homeowners enjoy an exceptional sense of privacy and exclusivity within a low-density setting." },
        { title: "Contemporary Interiors", 
          body: "Every residence is finished to an exceptional standard, combining timeless craftsmanship with modern functionality. Premium finishes include solid mahogany joinery, a fully fitted Bosch kitchen, custom-built wardrobes, elegant spa-inspired bathrooms, and expansive glazing that frames the surrounding greenery while creating bright, inviting interiors throughout the home." },
        { title: "Security & Exclusive Setting", 
          body: "Situated within Nairobi's highly sought-after UN Blue Zone, the development offers one of the city's most secure residential environments. Residents benefit from controlled access, 24-hour security, CCTV surveillance, and an electrified perimeter fence, while the limited collection of just four homes ensures exceptional privacy, tranquillity, and exclusivity." },
          { title: "Prime Runda Location", 
          body: "Ideally positioned for convenience, the development enjoys close proximity to Nairobi's diplomatic corridor, the United Nations Headquarters in Gigiri, and key business districts. Residents are within minutes of leading international schools including International School of Kenya, Rosslyn Academy, and the German School Nairobi, as well as premier healthcare facilities such as Aga Khan University Hospital and MP Shah Hospital. Lifestyle destinations including Village Market, Two Rivers Mall, Muthaiga Golf Club, and Windsor Golf Hotel & Country Club are also easily accessible." }
        
      ]
    },
    listedDate: "2026-07-22",
    featureHighlights: [
      { title: "Security:", text: "Gas Reticulation System" },
      { title: "Design:", text: "Solid Mahogany Joinery, Fully Fitted Bosch Kitchen, Centralised Air Conditioning, Custom Built Wardrobes, * Expansive Balconies, Large Open-Plan Living & Dining Areas, Dedicated DSQ  " },
      { title: "Kitchen:", text: "Fully fitted Bosch kitchens" },
      { title: "Technology:", text: "Smart home infrastructure throughout" },
      { title: "Utilities:", text: "Standby Backup Generator, Solar Water Heating, Filtered Water Storage, " }
    ]
  },

  {
    id: "sl-010",
    slug: "6-bedroom-fully-en-suite-karen",
    status: "available",
    collection: "featured",
    title: "6 Bedroom Fully En-Suite House-Karen",
    summary: "Luxury 4-bedroom villas for sale in Runda, Nairobi, featuring en-suite bedrooms, private lifts, Bosch kitchens, smart infrastructure, premium finishes, 24-hour security, and Karura Forest views.",
    propertyType: "mansion",
    community: "karen",
    location: "Karen, Nairobi",
    letting: "rent",
    // Four individually-priced villas of the same floor-plan type, sized
    // and priced differently — see the "Residence Availability" table
    // supplied by the client. `residenceLabel`/`area`/`note` are detail-page
    // -only fields read directly by buildPriceRows() in property-detail.js;
    // they don't feed the shared bedroom-count label logic in
    // data/property-units.js, so listing cards still just show "4 Bedrooms".
    units: [
      { unitType: "6-bedroom", bedrooms: 6, bathrooms: 7, area: "600 SQM", salePrice: null, rentPrice: 350000 }
     
      
    ],

    image: "assets/images/6-bedroom-fully-en-suite-karen (8).jpeg",
    heroImage: "assets/images/6-bedroom-fully-en-suite-karen (9).jpeg",
    gallery: [
      "assets/images/6-bedroom-fully-en-suite-karen (10).jpeg",
      "assets/images/6-bedroom-fully-en-suite-karen (2).jpeg",
      "assets/images/6-bedroom-fully-en-suite-karen (7).jpeg",
      "assets/images/6-bedroom-fully-en-suite-karen (9).jpeg",
      "assets/images/6-bedroom-fully-en-suite-karen (5).jpeg",
      "assets/images6-bedroom-fully-en-suite-karen.jpeg"
      ],

    url: "6-bedroom-fully-en-suite-karen",
    description: {
      body: "Set within one of Karen's established gated communities, this elegant six-bedroom residence offers generous family living in a secure and tranquil environment. Designed with spacious interiors, quality finishes, and functional living spaces, the home provides an exceptional lifestyle for families, diplomats, and corporate executives seeking comfort, privacy, and convenience in one of Nairobi's most desirable residential addresses."
    },
    featureLocation: "Borders Karura Forest within the UN Blue Zone in Runda, minutes from diplomatic missions, international schools, and premier shopping destinations.",
     story: {
      rows: [
        { title: "Spacious Family Living", 
          body: "Thoughtfully designed across 600 square metres, the residence features expansive living and entertainment spaces complemented by large windows that fill the home with natural light. A grand double-volume lounge with high ceilings and a statement chandelier creates an impressive focal point, while the formal dining area provides an ideal setting for family gatherings and entertaining." },
        { title: "Contemporary Interiors", 
          body: "All six bedrooms are generously proportioned and fully en-suite, offering privacy and comfort for every member of the household. Warm wooden ceiling finishes, built-in wardrobes, and elegant spa-inspired bathrooms with glass shower cubicles and premium fittings create refined living spaces throughout. The spacious primary suite offers ample wardrobe storage and a luxurious en-suite bathroom." },
        { title: "The Culinary Kitchen", 
          body: "Designed to meet the demands of modern family living, the contemporary kitchen features a central island, generous cabinetry, a walk-in pantry, and ample preparation space, creating a practical and elegant environment for everyday cooking and entertaining." },
        { title: "Outdoor Living & Everyday Comfort", 
          body: "The property is complemented by well-maintained outdoor spaces and essential infrastructure that enhance day-to-day living, including a private garden, reliable water supply, and dedicated staff accommodation." }
        
      ]
    },
    listedDate: "2026-07-22",
    featureHighlights: [
      { title: "Security:", text: "24-Hour Security, Secure Gated Community" },
      { title: "Design:", text: "Formal Dining Area, Grand Double-Volume Lounge,High Ceilings, Statement Chandelier, Large Windows with Natural Lighting, Private Garden " },
      { title: "Kitchen:", text: "Modern Kitchen with Island, Walk-In Pantry" },
      { title: "Technology:", text: "Smart home infrastructure throughout" },
      { title: "Utilities:", text: "Borehole Water Supply, Ample Water Storage, Service Charge Included, " }
    ]
  },

  {
    id: "sl-011",
    slug: "5-bedroom-family-residence",
    status: "available",
    collection: "featured",
    title: " 5 Bedroom Family Residence",
    summary: "Luxury 4-bedroom villas for sale in Runda, Nairobi, featuring en-suite bedrooms, private lifts, Bosch kitchens, smart infrastructure, premium finishes, 24-hour security, and Karura Forest views.",
    propertyType: "mansion",
    community: "runda",
    location: "Runda, Nairobi",
    letting: "sale",
    // Four individually-priced villas of the same floor-plan type, sized
    // and priced differently — see the "Residence Availability" table
    // supplied by the client. `residenceLabel`/`area`/`note` are detail-page
    // -only fields read directly by buildPriceRows() in property-detail.js;
    // they don't feed the shared bedroom-count label logic in
    // data/property-units.js, so listing cards still just show "4 Bedrooms".
    units: [
      { unitType: "5-bedroom", bedrooms: 5, bathrooms: 6, area: "2023 SQM", salePrice: 150000000, rentPrice: null }
     
      
    ],

    image: "assets/images/5-bedroom-family-residence (2).jpeg",
    heroImage: "assets/images/5-bedroom-family-residence (5).jpeg",
    gallery: [
      "assets/images/5-bedroom-family-residence.jpeg",
      "assets/images/5-bedroom-family-residence (6).jpeg",
      
      ],

    url: "5-bedroom-family-residence",
    description: {
      body: "Nestled within the prestigious suburb of Runda, this distinguished family residence presents a rare opportunity to own an exceptional home in one of Nairobi's most exclusive addresses. Set on a beautifully landscaped half-acre, the property combines elegant architecture, expansive living spaces, and modern comforts within a private and secure environment, just minutes from Gigiri and the UN diplomatic precinct."
    },
    featureLocation: "Borders Karura Forest within the UN Blue Zone in Runda, minutes from diplomatic missions, international schools, and premier shopping destinations.",
     story: {
      rows: [
        { title: "Elegant Family Living", 
          body: "Designed for contemporary family living, the residence offers generous indoor and outdoor spaces that balance comfort with functionality. Expansive living areas, large windows, and an open veranda overlooking the manicured gardens create bright, welcoming interiors ideal for both everyday living and entertaining." },
        { title: "Refined Interiors", 
          body: "All five bedrooms are generously proportioned and fully en-suite, offering privacy and comfort for every member of the household. The home showcases contemporary architecture complemented by timeless detailing, including a striking white façade, elegant columned verandas, and a terracotta-tiled roof that enhances its enduring appeal." },
        { title: "Lifestyle & Recreation", 
          body: "Created to support modern lifestyles, the residence includes thoughtfully designed spaces for work, wellness, and family living. A dedicated home office provides the ideal professional workspace, while a private gym offers convenience for health and fitness within the comfort of home." },
        { title: "Outdoor Living", 
          body: "Occupying a beautifully landscaped half-acre, the property features mature gardens, expansive lawns, and inviting outdoor spaces designed for relaxation, entertaining, and family activities. The tranquil setting provides both privacy and the flexibility for future enhancements." }
        
      ]
    },
    listedDate: "2026-07-22",
    featureHighlights: [
      { title: "Security:", text: "24-Hour Security, Secure Gated Community" },
      { title: "Design:", text: "Formal Dining Area, Grand Double-Volume Lounge,High Ceilings, Statement Chandelier, Large Windows with Natural Lighting, Private Garden " },
      { title: "Kitchen:", text: "Modern Kitchen with Island, Walk-In Pantry" },
      { title: "Technology:", text: "Smart home infrastructure throughout" },
      { title: "Utilities:", text: "Borehole Water Supply, Ample Water Storage, Service Charge Included, " }
    ]
  },

  {
    id: "sl-012",
    slug: "1-2-acre-land-thigiri-groove",
    status: "available",
    collection: "featured",
    title: "1.2 Acre Land Thigiri Groove",
    summary: "A 1.2-acre residential plot for sale in Thigiri Groove, Nairobi, offering a quiet, secure setting close to Runda and the UN Blue Zone for a private home or development.",
    propertyType: "land",
    community: "thigiri",
    location: "Thigiri Groove, Nairobi",
    letting: "sale",

    // Land is priced by size rather than bedroom count — `residenceLabel`
    // shows the plot size ("1.2 Acres") in place of a bedroom count on the
    // detail page's price table. See buildPriceRows() in property-detail.js.
    units: [
      { residenceLabel: "1.2 Acres", salePrice: 125000000, rentPrice: null }
    ],

    // Land listings use a stripped-down template (see isLandProperty() in
    // property-detail.js) — 1-3 photos, no gallery carousel padding needed.
    image: "assets/images/Thigiri.jpeg",
    gallery: [
      "assets/images/Thigiri.jpeg"
    ],

    url: "1-2-acre-land-thigiri-groove",
    description: {
      body: "✅Ready title, Slightly sloppy, Excellent drainage,  Easily Accessible, Proximity to social amenities like the New Muthaiga Mall"
    },

    listedDate: "2026-07-22"
  },

  {
    id: "sl-013",
    slug: "prime-old-kitisuru-1-1-acre-land",
    status: "available",
    collection: "featured",
    title: "Prime Old kitisuru 1.1 acre land",
    summary: "A 1.1-acre residential plot for sale in Old Kitisuru, Nairobi, offering a quiet, secure setting close to Runda and the UN Blue Zone for a private home or development.",
    propertyType: "land",
    community: "kitisuru",
    location: "Prime Old Kitisuru, Nairobi",
    letting: "sale",

    // Land is priced by size rather than bedroom count — `residenceLabel`
    // shows the plot size ("1.1 Acres") in place of a bedroom count on the
    // detail page's price table. See buildPriceRows() in property-detail.js.
    units: [
      { residenceLabel: "1.1 Acres", salePrice: 250000000, rentPrice: null }
    ],

    // Land listings use a stripped-down template (see isLandProperty() in
    // property-detail.js) — 1-3 photos, no gallery carousel padding needed.
    image: "assets/images/Prime Old kitisuru 1.1 acre land.jpeg",
    gallery: [
      "assets/images/Prime Old kitisuru 1.1 acre land (3).jpeg"      
    ],

    url: "prime-old-kitisuru-1-1-acre-land",
    description: {
      body: "Set within the quiet, established Thigiri Groove neighbourhood bordering Runda, this 1.2-acre plot offers a rare opportunity to secure a generous, ready-to-build parcel in one of Nairobi's most sought-after residential pockets, close to the UN Blue Zone, diplomatic missions, and international schools."
    },

    listedDate: "2026-07-22"
  },

   {
    id: "sl-014",
    slug: "1-acre-land-thigiri-ridge",
    status: "available",
    collection: "featured",
    title: "1 Acre Land Thigiri Ridge", 
    summary: "A 1 acre residential plot for sale in Thigiri Ridge, Nairobi, offering a quiet, secure setting close to Runda and the UN Blue Zone for a private home or development.",
    propertyType: "land",
    community: "thigiri",
    location: "Thigiri Ridge, Nairobi",
    letting: "sale",

    // Land is priced by size rather than bedroom count — `residenceLabel`
    // shows the plot size ("1.2 Acres") in place of a bedroom count on the
    // detail page's price table. See buildPriceRows() in property-detail.js.
    units: [
      { residenceLabel: "1.2 Acres", salePrice: 150000000, rentPrice: null }
    ],

    // Land listings use a stripped-down template (see isLandProperty() in
    // property-detail.js) — 1-3 photos, no gallery carousel padding needed.
    image: "assets/images/1 acre thigiri ridge.jpeg",
    gallery: [
      "assets/images/1 acre thigiri ridge.jpeg"
    ],

    url: "1-2-acre-land-thigiri-ridge",
    description: {
      body: "✅Ready title, Slightly sloppy, Excellent drainage,  Easily Accessible, Proximity to social amenities like the New Muthaiga Mall"
    },

    listedDate: "2026-07-22"
  },

  {
    id: "sl-015",
    // NOTE: slug/url must never contain a raw "&" — it's the query-string
    // separator, so "?id=5-&-6-..." gets truncated by URLSearchParams into
    // id="5-" (no match), silently falling back to the generic "DG West"
    // placeholder property. Kept the "&" in `title` (safe — that's just
    // display text) but stripped it from the id-bearing slug/url below.
    slug: "5-6-bedroom-luxury-villas",
    status: "available",
    collection: "featured",
    title: "5 & 6 Bedroom Luxury Villas",
    summary: "5 & 6 bedroom luxury villas for sale in Kyuna, Westlands, featuring a grand double-volume lounge, en-suite bedrooms, a modern kitchen with island, smart home infrastructure, borehole water supply, and 24-hour gated security.",
    propertyType: "mansion",
    community: "westlands",
    location: "Kyuna, Westlands, Nairobi",
    letting: "sale",
    // Two floor plans in this development — see data/property-units.js for
    // how the rest of the site reads bedrooms/bathrooms/price off `units`.
    units: [
      { unitType: "5-bedroom", bedrooms: 5, bathrooms: 6, salePrice: 87000000, rentPrice: null },
      { unitType: "6-bedroom", bedrooms: 6, bathrooms: 6, salePrice: 100000000, rentPrice: null }
    ],

    image: "assets/images/5 & 6 Bedroom Luxury Villas westlands.jpeg",
    heroImage: "assets/images/5 & 6 Bedroom Luxury Villas Living room.jpeg",
    gallery: [
      "assets/images/5 & 6 Bedroom Luxury Villas.jpeg",
      "assets/images/5 & 6 Bedroom Luxury Villas Living room.jpeg",
      "assets/images/5 & 6 Bedroom Luxury Villas bedroom.jpeg",
      "assets/images/5 & 6 Bedroom Luxury Villas bedroom (2).jpeg",
      "assets/images/5 & 6 Bedroom Luxury Villas kitchen.jpeg",
      "assets/images/5 & 6 Bedroom Luxury Villas kitchen (2).jpeg",
      "assets/images/5 & 6 Bedroom Luxury Villas Closet.jpeg",
      "assets/images/5 & 6 Bedroom Luxury Villas washroom.jpeg",
      "assets/images/5 & 6 Bedroom Luxury Villas washroom (2).jpeg",
      "assets/images/5 & 6 Bedroom Luxury Villas washroom (3).jpeg",
      "assets/images/5 & 6 Bedroom Luxury Villas washroom (4).jpeg",
      "assets/images/5 & 6 Bedroom Luxury Villas (2).jpeg",
      "assets/images/5 & 6 Bedroom Luxury Villas (3).jpeg",
      "assets/images/5 & 6 Bedroom Luxury Villas (4).jpeg",
      "assets/images/5 & 6 Bedroom Luxury Villas (5).jpeg"
      ],

    url: "5-6-bedroom-luxury-villas",
    description: {
      body: "Set in the leafy, established neighbourhood of Kyuna, Westlands, these 5 & 6 bedroom luxury villas offer a rare opportunity to own an exceptional home in one of Nairobi's most sought-after residential pockets. Each residence combines elegant architecture, expansive living spaces, and modern comforts within a private, secure environment, just minutes from Westlands' business and lifestyle amenities."
    },
    featureLocation: "Kyuna, Westlands address with easy access to Westlands CBD, Sarit Centre, and Nairobi's key diplomatic and business districts.",
     story: {
      rows: [
        { title: "Elegant Family Living",
          body: "Designed for contemporary family living, the residence offers generous indoor and outdoor spaces that balance comfort with functionality. Expansive living areas, large windows, and an open veranda overlooking the manicured gardens create bright, welcoming interiors ideal for both everyday living and entertaining." },
        { title: "Refined Interiors",
          body: "All five bedrooms are generously proportioned and fully en-suite, offering privacy and comfort for every member of the household. The home showcases contemporary architecture complemented by timeless detailing, including a striking white façade, elegant columned verandas, and a terracotta-tiled roof that enhances its enduring appeal." },
        { title: "Lifestyle & Recreation",
          body: "Created to support modern lifestyles, the residence includes thoughtfully designed spaces for work, wellness, and family living. A dedicated home office provides the ideal professional workspace, while a private gym offers convenience for health and fitness within the comfort of home." },
        { title: "Outdoor Living",
          body: "The property features mature gardens, expansive lawns, and inviting outdoor spaces designed for relaxation, entertaining, and family activities. The tranquil setting provides both privacy and the flexibility for future enhancements." }
        
      ]
    },
    listedDate: "2026-07-22",
    featureHighlights: [
      { title: "Security:", text: "24-Hour Security, Secure Gated Community" },
      { title: "Design:", text: "Formal Dining Area, Grand Double-Volume Lounge,High Ceilings, Statement Chandelier, Large Windows with Natural Lighting, Private Garden " },
      { title: "Kitchen:", text: "Modern Kitchen with Island, Walk-In Pantry" },
      { title: "Technology:", text: "Smart home infrastructure throughout" },
      { title: "Utilities:", text: "Borehole Water Supply, Ample Water Storage, Service Charge Included, " }
    ]
  },

  /* ------------------------------------------------------- HOMEPAGE FEATURED
     The 5 cards on the homepage "Featured Properties" carousel. These used
     to be five hand-coded standalone pages (properties/*.html) on an older,
     one-off template with no data source — migrated here 2026-08-16 onto the
     same template/schema as every other listing. Edit title/price/bedrooms/
     description/gallery/etc. directly below; property.html?id=<slug> now
     renders them like any other property. */

  {
    id: "sl-027",
    slug: "4-bedroom-maisonette-runda-nairobi",
    status: "available",
    collection: "featured",
    title: "4 Bedroom Maisonette, Runda",
    summary: "A private 4-bedroom maisonette for sale in Runda, Nairobi, offering generous rooms, refined finishes, and a calm setting within one of Nairobi's most established neighbourhoods.",
    propertyType: "townhouse",
    community: "runda",
    location: "Runda, Nairobi",
    letting: "sale",
    bedrooms: 4,
    // Bathroom count wasn't given on the old page — confirm and update.
    bathrooms: null,
    salePrice: 350000000,
    rentPrice: null,
    image: "assets/images/Premium properties/RundaMansion3.jpeg",
    gallery: [
      "assets/images/Premium properties/RundaMansion2.jpeg",
      "assets/images/Premium properties/RundaMansion.jpeg",
      "assets/images/Premium properties/RundaMansion4.jpeg",
      "assets/images/Premium properties/RundaMansion3.jpeg"
    ],
    url: "4-bedroom-maisonette-runda-nairobi",
    description: "This 4 Bedroom Maisonette in Runda presents a private residential address with generous rooms, refined finishes, and a calm setting within one of Nairobi's most established neighborhoods. The home is designed for families and discerning buyers who value space, security, privacy, and access to diplomatic, school, and lifestyle conveniences. The property combines elegant indoor living with outdoor leisure spaces, making it suitable for entertaining, daily family life, and long-term premium investment in Runda.",
    featureLocation: "Runda address near diplomatic zones, international schools, private clubs, and premium family neighborhoods.",
    story: {
      rows: [
        { title: "4 Bedroom Maisonette Residence",
          body: "4 Bedroom Maisonette is presented as a composed premium residence in Runda, Nairobi, with spaces planned for comfort, privacy, and everyday ease. The interiors and exterior setting work together to create a property experience that feels refined, practical, and ready for discerning buyers." },
        { title: "Design And Finishes",
          body: "The property brings together generous proportions, considered finishes, and strong visual character. Each image in the gallery reflects the quality and atmosphere of 4 Bedroom Maisonette, giving buyers a clearer sense of how the home supports family living, hosting, and long-term value." },
        { title: "Lifestyle And Comfort",
          body: "From relaxed daily routines to private entertaining, 4 Bedroom Maisonette is shaped around a comfortable premium lifestyle. The residence offers the kind of space, light, and calm expected from a carefully selected SELLAM property." },
        { title: "Location Advantage",
          body: "Runda, Nairobi gives this property a strong residential context, with access to established amenities, key routes, and the privacy buyers expect from a premium address. It is positioned for both lifestyle appeal and long-term investment confidence." }
      ]
    },
    listedDate: "2026-07-24"
  },

  {
    id: "sl-028",
    slug: "modern-villas-lavington",
    status: "available",
    collection: "featured",
    title: "Modern Villas, Lavington",
    summary: "Modern villas for sale in Lavington, Nairobi, offering contemporary architecture, bright interiors, and a polished residential setting close to schools, shopping, and the city's core neighbourhoods.",
    propertyType: "villa",
    community: "lavington",
    location: "Lavington, Nairobi",
    letting: "sale",
    // Bedroom/bathroom count and price weren't given on the old page — confirm and update.
    bedrooms: null,
    bathrooms: null,
    salePrice: null,
    rentPrice: null,
    image: "assets/images/Premium properties/ModernVillas-Lavington9.jpeg",
    gallery: [
      "assets/images/Premium properties/ModernVillas-Lavington.jpeg",
      "assets/images/Premium properties/ModernVillas-Lavington2.jpeg",
      "assets/images/Premium properties/ModernVillas-Lavington3.jpeg",
      "assets/images/Premium properties/ModernVillas-Lavington4.jpeg",
      "assets/images/Premium properties/ModernVillas-Lavington5.jpeg",
      "assets/images/Premium properties/ModernVillas-Lavington6.jpeg",
      "assets/images/Premium properties/ModernVillas-Lavington7.jpeg",
      "assets/images/Premium properties/ModernVillas-Lavington8.jpeg",
      "assets/images/Premium properties/ModernVillas-Lavington10.jpeg",
      "assets/images/Premium properties/ModernVillas-Lavington11.jpeg",
      "assets/images/Premium properties/ModernVillas-Lavington12.jpeg"
    ],
    url: "modern-villas-lavington",
    description: "Modern Villas in Lavington offer a composed residential experience with contemporary architecture, bright interiors, and practical family planning. The address is selected for buyers seeking privacy, strong connectivity, and a polished urban lifestyle close to schools, shopping, and Nairobi's core neighborhoods. Each residence is presented for clients who want refined finishes, secure living, and the convenience of one of Nairobi's most desirable residential suburbs.",
    featureLocation: "Lavington location with access to schools, malls, restaurants, hospitals, and key city routes.",
    story: {
      rows: [
        { title: "Modern Villas Residence",
          body: "Modern Villas is presented as a composed premium residence in Lavington, Nairobi, with spaces planned for comfort, privacy, and everyday ease. The interiors and exterior setting work together to create a property experience that feels refined, practical, and ready for discerning buyers." },
        { title: "Design And Finishes",
          body: "The property brings together generous proportions, considered finishes, and strong visual character. Each image in the gallery reflects the quality and atmosphere of Modern Villas, giving buyers a clearer sense of how the home supports family living, hosting, and long-term value." },
        { title: "Lifestyle And Comfort",
          body: "From relaxed daily routines to private entertaining, Modern Villas is shaped around a comfortable premium lifestyle. The residence offers the kind of space, light, and calm expected from a carefully selected SELLAM property." },
        { title: "Location Advantage",
          body: "Lavington, Nairobi gives this property a strong residential context, with access to established amenities, key routes, and the privacy buyers expect from a premium address. It is positioned for both lifestyle appeal and long-term investment confidence." }
      ]
    },
    listedDate: "2026-07-25"
  },

  {
    id: "sl-029",
    slug: "ostrea-villas-karen-nairobi",
    status: "available",
    collection: "featured",
    title: "Ostrea Villas, Karen",
    summary: "Signature villas for sale in Karen, Nairobi, set in a serene green residential enclave with refined finishes, generous planning, and long-term residential value.",
    propertyType: "villa",
    community: "karen",
    location: "Karen, Nairobi",
    letting: "sale",
    // Bedroom/bathroom count wasn't given on the old page — confirm and update.
    bedrooms: null,
    bathrooms: null,
    salePrice: 165000000,
    rentPrice: null,
    image: "assets/images/Premium properties/OSTREA Karen Villas (6).jpeg",
    gallery: [
      "assets/images/Premium properties/OSTREA Karen Villas.jpeg",
      "assets/images/Premium properties/OSTREA Karen Villas (2).jpeg",
      "assets/images/Premium properties/OSTREA Karen Villas (3).jpeg",
      "assets/images/Premium properties/OSTREA Karen Villas (4).jpeg",
      "assets/images/Premium properties/OSTREA Karen Villas (5).jpeg",
      "assets/images/Premium properties/OSTREA Karen Villas (7).jpeg",
      "assets/images/Premium properties/OSTREA Karen Villas (8).jpeg",
      "assets/images/Premium properties/OSTREA Karen Villas (9).jpeg",
      "assets/images/Premium properties/OSTREA Karen Villas (10).jpeg",
      "assets/images/Premium properties/OSTREA Karen Villas (11).jpeg",
      "assets/images/Premium properties/OSTREA Karen Villas (12).jpeg",
      "assets/images/Premium properties/OSTREA Karen Villas (13).jpeg",
      "assets/images/Premium properties/OSTREA Karen Villas (14).jpeg",
      "assets/images/Premium properties/OSTREA Karen Villas (15).jpeg",
      "assets/images/Premium properties/OSTREA Karen Villas (16).jpeg",
      "assets/images/Premium properties/OSTREA Karen Villas (17).jpeg"
    ],
    url: "ostrea-villas-karen-nairobi",
    description: "Ostrea Villas in Karen bring signature villa living to a serene, green residential setting. The homes are crafted for privacy, comfort, and everyday elegance, with generous planning and finishes that support both family life and refined entertaining. Positioned in Karen, the property gives buyers access to leafy surroundings, private schools, lifestyle amenities, and long-term residential value in one of Nairobi's most established addresses.",
    featureLocation: "Karen address near international schools, private clubs, green compounds, and lifestyle destinations.",
    story: {
      rows: [
        { title: "Ostrea Villas Residence",
          body: "Ostrea Villas is presented as a composed premium residence in Karen, Nairobi, with spaces planned for comfort, privacy, and everyday ease. The interiors and exterior setting work together to create a property experience that feels refined, practical, and ready for discerning buyers." },
        { title: "Design And Finishes",
          body: "The property brings together generous proportions, considered finishes, and strong visual character. Each image in the gallery reflects the quality and atmosphere of Ostrea Villas, giving buyers a clearer sense of how the home supports family living, hosting, and long-term value." },
        { title: "Lifestyle And Comfort",
          body: "From relaxed daily routines to private entertaining, Ostrea Villas is shaped around a comfortable premium lifestyle. The residence offers the kind of space, light, and calm expected from a carefully selected SELLAM property." },
        { title: "Location Advantage",
          body: "Karen, Nairobi gives this property a strong residential context, with access to established amenities, key routes, and the privacy buyers expect from a premium address. It is positioned for both lifestyle appeal and long-term investment confidence." }
      ]
    },
    listedDate: "2026-07-26"
  },

  {
    id: "sl-030",
    slug: "naserian-karen-nairobi",
    status: "available",
    collection: "featured",
    title: "Naserian, Karen",
    summary: "A premium Karen, Nairobi residence shaped around space, privacy, and composed everyday living, with a quiet, established address and strong lifestyle access.",
    propertyType: "villa",
    community: "karen",
    location: "Karen, Nairobi",
    letting: "sale",
    // Bedroom/bathroom count and price weren't given on the old page — confirm and update.
    bedrooms: null,
    bathrooms: null,
    salePrice: null,
    rentPrice: null,
    image: "assets/images/Premium properties/Naserian Karen.jpeg",
    gallery: [
      "assets/images/Premium properties/Naserian Karen (2).jpeg",
      "assets/images/Premium properties/Naserian Karen (3).jpeg",
      "assets/images/Premium properties/Naserian Karen (4).jpeg",
      "assets/images/Premium properties/Naserian Karen (5).jpeg",
      "assets/images/Premium properties/Naserian Karen (6).jpeg",
      "assets/images/Premium properties/Naserian Karen (7).jpeg",
      "assets/images/Premium properties/Naserian Karen (8).jpeg",
      "assets/images/Premium properties/Naserian Karen (9).jpeg"
    ],
    url: "naserian-karen-nairobi",
    description: "Naserian in Karen is a premium residential opportunity shaped around space, privacy, and composed everyday living. Its setting suits buyers who want a quiet, established address with elegant homes and strong lifestyle access. The property is presented for families, investors, and homeowners looking for a refined Karen residence with secure surroundings and long-term value.",
    featureLocation: "Karen location with proximity to schools, shopping, clubs, hospitals, and calm residential streets.",
    story: {
      rows: [
        { title: "Naserian Residence",
          body: "Naserian is presented as a composed premium residence in Karen, Nairobi, with spaces planned for comfort, privacy, and everyday ease. The interiors and exterior setting work together to create a property experience that feels refined, practical, and ready for discerning buyers." },
        { title: "Design And Finishes",
          body: "The property brings together generous proportions, considered finishes, and strong visual character. Each image in the gallery reflects the quality and atmosphere of Naserian, giving buyers a clearer sense of how the home supports family living, hosting, and long-term value." },
        { title: "Lifestyle And Comfort",
          body: "From relaxed daily routines to private entertaining, Naserian is shaped around a comfortable premium lifestyle. The residence offers the kind of space, light, and calm expected from a carefully selected SELLAM property." },
        { title: "Location Advantage",
          body: "Karen, Nairobi gives this property a strong residential context, with access to established amenities, key routes, and the privacy buyers expect from a premium address. It is positioned for both lifestyle appeal and long-term investment confidence." }
      ]
    },
    listedDate: "2026-07-27"
  },

  {
    id: "sl-031",
    slug: "5-bedroom-mansion-lower-kabete",
    status: "available",
    collection: "featured",
    title: "5 Bedroom Mansion, Lower Kabete",
    summary: "A smart 5-bedroom, fully en-suite mansion for sale or rent in Lower Kabete, Nairobi, with automated security and lighting, a private outdoor jacuzzi, and premium family-focused finishes.",
    propertyType: "mansion",
    community: "lower-kabete",
    location: "Lower Kabete, Nairobi",
    letting: "both",
    bedrooms: 5,
    bathrooms: 5,
    salePrice: 250000000,
    // USD 10,000/month converted at KES 129.5/USD, the rate used elsewhere
    // in this file for leasePricing — confirm against the current rate.
    rentPrice: 1295000,
    image: "assets/images/Premium properties/Lower Kabete 5 Bedroom (2).jpeg",
    gallery: [
      "assets/images/Premium properties/Lower Kabete 5 Bedroom.jpeg",
      "assets/images/Premium properties/Lower Kabete 5 Bedroom (3).jpeg",
      "assets/images/Premium properties/Lower Kabete 5 Bedroom (4).jpeg",
      "assets/images/Premium properties/Lower Kabete 5 Bedroom (5).jpeg",
      "assets/images/Premium properties/Lower Kabete 5 Bedroom (6).jpeg",
      "assets/images/Premium properties/Lower Kabete 5 Bedroom (7).jpeg",
      "assets/images/Premium properties/Lower Kabete 5 Bedroom (8).jpeg"
    ],
    url: "5-bedroom-mansion-lower-kabete",
    description: "This 5 bed all en-suite, smart home has all the luxury a family needs for easy living. The large living room features curtain, light, and security automation that can be controlled from anywhere with WIFI connectivity, for complete peace of mind, alongside an outdoor jacuzzi for 8 people.",
    featureLocation: "Lower Kabete address with access to Westlands, schools, private clubs, and established family neighborhoods.",
    story: {
      rows: [
        { title: "The Culinary Atelier",
          body: "The kitchen is thoughtfully designed to combine functionality with refined luxury. Premium granite countertops, high-end cabinetry, and integrated appliances—including a dishwasher, microwave, under-counter oven, gas hob, electric stove, and extractor fan—create a seamless cooking experience. A spacious breakfast nook, walk-in pantry, and dedicated laundry area complete a kitchen built for modern family living." },
        { title: "Private Retreats",
          body: "All five bedrooms are generously proportioned and en-suite, offering exceptional comfort and privacy. The soundproofed primary suite features Clipsal smart automation, a walk-in closet, bamboo flooring, and dedicated TV and telephone connectivity. The remaining bedrooms continue the home's premium standard with bamboo flooring, walk-in closets or built-in wardrobes, high ceilings, and integrated network and entertainment ports." },
        { title: "Wellness Sanctuaries",
          body: "From relaxed daily routines to private entertaining, 5 Bedroom Mansion is shaped around a comfortable premium lifestyle. The residence offers the kind of space, light, and calm expected from a carefully selected SELLAM property." },
        { title: "Grand Living",
          body: "Lower Kabete, Nairobi gives this property a strong residential context, with access to established amenities, key routes, and the privacy buyers expect from a premium address. It is positioned for both lifestyle appeal and long-term investment confidence." }
      ]
    },
    listedDate: "2026-07-28"
  },


  /* --------------------------------------------------------------- EXCLUSIVE
     Off-market / exclusive listings. */

 

  

  {
    id: "sl-016",
    slug: "moon-valley-nyari",
    status: "available",
    collection: "exclusive",
    title: "Moon Valley",
    summary: "Moon Valley brings rare off-market homes to Nyari, pairing privacy, elegant architecture, strong security, and a carefully selected residential environment.",
    propertyType: "villa",
    community: "nyari",
    location: "Nyari, Nairobi",
    letting: "sale",
    salePrice: 132000000,
    rentPrice: null,
    bedrooms: 4,
    bathrooms: 4,
    features: ["pool", "garden", "gym", "security", "parking"],
    image: "assets/images/hero-moon-valley.webp",
    gallery: ["assets/images/hero-moon-valley.webp"],
    url: "moon-valley-nyari",
    description: "Moon Valley brings rare off-market homes to Nyari, pairing privacy, elegant architecture, strong security, and a carefully selected residential environment.",
    featureLocation: "Nyari address with premium privacy, strong access, and proximity to diplomatic residential corridors.",
    listedDate: "2026-04-21"
  },

  {
    id: "sl-017",
    slug: "grosvenor-westlands",
    status: "available",
    collection: "exclusive",
    title: "Grosvenor",
    summary: "A prestigious Westlands location close to offices, restaurants, retail and lifestyle amenities.",
    propertyType: "apartment",
    community: "westlands",
    location: "Westlands, Nairobi",
    letting: "sale",
    salePrice: 52000000,
    rentPrice: null,
    bedrooms: 3,
    bathrooms: 3,
    features: ["gym", "wifi", "security", "parking", "backup-generator"],
    image: "assets/images/grosvenor.jpg",
    gallery: ["assets/images/grosvenor.jpg"],
    url: "grosvenor-westlands",
    description: "A prestigious Westlands location close to offices, restaurants, retail and lifestyle amenities.",
    featureLocation: "Prestigious Westlands location close to offices, restaurants, retail, and lifestyle amenities.",
    listedDate: "2026-05-06"
  },

  /* --------------------------------------------------------------- LEASING
     Commercial properties for the Leasing nav dropdown: Offices, Retail,
     Industrial, Land. Each shows on rent.html too (letting is rent/both,
     same as every other rental) and on its dedicated leasing-*.html page,
     matched by `propertyType`. `bedrooms`/`bathrooms` are `null` — a
     bedroom count doesn't apply to commercial space, so the card and
     search result simply omit that line. */

  {
    id: "sl-018",
    slug: "gtc-office-tower",
    status: "available",
    collection: "featured",
    title: "GTC Office Tower",
    summary: "A Grade A office suite in Westlands offering open-plan floor space, fast fibre connectivity, and full backup power for uninterrupted business operations.",
    propertyType: "office",
    community: "westlands",
    location: "Westlands, Nairobi",
    letting: "both",
    salePrice: null,
    rentPrice: 28000,
    bedrooms: null,
    bathrooms: null,
    // PSF leasing rates converted from source quote (USD 1 = KES 129.5) —
    // see leasePricing field reference above. Additive: rentPrice/letting/
    // status above are unchanged and still drive the card, filters, and
    // rent.html/leasing-offices.html as before.
    leasePricing: {
      saleAndLeaseAvailable: true,
      fromPerSqFt: { min: 142, max: 207 },
      spaceAvailable: { min: 3800, max: 17768, unit: "sq. ft." },
      zones: [
        { name: "Low Zone", floors: "F3–F16", minPerSqFt: 214, maxPerSqFt: 246 },
        { name: "Middle Zone", floors: "F18–F29", minPerSqFt: 246, maxPerSqFt: 311 },
        { name: "High Zone", floors: "F30–F41", minPerSqFt: 311, maxPerSqFt: 337 }
      ],
      serviceChargePerSqFt: 35,
      serviceChargeNote: "+ VAT",
      parkingRatio: "2 bays : 1,000 sq. ft.",
      parkingNote: "at a cost"
    },
    features: ["wifi", "parking", "security", "backup-generator"],
    image: "assets/images/GTC Office Tower.jpeg",
    gallery: [
      "assets/images/GTC Office Tower (6).jpeg",
      "assets/images/GTC Office Tower (3).jpeg",
      "assets/images/GTC Office Tower (10).jpeg",
      "assets/images/GTC Office Tower (11).jpeg",
      "assets/images/GTC Office Tower (2).jpeg",
      "assets/images/GTC Office Tower (4).jpeg",
      "assets/images/GTC Office Tower (12).jpeg",
      "assets/images/GTC Office Tower (7).jpeg"
      ],
    url: "gtc-office-tower",
    description: "Position your business at one of East Africa's most distinguished commercial addresses. GTC Office Tower offers world-class Grade A office spaces within Nairobi's premier mixed-use development, combining contemporary architecture, intelligent workplace design, and exceptional business amenities. Whether acquiring office space or leasing for immediate occupation, GTC provides an environment designed for productivity, collaboration, and long-term business growth.",
    story: {
      rows: [
        { title: "Intelligent Workspaces", 
          body: "Designed to meet the evolving needs of modern businesses, GTC Office Tower offers flexible office spaces delivered in a core & shell configuration, allowing complete interior customization to suit individual business requirements. For businesses seeking immediate occupancy, fully furnished, turnkey office solutions are also available, providing a seamless move-in experience." },
        { title: "International Business Standards", 
          body: "Inspired by modern architectural principles, the tower features an elegant Low-E coated glass façade that maximizes natural daylight while improving energy efficiency. Its striking contemporary design, expansive floor plates, and impressive vertical profile establish GTC as one of Nairobi's defining commercial landmarks." },
        { title: "Integrated Business Destination", 
          body: "As part of the Global Trade Centre development, businesses benefit from immediate access to an integrated mixed-use environment comprising premium hospitality, retail, restaurants, cafés, banking services, residential apartments, and lifestyle amenities. This creates a seamless environment where business, hospitality, and everyday convenience come together within one internationally recognised address." },
        {  title: "Prime Commercial Address", 
          body: "Strategically located in Westlands along Waiyaki Way, GTC Office Tower provides exceptional connectivity to Nairobi's Central Business District, Upper Hill, Gigiri, diplomatic missions, major transport corridors, and the Nairobi Expressway. Its prestigious address continues to attract multinational corporations, financial institutions, technology firms, professional practices, and international organisations." },
        
      ]
    },
    listedDate: "2026-07-22",
    featureHighlights: [
  { title: "Security:", text: "24-hour security with controlled access" },
  { title: "Connectivity:", text: "High-speed Wi-Fi, High-speed elevators" },
  { title: "Community:", text: "Bar & lounge and Landscaped gardens" },
  { title: "Amenities:", text: "Outdoor swimming pool, Hotel reception & concierge,Elegant arrival lobby" },
  { title: "Wellness:", text: "Rooftop yoga garden,Fully equipped fitness centre, Spa, massage rooms, steam & sauna" }
],
    closingParagraphs: "Whether purchasing office space as a long-term investment or leasing premises for your business, GTC Office Tower presents a rare opportunity within Nairobi's Grade A commercial market. Backed by premium specifications, an iconic business address, and sustained demand from leading local and international occupiers, it continues to set the benchmark for commercial real estate in East Africa."
  },

{
  id: "sl-019",
    slug: "the-mandrake",
    status: "available",
    collection: "featured",
    title: "The Mandrake",
    summary: "A Grade A office suite in Westlands offering open-plan floor space, fast fibre connectivity, and full backup power for uninterrupted business operations.",
    propertyType: "office",
    community: "westlands",
    location: "Westlands, Nairobi",
    letting: "both",
    salePrice: null,
    rentPrice: 28000,
    bedrooms: null,
    bathrooms: null,
    // PSF leasing rates converted from source quote (USD 1 = KES 129.5) —
    // see leasePricing field reference above. Additive: rentPrice/letting/
    // status above are unchanged and still drive the card, filters, and
    // rent.html/leasing-offices.html as before.
    leasePricing: {
      saleAndLeaseAvailable: true,
      fromPerSqFt: { min: 169, max: 246 },
      spaceAvailable: { min: 2500, max: 17768, unit: "sq. ft." },
      
      serviceChargePerSqFt: 35,
      serviceChargeNote: "+ VAT",
      parkingRatio: "2 bays : 1,000 sq. ft.",
      parkingNote: "at a cost"
    },
    features: ["wifi", "parking", "security", "backup-generator"],
    image: "assets/images/The Mandrake.jpeg",
    gallery: [
      "assets/images/The Mandrake (2).jpeg",
      "assets/images/The Mandrake (3).jpeg",
      "assets/images/The Mandrake (4).jpeg",
    
      ],
    url: "the-mandrake",
    description: "Position your business within one of Nairobi's newest and most distinctive Grade A commercial developments. The Mandrake offers premium office spaces designed around sustainability, flexibility, and workplace wellbeing, combining contemporary architecture, intelligent building systems, and internationally recognised environmental standards. Whether establishing a regional headquarters or expanding your business, The Mandrake provides an exceptional environment for productivity, collaboration, and long-term growth.",
    story: {
      rows: [
        { title: "Intelligent Workspaces", 
          body: "Designed to accommodate businesses of every scale, The Mandrake features flexible office suites with expansive column-free floor plates, allowing complete workspace customization to meet diverse operational requirements. Floor-to-ceiling glazing maximizes natural daylight, creating bright, efficient working environments that enhance employee comfort and productivity." },
        { title: "Sustainable Business Environment", 
          body: "Developed to IFC EDGE Certified standards, The Mandrake integrates sustainable design principles that promote energy efficiency, environmental responsibility, and occupant wellbeing. Its signature vertical greenery, landscaped spaces, and modern façade create a healthier, more inspiring workplace while reducing operational costs for occupiers." },
        { title: "Business Amenities", 
          body: "Every aspect of The Mandrake has been thoughtfully designed to deliver an exceptional workplace experience, including:" },
        
      ]
    },
    listedDate: "2026-07-22",
    featureHighlights: [
  { title: "Security:", text: "Electrified Perimeter Security, Advanced CCTV Surveillance, Fire Detection & Fire Suppression Systems" },
  { title: "Connectivity:", text: "Fibre Optic Internet Connectivity, Advanced CCTV Surveillance" },
  { title: "Community:", text: "Bar & lounge and Landscaped gardens" },
  { title: "Amenities:", text: "Rooftop Terrace, Borehole Water Supply,  Hotel reception & concierge,Elegant arrival lobby" },
  { title: "Pro Services:", text: "Grade A Office Space, Professional Property Management,Contemporary Workplace Destination." },
  { title: "Power Backup:", text: "Full backup power Generator" },
  { title: "Office Features:", text: "Full Floor Leasing Opportunities, Flexible Office Configurations, Column-Free Floor Plates, IFC EDGE Certified Green Building, Sustainable Architectural Design, Vertical Green Façade,Rooftop Terrace." }
],
    closingParagraphs: "Whether purchasing office space as a long-term investment or leasing premises for your business, GTC Office Tower presents a rare opportunity within Nairobi's Grade A commercial market. Backed by premium specifications, an iconic business address, and sustained demand from leading local and international occupiers, it continues to set the benchmark for commercial real estate in East Africa."
  },
   
  {
    id: "sl-020",
    slug: "riverside-business-park-office",
    status: "available",
    collection: "featured",
    title: "Riverside Business Park Office",
    summary: "A flexible office floor in a well-managed Kilimani business park, suited to growing teams that need a professional, secure working environment.",
    propertyType: "office",
    community: "kilimani",
    location: "Kilimani, Nairobi",
    letting: "rent",
    salePrice: null,
    rentPrice: 180000,
    bedrooms: null,
    bathrooms: null,
    features: ["wifi", "parking", "security"],
    image: "assets/images/premium-page-dg-west-tower.jpg",
    gallery: ["assets/images/premium-page-dg-west-tower.jpg"],
    url: "riverside-business-park-office",
    description: "A flexible office floor in a well-managed Kilimani business park, suited to growing teams that need a professional, secure working environment.",
    featureLocation: "Kilimani location with quick access to Yaya Centre, Adlife Plaza, and the wider Kilimani/Upper Hill business corridor.",
    listedDate: "2026-05-19"
  },

  {
    id: "sl-025",
    slug: "high-street-retail-unit-westlands",
    status: "available",
    collection: "featured",
    title: "High-Street Retail Unit",
    summary: "A high-visibility retail unit on a busy Westlands street front, ideal for a flagship store, showroom, or high-footfall food and beverage concept.",
    propertyType: "retail",
    community: "westlands",
    location: "Westlands, Nairobi",
    letting: "rent",
    salePrice: null,
    rentPrice: 220000,
    bedrooms: null,
    bathrooms: null,
    features: ["wifi", "parking", "security"],
    image: "assets/images/grosvenor.jpg",
    gallery: ["assets/images/grosvenor.jpg"],
    url: "high-street-retail-unit-westlands",
    description: "A high-visibility retail unit on a busy Westlands street front, ideal for a flagship store, showroom, or high-footfall food and beverage concept.",
    featureLocation: "Westlands high street with heavy pedestrian and vehicle traffic, close to malls, offices, and residential density.",
    listedDate: "2026-05-24"
  },

  {
    id: "sl-021",
    slug: "kilimani-mall-retail-space",
    status: "available",
    collection: "featured",
    title: "Kilimani Mall Retail Space",
    summary: "A ground-floor retail space within an established Kilimani shopping mall, benefiting from shared footfall, parking, and security.",
    propertyType: "retail",
    community: "kilimani",
    location: "Kilimani, Nairobi",
    letting: "rent",
    salePrice: null,
    rentPrice: 150000,
    bedrooms: null,
    bathrooms: null,
    features: ["wifi", "parking", "security", "backup-generator"],
    image: "assets/images/premium-page-grosvenor-towers.jpg",
    gallery: ["assets/images/premium-page-grosvenor-towers.jpg"],
    url: "kilimani-mall-retail-space",
    description: "A ground-floor retail space within an established Kilimani shopping mall, benefiting from shared footfall, parking, and security.",
    featureLocation: "Kilimani address inside an active retail mall with consistent shopper traffic and shared amenities.",
    listedDate: "2026-05-29"
  },

  {
    id: "sl-022",
    slug: "syokimau-distribution-warehouse",
    status: "available",
    collection: "featured",
    title: "Syokimau Distribution Warehouse",
    summary: "A large distribution warehouse near JKIA and the Standard Gauge Railway terminus, with generous loading access and yard space for logistics operations.",
    propertyType: "industrial",
    community: "syokimau",
    location: "Syokimau, Nairobi",
    letting: "rent",
    salePrice: null,
    rentPrice: 300000,
    bedrooms: null,
    bathrooms: null,
    features: ["parking", "security", "backup-generator"],
    image: "assets/images/premium-kitchen.webp",
    gallery: ["assets/images/premium-kitchen.webp"],
    url: "syokimau-distribution-warehouse",
    description: "A large distribution warehouse near JKIA and the Standard Gauge Railway terminus, with generous loading access and yard space for logistics operations.",
    featureLocation: "Syokimau location with fast access to JKIA, the Mombasa Road corridor, and the SGR freight terminus.",
    listedDate: "2026-06-03"
  },

  {
    id: "sl-023",
    slug: "ngong-road-light-industrial-unit",
    status: "available",
    collection: "featured",
    title: "Ngong Road Light Industrial Unit",
    summary: "A light industrial and workshop unit along the Ngong Road corridor, suited to small-scale manufacturing, storage, or a trade workshop.",
    propertyType: "industrial",
    community: "ngong",
    location: "Ngong Road, Nairobi",
    letting: "rent",
    salePrice: null,
    rentPrice: 160000,
    bedrooms: null,
    bathrooms: null,
    features: ["parking", "security"],
    image: "assets/images/Premium properties/CROWN JEWEL (5).jpeg",
    gallery: ["assets/images/Premium properties/CROWN JEWEL (5).jpeg"],
    url: "ngong-road-light-industrial-unit",
    description: "A light industrial and workshop unit along the Ngong Road corridor, suited to small-scale manufacturing, storage, or a trade workshop.",
    featureLocation: "Ngong Road address with straightforward access for goods vehicles and proximity to Nairobi's southern industrial belt.",
    listedDate: "2026-06-08"
  },

  {
    id: "sl-024",
    slug: "karen-commercial-land-plot",
    status: "available",
    collection: "featured",
    title: "Karen Commercial Land Plot",
    summary: "A fenced, commercially-zoned land plot in Karen available on a long-term lease, suited to a showroom, storage yard, or purpose-built development.",
    propertyType: "land",
    community: "karen",
    location: "Karen, Nairobi",
    letting: "rent",
    salePrice: null,
    rentPrice: 90000,
    bedrooms: null,
    bathrooms: null,
    features: ["security"],
    image: "assets/images/buy/land.jpg",
    gallery: ["assets/images/buy/land.jpg"],
    url: "karen-commercial-land-plot",
    description: "A fenced, commercially-zoned land plot in Karen available on a long-term lease, suited to a showroom, storage yard, or purpose-built development.",
    featureLocation: "Karen address with good road access and a quiet, established commercial and residential setting.",
    listedDate: "2026-06-13"
  },

  {
    id: "sl-026",
    slug: "ngong-development-land",
    status: "available",
    collection: "featured",
    title: "Ngong Development Land",
    summary: "An open land plot in Ngong available for lease, suited to temporary yard use, agribusiness, or a phased development project.",
    propertyType: "land",
    community: "ngong",
    location: "Ngong, Nairobi",
    letting: "rent",
    salePrice: null,
    rentPrice: 65000,
    bedrooms: null,
    bathrooms: null,
    features: ["security"],
    image: "assets/images/buy/developments.jpg",
    gallery: ["assets/images/buy/developments.jpg"],
    url: "ngong-development-land",
    description: "An open land plot in Ngong available for lease, suited to temporary yard use, agribusiness, or a phased development project.",
    featureLocation: "Ngong location with growing infrastructure and easy access to Nairobi via Ngong Road.",
    listedDate: "2026-06-18"
  },

  {
    id: "sl-033",
    // NOTE: slug/url must never contain a raw "&" — it's the query-string
    // separator, so "?id=5-&-6-..." gets truncated by URLSearchParams into
    // id="5-" (no match), silently falling back to the generic "DG West"
    // placeholder property. Kept the "&" in `title` (safe — that's just
    // display text) but stripped it from the id-bearing slug/url below.
    slug: "enzo-residence-riverside",
    status: "available",
    collection: "featured",
    title: "ENZO Residence",
    summary: "ENZO Residence Riverside offers contemporary apartments in Nairobi with landscaped terraces, modern architecture, luxury amenities, secure parking, premium finishes, wellness facilities, and strong long-term investment potential in prestigious Riverside.",
    propertyType: "apartment",
    community: "riverside",
    location: "Riverside, Nairobi",
    letting: "sale",
    // Two floor plans in this development — see data/property-units.js for
    // how the rest of the site reads bedrooms/bathrooms/price off `units`.
    units: [
      { unitType: "studio", salePrice: 9128556, rentPrice: null },
      { unitType: "1-bedroom", bedrooms: 1, bathrooms: 1, salePrice: 16254000, rentPrice: null },
      { unitType: "2-bedroom", bedrooms: 2, bathrooms: 2, salePrice: 21285000, rentPrice: null }
    ],

    image: "assets/images/ENZO Residence (3).jpeg",
    heroImage: "assets/images/ENZO Residence (6).jpeg",
    gallery: [
      "assets/images/ENZO Residence (14).jpeg",
      "assets/images/ENZO Residence (13).jpeg",
      "assets/images/ENZO Residence (7).jpeg",
      "assets/images/ENZO Residence (11).jpeg",
      "assets/images/ENZO Residence (2).jpeg",
      "assets/images/ENZO Residence (16).jpeg",
      "assets/images/ENZO Residence (1).jpeg",
      "assets/images/ENZO Residence (12).jpeg",
      "assets/images/ENZO Residence (8).jpeg",
      "assets/images/ENZO Residence (15).jpeg"
      
      ],

    url: "enzo-residence-riverside",
    description: {
      body: "Positioned within the prestigious Riverside district, ENZO Residence introduces a new generation of contemporary urban living where architecture, nature, and lifestyle exist in perfect harmony. Rising gracefully above Riverside Park, the development has been carefully designed around open spaces, landscaped terraces, and elegant contemporary architecture that brings residents closer to both the city and nature. Every residence is thoughtfully planned to maximise comfort, natural light, and functionality, creating an address that offers exceptional living today while presenting strong long-term investment potential."
    },
    featureLocation: "Riverside, Nairobi address with easy access to Westlands CBD, Sarit Centre, and Nairobi's key diplomatic and business districts.",
     story: {
      rows: [
        { title: "Contemporary Architecture",
          body: "ENZO Residence is defined by its striking contemporary design, characterised by landscaped balconies, warm architectural finishes, expansive glazing, and clean modern lines. Every elevation has been carefully crafted to soften the building's vertical form while creating seamless connections between indoor living spaces and the surrounding landscape. The result is an elegant residential landmark that blends naturally into one of Nairobi's most desirable neighbourhoods." },
        { title: "Contemporary Living Spaces",
          body: "Designed around openness and comfort, every residence features intelligently planned living and dining areas that maximise natural light and ventilation. Spacious interiors flow effortlessly onto private balconies or terraces, creating bright, welcoming homes that embrace both urban convenience and outdoor living." },
        { title: "Private Sanctuaries",
          body: "Each residence has been thoughtfully designed to provide peaceful and comfortable private spaces. Well-proportioned bedrooms feature built-in wardrobes, abundant natural light, excellent ventilation, and elegant finishes, creating calm environments designed for everyday relaxation." },
        { title: "Spa-Inspired Bathrooms",
          body: "Finished with premium ceramic tiling, contemporary vanity units, quality sanitary ware, and elegant mirrors, every bathroom has been designed to provide both functionality and refined comfort. Carefully selected finishes create bright, modern spaces that complement the overall architectural vision of the development." }
        
      ]
    },
    listedDate: "2026-07-22",
    featureHighlights: [
      { title: "Security:", text: "24-Hour Security, Secure Gated Community" },
      { title: "Design:", text: "Formal Dining Area, Grand Double-Volume Lounge,High Ceilings, Statement Chandelier, Large Windows with Natural Lighting, Private Garden " },
      { title: "Kitchen:", text: "Modern Kitchen with Island, Walk-In Pantry" },
      { title: "Technology:", text: "Smart home infrastructure throughout" },
      { title: "Utilities:", text: "Borehole Water Supply, Ample Water Storage, Service Charge Included, " }
    ],
    paymentPlan: [
      { percent: 15, label: "Reservation" },
      { percent: 15, label: "Upon Sale Agreement" },
      { percent: 50, label: "During construction (spread over 18 months)" },
      { percent: 20, label: "Before or upon handover" },
      { percent: 0, label: "Interest" }
    ]
  },

  {
    id: "sl-008",
    slug: "dg-jkia-hotel-apartments",
    status: "available",
    collection: "featured",
    title: " DG JKIA Hotel Apartments",
    summary: "DG JKIA offers fully furnished hotel apartments near Jomo Kenyatta International Airport, Nairobi, featuring professional management, premium amenities, strong occupancy potential, hassle-free rental income, and returns of up to 25%.",
    propertyType: "apartment",
    community: "syokimau",
    location: "JKIA | Mombasa Road",
    letting: "sale",
    // Two floor plans in this development — see data/property-units.js for
    // how the rest of the site reads bedrooms/bathrooms/price off `units`.
    // NOTE: salePrice is identical for both units in the source data (both
    // 5,000,000) — flagging in case the 2-bedroom price was meant to differ.
    units: [
      { unitType: "studio", bedrooms: 0, bathrooms: 1, salePrice: 11700000, rentPrice: null },
      { unitType: "1-bedroom", bedrooms: 1, bathrooms: 3, salePrice: 13000000, rentPrice: null },
      
    ],
    
    image: "assets/images/DG JKIA swimming pool.jpeg",
    heroImage: "assets/images/DG JKIA Lounge (6).jpeg",
    gallery: [
      "assets/images/DG JKIA Lounge (3).jpeg",
      "assets/images/DG JKIA Studio.jpeg",
      "assets/images/DG JKIA (8).jpeg",
      "assets/images/DG JKIA Lounge (5).jpeg",
      "assets/images/DG JKIA Salon.jpeg",
      "assets/images/DG JKIA Gym (2).jpeg",
      "assets/images/DG JKIA exterior (3).jpeg",
      "assets/images/DG JKIA boardroom.jpeg"
      ],

    url: "dg-jkia-hotel-apartments",
    description: {
      title: "Hospitality Investment, Redefined:",
      body: "Positioned directly opposite Jomo Kenyatta International Airport along Mombasa Road, DG JKIA introduces a new generation of fully furnished and professionally managed hotel apartments designed for investors seeking consistent returns without the demands of day-to-day property management. Developed through a collaboration between SSS Developers and Reportage Properties, the development combines contemporary residences, premium hospitality services, and an unrivalled airport location to create one of Nairobi's most compelling investment opportunities. With immediate access to the Nairobi Expressway, SGR Terminus, and key business districts, DG JKIA is strategically placed to serve business travellers, airline crews, diplomats, transit passengers, and international visitors."
    },
    featureLocation: "2 Minutes to Westgate Shopping Mall, 3 Minutes to Sarit Centre, 5 Minutes to Westlands CBD, Near The Oval, Delta Corner & major corporate offices, Close to Aga Khan University Hospital",
    story: {
      rows: [
        { title: "Fully Furnished Contemporary Residences", 
          body: "Every apartment is delivered fully furnished and serviced, allowing investors to begin generating income without the need for additional fit-out. Available in four intelligently designed layouts, each residence combines efficient planning, premium finishes, private balconies, integrated wardrobes, double-glazed windows, high-speed internet connectivity, and modern interiors designed for short and extended stays." },
        { title: "Designed for Effortless Living", 
          body: "Every residence has been thoughtfully equipped to meet international hospitality standards. Contemporary kitchens, quality imported sanitary ware, gypsum ceilings, solar-heated water systems, and elegant finishes create comfortable spaces that balance functionality with modern design, ensuring a seamless experience for every guest." },
        { title: "A Professionally Managed Hospitality Experience", 
          body: "DG JKIA has been conceived as a hospitality-led investment rather than a conventional apartment development. Experienced hotel operators oversee the day-to-day management of the property, allowing owners to benefit from a professionally operated rental programme while enjoying hassle-free ownership. The pooled income model is designed to maximise occupancy and deliver consistent long-term performance." }
        
      ]
    },
    listedDate: "2026-07-22",
    featureHighlights: [
  { title: "Security:", text: "24-hour security with controlled access" },
  { title: "Connectivity:", text: "High-speed Wi-Fi, High-speed elevators" },
  { title: "Community:", text: "Bar & lounge and Landscaped gardens" },
  { title: "Amenities:", text: "Outdoor swimming pool, Hotel reception & concierge,Elegant arrival lobby" },
  { title: "Wellness:", text: "Rooftop yoga garden,Fully equipped fitness centre, Spa, massage rooms, steam & sauna" }
],
    closingParagraphs: "Located opposite Hilton Garden Inn JKIA, DG JKIA enjoys one of Nairobi's most strategic addresses. Residents and guests are only minutes from JKIA, the Nairobi Expressway, the SGR Terminus, Nairobi National Park, Capital Centre, Upper Hill, and Westlands, making the development an ideal base for international travellers and business professionals alike.\n\nDG JKIA has been purpose-built for investors seeking stable, professionally managed hospitality income. The combination of a globally connected airport location, fully furnished residences, hotel management, and a growing demand for quality accommodation places the development in a strong position for sustained occupancy and long-term capital growth. According to the developer, the project is structured to target up to 23% net ROI, while Reportage highlights investment potential of 25%+, reflecting the project's hospitality-focused model.",
    // Flexible off-plan payment schedule — see paymentPlan field reference
    // above. OPTIONAL: most properties omit this entirely.
    paymentPlan: [
      { percent: 15, label: "Reservation" },
      { percent: 15, label: "Upon Sale Agreement" },
      { percent: 50, label: "During construction (spread over 18 months)" },
      { percent: 20, label: "Before or upon handover" },
      { percent: 0, label: "Interest" }
    ]
  },
];
