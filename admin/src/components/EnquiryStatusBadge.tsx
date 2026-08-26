import { ADMIN_STATUS_LABELS, normalizeStatus, type AdminStatus } from "../lib/enquiries";

const COLORS: Record<AdminStatus, { bg: string; text: string }> = {
  "not-contacted": { bg: "var(--color-status-blue-bg)", text: "var(--color-status-blue-text)" },
  contacted: { bg: "var(--color-status-amber-bg)", text: "var(--color-status-amber-text)" },
  lead: { bg: "var(--color-status-green-bg)", text: "var(--color-status-green-text)" },
  closed: { bg: "var(--color-status-gray-bg)", text: "var(--color-status-gray-text)" },
  sale: { bg: "var(--color-status-green-bg)", text: "var(--color-status-green-text)" },
  spam: { bg: "var(--color-status-gray-bg)", text: "var(--color-status-gray-text)" },
};

export default function EnquiryStatusBadge({ status }: { status: string }) {
  const adminStatus = normalizeStatus(status);
  const { bg, text } = COLORS[adminStatus];
  return (
    <span
      className="inline-block rounded-full px-3 py-1 text-xs font-medium whitespace-nowrap"
      style={{ backgroundColor: bg, color: text }}
    >
      {ADMIN_STATUS_LABELS[adminStatus]}
    </span>
  );
}
