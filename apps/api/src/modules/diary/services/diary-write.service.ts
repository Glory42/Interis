import { InteractionsService } from "../../interactions/interactions.service";
import { MoviesService } from "../../movies/movies.service";
import { ActivityRecorder } from "../../social/services/activity-recorder.service";
import { ReviewsRepository } from "../../reviews/repositories/reviews.repository";
import { buildDiaryEntryActivityMetadata } from "../helpers/diary-activity.helper";
import { DiaryRepository } from "../repositories/diary.repository";
import type { CreateDiaryDto, DeleteDiaryQueryDto, UpdateDiaryDto } from "../dto/diary.dto";
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
      review = await ReviewsRepository.createReview({
        userId,
        mediaType: "movie",
        tmdbId: movie.tmdbId,
        movieId: movie.id,
        diaryEntryId: entry.id,
        content: reviewContent,
        containsSpoilers: input.containsSpoilers ?? false,
      });
    }

    await Promise.all([
      InteractionsService.setWatched(userId, movie.id),
      rating !== null ? DiaryWriteService.syncRatingFromLog(userId, movie.id, entry.id) : null,
    ]);

    ActivityRecorder.recordMedia({
      userId,
      subject: { kind: "movie", movie },
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
    const updated = await DiaryRepository.updateByIdAndUser({
      entryId,
      userId,
      watchedDate: input.watchedDate,
      rating: input.rating,
      rewatch: input.rewatch,
    });
    if (!updated) return null;

    ActivityRecorder.invalidateFeeds(userId);
    if (updated.rating !== null && (input.rating !== undefined || input.watchedDate !== undefined)) {
      await DiaryWriteService.syncRatingFromLog(userId, updated.movieId, updated.id);
    }
    return updated;
  }

  // "Your rating" follows the latest rated log (#91). A log only sets it
  // when it is that log, so logging or editing an older watch leaves it.
  private static async syncRatingFromLog(userId: string, movieId: number, entryId: string) {
    const latest = await DiaryRepository.findLatestRatedLog(userId, movieId);
    if (latest?.id === entryId && latest.rating !== null) {
      await InteractionsService.setRating(userId, movieId, latest.rating);
    }
  }

  // Deleting a log keeps the movie watched, as Letterboxd does, unless the
  // user asks otherwise and no other log of it is left (#86).
  static async delete(entryId: string, userId: string, options: DeleteDiaryQueryDto = {}) {
    const deleted = await DiaryRepository.deleteByIdAndUser(entryId, userId);
    if (!deleted) return null;

    const unwatch =
      options.unwatch === true && !(await DiaryRepository.hasLogOfMovie(userId, deleted.movieId));
    await Promise.all([
      DiaryWriteService.retractLog(deleted),
      unwatch ? InteractionsService.setUnwatched(userId, deleted.movieId) : null,
    ]);
    return { ...deleted, unwatched: unwatch };
  }

  // No ownership check — admin moderation only.
  static async deleteById(entryId: string) {
    const deleted = await DiaryRepository.deleteById(entryId);
    if (deleted) await DiaryWriteService.retractLog(deleted);
    return deleted;
  }

  private static async retractLog(deleted: { id: string; userId: string }) {
    await ActivityRecorder.retract({
      userId: deleted.userId,
      type: "diary_entry",
      entityId: deleted.id,
    });
  }
}
