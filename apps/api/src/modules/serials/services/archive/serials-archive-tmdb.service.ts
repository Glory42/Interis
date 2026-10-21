import {
  discoverSeries as tmdbDiscover,
  getSeriesGenres,
  getTrendingSeriesPage,
  type TMDBDiscoverSeries,
  type TMDBSeriesGenre,
} from "../../../../infrastructure/tmdb/serials";
import { toFeaturedSeries } from "../../helpers/serials-format.helper";
import type { SerialArchiveResponse } from "../../types/serials.types";
import { hydrateCreatorSignalsForItems } from "./serials-archive-creator-signal.service";
import {
  addViewerArchiveState,
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

// Bounds how far a "trending" request walks TMDB pages (20 items each), so a deep
// ?page= or a rare genre filter can't fan out into hundreds of sequential fetches.
const MAX_TRENDING_SCAN_PAGES = 25;

const filterArchiveItemsByGenreAndLanguage = (
  items: SerialArchiveResponse["items"],
  input: {
    selectedGenre: string | null;
    selectedLanguage: string | null;
  },
): SerialArchiveResponse["items"] => {
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

  if (input.sortBy === "trending") {
    const startIndex = (input.page - 1) * input.limit;
    const endIndex = startIndex + input.limit;

    let tmdbPage = 1;
    let tmdbTotalPages = 1;
    let tmdbTotalResults = 0;

    // Filter on the raw TMDB mapping (genre/language don't need local data), then only
    // touch the DB / creator lookups for the slice actually returned.
    const filteredTrendingSeries: TMDBDiscoverSeries[] = [];
    const scanPageLimit = () => Math.min(tmdbTotalPages, MAX_TRENDING_SCAN_PAGES);

    while (tmdbPage <= scanPageLimit() && filteredTrendingSeries.length <= endIndex) {
      const trendingPage = await getTrendingSeriesPage("week", {
        page: tmdbPage,
        limit: 20,
      });

      tmdbTotalPages = trendingPage.totalPages;
      tmdbTotalResults = trendingPage.totalResults;

      if (trendingPage.results.length === 0) {
        break;
      }

      for (const series of trendingPage.results) {
        const [matching] = filterArchiveItemsByGenreAndLanguage(
          [mapTmdbArchiveSeries(series, genreById, undefined)],
          {
            selectedGenre: matchedGenre?.name ?? null,
            selectedLanguage: input.selectedLanguage,
          },
        );
        if (matching) {
          filteredTrendingSeries.push(series);
        }
      }
      tmdbPage += 1;
    }

    const pageSeries = filteredTrendingSeries.slice(startIndex, endIndex);
    const localAggregateByTmdbId = await getLocalArchiveAggregatesByTmdbIds(
      pageSeries.map((series) => series.id),
    );
    const pageItems = await hydrateCreatorSignalsForItems(
      pageSeries.map((series) =>
        mapTmdbArchiveSeries(series, genreById, localAggregateByTmdbId.get(series.id)),
      ),
      { isCachedLocally: (tmdbId) => localAggregateByTmdbId.has(tmdbId) },
    );
    const pageItemsWithViewerState = await addViewerArchiveState(
      input.viewerUserId,
      pageItems,
    );

    const hasActiveTrendingFilters =
      matchedGenre !== null || input.selectedLanguage !== null;
    const scannedAllTrendingPages = tmdbPage > scanPageLimit();
    const reachableTrendingResults = Math.min(
      tmdbTotalResults,
      MAX_TRENDING_SCAN_PAGES * 20,
    );
    const hasMore = hasActiveTrendingFilters
      ? filteredTrendingSeries.length > endIndex || !scannedAllTrendingPages
      : endIndex < reachableTrendingResults;
    const filteredCount = hasActiveTrendingFilters
      ? scannedAllTrendingPages
        ? filteredTrendingSeries.length
        : Math.max(
            filteredTrendingSeries.length,
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
      featuredSeries: toFeaturedSeries(pageItemsWithViewerState),
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
  const tmdbMinVoteCount = getTmdbMinVoteCountForPeriod(input.selectedPeriod, input.sortBy);

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

  const items = await hydrateCreatorSignalsForItems(mappedItems, {
    isCachedLocally: (tmdbId) => localAggregateByTmdbId.has(tmdbId),
  });

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
