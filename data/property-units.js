/* ============================================================================
   SELLAM — UNIT HELPERS
   ============================================================================
   A development that sells more than one floor plan (e.g. a building with
   both 1-bed and 2-bed units) lists its variants in a `units` array instead
   of flat bedrooms/bathrooms/salePrice/rentPrice fields:

     units: [
       { bedrooms: 1, bathrooms: 3, salePrice: 5000000, rentPrice: null },
       { bedrooms: 2, bathrooms: 3, salePrice: 12000000, rentPrice: null }
     ]

   Every other field (title, location, image, gallery, features, ...) stays
   on the property itself and is shared by all of its units — one record per
   physical property, not one row per floor plan.

   A single-unit property (the common case) keeps its flat fields exactly as
   before and needs no `units` array. Anything that reads bedrooms,
   bathrooms, or price should go through these helpers rather than the raw
   fields, so both shapes work without special-casing: `unitsOf()` wraps a
   flat property's own fields into a one-item list.
   ========================================================================== */

(function () {
  "use strict";

  function unitsOf(p) {
    if (Array.isArray(p.units) && p.units.length) return p.units;
    return [{
      bedrooms: p.bedrooms,
      bathrooms: p.bathrooms,
      salePrice: p.salePrice,
      rentPrice: p.rentPrice
    }];
  }

  function distinctSorted(values) {
    var seen = [];
    values.forEach(function (v) {
      if (v !== null && v !== undefined && seen.indexOf(v) === -1) seen.push(v);
    });
    seen.sort(function (a, b) { return a - b; });
    return seen;
  }

  function bedroomCounts(p) {
    return distinctSorted(unitsOf(p).map(function (u) { return u.bedrooms; }));
  }

  function bathroomCounts(p) {
    return distinctSorted(unitsOf(p).map(function (u) { return u.bathrooms; }));
  }

  // Natural-language list: [1] -> "1", [1,2] -> "1 & 2", [1,2,3] -> "1, 2 & 3".
  function joinList(values) {
    if (!values.length) return "";
    if (values.length === 1) return String(values[0]);
    if (values.length === 2) return values[0] + " & " + values[1];
    return values.slice(0, -1).join(", ") + " & " + values[values.length - 1];
  }

  // All non-null values for a price field ("salePrice" | "rentPrice") across
  // every unit of the property.
  function prices(p, field) {
    return unitsOf(p)
      .map(function (u) { return u[field]; })
      .filter(function (v) { return v !== null && v !== undefined; });
  }

  function minPrice(p, field) {
    var list = prices(p, field);
    return list.length ? Math.min.apply(null, list) : null;
  }

  function maxPrice(p, field) {
    var list = prices(p, field);
    return list.length ? Math.max.apply(null, list) : null;
  }

  // Does any unit's price for `field` fall within [min, max] (either bound
  // optional)? A single-unit property just tests its one price.
  function anyPriceInRange(p, field, min, max) {
    return prices(p, field).some(function (price) {
      if (min !== null && min !== undefined && price < min) return false;
      if (max !== null && max !== undefined && price > max) return false;
      return true;
    });
  }

  window.SellamUnits = {
    unitsOf: unitsOf,
    bedroomCounts: bedroomCounts,
    bathroomCounts: bathroomCounts,
    joinList: joinList,
    prices: prices,
    minPrice: minPrice,
    maxPrice: maxPrice,
    anyPriceInRange: anyPriceInRange
  };
})();
