import { useEffect, useMemo, useRef, useState } from "react";
import type { ComponentType } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeftIcon,
  BellIcon,
  ChevronRightIcon,
  DatabaseIcon,
  GearIcon,
  GlobeIcon,
  HousePlusIcon,
  LockIcon,
  MailIcon,
  PaletteIcon,
  SearchIcon,
  ShieldIcon,
  UserIcon,
} from "../components/icons";
import {
  DEFAULT_SETTINGS,
  SETTINGS_CATEGORIES,
  SETTINGS_SEARCH_INDEX,
  loadLocalSettings,
  mergeWithDefaults,
  pickPersisted,
  readRawLocalStorageBlob,
  saveLocalSettings,
  type SettingsCategoryId,
  type SettingsState,
} from "../lib/settingsDefaults";
import { errorMessage, fetchAdminSettingsRow, isMissingTableError, saveAdminSettingsRow } from "../lib/adminSettings";
import GeneralSection from "../components/settings/sections/GeneralSection";
import NotificationsSection from "../components/settings/sections/NotificationsSection";
import EmailSection from "../components/settings/sections/EmailSection";
import { PropertyDefaultsSection, WebsiteSection } from "../components/settings/sections/WebsiteAndPropertySections";
import EnquiryLeadSection from "../components/settings/sections/EnquiryLeadSection";
import AppearanceSection from "../components/settings/sections/AppearanceSection";
import { AccessibilitySection, PrivacySection } from "../components/settings/sections/AccessibilityPrivacySections";
import SecuritySection from "../components/settings/sections/SecuritySection";
import SystemSection from "../components/settings/sections/SystemSection";

const CATEGORY_ICONS: Record<SettingsCategoryId, ComponentType<{ className?: string }>> = {
  general: GearIcon,
  notifications: BellIcon,
  email: MailIcon,
  website: GlobeIcon,
  propertyDefaults: HousePlusIcon,
  enquiryLead: UserIcon,
  appearance: PaletteIcon,
  accessibility: ShieldIcon,
  privacy: LockIcon,
  security: LockIcon,
  system: DatabaseIcon,
};

const CATEGORY_DESCRIPTIONS: Record<SettingsCategoryId, string> = {
  general: "Company details, branding, regional formats, and dashboard defaults.",
  notifications: "Choose what you're notified about, and how.",
  email: "Sender defaults, communication toggles, and your email signature.",
  website: "Global defaults for how the public website presents itself.",
  propertyDefaults: "Starting defaults used when creating or editing a property.",
  enquiryLead: "Default behaviour for new enquiries, leads, and viewings.",
  appearance: "Theme, accent colour, density, and sidebar style. Stored on this device only.",
  accessibility: "Font size, motion, contrast, and confirmation preferences. Stored on this device only.",
  privacy: "Activity retention and visibility, plus data controls.",
  security: "Password, two-factor authentication, and active sessions.",
  system: "Read-only application and environment information.",
};

function deepEqual(a: unknown, b: unknown) {
  return JSON.stringify(a) === JSON.stringify(b);
}

// Loads the full SettingsState: persisted categories from Supabase
// (admin_settings), local-only categories (appearance/accessibility) from
// localStorage. If the Supabase row has never been configured (empty
// settings object — see the migration's seed), this is the first
// authenticated load ever: any existing legacy localStorage blob (the old,
// pre-Supabase full-SettingsState shape) is merged with defaults and saved
// to Supabase once, becoming authoritative from then on. This never runs
// again once the row has real content, so it can't repeatedly clobber
// server settings with a stale local copy.
async function loadSettings(): Promise<SettingsState> {
  const row = await fetchAdminSettingsRow();
  const persistedRaw = row?.settings;
  const hasPersisted = persistedRaw && typeof persistedRaw === "object" && Object.keys(persistedRaw).length > 0;

  const persisted = hasPersisted
    ? pickPersisted(mergeWithDefaults(persistedRaw))
    : await (async () => {
        const legacy = readRawLocalStorageBlob();
        const merged = pickPersisted(mergeWithDefaults(legacy));
        await saveAdminSettingsRow(merged);
        return merged;
      })();

  const local = loadLocalSettings();
  return { ...persisted, ...local } as SettingsState;
}

