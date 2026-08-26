// Maps the real properties.status values (see
// properties_status_allowed check in
// supabase/migrations/202608251200_create_properties_schema.sql).
function presentation(status: string): { label: string; bg: string; text: string } {
  switch (status) {
    case "available":
      return { label: "Available", bg: "var(--color-status-green-bg)", text: "var(--color-status-green-text)" };
    case "under-offer":
      return { label: "Under Offer", bg: "var(--color-status-amber-bg)", text: "var(--color-status-amber-text)" };
    case "let":
      return { label: "Let", bg: "var(--color-status-blue-bg)", text: "var(--color-status-blue-text)" };
    case "sold":
      return { label: "Sold", bg: "var(--color-status-gray-bg)", text: "var(--color-status-gray-text)" };
    default:
      return { label: status, bg: "var(--color-status-gray-bg)", text: "var(--color-status-gray-text)" };
  }
}

export default function PropertyStatusBadge({ status }: { status: string }) {
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
