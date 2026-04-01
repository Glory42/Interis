import { and, desc, eq } from "drizzle-orm";
import { db } from "../../../infrastructure/database/db";
import { movies } from "../../movies/movies.entity";
import { reviews } from "../../reviews/reviews.entity";
import { activities } from "../../social/social.entity";
import { diaryEntries } from "../diary.entity";

export class DiaryRepository {
  static async insertEntry(input: {
    userId: string;
    movieId: number;
    watchedDate: string;
    rating: number | null;
    rewatch: boolean;
  }) {
    const [entry] = await db
      .insert(diaryEntries)
      .values({
        userId: input.userId,
        movieId: input.movieId,
        watchedDate: input.watchedDate,
        rating: input.rating,
        rewatch: input.rewatch,
      })
      .returning();

    return entry ?? null;
  }

  static async upsertReview(input: {
    userId: string;
    movieId: number;
    movieTmdbId: number;
    diaryEntryId: string;
    content: string;
    containsSpoilers: boolean;
  }) {
    const [review] = await db
      .insert(reviews)
      .values({
        userId: input.userId,
        mediaType: "movie",
        mediaSource: "tmdb",
        mediaSourceId: String(input.movieTmdbId),
        movieId: input.movieId,
        diaryEntryId: input.diaryEntryId,
        content: input.content,
        containsSpoilers: input.containsSpoilers,
      })
      .onConflictDoUpdate({
        target: [
          reviews.userId,
          reviews.mediaType,
          reviews.mediaSource,
          reviews.mediaSourceId,
        ],
        set: {
          diaryEntryId: input.diaryEntryId,
          movieId: input.movieId,
          content: input.content,
          containsSpoilers: input.containsSpoilers,
          updatedAt: new Date(),
        },
      })
      .returning({
        id: reviews.id,
        content: reviews.content,
        containsSpoilers: reviews.containsSpoilers,
      });

    return review ?? null;
  }

  static async insertActivity(input: {
    userId: string;
    type: "diary_entry" | "review";
    entityId: string;
    metadata: string;
  }) {
    await db.insert(activities).values({
      userId: input.userId,
      type: input.type,
      entityId: input.entityId,
      metadata: input.metadata,
    });
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
          eq(reviews.mediaType, "movie"),
        ),
      )
      .where(eq(diaryEntries.userId, userId))
      .orderBy(desc(diaryEntries.watchedDate), desc(diaryEntries.createdAt));
  }

  static async findOneByIdAndUser(entryId: string, userId: string) {
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
          eq(reviews.mediaType, "movie"),
        ),
      )
      .where(and(eq(diaryEntries.id, entryId), eq(diaryEntries.userId, userId)))
      .limit(1);

    return entry ?? null;
  }

  static async updateByIdAndUser(input: {
    entryId: string;
    userId: string;
    watchedDate?: string;
    rating?: number | null;
    rewatch?: boolean;
  }) {
    const [updated] = await db
      .update(diaryEntries)
      .set({
        ...(input.watchedDate !== undefined && { watchedDate: input.watchedDate }),
        ...(input.rating !== undefined && { rating: input.rating }),
        ...(input.rewatch !== undefined && { rewatch: input.rewatch }),
      })
      .where(and(eq(diaryEntries.id, input.entryId), eq(diaryEntries.userId, input.userId)))
      .returning();

    return updated ?? null;
  }

  static async deleteByIdAndUser(entryId: string, userId: string) {
    const [deleted] = await db
      .delete(diaryEntries)
      .where(and(eq(diaryEntries.id, entryId), eq(diaryEntries.userId, userId)))
      .returning({ id: diaryEntries.id });

    return deleted ?? null;
  }
}
