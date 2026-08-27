import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Field, SectionCard, inputClasses } from "../components/form";
import SingleImageField from "../components/SingleImageField";
import { CheckIcon } from "../components/icons";
import {
  createCommunity,
  errorMessage,
  fetchCommunity,
  updateCommunity,
  type CommunityWritePayload,
} from "../lib/communities";

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export default function CommunityEditor() {
  const { key } = useParams<{ key: string }>();
  const isEdit = Boolean(key);
  const navigate = useNavigate();

  const [loading, setLoading] = useState(isEdit);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [newKey, setNewKey] = useState("");
  const [label, setLabel] = useState("");
  const [image, setImage] = useState("");
  const [imageAlt, setImageAlt] = useState("");
  const [description, setDescription] = useState("");
  const [heroImage, setHeroImage] = useState("");
  const [overview, setOverview] = useState("");
  const [isActive, setIsActive] = useState(true);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!isEdit || !key) return;
    setLoading(true);
    setLoadError(null);
    fetchCommunity(key)
      .then((community) => {
        if (!community) {
          setLoadError("This community no longer exists.");
          return;
        }
        setLabel(community.label);
        setImage(community.image);
        setImageAlt(community.image_alt);
        setDescription(community.description);
        setHeroImage(community.hero_image ?? "");
        setOverview(community.overview ?? "");
        setIsActive(community.is_active);
      })
      .catch((err) => setLoadError(errorMessage(err, "Failed to load this community.")))
      .finally(() => setLoading(false));
  }, [key, isEdit]);

  const effectiveKey = isEdit ? (key as string) : newKey;
  const folderId = effectiveKey || "unsaved-community";

  function validate(): CommunityWritePayload | null {
    const fieldErrors: Record<string, string> = {};

    if (!isEdit && !newKey.trim()) fieldErrors.key = "Key is required.";
    else if (!isEdit && !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(newKey.trim())) {
      fieldErrors.key = "Use lowercase letters, numbers and hyphens only (e.g. lower-kabete).";
    }
    if (!label.trim()) fieldErrors.label = "Label is required.";
    if (!image.trim()) fieldErrors.image = "A carousel image is required.";
    if (!imageAlt.trim()) fieldErrors.imageAlt = "Image alt text is required.";
    if (!description.trim()) fieldErrors.description = "Description is required.";

    setErrors(fieldErrors);
    if (Object.keys(fieldErrors).length > 0) return null;

    return {
      label: label.trim(),
      image: image.trim(),
      image_alt: imageAlt.trim(),
      description: description.trim(),
      hero_image: heroImage.trim() || null,
      overview: overview.trim() || null,
      is_active: isActive,
    };
  }

  async function handleSave() {
    if (saving) return;
    setSaveError(null);

    const payload = validate();
    if (!payload) return;

    setSaving(true);
    try {
      if (isEdit) {
        await updateCommunity(key as string, payload);
      } else {
        await createCommunity(newKey.trim(), payload);
      }
      setSaved(true);
    } catch (err) {
      setSaveError(errorMessage(err, "Failed to save this community."));
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <p className="text-ink-soft">Loading community…</p>;
  }

  if (loadError) {
    return <p className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">{loadError}</p>;
  }

  if (saved) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 text-center">
        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-green-600">
          <CheckIcon className="h-8 w-8" />
        </span>
        <p className="text-lg font-semibold text-ink">Community saved successfully</p>
        <button
          type="button"
          onClick={() => navigate("/communities")}
          className="rounded-xl bg-brand px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-brand-soft"
        >
          Back to Communities
        </button>
      </div>
    );
  }

  return (
    <div>
      <h1 className="font-display text-2xl font-bold tracking-tight text-ink">
        {isEdit ? "Edit Community" : "Add Community"}
      </h1>
      <p className="mt-1 text-ink">{isEdit ? label || key : "Create a new community/neighbourhood."}</p>

      {saveError && <p className="mt-4 rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">{saveError}</p>}

      <div className="mt-6 space-y-6">
        <SectionCard title="Basic Information">
          <Field
            label="Key"
            required={!isEdit}
            error={errors.key}
            hint={
              isEdit
                ? "The stable identifier used throughout the site and by every property in this community. It cannot be changed here."
                : 'Lowercase, hyphenated (e.g. "lower-kabete"). This becomes part of the community\'s permanent URL and cannot be changed after saving.'
            }
          >
            <input
              className={inputClasses}
              value={isEdit ? (key as string) : newKey}
              disabled={isEdit}
              onChange={(e) => setNewKey(slugify(e.target.value))}
            />
          </Field>

          <Field label="Label" required error={errors.label} hint="The community's display name, e.g. “Karen”.">
            <input className={inputClasses} value={label} onChange={(e) => setLabel(e.target.value)} />
          </Field>

          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="h-4 w-4 rounded border-line text-brand focus:ring-brand"
            />
            <span className="text-sm font-medium text-ink">Visible in Homepage Carousel</span>
          </label>
        </SectionCard>

        <SectionCard
          title="Homepage Carousel"
          subtitle="The image and summary shown in the homepage's Featured Communities carousel."
        >
          <SingleImageField label="Carousel Image" value={image} onChange={setImage} folderId={folderId} />
          {errors.image && <p className="text-xs text-red-600">{errors.image}</p>}

          <Field label="Image Alt Text" required error={errors.imageAlt} hint="Describes the carousel image for accessibility.">
            <input className={inputClasses} value={imageAlt} onChange={(e) => setImageAlt(e.target.value)} />
          </Field>

          <Field
            label="Description"
            required
            error={errors.description}
            hint="Short summary — appears in the carousel card, and as the short text overlaid on the community page's hero image."
          >
            <textarea rows={3} className={inputClasses} value={description} onChange={(e) => setDescription(e.target.value)} />
          </Field>
        </SectionCard>

        <SectionCard
          title="Community Page Hero"
          subtitle="The banner at the top of the community's own page. The title shown over it is the Label above, and the short overlay text is the Description above — set those to change what appears here."
        >
          <SingleImageField label="Hero Image" value={heroImage} onChange={setHeroImage} folderId={folderId} />

          <div className="rounded-xl border border-line bg-paper p-4">
            <p className="text-xs font-medium tracking-wide text-ink-soft uppercase">Preview of the hero overlay</p>
            <p className="mt-1.5 text-lg font-semibold text-ink">{label || "(Label)"}</p>
            <p className="text-sm text-ink-soft">{description || "(Description)"}</p>
          </div>
        </SectionCard>

        <SectionCard
          title="About This Community"
          subtitle="A fuller description shown in its own section on the community page, right below the hero — separate from the short summary above."
        >
          <Field label="Overview" hint="Optional. Leave blank to keep the page as it is today, with no separate About section.">
            <textarea rows={7} className={inputClasses} value={overview} onChange={(e) => setOverview(e.target.value)} />
          </Field>
        </SectionCard>
      </div>

      <div className="sticky bottom-0 mt-6 flex items-center gap-3 rounded-2xl border border-line bg-surface p-4 shadow-[0_-8px_30px_rgba(15,23,42,0.12)]">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="rounded-xl bg-brand px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-brand-soft disabled:opacity-60"
        >
          {saving ? "Saving…" : isEdit ? "Save Changes" : "Add Community"}
        </button>
        <button
          type="button"
          onClick={() => navigate("/communities")}
          disabled={saving}
          className="rounded-xl border border-line px-5 py-2.5 text-sm font-medium text-ink hover:bg-paper disabled:opacity-60"
        >
          Cancel
        </button>
        {isEdit && (
          <a
            href={`https://sellamre.com/communities/${key}`}
            target="_blank"
            rel="noreferrer"
            className="ml-auto rounded-xl border border-line px-4 py-2.5 text-sm font-medium text-ink hover:bg-paper"
          >
            Preview
          </a>
        )}
      </div>
    </div>
  );
}
