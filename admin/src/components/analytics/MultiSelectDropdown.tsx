import { useEffect, useRef, useState } from "react";
import { ChevronDownIcon } from "../icons";

export default function MultiSelectDropdown<T extends string>({
  label,
  options,
  selected,
  onChange,
}: {
  label: string;
  options: { value: T; label: string }[];
  selected: T[];
  onChange: (next: T[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onDocClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  function toggle(value: T) {
    onChange(selected.includes(value) ? selected.filter((v) => v !== value) : [...selected, value]);
  }

  const summary = selected.length === 0 ? "All" : selected.length === 1 ? options.find((o) => o.value === selected[0])?.label ?? "1 selected" : `${selected.length} selected`;

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`flex items-center gap-1.5 rounded-xl border px-3 py-2 text-sm ${selected.length ? "border-brand/40 bg-brand/5 text-ink" : "border-line bg-surface text-ink"}`}
      >
        <span className="text-ink-soft">{label}:</span> {summary}
        <ChevronDownIcon className={`h-3.5 w-3.5 text-ink-soft transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="absolute left-0 z-20 mt-1.5 max-h-64 w-56 overflow-y-auto rounded-xl border border-line bg-white p-1.5 shadow-[0_8px_30px_rgba(15,23,42,0.14)]">
          {options.map((opt) => (
            <label key={opt.value} className="flex cursor-pointer items-center gap-2 rounded-lg px-2.5 py-1.5 text-sm hover:bg-paper">
              <input type="checkbox" checked={selected.includes(opt.value)} onChange={() => toggle(opt.value)} className="h-3.5 w-3.5 rounded border-line accent-[#15213a]" />
              {opt.label}
            </label>
          ))}
          {selected.length > 0 && (
            <button type="button" onClick={() => onChange([])} className="mt-1 w-full rounded-lg px-2.5 py-1.5 text-left text-xs font-medium text-ink-soft hover:bg-paper hover:text-ink">
              Clear
            </button>
          )}
        </div>
      )}
    </div>
  );
}
