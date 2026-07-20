(function () {
  if (window.__sellamSiteMotionInitialized) return;
  window.__sellamSiteMotionInitialized = true;

  var root = document.documentElement;
  var pageName = window.location.pathname.split("/").pop().toLowerCase() || "index.html";

  // The homepage remains the reference implementation and keeps its own engine.
  if (pageName === "index.html") return;

  var reducedMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)");
  if ((reducedMotion && reducedMotion.matches) || !("IntersectionObserver" in window)) return;

  root.classList.add("motion-ready", "site-motion-all");

  var observer;
  var observed = new WeakSet();
  var itemSelector = [
    ".image-card",
    ".community-card",
    ".diaspora-card",
    ".feature-tile",
    ".service-card",
    ".category-card"
  ].join(", ");

  function reveal(element) {
    element.classList.add("is-visible");
    var items = element.querySelectorAll(itemSelector);
    for (var i = 0; i < items.length; i += 1) {
      items[i].classList.add("motion-item-visible");
    }
  }

  function isExcluded(element) {
    return Boolean(
      element.closest(".site-header, .mobile-menu, .enquiry-modal, [role='dialog']")
    );
  }

  function register(element) {
    if (!element || !element.classList || isExcluded(element) || observed.has(element)) return;
    observed.add(element);

    if (element.classList.contains("is-visible")) {
      reveal(element);
      return;
    }

    observer.observe(element);
  }

  function addAutomaticTargets() {
    var candidates = document.querySelectorAll(
      "main > section > .page-shell, main > .page-shell, .site-footer > .footer-grid"
    );

    for (var i = 0; i < candidates.length; i += 1) {
      var candidate = candidates[i];
      if (candidate.classList.contains("reveal") || candidate.querySelector(".reveal")) continue;
      candidate.classList.add("reveal", "site-motion-auto");
    }
  }

  function registerCurrentTargets() {
    addAutomaticTargets();
    var targets = document.querySelectorAll(".reveal");
    for (var i = 0; i < targets.length; i += 1) register(targets[i]);
  }

  function start() {
    try {
      observer = new IntersectionObserver(
        function (entries) {
          for (var i = 0; i < entries.length; i += 1) {
            if (!entries[i].isIntersecting) continue;
            reveal(entries[i].target);
            observer.unobserve(entries[i].target);
          }
        },
        { rootMargin: "0px 0px -10% 0px", threshold: 0.12 }
      );

      registerCurrentTargets();

      // Pick up listing cards or other content injected after the initial render.
      if ("MutationObserver" in window && document.body) {
        var mutationObserver = new MutationObserver(function (mutations) {
          for (var i = 0; i < mutations.length; i += 1) {
            for (var j = 0; j < mutations[i].addedNodes.length; j += 1) {
              var node = mutations[i].addedNodes[j];
              if (!node || node.nodeType !== 1) continue;
              if (node.matches && node.matches(".reveal")) register(node);
              if (!node.querySelectorAll) continue;
              var reveals = node.querySelectorAll(".reveal");
              for (var k = 0; k < reveals.length; k += 1) register(reveals[k]);
            }
          }
        });
        mutationObserver.observe(document.body, { childList: true, subtree: true });
      }

      window.addEventListener("load", function () {
        var viewportHeight = window.innerHeight || root.clientHeight;
        var targets = document.querySelectorAll(".reveal:not(.is-visible)");
        for (var i = 0; i < targets.length; i += 1) {
          var bounds = targets[i].getBoundingClientRect();
          if (bounds.top < viewportHeight && bounds.bottom > 0) {
            reveal(targets[i]);
            observer.unobserve(targets[i]);
          }
        }
      });
    } catch (error) {
      root.classList.remove("motion-ready", "site-motion-all");
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start);
  } else {
    start();
  }
})();
