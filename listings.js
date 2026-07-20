/* ============================================================================
   SELLAM — SHARED LISTING RENDERER
   ============================================================================
   Renders the property cards on every listing page from the central inventory
   (data/properties.js). One renderer, three pages — the mode is read from the
   container:

     <div data-property-rows data-listing="rent">       rent.html
     <div data-property-rows data-listing="sale">       premium-properties.html
     <div data-property-rows data-listing="exclusive">  exclusive-properties.html

   Modes:
     rent       -> letting "rent" | "both"      · data-price = rentPrice
     sale       -> letting "sale" | "both"      · data-price = salePrice
     exclusive  -> collection "exclusive"       · data-price = salePrice

   Runs SYNCHRONOUSLY (script sits below the markup) so cards exist in the DOM
   before enquiry-modal.js / premium-properties.js / rent-filter.js initialise
   on DOMContentLoaded. Generated data-* attributes match what those scripts
   expect, so sorting and filtering keep working untouched.
   ========================================================================== */

(function () {
  "use strict";

  var container = document.querySelector("[data-property-rows]");
  if (!container || !window.SELLAM_PROPERTIES) return;

  var mode = container.getAttribute("data-listing") || "sale";

  /* rent-filter.js matches its checkbox values (Title Case) against
     data-property-type, so convert the inventory's lowercase keys. */
  function titleCase(value) {
    if (!value) return "";
    return value.charAt(0).toUpperCase() + value.slice(1);
  }

  var FEATURE_LABELS = {
    wifi: "Wifi",
    pool: "Swimming pool",
    gym: "Gym",
    "backup-generator": "Backup generator",
    parking: "Parking space",
    security: "Security",
    garden: "Garden"
  };

  var PIN_SVG =
    '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.5a6.8 6.8 0 0 0-6.8 6.8c0 5.1 6.8 12.2 6.8 12.2s6.8-7.1 6.8-12.2A6.8 6.8 0 0 0 12 2.5Zm0 9.3a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5Z"/></svg>';
  var BED_SVG =
    '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12V7.5C4 6.1 5.1 5 6.5 5h11C18.9 5 20 6.1 20 7.5V12h1v7h-2v-2H5v2H3v-7h1Zm2 0h5V7H6.5c-.3 0-.5.2-.5.5V12Zm7 0h5V7.5c0-.3-.2-.5-.5-.5H13v5Z"/></svg>';
  var BATH_SVG =
    '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 11V6.5A3.5 3.5 0 0 1 10.5 3H13v2h-2.5A1.5 1.5 0 0 0 9 6.5V11h10v3a5 5 0 0 1-2 4l.7 2H15l-.4-1H9.4L9 20H6.3L7 18a5 5 0 0 1-2-4v-3h2Z"/></svg>';

  function escapeAttr(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/"/g, "&quot;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  function amenities(features) {
    if (!features || !features.length) return "";
    var items = features
      .map(function (key) {
        var label = FEATURE_LABELS[key];
        return label ? "<li>" + label + "</li>" : "";
      })
      .join("");
    return items ? '<ul class="amenities" aria-label="Amenities">' + items + "</ul>" : "";
  }

  /* ------------------------------------------------------------ select set */

  function selectProperties() {
    return window.SELLAM_PROPERTIES.filter(function (p) {
      if (p.status === "sold" || p.status === "let") return false;
      if (mode === "rent") return p.letting === "rent" || p.letting === "both";
      if (mode === "exclusive") return p.collection === "exclusive";
      // "sale" — the premium listing, excluding the exclusive collection
      return (p.letting === "sale" || p.letting === "both") && p.collection !== "exclusive";
    });
  }

  function priceFor(p) {
    return mode === "rent" ? p.rentPrice : p.salePrice;
  }

  /* ---------------------------------------------------------------- render */

  function cardHTML(p, index) {
    var title = escapeAttr(p.title);
    var location = escapeAttr(p.location);
    var url = escapeAttr(p.url);
    var price = priceFor(p);

    return (
      '<article class="property-card reveal"' +
        ' id="' + escapeAttr(p.slug) + '"' +
        " data-card" +
        ' data-property-id="' + escapeAttr(p.id) + '"' +
        ' data-property-url="' + url + '"' +
        ' data-listing-category="' + escapeAttr(mode) + '"' +
        ' data-order="' + (index + 1) + '"' +
        ' data-title="' + title + '"' +
        ' data-property-type="' + escapeAttr(titleCase(p.propertyType)) + '"' +
        ' data-location="' + location + '"' +
        ' data-price="' + escapeAttr(price == null ? "" : price) + '"' +
        ' data-bedrooms="' + escapeAttr(p.bedrooms) + '"' +
        ' data-bathrooms="' + escapeAttr(p.bathrooms) + '">' +
        '<a class="property-image" href="' + url + '">' +
          '<img src="' + escapeAttr(p.image) + '" alt="' + title + '" loading="lazy">' +
        "</a>" +
        '<div class="property-info">' +
          "<h2>" + p.title + "</h2>" +
          '<p class="location">' + PIN_SVG + p.location + "</p>" +
          '<p class="summary">' + (p.description || "") + "</p>" +
          '<ul class="specs">' +
            "<li>" + BED_SVG + p.bedrooms + " Bedrooms</li>" +
            "<li>" + BATH_SVG + p.bathrooms + " Baths</li>" +
          "</ul>" +
          amenities(p.features) +
          '<div class="card-actions">' +
            '<a href="' + url + '">View Property</a>' +
            '<a href="#enquire" data-enquiry-open data-property="' + title +
              '" data-property-id="' + escapeAttr(p.id) +
              '" data-property-url="' + url +
              '" data-listing-category="' + escapeAttr(mode) +
              '" data-location="' + location + '">Enquire</a>' +
          "</div>" +
        "</div>" +
      "</article>"
    );
  }

  var items = selectProperties();

  // Build rows of two cards, matching the pages' existing .listing-row layout.
  var html = "";
  items.forEach(function (p, i) {
    if (i % 2 === 0) html += (i === 0 ? "" : "</div>") + '<div class="listing-row">';
    html += cardHTML(p, i);
  });
  if (items.length) html += "</div>";

  // Preserve the empty-state element (rent-filter.js relies on it) then paint.
  var emptyState = container.querySelector("[data-rent-empty]");
  container.innerHTML = "";
  if (emptyState) container.appendChild(emptyState);
  container.insertAdjacentHTML("beforeend", html);

  // Keep any "N Units available" heading in sync with the real count.
  var countEl = document.querySelector("[data-listing-count]");
  if (countEl) {
    countEl.textContent =
      items.length + (items.length === 1 ? " Unit available" : " Units available");
  }
})();
