import { useEffect, useMemo, useRef, useState } from "react";
import {
  ARCHIVE_PAGE_SIZE,
  languageOptions,
  periodOptions,
  SERIAL_MODULE_STYLES,
  sortOptions,
} from "@/features/serials/components/serial-archive/constants";
import { ArchiveLoadingMoreRow } from "@/features/serials/components/serial-archive/ArchiveLoadingMoreRow";
import { ArchiveSkeletonGrid } from "@/features/serials/components/serial-archive/ArchiveSkeletonGrid";
import { GridSeriesCard } from "@/features/serials/components/serial-archive/GridSeriesCard";
import { SerialArchiveControls } from "@/features/serials/components/serial-archive/SerialArchiveControls";
import {
  type ArchiveRatingSource,
  type OpenMenu,
} from "@/features/serials/components/serial-archive/types";
import { formatArchiveCount } from "@/features/serials/components/serial-archive/utils";
import {
  type SerialArchivePeriod,
  type SerialArchiveSort,
} from "@/features/serials/api";
import { useSeriesArchive } from "@/features/serials/hooks/useSerials";

export const SerialsArchivePage = () => {
  const [selectedGenre, setSelectedGenre] = useState("all");
  const [selectedLanguage, setSelectedLanguage] = useState("all");
  const [selectedSort, setSelectedSort] =
    useState<SerialArchiveSort>("trending");
  const [selectedPeriod, setSelectedPeriod] =
    useState<SerialArchivePeriod>("this_year");
  const [openMenu, setOpenMenu] = useState<OpenMenu>(null);

  const controlsRef = useRef<HTMLDivElement | null>(null);

  const archiveQuery = useSeriesArchive(
    selectedGenre === "all" ? "" : selectedGenre,
    selectedLanguage === "all" ? "" : selectedLanguage,
    selectedSort,
    selectedPeriod,
    ARCHIVE_PAGE_SIZE,
  );

  const archivePages = archiveQuery.data?.pages;
  const firstPage = archivePages?.[0] ?? null;
  const { fetchNextPage, hasNextPage, isFetchingNextPage } = archiveQuery;

  const archiveItems = useMemo(
    () => (archivePages ? archivePages.flatMap((page) => page.items) : []),
    [archivePages],
  );

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
    return (
      periodOptions.find((option) => option.value === selectedPeriod)?.label ??
      "This year"
    );
  }, [selectedPeriod]);

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

        <SerialArchiveControls
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
          availableGenres={firstPage?.availableGenres}
          archiveCountLabel={archiveCountLabel}
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
            className="border p-8 text-center font-mono text-xs"
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
              {archiveItems.map((series) => (
                <GridSeriesCard
                  key={`serial-archive-grid-${series.tmdbId}`}
                  series={series}
                  ratingSource={archiveRatingSource}
                />
              ))}
            </div>

            {hasNextPage ? (
              <div className="mt-5 flex justify-center">
                <button
                  type="button"
                  disabled={isFetchingNextPage}
                  className="border px-4 py-2 font-mono text-[10px] uppercase tracking-[0.14em] transition-all disabled:cursor-not-allowed disabled:opacity-60"
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
