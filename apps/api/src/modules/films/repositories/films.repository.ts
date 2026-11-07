import { and, asc, desc, eq, gte, ilike, inArray, isNotNull, lte, sql } from "drizzle-orm";
import { db } from "../../../infrastructure/database/db";
import { applyOptionalPagination } from "../../../commons/helpers/db-pagination.helper";
import { user } from "../../../infrastructure/database/auth.entity";
import { diaryEntries } from "../../diary/diary.entity";
import { filmInteractions } from "../../interactions/interactions.entity";
import { profiles } from "../../users/users.entity";
import { reviews } from "../../reviews/reviews.entity";
import {
  buildCommunityRatingAggregateSql,
  mergeCommunityRatings,
} from "../../media/helpers/media-community-rating.helper";
import { films } from "../films.entity";
import type { CommunityRatingAggregateSource } from "../../media/helpers/media-community-rating.helper";

const FILM_COMMUNITY_RATING_SOURCE: CommunityRatingAggregateSource = {
  diaryTableName: "diary_entry",
  diaryEntityIdColumn: diaryEntries.movieId,
  diaryRatingColumn: diaryEntries.rating,
  diaryUserIdColumn: diaryEntries.userId,
  diaryWatchedDateColumn: diaryEntries.watchedDate,
  diaryCreatedAtColumn: diaryEntries.createdAt,
  interactionTableName: "movie_interaction",
  interactionEntityIdColumn: filmInteractions.movieId,
  interactionRatingColumn: filmInteractions.rating,
  interactionUserIdColumn: filmInteractions.userId,
};

export type AdminUpdateFilmFields = Partial<{
  title: string;
  originalTitle: string | null;
  overview: string | null;
  tagline: string | null;
  director: string | null;
  posterPath: string | null;
  backdropPath: string | null;
  releaseYear: number | null;
}>;

