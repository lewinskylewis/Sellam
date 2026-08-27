/* ============================================================================
   SELLAM — COMMUNITY RENDERER
   ============================================================================
   Renders both community surfaces on the homepage from the central inventory
   (data/communities.js):

     .community-filter-menu   the "Communities" checklist in the search bar
     .community-track         the "Featured Communities" carousel

   Markup produced here is byte-identical to what used to be hand-written in
   index.html, so script.js's setupSearchFilters() / setupCommunityCarousel()
   need no changes at all — they just query the DOM after this runs.

   Runs SYNCHRONOUSLY (script tag sits after the markup, before script.js) so
   both surfaces are populated before script.js's top-level init calls fire.

   Also cross-checks data/properties.js's `community` field against this
   inventory, so a typo'd community key on a listing shows up as a console
   warning instead of silently failing to render/filter right.
   ========================================================================== */

(function () {
  "use strict";

  var communities = window.SELLAM_COMMUNITIES || [];

  function escapeAttr(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/"/g, "&quot;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  /* ------------------------------------------------------- search checklist */

  function checkboxHTML(c) {
    return (
      '<label class="filter-option">' +
        '<input type="checkbox" name="communities" value="' + escapeAttr(c.key) + '">' +
        '<span class="checkmark"></span>' +
        "<span>" + c.label + "</span>" +
      "</label>"
    );
  }

  var filterMenu = document.querySelector(".community-filter-menu");
  if (filterMenu && communities.length) {
    filterMenu.innerHTML = communities.map(checkboxHTML).join("");
  }

  /* -------------------------------------------------------------- carousel */

  function cardHTML(c) {
    var url = escapeAttr(c.url);
    return (
      '<article class="community-card">' +
        '<a class="image-frame" href="' + url + '">' +
          '<img src="' + escapeAttr(c.image) + '" alt="' + escapeAttr(c.imageAlt) + '" loading="lazy" decoding="async">' +
        "</a>" +
        "<h3><a href=\"" + url + "\">" + c.label + "</a></h3>" +
        "<p>" + c.description + "</p>" +
        '<a class="community-button" href="' + url + '">View Community</a>' +
      "</article>"
    );
  }

  // Admin Communities module: only "visible" communities, in the order the
  // dashboard sets — defensive defaults (isActive !== false, sortOrder or
  // array position) so this degrades to today's "show everything, DB
  // order" behaviour against the static data/communities.js fallback,
  // which doesn't have these fields.
  var carouselCommunities = communities
    .filter(function (c) { return c.isActive !== false; })
    .slice()
    .sort(function (a, b) {
      var aOrder = typeof a.sortOrder === "number" ? a.sortOrder : 0;
      var bOrder = typeof b.sortOrder === "number" ? b.sortOrder : 0;
      return aOrder - bOrder;
    });

  var track = document.querySelector(".community-track");
  if (track && carouselCommunities.length) {
    track.innerHTML = carouselCommunities.map(cardHTML).join("");
  }

  /* ------------------------------------------------- individual page hero */
  // Applies the admin-managed hero image (and keeps title/intro in sync
  // with label/description) on a community's own page — e.g.
  // communities/karen(.html). No-ops entirely if this page isn't a
  // community page (no .premium-hero-image present) or the matched
  // community has no hero_image set yet, leaving today's hand-authored
  // markup exactly as it is now.
  var heroSection = document.querySelector(".premium-hero-image");
  if (heroSection && communities.length) {
    var slug = window.location.pathname.split("/").pop().replace(/\.html$/, "");
    var current = communities.filter(function (c) { return c.key === slug; })[0];

    if (current) {
      if (current.heroImage) {
        heroSection.style.backgroundImage =
          "linear-gradient(rgba(4, 51, 65, 0.55), rgba(4, 51, 65, 0.55)), url('" + current.heroImage + "')";
      }
      // Dedicated data-attributes, not the .buy-hero-title/-description
      // classes themselves — those classes only carry position/typography,
      // and using them (or a shared class like .intro-copy) as the JS
      // selector too previously collided with premium-properties.css's
      // other same-named rules by source order, silently overriding the
      // gold/white hero colour with dark body-text colour.
      var titleEl = document.querySelector("[data-community-hero-title]");
      if (titleEl) titleEl.textContent = current.label;
      var introEl = document.querySelector("[data-community-hero-description]");
      if (introEl) introEl.textContent = current.description;

      // "About this community" — a longer section below the hero, separate
      // from the short intro above. Section stays hidden (as it is by
      // default in every template) unless the admin has actually set an
      // overview, so a community without one renders exactly as today.
      var overviewSection = document.querySelector("[data-community-overview]");
      var overviewCopy = document.querySelector("[data-community-overview-copy]");
      if (overviewSection && overviewCopy && current.overview) {
        overviewCopy.innerHTML = "";
        String(current.overview)
          .split(/\n{2,}/)
          .map(function (part) { return part.trim(); })
          .filter(Boolean)
          .forEach(function (part) {
            var p = document.createElement("p");
            // Reuses .intro-copy's existing typography (font/size/color) —
            // no new CSS needed for a single paragraph. Multi-paragraph
            // spacing is the one small addition, in premium-properties.css.
            p.className = "intro-copy";
            p.textContent = part;
            overviewCopy.appendChild(p);
          });
        overviewSection.hidden = false;
      }
    }
  }

  /* ----------------------------------------------- properties cross-check */

  if (window.SELLAM_PROPERTIES) {
    var knownKeys = communities.reduce(function (set, c) {
      set[c.key] = true;
      return set;
    }, {});

    window.SELLAM_PROPERTIES.forEach(function (p) {
      if (p.community && !knownKeys[p.community]) {
        console.warn(
          'SELLAM: property "' + (p.title || p.id) + '" references unknown community "' +
          p.community + '" — add it to data/communities.js or fix the typo.'
        );
      }
    });
  }

  /* --------------------------------------------------------- public lookup */

  window.SellamCommunities = {
    all: function () { return communities.slice(); },
    findByKey: function (key) {
      return communities.filter(function (c) { return c.key === key; })[0] || null;
    }
  };
})();
