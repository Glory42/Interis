import { useEffect, useMemo, useRef, useState } from "react";
import {
  ARCHIVE_PAGE_SIZE,
  languageOptions,
  periodOptions,
  SERIAL_MODULE_STYLES,
  sortOptions,
} from "@/features/serials/components/serial-archive/constants";
import { ArchiveLoadingMoreRow } from "@/features/serials/components/serial-archive/ArchiveLoadingMoreRow";
import { getPosterUrl } from "@/features/serials/components/utils";
import {
  getCreatorYearLine,
  getRating,
  getSeriesStateLabel,
  formatArchiveCount,
} from "@/features/serials/components/serial-archive/utils";
import { type ArchiveRatingSource } from "@/features/serials/components/serial-archive/types";
import {
  type SerialArchivePeriod,
  type SerialArchiveSort,
} from "@/features/serials/api";
import { useSeriesArchive } from "@/features/serials/hooks/useSerials";
import { ArchiveFilterControls } from "@/features/media-archive/components/ArchiveFilterControls";
import { ArchiveMediaCard } from "@/features/media-archive/components/ArchiveMediaCard";
import { ArchiveSkeletonGrid } from "@/features/media-archive/components/ArchiveSkeletonGrid";
import type { ArchiveMenuKey } from "@/features/media-archive/types";

