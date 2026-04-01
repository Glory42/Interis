import {
  discoverMovies as tmdbDiscover,
  getMovieDirector,
  getMovieGenres,
  type TMDBMovieGenre,
} from "../../../../infrastructure/tmdb/cinemas";
import { toFeaturedMovie } from "../../helpers/movies-format.helper";
import { MoviesRepository } from "../../repositories/movies.repository";
import type { CinemaArchiveResponse } from "../../types/movies.types";
import {
  getArchivePeriodWindow,
  getTmdbMinVoteCountForPeriod,
} from "./movies-archive-shared.helper";
import type { MoviesArchiveQueryInput } from "./movies-archive.types";
import {
  getLocalArchiveAggregatesByTmdbIds,
  mapTmdbArchiveMovie,
} from "./movies-archive-mapper.helper";

export const getArchiveFromTmdbCatalog = async (
  input: MoviesArchiveQueryInput,
): Promise<CinemaArchiveResponse> => {
  const availableTmdbGenres = await getMovieGenres();
  const genreById = new Map<number, TMDBMovieGenre>(
    availableTmdbGenres.map((genre) => [genre.id, genre]),
  );
  const genreByLowerName = new Map<string, TMDBMovieGenre>(
    availableTmdbGenres.map((genre) => [genre.name.toLowerCase(), genre]),
  );

  const matchedGenre = input.selectedGenre
    ? genreByLowerName.get(input.selectedGenre.toLowerCase()) ?? null
    : null;

  if (input.selectedGenre && !matchedGenre) {
    return {
      totalCount: 0,
      filteredCount: 0,
      selectedGenre: input.selectedGenre,
      selectedLanguage: input.selectedLanguage,
      selectedSort: input.sortBy,
      selectedPeriod: input.selectedPeriod,
      featuredMovie: null,
      availableGenres: availableTmdbGenres.map((genre) => ({
        id: genre.id,
        name: genre.name,
        count: null,
      })),
      page: input.page,
      limit: input.limit,
      hasMore: false,
      nextPage: null,
      items: [],
    };
  }

  const tmdbSortBy =
    input.sortBy === "trending"
      ? "popularity.desc"
      : input.sortBy === "rating_tmdb_desc"
        ? "vote_average.desc"
      : input.sortBy === "release_asc"
        ? "primary_release_date.asc"
        : input.sortBy === "title_asc"
          ? "original_title.asc"
          : "primary_release_date.desc";

  const periodWindow = getArchivePeriodWindow(input.selectedPeriod);
  const tmdbMinVoteCount = getTmdbMinVoteCountForPeriod(input.selectedPeriod);

  const discovered = await tmdbDiscover({
    page: input.page,
    limit: input.limit,
    genreId: matchedGenre?.id,
    languageCode: input.selectedLanguage ?? undefined,
    releaseDateGte: periodWindow.releaseDateGte ?? undefined,
    releaseDateLte: periodWindow.releaseDateLte ?? undefined,
    minVoteCount: tmdbMinVoteCount,
    sortBy: tmdbSortBy,
  });

  const tmdbIds = discovered.results.map((movie) => movie.id);
  const localAggregateByTmdbId = await getLocalArchiveAggregatesByTmdbIds(tmdbIds);

  const pageItems = discovered.results.map((movie) =>
    mapTmdbArchiveMovie(movie, genreById, localAggregateByTmdbId.get(movie.id)),
  );

  const missingDirectorItems = pageItems.filter((item) => item.director === null);
  const hydratedDirectors = await Promise.all(
    missingDirectorItems.map(async (item) => {
      const director = await getMovieDirector(item.tmdbId).catch(() => null);
      if (!director) {
        return null;
      }

      if (localAggregateByTmdbId.has(item.tmdbId)) {
        await MoviesRepository.updateDirectorByTmdbId(item.tmdbId, director).catch(
          () => undefined,
        );
      }

      return [item.tmdbId, director] as const;
    }),
  );

  const hydratedDirectorByTmdbId = new Map<number, string>(
    hydratedDirectors.filter(
      (entry): entry is readonly [number, string] => entry !== null,
    ),
  );

  const pageItemsWithDirector =
    hydratedDirectorByTmdbId.size > 0
      ? pageItems.map((item) => ({
          ...item,
          director: hydratedDirectorByTmdbId.get(item.tmdbId) ?? item.director,
        }))
      : pageItems;

  const hasMore = discovered.page < discovered.totalPages;

  return {
    totalCount: discovered.totalResults,
    filteredCount: discovered.totalResults,
    selectedGenre: matchedGenre?.name ?? input.selectedGenre,
    selectedLanguage: input.selectedLanguage,
    selectedSort: input.sortBy,
    selectedPeriod: input.selectedPeriod,
    featuredMovie: toFeaturedMovie(pageItemsWithDirector),
    availableGenres: availableTmdbGenres.map((genre) => ({
      id: genre.id,
      name: genre.name,
      count: null,
    })),
    page: discovered.page,
    limit: input.limit,
    hasMore,
    nextPage: hasMore ? discovered.page + 1 : null,
    items: pageItemsWithDirector,
  };
};
