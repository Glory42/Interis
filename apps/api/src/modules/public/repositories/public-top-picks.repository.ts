import { inArray } from "drizzle-orm";
import { db } from "../../../infrastructure/database/db";
import { movies } from "../../movies/movies.entity";
import { tvSeries } from "../../serials/serials.entity";
import { albums } from "../../music/music.entity";
import { books } from "../../books/books.entity";
import { UsersTopPicksRepository } from "../../users/repositories/users-top-picks.repository";

export class PublicTopPicksRepository {
  static getTopPicksByUserId(userId: string) {
    return UsersTopPicksRepository.getTopPicksByUserId(userId);
  }

  static async getMoviesByTmdbIds(tmdbIds: number[]) {
    if (tmdbIds.length === 0) {
      return [];
    }

    return db
      .select({
        id: movies.id,
        tmdbId: movies.tmdbId,
        title: movies.title,
        posterPath: movies.posterPath,
        releaseYear: movies.releaseYear,
      })
      .from(movies)
      .where(inArray(movies.tmdbId, tmdbIds));
  }

  static async getSeriesByTmdbIds(tmdbIds: number[]) {
    if (tmdbIds.length === 0) {
      return [];
    }

    return db
      .select({
        id: tvSeries.id,
        tmdbId: tvSeries.tmdbId,
        title: tvSeries.title,
        posterPath: tvSeries.posterPath,
        releaseYear: tvSeries.firstAirYear,
      })
      .from(tvSeries)
      .where(inArray(tvSeries.tmdbId, tmdbIds));
  }

  static async getAlbumsByMbids(mbids: string[]) {
    if (mbids.length === 0) {
      return [];
    }

    return db
      .select({
        id: albums.id,
        mbid: albums.mbid,
        title: albums.title,
        coverArtUrl: albums.coverArtUrl,
        firstReleaseYear: albums.firstReleaseYear,
        artistName: albums.artistName,
      })
      .from(albums)
      .where(inArray(albums.mbid, mbids));
  }

  static async getBooksByVolumeIds(volumeIds: string[]) {
    if (volumeIds.length === 0) {
      return [];
    }

    return db
      .select({
        id: books.id,
        googleVolumeId: books.googleVolumeId,
        title: books.title,
        coverImageUrl: books.coverImageUrl,
        publishedYear: books.publishedYear,
        authors: books.authors,
      })
      .from(books)
      .where(inArray(books.googleVolumeId, volumeIds));
  }
}
