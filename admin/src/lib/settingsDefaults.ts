// Settings module: shape, defaults, and pure (non-Supabase) helpers. Actual
// persistence lives in two places:
//   - admin/src/lib/adminSettings.ts — Supabase-backed, for every category
//     except appearance/accessibility (see PERSISTED_CATEGORIES below).
//   - loadLocalSettings/saveLocalSettings in this file — localStorage-backed,
//     for appearance/accessibility only, which are genuinely per-browser/
//     per-device UI chrome and have no reason to sync across devices.
// This file itself makes no Supabase calls.

export type NotificationChannelPref = {
  key: string;
  label: string;
  enabled: boolean;
  inDashboard: boolean;
  email: boolean;
  push: boolean;
};

export type CommunicationPref = { key: string; label: string; enabled: boolean };

export type SettingsState = {
  general: {
    company: {
      name: string;
      legalName: string;
      description: string;
      website: string;
      phone: string;
      email: string;
      whatsapp: string;
      address: string;
      city: string;
      country: string;
    };
    branding: {
      logoUploaded: boolean;
      logoUrl: string | null;
      faviconUploaded: boolean;
      faviconUrl: string | null;
      previewMode: "light" | "dark";
    };
    regional: {
      country: string;
      currency: string;
      timezone: string;
      dateFormat: string;
      timeFormat: "12h" | "24h";
      numberFormat: "1,000.00" | "1.000,00" | "1 000.00";
    };
    preferences: {
      defaultLandingPage: string;
      listDensity: "comfortable" | "compact";
      pageSize: number;
      confirmBeforeDestructive: boolean;
    };
  };
  notifications: {
    dashboard: NotificationChannelPref[];
    behaviour: {
      sound: boolean;
      desktop: boolean;
      grouping: boolean;
      markAsReadOnOpen: boolean;
      reminderTiming: string;
      quietHoursEnabled: boolean;
      quietStart: string;
      quietEnd: string;
    };
  };
  email: {
    sender: { name: string; email: string; replyTo: string };
    communication: CommunicationPref[];
    signature: {
      name: string;
      position: string;
      phone: string;
      email: string;
      website: string;
      linkedin: string;
      instagram: string;
      includeLogo: boolean;
    };
  };
  website: {
    behaviour: {
      enquiryCtaText: string;
      contactCtaText: string;
      phoneDisplay: "full" | "masked" | "hidden";
      whatsappDisplay: "button" | "link" | "hidden";
      showContactInfo: boolean;
      openLinksNewTab: boolean;
      defaultShareBehaviour: "og-image" | "logo-only" | "none";
    };
    social: { title: string; description: string; imagePreview: "featured-image" | "logo" };
    display: { showAvailability: boolean; showPricing: boolean; showEnquiryButtons: boolean; showWhatsappCta: boolean };
  };
  propertyDefaults: {
    defaultStatus: "available" | "reserved" | "sold" | "off-market";
    defaultCollection: string;
    defaultListingType: "sale" | "rent" | "sale-and-rent";
    defaultCurrency: string;
    defaultImageBehaviour: "auto-optimize" | "as-uploaded";
    defaultEnquiryCta: string;
    defaultGalleryCount: number;
    defaultPublishing: "draft" | "published";
    display: { showPrice: boolean; showAvailability: boolean; showBedrooms: boolean; showBathrooms: boolean; showLocation: boolean };
  };
  enquiryLead: {
    enquiry: { defaultStatus: string; autoMarkNew: boolean; defaultAssignment: "unassigned" | "round-robin" | "team-lead"; duplicateHandling: "merge" | "flag" | "allow"; spamHandling: "auto-hide" | "flag-only" | "off" };
    lead: { defaultStatus: string; followUpReminderDays: number; qualificationBehaviour: "manual" | "auto-score"; defaultSource: string };
    viewing: { defaultDuration: number; defaultReminderPeriod: number; defaultNote: string; defaultStatus: string };
  };
  appearance: {
    mode: "light" | "dark" | "system";
    // Sellam's brand colors are fixed in the CSS design system — this is
    // deliberately not a color picker. null = use the built-in dashboard
    // background (public/dashboard-bg.jpg); otherwise a Storage public URL.
    backgroundUrl: string | null;
    density: "comfortable" | "compact";
    radius: "sharp" | "soft" | "round";
    sidebarStyle: "expanded" | "collapsed";
    rememberSidebar: boolean;
  };
  accessibility: {
    fontSize: "small" | "medium" | "large";
    reducedMotion: boolean;
    highContrast: boolean;
    keyboardNav: boolean;
    tooltips: boolean;
    confirmPrompts: boolean;
  };
  privacy: {
    retention: "30" | "90" | "365" | "forever";
    showTimestamps: boolean;
    showActivityIndicators: boolean;
    profileVisibility: "everyone" | "team" | "private";
    contactVisibility: "everyone" | "team" | "private";
    activityVisibility: "everyone" | "team" | "private";
  };
  security: {
    twoFactor: "not_configured" | "enabled";
    sessionTimeoutMinutes: number;
    loginNotifications: boolean;
    rememberDevice: boolean;
  };
};

