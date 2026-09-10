import { supabase } from "./supabase";

// Real Supabase-backed data layer for the Leads & Clients (CRM) module. See
// supabase/migrations/202609101200_create_leads_clients.sql for the schema
// this reads/writes (contacts, contact_notes, contact_activities, plus a
// nullable property_enquiries.contact_id link).
//
// NOTE: admin/src/lib/leadsData.ts is a separate, older mock-data file with
// no remaining importers anywhere in the codebase (Analytics was rewritten
// to fetch real data too — see analyticsData.ts). It is not used here and
// has nothing to do with real data — do not import from it.

export type LeadSource = "Website" | "Enquiry Form" | "WhatsApp" | "Phone" | "Referral" | "Social Media" | "Walk-in" | "Other";
export type Stage = "New" | "Contacted" | "Qualified" | "Viewing" | "Negotiation" | "Won" | "Lost";
export type ContactType = "Lead" | "Client";
export type Intent = "Buy" | "Rent" | "Sell" | "Lease" | "Invest";
export type PreferredContact = "Phone" | "Email" | "WhatsApp";
export type Currency = "KES" | "USD";
export type Furnished = "Furnished" | "Unfurnished" | "Either";

export const SOURCES: LeadSource[] = ["Website", "Enquiry Form", "WhatsApp", "Phone", "Referral", "Social Media", "Walk-in", "Other"];
export const STAGES: Stage[] = ["New", "Contacted", "Qualified", "Viewing", "Negotiation", "Won"];
export const PIPELINE_COLUMNS: Stage[] = ["New", "Contacted", "Qualified", "Viewing", "Negotiation", "Won"];
export const INTENTS: Intent[] = ["Buy", "Rent", "Sell", "Lease", "Invest"];

export type ActivityType = "enquiry" | "message" | "call" | "note" | "viewing" | "follow_up" | "stage_change" | "conversion";
export type ActivityItem = { id: string; type: ActivityType; timestamp: string; title: string; detail?: string | null };
export type EnquiryRecord = { id: string; property: string; source: string; status: string; date: string };
export type PropertyInterestState = "Interested" | "Viewed";
export type PropertyInterest = { id: string; title: string; location: string; price: string; image: string; state: PropertyInterestState };
export type ViewingStatus = "Scheduled" | "Completed";
export type ViewingRecord = { id: string; property: string; date: string; time: string; status: ViewingStatus };
export type FollowUp = { title: string; date: string; time: string; notes: string; reminder: boolean };
export type Note = { id: string; text: string; timestamp: string; author: string };
export type MessagePreview = { id: string; date: string; from: "contact" | "sellam"; text: string };

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
  assignedAgent: string;
  intent: Intent;
  budgetMin: number | null;
  budgetMax: number | null;
  currency: Currency;
  preferredLocations: string[];
  propertyType: string;
  bedrooms: number | null;
  bathrooms: number | null;
  furnished: Furnished;
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

export function fullName(c: Pick<Contact, "firstName" | "lastName">) {
  return `${c.firstName} ${c.lastName}`.trim();
}

export function emptyFollowUp(): FollowUp {
  return { title: "", date: "", time: "", notes: "", reminder: true };
}

export function blankDraft(defaultAgent: string): Contact {
  const now = new Date().toISOString();
  return {
    id: "",
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    altPhone: "",
    preferredContact: "Phone",
    location: "",
    dateAdded: now,
    type: "Lead",
    stage: "New",
    source: "Website",
    assignedAgent: defaultAgent,
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
    lastActivityAt: now,
    nextFollowUp: null,
    archived: false,
    enquiries: [],
    properties: [],
    viewings: [],
    messages: [],
    notes: [],
    activity: [],
  };
}

// --------------------------------------------------------------------
// Row shapes + mapping
// --------------------------------------------------------------------

