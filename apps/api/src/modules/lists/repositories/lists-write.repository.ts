import { and, count, eq, inArray, sql } from "drizzle-orm";
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

  // ownerId limits the delete to that user's list.
  static async deleteById(listId: string, ownerId?: string) {
    const [deleted] = await db
      .delete(lists)
      .where(and(eq(lists.id, listId), ownerId ? eq(lists.userId, ownerId) : undefined))
      .returning({ id: lists.id, userId: lists.userId });

    return deleted ?? null;
  }

  // Position is computed in the insert so concurrent adds don't read a stale max.
  // Null when the title is already on the list.
  static async insertEntry(data: {
    listId: string;
    movieId?: number;
    tvSeriesId?: number;
    itemType: string;
    addedByUserId: string;
  }) {
    const [created] = await db
      .insert(listEntries)
      .values({
        listId: data.listId,
        movieId: data.movieId,
        tvSeriesId: data.tvSeriesId,
        itemType: data.itemType,
        addedByUserId: data.addedByUserId,
        position: sql`(SELECT COALESCE(MAX(${listEntries.position}), 0) + 1 FROM ${listEntries} WHERE ${listEntries.listId} = ${data.listId})`,
      })
      .onConflictDoNothing()
      .returning();

    return created ?? null;
  }

  // Derived from the entries as they are now, so concurrent edits can't leave it stale.
  static async refreshDerivedType(listId: string): Promise<string | null> {
    const [updated] = await db
      .update(lists)
      .set({
        derivedType: sql`(
          SELECT CASE
            WHEN COUNT(*) = 0 THEN NULL
            WHEN COUNT(DISTINCT ${listEntries.itemType}) > 1 THEN 'mixed'
            ELSE MIN(${listEntries.itemType})
          END
          FROM ${listEntries} WHERE ${listEntries.listId} = ${listId}
        )`,
      })
      .where(eq(lists.id, listId))
      .returning({ derivedType: lists.derivedType });

    return updated?.derivedType ?? null;
  }

  static async deleteEntry(listId: string, entryId: string): Promise<boolean> {
    const rows = await db
      .delete(listEntries)
      .where(and(eq(listEntries.id, entryId), eq(listEntries.listId, listId)))
      .returning({ id: listEntries.id });
    return rows.length > 0;
  }

  static async updateEntryNote(listId: string, entryId: string, note: string | null) {
    const [updated] = await db
      .update(listEntries)
      .set({ note })
      .where(and(eq(listEntries.id, entryId), eq(listEntries.listId, listId)))
      .returning({ id: listEntries.id, note: listEntries.note });
    return updated ?? null;
  }

  // Renumbers the list 1..n in the given order, in one statement that applies only
  // when the ids are exactly the list's current entries; returns rows changed (0 = stale).
  static async reorderEntries(listId: string, orderedIds: string[]): Promise<number> {
    if (orderedIds.length === 0) return 0;

    const whenClauses = orderedIds.map((id, index) => sql`WHEN ${id}::uuid THEN ${index + 1}::integer`);
    const idList = sql.join(orderedIds.map((id) => sql`${id}::uuid`), sql`, `);

    const rows = await db
      .update(listEntries)
      .set({ position: sql`CASE ${listEntries.id} ${sql.join(whenClauses, sql` `)} END` })
      .where(
        and(
          eq(listEntries.listId, listId),
          inArray(listEntries.id, orderedIds),
          sql`(SELECT COUNT(*) FROM ${listEntries} WHERE ${listEntries.listId} = ${listId}) = ${orderedIds.length}`,
          sql`(SELECT COUNT(*) FROM ${listEntries} WHERE ${listEntries.listId} = ${listId} AND ${listEntries.id} IN (${idList})) = ${orderedIds.length}`,
        ),
      )
      .returning({ id: listEntries.id });

    return rows.length;
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

    return db
      .select({
        id: listEntries.id,
        listId: listEntries.listId,
      })
      .from(listEntries)
      .where(inArray(listEntries.id, entryIds));
  }
}
