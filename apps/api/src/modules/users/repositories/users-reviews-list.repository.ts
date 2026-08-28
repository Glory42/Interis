import { and, eq, inArray, sql } from "drizzle-orm";
import { db } from "../../../infrastructure/database/db";
import { mergeSortedPaginated } from "../../../commons/helpers/merge-sorted-paginated.helper";
import { diaryEntries } from "../../diary/diary.entity";
import { reviews } from "../../reviews/reviews.entity";
import { serialDiaryEntries, tvSeries } from "../../serials/serials.entity";
import { movies } from "../../movies/movies.entity";
import { albums, musicDiaryEntries } from "../../music/music.entity";
import { bookDiaryEntries, books } from "../../books/books.entity";

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

    const albumQ = db
      .select({
        id: reviews.id,
        content: reviews.content,
        containsSpoilers: reviews.containsSpoilers,
        createdAt: reviews.createdAt,
        updatedAt: reviews.updatedAt,
        mbid: albums.mbid,
        title: albums.title,
        coverArtUrl: albums.coverArtUrl,
        artistName: albums.artistName,
        releaseYear: albums.firstReleaseYear,
        rating: musicDiaryEntries.rating,
        mediaType: sql<"album">`'album'`,
      })
      .from(reviews)
      .innerJoin(albums, eq(albums.mbid, reviews.mediaSourceId))
      .leftJoin(musicDiaryEntries, eq(reviews.diaryEntryId, musicDiaryEntries.id))
      .where(and(eq(reviews.userId, userId), eq(reviews.mediaType, "album")));

    const bookQ = db
      .select({
        id: reviews.id,
        content: reviews.content,
        containsSpoilers: reviews.containsSpoilers,
        createdAt: reviews.createdAt,
        updatedAt: reviews.updatedAt,
        volumeId: books.googleVolumeId,
        title: books.title,
        coverArtUrl: books.coverImageUrl,
        authors: books.authors,
        releaseYear: books.publishedYear,
        rating: bookDiaryEntries.rating,
        mediaType: sql<"book">`'book'`,
      })
      .from(reviews)
      .innerJoin(books, eq(books.googleVolumeId, reviews.mediaSourceId))
      .leftJoin(bookDiaryEntries, eq(reviews.diaryEntryId, bookDiaryEntries.id))
      .where(and(eq(reviews.userId, userId), eq(reviews.mediaType, "book")));

    const [movieReviewRows, tvReviewRows, albumReviewRows, bookReviewRows] = await Promise.all([
      fetchCap ? movieQ.limit(fetchCap) : movieQ,
      fetchCap ? tvQ.limit(fetchCap) : tvQ,
      fetchCap ? albumQ.limit(fetchCap) : albumQ,
      fetchCap ? bookQ.limit(fetchCap) : bookQ,
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

    const normalizedAlbumReviewRows = albumReviewRows.map((reviewRow) => ({
      id: reviewRow.id,
      content: reviewRow.content,
      containsSpoilers: reviewRow.containsSpoilers,
      createdAt: reviewRow.createdAt,
      updatedAt: reviewRow.updatedAt,
      mbid: reviewRow.mbid,
      title: reviewRow.title,
      coverArtUrl: reviewRow.coverArtUrl,
      artistName: reviewRow.artistName,
      releaseYear: reviewRow.releaseYear,
      rating: reviewRow.rating,
      mediaType: "album" as const,
    }));

    const normalizedBookReviewRows = bookReviewRows.map((reviewRow) => ({
      id: reviewRow.id,
      content: reviewRow.content,
      containsSpoilers: reviewRow.containsSpoilers,
      createdAt: reviewRow.createdAt,
      updatedAt: reviewRow.updatedAt,
      volumeId: reviewRow.volumeId,
      title: reviewRow.title,
      coverArtUrl: reviewRow.coverArtUrl,
      authors: reviewRow.authors as string[],
      releaseYear: reviewRow.releaseYear,
      rating: reviewRow.rating,
      mediaType: "book" as const,
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

    return mergeSortedPaginated(
      [
        ...normalizedMovieReviewRows,
        ...serialReviewRows,
        ...normalizedAlbumReviewRows,
        ...normalizedBookReviewRows,
      ],
      limit,
      offset,
      (row) => row.createdAt.getTime(),
    );
  }
}
