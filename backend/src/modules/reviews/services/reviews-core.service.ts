import { and, desc, eq, sql } from "drizzle-orm";
import { db } from "../../../infrastructure/database/db";
import { MoviesService } from "../../movies/movies.service";
import { activities } from "../../social/social.entity";
import { reviewLikes, reviews } from "../reviews.entity";
import { buildReviewCreatedActivityMetadata } from "../helpers/reviews-activity.helper";
import type { CreateReviewDto, UpdateReviewDto } from "../dto/reviews.dto";

export class ReviewsCoreService {
  static async create(userId: string, input: CreateReviewDto) {
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

    await db.insert(activities).values({
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
}
