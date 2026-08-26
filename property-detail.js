const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const PRICE_TAG_SVG =
  '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill-rule="evenodd" clip-rule="evenodd" d="M4.8 3h7.05c.53 0 1.04.21 1.41.59l7.15 7.15a2 2 0 0 1 0 2.83l-6.84 6.84a2 2 0 0 1-2.83 0l-7.15-7.15A2 2 0 0 1 3 11.85V4.8C3 3.81 3.81 3 4.8 3Zm3.25 6.15a2.1 2.1 0 1 0 0-4.2 2.1 2.1 0 0 0 0 4.2Z"/></svg>';

const commonGallery = [
  {
    src: "assets/images/property-detail-tower.jpg",
    alt: "Property tower exterior"
  },
  {
    src: "assets/images/property-detail-balcony.jpg",
    alt: "Private balcony outlook"
  },
  {
    src: "assets/images/property-detail-corridor.jpg",
    alt: "Residential corridor"
  },
  {
    src: "assets/images/property-detail-living.jpg",
    alt: "Living and bedroom suite"
  },
  {
    src: "assets/images/property-detail-pool.jpg",
    alt: "Pool deck"
  },
  {
    src: "assets/images/property-detail-lobby.jpg",
    alt: "Grand arrival lounge"
  },
  {
    src: "assets/images/property-detail-gym.jpg",
    alt: "Wellness gym"
  },
  {
    src: "assets/images/property-detail-dining.jpg",
    alt: "Open dining lounge"
  }
];

