import { TvWatchStatusRepository } from "../repositories/tv-watch-status.repository";
import { resolveWatchStatusFromProgress } from "../helpers/tv-watch-status.helper";
import type {
  SeriesWatchStatus,
  UserSetWatchStatus,
} from "../constants/tv-watch-status.constants";

type SeriesRef = { id: number; numberOfEpisodes: number | null };

// The one writer of serial_interaction.watch_status, so the watched toggle,
// logs, reviews, episode/season toggles and the Pause/Drop/Resume control
// can't drift into separate "watched" truths again.
export class TvWatchStatusService {
  static async getStatus(userId: string, seriesId: number) {
    return TvWatchStatusRepository.getStatus(userId, seriesId);
  }

  static async setStatus(userId: string, seriesId: number, status: SeriesWatchStatus | null) {
    await TvWatchStatusRepository.setStatus(userId, seriesId, status);
  }

  static async markCompletedIfUntracked(userId: string, seriesId: number) {
    await TvWatchStatusRepository.markCompletedIfUntracked(userId, seriesId);
  }

  // After a regular-season episode or season toggle. `episodeAdded` is true
  // when the toggle checked something, which pulls a paused/dropped series
  // back to watching.
  static async syncFromEpisodes(
    userId: string,
    series: SeriesRef,
    options: { episodeAdded: boolean },
  ): Promise<SeriesWatchStatus | null> {
    const [current, watchedEpisodesCount] = await Promise.all([
      TvWatchStatusRepository.getStatus(userId, series.id),
      TvWatchStatusRepository.countWatchedRegularEpisodes(userId, series.id),
    ]);

    const next = resolveWatchStatusFromProgress({
      current,
      watchedEpisodesCount,
      totalEpisodes: series.numberOfEpisodes,
      episodeAdded: options.episodeAdded,
    });

    if (next !== current) {
      await TvWatchStatusRepository.setStatus(userId, series.id, next);
    }

    return next;
  }

  // Pause / Drop keep episode history. Resume re-derives from progress, so
  // resuming a series with every episode checked lands on completed.
  static async setUserStatus(
    userId: string,
    series: SeriesRef,
    status: UserSetWatchStatus,
  ): Promise<SeriesWatchStatus> {
    let next: SeriesWatchStatus = status;

    if (status === "watching") {
      const watchedEpisodesCount =
        await TvWatchStatusRepository.countWatchedRegularEpisodes(userId, series.id);
      next =
        resolveWatchStatusFromProgress({
          current: null,
          watchedEpisodesCount,
          totalEpisodes: series.numberOfEpisodes,
          episodeAdded: true,
        }) ?? "watching";
    }

    await TvWatchStatusRepository.setStatus(userId, series.id, next);
    return next;
  }

  // Called when a cache refresh shows the series grew.
  static async reopenAfterNewEpisodes(
    seriesId: number,
    previousEpisodes: number | null,
    nextEpisodes: number | null,
  ): Promise<void> {
    if (previousEpisodes === null || nextEpisodes === null || nextEpisodes <= previousEpisodes) {
      return;
    }
    await TvWatchStatusRepository.reopenCompletedSeries(seriesId, nextEpisodes);
  }
}
