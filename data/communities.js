/* ============================================================================
   SELLAM — CENTRAL COMMUNITY INVENTORY  (single source of truth)
   ============================================================================
   THIS IS THE ONLY FILE YOU EDIT TO ADD / CHANGE / REMOVE A COMMUNITY.

   Every surface reads from this list:
     • Homepage search bar's "Communities" checklist  -> generated from this
     • Homepage "Featured Communities" carousel        -> generated from this
     • data/properties.js's `community` field           -> should reference a
       `key` from this list (see the note at the bottom of this file)

   DATA ONLY — no logic lives here. Rendering is done by community-render.js.

   ---------------------------------------------------------------------------
   FIELD REFERENCE
   ---------------------------------------------------------------------------
   key          Stable, unique, lowercase, hyphenated. This is the exact value
                used by the search-bar checkbox AND by every property's
                `community` field in data/properties.js. Never change an
                existing key once properties reference it — you'd silently
                break search filtering for every property using it.
   label        Display name shown in the checkbox and the carousel card.
   image        Photo used on the carousel card.
   imageAlt     Alt text for that photo.
   description  One or two sentences shown on the carousel card.
   url          "View Community" link target. NOTE: none of these pages exist
                yet on the live site (this was already true before this file
                existed — every community, old and new, points at a
                communities/<key>.html that hasn't been built). Not something
                to fix here; just don't be surprised the link 404s today.
   ============================================================================ */