export const DEFAULT_SETTINGS: SettingsState = {
  general: {
    company: {
      name: "Sellam Real Estate",
      legalName: "Sellam Properties Ltd.",
      description: "Premium real estate sales, leasing, and property management across Kenya.",
      website: "https://sellamre.com",
      phone: "+254 700 435 000",
      email: "office@sellamre.com",
      whatsapp: "+254 700 435 000",
      address: "Porshattam Towers",
      city: "Nairobi",
      country: "Kenya",
    },
    branding: { logoUploaded: false, logoUrl: null, faviconUploaded: false, faviconUrl: null, previewMode: "light" },
    regional: {
      country: "Kenya",
      currency: "KES",
      timezone: "Africa/Nairobi (GMT+3)",
      dateFormat: "DD/MM/YYYY",
      timeFormat: "24h",
      numberFormat: "1,000.00",
    },
    preferences: { defaultLandingPage: "Overview", listDensity: "comfortable", pageSize: 25, confirmBeforeDestructive: true },
  },
  notifications: {
    dashboard: [
      { key: "newEnquiry", label: "New enquiry", enabled: true, inDashboard: true, email: true, push: false },
      { key: "newLead", label: "New lead", enabled: true, inDashboard: true, email: true, push: false },
      { key: "newClient", label: "New client", enabled: true, inDashboard: true, email: false, push: false },
      { key: "newMessage", label: "New message", enabled: true, inDashboard: true, email: true, push: true },
      { key: "newViewing", label: "New viewing scheduled", enabled: true, inDashboard: true, email: true, push: false },
      { key: "viewingReminder", label: "Viewing reminder", enabled: true, inDashboard: true, email: false, push: true },
      { key: "statusChange", label: "Status changes", enabled: false, inDashboard: true, email: false, push: false },
      { key: "followUpReminder", label: "Follow-up reminders", enabled: true, inDashboard: true, email: false, push: false },
      { key: "systemNotification", label: "System notifications", enabled: true, inDashboard: true, email: false, push: false },
    ],
    behaviour: {
      sound: true,
      desktop: false,
      grouping: true,
      markAsReadOnOpen: true,
      reminderTiming: "30 minutes before",
      quietHoursEnabled: false,
      quietStart: "21:00",
      quietEnd: "07:00",
    },
  },
  email: {
    sender: { name: "Sellam Real Estate", email: "office@sellamre.com", replyTo: "office@sellamre.com" },
    communication: [
      { key: "newEnquiryConfirmation", label: "New enquiry confirmation", enabled: true },
      { key: "leadFollowUp", label: "Lead follow-up notification", enabled: true },
      { key: "viewingConfirmation", label: "Viewing confirmation", enabled: true },
      { key: "viewingReminder", label: "Viewing reminder", enabled: true },
      { key: "viewingReschedule", label: "Viewing reschedule", enabled: true },
      { key: "viewingCancellation", label: "Viewing cancellation", enabled: true },
      { key: "internalNotification", label: "Internal notification", enabled: false },
    ],
    signature: {
      name: "Lewis Kariuki",
      position: "Sales Director",
      phone: "+254 700 435 000",
      email: "sales@sellamre.com",
      website: "sellamre.com",
      linkedin: "linkedin.com/company/sellamre",
      instagram: "instagram.com/sellamre",
      includeLogo: true,
    },
  },
  website: {
    behaviour: {
      enquiryCtaText: "Enquire Now",
      contactCtaText: "Get In Touch",
      phoneDisplay: "full",
      whatsappDisplay: "button",
      showContactInfo: true,
      openLinksNewTab: false,
      defaultShareBehaviour: "og-image",
    },
    social: { title: "Sellam Real Estate — Premium Properties in Kenya", description: "Explore exclusive listings, communities, and premium property opportunities with Sellam.", imagePreview: "featured-image" },
    display: { showAvailability: true, showPricing: true, showEnquiryButtons: true, showWhatsappCta: true },
  },
  propertyDefaults: {
    defaultStatus: "available",
    defaultCollection: "Featured",
    defaultListingType: "sale",
    defaultCurrency: "KES",
    defaultImageBehaviour: "auto-optimize",
    defaultEnquiryCta: "Enquire Now",
    defaultGalleryCount: 8,
    defaultPublishing: "draft",
    display: { showPrice: true, showAvailability: true, showBedrooms: true, showBathrooms: true, showLocation: true },
  },
  enquiryLead: {
    enquiry: { defaultStatus: "Not Contacted", autoMarkNew: true, defaultAssignment: "unassigned", duplicateHandling: "flag", spamHandling: "flag-only" },
    lead: { defaultStatus: "Not Contacted", followUpReminderDays: 3, qualificationBehaviour: "manual", defaultSource: "Website" },
    viewing: { defaultDuration: 30, defaultReminderPeriod: 60, defaultNote: "Bring ID for building access.", defaultStatus: "Scheduled" },
  },
  appearance: {
    mode: "system",
    backgroundUrl: null,
    density: "comfortable",
    radius: "soft",
    sidebarStyle: "expanded",
    rememberSidebar: true,
  },
  accessibility: {
    fontSize: "medium",
    reducedMotion: false,
    highContrast: false,
    keyboardNav: true,
    tooltips: true,
    confirmPrompts: true,
  },
  privacy: {
    retention: "365",
    showTimestamps: true,
    showActivityIndicators: true,
    profileVisibility: "team",
    contactVisibility: "team",
    activityVisibility: "team",
  },
  security: {
    twoFactor: "not_configured",
    sessionTimeoutMinutes: 60,
    loginNotifications: true,
    rememberDevice: true,
  },
};

