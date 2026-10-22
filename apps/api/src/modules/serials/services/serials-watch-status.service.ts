import { SerialsWatchStatusRepository } from "../repositories/serials-watch-status.repository";
import { resolveWatchStatusFromProgress } from "../helpers/serials-watch-status.helper";
import type {
  SerialWatchStatus,
  UserSetWatchStatus,
} from "../constants/serials-watch-status.constants";

type SeriesRef = { id: number; numberOfEpisodes: number | null };

// The one writer of serial_interaction.watch_status, so the watched toggle,
// logs, reviews, episode/season toggles and the Pause/Drop/Resume control
// can't drift into separate "watched" truths again.
export class SerialsWatchStatusService {
  static async getStatus(userId: string, seriesId: number) {
    return SerialsWatchStatusRepository.getStatus(userId, seriesId);
  }

  static async setStatus(userId: string, seriesId: number, status: SerialWatchStatus | null) {
    await SerialsWatchStatusRepository.setStatus(userId, seriesId, status);
  }

  static async markCompletedIfUntracked(userId: string, seriesId: number) {
    await SerialsWatchStatusRepository.markCompletedIfUntracked(userId, seriesId);
  }

  // After a regular-season episode or season toggle. `episodeAdded` is true
  // when the toggle checked something, which pulls a paused/dropped series
  // back to watching.
  static async syncFromEpisodes(
    userId: string,
    series: SeriesRef,
    options: { episodeAdded: boolean },
  ): Promise<SerialWatchStatus | null> {
    const [current, watchedEpisodesCount] = await Promise.all([
      SerialsWatchStatusRepository.getStatus(userId, series.id),
      SerialsWatchStatusRepository.countWatchedRegularEpisodes(userId, series.id),
    ]);

    const next = resolveWatchStatusFromProgress({
      current,
      watchedEpisodesCount,
      totalEpisodes: series.numberOfEpisodes,
      episodeAdded: options.episodeAdded,
    });

    if (next !== current) {
      await SerialsWatchStatusRepository.setStatus(userId, series.id, next);
    }

    return next;
  }

  // Pause / Drop keep episode history. Resume re-derives from progress, so
  // resuming a series with every episode checked lands on completed.
  static async setUserStatus(
    userId: string,
    series: SeriesRef,
    status: UserSetWatchStatus,
  ): Promise<SerialWatchStatus> {
    let next: SerialWatchStatus = status;

    if (status === "watching") {
      const watchedEpisodesCount =
        await SerialsWatchStatusRepository.countWatchedRegularEpisodes(userId, series.id);
      next =
        resolveWatchStatusFromProgress({
          current: null,
          watchedEpisodesCount,
          totalEpisodes: series.numberOfEpisodes,
          episodeAdded: true,
        }) ?? "watching";
    }

    await SerialsWatchStatusRepository.setStatus(userId, series.id, next);
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
    await SerialsWatchStatusRepository.reopenCompletedSeries(seriesId, nextEpisodes);
  }
}
