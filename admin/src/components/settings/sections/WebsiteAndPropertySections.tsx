import { Field, RadioCards, Select, TextInput, Toggle } from "../Controls";
import type { SettingsState } from "../../../lib/settingsDefaults";

type Website = SettingsState["website"];
type PropertyDefaults = SettingsState["propertyDefaults"];

export function WebsiteSection({ value, onChange }: { value: Website; onChange: (next: Website) => void }) {
  const { behaviour, social, display } = value;

  return (
    <div className="divide-y divide-line">
      <p className="mb-4 rounded-lg bg-paper px-4 py-2.5 text-xs text-ink-soft">
        These are global defaults for the public website — not a page builder. Individual property, community, and homepage content is managed in their own modules.
      </p>

      <section>
        <h4 className="mb-1 text-sm font-semibold text-ink">Global Website Behaviour</h4>
        <Field label="Default enquiry CTA text">
          <TextInput value={behaviour.enquiryCtaText} onChange={(e) => onChange({ ...value, behaviour: { ...behaviour, enquiryCtaText: e.target.value } })} />
        </Field>
        <Field label="Default contact CTA text">
          <TextInput value={behaviour.contactCtaText} onChange={(e) => onChange({ ...value, behaviour: { ...behaviour, contactCtaText: e.target.value } })} />
        </Field>
        <Field label="Phone display preference">
          <RadioCards
            value={behaviour.phoneDisplay}
            onChange={(v) => onChange({ ...value, behaviour: { ...behaviour, phoneDisplay: v } })}
            options={[
              { value: "full", label: "Full number" },
              { value: "masked", label: "Masked" },
              { value: "hidden", label: "Hidden" },
            ]}
          />
        </Field>
        <Field label="WhatsApp display preference">
          <RadioCards
            value={behaviour.whatsappDisplay}
            onChange={(v) => onChange({ ...value, behaviour: { ...behaviour, whatsappDisplay: v } })}
            options={[
              { value: "button", label: "Button" },
              { value: "link", label: "Text link" },
              { value: "hidden", label: "Hidden" },
            ]}
          />
        </Field>
        <Field label="Show contact information">
          <Toggle checked={behaviour.showContactInfo} onChange={(v) => onChange({ ...value, behaviour: { ...behaviour, showContactInfo: v } })} />
        </Field>
        <Field label="Open external links in new tab">
          <Toggle checked={behaviour.openLinksNewTab} onChange={(v) => onChange({ ...value, behaviour: { ...behaviour, openLinksNewTab: v } })} />
        </Field>
      </section>

      <section className="pt-6">
        <h4 className="mb-1 text-sm font-semibold text-ink">Social Sharing Defaults</h4>
        <Field label="Default sharing title">
          <TextInput value={social.title} onChange={(e) => onChange({ ...value, social: { ...social, title: e.target.value } })} />
        </Field>
        <Field label="Default sharing description">
          <TextInput value={social.description} onChange={(e) => onChange({ ...value, social: { ...social, description: e.target.value } })} />
        </Field>
        <Field label="Default share image">
          <RadioCards
            value={social.imagePreview}
            onChange={(v) => onChange({ ...value, social: { ...social, imagePreview: v } })}
            options={[
              { value: "featured-image", label: "Featured property image" },
              { value: "logo", label: "Company logo" },
            ]}
          />
        </Field>
      </section>

      <section className="pt-6">
        <h4 className="mb-1 text-sm font-semibold text-ink">Website Display Preferences</h4>
        <Field label="Show availability labels">
          <Toggle checked={display.showAvailability} onChange={(v) => onChange({ ...value, display: { ...display, showAvailability: v } })} />
        </Field>
        <Field label="Show pricing">
          <Toggle checked={display.showPricing} onChange={(v) => onChange({ ...value, display: { ...display, showPricing: v } })} />
        </Field>
        <Field label="Show enquiry buttons">
          <Toggle checked={display.showEnquiryButtons} onChange={(v) => onChange({ ...value, display: { ...display, showEnquiryButtons: v } })} />
        </Field>
        <Field label="Show WhatsApp CTA">
          <Toggle checked={display.showWhatsappCta} onChange={(v) => onChange({ ...value, display: { ...display, showWhatsappCta: v } })} />
        </Field>
      </section>
    </div>
  );
}

