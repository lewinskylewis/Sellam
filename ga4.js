/* ============================================================================
   SELLAM — GOOGLE ANALYTICS 4 (GA4)
   ============================================================================
   Loads the Google tag (gtag.js) only after the visitor has granted the
   "Analytics" cookie category, using the extension point cookie-consent.js
   documents for exactly this purpose:

     window.SellamConsent.onConsent("analytics", fn)

   fn() runs once, either immediately (if analytics consent was already
   granted on a prior visit) or the moment the visitor grants it from the
   cookie banner/preferences panel. Nothing analytics-related loads before
   that fires.

   Include on every public page as the very next script tag after
   cookie-consent.js:

     <script src="cookie-consent.js"></script>
     <script src="ga4.js"></script>

   This is a static multi-page site (full page loads, no client-side
   router), so gtag.js's automatic page_view-on-load is correct as-is and
   fires exactly once per real navigation — no manual page_view calls here.
   ========================================================================== */

(function () {
  "use strict";

  if (window.__sellamGA4Initialized) return;
  window.__sellamGA4Initialized = true;

  var MEASUREMENT_ID = "G-RLCECXR58L";

  function loadGA4() {
    if (window.__sellamGA4Loaded) return;
    window.__sellamGA4Loaded = true;

    var script = document.createElement("script");
    script.async = true;
    script.src = "https://www.googletagmanager.com/gtag/js?id=" + MEASUREMENT_ID;
    document.head.appendChild(script);

    window.dataLayer = window.dataLayer || [];
    window.gtag = function gtag() {
      window.dataLayer.push(arguments);
    };
    window.gtag("js", new Date());
    window.gtag("config", MEASUREMENT_ID);
  }

  if (window.SellamConsent && typeof window.SellamConsent.onConsent === "function") {
    window.SellamConsent.onConsent("analytics", loadGA4);
  }
})();
