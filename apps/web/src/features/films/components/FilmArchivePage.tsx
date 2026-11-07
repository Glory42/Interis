import { useMemo, useState } from "react";
import {
  ARCHIVE_PAGE_SIZE,
  FILM_MODULE_STYLES,
  languageOptions,
  periodOptions,
  sortOptions,
} from "@/features/films/components/film-archive/constants";
import {
  getFilmStateLabel,
  getRating,
  getReleaseYearLabel
} from "@/features/films/components/film-archive/utils";
import type { FilmArchivePeriod, FilmArchiveSort } from "@/features/films/api";
import { useFilmArchive } from "@/features/films/hooks/useFilms";
import { ArchiveMediaCard } from "@/features/media/archive/ArchiveMediaCard";
import { MediaArchivePage } from "@/features/media/archive/MediaArchivePage";
import { ArchiveSpotlight, type SpotlightItem } from "@/features/media/archive/ArchiveSpotlight";
import { dedupeBy } from "@/lib/dedupe-by";
import { getBackdropUrl, getPosterUrl } from "@/features/media/tmdb-images";
import { formatArchiveCount } from "@/features/media/labels";
import type { ArchiveRatingSource } from "@/features/media/types";

export const FilmArchivePage = () => {
  const [selectedSort, setSelectedSort] = useState<FilmArchiveSort>("trending");
  const [selectedGenre, setSelectedGenre] = useState("all");
  const [selectedLanguage, setSelectedLanguage] = useState("all");
  const [selectedPeriod, setSelectedPeriod] =
    useState<FilmArchivePeriod>("this_year");

  const effectivePeriod = selectedSort === "trending" ? "all_time" : selectedPeriod;
  const isPeriodDisabled = selectedSort === "trending";

  const archiveRatingSource: ArchiveRatingSource =
    selectedSort === "rating_tmdb_desc" ? "tmdb" : "user";

  const archiveQuery = useFilmArchive(
    selectedGenre === "all" ? "" : selectedGenre,
    selectedLanguage === "all" ? "" : selectedLanguage,
    selectedSort,
    effectivePeriod,
    ARCHIVE_PAGE_SIZE,
  );

  const archivePages = archiveQuery.data?.pages;
  const firstPage = archivePages?.[0] ?? null;

  const archiveItems = useMemo(() => {
    if (!archivePages) {
      return [];
    }

    return dedupeBy(
      archivePages.flatMap((page) => page.items),
      (item) => item.tmdbId,
    );
  }, [archivePages]);

  const spotlightItems = useMemo<SpotlightItem[]>(
    () =>
      (firstPage?.items ?? [])
        .filter((movie) => movie.backdropPath)
        .slice(0, 5)
        .map((movie) => ({
          tmdbId: movie.tmdbId,
          title: movie.title,
          year: movie.releaseYear,
          credit: movie.director ? `Directed by ${movie.director}` : null,
          backdropUrl: getBackdropUrl(movie.backdropPath),
          tmdbRating: movie.tmdbRatingOutOfTen,
        })),
    [firstPage],
  );
  const modeLabel = sortOptions.find((option) => option.value === selectedSort)?.label ?? "Trending";

  const archiveCount = firstPage?.filteredCount ?? archiveItems.length;
  const archiveCountLabel = formatArchiveCount(archiveCount);

  return (
    <MediaArchivePage
      moduleStyles={FILM_MODULE_STYLES}
      heading="Films"
      spotlight={
        <ArchiveSpotlight
          kindLabel="Films"
          modeLabel={modeLabel}
          tone="film"
          detailRoute="/movies/$tmdbId"
          items={spotlightItems}
          isLoading={archiveQuery.isPending}
        />
      }
      archiveErrorMessage="Could not load the movie archive right now."
      emptyMessage="No titles match these filters right now."
      endOfArchiveMessage="End of movie archive."
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
      renderCard={(movie, _index, className, style) => (
        <ArchiveMediaCard
          key={`movie-archive-item-${movie.tmdbId}`}
          kind="movie"
          tmdbId={movie.tmdbId}
          title={movie.title}
          posterPath={movie.posterPath}
          getPosterUrl={getPosterUrl}
          stateLabel={getFilmStateLabel(movie)}
          rating={getRating(movie, archiveRatingSource)}
          ratingSource={archiveRatingSource}
          moduleStyles={FILM_MODULE_STYLES}
          subtitlePrimary={movie.director ?? "Unknown director"}
          subtitleSecondary={getReleaseYearLabel(movie)}
          className={className}
          style={style}
        />
      )}
    />
  );
};
