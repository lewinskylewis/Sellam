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
     • property.html?id=X      -> the single property-detail template, looked
                                   up by `id` (query param) or `slug`

   DATA ONLY — no logic lives here. This shape is also the future database
   row / API response, so an admin dashboard can write to it unchanged.

   ⚠ PLACEHOLDER DATA: features, some prices, descriptions, galleries and
   listedDate are placeholders so the template is fully wired end-to-end.
   Replace the values with the client's real data — the structure stays.

   ---------------------------------------------------------------------------
   FIELD REFERENCE  (all values in KES)
   ---------------------------------------------------------------------------
   id           Stable unique key. NEVER change once set (dashboard/routing).
   slug         URL-friendly name; also the `?id=` value for property.html.
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
   url          Link target for the card — property.html?id=<slug>
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
      { unitType: "bedsitter", bedrooms: 0, bathrooms: 1, salePrice: 3000000, rentPrice: null },
      { unitType: "studio", bedrooms: 0, bathrooms: 1, salePrice: 2000000, rentPrice: null },
      { unitType: "mini-1-bedroom", bedrooms: 1, bathrooms: 1, salePrice: 10000000, rentPrice: null },
      { unitType: "1-bedroom", bedrooms: 1, bathrooms: 3, salePrice: 13000000, rentPrice: null },
      { unitType: "2-bedroom", bedrooms: 2, bathrooms: 2, salePrice: 20000000, rentPrice: null },
      { unitType: "3-bedroom", bedrooms: 3, bathrooms: 3, salePrice: 30000000, rentPrice: null }
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

    url: "property.html?id=silva-gigiri-residences",
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
    url: "property.html?id=cheval-riverside",
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

    url: "property.html?id=diplomat-residences",
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
    listedDate: "2026-07-22"
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
    url: "property.html?id=gaia-brookside-forest-nairobi",
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
    listedDate: "2026-07-23"
  },

  {
    id: "sl-005",
    slug: "hephé-palace",
    status: "available",
    collection: "featured",
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
      { bedrooms: 1, bathrooms: 3, salePrice: 6200000, rentPrice: null },
      { bedrooms: 2, bathrooms: 3, salePrice: 50000000, rentPrice: null },
      { bedrooms: 3, bathrooms: 3, salePrice: 60000000, rentPrice: null }
      
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
    url: "property.html?id=hephé-palace",
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
    listedDate: "2026-07-23"
  },

  {
    id: "sl-006",
    slug: "amethyst-residences",
    status: "available",
    collection: "featured",
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
      { bedrooms: 1, bathrooms: 3, salePrice: 6200000, rentPrice: null },
      { bedrooms: 2, bathrooms: 3, salePrice: 50000000, rentPrice: null }
           
    ],
    features: ["pool", "gym", "garden", "security", "parking", "backup-generator"],
    image: "assets/images/Amethyst Residences Outdoors.jpeg",
    gallery: [
      "assets/images/Amethyst Residences (10).jpeg",
      "assets/images/Amethyst Residences Living Room (2).jpeg",
      "assets/images/Premium properties/CROWN JEWEL (3).jpeg",
      "assets/images/Premium properties/CROWN JEWEL (4).jpeg",
      "assets/images/Premium properties/CROWN JEWEL (5).jpeg",
      "assets/images/Premium properties/CROWN JEWEL (6).jpeg",
      "assets/images/Premium properties/CROWN JEWEL (7).jpeg",
      "assets/images/Premium properties/CROWN JEWEL (8).jpeg"
    ],
    url: "property.html?id=amethyst-residences",
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
    listedDate: "2026-07-23"
  },

  {
    id: "sl-007",
    slug: "5-bedroom-super-villa-lower-kabete",
    status: "available",
    collection: "featured",
    title: "5 Bedroom Super Villa",
    summary: "A super villa in Lower Kabete blending scale and comfort, with landscaped gardens, secure parking and generous en-suite accommodation.",
    propertyType: "villa",
    community: "lower-kabete",
    location: "Lower Kabete, Nairobi",
    letting: "both",
    salePrice: 185000000,
    rentPrice: 380000,
    bedrooms: 5,
    bathrooms: 6,
    features: ["pool", "garden", "security", "parking", "wifi"],
    image: "assets/images/Premium properties/Super Villa, Lower Kabete 2.jpeg",
    gallery: [
      "assets/images/Premium properties/Super Villa, Lower Kabete 2.jpeg",
      "assets/images/Premium properties/Super Villa, Lower Kabete.jpeg",
      "assets/images/Premium properties/Super Villa, Lower Kabete 3.jpeg",
      "assets/images/Premium properties/Super Villa, Lower Kabete 4.jpeg",
      "assets/images/Premium properties/Super Villa, Lower Kabete 5.jpeg",
      "assets/images/Premium properties/Super Villa, Lower Kabete 6.jpeg"
    ],
    url: "property.html?id=5-bedroom-super-villa-lower-kabete",
    description: "A super villa in Lower Kabete blending scale and comfort, with landscaped gardens, secure parking and generous en-suite accommodation.",
    featureLocation: "Lower Kabete address with access to Westlands, schools, private clubs, and established family neighborhoods.",
    listedDate: "2026-04-14"
  },

  {
    id: "sl-008",
    slug: "grosvenor-karen",
    status: "available",
    collection: "featured",
    title: "Grosvenor",
    summary: "Well-appointed apartments in Karen offering secure, low-maintenance living with quality shared amenities and quick access to the city.",
    propertyType: "apartment",
    community: "karen",
    location: "Karen, Nairobi",
    letting: "both",
    salePrice: 48000000,
    rentPrice: 220000,
    bedrooms: 3,
    bathrooms: 3,
    features: ["gym", "wifi", "security", "parking", "backup-generator"],
    image: "assets/images/premium-page-grosvenor-towers.jpg",
    gallery: ["assets/images/premium-page-grosvenor-towers.jpg"],
    url: "property.html?id=grosvenor-karen",
    description: "Well-appointed apartments in Karen offering secure, low-maintenance living with quality shared amenities and quick access to the city.",
    featureLocation: "Karen address near green compounds, international schools, private clubs, and lifestyle amenities.",
    listedDate: "2026-04-28"
  },

  /* --------------------------------------------------------------- EXCLUSIVE
     Off-market / exclusive listings. */

  {
    id: "sl-009",
    slug: "dg-jkia-syokimau",
    status: "available",
    collection: "exclusive",
    title: "DG JKIA",
    summary: "A strategically positioned Syokimau development near JKIA and key transport routes, suited to both owner-occupiers and investors.",
    propertyType: "apartment",
    community: "syokimau",
    location: "Syokimau, Nairobi",
    letting: "sale",
    salePrice: 32000000,
    rentPrice: null,
    bedrooms: 4,
    bathrooms: 3,
    features: ["gym", "wifi", "security", "parking", "backup-generator"],
    image: "assets/images/premium-kitchen.webp",
    gallery: ["assets/images/premium-kitchen.webp"],
    url: "property.html?id=dg-jkia-syokimau",
    description: "A strategically positioned Syokimau development near JKIA and key transport routes, suited to both owner-occupiers and investors.",
    featureLocation: "Strategic Syokimau address near JKIA, expressway routes, and emerging commercial hubs.",
    listedDate: "2026-01-22"
  },

  {
    id: "sl-010",
    slug: "crestpoint-karen",
    status: "available",
    collection: "exclusive",
    title: "Crestpoint",
    summary: "Crestpoint brings rare Karen privacy together with composed interiors, generous natural light, elegant finishes, and a setting designed for selective homeowners who value calm and discretion.",
    propertyType: "apartment",
    community: "karen",
    location: "Karen, Nairobi",
    letting: "sale",
    salePrice: 56000000,
    rentPrice: null,
    bedrooms: 3,
    bathrooms: 3,
    features: ["pool", "gym", "security", "parking", "garden"],
    image: "assets/images/fax.jpeg",
    gallery: ["assets/images/fax.jpeg"],
    url: "property.html?id=crestpoint-karen",
    description: "Crestpoint brings rare Karen privacy together with composed interiors, generous natural light, elegant finishes, and a setting designed for selective homeowners who value calm and discretion.",
    featureLocation: "Quiet Karen setting near private schools, clubs, green compounds, and lifestyle amenities.",
    listedDate: "2026-02-10"
  },

  {
    id: "sl-011",
    slug: "dg-west-westlands",
    status: "available",
    collection: "exclusive",
    title: "DG West",
    summary: "DG West is positioned for clients seeking elevated city living, panoramic convenience, secure access, premium amenities, and an address with strong long-term demand.",
    propertyType: "apartment",
    community: "westlands",
    location: "Westlands, Nairobi",
    letting: "sale",
    salePrice: 61000000,
    rentPrice: null,
    bedrooms: 4,
    bathrooms: 3,
    features: ["gym", "wifi", "security", "parking", "backup-generator"],
    image: "assets/images/Fax2.jpg",
    gallery: ["assets/images/Fax2.jpg"],
    url: "property.html?id=dg-west-westlands",
    description: "DG West is positioned for clients seeking elevated city living, panoramic convenience, secure access, premium amenities, and an address with strong long-term demand.",
    featureLocation: "Prime Westlands address with fast access to business, dining, retail, and entertainment.",
    listedDate: "2026-02-26"
  },

  {
    id: "sl-012",
    slug: "aum-residence-kileleshwa",
    status: "available",
    collection: "exclusive",
    title: "Aum Residence",
    summary: "Aum Residence combines sculptural architecture, refined apartment living, secure access, and a privileged Kileleshwa setting designed for buyers who want exclusivity without excess.",
    propertyType: "apartment",
    community: "kileleshwa",
    location: "Kileleshwa, Nairobi",
    letting: "sale",
    salePrice: 43000000,
    rentPrice: null,
    bedrooms: 3,
    bathrooms: 3,
    features: ["gym", "wifi", "security", "parking"],
    image: "assets/images/aumout.jpeg",
    gallery: ["assets/images/aumout.jpeg"],
    url: "property.html?id=aum-residence-kileleshwa",
    description: "Aum Residence combines sculptural architecture, refined apartment living, secure access, and a privileged Kileleshwa setting designed for buyers who want exclusivity without excess.",
    featureLocation: "Kileleshwa address close to schools, shopping, hospitals, and Nairobi's core business routes.",
    listedDate: "2026-03-11"
  },

  {
    id: "sl-013",
    slug: "kileleshwa-heights",
    status: "available",
    collection: "exclusive",
    title: "Kileleshwa Heights",
    summary: "Kileleshwa Heights offers a limited collection of premium apartments with green surroundings, strong connectivity, modern amenities, and polished residential comfort.",
    propertyType: "apartment",
    community: "kileleshwa",
    location: "Kileleshwa, Nairobi",
    letting: "sale",
    salePrice: 39000000,
    rentPrice: null,
    bedrooms: 3,
    bathrooms: 3,
    features: ["gym", "wifi", "security", "parking", "backup-generator"],
    image: "assets/images/Kileout.png",
    gallery: ["assets/images/Kileout.png", "assets/images/Kile.png"],
    url: "property.html?id=kileleshwa-heights",
    description: "Kileleshwa Heights offers a limited collection of premium apartments with green surroundings, strong connectivity, modern amenities, and polished residential comfort.",
    featureLocation: "Central Kileleshwa address with easy access to Lavington, Kilimani, Westlands, and key schools.",
    listedDate: "2026-03-24"
  },

  {
    id: "sl-014",
    slug: "crystal-oak-runda",
    status: "available",
    collection: "exclusive",
    title: "Crystal Oak",
    summary: "Crystal Oak is a discreet Runda address with generous space, refined detailing, privacy, and proximity to Nairobi's most established diplomatic and family neighborhoods.",
    propertyType: "villa",
    community: "runda",
    location: "Runda, Nairobi",
    letting: "sale",
    salePrice: 145000000,
    rentPrice: null,
    bedrooms: 4,
    bathrooms: 4,
    features: ["pool", "garden", "security", "parking", "backup-generator"],
    image: "assets/images/grosout.JPG",
    gallery: ["assets/images/grosout.JPG", "assets/images/gros2.jpg"],
    url: "property.html?id=crystal-oak-runda",
    description: "Crystal Oak is a discreet Runda address with generous space, refined detailing, privacy, and proximity to Nairobi's most established diplomatic and family neighborhoods.",
    featureLocation: "Runda setting near diplomatic zones, top schools, private clubs, and established family communities.",
    listedDate: "2026-04-08"
  },

  {
    id: "sl-015",
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
    url: "property.html?id=moon-valley-nyari",
    description: "Moon Valley brings rare off-market homes to Nyari, pairing privacy, elegant architecture, strong security, and a carefully selected residential environment.",
    featureLocation: "Nyari address with premium privacy, strong access, and proximity to diplomatic residential corridors.",
    listedDate: "2026-04-21"
  },

  {
    id: "sl-016",
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
    url: "property.html?id=grosvenor-westlands",
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
    id: "sl-017",
    slug: "grade-a-office-suite-westlands",
    status: "available",
    collection: "featured",
    title: "Grade A Office Suite",
    summary: "A Grade A office suite in Westlands offering open-plan floor space, fast fibre connectivity, and full backup power for uninterrupted business operations.",
    propertyType: "office",
    community: "westlands",
    location: "Westlands, Nairobi",
    letting: "rent",
    salePrice: null,
    rentPrice: 280000,
    bedrooms: null,
    bathrooms: null,
    features: ["wifi", "parking", "security", "backup-generator"],
    image: "assets/images/buy/commercial.jpg",
    gallery: ["assets/images/buy/commercial.jpg"],
    url: "property.html?id=grade-a-office-suite-westlands",
    description: "A Grade A office suite in Westlands offering open-plan floor space, fast fibre connectivity, and full backup power for uninterrupted business operations.",
    featureLocation: "Westlands address with strong visibility, easy client access, and proximity to Nairobi's core business district.",
    listedDate: "2026-05-14"
  },

  {
    id: "sl-018",
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
    url: "property.html?id=riverside-business-park-office",
    description: "A flexible office floor in a well-managed Kilimani business park, suited to growing teams that need a professional, secure working environment.",
    featureLocation: "Kilimani location with quick access to Yaya Centre, Adlife Plaza, and the wider Kilimani/Upper Hill business corridor.",
    listedDate: "2026-05-19"
  },

  {
    id: "sl-019",
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
    url: "property.html?id=high-street-retail-unit-westlands",
    description: "A high-visibility retail unit on a busy Westlands street front, ideal for a flagship store, showroom, or high-footfall food and beverage concept.",
    featureLocation: "Westlands high street with heavy pedestrian and vehicle traffic, close to malls, offices, and residential density.",
    listedDate: "2026-05-24"
  },

  {
    id: "sl-020",
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
    url: "property.html?id=kilimani-mall-retail-space",
    description: "A ground-floor retail space within an established Kilimani shopping mall, benefiting from shared footfall, parking, and security.",
    featureLocation: "Kilimani address inside an active retail mall with consistent shopper traffic and shared amenities.",
    listedDate: "2026-05-29"
  },

  {
    id: "sl-021",
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
    url: "property.html?id=syokimau-distribution-warehouse",
    description: "A large distribution warehouse near JKIA and the Standard Gauge Railway terminus, with generous loading access and yard space for logistics operations.",
    featureLocation: "Syokimau location with fast access to JKIA, the Mombasa Road corridor, and the SGR freight terminus.",
    listedDate: "2026-06-03"
  },

  {
    id: "sl-022",
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
    url: "property.html?id=ngong-road-light-industrial-unit",
    description: "A light industrial and workshop unit along the Ngong Road corridor, suited to small-scale manufacturing, storage, or a trade workshop.",
    featureLocation: "Ngong Road address with straightforward access for goods vehicles and proximity to Nairobi's southern industrial belt.",
    listedDate: "2026-06-08"
  },

  {
    id: "sl-023",
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
    url: "property.html?id=karen-commercial-land-plot",
    description: "A fenced, commercially-zoned land plot in Karen available on a long-term lease, suited to a showroom, storage yard, or purpose-built development.",
    featureLocation: "Karen address with good road access and a quiet, established commercial and residential setting.",
    listedDate: "2026-06-13"
  },

  {
    id: "sl-024",
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
    url: "property.html?id=ngong-development-land",
    description: "An open land plot in Ngong available for lease, suited to temporary yard use, agribusiness, or a phased development project.",
    featureLocation: "Ngong location with growing infrastructure and easy access to Nairobi via Ngong Road.",
    listedDate: "2026-06-18"
  }
];
