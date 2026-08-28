import { DiaryRepository } from "../../diary/repositories/diary.repository";
import { PublicRepository } from "../repositories/public.repository";
import type { PublicDiaryItem } from "../dto/public.dto";

const toTimestamp = (value: string | Date): number => {
  if (value instanceof Date) return value.getTime();
  return Date.parse(value);
};

export class PublicDiaryService {
  static async getDiary(userId: string, limit = 50, offset = 0): Promise<PublicDiaryItem[]> {
    // Fetch enough of each source to cover through offset+limit, then merge,
    // sort, and slice the exact page - matches the pattern used for
    // reviews/likes/watchlist (see UsersReviewsRepository.getReviewsWithMovies)
    // since a global offset can't be pushed down independently to four
    // separately-paginated tables ahead of the merge.
    const fetchCap = limit + offset;

    const [movieEntries, serialEntries, albumEntries, bookEntries, trackEntries] =
      await Promise.all([
        DiaryRepository.findAllByUser(userId, fetchCap),
        PublicRepository.findSerialDiaryEntriesByUser(userId, fetchCap),
        PublicRepository.findAlbumDiaryEntriesByUser(userId, fetchCap),
        PublicRepository.findBookDiaryEntriesByUser(userId, fetchCap),
        PublicRepository.findTrackDiaryEntriesByUser(userId, fetchCap),
      ]);

    const normalizedMovieEntries: PublicDiaryItem[] = movieEntries.map((entry) => ({
      id: entry.id,
      mediaType: "movie",
      watchedDate: entry.watchedDate,
      rating: entry.rating,
      rewatch: entry.rewatch,
      createdAt: entry.createdAt,
      updatedAt: entry.updatedAt,
      media: {
        tmdbId: entry.movieTmdbId,
        title: entry.movieTitle,
        posterPath: entry.moviePosterPath,
        releaseYear: entry.movieReleaseYear,
      },
      review: entry.reviewId
        ? {
            id: entry.reviewId,
            content: entry.reviewContent ?? "",
            containsSpoilers: entry.reviewContainsSpoilers ?? false,
            createdAt: entry.reviewCreatedAt ?? entry.createdAt,
          }
        : null,
    }));

    const normalizedSerialEntries: PublicDiaryItem[] = serialEntries.map((entry) => ({
      id: entry.id,
      mediaType: "tv",
      watchedDate: entry.watchedDate,
      rating: entry.rating,
      rewatch: entry.rewatch,
      createdAt: entry.createdAt,
      updatedAt: entry.updatedAt,
      media: {
        tmdbId: entry.tmdbId,
        title: entry.title,
        posterPath: entry.posterPath,
        releaseYear: entry.releaseYear,
      },
      review: entry.reviewId
        ? {
            id: entry.reviewId,
            content: entry.reviewContent ?? "",
            containsSpoilers: entry.reviewContainsSpoilers ?? false,
            createdAt: entry.reviewCreatedAt ?? entry.createdAt,
          }
        : null,
    }));

    const normalizedAlbumEntries: PublicDiaryItem[] = albumEntries.map((entry) => ({
      id: entry.id,
      mediaType: "album",
      watchedDate: entry.watchedDate,
      rating: entry.rating,
      rewatch: entry.rewatch,
      createdAt: entry.createdAt,
      updatedAt: entry.updatedAt,
      media: {
        tmdbId: null,
        mbid: entry.mbid,
        title: entry.title,
        coverArtUrl: entry.coverArtUrl,
        artistName: entry.artistName,
        releaseYear: entry.releaseYear,
      },
      review: entry.reviewId
        ? {
            id: entry.reviewId,
            content: entry.reviewContent ?? "",
            containsSpoilers: entry.reviewContainsSpoilers ?? false,
            createdAt: entry.reviewCreatedAt ?? entry.createdAt,
          }
        : null,
    }));

    const normalizedBookEntries: PublicDiaryItem[] = bookEntries.map((entry) => ({
      id: entry.id,
      mediaType: "book",
      watchedDate: entry.watchedDate,
      rating: entry.rating,
      rewatch: entry.rewatch,
      createdAt: entry.createdAt,
      updatedAt: entry.updatedAt,
      media: {
        tmdbId: null,
        volumeId: entry.volumeId,
        title: entry.title,
        coverArtUrl: entry.coverArtUrl,
        authors: (entry.authors as string[] | null) ?? null,
        releaseYear: entry.releaseYear,
      },
      review: entry.reviewId
        ? {
            id: entry.reviewId,
            content: entry.reviewContent ?? "",
            containsSpoilers: entry.reviewContainsSpoilers ?? false,
            createdAt: entry.reviewCreatedAt ?? entry.createdAt,
          }
        : null,
    }));

    const normalizedTrackEntries: PublicDiaryItem[] = trackEntries.map((entry) => ({
      id: entry.id,
      mediaType: "track",
      watchedDate: entry.watchedDate,
      rating: entry.rating,
      rewatch: entry.rewatch,
      createdAt: entry.createdAt,
      updatedAt: entry.updatedAt,
      media: {
        tmdbId: null,
        mbid: entry.mbid,
        title: entry.title,
        artistName: entry.artistName,
        releaseYear: null,
      },
      review: entry.reviewId
        ? {
            id: entry.reviewId,
            content: entry.reviewContent ?? "",
            containsSpoilers: entry.reviewContainsSpoilers ?? false,
            createdAt: entry.reviewCreatedAt ?? entry.createdAt,
          }
        : null,
    }));

    return [
      ...normalizedMovieEntries,
      ...normalizedSerialEntries,
      ...normalizedAlbumEntries,
      ...normalizedBookEntries,
      ...normalizedTrackEntries,
    ]
      .sort((left, right) => {
        const watchedDateDelta = toTimestamp(right.watchedDate) - toTimestamp(left.watchedDate);

        if (watchedDateDelta !== 0) {
          return watchedDateDelta;
        }

        return toTimestamp(right.createdAt) - toTimestamp(left.createdAt);
      })
      .slice(offset, offset + limit);
  }
}
