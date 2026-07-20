(function () {
  const pageName = window.location.pathname.split("/").pop().toLowerCase() || "index.html";
  const isPropertyDetail = window.location.pathname.toLowerCase().includes("/properties/");

  function getActiveSection() {
    const hashSection = window.location.hash.replace("#", "").toLowerCase();
    if (["buy", "rent", "leasing", "off-plan", "services"].includes(hashSection)) {
      return hashSection;
    }

    if (pageName === "rent.html") return "rent";
    if (pageName === "leasing.html") return "leasing";
    if (["services.html", "operations-management.html", "property-sales.html"].includes(pageName)) {
      return "services";
    }
    if (
      isPropertyDetail ||
      ["buy.html", "premium-properties.html", "exclusive-properties.html", "property.html"].includes(pageName)
    ) {
      return "buy";
    }

    return "";
  }

  function updateActiveNavigation() {
    const activeSection = getActiveSection();
    document.querySelectorAll(".desktop-nav a, .mobile-nav-list a").forEach((link) => {
      const label = link.textContent.trim().toLowerCase();
      const isActive = Boolean(activeSection) && label === activeSection;
      if (isActive) {
        link.setAttribute("aria-current", "page");
      } else {
        link.removeAttribute("aria-current");
      }
    });
  }

  const siteHeader = document.querySelector(".site-header");

  function updateStickyNavigation() {
    if (!siteHeader) return;
    siteHeader.classList.toggle("is-scrolled", window.scrollY > 0);
  }

  updateActiveNavigation();
  updateStickyNavigation();
  window.addEventListener("hashchange", updateActiveNavigation);
  window.addEventListener("scroll", updateStickyNavigation, { passive: true });
})();
