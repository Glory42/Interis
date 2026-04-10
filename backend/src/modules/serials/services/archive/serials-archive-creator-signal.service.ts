import { getSeriesDetails as tmdbGetDetails } from "../../../../infrastructure/tmdb/serials";
import { normalizeTmdbSeriesDetail } from "../../helpers/serials-normalization.helper";
import { SerialsCacheRepository } from "../../repositories/serials-cache.repository";
import type { SerialArchiveItem } from "../../types/serials.types";

type TmdbCreatorSignal = {
  creator: string | null;
  network: string | null;
};

const tmdbCreatorSignalByTmdbId = new Map<number, TmdbCreatorSignal>();
const tmdbCreatorSignalInFlight = new Map<number, Promise<TmdbCreatorSignal>>();

const getTmdbCreatorSignalByTmdbId = async (
  tmdbId: number,
): Promise<TmdbCreatorSignal> => {
  const cachedSignal = tmdbCreatorSignalByTmdbId.get(tmdbId);
  if (cachedSignal) {
    return cachedSignal;
  }

  const inFlightSignal = tmdbCreatorSignalInFlight.get(tmdbId);
  if (inFlightSignal) {
    return inFlightSignal;
  }

  const request = (async () => {
    const detail = await tmdbGetDetails(tmdbId).catch(() => null);
    if (!detail) {
      const emptySignal = { creator: null, network: null };
      tmdbCreatorSignalByTmdbId.set(tmdbId, emptySignal);
      return emptySignal;
    }

    const normalizedDetail = normalizeTmdbSeriesDetail(detail);
    await SerialsCacheRepository.upsertCachedSeries(normalizedDetail).catch(() => undefined);

    const signal = {
      creator: normalizedDetail.creator,
      network: normalizedDetail.network,
    };

    tmdbCreatorSignalByTmdbId.set(tmdbId, signal);
    return signal;
  })();

  tmdbCreatorSignalInFlight.set(tmdbId, request);

  try {
    return await request;
  } finally {
    tmdbCreatorSignalInFlight.delete(tmdbId);
  }
};

export const hydrateCreatorSignalsForItems = async (
  items: SerialArchiveItem[],
): Promise<SerialArchiveItem[]> => {
  const missingCreatorItems = items.filter((item) => item.creator === null);
  if (missingCreatorItems.length === 0) {
    return items;
  }

  const creatorSignalEntries = await Promise.all(
    missingCreatorItems.map(async (item) => {
      const signal = await getTmdbCreatorSignalByTmdbId(item.tmdbId);
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
