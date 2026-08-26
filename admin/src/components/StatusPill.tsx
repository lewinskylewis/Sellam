// Maps the real property_enquiries.status values (see
// supabase/migrations/202607200001_create_property_enquiries.sql) to the
// two-state "contacted / not contacted" vocabulary the Overview design uses.
function presentation(status: string): { label: string; bg: string; text: string } {
  switch (status) {
    case "contacted":
      return { label: "Contacted", bg: "var(--color-status-green-bg)", text: "var(--color-status-green-text)" };
    case "closed":
      return { label: "Closed", bg: "var(--color-status-gray-bg)", text: "var(--color-status-gray-text)" };
    case "spam":
      return { label: "Spam", bg: "var(--color-status-gray-bg)", text: "var(--color-status-gray-text)" };
    default:
      // new, notified, email_failed — none have been personally contacted yet
      return { label: "Not contacted", bg: "var(--color-status-blue-bg)", text: "var(--color-status-blue-text)" };
  }
}

export default function StatusPill({ status }: { status: string }) {
  const { label, bg, text } = presentation(status);
  return (
    <span
      className="inline-block rounded-full px-3 py-1 text-xs font-medium whitespace-nowrap"
      style={{ backgroundColor: bg, color: text }}
    >
      {label}
    </span>
  );
}