export default function Settings() {
  const navigate = useNavigate();
  const [saved, setSaved] = useState<SettingsState>(DEFAULT_SETTINGS);
  const [draft, setDraft] = useState<SettingsState>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<SettingsCategoryId>("general");
  const [mobileShowDetail, setMobileShowDetail] = useState(false);
  const [search, setSearch] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [resetConfirm, setResetConfirm] = useState<keyof SettingsState | null>(null);
  const [leaveTarget, setLeaveTarget] = useState<string | null>(null);
  const loadToken = useRef(0);

  const dirty = useMemo(() => !deepEqual(saved, draft), [saved, draft]);
  const dirtyRef = useRef(dirty);
  dirtyRef.current = dirty;

  function runLoad() {
    const token = ++loadToken.current;
    setLoading(true);
    setLoadError(null);
    loadSettings()
      .then((state) => {
        if (loadToken.current !== token) return;
        setSaved(state);
        setDraft(state);
      })
      .catch((err) => {
        if (loadToken.current !== token) return;
        setLoadError(isMissingTableError(err) ? "Settings storage isn't set up yet — ask an administrator to run the pending database migration." : errorMessage(err, "Unable to load settings."));
      })
      .finally(() => {
        if (loadToken.current === token) setLoading(false);
      });
  }

  useEffect(() => {
    runLoad();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Real browser-close/refresh protection — the only text a browser shows
  // here is its own native prompt, not this string, but returning a value
  // is what triggers it.
  useEffect(() => {
    function handler(e: BeforeUnloadEvent) {
      if (!dirtyRef.current) return;
      e.preventDefault();
      e.returnValue = "";
    }
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, []);

  // Intercepts clicks on real in-app links that lead away from Settings
  // (e.g. the dashboard's own Sidebar) while there are unsaved changes, and
  // shows the same confirmation modal instead of navigating immediately.
  // This app uses a declarative <BrowserRouter>, not a data router, so
  // react-router's useBlocker isn't available here — a capturing document
  // listener is the lightest way to get the same UX without changing the
  // router mode for the whole app.
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (!dirtyRef.current) return;
      const anchor = (e.target as HTMLElement)?.closest?.("a[href]") as HTMLAnchorElement | null;
      if (!anchor) return;
      const href = anchor.getAttribute("href") || "";
      if (!href || href.startsWith("#") || href.startsWith("/settings")) return;
      if (anchor.target === "_blank") return;
      e.preventDefault();
      e.stopPropagation();
      setLeaveTarget(href);
    }
    document.addEventListener("click", handler, true);
    return () => document.removeEventListener("click", handler, true);
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(t);
  }, [toast]);

  function updateCategory<K extends keyof SettingsState>(key: K, next: SettingsState[K]) {
    setDraft((prev) => ({ ...prev, [key]: next }));
  }

  async function handleSave() {
    if (saving) return; // prevent duplicate submissions
    setSaving(true);
    setSaveError(null);
    try {
      await saveAdminSettingsRow(pickPersisted(draft));
      saveLocalSettings({ appearance: draft.appearance, accessibility: draft.accessibility });
      setSaved(draft);
      setToast("Changes saved successfully.");
    } catch (err) {
      // Never falsely report success — saved/dirty state is untouched, so
      // nothing the user typed is lost and the bottom bar stays visible.
      setSaveError(isMissingTableError(err) ? "Settings storage isn't set up yet — ask an administrator to run the pending database migration." : errorMessage(err, "Failed to save changes."));
    } finally {
      setSaving(false);
    }
  }

  function handleDiscard() {
    setDraft(saved);
    setSaveError(null);
  }

  function handleResetCategory(id: keyof SettingsState) {
    setDraft((prev) => ({ ...prev, [id]: DEFAULT_SETTINGS[id] }));
    setResetConfirm(null);
  }

  function selectCategory(id: SettingsCategoryId) {
    setActiveCategory(id);
    setMobileShowDetail(true);
    setSearchOpen(false);
    setSearch("");
  }

  const searchResults = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return [];
    return SETTINGS_SEARCH_INDEX.filter((f) => f.label.toLowerCase().includes(q)).slice(0, 8);
  }, [search]);

  const activeIcon = CATEGORY_ICONS[activeCategory];
  const ActiveIcon = activeIcon;

  return (
    <div className="pb-24">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight text-ink">Settings</h1>
        <p className="mt-1 text-ink-soft">Manage your Sellam Dashboard preferences and configuration.</p>
      </div>

      {loadError && (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">
          <span>Unable to load settings. {loadError}</span>
          <button type="button" onClick={runLoad} className="shrink-0 rounded-lg border border-red-200 bg-white px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-50">
            Retry
          </button>
        </div>
      )}

      <div className="relative mt-5 max-w-md">
        <SearchIcon className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-ink-soft" />
        <input
          type="text"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setSearchOpen(true);
          }}
          onFocus={() => setSearchOpen(true)}
          onBlur={() => setTimeout(() => setSearchOpen(false), 120)}
          placeholder="Search settings…"
          className="w-full rounded-xl border border-line bg-white py-2.5 pr-3 pl-9 text-sm text-ink outline-none focus:border-brand focus:ring-1 focus:ring-brand"
        />
        {searchOpen && search.trim() && (
          <div className="absolute z-20 mt-1.5 w-full overflow-hidden rounded-xl border border-line bg-white shadow-[0_12px_40px_rgba(15,23,42,0.14)]">
            {searchResults.length === 0 ? (
              <p className="px-4 py-3 text-sm text-ink-soft">No matching settings.</p>
            ) : (
              searchResults.map((r, i) => (
                <button
                  key={`${r.category}-${i}`}
                  type="button"
                  onMouseDown={() => selectCategory(r.category)}
                  className="flex w-full items-center justify-between px-4 py-2.5 text-left text-sm hover:bg-paper"
                >
                  <span className="text-ink">{r.label}</span>
                  <span className="text-xs text-ink-soft">{SETTINGS_CATEGORIES.find((c) => c.id === r.category)?.label}</span>
                </button>
              ))
            )}
          </div>
        )}
      </div>

      <div className="mt-6 flex flex-col gap-6 md:flex-row md:items-start">
        <nav className={`w-full shrink-0 md:block md:w-60 ${mobileShowDetail ? "hidden" : "block"}`}>
          <div className="space-y-0.5 rounded-2xl border border-line bg-surface p-2">
            {SETTINGS_CATEGORIES.map((cat) => {
              const Icon = CATEGORY_ICONS[cat.id];
              const active = cat.id === activeCategory;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => selectCategory(cat.id)}
                  className={`flex w-full items-center justify-between gap-2 rounded-xl px-3.5 py-2.5 text-left text-sm font-medium transition-colors ${
                    active ? "bg-brand text-white" : "text-ink hover:bg-paper"
                  }`}
                >
                  <span className="flex min-w-0 items-center gap-2.5">
                    <Icon className="h-4 w-4 shrink-0" />
                    <span className="truncate">{cat.label}</span>
                  </span>
                  <ChevronRightIcon className={`h-4 w-4 shrink-0 md:hidden ${active ? "text-white" : "text-ink-soft"}`} />
                </button>
              );
            })}
          </div>
        </nav>

        <div className={`min-w-0 flex-1 rounded-2xl border border-line bg-surface p-5 sm:p-7 ${mobileShowDetail ? "block" : "hidden md:block"}`}>
          <button
            type="button"
            onClick={() => setMobileShowDetail(false)}
            className="mb-4 flex items-center gap-1.5 text-sm font-medium text-ink-soft hover:text-ink md:hidden"
          >
            <ArrowLeftIcon className="h-4 w-4" />
            Settings
          </button>

          <div className="mb-6 flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand/10 text-brand">
                <ActiveIcon className="h-4.5 w-4.5" />
              </span>
              <div>
                <h2 className="text-lg font-semibold text-ink">{SETTINGS_CATEGORIES.find((c) => c.id === activeCategory)?.label}</h2>
                <p className="mt-0.5 text-sm text-ink-soft">{CATEGORY_DESCRIPTIONS[activeCategory]}</p>
              </div>
            </div>
            {activeCategory !== "system" && (
              <button
                type="button"
                onClick={() => setResetConfirm(activeCategory)}
                className="shrink-0 text-xs font-medium text-ink-soft underline decoration-line underline-offset-2 hover:text-brand"
              >
                Reset to defaults
              </button>
            )}
          </div>

          {loading ? (
            <p className="py-10 text-center text-sm text-ink-soft">Loading settings…</p>
          ) : (
            <>
              {activeCategory === "general" && <GeneralSection value={draft.general} onChange={(v) => updateCategory("general", v)} />}
              {activeCategory === "notifications" && <NotificationsSection value={draft.notifications} onChange={(v) => updateCategory("notifications", v)} />}
              {activeCategory === "email" && <EmailSection value={draft.email} onChange={(v) => updateCategory("email", v)} />}
              {activeCategory === "website" && <WebsiteSection value={draft.website} onChange={(v) => updateCategory("website", v)} />}
              {activeCategory === "propertyDefaults" && <PropertyDefaultsSection value={draft.propertyDefaults} onChange={(v) => updateCategory("propertyDefaults", v)} />}
              {activeCategory === "enquiryLead" && <EnquiryLeadSection value={draft.enquiryLead} onChange={(v) => updateCategory("enquiryLead", v)} />}
              {activeCategory === "appearance" && <AppearanceSection value={draft.appearance} onChange={(v) => updateCategory("appearance", v)} />}
              {activeCategory === "accessibility" && <AccessibilitySection value={draft.accessibility} onChange={(v) => updateCategory("accessibility", v)} />}
              {activeCategory === "privacy" && (
                <PrivacySection
                  value={draft.privacy}
                  onChange={(v) => updateCategory("privacy", v)}
                  onExport={() => {
                    const blob = new Blob([JSON.stringify(saved, null, 2)], { type: "application/json" });
                    const url = URL.createObjectURL(blob);
                    window.open(url, "_blank");
                    setTimeout(() => URL.revokeObjectURL(url), 10000);
                  }}
                  onResetPreferences={() => {
                    // Scoped to the local-only categories (appearance,
                    // accessibility) — matches this action's own confirm-modal
                    // wording ("This only affects local preferences on this
                    // device"). Applies immediately per its existing UX (the
                    // confirm dialog is the explicit confirmation), same as
                    // before — it just no longer touches account-wide
                    // Supabase-backed settings.
                    const resetLocal = { appearance: DEFAULT_SETTINGS.appearance, accessibility: DEFAULT_SETTINGS.accessibility };
                    setDraft((prev) => ({ ...prev, ...resetLocal }));
                    setSaved((prev) => ({ ...prev, ...resetLocal }));
                    saveLocalSettings(resetLocal);
                    setToast("Local dashboard preferences reset to defaults.");
                  }}
                />
              )}
              {activeCategory === "security" && <SecuritySection value={draft.security} onChange={(v) => updateCategory("security", v)} />}
              {activeCategory === "system" && <SystemSection />}
            </>
          )}
        </div>
      </div>

      {resetConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4" role="dialog" aria-modal="true">
          <div className="w-full max-w-sm rounded-2xl border border-line bg-white p-6 shadow-2xl">
            <h3 className="text-base font-semibold text-ink">Reset {SETTINGS_CATEGORIES.find((c) => c.id === resetConfirm)?.label.toLowerCase()} preferences?</h3>
            <p className="mt-2 text-sm text-ink-soft">This will restore the default configuration for this section. Nothing is saved until you click Save changes.</p>
            <div className="mt-5 flex justify-end gap-2">
              <button type="button" onClick={() => setResetConfirm(null)} className="rounded-lg border border-line px-4 py-2 text-sm font-medium text-ink hover:bg-paper">
                Cancel
              </button>
              <button type="button" onClick={() => handleResetCategory(resetConfirm)} className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:opacity-90">
                Reset
              </button>
            </div>
          </div>
        </div>
      )}

      {leaveTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4" role="dialog" aria-modal="true">
          <div className="w-full max-w-sm rounded-2xl border border-line bg-white p-6 shadow-2xl">
            <h3 className="text-base font-semibold text-ink">You have unsaved changes.</h3>
            <p className="mt-2 text-sm text-ink-soft">Leave without saving?</p>
            <div className="mt-5 flex justify-end gap-2">
              <button type="button" onClick={() => setLeaveTarget(null)} className="rounded-lg border border-line px-4 py-2 text-sm font-medium text-ink hover:bg-paper">
                Stay
              </button>
              <button
                type="button"
                onClick={() => {
                  const target = leaveTarget;
                  setDraft(saved);
                  setLeaveTarget(null);
                  if (target) navigate(target);
                }}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
              >
                Discard Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {dirty && !loading && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-white/95 backdrop-blur">
          <div className="mx-auto flex max-w-[1200px] flex-wrap items-center justify-between gap-3 px-5 py-3 md:px-10">
            <div>
              <p className="text-sm font-medium text-ink">Unsaved changes</p>
              {saveError && <p className="text-xs font-medium text-red-600">{saveError}</p>}
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={handleDiscard} disabled={saving} className="rounded-lg border border-line px-4 py-2 text-sm font-medium text-ink hover:bg-paper disabled:opacity-50">
                Discard changes
              </button>
              <button type="button" onClick={handleSave} disabled={saving} className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-60">
                {saving ? "Saving…" : "Save changes"}
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className="fixed right-6 bottom-6 z-50 flex items-center gap-2 rounded-xl bg-ink px-4 py-3 text-sm font-medium text-white shadow-2xl">
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-xs">✓</span>
          {toast}
        </div>
      )}
    </div>
  );
}