export type SettingsCategoryId =
  | "general"
  | "notifications"
  | "email"
  | "website"
  | "propertyDefaults"
  | "enquiryLead"
  | "appearance"
  | "accessibility"
  | "privacy"
  | "security"
  | "system";

export const SETTINGS_CATEGORIES: { id: SettingsCategoryId; label: string }[] = [
  { id: "general", label: "General" },
  { id: "notifications", label: "Notifications" },
  { id: "email", label: "Email & Communication" },
  { id: "website", label: "Website Preferences" },
  { id: "propertyDefaults", label: "Property Defaults" },
  { id: "enquiryLead", label: "Enquiry & Lead Preferences" },
  { id: "appearance", label: "Appearance" },
  { id: "accessibility", label: "Accessibility & Display" },
  { id: "privacy", label: "Data & Privacy" },
  { id: "security", label: "Security & Account" },
  { id: "system", label: "System" },
];

// Flat, searchable index of every field a user can jump to — powers the
// "Settings search" box. Deliberately hand-written rather than derived from
// SettingsState's shape, since field labels/descriptions are what a person
// actually searches for, not object keys.
export type SearchableField = { category: SettingsCategoryId; label: string; description?: string };

export const SETTINGS_SEARCH_INDEX: SearchableField[] = [
  { category: "general", label: "Company name" },
  { category: "general", label: "Legal / business name" },
  { category: "general", label: "Company description" },
  { category: "general", label: "Website" },
  { category: "general", label: "Phone" },
  { category: "general", label: "Email" },
  { category: "general", label: "WhatsApp number" },
  { category: "general", label: "Physical address" },
  { category: "general", label: "Company logo" },
  { category: "general", label: "Favicon" },
  { category: "general", label: "Currency" },
  { category: "general", label: "Timezone" },
  { category: "general", label: "Date format" },
  { category: "general", label: "Time format" },
  { category: "general", label: "Default landing page" },
  { category: "general", label: "List density" },
  { category: "general", label: "Pagination size" },
  { category: "notifications", label: "Notification sound" },
  { category: "notifications", label: "New enquiry notifications" },
  { category: "notifications", label: "New lead notifications" },
  { category: "notifications", label: "New message notifications" },
  { category: "notifications", label: "Viewing reminders" },
  { category: "notifications", label: "Desktop notifications" },
  { category: "notifications", label: "Notification grouping" },
  { category: "notifications", label: "Quiet hours" },
  { category: "notifications", label: "Mark as read behaviour" },
  { category: "email", label: "Sender name" },
  { category: "email", label: "Sender email" },
  { category: "email", label: "Reply-to email" },
  { category: "email", label: "Viewing confirmation email" },
  { category: "email", label: "Email signature" },
  { category: "email", label: "Signature social links" },
  { category: "website", label: "Enquiry CTA text" },
  { category: "website", label: "Contact CTA text" },
  { category: "website", label: "Phone display preference" },
  { category: "website", label: "WhatsApp display preference" },
  { category: "website", label: "Open links in new tab" },
  { category: "website", label: "Social sharing title" },
  { category: "website", label: "Social sharing image" },
  { category: "website", label: "Show pricing" },
  { category: "propertyDefaults", label: "Default property status" },
  { category: "propertyDefaults", label: "Default listing type" },
  { category: "propertyDefaults", label: "Default currency" },
  { category: "propertyDefaults", label: "Default gallery image count" },
  { category: "propertyDefaults", label: "Default publishing behaviour" },
  { category: "propertyDefaults", label: "Show bedrooms / bathrooms" },
  { category: "enquiryLead", label: "Default enquiry status" },
  { category: "enquiryLead", label: "Duplicate enquiry handling" },
  { category: "enquiryLead", label: "Spam handling preference" },
  { category: "enquiryLead", label: "Default lead status" },
  { category: "enquiryLead", label: "Follow-up reminder default" },
  { category: "enquiryLead", label: "Default viewing duration" },
  { category: "appearance", label: "Light / dark mode" },
  { category: "appearance", label: "Dashboard background" },
  { category: "appearance", label: "Interface density" },
  { category: "appearance", label: "Border radius" },
  { category: "appearance", label: "Sidebar style" },
  { category: "accessibility", label: "Font size" },
  { category: "accessibility", label: "Reduced motion" },
  { category: "accessibility", label: "High contrast" },
  { category: "accessibility", label: "Tooltips" },
  { category: "accessibility", label: "Confirmation prompts" },
  { category: "privacy", label: "Activity history retention" },
  { category: "privacy", label: "Profile visibility" },
  { category: "privacy", label: "Export my settings" },
  { category: "privacy", label: "Reset dashboard preferences" },
  { category: "security", label: "Change password" },
  { category: "security", label: "Two-factor authentication" },
  { category: "security", label: "Active sessions" },
  { category: "security", label: "Session timeout" },
  { category: "security", label: "Login notifications" },
  { category: "system", label: "Dashboard version" },
  { category: "system", label: "System status" },
  { category: "system", label: "Local storage status" },
];