const propertyData = {
  "dg-west": {
    title: "DG WEST",
    location: "Westlands, Nairobi",
    price: "USD 450,000",
    hero: "assets/images/property-detail-living.jpg",
    heroAlt: "DG WEST premium living suite",
    description:
      "DG West is a signature residence where thoughtful design meets urban convenience, offering a lifestyle tailored for discerning homeowners and smart investors alike. Located in a prime, rapidly growing area, this development blends modern architecture with refined finishes to create a truly elevated living experience. Whether you're buying your first home, upgrading your lifestyle, or expanding your real estate portfolio, DG West delivers on all fronts. Each unit is crafted for comfort, natural light, and efficient living, complemented by a full suite of amenities that set the property apart.\n\nEnjoy a fully equipped gym for your fitness goals, a rooftop entertainment lounge perfect for relaxing or hosting guests, a safe and spacious children’s play area, and beautiful communal spaces designed to build a sense of community. Additional features include high-speed lifts, 24/7 manned security with CCTV surveillance, secure and ample parking, borehole water supply, solar water heating, and fibre-optic internet infrastructure for seamless connectivity. With flexible payment plans and investor-friendly pricing, DG West offers more than just a place to live—it’s a long-term asset. Reach out today to schedule a site visit and see firsthand what makes this development a standout in the Nairobi property market.",
    featureLocation: "Prime CBD address with high visibility and foot traffic.",
    storyText: [
      {
        title: "The Master Sanctuary",
        body: "Step into a realm of calm refinement. This bedroom is designed as a private retreat where elegant textures, soft lighting, and warm tones meet to create a sanctuary of peace. Floor-to-ceiling windows invite natural light while rich finishes and ambient detail exude quiet luxury. It's more than just a bedroom—it's your daily escape, tailored for rest, rejuvenation, and inspired mornings."
      },
      {
        title: "The Skyline Oasis",
        body: "Unwind in the serene embrace of our rooftop infinity pool—an exquisite blend of leisure and panoramic beauty. The Skyline Oasis offers crystal-clear waters, luxury deck seating, and ambient surroundings that feel worlds away from city bustle. Whether for a morning swim or golden-hour retreat, this pool redefines indulgence. Here, relaxation meets elegance in the most breathtaking way imaginable."
      },
      {
        title: "The Prestige Wellness Suite",
        body: "Elevate your lifestyle in a gym curated for those who value excellence. The Prestige Wellness Suite features state-of-the-art fitness equipment, mood-enhancing lighting, and ample space for yoga, strength training, or cardio. Set within a tranquil design palette, every workout feels like a luxury ritual. Whether you're starting your day or unwinding, this space turns wellness into a daily indulgence."
      },
      {
        title: "The Grand Arrival Lounge",
        body: "Make every entrance unforgettable. The hotel-style reception at Sellam blends timeless class with five-star ambiance. Double-height ceilings, curated art, and bespoke lighting welcome you with poise and prestige. Whether greeting guests or returning home, this is a space where first impressions are felt deeply—crafted to mirror the sophistication of a luxury hotel in every detail."
      }
    ],
    gallery: commonGallery
  },
  "grosvenor-westlands": {
    title: "Grosvenor",
    location: "Westlands, Nairobi",
    price: "USD 395,000",
    hero: "assets/images/property-detail-bedroom.jpg",
    heroAlt: "Grosvenor refined bedroom suite",
    description:
      "Grosvenor brings a polished residential experience to Westlands, combining refined interiors, secure living, and strong access to business, dining, and lifestyle conveniences. The development is planned for buyers seeking elegance, privacy, and enduring value.",
    featureLocation: "Prestigious Westlands location close to offices, restaurants, retail, and lifestyle amenities.",
    gallery: [
      commonGallery[3],
      commonGallery[0],
      commonGallery[1],
      commonGallery[5],
      commonGallery[4],
      commonGallery[6],
      commonGallery[7],
      commonGallery[2]
    ]
  },
  "dg-jkia": {
    title: "DG JKIA",
    location: "JKIA, Syokimau",
    price: "USD 320,000",
    hero: "assets/images/property-detail-pool.jpg",
    heroAlt: "DG JKIA pool and leisure deck",
    description:
      "DG JKIA offers contemporary homes positioned for convenience, connectivity, and investment resilience. With easy access to JKIA, expressway routes, and growing lifestyle corridors, it is designed for residents who value movement, comfort, and modern finishes.",
    featureLocation: "Strategic Syokimau address near JKIA, key transport routes, and emerging commercial hubs.",
    gallery: [
      commonGallery[4],
      commonGallery[7],
      commonGallery[3],
      commonGallery[1],
      commonGallery[6],
      commonGallery[5],
      commonGallery[0],
      commonGallery[2]
    ]
  },
  "crespoint-towers": {
    title: "Crespoint Towers",
    location: "Muthaiga, Nairobi",
    price: "USD 410,000",
    hero: "assets/images/property-detail-dining.jpg",
    heroAlt: "Crespoint Towers dining and living space",
    description:
      "Crespoint Towers is crafted for refined urban living, pairing premium residences with thoughtful amenities and elegant social spaces. Its location, material quality, and carefully planned homes create a composed address for both homeowners and investors.",
    featureLocation: "Well-connected Muthaiga address with fast access to premium schools, clubs, and city routes.",
    gallery: [
      commonGallery[7],
      commonGallery[0],
      commonGallery[4],
      commonGallery[3],
      commonGallery[5],
      commonGallery[6],
      commonGallery[1],
      commonGallery[2]
    ]
  },
  seaview: {
    title: "Seaview",
    location: "Nyali, Mombasa",
    price: "USD 520,000",
    hero: "assets/images/property-detail-pool.jpg",
    heroAlt: "Seaview pool deck",
    description:
      "Seaview is a coastal residence shaped around light, leisure, and long-term lifestyle value. Spacious homes, resort-style amenities, and a serene setting make it a premium option for buyers seeking refined living by the coast.",
    featureLocation: "Prime Nyali coastal address near beaches, retail, hotels, and leisure destinations.",
    gallery: [
      commonGallery[4],
      commonGallery[3],
      commonGallery[7],
      commonGallery[1],
      commonGallery[5],
      commonGallery[6],
      commonGallery[0],
      commonGallery[2]
    ]
  },
  "grosvenor-ngong": {
    title: "Grosvenor",
    location: "Ngong, Nairobi",
    price: "USD 285,000",
    hero: "assets/images/property-detail-arrival.jpg",
    heroAlt: "Grosvenor arrival lounge",
    description:
      "Grosvenor Ngong offers a private, composed residential experience with contemporary planning and strong access to growing suburban corridors. It is built for buyers who value space, security, and modern everyday comfort.",
    featureLocation: "Ngong address with access to schools, shopping, transport links, and green residential settings.",
    gallery: [
      commonGallery[5],
      commonGallery[3],
      commonGallery[7],
      commonGallery[4],
      commonGallery[1],
      commonGallery[6],
      commonGallery[0],
      commonGallery[2]
    ]
  },
  "dg-west-tower": {
    title: "DG WEST",
    location: "Westlands, Nairobi",
    price: "USD 450,000",
    hero: "assets/images/property-detail-tower.jpg",
    heroAlt: "DG WEST tower exterior",
    description:
      "DG West Tower is a landmark address shaped by bold architecture, efficient residences, and elevated lifestyle spaces. Its Westlands position gives residents immediate access to Nairobi's strongest business and lifestyle districts.",
    featureLocation: "Landmark Westlands address with strong visibility, city access, and high investment appeal.",
    gallery: [
      commonGallery[0],
      commonGallery[3],
      commonGallery[4],
      commonGallery[1],
      commonGallery[5],
      commonGallery[6],
      commonGallery[7],
      commonGallery[2]
    ]
  },
  "grosvenor-karen": {
    title: "Grosvenor",
    location: "Karen, Nairobi",
    price: "USD 480,000",
    hero: "assets/images/property-detail-bedroom.jpg",
    heroAlt: "Grosvenor Karen bedroom suite",
    description:
      "Grosvenor Karen combines calm residential character with premium contemporary comfort. Generous spaces, elegant amenities, and a private setting make it ideal for families and investors seeking an enduring address.",
    featureLocation: "Karen address near green compounds, international schools, private clubs, and lifestyle amenities.",
    gallery: [
      commonGallery[3],
      commonGallery[5],
      commonGallery[7],
      commonGallery[4],
      commonGallery[6],
      commonGallery[1],
      commonGallery[0],
      commonGallery[2]
    ]
  },
  "exclusive-dg-jkia": {
    title: "DG JKIA",
    location: "Syokimau, Nairobi",
    price: "Price on Application",
    hero: "assets/images/premium-kitchen.webp",
    heroAlt: "DG JKIA exclusive kitchen and dining interior",
    description:
      "DG JKIA is an exclusive off-market residence shaped for discerning buyers seeking polished interiors, controlled access, refined amenities, and long-term investment strength near Nairobi's growing airport corridor. The development pairs modern planning with elegant finishes, giving homeowners a composed lifestyle close to major transport routes and key commercial movement.",
    featureLocation: "Strategic Syokimau address near JKIA, expressway routes, and emerging commercial hubs.",
    gallery: [
      { src: "assets/images/premium-kitchen.webp", alt: "DG JKIA kitchen and dining interior" },
      commonGallery[4],
      commonGallery[3],
      commonGallery[7],
      commonGallery[1],
      commonGallery[6],
      commonGallery[5],
      commonGallery[0]
    ]
  },
  "exclusive-crestpoint-karen": {
    title: "Crestpoint",
    location: "Karen, Nairobi",
    price: "Price on Application",
    hero: "assets/images/fax.jpeg",
    heroAlt: "Crestpoint Karen exclusive living room interior",
    description:
      "Crestpoint brings rare Karen privacy together with composed interiors, generous natural light, elegant finishes, and a setting designed for selective homeowners who value calm and discretion. Its refined residential character makes it ideal for clients seeking a private address with enduring value.",
    featureLocation: "Quiet Karen setting near private schools, clubs, green compounds, and lifestyle amenities.",
    gallery: [
      { src: "assets/images/fax.jpeg", alt: "Crestpoint living room interior" },
      commonGallery[7],
      commonGallery[3],
      commonGallery[5],
      commonGallery[1],
      commonGallery[6],
      commonGallery[4],
      commonGallery[2]
    ]
  },
  "exclusive-dg-west": {
    title: "DG West",
    location: "Westlands, Nairobi",
    price: "USD 450,000",
    hero: "assets/images/Fax2.jpg",
    heroAlt: "DG West exclusive living room interior",
    description:
      "DG West is positioned for clients seeking elevated city living, panoramic convenience, secure access, premium amenities, and an address with strong long-term demand. It blends urban sophistication with investment confidence in one of Nairobi's most active lifestyle and business districts.",
    featureLocation: "Prime Westlands address with fast access to business, dining, retail, and entertainment.",
    gallery: [
      { src: "assets/images/Fax2.jpg", alt: "DG West living room interior" },
      commonGallery[3],
      commonGallery[0],
      commonGallery[4],
      commonGallery[7],
      commonGallery[6],
      commonGallery[5],
      commonGallery[1]
    ]
  },
  "exclusive-aum-residence": {
    title: "Aum Residence",
    location: "Kileleshwa, Nairobi",
    price: "Price on Application",
    hero: "assets/images/aumout.jpeg",
    heroAlt: "Aum Residence exclusive exterior",
    description:
      "Aum Residence combines sculptural architecture, refined apartment living, secure access, and a privileged Kileleshwa setting designed for buyers who want exclusivity without excess. The address is selected for privacy, accessibility, and long-term residential appeal.",
    featureLocation: "Kileleshwa address close to schools, shopping, hospitals, and Nairobi's core business routes.",
    gallery: [
      { src: "assets/images/aumout.jpeg", alt: "Aum Residence exterior" },
      commonGallery[0],
      commonGallery[3],
      commonGallery[4],
      commonGallery[7],
      commonGallery[1],
      commonGallery[5],
      commonGallery[6]
    ]
  },
  "exclusive-kileleshwa-heights": {
    title: "Kileleshwa Heights",
    location: "Kileleshwa, Nairobi",
    price: "KES 18,500,000",
    hero: "assets/images/Kileout.png",
    heroAlt: "Kileleshwa Heights exclusive exterior",
    description:
      "Kileleshwa Heights offers a limited collection of premium apartments with green surroundings, strong connectivity, modern amenities, and polished residential comfort. It is designed for homeowners and investors who value central convenience with a quieter residential feel.",
    featureLocation: "Central Kileleshwa address with easy access to Lavington, Kilimani, Westlands, and key schools.",
    gallery: [
      { src: "assets/images/Kileout.png", alt: "Kileleshwa Heights exterior" },
      { src: "assets/images/Kile.png", alt: "Kileleshwa Heights residence view" },
      commonGallery[3],
      commonGallery[7],
      commonGallery[4],
      commonGallery[1],
      commonGallery[6],
      commonGallery[5]
    ]
  },
  "exclusive-crystal-oak": {
    title: "Crystal Oak",
    location: "Runda, Nairobi",
    price: "Price on Application",
    hero: "assets/images/grosout.JPG",
    heroAlt: "Crystal Oak exclusive residence exterior",
    description:
      "Crystal Oak is a discreet Runda address with generous space, refined detailing, privacy, and proximity to Nairobi's most established diplomatic and family neighborhoods. It is curated for clients seeking security, quiet prestige, and lasting lifestyle value.",
    featureLocation: "Runda setting near diplomatic zones, top schools, private clubs, and established family communities.",
    gallery: [
      { src: "assets/images/grosout.JPG", alt: "Crystal Oak residence exterior" },
      { src: "assets/images/gros2.jpg", alt: "Crystal Oak interior" },
      commonGallery[1],
      commonGallery[5],
      commonGallery[7],
      commonGallery[4],
      commonGallery[6],
      commonGallery[3]
    ]
  },
  "exclusive-moon-valley": {
    title: "Moon Valley",
    location: "Nyari, Nairobi",
    price: "Price on Application",
    hero: "assets/images/hero-moon-valley.webp",
    heroAlt: "Moon Valley exclusive tower exterior",
    description:
      "Moon Valley brings rare off-market homes to Nyari, pairing privacy, elegant architecture, strong security, and a carefully selected residential environment. The property is intended for buyers who want a quieter address with a premium, appointment-led buying experience.",
    featureLocation: "Nyari address with premium privacy, strong access, and proximity to diplomatic residential corridors.",
    gallery: [
      { src: "assets/images/hero-moon-valley.webp", alt: "Moon Valley exterior" },
      commonGallery[0],
      commonGallery[3],
      commonGallery[4],
      commonGallery[7],
      commonGallery[1],
      commonGallery[5],
      commonGallery[6]
    ]
  },
  "exclusive-grosvenor": {
    title: "Grosvenor",
    location: "Westlands, Nairobi",
    price: "USD 395,000",
    hero: "assets/images/grosvenor.jpg",
    heroAlt: "Grosvenor exclusive residence exterior",
    description:
      "Grosvenor is a premium city residence for buyers who want refined finishes, controlled access, central convenience, and the confidence of a high-demand Westlands address. It is curated for homeowners and investors seeking a polished urban asset.",
    featureLocation: "Prestigious Westlands location close to offices, restaurants, retail, and lifestyle amenities.",
    gallery: [
      { src: "assets/images/grosvenor.jpg", alt: "Grosvenor residence exterior" },
      commonGallery[3],
      commonGallery[0],
      commonGallery[1],
      commonGallery[5],
      commonGallery[4],
      commonGallery[7],
      commonGallery[6]
    ]
  }
};