type ContactRow = {
  id: string;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
  alt_phone: string | null;
  preferred_contact: string;
  location: string | null;
  date_added: string;
  type: string;
  stage: string;
  source: string;
  assigned_agent: string | null;
  intent: string;
  budget_min: number | null;
  budget_max: number | null;
  currency: string;
  preferred_locations: string[];
  property_type: string | null;
  bedrooms: number | null;
  bathrooms: number | null;
  furnished: string;
  preferred_size: string | null;
  other_requirements: string | null;
  last_activity_at: string;
  next_follow_up_title: string | null;
  next_follow_up_date: string | null;
  next_follow_up_time: string | null;
  next_follow_up_notes: string | null;
  next_follow_up_reminder: boolean;
  archived: boolean;
};

const CONTACT_COLUMNS =
  "id, first_name, last_name, email, phone, alt_phone, preferred_contact, location, date_added, type, stage, source, assigned_agent, intent, budget_min, budget_max, currency, preferred_locations, property_type, bedrooms, bathrooms, furnished, preferred_size, other_requirements, last_activity_at, next_follow_up_title, next_follow_up_date, next_follow_up_time, next_follow_up_notes, next_follow_up_reminder, archived";

function mapRow(row: ContactRow): Omit<Contact, "enquiries" | "properties" | "viewings" | "notes" | "activity" | "messages"> {
  return {
    id: row.id,
    firstName: row.first_name,
    lastName: row.last_name,
    email: row.email ?? "",
    phone: row.phone ?? "",
    altPhone: row.alt_phone ?? "",
    preferredContact: (row.preferred_contact as PreferredContact) ?? "Phone",
    location: row.location ?? "",
    dateAdded: row.date_added,
    type: row.type as ContactType,
    stage: row.stage as Stage,
    source: row.source as LeadSource,
    assignedAgent: row.assigned_agent ?? "",
    intent: row.intent as Intent,
    budgetMin: row.budget_min,
    budgetMax: row.budget_max,
    currency: row.currency as Currency,
    preferredLocations: row.preferred_locations ?? [],
    propertyType: row.property_type ?? "",
    bedrooms: row.bedrooms,
    bathrooms: row.bathrooms,
    furnished: row.furnished as Furnished,
    preferredSize: row.preferred_size ?? "",
    otherRequirements: row.other_requirements ?? "",
    lastActivityAt: row.last_activity_at,
    nextFollowUp: row.next_follow_up_date
      ? {
          title: row.next_follow_up_title ?? "",
          date: row.next_follow_up_date,
          time: row.next_follow_up_time ?? "",
          notes: row.next_follow_up_notes ?? "",
          reminder: row.next_follow_up_reminder,
        }
      : null,
    archived: row.archived,
  };
}

function formatUnitPrice(units: { sale_price: number | null; rent_price: number | null; currency: string | null }[]): string {
  const sale = units.filter((u) => u.sale_price != null).sort((a, b) => a.sale_price! - b.sale_price!)[0];
  const rent = units.filter((u) => u.rent_price != null).sort((a, b) => a.rent_price! - b.rent_price!)[0];
  if (sale) return `${sale.currency ?? ""} ${sale.sale_price!.toLocaleString()}`.trim();
  if (rent) return `${rent.currency ?? ""} ${rent.rent_price!.toLocaleString()}/mo`.trim();
  return "Price on application";
}

// --------------------------------------------------------------------
// Fetch
// --------------------------------------------------------------------

