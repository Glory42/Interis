import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { db } from "../../../infrastructure/database/db";
import { user } from "../../../infrastructure/database/auth.entity";
import { diaryEntries } from "../../diary/diary.entity";
import { comments, reviewLikes, reviews } from "../../reviews/reviews.entity";
import { serialDiaryEntries, tvSeries } from "../../serials/serials.entity";
import { movies } from "../../movies/movies.entity";
import { profiles } from "../users.entity";

const toRatingOutOfFive = (ratingOutOfTen: number | null): number | null => {
  if (ratingOutOfTen === null) {
    return null;
  }

  return Number((ratingOutOfTen / 2).toFixed(1));
};

export class UsersReviewsRepository {
  static async getReviewsWithMovies(userId: string) {
    const [movieReviewRows, tvReviewRows] = await Promise.all([
      db
        .select({
          id: reviews.id,
          content: reviews.content,
          containsSpoilers: reviews.containsSpoilers,
          createdAt: reviews.createdAt,
          updatedAt: reviews.updatedAt,
          tmdbId: movies.tmdbId,
          title: movies.title,
          posterPath: movies.posterPath,
          releaseYear: movies.releaseYear,
          rating: diaryEntries.rating,
          mediaType: sql<"movie">`'movie'`,
        })
        .from(reviews)
        .innerJoin(movies, eq(reviews.movieId, movies.id))
        .leftJoin(diaryEntries, eq(reviews.diaryEntryId, diaryEntries.id))
        .where(and(eq(reviews.userId, userId), eq(reviews.mediaType, "movie"))),
      db
        .select({
          id: reviews.id,
          content: reviews.content,
          containsSpoilers: reviews.containsSpoilers,
          createdAt: reviews.createdAt,
          updatedAt: reviews.updatedAt,
          tmdbId: reviews.mediaSourceId,
          rating: serialDiaryEntries.rating,
          mediaType: sql<"tv">`'tv'`,
        })
        .from(reviews)
        .leftJoin(serialDiaryEntries, eq(reviews.diaryEntryId, serialDiaryEntries.id))
        .where(and(eq(reviews.userId, userId), eq(reviews.mediaType, "tv"))),
    ]);

    const normalizedMovieReviewRows = movieReviewRows.map((reviewRow) => ({
      id: reviewRow.id,
      content: reviewRow.content,
      containsSpoilers: reviewRow.containsSpoilers,
      createdAt: reviewRow.createdAt,
      updatedAt: reviewRow.updatedAt,
      tmdbId: reviewRow.tmdbId,
      title: reviewRow.title,
      posterPath: reviewRow.posterPath,
      releaseYear: reviewRow.releaseYear,
      ratingOutOfFive: toRatingOutOfFive(reviewRow.rating),
      mediaType: "movie" as const,
    }));

    const tvTmdbIds = tvReviewRows
      .map((reviewRow) => Number(reviewRow.tmdbId))
      .filter((tmdbId) => Number.isInteger(tmdbId) && tmdbId > 0);

    const tvRows = tvTmdbIds.length
      ? await db
          .select({
            tmdbId: tvSeries.tmdbId,
            title: tvSeries.title,
            posterPath: tvSeries.posterPath,
            releaseYear: tvSeries.firstAirYear,
          })
          .from(tvSeries)
          .where(inArray(tvSeries.tmdbId, [...new Set(tvTmdbIds)]))
      : [];

    const tvByTmdbId = new Map(tvRows.map((tvRow) => [tvRow.tmdbId, tvRow]));

    const serialReviewRows = tvReviewRows
      .map((reviewRow) => {
        const tmdbId = Number(reviewRow.tmdbId);
        if (!Number.isInteger(tmdbId) || tmdbId <= 0) {
          return null;
        }

        const series = tvByTmdbId.get(tmdbId);

        return {
          id: reviewRow.id,
          content: reviewRow.content,
          containsSpoilers: reviewRow.containsSpoilers,
          createdAt: reviewRow.createdAt,
          updatedAt: reviewRow.updatedAt,
          tmdbId,
          title: series?.title ?? "Unknown series",
          posterPath: series?.posterPath ?? null,
          releaseYear: series?.releaseYear ?? null,
          ratingOutOfFive: toRatingOutOfFive(reviewRow.rating),
          mediaType: "tv" as const,
        };
      })
      .filter((reviewRow): reviewRow is NonNullable<typeof reviewRow> => reviewRow !== null);

    return [...normalizedMovieReviewRows, ...serialReviewRows].sort(
      (leftReview, rightReview) =>
        rightReview.createdAt.getTime() - leftReview.createdAt.getTime(),
    );
  }