// Shared "Pricing option" the client gave for the 4 real international
// listings below (ShomaBay, Brabus Villas, Afra Park, Indabyo Heights):
// "10% Down Payment + 5% Discount, 1% Monthly Installments until completion".
const INTERNATIONAL_PAYMENT_PLAN = [
  { percent: 10, label: "Down payment" },
  { percent: 5, label: "Discount for paying the down payment" },
  { percent: 1, label: "Monthly installments until completion" }
];

Object.assign(propertyData, {
  "revenance-residency": {
    title: "Revenance Residency",
    location: "New York, USA",
    price: "Price on Application",
    hero: "assets/images/diaspora-new-york.webp",
    heroAlt: "Revenance Residency exterior with pool",
    description:
      "Revenance Residency is a diaspora property template for a New York residence. This page has been duplicated from the SELLAM property detail template and is ready for specific property copy, imagery, pricing, amenities, and enquiry details to be refined later.",
    featureLocation: "New York address with access to lifestyle, business, and long-term investment corridors.",
    gallery: [
      { src: "assets/images/diaspora-new-york.webp", alt: "Revenance Residency exterior with pool" },
      commonGallery[3],
      commonGallery[7],
      commonGallery[4],
      commonGallery[1],
      commonGallery[5],
      commonGallery[6],
      commonGallery[0]
    ]
  },
  "the-aurelian": {
    title: "The Aurelian",
    location: "Sydney, Australia",
    price: "Price on Application",
    hero: "assets/images/diaspora-sydney.webp",
    heroAlt: "The Aurelian contemporary townhouse",
    description:
      "The Aurelian is a diaspora property template for a Sydney residence. This duplicated property page is ready for its final property description, gallery, pricing, amenities, and investment notes.",
    featureLocation: "Sydney address with strong residential appeal and access to city amenities.",
    gallery: [
      { src: "assets/images/diaspora-sydney.webp", alt: "The Aurelian contemporary townhouse" },
      commonGallery[3],
      commonGallery[7],
      commonGallery[4],
      commonGallery[1],
      commonGallery[5],
      commonGallery[6],
      commonGallery[0]
    ]
  },
  "sterling-heights": {
    title: "Sterling Heights",
    location: "Manchester, England",
    price: "Price on Application",
    hero: "assets/images/diaspora-manchester.webp",
    heroAlt: "Sterling Heights white modern home",
    description:
      "Sterling Heights is a diaspora property template for a Manchester residence. The page has been prepared from the property detail template and can be edited into a specific listing when the full property information is ready.",
    featureLocation: "Manchester address with access to schools, retail, and established residential demand.",
    gallery: [
      { src: "assets/images/diaspora-manchester.webp", alt: "Sterling Heights white modern home" },
      commonGallery[3],
      commonGallery[7],
      commonGallery[4],
      commonGallery[1],
      commonGallery[5],
      commonGallery[6],
      commonGallery[0]
    ]
  },
  "belmont-collection": {
    title: "The Belmont Collection",
    location: "Miami, USA",
    price: "Price on Application",
    hero: "assets/images/diaspora-miami.webp",
    heroAlt: "The Belmont Collection modern villa",
    description:
      "The Belmont Collection is a diaspora property template for a Miami residence. It uses the shared SELLAM property page structure and is ready for final copy, images, amenities, and enquiry details.",
    featureLocation: "Miami address with private residential character and access to premium coastal lifestyle.",
    gallery: [
      { src: "assets/images/diaspora-miami.webp", alt: "The Belmont Collection modern villa" },
      commonGallery[3],
      commonGallery[7],
      commonGallery[4],
      commonGallery[1],
      commonGallery[5],
      commonGallery[6],
      commonGallery[0]
    ]
  },
  "hudson-grove": {
    title: "Hudson Grove",
    location: "New Jersey, USA",
    price: "Price on Application",
    hero: "assets/images/diaspora-sydney.webp",
    heroAlt: "Hudson Grove contemporary residence",
    description:
      "Hudson Grove is a diaspora property template for a New Jersey residence. This duplicate page is ready to be shaped into a specific property listing with final media, pricing, and investment information.",
    featureLocation: "New Jersey address with access to New York investment and lifestyle corridors.",
    gallery: [
      { src: "assets/images/diaspora-sydney.webp", alt: "Hudson Grove contemporary residence" },
      commonGallery[3],
      commonGallery[7],
      commonGallery[4],
      commonGallery[1],
      commonGallery[5],
      commonGallery[6],
      commonGallery[0]
    ]
  },
  "harbour-lane": {
    title: "Harbour Lane",
    location: "Melbourne, Australia",
    price: "Price on Application",
    hero: "assets/images/diaspora-miami.webp",
    heroAlt: "Harbour Lane modern villa",
    description:
      "Harbour Lane is a diaspora property template for a Melbourne residence. The page is ready for later editing into a full property profile with dedicated imagery, description, and payment details.",
    featureLocation: "Melbourne address with bright residential living and access to city amenities.",
    gallery: [
      { src: "assets/images/diaspora-miami.webp", alt: "Harbour Lane modern villa" },
      commonGallery[3],
      commonGallery[7],
      commonGallery[4],
      commonGallery[1],
      commonGallery[5],
      commonGallery[6],
      commonGallery[0]
    ]
  },
  "regent-park-villas": {
    title: "Regent Park Villas",
    location: "London, England",
    price: "Price on Application",
    hero: "assets/images/diaspora-new-york.webp",
    heroAlt: "Regent Park Villas exterior",
    description:
      "Regent Park Villas is a diaspora property template for a London residence. This page has the same property-detail layout and enquiry infrastructure, ready for final listing details.",
    featureLocation: "London address near green spaces, international schools, and enduring residential value.",
    gallery: [
      { src: "assets/images/diaspora-new-york.webp", alt: "Regent Park Villas exterior" },
      commonGallery[3],
      commonGallery[7],
      commonGallery[4],
      commonGallery[1],
      commonGallery[5],
      commonGallery[6],
      commonGallery[0]
    ]
  },
  "berlin-reserve": {
    title: "Berlin Reserve",
    location: "Berlin, Germany",
    price: "Price on Application",
    hero: "assets/images/diaspora-manchester.webp",
    heroAlt: "Berlin Reserve modern townhouse",
    description:
      "Berlin Reserve is a diaspora property template for a Berlin residence. It is set up as a duplicated property page and can be refined later with specific unit information, gallery assets, and investment copy.",
    featureLocation: "Berlin address with efficient planning, rental appeal, and access to lifestyle districts.",
    gallery: [
      { src: "assets/images/diaspora-manchester.webp", alt: "Berlin Reserve modern townhouse" },
      commonGallery[3],
      commonGallery[7],
      commonGallery[4],
      commonGallery[1],
      commonGallery[5],
      commonGallery[6],
      commonGallery[0]
    ]
  },
  "maison-lumiere": {
    title: "Maison Lumiere",
    location: "Paris, France",
    price: "Price on Application",
    hero: "assets/images/diaspora-manchester.webp",
    heroAlt: "Maison Lumiere refined home exterior",
    description:
      "Maison Lumiere is a diaspora property template for a Paris residence. The page is ready for final property copy, pricing, media, amenities, and enquiry content to be added later.",
    featureLocation: "Paris address with timeless lifestyle appeal and access to business and cultural districts.",
    gallery: [
      { src: "assets/images/diaspora-manchester.webp", alt: "Maison Lumiere refined home exterior" },
      commonGallery[3],
      commonGallery[7],
      commonGallery[4],
      commonGallery[1],
      commonGallery[5],
      commonGallery[6],
      commonGallery[0]
    ]
  },
  "riviera-house": {
    title: "Riviera House",
    location: "Nice, France",
    price: "Price on Application",
    hero: "assets/images/diaspora-new-york.webp",
    heroAlt: "Riviera House luxury residence",
    description:
      "Riviera House is a diaspora property template for a Nice residence. It uses the shared SELLAM property-detail experience and is ready for later property-specific editing.",
    featureLocation: "Nice address with coastal lifestyle appeal, privacy, and access to the French Riviera.",
    gallery: [
      { src: "assets/images/diaspora-new-york.webp", alt: "Riviera House luxury residence" },
      commonGallery[3],
      commonGallery[7],
      commonGallery[4],
      commonGallery[1],
      commonGallery[5],
      commonGallery[6],
      commonGallery[0]
    ]
  },

  /* --------------------------------------------------------- REAL LISTINGS
     Unlike the diaspora templates above, these 4 have real photography
     (assets/images/International properties/) and real card copy already
     written on index.html's diaspora-grid. Reached via property.html?id=<key>
     — same root template as every other property on the site, not a
     standalone page, so there's only ever one copy of the template to keep
     in sync. Prices are plain USD strings (see INTERNATIONAL_PAYMENT_PLAN
     below) — property.html/property-detail.js never runs these through the
     KES formatter used for the Kenya inventory in data/properties.js, so
     dollars display exactly as written with no conversion. */
  "ShomaBay": {
    title: "ShomaBay",
    location: "Miami, USA",
    price: "From USD 703,500",
    // Unit mix confirmed by client: Studio, 1, 2 & 3 Bedroom. Only the
    // Studio price was given (USD 703,500) — the rest show "Price on
    // Application" until real figures are supplied; don't guess these in.
    priceRows: [
      { bedrooms: "Studio", price: "USD 703,500" },
      { bedrooms: "1 Bedroom", price: "Price on Application" },
      { bedrooms: "2 Bedroom", price: "Price on Application" },
      { bedrooms: "3 Bedroom", price: "Price on Application" }
    ],
    paymentPlan: INTERNATIONAL_PAYMENT_PLAN,
    hero: "assets/images/International properties/Shomabay,Miami (11).jpeg",
    heroAlt: "ShomaBay exterior in Miami",
    description:
      "Shoma Bay consists of 333 condominium units where the design seamlessly melds a classic art-deco aesthetic with a modern facade while adding community-minded amenities such as a zen garden, grocery delivery room, wine cellar, and other dynamic features.",
    featureLocation: "Prime Miami address with beach access, vibrant retail and dining, and strong international rental demand.",
    featureHighlights: [
      { title: "Location:", text: "Prime Miami address with beach access, vibrant retail and dining, and strong international rental demand." },
      { title: "Amenities:", text: "Gym, Swimming Pool, Yoga space, Reception, Elevator" }
    ],
    gallery: [
      { src: "assets/images/International properties/Shomabay,Miami (2).jpeg", alt: "ShomaBay interior" },
      { src: "assets/images/International properties/Shomabay,Miami (3).jpeg", alt: "ShomaBay living space" },
      { src: "assets/images/International properties/Shomabay,Miami (4).jpeg", alt: "ShomaBay amenity deck" },
      { src: "assets/images/International properties/Shomabay,Miami (5).jpeg", alt: "ShomaBay bedroom" },
      { src: "assets/images/International properties/Shomabay,Miami (6).jpeg", alt: "ShomaBay kitchen" },
      { src: "assets/images/International properties/Shomabay,Miami (7).jpeg", alt: "ShomaBay pool deck" },
      { src: "assets/images/International properties/Shomabay,Miami (8).jpeg", alt: "ShomaBay balcony view" },
      { src: "assets/images/International properties/Shomabay,Miami (9).jpeg", alt: "ShomaBay lobby" },
      { src: "assets/images/International properties/Shomabay,Miami (10).jpeg", alt: "ShomaBay exterior detail" },
      { src: "assets/images/International properties/Shomabay,Miami (12).jpeg", alt: "ShomaBay amenity space" },
      { src: "assets/images/International properties/Shomabay,Miami (13).jpeg", alt: "ShomaBay interior detail" },
      { src: "assets/images/International properties/Shomabay,Miami (14).jpeg", alt: "ShomaBay residence detail" },
      { src: "assets/images/International properties/Shomabay,Miami (15).jpeg", alt: "ShomaBay exterior" }
    ]
  },
  "Brabus-Villas": {
    title: "Brabus Villas",
    location: "Brabus Island, UAE Dubai",
    price: "From USD 1,200,000",
    // Client gave unit COUNTS only (2BR: 256 units, 3BR: 80 units, 4BR: 16
    // units) and explicitly asked to guess the prices pending real developer
    // figures — these three are estimates for an ultra-luxury branded-island
    // villa community, NOT confirmed pricing. Replace before relying on them
    // for a real quote.
    priceRows: [
      { bedrooms: "2 Bedroom", note: "256 units, estimated", price: "USD 1,200,000" },
      { bedrooms: "3 Bedroom", note: "80 units, estimated", price: "USD 1,650,000" },
      { bedrooms: "4 Bedroom", note: "16 units, estimated", price: "USD 2,200,000" }
    ],
    paymentPlan: INTERNATIONAL_PAYMENT_PLAN,
    hero: "assets/images/International properties/The Towers, Dubai (6).jpeg",
    heroAlt: "Brabus Villas exterior",
    description:
      "Located within the exclusive BRABUS Island community, BRABUS Villas enjoy a private and prestigious setting in Abu Dhabi's waterfront landscape. Each residence offers seamless access to the city's most sought-after destinations, blending unmatched privacy with effortless connectivity.",
    featureLocation: "Brabus Island address within the waterfront district, close to premier dining, retail, and lifestyle destinations.",
    featureHighlights: [
      { title: "Location:", text: "Brabus Island address within the waterfront district, close to premier dining, retail, and lifestyle destinations." },
      { title: "Amenities:", text: "Gym, Swimming Pool, Yoga space, Reception, Elevator" }
    ],
    gallery: [
      { src: "assets/images/International properties/The Towers, Dubai.jpeg", alt: "Brabus Villas overview" },
      { src: "assets/images/International properties/The Towers, Dubai (2).jpeg", alt: "Brabus Villas exterior" },
      { src: "assets/images/International properties/The Towers, Dubai (3).jpeg", alt: "Brabus Villas living space" },
      { src: "assets/images/International properties/The Towers, Dubai (4).jpeg", alt: "Brabus Villas interior" },
      { src: "assets/images/International properties/The Towers, Dubai (5).jpeg", alt: "Brabus Villas residence" },
      { src: "assets/images/International properties/The Towers, Dubai (7).jpeg", alt: "Brabus Villas waterfront view" }
    ]
  },
  "Afra-Park": {
    title: "Afra Park",
    location: "Istanbul, Turkey",
    price: "From USD 420,000",
    priceRows: [
      { bedrooms: "2 Bedroom", price: "From USD 420,000" },
      { bedrooms: "3 Bedroom", price: "From USD 480,000" },
      { bedrooms: "4 Bedroom", price: "USD 570,000" }
    ],
    paymentPlan: INTERNATIONAL_PAYMENT_PLAN,
    hero: "assets/images/International properties/Afra Park, Turkey (4).jpeg",
    heroAlt: "Afra Park residence in Istanbul",
    description:
      "Afra Park is a contemporary high end modern design, a new concept of living brought by Reportage Turkiye, with a one of a kind design of townhouses, and villas, surrounded by a well planned typographical landscape. This project brings together a variety of factors, entertainment, seclusion, and socialization.",
    featureLocation: "Istanbul address within a landscaped Reportage Türkiye community, offering townhouses and villas with resort-style surroundings.",
    featureHighlights: [
      { title: "Location:", text: "Istanbul address within a landscaped Reportage Türkiye community, offering townhouses and villas with resort-style surroundings." },
      { title: "Amenities:", text: "Gym, Swimming Pool, Yoga space, Reception, Elevator" }
    ],
    gallery: [
      { src: "assets/images/International properties/Afra Park, Turkey.jpeg", alt: "Afra Park overview" },
      { src: "assets/images/International properties/Afra Park, Turkey (2).jpeg", alt: "Afra Park exterior" },
      { src: "assets/images/International properties/Afra Park, Turkey (3).jpeg", alt: "Afra Park landscaped grounds" },
      { src: "assets/images/International properties/Afra Park, Turkey (5).jpeg", alt: "Afra Park townhouse" },
      { src: "assets/images/International properties/Afra Park, Turkey (6).jpeg", alt: "Afra Park villa" },
      { src: "assets/images/International properties/Afra Park, Turkey (7).jpeg", alt: "Afra Park interior" },
      { src: "assets/images/International properties/Afra Park, Turkey (8).jpeg", alt: "Afra Park living space" },
      { src: "assets/images/International properties/Afra Park, Turkey (9).jpeg", alt: "Afra Park bedroom" },
      { src: "assets/images/International properties/Afra Park, Turkey (10).jpeg", alt: "Afra Park kitchen" },
      { src: "assets/images/International properties/Afra Park, Turkey (11).jpeg", alt: "Afra Park amenity space" },
      { src: "assets/images/International properties/Afra Park, Turkey (12).jpeg", alt: "Afra Park courtyard" },
      { src: "assets/images/International properties/Afra Park, Turkey (13).jpeg", alt: "Afra Park exterior detail" },
      { src: "assets/images/International properties/Afra Park, Turkey (14).jpeg", alt: "Afra Park residence detail" },
      { src: "assets/images/International properties/Afra Park, Turkey (15).jpeg", alt: "Afra Park landscape view" }
    ]
  },
  "Indabyo-Heights": {
    title: "Indabyo Heights",
    location: "Kigali, Rwanda",
    price: "From USD 81,109",
    priceRows: [
      { bedrooms: "1 Bedroom", price: "From USD 81,109" },
      { bedrooms: "3 Bedroom", price: "From USD 199,475" },
      { bedrooms: "4 Bedroom", price: "From USD 248,359" }
    ],
    paymentPlan: INTERNATIONAL_PAYMENT_PLAN,
    hero: "assets/images/International properties/Indabyo Heights (2).jpeg",
    heroAlt: "Indabyo Heights exterior in Kigali",
    description:
      "Rising gracefully above Kigali, Indabyo Heights sets a new standard for luxury and modern living. Each apartment and penthouse is thoughtfully designed for style, comfort, and elegance, reflecting Kigali's evolving skyline. More than just a home, it's a statement of refined living.",
    featureLocation: "Kigali address with panoramic skyline views and access to the city's premier business and lifestyle districts.",
    featureHighlights: [
      { title: "Location:", text: "Kigali address with panoramic skyline views and access to the city's premier business and lifestyle districts." },
      { title: "Amenities:", text: "Gym, Swimming Pool, Yoga space, Reception, Elevator" }
    ],
    gallery: [
      { src: "assets/images/International properties/Indabyo Heights.jpeg", alt: "Indabyo Heights overview" },
      { src: "assets/images/International properties/Indabyo Heights (3).jpeg", alt: "Indabyo Heights interior" },
      { src: "assets/images/International properties/Indabyo Heights (4).jpeg", alt: "Indabyo Heights living space" },
      { src: "assets/images/International properties/Indabyo Heights (5).jpeg", alt: "Indabyo Heights skyline view" }
    ]
  }
});

