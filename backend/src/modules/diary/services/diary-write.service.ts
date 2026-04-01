import { MoviesService } from "../../movies/movies.service";
import { buildDiaryEntryActivityMetadata } from "../helpers/diary-activity.helper";
import { resolveRatingOutOfTen } from "../helpers/diary-rating.helper";
import { DiaryRepository } from "../repositories/diary.repository";
import type { CreateDiaryDto, UpdateDiaryDto } from "../dto/diary.dto";

export class DiaryWriteService {
  static async create(userId: string, input: CreateDiaryDto) {
    const movie = await MoviesService.findOrCreate(input.tmdbId);
    if (!movie || !movie.id) {
      throw new Error("Movie not found");
    }

    const ratingOutOfTen = resolveRatingOutOfTen(input.ratingOutOfFive) ?? null;
    const rewatch = input.rewatch ?? false;

    const entry = await DiaryRepository.insertEntry({
      userId,
      movieId: movie.id,
      watchedDate: input.watchedDate,
      rating: ratingOutOfTen,
      rewatch,
    });

    if (!entry) {
      throw new Error("Failed to create diary entry");
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
      review = await DiaryRepository.upsertReview({
        userId,
        movieId: movie.id,
        movieTmdbId: movie.tmdbId,
        diaryEntryId: entry.id,
        content: reviewContent,
        containsSpoilers: input.containsSpoilers ?? false,
      });
    }

    await DiaryRepository.insertActivity({
      userId,
      type: "diary_entry",
      entityId: entry.id,
      metadata: JSON.stringify(
        buildDiaryEntryActivityMetadata({
          movie: {
            id: movie.id,
            tmdbId: movie.tmdbId,
            title: movie.title,
            posterPath: movie.posterPath,
            releaseYear: movie.releaseYear,
          },
          rating: ratingOutOfTen,
          rewatch,
          hasReview: Boolean(review),
          reviewId: review?.id ?? null,
        }),
      ),
    });

    return { entry, movie, review };
  }

  static async update(entryId: string, userId: string, input: UpdateDiaryDto) {
    const ratingOutOfTen = resolveRatingOutOfTen(input.ratingOutOfFive);

    return DiaryRepository.updateByIdAndUser({
      entryId,
      userId,
      watchedDate: input.watchedDate,
      rating: ratingOutOfTen,
      rewatch: input.rewatch,
    });
  }

  static async delete(entryId: string, userId: string) {
    return DiaryRepository.deleteByIdAndUser(entryId, userId);
  }
}
