import { useMemo, useState } from "react";
import {
  ARCHIVE_PAGE_SIZE,
  MOVIE_MODULE_STYLES,
  languageOptions,
  periodOptions,
  sortOptions,
} from "@/features/movies/components/movie-archive/constants";
import { getBackdropUrl, getPosterUrl } from "@/features/movies/components/utils";
import {
  getMovieStateLabel,
  getRating,
  getReleaseYearLabel,
  formatArchiveCount,
} from "@/features/movies/components/movie-archive/utils";
import type { ArchiveRatingSource } from "@/features/movies/components/movie-archive/types";
import type { MovieArchivePeriod, MovieArchiveSort } from "@/features/movies/api";
import { useMovieArchive } from "@/features/movies/hooks/useMovies";
import { ArchiveMediaCard } from "@/features/media/archive/ArchiveMediaCard";
import { MediaArchivePage } from "@/features/media/archive/MediaArchivePage";

export const MovieArchivePage = () => {
  const [selectedSort, setSelectedSort] = useState<MovieArchiveSort>("trending");
  const [selectedGenre, setSelectedGenre] = useState("all");
  const [selectedLanguage, setSelectedLanguage] = useState("all");
  const [selectedPeriod, setSelectedPeriod] =
    useState<MovieArchivePeriod>("this_year");

  const effectivePeriod = selectedSort === "trending" ? "all_time" : selectedPeriod;
  const isPeriodDisabled = selectedSort === "trending";

  const archiveRatingSource: ArchiveRatingSource =
    selectedSort === "rating_tmdb_desc" ? "tmdb" : "user";

  const archiveQuery = useMovieArchive(
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

    return archivePages.flatMap((page) => page.items);
  }, [archivePages]);

  const backdropUrls = useMemo(() => {
    return (firstPage?.items ?? [])
      .filter((movie) => movie.backdropPath)
      .slice(0, 10)
      .map((movie) => getBackdropUrl(movie.backdropPath));
  }, [firstPage]);

  const archiveCount = firstPage?.filteredCount ?? archiveItems.length;
  const archiveCountLabel = formatArchiveCount(archiveCount);

  return (
    <MediaArchivePage
      moduleStyles={MOVIE_MODULE_STYLES}
      heroModuleLabel="Module 02"
      heroTitle="Movie"
      heroSubtitle="feature films - documentaries - shorts"
      backdropUrls={backdropUrls}
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
          stateLabel={getMovieStateLabel(movie)}
          rating={getRating(movie, archiveRatingSource)}
          ratingSource={archiveRatingSource}
          moduleStyles={MOVIE_MODULE_STYLES}
          subtitlePrimary={movie.director ?? "Unknown director"}
          subtitleSecondary={getReleaseYearLabel(movie)}
          className={className}
          style={style}
        />
      )}
    />
  );
};
