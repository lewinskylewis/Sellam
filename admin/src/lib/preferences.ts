import type { SettingsState } from "./settingsDefaults";

export type AppearancePrefs = SettingsState["appearance"];
export type AccessibilityPrefs = SettingsState["accessibility"];

// Single dedicated key for the sidebar's live open/collapsed state — kept
// separate from the main settings blob (settingsDefaults.ts's STORAGE_KEY)
// since it changes on every click, not just on Save, and only matters when
// "Remember sidebar" is on. See DashboardLayout.tsx.
export const SIDEBAR_STATE_KEY = "sellam-admin-sidebar-open";

export function resolveMode(mode: AppearancePrefs["mode"]): "light" | "dark" {
  if (mode === "system") {
    return typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }
  return mode;
}

// Applies every Appearance/Accessibility preference to document.documentElement
// as data-attributes / CSS custom properties — the single place any of this
// ever touches the DOM. index.css's [data-theme]/[data-density]/etc.
// selectors are what actually re-theme the app; every module inherits this
// for free without importing anything.
export function applyPreferencesToDocument(appearance: AppearancePrefs, accessibility: AccessibilityPrefs) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;

  root.setAttribute("data-theme", resolveMode(appearance.mode));
  root.setAttribute("data-density", appearance.density);
  root.setAttribute("data-radius", appearance.radius);
  root.setAttribute("data-font-size", accessibility.fontSize);
  root.setAttribute("data-reduced-motion", String(accessibility.reducedMotion || window.matchMedia("(prefers-reduced-motion: reduce)").matches));
  root.setAttribute("data-high-contrast", String(accessibility.highContrast));

  root.style.setProperty("--dashboard-bg-image", appearance.backgroundUrl ? `url("${appearance.backgroundUrl}")` : "url(\"/dashboard-bg.jpg\")");
}

export function loadSidebarState(): boolean | null {
  try {
    const raw = localStorage.getItem(SIDEBAR_STATE_KEY);
    return raw === null ? null : raw === "1";
  } catch {
    return null;
  }
}

export function saveSidebarState(open: boolean) {
  try {
    localStorage.setItem(SIDEBAR_STATE_KEY, open ? "1" : "0");
  } catch {
    // best-effort — device-local convenience only
  }
}

export function clearSidebarState() {
  try {
    localStorage.removeItem(SIDEBAR_STATE_KEY);
  } catch {
    // best-effort
  }
}
