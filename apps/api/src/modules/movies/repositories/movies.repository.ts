import { and, asc, desc, eq, gte, inArray, isNotNull, lte, sql } from "drizzle-orm";
import { db } from "../../../infrastructure/database/db";
import { user } from "../../../infrastructure/database/auth.entity";
import { diaryEntries } from "../../diary/diary.entity";
import { movieInteractions } from "../../interactions/interactions.entity";
import { profiles } from "../../users/users.entity";
import { reviews } from "../../reviews/reviews.entity";
import { mergeCommunityRatings } from "../../media/helpers/media-community-rating.helper";
import { movies } from "../movies.entity";

export class MoviesRepository {
  static async findByTmdbId(tmdbId: number) {
    const [existing] = await db
      .select()
      .from(movies)
      .where(eq(movies.tmdbId, tmdbId))
      .limit(1);

    return existing ?? null;
  }

  static async upsertCachedMovie(input: {
    tmdbId: number;
    title: string;
    originalTitle: string | null;
    posterPath: string | null;
    backdropPath: string | null;
    releaseDate: string | null;
    releaseYear: number | null;
    director: string | null;
    runtime: number | null;
    overview: string | null;
    tagline: string | null;
    genres: { id: number; name: string }[];
  }) {
    const [inserted] = await db
      .insert(movies)
      .values({
        tmdbId: input.tmdbId,
        title: input.title,
        originalTitle: input.originalTitle,
        posterPath: input.posterPath,
        backdropPath: input.backdropPath,
        releaseDate: input.releaseDate,
        releaseYear: input.releaseYear,
        director: input.director,
        runtime: input.runtime,
        overview: input.overview,
        tagline: input.tagline,
        genres: input.genres,
      })
      .onConflictDoUpdate({
        target: movies.tmdbId,
        set: {
          title: input.title,
          originalTitle: input.originalTitle,
          posterPath: input.posterPath,
          backdropPath: input.backdropPath,
          releaseDate: input.releaseDate,
          releaseYear: input.releaseYear,
          ...(input.director ? { director: input.director } : {}),
          runtime: input.runtime,
          overview: input.overview,
          tagline: input.tagline,
          genres: input.genres,
          cachedAt: new Date(),
        },
      })
      .returning();

    return inserted ?? null;
  }

  static async getLogsCountByMovieId(movieId: number): Promise<number> {
    const [row] = await db
      .select({ count: sql<number>`count(*)::int`.as("count") })
      .from(diaryEntries)
      .where(eq(diaryEntries.movieId, movieId))
      .limit(1);

    return row?.count ?? 0;
  }

  // See mergeCommunityRatings for the diary-vs-interaction precedence rule.
  static async getCommunityRatingsByMovieId(movieId: number): Promise<{ rating: number }[]> {
    const [diaryRatingRows, interactionRatingRows] = await Promise.all([
      db
        .select({ userId: diaryEntries.userId, rating: diaryEntries.rating })
        .from(diaryEntries)
        .where(and(eq(diaryEntries.movieId, movieId), isNotNull(diaryEntries.rating))),
      db
        .select({ userId: movieInteractions.userId, rating: movieInteractions.rating })
        .from(movieInteractions)
        .where(and(eq(movieInteractions.movieId, movieId), isNotNull(movieInteractions.rating))),
    ]);

    return mergeCommunityRatings(diaryRatingRows, interactionRatingRows);
  }

  static async getViewerDiaryRows(viewerUserId: string, movieId: number) {
    return db
      .select({
        id: diaryEntries.id,
        watchedDate: diaryEntries.watchedDate,
        rewatch: diaryEntries.rewatch,
        rating: diaryEntries.rating,
      })
      .from(diaryEntries)
      .where(
        and(
          eq(diaryEntries.userId, viewerUserId),
          eq(diaryEntries.movieId, movieId),
        ),
      )
      .orderBy(desc(diaryEntries.watchedDate), desc(diaryEntries.createdAt))
      .limit(1);
  }

  static async getViewerReviewRows(viewerUserId: string, movieId: number) {
    return db
      .select({
        id: reviews.id,
        content: reviews.content,
        containsSpoilers: reviews.containsSpoilers,
      })
      .from(reviews)
      .where(
        and(
          eq(reviews.userId, viewerUserId),
          eq(reviews.movieId, movieId),
          eq(reviews.mediaType, "movie"),
        ),
      )
      .limit(1);
  }

