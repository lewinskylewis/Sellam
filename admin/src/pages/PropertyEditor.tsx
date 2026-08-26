import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Field, SectionCard, inputClasses } from "../components/form";
import MediaManager, { type DeferredFile, type MediaState } from "../components/MediaManager";
import { uploadPropertyImage } from "../lib/mediaStorage";
import StoriesEditor, { type StoryItem } from "../components/StoriesEditor";
import FeatureHighlightsEditor, { type HighlightItem } from "../components/FeatureHighlightsEditor";
import PaymentPlanEditor, { type PaymentPlanItemDraft } from "../components/PaymentPlanEditor";
import LeasePricingEditor, { blankLeasePricing, type LeasePricingDraft } from "../components/LeasePricingEditor";
import {
  fetchCommunities,
  fetchPropertyForEdit,
  saveProperty,
  type Community,
  type EditorUnit,
  type PropertyWritePayload,
} from "../lib/propertyEditor";
import {
  parseStories,
  parseHighlights,
  parsePaymentPlan,
  parseLeasePricing,
  resolveStoriesForSave,
  resolveHighlightsForSave,
  resolvePaymentPlanForSave,
  resolveLeasePricingForSave,
} from "../lib/structuredContent";
import {
  COLLECTION_OPTIONS,
  CURRENCY_OPTIONS,
  FEATURE_OPTIONS,
  LETTING_OPTIONS,
  PROPERTY_TYPE_OPTIONS,
  STATUS_OPTIONS,
  UNIT_TYPE_OPTIONS,
  titleCase,
} from "../lib/propertyVocabulary";

type UnitDraft = {
  _key: string;
  id: string | null;
  unit_type: string;
  bedrooms: string;
  bathrooms: string;
  sale_price: string;
  rent_price: string;
  currency: string;
  residence_label: string;
  area: string;
  note: string;
};

type FormState = {
  slug: string;
  slugTouched: boolean;
  status: string;
  collection: string;
  title: string;
  summary: string;
  property_type: string;
  community: string;
  location: string;
  letting: string;
  features: string[];
  media: MediaState;
  description_title: string;
  description_body: string;
  feature_location: string;
  stories: StoryItem[];
  highlights: HighlightItem[];
  closing_paragraphs: string;
  paymentPlan: PaymentPlanItemDraft[];
  leasePricing: LeasePricingDraft;
  listed_date: string;
  units: UnitDraft[];
};

// Raw JSONB values as loaded from the DB, kept aside so an untouched
// section can be saved back byte-for-byte instead of round-tripped through
// our structured editors (see lib/structuredContent.ts).
type OriginalRaw = {
  story: unknown;
  feature_highlights: unknown;
  payment_plan: unknown;
  lease_pricing: unknown;
};

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function makeUnitKey() {
  return Math.random().toString(36).slice(2);
}

function blankUnit(): UnitDraft {
  return {
    _key: makeUnitKey(),
    id: null,
    unit_type: "",
    bedrooms: "",
    bathrooms: "",
    sale_price: "",
    rent_price: "",
    currency: "",
    residence_label: "",
    area: "",
    note: "",
  };
}

function blankMedia(): MediaState {
  return { primaryImage: "", heroImage: "", galleryImages: [] };
}

function blankForm(): FormState {
  return {
    slug: "",
    slugTouched: false,
    status: "available",
    collection: "",
    title: "",
    summary: "",
    property_type: "",
    community: "",
    location: "",
    letting: "",
    features: [],
    media: blankMedia(),
    description_title: "",
    description_body: "",
    feature_location: "",
    stories: [],
    highlights: [],
    closing_paragraphs: "",
    paymentPlan: [],
    leasePricing: blankLeasePricing(),
    listed_date: "",
    units: [],
  };
}

const SLUG_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const PENDING_UPLOAD_SENTINEL = "pending-upload";

