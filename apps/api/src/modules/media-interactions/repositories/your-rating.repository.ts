import { sql, type SQL } from "drizzle-orm";
import type { AnyPgColumn, PgTable } from "drizzle-orm/pg-core";
import { db } from "../../../infrastructure/database/db";
import { filmInteractions } from "../../interactions/interactions.entity";
import { seriesInteractions } from "../../tv/tv.entity";
import {
  FILM_LOG_TABLE,
  SERIES_LOG_TABLE,
  type WatchLogTableConfig,
} from "../../media/repositories/watch-log.repository";
import type { MediaType } from "../../media/constants/media-type.constant";

type InteractionRatingColumns = {
  table: PgTable;
  userId: AnyPgColumn;
  mediaId: AnyPgColumn;
  rating: AnyPgColumn;
};

type YourRatingSource = { log: WatchLogTableConfig; interaction: InteractionRatingColumns };

const SOURCES: Record<MediaType, YourRatingSource> = {
  movie: {
    log: FILM_LOG_TABLE,
    interaction: {
      table: filmInteractions,
      userId: filmInteractions.userId,
      mediaId: filmInteractions.movieId,
      rating: filmInteractions.rating,
    },
  },
  tv: {
    log: SERIES_LOG_TABLE,
    interaction: {
      table: seriesInteractions,
      userId: seriesInteractions.userId,
      mediaId: seriesInteractions.seriesId,
      rating: seriesInteractions.rating,
    },
  },
};

// Every user's Your Rating of one title, one row each (#92). `mediaId` may be
// an outer query's column, making this a correlated subquery.
const communityRatingsSql = ({ log, interaction: i }: YourRatingSource, mediaId: SQL | AnyPgColumn) => sql`(
  select ${i.rating} as rating from ${i.table}
  where ${i.mediaId} = ${mediaId} and ${i.rating} is not null
  union all
  (
    select distinct on (${log.userId}) ${log.rating} as rating from ${log.table}
    where ${log.mediaId} = ${mediaId} and ${log.rating} is not null
      and not exists (
        select 1 from ${i.table}
        where ${i.mediaId} = ${mediaId} and ${i.userId} = ${log.userId} and ${i.rating} is not null
      )
    order by ${log.userId}, ${log.watchedDate} desc, ${log.createdAt} desc
  )
)`;

const toRating = (value: unknown): number | null =>
  value === null || value === undefined ? null : Number(value);

// One user's Your Rating of the title `mediaId` names, as a column expression,
// so a single title and a page of titles resolve by the same rule.
const yourRatingSql = ({ log, interaction: i }: YourRatingSource, userId: string, mediaId: SQL | AnyPgColumn) =>
  sql<number | null>`coalesce(
    (select ${i.rating} from ${i.table} where ${i.userId} = ${userId} and ${i.mediaId} = ${mediaId}),
    (
      select ${log.rating} from ${log.table}
      where ${log.userId} = ${userId} and ${log.mediaId} = ${mediaId} and ${log.rating} is not null
      order by ${log.watchedDate} desc, ${log.createdAt} desc
      limit 1
    )
  )`;

export class YourRatingRepository {
  static async resolve(mediaType: MediaType, userId: string, mediaId: number) {
    const rating = yourRatingSql(SOURCES[mediaType], userId, sql`${mediaId}`);
    const result = await db.execute(sql`select ${rating} as rating`);
    return toRating((result.rows[0] as { rating?: unknown } | undefined)?.rating);
  }

  // The batch form: a select column resolving the rating per row of `mediaId`.
  static resolveSql(mediaType: MediaType, userId: string, mediaId: AnyPgColumn): SQL<number | null> {
    return yourRatingSql(SOURCES[mediaType], userId, mediaId).mapWith(toRating);
  }

  static async communityRatings(mediaType: MediaType, mediaId: number) {
    const ratings = communityRatingsSql(SOURCES[mediaType], sql`${mediaId}`);
    const result = await db.execute(sql`select r.rating from ${ratings} r`);
    return (result.rows as { rating: unknown }[]).map((row) => ({ rating: Number(row.rating) }));
  }

  // The same rule per row of an archive listing, grouped by `mediaId`.
  static communityAggregateSql(
    mediaType: MediaType,
    mediaId: AnyPgColumn,
  ): { avgRatingOutOfTen: SQL<number | null>; ratedLogCount: SQL<number> } {
    const ratings = communityRatingsSql(SOURCES[mediaType], mediaId);
    return {
      avgRatingOutOfTen: sql<number | null>`(select avg(r.rating)::double precision from ${ratings} r)`,
      ratedLogCount: sql<number>`(select count(*)::int from ${ratings} r)`,
    };
  }
}
