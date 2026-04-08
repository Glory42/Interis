import { resolveRatingOutOfTen } from "../../diary/helpers/diary-rating.helper";
import { SocialRepository } from "../../social/repositories/social.repository";
import type {
  CreateSerialLogDto,
  UpdateSerialInteractionDto,
} from "../dto/serials.dto";
import {
  buildSerialDiaryEntryActivityMetadata,
  buildSerialInteractionActivityMetadata,
} from "../helpers/serials-activity.helper";
import { toRatingOutOfFive } from "../helpers/serials-normalization.helper";
import { SerialsRepository } from "../repositories/serials.repository";
import { SerialsCacheService } from "./serials-cache.service";

export class SerialsActivityService {
  static async getInteraction(userId: string, tmdbId: number) {
    const series = await SerialsCacheService.findOrCreate(tmdbId);
    if (!series) {
      return null;
    }

    const row = await SerialsRepository.getInteractionRow(userId, series.id);

    return {
      liked: row?.liked ?? false,
      watchlisted: row?.watchlisted ?? false,
      ratingOutOfFive: toRatingOutOfFive(row?.rating ?? null),
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

    const previousRow = await SerialsRepository.getInteractionRow(userId, series.id);
    const previousLiked = previousRow?.liked ?? false;
    const previousWatchlisted = previousRow?.watchlisted ?? false;

    const ratingOutOfTen = resolveRatingOutOfTen(input.ratingOutOfFive);

    const row = await SerialsRepository.upsertInteraction({
      userId,
      seriesId: series.id,
      liked: input.liked,
      watchlisted: input.watchlisted,
      rating:
        input.ratingOutOfFive === undefined ? undefined : (ratingOutOfTen ?? null),
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

    if (!row) {
      return {
        liked: resolvedLiked,
        watchlisted: resolvedWatchlisted,
        ratingOutOfFive: toRatingOutOfFive(ratingOutOfTen ?? null),
      };
    }

    return {
      liked: row.liked,
      watchlisted: row.watchlisted,
      ratingOutOfFive: toRatingOutOfFive(row.rating),
    };
  }

  static async createLog(userId: string, tmdbId: number, input: CreateSerialLogDto) {
    const series = await SerialsCacheService.findOrCreate(tmdbId);
    if (!series) {
      return null;
    }

    const ratingOutOfTen = resolveRatingOutOfTen(input.ratingOutOfFive) ?? null;
    const rewatch = input.rewatch ?? false;

    const entry = await SerialsRepository.insertDiaryEntry({
      userId,
      seriesId: series.id,
      watchedDate: input.watchedDate,
      rating: ratingOutOfTen,
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
      review = await SerialsRepository.upsertReview({
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
          rating: ratingOutOfTen,
          rewatch,
          review,
        }),
      ),
    });

    return { entry, series, review };
  }
}
