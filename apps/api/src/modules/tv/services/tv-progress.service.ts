import { getSeriesDetails as tmdbGetDetails } from "../../../infrastructure/tmdb/tv";
import { TvSeasonInteractionsRepository } from "../repositories/tv-season-interactions.repository";
import {
  normalizeTmdbSeriesDetail,
  toNormalizedSeasonItems,
} from "../helpers/tv-normalization.helper";
import {
  calculateViewerTracking,
  countWatchedEpisodesBySeason,
} from "../helpers/tv-tracking.helper";
import { TvCacheService } from "./tv-cache.service";

// Just the series' seasons + one user's watch progress, for the public progress widget.
// The full detail path also loads reviews, credits, similar titles and person links -
// ~15 queries this widget never reads.
export class TvProgressService {
  static async getProgress(tmdbId: number, userId: string) {
    const [cachedSeries, tmdbDetail] = await Promise.all([
      TvCacheService.findForRead(tmdbId),
      tmdbGetDetails(tmdbId).catch(() => null),
    ]);

    const userSeasonInteractions =
      await TvSeasonInteractionsRepository.getViewerSeasonInteractions(
        userId,
        cachedSeries.id,
        cachedSeries.tmdbId,
      );
    const viewerTracking = await calculateViewerTracking(
      userId,
      cachedSeries.id,
      cachedSeries.tmdbId,
      tmdbDetail,
      userSeasonInteractions,
    );

    const normalizedTmdbDetail = tmdbDetail ? normalizeTmdbSeriesDetail(tmdbDetail) : null;
    const watchedCountBySeason = countWatchedEpisodesBySeason(viewerTracking);
    const interactionBySeason = new Map(
      userSeasonInteractions.map((interaction) => [interaction.seasonNumber, interaction]),
    );

    return {
      series: {
        id: cachedSeries.id,
        tmdbId: cachedSeries.tmdbId,
        title: cachedSeries.title,
        posterPath: cachedSeries.posterPath,
        numberOfSeasons:
          cachedSeries.numberOfSeasons ?? normalizedTmdbDetail?.numberOfSeasons ?? null,
        numberOfEpisodes:
          normalizedTmdbDetail?.numberOfEpisodes ?? cachedSeries.numberOfEpisodes ?? null,
      },
      viewerTracking,
      seasons: (tmdbDetail ? toNormalizedSeasonItems(tmdbDetail) : []).map((season) => {
        const interaction = interactionBySeason.get(season.seasonNumber);
        return {
          seasonNumber: season.seasonNumber,
          name: season.name,
          episodeCount: season.episodeCount,
          viewerInteraction: {
            watched: interaction?.watched ?? false,
            liked: interaction?.liked ?? false,
            rating: interaction?.rating ?? null,
            hasReview: interaction?.hasReview ?? false,
            watchedEpisodeCount: watchedCountBySeason.get(season.seasonNumber) ?? 0,
          },
        };
      }),
    };
  }
}
