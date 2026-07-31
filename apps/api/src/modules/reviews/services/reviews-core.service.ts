import { and, desc, eq, sql } from "drizzle-orm";
import { db } from "../../../infrastructure/database/db";
import { user } from "../../../infrastructure/database/auth.entity";
import { movies } from "../../movies/movies.entity";
import { MoviesService } from "../../movies/movies.service";
import { SerialsService } from "../../serials/serials.service";
import { SerialsReviewsRepository } from "../../serials/repositories/serials-reviews.repository";
import { SocialRepository } from "../../social/repositories/social.repository";
import { reviewLikes, reviews } from "../reviews.entity";
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

      await SocialRepository.insertActivity({
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
      });

      return { review, series };
    }

    const movie = await MoviesService.findOrCreate(input.tmdbId);

    const [review] = await db
      .insert(reviews)
      .values({
        userId,
        mediaType: "movie",
        mediaSource: "tmdb",
        mediaSourceId: String(movie.tmdbId),
        movieId: movie.id,
        diaryEntryId: input.diaryEntryId ?? null,
        content: input.content,
        containsSpoilers: input.containsSpoilers ?? false,
      })
      .onConflictDoUpdate({
        target: [
          reviews.userId,
          reviews.mediaType,
          reviews.mediaSource,
          reviews.mediaSourceId,
        ],
        set: {
          movieId: movie.id,
          diaryEntryId: input.diaryEntryId ?? null,
          content: input.content,
          containsSpoilers: input.containsSpoilers ?? false,
          updatedAt: new Date(),
        },
      })
      .returning();

    if (!review) {
      throw new Error("Could not create review");
    }

    await SocialRepository.insertActivity({
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
    });

    return { review, movie };
  }

  static async findById(reviewId: string) {
    const [review] = await db
      .select({
        review: reviews,
        likeCount: sql<number>`count(${reviewLikes.reviewId})`.as("like_count"),
      })
      .from(reviews)
      .leftJoin(reviewLikes, eq(reviewLikes.reviewId, reviews.id))
      .where(eq(reviews.id, reviewId))
      .groupBy(reviews.id)
      .limit(1);

    return review ?? null;
  }

  static async findByMovie(movieId: number) {
    return db
      .select()
      .from(reviews)
      .where(and(eq(reviews.movieId, movieId), eq(reviews.mediaType, "movie")))
      .orderBy(desc(reviews.createdAt));
  }

  static async findByUser(userId: string) {
    return db
      .select()
      .from(reviews)
      .where(eq(reviews.userId, userId))
      .orderBy(desc(reviews.createdAt));
  }

  static async update(reviewId: string, userId: string, input: UpdateReviewDto) {
    const [updated] = await db
      .update(reviews)
      .set({
        ...(input.content !== undefined && { content: input.content }),
        ...(input.containsSpoilers !== undefined && {
          containsSpoilers: input.containsSpoilers,
        }),
      })
      .where(and(eq(reviews.id, reviewId), eq(reviews.userId, userId)))
      .returning();

    return updated ?? null;
  }

  static async delete(reviewId: string, userId: string) {
    const [deleted] = await db
      .delete(reviews)
      .where(and(eq(reviews.id, reviewId), eq(reviews.userId, userId)))
      .returning({ id: reviews.id });

    return deleted ?? null;
  }

  // No ownership check — admin moderation only.
  static async deleteById(reviewId: string) {
    const [deleted] = await db
      .delete(reviews)
      .where(eq(reviews.id, reviewId))
      .returning({ id: reviews.id });

    return deleted ?? null;
  }

  // Movie reviews only — TV reviews live in the serials module's own table.
  static async listAllForAdmin(
    filters: { userId?: string; movieId?: number },
    limit: number,
    offset: number,
  ) {
    const conditions = [];
    if (filters.userId) conditions.push(eq(reviews.userId, filters.userId));
    if (filters.movieId) conditions.push(eq(reviews.movieId, filters.movieId));

    return db
      .select({
        id: reviews.id,
        userId: reviews.userId,
        authorUsername: user.username,
        mediaType: reviews.mediaType,
        movieId: reviews.movieId,
        movieTitle: movies.title,
        content: reviews.content,
        containsSpoilers: reviews.containsSpoilers,
        createdAt: reviews.createdAt,
      })
      .from(reviews)
      .innerJoin(user, eq(user.id, reviews.userId))
      .leftJoin(movies, eq(movies.id, reviews.movieId))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(reviews.createdAt))
      .limit(limit)
      .offset(offset);
  }
}
