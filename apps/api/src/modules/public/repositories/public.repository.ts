import { and, asc, desc, eq, inArray, sql } from "drizzle-orm";
import { db } from "../../../infrastructure/database/db";
import { user } from "../../../infrastructure/database/auth.entity";
import { listEntries, lists } from "../../lists/lists.entity";
import { films } from "../../films/films.entity";
import { reviews } from "../../reviews/reviews.entity";
import {
  seriesDiaryEntries,
  seriesInteractions,
  tvSeries,
} from "../../tv/tv.entity";

export class PublicRepository {
  static async findUserIdByUsername(username: string): Promise<string | null> {
    const [profile] = await db
      .select({ id: user.id })
      .from(user)
      .where(eq(user.username, username))
      .limit(1);

    return profile?.id ?? null;
  }

  static async findSerialDiaryEntriesByUser(userId: string, fetchCap: number) {
    return db
      .select({
        id: seriesDiaryEntries.id,
        watchedDate: seriesDiaryEntries.watchedDate,
        rating: seriesDiaryEntries.rating,
        rewatch: seriesDiaryEntries.rewatch,
        createdAt: seriesDiaryEntries.createdAt,
        updatedAt: seriesDiaryEntries.updatedAt,
        tmdbId: tvSeries.tmdbId,
        title: tvSeries.title,
        posterPath: tvSeries.posterPath,
        releaseYear: tvSeries.firstAirYear,
        reviewId: reviews.id,
        reviewContent: reviews.content,
        reviewContainsSpoilers: reviews.containsSpoilers,
        reviewCreatedAt: reviews.createdAt,
        liked: sql<boolean>`coalesce(${seriesInteractions.liked}, false)`,
      })
      .from(seriesDiaryEntries)
      .innerJoin(tvSeries, eq(tvSeries.id, seriesDiaryEntries.seriesId))
      .leftJoin(
        reviews,
        and(
          eq(reviews.userId, seriesDiaryEntries.userId),
          eq(reviews.serialDiaryEntryId, seriesDiaryEntries.id),
          eq(reviews.mediaType, "tv"),
        ),
      )
      .leftJoin(
        seriesInteractions,
        and(
          eq(seriesInteractions.userId, seriesDiaryEntries.userId),
          eq(seriesInteractions.seriesId, seriesDiaryEntries.seriesId),
        ),
      )
      .where(eq(seriesDiaryEntries.userId, userId))
      .orderBy(desc(seriesDiaryEntries.watchedDate), desc(seriesDiaryEntries.createdAt))
      .limit(fetchCap);
  }

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
