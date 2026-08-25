import { SerialsEpisodeInteractionsRepository } from "../repositories/serials-episode-interactions.repository";
import { toNormalizedSeasonItems } from "./serials-normalization.helper";
import { filterWatchedNonSpecialEpisodes, toWatchedEpisodeKeySet } from "./serials-episode-filter.helper";
import { isNonSpecialSeasonNumber } from "../constants/serials-season.constants";
import type { TMDBSeriesDetail } from "../../../infrastructure/tmdb/serials";
import type { SerialDetailViewerTracking } from "../types/serials.types";

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

  let currentEpisode: { seasonNumber: number; episodeNumber: number; name: string } | null = null;

  const sortedSeasons = (tmdbDetail ? toNormalizedSeasonItems(tmdbDetail) : [])
    .filter((s) => isNonSpecialSeasonNumber(s.seasonNumber))
    .sort((a, b) => a.seasonNumber - b.seasonNumber);

  let foundNext = false;
  for (const s of sortedSeasons) {
    if (foundNext) break;
    const episodeCount = s.episodeCount ?? 0;
    for (let ep = 1; ep <= episodeCount; ep++) {
      const key = `${s.seasonNumber}:${ep}`;
      if (!watchedKeys.has(key)) {
        currentEpisode = {
          seasonNumber: s.seasonNumber,
          episodeNumber: ep,
          name: `Episode ${ep}`,
        };
        foundNext = true;
        break;
      }
    }
  }

  const seasonRatingsCount = userSeasonInteractions.filter((i) => i.rating !== null).length;
  const seasonLikesCount = userSeasonInteractions.filter((i) => i.liked).length;
  const seasonReviewsCount = userSeasonInteractions.filter((i) => i.hasReview).length;

  const episodeRatingsCount = userEpisodeInteractions.filter((i) => i.rating !== null).length;
  const episodeLikesCount = userEpisodeInteractions.filter((i) => i.liked).length;
  const episodeReviewsCount = userEpisodeInteractions.filter((i) => i.hasReview).length;

  return {
    watchedEpisodesCount: watchedEpisodes.length,
    watchedEpisodes,
    currentEpisode,
    ratingsCount: seasonRatingsCount + episodeRatingsCount,
    likesCount: seasonLikesCount + episodeLikesCount,
    reviewsCount: seasonReviewsCount + episodeReviewsCount,
  };
}
