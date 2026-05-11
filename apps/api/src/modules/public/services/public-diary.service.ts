import { and, desc, eq } from "drizzle-orm";
import { db } from "../../../infrastructure/database/db";
import { DiaryRepository } from "../../diary/repositories/diary.repository";
import { reviews } from "../../reviews/reviews.entity";
import { serialDiaryEntries, tvSeries } from "../../serials/serials.entity";
import { musicDiaryEntries, albums } from "../../music/music.entity";
import { bookDiaryEntries, books } from "../../books/books.entity";

export type PublicDiaryItem = {
  id: string;
  mediaType: "movie" | "tv" | "album" | "book";
  watchedDate: string;
  ratingOutOfTen: number | null;
  ratingOutOfFive: number | null;
  rewatch: boolean;
  createdAt: Date;
  updatedAt: Date;
  media: {
    tmdbId?: number;
    mbid?: string;
    volumeId?: string;
    title: string;
    posterPath?: string | null;
    coverArtUrl?: string | null;
    releaseYear: number | null;
    artistName?: string | null;
    authors?: string[] | null;
  };
  review: {
    id: string;
    content: string;
    containsSpoilers: boolean;
    createdAt: Date;
  } | null;
};

const toRatingOutOfFive = (ratingOutOfTen: number | null): number | null => {
  if (ratingOutOfTen === null || !Number.isFinite(ratingOutOfTen)) {
    return null;
  }

  return Number((ratingOutOfTen / 2).toFixed(1));
};

const toTimestamp = (value: string | Date): number => {
  if (value instanceof Date) return value.getTime();
  return Date.parse(value);
};

