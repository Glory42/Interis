import { DiaryRepository } from "../../diary/repositories/diary.repository";
import type { PublicDiaryItem } from "../../public/dto/public.dto";
import type { ProfileTabPage } from "../helpers/profile-tab-page.helper";
import { UsersDiaryRepository } from "../repositories/users-diary.repository";

type DiaryReviewRow = {
  createdAt: Date;
  reviewId: string | null;
  reviewContent: string | null;
  reviewContainsSpoilers: boolean | null;
  reviewCreatedAt: Date | null;
};

const toTimestamp = (value: string | Date): number =>
  value instanceof Date ? value.getTime() : Date.parse(value);

const toReview = (entry: DiaryReviewRow): PublicDiaryItem["review"] =>
  entry.reviewId
    ? {
        id: entry.reviewId,
        content: entry.reviewContent ?? "",
        containsSpoilers: entry.reviewContainsSpoilers ?? false,
        createdAt: entry.reviewCreatedAt ?? entry.createdAt,
      }
    : null;

// The Diary tab: Film and Series Diary Entries merged newest-watched first.
export class ProfileDiaryService {
  static async getDiary(userId: string, { limit, offset }: ProfileTabPage): Promise<PublicDiaryItem[]> {
    // A global offset can't be pushed down to two tables, so read offset+limit from each and slice.
    const fetchCap = limit + offset;
    const [filmEntries, seriesEntries] = await Promise.all([
      DiaryRepository.findAllByUser(userId, fetchCap),
      UsersDiaryRepository.findSeriesDiaryEntriesByUser(userId, fetchCap),
    ]);

    const items: PublicDiaryItem[] = [
      ...filmEntries.map((entry) => ({
        id: entry.id,
        mediaType: "movie" as const,
        watchedDate: entry.watchedDate,
        rating: entry.rating,
        rewatch: entry.rewatch,
        liked: entry.liked,
        createdAt: entry.createdAt,
        updatedAt: entry.updatedAt,
        media: {
          tmdbId: entry.movieTmdbId,
          title: entry.movieTitle,
          posterPath: entry.moviePosterPath,
          releaseYear: entry.movieReleaseYear,
        },
        review: toReview(entry),
      })),
      ...seriesEntries.map((entry) => ({
        id: entry.id,
        mediaType: "tv" as const,
        watchedDate: entry.watchedDate,
        rating: entry.rating,
        rewatch: entry.rewatch,
        liked: entry.liked,
        createdAt: entry.createdAt,
        updatedAt: entry.updatedAt,
        media: {
          tmdbId: entry.tmdbId,
          title: entry.title,
          posterPath: entry.posterPath,
          releaseYear: entry.releaseYear,
        },
        review: toReview(entry),
      })),
    ];

    return items
      .sort(
        (left, right) =>
          toTimestamp(right.watchedDate) - toTimestamp(left.watchedDate) ||
          toTimestamp(right.createdAt) - toTimestamp(left.createdAt),
      )
      .slice(offset, offset + limit);
  }
}