export default function PropertyEditor() {
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);
  const navigate = useNavigate();

  const [communities, setCommunities] = useState<Community[]>([]);
  const [form, setForm] = useState<FormState>(blankForm());
  const [loading, setLoading] = useState(isEdit);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [unitErrors, setUnitErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [savingStage, setSavingStage] = useState<"saving" | "uploading" | null>(null);

  // Files picked before this property exists yet — not part of `form` since
  // File objects don't belong in a JSON-serialized dirty-check snapshot.
  // Uploaded right after the initial Create Property save succeeds (see
  // handleSave), using the newly-created property's id.
  const [deferredFiles, setDeferredFiles] = useState<DeferredFile[]>([]);

  const originalRaw = useRef<OriginalRaw>({
    story: null,
    feature_highlights: null,
    payment_plan: null,
    lease_pricing: null,
  });

  // Seeded synchronously for create mode so the very first render already has
  // a correct baseline — a ref set inside an effect wouldn't trigger the
  // isDirty useMemo to recompute (refs don't cause re-renders), which left
  // "Unsaved changes" showing on a pristine new-property form. Edit mode's
  // baseline still arrives via the effect once the real record has loaded.
  const initialSnapshot = useRef<string>(isEdit ? "" : JSON.stringify(blankForm()));

  useEffect(() => {
    let cancelled = false;

    fetchCommunities()
      .then((data) => {
        if (!cancelled) setCommunities(data);
      })
      .catch(() => {
        /* community dropdown just stays empty; not fatal for the editor */
      });

    if (!isEdit) {
      initialSnapshot.current = JSON.stringify(blankForm());
      return;
    }

    setLoading(true);
    fetchPropertyForEdit(id as string)
      .then((detail) => {
        if (cancelled) return;

        originalRaw.current = {
          story: detail.story,
          feature_highlights: detail.feature_highlights,
          payment_plan: detail.payment_plan,
          lease_pricing: detail.lease_pricing,
        };

        const next: FormState = {
          slug: detail.slug,
          slugTouched: true,
          status: detail.status,
          collection: detail.collection ?? "",
          title: detail.title,
          summary: detail.summary ?? "",
          property_type: detail.property_type ?? "",
          community: detail.community ?? "",
          location: detail.location,
          letting: detail.letting ?? "",
          features: detail.features ?? [],
          media: {
            primaryImage: detail.image,
            heroImage: detail.hero_image ?? "",
            galleryImages: detail.gallery ?? [],
          },
          description_title: detail.description_title ?? "",
          description_body: detail.description_body,
          feature_location: detail.feature_location ?? "",
          stories: parseStories(detail.story),
          highlights: parseHighlights(detail.feature_highlights),
          closing_paragraphs: detail.closing_paragraphs ?? "",
          paymentPlan: parsePaymentPlan(detail.payment_plan),
          leasePricing: parseLeasePricing(detail.lease_pricing),
          listed_date: detail.listed_date ?? "",
          units: detail.units.map((u: EditorUnit) => ({
            _key: makeUnitKey(),
            id: u.id,
            unit_type: u.unit_type ?? "",
            bedrooms: u.bedrooms == null ? "" : String(u.bedrooms),
            bathrooms: u.bathrooms == null ? "" : String(u.bathrooms),
            sale_price: u.sale_price == null ? "" : String(u.sale_price),
            rent_price: u.rent_price == null ? "" : String(u.rent_price),
            currency: u.currency ?? "",
            residence_label: u.residence_label ?? "",
            area: u.area ?? "",
            note: u.note ?? "",
          })),
        };
        setForm(next);
        initialSnapshot.current = JSON.stringify(next);
      })
      .catch((err) => {
        if (!cancelled) setLoadError(err.message ?? "Failed to load this property.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, isEdit]);

  const isDirty = useMemo(
    () => JSON.stringify(form) !== initialSnapshot.current || deferredFiles.length > 0,
    [form, deferredFiles],
  );

  useEffect(() => {
    function handler(e: BeforeUnloadEvent) {
      if (isDirty) {
        e.preventDefault();
      }
    }
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [isDirty]);

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function handleTitleChange(value: string) {
    setForm((f) => ({
      ...f,
      title: value,
      slug: f.slugTouched ? f.slug : slugify(value),
    }));
  }

  function toggleFeature(feature: string) {
    setForm((f) => ({
      ...f,
      features: f.features.includes(feature) ? f.features.filter((x) => x !== feature) : [...f.features, feature],
    }));
  }

  function addUnit() {
    setForm((f) => ({ ...f, units: [...f.units, blankUnit()] }));
  }

  function removeUnit(key: string) {
    setForm((f) => ({ ...f, units: f.units.filter((u) => u._key !== key) }));
  }

  function updateUnit(key: string, patch: Partial<UnitDraft>) {
    setForm((f) => ({ ...f, units: f.units.map((u) => (u._key === key ? { ...u, ...patch } : u)) }));
  }

  function toNullableInt(text: string, label: string, fieldErrors: Record<string, string>, key: string): number | null {
    const trimmed = text.trim();
    if (!trimmed) return null;
    const n = Number(trimmed);
    if (!Number.isFinite(n) || !Number.isInteger(n) || n < 0) {
      fieldErrors[key] = `${label} must be a whole number ≥ 0.`;
      return null;
    }
    return n;
  }

  function toNullablePrice(text: string, label: string, fieldErrors: Record<string, string>, key: string): number | null {
    const trimmed = text.trim();
    if (!trimmed) return null;
    const n = Number(trimmed);
    if (!Number.isFinite(n) || n <= 0) {
      fieldErrors[key] = `${label} must be a number greater than 0.`;
      return null;
    }
    return n;
  }

  function validateAndBuild(): { payload: PropertyWritePayload; units: EditorUnit[] } | null {
    const fieldErrors: Record<string, string> = {};

    if (!form.title.trim()) fieldErrors.title = "Title is required.";
    if (!form.slug.trim()) fieldErrors.slug = "Slug is required.";
    else if (!SLUG_PATTERN.test(form.slug.trim())) {
      fieldErrors.slug = "Use lowercase letters, numbers and hyphens only (e.g. my-property-name).";
    }
    if (!form.location.trim()) fieldErrors.location = "Location is required.";
    // A brand-new property with images picked but not yet uploaded (no id
    // to upload against yet — see uploadDeferredFilesAndUpdateMedia) has no
    // primaryImage yet; that's fine, one becomes primary right after create.
    if (!form.media.primaryImage.trim() && deferredFiles.length === 0) {
      fieldErrors.image = "A primary image is required.";
    }
    if (!form.description_body.trim()) fieldErrors.description_body = "Description is required.";

    const unitFieldErrors: Record<string, string> = {};
    const units: EditorUnit[] = form.units.map((u) => {
      const bedrooms = toNullableInt(u.bedrooms, "Bedrooms", unitFieldErrors, `${u._key}.bedrooms`);
      const bathrooms = toNullableInt(u.bathrooms, "Bathrooms", unitFieldErrors, `${u._key}.bathrooms`);
      const salePrice = toNullablePrice(u.sale_price, "Sale price", unitFieldErrors, `${u._key}.sale_price`);
      const rentPrice = toNullablePrice(u.rent_price, "Rent price", unitFieldErrors, `${u._key}.rent_price`);
      return {
        id: u.id,
        unit_type: u.unit_type || null,
        bedrooms,
        bathrooms,
        sale_price: salePrice,
        rent_price: rentPrice,
        currency: u.currency || null,
        residence_label: u.residence_label.trim() || null,
        area: u.area.trim() || null,
        note: u.note.trim() || null,
      };
    });

    setErrors(fieldErrors);
    setUnitErrors(unitFieldErrors);

    if (Object.keys(fieldErrors).length > 0 || Object.keys(unitFieldErrors).length > 0) {
      return null;
    }

    const payload: PropertyWritePayload = {
      slug: form.slug.trim(),
      status: form.status,
      collection: form.collection || null,
      title: form.title.trim(),
      summary: form.summary.trim() || null,
      property_type: form.property_type || null,
      community: form.community || null,
      location: form.location.trim(),
      letting: form.letting || null,
      features: form.features,
      // properties.image is NOT NULL, but a brand-new property with only
      // deferred (not-yet-uploaded) files has no real path yet — the DB
      // requires *something* at insert time. This sentinel is only ever
      // written for the instant between the initial insert and the
      // follow-up update in uploadDeferredFilesAndUpdateMedia, which always
      // runs immediately after for a create with deferred files. If every
      // upload then fails, it's left in place deliberately (not swapped for
      // a fabricated real-looking path) and handleSave surfaces a clear
      // error rather than claiming success.
      image: form.media.primaryImage.trim() || (deferredFiles.length > 0 ? PENDING_UPLOAD_SENTINEL : ""),
      hero_image: form.media.heroImage.trim() || null,
      gallery: form.media.galleryImages.map((g) => g.trim()).filter(Boolean),
      description_title: form.description_title.trim() || null,
      description_body: form.description_body.trim(),
      feature_location: form.feature_location.trim() || null,
      story: resolveStoriesForSave(form.stories, originalRaw.current.story),
      feature_highlights: resolveHighlightsForSave(form.highlights, originalRaw.current.feature_highlights),
      closing_paragraphs: form.closing_paragraphs.trim() || null,
      payment_plan: resolvePaymentPlanForSave(form.paymentPlan, originalRaw.current.payment_plan),
      lease_pricing: resolveLeasePricingForSave(form.leasePricing, originalRaw.current.lease_pricing),
      listed_date: form.listed_date || null,
    };

    return { payload, units };
  }

  function errorMessage(err: unknown, fallback: string) {
    // Supabase-js errors (PostgrestError) are plain objects, not
    // `instanceof Error` — checking that first silently dropped the real
    // message and always fell back to the generic string.
    return err && typeof err === "object" && "message" in err && typeof (err as { message: unknown }).message === "string"
      ? (err as { message: string }).message
      : fallback;
  }

  // Property is created first (stable id), then any images picked before
  // that point are uploaded using that id, then the property's image fields
  // are updated with the resulting URLs — the exact flow the Phase 2C brief
  // specifies. Upload failures are reported but don't roll back the
  // property itself, which is already safely saved by this point.
  async function uploadDeferredFilesAndUpdateMedia(
    propertyId: string,
    basePayload: PropertyWritePayload,
  ): Promise<string | null> {
    if (deferredFiles.length === 0) return null;

    setSavingStage("uploading");
    const failures: string[] = [];
    let nextMedia: MediaState = {
      primaryImage: basePayload.image === PENDING_UPLOAD_SENTINEL ? "" : basePayload.image,
      heroImage: basePayload.hero_image ?? "",
      galleryImages: basePayload.gallery,
    };
    let anyUploaded = false;

    for (const item of deferredFiles) {
      try {
        const { publicUrl } = await uploadPropertyImage(propertyId, item.file);
        anyUploaded = true;
        nextMedia = nextMedia.primaryImage
          ? { ...nextMedia, galleryImages: [...nextMedia.galleryImages, publicUrl] }
          : { ...nextMedia, primaryImage: publicUrl };
      } catch (err) {
        failures.push(`${item.name}: ${errorMessage(err, "upload failed")}`);
      }
    }

    if (anyUploaded) {
      const payload: PropertyWritePayload = {
        ...basePayload,
        image: nextMedia.primaryImage,
        hero_image: nextMedia.heroImage || null,
        gallery: nextMedia.galleryImages,
      };
      await saveProperty(propertyId, payload, []);
      deferredFiles.forEach((f) => URL.revokeObjectURL(f.previewUrl));
      setDeferredFiles([]);
      set("media", nextMedia);
    }

    if (failures.length === 0) return null;
    const summary = `${failures.length} image(s) failed to upload — ${failures.join("; ")}`;
    return basePayload.image === PENDING_UPLOAD_SENTINEL && !anyUploaded
      ? `Property created, but no image could be uploaded. Please add one below and save again. ${summary}`
      : summary;
  }

  async function handleSave() {
    if (saving) return;
    setSaveError(null);
    setSaved(false);

    const built = validateAndBuild();
    if (!built) return;

    setSaving(true);
    setSavingStage("saving");
    try {
      const result = await saveProperty(isEdit ? (id as string) : null, built.payload, built.units);

      let uploadWarning: string | null = null;
      if (!isEdit) {
        uploadWarning = await uploadDeferredFilesAndUpdateMedia(result.id, built.payload);
      }

      initialSnapshot.current = JSON.stringify(form);
      if (uploadWarning) {
        setSaveError(uploadWarning);
      } else {
        setSaved(true);
      }
      if (!isEdit) {
        navigate(`/properties/${result.id}/edit`, { replace: true });
      }
    } catch (err) {
      setSaveError(errorMessage(err, "Failed to save this property."));
    } finally {
      setSaving(false);
      setSavingStage(null);
    }
  }

  function handleCancel() {
    if (isDirty && !window.confirm("Discard unsaved changes?")) return;
    navigate("/properties");
  }

  if (loading) {
    return <p className="text-ink-soft">Loading property…</p>;
  }

  if (loadError) {
    return <p className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">{loadError}</p>;
  }

  return (
    <div className="max-w-3xl">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-serif text-4xl font-semibold text-ink">
            {isEdit ? "Edit Property" : "Add Property"}
          </h1>
          <p className="mt-1 text-ink-soft">
            {isEdit ? form.title || "Untitled property" : "Create a new property listing."}
          </p>
        </div>
      </div>

      {saveError && (
        <p className="mt-4 rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">{saveError}</p>
      )}
      {saved && !saveError && (
        <p className="mt-4 rounded-md bg-green-50 px-4 py-3 text-sm text-green-700">Saved successfully.</p>
      )}

      <div className="mt-6 space-y-6">
        <SectionCard title="Basic Information">
          <Field label="Title" required error={errors.title}>
            <input
              className={inputClasses}
              value={form.title}
              onChange={(e) => handleTitleChange(e.target.value)}
            />
          </Field>

          <Field
            label="Slug"
            required
            error={errors.slug}
            hint={
              isEdit
                ? "This is part of the property's public URL. Changing it will break any existing links to this listing."
                : "Used in the property's public URL."
            }
          >
            <input
              className={inputClasses}
              value={form.slug}
              onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value, slugTouched: true }))}
            />
          </Field>

          <div className="grid grid-cols-2 gap-5">
            <Field label="Status" required>
              <select className={inputClasses} value={form.status} onChange={(e) => set("status", e.target.value)}>
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>
                    {titleCase(s)}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Collection">
              <select className={inputClasses} value={form.collection} onChange={(e) => set("collection", e.target.value)}>
                <option value="">Unspecified</option>
                {COLLECTION_OPTIONS.map((c) => (
                  <option key={c} value={c}>
                    {titleCase(c)}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Property Type">
              <select
                className={inputClasses}
                value={form.property_type}
                onChange={(e) => set("property_type", e.target.value)}
              >
                <option value="">Unspecified</option>
                {PROPERTY_TYPE_OPTIONS.map((t) => (
                  <option key={t} value={t}>
                    {titleCase(t)}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Letting">
              <select className={inputClasses} value={form.letting} onChange={(e) => set("letting", e.target.value)}>
                <option value="">Unspecified</option>
                {LETTING_OPTIONS.map((l) => (
                  <option key={l} value={l}>
                    {titleCase(l)}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Community">
              <select className={inputClasses} value={form.community} onChange={(e) => set("community", e.target.value)}>
                <option value="">None</option>
                {communities.map((c) => (
                  <option key={c.key} value={c.key}>
                    {c.label}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Listed Date">
              <input
                type="date"
                className={inputClasses}
                value={form.listed_date}
                onChange={(e) => set("listed_date", e.target.value)}
              />
            </Field>
          </div>

          <Field label="Location" required error={errors.location}>
            <input className={inputClasses} value={form.location} onChange={(e) => set("location", e.target.value)} />
          </Field>
        </SectionCard>

        <SectionCard title="Summary">
          <Field label="Summary">
            <textarea
              rows={3}
              className={inputClasses}
              value={form.summary}
              onChange={(e) => set("summary", e.target.value)}
            />
          </Field>
        </SectionCard>

        <SectionCard title="Description">
          <Field label="Description Title" hint="Leave blank for a plain description with no heading.">
            <input
              className={inputClasses}
              value={form.description_title}
              onChange={(e) => set("description_title", e.target.value)}
            />
          </Field>
          <Field label="Description Body" required error={errors.description_body}>
            <textarea
              rows={5}
              className={inputClasses}
              value={form.description_body}
              onChange={(e) => set("description_body", e.target.value)}
            />
          </Field>
        </SectionCard>

        <SectionCard title="Features">
          <div className="flex flex-wrap gap-2">
            {FEATURE_OPTIONS.map((f) => {
              const active = form.features.includes(f);
              return (
                <button
                  key={f}
                  type="button"
                  onClick={() => toggleFeature(f)}
                  className={`rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
                    active ? "border-brand bg-brand text-white" : "border-line bg-white text-ink-soft hover:bg-paper"
                  }`}
                >
                  {titleCase(f)}
                </button>
              );
            })}
          </div>
        </SectionCard>

        <SectionCard title="Property Images">
          <MediaManager
            value={form.media}
            onChange={(mediaOrUpdater) =>
              setForm((f) => ({
                ...f,
                media: typeof mediaOrUpdater === "function" ? mediaOrUpdater(f.media) : mediaOrUpdater,
              }))
            }
            propertyId={isEdit ? (id as string) : null}
            deferredFiles={deferredFiles}
            onDeferredFilesChange={setDeferredFiles}
          />
          {errors.image && <p className="text-xs text-red-600">{errors.image}</p>}
        </SectionCard>

        <SectionCard title="Property Stories" subtitle="Shown as separate narrative sections on the property page.">
          <StoriesEditor items={form.stories} onChange={(stories) => set("stories", stories)} />
        </SectionCard>

        <SectionCard title="Feature Highlights" subtitle="Short callouts like Location, Security, Amenities.">
          <FeatureHighlightsEditor items={form.highlights} onChange={(highlights) => set("highlights", highlights)} />
        </SectionCard>

        <SectionCard title="Payment Plan" subtitle="Only shown for off-plan / developer-financed listings.">
          <PaymentPlanEditor items={form.paymentPlan} onChange={(paymentPlan) => set("paymentPlan", paymentPlan)} />
        </SectionCard>

        <SectionCard title="Lease Pricing">
          <LeasePricingEditor value={form.leasePricing} onChange={(leasePricing) => set("leasePricing", leasePricing)} />
        </SectionCard>

        <SectionCard title="Additional Content">
          <Field label="Feature Location" hint="A specific standout feature or landmark near the property.">
            <input
              className={inputClasses}
              value={form.feature_location}
              onChange={(e) => set("feature_location", e.target.value)}
            />
          </Field>
          <Field label="Closing Paragraphs">
            <textarea
              rows={3}
              className={inputClasses}
              value={form.closing_paragraphs}
              onChange={(e) => set("closing_paragraphs", e.target.value)}
            />
          </Field>
        </SectionCard>

        <section className="rounded-2xl border border-line bg-surface p-6 shadow-[0_2px_8px_rgba(15,23,42,0.05)]">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-ink">Units</h2>
            <button
              type="button"
              onClick={addUnit}
              className="rounded-lg border border-line px-3 py-1.5 text-sm font-medium text-ink hover:bg-paper"
            >
              + Add Unit
            </button>
          </div>

          {form.units.length === 0 ? (
            <p className="mt-4 text-sm text-ink-soft">No units yet. Add one above.</p>
          ) : (
            <div className="mt-4 space-y-4">
              {form.units.map((u, index) => (
                <div key={u._key} className="rounded-xl border border-line p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-ink">
                      Unit {index + 1}
                      {u.id ? "" : " (new)"}
                    </span>
                    {!u.id && (
                      <button
                        type="button"
                        onClick={() => removeUnit(u._key)}
                        className="text-xs font-medium text-red-600 hover:underline"
                      >
                        Remove
                      </button>
                    )}
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-4 md:grid-cols-3">
                    <Field label="Unit Type">
                      <select
                        className={inputClasses}
                        value={u.unit_type}
                        onChange={(e) => updateUnit(u._key, { unit_type: e.target.value })}
                      >
                        <option value="">Unspecified</option>
                        {UNIT_TYPE_OPTIONS.map((t) => (
                          <option key={t} value={t}>
                            {titleCase(t)}
                          </option>
                        ))}
                      </select>
                    </Field>
                    <Field label="Bedrooms" error={unitErrors[`${u._key}.bedrooms`]}>
                      <input
                        className={inputClasses}
                        inputMode="numeric"
                        value={u.bedrooms}
                        onChange={(e) => updateUnit(u._key, { bedrooms: e.target.value })}
                      />
                    </Field>
                    <Field label="Bathrooms" error={unitErrors[`${u._key}.bathrooms`]}>
                      <input
                        className={inputClasses}
                        inputMode="numeric"
                        value={u.bathrooms}
                        onChange={(e) => updateUnit(u._key, { bathrooms: e.target.value })}
                      />
                    </Field>
                    <Field label="Sale Price" error={unitErrors[`${u._key}.sale_price`]}>
                      <input
                        className={inputClasses}
                        inputMode="decimal"
                        value={u.sale_price}
                        onChange={(e) => updateUnit(u._key, { sale_price: e.target.value })}
                      />
                    </Field>
                    <Field label="Rent Price" error={unitErrors[`${u._key}.rent_price`]}>
                      <input
                        className={inputClasses}
                        inputMode="decimal"
                        value={u.rent_price}
                        onChange={(e) => updateUnit(u._key, { rent_price: e.target.value })}
                      />
                    </Field>
                    <Field label="Currency">
                      <select
                        className={inputClasses}
                        value={u.currency}
                        onChange={(e) => updateUnit(u._key, { currency: e.target.value })}
                      >
                        <option value="">Unspecified</option>
                        {CURRENCY_OPTIONS.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                    </Field>
                    <Field label="Residence Label">
                      <input
                        className={inputClasses}
                        value={u.residence_label}
                        onChange={(e) => updateUnit(u._key, { residence_label: e.target.value })}
                      />
                    </Field>
                    <Field label="Area">
                      <input
                        className={inputClasses}
                        value={u.area}
                        onChange={(e) => updateUnit(u._key, { area: e.target.value })}
                      />
                    </Field>
                    <Field label="Note">
                      <input
                        className={inputClasses}
                        value={u.note}
                        onChange={(e) => updateUnit(u._key, { note: e.target.value })}
                      />
                    </Field>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      <div className="sticky bottom-0 mt-6 flex items-center gap-3 rounded-2xl border border-line bg-surface p-4 shadow-[0_2px_8px_rgba(15,23,42,0.08)]">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="rounded-xl bg-brand px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-brand-soft disabled:opacity-60"
        >
          {savingStage === "uploading" ? "Uploading images…" : saving ? "Saving…" : isEdit ? "Save Changes" : "Create Property"}
        </button>
        <button
          type="button"
          onClick={handleCancel}
          disabled={saving}
          className="rounded-xl border border-line px-5 py-2.5 text-sm font-medium text-ink hover:bg-paper disabled:opacity-60"
        >
          Cancel
        </button>
        {isDirty && !saving && <span className="text-xs text-ink-soft">Unsaved changes</span>}
      </div>
    </div>
  );
}
