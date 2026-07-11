import { and, eq, inArray, sql } from "drizzle-orm";
import { db } from "../../../infrastructure/database/db";
import { diaryEntries } from "../../diary/diary.entity";
import { reviews } from "../../reviews/reviews.entity";
import { serialDiaryEntries, tvSeries } from "../../serials/serials.entity";
import { movies } from "../../movies/movies.entity";

export class UsersReviewsListRepository {
  static async getReviewsWithMovies(userId: string, limit?: number, offset?: number) {
    // Fetch enough of each source to cover through offset+limit, then merge,
    // sort, and slice the exact page - avoids ever pulling the whole
    // collection just to paginate it.
    const fetchCap = limit ? limit + (offset ?? 0) : undefined;

    const movieQ = db
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
      .where(and(eq(reviews.userId, userId), eq(reviews.mediaType, "movie")));

    const tvQ = db
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
      .where(and(eq(reviews.userId, userId), eq(reviews.mediaType, "tv")));

    const [movieReviewRows, tvReviewRows] = await Promise.all([
      fetchCap ? movieQ.limit(fetchCap) : movieQ,
      fetchCap ? tvQ.limit(fetchCap) : tvQ,
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
      rating: reviewRow.rating,
      mediaType: "movie" as const,
    }));

    const tvTmdbIds = tvReviewRows
      .map((reviewRow) => Number(reviewRow.tmdbId))
      .filter((tmdbId) => Number.isInteger(tmdbId) && tmdbId > 0);

    const tvRows = tvTmdbIds.length
      ? await db.select().from(tvSeries).where(inArray(tvSeries.tmdbId, tvTmdbIds))
      : [];

    const tvSeriesByTmdbId = new Map(tvRows.map((row) => [row.tmdbId, row]));

    const serialReviewRows = tvReviewRows
      .map((reviewRow) => {
        const tmdbId = Number(reviewRow.tmdbId);
        if (!Number.isInteger(tmdbId) || tmdbId <= 0) {
          return null;
        }

        const series = tvSeriesByTmdbId.get(tmdbId);

        return {
          id: reviewRow.id,
          content: reviewRow.content,
          containsSpoilers: reviewRow.containsSpoilers,
          createdAt: reviewRow.createdAt,
          updatedAt: reviewRow.updatedAt,
          tmdbId,
          title: series?.title ?? "Unknown series",
          posterPath: series?.posterPath ?? null,
          releaseYear: series?.firstAirYear ?? null,
          rating: reviewRow.rating,
          mediaType: "tv" as const,
        };
      })
      .filter((reviewRow): reviewRow is NonNullable<typeof reviewRow> => reviewRow !== null);

    const merged = [...normalizedMovieReviewRows, ...serialReviewRows].sort(
      (leftReview, rightReview) =>
        rightReview.createdAt.getTime() - leftReview.createdAt.getTime()
    );

    return limit ? merged.slice(offset ?? 0, (offset ?? 0) + limit) : merged;
  }
}
