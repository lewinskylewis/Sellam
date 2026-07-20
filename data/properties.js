/* ============================================================================
   SELLAM — CENTRAL PROPERTY INVENTORY  (single source of truth)
   ============================================================================
   THIS IS THE ONLY FILE YOU EDIT TO ADD / CHANGE / REMOVE A PROPERTY.

   Every page reads from this list:
     • Homepage search bar  -> filters this array
     • rent.html            -> auto-lists anything with letting "rent" or "both"
     • premium-properties   -> letting "sale" or "both"
     • exclusive-properties -> collection "exclusive"
     • property.html?id=X   -> the single property-detail template, looked up
                                by `id` (query param) or `slug`

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
   propertyType apartment | townhouse | villa | mansion | bungalow |
                penthouse | land | commercial
   community    runda | karen | lavington | westlands | kileleshwa | kilimani |
                muthaiga | nyari | ridgeways | gigiri | lower-kabete | ngong |
                syokimau
   location     Human-readable location shown on cards.
   letting      "sale" | "rent" | "both"   <- controls which pages list it
   salePrice    NUMBER (KES), or null if not for sale
   rentPrice    NUMBER (KES per month), or null if not for rent
   bedrooms     NUMBER
   bathrooms    NUMBER
   features     wifi | pool | gym | backup-generator | parking | security | garden
   image        Card thumbnail
   gallery      Image paths for the detail page carousel + story sections
   url          Link target for the card — property.html?id=<slug>
   description  Marketing copy for the detail page intro
   featureLocation  One-sentence location blurb for the blue features banner
   story        OPTIONAL. Bespoke narrative sections [{title, body}, ...] for
                the detail page's "various areas" (kitchen, bedrooms, etc).
                When omitted, property.html generates sensible generic
                sections automatically — nothing is ever left blank.
   listedDate   ISO date (YYYY-MM-DD) — used for "newest" sorting
   ============================================================================ */

