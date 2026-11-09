import { and, asc, desc, eq, inArray } from "drizzle-orm";
import { db } from "../../../infrastructure/database/db";
import { listEntries, lists } from "../../lists/lists.entity";
import { films } from "../../films/films.entity";

export class PublicRepository {
  static async findPublicListsByUser(userId: string, limit: number) {
    return db
      .select({
        id: lists.id,
        title: lists.title,
        description: lists.description,
        isRanked: lists.isRanked,
        createdAt: lists.createdAt,
        updatedAt: lists.updatedAt,
      })
      .from(lists)
      .where(and(eq(lists.userId, userId), eq(lists.isPublic, true)))
      .orderBy(desc(lists.updatedAt), desc(lists.createdAt))
      .limit(limit);
  }

  static async findListEntriesByListIds(listIds: string[]) {
    if (listIds.length === 0) {
      return [];
    }

    return db
      .select({
        listId: listEntries.listId,
        position: listEntries.position,
        note: listEntries.note,
        tmdbId: films.tmdbId,
        title: films.title,
        posterPath: films.posterPath,
        releaseYear: films.releaseYear,
      })
      .from(listEntries)
      .innerJoin(films, eq(films.id, listEntries.movieId))
      .where(inArray(listEntries.listId, listIds))
      .orderBy(asc(listEntries.listId), asc(listEntries.position), asc(listEntries.createdAt));
  }
}
