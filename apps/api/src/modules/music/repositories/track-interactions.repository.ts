import { and, desc, eq, sql } from "drizzle-orm";
import { db } from "../../../infrastructure/database/db";
import { user } from "../../../infrastructure/database/auth.entity";
import { profiles } from "../../users/users.entity";
import { reviews } from "../../reviews/reviews.entity";
import { tracks, trackDiaryEntries, trackInteractions } from "../music.entity";

export class TrackInteractionsRepository {
  static async getInteraction(userId: string, trackId: number) {
    const [row] = await db
      .select()
      .from(trackInteractions)
      .where(and(eq(trackInteractions.userId, userId), eq(trackInteractions.trackId, trackId)))
      .limit(1);
    return row ?? null;
  }

  static async upsertInteraction(
    userId: string,
    trackId: number,
    input: { liked?: boolean; wantToListen?: boolean; rating?: number | null },
  ) {
    const [row] = await db
      .insert(trackInteractions)
      .values({
        userId,
        trackId,
        liked: input.liked ?? false,
        wantToListen: input.wantToListen ?? false,
        rating: input.rating ?? null,
      })
      .onConflictDoUpdate({
        target: [trackInteractions.userId, trackInteractions.trackId],
        set: {
          ...(input.liked !== undefined && { liked: input.liked }),
          ...(input.wantToListen !== undefined && { wantToListen: input.wantToListen }),
          ...(input.rating !== undefined && { rating: input.rating }),
          updatedAt: new Date(),
        },
      })
      .returning();
    return row ?? null;
  }

  static async createLog(
    userId: string,
    trackId: number,
    input: { listenedDate: string; rating: number | null; relisten: boolean },
  ) {
    const [row] = await db
      .insert(trackDiaryEntries)
      .values({ userId, trackId, ...input })
      .returning();
    return row ?? null;
  }

  static async findLogById(id: string, userId: string) {
    const [row] = await db
      .select()
      .from(trackDiaryEntries)
      .where(and(eq(trackDiaryEntries.id, id), eq(trackDiaryEntries.userId, userId)))
      .limit(1);
    return row ?? null;
  }

  static async updateLog(
    id: string,
    userId: string,
    input: { listenedDate?: string; rating?: number | null; relisten?: boolean },
  ) {
    const [row] = await db
      .update(trackDiaryEntries)
      .set({
        ...(input.listenedDate !== undefined && { listenedDate: input.listenedDate }),
        ...(input.rating !== undefined && { rating: input.rating }),
        ...(input.relisten !== undefined && { relisten: input.relisten }),
      })
      .where(and(eq(trackDiaryEntries.id, id), eq(trackDiaryEntries.userId, userId)))
      .returning();
    return row ?? null;
  }

  static async deleteLog(id: string, userId: string) {
    const [row] = await db
      .delete(trackDiaryEntries)
      .where(and(eq(trackDiaryEntries.id, id), eq(trackDiaryEntries.userId, userId)))
      .returning({ id: trackDiaryEntries.id });
    return row ?? null;
  }

  static async getMyLogs(userId: string) {
    return db
      .select({
        id: trackDiaryEntries.id,
        listenedDate: trackDiaryEntries.listenedDate,
        rating: trackDiaryEntries.rating,
        relisten: trackDiaryEntries.relisten,
        trackId: trackDiaryEntries.trackId,
        createdAt: trackDiaryEntries.createdAt,
        updatedAt: trackDiaryEntries.updatedAt,
        trackMbid: tracks.mbid,
        trackTitle: tracks.title,
        trackArtistName: tracks.artistName,
        reviewId: reviews.id,
        reviewContent: reviews.content,
      })
      .from(trackDiaryEntries)
      .innerJoin(tracks, eq(tracks.id, trackDiaryEntries.trackId))
      .leftJoin(
        reviews,
        and(
          eq(reviews.userId, trackDiaryEntries.userId),
          eq(reviews.mediaType, "track"),
          eq(reviews.mediaSourceId, tracks.mbid),
        ),
      )
      .where(eq(trackDiaryEntries.userId, userId))
      .orderBy(desc(trackDiaryEntries.listenedDate), desc(trackDiaryEntries.createdAt));
  }

  static async getLogsByTrackId(trackId: number) {
    return db
      .select({
        diaryEntryId: trackDiaryEntries.id,
        listenedDate: trackDiaryEntries.listenedDate,
        rating: trackDiaryEntries.rating,
        relisten: trackDiaryEntries.relisten,
        createdAt: trackDiaryEntries.createdAt,
        username: user.username,
        userDisplayName: user.name,
        avatarUrl: profiles.avatarUrl,
        reviewContent: reviews.content,
        reviewContainsSpoilers: reviews.containsSpoilers,
        reviewUpdatedAt: reviews.updatedAt,
      })
      .from(trackDiaryEntries)
      .innerJoin(user, eq(user.id, trackDiaryEntries.userId))
      .innerJoin(profiles, eq(profiles.userId, trackDiaryEntries.userId))
      .leftJoin(
        reviews,
        and(
          eq(reviews.userId, trackDiaryEntries.userId),
          eq(reviews.mediaType, "track"),
          eq(reviews.mediaSourceId, tracks.mbid),
        ),
      )
      .innerJoin(tracks, eq(tracks.id, trackDiaryEntries.trackId))
      .where(eq(trackDiaryEntries.trackId, trackId))
      .orderBy(desc(trackDiaryEntries.createdAt));
  }

  static async getLogCount(trackId: number): Promise<number> {
    const [row] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(trackDiaryEntries)
      .where(eq(trackDiaryEntries.trackId, trackId));
    return row?.count ?? 0;
  }

  static async getViewerLog(userId: string, trackId: number) {
    const [row] = await db
      .select({
        id: trackDiaryEntries.id,
        listenedDate: trackDiaryEntries.listenedDate,
        relisten: trackDiaryEntries.relisten,
        rating: trackDiaryEntries.rating,
      })
      .from(trackDiaryEntries)
      .where(and(eq(trackDiaryEntries.userId, userId), eq(trackDiaryEntries.trackId, trackId)))
      .orderBy(desc(trackDiaryEntries.listenedDate))
      .limit(1);
    return row ?? null;
  }
}
