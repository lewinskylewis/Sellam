/* ============================================================================
   SELLAM — SHARED LISTING RENDERER
   ============================================================================
   Renders the property cards on every listing page from the central inventory
   (data/properties.js). One renderer, every listing page — the mode (and, for
   leasing pages, the property type) is read from the container. A page may
   have MORE THAN ONE container — e.g. a community page with a "For Sale"
   section, a "For Rent" section, and a "Leasing" section stacked below one
   another — each is processed independently:

     <div data-property-rows data-listing="rent">       rent.html
     <div data-property-rows data-listing="sale">       premium-properties.html
     <div data-property-rows data-listing="exclusive">  exclusive-properties.html
     <div data-property-rows data-listing="leasing"
          data-leasing-type="office">                   leasing-offices.html
     <div data-property-rows data-listing="leasing"
          data-leasing-type="retail">                   leasing-retail.html
     <div data-property-rows data-listing="leasing"
          data-leasing-type="industrial">                leasing-industrial.html
     <div data-property-rows data-listing="leasing"
          data-leasing-type="land">                     leasing-land.html
     <div data-property-rows data-listing="buy-category"
          data-buy-category="commercial"
          data-buy-types="office,retail,industrial,commercial">  buy-commercial.html
     <div data-property-rows data-listing="buy-category"
          data-buy-category="land"
          data-buy-types="land">                        buy-land.html
     <div data-property-rows data-listing="buy-category"
          data-buy-category="residential"
          data-buy-types="apartment,townhouse,villa,mansion,bungalow,penthouse">
                                                          buy-residential.html
     <div data-property-rows data-listing="sale"
          data-community="runda">                        communities/runda.html
                                                          (For Sale section)
     <div data-property-rows data-listing="rent"
          data-community="runda"
          data-exclude-types="office,retail,industrial,land">
                                                          communities/runda.html
                                                          (For Rent section)
     <div data-property-rows data-listing="leasing"
          data-leasing-type="office,retail,industrial,land"
          data-community="runda">                        communities/runda.html
                                                          (Leasing section)

   Modes:
     rent          -> letting "rent" | "both"                       · rentPrice
     sale          -> letting "sale" | "both", not "exclusive"       · salePrice
     exclusive     -> collection "exclusive"                        · salePrice
     leasing       -> propertyType is one of data-leasing-type (comma-
                       separated — a single value works too),
                       letting "rent" | "both"                       · rentPrice
     buy-category  -> propertyType is one of data-buy-types (comma-
                       separated), letting "sale" | "both", not
                       "exclusive"                                    · salePrice

   Two attributes work on top of ANY mode above:
     data-community="<key>"        Only properties whose `community` field
                                    (data/properties.js) matches this key.
     data-exclude-types="a,b,c"    Drop any property whose propertyType is in
                                    this comma-separated list (used to keep a
                                    community's "For Rent" section residential-
                                    only, since commercial-for-rent already has
                                    its own "Leasing" section on the same page).

   A container with data-hide-empty-section that ends up with zero matching
   properties hides its closest ancestor carrying data-listing-section (so an
   empty "For Rent in Karen" section disappears instead of showing a bare
   heading over nothing). After every container on the page has been
   processed, if an element with data-community-empty exists and every
   data-listing-section on the page ended up hidden, that fallback element is
   revealed — the "no active listings in this community yet" message.

   Runs SYNCHRONOUSLY (script sits below the markup) so cards exist in the DOM
   before enquiry-modal.js / premium-properties.js / rent-filter.js initialise
   on DOMContentLoaded. Generated data-* attributes match what those scripts
   expect, so filtering keeps working untouched.

   Commercial properties (office/retail/industrial/land) may have `bedrooms`
   and `bathrooms` set to `null` in data/properties.js — the card simply omits
   that spec row rather than showing "null Bedrooms".

   A property that lists more than one floor plan (data/properties.js gives
   it a `units` array instead of flat bedrooms/bathrooms/price fields, see
   data/property-units.js) renders one price line per unit instead of the
   usual bed/bath spec row + single price.
   ========================================================================== */

