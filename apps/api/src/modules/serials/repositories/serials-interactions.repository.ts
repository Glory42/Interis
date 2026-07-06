import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { db } from "../../../infrastructure/database/db";
import { user } from "../../../infrastructure/database/auth.entity";
import { profiles } from "../../users/users.entity";
import { reviews } from "../../reviews/reviews.entity";
import { serialDiaryEntries, serialInteractions, tvSeries } from "../serials.entity";

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

  static async getViewerLoggedTmdbIds(viewerUserId: string, tmdbIds: number[]) {
    const uniqueTmdbIds = [...new Set(tmdbIds)];
    if (uniqueTmdbIds.length === 0) {
      return [];
    }

    const [loggedRows, ratedRows] = await Promise.all([
      db
        .select({ tmdbId: tvSeries.tmdbId })
        .from(serialDiaryEntries)
        .innerJoin(tvSeries, eq(serialDiaryEntries.seriesId, tvSeries.id))
        .where(
          and(
            eq(serialDiaryEntries.userId, viewerUserId),
            inArray(tvSeries.tmdbId, uniqueTmdbIds),
          ),
        )
        .groupBy(tvSeries.tmdbId),
      db
        .select({ tmdbId: tvSeries.tmdbId })
        .from(serialInteractions)
        .innerJoin(tvSeries, eq(serialInteractions.seriesId, tvSeries.id))
        .where(
          and(
            eq(serialInteractions.userId, viewerUserId),
            inArray(tvSeries.tmdbId, uniqueTmdbIds),
            sql`${serialInteractions.rating} is not null`,
          ),
        )
        .groupBy(tvSeries.tmdbId),
    ]);

    return [...new Set([...loggedRows, ...ratedRows].map((row) => row.tmdbId))];
  }

  static async getViewerWatchlistedTmdbIds(viewerUserId: string, tmdbIds: number[]) {
    const uniqueTmdbIds = [...new Set(tmdbIds)];
    if (uniqueTmdbIds.length === 0) {
      return [];
    }

    const rows = await db
      .select({ tmdbId: tvSeries.tmdbId })
      .from(serialInteractions)
      .innerJoin(tvSeries, eq(serialInteractions.seriesId, tvSeries.id))
      .where(
        and(
          eq(serialInteractions.userId, viewerUserId),
          eq(serialInteractions.watchlisted, true),
          inArray(tvSeries.tmdbId, uniqueTmdbIds),
        ),
      )
      .groupBy(tvSeries.tmdbId);

    return rows.map((row) => row.tmdbId);
  }

  static async getInteractionRow(userId: string, seriesId: number) {
    const [row] = await db
      .select()
      .from(serialInteractions)
      .where(
        and(
          eq(serialInteractions.userId, userId),
          eq(serialInteractions.seriesId, seriesId),
        ),
      )
      .limit(1);

    return row ?? null;
  }

  static async upsertInteraction(input: {
    userId: string;
    seriesId: number;
    liked?: boolean;
    watchlisted?: boolean;
    isWatched?: boolean;
    rating?: number | null;
  }) {
    const [upserted] = await db
      .insert(serialInteractions)
      .values({
        userId: input.userId,
        seriesId: input.seriesId,
        liked: input.liked ?? false,
        watchlisted: input.watchlisted ?? false,
        isWatched: input.isWatched ?? false,
        rating: input.rating ?? null,
      })
      .onConflictDoUpdate({
        target: [serialInteractions.userId, serialInteractions.seriesId],
        set: {
          ...(input.liked !== undefined && { liked: input.liked }),
          ...(input.watchlisted !== undefined && { watchlisted: input.watchlisted }),
          ...(input.isWatched === true && { isWatched: true }),
          ...(input.rating !== undefined && { rating: input.rating }),
        },
      })
      .returning();

    return upserted ?? null;
  }

  static async setWatched(userId: string, seriesId: number): Promise<void> {
    await db
      .insert(serialInteractions)
      .values({ userId, seriesId, liked: false, watchlisted: false, isWatched: true })
      .onConflictDoUpdate({
        target: [serialInteractions.userId, serialInteractions.seriesId],
        set: { isWatched: true },
      });
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

  static async insertSerialDiaryEntry(input: {
    userId: string;
    seriesId: number;
    watchedDate: string;
    rating: number | null;
    rewatch: boolean;
  }): Promise<{ id: string } | null> {
    const [entry] = await db
      .insert(serialDiaryEntries)
      .values(input)
      .returning({ id: serialDiaryEntries.id });
    return entry ?? null;
  }

  static async setWatchlisted(userId: string, seriesId: number): Promise<void> {
    await db
      .insert(serialInteractions)
      .values({ userId, seriesId, liked: false, watchlisted: true })
      .onConflictDoUpdate({
        target: [serialInteractions.userId, serialInteractions.seriesId],
        set: { watchlisted: true },
      });
  }

  static async setRating(userId: string, seriesId: number, ratingOutOfTen: number): Promise<void> {
    await db
      .insert(serialInteractions)
      .values({ userId, seriesId, liked: false, watchlisted: false, rating: ratingOutOfTen })
      .onConflictDoUpdate({
        target: [serialInteractions.userId, serialInteractions.seriesId],
        set: { rating: ratingOutOfTen },
      });
  }

  static async hasRating(userId: string, seriesId: number): Promise<boolean> {
    const [row] = await db
      .select({ rating: serialInteractions.rating })
      .from(serialInteractions)
      .where(and(eq(serialInteractions.userId, userId), eq(serialInteractions.seriesId, seriesId)))
      .limit(1);
    return row?.rating !== null && row?.rating !== undefined;
  }

  static async findAllDiaryByUser(userId: string) {
    return db
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
      .orderBy(desc(serialDiaryEntries.watchedDate), desc(serialDiaryEntries.createdAt));
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

  static async getLogsBySeriesId(seriesId: number) {
    return db
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
      .orderBy(desc(serialDiaryEntries.createdAt));
  }
}
