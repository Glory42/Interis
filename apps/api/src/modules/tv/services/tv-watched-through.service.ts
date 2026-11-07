import { TvEpisodeInteractionsRepository } from "../repositories/tv-episode-interactions.repository";
import { isNonSpecialSeasonNumber } from "../constants/tv-season.constants";
import { TvCacheService } from "./tv-cache.service";
import { TvWatchStatusService } from "./tv-watch-status.service";

export class TvWatchedThroughService {
  // "Mark up to here": episodes 1..episodeNumber become watched in one upsert;
  // later episodes keep their state.
  static async markWatchedThrough(
    userId: string,
    tmdbId: number,
    seasonNumber: number,
    episodeNumber: number,
  ): Promise<{ seasonNumber: number; watchedThrough: number } | null> {
    const series = await TvCacheService.findOrCreate(tmdbId);
    if (!series) return null;

    await TvEpisodeInteractionsRepository.upsertManyEpisodeWatchedState({
      userId,
      seriesId: series.id,
      seasonNumber,
      episodeNumbers: Array.from({ length: episodeNumber }, (_, index) => index + 1),
      watched: true,
    });

    if (isNonSpecialSeasonNumber(seasonNumber)) {
      await TvWatchStatusService.syncFromEpisodes(userId, series, { episodeAdded: true });
    }

    return { seasonNumber, watchedThrough: episodeNumber };
  }
}