(function () {
  "use strict";

  var containers = document.querySelectorAll("[data-property-rows]");
  if (!containers.length || !window.SELLAM_PROPERTIES) return;

  var Units = window.SellamUnits;

  /* rent-filter.js matches its checkbox values (Title Case) against
     data-property-type, so convert the inventory's lowercase keys. */
  function titleCase(value) {
    if (!value) return "";
    return value.charAt(0).toUpperCase() + value.slice(1);
  }

  function splitList(value) {
    return (value || "")
      .split(",")
      .map(function (t) { return t.trim(); })
      .filter(Boolean);
  }

  var PIN_SVG =
    '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.5a6.8 6.8 0 0 0-6.8 6.8c0 5.1 6.8 12.2 6.8 12.2s6.8-7.1 6.8-12.2A6.8 6.8 0 0 0 12 2.5Zm0 9.3a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5Z"/></svg>';
  var GRID_SVG =
    '<svg viewBox="0 0 24 24" aria-hidden="true">' +
      '<rect x="3" y="3" width="8" height="8" rx="1.5"/>' +
      '<rect x="13" y="3" width="8" height="5" rx="1.5"/>' +
      '<rect x="13" y="10" width="8" height="11" rx="1.5"/>' +
      '<rect x="3" y="13" width="8" height="8" rx="1.5"/>' +
    '</svg>';
  var TAG_SVG =
    '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill-rule="evenodd" clip-rule="evenodd" d="M4.8 3h7.05c.53 0 1.04.21 1.41.59l7.15 7.15a2 2 0 0 1 0 2.83l-6.84 6.84a2 2 0 0 1-2.83 0l-7.15-7.15A2 2 0 0 1 3 11.85V4.8C3 3.81 3.81 3 4.8 3Zm3.25 6.15a2.1 2.1 0 1 0 0-4.2 2.1 2.1 0 0 0 0 4.2Z"/></svg>';

  function escapeAttr(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/"/g, "&quot;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  // Listing cards show which bedroom counts this property comes in, never
  // bathrooms (bathrooms are a detail-page-only field — see property.html /
  // property-detail.js). A property with more than one floor plan (`units`,
  // see data/property-units.js) lists every distinct count it offers.
  function bedroomsHTML(p) {
    var labels = Units.unitLabels(p);
    if (!labels.length) return "";
    return '<div class="beds-line">' + GRID_SVG + Units.joinList(labels) + "</div>";
  }

  function formatPrice(value) {
    return "KES " + Number(value).toLocaleString("en-KE");
  }

  function priceField(mode) {
    return (mode === "rent" || mode === "leasing") ? "rentPrice" : "salePrice";
  }

  function priceSuffix(mode) {
    return (mode === "rent" || mode === "leasing") ? " / month" : "";
  }

  // Always the CHEAPEST unit's price. A property with more than one floor
  // plan gets a "Starting" prefix; a single-unit property just shows its
  // one price, unprefixed.
  function priceHTML(p, mode) {
    var field = priceField(mode);
    var value = Units.minPrice(p, field);
    if (value === null) return "";
    var prefix = Units.unitsOf(p).length > 1 ? "Starting " : "";
    return '<div class="price">' + TAG_SVG + prefix + formatPrice(value) + priceSuffix(mode) + "</div>";
  }

  /* ------------------------------------------------------------ select set */

  function selectProperties(config) {
    return window.SELLAM_PROPERTIES.filter(function (p) {
      if (p.status === "sold" || p.status === "let") return false;
      if (config.community && p.community !== config.community) return false;
      if (config.excludeTypes.length && config.excludeTypes.indexOf(p.propertyType) !== -1) return false;

      if (config.mode === "rent") return p.letting === "rent" || p.letting === "both";
      if (config.mode === "exclusive") return p.collection === "exclusive";
      if (config.mode === "leasing") {
        return config.leasingTypes.indexOf(p.propertyType) !== -1 &&
          (p.letting === "rent" || p.letting === "both");
      }
      if (config.mode === "buy-category") {
        return config.buyTypes.indexOf(p.propertyType) !== -1 &&
          (p.letting === "sale" || p.letting === "both") && p.collection !== "exclusive";
      }
      // "sale" — the premium listing, excluding the exclusive collection
      return (p.letting === "sale" || p.letting === "both") && p.collection !== "exclusive";
    });
  }

  /* ---------------------------------------------------------------- render */

  function cardHTML(p, index, config) {
    var title = escapeAttr(p.title);
    var location = escapeAttr(p.location);
    var url = escapeAttr(p.url);
    var field = priceField(config.mode);
    var listingCategory = config.buyCategory || config.mode;

    // Filter matching (rent-filter.js) needs to know about every unit, so
    // bedrooms/bathrooms/price are comma-separated lists — for a normal
    // single-unit property that's just a list of one, identical to before.
    var bedroomsAttr = Units.bedroomCounts(p).join(",");
    var bathroomsAttr = Units.bathroomCounts(p).join(",");
    var pricesAttr = Units.prices(p, field).join(",");

    return (
      '<article class="property-card"' +
        ' id="' + escapeAttr(p.slug) + '"' +
        " data-card" +
        ' data-property-id="' + escapeAttr(p.id) + '"' +
        ' data-property-url="' + url + '"' +
        ' data-listing-category="' + escapeAttr(listingCategory) + '"' +
        ' data-order="' + (index + 1) + '"' +
        ' data-title="' + title + '"' +
        ' data-property-type="' + escapeAttr(titleCase(p.propertyType)) + '"' +
        ' data-location="' + location + '"' +
        ' data-price="' + escapeAttr(pricesAttr) + '"' +
        ' data-bedrooms="' + escapeAttr(bedroomsAttr) + '"' +
        ' data-bathrooms="' + escapeAttr(bathroomsAttr) + '">' +
        '<a class="property-image" href="' + url + '">' +
          '<img src="' + escapeAttr(p.image) + '" alt="' + title + '" loading="lazy" decoding="async">' +
        "</a>" +
        '<div class="property-info">' +
          "<h2>" + p.title + "</h2>" +
          '<p class="location">' + PIN_SVG + p.location + "</p>" +
          '<p class="summary">' + (p.summary || p.description || "") + "</p>" +
          bedroomsHTML(p) +
          priceHTML(p, config.mode) +
          '<div class="card-actions">' +
            '<a href="' + url + '">View Property</a>' +
            '<a href="#enquire" data-enquiry-open data-property="' + title +
              '" data-property-id="' + escapeAttr(p.id) +
              '" data-property-url="' + url +
              '" data-listing-category="' + escapeAttr(listingCategory) +
              '" data-location="' + location + '">Enquire</a>' +
          "</div>" +
        "</div>" +
      "</article>"
    );
  }

  function renderContainer(container) {
    var config = {
      mode: container.getAttribute("data-listing") || "sale",
      leasingTypes: splitList(container.getAttribute("data-leasing-type")),
      buyCategory: container.getAttribute("data-buy-category") || "",
      buyTypes: splitList(container.getAttribute("data-buy-types")),
      community: container.getAttribute("data-community") || "",
      excludeTypes: splitList(container.getAttribute("data-exclude-types"))
    };

    var items = selectProperties(config);

    // TEMPORARY DIAGNOSTIC — mobile rendering investigation. Featured
    // Properties (data-listing="sale" with no data-community, i.e.
    // featured-properties.html specifically) is capped at 6 cards to test
    // whether image/card volume affects the reported failure rate. Not a
    // fix — remove before merging.
    if (config.mode === "sale" && !config.community) {
      items = items.slice(0, 6);
    }

    // Build rows of two cards, matching the pages' existing .listing-row layout.
    var html = "";
    items.forEach(function (p, i) {
      if (i % 2 === 0) html += (i === 0 ? "" : "</div>") + '<div class="listing-row">';
      html += cardHTML(p, i, config);
    });
    if (items.length) html += "</div>";

    // Preserve the empty-state element (rent-filter.js relies on it) then paint.
    var emptyState = container.querySelector("[data-rent-empty]");
    container.innerHTML = "";
    if (emptyState) container.appendChild(emptyState);
    container.insertAdjacentHTML("beforeend", html);

    if (!items.length && container.hasAttribute("data-hide-empty-section")) {
      var section = container.closest("[data-listing-section]");
      if (section) section.hidden = true;
    }
  }

  containers.forEach(renderContainer);

  var emptyFallback = document.querySelector("[data-community-empty]");
  if (emptyFallback) {
    var anyVisible = Array.prototype.some.call(
      document.querySelectorAll("[data-listing-section]"),
      function (section) { return !section.hidden; }
    );
    if (!anyVisible) emptyFallback.hidden = false;
  }
})();
