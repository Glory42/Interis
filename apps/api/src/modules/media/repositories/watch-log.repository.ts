import { and, desc, eq, isNotNull, type SQL } from "drizzle-orm";
import type { AnyPgColumn, PgTable } from "drizzle-orm/pg-core";
import { db } from "../../../infrastructure/database/db";
import { user } from "../../../infrastructure/database/auth.entity";
import { diaryEntries } from "../../diary/diary.entity";
import { films } from "../../films/films.entity";
import { reviews } from "../../reviews/reviews.entity";
import { seriesDiaryEntries, tvSeries } from "../../tv/tv.entity";
import type {
  WatchLogAdminRow,
  WatchLogInsert,
  WatchLogPatch,
  WatchLogRow,
  WatchLogStore,
} from "../types/watch-log.types";

// The columns a Diary Entry table and its title table share. Film and
// Series logs differ only in which tables and FK columns back them.
export type WatchLogTableConfig = {
  table: PgTable;
  id: AnyPgColumn;
  userId: AnyPgColumn;
  mediaId: AnyPgColumn;
  mediaKey: "movieId" | "seriesId";
  watchedDate: AnyPgColumn;
  rating: AnyPgColumn;
  rewatch: AnyPgColumn;
  createdAt: AnyPgColumn;
  updatedAt: AnyPgColumn;
  titleTable: PgTable;
  titleId: AnyPgColumn;
  titleTmdbId: AnyPgColumn;
  titleName: AnyPgColumn;
  reviewLogColumn: AnyPgColumn;
};

export const FILM_LOG_TABLE: WatchLogTableConfig = {
  table: diaryEntries,
  id: diaryEntries.id,
  userId: diaryEntries.userId,
  mediaId: diaryEntries.movieId,
  mediaKey: "movieId",
  watchedDate: diaryEntries.watchedDate,
  rating: diaryEntries.rating,
  rewatch: diaryEntries.rewatch,
  createdAt: diaryEntries.createdAt,
  updatedAt: diaryEntries.updatedAt,
  titleTable: films,
  titleId: films.id,
  titleTmdbId: films.tmdbId,
  titleName: films.title,
  reviewLogColumn: reviews.diaryEntryId,
};

export const SERIES_LOG_TABLE: WatchLogTableConfig = {
  table: seriesDiaryEntries,
  id: seriesDiaryEntries.id,
  userId: seriesDiaryEntries.userId,
  mediaId: seriesDiaryEntries.seriesId,
  mediaKey: "seriesId",
  watchedDate: seriesDiaryEntries.watchedDate,
  rating: seriesDiaryEntries.rating,
  rewatch: seriesDiaryEntries.rewatch,
  createdAt: seriesDiaryEntries.createdAt,
  updatedAt: seriesDiaryEntries.updatedAt,
  titleTable: tvSeries,
  titleId: tvSeries.id,
  titleTmdbId: tvSeries.tmdbId,
  titleName: tvSeries.title,
  reviewLogColumn: reviews.serialDiaryEntryId,
};

function makeWatchLogStore(t: WatchLogTableConfig): WatchLogStore {
  const rowColumns = {
    id: t.id,
    userId: t.userId,
    mediaId: t.mediaId,
    watchedDate: t.watchedDate,
    rating: t.rating,
    rewatch: t.rewatch,
    createdAt: t.createdAt,
    updatedAt: t.updatedAt,
  };
  // Newest watch first, the later-created on a tie.
  const latestFirst = [desc(t.watchedDate), desc(t.createdAt)];
  const byId = (entryId: string, userId?: string): SQL =>
    userId === undefined ? eq(t.id, entryId) : and(eq(t.id, entryId), eq(t.userId, userId))!;
  const ofTitle = (userId: string, mediaId: number) =>
    and(eq(t.userId, userId), eq(t.mediaId, mediaId));

  return {
    async insert(input: WatchLogInsert) {
      const { mediaId, ...values } = input;
      const [row] = (await db
        .insert(t.table)
        .values({ ...values, [t.mediaKey]: mediaId })
        .returning(rowColumns)) as WatchLogRow[];
      return row ?? null;
    },

    async find(entryId, userId) {
      const [row] = (await db
        .select({ ...rowColumns, tmdbId: t.titleTmdbId })
        .from(t.table)
        .innerJoin(t.titleTable, eq(t.titleId, t.mediaId))
        .where(byId(entryId, userId))
        .limit(1)) as (WatchLogRow & { tmdbId: number })[];
      return row ?? null;
    },

    async update(entryId, userId, patch: WatchLogPatch) {
      const [row] = (await db
        .update(t.table)
        .set({ ...patch, updatedAt: new Date() })
        .where(byId(entryId, userId))
        .returning(rowColumns)) as WatchLogRow[];
      return row ?? null;
    },

    async remove(entryId, userId) {
      const [row] = (await db
        .delete(t.table)
        .where(byId(entryId, userId))
        .returning(rowColumns)) as WatchLogRow[];
      return row ?? null;
    },

    async findLatest(userId, mediaId) {
      const [row] = (await db
        .select(rowColumns)
        .from(t.table)
        .where(ofTitle(userId, mediaId))
        .orderBy(...latestFirst)
        .limit(1)) as WatchLogRow[];
      return row ?? null;
    },

    async findLatestRated(userId, mediaId) {
      const [row] = (await db
        .select({ id: t.id, rating: t.rating })
        .from(t.table)
        .where(and(ofTitle(userId, mediaId), isNotNull(t.rating)))
        .orderBy(...latestFirst)
        .limit(1)) as { id: string; rating: number }[];
      return row ?? null;
    },

    async hasLog(userId, mediaId, watchedDate) {
      const [row] = await db
        .select({ id: t.id })
        .from(t.table)
        .where(
          and(
            ofTitle(userId, mediaId),
            watchedDate === undefined ? undefined : eq(t.watchedDate, watchedDate),
          ),
        )
        .limit(1);
      return Boolean(row);
    },

    async findAttachedReview(entryId) {
      const [row] = await db
        .select({ id: reviews.id, content: reviews.content, containsSpoilers: reviews.containsSpoilers })
        .from(reviews)
        .where(eq(t.reviewLogColumn, entryId))
        .limit(1);
      return row ?? null;
    },

    async listForAdmin(filters, limit, offset) {
      const conditions = [
        filters.userId ? eq(t.userId, filters.userId) : undefined,
        filters.mediaId ? eq(t.mediaId, filters.mediaId) : undefined,
      ];
      return (await db
        .select({
          id: t.id,
          userId: t.userId,
          authorUsername: user.username,
          watchedDate: t.watchedDate,
          rating: t.rating,
          rewatch: t.rewatch,
          mediaId: t.mediaId,
          mediaTitle: t.titleName,
          createdAt: t.createdAt,
        })
        .from(t.table)
        .innerJoin(t.titleTable, eq(t.titleId, t.mediaId))
        .innerJoin(user, eq(user.id, t.userId))
        .where(and(...conditions))
        .orderBy(desc(t.createdAt))
        .limit(limit)
        .offset(offset)) as WatchLogAdminRow[];
    },
  };
}

export const WatchLogStores = {
  film: makeWatchLogStore(FILM_LOG_TABLE),
  series: makeWatchLogStore(SERIES_LOG_TABLE),
};
