/* Each hero entry is ONE property. The big hero background and the 3 tiles
   are all the SAME property at once — the tiles are just minimised previews
   of that property's other sections (kitchen, living room, bedroom, dining,
   ...), not separate properties. Clicking a tile swaps the big background to
   that section (property, title and price stay put). The dots move between
   PROPERTIES — each dot is one property, and there can be any number of them
   (6 here); selecting a dot swaps the background, all 3 tiles, and the
   title/meta copy to that property, resetting to its first section.

   Only `sections` (the curated interior/exterior photo set) is hand-authored
   here. `id` points at the matching record in data/properties.js — the
   title, its link (property.html?id=...), the full unit-type list, and the
   starting price are all read live off that record (via resolveHeroProperty
   below), so the hero can never drift out of sync with the real inventory.

   This exact array is now also the FALLBACK: the primary source is the
   Hero Manager (homepage_hero_slides table), fetched by
   data/supabase-adapter.js into window.SELLAM_HERO_SLIDES in the same
   { id, sections } shape. If that fetch failed or returned nothing (table
   not migrated yet, RLS not applied, no active slides), this hardcoded set
   is used instead, so the homepage never ships with an empty hero. */
const FALLBACK_HERO_PROPERTIES = [
  {
    id: "sl-001",
    sections: [
      { label: "Gym", image: "assets/images/Silva Gigiri Residences Gym (2).jpeg" },
      { label: "Living Room", image: "assets/images/Silva Gigiri Residences Living room.jpeg" },
      { label: "Kitchen", image: "assets/images/Silva Gigiri Residences Kitchen.jpeg" }
    ]
  },
  {
    id: "sl-002",
    sections: [
      { label: "Exterior", image: "assets/images/Cheval Riverside Exterior (3).jpeg" },
      { label: "Swimming Pool", image: "assets/images/Cheval Riverside Swimming pool.jpeg" },
      { label: "Outdoor Living", image: "assets/images/Cheval Riverside Outdoor.jpeg" }
    ]
  },
  {
    id: "sl-003",
    sections: [
      { label: "Exterior", image: "assets/images/Diplomat Residences Exterior (2).jpeg" },
      { label: "Living Room", image: "assets/images/Diplomat Residences Living.jpeg" },
      { label: "Kitchen", image: "assets/images/Diplomat Residences Kitchen.jpeg" }
    ]
  },
  {
    id: "sl-004",
    sections: [
      { label: "Exterior", image: "assets/images/Gaia Brookside Forest Exterior (6).jpeg" },
      { label: "Living Room", image: "assets/images/Gaia Brookside Forest Living Room.jpeg" },
      { label: "Dining", image: "assets/images/Gaia Brookside Forest Dinning.jpeg" }
    ]
  },
  {
    id: "sl-005",
    sections: [
      { label: "Exterior", image: "assets/images/Hephé Palace Exterior.jpeg" },
      { label: "Living Room", image: "assets/images/Hephé Palace Living room.jpeg" },
      { label: "Bedroom", image: "assets/images/Hephé Palace Bedroom.jpeg" }
    ]
  },
  {
    id: "sl-006",
    sections: [
      { label: "Exterior", image: "assets/images/Amethyst Residences Outdoors.jpeg" },
      { label: "Living Room", image: "assets/images/Amethyst Residences Living Room (2).jpeg" },
      { label: "Interior", image: "assets/images/Amethyst Residences (10).jpeg" }
    ]
  }
];

const heroProperties =
  Array.isArray(window.SELLAM_HERO_SLIDES) && window.SELLAM_HERO_SLIDES.length > 0
    ? window.SELLAM_HERO_SLIDES
    : FALLBACK_HERO_PROPERTIES;

