import { and, eq, gt, isNull, or, sql } from "drizzle-orm";
import { db } from "../../../infrastructure/database/db";
import { seriesEpisodeInteractions, seriesInteractions, tvSeries } from "../tv.entity";
import { SPECIALS_SEASON_NUMBER } from "../constants/tv-season.constants";

// Season and episode packed into one sortable number, so max() finds the furthest watched episode.
const EPISODE_POSITION_FACTOR = 100_000;

export type UpNextCandidateRow = {
  tmdbId: number;
  title: string;
  posterPath: string | null;
  backdropPath: string | null;
  numberOfEpisodes: number | null;
  isWatching: boolean;
  watchedEpisodesCount: number;
  furthestSeasonNumber: number | null;
  furthestEpisodeNumber: number | null;
  lastWatchedAt: Date | null;
};

export class TvUpNextRepository {
  // Series the user is watching, or has watchlisted and not finished or dropped, with their
  // regular-season progress folded in: one grouped query, watching ones first, most recently watched first.
  static async getCandidates(userId: string, limit: number): Promise<UpNextCandidateRow[]> {
    const furthestPosition = sql<number | null>`max(${seriesEpisodeInteractions.seasonNumber} * ${EPISODE_POSITION_FACTOR} + ${seriesEpisodeInteractions.episodeNumber})`;
    const lastEpisodeAt = sql`max(${seriesEpisodeInteractions.updatedAt})`;
    const isWatching = sql<boolean>`${seriesInteractions.watchStatus} = 'watching'`;

    const rows = await db
      .select({
        tmdbId: tvSeries.tmdbId,
        title: tvSeries.title,
        posterPath: tvSeries.posterPath,
        backdropPath: tvSeries.backdropPath,
        numberOfEpisodes: tvSeries.numberOfEpisodes,
        isWatching: sql<boolean>`coalesce(${isWatching}, false)`,
        watchedEpisodesCount: sql<number>`count(${seriesEpisodeInteractions.episodeNumber})::int`,
        furthestPosition: sql<number | null>`${furthestPosition}::int`,
        // updatedAt holds naive UTC wall-clock digits; see getInProgressSeriesForUser.
        lastWatchedAt: sql<Date | null>`(${lastEpisodeAt}) at time zone 'UTC'`.mapWith(
          (value: string | Date | null) => (value === null ? null : new Date(value)),
        ),
      })
      .from(seriesInteractions)
      .innerJoin(tvSeries, eq(seriesInteractions.seriesId, tvSeries.id))
      .leftJoin(
        seriesEpisodeInteractions,
        and(
          eq(seriesEpisodeInteractions.userId, seriesInteractions.userId),
          eq(seriesEpisodeInteractions.seriesId, seriesInteractions.seriesId),
          gt(seriesEpisodeInteractions.seasonNumber, SPECIALS_SEASON_NUMBER),
          eq(seriesEpisodeInteractions.watched, true),
        ),
      )
      .where(
        and(
          eq(seriesInteractions.userId, userId),
          or(
            eq(seriesInteractions.watchStatus, "watching"),
            and(
              eq(seriesInteractions.watchlisted, true),
              or(isNull(seriesInteractions.watchStatus), eq(seriesInteractions.watchStatus, "paused")),
            ),
          ),
        ),
      )
      .groupBy(tvSeries.id, seriesInteractions.watchStatus, seriesInteractions.updatedAt)
      .orderBy(
        sql`coalesce(${isWatching}, false) desc`,
        sql`coalesce(${lastEpisodeAt}, ${seriesInteractions.updatedAt}) desc`,
      )
      .limit(limit);

    return rows.map(({ furthestPosition: position, ...row }) => ({
      ...row,
      furthestSeasonNumber: position === null ? null : Math.floor(position / EPISODE_POSITION_FACTOR),
      furthestEpisodeNumber: position === null ? null : position % EPISODE_POSITION_FACTOR,
    }));
  }
}