  static async getViewerLoggedTmdbIds(viewerUserId: string, tmdbIds: number[]) {
    const uniqueTmdbIds = [...new Set(tmdbIds)];
    if (uniqueTmdbIds.length === 0) {
      return [];
    }

    const [loggedRows, ratedRows] = await Promise.all([
      db
        .select({ tmdbId: movies.tmdbId })
        .from(diaryEntries)
        .innerJoin(movies, eq(diaryEntries.movieId, movies.id))
        .where(
          and(
            eq(diaryEntries.userId, viewerUserId),
            inArray(movies.tmdbId, uniqueTmdbIds),
          ),
        )
        .groupBy(movies.tmdbId),
      db
        .select({ tmdbId: movies.tmdbId })
        .from(movieInteractions)
        .innerJoin(movies, eq(movieInteractions.movieId, movies.id))
        .where(
          and(
            eq(movieInteractions.userId, viewerUserId),
            inArray(movies.tmdbId, uniqueTmdbIds),
            sql`${movieInteractions.rating} is not null`,
          ),
        )
        .groupBy(movies.tmdbId),
    ]);

    return [...new Set([...loggedRows, ...ratedRows].map((row) => row.tmdbId))];
  }

  static async getViewerWatchlistedTmdbIds(viewerUserId: string, tmdbIds: number[]) {
    const uniqueTmdbIds = [...new Set(tmdbIds)];
    if (uniqueTmdbIds.length === 0) {
      return [];
    }

    const rows = await db
      .select({ tmdbId: movies.tmdbId })
      .from(movieInteractions)
      .innerJoin(movies, eq(movieInteractions.movieId, movies.id))
      .where(
        and(
          eq(movieInteractions.userId, viewerUserId),
          eq(movieInteractions.watchlisted, true),
          inArray(movies.tmdbId, uniqueTmdbIds),
        ),
      )
      .groupBy(movies.tmdbId);

    return rows.map((row) => row.tmdbId);
  }

  static async getLocalArchiveAggregateRowsByTmdbIds(tmdbIds: number[]) {
    const uniqueTmdbIds = [...new Set(tmdbIds)];
    if (uniqueTmdbIds.length === 0) {
      return [];
    }

    return db
      .select({
        tmdbId: movies.tmdbId,
        releaseDate: movies.releaseDate,
        releaseYear: movies.releaseYear,
        director: movies.director,
        genres: movies.genres,
        logCount: sql<number>`count(${diaryEntries.id})::int`.as("logCount"),
        avgRatingOutOfTen:
          sql<number | null>`avg(${diaryEntries.rating})::double precision`.as(
            "avgRatingOutOfTen",
          ),
        ratedLogCount:
          sql<number>`count(${diaryEntries.rating})::int`.as("ratedLogCount"),
      })
      .from(movies)
      .leftJoin(diaryEntries, eq(diaryEntries.movieId, movies.id))
      .where(inArray(movies.tmdbId, uniqueTmdbIds))
      .groupBy(movies.id);
  }

  static async getLocalArchiveRows(dateRange?: { watchedDateGte: string; watchedDateLte: string }) {
    return db
      .select({
        tmdbId: movies.tmdbId,
        title: movies.title,
        posterPath: movies.posterPath,
        backdropPath: movies.backdropPath,
        releaseDate: movies.releaseDate,
        releaseYear: movies.releaseYear,
        director: movies.director,
        genres: movies.genres,
        logCount: sql<number>`count(${diaryEntries.id})::int`.as("logCount"),
        avgRatingOutOfTen:
          sql<number | null>`avg(${diaryEntries.rating})::double precision`.as(
            "avgRatingOutOfTen",
          ),
        ratedLogCount:
          sql<number>`count(${diaryEntries.rating})::int`.as("ratedLogCount"),
      })
      .from(movies)
      .leftJoin(diaryEntries, eq(diaryEntries.movieId, movies.id))
      .where(
        dateRange
          ? and(
              gte(diaryEntries.watchedDate, dateRange.watchedDateGte),
              lte(diaryEntries.watchedDate, dateRange.watchedDateLte),
            )
          : undefined,
      )
      .groupBy(movies.id)
      .orderBy(asc(movies.title));
  }

  static async updateDirectorByTmdbId(tmdbId: number, director: string) {
    await db
      .update(movies)
      .set({ director })
      .where(eq(movies.tmdbId, tmdbId));
  }

  static async getLogsByMovieId(movieId: number) {
    return db
      .select({
        diaryEntryId: diaryEntries.id,
        watchedDate: diaryEntries.watchedDate,
        rating: diaryEntries.rating,
        rewatch: diaryEntries.rewatch,
        createdAt: diaryEntries.createdAt,
        username: user.username,
        userDisplayName: user.name,
        avatarUrl: profiles.avatarUrl,
        reviewContent: reviews.content,
        reviewContainsSpoilers: reviews.containsSpoilers,
        reviewUpdatedAt: reviews.updatedAt,
      })
      .from(diaryEntries)
      .innerJoin(profiles, eq(profiles.userId, diaryEntries.userId))
      .innerJoin(user, eq(user.id, diaryEntries.userId))
      .leftJoin(
        reviews,
        and(
          eq(reviews.userId, diaryEntries.userId),
          eq(reviews.movieId, diaryEntries.movieId),
          eq(reviews.mediaType, "movie"),
        ),
      )
      .where(eq(diaryEntries.movieId, movieId))
      .orderBy(desc(diaryEntries.createdAt));
  }
}
