import { useMemo, useState } from "react";
import { ArchiveMovieCard } from "@/features/films/components/cinema-archive/ArchiveMovieCard";
import { ArchiveSkeletonGrid } from "@/features/films/components/cinema-archive/ArchiveSkeletonGrid";
import { ArchiveSortControls } from "@/features/films/components/cinema-archive/ArchiveSortControls";
import {
  type ArchiveSortTab,
  ARCHIVE_PAGE_SIZE,
  CINEMA_MODULE_STYLES,
  sortOptions,
} from "@/features/films/components/cinema-archive/constants";
import { formatArchiveCount } from "@/features/films/components/cinema-archive/utils";
import { useMovieArchive } from "@/features/films/hooks/useMovies";

export const CinemaArchivePage = () => {
  const [activeSort, setActiveSort] = useState<ArchiveSortTab>("popular");

  const selectedSort = useMemo(() => {
    return sortOptions.find((option) => option.id === activeSort)?.value ?? "trending";
  }, [activeSort]);

  const archiveQuery = useMovieArchive("", "", selectedSort, "all_time", ARCHIVE_PAGE_SIZE);

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
  const archiveCountLabel = formatArchiveCount(archiveCount);

  return (
    <main className="relative mx-auto w-full max-w-400">
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
          <p
            className="font-mono text-sm"
            style={{ color: CINEMA_MODULE_STYLES.muted }}
          >
            feature films - documentaries - shorts
          </p>
        </div>

        <ArchiveSortControls
          activeSort={activeSort}
          archiveCountLabel={archiveCountLabel}
          onSetSort={setActiveSort}
        />

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

            {hasNextPage ? (
              <div className="mt-5 flex justify-center">
                <button
                  type="button"
                  disabled={isFetchingNextPage}
                  className="border px-4 py-2 font-mono text-[10px] uppercase tracking-[0.14em] transition-all disabled:cursor-not-allowed disabled:opacity-60"
                  style={{
                    borderColor: CINEMA_MODULE_STYLES.border,
                    color: CINEMA_MODULE_STYLES.muted,
                    background: "transparent",
                  }}
                  onClick={() => {
                    void fetchNextPage();
                  }}
                >
                  {isFetchingNextPage ? "Loading..." : "Show more"}
                </button>
              </div>
            ) : (
              <p
                className="mt-5 text-center font-mono text-[11px]"
                style={{ color: CINEMA_MODULE_STYLES.faint }}
              >
                End of cinema archive.
              </p>
            )}
          </>
        ) : null}
      </div>
    </main>
  );
};