let lightboxImages = [];
let lightboxIndex = 0;

function setupMobileMenu() {
  const openButton = document.querySelector(".menu-toggle");
  const closeButton = document.querySelector(".menu-close");
  const menu = document.querySelector(".mobile-menu");
  const menuLinks = document.querySelectorAll(".mobile-nav-list a");

  if (!openButton || !closeButton || !menu) return;

  const openMenu = () => {
    document.body.classList.add("menu-open");
    menu.classList.add("is-open");
    menu.setAttribute("aria-hidden", "false");
    openButton.setAttribute("aria-expanded", "true");
    closeButton.focus({ preventScroll: true });
  };

  const closeMenu = () => {
    document.body.classList.remove("menu-open");
    menu.classList.remove("is-open");
    menu.setAttribute("aria-hidden", "true");
    openButton.setAttribute("aria-expanded", "false");
  };

  openButton.addEventListener("click", openMenu);
  closeButton.addEventListener("click", closeMenu);
  menu.addEventListener("click", (event) => {
    if (event.target === menu) closeMenu();
  });
  menuLinks.forEach((link) => link.addEventListener("click", closeMenu));
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeMenu();
  });
}

function setupRevealAnimations() {
  const revealItems = document.querySelectorAll(".reveal");

  if (prefersReducedMotion || !("IntersectionObserver" in window)) {
    revealItems.forEach((item) => item.classList.add("is-visible"));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    },
    { threshold: 0.14, rootMargin: "0px 0px -8% 0px" }
  );

  revealItems.forEach((item) => observer.observe(item));
}