export function PropertyDefaultsSection({ value, onChange }: { value: PropertyDefaults; onChange: (next: PropertyDefaults) => void }) {
  const { display } = value;

  return (
    <div className="divide-y divide-line">
      <p className="mb-4 rounded-lg bg-paper px-4 py-2.5 text-xs text-ink-soft">
        These control the starting defaults used when creating or editing a property — not property management itself, which lives in the Properties module.
      </p>

      <section>
        <h4 className="mb-1 text-sm font-semibold text-ink">Creation Defaults</h4>
        <Field label="Default property status">
          <Select
            value={value.defaultStatus}
            onChange={(v) => onChange({ ...value, defaultStatus: v as PropertyDefaults["defaultStatus"] })}
            options={[
              { value: "available", label: "Available" },
              { value: "reserved", label: "Reserved" },
              { value: "sold", label: "Sold" },
              { value: "off-market", label: "Off-market" },
            ]}
          />
        </Field>
        <Field label="Default collection">
          <TextInput value={value.defaultCollection} onChange={(e) => onChange({ ...value, defaultCollection: e.target.value })} />
        </Field>
        <Field label="Default listing type">
          <RadioCards
            value={value.defaultListingType}
            onChange={(v) => onChange({ ...value, defaultListingType: v })}
            options={[
              { value: "sale", label: "Sale" },
              { value: "rent", label: "Rent" },
              { value: "sale-and-rent", label: "Sale & Rent" },
            ]}
          />
        </Field>
        <Field label="Default currency">
          <Select
            value={value.defaultCurrency}
            onChange={(v) => onChange({ ...value, defaultCurrency: v })}
            options={[
              { value: "KES", label: "KES" },
              { value: "USD", label: "USD" },
            ]}
          />
        </Field>
        <Field label="Default image behaviour">
          <RadioCards
            value={value.defaultImageBehaviour}
            onChange={(v) => onChange({ ...value, defaultImageBehaviour: v })}
            options={[
              { value: "auto-optimize", label: "Auto-optimize on upload" },
              { value: "as-uploaded", label: "Keep as uploaded" },
            ]}
          />
        </Field>
        <Field label="Default enquiry CTA">
          <TextInput value={value.defaultEnquiryCta} onChange={(e) => onChange({ ...value, defaultEnquiryCta: e.target.value })} />
        </Field>
        <Field label="Default gallery image count">
          <TextInput type="number" min={1} max={30} value={value.defaultGalleryCount} onChange={(e) => onChange({ ...value, defaultGalleryCount: Number(e.target.value) })} className="max-w-[100px]" />
        </Field>
        <Field label="Default publishing behaviour">
          <RadioCards
            value={value.defaultPublishing}
            onChange={(v) => onChange({ ...value, defaultPublishing: v })}
            options={[
              { value: "draft", label: "Save as draft" },
              { value: "published", label: "Publish immediately" },
            ]}
          />
        </Field>
      </section>

      <section className="pt-6">
        <h4 className="mb-1 text-sm font-semibold text-ink">Display Preferences</h4>
        <Field label="Show price">
          <Toggle checked={display.showPrice} onChange={(v) => onChange({ ...value, display: { ...display, showPrice: v } })} />
        </Field>
        <Field label="Show availability">
          <Toggle checked={display.showAvailability} onChange={(v) => onChange({ ...value, display: { ...display, showAvailability: v } })} />
        </Field>
        <Field label="Show bedrooms">
          <Toggle checked={display.showBedrooms} onChange={(v) => onChange({ ...value, display: { ...display, showBedrooms: v } })} />
        </Field>
        <Field label="Show bathrooms">
          <Toggle checked={display.showBathrooms} onChange={(v) => onChange({ ...value, display: { ...display, showBathrooms: v } })} />
        </Field>
        <Field label="Show location">
          <Toggle checked={display.showLocation} onChange={(v) => onChange({ ...value, display: { ...display, showLocation: v } })} />
        </Field>
      </section>
    </div>
  );
}
