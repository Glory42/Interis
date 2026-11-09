import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { db } from "../../../infrastructure/database/db";
import { user } from "../../../infrastructure/database/auth.entity";
import { profiles } from "../../users/users.entity";
import { reviews } from "../../reviews/reviews.entity";
import { applyOptionalPagination } from "../../../commons/helpers/db-pagination.helper";
import { seriesDiaryEntries, seriesInteractions, tvSeries } from "../tv.entity";

export class TvInteractionsRepository {
  // Diary-entry half of "logged" - the other half (rated without a diary
  // entry) comes from getViewerSeriesInteractionStateByTmdbIds, which shares
  // one query with the watchlisted/fully-watched archive-grid lookups
  // instead of each re-querying serialInteractions separately.
  static async getViewerDiaryLoggedTmdbIds(viewerUserId: string, tmdbIds: number[]) {
    const uniqueTmdbIds = [...new Set(tmdbIds)];
    if (uniqueTmdbIds.length === 0) {
      return [];
    }

    const rows = await db
      .select({ tmdbId: tvSeries.tmdbId })
      .from(seriesDiaryEntries)
      .innerJoin(tvSeries, eq(seriesDiaryEntries.seriesId, tvSeries.id))
      .where(
        and(
          eq(seriesDiaryEntries.userId, viewerUserId),
          inArray(tvSeries.tmdbId, uniqueTmdbIds),
        ),
      )
      .groupBy(tvSeries.tmdbId);

    return rows.map((row) => row.tmdbId);
  }

  // Single batched read of everything the archive grid needs from
  // serialInteractions (watchlisted, watch status, rated) for a
  // page of tmdbIds, instead of one query per flag.
  static async getViewerSeriesInteractionStateByTmdbIds(
    viewerUserId: string,
    tmdbIds: number[],
  ) {
    const uniqueTmdbIds = [...new Set(tmdbIds)];
    if (uniqueTmdbIds.length === 0) {
      return [];
    }

    return db
      .select({
        tmdbId: tvSeries.tmdbId,
        watchlisted: seriesInteractions.watchlisted,
        watchStatus: seriesInteractions.watchStatus,
        rating: seriesInteractions.rating,
      })
      .from(seriesInteractions)
      .innerJoin(tvSeries, eq(seriesInteractions.seriesId, tvSeries.id))
      .where(
        and(
          eq(seriesInteractions.userId, viewerUserId),
          inArray(tvSeries.tmdbId, uniqueTmdbIds),
        ),
      );
  }

  // Completed series, most recently updated first. watch_status covers both
  // "marked watched" and "finished episode by episode".
  static async getWatchedSeriesForUser(userId: string, limit?: number, offset?: number) {
    const baseQuery = db
      .select({
        tmdbId: tvSeries.tmdbId,
        title: tvSeries.title,
        posterPath: tvSeries.posterPath,
        backdropPath: tvSeries.backdropPath,
        firstAirYear: tvSeries.firstAirYear,
        numberOfSeasons: tvSeries.numberOfSeasons,
        numberOfEpisodes: tvSeries.numberOfEpisodes,
        mediaType: sql<"tv">`'tv'`,
        lastInteractionAt: seriesInteractions.updatedAt,
      })
      .from(seriesInteractions)
      .innerJoin(tvSeries, eq(seriesInteractions.seriesId, tvSeries.id))
      .where(and(eq(seriesInteractions.userId, userId), eq(seriesInteractions.watchStatus, "completed")))
      .orderBy(desc(seriesInteractions.updatedAt))
      .$dynamic();

    return applyOptionalPagination(baseQuery, limit, offset);
  }

  static async findAllDiaryByUser(userId: string, limit?: number, offset?: number) {
    const query = db
      .select({
        id: seriesDiaryEntries.id,
        watchedDate: seriesDiaryEntries.watchedDate,
        rating: seriesDiaryEntries.rating,
        rewatch: seriesDiaryEntries.rewatch,
        seriesId: seriesDiaryEntries.seriesId,
        createdAt: seriesDiaryEntries.createdAt,
        updatedAt: seriesDiaryEntries.updatedAt,
        seriesTmdbId: tvSeries.tmdbId,
        seriesTitle: tvSeries.title,
        seriesPosterPath: tvSeries.posterPath,
        seriesFirstAirYear: tvSeries.firstAirYear,
        reviewId: reviews.id,
        reviewContent: reviews.content,
        reviewContainsSpoilers: reviews.containsSpoilers,
        reviewCreatedAt: reviews.createdAt,
      })
      .from(seriesDiaryEntries)
      .innerJoin(tvSeries, eq(tvSeries.id, seriesDiaryEntries.seriesId))
      .leftJoin(
        reviews,
        and(
          eq(reviews.userId, seriesDiaryEntries.userId),
          eq(reviews.serialDiaryEntryId, seriesDiaryEntries.id),
          eq(reviews.mediaType, "tv"),
        ),
      )
      .where(eq(seriesDiaryEntries.userId, userId))
      .orderBy(desc(seriesDiaryEntries.watchedDate), desc(seriesDiaryEntries.createdAt))
      .$dynamic();

    return applyOptionalPagination(query, limit, offset);
  }

  static async getLogsBySeriesId(seriesId: number, limit?: number, offset?: number) {
    const query = db
      .select({
        diaryEntryId: seriesDiaryEntries.id,
        watchedDate: seriesDiaryEntries.watchedDate,
        rating: seriesDiaryEntries.rating,
        rewatch: seriesDiaryEntries.rewatch,
        createdAt: seriesDiaryEntries.createdAt,
        username: user.username,
        userDisplayName: user.name,
        avatarUrl: profiles.avatarUrl,
        reviewContent: reviews.content,
        reviewContainsSpoilers: reviews.containsSpoilers,
        reviewUpdatedAt: reviews.updatedAt,
      })
      .from(seriesDiaryEntries)
      .innerJoin(user, eq(user.id, seriesDiaryEntries.userId))
      .innerJoin(profiles, eq(profiles.userId, seriesDiaryEntries.userId))
      .leftJoin(
        reviews,
        and(
          eq(reviews.userId, seriesDiaryEntries.userId),
          eq(reviews.serialDiaryEntryId, seriesDiaryEntries.id),
          eq(reviews.mediaType, "tv"),
        ),
      )
      .where(eq(seriesDiaryEntries.seriesId, seriesId))
      .orderBy(desc(seriesDiaryEntries.createdAt))
      .$dynamic();

    return applyOptionalPagination(query, limit, offset);
  }
}
