// Local-only mock settings for the Settings module. No Supabase, no API
// calls — every value here is UI state, persisted at most to localStorage
// as a demonstration of "save" actually sticking across a reload. Nothing
// in this file talks to a backend.

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
      faviconUploaded: boolean;
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
    accent: string;
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
    branding: { logoUploaded: true, faviconUploaded: true, previewMode: "light" },
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
    accent: "#0f766e",
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
  { category: "appearance", label: "Accent colour" },
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

export const STORAGE_KEY = "sellam-admin-settings-v1";

export function loadStoredSettings(): SettingsState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(raw);
    // Shallow-merge per top-level category so a future new field added to
    // DEFAULT_SETTINGS doesn't get silently lost for a user with an older
    // stored blob — this is a demo/local convenience, not a migration system.
    return { ...DEFAULT_SETTINGS, ...parsed };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveStoredSettings(state: SettingsState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // best-effort only — local demo persistence, not a real data store
  }
}