/* ---------------------------------------------------------------------------
   Central inventory bridge (data/properties.js -> window.SELLAM_PROPERTIES).
   This is the single source of truth going forward: editing a property there
   updates its detail page automatically, whether reached via
   property.html?id=<slug> or a standalone properties/<slug>.html page (both
   resolve the same record, by id or slug). The legacy propertyData map below
   remains only as a fallback for pages not yet migrated into the inventory
   (the diaspora template pages).
   --------------------------------------------------------------------------- */

function findInventoryProperty(id) {
  const list = window.SELLAM_PROPERTIES;
  if (!Array.isArray(list) || !id) return null;
  return list.find((item) => item.id === id || item.slug === id) || null;
}

function formatKESValue(value) {
  return window.SellamSearch && typeof window.SellamSearch.formatKES === "function"
    ? window.SellamSearch.formatKES(value)
    : `KES ${Number(value).toLocaleString("en-KE")}`;
}

function countLabel(count, noun) {
  return `${count} ${noun}${count === 1 ? "" : "s"}`;
}

// Builds one row per price the property actually has — a single-unit
// property with both a sale and a rent price gets two rows (same bed/bath,
// different price); a property with more than one floor plan (see
// data/property-units.js) gets one row per unit per price it lists. This is
// the "full info" breakdown the listing card deliberately omits (cards only
// show bedroom counts and a starting price — see listings.js).
function buildPriceRows(inventoryItem) {
  const units = window.SellamUnits ? window.SellamUnits.unitsOf(inventoryItem) : [inventoryItem];
  const rows = [];

  units.forEach((unit) => {
    const bedroomLabel = window.SellamUnits ? window.SellamUnits.unitLabel(unit) : "";
    // `residenceLabel` (e.g. "Villa 1") is a detail-page-only override for
    // developments that sell distinct numbered residences of the same floor
    // plan — it takes priority over the generic "N Bedroom(s)" wording here,
    // but deliberately isn't read by data/property-units.js, so listing
    // cards elsewhere still show the plain bedroom count.
    const bedrooms = unit.residenceLabel || bedroomLabel || (unit.bedrooms !== null && unit.bedrooms !== undefined ? countLabel(unit.bedrooms, "Bedroom") : "—");
    const bathrooms = unit.bathrooms !== null && unit.bathrooms !== undefined ? countLabel(unit.bathrooms, "Bathroom") : "—";
    // OPTIONAL internal floor area (e.g. "376 SQM") and a short note (e.g.
    // "Fully Furnished") shown alongside a unit's price row.
    const area = unit.area || "";
    const note = unit.note || "";

    if (unit.salePrice) rows.push({ bedrooms, bathrooms, area, note, price: formatKESValue(unit.salePrice) });
    if (unit.rentPrice) rows.push({ bedrooms, bathrooms, area, note, price: `${formatKESValue(unit.rentPrice)} / month` });
  });

  if (!rows.length) rows.push({ bedrooms: "—", bathrooms: "—", price: "Price on application" });
  return rows;
}

// Plain-text fallback for anything that isn't rendered as the price table
// (currently unused on property.html, kept for legacy propertyData entries
// — see getProperty() — that only ever had a single formatted string).
function formatPropertyPriceText(priceRows) {
  return priceRows
    .map((row) => (row.bedrooms === "—" ? row.price : `${row.bedrooms} — ${row.price}`))
    .join("  ·  ");
}

function inventoryToLegacyShape(inventoryItem) {
  const sourceGallery = inventoryItem.gallery?.length ? inventoryItem.gallery : [inventoryItem.image];
  const gallery = sourceGallery.map((src, index) => ({
    src,
    alt: `${inventoryItem.title} image ${index + 1}`
  }));

  const priceRows = buildPriceRows(inventoryItem);

  return {
    title: inventoryItem.title,
    location: inventoryItem.location,
    priceRows,
    price: formatPropertyPriceText(priceRows),
    // The hero banner is landscape; gallery photos are portrait carousel
    // slides. Deliberately NOT gallery[0] — reusing the same photo for both
    // means one of the two crops looks wrong. `heroImage` (a dedicated detail-
    // page banner shot) is used when set; otherwise falls back to `image`
    // (the card thumbnail) so existing properties without `heroImage` keep
    // working unchanged.
    hero: inventoryItem.heroImage || inventoryItem.image,
    heroAlt: `${inventoryItem.title} in ${inventoryItem.location}`,
    description: inventoryItem.description,
    featureLocation: inventoryItem.featureLocation,
    featureHighlights: inventoryItem.featureHighlights,
    closingParagraphs: inventoryItem.closingParagraphs,
    gallery,
    // Bespoke narrative text (when present) overlays the auto-generated story
    // rows in buildStoryContent() — see there for how images are assigned.
    storyText: inventoryItem.story?.rows,
    // Used to pick residential vs. commercial wording in buildStoryContent(),
    // and to choose the enquiry heading ("To Buy Now" vs "To Lease Now").
    propertyType: inventoryItem.propertyType,
    letting: inventoryItem.letting,
    // OPTIONAL per-sq-ft leasing rate breakdown (zone pricing, service
    // charge, parking) — see leasePricing in data/properties.js field
    // reference. Passed through unchanged; renderLeasePricing() handles
    // absence by hiding its section entirely.
    leasePricing: inventoryItem.leasePricing,
    // OPTIONAL flexible off-plan payment schedule — see paymentPlan in
    // data/properties.js field reference. Passed through unchanged;
    // renderPaymentPlan() handles absence by hiding its section entirely.
    paymentPlan: inventoryItem.paymentPlan
  };
}

