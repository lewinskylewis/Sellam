function setupRentFilters() {
  const form = document.querySelector("[data-rent-filter]");
  const rowsContainer = document.querySelector("[data-property-rows]");
  const emptyState = document.querySelector("[data-rent-empty]");

  if (!form || !rowsContainer) return;

  const groups = Array.from(form.querySelectorAll("[data-rent-filter-group]"));
  const cards = Array.from(rowsContainer.querySelectorAll("[data-card]"));
  const defaultLabels = new Map();

  groups.forEach((group) => {
    const trigger = group.querySelector(".filter-trigger");
    const label = group.querySelector("[data-filter-label]");
    if (label) defaultLabels.set(group, label.textContent.trim());

    trigger?.addEventListener("click", () => {
      const willOpen = !group.classList.contains("is-open");
      closeRentFilterMenus(willOpen ? group : null);
      group.classList.toggle("is-open", willOpen);
      trigger.setAttribute("aria-expanded", String(willOpen));
    });
  });

  function closeRentFilterMenus(except = null) {
    groups.forEach((group) => {
      if (group === except) return;
      group.classList.remove("is-open");
      group.querySelector(".filter-trigger")?.setAttribute("aria-expanded", "false");
    });
  }

  function selectedValues(name) {
    return Array.from(form.querySelectorAll(`input[name="${name}"]:checked`)).map((input) => input.value);
  }

  function matchesCount(value, selections) {
    if (!selections.length) return true;
    return selections.some((selection) => selection === "6+" ? value >= 6 : value === Number(selection));
  }

  function updateLabels() {
    groups.forEach((group) => {
      const label = group.querySelector("[data-filter-label]");
      if (!label) return;

      const checks = Array.from(group.querySelectorAll("input:checked"));
      const min = group.querySelector("select[name='min-price']");
      const max = group.querySelector("select[name='max-price']");

      if (min && max && (min.value !== "0" || max.value !== "450000")) {
        label.textContent = `KES ${Number(min.value).toLocaleString()} – ${Number(max.value).toLocaleString()}`;
      } else if (checks.length === 1) {
        label.textContent = checks[0].value;
      } else if (checks.length > 1) {
        label.textContent = `${checks.length} selected`;
      } else {
        label.textContent = defaultLabels.get(group);
      }
    });
  }

  function renderCards(visibleCards) {
    rowsContainer.replaceChildren();

    if (!visibleCards.length) {
      if (emptyState) {
        emptyState.hidden = false;
        rowsContainer.append(emptyState);
      }
      return;
    }

    if (emptyState) emptyState.hidden = true;
    visibleCards.forEach((card, index) => {
      if (index % 2 === 0) {
        const row = document.createElement("div");
        row.className = "listing-row";
        rowsContainer.append(row);
      }
      rowsContainer.lastElementChild.append(card);
    });
  }

  function applyFilters() {
    const propertyTypes = selectedValues("property-type");
    const bedrooms = selectedValues("bedrooms");
    const bathrooms = selectedValues("bathrooms");
    const minPrice = Number(form.elements["min-price"].value);
    const maxPrice = Number(form.elements["max-price"].value);

    const visibleCards = cards.filter((card) => {
      const price = Number(card.dataset.price);
      const typeMatches = !propertyTypes.length || propertyTypes.includes(card.dataset.propertyType);
      return typeMatches
        && matchesCount(Number(card.dataset.bedrooms), bedrooms)
        && matchesCount(Number(card.dataset.bathrooms), bathrooms)
        && price >= minPrice
        && price <= maxPrice;
    });

    updateLabels();
    renderCards(visibleCards);
  }

  form.addEventListener("change", (event) => {
    if (event.target.name === "min-price" && Number(event.target.value) > Number(form.elements["max-price"].value)) {
      form.elements["max-price"].value = event.target.value;
    }
    if (event.target.name === "max-price" && Number(event.target.value) < Number(form.elements["min-price"].value)) {
      form.elements["min-price"].value = event.target.value;
    }
    applyFilters();
  });

  form.addEventListener("reset", () => {
    window.setTimeout(() => {
      closeRentFilterMenus();
      applyFilters();
    }, 0);
  });

  form.addEventListener("submit", (event) => event.preventDefault());
  document.addEventListener("click", (event) => {
    if (!event.target.closest("[data-rent-filter-group]")) closeRentFilterMenus();
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeRentFilterMenus();
  });

  applyFilters();
}

document.addEventListener("DOMContentLoaded", setupRentFilters);
