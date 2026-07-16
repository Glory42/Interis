import { count, desc, eq, inArray, sql } from "drizzle-orm";
import { db } from "../../../infrastructure/database/db";
import { user } from "../../../infrastructure/database/auth.entity";
import { movies } from "../../movies/movies.entity";
import { reviews, reviewLikes } from "../../reviews/reviews.entity";
import { lists, listLikes, listEntries } from "../../lists/lists.entity";

export class UsersLikesRepository {
  static async getLikedReviews(userId: string, limit?: number, offset?: number) {
    const baseQuery = db
      .select({
        id: reviews.id,
        content: reviews.content,
        containsSpoilers: reviews.containsSpoilers,
        createdAt: reviews.createdAt,
        likedAt: reviewLikes.createdAt,
        mediaType: reviews.mediaType,
        mediaSourceId: reviews.mediaSourceId,
        movieId: reviews.movieId,
        reviewerUserId: reviews.userId,
        reviewerUsername: user.username,
        reviewerDisplayUsername: user.displayUsername,
        movieTitle: movies.title,
        moviePosterPath: movies.posterPath,
        movieTmdbId: movies.tmdbId,
        movieReleaseYear: movies.releaseYear,
      })
      .from(reviewLikes)
      .innerJoin(reviews, eq(reviewLikes.reviewId, reviews.id))
      .innerJoin(user, eq(reviews.userId, user.id))
      .leftJoin(movies, eq(reviews.movieId, movies.id))
      .where(eq(reviewLikes.userId, userId))
      .orderBy(desc(reviewLikes.createdAt))
      .$dynamic();

    const rows = await (limit ? baseQuery.limit(limit).offset(offset ?? 0) : baseQuery);

    return rows.map((row) => ({
      id: row.id,
      content: row.content,
      containsSpoilers: row.containsSpoilers,
      createdAt: row.createdAt.toISOString(),
      likedAt: row.likedAt.toISOString(),
      mediaType: row.mediaType as "movie" | "tv",
      mediaSourceId: row.mediaSourceId,
      reviewerUsername: row.reviewerUsername,
      reviewerDisplayUsername: row.reviewerDisplayUsername,
      mediaTitle: row.movieTitle ?? null,
      mediaPosterPath: row.moviePosterPath ?? null,
      mediaTmdbId: row.movieTmdbId ?? (row.mediaType === "tv" ? Number(row.mediaSourceId) : null),
      mediaReleaseYear: row.movieReleaseYear ?? null,
    }));
  }

  static async getLikedLists(userId: string, limit?: number, offset?: number) {
    const baseQuery = db
      .select({
        listId: listLikes.listId,
        likedAt: listLikes.createdAt,
        title: lists.title,
        description: lists.description,
        isRanked: lists.isRanked,
        isPublic: lists.isPublic,
        derivedType: lists.derivedType,
        createdAt: lists.createdAt,
        updatedAt: lists.updatedAt,
        ownerUserId: lists.userId,
        ownerUsername: user.username,
        ownerDisplayUsername: user.displayUsername,
      })
      .from(listLikes)
      .innerJoin(lists, eq(listLikes.listId, lists.id))
      .innerJoin(user, eq(lists.userId, user.id))
      .where(eq(listLikes.userId, userId))
      .orderBy(desc(listLikes.createdAt))
      .$dynamic();

    const likedRows = await (limit ? baseQuery.limit(limit).offset(offset ?? 0) : baseQuery);

    if (likedRows.length === 0) return [];

    const listIds = likedRows.map((r) => r.listId);

    const countRows = await db
      .select({ listId: listEntries.listId, n: count() })
      .from(listEntries)
      .where(inArray(listEntries.listId, listIds))
      .groupBy(listEntries.listId);
    const countMap = new Map(countRows.map((r) => [r.listId, Number(r.n)]));

    // First 4 cover images per list via window function — avoids loading all entries
    const coverRows = await db.execute<{
      list_id: string;
      item_type: string;
      poster_path: string | null;
    }>(sql`
      WITH ranked AS (
        SELECT
          le.list_id,
          le.item_type,
          COALESCE(m.poster_path, ts.poster_path) AS poster_path,
          ROW_NUMBER() OVER (PARTITION BY le.list_id ORDER BY le.position) AS rn
        FROM list_entries le
        LEFT JOIN movies m ON le.movie_id = m.id
        LEFT JOIN tv_series ts ON le.tv_series_id = ts.id
        WHERE le.list_id = ANY(${listIds})
      )
      SELECT list_id, item_type, poster_path FROM ranked WHERE rn <= 4
    `);

    const coversByList = new Map<string, Array<{ itemType: string; posterPath: string | null }>>();
    for (const row of coverRows.rows) {
      const arr = coversByList.get(row.list_id) ?? [];
      arr.push({ itemType: row.item_type, posterPath: row.poster_path });
      coversByList.set(row.list_id, arr);
    }

    return likedRows.map((row) => ({
      id: row.listId,
      title: row.title,
      description: row.description,
      isRanked: row.isRanked,
      isPublic: row.isPublic,
      derivedType: row.derivedType,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
      likedAt: row.likedAt.toISOString(),
      itemCount: countMap.get(row.listId) ?? 0,
      coverImages: coversByList.get(row.listId) ?? [],
      ownerUsername: row.ownerUsername,
      ownerDisplayUsername: row.ownerDisplayUsername,
    }));
  }
}
