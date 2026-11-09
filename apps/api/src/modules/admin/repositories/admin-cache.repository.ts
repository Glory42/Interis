import { and, asc, count, inArray, sql, type SQL } from "drizzle-orm";
import { db } from "../../../infrastructure/database/db";
import type { AnyPgColumn } from "drizzle-orm/pg-core";
import { films } from "../../films/films.entity";
import { tvSeries, seriesDiaryEntries, seriesInteractions, seriesSeasonInteractions, seriesEpisodeInteractions } from "../../tv/tv.entity";
import { diaryEntries } from "../../diary/diary.entity";
import { filmInteractions } from "../../interactions/interactions.entity";
import { reviews } from "../../reviews/reviews.entity";
import { listEntries } from "../../lists/lists.entity";
import { posts } from "../../posts/posts.entity";
import { profileTopPicks } from "../../users/users.entity";
import { activities } from "../../social/social.entity";

export type CacheKind = "movie" | "serial";

// Conservative on purpose: anything that might point at a title keeps it.
// One `not exists` per condition — an `or` inside one blocks the hashed anti-join (52s vs 77ms).
const filmIsUnreferenced: SQL = sql`
  not exists (select 1 from ${diaryEntries} where ${diaryEntries.movieId} = ${films.id})
  and not exists (select 1 from ${filmInteractions} where ${filmInteractions.movieId} = ${films.id})
  and not exists (select 1 from ${reviews} where ${reviews.movieId} = ${films.id})
  and not exists (select 1 from ${reviews} where ${reviews.mediaType} = 'movie' and ${reviews.mediaSourceId} = ${films.tmdbId}::text)
  and not exists (select 1 from ${listEntries} where ${listEntries.movieId} = ${films.id})
  and not exists (select 1 from ${posts} where ${posts.mediaType} = 'movie' and ${posts.mediaId} in (${films.id}, ${films.tmdbId}))
  and not exists (select 1 from ${profileTopPicks} where ${profileTopPicks.mediaType} = 'movie' and ${profileTopPicks.mediaSourceId} = ${films.tmdbId}::text)
  and not exists (select 1 from ${activities} where
    ${activities.type} in ('liked_movie', 'watchlisted_movie') and ${activities.entityId} = ${films.id}::text)
  and not exists (select 1 from ${activities} where
    (case when ${activities.metadata} like '{%' then ${activities.metadata}::jsonb ->> 'movieId' end) = ${films.id}::text)`;

const seriesTmdbPrefix = (column: AnyPgColumn) => sql`split_part(${column}, ':', 1) = ${tvSeries.tmdbId}::text`;

const seriesIsUnreferenced: SQL = sql`
  not exists (select 1 from ${seriesDiaryEntries} where ${seriesDiaryEntries.seriesId} = ${tvSeries.id})
  and not exists (select 1 from ${seriesInteractions} where ${seriesInteractions.seriesId} = ${tvSeries.id})
  and not exists (select 1 from ${seriesSeasonInteractions} where ${seriesSeasonInteractions.seriesId} = ${tvSeries.id})
  and not exists (select 1 from ${seriesEpisodeInteractions} where ${seriesEpisodeInteractions.seriesId} = ${tvSeries.id})
  and not exists (select 1 from ${reviews} where ${reviews.mediaType} <> 'movie' and ${seriesTmdbPrefix(reviews.mediaSourceId)})
  and not exists (select 1 from ${listEntries} where ${listEntries.tvSeriesId} = ${tvSeries.id})
  and not exists (select 1 from ${posts} where ${posts.mediaType} = 'tv' and ${posts.mediaId} in (${tvSeries.id}, ${tvSeries.tmdbId}))
  and not exists (select 1 from ${profileTopPicks} where ${profileTopPicks.mediaType} <> 'movie' and ${seriesTmdbPrefix(profileTopPicks.mediaSourceId)})`;

const TABLES = {
  movie: { table: films, unreferenced: filmIsUnreferenced },
  serial: { table: tvSeries, unreferenced: seriesIsUnreferenced },
} as const;

export class AdminCacheRepository {
  static async countTitles(kind: CacheKind): Promise<{ total: number; unreferenced: number }> {
    const { table, unreferenced } = TABLES[kind];
    // The condition stays in a WHERE: inside count(*) filter it runs per row instead of as anti-joins.
    const [[totalRow], [unreferencedRow]] = await Promise.all([
      db.select({ value: count() }).from(table),
      db.select({ value: count() }).from(table).where(unreferenced),
    ]);
    return { total: totalRow?.value ?? 0, unreferenced: unreferencedRow?.value ?? 0 };
  }

  static async oldestIds(kind: CacheKind, limit: number): Promise<{ id: number; title: string }[]> {
    const { table } = TABLES[kind];
    return db.select({ id: table.id, title: table.title }).from(table).orderBy(asc(table.cachedAt), asc(table.id)).limit(limit);
  }

  // One bounded batch; the caller repeats until a batch comes back short. The delete re-checks
  // the condition so a title referenced since the select isn't cascaded away with its new row.
  static async deleteUnreferencedBatch(kind: CacheKind, batchSize: number): Promise<{ scanned: number; deleted: number }> {
    const { table, unreferenced } = TABLES[kind];
    const ids = (await db.select({ id: table.id }).from(table).where(unreferenced).limit(batchSize)).map((row) => row.id);
    if (ids.length === 0) return { scanned: 0, deleted: 0 };
    const deleted = await db.delete(table).where(and(inArray(table.id, ids), unreferenced)).returning({ id: table.id });
    return { scanned: ids.length, deleted: deleted.length };
  }
}
