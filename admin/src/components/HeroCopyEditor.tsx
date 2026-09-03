import { useEffect, useState } from "react";
import { Field, SectionCard, inputClasses } from "./form";
import { errorMessage, fetchHeroCopy, isMissingTableError, updateHeroCopy, type HeroCopy } from "../lib/heroCopy";

type Draft = { heading: string; description: string };

function draftFrom(copy: HeroCopy): Draft {
  return { heading: copy.heading, description: copy.description };
}

export default function HeroCopyEditor() {
  const [copy, setCopy] = useState<HeroCopy | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [loading, setLoading] = useState(true);
  const [notSetUp, setNotSetUp] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [savedNotice, setSavedNotice] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetchHeroCopy()
      .then((row) => {
        if (cancelled) return;
        setCopy(row);
        setDraft(row ? draftFrom(row) : null);
      })
      .catch((err) => {
        if (cancelled) return;
        if (isMissingTableError(err)) setNotSetUp(true);
        else setLoadError(errorMessage(err, "Failed to load the hero title/description."));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!savedNotice) return;
    const t = setTimeout(() => setSavedNotice(false), 3000);
    return () => clearTimeout(t);
  }, [savedNotice]);

  const dirty = Boolean(copy && draft && (draft.heading !== copy.heading || draft.description !== copy.description));

  async function handleSave() {
    if (!copy || !draft) return;
    const heading = draft.heading.trim();
    const description = draft.description.trim();
    if (!heading || !description) {
      setSaveError("Both fields are required.");
      return;
    }

    setSaving(true);
    setSaveError(null);
    try {
      await updateHeroCopy(copy.id, { heading, description });
      const updated = { ...copy, heading, description };
      setCopy(updated);
      setDraft(draftFrom(updated));
      setSavedNotice(true);
    } catch (err) {
      setSaveError(errorMessage(err, "Failed to save changes."));
    } finally {
      setSaving(false);
    }
  }

  function handleDiscard() {
    if (!copy) return;
    setDraft(draftFrom(copy));
    setSaveError(null);
  }

  if (loading) {
    return (
      <section className="rounded-2xl border border-line bg-surface p-6 shadow-[0_8px_30px_rgba(15,23,42,0.14)]">
        <p className="text-ink-soft">Loading hero title & description…</p>
      </section>
    );
  }

  if (notSetUp) {
    return (
      <section className="rounded-2xl border border-line bg-surface p-6 text-center shadow-[0_8px_30px_rgba(15,23,42,0.14)]">
        <p className="text-sm font-medium text-ink">This module isn't set up in the database yet.</p>
        <p className="mx-auto mt-1 max-w-md text-sm text-ink-soft">
          The homepage_hero_copy table hasn't been created yet. Ask your developer to run the pending migration in
          Supabase before this section can be used.
        </p>
      </section>
    );
  }

  if (loadError || !draft) {
    return <p className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">{loadError ?? "Nothing to edit yet."}</p>;
  }

  return (
    <SectionCard title="Homepage Title & Description" subtitle="The heading and description shown next to the image carousel — the carousel itself is unaffected.">
      <Field label="Title" hint="Line-sensitive: a new line here is a new line on the homepage.">
        <textarea
          className={`${inputClasses} min-h-[72px] resize-y`}
          value={draft.heading}
          onChange={(e) => setDraft({ ...draft, heading: e.target.value })}
        />
      </Field>
      <Field label="Description">
        <textarea
          className={`${inputClasses} min-h-[88px] resize-y`}
          value={draft.description}
          onChange={(e) => setDraft({ ...draft, description: e.target.value })}
        />
      </Field>

      {saveError && <p className="rounded-md bg-red-50 px-3 py-2 text-xs text-red-700">{saveError}</p>}

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={handleSave}
          disabled={!dirty || saving}
          className="rounded-xl bg-brand px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-brand-soft disabled:cursor-not-allowed disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save Changes"}
        </button>
        <button
          type="button"
          onClick={handleDiscard}
          disabled={!dirty || saving}
          className="rounded-xl border border-line px-4 py-2.5 text-sm font-medium text-ink hover:bg-paper disabled:cursor-not-allowed disabled:opacity-50"
        >
          Discard
        </button>
        {savedNotice && <span className="text-sm font-medium text-status-green-text">Saved ✓ — live on the homepage now.</span>}
        {dirty && !savedNotice && <span className="text-sm text-ink-soft">Unsaved changes</span>}
      </div>
    </SectionCard>
  );
}
