import { createTtlCache } from "../../../../infrastructure/cache/ttl-cache.helper";
import { toFeaturedSeries } from "../../helpers/tv-format.helper";
import { TvArchiveRepository } from "../../repositories/tv-archive.repository";
import type { SeriesArchiveResponse } from "../../types/tv.types";
import {
  addViewerArchiveState,
  getArchivePeriodWindow,
  isSeriesInArchivePeriod,
  sortArchiveItems,
  toAvailableGenresFromItems,
} from "./tv-archive-shared.helper";
import type { TvArchiveQueryInput } from "./tv-archive.types";
import { toArchiveItemFromLocalRow } from "./tv-archive-mapper.helper";

const LOCAL_ARCHIVE_CACHE_TTL_MS = 2 * 60 * 1000;

// Caches the full unbounded catalog scan so concurrent browsing shares one DB read.
const getCachedLocalArchiveRows = createTtlCache(
  () => TvArchiveRepository.getLocalArchiveRows(),
  { ttlMs: LOCAL_ARCHIVE_CACHE_TTL_MS, keyFn: () => "all" },
);

export const getArchiveFromLocalCache = async (
  input: TvArchiveQueryInput,
): Promise<SeriesArchiveResponse> => {
  const rows = await getCachedLocalArchiveRows();
  const allItems = rows.map((row) => toArchiveItemFromLocalRow(row));

  const effectivePeriod =
    input.sortBy === "trending" ? "all_time" : input.selectedPeriod;
  const periodWindow = getArchivePeriodWindow(effectivePeriod);
  const periodFilteredItems = allItems.filter((item) =>
    isSeriesInArchivePeriod(item, effectivePeriod, periodWindow),
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
