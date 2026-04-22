import { desc, eq, sql } from "drizzle-orm";
import { db } from "../../../infrastructure/database/db";
import { user } from "../../../infrastructure/database/auth.entity";
import { movies } from "../../movies/movies.entity";
import { tvSeries } from "../../serials/serials.entity";
import { reviews, reviewLikes } from "../../reviews/reviews.entity";
import { lists, listLikes, listEntries } from "../../lists/lists.entity";
import { profiles } from "../users.entity";

export class UsersLikesRepository {
  static async getLikedReviews(userId: string) {
    const rows = await db
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
      .orderBy(desc(reviewLikes.createdAt));

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

  static async getLikedLists(userId: string) {
    const likedRows = await db
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
      .orderBy(desc(listLikes.createdAt));

    if (likedRows.length === 0) return [];

    const listIds = likedRows.map((r) => r.listId);

    // Get item counts
    const { inArray, count } = await import("drizzle-orm");
    const countRows = await db
      .select({ listId: listEntries.listId, n: count() })
      .from(listEntries)
      .where(inArray(listEntries.listId, listIds))
      .groupBy(listEntries.listId);
    const countMap = new Map(countRows.map((r) => [r.listId, Number(r.n)]));

    // Get cover images (first 4 per list)
    const coverRows = await db
      .select({
        listId: listEntries.listId,
        itemType: listEntries.itemType,
        moviePoster: movies.posterPath,
        serialPoster: tvSeries.posterPath,
      })
      .from(listEntries)
      .leftJoin(movies, eq(listEntries.movieId, movies.id))
      .leftJoin(tvSeries, eq(listEntries.tvSeriesId, tvSeries.id))
      .where(inArray(listEntries.listId, listIds))
      .orderBy(listEntries.position);

    const coversByList = new Map<string, Array<{ itemType: string; posterPath: string | null }>>();
    for (const row of coverRows) {
      const arr = coversByList.get(row.listId) ?? [];
      if (arr.length < 4) {
        arr.push({
          itemType: row.itemType,
          posterPath: row.moviePoster ?? row.serialPoster ?? null,
        });
        coversByList.set(row.listId, arr);
      }
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
