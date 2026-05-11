import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { db } from "../../../infrastructure/database/db";
import { user } from "../../../infrastructure/database/auth.entity";
import { profiles } from "../../users/users.entity";
import { reviews, reviewLikes } from "../../reviews/reviews.entity";
import { books } from "../books.entity";
import { BooksCacheService } from "./books-cache.service";
import { BooksInteractionsRepository } from "../repositories/books-interactions.repository";
import type { BookDetailReviewSort } from "../dto/books.dto";
import type {
  BookDetailResponse,
  BookDetailReviewItem,
  BookDetailUserLog,
  BookInteraction,
} from "../types/books.types";

export class BooksDetailService {
  static async getDetail(input: {
    volumeId: string;
    viewerUserId?: string | null;
    reviewsSort: BookDetailReviewSort;
  }): Promise<BookDetailResponse | null> {
    const book = await BooksCacheService.findOrCreate(input.volumeId);
    if (!book) return null;

    const reviewRows = await db
      .select({
        id: reviews.id,
        userId: reviews.userId,
        content: reviews.content,
        containsSpoilers: reviews.containsSpoilers,
        createdAt: reviews.createdAt,
        updatedAt: reviews.updatedAt,
        authorUsername: user.username,
        authorDisplayUsername: user.displayUsername,
        authorImage: user.image,
        authorAvatarUrl: profiles.avatarUrl,
      })
      .from(reviews)
      .innerJoin(user, eq(user.id, reviews.userId))
      .leftJoin(profiles, eq(profiles.userId, reviews.userId))
      .where(and(eq(reviews.mediaType, "book"), eq(reviews.mediaSourceId, input.volumeId)))
      .orderBy(desc(reviews.createdAt));

    const reviewIds = reviewRows.map((r) => r.id);

    const [likeCounts, viewerLikedRows, logsCount, viewerLogRow, viewerInteractionRow] =
      await Promise.all([
        reviewIds.length > 0
          ? db
              .select({
                reviewId: reviewLikes.reviewId,
                likeCount: sql<number>`count(*)::int`.as("likeCount"),
              })
              .from(reviewLikes)
              .where(inArray(reviewLikes.reviewId, reviewIds))
              .groupBy(reviewLikes.reviewId)
          : Promise.resolve([]),
        input.viewerUserId && reviewIds.length > 0
          ? db
              .select({ reviewId: reviewLikes.reviewId })
              .from(reviewLikes)
              .where(
                and(
                  eq(reviewLikes.userId, input.viewerUserId),
                  inArray(reviewLikes.reviewId, reviewIds),
                ),
              )
          : Promise.resolve([]),
        BooksInteractionsRepository.getLogCount(book.id),
        input.viewerUserId
          ? BooksInteractionsRepository.getViewerLog(input.viewerUserId, book.id)
          : Promise.resolve(null),
        input.viewerUserId
          ? BooksInteractionsRepository.getInteraction(input.viewerUserId, book.id)
          : Promise.resolve(null),
      ]);

    const likeCountMap = new Map(likeCounts.map((r) => [r.reviewId, r.likeCount]));
    const viewerLikedSet = new Set(viewerLikedRows.map((r) => r.reviewId));

    const reviewItems: BookDetailReviewItem[] = reviewRows.map((r) => ({
      id: r.id,
      content: r.content,
      containsSpoilers: r.containsSpoilers,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
      readDate: null,
      ratingOutOfTen: null,
      ratingOutOfFive: null,
      likeCount: likeCountMap.get(r.id) ?? 0,
      viewerHasLiked: viewerLikedSet.has(r.id),
      author: {
        id: r.userId,
        username: r.authorUsername,
        displayUsername: r.authorDisplayUsername ?? null,
        image: r.authorImage ?? null,
        avatarUrl: r.authorAvatarUrl ?? null,
      },
    }));

    const sortedReviews =
      input.reviewsSort === "popular"
        ? [...reviewItems].sort((a, b) => b.likeCount - a.likeCount)
        : reviewItems;

    const userLog: BookDetailUserLog | null = viewerLogRow
      ? {
          diaryEntryId: viewerLogRow.id,
          readDate: viewerLogRow.readDate,
          reread: viewerLogRow.reread,
          ratingOutOfTen: viewerLogRow.rating,
          ratingOutOfFive: viewerLogRow.rating !== null ? viewerLogRow.rating / 2 : null,
        }
      : null;

    const interaction: BookInteraction | null = viewerInteractionRow
      ? {
          liked: viewerInteractionRow.liked,
          wantToRead: viewerInteractionRow.wantToRead,
          ratingOutOfTen: viewerInteractionRow.rating,
          ratingOutOfFive:
            viewerInteractionRow.rating !== null ? viewerInteractionRow.rating / 2 : null,
        }
      : null;

    return {
      book: {
        id: book.id,
        googleVolumeId: book.googleVolumeId,
        title: book.title,
        subtitle: book.subtitle,
        authors: (book.authors ?? []) as string[],
        publisher: book.publisher,
        publishedDate: book.publishedDate,
        publishedYear: book.publishedYear,
        pageCount: book.pageCount,
        language: book.language,
        categories: (book.categories ?? []) as string[],
        description: book.description,
        coverImageUrl: book.coverImageUrl,
        isbn13: book.isbn13,
        googleBooksUrl: book.googleBooksUrl,
      },
      logsCount,
      reviewCount: reviewRows.length,
      userLog,
      interaction,
      reviewsSort: input.reviewsSort,
      reviews: sortedReviews,
    };
  }

  static async getLogsByVolumeId(volumeId: string) {
    const [book] = await db
      .select({ id: books.id })
      .from(books)
      .where(eq(books.googleVolumeId, volumeId))
      .limit(1);
    if (!book) return null;
    return BooksInteractionsRepository.getLogsByBookId(book.id);
  }
}
