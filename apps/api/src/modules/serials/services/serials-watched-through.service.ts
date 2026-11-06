import { SerialsEpisodeInteractionsRepository } from "../repositories/serials-episode-interactions.repository";
import { isNonSpecialSeasonNumber } from "../constants/serials-season.constants";
import { SerialsCacheService } from "./serials-cache.service";
import { SerialsWatchStatusService } from "./serials-watch-status.service";

export class SerialsWatchedThroughService {
  // "Mark up to here": episodes 1..episodeNumber become watched in one upsert;
  // later episodes keep their state.
  static async markWatchedThrough(
    userId: string,
    tmdbId: number,
    seasonNumber: number,
    episodeNumber: number,
  ): Promise<{ seasonNumber: number; watchedThrough: number } | null> {
    const series = await SerialsCacheService.findOrCreate(tmdbId);
    if (!series) return null;

    await SerialsEpisodeInteractionsRepository.upsertManyEpisodeWatchedState({
      userId,
      seriesId: series.id,
      seasonNumber,
      episodeNumbers: Array.from({ length: episodeNumber }, (_, index) => index + 1),
      watched: true,
    });

    if (isNonSpecialSeasonNumber(seasonNumber)) {
      await SerialsWatchStatusService.syncFromEpisodes(userId, series, { episodeAdded: true });
    }

    return { seasonNumber, watchedThrough: episodeNumber };
  }
}