window.SELLAM_PROPERTIES = [
  /* ---------------------------------------------------------------- FEATURED
     Listed for BOTH sale and rent — they appear on the premium listing AND
     automatically on the rent page via `letting: "both"`. */

  {
    id: "sl-001",
    slug: "4-bedroom-maisonette-runda-nairobi",
    status: "available",
    collection: "featured",
    title: "4 Bedroom Maisonette",
    propertyType: "mansion",
    community: "runda",
    location: "Runda, Nairobi",
    letting: "both",
    salePrice: 350000000,
    rentPrice: 350000,
    bedrooms: 4,
    bathrooms: 3,
    features: ["pool", "garden", "security", "parking", "backup-generator"],
    image: "assets/images/Premium properties/RundaMansion3.jpeg",
    gallery: [
      "assets/images/Premium properties/RundaMansion3.jpeg",
      "assets/images/Premium properties/RundaMansion2.jpeg",
      "assets/images/Premium properties/RundaMansion.jpeg",
      "assets/images/Premium properties/RundaMansion4.jpeg",
      "assets/images/property-detail-living.jpg",
      "assets/images/property-detail-dining.jpg",
      "assets/images/property-detail-lobby.jpg",
      "assets/images/property-detail-gym.jpg"
    ],
    url: "property.html?id=4-bedroom-maisonette-runda-nairobi",
    description: "A refined 4 bedroom maisonette in Runda, combining generous family living with mature gardens, secure grounds and easy access to diplomatic zones and top schools.",
    featureLocation: "Runda address near diplomatic zones, international schools, private clubs, and premium family neighborhoods.",
    listedDate: "2026-01-15"
  },

  {
    id: "sl-002",
    slug: "modern-villas-lavington",
    status: "available",
    collection: "featured",
    title: "Modern Villas",
    propertyType: "villa",
    community: "lavington",
    location: "Lavington, Nairobi",
    letting: "both",
    salePrice: 780000000,
    rentPrice: 320000,
    bedrooms: 5,
    bathrooms: 3,
    features: ["pool", "gym", "security", "parking", "wifi"],
    image: "assets/images/Premium properties/ModernVillas-Lavington9.jpeg",
    gallery: [
      "assets/images/Premium properties/ModernVillas-Lavington9.jpeg",
      "assets/images/Premium properties/ModernVillas-Lavington.jpeg",
      "assets/images/Premium properties/ModernVillas-Lavington2.jpeg",
      "assets/images/Premium properties/ModernVillas-Lavington3.jpeg",
      "assets/images/Premium properties/ModernVillas-Lavington4.jpeg",
      "assets/images/Premium properties/ModernVillas-Lavington5.jpeg",
      "assets/images/Premium properties/ModernVillas-Lavington6.jpeg",
      "assets/images/Premium properties/ModernVillas-Lavington7.jpeg"
    ],
    url: "property.html?id=modern-villas-lavington",
    description: "Contemporary villas in Lavington delivering open-plan living, premium finishes and private outdoor space within one of Nairobi's most established neighbourhoods.",
    featureLocation: "Lavington location with access to schools, malls, restaurants, hospitals, and key city routes.",
    listedDate: "2026-02-03"
  },

  {
    id: "sl-003",
    slug: "ostrea-villas-karen-nairobi",
    status: "available",
    collection: "featured",
    title: "Ostrea Villas",
    propertyType: "villa",
    community: "karen",
    location: "Karen, Nairobi",
    letting: "both",
    salePrice: 165000000,
    rentPrice: 420000,
    bedrooms: 5,
    bathrooms: 5,
    features: ["pool", "garden", "security", "parking", "backup-generator"],
    image: "assets/images/Premium properties/OSTREA Karen Villas (6).jpeg",
    gallery: [
      "assets/images/Premium properties/OSTREA Karen Villas (6).jpeg",
      "assets/images/Premium properties/OSTREA Karen Villas.jpeg",
      "assets/images/Premium properties/OSTREA Karen Villas (2).jpeg",
      "assets/images/Premium properties/OSTREA Karen Villas (3).jpeg",
      "assets/images/Premium properties/OSTREA Karen Villas (4).jpeg",
      "assets/images/Premium properties/OSTREA Karen Villas (5).jpeg",
      "assets/images/Premium properties/OSTREA Karen Villas (7).jpeg",
      "assets/images/Premium properties/OSTREA Karen Villas (8).jpeg"
    ],
    url: "property.html?id=ostrea-villas-karen-nairobi",
    description: "Elegant villas set on landscaped grounds in Karen, offering privacy, space and a calm residential setting close to private schools and clubs.",
    featureLocation: "Karen address near international schools, private clubs, green compounds, and lifestyle destinations.",
    listedDate: "2026-02-20"
  },

  {
    id: "sl-004",
    slug: "naserian-karen-nairobi",
    status: "available",
    collection: "featured",
    title: "Naserian",
    propertyType: "penthouse",
    community: "karen",
    location: "Karen, Nairobi",
    letting: "both",
    salePrice: 250000000,
    rentPrice: 400000,
    bedrooms: 5,
    bathrooms: 5,
    features: ["pool", "gym", "wifi", "security", "parking"],
    image: "assets/images/Premium properties/Naserian Karen.jpeg",
    gallery: [
      "assets/images/Premium properties/Naserian Karen.jpeg",
      "assets/images/Premium properties/Naserian Karen (2).jpeg",
      "assets/images/Premium properties/Naserian Karen (3).jpeg",
      "assets/images/Premium properties/Naserian Karen (4).jpeg",
      "assets/images/Premium properties/Naserian Karen (5).jpeg",
      "assets/images/Premium properties/Naserian Karen (6).jpeg",
      "assets/images/Premium properties/Naserian Karen (7).jpeg",
      "assets/images/Premium properties/Naserian Karen (8).jpeg"
    ],
    url: "property.html?id=naserian-karen-nairobi",
    description: "Naserian offers penthouse-style living in Karen with expansive interiors, refined detailing and secure, low-density surroundings.",
    featureLocation: "Karen location with proximity to schools, shopping, clubs, hospitals, and calm residential streets.",
    listedDate: "2026-03-05"
  },

  {
    id: "sl-005",
    slug: "5-bedroom-mansion-lower-kabete",
    status: "available",
    collection: "featured",
    title: "5 Bedroom Mansion",
    propertyType: "mansion",
    community: "lower-kabete",
    location: "Lower Kabete, Nairobi",
    letting: "both",
    salePrice: 250000000,
    rentPrice: 450000,
    bedrooms: 5,
    bathrooms: 5,
    features: ["pool", "gym", "wifi", "security", "parking", "backup-generator", "garden"],
    image: "assets/images/Premium properties/Lower Kabete 5 Bedroom (2).jpeg",
    gallery: [
      "assets/images/Premium properties/Lower Kabete 5 Bedroom (2).jpeg",
      "assets/images/Premium properties/Lower Kabete 5 Bedroom.jpeg",
      "assets/images/Premium properties/Lower Kabete 5 Bedroom (3).jpeg",
      "assets/images/Premium properties/Lower Kabete 5 Bedroom (4).jpeg",
      "assets/images/Premium properties/Lower Kabete 5 Bedroom (5).jpeg",
      "assets/images/Premium properties/Lower Kabete 5 Bedroom (6).jpeg",
      "assets/images/Premium properties/Lower Kabete 5 Bedroom (7).jpeg",
      "assets/images/Premium properties/Lower Kabete 5 Bedroom (8).jpeg"
    ],
    url: "property.html?id=5-bedroom-mansion-lower-kabete",
    description: "This 5 bed all en-suite, smart home has all the luxury a family needs for easy living. Large living room with curtain, light, security automation, which can be controlled from anywhere as long as you have WIFI connectivity in the house and on your smart gadget, for your peace of mind. Outdoor jacuzzi for 8 people.",
    featureLocation: "Lower Kabete address with access to Westlands, schools, private clubs, and established family neighborhoods.",
    /* Bespoke narrative content, hand-authored for this property — preserved
       exactly as it existed on the standalone page (images map to gallery
       indices 1, 2, 3, 4; wide = 5; pair = 6, 7). */
    story: {
      rows: [
        { title: "The Culinary Atelier", body: "The kitchen is thoughtfully designed to combine functionality with refined luxury. Premium granite countertops, high-end cabinetry, and integrated appliances—including a dishwasher, microwave, under-counter oven, gas hob, electric stove, and extractor fan—create a seamless cooking experience. A spacious breakfast nook, walk-in pantry, and dedicated laundry area complete a kitchen built for modern family living." },
        { title: "Private Retreats", body: "All five bedrooms are generously proportioned and en-suite, offering exceptional comfort and privacy. The soundproofed primary suite features Clipsal smart automation, a walk-in closet, bamboo flooring, and dedicated TV and telephone connectivity. The remaining bedrooms continue the home's premium standard with bamboo flooring, walk-in closets or built-in wardrobes, high ceilings, and integrated network and entertainment ports." },
        { title: "Wellness Sanctuaries", body: "From relaxed daily routines to private entertaining, 5 Bedroom Mansion is shaped around a comfortable premium lifestyle. The residence offers the kind of space, light, and calm expected from a carefully selected SELLAM property." },
        { title: "Grand Living", body: "Lower Kabete, Nairobi gives this property a strong residential context, with access to established amenities, key routes, and the privacy buyers expect from a premium address. It is positioned for both lifestyle appeal and long-term investment confidence." }
      ]
    },
    listedDate: "2026-03-18"
  },

  {
    id: "sl-006",
    slug: "9-bedroom-mansion-ngong",
    status: "available",
    collection: "featured",
    title: "9 Bedroom Mansion",
    propertyType: "mansion",
    community: "ngong",
    location: "Ngong, Nairobi",
    letting: "both",
    salePrice: 350000000,
    rentPrice: 450000,
    bedrooms: 9,
    bathrooms: 12,
    features: ["pool", "gym", "garden", "security", "parking", "backup-generator"],
    image: "assets/images/Premium properties/CROWN JEWEL (2).jpeg",
    gallery: [
      "assets/images/Premium properties/CROWN JEWEL (2).jpeg",
      "assets/images/Premium properties/CROWN JEWEL.jpeg",
      "assets/images/Premium properties/CROWN JEWEL (3).jpeg",
      "assets/images/Premium properties/CROWN JEWEL (4).jpeg",
      "assets/images/Premium properties/CROWN JEWEL (5).jpeg",
      "assets/images/Premium properties/CROWN JEWEL (6).jpeg",
      "assets/images/Premium properties/CROWN JEWEL (7).jpeg",
      "assets/images/Premium properties/CROWN JEWEL (8).jpeg"
    ],
    url: "property.html?id=9-bedroom-mansion-ngong",
    description: "An exceptional nine bedroom residence in Ngong set on expansive grounds, designed for large-scale family living and entertaining.",
    featureLocation: "Ngong address with access to schools, shopping, transport links, and green residential settings.",
    listedDate: "2026-04-02"
  },

  {
    id: "sl-007",
    slug: "5-bedroom-super-villa-lower-kabete",
    status: "available",
    collection: "featured",
    title: "5 Bedroom Super Villa",
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
  }
];
