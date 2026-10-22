import { and, eq, gt, sql } from "drizzle-orm";
import { db } from "../../../infrastructure/database/db";
import { serialEpisodeInteractions, serialInteractions } from "../serials.entity";
import { SPECIALS_SEASON_NUMBER } from "../constants/serials-season.constants";
import type { SerialWatchStatus } from "../constants/serials-watch-status.constants";

export class SerialsWatchStatusRepository {
  static async getStatus(userId: string, seriesId: number): Promise<SerialWatchStatus | null> {
    const [row] = await db
      .select({ watchStatus: serialInteractions.watchStatus })
      .from(serialInteractions)
      .where(and(eq(serialInteractions.userId, userId), eq(serialInteractions.seriesId, seriesId)))
      .limit(1);

    return row?.watchStatus ?? null;
  }

  // Episode toggles don't otherwise create a series row, so this upserts.
  static async setStatus(
    userId: string,
    seriesId: number,
    watchStatus: SerialWatchStatus | null,
  ): Promise<void> {
    await db
      .insert(serialInteractions)
      .values({ userId, seriesId, watchStatus })
      .onConflictDoUpdate({
        target: [serialInteractions.userId, serialInteractions.seriesId],
        set: { watchStatus, updatedAt: new Date() },
      });
  }

  // For signals that imply "watched" but shouldn't override a status the
  // user already has (e.g. reviewing a series mid-season).
  static async markCompletedIfUntracked(userId: string, seriesId: number): Promise<void> {
    await db
      .insert(serialInteractions)
      .values({ userId, seriesId, watchStatus: "completed" })
      .onConflictDoUpdate({
        target: [serialInteractions.userId, serialInteractions.seriesId],
        set: {
          watchStatus: sql`coalesce(${serialInteractions.watchStatus}, 'completed')`,
          updatedAt: new Date(),
        },
      });
  }

  static async countWatchedRegularEpisodes(userId: string, seriesId: number): Promise<number> {
    const [row] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(serialEpisodeInteractions)
      .where(
        and(
          eq(serialEpisodeInteractions.userId, userId),
          eq(serialEpisodeInteractions.seriesId, seriesId),
          gt(serialEpisodeInteractions.seasonNumber, SPECIALS_SEASON_NUMBER),
          eq(serialEpisodeInteractions.watched, true),
        ),
      );

    return row?.count ?? 0;
  }

  // New episodes aired: everyone who finished the series episode by episode
  // is now partway through it again. Series marked completed without any
  // tracked episodes (log / review only) stay completed.
  static async reopenCompletedSeries(seriesId: number, numberOfEpisodes: number): Promise<void> {
    await db
      .update(serialInteractions)
      .set({ watchStatus: "watching" })
      .where(
        and(
          eq(serialInteractions.seriesId, seriesId),
          eq(serialInteractions.watchStatus, "completed"),
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