// Resolves a hero entry's `id` against the central inventory to build the
// title/link/description — the ONLY thing hand-authored per hero entry is
// `sections`. `meta` always lists every unit type the property comes in
// (via Units.unitLabels — Studio/Bedsitter/Mini 1 Bedroom/N Bedroom, same
// labels as the listing cards) rather than a hand-typed bedroom range, and
// keeps the site's "Starting KES X" pricing convention for a multi-unit
// property (see listings.js's identical prefix rule).
function resolveHeroProperty(entry) {
  const Units = window.SellamUnits;
  const inventory = (window.SELLAM_PROPERTIES || []).find((p) => p.id === entry.id);

  if (!inventory) {
    return { title: "", url: "#", meta: "", sections: entry.sections };
  }

  const priceField = inventory.letting === "rent" ? "rentPrice" : "salePrice";
  const price = Units ? Units.minPrice(inventory, priceField) : null;
  const priceText = window.SellamSearch
    ? window.SellamSearch.formatKES(price)
    : `KES ${Number(price).toLocaleString("en-KE")}`;
  const prefix = Units && Units.unitsOf(inventory).length > 1 ? "Starting " : "";

  const unitLabels = Units ? Units.unitLabels(inventory) : [];
  const unitsLine = unitLabels.length ? Units.joinList(unitLabels) : "";

  const district = (inventory.location || "").split(",")[0].trim();

  return {
    title: inventory.title,
    url: inventory.url,
    meta: [district, unitsLine, prefix + priceText].filter(Boolean).join(" | "),
    sections: entry.sections
  };
}

/* Homepage "Featured Properties" / "Exclusive Properties" teasers (Property
   Highlights admin page — homepage_property_highlights table, fetched by
   data/supabase-adapter.js into window.SELLAM_PROPERTY_HIGHLIGHTS as
   { featured: [{id, caption, image}], exclusive: [...] }).

   Unlike the hero carousel above, there is deliberately NO hardcoded JS
   fallback array here: if curated data for a section isn't available yet
   (fetch failed, migration not applied, nothing curated), this leaves that
   section's existing static <a class="image-card"> markup in index.html
   completely untouched, so a bug in this code can never leave the homepage
   showing an empty or broken gallery — the worst case is simply "unchanged
   from today". Each `.property-gallery` container to (possibly) replace is
   found via its data-highlight-section="featured"/"exclusive" attribute. */

function buildPropertyHighlightCard(entry, isTall) {
  const inventory = (window.SELLAM_PROPERTIES || []).find((p) => p.id === entry.id);
  if (!inventory) return null;

  const caption = (entry.caption || inventory.title || "").trim();
  const image = entry.image || inventory.image;
  if (!caption || !image) return null;

  const link = document.createElement("a");
  link.className = isTall ? "image-card image-card-tall" : "image-card";
  link.href = inventory.url || "#";

  const frame = document.createElement("span");
  frame.className = "image-frame";
  const img = document.createElement("img");
  img.src = image;
  img.alt = caption;
  frame.appendChild(img);

  const label = document.createElement("span");
  label.textContent = caption;

  link.appendChild(frame);
  link.appendChild(label);
  return link;
}

function renderPropertyHighlightSection(sectionName) {
  const container = document.querySelector('.property-gallery[data-highlight-section="' + sectionName + '"]');
  if (!container) return;

  const curated = window.SELLAM_PROPERTY_HIGHLIGHTS && window.SELLAM_PROPERTY_HIGHLIGHTS[sectionName];
  if (!Array.isArray(curated) || curated.length === 0) return;

  const cards = curated.map((entry, index) => buildPropertyHighlightCard(entry, index === 0)).filter(Boolean);
  // Only swap in the new set once every curated entry resolved to a real,
  // displayable card — a partial result would be worse than leaving the
  // current (known-good) static cards in place.
  if (cards.length !== curated.length) return;

  container.innerHTML = "";
  cards.forEach((card) => container.appendChild(card));

  // The homepage's own motion bootstrap (index.html <head>) may already have
  // revealed this container before this data arrived — if so, mirror what
  // its reveal() does so the freshly-swapped cards don't stay stuck hidden.
  if (container.classList.contains("is-visible")) {
    cards.forEach((card) => card.classList.add("motion-item-visible"));
  }
}

function renderPropertyHighlights() {
  renderPropertyHighlightSection("featured");
  renderPropertyHighlightSection("exclusive");
}

