import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { db } from "../../../infrastructure/database/db";
import { user } from "../../../infrastructure/database/auth.entity";
import { profiles } from "../../users/users.entity";
import { reviews, reviewLikes } from "../../reviews/reviews.entity";
import { TracksCacheService } from "./tracks-cache.service";
import { TrackInteractionsRepository } from "../repositories/track-interactions.repository";
import type { TrackDetailReviewSort } from "../dto/tracks.dto";
import type {
  TrackDetailResponse,
  TrackDetailReviewItem,
  TrackDetailUserLog,
  TrackInteraction,
} from "../types/tracks.types";

export class TrackDetailService {
  static async getDetail(input: {
    mbid: string;
    viewerUserId?: string | null;
    reviewsSort: TrackDetailReviewSort;
  }): Promise<TrackDetailResponse | null> {
    const track = await TracksCacheService.findOrCreate(input.mbid);
    if (!track) return null;

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
        authorAvatarUrl: profiles.avatarUrl,
      })
      .from(reviews)
      .innerJoin(user, eq(user.id, reviews.userId))
      .leftJoin(profiles, eq(profiles.userId, reviews.userId))
      .where(and(eq(reviews.mediaType, "track"), eq(reviews.mediaSourceId, input.mbid)))
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
        TrackInteractionsRepository.getLogCount(track.id),
        input.viewerUserId
          ? TrackInteractionsRepository.getViewerLog(input.viewerUserId, track.id)
          : Promise.resolve(null),
        input.viewerUserId
          ? TrackInteractionsRepository.getInteraction(input.viewerUserId, track.id)
          : Promise.resolve(null),
      ]);

    const likeCountMap = new Map(likeCounts.map((r) => [r.reviewId, r.likeCount]));
    const viewerLikedSet = new Set(viewerLikedRows.map((r) => r.reviewId));

    const reviewItems: TrackDetailReviewItem[] = reviewRows.map((r) => ({
      id: r.id,
      content: r.content,
      containsSpoilers: r.containsSpoilers,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
      listenedDate: null,
      rating: null,
      likeCount: likeCountMap.get(r.id) ?? 0,
      viewerHasLiked: viewerLikedSet.has(r.id),
      author: {
        id: r.userId,
        username: r.authorUsername,
        displayUsername: r.authorDisplayUsername ?? null,
        avatarUrl: r.authorAvatarUrl ?? null,
      },
    }));

    const sortedReviews =
      input.reviewsSort === "popular"
        ? [...reviewItems].sort((a, b) => b.likeCount - a.likeCount)
        : reviewItems;

    const userLog: TrackDetailUserLog | null = viewerLogRow
      ? {
          diaryEntryId: viewerLogRow.id,
          listenedDate: viewerLogRow.listenedDate,
          relisten: viewerLogRow.relisten,
          rating: viewerLogRow.rating,
        }
      : null;

    const interaction: TrackInteraction | null = viewerInteractionRow
      ? {
          liked: viewerInteractionRow.liked,
          rating: viewerInteractionRow.rating,
        }
      : null;

    return {
      track: {
        id: track.id,
        mbid: track.mbid,
        title: track.title,
        artistName: track.artistName,
        length: track.length,
        disambiguation: track.disambiguation,
      },
      logsCount,
      reviewCount: reviewRows.length,
      userLog,
      interaction,
      reviewsSort: input.reviewsSort,
      reviews: sortedReviews,
    };
  }
}
