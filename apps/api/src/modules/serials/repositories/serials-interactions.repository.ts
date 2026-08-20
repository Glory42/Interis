import { and, desc, eq, inArray, isNotNull, sql } from "drizzle-orm";
import { db } from "../../../infrastructure/database/db";
import { user } from "../../../infrastructure/database/auth.entity";
import { profiles } from "../../users/users.entity";
import { reviews } from "../../reviews/reviews.entity";
import { mergeCommunityRatings } from "../../media/helpers/media-community-rating.helper";
import { applyOptionalPagination } from "../../../commons/helpers/db-pagination.helper";
import { MediaInteractions } from "../../media-interactions/media-interactions.repository";
import { serialDiaryEntries, serialInteractions, tvSeries } from "../serials.entity";

const seriesInteractionStore = MediaInteractions.forSeries();

export class SerialsInteractionsRepository {
  static async getViewerDiaryRows(viewerUserId: string, seriesId: number) {
    return db
      .select({
        id: serialDiaryEntries.id,
        watchedDate: serialDiaryEntries.watchedDate,
        rewatch: serialDiaryEntries.rewatch,
        rating: serialDiaryEntries.rating,
      })
      .from(serialDiaryEntries)
      .where(
        and(
          eq(serialDiaryEntries.userId, viewerUserId),
          eq(serialDiaryEntries.seriesId, seriesId),
        ),
      )
      .orderBy(desc(serialDiaryEntries.watchedDate), desc(serialDiaryEntries.createdAt))
      .limit(1);
  }

  // See mergeCommunityRatings for the diary-vs-interaction precedence rule.
  static async getCommunityRatingsBySeriesId(seriesId: number): Promise<{ rating: number }[]> {
    const [diaryRatingRows, interactionRatingRows] = await Promise.all([
      db
        .select({ userId: serialDiaryEntries.userId, rating: serialDiaryEntries.rating })
        .from(serialDiaryEntries)
        .where(
          and(eq(serialDiaryEntries.seriesId, seriesId), isNotNull(serialDiaryEntries.rating)),
        ),
      db
        .select({ userId: serialInteractions.userId, rating: serialInteractions.rating })
        .from(serialInteractions)
        .where(
          and(eq(serialInteractions.seriesId, seriesId), isNotNull(serialInteractions.rating)),
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
      .from(serialDiaryEntries)
      .innerJoin(tvSeries, eq(serialDiaryEntries.seriesId, tvSeries.id))
      .where(
        and(
          eq(serialDiaryEntries.userId, viewerUserId),
          inArray(tvSeries.tmdbId, uniqueTmdbIds),
        ),
      )
      .groupBy(tvSeries.tmdbId);

    return rows.map((row) => row.tmdbId);
  }

  // Single batched read of everything the archive grid needs from
  // serialInteractions (watchlisted, explicitly-fully-watched, rated) for a
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
        watchlisted: serialInteractions.watchlisted,
        isWatched: serialInteractions.isWatched,
        rating: serialInteractions.rating,
      })
      .from(serialInteractions)
      .innerJoin(tvSeries, eq(serialInteractions.seriesId, tvSeries.id))
      .where(
        and(
          eq(serialInteractions.userId, viewerUserId),
          inArray(tvSeries.tmdbId, uniqueTmdbIds),
        ),
      );
  }

  static async getInteractionRow(userId: string, seriesId: number) {
    return seriesInteractionStore.find(userId, seriesId);
  }

  static async upsertInteraction(input: {
    userId: string;
    seriesId: number;
    liked?: boolean;
    watchlisted?: boolean;
    isWatched?: boolean;
    rating?: number | null;
  }) {
    return seriesInteractionStore.upsertState(input.userId, input.seriesId, {
      liked: input.liked,
      watchlisted: input.watchlisted,
      rating: input.rating,
      watched: input.isWatched,
    });
  }