const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const heroCurrent = document.querySelector(".hero-bg-current");
const heroNext = document.querySelector(".hero-bg-next");
const heroTiles = document.querySelector(".hero-tiles");
const heroDots = document.querySelector(".hero-dots");
const heroCopy = document.querySelector(".hero-property-copy");
let activePropertyIndex = 0;
let activeSectionIndex = 0;
let activeBgLayer = heroCurrent;
let inactiveBgLayer = heroNext;
let heroTimer;

function setBackgroundImage(layer, src) {
  layer.style.backgroundImage = `url("${src}")`;
}

// Crossfades the big hero background to `src` — used by both a section
// change (same property) and a property change (dot).
function swapBackground(src) {
  setBackgroundImage(inactiveBgLayer, src);
  inactiveBgLayer.classList.add("is-active");
  activeBgLayer.classList.remove("is-active");
  [activeBgLayer, inactiveBgLayer] = [inactiveBgLayer, activeBgLayer];
}

function buildHeroControls() {
  if (!heroTiles || !heroDots) return;

  // Exactly 3 tile buttons, fixed "section slots" — NOT tied to one
  // property. Their image/label are rewritten to match whichever property
  // is currently active; clicking one shows that section of that property.
  for (let sectionIndex = 0; sectionIndex < 3; sectionIndex += 1) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "hero-tile";
    button.innerHTML = "<img alt=\"\">";
    button.addEventListener("click", () => {
      setActiveSection(sectionIndex);
      restartHeroTimer();
    });
    heroTiles.append(button);
  }

  // One dot per property.
  heroProperties.forEach((entry, index) => {
    const dot = document.createElement("button");
    dot.type = "button";
    dot.className = "hero-dot";
    dot.setAttribute("role", "tab");
    dot.setAttribute("aria-label", `Show ${resolveHeroProperty(entry).title}`);
    dot.addEventListener("click", () => {
      setActiveProperty(index);
      restartHeroTimer();
    });
    heroDots.append(dot);
  });
}

function renderTiles(property) {
  if (!heroTiles) return;
  heroTiles.querySelectorAll(".hero-tile").forEach((button, index) => {
    const section = property.sections[index];
    const img = button.querySelector("img");
    img.src = section.image;
    img.alt = `${property.title} — ${section.label}`;
    button.setAttribute("aria-label", `Show ${property.title} — ${section.label}`);
  });
}

function updateActiveSectionUI() {
  document.querySelectorAll(".hero-tile").forEach((tile, index) => {
    tile.classList.toggle("is-active", index === activeSectionIndex);
    tile.setAttribute("aria-pressed", index === activeSectionIndex ? "true" : "false");
  });
}

function updateActivePropertyUI() {
  document.querySelectorAll(".hero-dot").forEach((dot, index) => {
    dot.classList.toggle("is-active", index === activePropertyIndex);
    dot.setAttribute("aria-selected", index === activePropertyIndex ? "true" : "false");
  });
}

function updateCopy(property) {
  if (!heroCopy) return;
  heroCopy.classList.add("is-changing");
  window.setTimeout(() => {
    const heading = heroCopy.querySelector("h2");
    heading.textContent = "";
    const link = document.createElement("a");
    link.href = property.url;
    link.textContent = property.title;
    heading.append(link);
    heroCopy.querySelector("p").textContent = property.meta;
    heroCopy.classList.remove("is-changing");
  }, prefersReducedMotion ? 0 : 230);
}

// Switch to a different SECTION (tile) of the currently active property —
// only the hero background and the active-tile highlight move; the
// property's title, meta and tile images stay exactly the same.
function setActiveSection(sectionIndex) {
  const property = heroProperties[activePropertyIndex];
  const nextIndex = (sectionIndex + property.sections.length) % property.sections.length;

  if (nextIndex !== activeSectionIndex || !activeBgLayer.classList.contains("is-active")) {
    swapBackground(property.sections[nextIndex].image);
  }

  activeSectionIndex = nextIndex;
  updateActiveSectionUI();
}

