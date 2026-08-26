import { supabase } from "./supabase";

// Matches the real property_enquiries columns (verified against live data —
// see 202607200001_create_property_enquiries.sql for the original schema).
// `listing_type` exists as a column but is null on every existing row;
// `listing_category` is the one actually populated by the public enquiry
// form. `property_id` stores properties.legacy_id (e.g. "sl-002"), which is
// what lets an enquiry be reliably connected back to a real property row.
export type Enquiry = {
  id: number;
  created_at: string;
  submitted_at: string;
  name: string;
  email: string;
  phone: string;
  message: string;
  property_id: string;
  property_title: string;
  property_url: string;
  listing_category: string;
  listing_type: string | null;
  source_page: string;
  status: string;
};

export async function fetchEnquiries(): Promise<Enquiry[]> {
  const { data, error } = await supabase
    .from("property_enquiries")
    .select(
      "id, created_at, submitted_at, name, email, phone, message, property_id, property_title, property_url, listing_category, listing_type, source_page, status",
    )
    .order("submitted_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

// legacy_id -> dashboard property uuid, so an enquiry's "Edit Property" link
// can be built without guessing or inventing a relationship — property_id
// on the enquiry already equals a real properties.legacy_id.
export async function fetchPropertyIdByLegacyId(): Promise<Map<string, string>> {
  const { data, error } = await supabase.from("properties").select("id, legacy_id");
  if (error) throw error;
  return new Map((data ?? []).map((p) => [p.legacy_id, p.id]));
}

// legacy_id (properties.legacy_id, matching enquiry.property_id) -> how many
// enquiries reference it. Used for the "Most Enquired Property" insight tile
// — real data, no fabrication.
export async function fetchEnquiryCountsByPropertyId(): Promise<Map<string, number>> {
  const { data, error } = await supabase.from("property_enquiries").select("property_id");
  if (error) throw error;
  const counts = new Map<string, number>();
  (data ?? []).forEach((e) => {
    if (!e.property_id) return;
    counts.set(e.property_id, (counts.get(e.property_id) ?? 0) + 1);
  });
  return counts;
}

// --------------------------------------------------------------------
// Status normalization (Phase 4) — five admin-facing pipeline stages,
// Spam kept as a separate, non-pipeline bucket. See
// supabase/migrations/202608262100_add_enquiry_status_write_and_appointments.sql
// for the raw values this maps from/to.
// --------------------------------------------------------------------

export type AdminStatus = "not-contacted" | "contacted" | "lead" | "closed" | "sale" | "spam";

export const ADMIN_STATUS_LABELS: Record<AdminStatus, string> = {
  "not-contacted": "Not Contacted",
  contacted: "Contacted",
  lead: "Lead",
  closed: "Closed",
  sale: "Sale",
  spam: "Spam",
};

// The five primary pipeline stages, in workflow order — excludes Spam,
// which is never presented as a sales stage.
export const PRIMARY_ADMIN_STATUSES: AdminStatus[] = ["not-contacted", "contacted", "lead", "closed", "sale"];

export function normalizeStatus(raw: string): AdminStatus {
  switch (raw) {
    case "new":
    case "notified":
    case "email_failed":
      return "not-contacted";
    case "contacted":
      return "contacted";
    case "lead":
      return "lead";
    case "closed":
      return "closed";
    case "sale":
      return "sale";
    case "spam":
      return "spam";
    default:
      return "not-contacted";
  }
}

// Raw DB value to write when the admin manually picks an admin-facing
// status. "new" is the canonical raw value for "Not Contacted" — the other
// two legacy values it also displays as (notified/email_failed) describe
// notification-email delivery outcome, not contact status, so there's no
// single "right" one to restore; "new" is the safest, most neutral choice.
export const ADMIN_TO_RAW: Record<AdminStatus, string> = {
  "not-contacted": "new",
  contacted: "contacted",
  lead: "lead",
  closed: "closed",
  sale: "sale",
  spam: "spam",
};

// Only ever changes `status` — no other enquiry field is touched.
export async function updateEnquiryStatus(id: number, adminStatus: AdminStatus): Promise<void> {
  const { error } = await supabase
    .from("property_enquiries")
    .update({ status: ADMIN_TO_RAW[adminStatus] })
    .eq("id", id);
  if (error) throw error;
}

// --------------------------------------------------------------------
// Viewing appointments (Phase 4)
// --------------------------------------------------------------------

export type EnquiryAppointment = {
  id: string;
  enquiry_id: number;
  scheduled_at: string;
  note: string | null;
  created_at: string;
};

export async function fetchAppointmentsByEnquiryId(): Promise<Map<number, EnquiryAppointment[]>> {
  const { data, error } = await supabase
    .from("enquiry_appointments")
    .select("id, enquiry_id, scheduled_at, note, created_at")
    .order("scheduled_at", { ascending: false });
  if (error) throw error;

  const map = new Map<number, EnquiryAppointment[]>();
  (data ?? []).forEach((a) => {
    const existing = map.get(a.enquiry_id) ?? [];
    existing.push(a);
    map.set(a.enquiry_id, existing);
  });
  return map;
}

// Insert-then-update, not a single transaction — the existing client-side
// Supabase setup has no RPC/stored-procedure layer to make this atomic
// without introducing new backend infrastructure, which is out of scope for
// this phase. Status is only flipped to "lead" once the appointment row has
// actually been created; if the insert fails, nothing else runs and this
// throws. If the insert succeeds but the subsequent status update fails
// (a second, separate network call), the appointment is real and returned
// as such — statusUpdated: false tells the caller the status wasn't
// flipped, rather than the whole operation being reported as failed.
export async function scheduleViewing(
  enquiryId: number,
  scheduledAt: string,
  note: string | null,
): Promise<{ appointment: EnquiryAppointment; statusUpdated: boolean; statusError?: string }> {
  const { data, error } = await supabase
    .from("enquiry_appointments")
    .insert({ enquiry_id: enquiryId, scheduled_at: scheduledAt, note })
    .select("id, enquiry_id, scheduled_at, note, created_at")
    .single();
  if (error) throw error;

  try {
    await updateEnquiryStatus(enquiryId, "lead");
    return { appointment: data, statusUpdated: true };
  } catch (err) {
    const message = err && typeof err === "object" && "message" in err ? String((err as { message: unknown }).message) : "Failed to update status.";
    return { appointment: data, statusUpdated: false, statusError: message };
  }
}
