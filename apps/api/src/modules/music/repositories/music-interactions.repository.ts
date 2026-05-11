import { and, desc, eq, sql } from "drizzle-orm";
import { db } from "../../../infrastructure/database/db";
import { user } from "../../../infrastructure/database/auth.entity";
import { profiles } from "../../users/users.entity";
import { reviews } from "../../reviews/reviews.entity";
import { albums, musicDiaryEntries, musicInteractions } from "../music.entity";

export class MusicInteractionsRepository {
  static async getInteraction(userId: string, albumId: number) {
    const [row] = await db
      .select()
      .from(musicInteractions)
      .where(and(eq(musicInteractions.userId, userId), eq(musicInteractions.albumId, albumId)))
      .limit(1);
    return row ?? null;
  }

  static async upsertInteraction(
    userId: string,
    albumId: number,
    input: { liked?: boolean; wantToListen?: boolean; rating?: number | null },
  ) {
    const [row] = await db
      .insert(musicInteractions)
      .values({
        userId,
        albumId,
        liked: input.liked ?? false,
        wantToListen: input.wantToListen ?? false,
        rating: input.rating ?? null,
      })
      .onConflictDoUpdate({
        target: [musicInteractions.userId, musicInteractions.albumId],
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

  static async createLog(userId: string, albumId: number, input: {
    listenedDate: string;
    rating: number | null;
    relisten: boolean;
  }) {
    const [row] = await db
      .insert(musicDiaryEntries)
      .values({ userId, albumId, ...input })
      .returning();
    return row ?? null;
  }

  static async findLogById(id: string, userId: string) {
    const [row] = await db
      .select()
      .from(musicDiaryEntries)
      .where(and(eq(musicDiaryEntries.id, id), eq(musicDiaryEntries.userId, userId)))
      .limit(1);
    return row ?? null;
  }

  static async updateLog(id: string, userId: string, input: {
    listenedDate?: string;
    rating?: number | null;
    relisten?: boolean;
  }) {
    const [row] = await db
      .update(musicDiaryEntries)
      .set({
        ...(input.listenedDate !== undefined && { listenedDate: input.listenedDate }),
        ...(input.rating !== undefined && { rating: input.rating }),
        ...(input.relisten !== undefined && { relisten: input.relisten }),
      })
      .where(and(eq(musicDiaryEntries.id, id), eq(musicDiaryEntries.userId, userId)))
      .returning();
    return row ?? null;
  }

  static async deleteLog(id: string, userId: string) {
    const [row] = await db
      .delete(musicDiaryEntries)
      .where(and(eq(musicDiaryEntries.id, id), eq(musicDiaryEntries.userId, userId)))
      .returning({ id: musicDiaryEntries.id });
    return row ?? null;
  }

  static async getMyLogs(userId: string) {
    return db
      .select({
        id: musicDiaryEntries.id,
        listenedDate: musicDiaryEntries.listenedDate,
        rating: musicDiaryEntries.rating,
        relisten: musicDiaryEntries.relisten,
        albumId: musicDiaryEntries.albumId,
        createdAt: musicDiaryEntries.createdAt,
        updatedAt: musicDiaryEntries.updatedAt,
        albumMbid: albums.mbid,
        albumTitle: albums.title,
        albumArtistName: albums.artistName,
        albumCoverArtUrl: albums.coverArtUrl,
        albumFirstReleaseYear: albums.firstReleaseYear,
        reviewId: reviews.id,
        reviewContent: reviews.content,
      })
      .from(musicDiaryEntries)
      .innerJoin(albums, eq(albums.id, musicDiaryEntries.albumId))
      .leftJoin(
        reviews,
        and(
          eq(reviews.userId, musicDiaryEntries.userId),
          eq(reviews.mediaType, "album"),
          eq(reviews.mediaSourceId, albums.mbid),
        ),
      )
      .where(eq(musicDiaryEntries.userId, userId))
      .orderBy(desc(musicDiaryEntries.listenedDate), desc(musicDiaryEntries.createdAt));
  }

  static async getLogsByAlbumId(albumId: number) {
    return db
      .select({
        diaryEntryId: musicDiaryEntries.id,
        listenedDate: musicDiaryEntries.listenedDate,
        rating: musicDiaryEntries.rating,
        relisten: musicDiaryEntries.relisten,
        createdAt: musicDiaryEntries.createdAt,
        username: user.username,
        userDisplayName: user.name,
        avatarUrl: profiles.avatarUrl,
        reviewContent: reviews.content,
        reviewContainsSpoilers: reviews.containsSpoilers,
        reviewUpdatedAt: reviews.updatedAt,
      })
      .from(musicDiaryEntries)
      .innerJoin(user, eq(user.id, musicDiaryEntries.userId))
      .innerJoin(profiles, eq(profiles.userId, musicDiaryEntries.userId))
      .leftJoin(
        reviews,
        and(
          eq(reviews.userId, musicDiaryEntries.userId),
          eq(reviews.mediaType, "album"),
          eq(reviews.mediaSourceId, albums.mbid),
        ),
      )
      .innerJoin(albums, eq(albums.id, musicDiaryEntries.albumId))
      .where(eq(musicDiaryEntries.albumId, albumId))
      .orderBy(desc(musicDiaryEntries.createdAt));
  }

  static async getLogCount(albumId: number): Promise<number> {
    const [row] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(musicDiaryEntries)
      .where(eq(musicDiaryEntries.albumId, albumId));
    return row?.count ?? 0;
  }

  static async getViewerLog(userId: string, albumId: number) {
    const [row] = await db
      .select({
        id: musicDiaryEntries.id,
        listenedDate: musicDiaryEntries.listenedDate,
        relisten: musicDiaryEntries.relisten,
        rating: musicDiaryEntries.rating,
      })
      .from(musicDiaryEntries)
      .where(and(eq(musicDiaryEntries.userId, userId), eq(musicDiaryEntries.albumId, albumId)))
      .orderBy(desc(musicDiaryEntries.listenedDate))
      .limit(1);
    return row ?? null;
  }
}
