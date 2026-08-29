import { Field, TextInput, Toggle } from "../Controls";
import type { SettingsState } from "../../../lib/settingsDefaults";

type Email = SettingsState["email"];

export default function EmailSection({ value, onChange }: { value: Email; onChange: (next: Email) => void }) {
  const { sender, communication, signature } = value;

  function patchComm(key: string, enabled: boolean) {
    onChange({ ...value, communication: communication.map((c) => (c.key === key ? { ...c, enabled } : c)) });
  }

  return (
    <div className="divide-y divide-line">
      <section>
        <h4 className="mb-1 text-sm font-semibold text-ink">Sender Defaults</h4>
        <p className="mb-2 text-xs text-ink-soft">Configuration only — no email provider is connected from this screen.</p>
        <Field label="Sender name">
          <TextInput value={sender.name} onChange={(e) => onChange({ ...value, sender: { ...sender, name: e.target.value } })} />
        </Field>
        <Field label="Sender email">
          <TextInput type="email" value={sender.email} onChange={(e) => onChange({ ...value, sender: { ...sender, email: e.target.value } })} />
        </Field>
        <Field label="Reply-to email">
          <TextInput type="email" value={sender.replyTo} onChange={(e) => onChange({ ...value, sender: { ...sender, replyTo: e.target.value } })} />
        </Field>
      </section>

      <section className="pt-6">
        <h4 className="mb-3 text-sm font-semibold text-ink">Communication Preferences</h4>
        <div className="space-y-2.5">
          {communication.map((c) => (
            <div key={c.key} className="flex items-center justify-between rounded-lg border border-line px-4 py-2.5">
              <span className="text-sm text-ink">{c.label}</span>
              <Toggle checked={c.enabled} onChange={(v) => patchComm(c.key, v)} label={c.label} />
            </div>
          ))}
        </div>
      </section>

      <section className="pt-6">
        <h4 className="mb-3 text-sm font-semibold text-ink">Signature</h4>
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          <div>
            <Field label="Name">
              <TextInput value={signature.name} onChange={(e) => onChange({ ...value, signature: { ...signature, name: e.target.value } })} />
            </Field>
            <Field label="Position">
              <TextInput value={signature.position} onChange={(e) => onChange({ ...value, signature: { ...signature, position: e.target.value } })} />
            </Field>
            <Field label="Phone">
              <TextInput value={signature.phone} onChange={(e) => onChange({ ...value, signature: { ...signature, phone: e.target.value } })} />
            </Field>
            <Field label="Email">
              <TextInput value={signature.email} onChange={(e) => onChange({ ...value, signature: { ...signature, email: e.target.value } })} />
            </Field>
            <Field label="Website">
              <TextInput value={signature.website} onChange={(e) => onChange({ ...value, signature: { ...signature, website: e.target.value } })} />
            </Field>
            <Field label="LinkedIn">
              <TextInput value={signature.linkedin} onChange={(e) => onChange({ ...value, signature: { ...signature, linkedin: e.target.value } })} />
            </Field>
            <Field label="Instagram">
              <TextInput value={signature.instagram} onChange={(e) => onChange({ ...value, signature: { ...signature, instagram: e.target.value } })} />
            </Field>
            <Field label="Include logo">
              <Toggle checked={signature.includeLogo} onChange={(v) => onChange({ ...value, signature: { ...signature, includeLogo: v } })} />
            </Field>
          </div>

          <div>
            <p className="mb-2 text-xs font-medium tracking-wide text-ink-soft uppercase">Live preview</p>
            <div className="rounded-xl border border-line bg-white p-5 shadow-[0_8px_30px_rgba(15,23,42,0.08)]">
              <div className="flex items-start gap-3">
                {signature.includeLogo && (
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-brand text-xs font-bold text-white">S</div>
                )}
                <div className="min-w-0">
                  <p className="font-semibold text-ink">{signature.name || "Your Name"}</p>
                  <p className="text-sm text-ink-soft">{signature.position || "Position"}</p>
                  <div className="mt-2 space-y-0.5 text-xs text-ink-soft">
                    {signature.phone && <p>{signature.phone}</p>}
                    {signature.email && <p>{signature.email}</p>}
                    {signature.website && <p>{signature.website}</p>}
                  </div>
                  {(signature.linkedin || signature.instagram) && (
                    <div className="mt-2 flex gap-2 text-xs text-brand">
                      {signature.linkedin && <span>LinkedIn</span>}
                      {signature.instagram && <span>Instagram</span>}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