function getProperty() {
  const params = new URLSearchParams(window.location.search);
  const pageSlug = window.location.pathname.split("/").pop()?.replace(/\.html$/i, "");
  const id = params.get("id") || document.body.dataset.propertyKey || pageSlug;

  const inventoryItem = findInventoryProperty(id);
  if (inventoryItem) return inventoryToLegacyShape(inventoryItem);

  if (window.SELLAM_PROPERTY_PAGE) return window.SELLAM_PROPERTY_PAGE;

  return propertyData[id] || propertyData["dg-west"];
}

function setText(selector, value) {
  const element = document.querySelector(selector);
  if (element) element.textContent = value;
}

// `value` is either a plain string (the common case — no title, just body
// copy) or `{ title, body }` when the intro paragraph should lead with a
// bold title. Either way, `body` is split on blank lines into one <p> per
// paragraph exactly as before; the title (if any) is prepended as a <strong>
// inside the first paragraph, so it reads as part of the same flowing
// paragraph rather than a separate heading/block.
function renderDescription(selector, value) {
  const element = document.querySelector(selector);
  if (!element) return;

  const hasTitle = value && typeof value === "object";
  const title = hasTitle ? value.title : "";
  const body = hasTitle ? value.body : value;

  const paragraphs = String(body || "")
    .split(/\n{2,}/)
    .map((part) => part.trim())
    .filter(Boolean);

  element.replaceChildren();
  paragraphs.forEach((part, index) => {
    const paragraph = document.createElement("p");
    if (index === 0 && title) {
      const strong = document.createElement("strong");
      strong.textContent = `${title} `;
      paragraph.append(strong, document.createTextNode(part));
    } else {
      paragraph.textContent = part;
    }
    element.append(paragraph);
  });
}

// A legacy propertyData entry (see getProperty()) only ever had a single
// pre-formatted price string, no bed/bath breakdown — fall back to one row.
function renderPriceTable(property) {
  const list = document.querySelector("[data-price-rows]");
  if (!list) return;

  const rows = property.priceRows || [{ bedrooms: "—", bathrooms: "—", price: property.price }];
  list.replaceChildren();

  rows.forEach((row) => {
    const item = document.createElement("div");
    item.className = "price-item";
    const areaLine = row.area ? `<span class="price-item-meta">${row.area}</span>` : "";
    const priceText = row.note ? `${row.price} (${row.note})` : row.price;
    item.innerHTML =
      `<span class="price-item-label">${row.bedrooms}</span>` +
      areaLine +
      `<span class="price-item-value">${PRICE_TAG_SVG}${priceText}</span>`;
    list.append(item);
  });
}

function formatPSFRange(min, max, suffix) {
  const fmt = (value) => Number(value).toLocaleString("en-KE");
  return `KES ${fmt(min)} – ${fmt(max)}${suffix || ""}`;
}

// OPTIONAL per-sq-ft leasing rate breakdown for office/commercial leasing —
// see leasePricing in data/properties.js field reference. This is additive:
// it renders in its own section alongside (not instead of) the regular
// price table above, and the section stays hidden entirely for every
// property that doesn't set `leasePricing`, same pattern as
// renderClosingParagraphs().
function renderLeasePricing(property) {
  const section = document.querySelector("[data-lease-pricing-section]");
  if (!section) return;

  const lp = property.leasePricing;
  if (!lp) {
    section.hidden = true;
    return;
  }

  const headline = document.querySelector("[data-lease-pricing-headline]");
  if (headline) {
    const badge = lp.saleAndLeaseAvailable ? "Sale & Lease Available | " : "";
    const range = lp.fromPerSqFt
      ? `Leasing from ${formatPSFRange(lp.fromPerSqFt.min, lp.fromPerSqFt.max, ` ${lp.period || "per sq. ft./month"}`)}`
      : "";
    headline.textContent = `${badge}${range}`;
  }

  const space = document.querySelector("[data-lease-pricing-space]");
  if (space) {
    const hasSpace = !!lp.spaceAvailable;
    space.hidden = !hasSpace;
    if (hasSpace) {
      const fmt = (value) => Number(value).toLocaleString("en-KE");
      space.textContent =
        `Space Available: ${fmt(lp.spaceAvailable.min)} – ${fmt(lp.spaceAvailable.max)} ${lp.spaceAvailable.unit || "sq. ft."}`;
    }
  }

  const zonesEl = document.querySelector("[data-lease-pricing-zones]");
  if (zonesEl) {
    zonesEl.replaceChildren();
    (lp.zones || []).forEach((zone) => {
      const row = document.createElement("div");
      row.className = "lease-zone-row";
      const floors = zone.floors ? ` <span class="lease-zone-floors">(${zone.floors})</span>` : "";
      row.innerHTML =
        `<span class="lease-zone-name">${zone.name}${floors}</span>` +
        `<span class="lease-zone-price">${formatPSFRange(zone.minPerSqFt, zone.maxPerSqFt, " PSF")}</span>`;
      zonesEl.append(row);
    });
  }

  const notesEl = document.querySelector("[data-lease-pricing-notes]");
  if (notesEl) {
    notesEl.replaceChildren();
    const notes = [];
    if (lp.serviceChargePerSqFt) {
      const amount = Number(lp.serviceChargePerSqFt).toLocaleString("en-KE");
      notes.push(`Service Charge: KES ${amount} PSF${lp.serviceChargeNote ? ` ${lp.serviceChargeNote}` : ""}`);
    }
    if (lp.parkingRatio) {
      notes.push(`Parking: ${lp.parkingRatio}${lp.parkingNote ? ` (${lp.parkingNote})` : ""}`);
    }
    notes.forEach((text) => {
      const li = document.createElement("li");
      li.textContent = text;
      notesEl.append(li);
    });
  }

  section.hidden = false;
}

// Single universal icon used for every feature-banner item — a feature can
// be anything (location, parking, amenities...), so one neutral check-circle
// mark reads correctly for all of them instead of a house glyph that only
// suits "Location".
const FEATURE_ICON_SVG =
  '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm-1.2 14.4-4.2-4.2 1.4-1.4 2.8 2.8 6-6 1.4 1.4-7.4 7.4Z"/></svg>';

// Used whenever a property has no bespoke `featureHighlights` list of its
// own (see data/properties.js field reference). `featureLocation` still
// overrides the first item's text so existing per-property location blurbs
// keep working without every property needing a full custom list.
const DEFAULT_FEATURE_HIGHLIGHTS = [
  { title: "Location:", text: "Prime address with strong access and visibility." },
  { title: "Connectivity:", text: "High-speed elevators, fiber internet, and backup power." },
  { title: "Size Options:", text: "Units from 1000 to 20,000 sq. ft. available." },
  { title: "Design:", text: "Flexible open-plan layouts ready for customization." },
  { title: "Architecture:", text: "Modern glass facade with a striking city presence." },
  { title: "Access:", text: "Easy connection to main roads and public transport." },
  { title: "Parking:", text: "Secure multi-level parking for tenants and visitors." },
  { title: "Amenities Nearby:", text: "Close to banks, restaurants, malls, and hotels." }
];

// Land listings use a stripped-down template (1-3 photos, one description
// paragraph, and a size-vs-price table) — no narrative "story" sections and
// no amenities/feature banner, since a bare plot doesn't have bedrooms,
// finishes, or building amenities to describe. See setupPropertyStory() for
// the matching story-section hide.
function isLandProperty(property) {
  return property.propertyType === "land";
}

function renderFeatureHighlights(property) {
  const section = document.querySelector(".detail-features");
  const grid = document.querySelector("[data-feature-grid]");
  if (!grid) return;

  if (isLandProperty(property)) {
    if (section) section.hidden = true;
    grid.replaceChildren();
    return;
  }
  if (section) section.hidden = false;

  const items = property.featureHighlights?.length
    ? property.featureHighlights
    : DEFAULT_FEATURE_HIGHLIGHTS.map((item, index) =>
        index === 0 && property.featureLocation ? { ...item, text: property.featureLocation } : item
      );

  grid.replaceChildren();
  items.forEach((item) => {
    const article = document.createElement("article");
    article.className = "reveal";
    article.innerHTML =
      `${FEATURE_ICON_SVG}<div><h3>${item.title}</h3><p>${item.text}</p></div>`;
    grid.append(article);
  });
}