export async function fetchContacts(): Promise<Contact[]> {
  const [{ data: contactRows, error: contactsError }, { data: noteRows, error: notesError }, { data: activityRows, error: activityError }, { data: enquiryRows, error: enquiryError }] =
    await Promise.all([
      supabase.from("contacts").select(CONTACT_COLUMNS).order("last_activity_at", { ascending: false }),
      supabase.from("contact_notes").select("id, contact_id, body, author, created_at").order("created_at", { ascending: false }),
      supabase.from("contact_activities").select("id, contact_id, type, title, detail, created_at").order("created_at", { ascending: false }),
      supabase
        .from("property_enquiries")
        .select("id, contact_id, email, property_id, property_title, listing_category, status, submitted_at")
        .order("submitted_at", { ascending: false }),
    ]);

  if (contactsError) throw contactsError;
  if (notesError) throw notesError;
  if (activityError) throw activityError;
  if (enquiryError) throw enquiryError;

  const contacts = contactRows ?? [];
  const enquiries = enquiryRows ?? [];

  // Enquiries are associated with a contact either explicitly
  // (property_enquiries.contact_id) or, when nothing has been linked yet,
  // by matching email — the only field both a contact and a public enquiry
  // reliably share.
  const enquiriesByContactId = new Map<string, typeof enquiries>();
  const enquiriesByEmail = new Map<string, typeof enquiries>();
  for (const e of enquiries) {
    if (e.contact_id) {
      const list = enquiriesByContactId.get(e.contact_id) ?? [];
      list.push(e);
      enquiriesByContactId.set(e.contact_id, list);
    }
    const email = (e.email ?? "").trim().toLowerCase();
    if (email) {
      const list = enquiriesByEmail.get(email) ?? [];
      list.push(e);
      enquiriesByEmail.set(email, list);
    }
  }

  function enquiriesFor(contact: ContactRow) {
    const linked = enquiriesByContactId.get(contact.id) ?? [];
    const byEmail = contact.email ? (enquiriesByEmail.get(contact.email.trim().toLowerCase()) ?? []) : [];
    const seen = new Set<number>();
    const merged: typeof enquiries = [];
    for (const e of [...linked, ...byEmail]) {
      if (seen.has(e.id)) continue;
      seen.add(e.id);
      merged.push(e);
    }
    return merged;
  }

  // Resolve interested properties + viewings for the enquiries we matched,
  // via the same legacy_id -> properties.id relationship already used by
  // the Enquiries module.
  const enquiryIds = enquiries.map((e) => e.id);
  const legacyIds = Array.from(new Set(enquiries.map((e) => e.property_id).filter(Boolean)));

  const [{ data: propertyRows, error: propertiesError }, { data: appointmentRows, error: appointmentsError }] = await Promise.all([
    legacyIds.length
      ? supabase
          .from("properties")
          .select("id, legacy_id, title, location, image, property_units(sale_price, rent_price, currency)")
          .in("legacy_id", legacyIds)
      : Promise.resolve({ data: [], error: null }),
    enquiryIds.length
      ? supabase.from("enquiry_appointments").select("id, enquiry_id, scheduled_at, note").in("enquiry_id", enquiryIds)
      : Promise.resolve({ data: [], error: null }),
  ]);
  if (propertiesError) throw propertiesError;
  if (appointmentsError) throw appointmentsError;

  const propertyByLegacyId = new Map((propertyRows ?? []).map((p) => [p.legacy_id, p]));
  const appointmentsByEnquiryId = new Map<number, { id: string; enquiry_id: number; scheduled_at: string; note: string | null }[]>();
  for (const a of appointmentRows ?? []) {
    const list = appointmentsByEnquiryId.get(a.enquiry_id) ?? [];
    list.push(a);
    appointmentsByEnquiryId.set(a.enquiry_id, list);
  }

  const notesByContactId = new Map<string, Note[]>();
  for (const n of noteRows ?? []) {
    const list = notesByContactId.get(n.contact_id) ?? [];
    list.push({ id: n.id, text: n.body, timestamp: n.created_at, author: n.author ?? "" });
    notesByContactId.set(n.contact_id, list);
  }

  const activityByContactId = new Map<string, ActivityItem[]>();
  for (const a of activityRows ?? []) {
    const list = activityByContactId.get(a.contact_id) ?? [];
    list.push({ id: a.id, type: a.type as ActivityType, title: a.title, detail: a.detail, timestamp: a.created_at });
    activityByContactId.set(a.contact_id, list);
  }

  return contacts.map((row) => {
    const base = mapRow(row);
    const matchedEnquiries = enquiriesFor(row);

    const enquiryRecords: EnquiryRecord[] = matchedEnquiries.map((e) => ({
      id: String(e.id),
      property: e.property_title,
      source: e.listing_category,
      status: e.status,
      date: e.submitted_at,
    }));

    const seenPropertyIds = new Set<string>();
    const properties: PropertyInterest[] = [];
    const viewings: ViewingRecord[] = [];
    for (const e of matchedEnquiries) {
      const property = propertyByLegacyId.get(e.property_id);
      if (property && !seenPropertyIds.has(property.id)) {
        seenPropertyIds.add(property.id);
        properties.push({
          id: property.id,
          title: property.title,
          location: property.location,
          price: formatUnitPrice(property.property_units ?? []),
          image: property.image,
          state: "Interested",
        });
      }
      const appointments = appointmentsByEnquiryId.get(e.id) ?? [];
      for (const a of appointments) {
        const when = new Date(a.scheduled_at);
        viewings.push({
          id: a.id,
          property: e.property_title,
          date: a.scheduled_at.slice(0, 10),
          time: when.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" }),
          status: when.getTime() < Date.now() ? "Completed" : "Scheduled",
        });
      }
    }
    viewings.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return {
      ...base,
      enquiries: enquiryRecords,
      properties,
      viewings,
      messages: [],
      notes: notesByContactId.get(row.id) ?? [],
      activity: activityByContactId.get(row.id) ?? [],
    };
  });
}

