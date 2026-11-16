import { DiaryRepository } from "../../diary/repositories/diary.repository";
import { normalizeDiaryTag } from "../../media/helpers/diary-tag.helper";
import { DiaryTagsService } from "../../media/services/diary-tags.service";
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

// The private note is only present when the owner reads their own diary.
export type ProfileDiaryItem = PublicDiaryItem & { note?: string | null };

type DiaryTabOptions = { isOwner: boolean; tag?: unknown };

// The Diary tab: Film and Series Diary Entries merged newest-watched first.
export class ProfileDiaryService {
  static async getDiary(
    userId: string,
    { limit, offset }: ProfileTabPage,
    { isOwner, tag: rawTag }: DiaryTabOptions = { isOwner: false },
  ): Promise<ProfileDiaryItem[]> {
    const tag = typeof rawTag === "string" && rawTag.length > 0 ? normalizeDiaryTag(rawTag) : undefined;
    // A tag that can't exist matches nothing.
    if (tag === null) return [];
    const readOptions = { includeNote: isOwner, tag };

    // A global offset can't be pushed down to two tables, so read offset+limit from each and slice.
    const fetchCap = limit + offset;
    const [filmEntries, seriesEntries] = await Promise.all([
      DiaryRepository.findAllByUser(userId, fetchCap, undefined, readOptions),
      UsersDiaryRepository.findSeriesDiaryEntriesByUser(userId, fetchCap, readOptions),
    ]);

    const items: Omit<ProfileDiaryItem, "tags">[] = [
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
        ...(isOwner ? { note: entry.note } : {}),
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
        ...(isOwner ? { note: entry.note } : {}),
      })),
    ];

    const page = items
      .sort(
        (left, right) =>
          toTimestamp(right.watchedDate) - toTimestamp(left.watchedDate) ||
          toTimestamp(right.createdAt) - toTimestamp(left.createdAt),
      )
      .slice(offset, offset + limit);

    // Tags for this page only, in one query.
    const tagsOf = await DiaryTagsService.lookupForEntries(page);
    return page.map((item) => ({ ...item, tags: tagsOf(item.mediaType, item.id) }));
  }
}
