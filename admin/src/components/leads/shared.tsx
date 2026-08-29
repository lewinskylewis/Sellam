import type { ReactNode } from "react";
import type { Stage } from "../../lib/leadsData";

// Deliberately restrained — a subtle tint per stage, not a rainbow of CRM
// pipeline colours.
const STAGE_STYLES: Record<Stage, string> = {
  New: "bg-sky-50 text-sky-700",
  Contacted: "bg-amber-50 text-amber-800",
  Qualified: "bg-violet-50 text-violet-700",
  Viewing: "bg-teal-50 text-teal-700",
  Negotiation: "bg-orange-50 text-orange-700",
  Won: "bg-emerald-50 text-emerald-700",
  Lost: "bg-red-50 text-red-700",
};

export function StageBadge({ stage }: { stage: Stage }) {
  return <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${STAGE_STYLES[stage]}`}>{stage}</span>;
}

export function TypeBadge({ type }: { type: "Lead" | "Client" }) {
  return (
    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide ${type === "Client" ? "bg-ink text-white" : "bg-paper text-ink-soft"}`}>
      {type}
    </span>
  );
}

export function formatRelative(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const sameDay = d.toDateString() === now.toDateString();
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const isYesterday = d.toDateString() === yesterday.toDateString();
  const time = d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
  if (sameDay) return `Today, ${time}`;
  if (isYesterday) return `Yesterday, ${time}`;
  return d.toLocaleDateString(undefined, { day: "2-digit", month: "short" });
}

export function formatMoney(value: number | null, currency: string) {
  if (value == null) return "—";
  return `${currency} ${value.toLocaleString()}`;
}

export function ConfirmDialog({
  title,
  description,
  confirmLabel,
  destructive,
  onCancel,
  onConfirm,
}: {
  title: string;
  description: string;
  confirmLabel: string;
  destructive?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 px-4" role="dialog" aria-modal="true">
      <div className="w-full max-w-sm rounded-2xl border border-line bg-white p-6 shadow-2xl">
        <h3 className="text-base font-semibold text-ink">{title}</h3>
        <p className="mt-2 text-sm text-ink-soft">{description}</p>
        <div className="mt-5 flex justify-end gap-2">
          <button type="button" onClick={onCancel} className="rounded-lg border border-line px-4 py-2 text-sm font-medium text-ink hover:bg-paper">
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`rounded-lg px-4 py-2 text-sm font-semibold text-white ${destructive ? "bg-red-600 hover:bg-red-700" : "bg-brand hover:opacity-90"}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

export function EmptyState({ icon, title, description, action }: { icon?: ReactNode; title: string; description?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
      {icon && <div className="mb-3 text-line">{icon}</div>}
      <p className="text-sm font-medium text-ink">{title}</p>
      {description && <p className="mt-1 max-w-xs text-sm text-ink-soft">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function Toast({ message }: { message: string }) {
  return (
    <div className="fixed right-6 bottom-6 z-[70] flex items-center gap-2 rounded-xl bg-ink px-4 py-3 text-sm font-medium text-white shadow-2xl">
      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-xs">✓</span>
      {message}
    </div>
  );
}