export async function fetchDistinctAgents(): Promise<string[]> {
  const { data, error } = await supabase.from("contacts").select("assigned_agent");
  if (error) throw error;
  const set = new Set<string>();
  for (const row of data ?? []) {
    if (row.assigned_agent) set.add(row.assigned_agent);
  }
  return Array.from(set).sort();
}

export async function fetchCommunityLabels(): Promise<string[]> {
  const { data, error } = await supabase.from("communities").select("label").order("label", { ascending: true });
  if (error) throw error;
  return (data ?? []).map((c) => c.label);
}

// --------------------------------------------------------------------
// Mutations
// --------------------------------------------------------------------

export type NewContactInput = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  source: LeadSource;
  intent: Intent;
  budgetMin: number | null;
  budgetMax: number | null;
  currency: Currency;
  preferredLocations: string[];
  propertyType: string;
  assignedAgent: string;
  otherRequirements: string;
};

export async function createContact(input: NewContactInput): Promise<Contact> {
  const { data, error } = await supabase
    .from("contacts")
    .insert({
      first_name: input.firstName.trim(),
      last_name: input.lastName.trim(),
      email: input.email.trim() || null,
      phone: input.phone.trim() || null,
      source: input.source,
      intent: input.intent,
      budget_min: input.budgetMin,
      budget_max: input.budgetMax,
      currency: input.currency,
      preferred_locations: input.preferredLocations,
      property_type: input.propertyType.trim() || null,
      assigned_agent: input.assignedAgent.trim() || null,
      other_requirements: input.otherRequirements.trim() || null,
    })
    .select(CONTACT_COLUMNS)
    .single();
  if (error) throw error;

  const { data: activity } = await supabase
    .from("contact_activities")
    .insert({ contact_id: data.id, type: "note", title: "Contact created" })
    .select("id, type, title, detail, created_at")
    .single();

  return {
    ...mapRow(data),
    enquiries: [],
    properties: [],
    viewings: [],
    messages: [],
    notes: [],
    activity: activity ? [{ id: activity.id, type: activity.type as ActivityType, title: activity.title, detail: activity.detail, timestamp: activity.created_at }] : [],
  };
}

