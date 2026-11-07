import { and, desc, eq, isNotNull, sql } from "drizzle-orm";
import { db } from "../../../infrastructure/database/db";
import { user } from "../../../infrastructure/database/auth.entity";
import { filmInteractions } from "../../interactions/interactions.entity";
import { films } from "../../films/films.entity";
import { reviews } from "../../reviews/reviews.entity";
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
        movieTmdbId: films.tmdbId,
        movieTitle: films.title,
        moviePosterPath: films.posterPath,
        movieReleaseYear: films.releaseYear,
        reviewId: reviews.id,
        reviewContent: reviews.content,
        reviewContainsSpoilers: reviews.containsSpoilers,
        reviewCreatedAt: reviews.createdAt,
        liked: sql<boolean>`coalesce(${filmInteractions.liked}, false)`,
      })
      .from(diaryEntries)
      .innerJoin(films, eq(films.id, diaryEntries.movieId))
      .leftJoin(
        reviews,
        // A log's review is the one written with it, not any review of the
        // same movie (#73).
        and(eq(reviews.diaryEntryId, diaryEntries.id), eq(reviews.mediaType, "movie")),
      )
      .leftJoin(
        filmInteractions,
        and(
          eq(filmInteractions.userId, diaryEntries.userId),
          eq(filmInteractions.movieId, diaryEntries.movieId),
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
        movieTmdbId: films.tmdbId,
        movieTitle: films.title,
        moviePosterPath: films.posterPath,
        movieReleaseYear: films.releaseYear,
        reviewId: reviews.id,
        reviewContent: reviews.content,
        reviewContainsSpoilers: reviews.containsSpoilers,
        reviewCreatedAt: reviews.createdAt,
      })
      .from(diaryEntries)
      .innerJoin(films, eq(films.id, diaryEntries.movieId))
      .leftJoin(
        reviews,
        // A log's review is the one written with it, not any review of the
        // same movie (#73).
        and(eq(reviews.diaryEntryId, diaryEntries.id), eq(reviews.mediaType, "movie")),
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

  // The log "Your rating" follows: the most recently watched one with a
  // rating, the later-created on a tie (#91).
  static async findLatestRatedLog(userId: string, movieId: number) {
    const [row] = await db
      .select({ id: diaryEntries.id, rating: diaryEntries.rating })
      .from(diaryEntries)
      .where(
        and(
          eq(diaryEntries.userId, userId),
          eq(diaryEntries.movieId, movieId),
          isNotNull(diaryEntries.rating),
        ),
      )
      .orderBy(desc(diaryEntries.watchedDate), desc(diaryEntries.createdAt))
      .limit(1);
    return row ?? null;
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
      .returning({
        id: diaryEntries.id,
        userId: diaryEntries.userId,
        movieId: diaryEntries.movieId,
      });

    return deleted ?? null;
  }

  static async hasLogOfMovie(userId: string, movieId: number): Promise<boolean> {
    const [row] = await db
      .select({ id: diaryEntries.id })
      .from(diaryEntries)
      .where(and(eq(diaryEntries.userId, userId), eq(diaryEntries.movieId, movieId)))
      .limit(1);
    return Boolean(row);
  }

  // No ownership check — admin moderation only.
  static async deleteById(entryId: string) {
    const [deleted] = await db
      .delete(diaryEntries)
      .where(eq(diaryEntries.id, entryId))
      .returning({ id: diaryEntries.id, userId: diaryEntries.userId });

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
        movieTitle: films.title,
        createdAt: diaryEntries.createdAt,
      })
      .from(diaryEntries)
      .innerJoin(films, eq(films.id, diaryEntries.movieId))
      .innerJoin(user, eq(user.id, diaryEntries.userId))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(diaryEntries.createdAt))
      .limit(limit)
      .offset(offset);
  }
}
