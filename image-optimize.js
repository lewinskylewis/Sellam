/* ============================================================================
   SELLAM — IMAGE OPTIMIZATION HELPER
   ============================================================================
   Routes an image URL (same-origin repo asset, or Supabase Storage public
   URL) through Vercel's built-in Image Optimization endpoint
   (/_vercel/image), which resizes and re-encodes to WebP/AVIF where the
   browser supports it — on request, at Vercel's CDN edge, without touching
   or duplicating the original file. Requires the "images" config added to
   vercel.json (remote pattern for the Supabase Storage host); same-origin
   assets need no allow-listing.

   /_vercel/image only exists on an actual Vercel deployment. Locally (this
   project's static-server.ps1 test server) or on any other host, the
   request would 404 — so this always keeps the original `src` as the <img>
   src / background-image, and only asks the optimizer for it up front via
   a plain onerror fallback swap, never leaving an image broken.
   ========================================================================== */

(function () {
  "use strict";

  function isAbsolute(src) {
    return /^https?:\/\//i.test(src);
  }

  function optimizedUrl(src, width, quality) {
    if (!src) return src;
    var abs = isAbsolute(src) ? src : "/" + String(src).replace(/^\/+/, "");
    return "/_vercel/image?url=" + encodeURIComponent(abs) + "&w=" + width + "&q=" + (quality || 75);
  }

  // Sets img.src to the optimized URL, but falls back to the original
  // (unoptimized) src if that request ever fails — e.g. running somewhere
  // /_vercel/image isn't available. One-shot: the fallback only wires up
  // once, so a later real network error on the original doesn't loop.
  function applyToImg(img, src, width, quality) {
    if (!img || !src) return;
    var original = src;
    img.addEventListener(
      "error",
      function () {
        if (img.src !== original) img.src = original;
      },
      { once: true }
    );
    img.src = optimizedUrl(src, width, quality);
  }

  // Sets a CSS background-image to the optimized URL immediately (no added
  // latency on a real Vercel deployment), while a background probe request
  // checks it actually loaded. If it didn't (e.g. /_vercel/image isn't
  // available, such as on the local static test server), falls back to the
  // plain original URL — a CSS background-image has no native error event
  // of its own, so this is the only way to detect and recover from that.
  function applyToBackground(layer, src, width, quality) {
    if (!layer || !src) return;
    var optimized = optimizedUrl(src, width, quality);
    layer.style.backgroundImage = 'url("' + optimized + '")';
    var probe = new Image();
    probe.onerror = function () {
      layer.style.backgroundImage = 'url("' + src + '")';
    };
    probe.src = optimized;
  }

  window.SellamImageOptim = {
    url: optimizedUrl,
    applyToImg: applyToImg,
    applyToBackground: applyToBackground
  };
})();
