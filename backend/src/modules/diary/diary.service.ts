import { and, desc, eq } from "drizzle-orm";
import { db } from "../../infrastructure/database/db";
import { diaryEntries } from "./diary.entity";
import { activities } from "../social/social.entity";
import { MoviesService } from "../movies/movies.service";
import { reviews } from "../reviews/reviews.entity";
import { movies } from "../movies/movies.entity";
import type { CreateDiaryDto, UpdateDiaryDto } from "./dto/diary.dto";

export class DiaryService {
  static async create(userId: string, input: CreateDiaryDto) {
    const movie = await MoviesService.findOrCreate(input.tmdbId);
    if (!movie || !movie.id) {
      throw new Error("Movie not found");
    }

    const [entry] = await db
      .insert(diaryEntries)
      .values({
        userId,
        movieId: movie.id,
        watchedDate: input.watchedDate,
        rating: input.rating ?? null,
        rewatch: input.rewatch ?? false,
      })
      .returning();

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
      const [reviewResult] = await db
        .insert(reviews)
        .values({
          userId,
          movieId: movie.id,
          diaryEntryId: entry.id,
          content: reviewContent,
          containsSpoilers: input.containsSpoilers ?? false,
        })
        .onConflictDoUpdate({
          target: [reviews.userId, reviews.movieId],
          set: {
            diaryEntryId: entry.id,
            content: reviewContent,
            containsSpoilers: input.containsSpoilers ?? false,
            updatedAt: new Date(),
          },
        })
        .returning({
          id: reviews.id,
          content: reviews.content,
          containsSpoilers: reviews.containsSpoilers,
        });

      review = reviewResult ?? null;
    }

    await db.insert(activities).values({
      userId,
      type: "diary_entry",
      entityId: entry.id,
      metadata: JSON.stringify({
        movieId: movie.id,
        tmdbId: movie.tmdbId,
        title: movie.title,
        posterPath: movie.posterPath,
        releaseYear: movie.releaseYear,
        rating: input.rating ?? null,
        rewatch: input.rewatch ?? false,
        hasReview: Boolean(review),
      }),
    });

    if (review) {
      await db.insert(activities).values({
        userId,
        type: "review",
        entityId: review.id,
        metadata: JSON.stringify({
          reviewId: review.id,
          movieId: movie.id,
          tmdbId: movie.tmdbId,
          title: movie.title,
          posterPath: movie.posterPath,
          releaseYear: movie.releaseYear,
          rating: input.rating ?? null,
          containsSpoilers: review.containsSpoilers,
          excerpt: review.content.slice(0, 120),
        }),
      });
    }

    return { entry, movie, review };
  }

  static async findAllByUser(userId: string) {
    return db
      .select({
        id: diaryEntries.id,
        watchedDate: diaryEntries.watchedDate,
        rating: diaryEntries.rating,
        rewatch: diaryEntries.rewatch,
        movieId: diaryEntries.movieId,
        createdAt: diaryEntries.createdAt,
        updatedAt: diaryEntries.updatedAt,
        movieTmdbId: movies.tmdbId,
        movieTitle: movies.title,
        moviePosterPath: movies.posterPath,
        movieReleaseYear: movies.releaseYear,
        reviewId: reviews.id,
        reviewContent: reviews.content,
        reviewContainsSpoilers: reviews.containsSpoilers,
        reviewCreatedAt: reviews.createdAt,
      })
      .from(diaryEntries)
      .innerJoin(movies, eq(movies.id, diaryEntries.movieId))
      .leftJoin(
        reviews,
        and(
          eq(reviews.userId, diaryEntries.userId),
          eq(reviews.movieId, diaryEntries.movieId),
        ),
      )
      .where(eq(diaryEntries.userId, userId))
      .orderBy(desc(diaryEntries.watchedDate), desc(diaryEntries.createdAt));
  }

  static async findOne(entryId: string, userId: string) {
    const [entry] = await db
      .select({
        id: diaryEntries.id,
        watchedDate: diaryEntries.watchedDate,
        rating: diaryEntries.rating,
        rewatch: diaryEntries.rewatch,
        movieId: diaryEntries.movieId,
        createdAt: diaryEntries.createdAt,
        updatedAt: diaryEntries.updatedAt,
        movieTmdbId: movies.tmdbId,
        movieTitle: movies.title,
        moviePosterPath: movies.posterPath,
        movieReleaseYear: movies.releaseYear,
        reviewId: reviews.id,
        reviewContent: reviews.content,
        reviewContainsSpoilers: reviews.containsSpoilers,
        reviewCreatedAt: reviews.createdAt,
      })
      .from(diaryEntries)
      .innerJoin(movies, eq(movies.id, diaryEntries.movieId))
      .leftJoin(
        reviews,
        and(
          eq(reviews.userId, diaryEntries.userId),
          eq(reviews.movieId, diaryEntries.movieId),
        ),
      )
      .where(and(eq(diaryEntries.id, entryId), eq(diaryEntries.userId, userId)))
      .limit(1);

    return entry ?? null;
  }

  static async update(
    entryId: string,
    userId: string,
    input: UpdateDiaryDto,
  ) {
    const [updated] = await db
      .update(diaryEntries)
      .set({
        ...(input.watchedDate && { watchedDate: input.watchedDate }),
        ...(input.rating !== undefined && { rating: input.rating ?? null }),
        ...(input.rewatch !== undefined && { rewatch: input.rewatch }),
      })
      .where(and(eq(diaryEntries.id, entryId), eq(diaryEntries.userId, userId)))
      .returning();

    return updated ?? null;
  }

  static async delete(entryId: string, userId: string) {
    const [deleted] = await db
      .delete(diaryEntries)
      .where(and(eq(diaryEntries.id, entryId), eq(diaryEntries.userId, userId)))
      .returning({ id: diaryEntries.id });

    return deleted ?? null;
  }
}
