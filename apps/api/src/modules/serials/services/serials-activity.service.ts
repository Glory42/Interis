import { SocialRepository } from "../../social/repositories/social.repository";
import type {
  CreateSerialLogDto,
  UpdateSerialInteractionDto,
  UpdateSerialLogDto,
} from "../dto/serials.dto";
import {
  buildSerialDiaryEntryActivityMetadata,
  buildSerialInteractionActivityMetadata,
} from "../helpers/serials-activity.helper";
import { SerialsInteractionsRepository } from "../repositories/serials-interactions.repository";
import { SerialsReviewsRepository } from "../repositories/serials-reviews.repository";
import { SerialsCacheService } from "./serials-cache.service";
import { SerialsEpisodeInteractionsRepository } from "../repositories/serials-episode-interactions.repository";
import { SerialsTrackingService } from "./serials-tracking.service";

export class SerialsActivityService {
  // Shared by updateInteraction (the sidebar "Watch" toggle) and createLog
  // (the "Log" modal) - both are ways for the user to say "I watched this
  // series," so both must cascade the same watched state down to every
  // season/episode instead of only flipping the series-level flag.
  private static async cascadeSeasonsWatched(
    userId: string,
    tmdbId: number,
    numberOfSeasons: number | null,
    watched: boolean,
  ): Promise<void> {
    if (!numberOfSeasons || numberOfSeasons <= 0) {
      return;
    }

    const promises: Promise<unknown>[] = [];
    for (let seasonNum = 1; seasonNum <= numberOfSeasons; seasonNum++) {
      promises.push(
        SerialsTrackingService.updateSeasonInteraction(userId, tmdbId, seasonNum, {
          watched,
        }),
      );
    }
    await Promise.all(promises);
  }

  static async getInteraction(userId: string, tmdbId: number) {
    const series = await SerialsCacheService.findOrCreate(tmdbId);
    if (!series) {
      return null;
    }

    const row = await SerialsInteractionsRepository.getInteractionRow(userId, series.id);
    const userEpisodeInteractions =
      await SerialsEpisodeInteractionsRepository.getAllViewerEpisodeInteractions(
        userId,
        series.id,
        series.tmdbId,
      );
    const watchedEpisodesCount = userEpisodeInteractions.filter((i) => i.watched && i.seasonNumber > 0).length;
    const allEpisodesWatched =
      watchedEpisodesCount === series.numberOfEpisodes && series.numberOfEpisodes > 0;

    return {
      liked: row?.liked ?? false,
      watchlisted: row?.watchlisted ?? false,
      rating: row?.rating ?? null,
      watched: allEpisodesWatched || (row?.isWatched === true),
    };
  }

