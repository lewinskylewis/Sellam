import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  errorMessage,
  fetchCommunitiesList,
  reorderCommunities,
  updateCommunity,
  type CommunityListItem,
} from "../lib/communities";
import { EyeIcon, ImageIcon } from "../components/icons";

const PUBLIC_SITE_ORIGIN = "https://sellamre.com/";

function resolvePreviewUrl(path: string) {
  if (!path) return "";
  if (/^https?:\/\//i.test(path)) return path;
  return PUBLIC_SITE_ORIGIN + path.replace(/^\/+/, "");
}

export default function Communities() {
  const navigate = useNavigate();
  const [communities, setCommunities] = useState<CommunityListItem[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [dragIndex, setDragIndex] = useState<number | null>(null);

  function load() {
    setLoading(true);
    setError(null);
    fetchCommunitiesList()
      .then(setCommunities)
      .catch((err) => setError(errorMessage(err, "Failed to load communities.")))
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  async function persistOrder(reordered: CommunityListItem[]) {
    setCommunities(reordered);
    setActionError(null);
    try {
      await reorderCommunities(reordered.map((c) => c.key));
    } catch (err) {
      setActionError(errorMessage(err, "Failed to save the new order."));
      load();
    }
  }

  function moveByIndex(index: number, direction: -1 | 1) {
    if (!communities) return;
    const target = index + direction;
    if (target < 0 || target >= communities.length) return;
    const reordered = communities.slice();
    [reordered[index], reordered[target]] = [reordered[target], reordered[index]];
    persistOrder(reordered);
  }

  function handleDrop(index: number) {
    if (!communities || dragIndex === null || dragIndex === index) {
      setDragIndex(null);
      return;
    }
    const reordered = communities.slice();
    const [moved] = reordered.splice(dragIndex, 1);
    reordered.splice(index, 0, moved);
    setDragIndex(null);
    persistOrder(reordered);
  }

  async function toggleActive(community: CommunityListItem) {
    setBusyKey(community.key);
    setActionError(null);
    try {
      await updateCommunity(community.key, {
        label: community.label,
        image: community.image,
        image_alt: community.image_alt,
        description: community.description,
        hero_image: community.hero_image,
        overview: community.overview,
        is_active: !community.is_active,
      });
      setCommunities((prev) =>
        prev ? prev.map((c) => (c.key === community.key ? { ...c, is_active: !c.is_active } : c)) : prev,
      );
    } catch (err) {
      setActionError(errorMessage(err, "Failed to update this community."));
    } finally {
      setBusyKey(null);
    }
  }

  return (
    <div>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-ink">Communities</h1>
          <p className="mt-1 text-ink">Manage neighbourhoods and the homepage community carousel.</p>
        </div>
        <Link
          to="/communities/new"
          className="shrink-0 rounded-xl bg-brand px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-brand-soft"
        >
          + Add Community
        </Link>
      </div>

      {error && <p className="mt-4 rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
      {actionError && <p className="mt-4 rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">{actionError}</p>}

      {!error && (
        <div className="mt-6 space-y-3">
          {loading ? (
            <p className="text-ink-soft">Loading communities…</p>
          ) : !communities || communities.length === 0 ? (
            <section className="rounded-2xl border border-line bg-surface p-10 text-center shadow-[0_8px_30px_rgba(15,23,42,0.14)]">
              <p className="text-sm text-ink">No communities yet.</p>
              <Link
                to="/communities/new"
                className="mt-4 inline-block rounded-xl bg-brand px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-soft"
              >
                + Add Community
              </Link>
            </section>
          ) : (
            communities.map((c, index) => (
              <div
                key={c.key}
                draggable
                onDragStart={() => setDragIndex(index)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => handleDrop(index)}
                className={`flex items-center gap-4 rounded-2xl border border-line bg-surface p-4 shadow-[0_8px_30px_rgba(15,23,42,0.14)] transition-opacity ${
                  dragIndex === index ? "opacity-50" : ""
                }`}
              >
                <span
                  className="hidden shrink-0 cursor-grab select-none text-ink-soft sm:block"
                  title="Drag to reorder"
                  aria-hidden="true"
                >
                  ⠿
                </span>

                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand text-xs font-bold text-white">
                  {index + 1}
                </span>

                <div className="h-16 w-24 shrink-0 overflow-hidden rounded-lg bg-paper">
                  {c.image ? (
                    <img src={resolvePreviewUrl(c.image)} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <span className="flex h-full w-full items-center justify-center text-ink-soft">
                      <ImageIcon className="h-5 w-5" />
                    </span>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="truncate text-sm font-semibold text-ink">{c.label}</span>
                    <span
                      className="shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium"
                      style={
                        c.is_active
                          ? { backgroundColor: "var(--color-status-green-bg)", color: "var(--color-status-green-text)" }
                          : { backgroundColor: "var(--color-status-gray-bg)", color: "var(--color-status-gray-text)" }
                      }
                    >
                      {c.is_active ? "Visible" : "Hidden"}
                    </span>
                  </div>
                  <p className="truncate text-xs text-ink-soft">
                    key: {c.key} · {c.propertyCount} propert{c.propertyCount === 1 ? "y" : "ies"}
                  </p>
                </div>

                <div className="flex shrink-0 items-center gap-2">
                  <button
                    type="button"
                    onClick={() => navigate(`/communities/${c.key}/edit`)}
                    disabled={busyKey === c.key}
                    className="rounded-lg border border-line px-3 py-1.5 text-sm font-medium text-ink hover:bg-paper disabled:opacity-60"
                  >
                    Edit
                  </button>
                  <a
                    href={resolvePreviewUrl(c.url)}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1.5 rounded-lg border border-line px-3 py-1.5 text-sm font-medium text-ink hover:bg-paper"
                  >
                    <EyeIcon className="h-4 w-4" />
                    Preview
                  </a>
                  <button
                    type="button"
                    onClick={() => toggleActive(c)}
                    disabled={busyKey === c.key}
                    className="rounded-lg border border-line px-3 py-1.5 text-sm font-medium text-ink hover:bg-paper disabled:opacity-60"
                  >
                    {c.is_active ? "Hide" : "Show"}
                  </button>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => moveByIndex(index, -1)}
                      disabled={busyKey === c.key || index === 0}
                      aria-label="Move up"
                      className="flex h-8 w-8 items-center justify-center rounded-lg border border-line text-ink hover:bg-paper disabled:opacity-30"
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      onClick={() => moveByIndex(index, 1)}
                      disabled={busyKey === c.key || index === communities.length - 1}
                      aria-label="Move down"
                      className="flex h-8 w-8 items-center justify-center rounded-lg border border-line text-ink hover:bg-paper disabled:opacity-30"
                    >
                      ↓
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