// Optional 1-3 paragraph closing note shown between the features banner and
// the enquiry form. Absent on most listings — the section stays hidden
// entirely (no empty gap) unless a property sets `closingParagraphs`.
function renderClosingParagraphs(property) {
  const section = document.querySelector("[data-closing-section]");
  if (!section) return;

  if (!property.closingParagraphs || !String(property.closingParagraphs).trim()) {
    section.hidden = true;
    return;
  }

  renderDescription("[data-closing-paragraphs]", property.closingParagraphs);
  section.hidden = false;
}

// OPTIONAL flexible off-plan payment schedule (e.g. 15% reservation / 15%
// on agreement / 50% during construction / 20% on handover) — see
// paymentPlan in data/properties.js field reference. Not every property
// offers this, so the section stays hidden entirely (no empty gap) unless
// a property sets `paymentPlan`, same pattern as renderClosingParagraphs().
function renderPaymentPlan(property) {
  const section = document.querySelector("[data-payment-plan-section]");
  if (!section) return;

  const plan = property.paymentPlan;
  if (!Array.isArray(plan) || !plan.length) {
    section.hidden = true;
    return;
  }

  const list = document.querySelector("[data-payment-plan-list]");
  if (list) {
    list.replaceChildren();
    plan.forEach((row) => {
      const item = document.createElement("div");
      item.className = "payment-plan-item";
      item.innerHTML =
        `<span class="payment-plan-percent">${row.percent}%</span>` +
        `<span class="payment-plan-label">${row.label}</span>`;
      list.append(item);
    });
  }

  section.hidden = false;
}

function setupPropertyContent(property) {
  document.title = `Sellam | ${property.title}`;
  setText("[data-property-title]", property.title);
  renderDescription("[data-property-description]", property.description);
  renderPriceTable(property);
  renderLeasePricing(property);
  renderFeatureHighlights(property);
  renderPaymentPlan(property);
  renderClosingParagraphs(property);

  const hero = document.querySelector("[data-hero-image]");
  if (hero) {
    hero.src = property.hero;
    hero.alt = property.heroAlt;
  }

  const heroButton = document.querySelector("[data-hero-lightbox]");
  if (heroButton) {
    heroButton.dataset.lightboxSrc = property.hero;
    heroButton.setAttribute("aria-label", `Open ${property.heroAlt}`);
  }

  // Rent-only listings (e.g. offices, retail, industrial, land leases) get
  // "To Lease Now" instead of "To Buy Now". Anything else (sale, both, or the
  // legacy pages that don't carry a `letting` at all) keeps the original copy.
  const enquiryHeading = document.querySelector("[data-enquiry-heading]");
  if (enquiryHeading) {
    enquiryHeading.textContent = property.letting === "rent" ? "To Lease Now" : "To Buy Now";
  }
}

// Property types that should get commercial-flavoured generic copy (no
// "bedroom" / "residence" / "buyers" language) when a property has no
// bespoke `story` text of its own.
const COMMERCIAL_TYPES = ["office", "retail", "industrial", "land", "commercial"];

function buildStoryContent(property) {
  const gallery = property.gallery?.length ? property.gallery : commonGallery;
  const imageAt = (index) => gallery[index % gallery.length];
  const title = property.title;
  const location = property.location || "Nairobi";
  const isCommercial = COMMERCIAL_TYPES.includes(property.propertyType);

  // Generic, always-available narrative — used as-is when a property has no
  // bespoke copy, and as the image/fallback-text source when it does. Wording
  // switches based on property type so an office or warehouse never reads
  // like a family home.
  const rows = isCommercial
    ? [
        {
          image: imageAt(1),
          title: `${title} Overview`,
          body: `${title} is presented as a well-positioned commercial property in ${location}, with space planned for efficiency, accessibility, and everyday practicality. The interior and setting work together to create a property experience that feels professional, functional, and ready for discerning occupiers.`
        },
        {
          image: imageAt(2),
          title: "Specification",
          body: `The property brings together practical proportions, considered specification, and strong functional character. Each image in the gallery reflects the quality and condition of ${title}, giving occupiers a clearer sense of how the space supports day-to-day operations and long-term value.`
        },
        {
          image: imageAt(3),
          title: "Operational Advantages",
          body: `From daily operations to client-facing use, ${title} is shaped around dependable, professional occupancy. The property offers the kind of space, access, and reliability expected from a carefully selected SELLAM commercial listing.`
        },
        {
          image: imageAt(4),
          title: "Location Advantage",
          body: `${location} gives this property a strong commercial context, with access to established infrastructure, key routes, and the visibility or accessibility occupiers expect from a well-placed address. It is positioned for both operational appeal and long-term investment confidence.`
        }
      ]
    : [
        {
          image: imageAt(1),
          title: `${title} Residence`,
          body: `${title} is presented as a composed premium residence in ${location}, with spaces planned for comfort, privacy, and everyday ease. The interiors and exterior setting work together to create a property experience that feels refined, practical, and ready for discerning buyers.`
        },
        {
          image: imageAt(2),
          title: "Design And Finishes",
          body: `The property brings together generous proportions, considered finishes, and strong visual character. Each image in the gallery reflects the quality and atmosphere of ${title}, giving buyers a clearer sense of how the home supports family living, hosting, and long-term value.`
        },
        {
          image: imageAt(3),
          title: "Lifestyle And Comfort",
          body: `From relaxed daily routines to private entertaining, ${title} is shaped around a comfortable premium lifestyle. The residence offers the kind of space, light, and calm expected from a carefully selected SELLAM property.`
        },
        {
          image: imageAt(4),
          title: "Location Advantage",
          body: `${location} gives this property a strong residential context, with access to established amenities, key routes, and the privacy buyers expect from a premium address. It is positioned for both lifestyle appeal and long-term investment confidence.`
        }
      ];

  // Bespoke narrative text (property.storyText, from data/properties.js'
  // `story.rows`) overlays the generic title/body per row, index for index,
  // while the image assignment above (and the wide/pair images below) stays
  // exactly the same either way.
  const overrides = property.storyText;
  const finalRows = overrides
    ? rows.map((row, index) => {
        const override = overrides[index];
        return override
          ? { image: row.image, title: override.title || row.title, body: override.body || row.body }
          : row;
      })
    : rows;

  return {
    rows: finalRows,
    wide: imageAt(5),
    pair: [imageAt(6), imageAt(7)]
  };
}

function setStoryImage(button, image, fallbackLabel) {
  if (!button || !image) return;
  const img = button.querySelector("img");
  button.dataset.lightboxSrc = image.src;
  button.setAttribute("aria-label", fallbackLabel || `Open ${image.alt}`);

  if (img) {
    img.src = image.src;
    img.alt = image.alt;
  }
}

function setupPropertyStory(property) {
  const section = document.querySelector(".detail-story");
  if (isLandProperty(property)) {
    if (section) section.hidden = true;
    return;
  }
  if (section) section.hidden = false;

  const story = buildStoryContent(property);
  const rows = document.querySelectorAll(".detail-story .story-row");

  rows.forEach((row, index) => {
    const item = story.rows?.[index];
    if (!item) return;

    setStoryImage(row.querySelector(".story-image"), item.image, `Open ${item.title} image`);
    setTextIn(row, ".story-copy h2", item.title);
    setTextIn(row, ".story-copy p", item.body);
  });

  setStoryImage(document.querySelector(".wide-story-image"), story.wide, `Open ${property.title} feature image`);

  document.querySelectorAll(".story-pair button").forEach((button, index) => {
    setStoryImage(button, story.pair?.[index], `Open ${property.title} detail image ${index + 1}`);
  });
}

function setTextIn(root, selector, value) {
  const element = root?.querySelector(selector);
  if (element && value) element.textContent = value;
}

