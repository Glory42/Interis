import { useEffect, useMemo, useRef, useState } from "react";
import { ArchiveMovieCard } from "@/features/films/components/cinema-archive/ArchiveMovieCard";
import { ArchiveSkeletonGrid } from "@/features/films/components/cinema-archive/ArchiveSkeletonGrid";
import { ArchiveSortControls } from "@/features/films/components/cinema-archive/ArchiveSortControls";
import {
  ARCHIVE_PAGE_SIZE,
  CINEMA_MODULE_STYLES,
  languageOptions,
  periodOptions,
  sortOptions,
} from "@/features/films/components/cinema-archive/constants";
import type { OpenMenu } from "@/features/films/components/cinema-archive/types";
import { formatArchiveCount } from "@/features/films/components/cinema-archive/utils";
import type { MovieArchivePeriod, MovieArchiveSort } from "@/features/films/api";
import { useMovieArchive } from "@/features/films/hooks/useMovies";

export const CinemaArchivePage = () => {
  const [selectedSort, setSelectedSort] = useState<MovieArchiveSort>("trending");
  const [selectedGenre, setSelectedGenre] = useState("all");
  const [selectedLanguage, setSelectedLanguage] = useState("all");
  const [selectedPeriod, setSelectedPeriod] =
    useState<MovieArchivePeriod>("this_year");
  const [openMenu, setOpenMenu] = useState<OpenMenu>(null);

  const controlsRef = useRef<HTMLDivElement | null>(null);

  const selectedSortLabel = useMemo(() => {
    return (
      sortOptions.find((option) => option.value === selectedSort)?.label ?? "Trending"
    );
  }, [selectedSort]);

  const selectedLanguageLabel = useMemo(() => {
    return (
      languageOptions.find((option) => option.value === selectedLanguage)?.label ??
      "All languages"
    );
  }, [selectedLanguage]);

  const effectivePeriod = selectedSort === "trending" ? "all_time" : selectedPeriod;
  const isPeriodDisabled = selectedSort === "trending";
  const selectedPeriodLabel =
    isPeriodDisabled
      ? "Weekly trending"
      : (periodOptions.find((option) => option.value === selectedPeriod)?.label ??
        "This year");

  const archiveQuery = useMovieArchive(
    selectedGenre === "all" ? "" : selectedGenre,
    selectedLanguage === "all" ? "" : selectedLanguage,
    selectedSort,
    effectivePeriod,
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
  const archiveCountLabel = formatArchiveCount(archiveCount);

  useEffect(() => {
    if (!openMenu) {
      return;
    }

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target;
      if (!(target instanceof Node)) {
        return;
      }

      if (!controlsRef.current?.contains(target)) {
        setOpenMenu(null);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpenMenu(null);
      }
    };

    window.addEventListener("pointerdown", handlePointerDown);
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [openMenu]);

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
          controlsRef={controlsRef}
          openMenu={openMenu}
          onBlurCapture={(event) => {
            if (!openMenu) {
              return;
            }

            const nextTarget = event.relatedTarget;
            if (
              !(nextTarget instanceof Node) ||
              !event.currentTarget.contains(nextTarget)
            ) {
              setOpenMenu(null);
            }
          }}
          onToggleMenu={(menu) => {
            if (isPeriodDisabled && menu === "period") {
              return;
            }

            setOpenMenu((current) => (current === menu ? null : menu));
          }}
          onCloseMenu={() => setOpenMenu(null)}
          archiveCountLabel={archiveCountLabel}
          selectedGenre={selectedGenre}
          selectedLanguage={selectedLanguage}
          selectedSort={selectedSort}
          selectedPeriod={selectedPeriod}
          selectedSortLabel={selectedSortLabel}
          selectedLanguageLabel={selectedLanguageLabel}
          selectedPeriodLabel={selectedPeriodLabel}
          availableGenres={firstPage?.availableGenres}
          isPeriodDisabled={isPeriodDisabled}
          onSelectGenre={setSelectedGenre}
          onSelectSort={setSelectedSort}
          onSelectLanguage={setSelectedLanguage}
          onSelectPeriod={setSelectedPeriod}
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
            No titles match these filters right now.
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
