import { useMemo, useState } from "react";
import {
  ARCHIVE_PAGE_SIZE,
  languageOptions,
  periodOptions,
  SERIAL_MODULE_STYLES,
  sortOptions,
} from "@/features/serials/components/serial-archive/constants";
import { ArchiveLoadingMoreRow } from "@/features/serials/components/serial-archive/ArchiveLoadingMoreRow";
import { getBackdropUrl, getPosterUrl } from "@/features/serials/components/utils";
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
import { ArchiveMediaCard } from "@/features/media/archive/ArchiveMediaCard";
import { MediaArchivePage } from "@/features/media/archive/MediaArchivePage";

export const SerialsArchivePage = () => {
  const [selectedGenre, setSelectedGenre] = useState("all");
  const [selectedLanguage, setSelectedLanguage] = useState("all");
  const [selectedSort, setSelectedSort] =
    useState<SerialArchiveSort>("trending");
  const [selectedPeriod, setSelectedPeriod] =
    useState<SerialArchivePeriod>("this_year");

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

  const archiveItems = useMemo(
    () => (archivePages ? archivePages.flatMap((page) => page.items) : []),
    [archivePages],
  );

  const backdropUrls = useMemo(() => {
    return (firstPage?.items ?? [])
      .filter((series) => series.backdropPath)
      .slice(0, 10)
      .map((series) => getBackdropUrl(series.backdropPath));
  }, [firstPage]);

  const archiveRatingSource: ArchiveRatingSource =
    selectedSort === "rating_tmdb_desc" ? "tmdb" : "user";

  const archiveCount = firstPage?.filteredCount ?? archiveItems.length;
  const archiveCountLabel = formatArchiveCount(archiveCount);

  return (
    <MediaArchivePage
      moduleStyles={SERIAL_MODULE_STYLES}
      heroModuleLabel="Module 03"
      heroTitle="Serials"
      heroSubtitle="episodic series - limited runs - anthologies"
      backdropUrls={backdropUrls}
      archiveErrorMessage="Could not load the serial archive right now."
      emptyMessage="No titles match these filters right now."
      endOfArchiveMessage="End of serial archive."
      archiveCountLabel={archiveCountLabel}
      selectedGenre={selectedGenre}
      selectedLanguage={selectedLanguage}
      selectedSort={selectedSort}
      selectedPeriod={selectedPeriod}
      isPeriodDisabled={isPeriodDisabled}
      availableGenres={firstPage?.availableGenres}
      sortOptions={sortOptions}
      periodOptions={periodOptions}
      languageOptions={languageOptions}
      onSelectGenre={setSelectedGenre}
      onSelectSort={setSelectedSort}
      onSelectLanguage={setSelectedLanguage}
      onSelectPeriod={setSelectedPeriod}
      isPending={archiveQuery.isPending}
      isError={archiveQuery.isError}
      items={archiveItems}
      hasNextPage={archiveQuery.hasNextPage}
      isFetchingNextPage={archiveQuery.isFetchingNextPage}
      onFetchNextPage={() => void archiveQuery.fetchNextPage()}
      loadingMoreSlot={<ArchiveLoadingMoreRow />}
      renderCard={(series, _index, className, style) => (
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
          className={className}
          style={style}
        />
      )}
    />
  );
};
