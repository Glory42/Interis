import { InteractionsService } from "../../interactions/interactions.service";
import { MoviesService } from "../../movies/movies.service";
import { MovieActivityRecorder } from "../../movies/services/movie-activity-recorder.service";
import { ReviewsRepository } from "../../reviews/repositories/reviews.repository";
import { buildDiaryEntryActivityMetadata } from "../helpers/diary-activity.helper";
import { DiaryRepository } from "../repositories/diary.repository";
import type { CreateDiaryDto, UpdateDiaryDto } from "../dto/diary.dto";
import { NotFoundError } from "../../../commons/errors/app-error";

export class DiaryWriteService {
  static async create(userId: string, input: CreateDiaryDto) {
    const movie = await MoviesService.findOrCreate(input.tmdbId);
    if (!movie || !movie.id) {
      throw new NotFoundError("Movie not found");
    }

    const rating = input.rating ?? null;
    const rewatch = input.rewatch ?? false;

    const entry = await DiaryRepository.insertEntry({
      userId,
      movieId: movie.id,
      watchedDate: input.watchedDate,
      rating,
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
      review = await ReviewsRepository.upsertReview({
        userId,
        mediaType: "movie",
        tmdbId: movie.tmdbId,
        movieId: movie.id,
        diaryEntryId: entry.id,
        content: reviewContent,
        containsSpoilers: input.containsSpoilers ?? false,
      });
    }

    await InteractionsService.setWatched(userId, movie.id);

    MovieActivityRecorder.record({
      userId,
      movie,
      type: "diary_entry",
      entityId: entry.id,
      extraMetadata: buildDiaryEntryActivityMetadata({
        rating,
        rewatch,
        hasReview: Boolean(review),
        reviewId: review?.id ?? null,
      }),
    });

    return { entry, movie, review };
  }

  static async update(entryId: string, userId: string, input: UpdateDiaryDto) {
    return DiaryRepository.updateByIdAndUser({
      entryId,
      userId,
      watchedDate: input.watchedDate,
      rating: input.rating,
      rewatch: input.rewatch,
    });
  }

  static async delete(entryId: string, userId: string) {
    return DiaryRepository.deleteByIdAndUser(entryId, userId);
  }

  // No ownership check — admin moderation only.
  static async deleteById(entryId: string) {
    return DiaryRepository.deleteById(entryId);
  }
}
