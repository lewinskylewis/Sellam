import type { ReactNode } from "react";

// Shared, reused visual primitives for the Settings module — kept local to
// this folder rather than the general components/ directory since their
// spacing/sizing is tuned specifically for dense settings forms.

export function SectionHeading({ title, description, onReset }: { title: string; description?: string; onReset?: () => void }) {
  return (
    <div className="mb-5 flex items-start justify-between gap-4 border-b border-line pb-3">
      <div>
        <h3 className="text-sm font-semibold tracking-wide text-ink uppercase">{title}</h3>
        {description && <p className="mt-1 text-sm text-ink-soft">{description}</p>}
      </div>
      {onReset && (
        <button type="button" onClick={onReset} className="shrink-0 text-xs font-medium text-ink-soft underline decoration-line underline-offset-2 hover:text-brand">
          Reset to defaults
        </button>
      )}
    </div>
  );
}

export function Field({ label, description, htmlFor, children }: { label: string; description?: string; htmlFor?: string; children: ReactNode }) {
  return (
    <div className="grid grid-cols-1 gap-1.5 py-3 sm:grid-cols-[220px_1fr] sm:items-start sm:gap-6">
      <label htmlFor={htmlFor} className="pt-2 text-sm font-medium text-ink">
        {label}
      </label>
      <div className="min-w-0">
        {children}
        {description && <p className="mt-1.5 text-xs text-ink-soft">{description}</p>}
      </div>
    </div>
  );
}

const inputClasses =
  "w-full max-w-md rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink outline-none transition-colors focus:border-brand focus:ring-1 focus:ring-brand disabled:cursor-not-allowed disabled:bg-paper disabled:text-ink-soft";

export function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`${inputClasses} ${props.className ?? ""}`} />;
}

export function TextArea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={`${inputClasses} resize-none ${props.className ?? ""}`} />;
}

export function Select({ value, onChange, options, disabled }: { value: string; onChange: (v: string) => void; options: { value: string; label: string }[]; disabled?: boolean }) {
  return (
    <select
      value={value}
      disabled={disabled}
      onChange={(e) => onChange(e.target.value)}
      className={`${inputClasses} max-w-xs appearance-none bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 24 24%22 fill=%22none%22 stroke=%22%236b7280%22 stroke-width=%221.6%22><path d=%22m6 9 6 6 6-6%22/></svg>')] bg-[length:16px] bg-[right_10px_center] bg-no-repeat pr-9`}
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

export function Toggle({ checked, onChange, disabled, label }: { checked: boolean; onChange: (v: boolean) => void; disabled?: boolean; label?: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
        checked ? "bg-brand" : "bg-line"
      }`}
    >
      <span className={`inline-block h-4.5 w-4.5 transform rounded-full bg-white shadow transition-transform ${checked ? "translate-x-[22px]" : "translate-x-[3px]"}`} />
    </button>
  );
}

export function RadioCards<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string; description?: string }[];
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className={`rounded-lg border px-3.5 py-2 text-left text-sm transition-colors ${
            value === o.value ? "border-brand bg-brand/5 text-brand" : "border-line text-ink hover:border-ink-soft"
          }`}
        >
          <span className="block font-medium">{o.label}</span>
          {o.description && <span className="block text-xs text-ink-soft">{o.description}</span>}
        </button>
      ))}
    </div>
  );
}

export function Checkbox({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-ink">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="h-4 w-4 rounded border-line text-brand focus:ring-brand" />
      {label}
    </label>
  );
}
