import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, ChevronDown, ChevronUp, GripVertical, Search, X } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Spinner } from "@/components/ui/spinner";
import { searchMovies } from "@/features/films/api/requests";
import { searchSeries } from "@/features/serials/api/requests";
import type { TmdbSearchMovie } from "@/types/api";
import type { TmdbSearchSeries } from "@/features/serials/api/types";
import { addListItem } from "@/features/lists/api";
import {
  useAddListItem,
  useCreateList,
  useListDetail,
  useRemoveListItem,
  useReorderListItems,
  useUpdateList,
} from "@/features/lists/hooks/useLists";

const TMDB_IMAGE_BASE = "https://image.tmdb.org/t/p";

type SearchResult = {
  tmdbId: number;
  title: string;
  posterPath: string | null;
  releaseYear: number | null;
  itemType: "cinema" | "serial";
};

type PendingItem = SearchResult;

const normalizeSeries = (s: TmdbSearchSeries): SearchResult => ({
  tmdbId: s.id,
  title: s.name,
  posterPath: s.poster_path,
  releaseYear: s.first_air_date ? parseInt(s.first_air_date.slice(0, 4)) : null,
  itemType: "serial",
});

const normalizeMovie = (m: TmdbSearchMovie): SearchResult => ({
  tmdbId: m.id,
  title: m.title,
  posterPath: m.poster_path,
  releaseYear: m.release_date ? parseInt(m.release_date.slice(0, 4)) : null,
  itemType: "cinema",
});

const getPosterUrl = (path: string | null) =>
  path ? `${TMDB_IMAGE_BASE}/w92${path}` : "";

type CreateProps = { mode: "create"; username: string };
type EditProps = { mode: "edit"; username: string; listId: string };
type ListFormPageProps = CreateProps | EditProps;

