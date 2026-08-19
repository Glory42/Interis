import { MoviesService } from "../../movies/movies.service";
import { SerialsService } from "../../serials/serials.service";
import { SerialsReviewsRepository } from "../../serials/repositories/serials-reviews.repository";
import { SerialsInteractionsRepository } from "../../serials/repositories/serials-interactions.repository";
import { InteractionsService } from "../../interactions/interactions.service";
import { SocialRepository } from "../../social/repositories/social.repository";
import { SocialFeedService } from "../../social/services/social-feed.service";
import { ReviewsRepository } from "../repositories/reviews.repository";
import { buildReviewCreatedActivityMetadata } from "../helpers/reviews-activity.helper";
import type { CreateReviewDto, UpdateReviewDto } from "../dto/reviews.dto";
import { NotFoundError } from "../../../commons/errors/app-error";

export class ReviewsCoreService {
  static async create(userId: string, input: CreateReviewDto) {
    if (input.mediaType === "tv") {
      const series = await SerialsService.findOrCreate(input.tmdbId);
      if (!series) throw new NotFoundError("Series not found");

      const review = await SerialsReviewsRepository.upsertReview({
        userId,
        seriesTmdbId: series.tmdbId,
        diaryEntryId: input.diaryEntryId ?? null,
        content: input.content,
        containsSpoilers: input.containsSpoilers ?? false,
      });

      if (!review) throw new Error("Could not create review");

      await Promise.all([
        SerialsInteractionsRepository.setWatched(userId, series.id),
        SocialRepository.insertActivity({
          userId,
          type: "review",
          entityId: review.id,
          metadata: JSON.stringify(
            buildReviewCreatedActivityMetadata({
              reviewId: review.id,
              content: input.content,
              containsSpoilers: review.containsSpoilers,
              media: {
                mediaType: "tv",
                tmdbId: series.tmdbId,
                title: series.title,
                posterPath: series.posterPath,
                releaseYear: series.firstAirYear,
              },
            }),
          ),
        }),
      ]);

      SocialFeedService.invalidateFollowingFeed(userId);

      return { review, series };
    }

    const movie = await MoviesService.findOrCreate(input.tmdbId);

    const review = await ReviewsRepository.insertMovieReview({
      userId,
      movieId: movie.id,
      movieTmdbId: movie.tmdbId,
      diaryEntryId: input.diaryEntryId ?? null,
      content: input.content,
      containsSpoilers: input.containsSpoilers ?? false,
    });

    if (!review) {
      throw new Error("Could not create review");
    }

    await Promise.all([
      InteractionsService.setWatched(userId, movie.id),
      SocialRepository.insertActivity({
        userId,
        type: "review",
        entityId: review.id,
        metadata: JSON.stringify(
          buildReviewCreatedActivityMetadata({
            reviewId: review.id,
            content: input.content,
            containsSpoilers: review.containsSpoilers,
            media: {
              mediaType: "movie",
              tmdbId: movie.tmdbId,
              title: movie.title,
              posterPath: movie.posterPath,
              releaseYear: movie.releaseYear,
            },
          }),
        ),
      }),
    ]);

    SocialFeedService.invalidateFollowingFeed(userId);

    return { review, movie };
  }

  static async findById(reviewId: string) {
    return ReviewsRepository.findByIdWithLikeCount(reviewId);
  }

  static async findByMovie(movieId: number) {
    return ReviewsRepository.findByMovieId(movieId);
  }

  static async findByUser(userId: string) {
    return ReviewsRepository.findByUserId(userId);
  }

  static async update(reviewId: string, userId: string, input: UpdateReviewDto) {
    const updated = await ReviewsRepository.updateByIdAndUser(reviewId, userId, input);
    SocialFeedService.invalidateFollowingFeed(userId);
    return updated;
  }

  static async delete(reviewId: string, userId: string) {
    const deleted = await ReviewsRepository.deleteByIdAndUser(reviewId, userId);
    SocialFeedService.invalidateFollowingFeed(userId);
    return deleted;
  }

  // No ownership check — admin moderation only.
  static async deleteById(reviewId: string) {
    return ReviewsRepository.deleteById(reviewId);
  }

  // Movie reviews only — TV reviews live in the serials module's own table.
  static async listAllForAdmin(
    filters: { userId?: string; movieId?: number },
    limit: number,
    offset: number,
  ) {
    return ReviewsRepository.listAllForAdmin(filters, limit, offset);
  }
}
