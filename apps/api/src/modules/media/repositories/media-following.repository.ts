import { sql, type SQL } from "drizzle-orm";
import type { AnyPgColumn, PgTable } from "drizzle-orm/pg-core";
import { db } from "../../../infrastructure/database/db";
import { user } from "../../../infrastructure/database/auth.entity";
import { films } from "../../films/films.entity";
import { filmInteractions } from "../../interactions/interactions.entity";
import { userBlocks, userMutes } from "../../moderation/moderation.entity";
import { reviews } from "../../reviews/reviews.entity";
import { follows } from "../../social/social.entity";
import { seriesInteractions, tvSeries } from "../../tv/tv.entity";
import { profiles } from "../../users/users.entity";
import type { MediaType } from "../constants/media-type.constant";
import type { MediaFollowingRow } from "../types/media-following.types";
import { FILM_LOG_TABLE, SERIES_LOG_TABLE, type WatchLogTableConfig } from "./watch-log.repository";

type FollowingSource = {
  titleTable: PgTable;
  titleId: AnyPgColumn;
  titleTmdbId: AnyPgColumn;
  log: WatchLogTableConfig;
  interaction: PgTable;
  interactionUserId: AnyPgColumn;
  interactionMediaId: AnyPgColumn;
  interactionRating: AnyPgColumn;
  interactionLiked: AnyPgColumn;
  interactionUpdatedAt: AnyPgColumn;
  // Series have no watched column: a completed watch status is watched.
  watched: SQL;
  watchStatus: SQL;
};

const SOURCES: Record<MediaType, FollowingSource> = {
  movie: {
    titleTable: films,
    titleId: films.id,
    titleTmdbId: films.tmdbId,
    log: FILM_LOG_TABLE,
    interaction: filmInteractions,
    interactionUserId: filmInteractions.userId,
    interactionMediaId: filmInteractions.movieId,
    interactionRating: filmInteractions.rating,
    interactionLiked: filmInteractions.liked,
    interactionUpdatedAt: filmInteractions.updatedAt,
    watched: sql`coalesce(${filmInteractions.isWatched}, false)`,
    watchStatus: sql`null::text`,
  },
  tv: {
    titleTable: tvSeries,
    titleId: tvSeries.id,
    titleTmdbId: tvSeries.tmdbId,
    log: SERIES_LOG_TABLE,
    interaction: seriesInteractions,
    interactionUserId: seriesInteractions.userId,
    interactionMediaId: seriesInteractions.seriesId,
    interactionRating: seriesInteractions.rating,
    interactionLiked: seriesInteractions.liked,
    interactionUpdatedAt: seriesInteractions.updatedAt,
    watched: sql`coalesce(${seriesInteractions.watchStatus} = 'completed', false)`,
    watchStatus: sql`${seriesInteractions.watchStatus}::text`,
  },
};

// Users whose activity the viewer can see: no Mute, no Block either way, no
// Suspension in effect. `authorId` may be an outer query's column.
const notHiddenFromViewerSql = (viewerUserId: string, authorId: AnyPgColumn | SQL): SQL => sql`(
  not exists (
    select 1 from ${userMutes}
    where ${userMutes.muterId} = ${viewerUserId} and ${userMutes.mutedId} = ${authorId}
  )
  and not exists (
    select 1 from ${userBlocks}
    where (${userBlocks.blockerId} = ${viewerUserId} and ${userBlocks.blockedId} = ${authorId})
       or (${userBlocks.blockerId} = ${authorId} and ${userBlocks.blockedId} = ${viewerUserId})
  )
  and not exists (
    select 1 from ${profiles}
    where ${profiles.userId} = ${authorId} and ${profiles.isSuspended}
      and (${profiles.suspendedUntil} is null or ${profiles.suspendedUntil} > now())
  )
)`;

const visibleFolloweeSql = (viewerUserId: string, authorId: AnyPgColumn | SQL): SQL => sql`(
  exists (
    select 1 from ${follows}
    where ${follows.followerId} = ${viewerUserId} and ${follows.followingId} = ${authorId}
  )
  and ${notHiddenFromViewerSql(viewerUserId, authorId)}
)`;

const toNumberOrNull = (value: unknown): number | null =>
  value === null || value === undefined ? null : Number(value);