// ---------- category split: what's Supabase-backed vs. device-local ----------

// Appearance/Accessibility are genuine per-browser/per-device UI chrome
// (theme, font size, sidebar state) with no reason to sync across devices —
// kept local rather than forced into Supabase for consistency's sake.
// "system" isn't in this list because it isn't part of SettingsState at all
// (SystemSection is read-only, derived live — nothing to persist).
export const LOCAL_ONLY_CATEGORIES = ["appearance", "accessibility"] as const;
export type LocalOnlyCategory = (typeof LOCAL_ONLY_CATEGORIES)[number];
export type PersistedCategory = Exclude<keyof SettingsState, LocalOnlyCategory>;
export type LocalSettings = Pick<SettingsState, LocalOnlyCategory>;
export type PersistedSettings = Pick<SettingsState, PersistedCategory>;

export const PERSISTED_CATEGORIES = (Object.keys(DEFAULT_SETTINGS) as (keyof SettingsState)[]).filter(
  (k): k is PersistedCategory => !(LOCAL_ONLY_CATEGORIES as readonly string[]).includes(k),
);

export function pickPersisted(state: SettingsState): PersistedSettings {
  const out = {} as PersistedSettings;
  for (const key of PERSISTED_CATEGORIES) {
    (out as Record<string, unknown>)[key] = state[key];
  }
  return out;
}

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

