import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Field, SectionCard, inputClasses } from "../../components/form";
import { fetchPropertiesList, type PropertyListItem } from "../../lib/properties";
import {
  blankSections,
  createHeroSlide,
  errorMessage,
  fetchHeroSlides,
  isMissingTableError,
  resolveHeroImagePreviewUrl,
  updateHeroSlide,
  type HeroSection,
} from "../../lib/hero";
import { uploadHeroImage, validateHeroImageFile } from "../../lib/heroImageStorage";
import { ImageIcon } from "../../components/icons";

export default function HeroSlideEditor() {
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);
  const navigate = useNavigate();

  const [properties, setProperties] = useState<PropertyListItem[]>([]);
  const [usedPropertyIds, setUsedPropertyIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [propertyId, setPropertyId] = useState("");
  const [sections, setSections] = useState<HeroSection[]>(blankSections());
  const [isActive, setIsActive] = useState(true);
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setLoadError(null);

    Promise.all([fetchPropertiesList(), fetchHeroSlides()])
      .then(([propertyList, slides]) => {
        if (cancelled) return;
        setProperties(propertyList);
        setUsedPropertyIds(
          new Set(slides.filter((s) => !isEdit || s.id !== id).map((s) => s.property_id)),
        );

        if (isEdit) {
          const existing = slides.find((s) => s.id === id);
          if (!existing) {
            setLoadError("This hero slide no longer exists.");
            return;
          }
          setPropertyId(existing.property_id);
          setSections(existing.sections.length === 3 ? existing.sections : blankSections());
          setIsActive(existing.is_active);
        }
      })
      .catch((err) => {
        setLoadError(
          isMissingTableError(err)
            ? "This module isn't set up in the database yet. Ask your developer to run the pending migration in Supabase before this page can be used."
            : errorMessage(err, "Failed to load."),
        );
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [id, isEdit]);

  function updateSection(index: number, patch: Partial<HeroSection>) {
    setSections((prev) => prev.map((s, i) => (i === index ? { ...s, ...patch } : s)));
  }

  async function handleFileChange(index: number, file: File | null) {
    if (!file) return;
    setUploadError(null);

    if (!propertyId) {
      setUploadError("Choose a property before uploading photos.");
      return;
    }
    const invalid = validateHeroImageFile(file);
    if (invalid) {
      setUploadError(invalid);
      return;
    }

    setUploadingIndex(index);
    try {
      const { publicUrl } = await uploadHeroImage(propertyId, file);
      updateSection(index, { image: publicUrl });
    } catch (err) {
      setUploadError(errorMessage(err, "Photo upload failed."));
    } finally {
      setUploadingIndex(null);
    }
  }

  async function handleSave() {
    setFormError(null);

    if (!propertyId) {
      setFormError("Choose which property this slide represents.");
      return;
    }
    const incomplete = sections.some((s) => !s.label.trim() || !s.image.trim());
    if (incomplete) {
      setFormError("All 3 photo slots need a label and an uploaded photo.");
      return;
    }

    setSaving(true);
    try {
      const cleanSections = sections.map((s) => ({ label: s.label.trim(), image: s.image }));
      if (isEdit && id) {
        await updateHeroSlide(id, { property_id: propertyId, sections: cleanSections, is_active: isActive });
      } else {
        await createHeroSlide(propertyId, cleanSections);
      }
      navigate("/website/hero");
    } catch (err) {
      setFormError(errorMessage(err, "Failed to save this hero slide."));
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <p className="text-ink-soft">Loading…</p>;
  }

  if (loadError) {
    return <p className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">{loadError}</p>;
  }

  const selectableProperties = properties.filter((p) => p.id === propertyId || !usedPropertyIds.has(p.id));

  return (
    <div className="max-w-2xl">
      <h1 className="font-display text-2xl font-bold tracking-tight text-ink">
        {isEdit ? "Edit Hero Slide" : "Add Hero Slide"}
      </h1>
      <p className="mt-1 text-ink">Choose a property and 3 photos to feature in the homepage carousel.</p>

      {formError && <p className="mt-4 rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">{formError}</p>}
      {uploadError && <p className="mt-4 rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">{uploadError}</p>}

      <div className="mt-6 space-y-6">
        <SectionCard title="Property" subtitle="The heading, price and link on the homepage always match this property automatically.">
          <Field label="Which property is this slide for?" required>
            <select className={inputClasses} value={propertyId} onChange={(e) => setPropertyId(e.target.value)}>
              <option value="">Select a property…</option>
              {selectableProperties.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title} — {p.communityLabel} ({p.priceLabel})
                </option>
              ))}
            </select>
          </Field>

          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="h-4 w-4 rounded border-line text-brand focus:ring-brand"
            />
            <span className="text-sm font-medium text-ink">Visible on Website</span>
          </label>
        </SectionCard>

        <SectionCard title="Hero Photos" subtitle="Exactly 3 photos are shown per slide — visitors can click between them.">
          <div className="space-y-4">
            {sections.map((section, index) => (
              <div key={index} className="rounded-xl border border-line p-4">
                <div className="flex gap-4">
                  <div className="h-24 w-32 shrink-0 overflow-hidden rounded-lg bg-paper">
                    {section.image ? (
                      <img
                        src={resolveHeroImagePreviewUrl(section.image)}
                        alt={section.label}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <span className="flex h-full w-full items-center justify-center text-ink-soft">
                        <ImageIcon className="h-6 w-6" />
                      </span>
                    )}
                  </div>

                  <div className="flex-1 space-y-2">
                    <Field label={`Photo ${index + 1} Label`} hint='e.g. "Living Room", "Exterior"'>
                      <input
                        className={inputClasses}
                        value={section.label}
                        onChange={(e) => updateSection(index, { label: e.target.value })}
                      />
                    </Field>

                    <label className="inline-block cursor-pointer rounded-lg border border-line px-3 py-1.5 text-sm font-medium text-ink hover:bg-paper">
                      {uploadingIndex === index ? "Uploading…" : section.image ? "Replace Photo" : "Upload Photo"}
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        disabled={uploadingIndex !== null}
                        onChange={(e) => handleFileChange(index, e.target.files?.[0] ?? null)}
                      />
                    </label>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>

      <div className="sticky bottom-0 mt-6 flex items-center gap-3 rounded-2xl border border-line bg-surface p-4 shadow-[0_-8px_30px_rgba(15,23,42,0.12)]">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving || uploadingIndex !== null}
          className="rounded-xl bg-brand px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-brand-soft disabled:opacity-60"
        >
          {saving ? "Saving…" : isEdit ? "Save Changes" : "Add Hero Slide"}
        </button>
        <button
          type="button"
          onClick={() => navigate("/website/hero")}
          disabled={saving}
          className="rounded-xl border border-line px-5 py-2.5 text-sm font-medium text-ink hover:bg-paper disabled:opacity-60"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
