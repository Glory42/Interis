import { InteractionsService } from "../../interactions/interactions.service";
import { MoviesService } from "../../movies/movies.service";
import { SocialFeedService } from "../../social/services/social-feed.service";
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
      review = await DiaryRepository.upsertReview({
        userId,
        movieId: movie.id,
        movieTmdbId: movie.tmdbId,
        diaryEntryId: entry.id,
        content: reviewContent,
        containsSpoilers: input.containsSpoilers ?? false,
      });
    }

    await Promise.all([
      InteractionsService.setWatched(userId, movie.id),
      DiaryRepository.insertActivity({
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
            rating,
            rewatch,
            hasReview: Boolean(review),
            reviewId: review?.id ?? null,
          }),
        ),
      }),
    ]);

    SocialFeedService.invalidateFollowingFeed(userId);

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