// Deep-merges `incoming` over `defaults`, recursing into plain objects,
// replacing arrays wholesale when `incoming` provides one (arrays here —
// notifications.dashboard, email.communication — are always written back in
// full by the UI, never partially), and falling back to the default value
// whenever `incoming` is missing, malformed, or type-mismatched. This is
// what keeps a partial/older object (from Supabase or localStorage) from
// ever losing a newly-added default field or crashing the UI on a
// corrupted value.
function deepMergeDefaults<T>(defaults: T, incoming: unknown): T {
  if (Array.isArray(defaults)) {
    return (Array.isArray(incoming) ? incoming : defaults) as T;
  }
  if (isPlainObject(defaults)) {
    if (!isPlainObject(incoming)) return defaults;
    const result: Record<string, unknown> = { ...defaults };
    for (const key of Object.keys(defaults)) {
      result[key] = deepMergeDefaults(defaults[key], incoming[key]);
    }
    return result as T;
  }
  // primitive default — accept incoming only if it's a matching, defined type
  return incoming !== undefined && incoming !== null && typeof incoming === typeof defaults ? (incoming as T) : defaults;
}

// Merges an arbitrary (possibly partial/corrupt) object against the full
// DEFAULT_SETTINGS shape — safe to call with anything from Supabase or
// localStorage.
export function mergeWithDefaults(incoming: unknown): SettingsState {
  return deepMergeDefaults(DEFAULT_SETTINGS, isPlainObject(incoming) ? incoming : {});
}

// ---------- local-only persistence (appearance + accessibility) ----------

export const STORAGE_KEY = "sellam-admin-settings-v1";

// Reads whatever raw object is stored under STORAGE_KEY, unmerged — used
// both by loadLocalSettings (below) and by the one-time Supabase migration
// in adminSettings-consuming code (Settings.tsx), which needs the *whole*
// legacy blob (every category, from before this module was split), not
// just the local-only slice.
export function readRawLocalStorageBlob(): unknown {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function loadLocalSettings(): LocalSettings {
  const merged = mergeWithDefaults(readRawLocalStorageBlob());
  return { appearance: merged.appearance, accessibility: merged.accessibility };
}

export function saveLocalSettings(local: LocalSettings) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(local));
  } catch {
    // best-effort — device-local convenience only
  }
}