export const ListFormPage = (props: ListFormPageProps) => {
  const { mode, username } = props;
  const listId = mode === "edit" ? props.listId : "";
  const navigate = useNavigate();

  const detailQuery = useListDetail(listId, mode === "edit");
  const list = mode === "edit" ? detailQuery.data : null;

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const [isRanked, setIsRanked] = useState(false);

  useEffect(() => {
    if (list) {
      setTitle(list.title);
      setDescription(list.description ?? "");
      setIsPublic(list.isPublic);
      setIsRanked(list.isRanked);
    }
  }, [list?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const [pendingItems, setPendingItems] = useState<PendingItem[]>([]);

  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const id = setTimeout(() => setDebouncedQuery(searchQuery), 300);
    return () => clearTimeout(id);
  }, [searchQuery]);

  const moviesQuery = useQuery({
    queryKey: ["listFormSearch", "movies", debouncedQuery],
    queryFn: ({ signal }) => searchMovies(debouncedQuery, { signal }),
    enabled: debouncedQuery.trim().length >= 2,
    staleTime: 30_000,
  });

  const seriesQuery = useQuery({
    queryKey: ["listFormSearch", "series", debouncedQuery],
    queryFn: ({ signal }) => searchSeries(debouncedQuery, { signal }),
    enabled: debouncedQuery.trim().length >= 2,
    staleTime: 30_000,
  });

  const isSearchPending =
    debouncedQuery.trim().length >= 2 &&
    (moviesQuery.isPending || seriesQuery.isPending);

  const searchResults: SearchResult[] = [
    ...(moviesQuery.data?.map(normalizeMovie) ?? []),
    ...(seriesQuery.data?.map(normalizeSeries) ?? []),
  ].slice(0, 10);

  const existingTmdbIds = new Set(
    mode === "edit"
      ? (list?.items ?? []).map((i) => `${i.itemType}:${i.tmdbId}`)
      : pendingItems.map((i) => `${i.itemType}:${i.tmdbId}`),
  );

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const createMutation = useCreateList(username);
  const updateMutation = useUpdateList(listId, username);
  const addItemMutation = useAddListItem(listId, username);
  const removeItemMutation = useRemoveListItem(listId, username);
  const reorderMutation = useReorderListItems(listId);

  const [isSaving, setIsSaving] = useState(false);

  // Drag state
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const handleAddItem = async (result: SearchResult) => {
    const key = `${result.itemType}:${result.tmdbId}`;
    if (existingTmdbIds.has(key)) return;
    setShowDropdown(false);
    setSearchQuery("");

    if (mode === "create") {
      setPendingItems((prev) => [...prev, result]);
    } else {
      await addItemMutation.mutateAsync({
        tmdbId: result.tmdbId,
        itemType: result.itemType,
      });
    }
  };

  const handleRemoveItem = (identifier: string | number) => {
    if (mode === "create") {
      setPendingItems((prev) => prev.filter((_, i) => i !== identifier));
    } else {
      removeItemMutation.mutate(identifier as string);
    }
  };

  const reorderByIndices = async (from: number, to: number) => {
    if (from === to) return;
    if (mode === "create") {
      setPendingItems((prev) => {
        const next = [...prev];
        const [moved] = next.splice(from, 1);
        next.splice(to, 0, moved!);
        return next;
      });
    } else {
      if (!list) return;
      const next = [...list.items];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved!);
      await reorderMutation.mutateAsync(
        next.map((item, idx) => ({ id: item.id, position: idx + 1 })),
      );
    }
  };

  const handleMoveItem = async (fromIndex: number, direction: -1 | 1) => {
    await reorderByIndices(fromIndex, fromIndex + direction);
  };

  const handleDragStart = (idx: number) => {
    setDragIndex(idx);
  };

  const handleDragOver = (e: React.DragEvent, idx: number) => {
    e.preventDefault();
    setDragOverIndex(idx);
  };

  const handleDrop = async (e: React.DragEvent, toIndex: number) => {
    e.preventDefault();
    if (dragIndex !== null && dragIndex !== toIndex) {
      await reorderByIndices(dragIndex, toIndex);
    }
    setDragIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDragIndex(null);
    setDragOverIndex(null);
  };

  const handleSave = async () => {
    const trimmedTitle = title.trim();
    if (!trimmedTitle) return;
    setIsSaving(true);
    try {
      if (mode === "create") {
        const created = await createMutation.mutateAsync({
          title: trimmedTitle,
          description: description.trim() || undefined,
          isPublic,
          isRanked,
        });
        for (const item of pendingItems) {
          await addListItem(created.id, { tmdbId: item.tmdbId, itemType: item.itemType });
        }
        void navigate({
          to: "/profile/$username/lists/$listId",
          params: { username, listId: created.id },
        });
      } else {
        await updateMutation.mutateAsync({
          title: trimmedTitle,
          description: description.trim() || null,
          isPublic,
          isRanked,
        });
        void navigate({
          to: "/profile/$username/lists/$listId",
          params: { username, listId },
        });
      }
    } finally {
      setIsSaving(false);
    }
  };

  const canSave = title.trim().length > 0 && !isSaving;

  const currentItems = mode === "edit" ? (list?.items ?? []) : pendingItems;
  const showRanked = mode === "edit" ? (list?.isRanked ?? isRanked) : isRanked;

  if (mode === "edit" && detailQuery.isPending) {
    return (
      <div className="flex items-center gap-2 py-10 text-sm text-muted-foreground">
        <Spinner /> Loading list...
      </div>
    );
  }

  if (mode === "edit" && (detailQuery.isError || !list)) {
    return (
      <div className="border border-border/60 bg-card/30 p-4 text-sm text-destructive">
        This list could not be loaded.
      </div>
    );
  }

  return (
    <div>
      <Link
        to="/profile/$username/lists"
        params={{ username }}
        className="mb-6 inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-3 w-3" />
        Back to lists
      </Link>

      <div className="mb-8 flex items-center justify-between gap-4 border-b border-border/50 pb-5">
        <h1 className="font-mono text-xl font-bold text-foreground">
          {mode === "create" ? "New List" : "Edit List"}
        </h1>
        <div className="flex items-center gap-2">
          <Link
            to="/profile/$username/lists"
            params={{ username }}
            className="border border-border/70 px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground transition-colors hover:text-foreground"
          >
            Cancel
          </Link>
          <button
            type="button"
            disabled={!canSave}
            onClick={() => { void handleSave(); }}
            className="border border-primary/45 bg-primary/10 px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.12em] text-primary transition-colors disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSaving ? (
              <span className="inline-flex items-center gap-1.5">
                <Spinner className="h-3 w-3" /> Saving
              </span>
            ) : (
              "Save"
            )}
          </button>
        </div>
      </div>

      {/* Metadata fields */}
      <div className="mb-8 grid gap-6 lg:grid-cols-2">
        <div className="space-y-5">
          <div>
            <label className="mb-1.5 block font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
              Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value.slice(0, 100))}
              placeholder="Give your list a name..."
              className="w-full border border-border/75 bg-background/45 px-3 py-2 font-mono text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary/40"
            />
          </div>

          <div>
            <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
              Visibility
            </p>
            <div className="flex gap-2">
              {(["Public", "Private"] as const).map((v) => {
                const active = v === "Public" ? isPublic : !isPublic;
                return (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setIsPublic(v === "Public")}
                    className="flex-1 border px-2 py-2 font-mono text-[10px] uppercase tracking-[0.12em] transition-colors"
                    style={{
                      borderColor: active
                        ? "var(--primary)"
                        : "color-mix(in srgb, var(--border) 80%, transparent)",
                      color: active
                        ? "var(--primary)"
                        : "color-mix(in srgb, var(--foreground) 50%, transparent)",
                      background: active
                        ? "color-mix(in srgb, var(--primary) 8%, transparent)"
                        : "transparent",
                    }}
                  >
                    {v}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
              Ranking
            </p>
            <div className="flex gap-2">
              {(["Ranked", "Unranked"] as const).map((v) => {
                const active = v === "Ranked" ? isRanked : !isRanked;
                return (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setIsRanked(v === "Ranked")}
                    className="flex-1 border px-2 py-2 font-mono text-[10px] uppercase tracking-[0.12em] transition-colors"
                    style={{
                      borderColor: active
                        ? "var(--primary)"
                        : "color-mix(in srgb, var(--border) 80%, transparent)",
                      color: active
                        ? "var(--primary)"
                        : "color-mix(in srgb, var(--foreground) 50%, transparent)",
                      background: active
                        ? "color-mix(in srgb, var(--primary) 8%, transparent)"
                        : "transparent",
                    }}
                  >
                    {v}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div>
          <label className="mb-1.5 block font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
            Description{" "}
            <span className="normal-case tracking-normal opacity-60">
              (optional)
            </span>
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value.slice(0, 500))}
            placeholder="What's this list about?"
            rows={6}
            className="w-full resize-none border border-border/75 bg-background/45 px-3 py-2 font-mono text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary/40"
          />
          <p className="mt-1 font-mono text-[10px] text-muted-foreground/60">
            {description.length}/500
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="mb-4 border-t border-border/50 pt-6">
        <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
          Add films &amp; series
        </p>
        <div className="relative" ref={searchRef}>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground/50" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setShowDropdown(true);
              }}
              onFocus={() => setShowDropdown(true)}
              placeholder="Search by title..."
              className="w-full border border-border/75 bg-background/45 py-2 pl-9 pr-3 font-mono text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary/40"
            />
            {isSearchPending ? (
              <Spinner className="absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2" />
            ) : null}
          </div>

          {showDropdown && debouncedQuery.trim().length >= 2 && !isSearchPending ? (
            <div className="absolute left-0 right-0 top-full z-50 border border-t-0 border-border/80 bg-card shadow-lg">
              {searchResults.length === 0 ? (
                <p className="px-4 py-3 font-mono text-xs text-muted-foreground">
                  No results found.
                </p>
              ) : (
                <ul>
                  {searchResults.map((result) => {
                    const key = `${result.itemType}:${result.tmdbId}`;
                    const alreadyAdded = existingTmdbIds.has(key);
                    return (
                      <li key={key}>
                        <button
                          type="button"
                          disabled={alreadyAdded}
                          onClick={() => { void handleAddItem(result); }}
                          className="flex w-full items-center gap-3 border-b border-border/30 px-4 py-2.5 text-left transition-colors last:border-0 hover:bg-muted/10 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <div className="h-10 w-7 shrink-0 overflow-hidden border border-border/30 bg-muted/20">
                            {result.posterPath ? (
                              <img
                                src={getPosterUrl(result.posterPath)}
                                alt=""
                                className="h-full w-full object-cover"
                              />
                            ) : null}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate font-mono text-sm text-foreground">
                              {result.title}
                            </p>
                            {result.releaseYear ? (
                              <p className="font-mono text-[10px] text-muted-foreground">
                                {result.releaseYear}
                              </p>
                            ) : null}
                          </div>
                          <span className="shrink-0 border border-border/50 px-1.5 py-0.5 font-mono text-[8px] uppercase tracking-[0.14em] text-muted-foreground">
                            {result.itemType === "cinema" ? "Film" : "Series"}
                          </span>
                          {alreadyAdded ? (
                            <span className="shrink-0 font-mono text-[10px] text-muted-foreground">
                              Added
                            </span>
                          ) : null}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          ) : null}
        </div>
      </div>

      {/* Items list */}
      {currentItems.length === 0 ? (
        <div className="border border-dashed border-border/50 py-12 text-center">
          <p className="font-mono text-sm text-muted-foreground">
            Search above to add films and series to this list.
          </p>
        </div>
      ) : (
        <ul className="space-y-0">
          {currentItems.map((item, idx) => {
            const posterPath = "posterPath" in item ? item.posterPath : null;
            const itemTitle = "title" in item ? item.title : null;
            const releaseYear = "releaseYear" in item ? item.releaseYear : null;
            const itemId = "id" in item ? item.id : idx;

            const isRemovePending =
              mode === "edit" &&
              removeItemMutation.isPending &&
              removeItemMutation.variables === itemId;
            const isReorderPending = mode === "edit" && reorderMutation.isPending;

            const isDragging = dragIndex === idx;
            const isDragOver = dragOverIndex === idx && dragIndex !== idx;

            return (
              <li
                key={mode === "edit" ? (itemId as string) : idx}
                draggable
                onDragStart={() => handleDragStart(idx)}
                onDragOver={(e) => handleDragOver(e, idx)}
                onDrop={(e) => { void handleDrop(e, idx); }}
                onDragEnd={handleDragEnd}
                className="flex items-center gap-4 border-b border-border/40 py-4 last:border-0 transition-opacity"
                style={{
                  opacity: isDragging ? 0.4 : 1,
                  borderTop: isDragOver ? "2px solid var(--primary)" : undefined,
                  cursor: "grab",
                }}
              >
                {/* Drag handle */}
                <GripVertical className="h-4 w-4 shrink-0 cursor-grab text-muted-foreground/30" />

                {/* Rank number */}
                {showRanked ? (
                  <span className="w-6 shrink-0 text-right font-mono text-base font-bold text-muted-foreground/50">
                    {idx + 1}
                  </span>
                ) : null}

                {/* Poster */}
                <div className="h-[72px] w-12 shrink-0 overflow-hidden border border-border/40 bg-muted/20">
                  {posterPath ? (
                    <img
                      src={getPosterUrl(posterPath)}
                      alt=""
                      className="h-full w-full object-cover"
                      loading="lazy"
                      draggable={false}
                    />
                  ) : null}
                </div>

                {/* Info */}
                <div className="min-w-0 flex-1">
                  <p className="truncate font-mono text-base font-semibold text-foreground">
                    {itemTitle ?? "Unknown"}
                  </p>
                  {releaseYear ? (
                    <p className="font-mono text-sm text-muted-foreground">
                      {releaseYear}
                    </p>
                  ) : null}
                </div>

                {/* Controls */}
                <div className="flex shrink-0 items-center gap-1">
                  <button
                    type="button"
                    disabled={idx === 0 || isReorderPending}
                    onClick={() => { void handleMoveItem(idx, -1); }}
                    className="inline-flex h-7 w-7 items-center justify-center border border-border/50 text-muted-foreground transition-colors hover:text-foreground disabled:cursor-not-allowed disabled:opacity-30"
                  >
                    <ChevronUp className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    disabled={idx === currentItems.length - 1 || isReorderPending}
                    onClick={() => { void handleMoveItem(idx, 1); }}
                    className="inline-flex h-7 w-7 items-center justify-center border border-border/50 text-muted-foreground transition-colors hover:text-foreground disabled:cursor-not-allowed disabled:opacity-30"
                  >
                    <ChevronDown className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    disabled={isRemovePending || (mode === "edit" && removeItemMutation.isPending)}
                    onClick={() => handleRemoveItem(mode === "edit" ? (itemId as string) : idx)}
                    className="inline-flex h-7 w-7 items-center justify-center border border-border/50 text-muted-foreground/60 transition-colors hover:border-destructive/50 hover:text-destructive disabled:cursor-not-allowed disabled:opacity-30"
                  >
                    {isRemovePending ? (
                      <Spinner className="h-3 w-3" />
                    ) : (
                      <X className="h-3.5 w-3.5" />
                    )}
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};
