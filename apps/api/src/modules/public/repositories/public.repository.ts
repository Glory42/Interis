import { and, asc, desc, eq, inArray } from "drizzle-orm";
import { db } from "../../../infrastructure/database/db";
import { user } from "../../../infrastructure/database/auth.entity";
import { listEntries, lists } from "../../lists/lists.entity";
import { movies } from "../../movies/movies.entity";
import { reviews } from "../../reviews/reviews.entity";
import { serialDiaryEntries, tvSeries } from "../../serials/serials.entity";

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
        id: serialDiaryEntries.id,
        watchedDate: serialDiaryEntries.watchedDate,
        rating: serialDiaryEntries.rating,
        rewatch: serialDiaryEntries.rewatch,
        createdAt: serialDiaryEntries.createdAt,
        updatedAt: serialDiaryEntries.updatedAt,
        tmdbId: tvSeries.tmdbId,
        title: tvSeries.title,
        posterPath: tvSeries.posterPath,
        releaseYear: tvSeries.firstAirYear,
        reviewId: reviews.id,
        reviewContent: reviews.content,
        reviewContainsSpoilers: reviews.containsSpoilers,
        reviewCreatedAt: reviews.createdAt,
      })
      .from(serialDiaryEntries)
      .innerJoin(tvSeries, eq(tvSeries.id, serialDiaryEntries.seriesId))
      .leftJoin(
        reviews,
        and(
          eq(reviews.userId, serialDiaryEntries.userId),
          eq(reviews.diaryEntryId, serialDiaryEntries.id),
          eq(reviews.mediaType, "tv"),
        ),
      )
      .where(eq(serialDiaryEntries.userId, userId))
      .orderBy(desc(serialDiaryEntries.watchedDate), desc(serialDiaryEntries.createdAt))
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
        tmdbId: movies.tmdbId,
        title: movies.title,
        posterPath: movies.posterPath,
        releaseYear: movies.releaseYear,
      })
      .from(listEntries)
      .innerJoin(movies, eq(movies.id, listEntries.movieId))
      .where(inArray(listEntries.listId, listIds))
      .orderBy(asc(listEntries.listId), asc(listEntries.position), asc(listEntries.createdAt));
  }
}
