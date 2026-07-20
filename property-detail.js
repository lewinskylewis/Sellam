const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

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
    featureLocation: "Prime Westlands address with premium access, high visibility, and strong long-term value.",
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

function formatPropertyPrice(inventoryItem) {
  const format = window.SellamSearch && typeof window.SellamSearch.formatKES === "function"
    ? window.SellamSearch.formatKES
    : (value) => `KES ${Number(value).toLocaleString("en-KE")}`;

  const parts = [];
  if (inventoryItem.salePrice) parts.push(`Sale, ${format(inventoryItem.salePrice)}`);
  if (inventoryItem.rentPrice) parts.push(`Rent, ${format(inventoryItem.rentPrice)}/month`);
  return parts.length ? parts.join(" | ") : "Price on application";
}

function inventoryToLegacyShape(inventoryItem) {
  const sourceGallery = inventoryItem.gallery?.length ? inventoryItem.gallery : [inventoryItem.image];
  const gallery = sourceGallery.map((src, index) => ({
    src,
    alt: `${inventoryItem.title} image ${index + 1}`
  }));

  return {
    title: inventoryItem.title,
    location: inventoryItem.location,
    price: formatPropertyPrice(inventoryItem),
    hero: gallery[0].src,
    heroAlt: `${inventoryItem.title} in ${inventoryItem.location}`,
    description: inventoryItem.description,
    featureLocation: inventoryItem.featureLocation,
    gallery,
    // Bespoke narrative text (when present) overlays the auto-generated story
    // rows in buildStoryContent() — see there for how images are assigned.
    storyText: inventoryItem.story?.rows
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

function renderDescription(selector, value) {
  const element = document.querySelector(selector);
  if (!element) return;

  element.replaceChildren();
  String(value)
    .split(/\n{2,}/)
    .map((part) => part.trim())
    .filter(Boolean)
    .forEach((part) => {
      const paragraph = document.createElement("p");
      paragraph.textContent = part;
      element.append(paragraph);
    });
}

function setupPropertyContent(property) {
  document.title = `Sellam | ${property.title}`;
  setText("[data-property-title]", property.title);
  renderDescription("[data-property-description]", property.description);
  setText("[data-property-price]", property.price);
  setText("[data-feature-location]", property.featureLocation);

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
}

function buildStoryContent(property) {
  const gallery = property.gallery?.length ? property.gallery : commonGallery;
  const imageAt = (index) => gallery[index % gallery.length];
  const title = property.title;
  const location = property.location || "Nairobi";

  // Generic, always-available narrative — used as-is when a property has no
  // bespoke copy, and as the image/fallback-text source when it does.
  const rows = [
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
    button.innerHTML = `<img src="${image.src}" alt="${image.alt}">`;
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

document.addEventListener("DOMContentLoaded", () => {
  const property = getProperty();
  setupMobileMenu();
  setupPropertyContent(property);
  setupGallery(property);
  setupPropertyStory(property);
  setupInlineLightboxTriggers();
  setupLightbox();
  setupRevealAnimations();
});
