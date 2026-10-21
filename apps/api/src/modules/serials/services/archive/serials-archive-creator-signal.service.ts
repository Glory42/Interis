import { getSeriesDetails as tmdbGetDetails } from "../../../../infrastructure/tmdb/serials";
import { createCachedTmdbFetcher } from "../../../../infrastructure/tmdb/tmdb-cache.helper";
import { normalizeTmdbSeriesDetail } from "../../helpers/serials-normalization.helper";
import { SerialsCacheRepository } from "../../repositories/serials-cache.repository";
import type { SerialArchiveItem } from "../../types/serials.types";

type TmdbCreatorSignal = {
  creator: string | null;
  network: string | null;
};

// Bounded TTL cache (was an unbounded module Map). Archive browsing no longer inserts
// tv_series rows - it only backfills a missing creator on series already cached locally.
const getTmdbCreatorSignalByTmdbId = createCachedTmdbFetcher(
  async (tmdbId: number): Promise<TmdbCreatorSignal> => {
    const detail = await tmdbGetDetails(tmdbId).catch(() => null);
    if (!detail) {
      return { creator: null, network: null };
    }

    const normalizedDetail = normalizeTmdbSeriesDetail(detail);
    return { creator: normalizedDetail.creator, network: normalizedDetail.network };
  },
);

export const hydrateCreatorSignalsForItems = async (
  items: SerialArchiveItem[],
  options: { isCachedLocally: (tmdbId: number) => boolean },
): Promise<SerialArchiveItem[]> => {
  const missingCreatorItems = items.filter((item) => item.creator === null);
  if (missingCreatorItems.length === 0) {
    return items;
  }

  const creatorSignalEntries = await Promise.all(
    missingCreatorItems.map(async (item) => {
      const signal = await getTmdbCreatorSignalByTmdbId(item.tmdbId);
      if (signal.creator !== null && options.isCachedLocally(item.tmdbId)) {
        await SerialsCacheRepository.fillMissingCreatorByTmdbId(item.tmdbId, signal).catch(
          () => undefined,
        );
      }
      return [item.tmdbId, signal] as const;
    }),
  );

  const creatorSignalByTmdbId = new Map(creatorSignalEntries);

  return items.map((item) => {
    const signal = creatorSignalByTmdbId.get(item.tmdbId);
    if (!signal) {
      return item;
    }

    return {
      ...item,
      creator: signal.creator ?? item.creator,
      network: signal.network ?? item.network,
    };
  });
};