window.SELLAM_COMMUNITIES = [
  {
    key: "runda",
    label: "Runda",
    image: "assets/images/community-runda.webp",
    imageAlt: "Runda skyline and green community",
    description: "Expansive villas and townhouses in Runda offer luxury, privacy, and convenience near diplomatic zones, top schools, and amenities.",
    url: "communities/runda.html"
  },
  {
    key: "muthaiga",
    label: "Muthaiga",
    image: "assets/images/community-muthaiga.webp",
    imageAlt: "Muthaiga luxury apartment tower",
    description: "Gracious villas on landscaped grounds offer privacy, elegance, and prestige near diplomatic zones, hospitals, and elite clubs in Nairobi.",
    url: "communities/muthaiga.html"
  },
  {
    key: "ridgeways",
    label: "Ridgeways",
    image: "assets/images/community-ridgeways.webp",
    imageAlt: "Ridgeways curved apartment tower",
    description: "Ridgeways offers modern homes in a serene setting, near malls, top schools, and highways - ideal for families and professionals.",
    url: "communities/ridgeways.html"
  },
  {
    key: "nyari",
    label: "Nyari",
    image: "assets/images/community-nyari.webp",
    imageAlt: "Nyari premium residential tower",
    description: "Elegant villas and townhouses with top security, lush greenery, and gated living near diplomatic zones, offering space and community.",
    url: "communities/nyari.html"
  },
  {
    key: "karen",
    label: "Karen",
    image: "assets/images/diaspora-miami.webp",
    imageAlt: "Karen contemporary villa exterior",
    description: "Generous homes, calm streets, and leafy compounds create a refined residential setting for families and private retreats.",
    url: "communities/karen.html"
  },
  {
    key: "lavington",
    label: "Lavington",
    image: "assets/images/diaspora-manchester.webp",
    imageAlt: "Lavington modern townhouse frontage",
    description: "Modern residences, easy access, and composed urban living define this sought-after address for elegant daily life.",
    url: "communities/lavington.html"
  },
  {
    key: "kileleshwa",
    label: "Kileleshwa",
    image: "assets/images/hero-kileleshwa.webp",
    imageAlt: "Kileleshwa apartment tower",
    description: "Elegant apartment living, green streets, and easy access to Nairobi's lifestyle corridors make Kileleshwa highly desirable.",
    url: "communities/kileleshwa.html"
  },
  {
    key: "kilimani",
    label: "Kilimani",
    image: "assets/images/premium-living.webp",
    imageAlt: "Kilimani refined apartment interior",
    description: "Connected, vibrant, and central, Kilimani offers polished apartments close to dining, retail, business, and leisure.",
    url: "communities/kilimani.html"
  },
  {
    key: "westlands",
    label: "Westlands",
    image: "assets/images/premium-bedroom.webp",
    imageAlt: "Westlands contemporary apartment suite",
    description: "Westlands brings premium apartments, business access, nightlife, shopping, and high-demand investment potential together.",
    url: "communities/westlands.html"
  },
  {
    key: "thigiri",
    label: "Thigiri",
    image: "assets/images/diaspora-new-york.webp",
    imageAlt: "Thigiri serene residential estate",
    description: "Quiet streets, mature greenery, and diplomatic convenience make Thigiri a composed address for private family living.",
    url: "communities/thigiri.html"
  },
  {
    key: "rosslyn",
    label: "Rosslyn",
    image: "assets/images/hero-runda.webp",
    imageAlt: "Rosslyn premium residential greenery",
    description: "Rosslyn blends generous homes, secure compounds, embassy proximity, and easy access to schools, malls, and diplomatic hubs.",
    url: "communities/rosslyn.html"
  },
  {
    key: "parklands",
    label: "Parklands",
    image: "assets/images/Kile.png",
    imageAlt: "Parklands urban apartment community",
    description: "Parklands offers connected apartment living near commerce, education, healthcare, and Nairobi's established urban corridors.",
    url: "communities/parklands.html"
  },
  {
    key: "lower-kabete",
    label: "Lower Kabete",
    image: "assets/images/Premium properties/Lower Kabete 5 Bedroom (2).jpeg",
    imageAlt: "Lower Kabete premium family residence",
    description: "Lower Kabete is known for spacious homes, leafy privacy, school access, and calm residential streets close to key city routes. It also offers elevated family estates, secure compounds, and a quiet premium setting close to established amenities.",
    url: "communities/lower-kabete.html"
  },
  {
    key: "muthangari",
    label: "Muthangari",
    image: "assets/images/premium-page-grosvenor-towers.jpg",
    imageAlt: "Muthangari refined residential tower",
    description: "Muthangari offers a polished residential setting near Westlands, with apartments, townhomes, and excellent urban access.",
    url: "communities/muthangari.html"
  },
  {
    key: "kitisuru",
    label: "Kitisuru",
    image: "assets/images/hero-moon-valley.webp",
    imageAlt: "Kitisuru serene green residential area",
    description: "Kitisuru brings quiet prestige, generous plots, private residences, and easy reach to schools, shopping, and diplomatic zones.",
    url: "communities/kitisuru.html"
  },
  {
    key: "spring-valley",
    label: "Spring Valley",
    image: "assets/images/property-detail-arrival.jpg",
    imageAlt: "Spring Valley refined residential entry",
    description: "Spring Valley offers understated prestige, green compounds, quiet roads, and convenient access to Westlands and diplomatic areas.",
    url: "communities/spring-valley.html"
  },
  {
    key: "loresho",
    label: "Loresho",
    image: "assets/images/Premium properties/Loresho 4 Bedroom Villas (10).jpeg",
    imageAlt: "Loresho premium villa community",
    description: "Loresho is a calm villa neighborhood with family homes, green surroundings, privacy, and quick access to Westlands corridors.",
    url: "communities/loresho.html"
  },
  {
    key: "riverside",
    label: "Riverside",
    image: "assets/images/grosvenor.jpg",
    imageAlt: "Riverside modern residential tower",
    description: "Riverside blends apartment convenience, embassies, offices, dining, and central access in one of Nairobi's strongest addresses.",
    url: "communities/riverside.html"
  },
  {
    key: "nyali",
    label: "Nyali",
    image: "assets/images/premium-page-seaview-tower.jpg",
    imageAlt: "Nyali coastal residential tower",
    description: "Nyali offers coastal apartments and homes close to beaches, shopping, schools, hospitality, and Mombasa's leisure lifestyle.",
    url: "communities/nyali.html"
  },
  {
    key: "vipingo",
    label: "Vipingo",
    image: "assets/images/diaspora-miami.webp",
    imageAlt: "Vipingo coastal resort-style residence",
    description: "Vipingo is shaped by coastal calm, resort-style living, golf, beaches, and long-term lifestyle investment appeal.",
    url: "communities/vipingo.html"
  },

  /* -------------------------------------------------------------------------
     NEW — these two previously existed as valid search-bar filter values
     (and are used by real listings in data/properties.js) but had no carousel
     card at all. Photography is placeholder — reused from the closest
     thematically-matching image already in the asset library — swap for real
     photography when available; nothing else needs to change to do that. */

  {
    key: "ngong",
    label: "Ngong",
    image: "assets/images/premium-page-grosvenor-ngong.jpg",
    imageAlt: "Ngong residential estate",
    description: "Ngong offers spacious family estates and emerging light-industrial and commercial space, with growing infrastructure and easy access to Nairobi via Ngong Road.",
    url: "communities/ngong.html"
  },
  {
    key: "syokimau",
    label: "Syokimau",
    image: "assets/images/premium-page-dg-jkia-pool.jpg",
    imageAlt: "Syokimau residential and commercial development",
    description: "Syokimau combines convenient residential living with strong commercial and logistics appeal, thanks to its proximity to JKIA, the SGR terminus, and the Mombasa Road corridor.",
    url: "communities/syokimau.html"
  },
  {
    key: "gigiri",
    label: "Gigiri",
    image: "assets/images/Silva Gigigri Residences Exterior.jpeg",
    imageAlt: "Gigiri diplomatic enclave residential development",
    description: "Gigiri is Nairobi's prestigious diplomatic enclave, home to the United Nations Headquarters, international embassies, Village Market, and Karura Forest — offering internationally branded residences and some of the city's most secure, established addresses.",
    url: "communities/gigiri.html"
  }
];

/* ---------------------------------------------------------------------------
   NOTE on data/properties.js: a property's `community` field should always be
   one of the `key` values above. This file doesn't enforce that at the data
   level (properties.js just stores a plain string) — community-render.js
   cross-checks it for you and logs a console warning on the homepage if a
   property references a community key that doesn't exist here, so a typo
   never fails silently.
   ============================================================================ */
