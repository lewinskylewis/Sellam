"use strict";

/* ============================================================================
   SELLAM — PROPERTY PAGE RENDERER
   ============================================================================
   property.html used to be a static file: the browser painted its hardcoded
   "DG WEST" placeholder markup first, then property-detail.js swapped in the
   real title/price/gallery/etc. after DOMContentLoaded. On a slow connection
   that swap was visibly late, so visitors briefly saw the wrong property.

   This function removes that gap. It runs the *actual* client scripts
   (property-detail.js and friends, unmodified) inside a virtual DOM (jsdom)
   on the server, for the requested ?id=, and returns the fully-populated
   HTML. The browser now gets the correct property on the very first byte.
   property-detail.js still runs client-side afterward exactly as before —
   it just re-renders identical content, so gallery/lightbox/menu behavior
   is untouched, and there is nothing left to visibly swap in.

   templates/property.html is the single template shared by every property
   (reached via property.html?id=<slug>) — same source of truth as before,
   just rendered here instead of in the browser. data/properties.js is still
   the only file you edit to add/change a property.
   ========================================================================== */

const fs = require("fs");
const path = require("path");
const { JSDOM } = require("jsdom");

const ROOT = path.join(__dirname, "..");
const TEMPLATE_PATH = path.join(ROOT, "templates", "property.html");

// Loaded into the virtual page in this exact order — matches the <head>/
// <body> script order in templates/property.html so globals (window.SELLAM_
// PROPERTIES, window.SellamUnits, window.SellamSearch, ...) are defined
// before the scripts that read them run.
const HEAD_SCRIPT = "site-motion.js";
const BODY_SCRIPTS = [
  "data/properties.js",
  "data/property-units.js",
  "property-search.js",
  "enquiry-config.js",
  "enquiry-modal.js",
  "property-detail.js",
  "nav-active.js",
  "newsletter.js"
];

let templateCache = null;
function readTemplate() {
  if (!templateCache) templateCache = fs.readFileSync(TEMPLATE_PATH, "utf8");
  return templateCache;
}

const scriptCache = new Map();
function readScript(relativePath) {
  if (!scriptCache.has(relativePath)) {
    scriptCache.set(relativePath, fs.readFileSync(path.join(ROOT, relativePath), "utf8"));
  }
  return scriptCache.get(relativePath);
}

// jsdom has no real layout engine, so IntersectionObserver never fires here
// — every ".reveal" element simply stays un-revealed in the rendered output,
// exactly like a real browser before the visitor has scrolled to it. This
// stub only needs to exist so the "IntersectionObserver" in window checks in
// site-motion.js / property-detail.js take their normal code path instead of
// the no-JS fallback (which would mark everything visible immediately).
class NoopIntersectionObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}

// jsdom has no layout engine, so it doesn't implement matchMedia at all.
// Assume a large desktop viewport (matches nothing in the site's mobile/
// tablet max-width queries, same as most first-time visitors) so the two
// scripts that branch on screen size — site-motion.js's reduced-motion
// check and property-detail.js's gallery visibleCount — take their normal
// desktop path instead of throwing.
function matchMediaStub(query) {
  const maxWidth = /\(max-width:\s*(\d+)px\)/.exec(query);
  const minWidth = /\(min-width:\s*(\d+)px\)/.exec(query);
  const viewportWidth = 1920;
  let matches = false;
  if (maxWidth) matches = viewportWidth <= Number(maxWidth[1]);
  else if (minWidth) matches = viewportWidth >= Number(minWidth[1]);

  return {
    matches,
    media: query,
    addListener() {},
    removeListener() {},
    addEventListener() {},
    removeEventListener() {},
    dispatchEvent() { return true; }
  };
}

function renderPropertyPage(id) {
  const html = readTemplate();
  const url = `https://sellamre.com/property${id ? `?id=${encodeURIComponent(id)}` : ""}`;

  const dom = new JSDOM(html, { url, runScripts: "outside-only", pretendToBeVisual: true });
  const { window } = dom;

  try {
    window.IntersectionObserver = NoopIntersectionObserver;
    window.matchMedia = matchMediaStub;

    window.eval(readScript(HEAD_SCRIPT));
    BODY_SCRIPTS.forEach((file) => window.eval(readScript(file)));

    // The scripts above register "DOMContentLoaded" listeners (that's where
    // property-detail.js actually builds the price table, gallery, story
    // content, etc.). jsdom already finished parsing before we could attach
    // those listeners, so the real event is long gone — fire an equivalent
    // one now to trigger the same rendering code.
    window.document.dispatchEvent(new window.Event("DOMContentLoaded", { bubbles: true, cancelable: true }));

    return `<!doctype html>\n${window.document.documentElement.outerHTML}`;
  } finally {
    window.close();
  }
}

module.exports = async function propertyHandler(request, response) {
  const id = typeof request.query?.id === "string" ? request.query.id : "";

  try {
    const html = renderPropertyPage(id);
    response.setHeader("Content-Type", "text/html; charset=utf-8");
    response.status(200).send(html);
  } catch (error) {
    console.error("Property render error:", error);
    // Never let a rendering bug take the page down — fall back to the raw
    // template (today's pre-fix behavior) rather than a broken response.
    response.setHeader("Content-Type", "text/html; charset=utf-8");
    response.status(200).send(readTemplate());
  }
};
