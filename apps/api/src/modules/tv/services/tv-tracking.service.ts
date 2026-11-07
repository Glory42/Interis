import { TvSeasonInteractionsRepository } from "../repositories/tv-season-interactions.repository";
import { TvEpisodeInteractionsRepository } from "../repositories/tv-episode-interactions.repository";
import {
  TvSeasonEpisodeReviewsRepository,
  type SeasonEpisodeReviewInput,
} from "../repositories/tv-season-episode-reviews.repository";
import { TvCacheService } from "./tv-cache.service";
import { getSeriesSeasonDetails as tmdbGetSeasonDetails } from "../../../infrastructure/tmdb/tv";
import { ActivityRecorder } from "../../social/services/activity-recorder.service";
import { buildReviewExtraMetadata } from "../helpers/tv-activity.helper";
import { isNonSpecialSeasonNumber } from "../constants/tv-season.constants";
import { TvWatchStatusService } from "./tv-watch-status.service";
import { TvLevelActivityService } from "./tv-level-activity.service";
import { resolveEpisodeWatchedUpdate } from "../helpers/tv-implicit-watched.helper";
import { ServiceUnavailableError } from "../../../commons/errors/app-error";

export class TvTrackingService {
  // The episode numbers a "mark season watched" cascade checks. Resolved
  // before anything is written, so a TMDB failure fails the request instead
  // of saving the season flag with no episodes behind it (#69).
  static async getSeasonEpisodeNumbers(tmdbId: number, seasonNumber: number): Promise<number[]> {
    const detail = await tmdbGetSeasonDetails(tmdbId, seasonNumber).catch(() => null);
    if (!detail) {
      throw new ServiceUnavailableError(
        "Couldn't load this season's episodes right now. Please try again.",
      );
    }
    return (detail.episodes ?? []).map((episode) => episode.episode_number);
  }

  static async updateSeasonInteraction(
    userId: string,
    tmdbId: number,
    seasonNumber: number,
    input: { watched?: boolean; liked?: boolean; rating?: number | null },
    options: {
      // The whole-series cascade sets the status itself once, instead of
      // every season re-syncing it in parallel.
      syncWatchStatus?: boolean;
      // Pre-resolved by a caller cascading several seasons at once.
      episodeNumbers?: number[];
    } = {},
  ) {
    const series = await TvCacheService.findOrCreate(tmdbId);
    if (!series) return null;

    const episodeNumbers =
      input.watched === true
        ? (options.episodeNumbers ??
          (await TvTrackingService.getSeasonEpisodeNumbers(tmdbId, seasonNumber)))
        : [];

    const previousRow = await TvSeasonInteractionsRepository.getSingleInteraction(userId, series.id, seasonNumber);

    const rating = input.rating;

    const row = await TvSeasonInteractionsRepository.upsertSeasonInteraction({
      userId,
      seriesId: series.id,
      seasonNumber,
      watched: input.watched,
      liked: input.liked,
      rating,
    });

    if (!row) return null;

    await TvLevelActivityService.syncInteraction({
      userId,
      subject: { kind: "season", series, seasonNumber },
      change: input,
      previous: previousRow,
      current: row,
    });

    // Only an explicit toggle cascades. Re-cascading whenever the stored flag
    // is true would mark newly aired episodes watched on a later like or
    // rating of an already-watched season (#70). Unwatching needs no episode
    // list from TMDB: it clears whatever rows the season has.
    if (input.watched === true) {
      await TvEpisodeInteractionsRepository.upsertManyEpisodeWatchedState({
        userId,
        seriesId: series.id,
        seasonNumber,
        episodeNumbers,
        watched: true,
      });
    } else if (input.watched === false) {
      await TvEpisodeInteractionsRepository.unwatchSeason(userId, series.id, seasonNumber);
    }

    if (
      options.syncWatchStatus !== false &&
      isNonSpecialSeasonNumber(seasonNumber) &&
      (input.watched !== undefined || row.watched !== (previousRow?.watched ?? false))
    ) {
      await TvWatchStatusService.syncFromEpisodes(userId, series, {
        episodeAdded: row.watched,
      });
    }

    return {
      watched: row.watched,
      liked: row.liked,
      rating: row.rating,
    };
  }

  static async updateEpisodeInteraction(
    userId: string,
    tmdbId: number,
    seasonNumber: number,
    episodeNumber: number,
    input: { watched?: boolean; liked?: boolean; rating?: number | null },
  ) {
    const series = await TvCacheService.findOrCreate(tmdbId);
    if (!series) return null;

    const previousRow = await TvEpisodeInteractionsRepository.getSingleInteraction(userId, series.id, seasonNumber, episodeNumber);

    const rating = input.rating;

    const row = await TvEpisodeInteractionsRepository.upsertEpisodeInteraction({
      userId,
      seriesId: series.id,
      seasonNumber,
      episodeNumber,
      watched: resolveEpisodeWatchedUpdate(previousRow, input),
      liked: input.liked,
      rating,
    });

    if (!row) return null;

    await TvLevelActivityService.syncInteraction({
      userId,
      subject: { kind: "episode", series, seasonNumber, episodeNumber },
      change: input,
      previous: previousRow,
      current: row,
    });

    const watchedChanged = row.watched !== (previousRow?.watched ?? false);
    await Promise.all([
      watchedChanged
        ? TvTrackingService.syncSeasonWatchedFromEpisodes(
            userId,
            tmdbId,
            series.id,
            seasonNumber,
            row.watched,
          )
        : null,
      watchedChanged && isNonSpecialSeasonNumber(seasonNumber)
        ? TvWatchStatusService.syncFromEpisodes(userId, series, {
            episodeAdded: row.watched,
          })
        : null,
    ]);

    return {
      watched: row.watched,
      liked: row.liked,
      rating: row.rating,
    };
  }

