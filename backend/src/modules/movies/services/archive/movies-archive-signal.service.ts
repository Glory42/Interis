import { getMovieDetails as tmdbGetDetails } from "../../../../infrastructure/tmdb/cinemas";

type TmdbSignal = {
  languageCode: string | null;
  tmdbRatingOutOfTen: number | null;
};

const tmdbSignalByTmdbId = new Map<number, TmdbSignal>();
const tmdbSignalInFlight = new Map<number, Promise<TmdbSignal>>();

const getTmdbSignalByTmdbId = async (tmdbId: number): Promise<TmdbSignal> => {
  const cached = tmdbSignalByTmdbId.get(tmdbId);
  if (cached) {
    return cached;
  }

  const inFlight = tmdbSignalInFlight.get(tmdbId);
  if (inFlight) {
    return inFlight;
  }

  const request = (async () => {
    const detail = await tmdbGetDetails(tmdbId).catch(() => null);

    const languageCode =
      detail && detail.original_language.trim().length > 0
        ? detail.original_language.toLowerCase()
        : null;
    const tmdbRatingOutOfTen =
      detail && detail.vote_count > 0 && Number.isFinite(detail.vote_average)
        ? Number(detail.vote_average.toFixed(1))
        : null;

    const signal = {
      languageCode,
      tmdbRatingOutOfTen,
    };

    tmdbSignalByTmdbId.set(tmdbId, signal);
    return signal;
  })();

  tmdbSignalInFlight.set(tmdbId, request);

  try {
    return await request;
  } finally {
    tmdbSignalInFlight.delete(tmdbId);
  }
};

export const getTmdbSignalsByTmdbIds = async (
  tmdbIds: number[],
): Promise<Map<number, TmdbSignal>> => {
  const uniqueTmdbIds = [...new Set(tmdbIds)];
  if (uniqueTmdbIds.length === 0) {
    return new Map();
  }

  const resolved = await Promise.all(
    uniqueTmdbIds.map(async (tmdbId) => {
      const signal = await getTmdbSignalByTmdbId(tmdbId);
      return [tmdbId, signal] as const;
    }),
  );

  return new Map(resolved);
};
