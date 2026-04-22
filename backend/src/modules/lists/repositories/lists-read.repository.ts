import { asc, desc, eq, inArray, sql } from "drizzle-orm";
import { db } from "../../../infrastructure/database/db";
import { movies } from "../../movies/movies.entity";
import { tvSeries } from "../../serials/serials.entity";
import { listEntries, lists } from "../lists.entity";

export class ListsReadRepository {
  static async findById(listId: string) {
    const [row] = await db
      .select()
      .from(lists)
      .where(eq(lists.id, listId))
      .limit(1);

    return row ?? null;
  }

  static async findByUserId(userId: string, publicOnly: boolean) {
    const query = db
      .select({
        id: lists.id,
        userId: lists.userId,
        title: lists.title,
        description: lists.description,
        isRanked: lists.isRanked,
        isPublic: lists.isPublic,
        derivedType: lists.derivedType,
        createdAt: lists.createdAt,
        updatedAt: lists.updatedAt,
        itemCount: sql<number>`count(${listEntries.id})`.mapWith(Number),
      })
      .from(lists)
      .leftJoin(listEntries, eq(listEntries.listId, lists.id))
      .where(
        publicOnly
          ? sql`${lists.userId} = ${userId} and ${lists.isPublic} = true`
          : eq(lists.userId, userId),
      )
      .groupBy(lists.id)
      .orderBy(desc(lists.updatedAt));

    return query;
  }

  static async getCoverImages(listIds: string[]) {
    if (listIds.length === 0) {
      return [];
    }

    return db
      .select({
        listId: listEntries.listId,
        position: listEntries.position,
        itemType: listEntries.itemType,
        posterPath: sql<string | null>`COALESCE(${movies.posterPath}, ${tvSeries.posterPath})`,
      })
      .from(listEntries)
      .leftJoin(movies, eq(listEntries.movieId, movies.id))
      .leftJoin(tvSeries, eq(listEntries.tvSeriesId, tvSeries.id))
      .where(inArray(listEntries.listId, listIds))
      .orderBy(asc(listEntries.listId), asc(listEntries.position));
  }

  static async getListItems(listId: string) {
    return db
      .select({
        id: listEntries.id,
        position: listEntries.position,
        itemType: listEntries.itemType,
        note: listEntries.note,
        movieTmdbId: movies.tmdbId,
        movieTitle: movies.title,
        moviePosterPath: movies.posterPath,
        movieReleaseYear: movies.releaseYear,
        serialTmdbId: tvSeries.tmdbId,
        serialTitle: tvSeries.title,
        serialPosterPath: tvSeries.posterPath,
        serialFirstAirYear: tvSeries.firstAirYear,
      })
      .from(listEntries)
      .leftJoin(movies, eq(listEntries.movieId, movies.id))
      .leftJoin(tvSeries, eq(listEntries.tvSeriesId, tvSeries.id))
      .where(eq(listEntries.listId, listId))
      .orderBy(asc(listEntries.position));
  }

  static async getMaxPosition(listId: string): Promise<number> {
    const [row] = await db
      .select({
        max: sql<number>`COALESCE(MAX(${listEntries.position}), 0)`.mapWith(Number),
      })
      .from(listEntries)
      .where(eq(listEntries.listId, listId));

    return row?.max ?? 0;
  }

  static async findEntryById(entryId: string) {
    const [row] = await db
      .select()
      .from(listEntries)
      .where(eq(listEntries.id, entryId))
      .limit(1);

    return row ?? null;
  }

  static async getCurrentItemTypes(listId: string): Promise<string[]> {
    const rows = await db
      .select({ itemType: listEntries.itemType })
      .from(listEntries)
      .where(eq(listEntries.listId, listId));

    return rows.map((r) => r.itemType);
  }

  static async checkItemInListsForUser(
    userId: string,
    movieId: number | null,
    tvSeriesId: number | null,
  ): Promise<Array<{ listId: string; entryId: string }>> {
    if (movieId === null && tvSeriesId === null) {
      return [];
    }

    const rows = await db
      .select({
        listId: listEntries.listId,
        entryId: listEntries.id,
      })
      .from(listEntries)
      .innerJoin(lists, eq(listEntries.listId, lists.id))
      .where(
        movieId !== null
          ? sql`${lists.userId} = ${userId} and ${listEntries.movieId} = ${movieId}`
          : sql`${lists.userId} = ${userId} and ${listEntries.tvSeriesId} = ${tvSeriesId}`,
      );

    return rows;
  }
}