type RawRow = {
  username: string;
  display_username: string | null;
  avatar_url: string | null;
  liked: boolean;
  watched: boolean;
  watch_status: string | null;
  rating: unknown;
  watched_date: string | null;
  review_id: string | null;
  total_count: number;
  rated_count: number;
  review_count: number;
  average_rating: unknown;
};

export class MediaFollowingRepository {
  // The "following" review sort: only authors the viewer follows and can see.
  // Signed out, it matches nothing. Other sorts don't filter.
  static reviewAuthorFilter(sort: string, viewerUserId: string | null): SQL | undefined {
    if (sort !== "following") return undefined;
    return viewerUserId ? visibleFolloweeSql(viewerUserId, reviews.userId) : sql`false`;
  }

  // One round trip: each followee's Interaction, latest log, latest rated log
  // and latest Review of the title, with the summary as window aggregates.
  static async listForTitle(mediaType: MediaType, tmdbId: number, viewerUserId: string, limit: number) {
    const s = SOURCES[mediaType];
    const log = s.log;
    const followeeId = follows.followingId;
    const mediaId = sql`(select ${s.titleId} from ${s.titleTable} where ${s.titleTmdbId} = ${tmdbId})`;

    const result = await db.execute(sql`
      with people as (
        select
          ${user.username} as username,
          ${user.displayUsername} as display_username,
          ${profiles.avatarUrl} as avatar_url,
          coalesce(${s.interactionLiked}, false) as liked,
          (${s.watched} or latest_log.watched_date is not null) as watched,
          ${s.watchStatus} as watch_status,
          coalesce(${s.interactionRating}, latest_rated.rating) as rating,
          latest_log.watched_date::text as watched_date,
          latest_review.id as review_id,
          ${s.interactionUpdatedAt} as interaction_updated_at
        from ${follows}
        inner join ${user} on ${user.id} = ${followeeId}
        left join ${profiles} on ${profiles.userId} = ${followeeId}
        left join ${s.interaction}
          on ${s.interactionUserId} = ${followeeId} and ${s.interactionMediaId} = ${mediaId}
        left join lateral (
          select ${log.watchedDate} as watched_date from ${log.table}
          where ${log.userId} = ${followeeId} and ${log.mediaId} = ${mediaId}
          order by ${log.watchedDate} desc, ${log.createdAt} desc
          limit 1
        ) latest_log on true
        left join lateral (
          select ${log.rating} as rating from ${log.table}
          where ${log.userId} = ${followeeId} and ${log.mediaId} = ${mediaId} and ${log.rating} is not null
          order by ${log.watchedDate} desc, ${log.createdAt} desc
          limit 1
        ) latest_rated on true
        left join lateral (
          select ${reviews.id} as id from ${reviews}
          where ${reviews.userId} = ${followeeId} and ${reviews.mediaType} = ${mediaType}
            and ${reviews.mediaSource} = 'tmdb' and ${reviews.mediaSourceId} = ${String(tmdbId)}
          order by ${reviews.createdAt} desc
          limit 1
        ) latest_review on true
        where ${follows.followerId} = ${viewerUserId}
          and ${notHiddenFromViewerSql(viewerUserId, followeeId)}
      )
      select
        username, display_username, avatar_url, liked, watched, watch_status, rating, watched_date, review_id,
        count(*) over()::int as total_count,
        count(rating) over()::int as rated_count,
        count(review_id) over()::int as review_count,
        avg(rating) over()::double precision as average_rating
      from people
      where watched or watch_status is not null or rating is not null or review_id is not null
      order by watched_date desc nulls last, interaction_updated_at desc nulls last, username
      limit ${limit}
    `);

    const rows = result.rows as RawRow[];
    const first = rows[0];
    return {
      summary: {
        count: first?.total_count ?? 0,
        ratedCount: first?.rated_count ?? 0,
        reviewCount: first?.review_count ?? 0,
        averageRating: toNumberOrNull(first?.average_rating),
      },
      people: rows.map(
        (row): MediaFollowingRow => ({
          username: row.username,
          displayUsername: row.display_username,
          avatarUrl: row.avatar_url,
          liked: row.liked,
          watched: row.watched,
          watchStatus: row.watch_status,
          rating: toNumberOrNull(row.rating),
          watchedDate: row.watched_date,
          reviewId: row.review_id,
        }),
      ),
    };
  }
}
