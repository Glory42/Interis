import { and, asc, desc, eq, inArray, or, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { db } from "../../../infrastructure/database/db";
import { applyOptionalPagination } from "../../../commons/helpers/db-pagination.helper";
import { user } from "../../../infrastructure/database/auth.entity";
import { films } from "../../films/films.entity";
import { filmInteractions } from "../../interactions/interactions.entity";
import { seriesInteractions, tvSeries } from "../../tv/tv.entity";
import { listCollaborators, listEntries, lists } from "../lists.entity";

const addedBy = alias(user, "added_by");

// Lists the user owns or has accepted a List Collaborator invite to.
const ownedOrSharedWith = (userId: string) =>
  or(
    eq(lists.userId, userId),
    inArray(
      lists.id,
      db
        .select({ listId: listCollaborators.listId })
        .from(listCollaborators)
        .where(and(eq(listCollaborators.userId, userId), eq(listCollaborators.status, "accepted"))),
    ),
  );

export class ListsReadRepository {
  static async findById(listId: string) {
    const [row] = await db
      .select()
      .from(lists)
      .where(eq(lists.id, listId))
      .limit(1);

    return row ?? null;
  }

  static async findOwnerUsername(userId: string): Promise<string | null> {
    const [row] = await db.select({ username: user.username }).from(user).where(eq(user.id, userId)).limit(1);
    return row?.username ?? null;
  }

  static async findByUserId(
    userId: string,
    publicOnly: boolean,
    limit?: number,
    offset?: number,
  ) {
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
        ownerUsername: user.username,
        itemCount: sql<number>`count(${listEntries.id})`.mapWith(Number),
      })
      .from(lists)
      .innerJoin(user, eq(user.id, lists.userId))
      .leftJoin(listEntries, eq(listEntries.listId, lists.id))
      .where(publicOnly ? and(ownedOrSharedWith(userId), eq(lists.isPublic, true)) : ownedOrSharedWith(userId))
      .groupBy(lists.id, user.username)
      .orderBy(desc(lists.updatedAt))
      .$dynamic();

    return applyOptionalPagination(query, limit, offset);
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
        posterPath: sql<string | null>`COALESCE(${films.posterPath}, ${tvSeries.posterPath})`,
      })
      .from(listEntries)
      .leftJoin(films, eq(listEntries.movieId, films.id))
      .leftJoin(tvSeries, eq(listEntries.tvSeriesId, tvSeries.id))
      .where(inArray(listEntries.listId, listIds))
      .orderBy(asc(listEntries.listId), asc(listEntries.position));
  }

  // Owner's rating comes from their interaction rows; director/creator from the cached title.
  static async getListItems(listId: string, ownerId: string) {
    return db
      .select({
        id: listEntries.id,
        position: listEntries.position,
        itemType: listEntries.itemType,
        note: listEntries.note,
        addedByUserId: listEntries.addedByUserId,
        addedByUsername: addedBy.username,
        movieTmdbId: films.tmdbId,
        movieTitle: films.title,
        moviePosterPath: films.posterPath,
        movieReleaseYear: films.releaseYear,
        movieDirector: films.director,
        movieOwnerRating: filmInteractions.rating,
        serialTmdbId: tvSeries.tmdbId,
        serialTitle: tvSeries.title,
        serialPosterPath: tvSeries.posterPath,
        serialFirstAirYear: tvSeries.firstAirYear,
        serialCreator: tvSeries.creator,
        serialOwnerRating: seriesInteractions.rating,
      })
      .from(listEntries)
      .leftJoin(films, eq(listEntries.movieId, films.id))
      .leftJoin(tvSeries, eq(listEntries.tvSeriesId, tvSeries.id))
      .leftJoin(addedBy, eq(addedBy.id, listEntries.addedByUserId))
      .leftJoin(
        filmInteractions,
        and(
          eq(filmInteractions.movieId, listEntries.movieId),
          eq(filmInteractions.userId, ownerId),
        ),
      )
      .leftJoin(
        seriesInteractions,
        and(
          eq(seriesInteractions.seriesId, listEntries.tvSeriesId),
          eq(seriesInteractions.userId, ownerId),
        ),
      )
      .where(eq(listEntries.listId, listId))
      .orderBy(asc(listEntries.position), asc(listEntries.createdAt));
  }

  static async countEntries(listId: string): Promise<number> {
    const [row] = await db
      .select({ n: sql<number>`count(*)`.mapWith(Number) })
      .from(listEntries)
      .where(eq(listEntries.listId, listId));
    return row?.n ?? 0;
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
        and(
          ownedOrSharedWith(userId),
          movieId !== null ? eq(listEntries.movieId, movieId) : eq(listEntries.tvSeriesId, tvSeriesId ?? -1),
        ),
      );

    return rows;
  }

  static async listAllForAdmin(filters: { userId?: string }, limit: number, offset: number) {
    return db
      .select({
        id: lists.id,
        userId: lists.userId,
        authorUsername: user.username,
        title: lists.title,
        isPublic: lists.isPublic,
        isRanked: lists.isRanked,
        derivedType: lists.derivedType,
        itemCount: sql<number>`count(${listEntries.id})`.mapWith(Number),
        createdAt: lists.createdAt,
      })
      .from(lists)
      .innerJoin(user, eq(user.id, lists.userId))
      .leftJoin(listEntries, eq(listEntries.listId, lists.id))
      .where(filters.userId ? eq(lists.userId, filters.userId) : undefined)
      .groupBy(lists.id, user.username)
      .orderBy(desc(lists.createdAt))
      .limit(limit)
      .offset(offset);
  }
}
