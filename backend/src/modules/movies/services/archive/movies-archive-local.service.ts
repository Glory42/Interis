import { getMovieDirector } from "../../../../infrastructure/tmdb/cinemas";
import {
  normalizeMovieGenres,
  toFeaturedMovie,
} from "../../helpers/movies-format.helper";
import { MoviesRepository } from "../../repositories/movies.repository";
import type {
  CinemaArchiveItem,
  CinemaArchiveResponse,
} from "../../types/movies.types";
import { getTmdbSignalsByTmdbIds } from "./movies-archive-signal.service";
import {
  getArchivePeriodWindow,
  isActivityWindowPeriod,
  isMovieInArchivePeriod,
  sortLocalArchiveItems,
  toAvailableGenresFromItems,
} from "./movies-archive-shared.helper";
import type { MoviesArchiveQueryInput } from "./movies-archive.types";

const addViewerArchiveState = async (
  viewerUserId: string | null,
  pageItems: CinemaArchiveItem[],
): Promise<CinemaArchiveItem[]> => {
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

export const getArchiveFromLocalCatalog = async (
  input: MoviesArchiveQueryInput,
): Promise<CinemaArchiveResponse> => {
  const periodWindow = getArchivePeriodWindow(input.selectedPeriod);
  const shouldFilterByActivityWindow =
    isActivityWindowPeriod(input.selectedPeriod) &&
    (input.sortBy === "logs_desc" || input.sortBy === "rating_user_desc");

  const rows =
    shouldFilterByActivityWindow &&
    periodWindow.releaseDateGte !== null &&
    periodWindow.releaseDateLte !== null
      ? await MoviesRepository.getLocalArchiveRowsByWatchedDateRange({
          watchedDateGte: periodWindow.releaseDateGte,
          watchedDateLte: periodWindow.releaseDateLte,
        })
      : await MoviesRepository.getLocalArchiveRows();

  const directorByTmdbId = new Map<number, string | null>(
    rows.map((row) => [row.tmdbId, row.director]),
  );

  const missingDirectorRows = rows.filter((row) => !row.director).slice(0, 12);
  if (missingDirectorRows.length > 0) {
    await Promise.all(
      missingDirectorRows.map(async (row) => {
        const director = await getMovieDirector(row.tmdbId).catch(() => null);
        if (!director) {
          return;
        }

        directorByTmdbId.set(row.tmdbId, director);
        await MoviesRepository.updateDirectorByTmdbId(row.tmdbId, director);
      }),
    );
  }

  const allItems: CinemaArchiveItem[] = rows.map((row) => {
    const genres = normalizeMovieGenres(row.genres);

    return {
      tmdbId: row.tmdbId,
      title: row.title,
      posterPath: row.posterPath,
      backdropPath: row.backdropPath,
      releaseDate: row.releaseDate,
      releaseYear: row.releaseYear,
      director: directorByTmdbId.get(row.tmdbId) ?? row.director,
      languageCode: null,
      genres,
      primaryGenre: genres[0]?.name ?? null,
      logCount: row.logCount,
      avgRatingOutOfTen: row.avgRatingOutOfTen,
      tmdbRatingOutOfTen: null,
      ratedLogCount: row.ratedLogCount,
      viewerHasLogged: false,
      viewerWatchlisted: false,
    };
  });

  const shouldHydrateTmdbSignals =
    input.selectedLanguage !== null || input.sortBy === "rating_tmdb_desc";

  const tmdbSignalsByTmdbId = shouldHydrateTmdbSignals
    ? await getTmdbSignalsByTmdbIds(allItems.map((item) => item.tmdbId))
    : new Map<
        number,
        {
          languageCode: string | null;
          tmdbRatingOutOfTen: number | null;
        }
      >();

  const itemsWithSignals = shouldHydrateTmdbSignals
    ? allItems.map((item) => {
        const tmdbSignal = tmdbSignalsByTmdbId.get(item.tmdbId);

        return {
          ...item,
          languageCode: tmdbSignal?.languageCode ?? null,
          tmdbRatingOutOfTen: tmdbSignal?.tmdbRatingOutOfTen ?? null,
        };
      })
    : allItems;

  const periodFilteredItems = shouldFilterByActivityWindow
    ? itemsWithSignals
    : itemsWithSignals.filter((item) =>
        isMovieInArchivePeriod(item, input.selectedPeriod, periodWindow),
      );

  const selectedGenreLower = input.selectedGenre?.toLowerCase() ?? null;
  const genreFilteredItems = selectedGenreLower
    ? periodFilteredItems.filter((item) =>
        item.genres.some((genre) => genre.name.toLowerCase() === selectedGenreLower),
      )
    : periodFilteredItems;

  const selectedLanguageLower = input.selectedLanguage?.toLowerCase() ?? null;
  const filteredItems = selectedLanguageLower
    ? genreFilteredItems.filter((item) => item.languageCode === selectedLanguageLower)
    : genreFilteredItems;

  const sortedItems = sortLocalArchiveItems(filteredItems, input.sortBy);

  const startIndex = (input.page - 1) * input.limit;
  const pageItems = sortedItems.slice(startIndex, startIndex + input.limit);
  const pageItemsWithViewerState = await addViewerArchiveState(
    input.viewerUserId,
    pageItems,
  );
  const hasMore = startIndex + input.limit < sortedItems.length;

  return {
    totalCount: allItems.length,
    filteredCount: sortedItems.length,
    selectedGenre: input.selectedGenre,
    selectedLanguage: input.selectedLanguage,
    selectedSort: input.sortBy,
    selectedPeriod: input.selectedPeriod,
    featuredMovie: toFeaturedMovie(pageItemsWithViewerState),
    availableGenres: toAvailableGenresFromItems(periodFilteredItems),
    page: input.page,
    limit: input.limit,
    hasMore,
    nextPage: hasMore ? input.page + 1 : null,
    items: pageItemsWithViewerState,
  };
};
