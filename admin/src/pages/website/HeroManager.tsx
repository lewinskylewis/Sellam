import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import HeroSlideCard from "../../components/HeroSlideCard";
import ConfirmDeleteModal from "../../components/ConfirmDeleteModal";
import { deleteHeroImageFolder } from "../../lib/heroImageStorage";
import {
  deleteHeroSlide,
  errorMessage,
  fetchHeroSlides,
  isMissingTableError,
  reorderHeroSlides,
  updateHeroSlide,
  type HeroSlide,
} from "../../lib/hero";

export default function HeroManager() {
  const navigate = useNavigate();
  const [slides, setSlides] = useState<HeroSlide[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [notSetUp, setNotSetUp] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<HeroSlide | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  function load() {
    setLoading(true);
    setError(null);
    setNotSetUp(false);
    fetchHeroSlides()
      .then(setSlides)
      .catch((err) => {
        if (isMissingTableError(err)) {
          setNotSetUp(true);
        } else {
          setError(errorMessage(err, "Failed to load hero slides."));
        }
      })
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  async function handleToggleActive(slide: HeroSlide) {
    setBusyId(slide.id);
    setActionError(null);
    try {
      await updateHeroSlide(slide.id, { is_active: !slide.is_active });
      setSlides((prev) => prev && prev.map((s) => (s.id === slide.id ? { ...s, is_active: !s.is_active } : s)));
    } catch (err) {
      setActionError(errorMessage(err, "Failed to update this slide."));
    } finally {
      setBusyId(null);
    }
  }

  async function handleMove(index: number, direction: -1 | 1) {
    if (!slides) return;
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= slides.length) return;

    const reordered = slides.slice();
    [reordered[index], reordered[targetIndex]] = [reordered[targetIndex], reordered[index]];

    setSlides(reordered);
    setBusyId(slides[index].id);
    setActionError(null);
    try {
      await reorderHeroSlides(reordered.map((s) => s.id));
    } catch (err) {
      setSlides(slides); // roll back on failure
      setActionError(errorMessage(err, "Failed to reorder slides."));
    } finally {
      setBusyId(null);
    }
  }

  async function handleDeleteConfirmed() {
    if (!deleteTarget) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      await deleteHeroSlide(deleteTarget.id);
      deleteHeroImageFolder(deleteTarget.property_id).catch((err) =>
        console.warn("Storage cleanup after hero slide delete failed:", err),
      );
      setSlides((prev) => prev && prev.filter((s) => s.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (err) {
      setDeleteError(errorMessage(err, "Failed to delete this slide."));
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-ink">Homepage Hero</h1>
          <p className="mt-1 text-ink">Manage the slides displayed on the Sellam homepage.</p>
        </div>
        {!notSetUp && (
          <Link
            to="/website/hero/new"
            className="shrink-0 rounded-xl bg-brand px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-brand-soft"
          >
            + Add Hero Slide
          </Link>
        )}
      </div>

      {notSetUp && (
        <section className="mt-6 rounded-2xl border border-line bg-surface p-8 text-center shadow-[0_8px_30px_rgba(15,23,42,0.14)]">
          <p className="text-sm font-medium text-ink">This module isn't set up in the database yet.</p>
          <p className="mx-auto mt-1 max-w-md text-sm text-ink-soft">
            The hero slides table hasn't been created yet. Ask your developer to run the pending migration in
            Supabase before this page can be used.
          </p>
        </section>
      )}

      {error && <p className="mt-4 rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
      {actionError && <p className="mt-4 rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">{actionError}</p>}

      {!notSetUp && !error && (
        <div className="mt-6 space-y-4">
          {loading ? (
            <p className="text-ink-soft">Loading hero slides…</p>
          ) : !slides || slides.length === 0 ? (
            <section className="rounded-2xl border border-line bg-surface p-10 text-center shadow-[0_8px_30px_rgba(15,23,42,0.14)]">
              <p className="text-sm text-ink">No hero slides yet.</p>
              <Link
                to="/website/hero/new"
                className="mt-4 inline-block rounded-xl bg-brand px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-soft"
              >
                + Add Hero Slide
              </Link>
            </section>
          ) : (
            slides.map((slide, index) => (
              <HeroSlideCard
                key={slide.id}
                slide={slide}
                position={index + 1}
                total={slides.length}
                busy={busyId === slide.id}
                onEdit={() => navigate(`/website/hero/${slide.id}/edit`)}
                onDelete={() => setDeleteTarget(slide)}
                onToggleActive={() => handleToggleActive(slide)}
                onMoveUp={() => handleMove(index, -1)}
                onMoveDown={() => handleMove(index, 1)}
              />
            ))
          )}
        </div>
      )}

      {deleteTarget && (
        <ConfirmDeleteModal
          title="Remove this hero slide?"
          itemLabel={deleteTarget.property?.title ?? "this slide"}
          description="This removes it from the homepage carousel and deletes its uploaded photos. This cannot be undone."
          deleting={deleting}
          error={deleteError}
          onConfirm={handleDeleteConfirmed}
          onCancel={() => {
            setDeleteTarget(null);
            setDeleteError(null);
          }}
        />
      )}
    </div>
  );
}
