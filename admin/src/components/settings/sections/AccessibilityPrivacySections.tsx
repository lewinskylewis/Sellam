import { useState } from "react";
import { Field, RadioCards, Select, Toggle } from "../Controls";
import type { SettingsState } from "../../../lib/settingsDefaults";

type Accessibility = SettingsState["accessibility"];
type Privacy = SettingsState["privacy"];

export function AccessibilitySection({ value, onChange }: { value: Accessibility; onChange: (next: Accessibility) => void }) {
  return (
    <div>
      <Field label="Font size" description="Applies across the dashboard's text.">
        <RadioCards
          value={value.fontSize}
          onChange={(v) => onChange({ ...value, fontSize: v })}
          options={[
            { value: "small", label: "Small" },
            { value: "medium", label: "Medium" },
            { value: "large", label: "Large" },
          ]}
        />
      </Field>
      <Field label="Reduced motion" description="Minimizes animation and transitions.">
        <Toggle checked={value.reducedMotion} onChange={(v) => onChange({ ...value, reducedMotion: v })} />
      </Field>
      <Field label="High contrast">
        <Toggle checked={value.highContrast} onChange={(v) => onChange({ ...value, highContrast: v })} />
      </Field>
      <Field label="Keyboard navigation hints">
        <Toggle checked={value.keyboardNav} onChange={(v) => onChange({ ...value, keyboardNav: v })} />
      </Field>
      <Field label="Tooltips" description="Show helper tooltips on hover.">
        <Toggle checked={value.tooltips} onChange={(v) => onChange({ ...value, tooltips: v })} />
      </Field>
      <Field label="Confirmation prompts" description="Ask before leaving forms with unsaved changes.">
        <Toggle checked={value.confirmPrompts} onChange={(v) => onChange({ ...value, confirmPrompts: v })} />
      </Field>
    </div>
  );
}

export function PrivacySection({ value, onChange, onExport, onResetPreferences }: { value: Privacy; onChange: (next: Privacy) => void; onExport: () => void; onResetPreferences: () => void }) {
  const [confirmingReset, setConfirmingReset] = useState(false);

  return (
    <div className="divide-y divide-line">
      <section>
        <h4 className="mb-1 text-sm font-semibold text-ink">Activity History</h4>
        <Field label="Retention preference">
          <Select
            value={value.retention}
            onChange={(v) => onChange({ ...value, retention: v as Privacy["retention"] })}
            options={[
              { value: "30", label: "30 days" },
              { value: "90", label: "90 days" },
              { value: "365", label: "1 year" },
              { value: "forever", label: "Keep forever" },
            ]}
          />
        </Field>
        <Field label="Show activity timestamps">
          <Toggle checked={value.showTimestamps} onChange={(v) => onChange({ ...value, showTimestamps: v })} />
        </Field>
        <Field label="Show user activity indicators">
          <Toggle checked={value.showActivityIndicators} onChange={(v) => onChange({ ...value, showActivityIndicators: v })} />
        </Field>
      </section>

      <section className="pt-6">
        <h4 className="mb-1 text-sm font-semibold text-ink">Privacy</h4>
        <Field label="Profile visibility">
          <RadioCards
            value={value.profileVisibility}
            onChange={(v) => onChange({ ...value, profileVisibility: v })}
            options={[
              { value: "everyone", label: "Everyone" },
              { value: "team", label: "Team only" },
              { value: "private", label: "Private" },
            ]}
          />
        </Field>
        <Field label="Contact information visibility">
          <RadioCards
            value={value.contactVisibility}
            onChange={(v) => onChange({ ...value, contactVisibility: v })}
            options={[
              { value: "everyone", label: "Everyone" },
              { value: "team", label: "Team only" },
              { value: "private", label: "Private" },
            ]}
          />
        </Field>
        <Field label="Activity visibility">
          <RadioCards
            value={value.activityVisibility}
            onChange={(v) => onChange({ ...value, activityVisibility: v })}
            options={[
              { value: "everyone", label: "Everyone" },
              { value: "team", label: "Team only" },
              { value: "private", label: "Private" },
            ]}
          />
        </Field>
      </section>

      <section className="pt-6">
        <h4 className="mb-3 text-sm font-semibold text-ink">Data Controls</h4>
        <div className="flex flex-wrap gap-3">
          <button type="button" onClick={onExport} className="rounded-lg border border-line px-4 py-2 text-sm font-medium text-ink hover:border-brand hover:text-brand">
            Export my settings
          </button>
          <button type="button" onClick={() => setConfirmingReset(true)} className="rounded-lg border border-line px-4 py-2 text-sm font-medium text-ink hover:border-red-400 hover:text-red-600">
            Reset dashboard preferences
          </button>
        </div>
      </section>

      {confirmingReset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4" role="dialog" aria-modal="true">
          <div className="w-full max-w-sm rounded-2xl border border-line bg-white p-6 shadow-2xl">
            <h3 className="text-base font-semibold text-ink">Reset dashboard preferences?</h3>
            <p className="mt-2 text-sm text-ink-soft">This will restore every Settings category to its default configuration. This only affects local preferences on this device.</p>
            <div className="mt-5 flex justify-end gap-2">
              <button type="button" onClick={() => setConfirmingReset(false)} className="rounded-lg border border-line px-4 py-2 text-sm font-medium text-ink hover:bg-paper">
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  onResetPreferences();
                  setConfirmingReset(false);
                }}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
              >
                Reset
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
