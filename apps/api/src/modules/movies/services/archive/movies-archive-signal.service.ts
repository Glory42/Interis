import { getMovieDetails as tmdbGetDetails } from "../../../../infrastructure/tmdb/cinemas";
import { createCachedTmdbFetcher } from "../../../../infrastructure/tmdb/tmdb-cache.helper";

type TmdbSignal = {
  languageCode: string | null;
  tmdbRatingOutOfTen: number | null;
  tmdbVoteCount: number | null;
};

const getTmdbSignalByTmdbId = createCachedTmdbFetcher(async (tmdbId: number): Promise<TmdbSignal> => {
  const detail = await tmdbGetDetails(tmdbId).catch(() => null);

  const languageCode =
    detail && detail.original_language.trim().length > 0
      ? detail.original_language.toLowerCase()
      : null;
  const tmdbRatingOutOfTen =
    detail && detail.vote_count > 0 && Number.isFinite(detail.vote_average)
      ? Number(detail.vote_average.toFixed(1))
      : null;
  const tmdbVoteCount = detail ? detail.vote_count : null;

  return {
    languageCode,
    tmdbRatingOutOfTen,
    tmdbVoteCount,
  };
});

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
