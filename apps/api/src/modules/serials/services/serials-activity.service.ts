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
    const watchedEpisodesCount = userEpisodeInteractions.filter((i) => i.watched).length;
    const allEpisodesWatched =
      watchedEpisodesCount === series.numberOfEpisodes && series.numberOfEpisodes > 0;

    return {
      liked: row?.liked ?? false,
      watchlisted: row?.watchlisted ?? false,
      rating: row?.rating ?? null,
      watched: allEpisodesWatched,
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

    if (input.watched !== undefined) {
      const numberOfSeasons = series.numberOfSeasons;
      if (numberOfSeasons && numberOfSeasons > 0) {
        const promises: Promise<unknown>[] = [];
        for (let seasonNum = 1; seasonNum <= numberOfSeasons; seasonNum++) {
          promises.push(
            SerialsTrackingService.updateSeasonInteraction(userId, tmdbId, seasonNum, {
              watched: input.watched,
            })
          );
        }
        await Promise.all(promises);
      }
    }

    const previousRow = await SerialsInteractionsRepository.getInteractionRow(userId, series.id);
    const previousLiked = previousRow?.liked ?? false;
    const previousWatchlisted = previousRow?.watchlisted ?? false;

    const row = await SerialsInteractionsRepository.upsertInteraction({
      userId,
      seriesId: series.id,
      liked: input.liked,
      watchlisted: input.watchlisted,
      rating: input.rating,
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
    const watchedEpisodesCount = userEpisodeInteractions.filter((i) => i.watched).length;
    const allEpisodesWatched =
      watchedEpisodesCount === series.numberOfEpisodes && series.numberOfEpisodes > 0;

    return {
      liked: resolvedLiked,
      watchlisted: resolvedWatchlisted,
      rating: row?.rating ?? null,
      watched: allEpisodesWatched,
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

    await SocialRepository.insertActivity({
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
    });

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
