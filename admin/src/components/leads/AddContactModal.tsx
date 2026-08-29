import { useState } from "react";
import { AGENTS, COMMUNITIES, INTENTS, SOURCES, blankContact, type Contact, type Intent, type LeadSource } from "../../lib/leadsData";

const inputClasses = "w-full rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink outline-none focus:border-brand focus:ring-1 focus:ring-brand";
const labelClasses = "mb-1 block text-xs font-medium text-ink-soft";

export default function AddContactModal({ onClose, onCreate }: { onClose: () => void; onCreate: (contact: Contact) => void }) {
  const [draft, setDraft] = useState<Contact>(() => blankContact());
  const [errors, setErrors] = useState<Record<string, string>>({});

  function patch(fields: Partial<Contact>) {
    setDraft((prev) => ({ ...prev, ...fields }));
  }

  function toggleLocation(loc: string) {
    setDraft((prev) => ({
      ...prev,
      preferredLocations: prev.preferredLocations.includes(loc) ? prev.preferredLocations.filter((l) => l !== loc) : [...prev.preferredLocations, loc],
    }));
  }

  function handleSubmit() {
    const nextErrors: Record<string, string> = {};
    if (!draft.firstName.trim()) nextErrors.firstName = "First name is required.";
    if (!draft.lastName.trim()) nextErrors.lastName = "Last name is required.";
    if (!draft.email.trim() && !draft.phone.trim()) nextErrors.contact = "Provide at least an email or phone number.";
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;
    onCreate(draft);
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/40 sm:items-center sm:px-4" role="dialog" aria-modal="true">
      <div className="max-h-[90vh] w-full overflow-y-auto rounded-t-2xl border border-line bg-white p-6 shadow-2xl sm:max-w-lg sm:rounded-2xl">
        <h3 className="text-lg font-semibold text-ink">Add Contact</h3>
        <p className="mt-1 text-sm text-ink-soft">New contacts start as a Lead — you can convert them to a Client later.</p>

        <div className="mt-5 grid grid-cols-2 gap-3">
          <div>
            <label className={labelClasses}>First name</label>
            <input className={inputClasses} value={draft.firstName} onChange={(e) => patch({ firstName: e.target.value })} />
            {errors.firstName && <p className="mt-1 text-xs text-red-600">{errors.firstName}</p>}
          </div>
          <div>
            <label className={labelClasses}>Last name</label>
            <input className={inputClasses} value={draft.lastName} onChange={(e) => patch({ lastName: e.target.value })} />
            {errors.lastName && <p className="mt-1 text-xs text-red-600">{errors.lastName}</p>}
          </div>
          <div>
            <label className={labelClasses}>Email</label>
            <input type="email" className={inputClasses} value={draft.email} onChange={(e) => patch({ email: e.target.value })} />
          </div>
          <div>
            <label className={labelClasses}>Phone</label>
            <input className={inputClasses} value={draft.phone} onChange={(e) => patch({ phone: e.target.value })} />
          </div>
          {errors.contact && <p className="col-span-2 -mt-1 text-xs text-red-600">{errors.contact}</p>}

          <div>
            <label className={labelClasses}>Source</label>
            <select className={inputClasses} value={draft.source} onChange={(e) => patch({ source: e.target.value as LeadSource })}>
              {SOURCES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClasses}>Intent</label>
            <select className={inputClasses} value={draft.intent} onChange={(e) => patch({ intent: e.target.value as Intent })}>
              {INTENTS.map((i) => (
                <option key={i} value={i}>
                  {i}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className={labelClasses}>Min budget ({draft.currency})</label>
            <input type="number" className={inputClasses} value={draft.budgetMin ?? ""} onChange={(e) => patch({ budgetMin: e.target.value ? Number(e.target.value) : null })} />
          </div>
          <div>
            <label className={labelClasses}>Max budget ({draft.currency})</label>
            <input type="number" className={inputClasses} value={draft.budgetMax ?? ""} onChange={(e) => patch({ budgetMax: e.target.value ? Number(e.target.value) : null })} />
          </div>

          <div className="col-span-2">
            <label className={labelClasses}>Preferred locations</label>
            <div className="flex flex-wrap gap-1.5">
              {COMMUNITIES.map((loc) => (
                <button
                  key={loc}
                  type="button"
                  onClick={() => toggleLocation(loc)}
                  className={`rounded-full border px-2.5 py-1 text-xs font-medium transition-colors ${
                    draft.preferredLocations.includes(loc) ? "border-brand bg-brand/5 text-brand" : "border-line text-ink-soft hover:border-ink-soft"
                  }`}
                >
                  {loc}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className={labelClasses}>Property type</label>
            <input className={inputClasses} value={draft.propertyType} onChange={(e) => patch({ propertyType: e.target.value })} placeholder="Apartment, Villa…" />
          </div>
          <div>
            <label className={labelClasses}>Assigned agent</label>
            <select className={inputClasses} value={draft.assignedAgent} onChange={(e) => patch({ assignedAgent: e.target.value as Contact["assignedAgent"] })}>
              {AGENTS.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
          </div>

          <div className="col-span-2">
            <label className={labelClasses}>Notes</label>
            <textarea rows={2} className={`${inputClasses} resize-none`} value={draft.otherRequirements} onChange={(e) => patch({ otherRequirements: e.target.value })} />
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded-lg border border-line px-4 py-2 text-sm font-medium text-ink hover:bg-paper">
            Cancel
          </button>
          <button type="button" onClick={handleSubmit} className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:opacity-90">
            Add Contact
          </button>
        </div>
      </div>
    </div>
  );
}
