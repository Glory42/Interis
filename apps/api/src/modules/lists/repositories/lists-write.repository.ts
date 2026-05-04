import { and, eq } from "drizzle-orm";
import { db } from "../../../infrastructure/database/db";
import { listEntries, listLikes, lists } from "../lists.entity";

export class ListsWriteRepository {
  static async create(data: {
    userId: string;
    title: string;
    description?: string;
    isPublic: boolean;
    isRanked: boolean;
  }) {
    const [created] = await db
      .insert(lists)
      .values({
        userId: data.userId,
        title: data.title,
        description: data.description,
        isPublic: data.isPublic,
        isRanked: data.isRanked,
      })
      .returning();

    return created ?? null;
  }

  static async update(
    listId: string,
    data: {
      title?: string;
      description?: string | null;
      isPublic?: boolean;
      isRanked?: boolean;
      derivedType?: string | null;
    },
  ) {
    const [updated] = await db
      .update(lists)
      .set({
        ...(data.title !== undefined && { title: data.title }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.isPublic !== undefined && { isPublic: data.isPublic }),
        ...(data.isRanked !== undefined && { isRanked: data.isRanked }),
        ...("derivedType" in data && { derivedType: data.derivedType }),
      })
      .where(eq(lists.id, listId))
      .returning();

    return updated ?? null;
  }

  static async deleteById(listId: string): Promise<void> {
    await db.delete(lists).where(eq(lists.id, listId));
  }

  static async insertEntry(data: {
    listId: string;
    movieId?: number;
    tvSeriesId?: number;
    itemType: string;
    position: number;
  }) {
    const [created] = await db
      .insert(listEntries)
      .values({
        listId: data.listId,
        movieId: data.movieId,
        tvSeriesId: data.tvSeriesId,
        itemType: data.itemType,
        position: data.position,
      })
      .returning();

    return created ?? null;
  }

  static async deleteEntry(entryId: string): Promise<void> {
    await db.delete(listEntries).where(eq(listEntries.id, entryId));
  }

  static async bulkUpdatePositions(
    items: Array<{ id: string; position: number }>,
  ): Promise<void> {
    await Promise.all(
      items.map((item) =>
        db
          .update(listEntries)
          .set({ position: item.position })
          .where(eq(listEntries.id, item.id)),
      ),
    );
  }

  static async likeList(userId: string, listId: string): Promise<void> {
    await db.insert(listLikes).values({ userId, listId }).onConflictDoNothing();
  }

  static async unlikeList(userId: string, listId: string): Promise<void> {
    await db
      .delete(listLikes)
      .where(and(eq(listLikes.userId, userId), eq(listLikes.listId, listId)));
  }

  static async hasUserLikedList(userId: string, listId: string): Promise<boolean> {
    const rows = await db
      .select({ listId: listLikes.listId })
      .from(listLikes)
      .where(and(eq(listLikes.userId, userId), eq(listLikes.listId, listId)))
      .limit(1);
    return rows.length > 0;
  }

  static async getListLikeCount(listId: string): Promise<number> {
    const { count, sql: rawSql } = await import("drizzle-orm");
    const [row] = await db
      .select({ n: count() })
      .from(listLikes)
      .where(eq(listLikes.listId, listId));
    return Number(row?.n ?? 0);
  }

  static async getEntriesByIds(
    entryIds: string[],
  ): Promise<Array<{ id: string; listId: string }>> {
    if (entryIds.length === 0) {
      return [];
    }

    const { inArray } = await import("drizzle-orm");

    return db
      .select({
        id: listEntries.id,
        listId: listEntries.listId,
      })
      .from(listEntries)
      .where(inArray(listEntries.id, entryIds));
  }
}
