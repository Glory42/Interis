import { useMemo, useState } from "react";
import {
  ARCHIVE_PAGE_SIZE,
  languageOptions,
  periodOptions,
  SERIES_MODULE_STYLES,
  sortOptions,
} from "@/features/tv/components/series-archive/constants";
import { ArchiveLoadingMoreRow } from "@/features/tv/components/series-archive/ArchiveLoadingMoreRow";
import {
  getCreatorYearLine,
  getRating,
  getSeriesStateLabel
} from "@/features/tv/components/series-archive/utils";
import {
  type SeriesArchivePeriod,
  type SeriesArchiveSort,
} from "@/features/tv/api";
import { useSeriesArchive } from "@/features/tv/hooks/useTv";
import { ArchiveMediaCard } from "@/features/media/archive/ArchiveMediaCard";
import { MediaArchivePage } from "@/features/media/archive/MediaArchivePage";
import { ArchiveSpotlight, type SpotlightItem } from "@/features/media/archive/ArchiveSpotlight";
import { dedupeBy } from "@/lib/dedupe-by";
import { getBackdropUrl, getPosterUrl } from "@/features/media/tmdb-images";
import { formatArchiveCount } from "@/features/media/labels";
import type { ArchiveRatingSource } from "@/features/media/types";

export const TvArchivePage = () => {
  const [selectedGenre, setSelectedGenre] = useState("all");
  const [selectedLanguage, setSelectedLanguage] = useState("all");
  const [selectedSort, setSelectedSort] =
    useState<SeriesArchiveSort>("trending");
  const [selectedPeriod, setSelectedPeriod] =
    useState<SeriesArchivePeriod>("this_year");

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
    () =>
      archivePages
        ? dedupeBy(
            archivePages.flatMap((page) => page.items),
            (item) => item.tmdbId,
          )
        : [],
    [archivePages],
  );

  const spotlightItems = useMemo<SpotlightItem[]>(
    () =>
      (firstPage?.items ?? [])
        .filter((series) => series.backdropPath)
        .slice(0, 5)
        .map((series) => ({
          tmdbId: series.tmdbId,
          title: series.title,
          year: series.firstAirYear,
          credit: series.creator ? `Created by ${series.creator}` : null,
          backdropUrl: getBackdropUrl(series.backdropPath),
          tmdbRating: series.tmdbRatingOutOfTen,
        })),
    [firstPage],
  );
  const modeLabel = sortOptions.find((option) => option.value === selectedSort)?.label ?? "Trending";

  const archiveRatingSource: ArchiveRatingSource =
    selectedSort === "rating_tmdb_desc" ? "tmdb" : "user";

  const archiveCount = firstPage?.filteredCount ?? archiveItems.length;
  const archiveCountLabel = formatArchiveCount(archiveCount);

  return (
    <MediaArchivePage
      moduleStyles={SERIES_MODULE_STYLES}
      heading="TV"
      spotlight={
        <ArchiveSpotlight
          kindLabel="TV"
          modeLabel={modeLabel}
          tone="series"
          detailRoute="/serials/$tmdbId"
          items={spotlightItems}
          isLoading={archiveQuery.isPending}
        />
      }
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
          moduleStyles={SERIES_MODULE_STYLES}
          subtitlePrimary={getCreatorYearLine(series)}
          className={className}
          style={style}
        />
      )}
    />
  );
};
