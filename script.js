const heroSlides = [
  {
    title: "Loresho Villas",
    meta: "Loresho | 4 Bedroom Villas | Starting KES 96,000,000",
    tile: "assets/images/Premium properties/Loresho 4 Bedroom Villas (3).webp",
    background: "assets/images/Premium properties/Loresho 4 Bedroom Villas (11).webp"
  },
  {
    title: "Luxury Mansion",
    meta: "Runda | 4 Bedroom Luxury Mansion | Starting KES 350,000,000",
    tile: "assets/images/Premium properties/RundaMansion3.webp",
    background: "assets/images/grosvenor.webp"
  },
  {
    title: "Ostrea Villas",
    meta: "Karen | Signature Villas | Starting KES 165,000,000",
    tile: "assets/images/Premium properties/OSTREA Karen Villas (2).webp",
    background: "assets/images/Premium properties/OSTREA Karen Villas.webp"
  },
  {
    title: "Runda Gardens",
    meta: "Runda | Private Villas | Bespoke Family Living",
    tile: "assets/images/hero-runda.webp",
    background: "assets/images/grosout.webp"
  },
  {
    title: "Nyari Crest",
    meta: "Nyari | Exclusive Off-Market Homes | Viewing By Appointment",
    tile: "assets/images/hero-moon-valley.webp",
    background: "assets/images/aumout.webp"
  }
];

const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const heroSlideCount = 3;
const heroCurrent = document.querySelector(".hero-bg-current");
const heroNext = document.querySelector(".hero-bg-next");
const heroTiles = document.querySelector(".hero-tiles");
const heroDots = document.querySelector(".hero-dots");
const heroCopy = document.querySelector(".hero-property-copy");
let activeHeroIndex = 0;
let activeBgLayer = heroCurrent;
let inactiveBgLayer = heroNext;
let heroTimer;

function setBackgroundImage(layer, src) {
  layer.style.backgroundImage = `url("${src}")`;
}

function buildHeroControls() {
  if (!heroTiles || !heroDots) return;

  heroSlides.slice(0, heroSlideCount).forEach((slide, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "hero-tile";
    button.setAttribute("aria-label", `Show ${slide.title}`);
    button.innerHTML = `<img src="${slide.tile}" alt="${slide.title}">`;
    button.addEventListener("click", () => {
      setHeroSlide(index);
      restartHeroTimer();
    });
    heroTiles.append(button);
  });

  heroSlides.slice(0, heroSlideCount).forEach((slide, index) => {
    const dot = document.createElement("button");
    dot.type = "button";
    dot.className = "hero-dot";
    dot.setAttribute("role", "tab");
    dot.setAttribute("aria-label", `Show ${slide.title}`);
    dot.addEventListener("click", () => {
      setHeroSlide(index);
      restartHeroTimer();
    });
    heroDots.append(dot);
  });
}

function setHeroSlide(index) {
  const nextIndex = (index + heroSlideCount) % heroSlideCount;
  const slide = heroSlides[nextIndex];

  if (nextIndex !== activeHeroIndex || !activeBgLayer.classList.contains("is-active")) {
    setBackgroundImage(inactiveBgLayer, slide.background);
    inactiveBgLayer.classList.add("is-active");
    activeBgLayer.classList.remove("is-active");
    [activeBgLayer, inactiveBgLayer] = [inactiveBgLayer, activeBgLayer];
  }

  if (heroCopy) {
    heroCopy.classList.add("is-changing");
    window.setTimeout(() => {
      heroCopy.querySelector("h2").textContent = slide.title;
      heroCopy.querySelector("p").textContent = slide.meta;
      heroCopy.classList.remove("is-changing");
    }, prefersReducedMotion ? 0 : 230);
  }

  document.querySelectorAll(".hero-tile").forEach((tile, tileIndex) => {
    tile.classList.toggle("is-active", tileIndex === nextIndex);
    tile.setAttribute("aria-pressed", tileIndex === nextIndex ? "true" : "false");
  });

  document.querySelectorAll(".hero-dot").forEach((dot, dotIndex) => {
    dot.classList.toggle("is-active", dotIndex === nextIndex);
    dot.setAttribute("aria-selected", dotIndex === nextIndex ? "true" : "false");
  });

  activeHeroIndex = nextIndex;
}

function startHeroTimer() {
  if (prefersReducedMotion) return;
  heroTimer = window.setInterval(() => {
    setHeroSlide(activeHeroIndex + 1);
  }, 6400);
}

function restartHeroTimer() {
  window.clearInterval(heroTimer);
  startHeroTimer();
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
  document.querySelectorAll(".reveal").forEach((item) => {
    item.classList.add("is-visible");
  });
}

function setupForms() {
  document.querySelectorAll("form").forEach((form) => {
    form.addEventListener("submit", (event) => {
      event.preventDefault();
    });
  });
}

buildHeroControls();
setBackgroundImage(heroCurrent, heroSlides[0].background);
heroCurrent.classList.add("is-active");
setHeroSlide(0);
startHeroTimer();
setupMobileMenu();
setupSearchFilters();
setupCountryFilter();
setupCommunityCarousel();
setupDiasporaCarousel();
setupRevealAnimations();
setupForms();
