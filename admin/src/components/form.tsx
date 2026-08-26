import type { ReactNode } from "react";

export const inputClasses =
  "w-full rounded-xl border border-line bg-white px-3 py-2 text-sm text-ink outline-none focus:border-brand focus:ring-1 focus:ring-brand disabled:bg-paper disabled:text-ink-soft";

export function Field({
  label,
  required,
  error,
  hint,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-ink">
        {label}
        {required && <span className="text-red-600"> *</span>}
      </span>
      {children}
      {hint && !error && <span className="mt-1 block text-xs text-ink-soft">{hint}</span>}
      {error && <span className="mt-1 block text-xs text-red-600">{error}</span>}
    </label>
  );
}

export function SectionCard({ title, subtitle, children }: { title: string; subtitle?: string; children: ReactNode }) {
  return (
    <section className="rounded-2xl border border-line bg-surface p-6 shadow-[0_2px_8px_rgba(15,23,42,0.05)]">
      <h2 className="text-lg font-bold text-ink">{title}</h2>
      {subtitle && <p className="mt-0.5 text-sm text-ink-soft">{subtitle}</p>}
      <div className="mt-5 space-y-5">{children}</div>
    </section>
  );
}
