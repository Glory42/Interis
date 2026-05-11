import { and, eq, sql } from "drizzle-orm";
import { db } from "../../../infrastructure/database/db";
import { movieInteractions } from "../../interactions/interactions.entity";
import { movies } from "../../movies/movies.entity";
import { serialInteractions, tvSeries } from "../../serials/serials.entity";
import { musicInteractions, albums } from "../../music/music.entity";
import { bookInteractions, books } from "../../books/books.entity";

export class UsersMediaInteractionsRepository {
  static async getLikedFilms(userId: string) {
    const [movieRows, serialRows, albumRows, bookRows] = await Promise.all([
      db
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
        .where(and(eq(movieInteractions.userId, userId), eq(movieInteractions.liked, true))),
      db
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
        .where(and(eq(serialInteractions.userId, userId), eq(serialInteractions.liked, true))),
      db
        .select({
          mbid: albums.mbid,
          title: albums.title,
          coverArtUrl: albums.coverArtUrl,
          releaseYear: albums.firstReleaseYear,
          artistName: albums.artistName,
          mediaType: sql<"album">`'album'`,
          lastInteractionAt: musicInteractions.updatedAt,
        })
        .from(musicInteractions)
        .innerJoin(albums, eq(musicInteractions.albumId, albums.id))
        .where(and(eq(musicInteractions.userId, userId), eq(musicInteractions.liked, true))),
      db
        .select({
          volumeId: books.googleVolumeId,
          title: books.title,
          coverImageUrl: books.coverImageUrl,
          releaseYear: books.publishedYear,
          authors: books.authors,
          mediaType: sql<"book">`'book'`,
          lastInteractionAt: bookInteractions.updatedAt,
        })
        .from(bookInteractions)
        .innerJoin(books, eq(bookInteractions.bookId, books.id))
        .where(and(eq(bookInteractions.userId, userId), eq(bookInteractions.liked, true))),
    ]);

    return [...movieRows, ...serialRows, ...albumRows, ...bookRows].sort(
      (left, right) => right.lastInteractionAt.getTime() - left.lastInteractionAt.getTime(),
    );
  }

  static async getWatchlistedFilms(userId: string) {
    const [movieRows, serialRows, albumRows, bookRows] = await Promise.all([
      db
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
          and(eq(movieInteractions.userId, userId), eq(movieInteractions.watchlisted, true)),
        ),
      db
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
          and(eq(serialInteractions.userId, userId), eq(serialInteractions.watchlisted, true)),
        ),
      db
        .select({
          mbid: albums.mbid,
          title: albums.title,
          coverArtUrl: albums.coverArtUrl,
          releaseYear: albums.firstReleaseYear,
          artistName: albums.artistName,
          mediaType: sql<"album">`'album'`,
          lastInteractionAt: musicInteractions.updatedAt,
        })
        .from(musicInteractions)
        .innerJoin(albums, eq(musicInteractions.albumId, albums.id))
        .where(and(eq(musicInteractions.userId, userId), eq(musicInteractions.wantToListen, true))),
      db
        .select({
          volumeId: books.googleVolumeId,
          title: books.title,
          coverImageUrl: books.coverImageUrl,
          releaseYear: books.publishedYear,
          authors: books.authors,
          mediaType: sql<"book">`'book'`,
          lastInteractionAt: bookInteractions.updatedAt,
        })
        .from(bookInteractions)
        .innerJoin(books, eq(bookInteractions.bookId, books.id))
        .where(and(eq(bookInteractions.userId, userId), eq(bookInteractions.wantToRead, true))),
    ]);

    return [...movieRows, ...serialRows, ...albumRows, ...bookRows].sort(
      (left, right) => right.lastInteractionAt.getTime() - left.lastInteractionAt.getTime(),
    );
  }
}