async function touchContact(id: string) {
  await supabase.from("contacts").update({ last_activity_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq("id", id);
}

async function logActivity(contactId: string, type: ActivityType, title: string, detail?: string | null): Promise<ActivityItem> {
  const { data, error } = await supabase
    .from("contact_activities")
    .insert({ contact_id: contactId, type, title, detail: detail ?? null })
    .select("id, type, title, detail, created_at")
    .single();
  if (error) throw error;
  return { id: data.id, type: data.type as ActivityType, title: data.title, detail: data.detail, timestamp: data.created_at };
}

export async function archiveContact(id: string): Promise<void> {
  const { error } = await supabase.from("contacts").update({ archived: true, updated_at: new Date().toISOString() }).eq("id", id);
  if (error) throw error;
}

// Permanent — contact_notes/contact_activities cascade-delete with the
// contact; any property_enquiries linked to it have contact_id set null
// (the enquiry itself is untouched), per the FKs in
// 202609101200_create_leads_clients.sql.
export async function deleteContact(id: string): Promise<void> {
  const { error } = await supabase.from("contacts").delete().eq("id", id);
  if (error) throw error;
}

export async function changeContactStage(id: string, prevStage: Stage, nextStage: Stage): Promise<ActivityItem> {
  const { error } = await supabase.from("contacts").update({ stage: nextStage, last_activity_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq("id", id);
  if (error) throw error;
  return logActivity(id, "stage_change", "Stage changed", `${prevStage} → ${nextStage}`);
}

export async function convertToClient(id: string): Promise<ActivityItem> {
  const { error } = await supabase.from("contacts").update({ type: "Client", last_activity_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq("id", id);
  if (error) throw error;
  return logActivity(id, "conversion", "Converted to client");
}

export type ContactInfoPatch = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  altPhone: string;
  preferredContact: PreferredContact;
  location: string;
  assignedAgent: string;
};

export async function updateContactInfo(id: string, patch: ContactInfoPatch): Promise<void> {
  const { error } = await supabase
    .from("contacts")
    .update({
      first_name: patch.firstName.trim(),
      last_name: patch.lastName.trim(),
      email: patch.email.trim() || null,
      phone: patch.phone.trim() || null,
      alt_phone: patch.altPhone.trim() || null,
      preferred_contact: patch.preferredContact,
      location: patch.location.trim() || null,
      assigned_agent: patch.assignedAgent.trim() || null,
      last_activity_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);
  if (error) throw error;
}

export type ContactLeadPatch = {
  intent: Intent;
  source: LeadSource;
  budgetMin: number | null;
  budgetMax: number | null;
  propertyType: string;
  bedrooms: number | null;
  bathrooms: number | null;
  preferredLocations: string[];
  otherRequirements: string;
};

export async function updateContactLeadInfo(id: string, patch: ContactLeadPatch): Promise<void> {
  const { error } = await supabase
    .from("contacts")
    .update({
      intent: patch.intent,
      source: patch.source,
      budget_min: patch.budgetMin,
      budget_max: patch.budgetMax,
      property_type: patch.propertyType.trim() || null,
      bedrooms: patch.bedrooms,
      bathrooms: patch.bathrooms,
      preferred_locations: patch.preferredLocations,
      other_requirements: patch.otherRequirements.trim() || null,
      last_activity_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);
  if (error) throw error;
}

export async function addContactNote(id: string, text: string, author: string): Promise<{ note: Note; activity: ActivityItem }> {
  const { data, error } = await supabase
    .from("contact_notes")
    .insert({ contact_id: id, body: text.trim(), author })
    .select("id, body, author, created_at")
    .single();
  if (error) throw error;
  await touchContact(id);
  const activity = await logActivity(id, "note", "Agent note", text.trim());
  return { note: { id: data.id, text: data.body, timestamp: data.created_at, author: data.author ?? "" }, activity };
}

export async function scheduleFollowUp(id: string, followUp: FollowUp): Promise<ActivityItem> {
  const { error } = await supabase
    .from("contacts")
    .update({
      next_follow_up_title: followUp.title.trim(),
      next_follow_up_date: followUp.date,
      next_follow_up_time: followUp.time || null,
      next_follow_up_notes: followUp.notes.trim() || null,
      next_follow_up_reminder: followUp.reminder,
      last_activity_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);
  if (error) throw error;
  return logActivity(id, "follow_up", "Follow-up scheduled", `${followUp.title} · ${followUp.date}`);
}

export async function completeFollowUp(id: string, priorTitle: string | undefined): Promise<ActivityItem> {
  const { error } = await supabase
    .from("contacts")
    .update({
      next_follow_up_title: null,
      next_follow_up_date: null,
      next_follow_up_time: null,
      next_follow_up_notes: null,
      next_follow_up_reminder: true,
      last_activity_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);
  if (error) throw error;
  return logActivity(id, "follow_up", "Follow-up completed", priorTitle);
}
