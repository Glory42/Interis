import { and, desc, eq, sql } from "drizzle-orm";
import { db } from "../../../infrastructure/database/db";
import { applyOptionalPagination } from "../../../commons/helpers/db-pagination.helper";
import { mergeSortedPaginated } from "../../../commons/helpers/merge-sorted-paginated.helper";
import { movieInteractions } from "../../interactions/interactions.entity";
import { movies } from "../../movies/movies.entity";
import { serialInteractions, tvSeries } from "../../serials/serials.entity";
import { musicInteractions, albums } from "../../music/music.entity";
import { bookInteractions, books } from "../../books/books.entity";

export type MediaInteractionFlag = "liked" | "watchlisted";

export class UsersMediaInteractionsRepository {
  static async getWatchedFilms(userId: string, limit?: number, offset?: number) {
    const baseQuery = db
      .select({
        tmdbId: movies.tmdbId,
        title: movies.title,
        posterPath: movies.posterPath,
        releaseYear: movies.releaseYear,
        runtime: movies.runtime,
        genres: movies.genres,
        mediaType: sql<"movie">`'movie'`,
        lastInteractionAt: movieInteractions.updatedAt,
      })
      .from(movieInteractions)
      .innerJoin(movies, eq(movieInteractions.movieId, movies.id))
      .where(and(eq(movieInteractions.userId, userId), eq(movieInteractions.isWatched, true)))
      .orderBy(desc(movieInteractions.updatedAt))
      .$dynamic();

    return applyOptionalPagination(baseQuery, limit, offset);
  }

  static async getFilmsByFlag(
    userId: string,
    flag: MediaInteractionFlag,
    limit?: number,
    offset?: number,
  ) {
    // Fetch enough of each source to cover through offset+limit, then merge,
    // sort, and slice the exact page - avoids ever pulling the whole
    // collection just to paginate it.
    const fetchCap = limit ? limit + (offset ?? 0) : undefined;

    const movieQ = db
      .select({
        tmdbId: movies.tmdbId,
        title: movies.title,
        posterPath: movies.posterPath,
        releaseYear: movies.releaseYear,
        runtime: movies.runtime,
        genres: movies.genres,
        mediaType: sql<"movie">`'movie'`,
        lastInteractionAt: movieInteractions.updatedAt,
      })
      .from(movieInteractions)
      .innerJoin(movies, eq(movieInteractions.movieId, movies.id))
      .where(
        and(
          eq(movieInteractions.userId, userId),
          flag === "liked"
            ? eq(movieInteractions.liked, true)
            : eq(movieInteractions.watchlisted, true),
        ),
      );

    const serialQ = db
      .select({
        tmdbId: tvSeries.tmdbId,
        title: tvSeries.title,
        posterPath: tvSeries.posterPath,
        releaseYear: tvSeries.firstAirYear,
        runtime: tvSeries.episodeRuntime,
        genres: tvSeries.genres,
        mediaType: sql<"tv">`'tv'`,
        lastInteractionAt: serialInteractions.updatedAt,
      })
      .from(serialInteractions)
      .innerJoin(tvSeries, eq(serialInteractions.seriesId, tvSeries.id))
      .where(
        and(
          eq(serialInteractions.userId, userId),
          flag === "liked"
            ? eq(serialInteractions.liked, true)
            : eq(serialInteractions.watchlisted, true),
        ),
      );

    const albumQ = db
      .select({
        mbid: albums.mbid,
        title: albums.title,
        coverArtUrl: albums.coverArtUrl,
        artistName: albums.artistName,
        releaseYear: albums.firstReleaseYear,
        mediaType: sql<"album">`'album'`,
        lastInteractionAt: musicInteractions.updatedAt,
      })
      .from(musicInteractions)
      .innerJoin(albums, eq(musicInteractions.albumId, albums.id))
      .where(
        and(
          eq(musicInteractions.userId, userId),
          flag === "liked"
            ? eq(musicInteractions.liked, true)
            : eq(musicInteractions.wantToListen, true),
        ),
      );

    const bookQ = db
      .select({
        volumeId: books.googleVolumeId,
        title: books.title,
        coverArtUrl: books.coverImageUrl,
        authors: books.authors,
        releaseYear: books.publishedYear,
        mediaType: sql<"book">`'book'`,
        lastInteractionAt: bookInteractions.updatedAt,
      })
      .from(bookInteractions)
      .innerJoin(books, eq(bookInteractions.bookId, books.id))
      .where(
        and(
          eq(bookInteractions.userId, userId),
          flag === "liked" ? eq(bookInteractions.liked, true) : eq(bookInteractions.wantToRead, true),
        ),
      );

    const [movieRows, serialRows, albumRows, bookRows] = await Promise.all([
      fetchCap ? movieQ.limit(fetchCap) : movieQ,
      fetchCap ? serialQ.limit(fetchCap) : serialQ,
      fetchCap ? albumQ.limit(fetchCap) : albumQ,
      fetchCap ? bookQ.limit(fetchCap) : bookQ,
    ]);

    return mergeSortedPaginated(
      [...movieRows, ...serialRows, ...albumRows, ...bookRows],
      limit,
      offset,
      (row) => row.lastInteractionAt.getTime(),
    );
  }
}