  // Toggling episodes one by one never touches the season's own watched
  // flag, which otherwise only gets set by the season-level "Watch" toggle
  // (updateSeasonInteraction) - so a season fully watched episode-by-episode
  // stays stuck showing "Unwatched". Recomputes and persists the season flag
  // from actual episode state after every episode toggle, so it's always a
  // derived, correct reflection of episode completion rather than two
  // independently-writable flags that can drift apart.
  private static async syncSeasonWatchedFromEpisodes(
    userId: string,
    tmdbId: number,
    seriesId: number,
    seasonNumber: number,
    episodeWatched: boolean,
  ): Promise<void> {
    const tmdbSeasonDetail = await tmdbGetSeasonDetails(tmdbId, seasonNumber).catch(() => null);
    if (!tmdbSeasonDetail) {
      // Without the episode list we can't tell whether the season is now
      // complete, but an unchecked episode always means it isn't (#69).
      if (!episodeWatched) {
        await TvSeasonInteractionsRepository.upsertSeasonInteraction({
          userId,
          seriesId,
          seasonNumber,
          watched: false,
        });
      }
      return;
    }
    if (!tmdbSeasonDetail.episodes || tmdbSeasonDetail.episodes.length === 0) {
      return;
    }

    const episodeInteractions = await TvEpisodeInteractionsRepository.getViewerEpisodeInteractions(
      userId,
      seriesId,
      tmdbId,
      seasonNumber,
    );
    const watchedEpisodeNumbers = new Set(
      episodeInteractions.filter((interaction) => interaction.watched).map((interaction) => interaction.episodeNumber),
    );
    const allEpisodesWatched = tmdbSeasonDetail.episodes.every((episode) =>
      watchedEpisodeNumbers.has(episode.episode_number),
    );

    await TvSeasonInteractionsRepository.upsertSeasonInteraction({
      userId,
      seriesId,
      seasonNumber,
      watched: allEpisodesWatched,
    });
  }

  static async getSeasonReview(userId: string, seriesTmdbId: number, seasonNumber: number) {
    return TvSeasonEpisodeReviewsRepository.getSeasonReview(userId, seriesTmdbId, seasonNumber);
  }

  static async upsertSeasonReview(
    userId: string,
    seriesTmdbId: number,
    seasonNumber: number,
    input: SeasonEpisodeReviewInput,
  ) {
    const { row, isNew } = await TvSeasonEpisodeReviewsRepository.upsertSeasonReview(
      userId,
      seriesTmdbId,
      seasonNumber,
      input,
    );

    if (isNew && row) {
      const series = await TvCacheService.findOrCreate(seriesTmdbId).catch(() => null);
      if (series) {
        ActivityRecorder.recordMedia({
          userId,
          subject: { kind: "season", series, seasonNumber },
          type: "review",
          entityId: row.id,
          extraMetadata: buildReviewExtraMetadata({
            id: row.id,
            content: row.content,
            containsSpoilers: row.containsSpoilers,
          }),
        });
      }
    }

    return row ?? null;
  }

  static async deleteSeasonReview(
    userId: string,
    seriesTmdbId: number,
    seasonNumber: number,
    reviewId?: string,
  ) {
    const deleted = await TvSeasonEpisodeReviewsRepository.deleteSeasonReview(
      userId,
      seriesTmdbId,
      seasonNumber,
      reviewId,
    );
    await TvTrackingService.retractReview(userId, deleted);
    return deleted;
  }

  static async getEpisodeReview(
    userId: string,
    seriesTmdbId: number,
    seasonNumber: number,
    episodeNumber: number,
  ) {
    return TvSeasonEpisodeReviewsRepository.getEpisodeReview(
      userId,
      seriesTmdbId,
      seasonNumber,
      episodeNumber,
    );
  }

  static async upsertEpisodeReview(
    userId: string,
    seriesTmdbId: number,
    seasonNumber: number,
    episodeNumber: number,
    input: SeasonEpisodeReviewInput,
  ) {
    const { row, isNew } = await TvSeasonEpisodeReviewsRepository.upsertEpisodeReview(
      userId,
      seriesTmdbId,
      seasonNumber,
      episodeNumber,
      input,
    );

    if (isNew && row) {
      const series = await TvCacheService.findOrCreate(seriesTmdbId).catch(() => null);
      if (series) {
        ActivityRecorder.recordMedia({
          userId,
          subject: { kind: "episode", series, seasonNumber, episodeNumber },
          type: "review",
          entityId: row.id,
          extraMetadata: buildReviewExtraMetadata({
            id: row.id,
            content: row.content,
            containsSpoilers: row.containsSpoilers,
          }),
        });
      }
    }

    return row ?? null;
  }

  static async deleteEpisodeReview(
    userId: string,
    seriesTmdbId: number,
    seasonNumber: number,
    episodeNumber: number,
    reviewId?: string,
  ) {
    const deleted = await TvSeasonEpisodeReviewsRepository.deleteEpisodeReview(
      userId,
      seriesTmdbId,
      seasonNumber,
      episodeNumber,
      reviewId,
    );
    await TvTrackingService.retractReview(userId, deleted);
    return deleted;
  }

  private static async retractReview(userId: string, deleted: { id: string } | null) {
    if (deleted) {
      await ActivityRecorder.retract({ userId, type: "review", entityId: deleted.id });
    }
  }
}
