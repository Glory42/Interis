import { getSeriesDetails as tmdbGetDetails } from "../../../infrastructure/tmdb/serials";
import { SerialsEpisodeInteractionsRepository } from "../repositories/serials-episode-interactions.repository";
import { findNextUnwatchedEpisode } from "../helpers/serials-tracking.helper";

export class SerialsCurrentlyWatchingService {
  // Series the viewer has started but not finished watching, most
  // recently-watched first. One grouped query picks the candidates (capped by
  // `limit`, already carrying watched counts); one more batch-fetches their
  // watched episodes for "up next". TMDB detail per series is cached.
  static async getCurrentlyWatching(viewerUserId: string, limit: number) {
    const candidates = await SerialsEpisodeInteractionsRepository.getInProgressSeriesForUser(
      viewerUserId,
      limit,
    );
    if (candidates.length === 0) {
      return [];
    }

    const [tmdbDetails, watchedEpisodes] = await Promise.all([
      Promise.all(candidates.map((candidate) => tmdbGetDetails(candidate.tmdbId).catch(() => null))),
      SerialsEpisodeInteractionsRepository.getWatchedRegularEpisodesForSeries(
        viewerUserId,
        candidates.map((candidate) => candidate.seriesId),
      ),
    ]);

    const watchedKeysBySeriesId = new Map<number, Set<string>>();
    for (const episode of watchedEpisodes) {
      let keys = watchedKeysBySeriesId.get(episode.seriesId);
      if (!keys) {
        keys = new Set();
        watchedKeysBySeriesId.set(episode.seriesId, keys);
      }
      keys.add(`${episode.seasonNumber}:${episode.episodeNumber}`);
    }

    return candidates.map((candidate, index) => {
      const numberOfEpisodes = candidate.numberOfEpisodes ?? 0;
      const progressPercent =
        numberOfEpisodes > 0
          ? Math.round((candidate.watchedEpisodesCount / numberOfEpisodes) * 100)
          : 0;

      return {
        tmdbId: candidate.tmdbId,
        title: candidate.title,
        posterPath: candidate.posterPath,
        backdropPath: candidate.backdropPath,
        firstAirYear: candidate.firstAirYear,
        numberOfSeasons: candidate.numberOfSeasons,
        numberOfEpisodes: candidate.numberOfEpisodes,
        watchedEpisodesCount: candidate.watchedEpisodesCount,
        progressPercent,
        lastWatchedAt: candidate.lastWatchedAt,
        currentEpisode: findNextUnwatchedEpisode(
          tmdbDetails[index] ?? null,
          watchedKeysBySeriesId.get(candidate.seriesId) ?? new Set(),
        ),
      };
    });
  }
}
