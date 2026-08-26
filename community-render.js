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

  var track = document.querySelector(".community-track");
  if (track && communities.length) {
    track.innerHTML = communities.map(cardHTML).join("");
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