// Switch to a different PROPERTY (dot) — swaps the hero background, all 3
// tile images, and the title/meta copy, resetting to that property's first
// section (its exterior shot).
function setActiveProperty(propertyIndex) {
  const nextIndex = (propertyIndex + heroProperties.length) % heroProperties.length;
  const property = resolveHeroProperty(heroProperties[nextIndex]);

  activePropertyIndex = nextIndex;
  activeSectionIndex = 0;

  renderTiles(property);
  updateCopy(property);
  updateActivePropertyUI();
  updateActiveSectionUI();
  swapBackground(property.sections[0].image);
}

function startHeroTimer() {
  if (prefersReducedMotion) return;
  heroTimer = window.setInterval(() => {
    setActiveProperty(activePropertyIndex + 1);
  }, 6400);
}

function restartHeroTimer() {
  window.clearInterval(heroTimer);
  startHeroTimer();
}

// Swipe left/right anywhere on the hero to move between properties (same
// as tapping a dot) — touch/pen only (mouse users have the dots/tiles), so
// this is aimed squarely at the tablet/mobile experience. Mirrors the
// pointer-swipe pattern already used by the property gallery in
// property-detail.js: a capture-phase click guard (heroDidSwipe) stops a
// swipe that happens to end on top of a dot/tile/title link from ALSO
// firing that element's own click.
function setupHeroSwipe() {
  const heroSection = document.querySelector(".hero");
  if (!heroSection) return;

  let swipePointerId = null;
  let swipeStartX = 0;
  let swipeStartY = 0;
  let heroDidSwipe = false;

  heroSection.addEventListener("pointerdown", (event) => {
    if (event.pointerType === "mouse") return;
    swipePointerId = event.pointerId;
    swipeStartX = event.clientX;
    swipeStartY = event.clientY;
    heroDidSwipe = false;
  });

  heroSection.addEventListener("pointermove", (event) => {
    if (swipePointerId !== event.pointerId) return;
    const deltaX = event.clientX - swipeStartX;
    const deltaY = event.clientY - swipeStartY;
    if (Math.abs(deltaX) > 12 && Math.abs(deltaX) > Math.abs(deltaY)) {
      heroDidSwipe = true;
    }
  });

  const finishSwipe = (event) => {
    if (swipePointerId !== event.pointerId) return;
    swipePointerId = null;

    const deltaX = event.clientX - swipeStartX;
    const deltaY = event.clientY - swipeStartY;
    const isHorizontalSwipe = Math.abs(deltaX) > 42 && Math.abs(deltaX) > Math.abs(deltaY);
    if (!isHorizontalSwipe) return;

    heroDidSwipe = true;
    setActiveProperty(activePropertyIndex + (deltaX < 0 ? 1 : -1));
    restartHeroTimer();
  };

  heroSection.addEventListener("pointerup", finishSwipe);
  heroSection.addEventListener("pointercancel", () => {
    swipePointerId = null;
  });

  // Capture phase so this runs — and can stop() — before the dot/tile/title
  // link's own click listener sees the click that follows a swipe's pointerup.
  heroSection.addEventListener("click", (event) => {
    if (!heroDidSwipe) return;
    event.preventDefault();
    event.stopPropagation();
    heroDidSwipe = false;
  }, true);
}

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

function closeAllDropdowns(except) {
  document.querySelectorAll("[data-filter], [data-country-select]").forEach((dropdown) => {
    if (dropdown === except) return;
    dropdown.classList.remove("is-open");
    const trigger = dropdown.querySelector("button[aria-expanded]");
    if (trigger) trigger.setAttribute("aria-expanded", "false");
  });
}

