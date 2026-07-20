import { getSeriesDetails as tmdbGetDetails } from "../../../infrastructure/tmdb/serials";
import { SerialsEpisodeInteractionsRepository } from "../repositories/serials-episode-interactions.repository";
import { SerialsSeasonInteractionsRepository } from "../repositories/serials-season-interactions.repository";
import { calculateViewerTracking } from "../helpers/serials-tracking.helper";

export class SerialsCurrentlyWatchingService {
  // Candidate selection happens in one grouped DB query
  // (getInProgressSeriesForUser); only the bounded result is enriched here
  // with per-series TMDB detail and "up next" episode tracking.
  static async getCurrentlyWatching(viewerUserId: string, limit: number) {
    const candidates = await SerialsEpisodeInteractionsRepository.getInProgressSeriesForUser(
      viewerUserId,
      limit,
    );

    return Promise.all(
      candidates.map(async (candidate) => {
        const [tmdbDetail, seasonInteractions] = await Promise.all([
          tmdbGetDetails(candidate.tmdbId).catch(() => null),
          SerialsSeasonInteractionsRepository.getViewerSeasonInteractions(
            viewerUserId,
            candidate.seriesId,
            candidate.tmdbId,
          ),
        ]);

        const tracking = await calculateViewerTracking(
          viewerUserId,
          candidate.seriesId,
          candidate.tmdbId,
          tmdbDetail,
          seasonInteractions,
        );

        const numberOfEpisodes = candidate.numberOfEpisodes ?? 0;
        const progressPercent =
          numberOfEpisodes > 0
            ? Math.round((tracking.watchedEpisodesCount / numberOfEpisodes) * 100)
            : 0;

        return {
          tmdbId: candidate.tmdbId,
          title: candidate.title,
          posterPath: candidate.posterPath,
          backdropPath: candidate.backdropPath,
          firstAirYear: candidate.firstAirYear,
          numberOfSeasons: candidate.numberOfSeasons,
          numberOfEpisodes: candidate.numberOfEpisodes,
          watchedEpisodesCount: tracking.watchedEpisodesCount,
          progressPercent,
          lastWatchedAt: candidate.lastWatchedAt,
          currentEpisode: tracking.currentEpisode,
        };
      }),
    );
  }
}