export class FilmsRepository {
  static async findByTmdbId(tmdbId: number) {
    const [existing] = await db
      .select()
      .from(films)
      .where(eq(films.tmdbId, tmdbId))
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
      .insert(films)
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
        target: films.tmdbId,
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

  // See mergeCommunityRatings for the one-rating-per-user rule.
  static async getCommunityRatingsByMovieId(movieId: number): Promise<{ rating: number }[]> {
    const [diaryRatingRows, interactionRatingRows] = await Promise.all([
      db
        .select({ userId: diaryEntries.userId, rating: diaryEntries.rating })
        .from(diaryEntries)
        .where(and(eq(diaryEntries.movieId, movieId), isNotNull(diaryEntries.rating)))
        .orderBy(desc(diaryEntries.watchedDate), desc(diaryEntries.createdAt)),
      db
        .select({ userId: filmInteractions.userId, rating: filmInteractions.rating })
        .from(filmInteractions)
        .where(and(eq(filmInteractions.movieId, movieId), isNotNull(filmInteractions.rating))),
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
      // A user can have several reviews of a title (#72); show the newest.
      .orderBy(desc(reviews.createdAt), desc(reviews.id))
      .limit(1);
  }

  static async getViewerLoggedTmdbIds(viewerUserId: string, tmdbIds: number[]) {
    const uniqueTmdbIds = [...new Set(tmdbIds)];
    if (uniqueTmdbIds.length === 0) {
      return [];
    }

    const [loggedRows, ratedRows] = await Promise.all([
      db
        .select({ tmdbId: films.tmdbId })
        .from(diaryEntries)
        .innerJoin(films, eq(diaryEntries.movieId, films.id))
        .where(
          and(
            eq(diaryEntries.userId, viewerUserId),
            inArray(films.tmdbId, uniqueTmdbIds),
          ),
        )
        .groupBy(films.tmdbId),
      db
        .select({ tmdbId: films.tmdbId })
        .from(filmInteractions)
        .innerJoin(films, eq(filmInteractions.movieId, films.id))
        .where(
          and(
            eq(filmInteractions.userId, viewerUserId),
            inArray(films.tmdbId, uniqueTmdbIds),
            sql`${filmInteractions.rating} is not null`,
          ),
        )
        .groupBy(films.tmdbId),
    ]);

    return [...new Set([...loggedRows, ...ratedRows].map((row) => row.tmdbId))];
  }

  static async getViewerWatchlistedTmdbIds(viewerUserId: string, tmdbIds: number[]) {
    const uniqueTmdbIds = [...new Set(tmdbIds)];
    if (uniqueTmdbIds.length === 0) {
      return [];
    }

    const rows = await db
      .select({ tmdbId: films.tmdbId })
      .from(filmInteractions)
      .innerJoin(films, eq(filmInteractions.movieId, films.id))
      .where(
        and(
          eq(filmInteractions.userId, viewerUserId),
          eq(filmInteractions.watchlisted, true),
          inArray(films.tmdbId, uniqueTmdbIds),
        ),
      )
      .groupBy(films.tmdbId);

    return rows.map((row) => row.tmdbId);
  }

  static async getLocalArchiveAggregateRowsByTmdbIds(tmdbIds: number[]) {
    const uniqueTmdbIds = [...new Set(tmdbIds)];
    if (uniqueTmdbIds.length === 0) {
      return [];
    }

    const communityRating = buildCommunityRatingAggregateSql(
      FILM_COMMUNITY_RATING_SOURCE,
      films.id,
    );

    return db
      .select({
        tmdbId: films.tmdbId,
        releaseDate: films.releaseDate,
        releaseYear: films.releaseYear,
        director: films.director,
        genres: films.genres,
        logCount: sql<number>`count(${diaryEntries.id})::int`.as("logCount"),
        avgRatingOutOfTen: communityRating.avgRatingOutOfTen.as("avgRatingOutOfTen"),
        ratedLogCount: communityRating.ratedLogCount.as("ratedLogCount"),
      })
      .from(films)
      .leftJoin(diaryEntries, eq(diaryEntries.movieId, films.id))
      .where(inArray(films.tmdbId, uniqueTmdbIds))
      .groupBy(films.id);
  }

  static async getLocalArchiveRows(dateRange?: { watchedDateGte: string; watchedDateLte: string }) {
    const communityRating = buildCommunityRatingAggregateSql(
      FILM_COMMUNITY_RATING_SOURCE,
      films.id,
    );

    return db
      .select({
        tmdbId: films.tmdbId,
        title: films.title,
        posterPath: films.posterPath,
        backdropPath: films.backdropPath,
        releaseDate: films.releaseDate,
        releaseYear: films.releaseYear,
        director: films.director,
        genres: films.genres,
        logCount: sql<number>`count(${diaryEntries.id})::int`.as("logCount"),
        avgRatingOutOfTen: communityRating.avgRatingOutOfTen.as("avgRatingOutOfTen"),
        ratedLogCount: communityRating.ratedLogCount.as("ratedLogCount"),
      })
      .from(films)
      .leftJoin(diaryEntries, eq(diaryEntries.movieId, films.id))
      .where(
        dateRange
          ? and(
              gte(diaryEntries.watchedDate, dateRange.watchedDateGte),
              lte(diaryEntries.watchedDate, dateRange.watchedDateLte),
            )
          : undefined,
      )
      .groupBy(films.id)
      .orderBy(asc(films.title));
  }

  static async updateDirectorByTmdbId(tmdbId: number, director: string) {
    await db
      .update(films)
      .set({ director })
      .where(eq(films.tmdbId, tmdbId));
  }

  static async findById(id: number) {
    const [existing] = await db.select().from(films).where(eq(films.id, id)).limit(1);
    return existing ?? null;
  }

  static async listAllForAdmin(query: string | undefined, limit: number, offset: number) {
    return db
      .select({
        id: films.id,
        tmdbId: films.tmdbId,
        title: films.title,
        originalTitle: films.originalTitle,
        posterPath: films.posterPath,
        releaseYear: films.releaseYear,
        director: films.director,
        cachedAt: films.cachedAt,
      })
      .from(films)
      .where(query ? ilike(films.title, `%${query}%`) : undefined)
      .orderBy(desc(films.cachedAt))
      .limit(limit)
      .offset(offset);
  }

  static async updateById(id: number, fields: AdminUpdateFilmFields) {
    const [updated] = await db.update(films).set(fields).where(eq(films.id, id)).returning();
    return updated ?? null;
  }

  // Cascades to every diary entry/review/interaction/list entry across all
  // users that references this movie — admin moderation only.
  static async deleteById(id: number) {
    const [deleted] = await db.delete(films).where(eq(films.id, id)).returning({ id: films.id });
    return deleted ?? null;
  }

  static async getLogsByMovieId(movieId: number, limit?: number, offset?: number) {
    const query = db
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
        // A log's review is the one written with it, not any review of the
        // same movie (#73).
        and(eq(reviews.diaryEntryId, diaryEntries.id), eq(reviews.mediaType, "movie")),
      )
      .where(eq(diaryEntries.movieId, movieId))
      .orderBy(desc(diaryEntries.createdAt))
      .$dynamic();

    return applyOptionalPagination(query, limit, offset);
  }

  // Director of already-cached films, for search results; uncached ids are absent.
  static async findDirectorsByTmdbIds(tmdbIds: number[]) {
    if (tmdbIds.length === 0) return [];
    return db
      .select({ tmdbId: films.tmdbId, director: films.director })
      .from(films)
      .where(and(inArray(films.tmdbId, tmdbIds), isNotNull(films.director)));
  }
}
