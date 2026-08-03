import { and, desc, eq } from "drizzle-orm";
import { db } from "../../../infrastructure/database/db";
import { user } from "../../../infrastructure/database/auth.entity";
import { movies } from "../../movies/movies.entity";
import { reviews } from "../../reviews/reviews.entity";
import { SocialRepository } from "../../social/repositories/social.repository";
import { applyOptionalPagination } from "../../../commons/helpers/db-pagination.helper";
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
    await SocialRepository.insertActivity(input);
  }

  static async findAllByUser(userId: string, limit?: number, offset?: number) {
    const query = db
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
      .orderBy(desc(diaryEntries.watchedDate), desc(diaryEntries.createdAt))
      .$dynamic();

    return applyOptionalPagination(query, limit, offset);
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

  static async existsByUserAndMovie(userId: string, movieId: number): Promise<boolean> {
    const [entry] = await db
      .select({ id: diaryEntries.id })
      .from(diaryEntries)
      .where(and(eq(diaryEntries.userId, userId), eq(diaryEntries.movieId, movieId)))
      .limit(1);
    return Boolean(entry);
  }

  static async existsByUserMovieAndDate(
    userId: string,
    movieId: number,
    watchedDate: string,
  ): Promise<boolean> {
    const [entry] = await db
      .select({ id: diaryEntries.id })
      .from(diaryEntries)
      .where(
        and(
          eq(diaryEntries.userId, userId),
          eq(diaryEntries.movieId, movieId),
          eq(diaryEntries.watchedDate, watchedDate),
        ),
      )
      .limit(1);
    return Boolean(entry);
  }

  static async deleteByIdAndUser(entryId: string, userId: string) {
    const [deleted] = await db
      .delete(diaryEntries)
      .where(and(eq(diaryEntries.id, entryId), eq(diaryEntries.userId, userId)))
      .returning({ id: diaryEntries.id });

    return deleted ?? null;
  }

  // No ownership check — admin moderation only.
  static async deleteById(entryId: string) {
    const [deleted] = await db
      .delete(diaryEntries)
      .where(eq(diaryEntries.id, entryId))
      .returning({ id: diaryEntries.id });

    return deleted ?? null;
  }

  static async listAllForAdmin(
    filters: { userId?: string; movieId?: number },
    limit: number,
    offset: number,
  ) {
    const conditions = [];
    if (filters.userId) conditions.push(eq(diaryEntries.userId, filters.userId));
    if (filters.movieId) conditions.push(eq(diaryEntries.movieId, filters.movieId));

    return db
      .select({
        id: diaryEntries.id,
        userId: diaryEntries.userId,
        authorUsername: user.username,
        watchedDate: diaryEntries.watchedDate,
        rating: diaryEntries.rating,
        rewatch: diaryEntries.rewatch,
        movieId: diaryEntries.movieId,
        movieTitle: movies.title,
        createdAt: diaryEntries.createdAt,
      })
      .from(diaryEntries)
      .innerJoin(movies, eq(movies.id, diaryEntries.movieId))
      .innerJoin(user, eq(user.id, diaryEntries.userId))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(diaryEntries.createdAt))
      .limit(limit)
      .offset(offset);
  }
}
