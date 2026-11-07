import { SerialsEpisodeInteractionsRepository } from "../repositories/serials-episode-interactions.repository";
import { toNormalizedSeasonItems } from "./serials-normalization.helper";
import { filterWatchedNonSpecialEpisodes, toWatchedEpisodeKeySet } from "./serials-episode-filter.helper";
import { isNonSpecialSeasonNumber, SPECIALS_SEASON_NUMBER } from "../constants/serials-season.constants";
import type { TMDBSeriesDetail } from "../../../infrastructure/tmdb/serials";
import type { SerialDetailViewerTracking } from "../types/serials.types";

// First regular-season episode not in watchedKeys ("season:episode"), in
// air order. Pure, so callers can batch-fetch watched episodes for many series.
export function findNextUnwatchedEpisode(
  tmdbDetail: TMDBSeriesDetail | null,
  watchedKeys: Set<string>,
): { seasonNumber: number; episodeNumber: number; name: string } | null {
  const sortedSeasons = (tmdbDetail ? toNormalizedSeasonItems(tmdbDetail) : [])
    .filter((s) => isNonSpecialSeasonNumber(s.seasonNumber))
    .sort((a, b) => a.seasonNumber - b.seasonNumber);

  for (const s of sortedSeasons) {
    const episodeCount = s.episodeCount ?? 0;
    for (let ep = 1; ep <= episodeCount; ep++) {
      if (!watchedKeys.has(`${s.seasonNumber}:${ep}`)) {
        return { seasonNumber: s.seasonNumber, episodeNumber: ep, name: `Episode ${ep}` };
      }
    }
  }

  return null;
}

// Watched episodes per season, specials (season 0) included.
export const countWatchedEpisodesBySeason = (
  tracking: Pick<SerialDetailViewerTracking, "watchedEpisodes" | "watchedSpecialEpisodesCount">,
): Map<number, number> => {
  const counts = new Map<number, number>();
  for (const { seasonNumber } of tracking.watchedEpisodes) {
    counts.set(seasonNumber, (counts.get(seasonNumber) ?? 0) + 1);
  }
  if (tracking.watchedSpecialEpisodesCount > 0) counts.set(SPECIALS_SEASON_NUMBER, tracking.watchedSpecialEpisodesCount);
  return counts;
};

export async function calculateViewerTracking(
  viewerUserId: string,
  seriesId: number,
  seriesTmdbId: number,
  tmdbDetail: TMDBSeriesDetail | null,
  userSeasonInteractions: { rating: number | null; liked: boolean; hasReview: boolean }[],
): Promise<SerialDetailViewerTracking> {
  const userEpisodeInteractions =
    await SerialsEpisodeInteractionsRepository.getAllViewerEpisodeInteractions(
      viewerUserId,
      seriesId,
      seriesTmdbId,
    );

  const watchedNonSpecial = filterWatchedNonSpecialEpisodes(userEpisodeInteractions);
  const watchedEpisodes = watchedNonSpecial.map((i) => ({
    seasonNumber: i.seasonNumber,
    episodeNumber: i.episodeNumber,
  }));
  const watchedKeys = toWatchedEpisodeKeySet(userEpisodeInteractions);

  const currentEpisode = findNextUnwatchedEpisode(tmdbDetail, watchedKeys);

  const seasonRatingsCount = userSeasonInteractions.filter((i) => i.rating !== null).length;
  const seasonLikesCount = userSeasonInteractions.filter((i) => i.liked).length;
  const seasonReviewsCount = userSeasonInteractions.filter((i) => i.hasReview).length;

  const episodeRatingsCount = userEpisodeInteractions.filter((i) => i.rating !== null).length;
  const episodeLikesCount = userEpisodeInteractions.filter((i) => i.liked).length;
  const episodeReviewsCount = userEpisodeInteractions.filter((i) => i.hasReview).length;

  return {
    watchedEpisodesCount: watchedEpisodes.length,
    watchedEpisodes,
    watchedSpecialEpisodesCount: userEpisodeInteractions.filter(
      (i) => i.watched && i.seasonNumber === SPECIALS_SEASON_NUMBER,
    ).length,
    currentEpisode,
    ratingsCount: seasonRatingsCount + episodeRatingsCount,
    likesCount: seasonLikesCount + episodeLikesCount,
    reviewsCount: seasonReviewsCount + episodeReviewsCount,
  };
}
