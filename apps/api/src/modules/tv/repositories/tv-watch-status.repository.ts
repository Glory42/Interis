import { and, eq, gt, sql } from "drizzle-orm";
import { db } from "../../../infrastructure/database/db";
import { seriesEpisodeInteractions, seriesInteractions } from "../tv.entity";
import { SPECIALS_SEASON_NUMBER } from "../constants/tv-season.constants";
import type { SeriesWatchStatus } from "../constants/tv-watch-status.constants";

export class TvWatchStatusRepository {
  static async getStatus(userId: string, seriesId: number): Promise<SeriesWatchStatus | null> {
    const [row] = await db
      .select({ watchStatus: seriesInteractions.watchStatus })
      .from(seriesInteractions)
      .where(and(eq(seriesInteractions.userId, userId), eq(seriesInteractions.seriesId, seriesId)))
      .limit(1);

    return row?.watchStatus ?? null;
  }

  // Episode toggles don't otherwise create a series row, so this upserts.
  static async setStatus(
    userId: string,
    seriesId: number,
    watchStatus: SeriesWatchStatus | null,
  ): Promise<void> {
    await db
      .insert(seriesInteractions)
      .values({ userId, seriesId, watchStatus })
      .onConflictDoUpdate({
        target: [seriesInteractions.userId, seriesInteractions.seriesId],
        set: { watchStatus, updatedAt: new Date() },
      });
  }

  // For signals that imply "watched" but shouldn't override a status the
  // user already has (e.g. reviewing a series mid-season).
  static async markCompletedIfUntracked(userId: string, seriesId: number): Promise<void> {
    await db
      .insert(seriesInteractions)
      .values({ userId, seriesId, watchStatus: "completed" })
      .onConflictDoUpdate({
        target: [seriesInteractions.userId, seriesInteractions.seriesId],
        set: {
          watchStatus: sql`coalesce(${seriesInteractions.watchStatus}, 'completed')`,
          updatedAt: new Date(),
        },
      });
  }

  static async countWatchedRegularEpisodes(userId: string, seriesId: number): Promise<number> {
    const [row] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(seriesEpisodeInteractions)
      .where(
        and(
          eq(seriesEpisodeInteractions.userId, userId),
          eq(seriesEpisodeInteractions.seriesId, seriesId),
          gt(seriesEpisodeInteractions.seasonNumber, SPECIALS_SEASON_NUMBER),
          eq(seriesEpisodeInteractions.watched, true),
        ),
      );

    return row?.count ?? 0;
  }

  // New episodes aired: everyone who finished the series episode by episode
  // is now partway through it again. Series marked completed without any
  // tracked episodes (log / review only) stay completed.
  static async reopenCompletedSeries(seriesId: number, numberOfEpisodes: number): Promise<void> {
    await db
      .update(seriesInteractions)
      .set({ watchStatus: "watching" })
      .where(
        and(
          eq(seriesInteractions.seriesId, seriesId),
          eq(seriesInteractions.watchStatus, "completed"),
          // Spelled out: Drizzle renders UPDATE columns unqualified, which
          // would bind the outer user_id to the subquery's own table.
          sql`(
            select count(*) from "serial_episode_interaction" as e
            where e."user_id" = "serial_interaction"."user_id"
              and e."series_id" = ${seriesId}
              and e."season_number" > ${SPECIALS_SEASON_NUMBER}
              and e."watched" = true
          ) between 1 and ${numberOfEpisodes - 1}`,
        ),
      );
  }
}
