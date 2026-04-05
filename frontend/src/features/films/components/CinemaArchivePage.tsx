import { Link } from "@tanstack/react-router";
import { Award } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { type ArchiveMovie, type MovieArchiveSort } from "@/features/films/api";
import { getPosterUrl } from "@/features/films/components/utils";
import { useMovieArchive } from "@/features/films/hooks/useMovies";

const ARCHIVE_PAGE_SIZE = 24;

const CINEMA_MODULE_STYLES = {
  accent: "var(--module-cinema)",
  text: "var(--foreground)",
  muted: "color-mix(in srgb, var(--foreground) 68%, transparent)",
  faint: "color-mix(in srgb, var(--foreground) 36%, transparent)",
  border: "color-mix(in srgb, var(--module-cinema) 26%, transparent)",
  borderSoft: "color-mix(in srgb, var(--module-cinema) 16%, transparent)",
  panel: "color-mix(in srgb, var(--card) 92%, var(--background) 8%)",
  panelSoft: "color-mix(in srgb, var(--module-cinema) 10%, transparent)",
  panelStrong: "color-mix(in srgb, var(--module-cinema) 26%, transparent)",
  badge: "color-mix(in srgb, var(--module-cinema) 14%, transparent)",
} as const;

const sortOptions = [
  { id: "popular", label: "Popular", value: "trending" },
  { id: "rating", label: "Rating", value: "rating_user_desc" },
  { id: "year", label: "Year", value: "release_desc" },
  { id: "az", label: "A -> Z", value: "title_asc" },
] as const satisfies ReadonlyArray<{
  id: string;
  label: string;
  value: MovieArchiveSort;
}>;

type ArchiveSortTab = (typeof sortOptions)[number]["id"];

const getReleaseYearLabel = (movie: ArchiveMovie): string => {
  if (movie.releaseYear !== null) {
    return String(movie.releaseYear);
  }

  if (movie.releaseDate && movie.releaseDate.length >= 4) {
    return movie.releaseDate.slice(0, 4);
  }

  return "Unknown";
};

const getMovieStateLabel = (movie: ArchiveMovie): "Watched" | "Queued" | null => {
  if (movie.viewerHasLogged) {
    return "Watched";
  }

  if (movie.viewerWatchlisted) {
    return "Queued";
  }

  return null;
};

const ArchiveMovieCard = ({ movie }: { movie: ArchiveMovie }) => {
  const stateLabel = getMovieStateLabel(movie);

  return (
    <Link
      to="/cinema/$tmdbId"
      params={{ tmdbId: String(movie.tmdbId) }}
      className="block w-full text-left"
      viewTransition
    >
      <div
        className="relative mb-3 aspect-[2/3] overflow-hidden border transition-colors"
        style={{
          borderColor: CINEMA_MODULE_STYLES.border,
          background: CINEMA_MODULE_STYLES.panel,
        }}
      >
        {movie.posterPath ? (
          <img
            src={getPosterUrl(movie.posterPath)}
            alt={`${movie.title} poster`}
            className="h-full w-full object-cover"
            loading="lazy"
          />
        ) : (
          <div
            className="flex h-full w-full flex-col items-center justify-center gap-2"
            style={{ background: CINEMA_MODULE_STYLES.panelSoft }}
          >
            <div
              className="flex h-8 w-8 items-center justify-center"
              style={{ background: CINEMA_MODULE_STYLES.panelStrong }}
            >
              <Award
                className="h-4 w-4"
                style={{ color: CINEMA_MODULE_STYLES.accent }}
              />
            </div>
            <span
              className="font-mono text-[8px] uppercase tracking-[0.22em]"
              style={{ color: CINEMA_MODULE_STYLES.faint }}
            >
              No Art
            </span>
          </div>
        )}

        {stateLabel ? (
          <div className="absolute right-2 top-2">
            <span
              className="border px-2 py-0.5 font-mono text-[9px] tracking-[0.16em]"
              style={{
                borderColor: CINEMA_MODULE_STYLES.accent,
                color: CINEMA_MODULE_STYLES.accent,
                background: CINEMA_MODULE_STYLES.badge,
              }}
            >
              {stateLabel}
            </span>
          </div>
        ) : null}
      </div>

      <p
        className="truncate font-mono text-[11px] leading-tight"
        style={{ color: CINEMA_MODULE_STYLES.text }}
      >
        {movie.title}
      </p>
      <p className="truncate font-mono text-[10px]" style={{ color: CINEMA_MODULE_STYLES.muted }}>
        <span>{movie.director ?? "Unknown director"}</span>
        <span style={{ color: CINEMA_MODULE_STYLES.faint }}>
          {" "}
          · {getReleaseYearLabel(movie)}
        </span>
      </p>
    </Link>
  );
};

const ArchiveSkeletonGrid = () => {
  return (
    <div className="grid grid-cols-2 gap-4 md:gap-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
      {Array.from({ length: 12 }).map((_, index) => (
        <div key={`cinema-archive-skeleton-${index}`}>
          <div
            className="aspect-[2/3] animate-pulse border"
            style={{
              borderColor: CINEMA_MODULE_STYLES.border,
              background: CINEMA_MODULE_STYLES.panel,
            }}
          />
          <div
            className="mt-3 h-3 w-11/12 animate-pulse"
            style={{ background: CINEMA_MODULE_STYLES.borderSoft }}
          />
          <div
            className="mt-1 h-2.5 w-3/4 animate-pulse"
            style={{ background: CINEMA_MODULE_STYLES.borderSoft }}
          />
        </div>
      ))}
    </div>
  );
};

