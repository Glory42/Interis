import { resolveRatingOutOfTen } from "../../diary/helpers/diary-rating.helper";
import { SocialRepository } from "../../social/repositories/social.repository";
import type {
  CreateSerialLogDto,
  UpdateSerialInteractionDto,
} from "../dto/serials.dto";
import { buildSerialDiaryEntryActivityMetadata } from "../helpers/serials-activity.helper";
import { SerialsRepository } from "../repositories/serials.repository";
import { SerialsCacheService } from "./serials-cache.service";

export class SerialsActivityService {
  static async getInteraction(userId: string, tmdbId: number) {
    const series = await SerialsCacheService.findOrCreate(tmdbId);
    if (!series) {
      return null;
    }

    const row = await SerialsRepository.getInteractionRow(userId, series.id);

    return row ?? { userId, seriesId: series.id, liked: false, watchlisted: false };
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

    return SerialsRepository.upsertInteraction({
      userId,
      seriesId: series.id,
      liked: input.liked,
      watchlisted: input.watchlisted,
    });
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
