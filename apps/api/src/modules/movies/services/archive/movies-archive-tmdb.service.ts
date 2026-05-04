import {
  discoverMovies as tmdbDiscover,
  getMovieDirector,
  getMovieGenres,
  getTrendingMoviesPage,
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

const filterArchiveItemsByGenreAndLanguage = (
  items: CinemaArchiveResponse["items"],
  input: {
    selectedGenre: string | null;
    selectedLanguage: string | null;
  },
): CinemaArchiveResponse["items"] => {
  const selectedGenreLower = input.selectedGenre?.toLowerCase() ?? null;
  const selectedLanguageLower = input.selectedLanguage?.toLowerCase() ?? null;

  return items.filter((item) => {
    const matchesGenre = selectedGenreLower
      ? item.genres.some((genre) => genre.name.toLowerCase() === selectedGenreLower)
      : true;

    const matchesLanguage = selectedLanguageLower
      ? item.languageCode?.toLowerCase() === selectedLanguageLower
      : true;

    return matchesGenre && matchesLanguage;
  });
};

const hydrateMissingDirectors = async (
  items: CinemaArchiveResponse["items"],
): Promise<CinemaArchiveResponse["items"]> => {
  const missingDirectorItems = items.filter((item) => item.director === null);

  if (missingDirectorItems.length === 0) {
    return items;
  }

  const hydratedDirectors = await Promise.all(
    missingDirectorItems.map(async (item) => {
      const director = await getMovieDirector(item.tmdbId).catch(() => null);
      if (!director) {
        return null;
      }

      await MoviesRepository.updateDirectorByTmdbId(item.tmdbId, director).catch(
        () => undefined,
      );

      return [item.tmdbId, director] as const;
    }),
  );

  const hydratedDirectorByTmdbId = new Map<number, string>(
    hydratedDirectors.filter(
      (entry): entry is readonly [number, string] => entry !== null,
    ),
  );

  if (hydratedDirectorByTmdbId.size === 0) {
    return items;
  }

  return items.map((item) => ({
    ...item,
    director: hydratedDirectorByTmdbId.get(item.tmdbId) ?? item.director,
  }));
};

const addViewerArchiveState = async (
  viewerUserId: string | null,
  pageItems: CinemaArchiveResponse["items"],
): Promise<CinemaArchiveResponse["items"]> => {
  if (!viewerUserId || pageItems.length === 0) {
    return pageItems;
  }

  const tmdbIds = pageItems.map((item) => item.tmdbId);
  const [viewerLoggedTmdbIds, viewerWatchlistedTmdbIds] = await Promise.all([
    MoviesRepository.getViewerLoggedTmdbIds(viewerUserId, tmdbIds),
    MoviesRepository.getViewerWatchlistedTmdbIds(viewerUserId, tmdbIds),
  ]);

  const viewerLoggedTmdbIdSet = new Set<number>(viewerLoggedTmdbIds);
  const viewerWatchlistedTmdbIdSet = new Set<number>(viewerWatchlistedTmdbIds);

  return pageItems.map((item) => ({
    ...item,
    viewerHasLogged: viewerLoggedTmdbIdSet.has(item.tmdbId),
    viewerWatchlisted: viewerWatchlistedTmdbIdSet.has(item.tmdbId),
  }));
};

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

  if (input.sortBy === "trending") {
    const startIndex = (input.page - 1) * input.limit;
    const endIndex = startIndex + input.limit;

    let tmdbPage = 1;
    let tmdbTotalPages = 1;
    let tmdbTotalResults = 0;

    const filteredTrendingItems: CinemaArchiveResponse["items"] = [];

    while (tmdbPage <= tmdbTotalPages && filteredTrendingItems.length <= endIndex) {
      const trendingPage = await getTrendingMoviesPage("week", {
        page: tmdbPage,
        limit: 20,
      });

      tmdbTotalPages = trendingPage.totalPages;
      tmdbTotalResults = trendingPage.totalResults;

      if (trendingPage.results.length === 0) {
        break;
      }

      const tmdbIds = trendingPage.results.map((movie) => movie.id);
      const localAggregateByTmdbId = await getLocalArchiveAggregatesByTmdbIds(tmdbIds);

      const mappedItems = trendingPage.results.map((movie) =>
        mapTmdbArchiveMovie(movie, genreById, localAggregateByTmdbId.get(movie.id)),
      );

      const hydratedItems = await hydrateMissingDirectors(mappedItems);
      const filteredItems = filterArchiveItemsByGenreAndLanguage(hydratedItems, {
        selectedGenre: matchedGenre?.name ?? null,
        selectedLanguage: input.selectedLanguage,
      });

      filteredTrendingItems.push(...filteredItems);
      tmdbPage += 1;
    }

    const pageItems = filteredTrendingItems.slice(startIndex, endIndex);
    const pageItemsWithViewerState = await addViewerArchiveState(
      input.viewerUserId,
      pageItems,
    );

    const hasActiveTrendingFilters =
      matchedGenre !== null || input.selectedLanguage !== null;
    const scannedAllTrendingPages = tmdbPage > tmdbTotalPages;
    const hasMore = hasActiveTrendingFilters
      ? filteredTrendingItems.length > endIndex || !scannedAllTrendingPages
      : endIndex < tmdbTotalResults;
    const filteredCount = hasActiveTrendingFilters
      ? scannedAllTrendingPages
        ? filteredTrendingItems.length
        : Math.max(
            filteredTrendingItems.length,
            startIndex + pageItemsWithViewerState.length + (hasMore ? 1 : 0),
          )
      : tmdbTotalResults;

    return {
      totalCount: tmdbTotalResults,
      filteredCount,
      selectedGenre: matchedGenre?.name ?? input.selectedGenre,
      selectedLanguage: input.selectedLanguage,
      selectedSort: input.sortBy,
      selectedPeriod: input.selectedPeriod,
      featuredMovie: toFeaturedMovie(pageItemsWithViewerState),
      availableGenres: availableTmdbGenres.map((genre) => ({
        id: genre.id,
        name: genre.name,
        count: null,
      })),
      page: input.page,
      limit: input.limit,
      hasMore,
      nextPage: hasMore ? input.page + 1 : null,
      items: pageItemsWithViewerState,
    };
  }

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

  const pageItemsWithDirector = await hydrateMissingDirectors(pageItems);

  const pageItemsWithViewerState = await addViewerArchiveState(
    input.viewerUserId,
    pageItemsWithDirector,
  );

  const hasMore = discovered.page < discovered.totalPages;

  return {
    totalCount: discovered.totalResults,
    filteredCount: discovered.totalResults,
    selectedGenre: matchedGenre?.name ?? input.selectedGenre,
    selectedLanguage: input.selectedLanguage,
    selectedSort: input.sortBy,
    selectedPeriod: input.selectedPeriod,
    featuredMovie: toFeaturedMovie(pageItemsWithViewerState),
    availableGenres: availableTmdbGenres.map((genre) => ({
      id: genre.id,
      name: genre.name,
      count: null,
    })),
    page: discovered.page,
    limit: input.limit,
    hasMore,
    nextPage: hasMore ? discovered.page + 1 : null,
    items: pageItemsWithViewerState,
  };
};