function setupSearchFilters() {
  document.querySelectorAll("[data-filter]").forEach((filter) => {
    const trigger = filter.querySelector(".filter-trigger");
    const label = trigger?.querySelector("span:nth-child(2)");
    const menu = filter.querySelector(".filter-menu");
    const checkboxes = filter.querySelectorAll(".filter-menu input[type='checkbox']");
    const selects = filter.querySelectorAll(".filter-menu select");
    const minPriceSelect = filter.querySelector("[data-price-min]");
    const maxPriceSelect = filter.querySelector("[data-price-max]");

    if (label && !label.dataset.defaultLabel) {
      label.dataset.defaultLabel = label.textContent.trim();
    }

    const getSelectDefaultValue = (select) => {
      if (Object.prototype.hasOwnProperty.call(select.dataset, "defaultValue")) {
        return select.dataset.defaultValue;
      }

      return select.options[0]?.value || "";
    };

    const updatePriceOptionState = () => {
      if (!minPriceSelect || !maxPriceSelect) return;

      const minValue = minPriceSelect.value ? Number(minPriceSelect.value) : 0;
      const maxValue = maxPriceSelect.value ? Number(maxPriceSelect.value) : Infinity;

      Array.from(maxPriceSelect.options).forEach((option) => {
        option.disabled = Boolean(option.value) && Number(option.value) < minValue;
      });

      Array.from(minPriceSelect.options).forEach((option) => {
        option.disabled = Boolean(option.value) && Number(option.value) > maxValue;
      });
    };

    const syncPriceRange = (changedSelect) => {
      if (!minPriceSelect || !maxPriceSelect) return;

      const minValue = minPriceSelect.value ? Number(minPriceSelect.value) : 0;
      const maxValue = maxPriceSelect.value ? Number(maxPriceSelect.value) : Infinity;

      if (minPriceSelect.value && maxPriceSelect.value && minValue > maxValue) {
        if (changedSelect === maxPriceSelect) {
          minPriceSelect.value = maxPriceSelect.value;
        } else {
          maxPriceSelect.value = minPriceSelect.value;
        }
      }

      updatePriceOptionState();
    };

    const updateLabel = () => {
      const selectedCheckboxCount = Array.from(checkboxes).filter((checkbox) => checkbox.checked).length;
      const selectedSelectCount = Array.from(selects).filter((select) => select.value !== getSelectDefaultValue(select)).length;
      const selectedCount = selectedCheckboxCount + selectedSelectCount;
      if (label) label.textContent = label.dataset.defaultLabel;
      trigger?.classList.toggle("has-selection", selectedCount > 0);
    };

    trigger?.addEventListener("click", () => {
      const isOpen = filter.classList.toggle("is-open");
      closeAllDropdowns(isOpen ? filter : null);
      trigger.setAttribute("aria-expanded", isOpen ? "true" : "false");
    });

    checkboxes.forEach((checkbox) => {
      checkbox.addEventListener("change", updateLabel);
    });

    selects.forEach((select) => {
      select.addEventListener("change", () => {
        syncPriceRange(select);
        updateLabel();
      });
    });

    let clearButton = menu?.querySelector(".clear-selection");

    if (menu && !clearButton) {
      clearButton = document.createElement("button");
      clearButton.type = "button";
      clearButton.className = "clear-selection";
      clearButton.textContent = "Clear selection";
      menu.append(clearButton);
    }

    clearButton?.addEventListener("click", () => {
      checkboxes.forEach((checkbox) => {
        checkbox.checked = false;
      });
      selects.forEach((select) => {
        select.value = getSelectDefaultValue(select);
      });
      syncPriceRange();
      updateLabel();
    });

    syncPriceRange();
    updateLabel();
  });

  document.addEventListener("click", (event) => {
    if (!event.target.closest("[data-filter], [data-country-select]")) {
      closeAllDropdowns();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeAllDropdowns();
  });
}

function setupCountryFilter() {
  const wrapper = document.querySelector("[data-country-select]");
  const trigger = wrapper?.querySelector(".country-trigger");
  const triggerText = trigger?.querySelector("span:first-child");
  const options = wrapper?.querySelectorAll(".country-menu button");
  const cards = document.querySelectorAll(".diaspora-card");

  if (!wrapper || !trigger || !options) return;

  trigger.addEventListener("click", () => {
    const isOpen = wrapper.classList.toggle("is-open");
    closeAllDropdowns(isOpen ? wrapper : null);
    trigger.setAttribute("aria-expanded", isOpen ? "true" : "false");
  });

  options.forEach((option) => {
    option.addEventListener("click", () => {
      const selected = option.dataset.country;
      const label = option.textContent || "Select Country";
      if (triggerText) triggerText.textContent = selected === "all" ? "Select Country" : label;

      cards.forEach((card) => {
        const shouldShow = selected === "all" || card.dataset.country === selected;
        card.classList.toggle("is-hidden", !shouldShow);
      });

      wrapper.classList.remove("is-open");
      trigger.setAttribute("aria-expanded", "false");
      window.dispatchEvent(new CustomEvent("diaspora-filter-change"));
    });
  });
}

function setupDiasporaCarousel() {
  const track = document.querySelector(".diaspora-grid");
  const dotsWrap = document.querySelector(".diaspora-dots");

  if (!track || !dotsWrap) return;

  let pagePositions = [];

  const getVisibleCards = () => Array.from(track.querySelectorAll(".diaspora-card:not(.is-hidden)"));

  const getCardStep = () => {
    const card = getVisibleCards()[0];
    const gap = parseFloat(getComputedStyle(track).columnGap || getComputedStyle(track).gap || 0);
    return card ? card.getBoundingClientRect().width + gap : track.clientWidth;
  };

  const buildPages = () => {
    const visibleCards = getVisibleCards();
    const maxScroll = Math.max(0, track.scrollWidth - track.clientWidth);
    const cardStep = getCardStep();
    const cardsPerView = Math.max(1, Math.round(track.clientWidth / cardStep));
    const pageCount = Math.max(1, Math.ceil(visibleCards.length / cardsPerView));

    track.scrollTo({ left: 0, behavior: "auto" });
    pagePositions = Array.from({ length: pageCount }, (_, pageIndex) => {
      return Math.min(pageIndex * cardsPerView * cardStep, maxScroll);
    }).filter((position, index, positions) => index === 0 || Math.abs(position - positions[index - 1]) > 4);

    if (pagePositions.length && pagePositions[pagePositions.length - 1] !== maxScroll) {
      pagePositions[pagePositions.length - 1] = maxScroll;
    }

    dotsWrap.innerHTML = "";
    pagePositions.forEach((_, index) => {
      const dot = document.createElement("button");
      dot.type = "button";
      dot.className = "diaspora-dot";
      dot.setAttribute("aria-label", `Show diaspora page ${index + 1}`);
      dot.addEventListener("click", () => {
        track.scrollTo({ left: pagePositions[index], behavior: "smooth" });
      });
      dotsWrap.append(dot);
    });

    updateDots();
  };

  const getActivePage = () => {
    const current = track.scrollLeft;
    let activePage = 0;
    pagePositions.forEach((position, index) => {
      if (Math.abs(current - position) < Math.abs(current - pagePositions[activePage])) {
        activePage = index;
      }
    });
    return activePage;
  };

  const updateDots = () => {
    const activePage = getActivePage();
    dotsWrap.querySelectorAll(".diaspora-dot").forEach((dot, index) => {
      dot.classList.toggle("is-active", index === activePage);
      dot.setAttribute("aria-current", index === activePage ? "true" : "false");
    });
  };

  track.addEventListener("scroll", updateDots, { passive: true });
  window.addEventListener("resize", buildPages);
  window.addEventListener("diaspora-filter-change", buildPages);
  buildPages();
}

function setupCommunityCarousel() {
  const track = document.querySelector(".community-track");
  const prev = document.querySelector(".slider-arrow.prev");
  const next = document.querySelector(".slider-arrow.next");
  const dotsWrap = document.querySelector(".community-dots");

  if (!track || !prev || !next || !dotsWrap) return;

  let pagePositions = [];

  const getCardStep = () => {
    const card = track.querySelector(".community-card");
    const gap = parseFloat(getComputedStyle(track).columnGap || getComputedStyle(track).gap || 0);
    return card ? card.getBoundingClientRect().width + gap : track.clientWidth;
  };

  const updateArrowPosition = () => {
    const firstImage = track.querySelector(".community-card .image-frame");
    if (!firstImage) return;

    const carouselRect = track.closest(".community-carousel").getBoundingClientRect();
    const imageRect = firstImage.getBoundingClientRect();
    const imageCenter = imageRect.top - carouselRect.top + imageRect.height / 2;
    track.closest(".community-carousel").style.setProperty("--community-arrow-top", `${imageCenter}px`);
  };

  const buildPages = () => {
    updateArrowPosition();
    const maxScroll = Math.max(0, track.scrollWidth - track.clientWidth);
    const cardsPerView = Math.max(1, Math.round(track.clientWidth / getCardStep()));
    const cardStep = getCardStep();
    const cards = Array.from(track.querySelectorAll(".community-card"));
    const pageCount = Math.max(1, Math.ceil(cards.length / cardsPerView));

    pagePositions = Array.from({ length: pageCount }, (_, pageIndex) => {
      return Math.min(pageIndex * cardsPerView * cardStep, maxScroll);
    }).filter((position, index, positions) => index === 0 || Math.abs(position - positions[index - 1]) > 4);

    if (pagePositions[pagePositions.length - 1] !== maxScroll) {
      pagePositions[pagePositions.length - 1] = maxScroll;
    }

    dotsWrap.innerHTML = "";
    pagePositions.forEach((_, index) => {
      const dot = document.createElement("button");
      dot.type = "button";
      dot.className = "community-dot";
      dot.setAttribute("aria-label", `Show community page ${index + 1}`);
      dot.addEventListener("click", () => {
        track.scrollTo({ left: pagePositions[index], behavior: "smooth" });
      });
      dotsWrap.append(dot);
    });

    updateCarouselState();
  };

  const getActivePage = () => {
    const current = track.scrollLeft;
    let activePage = 0;
    pagePositions.forEach((position, index) => {
      if (Math.abs(current - position) < Math.abs(current - pagePositions[activePage])) {
        activePage = index;
      }
    });
    return activePage;
  };

  const updateCarouselState = () => {
    const maxScroll = Math.max(0, track.scrollWidth - track.clientWidth);
    const atStart = track.scrollLeft <= 4;
    const atEnd = track.scrollLeft >= maxScroll - 4;
    prev.disabled = atStart;
    next.disabled = atEnd;

    const activePage = getActivePage();
    dotsWrap.querySelectorAll(".community-dot").forEach((dot, index) => {
      dot.classList.toggle("is-active", index === activePage);
      dot.setAttribute("aria-current", index === activePage ? "true" : "false");
    });
  };

  const scrollToPage = (direction) => {
    const activePage = getActivePage();
    const nextPage = Math.min(Math.max(activePage + direction, 0), pagePositions.length - 1);
    track.scrollTo({ left: pagePositions[nextPage], behavior: "smooth" });
  };

  next.addEventListener("click", () => {
    scrollToPage(1);
  });

  prev.addEventListener("click", () => {
    scrollToPage(-1);
  });

  track.addEventListener("scroll", updateCarouselState, { passive: true });
  window.addEventListener("resize", buildPages);
  window.addEventListener("load", buildPages);
  buildPages();
}

function setupRevealAnimations() {
  // Scroll-triggered reveals are owned by the motion bootstrap in index.html's
  // <head> (IntersectionObserver, gated on `html.motion-ready`). When motion is
  // disabled (reduced-motion / no IntersectionObserver), the CSS fail-safe keeps
  // every section visible, so there is nothing to toggle here.
}

function setupForms() {
  document.querySelectorAll("form").forEach((form) => {
    form.addEventListener("submit", (event) => {
      event.preventDefault();
    });
  });
}

buildHeroControls();
const initialHeroProperty = resolveHeroProperty(heroProperties[0]);
setBackgroundImage(heroCurrent, initialHeroProperty.sections[0].image);
heroCurrent.classList.add("is-active");
renderTiles(initialHeroProperty);
updateCopy(initialHeroProperty);
updateActivePropertyUI();
updateActiveSectionUI();
startHeroTimer();
setupHeroSwipe();
setupMobileMenu();
setupSearchFilters();
setupCountryFilter();
setupCommunityCarousel();
setupDiasporaCarousel();
setupRevealAnimations();
setupForms();
renderPropertyHighlights();
