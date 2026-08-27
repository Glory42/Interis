import { and, asc, desc, eq, inArray } from "drizzle-orm";
import { db } from "../../../infrastructure/database/db";
import { user } from "../../../infrastructure/database/auth.entity";
import { listEntries, lists } from "../../lists/lists.entity";
import { movies } from "../../movies/movies.entity";
import { reviews } from "../../reviews/reviews.entity";
import { serialDiaryEntries, tvSeries } from "../../serials/serials.entity";
import { albums, musicDiaryEntries, trackDiaryEntries, tracks } from "../../music/music.entity";
import { bookDiaryEntries, books } from "../../books/books.entity";

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

  static async findAlbumDiaryEntriesByUser(userId: string, fetchCap: number) {
    return db
      .select({
        id: musicDiaryEntries.id,
        watchedDate: musicDiaryEntries.listenedDate,
        rating: musicDiaryEntries.rating,
        rewatch: musicDiaryEntries.relisten,
        createdAt: musicDiaryEntries.createdAt,
        updatedAt: musicDiaryEntries.updatedAt,
        mbid: albums.mbid,
        title: albums.title,
        coverArtUrl: albums.coverArtUrl,
        artistName: albums.artistName,
        releaseYear: albums.firstReleaseYear,
        reviewId: reviews.id,
        reviewContent: reviews.content,
        reviewContainsSpoilers: reviews.containsSpoilers,
        reviewCreatedAt: reviews.createdAt,
      })
      .from(musicDiaryEntries)
      .innerJoin(albums, eq(albums.id, musicDiaryEntries.albumId))
      .leftJoin(
        reviews,
        and(
          eq(reviews.userId, musicDiaryEntries.userId),
          eq(reviews.diaryEntryId, musicDiaryEntries.id),
          eq(reviews.mediaType, "album"),
        ),
      )
      .where(eq(musicDiaryEntries.userId, userId))
      .orderBy(desc(musicDiaryEntries.listenedDate), desc(musicDiaryEntries.createdAt))
      .limit(fetchCap);
  }

  static async findBookDiaryEntriesByUser(userId: string, fetchCap: number) {
    return db
      .select({
        id: bookDiaryEntries.id,
        watchedDate: bookDiaryEntries.readDate,
        rating: bookDiaryEntries.rating,
        rewatch: bookDiaryEntries.reread,
        createdAt: bookDiaryEntries.createdAt,
        updatedAt: bookDiaryEntries.updatedAt,
        volumeId: books.googleVolumeId,
        title: books.title,
        coverArtUrl: books.coverImageUrl,
        authors: books.authors,
        releaseYear: books.publishedYear,
        reviewId: reviews.id,
        reviewContent: reviews.content,
        reviewContainsSpoilers: reviews.containsSpoilers,
        reviewCreatedAt: reviews.createdAt,
      })
      .from(bookDiaryEntries)
      .innerJoin(books, eq(books.id, bookDiaryEntries.bookId))
      .leftJoin(
        reviews,
        and(
          eq(reviews.userId, bookDiaryEntries.userId),
          eq(reviews.diaryEntryId, bookDiaryEntries.id),
          eq(reviews.mediaType, "book"),
        ),
      )
      .where(eq(bookDiaryEntries.userId, userId))
      .orderBy(desc(bookDiaryEntries.readDate), desc(bookDiaryEntries.createdAt))
      .limit(fetchCap);
  }

  static async findTrackDiaryEntriesByUser(userId: string, fetchCap: number) {
    return db
      .select({
        id: trackDiaryEntries.id,
        watchedDate: trackDiaryEntries.listenedDate,
        rating: trackDiaryEntries.rating,
        rewatch: trackDiaryEntries.relisten,
        createdAt: trackDiaryEntries.createdAt,
        updatedAt: trackDiaryEntries.updatedAt,
        mbid: tracks.mbid,
        title: tracks.title,
        artistName: tracks.artistName,
        reviewId: reviews.id,
        reviewContent: reviews.content,
        reviewContainsSpoilers: reviews.containsSpoilers,
        reviewCreatedAt: reviews.createdAt,
      })
      .from(trackDiaryEntries)
      .innerJoin(tracks, eq(tracks.id, trackDiaryEntries.trackId))
      .leftJoin(
        reviews,
        and(
          eq(reviews.userId, trackDiaryEntries.userId),
          eq(reviews.diaryEntryId, trackDiaryEntries.id),
          eq(reviews.mediaType, "track"),
        ),
      )
      .where(eq(trackDiaryEntries.userId, userId))
      .orderBy(desc(trackDiaryEntries.listenedDate), desc(trackDiaryEntries.createdAt))
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
