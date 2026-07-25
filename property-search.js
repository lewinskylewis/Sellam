/* ============================================================================
   SELLAM — PROPERTY SEARCH / FILTER ENGINE
   ============================================================================
   Reads the central inventory (data/properties.js -> window.SELLAM_PROPERTIES)
   and exposes reusable filter + render helpers, then wires the homepage
   search bar to them.

   Reusable API (window.SellamSearch):
     .all()                        -> the full inventory
     .filter(criteria, list?)      -> filtered array
     .renderCards(list, container) -> paints result cards
     .formatKES(n)                 -> "KES 350,000,000"

   Criteria (all optional):
     types:       ["villa","mansion"]        propertyType must match one
     bedrooms:    ["3","6_plus"]             exact, or N+ for "N_plus"
     bathrooms:   ["2","4_plus"]             same rules
     communities: ["karen","runda"]          community must match one
     features:    ["pool","gym"]             must have ALL of them
     letting:     "rent" | "sale"            includes "both" automatically
     priceMin / priceMax : numbers (KES)
     priceField:  "sale" | "rent" | "any"    which price to test (default "any")
   ========================================================================== */

(function () {
  "use strict";

  var INVENTORY = window.SELLAM_PROPERTIES || [];
  var Units = window.SellamUnits;

  /* ---------------------------------------------------------------- helpers */

  function formatKES(n) {
    if (n === null || n === undefined || isNaN(n)) return "Price on application";
    return "KES " + Number(n).toLocaleString("en-KE");
  }

  // Matches values like "3" (exact) or "6_plus" (>= 6) against a number.
  // A property with more than one floor plan (see data/property-units.js)
  // passes a list of every distinct value across its units — matches if ANY
  // of them satisfies the filter.
  function matchesCount(values, selected) {
    if (!selected || !selected.length) return true;
    return values.some(function (value) {
      if (value === null || value === undefined) return false;
      return selected.some(function (raw) {
        if (String(raw).indexOf("_plus") !== -1) {
          return value >= parseInt(raw, 10);
        }
        return value === parseInt(raw, 10);
      });
    });
  }

  /* ----------------------------------------------------------------- filter */

  function filter(criteria, list) {
    criteria = criteria || {};
    var items = list || INVENTORY;

    var types = criteria.types || [];
    var communities = criteria.communities || [];
    var features = criteria.features || [];
    var priceField = criteria.priceField || "any";
    var min = criteria.priceMin === undefined ? null : criteria.priceMin;
    var max = criteria.priceMax === undefined ? null : criteria.priceMax;

    return items.filter(function (p) {
      // letting — "both" satisfies either "rent" or "sale"
      if (criteria.letting) {
        if (p.letting !== criteria.letting && p.letting !== "both") return false;
      }

      if (types.length && types.indexOf(p.propertyType) === -1) return false;
      if (communities.length && communities.indexOf(p.community) === -1) return false;

      if (!matchesCount(Units.bedroomCounts(p), criteria.bedrooms)) return false;
      if (!matchesCount(Units.bathroomCounts(p), criteria.bathrooms)) return false;

      // features: property must include every selected feature
      if (features.length) {
        var has = p.features || [];
        for (var i = 0; i < features.length; i++) {
          if (has.indexOf(features[i]) === -1) return false;
        }
      }

      // price — only applied when a bound was actually chosen
      if (min !== null || max !== null) {
        var okSale = Units.anyPriceInRange(p, "salePrice", min, max);
        var okRent = Units.anyPriceInRange(p, "rentPrice", min, max);
        if (priceField === "sale" && !okSale) return false;
        if (priceField === "rent" && !okRent) return false;
        if (priceField === "any" && !okSale && !okRent) return false;
      }

      return true;
    });
  }

  /* ----------------------------------------------------------------- render */

  function priceLine(p) {
    // Multi-unit properties (see data/property-units.js) show the cheapest
    // unit's price, prefixed "Starting" — the per-unit breakdown belongs to
    // the listing-page card and the detail page, this one just summarises.
    var isMulti = Units.unitsOf(p).length > 1;
    var prefix = isMulti ? "Starting " : "";
    var sale = Units.minPrice(p, "salePrice");
    var rent = Units.minPrice(p, "rentPrice");
    var parts = [];
    if (sale !== null) parts.push(prefix + formatKES(sale));
    if (rent !== null) parts.push(prefix + formatKES(rent) + " / month");
    return parts.length ? parts.join("  ·  ") : "Price on application";
  }

  function titleCase(s) {
    if (!s) return "";
    return s.replace(/-/g, " ").replace(/\b\w/g, function (c) { return c.toUpperCase(); });
  }

  // Commercial listings (office/retail/industrial/land) may have `bedrooms`
  // set to null in data/properties.js — omit it rather than showing "null
  // Bed". A multi-unit property (see data/property-units.js) lists every
  // bedroom count it comes in (e.g. "1, 2 & 3 Bed"). Bathrooms are a detail
  // -page-only field, not shown in listing summaries.
  function metaLine(p) {
    var parts = [];
    var counts = Units.bedroomCounts(p);
    if (counts.length) parts.push(Units.joinList(counts) + " Bed");
    parts.push(titleCase(p.propertyType));
    return parts.join(' · ');
  }

  function cardHTML(p) {
    return (
      '<article class="result-card">' +
        '<a class="result-image" href="' + p.url + '">' +
          '<img src="' + p.image + '" alt="' + p.title + '" loading="lazy">' +
        '</a>' +
        '<div class="result-body">' +
          '<h3 class="result-title"><a href="' + p.url + '">' + p.title + '</a></h3>' +
          '<p class="result-location">' + p.location + '</p>' +
          '<p class="result-price">' + priceLine(p) + '</p>' +
          '<p class="result-meta">' + metaLine(p) + '</p>' +
        '</div>' +
      '</article>'
    );
  }

  function renderCards(list, container) {
    if (!container) return;
    if (!list.length) {
      container.innerHTML =
        '<p class="result-empty">No properties match those filters. Try widening your search.</p>';
      return;
    }
    container.innerHTML = list.map(cardHTML).join("");
  }

  /* ------------------------------------------------- homepage search wiring */

  function checkedValues(form, name) {
    return Array.prototype.slice
      .call(form.querySelectorAll('input[name="' + name + '"]:checked'))
      .map(function (el) { return el.value; });
  }

  function numberOrNull(value) {
    if (!value) return null;
    var n = parseInt(value, 10);
    return isNaN(n) ? null : n;
  }

  function setupHomepageSearch() {
    var form = document.querySelector(".search-bar");
    var results = document.getElementById("searchResults");
    if (!form || !results) return;

    var grid = results.querySelector(".search-results-grid");
    var countEl = results.querySelector(".search-results-count");
    var clearBtn = results.querySelector(".search-results-clear");

    function runSearch() {
      var criteria = {
        types: checkedValues(form, "property_type"),
        bedrooms: checkedValues(form, "bedrooms"),
        communities: checkedValues(form, "communities"),
        priceMin: numberOrNull((form.querySelector("[data-price-min]") || {}).value),
        priceMax: numberOrNull((form.querySelector("[data-price-max]") || {}).value),
        priceField: "any"
      };

      var matches = filter(criteria);
      renderCards(matches, grid);
      countEl.textContent =
        matches.length + (matches.length === 1 ? " property found" : " properties found");

      results.hidden = false;
      results.scrollIntoView({ behavior: "smooth", block: "start" });
    }

    form.addEventListener("submit", function (event) {
      event.preventDefault();
      runSearch();
    });

    if (clearBtn) {
      clearBtn.addEventListener("click", function () {
        form.querySelectorAll('input[type="checkbox"]').forEach(function (cb) {
          cb.checked = false;
        });
        form.querySelectorAll("select").forEach(function (sel) { sel.value = ""; });
        results.hidden = true;
        grid.innerHTML = "";
        form.scrollIntoView({ behavior: "smooth", block: "center" });
      });
    }
  }

  /* -------------------------------------------------------------- public API */

  window.SellamSearch = {
    all: function () { return INVENTORY.slice(); },
    filter: filter,
    renderCards: renderCards,
    formatKES: formatKES
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", setupHomepageSearch);
  } else {
    setupHomepageSearch();
  }
})();