  static async updateInteraction(
    userId: string,
    tmdbId: number,
    input: UpdateSerialInteractionDto,
  ) {
    const series = await SerialsCacheService.findOrCreate(tmdbId);
    if (!series) {
      return null;
    }

    const previousRow = await SerialsInteractionsRepository.getInteractionRow(userId, series.id);
    const previousLiked = previousRow?.liked ?? false;
    const previousWatchlisted = previousRow?.watchlisted ?? false;
    const previousIsWatched = previousRow?.isWatched ?? false;

    const isImplicitlyWatched =
      input.liked === true ||
      (input.rating !== undefined && input.rating !== null);

    const resolvedIsWatched = input.watched ?? (isImplicitlyWatched ? true : undefined);

    // Cascade whenever the user explicitly toggles "watched" (even to the
    // same value - matches the existing sidebar toggle behavior), or when
    // liking/rating implicitly flips it to watched for the first time. Once
    // previousIsWatched is already true, re-rating doesn't re-cascade -
    // otherwise every rating tweak on an already-watched series would
    // needlessly re-run the season/episode cascade.
    const shouldCascadeSeasons =
      input.watched !== undefined || (resolvedIsWatched === true && !previousIsWatched);

    if (shouldCascadeSeasons) {
      await SerialsActivityService.cascadeSeasonsWatched(
        userId,
        tmdbId,
        series.numberOfSeasons,
        resolvedIsWatched ?? false,
      );
    }

    const row = await SerialsInteractionsRepository.upsertInteraction({
      userId,
      seriesId: series.id,
      liked: input.liked,
      watchlisted: input.watchlisted,
      rating: input.rating,
      isWatched: resolvedIsWatched,
    });

    const resolvedLiked = row?.liked ?? input.liked ?? previousLiked;
    const resolvedWatchlisted =
      row?.watchlisted ?? input.watchlisted ?? previousWatchlisted;

    const metadata = JSON.stringify(
      buildSerialInteractionActivityMetadata({
        series: {
          id: series.id,
          tmdbId: series.tmdbId,
          title: series.title,
          posterPath: series.posterPath,
          firstAirYear: series.firstAirYear,
        },
      }),
    );

    const activityTasks: Promise<unknown>[] = [];

    if (input.liked === true && !previousLiked && resolvedLiked) {
      activityTasks.push(
        SocialRepository.insertActivity({
          userId,
          type: "liked_movie",
          entityId: String(series.id),
          metadata,
        }),
      );
    }

    if (input.watchlisted === true && !previousWatchlisted && resolvedWatchlisted) {
      activityTasks.push(
        SocialRepository.insertActivity({
          userId,
          type: "watchlisted_movie",
          entityId: String(series.id),
          metadata,
        }),
      );
    }

    if (activityTasks.length > 0) {
      await Promise.all(activityTasks);
    }

    const userEpisodeInteractions =
      await SerialsEpisodeInteractionsRepository.getAllViewerEpisodeInteractions(
        userId,
        series.id,
        series.tmdbId,
      );
    const watchedEpisodesCount = userEpisodeInteractions.filter((i) => i.watched && i.seasonNumber > 0).length;
    const allEpisodesWatched =
      watchedEpisodesCount === series.numberOfEpisodes && series.numberOfEpisodes > 0;

    return {
      liked: resolvedLiked,
      watchlisted: resolvedWatchlisted,
      rating: row?.rating ?? null,
      watched: allEpisodesWatched || (row?.isWatched === true),
    };
  }

  static async createLog(userId: string, tmdbId: number, input: CreateSerialLogDto) {
    const series = await SerialsCacheService.findOrCreate(tmdbId);
    if (!series) {
      return null;
    }

    const rating = input.rating ?? null;
    const rewatch = input.rewatch ?? false;

    const entry = await SerialsInteractionsRepository.insertDiaryEntry({
      userId,
      seriesId: series.id,
      watchedDate: input.watchedDate,
      rating: rating,
      rewatch,
    });

    if (!entry) {
      throw new Error("Failed to create serial diary entry");
    }

    const reviewContent = input.review?.trim();

    let review:
      | {
          id: string;
          content: string;
          containsSpoilers: boolean;
        }
      | null = null;

    if (reviewContent) {
      review = await SerialsReviewsRepository.upsertReview({
        userId,
        seriesTmdbId: series.tmdbId,
        diaryEntryId: entry.id,
        content: reviewContent,
        containsSpoilers: input.containsSpoilers ?? false,
      });
    }

    await Promise.all([
      SocialRepository.insertActivity({
        userId,
        type: "diary_entry",
        entityId: entry.id,
        metadata: JSON.stringify(
          buildSerialDiaryEntryActivityMetadata({
            series: {
              id: series.id,
              tmdbId: series.tmdbId,
              title: series.title,
              posterPath: series.posterPath,
              firstAirYear: series.firstAirYear,
            },
            rating: rating,
            rewatch,
            review,
          }),
        ),
      }),
      SerialsInteractionsRepository.setWatched(userId, series.id),
      SerialsActivityService.cascadeSeasonsWatched(
        userId,
        tmdbId,
        series.numberOfSeasons,
        true,
      ),
    ]);

    return { entry, series, review };
  }

  static async getMyLogs(userId: string) {
    return SerialsInteractionsRepository.findAllDiaryByUser(userId);
  }

  static async updateLog(entryId: string, userId: string, input: UpdateSerialLogDto) {
    return SerialsInteractionsRepository.updateDiaryEntry(entryId, userId, {
      watchedDate: input.watchedDate,
      rating: input.rating,
      rewatch: input.rewatch,
    });
  }

  static async deleteLog(entryId: string, userId: string) {
    return SerialsInteractionsRepository.deleteDiaryEntry(entryId, userId);
  }

  static async getLogs(seriesId: number) {
    return SerialsInteractionsRepository.getLogsBySeriesId(seriesId);
  }
}
