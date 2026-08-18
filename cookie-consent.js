/* ============================================================================
   SELLAM — COOKIE CONSENT MANAGER
   ============================================================================
   Self-contained: injects its own stylesheet (cookie-consent.css) and its own
   "Cookie Settings" link in the footer, so every page only needs the one
   <script src="cookie-consent.js"> tag added — no other markup or per-page
   footer edits required.

   Public API (for future analytics/marketing/social integrations):

     window.SellamConsent.hasConsent("analytics")        -> true/false, now
     window.SellamConsent.onConsent("analytics", fn)      -> fn() once granted
                                                              (immediately if
                                                              already granted)
     window.SellamConsent.getConsent()                    -> stored consent
                                                              object, or null
     window.SellamConsent.openPreferences()                -> opens the panel

   A future integration should gate its own loading on this, e.g.:

     window.SellamConsent.onConsent("analytics", function () {
       // load analytics here — never before this fires
     });

   This file does not load any analytics/marketing/social technology itself.
   It only provides the categories and the consent state for future code to
   check. See CATEGORIES below for the fixed set of categories the site's
   Cookie Policy (cookies) describes.
   ========================================================================== */

(function () {
  "use strict";

  if (window.__sellamCookieConsentInitialized) return;
  window.__sellamCookieConsentInitialized = true;

  var STORAGE_KEY = "SELLAM_COOKIE_CONSENT";
  // Bump this if the category set or its meaning changes materially — a
  // mismatched version is treated as "no decision yet" so visitors are asked
  // again instead of an old consent silently covering new processing.
  var CONSENT_VERSION = "1.0";

  var CATEGORIES = [
    {
      id: "essential",
      label: "Essential",
      locked: true,
      state: "Always Active",
      description: "Required for the website to function correctly, maintain security, process necessary functionality, and provide core services."
    },
    {
      id: "preferences",
      label: "Preferences / Functionality",
      locked: false,
      description: "Remember preferences and improve functionality."
    },
    {
      id: "analytics",
      label: "Analytics",
      locked: false,
      description: "Help us understand how visitors use Sellam."
    },
    {
      id: "marketing",
      label: "Marketing / Advertising",
      locked: false,
      description: "Support advertising, campaign measurement and related technologies."
    },
    {
      id: "social",
      label: "Social / Third-Party",
      locked: false,
      description: "Support optional third-party integrations and services."
    }
  ];

  var OPTIONAL_CATEGORIES = CATEGORIES.filter(function (cat) { return !cat.locked; });

  /* --------------------------------------------------------------- storage */

  function defaultConsent(allOptional) {
    var consent = { version: CONSENT_VERSION, timestamp: null, essential: true };
    OPTIONAL_CATEGORIES.forEach(function (cat) {
      consent[cat.id] = Boolean(allOptional);
    });
    return consent;
  }

  function readStoredConsent() {
    try {
      var raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      var parsed = JSON.parse(raw);
      if (!parsed || parsed.version !== CONSENT_VERSION) return null;
      return parsed;
    } catch (error) {
      return null;
    }
  }

  function persist(consent) {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(consent));
    } catch (error) {
      // localStorage unavailable (private browsing, disabled storage, etc.)
      // — the choice still applies for the rest of this page view via
      // `current` below, it just won't be remembered on the next visit.
    }
  }

  var current = readStoredConsent();

  /* ---------------------------------------------------------- consent API */

  var pendingCallbacks = {};

  function hasConsent(categoryId) {
    if (categoryId === "essential") return true;
    return Boolean(current && current[categoryId]);
  }

  function notifyPending() {
    Object.keys(pendingCallbacks).forEach(function (categoryId) {
      if (!hasConsent(categoryId)) return;
      var callbacks = pendingCallbacks[categoryId];
      pendingCallbacks[categoryId] = [];
      callbacks.forEach(function (callback) {
        try { callback(); } catch (error) { /* one bad integration shouldn't break another */ }
      });
    });
  }

  function onConsent(categoryId, callback) {
    if (typeof callback !== "function") return;
    if (hasConsent(categoryId)) {
      callback();
      return;
    }
    pendingCallbacks[categoryId] = pendingCallbacks[categoryId] || [];
    pendingCallbacks[categoryId].push(callback);
  }

  function saveConsent(selections) {
    var consent = defaultConsent(false);
    consent.timestamp = new Date().toISOString();
    OPTIONAL_CATEGORIES.forEach(function (cat) {
      consent[cat.id] = Boolean(selections[cat.id]);
    });
    current = consent;
    persist(consent);
    notifyPending();
    return consent;
  }

  /* -------------------------------------------------------------- markup */

  function ensureStylesheet() {
    if (document.querySelector("link[data-cookie-consent-styles]")) return;
    var link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "cookie-consent.css";
    link.setAttribute("data-cookie-consent-styles", "");
    document.head.appendChild(link);
  }

  var banner, modal, dialog, categoryList;
  var lastFocusedBeforeModal = null;

  function buildBanner() {
    banner = document.createElement("div");
    banner.className = "cookie-banner";
    banner.setAttribute("role", "region");
    banner.setAttribute("aria-label", "Cookie consent");
    banner.innerHTML =
      '<div class="cookie-banner-inner">' +
        '<div class="cookie-banner-copy">' +
          "<h2>Cookies &amp; Privacy</h2>" +
          "<p>We use essential cookies and similar technologies to keep Sellam working properly. " +
          "With your permission, we may also use optional cookies to understand website usage, " +
          'remember preferences, and support future services. <a href="cookies">Read our Cookie Policy.</a></p>' +
        "</div>" +
        '<div class="cookie-banner-actions">' +
          '<button type="button" class="cookie-btn cookie-btn-outline" data-cookie-reject>Reject Non-Essential</button>' +
          '<button type="button" class="cookie-btn cookie-btn-outline" data-cookie-manage>Manage Preferences</button>' +
          '<button type="button" class="cookie-btn cookie-btn-solid" data-cookie-accept>Accept All</button>' +
        "</div>" +
      "</div>";

    banner.querySelector("[data-cookie-accept]").addEventListener("click", function () {
      saveConsent(defaultConsent(true));
      hideBanner();
    });
    banner.querySelector("[data-cookie-reject]").addEventListener("click", function () {
      saveConsent(defaultConsent(false));
      hideBanner();
    });
    banner.querySelector("[data-cookie-manage]").addEventListener("click", function () {
      openPreferences();
    });

    document.body.appendChild(banner);
  }

  function categoryRowMarkup(cat, selected) {
    if (cat.locked) {
      return (
        '<div class="cookie-category">' +
          '<div class="cookie-category-head">' +
            '<span class="cookie-category-name">' + cat.label + "</span>" +
            '<span class="cookie-category-state">' + cat.state + "</span>" +
          "</div>" +
          '<p class="cookie-category-desc">' + cat.description + "</p>" +
        "</div>"
      );
    }

    return (
      '<div class="cookie-category">' +
        '<div class="cookie-category-head">' +
          '<span class="cookie-category-name">' + cat.label + "</span>" +
          '<label class="cookie-toggle">' +
            '<input type="checkbox" data-cookie-toggle="' + cat.id + '"' + (selected ? " checked" : "") + ">" +
            '<span class="cookie-toggle-track"><span class="cookie-toggle-thumb"></span></span>' +
            '<span class="visually-hidden">Toggle ' + cat.label + " cookies</span>" +
          "</label>" +
        "</div>" +
        '<p class="cookie-category-desc">' + cat.description + "</p>" +
      "</div>"
    );
  }

  function buildModal() {
    modal = document.createElement("div");
    modal.className = "cookie-modal";
    modal.setAttribute("aria-hidden", "true");
    modal.innerHTML =
      '<div class="cookie-modal-dialog" role="dialog" aria-modal="true" aria-labelledby="cookieModalTitle" tabindex="-1">' +
        '<button type="button" class="cookie-modal-close" data-cookie-close aria-label="Close preferences">&times;</button>' +
        '<h2 id="cookieModalTitle">Cookie Preferences</h2>' +
        '<p class="cookie-modal-intro">Choose which optional cookies Sellam can use. Essential cookies are ' +
        'always on because the site needs them to work. <a href="cookies">Read our Cookie Policy.</a></p>' +
        '<div class="cookie-category-list" data-cookie-category-list></div>' +
        '<div class="cookie-modal-actions">' +
          '<button type="button" class="cookie-btn cookie-btn-outline" data-cookie-cancel>Close</button>' +
          '<button type="button" class="cookie-btn cookie-btn-solid" data-cookie-save>Save Preferences</button>' +
        "</div>" +
      "</div>";

    dialog = modal.querySelector(".cookie-modal-dialog");
    categoryList = modal.querySelector("[data-cookie-category-list]");

    modal.querySelector("[data-cookie-close]").addEventListener("click", closePreferences);
    modal.querySelector("[data-cookie-cancel]").addEventListener("click", closePreferences);
    modal.querySelector("[data-cookie-save]").addEventListener("click", function () {
      var selections = {};
      OPTIONAL_CATEGORIES.forEach(function (cat) {
        var input = categoryList.querySelector('[data-cookie-toggle="' + cat.id + '"]');
        selections[cat.id] = Boolean(input && input.checked);
      });
      saveConsent(selections);
      closePreferences();
      hideBanner();
    });

    modal.addEventListener("click", function (event) {
      if (event.target === modal) closePreferences();
    });

    modal.addEventListener("keydown", function (event) {
      if (event.key === "Escape") {
        closePreferences();
        return;
      }
      if (event.key !== "Tab") return;

      var focusable = dialog.querySelectorAll('button, a[href], input, [tabindex]:not([tabindex="-1"])');
      if (!focusable.length) return;
      var first = focusable[0];
      var last = focusable[focusable.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    });

    document.body.appendChild(modal);
  }

  function renderCategoryList() {
    var selections = current || defaultConsent(false);
    categoryList.innerHTML = CATEGORIES.map(function (cat) {
      return categoryRowMarkup(cat, Boolean(selections[cat.id]));
    }).join("");
  }

  function hideBanner() {
    if (banner) banner.classList.remove("is-visible");
  }

  function showBanner() {
    if (banner) banner.classList.add("is-visible");
  }

  function openPreferences() {
    if (!modal) buildModal();
    renderCategoryList();
    lastFocusedBeforeModal = document.activeElement;
    modal.classList.add("is-open");
    modal.setAttribute("aria-hidden", "false");
    document.body.classList.add("cookie-modal-open");
    dialog.focus();
  }

  function closePreferences() {
    if (!modal) return;
    modal.classList.remove("is-open");
    modal.setAttribute("aria-hidden", "true");
    document.body.classList.remove("cookie-modal-open");
    if (lastFocusedBeforeModal && typeof lastFocusedBeforeModal.focus === "function") {
      lastFocusedBeforeModal.focus();
    }
  }

  function injectFooterSettingsLink() {
    var cookiesLink = document.querySelector('.site-footer a[href="cookies"]');
    if (!cookiesLink) return;

    var item = cookiesLink.closest("li");
    if (!item || !item.parentElement) return;
    if (item.parentElement.querySelector("[data-cookie-settings-link]")) return;

    var newItem = document.createElement("li");
    var link = document.createElement("a");
    link.href = "#";
    link.textContent = "Cookie Settings";
    link.setAttribute("data-cookie-settings-link", "");
    link.addEventListener("click", function (event) {
      event.preventDefault();
      openPreferences();
    });
    newItem.appendChild(link);
    item.insertAdjacentElement("afterend", newItem);
  }

  /* ---------------------------------------------------------------- init */

  function init() {
    ensureStylesheet();
    injectFooterSettingsLink();
    buildBanner();
    if (!current) showBanner();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  window.SellamConsent = {
    CATEGORIES: CATEGORIES.slice(),
    getConsent: function () { return current ? Object.assign({}, current) : null; },
    hasConsent: hasConsent,
    onConsent: onConsent,
    openPreferences: openPreferences
  };
})();
