// Local-only mock CRM data for the Leads & Clients module. No Supabase, no
// API calls — every record here is UI state, optionally mirrored to
// localStorage so edits survive a reload. Nothing in this file talks to a
// backend.

export type LeadSource = "Website" | "Enquiry Form" | "WhatsApp" | "Phone" | "Referral" | "Social Media" | "Walk-in" | "Other";
export type Agent = "Alex" | "Brian" | "Sarah";
export type Stage = "New" | "Contacted" | "Qualified" | "Viewing" | "Negotiation" | "Won" | "Lost";
export type ContactType = "Lead" | "Client";
export type Intent = "Buy" | "Rent" | "Sell" | "Lease" | "Invest";
export type PreferredContact = "Phone" | "Email" | "WhatsApp";
export type Currency = "KES" | "USD";

export type ActivityType = "enquiry" | "message" | "call" | "note" | "viewing" | "follow_up" | "stage_change" | "conversion";
export type ActivityItem = { id: string; type: ActivityType; timestamp: string; title: string; detail?: string };

export type EnquiryRecord = { id: string; property: string; source: LeadSource; status: string; date: string };
export type PropertyInterestState = "Interested" | "Shortlisted" | "Viewed" | "Rejected" | "Selected";
export type PropertyInterest = { id: string; title: string; location: string; price: string; image: string; state: PropertyInterestState };
export type ViewingStatus = "Scheduled" | "Completed" | "Cancelled";
export type ViewingRecord = { id: string; property: string; date: string; time: string; status: ViewingStatus };
export type FollowUp = { id: string; title: string; date: string; time: string; notes?: string; reminder: boolean; completed: boolean };
export type MessagePreview = { id: string; date: string; from: "contact" | "sellam"; text: string };
export type Note = { id: string; text: string; timestamp: string; author: string };

export type Contact = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  altPhone: string;
  preferredContact: PreferredContact;
  location: string;
  dateAdded: string;
  type: ContactType;
  stage: Stage;
  source: LeadSource;
  assignedAgent: Agent;
  intent: Intent;
  budgetMin: number | null;
  budgetMax: number | null;
  currency: Currency;
  preferredLocations: string[];
  propertyType: string;
  bedrooms: number | null;
  bathrooms: number | null;
  furnished: "Furnished" | "Unfurnished" | "Either";
  preferredSize: string;
  otherRequirements: string;
  lastActivityAt: string;
  nextFollowUp: FollowUp | null;
  archived: boolean;
  enquiries: EnquiryRecord[];
  properties: PropertyInterest[];
  viewings: ViewingRecord[];
  messages: MessagePreview[];
  notes: Note[];
  activity: ActivityItem[];
};

export const AGENTS: Agent[] = ["Alex", "Brian", "Sarah"];
export const SOURCES: LeadSource[] = ["Website", "Enquiry Form", "WhatsApp", "Phone", "Referral", "Social Media", "Walk-in", "Other"];
export const STAGES: Stage[] = ["New", "Contacted", "Qualified", "Viewing", "Negotiation", "Won"];
export const PIPELINE_COLUMNS: Stage[] = ["New", "Contacted", "Qualified", "Viewing", "Negotiation", "Won"];
export const INTENTS: Intent[] = ["Buy", "Rent", "Sell", "Lease", "Invest"];
export const COMMUNITIES = ["Westlands", "Runda", "Karen", "Muthaiga", "Kilimani", "Kileleshwa", "Gigiri", "Lavington", "Ridgeways"];

export function fullName(c: Pick<Contact, "firstName" | "lastName">) {
  return `${c.firstName} ${c.lastName}`.trim();
}

function id() {
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}

export function newActivity(type: ActivityType, title: string, detail?: string): ActivityItem {
  return { id: id(), type, title, detail, timestamp: new Date().toISOString() };
}

export function emptyFollowUp(): FollowUp {
  return { id: id(), title: "", date: "", time: "", notes: "", reminder: true, completed: false };
}

export function blankContact(): Contact {
  return {
    id: id(),
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    altPhone: "",
    preferredContact: "Phone",
    location: "",
    dateAdded: new Date().toISOString(),
    type: "Lead",
    stage: "New",
    source: "Website",
    assignedAgent: "Alex",
    intent: "Buy",
    budgetMin: null,
    budgetMax: null,
    currency: "KES",
    preferredLocations: [],
    propertyType: "",
    bedrooms: null,
    bathrooms: null,
    furnished: "Either",
    preferredSize: "",
    otherRequirements: "",
    lastActivityAt: new Date().toISOString(),
    nextFollowUp: null,
    archived: false,
    enquiries: [],
    properties: [],
    viewings: [],
    messages: [],
    notes: [],
    activity: [newActivity("note", "Contact created")],
  };
}

