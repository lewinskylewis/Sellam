import { Field, RadioCards, Select, TextInput, Toggle } from "../Controls";
import type { SettingsState } from "../../../lib/settingsDefaults";

type EnquiryLead = SettingsState["enquiryLead"];

export default function EnquiryLeadSection({ value, onChange }: { value: EnquiryLead; onChange: (next: EnquiryLead) => void }) {
  const { enquiry, lead, viewing } = value;

  return (
    <div className="divide-y divide-line">
      <p className="mb-4 rounded-lg bg-paper px-4 py-2.5 text-xs text-ink-soft">
        Configuration only — managing individual enquiries and leads happens in the Enquiries and Leads &amp; Clients modules.
      </p>

      <section>
        <h4 className="mb-1 text-sm font-semibold text-ink">Enquiry Defaults</h4>
        <Field label="Default enquiry status">
          <TextInput value={enquiry.defaultStatus} onChange={(e) => onChange({ ...value, enquiry: { ...enquiry, defaultStatus: e.target.value } })} />
        </Field>
        <Field label="Auto-mark incoming enquiries as new">
          <Toggle checked={enquiry.autoMarkNew} onChange={(v) => onChange({ ...value, enquiry: { ...enquiry, autoMarkNew: v } })} />
        </Field>
        <Field label="Default assignment behaviour">
          <RadioCards
            value={enquiry.defaultAssignment}
            onChange={(v) => onChange({ ...value, enquiry: { ...enquiry, defaultAssignment: v } })}
            options={[
              { value: "unassigned", label: "Leave unassigned" },
              { value: "round-robin", label: "Round-robin" },
              { value: "team-lead", label: "Assign to team lead" },
            ]}
          />
        </Field>
        <Field label="Duplicate enquiry handling">
          <RadioCards
            value={enquiry.duplicateHandling}
            onChange={(v) => onChange({ ...value, enquiry: { ...enquiry, duplicateHandling: v } })}
            options={[
              { value: "merge", label: "Merge into existing" },
              { value: "flag", label: "Flag for review" },
              { value: "allow", label: "Allow duplicates" },
            ]}
          />
        </Field>
        <Field label="Spam handling preference">
          <RadioCards
            value={enquiry.spamHandling}
            onChange={(v) => onChange({ ...value, enquiry: { ...enquiry, spamHandling: v } })}
            options={[
              { value: "auto-hide", label: "Auto-hide" },
              { value: "flag-only", label: "Flag only" },
              { value: "off", label: "Off" },
            ]}
          />
        </Field>
      </section>

      <section className="pt-6">
        <h4 className="mb-1 text-sm font-semibold text-ink">Lead Defaults</h4>
        <Field label="Default lead status">
          <TextInput value={lead.defaultStatus} onChange={(e) => onChange({ ...value, lead: { ...lead, defaultStatus: e.target.value } })} />
        </Field>
        <Field label="Follow-up reminder default (days)">
          <TextInput type="number" min={1} max={30} value={lead.followUpReminderDays} onChange={(e) => onChange({ ...value, lead: { ...lead, followUpReminderDays: Number(e.target.value) } })} className="max-w-[100px]" />
        </Field>
        <Field label="Lead qualification behaviour">
          <RadioCards
            value={lead.qualificationBehaviour}
            onChange={(v) => onChange({ ...value, lead: { ...lead, qualificationBehaviour: v } })}
            options={[
              { value: "manual", label: "Manual" },
              { value: "auto-score", label: "Auto-score" },
            ]}
          />
        </Field>
        <Field label="Default source">
          <Select
            value={lead.defaultSource}
            onChange={(v) => onChange({ ...value, lead: { ...lead, defaultSource: v } })}
            options={["Website", "Referral", "Walk-in", "Phone", "Social Media"].map((v) => ({ value: v, label: v }))}
          />
        </Field>
      </section>

      <section className="pt-6">
        <h4 className="mb-1 text-sm font-semibold text-ink">Viewing Defaults</h4>
        <Field label="Default viewing duration (minutes)">
          <Select
            value={String(viewing.defaultDuration)}
            onChange={(v) => onChange({ ...value, viewing: { ...viewing, defaultDuration: Number(v) } })}
            options={["15", "30", "45", "60", "90"].map((v) => ({ value: v, label: `${v} minutes` }))}
          />
        </Field>
        <Field label="Default reminder period (minutes before)">
          <Select
            value={String(viewing.defaultReminderPeriod)}
            onChange={(v) => onChange({ ...value, viewing: { ...viewing, defaultReminderPeriod: Number(v) } })}
            options={["15", "30", "60", "120", "1440"].map((v) => ({ value: v, label: Number(v) >= 60 ? `${Number(v) / 60} hour(s) before` : `${v} minutes before` }))}
          />
        </Field>
        <Field label="Default appointment note">
          <TextInput value={viewing.defaultNote} onChange={(e) => onChange({ ...value, viewing: { ...viewing, defaultNote: e.target.value } })} />
        </Field>
        <Field label="Default viewing status">
          <TextInput value={viewing.defaultStatus} onChange={(e) => onChange({ ...value, viewing: { ...viewing, defaultStatus: e.target.value } })} />
        </Field>
      </section>
    </div>
  );
}
