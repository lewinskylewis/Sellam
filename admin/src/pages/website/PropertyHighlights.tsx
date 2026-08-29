import { useEffect, useMemo, useState } from "react";
import PropertyHighlightCard from "../../components/PropertyHighlightCard";
import ConfirmDeleteModal from "../../components/ConfirmDeleteModal";
import { Field, inputClasses } from "../../components/form";
import { fetchPropertiesList, type PropertyListItem } from "../../lib/properties";
import {
  addPropertyHighlight,
  errorMessage,
  fetchPropertyHighlights,
  isMissingTableError,
  removePropertyHighlight,
  reorderPropertyHighlights,
  updatePropertyHighlight,
  type HighlightSection,
  type PropertyHighlight,
} from "../../lib/propertyHighlights";

const SECTIONS: { key: HighlightSection; title: string; blurb: string }[] = [
  {
    key: "featured",
    title: "Featured Properties",
    blurb: 'The homepage\'s "Featured Properties" section, right below the search bar.',
  },
  {
    key: "exclusive",
    title: "Exclusive Properties",
    blurb: 'The homepage\'s "Exclusive Properties" section, further down the page.',
  },
];

export default function PropertyHighlights() {
  const [highlights, setHighlights] = useState<PropertyHighlight[] | null>(null);
  const [properties, setProperties] = useState<PropertyListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [notSetUp, setNotSetUp] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const [pickerSection, setPickerSection] = useState<HighlightSection | null>(null);
  const [pickerPropertyId, setPickerPropertyId] = useState("");
  const [adding, setAdding] = useState(false);

  const [editing, setEditing] = useState<PropertyHighlight | null>(null);
  const [editCaption, setEditCaption] = useState("");
  const [editImage, setEditImage] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);

  const [removeTarget, setRemoveTarget] = useState<PropertyHighlight | null>(null);
  const [removing, setRemoving] = useState(false);
  const [removeError, setRemoveError] = useState<string | null>(null);

  function load() {
    setLoading(true);
    setError(null);
    setNotSetUp(false);
    Promise.all([fetchPropertyHighlights(), fetchPropertiesList()])
      .then(([h, p]) => {
        setHighlights(h);
        setProperties(p);
      })
      .catch((err) => {
        if (isMissingTableError(err)) {
          setNotSetUp(true);
        } else {
          setError(errorMessage(err, "Failed to load Property Highlights."));
        }
      })
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  const bySection = useMemo(() => {
    const map: Record<HighlightSection, PropertyHighlight[]> = { featured: [], exclusive: [] };
    (highlights ?? []).forEach((h) => map[h.section].push(h));
    return map;
  }, [highlights]);

  async function handleAdd(section: HighlightSection) {
    if (!pickerPropertyId) return;
    setAdding(true);
    setActionError(null);
    try {
      await addPropertyHighlight(pickerPropertyId, section);
      setPickerSection(null);
      setPickerPropertyId("");
      load();
    } catch (err) {
      setActionError(errorMessage(err, "Failed to add this property."));
    } finally {
      setAdding(false);
    }
  }

  async function handleToggleActive(highlight: PropertyHighlight) {
    setBusyId(highlight.id);
    setActionError(null);
    try {
      await updatePropertyHighlight(highlight.id, { is_active: !highlight.is_active });
      setHighlights((prev) => prev && prev.map((h) => (h.id === highlight.id ? { ...h, is_active: !h.is_active } : h)));
    } catch (err) {
      setActionError(errorMessage(err, "Failed to update this property."));
    } finally {
      setBusyId(null);
    }
  }

  async function handleMove(section: HighlightSection, index: number, direction: -1 | 1) {
    const rows = bySection[section];
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= rows.length) return;

    const reordered = rows.slice();
    [reordered[index], reordered[targetIndex]] = [reordered[targetIndex], reordered[index]];

    setHighlights((prev) => {
      if (!prev) return prev;
      const others = prev.filter((h) => h.section !== section);
      return [...others, ...reordered];
    });
    setBusyId(rows[index].id);
    setActionError(null);
    try {
      await reorderPropertyHighlights(reordered.map((h) => h.id));
    } catch (err) {
      load(); // roll back on failure
      setActionError(errorMessage(err, "Failed to reorder."));
    } finally {
      setBusyId(null);
    }
  }

  function openEdit(highlight: PropertyHighlight) {
    setEditing(highlight);
    setEditCaption(highlight.caption ?? "");
    setEditImage(highlight.image ?? "");
  }

  async function handleSaveEdit() {
    if (!editing) return;
    setSavingEdit(true);
    setActionError(null);
    try {
      await updatePropertyHighlight(editing.id, {
        caption: editCaption.trim() || null,
        image: editImage.trim() || null,
      });
      setEditing(null);
      load();
    } catch (err) {
      setActionError(errorMessage(err, "Failed to save changes."));
    } finally {
      setSavingEdit(false);
    }
  }

  async function handleRemoveConfirmed() {
    if (!removeTarget) return;
    setRemoving(true);
    setRemoveError(null);
    try {
      await removePropertyHighlight(removeTarget.id);
      setHighlights((prev) => prev && prev.filter((h) => h.id !== removeTarget.id));
      setRemoveTarget(null);
    } catch (err) {
      setRemoveError(errorMessage(err, "Failed to remove this property."));
    } finally {
      setRemoving(false);
    }
  }

  return (
    <div>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-ink">Property Highlights</h1>
          <p className="mt-1 text-ink">Curate which existing properties appear as Featured and Exclusive on the homepage.</p>
        </div>
        <a
          href="https://sellamre.com/"
          target="_blank"
          rel="noreferrer"
          className="shrink-0 rounded-xl border border-line px-4 py-2.5 text-sm font-medium text-ink hover:bg-paper"
        >
          View Homepage ↗
        </a>
      </div>

      {notSetUp && (
        <section className="mt-6 rounded-2xl border border-line bg-surface p-8 text-center shadow-[0_8px_30px_rgba(15,23,42,0.14)]">
          <p className="text-sm font-medium text-ink">This module isn't set up in the database yet.</p>
          <p className="mx-auto mt-1 max-w-md text-sm text-ink-soft">
            The homepage_property_highlights table hasn't been created yet. Ask your developer to run the pending
            migration in Supabase before this page can be used.
          </p>
        </section>
      )}

      {error && <p className="mt-4 rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
      {actionError && <p className="mt-4 rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">{actionError}</p>}

      {!notSetUp && !error && (
        <div className="mt-6 space-y-8">
          {loading ? (
            <p className="text-ink-soft">Loading Property Highlights…</p>
          ) : (
            SECTIONS.map((section) => {
              const rows = bySection[section.key];
              const usedIds = new Set(rows.map((h) => h.property_id));
              const selectableProperties = properties.filter((p) => !usedIds.has(p.id));

              return (
                <section key={section.key}>
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h2 className="text-lg font-bold text-ink">{section.title}</h2>
                      <p className="text-sm text-ink-soft">{section.blurb}</p>
                    </div>
                    {pickerSection === section.key ? (
                      <div className="flex items-center gap-2">
                        <select
                          className={`${inputClasses} min-w-[260px]`}
                          value={pickerPropertyId}
                          onChange={(e) => setPickerPropertyId(e.target.value)}
                          autoFocus
                        >
                          <option value="">Select a property…</option>
                          {selectableProperties.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.title} — {p.communityLabel} ({p.priceLabel})
                            </option>
                          ))}
                        </select>
                        <button
                          type="button"
                          onClick={() => handleAdd(section.key)}
                          disabled={!pickerPropertyId || adding}
                          className="rounded-xl bg-brand px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-soft disabled:opacity-60"
                        >
                          {adding ? "Adding…" : "Add"}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setPickerSection(null);
                            setPickerPropertyId("");
                          }}
                          disabled={adding}
                          className="rounded-xl border border-line px-4 py-2.5 text-sm font-medium text-ink hover:bg-paper disabled:opacity-60"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setPickerSection(section.key)}
                        className="shrink-0 rounded-xl bg-brand px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-soft"
                      >
                        + Add Property
                      </button>
                    )}
                  </div>

                  <div className="mt-4">
                    {rows.length === 0 ? (
                      <div className="rounded-2xl border border-dashed border-line p-8 text-center">
                        <p className="text-sm text-ink-soft">No properties highlighted in this section yet.</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {rows.map((h, index) => (
                          <PropertyHighlightCard
                            key={h.id}
                            highlight={h}
                            position={index + 1}
                            total={rows.length}
                            busy={busyId === h.id}
                            onEdit={() => openEdit(h)}
                            onRemove={() => setRemoveTarget(h)}
                            onToggleActive={() => handleToggleActive(h)}
                            onMoveUp={() => handleMove(section.key, index, -1)}
                            onMoveDown={() => handleMove(section.key, index, 1)}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                </section>
              );
            })
          )}
        </div>
      )}

      {editing && (
        <>
          <div className="fixed inset-0 z-40 bg-black/50" onClick={() => !savingEdit && setEditing(null)} aria-hidden="true" />
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            <div className="w-full max-w-md rounded-3xl border border-line bg-surface p-6 shadow-[0_8px_30px_rgba(15,23,42,0.14)]">
              <h2 className="font-display text-xl text-ink">Edit Homepage Card</h2>
              <p className="mt-1 text-sm text-ink-soft">
                Overrides just for this homepage card. Leave blank to use {editing.property?.title ?? "the property"}'s own title/photo.
              </p>

              <div className="mt-4 space-y-4">
                <Field label="Caption" hint={`Defaults to "${editing.property?.title ?? ""}"`}>
                  <input
                    className={inputClasses}
                    value={editCaption}
                    onChange={(e) => setEditCaption(e.target.value)}
                    placeholder={editing.property?.title ?? ""}
                  />
                </Field>
                <Field label="Image path or URL" hint="e.g. assets/images/example.jpeg — leave blank to use the property's own photo">
                  <input
                    className={inputClasses}
                    value={editImage}
                    onChange={(e) => setEditImage(e.target.value)}
                    placeholder={editing.property?.image ?? ""}
                  />
                </Field>
              </div>

              <div className="mt-5 flex gap-2">
                <button
                  type="button"
                  onClick={handleSaveEdit}
                  disabled={savingEdit}
                  className="rounded-xl bg-brand px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-soft disabled:opacity-60"
                >
                  {savingEdit ? "Saving…" : "Save Changes"}
                </button>
                <button
                  type="button"
                  onClick={() => setEditing(null)}
                  disabled={savingEdit}
                  className="rounded-xl border border-line px-4 py-2.5 text-sm font-medium text-ink hover:bg-paper disabled:opacity-60"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {removeTarget && (
        <ConfirmDeleteModal
          title="Remove this property from the homepage?"
          itemLabel={removeTarget.caption || removeTarget.property?.title || "this property"}
          description="This removes it from the homepage's teaser section. The property itself is not affected."
          confirmLabel="Remove"
          deleting={removing}
          error={removeError}
          onConfirm={handleRemoveConfirmed}
          onCancel={() => {
            setRemoveTarget(null);
            setRemoveError(null);
          }}
        />
      )}
    </div>
  );
}
