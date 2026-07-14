const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

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
    { threshold: 0.16, rootMargin: "0px 0px -8% 0px" }
  );

  revealItems.forEach((item) => observer.observe(item));
}

function setupSortControls() {
  const wrapper = document.querySelector("[data-sort-select]");
  const trigger = wrapper?.querySelector(".sort-trigger");
  const triggerText = trigger?.querySelector("span");
  const options = wrapper?.querySelectorAll(".sort-menu button");
  const shortcuts = document.querySelectorAll("[data-sort-shortcut]");
  const rowsContainer = document.querySelector("[data-property-rows]");

  if (!wrapper || !trigger || !options || !rowsContainer) return;

  const getCards = () => Array.from(rowsContainer.querySelectorAll("[data-card]"));

  const makeRow = () => {
    const row = document.createElement("div");
    row.className = "listing-row";
    return row;
  };

  const sortCards = (type) => {
    const cards = getCards();

    cards.sort((a, b) => {
      if (type === "name") {
        return a.dataset.title.localeCompare(b.dataset.title) || Number(a.dataset.order) - Number(b.dataset.order);
      }

      if (type === "bedrooms" || type === "bathrooms") {
        return Number(b.dataset[type]) - Number(a.dataset[type]) || Number(a.dataset.order) - Number(b.dataset.order);
      }

      return Number(a.dataset.order) - Number(b.dataset.order);
    });

    rowsContainer.replaceChildren();
    cards.forEach((card, index) => {
      if (index % 2 === 0) rowsContainer.append(makeRow());
      rowsContainer.lastElementChild.append(card);
    });

    cards.forEach((card, index) => {
      card.classList.remove("is-visible");
      window.setTimeout(() => card.classList.add("is-visible"), prefersReducedMotion ? 0 : index * 50);
    });
  };

  const setSort = (type, label) => {
    sortCards(type);
    if (triggerText) triggerText.textContent = "Sort by";
    wrapper.classList.remove("is-open");
    trigger.setAttribute("aria-expanded", "false");
  };

  trigger.addEventListener("click", () => {
    const isOpen = wrapper.classList.toggle("is-open");
    trigger.setAttribute("aria-expanded", isOpen ? "true" : "false");
  });

  options.forEach((option) => {
    option.addEventListener("click", () => setSort(option.dataset.sort, option.textContent.trim()));
  });

  shortcuts.forEach((button) => {
    button.addEventListener("click", () => {
      const type = button.dataset.sortShortcut || "name";
      const labels = {
        name: "Name",
        bedrooms: "No of Bedrooms",
        bathrooms: "No of Bathrooms"
      };
      setSort(type, labels[type] || "Name");
    });
  });

  document.addEventListener("click", (event) => {
    if (!event.target.closest("[data-sort-select]")) {
      wrapper.classList.remove("is-open");
      trigger.setAttribute("aria-expanded", "false");
    }
  });
}

document.addEventListener("DOMContentLoaded", () => {
  setupMobileMenu();
  setupRevealAnimations();
  setupSortControls();
});
