import { useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import EnquiryStatusBadge from "./EnquiryStatusBadge";
import { CloseIcon } from "./icons";
import {
  ADMIN_STATUS_LABELS,
  ADMIN_TO_RAW,
  PRIMARY_ADMIN_STATUSES,
  normalizeStatus,
  scheduleViewing,
  updateEnquiryStatus,
  type AdminStatus,
  type Enquiry,
  type EnquiryAppointment,
} from "../lib/enquiries";

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function titleCase(value: string) {
  return value
    .split(/[-_]/)
    .map((w) => w[0].toUpperCase() + w.slice(1))
    .join(" ");
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <p className="text-xs font-medium tracking-wide text-ink-soft uppercase">{label}</p>
      <div className="mt-1 text-sm text-ink">{children}</div>
    </div>
  );
}

const inputClasses =
  "w-full rounded-xl border border-line bg-white px-3 py-2 text-sm text-ink outline-none focus:border-brand focus:ring-1 focus:ring-brand";

export default function EnquiryDetailDrawer({
  enquiry,
  propertyDashboardId,
  appointments,
  onStatusChange,
  onAppointmentScheduled,
  onClose,
}: {
  enquiry: Enquiry;
  propertyDashboardId: string | null;
  appointments: EnquiryAppointment[];
  onStatusChange: (rawStatus: string) => void;
  onAppointmentScheduled: (appointment: EnquiryAppointment) => void;
  onClose: () => void;
}) {
  const [statusSaving, setStatusSaving] = useState(false);
  const [statusError, setStatusError] = useState<string | null>(null);

  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [note, setNote] = useState("");
  const [scheduling, setScheduling] = useState(false);
  const [scheduleError, setScheduleError] = useState<string | null>(null);
  const [scheduleSuccess, setScheduleSuccess] = useState(false);
  const [showForm, setShowForm] = useState(appointments.length === 0);

  const nextAppointment = appointments.length
    ? appointments.reduce((latest, a) => (new Date(a.scheduled_at) > new Date(latest.scheduled_at) ? a : latest))
    : null;

  async function handleStatusChange(next: AdminStatus) {
    setStatusSaving(true);
    setStatusError(null);
    try {
      await updateEnquiryStatus(enquiry.id, next);
      onStatusChange(ADMIN_TO_RAW[next]);
    } catch (err) {
      setStatusError(err instanceof Error || (err && typeof err === "object" && "message" in err) ? String((err as { message: unknown }).message) : "Failed to update status.");
    } finally {
      setStatusSaving(false);
    }
  }

  async function handleScheduleViewing() {
    setScheduleError(null);
    setScheduleSuccess(false);
    if (!date || !time) {
      setScheduleError("Pick both a date and a time.");
      return;
    }
    const scheduledAt = new Date(`${date}T${time}`);
    if (Number.isNaN(scheduledAt.getTime())) {
      setScheduleError("That date/time isn't valid.");
      return;
    }

    setScheduling(true);
    try {
      const result = await scheduleViewing(enquiry.id, scheduledAt.toISOString(), note.trim() || null);
      onAppointmentScheduled(result.appointment);
      if (result.statusUpdated) onStatusChange(ADMIN_TO_RAW.lead);
      setDate("");
      setTime("");
      setNote("");
      setShowForm(false);
      setScheduleSuccess(true);
      if (!result.statusUpdated) {
        setScheduleError(`Viewing scheduled, but the status couldn't be updated to Lead automatically. ${result.statusError ?? ""}`);
      }
    } catch (err) {
      setScheduleError(err && typeof err === "object" && "message" in err ? String((err as { message: unknown }).message) : "Failed to schedule the viewing.");
    } finally {
      setScheduling(false);
    }
  }

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/40" onClick={onClose} aria-hidden="true" />
      <aside className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col bg-surface shadow-2xl">
        <div className="flex items-center justify-between border-b border-line px-6 py-5">
          <h2 className="font-serif text-xl text-ink">Enquiry</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-ink-soft hover:bg-paper"
          >
            <CloseIcon className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 space-y-5 overflow-y-auto px-6 py-6">
          {/* CLIENT */}
          <div className="flex items-center justify-between">
            <p className="text-lg font-semibold text-ink">{enquiry.name}</p>
            <EnquiryStatusBadge status={enquiry.status} />
          </div>

          <Field label="Email">
            <a href={`mailto:${enquiry.email}`} className="text-link hover:underline">
              {enquiry.email}
            </a>
          </Field>

          <Field label="Phone">
            <a href={`tel:${enquiry.phone}`} className="text-link hover:underline">
              {enquiry.phone}
            </a>
          </Field>

          {/* PROPERTY */}
          <Field label="Property">
            <p>{enquiry.property_title}</p>
            <div className="mt-2 flex flex-wrap gap-3">
              {enquiry.property_url && (
                <a
                  href={enquiry.property_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-medium text-link hover:underline"
                >
                  View Property ↗
                </a>
              )}
              {propertyDashboardId && (
                <Link
                  to={`/properties/${propertyDashboardId}/edit`}
                  className="text-sm font-medium text-link hover:underline"
                >
                  Edit Property
                </Link>
              )}
            </div>
          </Field>

          <Field label="Listing Type">{titleCase(enquiry.listing_category || enquiry.listing_type || "—")}</Field>

          {/* ENQUIRY */}
          <Field label="Message">
            <p className="whitespace-pre-wrap text-ink">{enquiry.message}</p>
          </Field>

          <Field label="Source Page">
            <a
              href={enquiry.source_page}
              target="_blank"
              rel="noopener noreferrer"
              className="break-all text-link hover:underline"
            >
              {enquiry.source_page}
            </a>
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Submitted">{formatDateTime(enquiry.submitted_at)}</Field>
            <Field label="Created">{formatDateTime(enquiry.created_at)}</Field>
          </div>

          {/* STATUS */}
          <div className="border-t border-line pt-5">
            <p className="mb-2 text-xs font-medium tracking-wide text-ink-soft uppercase">Status</p>
            <select
              value={normalizeStatus(enquiry.status)}
              onChange={(e) => handleStatusChange(e.target.value as AdminStatus)}
              disabled={statusSaving}
              className={inputClasses}
            >
              {PRIMARY_ADMIN_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {ADMIN_STATUS_LABELS[s]}
                </option>
              ))}
              <option value="spam">Spam</option>
            </select>
            {statusError && <p className="mt-1.5 text-xs text-red-600">{statusError}</p>}
          </div>

          {/* VIEWING / APPOINTMENT */}
          <div className="border-t border-line pt-5">
            <p className="mb-2 text-xs font-medium tracking-wide text-ink-soft uppercase">Viewing / Appointment</p>

            {nextAppointment && (
              <div className="mb-4 rounded-xl border border-line bg-paper p-4">
                <p className="text-xs font-semibold tracking-wide text-brand uppercase">Next Appointment</p>
                <p className="mt-1 text-sm font-medium text-ink">{formatDateTime(nextAppointment.scheduled_at)}</p>
                {nextAppointment.note && <p className="mt-1 text-sm text-ink-soft">{nextAppointment.note}</p>}
              </div>
            )}

            {!showForm ? (
              <button
                type="button"
                onClick={() => setShowForm(true)}
                className="rounded-lg border border-line px-3 py-1.5 text-sm font-medium text-ink hover:bg-paper"
              >
                {nextAppointment ? "Reschedule Viewing" : "Schedule Viewing"}
              </button>
            ) : (
              <div className="space-y-3 rounded-xl border border-line p-4">
                <div className="grid grid-cols-2 gap-3">
                  <label className="block">
                    <span className="mb-1 block text-xs font-medium text-ink">Date</span>
                    <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={inputClasses} />
                  </label>
                  <label className="block">
                    <span className="mb-1 block text-xs font-medium text-ink">Time</span>
                    <input type="time" value={time} onChange={(e) => setTime(e.target.value)} className={inputClasses} />
                  </label>
                </div>
                <label className="block">
                  <span className="mb-1 block text-xs font-medium text-ink">Note (optional)</span>
                  <textarea
                    rows={2}
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    className={inputClasses}
                    placeholder="e.g. meet at the gate, bring ID"
                  />
                </label>
                {scheduleError && <p className="text-xs text-red-600">{scheduleError}</p>}
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleScheduleViewing}
                    disabled={scheduling}
                    className="rounded-lg bg-brand px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-soft disabled:opacity-60"
                  >
                    {scheduling ? "Scheduling…" : "Schedule Viewing"}
                  </button>
                  {(appointments.length > 0 || !scheduling) && (
                    <button
                      type="button"
                      onClick={() => {
                        setShowForm(false);
                        setScheduleError(null);
                      }}
                      disabled={scheduling}
                      className="rounded-lg border border-line px-3 py-1.5 text-sm font-medium text-ink hover:bg-paper"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </div>
            )}
            {scheduleSuccess && !scheduleError && <p className="mt-2 text-xs text-green-700">Viewing scheduled — status set to Lead.</p>}
          </div>

          {/* ACTIONS */}
          <div className="border-t border-line pt-5">
            <button
              type="button"
              disabled
              title="Messages coming soon"
              className="w-full cursor-not-allowed rounded-xl border border-line px-4 py-2.5 text-sm font-medium text-ink-soft"
            >
              Message — coming soon
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
