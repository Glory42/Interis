import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { db } from "../../../infrastructure/database/db";
import { serialDiaryEntries, serialInteractions, tvSeries } from "../serials.entity";

export class SerialsInteractionsRepository {
  static async getViewerDiaryRows(viewerUserId: string, seriesId: number) {
    return db
      .select({
        id: serialDiaryEntries.id,
        watchedDate: serialDiaryEntries.watchedDate,
        rewatch: serialDiaryEntries.rewatch,
        ratingOutOfTen: serialDiaryEntries.rating,
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
    rating?: number | null;
  }) {
    const [upserted] = await db
      .insert(serialInteractions)
      .values({
        userId: input.userId,
        seriesId: input.seriesId,
        liked: input.liked ?? false,
        watchlisted: input.watchlisted ?? false,
        rating: input.rating ?? null,
      })
      .onConflictDoUpdate({
        target: [serialInteractions.userId, serialInteractions.seriesId],
        set: {
          ...(input.liked !== undefined && { liked: input.liked }),
          ...(input.watchlisted !== undefined && {
            watchlisted: input.watchlisted,
          }),
          ...(input.rating !== undefined && {
            rating: input.rating,
          }),
        },
      })
      .returning();

    return upserted ?? null;
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
}
