import { useRef, useState } from "react";
import { Field, RadioCards, Select, TextArea, TextInput, Toggle } from "../Controls";
import type { SettingsState } from "../../../lib/settingsDefaults";
import { MAX_FAVICON_BYTES, MAX_LOGO_BYTES, uploadSiteAsset, validateSiteAssetFile } from "../../../lib/siteAssetsStorage";

type General = SettingsState["general"];

function AssetUploader({
  label,
  currentUrl,
  maxBytes,
  previewClassName,
  placeholder,
  onUploaded,
}: {
  label: string;
  currentUrl: string | null;
  maxBytes: number;
  previewClassName: string;
  placeholder: string;
  onUploaded: (url: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(file: File | undefined) {
    if (!file) return;
    setError(null);
    const validationError = validateSiteAssetFile(file, maxBytes);
    if (validationError) {
      setError(validationError);
      return;
    }
    setUploading(true);
    try {
      const kind = label.toLowerCase().includes("favicon") ? "favicon" : "logo";
      const { publicUrl } = await uploadSiteAsset(kind, file);
      onUploaded(publicUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div>
      <div className="flex items-center gap-3">
        <div className={`flex items-center justify-center overflow-hidden rounded-xl border border-line bg-paper text-ink-soft ${previewClassName}`}>
          {currentUrl ? <img src={currentUrl} alt={label} className="h-full w-full object-contain" /> : <span className="text-[10px]">{placeholder}</span>}
        </div>
        <button
          type="button"
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
          className="rounded-lg border border-line px-3 py-1.5 text-sm font-medium text-ink hover:border-brand hover:text-brand disabled:opacity-60"
        >
          {uploading ? "Uploading…" : currentUrl ? "Replace" : "Upload"}
        </button>
        <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleFile(e.target.files?.[0])} />
      </div>
      {error && <p className="mt-1.5 text-xs text-red-600">{error}</p>}
    </div>
  );
}

export default function GeneralSection({ value, onChange }: { value: General; onChange: (next: General) => void }) {
  const { company, branding, regional, preferences } = value;

  return (
    <div className="divide-y divide-line">
      <section>
        <h4 className="mb-1 text-sm font-semibold text-ink">Company Information</h4>
        <Field label="Company name" htmlFor="company-name">
          <TextInput id="company-name" value={company.name} onChange={(e) => onChange({ ...value, company: { ...company, name: e.target.value } })} />
        </Field>
        <Field label="Legal / business name">
          <TextInput value={company.legalName} onChange={(e) => onChange({ ...value, company: { ...company, legalName: e.target.value } })} />
        </Field>
        <Field label="Company description">
          <TextArea rows={3} value={company.description} onChange={(e) => onChange({ ...value, company: { ...company, description: e.target.value } })} />
        </Field>
        <Field label="Website">
          <TextInput value={company.website} onChange={(e) => onChange({ ...value, company: { ...company, website: e.target.value } })} />
        </Field>
        <Field label="Phone">
          <TextInput value={company.phone} onChange={(e) => onChange({ ...value, company: { ...company, phone: e.target.value } })} />
        </Field>
        <Field label="Email">
          <TextInput type="email" value={company.email} onChange={(e) => onChange({ ...value, company: { ...company, email: e.target.value } })} />
        </Field>
        <Field label="WhatsApp">
          <TextInput value={company.whatsapp} onChange={(e) => onChange({ ...value, company: { ...company, whatsapp: e.target.value } })} />
        </Field>
        <Field label="Physical address">
          <TextInput value={company.address} onChange={(e) => onChange({ ...value, company: { ...company, address: e.target.value } })} />
        </Field>
        <Field label="City">
          <TextInput value={company.city} onChange={(e) => onChange({ ...value, company: { ...company, city: e.target.value } })} />
        </Field>
        <Field label="Country">
          <TextInput value={company.country} onChange={(e) => onChange({ ...value, company: { ...company, country: e.target.value } })} />
        </Field>
      </section>

      <section className="pt-6">
        <h4 className="mb-1 text-sm font-semibold text-ink">Branding</h4>
        <Field label="Company logo" description="Used across the dashboard. Remember to click Save changes to keep it.">
          <AssetUploader
            label="Company logo"
            currentUrl={branding.logoUrl}
            maxBytes={MAX_LOGO_BYTES}
            previewClassName="h-14 w-14"
            placeholder="None"
            onUploaded={(url) => onChange({ ...value, branding: { ...branding, logoUrl: url, logoUploaded: true } })}
          />
        </Field>
        <Field label="Favicon">
          <AssetUploader
            label="Favicon"
            currentUrl={branding.faviconUrl}
            maxBytes={MAX_FAVICON_BYTES}
            previewClassName="h-8 w-8"
            placeholder="—"
            onUploaded={(url) => onChange({ ...value, branding: { ...branding, faviconUrl: url, faviconUploaded: true } })}
          />
        </Field>
        <Field label="Brand preview" description="Preview how the logo appears on light and dark surfaces.">
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => onChange({ ...value, branding: { ...branding, previewMode: "light" } })}
              className={`flex h-16 w-28 items-center justify-center overflow-hidden rounded-lg border text-xs font-medium ${branding.previewMode === "light" ? "border-brand ring-1 ring-brand" : "border-line"} bg-white text-ink`}
            >
              {branding.logoUrl ? <img src={branding.logoUrl} alt="Logo preview" className="h-10 w-24 object-contain" /> : "Light"}
            </button>
            <button
              type="button"
              onClick={() => onChange({ ...value, branding: { ...branding, previewMode: "dark" } })}
              className={`flex h-16 w-28 items-center justify-center overflow-hidden rounded-lg border text-xs font-medium ${branding.previewMode === "dark" ? "border-brand ring-1 ring-brand" : "border-line"} bg-ink text-white`}
            >
              {branding.logoUrl ? <img src={branding.logoUrl} alt="Logo preview" className="h-10 w-24 object-contain" /> : "Dark"}
            </button>
          </div>
        </Field>
      </section>

      <section className="pt-6">
        <h4 className="mb-1 text-sm font-semibold text-ink">Regional Settings</h4>
        <Field label="Currency">
          <Select
            value={regional.currency}
            onChange={(v) => onChange({ ...value, regional: { ...regional, currency: v } })}
            options={[
              { value: "KES", label: "KES — Kenyan Shilling" },
              { value: "USD", label: "USD — US Dollar" },
              { value: "EUR", label: "EUR — Euro" },
            ]}
          />
        </Field>
        <Field label="Timezone">
          <Select
            value={regional.timezone}
            onChange={(v) => onChange({ ...value, regional: { ...regional, timezone: v } })}
            options={[
              { value: "Africa/Nairobi (GMT+3)", label: "Africa/Nairobi (GMT+3)" },
              { value: "Africa/Lagos (GMT+1)", label: "Africa/Lagos (GMT+1)" },
              { value: "Europe/London (GMT+0)", label: "Europe/London (GMT+0)" },
            ]}
          />
        </Field>
        <Field label="Date format">
          <Select
            value={regional.dateFormat}
            onChange={(v) => onChange({ ...value, regional: { ...regional, dateFormat: v } })}
            options={[
              { value: "DD/MM/YYYY", label: "DD/MM/YYYY" },
              { value: "MM/DD/YYYY", label: "MM/DD/YYYY" },
              { value: "YYYY-MM-DD", label: "YYYY-MM-DD" },
            ]}
          />
        </Field>
        <Field label="Time format">
          <RadioCards
            value={regional.timeFormat}
            onChange={(v) => onChange({ ...value, regional: { ...regional, timeFormat: v } })}
            options={[
              { value: "24h", label: "24-hour" },
              { value: "12h", label: "12-hour" },
            ]}
          />
        </Field>
        <Field label="Number formatting">
          <Select
            value={regional.numberFormat}
            onChange={(v) => onChange({ ...value, regional: { ...regional, numberFormat: v as typeof regional.numberFormat } })}
            options={[
              { value: "1,000.00", label: "1,000.00" },
              { value: "1.000,00", label: "1.000,00" },
              { value: "1 000.00", label: "1 000.00" },
            ]}
          />
        </Field>
      </section>

      <section className="pt-6">
        <h4 className="mb-1 text-sm font-semibold text-ink">Dashboard Preferences</h4>
        <Field label="Default landing page">
          <Select
            value={preferences.defaultLandingPage}
            onChange={(v) => onChange({ ...value, preferences: { ...preferences, defaultLandingPage: v } })}
            options={["Overview", "Properties", "Enquiries", "Messages"].map((v) => ({ value: v, label: v }))}
          />
        </Field>
        <Field label="Default list density">
          <RadioCards
            value={preferences.listDensity}
            onChange={(v) => onChange({ ...value, preferences: { ...preferences, listDensity: v } })}
            options={[
              { value: "comfortable", label: "Comfortable" },
              { value: "compact", label: "Compact" },
            ]}
          />
        </Field>
        <Field label="Default pagination size">
          <Select
            value={String(preferences.pageSize)}
            onChange={(v) => onChange({ ...value, preferences: { ...preferences, pageSize: Number(v) } })}
            options={["10", "25", "50", "100"].map((v) => ({ value: v, label: `${v} per page` }))}
          />
        </Field>
        <Field label="Confirm before destructive actions" description="Ask for confirmation before archiving, resetting, or discarding.">
          <Toggle checked={preferences.confirmBeforeDestructive} onChange={(v) => onChange({ ...value, preferences: { ...preferences, confirmBeforeDestructive: v } })} />
        </Field>
      </section>
    </div>
  );
}
