import { MediaInteractionService } from "../../media-interactions/services/media-interaction.service";
import { TvInteractionsRepository } from "../repositories/tv-interactions.repository";
import { TvEpisodeInteractionsRepository } from "../repositories/tv-episode-interactions.repository";
import { TvSeasonInteractionsRepository } from "../repositories/tv-season-interactions.repository";
import { TvTrackingService } from "./tv-tracking.service";
import { TvWatchStatusService } from "./tv-watch-status.service";

export class TvActivityService {
  // Every regular season's episode numbers, resolved before any write so a
  // TMDB failure fails "mark series watched" / "log" outright instead of
  // saving some seasons and not others (#69).
  static async resolveSeasonEpisodeNumbers(series: {
    tmdbId: number;
    numberOfSeasons: number | null;
  }): Promise<Map<number, number[]>> {
    const seasonNumbers = Array.from(
      { length: Math.max(series.numberOfSeasons ?? 0, 0) },
      (_, index) => index + 1,
    );
    const episodeNumbers = await Promise.all(
      seasonNumbers.map((seasonNumber) =>
        TvTrackingService.getSeasonEpisodeNumbers(series.tmdbId, seasonNumber),
      ),
    );
    return new Map(seasonNumbers.map((seasonNumber, index) => [seasonNumber, episodeNumbers[index]!]));
  }

  // The sidebar "Watch" toggle and a Series log both say "I watched this", so
  // both cascade it to every season/episode, not just the series flag.
  static async cascadeSeasonsWatched(
    userId: string,
    series: { id: number; tmdbId: number },
    seasonEpisodeNumbers: Map<number, number[]> | null,
  ): Promise<void> {
    if (!seasonEpisodeNumbers) {
      await Promise.all([
        TvEpisodeInteractionsRepository.unwatchAllForSeries(userId, series.id),
        TvSeasonInteractionsRepository.unwatchAllForSeries(userId, series.id),
      ]);
      return;
    }

    await Promise.all(
      [...seasonEpisodeNumbers].map(([seasonNumber, episodeNumbers]) =>
        TvTrackingService.updateSeasonInteraction(
          userId,
          series.tmdbId,
          seasonNumber,
          { watched: true },
          { syncWatchStatus: false, episodeNumbers },
        ),
      ),
    );
  }

  static async getMyLogs(userId: string, limit?: number, offset?: number) {
    return TvInteractionsRepository.findAllDiaryByUser(userId, limit, offset);
  }

  // The same end state as the sidebar "Watch" toggle turned off: no season or
  // episode marked, no watch status. Like and rating stay.
  static async unwatchSeries(userId: string, seriesId: number) {
    await Promise.all([
      TvEpisodeInteractionsRepository.unwatchAllForSeries(userId, seriesId),
      TvSeasonInteractionsRepository.unwatchAllForSeries(userId, seriesId),
    ]);
    await Promise.all([
      MediaInteractionService.setWatched("tv", userId, seriesId, false),
      TvWatchStatusService.setStatus(userId, seriesId, null),
    ]);
  }

  // A review says it was watched, so it leaves the Watchlist as a Film does,
  // but a review mid-season mustn't knock the series off "watching".
  static async markReviewed(userId: string, seriesId: number) {
    await Promise.all([
      TvWatchStatusService.markCompletedIfUntracked(userId, seriesId),
      MediaInteractionService.setWatched("tv", userId, seriesId, true),
    ]);
  }

  static async getLogs(seriesId: number, limit?: number, offset?: number) {
    return TvInteractionsRepository.getLogsBySeriesId(seriesId, limit, offset);
  }
}