export class PublicDiaryService {
  static async getDiary(userId: string, limit = 50): Promise<PublicDiaryItem[]> {
    const [movieEntries, serialEntries, musicEntries, bookEntries] = await Promise.all([
      DiaryRepository.findAllByUser(userId),
      db
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
        .leftJoin(reviews, and(eq(reviews.userId, serialDiaryEntries.userId), eq(reviews.diaryEntryId, serialDiaryEntries.id), eq(reviews.mediaType, "tv")))
        .where(eq(serialDiaryEntries.userId, userId))
        .orderBy(desc(serialDiaryEntries.watchedDate), desc(serialDiaryEntries.createdAt)),
      db
        .select({
          id: musicDiaryEntries.id,
          listenedDate: musicDiaryEntries.listenedDate,
          rating: musicDiaryEntries.rating,
          relisten: musicDiaryEntries.relisten,
          createdAt: musicDiaryEntries.createdAt,
          updatedAt: musicDiaryEntries.updatedAt,
          mbid: albums.mbid,
          title: albums.title,
          coverArtUrl: albums.coverArtUrl,
          releaseYear: albums.firstReleaseYear,
          artistName: albums.artistName,
          reviewId: reviews.id,
          reviewContent: reviews.content,
          reviewContainsSpoilers: reviews.containsSpoilers,
          reviewCreatedAt: reviews.createdAt,
        })
        .from(musicDiaryEntries)
        .innerJoin(albums, eq(albums.id, musicDiaryEntries.albumId))
        .leftJoin(reviews, and(eq(reviews.userId, musicDiaryEntries.userId), eq(reviews.diaryEntryId, musicDiaryEntries.id), eq(reviews.mediaType, "album")))
        .where(eq(musicDiaryEntries.userId, userId))
        .orderBy(desc(musicDiaryEntries.listenedDate), desc(musicDiaryEntries.createdAt)),
      db
        .select({
          id: bookDiaryEntries.id,
          readDate: bookDiaryEntries.readDate,
          rating: bookDiaryEntries.rating,
          reread: bookDiaryEntries.reread,
          createdAt: bookDiaryEntries.createdAt,
          updatedAt: bookDiaryEntries.updatedAt,
          volumeId: books.googleVolumeId,
          title: books.title,
          coverImageUrl: books.coverImageUrl,
          releaseYear: books.publishedYear,
          authors: books.authors,
          reviewId: reviews.id,
          reviewContent: reviews.content,
          reviewContainsSpoilers: reviews.containsSpoilers,
          reviewCreatedAt: reviews.createdAt,
        })
        .from(bookDiaryEntries)
        .innerJoin(books, eq(books.id, bookDiaryEntries.bookId))
        .leftJoin(reviews, and(eq(reviews.userId, bookDiaryEntries.userId), eq(reviews.diaryEntryId, bookDiaryEntries.id), eq(reviews.mediaType, "book")))
        .where(eq(bookDiaryEntries.userId, userId))
        .orderBy(desc(bookDiaryEntries.readDate), desc(bookDiaryEntries.createdAt)),
    ]);

    const normalizedMovies: PublicDiaryItem[] = movieEntries.map((e) => ({
      id: e.id,
      mediaType: "movie" as const,
      watchedDate: e.watchedDate,
      ratingOutOfTen: e.rating,
      ratingOutOfFive: toRatingOutOfFive(e.rating),
      rewatch: e.rewatch,
      createdAt: e.createdAt,
      updatedAt: e.updatedAt,
      media: { tmdbId: e.movieTmdbId, title: e.movieTitle, posterPath: e.moviePosterPath, releaseYear: e.movieReleaseYear },
      review: e.reviewId ? { id: e.reviewId, content: e.reviewContent ?? "", containsSpoilers: e.reviewContainsSpoilers ?? false, createdAt: e.reviewCreatedAt ?? e.createdAt } : null,
    }));

    const normalizedSerials: PublicDiaryItem[] = serialEntries.map((e) => ({
      id: e.id,
      mediaType: "tv" as const,
      watchedDate: e.watchedDate,
      ratingOutOfTen: e.rating,
      ratingOutOfFive: toRatingOutOfFive(e.rating),
      rewatch: e.rewatch,
      createdAt: e.createdAt,
      updatedAt: e.updatedAt,
      media: { tmdbId: e.tmdbId, title: e.title, posterPath: e.posterPath, releaseYear: e.releaseYear },
      review: e.reviewId ? { id: e.reviewId, content: e.reviewContent ?? "", containsSpoilers: e.reviewContainsSpoilers ?? false, createdAt: e.reviewCreatedAt ?? e.createdAt } : null,
    }));

    const normalizedMusic: PublicDiaryItem[] = musicEntries.map((e) => ({
      id: e.id,
      mediaType: "album" as const,
      watchedDate: e.listenedDate,
      ratingOutOfTen: e.rating,
      ratingOutOfFive: toRatingOutOfFive(e.rating),
      rewatch: e.relisten,
      createdAt: e.createdAt,
      updatedAt: e.updatedAt,
      media: { mbid: e.mbid, title: e.title, coverArtUrl: e.coverArtUrl ?? null, releaseYear: e.releaseYear ?? null, artistName: e.artistName },
      review: e.reviewId ? { id: e.reviewId, content: e.reviewContent ?? "", containsSpoilers: e.reviewContainsSpoilers ?? false, createdAt: e.reviewCreatedAt ?? e.createdAt } : null,
    }));

    const normalizedBooks: PublicDiaryItem[] = bookEntries.map((e) => ({
      id: e.id,
      mediaType: "book" as const,
      watchedDate: e.readDate,
      ratingOutOfTen: e.rating,
      ratingOutOfFive: toRatingOutOfFive(e.rating),
      rewatch: e.reread,
      createdAt: e.createdAt,
      updatedAt: e.updatedAt,
      media: { volumeId: e.volumeId, title: e.title, coverArtUrl: e.coverImageUrl ?? null, releaseYear: e.releaseYear ?? null, authors: (e.authors as string[] | null) ?? null },
      review: e.reviewId ? { id: e.reviewId, content: e.reviewContent ?? "", containsSpoilers: e.reviewContainsSpoilers ?? false, createdAt: e.reviewCreatedAt ?? e.createdAt } : null,
    }));

    return [...normalizedMovies, ...normalizedSerials, ...normalizedMusic, ...normalizedBooks]
      .sort((a, b) => {
        const delta = toTimestamp(b.watchedDate) - toTimestamp(a.watchedDate);
        if (delta !== 0) return delta;
        return toTimestamp(b.createdAt) - toTimestamp(a.createdAt);
      })
      .slice(0, limit);
  }
}
