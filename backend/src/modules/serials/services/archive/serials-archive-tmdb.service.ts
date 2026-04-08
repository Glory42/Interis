import {
  discoverSeries as tmdbDiscover,
  getSeriesGenres,
  type TMDBSeriesGenre,
} from "../../../../infrastructure/tmdb/serials";
import { toFeaturedSeries } from "../../helpers/serials-format.helper";
import { SerialsRepository } from "../../repositories/serials.repository";
import type { SerialArchiveResponse } from "../../types/serials.types";
import { hydrateCreatorSignalsForItems } from "./serials-archive-creator-signal.service";
import {
  getArchivePeriodWindow,
  getTmdbMinVoteCountForPeriod,
  isSeriesInArchivePeriod,
  sortArchiveItems,
} from "./serials-archive-shared.helper";
import type { SerialsArchiveQueryInput } from "./serials-archive.types";
import {
  getLocalArchiveAggregatesByTmdbIds,
  mapTmdbArchiveSeries,
} from "./serials-archive-mapper.helper";

const addViewerArchiveState = async (
  viewerUserId: string | null,
  pageItems: SerialArchiveResponse["items"],
): Promise<SerialArchiveResponse["items"]> => {
  if (!viewerUserId || pageItems.length === 0) {
    return pageItems;
  }

  const tmdbIds = pageItems.map((item) => item.tmdbId);
  const [viewerLoggedTmdbIds, viewerWatchlistedTmdbIds] = await Promise.all([
    SerialsRepository.getViewerLoggedTmdbIds(viewerUserId, tmdbIds),
    SerialsRepository.getViewerWatchlistedTmdbIds(viewerUserId, tmdbIds),
  ]);

  const viewerLoggedTmdbIdSet = new Set<number>(viewerLoggedTmdbIds);
  const viewerWatchlistedTmdbIdSet = new Set<number>(viewerWatchlistedTmdbIds);

  return pageItems.map((item) => ({
    ...item,
    viewerHasLogged: viewerLoggedTmdbIdSet.has(item.tmdbId),
    viewerWatchlisted: viewerWatchlistedTmdbIdSet.has(item.tmdbId),
  }));
};

export const getArchiveFromTmdb = async (
  input: SerialsArchiveQueryInput,
): Promise<SerialArchiveResponse> => {
  const availableTmdbGenres = await getSeriesGenres();
  const genreById = new Map<number, TMDBSeriesGenre>(
    availableTmdbGenres.map((genre) => [genre.id, genre]),
  );
  const genreByLowerName = new Map<string, TMDBSeriesGenre>(
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
      featuredSeries: null,
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
      : input.sortBy === "first_air_desc"
        ? "first_air_date.desc"
        : input.sortBy === "first_air_asc"
          ? "first_air_date.asc"
          : input.sortBy === "rating_tmdb_desc"
            ? "vote_average.desc"
            : "name.asc";

  const periodWindow = getArchivePeriodWindow(input.selectedPeriod);
  const tmdbMinVoteCount = getTmdbMinVoteCountForPeriod(input.selectedPeriod);

  const discovered = await tmdbDiscover({
    page: input.page,
    limit: input.limit,
    genreId: matchedGenre?.id,
    languageCode: input.selectedLanguage ?? undefined,
    firstAirDateGte: periodWindow.firstAirDateGte ?? undefined,
    firstAirDateLte: periodWindow.firstAirDateLte ?? undefined,
    minVoteCount: tmdbMinVoteCount,
    sortBy: tmdbSortBy,
  });

  const localAggregateByTmdbId = await getLocalArchiveAggregatesByTmdbIds(
    discovered.results.map((series) => series.id),
  );

  const mappedItems = discovered.results.map((series) =>
    mapTmdbArchiveSeries(series, genreById, localAggregateByTmdbId.get(series.id)),
  );

  const items = await hydrateCreatorSignalsForItems(mappedItems);

  const periodFilteredItems = items.filter((item) =>
    isSeriesInArchivePeriod(item, input.selectedPeriod, periodWindow),
  );

  const selectedGenreLower = input.selectedGenre?.toLowerCase() ?? null;
  const genreFilteredItems = selectedGenreLower
    ? periodFilteredItems.filter((item) =>
        item.genres.some((genre) => genre.name.toLowerCase() === selectedGenreLower),
      )
    : periodFilteredItems;

  const selectedLanguageLower = input.selectedLanguage?.toLowerCase() ?? null;
  const filteredItems = selectedLanguageLower
    ? genreFilteredItems.filter(
        (item) => item.languageCode?.toLowerCase() === selectedLanguageLower,
      )
    : genreFilteredItems;

  const sortedItems = sortArchiveItems(filteredItems, input.sortBy);
  const pageItemsWithViewerState = await addViewerArchiveState(
    input.viewerUserId,
    sortedItems,
  );
  const hasMore = discovered.page < discovered.totalPages;

  return {
    totalCount: discovered.totalResults,
    filteredCount: discovered.totalResults,
    selectedGenre: matchedGenre?.name ?? input.selectedGenre,
    selectedLanguage: input.selectedLanguage,
    selectedSort: input.sortBy,
    selectedPeriod: input.selectedPeriod,
    featuredSeries: toFeaturedSeries(pageItemsWithViewerState),
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