export const SerialsArchivePage = () => {
  const [selectedGenre, setSelectedGenre] = useState("all");
  const [selectedLanguage, setSelectedLanguage] = useState("all");
  const [selectedSort, setSelectedSort] =
    useState<SerialArchiveSort>("trending");
  const [selectedPeriod, setSelectedPeriod] =
    useState<SerialArchivePeriod>("this_year");
  const [openMenu, setOpenMenu] = useState<ArchiveMenuKey | null>(null);

  const controlsRef = useRef<HTMLDivElement | null>(null);
  const [hasStaggeredInitialLoad, setHasStaggeredInitialLoad] = useState(false);

  const effectivePeriod = selectedSort === "trending" ? "all_time" : selectedPeriod;
  const isPeriodDisabled = selectedSort === "trending";

  const archiveQuery = useSeriesArchive(
    selectedGenre === "all" ? "" : selectedGenre,
    selectedLanguage === "all" ? "" : selectedLanguage,
    selectedSort,
    effectivePeriod,
    ARCHIVE_PAGE_SIZE,
  );

  const archivePages = archiveQuery.data?.pages;
  const firstPage = archivePages?.[0] ?? null;
  const { fetchNextPage, hasNextPage, isFetchingNextPage } = archiveQuery;

  const archiveItems = useMemo(
    () => (archivePages ? archivePages.flatMap((page) => page.items) : []),
    [archivePages],
  );

  // Latches one frame after the first non-empty result set has painted, so
  // that initial paint still renders with the stagger classes present; only
  // "load more"/filter-change renders after this effect fires get skipped.
  // Deferred via rAF (not set synchronously during render or in the effect
  // body) — setting it synchronously would flip the flag before the very
  // commit it's supposed to gate ever reaches the screen.
  useEffect(() => {
    if (hasStaggeredInitialLoad || archiveItems.length === 0) {
      return;
    }

    const frame = window.requestAnimationFrame(() => {
      setHasStaggeredInitialLoad(true);
    });

    return () => {
      window.cancelAnimationFrame(frame);
    };
  }, [hasStaggeredInitialLoad, archiveItems.length]);

  const selectedSortLabel = useMemo(() => {
    return (
      sortOptions.find((option) => option.value === selectedSort)?.label ??
      "Trending"
    );
  }, [selectedSort]);

  const selectedLanguageLabel = useMemo(() => {
    return (
      languageOptions.find((option) => option.value === selectedLanguage)
        ?.label ?? "All languages"
    );
  }, [selectedLanguage]);

  const selectedPeriodLabel = useMemo(() => {
    if (selectedSort === "trending") {
      return "Weekly trending";
    }

    return (
      periodOptions.find((option) => option.value === selectedPeriod)?.label ??
      "This year"
    );
  }, [selectedPeriod, selectedSort]);

  const archiveRatingSource: ArchiveRatingSource =
    selectedSort === "rating_tmdb_desc" ? "tmdb" : "user";

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
            style={{ color: SERIAL_MODULE_STYLES.accent }}
          >
            Module 03
          </p>
          <h2
            className="mb-2 font-mono text-3xl font-bold md:text-5xl"
            style={{ color: SERIAL_MODULE_STYLES.text }}
          >
            Serials
          </h2>
          <p
            className="font-mono text-sm"
            style={{ color: SERIAL_MODULE_STYLES.muted }}
          >
            episodic series - limited runs - anthologies
          </p>
        </div>

        <ArchiveFilterControls
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
          selectedGenre={selectedGenre}
          selectedLanguage={selectedLanguage}
          selectedSort={selectedSort}
          selectedPeriod={selectedPeriod}
          selectedSortLabel={selectedSortLabel}
          selectedLanguageLabel={selectedLanguageLabel}
          selectedPeriodLabel={selectedPeriodLabel}
          isPeriodDisabled={isPeriodDisabled}
          availableGenres={firstPage?.availableGenres}
          archiveCountLabel={archiveCountLabel}
          sortOptions={sortOptions}
          periodOptions={periodOptions}
          languageOptions={languageOptions}
          onSelectGenre={setSelectedGenre}
          onSelectSort={setSelectedSort}
          onSelectLanguage={setSelectedLanguage}
          onSelectPeriod={setSelectedPeriod}
          moduleStyles={SERIAL_MODULE_STYLES}
        />

        {archiveQuery.isPending ? <ArchiveSkeletonGrid moduleStyles={SERIAL_MODULE_STYLES} /> : null}

        {archiveQuery.isError ? (
          <div
            className="rounded-xl border p-4 font-mono text-xs"
            style={{
              borderColor: SERIAL_MODULE_STYLES.border,
              color: SERIAL_MODULE_STYLES.muted,
              background: SERIAL_MODULE_STYLES.panel,
            }}
          >
            Could not load the serial archive right now.
          </div>
        ) : null}

        {!archiveQuery.isPending &&
        !archiveQuery.isError &&
        archiveItems.length === 0 ? (
          <div
            className="rounded-xl border p-8 text-center font-mono text-xs"
            style={{
              borderColor: SERIAL_MODULE_STYLES.border,
              color: SERIAL_MODULE_STYLES.muted,
              background: SERIAL_MODULE_STYLES.panel,
            }}
          >
            No titles match these filters right now.
          </div>
        ) : null}

        {!archiveQuery.isPending &&
        !archiveQuery.isError &&
        archiveItems.length > 0 ? (
          <>
            <div className="grid grid-cols-2 gap-4 md:gap-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
              {archiveItems.map((series, index) => (
                <ArchiveMediaCard
                  key={`serial-archive-grid-${series.tmdbId}`}
                  kind="serial"
                  tmdbId={series.tmdbId}
                  title={series.title}
                  posterPath={series.posterPath}
                  getPosterUrl={getPosterUrl}
                  stateLabel={getSeriesStateLabel(series)}
                  rating={getRating(series, archiveRatingSource)}
                  ratingSource={archiveRatingSource}
                  moduleStyles={SERIAL_MODULE_STYLES}
                  subtitlePrimary={getCreatorYearLine(series)}
                  className={hasStaggeredInitialLoad ? undefined : "animate-fade-up"}
                  style={
                    hasStaggeredInitialLoad
                      ? undefined
                      : { animationDelay: `${Math.min(index * 40, 400)}ms` }
                  }
                />
              ))}
            </div>

            {hasNextPage ? (
              <div className="mt-5 flex justify-center">
                <button
                  type="button"
                  disabled={isFetchingNextPage}
                  className="rounded-full border px-4 py-2 font-mono text-[10px] uppercase tracking-[0.14em] transition-colors disabled:cursor-not-allowed disabled:opacity-60"
                  style={{
                    borderColor: SERIAL_MODULE_STYLES.border,
                    color: SERIAL_MODULE_STYLES.muted,
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
                style={{ color: SERIAL_MODULE_STYLES.faint }}
              >
                End of serial archive.
              </p>
            )}

            {isFetchingNextPage ? <ArchiveLoadingMoreRow /> : null}
          </>
        ) : null}
      </div>
    </main>
  );
};