export const CinemaArchivePage = () => {
  const [activeSort, setActiveSort] = useState<ArchiveSortTab>("popular");
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  const selectedSort = useMemo(() => {
    return sortOptions.find((option) => option.id === activeSort)?.value ?? "trending";
  }, [activeSort]);

  const archiveQuery = useMovieArchive(
    "",
    "",
    selectedSort,
    "all_time",
    ARCHIVE_PAGE_SIZE,
  );

  const archivePages = archiveQuery.data?.pages;
  const firstPage = archivePages?.[0] ?? null;
  const { fetchNextPage, hasNextPage, isFetchingNextPage } = archiveQuery;

  const archiveItems = useMemo(() => {
    if (!archivePages) {
      return [];
    }

    return archivePages.flatMap((page) => page.items);
  }, [archivePages]);

  const archiveCount = firstPage?.filteredCount ?? archiveItems.length;

  useEffect(() => {
    const sentinelNode = loadMoreRef.current;
    if (!sentinelNode || !hasNextPage) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (!entry?.isIntersecting || isFetchingNextPage || !hasNextPage) {
          return;
        }

        void fetchNextPage();
      },
      {
        rootMargin: "280px 0px 280px 0px",
        threshold: 0.01,
      },
    );

    observer.observe(sentinelNode);

    return () => {
      observer.disconnect();
    };
  }, [
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    archiveItems.length,
  ]);

  return (
    <main className="relative mx-auto w-full max-w-[1600px]">
      <div className="px-4 py-8">
        <div className="mb-8">
          <p
            className="mb-1 font-mono text-[10px] uppercase tracking-[0.22em]"
            style={{ color: CINEMA_MODULE_STYLES.accent }}
          >
            Module 02
          </p>
          <h2
            className="mb-2 font-mono text-3xl font-bold md:text-5xl"
            style={{ color: CINEMA_MODULE_STYLES.text }}
          >
            Cinema
          </h2>
          <p className="font-mono text-sm" style={{ color: CINEMA_MODULE_STYLES.muted }}>
            feature films - documentaries - shorts
          </p>
        </div>

        <div
          className="mb-8 flex flex-wrap items-center gap-3 border-b pb-4 sm:gap-4"
          style={{ borderColor: CINEMA_MODULE_STYLES.border }}
        >
          <span
            className="font-mono text-[10px] uppercase tracking-[0.22em]"
            style={{ color: CINEMA_MODULE_STYLES.faint }}
          >
            Sort:
          </span>

          <div className="flex flex-wrap gap-2">
            {sortOptions.map((option) => {
              const isActive = activeSort === option.id;

              return (
                <button
                  key={option.id}
                  type="button"
                  className="border px-3 py-1.5 font-mono text-[10px] transition-all"
                  style={{
                    borderColor: isActive
                      ? CINEMA_MODULE_STYLES.accent
                      : CINEMA_MODULE_STYLES.borderSoft,
                    color: isActive
                      ? CINEMA_MODULE_STYLES.accent
                      : CINEMA_MODULE_STYLES.faint,
                    background: isActive
                      ? "color-mix(in srgb, var(--module-cinema) 8%, transparent)"
                      : "transparent",
                  }}
                  onClick={() => {
                    setActiveSort(option.id);
                  }}
                >
                  {option.label}
                </button>
              );
            })}
          </div>

          <span
            className="ml-auto font-mono text-[10px]"
            style={{ color: CINEMA_MODULE_STYLES.faint }}
          >
            {archiveCount.toLocaleString()} titles
          </span>
        </div>

        {archiveQuery.isPending ? <ArchiveSkeletonGrid /> : null}

        {archiveQuery.isError ? (
          <div
            className="border p-4 font-mono text-xs"
            style={{
              borderColor: CINEMA_MODULE_STYLES.border,
              color: CINEMA_MODULE_STYLES.muted,
              background: CINEMA_MODULE_STYLES.panel,
            }}
          >
            Could not load the cinema archive right now.
          </div>
        ) : null}

        {!archiveQuery.isPending && !archiveQuery.isError && archiveItems.length === 0 ? (
          <div
            className="border p-8 text-center font-mono text-xs"
            style={{
              borderColor: CINEMA_MODULE_STYLES.border,
              color: CINEMA_MODULE_STYLES.muted,
              background: CINEMA_MODULE_STYLES.panel,
            }}
          >
            No titles match this sort right now.
          </div>
        ) : null}

        {!archiveQuery.isPending && !archiveQuery.isError && archiveItems.length > 0 ? (
          <>
            <div className="grid grid-cols-2 gap-4 md:gap-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
              {archiveItems.map((movie) => (
                <ArchiveMovieCard key={`cinema-archive-item-${movie.tmdbId}`} movie={movie} />
              ))}
            </div>

            <div ref={loadMoreRef} className="h-4 w-full" aria-hidden />

            {archiveQuery.isFetchingNextPage ? (
              <p
                className="mt-5 font-mono text-[11px]"
                style={{ color: CINEMA_MODULE_STYLES.muted }}
              >
                Loading more cinema titles...
              </p>
            ) : null}

            {!archiveQuery.hasNextPage ? (
              <p
                className="mt-5 text-center font-mono text-[11px]"
                style={{ color: CINEMA_MODULE_STYLES.faint }}
              >
                End of cinema archive.
              </p>
            ) : null}
          </>
        ) : null}
      </div>
    </main>
  );
};