  // Fully watched series, most recently marked watched first. isWatched is
  // a series-level flag that can be set independently of any per-episode
  // rows (see setWatched below), so this queries serialInteractions
  // directly rather than deriving completion from episode counts.
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
        lastInteractionAt: serialInteractions.updatedAt,
      })
      .from(serialInteractions)
      .innerJoin(tvSeries, eq(serialInteractions.seriesId, tvSeries.id))
      .where(and(eq(serialInteractions.userId, userId), eq(serialInteractions.isWatched, true)))
      .orderBy(desc(serialInteractions.updatedAt))
      .$dynamic();

    return applyOptionalPagination(baseQuery, limit, offset);
  }

  static async setWatched(userId: string, seriesId: number): Promise<void> {
    await seriesInteractionStore.markWatched(userId, seriesId);
  }

  static async insertDiaryEntry(input: {
    userId: string;
    seriesId: number;
    watchedDate: string;
    rating: number | null;
    rewatch: boolean;
  }) {
    const [entry] = await db
      .insert(serialDiaryEntries)
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
      .select({ id: serialDiaryEntries.id })
      .from(serialDiaryEntries)
      .where(and(eq(serialDiaryEntries.userId, userId), eq(serialDiaryEntries.seriesId, seriesId)))
      .limit(1);
    return Boolean(row);
  }

  static async existsByUserSeriesAndDate(userId: string, seriesId: number, watchedDate: string): Promise<boolean> {
    const [row] = await db
      .select({ id: serialDiaryEntries.id })
      .from(serialDiaryEntries)
      .where(
        and(
          eq(serialDiaryEntries.userId, userId),
          eq(serialDiaryEntries.seriesId, seriesId),
          eq(serialDiaryEntries.watchedDate, watchedDate),
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
        id: serialDiaryEntries.id,
        watchedDate: serialDiaryEntries.watchedDate,
        rating: serialDiaryEntries.rating,
        rewatch: serialDiaryEntries.rewatch,
        seriesId: serialDiaryEntries.seriesId,
        createdAt: serialDiaryEntries.createdAt,
        updatedAt: serialDiaryEntries.updatedAt,
        seriesTmdbId: tvSeries.tmdbId,
        seriesTitle: tvSeries.title,
        seriesPosterPath: tvSeries.posterPath,
        seriesFirstAirYear: tvSeries.firstAirYear,
        reviewId: reviews.id,
        reviewContent: reviews.content,
        reviewContainsSpoilers: reviews.containsSpoilers,
        reviewCreatedAt: reviews.createdAt,
      })
      .from(serialDiaryEntries)
      .innerJoin(tvSeries, eq(tvSeries.id, serialDiaryEntries.seriesId))
      .leftJoin(
        reviews,
        and(
          eq(reviews.userId, serialDiaryEntries.userId),
          eq(reviews.diaryEntryId, serialDiaryEntries.id),
          eq(reviews.mediaType, "tv"),
        ),
      )
      .where(eq(serialDiaryEntries.userId, userId))
      .orderBy(desc(serialDiaryEntries.watchedDate), desc(serialDiaryEntries.createdAt))
      .$dynamic();

    return applyOptionalPagination(query, limit, offset);
  }

  static async updateDiaryEntry(
    entryId: string,
    userId: string,
    input: { watchedDate?: string; rating?: number | null; rewatch?: boolean },
  ) {
    const [updated] = await db
      .update(serialDiaryEntries)
      .set({
        ...(input.watchedDate !== undefined && { watchedDate: input.watchedDate }),
        ...(input.rating !== undefined && { rating: input.rating }),
        ...(input.rewatch !== undefined && { rewatch: input.rewatch }),
      })
      .where(and(eq(serialDiaryEntries.id, entryId), eq(serialDiaryEntries.userId, userId)))
      .returning();

    return updated ?? null;
  }

  static async deleteDiaryEntry(entryId: string, userId: string) {
    const [deleted] = await db
      .delete(serialDiaryEntries)
      .where(and(eq(serialDiaryEntries.id, entryId), eq(serialDiaryEntries.userId, userId)))
      .returning({ id: serialDiaryEntries.id });

    return deleted ?? null;
  }

  static async getLogsBySeriesId(seriesId: number, limit?: number, offset?: number) {
    const query = db
      .select({
        diaryEntryId: serialDiaryEntries.id,
        watchedDate: serialDiaryEntries.watchedDate,
        rating: serialDiaryEntries.rating,
        rewatch: serialDiaryEntries.rewatch,
        createdAt: serialDiaryEntries.createdAt,
        username: user.username,
        userDisplayName: user.name,
        avatarUrl: profiles.avatarUrl,
        reviewContent: reviews.content,
        reviewContainsSpoilers: reviews.containsSpoilers,
        reviewUpdatedAt: reviews.updatedAt,
      })
      .from(serialDiaryEntries)
      .innerJoin(user, eq(user.id, serialDiaryEntries.userId))
      .innerJoin(profiles, eq(profiles.userId, serialDiaryEntries.userId))
      .leftJoin(
        reviews,
        and(
          eq(reviews.userId, serialDiaryEntries.userId),
          eq(reviews.diaryEntryId, serialDiaryEntries.id),
          eq(reviews.mediaType, "tv"),
        ),
      )
      .where(eq(serialDiaryEntries.seriesId, seriesId))
      .orderBy(desc(serialDiaryEntries.createdAt))
      .$dynamic();

    return applyOptionalPagination(query, limit, offset);
  }
}