function setupGallery(property) {
  const track = document.querySelector("[data-gallery-track]");
  const dots = document.querySelector("[data-gallery-dots]");
  const prev = document.querySelector("[data-gallery-prev]");
  const next = document.querySelector("[data-gallery-next]");

  if (!track || !dots || !prev || !next) return;

  let currentIndex = 0;
  let visibleCount = 4;
  let maxIndex = 0;
  let swipeStartX = 0;
  let swipeStartY = 0;
  let swipePointerId = null;
  let didSwipe = false;

  lightboxImages = property.gallery.slice();

  track.replaceChildren();
  property.gallery.forEach((image, index) => {
    const button = document.createElement("button");
    button.className = "gallery-slide";
    button.type = "button";
    button.setAttribute("aria-label", `Open ${image.alt}`);
    button.innerHTML = `<img src="${image.src}" alt="${image.alt}" loading="lazy" decoding="async">`;
    button.addEventListener("click", (event) => {
      if (didSwipe) {
        event.preventDefault();
        event.stopPropagation();
        didSwipe = false;
        return;
      }

      openLightbox(index);
    });
    track.append(button);
  });

  const getGap = () => {
    const style = window.getComputedStyle(track);
    return Number.parseFloat(style.columnGap || style.gap) || 0;
  };

  const getVisibleCount = () => {
    if (window.matchMedia("(max-width: 760px)").matches) return 1;
    if (window.matchMedia("(max-width: 1280px)").matches) return 3;
    return 4;
  };

  const renderDots = () => {
    dots.replaceChildren();
    for (let index = 0; index <= maxIndex; index += 1) {
      const dot = document.createElement("button");
      dot.className = "detail-gallery-dot";
      dot.type = "button";
      dot.setAttribute("aria-label", `Go to gallery group ${index + 1}`);
      dot.addEventListener("click", () => {
        currentIndex = index;
        update();
      });
      dots.append(dot);
    }
  };

  const update = () => {
    const firstSlide = track.querySelector(".gallery-slide");
    if (!firstSlide) return;
    const distance = firstSlide.getBoundingClientRect().width + getGap();
    track.style.transform = `translate3d(${-currentIndex * distance}px, 0, 0)`;
    prev.disabled = currentIndex === 0;
    next.disabled = currentIndex === maxIndex;
    dots.querySelectorAll(".detail-gallery-dot").forEach((dot, index) => {
      dot.classList.toggle("is-active", index === currentIndex);
    });
  };

  const refresh = () => {
    visibleCount = getVisibleCount();
    maxIndex = Math.max(0, property.gallery.length - visibleCount);
    currentIndex = Math.min(currentIndex, maxIndex);
    renderDots();
    update();
  };

  prev.addEventListener("click", () => {
    currentIndex = Math.max(0, currentIndex - 1);
    update();
  });

  next.addEventListener("click", () => {
    currentIndex = Math.min(maxIndex, currentIndex + 1);
    update();
  });

  track.addEventListener("pointerdown", (event) => {
    if (event.pointerType === "mouse") return;
    swipePointerId = event.pointerId;
    swipeStartX = event.clientX;
    swipeStartY = event.clientY;
    didSwipe = false;
    track.setPointerCapture?.(event.pointerId);
  });

  track.addEventListener("pointermove", (event) => {
    if (swipePointerId !== event.pointerId) return;
    const deltaX = event.clientX - swipeStartX;
    const deltaY = event.clientY - swipeStartY;

    if (Math.abs(deltaX) > 12 && Math.abs(deltaX) > Math.abs(deltaY)) {
      didSwipe = true;
    }
  });

  const finishSwipe = (event) => {
    if (swipePointerId !== event.pointerId) return;

    const deltaX = event.clientX - swipeStartX;
    const deltaY = event.clientY - swipeStartY;
    const isHorizontalSwipe = Math.abs(deltaX) > 42 && Math.abs(deltaX) > Math.abs(deltaY);

    if (isHorizontalSwipe) {
      currentIndex = deltaX < 0
        ? Math.min(maxIndex, currentIndex + 1)
        : Math.max(0, currentIndex - 1);
      update();
      didSwipe = true;
    }

    track.releasePointerCapture?.(event.pointerId);
    swipePointerId = null;
  };

  track.addEventListener("pointerup", finishSwipe);
  track.addEventListener("pointercancel", (event) => {
    if (swipePointerId !== event.pointerId) return;
    track.releasePointerCapture?.(event.pointerId);
    swipePointerId = null;
    didSwipe = false;
  });

  window.addEventListener("resize", refresh);
  refresh();
}

function setupGalleryCollage(property) {
  const trigger = document.querySelector("[data-gallery-view-all]");
  const collage = document.querySelector("[data-gallery-collage]");
  const grid = document.querySelector("[data-gallery-collage-grid]");
  const closeButton = document.querySelector("[data-gallery-collage-close]");

  if (!trigger || !collage || !grid || !closeButton) return;

  grid.replaceChildren();
  property.gallery.forEach((image, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.setAttribute("aria-label", `Open ${image.alt}`);
    button.innerHTML = `<img src="${image.src}" alt="${image.alt}" loading="lazy" decoding="async">`;
    button.addEventListener("click", () => {
      close();
      openLightbox(index);
    });
    grid.append(button);
  });

  const open = () => {
    collage.classList.add("is-open");
    collage.setAttribute("aria-hidden", "false");
    document.body.classList.add("menu-open");
  };

  const close = () => {
    collage.classList.remove("is-open");
    collage.setAttribute("aria-hidden", "true");
    document.body.classList.remove("menu-open");
  };

  trigger.addEventListener("click", open);
  closeButton.addEventListener("click", close);
  collage.addEventListener("click", (event) => {
    if (event.target === collage) close();
  });
  document.addEventListener("keydown", (event) => {
    if (collage.classList.contains("is-open") && event.key === "Escape") close();
  });
}

function setupInlineLightboxTriggers() {
  document.querySelectorAll("[data-lightbox-src]").forEach((button) => {
    const src = button.dataset.lightboxSrc;
    const img = button.querySelector("img");
    if (!src || !img) return;

    button.addEventListener("click", () => {
      const existingIndex = lightboxImages.findIndex((item) => item.src === src);
      const index =
        existingIndex >= 0
          ? existingIndex
          : lightboxImages.push({ src, alt: img.alt || "Property image" }) - 1;
      openLightbox(index);
    });
  });
}

function setupLightbox() {
  const lightbox = document.querySelector("[data-lightbox]");
  const closeButton = document.querySelector("[data-lightbox-close]");
  const prevButton = document.querySelector("[data-lightbox-prev]");
  const nextButton = document.querySelector("[data-lightbox-next]");

  if (!lightbox || !closeButton || !prevButton || !nextButton) return;

  const close = () => closeLightbox();

  closeButton.addEventListener("click", close);
  lightbox.addEventListener("click", (event) => {
    if (event.target === lightbox) close();
  });

  prevButton.addEventListener("click", () => {
    lightboxIndex = (lightboxIndex - 1 + lightboxImages.length) % lightboxImages.length;
    updateLightbox();
  });

  nextButton.addEventListener("click", () => {
    lightboxIndex = (lightboxIndex + 1) % lightboxImages.length;
    updateLightbox();
  });

  document.addEventListener("keydown", (event) => {
    if (!lightbox.classList.contains("is-open")) return;
    if (event.key === "Escape") close();
    if (event.key === "ArrowLeft") prevButton.click();
    if (event.key === "ArrowRight") nextButton.click();
  });
}

function openLightbox(index) {
  const lightbox = document.querySelector("[data-lightbox]");
  if (!lightbox || !lightboxImages.length) return;

  lightboxIndex = index;
  updateLightbox();
  lightbox.classList.add("is-open");
  lightbox.setAttribute("aria-hidden", "false");
  document.body.classList.add("menu-open");
}

function closeLightbox() {
  const lightbox = document.querySelector("[data-lightbox]");
  if (!lightbox) return;

  lightbox.classList.remove("is-open");
  lightbox.setAttribute("aria-hidden", "true");
  document.body.classList.remove("menu-open");
}

function updateLightbox() {
  const image = document.querySelector("[data-lightbox-image]");
  const caption = document.querySelector("[data-lightbox-caption]");
  const item = lightboxImages[lightboxIndex];

  if (!image || !item) return;
  image.src = item.src;
  image.alt = item.alt;
  if (caption) caption.textContent = item.alt;
}

function initPropertyDetail() {
  const property = getProperty();
  setupMobileMenu();
  setupPropertyContent(property);
  setupGallery(property);
  setupGalleryCollage(property);
  setupPropertyStory(property);
  setupInlineLightboxTriggers();
  setupLightbox();
  setupRevealAnimations();
}

// Guarded the same way property-search.js's setup is: this script is now
// loaded only after window.SellamData.ready resolves (see
// templates/property.html), which is well after DOMContentLoaded has
// already fired — without this check the listener below would register but
// never run, and the page would stay stuck on the template's placeholder
// content.
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initPropertyDetail);
} else {
  initPropertyDetail();
}