  static async getReviewDetailByUsername(
    username: string,
    reviewId: string,
    viewerUserId?: string | null,
  ) {
    const [reviewRow] = await db
      .select({
        id: reviews.id,
        content: reviews.content,
        containsSpoilers: reviews.containsSpoilers,
        createdAt: reviews.createdAt,
        updatedAt: reviews.updatedAt,
        diaryEntryId: reviews.diaryEntryId,
        mediaType: reviews.mediaType,
        mediaSourceId: reviews.mediaSourceId,
        movieId: reviews.movieId,
        authorId: user.id,
        authorUsername: user.username,
        authorDisplayUsername: user.displayUsername,
        authorImage: user.image,
        authorAvatarUrl: profiles.avatarUrl,
      })
      .from(reviews)
      .innerJoin(user, eq(reviews.userId, user.id))
      .leftJoin(profiles, eq(profiles.userId, user.id))
      .where(and(eq(user.username, username), eq(reviews.id, reviewId)))
      .limit(1);

    if (!reviewRow) {
      return null;
    }

    const [likeRow, commentRow, viewerLikeRow] = await Promise.all([
      db
        .select({ count: sql<number>`count(*)::int`.as("count") })
        .from(reviewLikes)
        .where(eq(reviewLikes.reviewId, reviewId))
        .limit(1),
      db
        .select({ count: sql<number>`count(*)::int`.as("count") })
        .from(comments)
        .where(eq(comments.reviewId, reviewId))
        .limit(1),
      viewerUserId
        ? db
            .select({ reviewId: reviewLikes.reviewId })
            .from(reviewLikes)
            .where(
              and(
                eq(reviewLikes.userId, viewerUserId),
                eq(reviewLikes.reviewId, reviewId),
              ),
            )
            .limit(1)
        : Promise.resolve([]),
    ]);

    if (reviewRow.mediaType === "movie") {
      const [movieRow, diaryRow] = await Promise.all([
        reviewRow.movieId !== null
          ? db
              .select({
                tmdbId: movies.tmdbId,
                title: movies.title,
                posterPath: movies.posterPath,
                releaseYear: movies.releaseYear,
                genres: movies.genres,
                director: movies.director,
              })
              .from(movies)
              .where(eq(movies.id, reviewRow.movieId))
              .limit(1)
          : Promise.resolve([]),
        reviewRow.diaryEntryId
          ? db
              .select({ ratingOutOfTen: diaryEntries.rating })
              .from(diaryEntries)
              .where(eq(diaryEntries.id, reviewRow.diaryEntryId))
              .limit(1)
          : Promise.resolve([]),
      ]);

      const tmdbId = movieRow[0]?.tmdbId ?? Number(reviewRow.mediaSourceId);

      if (!Number.isInteger(tmdbId) || tmdbId <= 0) {
        return null;
      }

      const ratingOutOfTen = diaryRow[0]?.ratingOutOfTen ?? null;

      return {
        id: reviewRow.id,
        mediaType: "movie" as const,
        content: reviewRow.content,
        containsSpoilers: reviewRow.containsSpoilers,
        createdAt: reviewRow.createdAt,
        updatedAt: reviewRow.updatedAt,
        ratingOutOfTen,
        ratingOutOfFive: toRatingOutOfFive(ratingOutOfTen),
        author: {
          id: reviewRow.authorId,
          username: reviewRow.authorUsername,
          displayUsername: reviewRow.authorDisplayUsername,
          image: reviewRow.authorImage,
          avatarUrl: reviewRow.authorAvatarUrl,
        },
        media: {
          tmdbId,
          title: movieRow[0]?.title ?? "Unknown movie",
          posterPath: movieRow[0]?.posterPath ?? null,
          releaseYear: movieRow[0]?.releaseYear ?? null,
          genres: movieRow[0]?.genres ?? [],
          director: movieRow[0]?.director ?? null,
          creator: null,
        },
        engagement: {
          likeCount: likeRow[0]?.count ?? 0,
          commentCount: commentRow[0]?.count ?? 0,
          viewerHasLiked: viewerUserId ? viewerLikeRow.length > 0 : null,
        },
      };
    }

    if (reviewRow.mediaType === "tv") {
      const tmdbId = Number(reviewRow.mediaSourceId);

      if (!Number.isInteger(tmdbId) || tmdbId <= 0) {
        return null;
      }

      const [seriesRow, serialDiaryRow] = await Promise.all([
        db
          .select({
            tmdbId: tvSeries.tmdbId,
            title: tvSeries.title,
            posterPath: tvSeries.posterPath,
            releaseYear: tvSeries.firstAirYear,
            genres: tvSeries.genres,
            creator: tvSeries.creator,
          })
          .from(tvSeries)
          .where(eq(tvSeries.tmdbId, tmdbId))
          .limit(1),
        reviewRow.diaryEntryId
          ? db
              .select({ ratingOutOfTen: serialDiaryEntries.rating })
              .from(serialDiaryEntries)
              .where(eq(serialDiaryEntries.id, reviewRow.diaryEntryId))
              .limit(1)
          : Promise.resolve([]),
      ]);

      const ratingOutOfTen = serialDiaryRow[0]?.ratingOutOfTen ?? null;

      return {
        id: reviewRow.id,
        mediaType: "tv" as const,
        content: reviewRow.content,
        containsSpoilers: reviewRow.containsSpoilers,
        createdAt: reviewRow.createdAt,
        updatedAt: reviewRow.updatedAt,
        ratingOutOfTen,
        ratingOutOfFive: toRatingOutOfFive(ratingOutOfTen),
        author: {
          id: reviewRow.authorId,
          username: reviewRow.authorUsername,
          displayUsername: reviewRow.authorDisplayUsername,
          image: reviewRow.authorImage,
          avatarUrl: reviewRow.authorAvatarUrl,
        },
        media: {
          tmdbId,
          title: seriesRow[0]?.title ?? "Unknown series",
          posterPath: seriesRow[0]?.posterPath ?? null,
          releaseYear: seriesRow[0]?.releaseYear ?? null,
          genres: seriesRow[0]?.genres ?? [],
          director: null,
          creator: seriesRow[0]?.creator ?? null,
        },
        engagement: {
          likeCount: likeRow[0]?.count ?? 0,
          commentCount: commentRow[0]?.count ?? 0,
          viewerHasLiked: viewerUserId ? viewerLikeRow.length > 0 : null,
        },
      };
    }

    return null;
  }
}
