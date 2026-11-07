import { and, desc, eq, inArray, isNotNull, sql } from "drizzle-orm";
import { db } from "../../../infrastructure/database/db";
import { user } from "../../../infrastructure/database/auth.entity";
import { profiles } from "../../users/users.entity";
import { reviews } from "../../reviews/reviews.entity";
import { mergeCommunityRatings } from "../../media/helpers/media-community-rating.helper";
import { applyOptionalPagination } from "../../../commons/helpers/db-pagination.helper";
import { MediaInteractions } from "../../media-interactions/media-interactions.repository";
import { seriesDiaryEntries, seriesInteractions, tvSeries } from "../tv.entity";

const seriesInteractionStore = MediaInteractions.forSeries();

export class TvInteractionsRepository {
  static async getViewerDiaryRows(viewerUserId: string, seriesId: number) {
    return db
      .select({
        id: seriesDiaryEntries.id,
        watchedDate: seriesDiaryEntries.watchedDate,
        rewatch: seriesDiaryEntries.rewatch,
        rating: seriesDiaryEntries.rating,
      })
      .from(seriesDiaryEntries)
      .where(
        and(
          eq(seriesDiaryEntries.userId, viewerUserId),
          eq(seriesDiaryEntries.seriesId, seriesId),
        ),
      )
      .orderBy(desc(seriesDiaryEntries.watchedDate), desc(seriesDiaryEntries.createdAt))
      .limit(1);
  }

  // See mergeCommunityRatings for the one-rating-per-user rule.
  static async getCommunityRatingsBySeriesId(seriesId: number): Promise<{ rating: number }[]> {
    const [diaryRatingRows, interactionRatingRows] = await Promise.all([
      db
        .select({ userId: seriesDiaryEntries.userId, rating: seriesDiaryEntries.rating })
        .from(seriesDiaryEntries)
        .where(
          and(eq(seriesDiaryEntries.seriesId, seriesId), isNotNull(seriesDiaryEntries.rating)),
        )
        .orderBy(desc(seriesDiaryEntries.watchedDate), desc(seriesDiaryEntries.createdAt)),
      db
        .select({ userId: seriesInteractions.userId, rating: seriesInteractions.rating })
        .from(seriesInteractions)
        .where(
          and(eq(seriesInteractions.seriesId, seriesId), isNotNull(seriesInteractions.rating)),
        ),
    ]);

    return mergeCommunityRatings(diaryRatingRows, interactionRatingRows);
  }

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

  static async getInteractionRow(userId: string, seriesId: number) {
    const [row] = await db
      .select({
        liked: seriesInteractions.liked,
        watchlisted: seriesInteractions.watchlisted,
        rating: seriesInteractions.rating,
        watchStatus: seriesInteractions.watchStatus,
      })
      .from(seriesInteractions)
      .where(and(eq(seriesInteractions.userId, userId), eq(seriesInteractions.seriesId, seriesId)))
      .limit(1);

    return row ?? null;
  }

  static async upsertInteraction(input: {
    userId: string;
    seriesId: number;
    liked?: boolean;
    watchlisted?: boolean;
    rating?: number | null;
    watched?: boolean;
  }) {
    return seriesInteractionStore.upsertState(input.userId, input.seriesId, {
      liked: input.liked,
      watchlisted: input.watchlisted,
      rating: input.rating,
      watched: input.watched,
    });
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

  static async insertDiaryEntry(input: {
    userId: string;
    seriesId: number;
    watchedDate: string;
    rating: number | null;
    rewatch: boolean;
  }) {
    const [entry] = await db
      .insert(seriesDiaryEntries)
      .values({
        userId: input.userId,
        seriesId: input.seriesId,
        watchedDate: input.watchedDate,
        rating: input.rating,
        rewatch: input.rewatch,
      })
      .returning();

    return entry ?? null;
  }

  static async existsByUserAndSeries(userId: string, seriesId: number): Promise<boolean> {
    const [row] = await db
      .select({ id: seriesDiaryEntries.id })
      .from(seriesDiaryEntries)
      .where(and(eq(seriesDiaryEntries.userId, userId), eq(seriesDiaryEntries.seriesId, seriesId)))
      .limit(1);
    return Boolean(row);
  }

  static async existsByUserSeriesAndDate(userId: string, seriesId: number, watchedDate: string): Promise<boolean> {
    const [row] = await db
      .select({ id: seriesDiaryEntries.id })
      .from(seriesDiaryEntries)
      .where(
        and(
          eq(seriesDiaryEntries.userId, userId),
          eq(seriesDiaryEntries.seriesId, seriesId),
          eq(seriesDiaryEntries.watchedDate, watchedDate),
        ),
      )
      .limit(1);
    return Boolean(row);
  }

  static async setWatchlisted(userId: string, seriesId: number): Promise<void> {
    await seriesInteractionStore.setWatchlisted(userId, seriesId);
  }

  static async setRating(userId: string, seriesId: number, ratingOutOfTen: number): Promise<void> {
    await seriesInteractionStore.setRating(userId, seriesId, ratingOutOfTen);
  }

  static async hasRating(userId: string, seriesId: number): Promise<boolean> {
    return seriesInteractionStore.hasRating(userId, seriesId);
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

  static async updateDiaryEntry(
    entryId: string,
    userId: string,
    input: { watchedDate?: string; rating?: number | null; rewatch?: boolean },
  ) {
    const [updated] = await db
      .update(seriesDiaryEntries)
      .set({
        ...(input.watchedDate !== undefined && { watchedDate: input.watchedDate }),
        ...(input.rating !== undefined && { rating: input.rating }),
        ...(input.rewatch !== undefined && { rewatch: input.rewatch }),
      })
      .where(and(eq(seriesDiaryEntries.id, entryId), eq(seriesDiaryEntries.userId, userId)))
      .returning();

    return updated ?? null;
  }

  // The log "Your rating" follows: the most recently watched one with a
  // rating, the later-created on a tie (#91).
  static async findLatestRatedLog(userId: string, seriesId: number) {
    const [row] = await db
      .select({ id: seriesDiaryEntries.id, rating: seriesDiaryEntries.rating })
      .from(seriesDiaryEntries)
      .where(
        and(
          eq(seriesDiaryEntries.userId, userId),
          eq(seriesDiaryEntries.seriesId, seriesId),
          isNotNull(seriesDiaryEntries.rating),
        ),
      )
      .orderBy(desc(seriesDiaryEntries.watchedDate), desc(seriesDiaryEntries.createdAt))
      .limit(1);
    return row ?? null;
  }

  static async deleteDiaryEntry(entryId: string, userId: string) {
    const [deleted] = await db
      .delete(seriesDiaryEntries)
      .where(and(eq(seriesDiaryEntries.id, entryId), eq(seriesDiaryEntries.userId, userId)))
      .returning({ id: seriesDiaryEntries.id, seriesId: seriesDiaryEntries.seriesId });

    return deleted ?? null;
  }

  static async hasLogOfSeries(userId: string, seriesId: number): Promise<boolean> {
    const [row] = await db
      .select({ id: seriesDiaryEntries.id })
      .from(seriesDiaryEntries)
      .where(and(eq(seriesDiaryEntries.userId, userId), eq(seriesDiaryEntries.seriesId, seriesId)))
      .limit(1);
    return Boolean(row);
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
