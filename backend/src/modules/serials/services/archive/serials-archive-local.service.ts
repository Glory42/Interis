import { toFeaturedSeries } from "../../helpers/serials-format.helper";
import { SerialsRepository } from "../../repositories/serials.repository";
import type { SerialArchiveResponse } from "../../types/serials.types";
import {
  getArchivePeriodWindow,
  isSeriesInArchivePeriod,
  sortArchiveItems,
  toAvailableGenresFromItems,
} from "./serials-archive-shared.helper";
import type { SerialsArchiveQueryInput } from "./serials-archive.types";
import { toArchiveItemFromLocalRow } from "./serials-archive-mapper.helper";

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

export const getArchiveFromLocalCache = async (
  input: SerialsArchiveQueryInput,
): Promise<SerialArchiveResponse> => {
  const rows = await SerialsRepository.getCachedArchiveRows();
  const allItems = rows.map((row) => toArchiveItemFromLocalRow(row));

  const periodWindow = getArchivePeriodWindow(input.selectedPeriod);
  const periodFilteredItems = allItems.filter((item) =>
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
    featuredSeries: toFeaturedSeries(pageItemsWithViewerState),
    availableGenres: toAvailableGenresFromItems(periodFilteredItems),
    page: input.page,
    limit: input.limit,
    hasMore,
    nextPage: hasMore ? input.page + 1 : null,
    items: pageItemsWithViewerState,
  };
};
