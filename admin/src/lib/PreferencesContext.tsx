import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { loadLocalSettings, saveLocalSettings } from "./settingsDefaults";
import { applyPreferencesToDocument, type AccessibilityPrefs, type AppearancePrefs } from "./preferences";

// The single source of truth for Appearance/Accessibility — every consumer
// (Settings.tsx, Sidebar.tsx, DashboardLayout.tsx, the shared ConfirmDialog,
// etc.) reads from this same context instead of each re-reading localStorage
// or duplicating theme logic. Settings.tsx still owns the draft/Save/Discard
// *editing* UX; this context is what's actually "live" — Save calls
// setPreferences() here, which both persists (localStorage) and immediately
// re-applies to the DOM, with no page refresh required.
type PreferencesContextValue = {
  appearance: AppearancePrefs;
  accessibility: AccessibilityPrefs;
  setPreferences: (next: { appearance: AppearancePrefs; accessibility: AccessibilityPrefs }) => void;
  // Paints the live document immediately without persisting or touching
  // React state — what lets Settings show the real effect of an in-progress
  // edit (before Save) directly on the page, instead of a separate preview
  // card. Settings.tsx calls this on every draft change and reverts it back
  // to the last-saved values on Discard/leave-without-saving; a page reload
  // always reflects only what was actually saved, since this never writes
  // to localStorage.
  previewPreferences: (next: { appearance: AppearancePrefs; accessibility: AccessibilityPrefs }) => void;
};

const PreferencesContext = createContext<PreferencesContextValue | undefined>(undefined);

export function PreferencesProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState(() => loadLocalSettings());

  useEffect(() => {
    applyPreferencesToDocument(state.appearance, state.accessibility);
  }, [state]);

  // "System" mode must react live to an OS-level theme change without a
  // page refresh.
  useEffect(() => {
    if (state.appearance.mode !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => applyPreferencesToDocument(state.appearance, state.accessibility);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [state]);

  // Reduced motion also has an OS-level default (prefers-reduced-motion)
  // even when the user hasn't explicitly enabled the dashboard's own
  // toggle — re-applied here so that OS-level change is live too.
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const handler = () => applyPreferencesToDocument(state.appearance, state.accessibility);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [state]);

  const value = useMemo<PreferencesContextValue>(
    () => ({
      appearance: state.appearance,
      accessibility: state.accessibility,
      setPreferences: (next) => {
        setState(next);
        saveLocalSettings(next);
      },
      previewPreferences: (next) => {
        applyPreferencesToDocument(next.appearance, next.accessibility);
      },
    }),
    [state],
  );

  return <PreferencesContext.Provider value={value}>{children}</PreferencesContext.Provider>;
}

export function usePreferences() {
  const ctx = useContext(PreferencesContext);
  if (!ctx) throw new Error("usePreferences must be used within PreferencesProvider");
  return ctx;
}