function iso(daysAgo: number, hour = 9, minute = 0) {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
}

function isoFuture(daysAhead: number, hour = 10, minute = 0) {
  const d = new Date();
  d.setDate(d.getDate() + daysAhead);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
}

export const MOCK_CONTACTS: Contact[] = [
  {
    id: "c1",
    firstName: "John",
    lastName: "Kamau",
    email: "john.kamau@example.com",
    phone: "+254 722 111 222",
    altPhone: "",
    preferredContact: "WhatsApp",
    location: "Nairobi",
    dateAdded: iso(17),
    type: "Lead",
    stage: "Viewing",
    source: "Website",
    assignedAgent: "Alex",
    intent: "Buy",
    budgetMin: 10000000,
    budgetMax: 14000000,
    currency: "KES",
    preferredLocations: ["Westlands", "Kilimani"],
    propertyType: "Apartment",
    bedrooms: 3,
    bathrooms: 2,
    furnished: "Unfurnished",
    preferredSize: "150 sqm+",
    otherRequirements: "Prefers a higher floor with a view.",
    lastActivityAt: iso(0, 11, 24),
    nextFollowUp: { id: "f1", title: "Call client after viewing", date: isoFuture(1, 10, 0).slice(0, 10), time: "10:00", notes: "Confirm interest level and next steps.", reminder: true, completed: false },
    archived: false,
    enquiries: [
      { id: "e1", property: "Westlands 3BR Apartment", source: "Website", status: "Lead", date: iso(2) },
      { id: "e2", property: "Runda Villa", source: "Website", status: "Contacted", date: iso(9) },
    ],
    properties: [
      { id: "p1", title: "Westlands 3BR Apartment", location: "Westlands, Nairobi", price: "KES 12,500,000", image: "assets/images/grosvenor.jpg", state: "Shortlisted" },
      { id: "p2", title: "Runda Villa", location: "Runda, Nairobi", price: "KES 28,000,000", image: "assets/images/hero-runda.webp", state: "Interested" },
    ],
    viewings: [
      { id: "v1", property: "Westlands 3BR Apartment", date: isoFuture(1).slice(0, 10), time: "10:30 AM", status: "Scheduled" },
      { id: "v2", property: "Runda Villa", date: iso(5).slice(0, 10), time: "14:00", status: "Completed" },
    ],
    messages: [
      { id: "m1", date: iso(0), from: "contact", text: "Can I view this Saturday?" },
      { id: "m2", date: iso(0), from: "sellam", text: "Absolutely. 10:30 AM works for the team." },
    ],
    notes: [{ id: "n1", text: "Client prefers a higher floor.", timestamp: iso(0, 9, 40), author: "Alex" }],
    activity: [
      { id: "a1", type: "viewing", title: "Viewing scheduled", detail: "Westlands 3BR Apartment · Saturday, 10:30 AM", timestamp: iso(0, 11, 24) },
      { id: "a2", type: "message", title: "WhatsApp message", detail: "\"Can I view this Saturday?\"", timestamp: iso(0, 10, 52) },
      { id: "a3", type: "note", title: "Agent note", detail: "Client prefers a higher floor.", timestamp: iso(0, 9, 40) },
      { id: "a4", type: "enquiry", title: "Enquiry received", detail: "Runda Villa", timestamp: iso(1, 16, 22) },
      { id: "a5", type: "stage_change", title: "Stage changed", detail: "Contacted → Qualified", timestamp: iso(2, 14, 10) },
    ],
  },
  {
    id: "c2",
    firstName: "Mary",
    lastName: "Njeri",
    email: "mary.njeri@example.com",
    phone: "+254 733 222 333",
    altPhone: "",
    preferredContact: "Phone",
    location: "Nairobi",
    dateAdded: iso(30),
    type: "Lead",
    stage: "Contacted",
    source: "Enquiry Form",
    assignedAgent: "Sarah",
    intent: "Buy",
    budgetMin: 6000000,
    budgetMax: 9000000,
    currency: "KES",
    preferredLocations: ["Kileleshwa"],
    propertyType: "Apartment",
    bedrooms: 2,
    bathrooms: 2,
    furnished: "Either",
    preferredSize: "",
    otherRequirements: "",
    lastActivityAt: iso(1, 14, 0),
    nextFollowUp: { id: "f2", title: "Send alternative properties", date: new Date().toISOString().slice(0, 10), time: "14:00", notes: "", reminder: true, completed: false },
    archived: false,
    enquiries: [{ id: "e3", property: "Kileleshwa 2BR Apartment", source: "Enquiry Form", status: "Contacted", date: iso(4) }],
    properties: [{ id: "p3", title: "Kileleshwa 2BR Apartment", location: "Kileleshwa, Nairobi", price: "KES 8,200,000", image: "assets/images/hero-kileleshwa.webp", state: "Interested" }],
    viewings: [],
    messages: [],
    notes: [],
    activity: [
      { id: "a6", type: "enquiry", title: "Enquiry received", detail: "Kileleshwa 2BR Apartment", timestamp: iso(4) },
      { id: "a7", type: "call", title: "Call made", detail: "Discussed budget and timeline.", timestamp: iso(1, 14, 0) },
    ],
  },
  {
    id: "c3",
    firstName: "David",
    lastName: "Otieno",
    email: "david.otieno@example.com",
    phone: "+254 711 333 444",
    altPhone: "",
    preferredContact: "Email",
    location: "Nairobi",
    dateAdded: iso(45),
    type: "Client",
    stage: "Won",
    source: "Referral",
    assignedAgent: "Brian",
    intent: "Invest",
    budgetMin: 20000000,
    budgetMax: 30000000,
    currency: "KES",
    preferredLocations: ["Karen", "Muthaiga"],
    propertyType: "Villa",
    bedrooms: 5,
    bathrooms: 5,
    furnished: "Unfurnished",
    preferredSize: "0.5 acre+",
    otherRequirements: "Gated compound, staff quarters.",
    lastActivityAt: iso(3, 16, 30),
    nextFollowUp: { id: "f3", title: "Check financing requirements", date: new Date().toISOString().slice(0, 10), time: "16:30", notes: "", reminder: false, completed: false },
    archived: false,
    enquiries: [{ id: "e4", property: "Karen Estate Villa", source: "Referral", status: "Closed", date: iso(40) }],
    properties: [{ id: "p4", title: "Karen Estate Villa", location: "Karen, Nairobi", price: "KES 28,000,000", image: "assets/images/Premium properties/OSTREA Karen Villas.jpeg", state: "Selected" }],
    viewings: [{ id: "v3", property: "Karen Estate Villa", date: iso(20).slice(0, 10), time: "11:00", status: "Completed" }],
    messages: [],
    notes: [],
    activity: [
      { id: "a8", type: "conversion", title: "Converted to client", detail: "Purchase completed — Karen Estate Villa", timestamp: iso(3, 16, 30) },
      { id: "a9", type: "stage_change", title: "Stage changed", detail: "Negotiation → Won", timestamp: iso(4) },
    ],
  },
  {
    id: "c4",
    firstName: "Sarah",
    lastName: "Wambui",
    email: "sarah.wambui@example.com",
    phone: "+254 700 444 555",
    altPhone: "",
    preferredContact: "WhatsApp",
    location: "Mombasa",
    dateAdded: iso(6),
    type: "Lead",
    stage: "New",
    source: "Social Media",
    assignedAgent: "Alex",
    intent: "Rent",
    budgetMin: 150000,
    budgetMax: 250000,
    currency: "KES",
    preferredLocations: ["Vipingo"],
    propertyType: "Villa",
    bedrooms: 4,
    bathrooms: 3,
    furnished: "Furnished",
    preferredSize: "",
    otherRequirements: "Beachfront preferred.",
    lastActivityAt: iso(6),
    nextFollowUp: null,
    archived: false,
    enquiries: [{ id: "e5", property: "Vipingo Beach Villa", source: "Social Media", status: "New", date: iso(6) }],
    properties: [{ id: "p5", title: "Vipingo Beach Villa", location: "Vipingo, Kilifi", price: "KES 220,000 / month", image: "assets/images/diaspora-miami.webp", state: "Interested" }],
    viewings: [],
    messages: [],
    notes: [],
    activity: [{ id: "a10", type: "enquiry", title: "Enquiry received", detail: "Vipingo Beach Villa", timestamp: iso(6) }],
  },
  {
    id: "c5",
    firstName: "Peter",
    lastName: "Otieno",
    email: "peter.otieno@example.com",
    phone: "+254 722 555 666",
    altPhone: "",
    preferredContact: "Phone",
    location: "Nairobi",
    dateAdded: iso(12),
    type: "Lead",
    stage: "Contacted",
    source: "Phone",
    assignedAgent: "Brian",
    intent: "Buy",
    budgetMin: 12000000,
    budgetMax: 18000000,
    currency: "KES",
    preferredLocations: ["Runda"],
    propertyType: "Townhouse",
    bedrooms: 4,
    bathrooms: 3,
    furnished: "Unfurnished",
    preferredSize: "",
    otherRequirements: "",
    lastActivityAt: iso(2),
    nextFollowUp: null,
    archived: false,
    enquiries: [{ id: "e6", property: "Runda Townhouse", source: "Phone", status: "Contacted", date: iso(12) }],
    properties: [],
    viewings: [],
    messages: [],
    notes: [],
    activity: [{ id: "a11", type: "call", title: "Call made", detail: "Introductory call.", timestamp: iso(12) }],
  },
  {
    id: "c6",
    firstName: "James",
    lastName: "Mwangi",
    email: "james.mwangi@example.com",
    phone: "+254 733 666 777",
    altPhone: "",
    preferredContact: "Email",
    location: "Nairobi",
    dateAdded: iso(60),
    type: "Client",
    stage: "Won",
    source: "Referral",
    assignedAgent: "Sarah",
    intent: "Invest",
    budgetMin: 25000000,
    budgetMax: 35000000,
    currency: "KES",
    preferredLocations: ["Gigiri"],
    propertyType: "Apartment",
    bedrooms: 4,
    bathrooms: 4,
    furnished: "Furnished",
    preferredSize: "",
    otherRequirements: "",
    lastActivityAt: iso(10),
    nextFollowUp: null,
    archived: false,
    enquiries: [],
    properties: [],
    viewings: [],
    messages: [],
    notes: [],
    activity: [{ id: "a12", type: "conversion", title: "Converted to client", timestamp: iso(15) }],
  },
  {
    id: "c7",
    firstName: "Grace",
    lastName: "Achieng",
    email: "grace.achieng@example.com",
    phone: "+254 711 777 888",
    altPhone: "",
    preferredContact: "WhatsApp",
    location: "Nairobi",
    dateAdded: iso(3),
    type: "Lead",
    stage: "Qualified",
    source: "Website",
    assignedAgent: "Alex",
    intent: "Buy",
    budgetMin: 9000000,
    budgetMax: 13000000,
    currency: "KES",
    preferredLocations: ["Lavington"],
    propertyType: "Apartment",
    bedrooms: 3,
    bathrooms: 2,
    furnished: "Either",
    preferredSize: "",
    otherRequirements: "",
    lastActivityAt: iso(1),
    nextFollowUp: { id: "f4", title: "Send shortlist", date: isoFuture(2).slice(0, 10), time: "09:00", notes: "", reminder: true, completed: false },
    archived: false,
    enquiries: [{ id: "e7", property: "Lavington Townhouse", source: "Website", status: "Qualified", date: iso(3) }],
    properties: [],
    viewings: [],
    messages: [],
    notes: [],
    activity: [{ id: "a13", type: "stage_change", title: "Stage changed", detail: "Contacted → Qualified", timestamp: iso(1) }],
  },
  {
    id: "c8",
    firstName: "Brian",
    lastName: "Kiptoo",
    email: "brian.kiptoo@example.com",
    phone: "+254 700 888 999",
    altPhone: "",
    preferredContact: "Phone",
    location: "Nairobi",
    dateAdded: iso(90),
    type: "Lead",
    stage: "Lost",
    source: "Walk-in",
    assignedAgent: "Brian",
    intent: "Buy",
    budgetMin: 5000000,
    budgetMax: 7000000,
    currency: "KES",
    preferredLocations: ["Ridgeways"],
    propertyType: "Apartment",
    bedrooms: 2,
    bathrooms: 1,
    furnished: "Either",
    preferredSize: "",
    otherRequirements: "",
    lastActivityAt: iso(30),
    nextFollowUp: null,
    archived: false,
    enquiries: [],
    properties: [],
    viewings: [],
    messages: [],
    notes: [],
    activity: [{ id: "a14", type: "stage_change", title: "Stage changed", detail: "Negotiation → Lost", timestamp: iso(30) }],
  },
];

export const STORAGE_KEY = "sellam-admin-leads-v1";

export function loadStoredContacts(): Contact[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return MOCK_CONTACTS;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length ? parsed : MOCK_CONTACTS;
  } catch {
    return MOCK_CONTACTS;
  }
}

export function saveStoredContacts(contacts: Contact[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(contacts));
  } catch {
    // best-effort local demo persistence only
  }
}
