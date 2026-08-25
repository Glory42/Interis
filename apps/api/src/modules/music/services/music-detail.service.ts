import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { db } from "../../../infrastructure/database/db";
import { user } from "../../../infrastructure/database/auth.entity";
import { profiles } from "../../users/users.entity";
import { reviews, reviewLikes } from "../../reviews/reviews.entity";
import { albums } from "../music.entity";
import { MusicCacheService } from "./music-cache.service";
import { MusicInteractionsRepository } from "../repositories/music-interactions.repository";
import type { MusicDetailReviewSort } from "../dto/music.dto";
import type {
  MusicDetailResponse,
  MusicDetailReviewItem,
  MusicDetailUserLog,
  MusicInteraction,
} from "../types/music.types";

export class MusicDetailService {
  static async getDetail(input: {
    mbid: string;
    viewerUserId?: string | null;
    reviewsSort: MusicDetailReviewSort;
  }): Promise<MusicDetailResponse | null> {
    const album = await MusicCacheService.findOrCreate(input.mbid);
    if (!album) return null;

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
      .where(and(eq(reviews.mediaType, "album"), eq(reviews.mediaSourceId, input.mbid)))
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
        MusicInteractionsRepository.getLogCount(album.id),
        input.viewerUserId
          ? MusicInteractionsRepository.getViewerLog(input.viewerUserId, album.id)
          : Promise.resolve(null),
        input.viewerUserId
          ? MusicInteractionsRepository.getInteraction(input.viewerUserId, album.id)
          : Promise.resolve(null),
      ]);

    const likeCountMap = new Map(likeCounts.map((r) => [r.reviewId, r.likeCount]));
    const viewerLikedSet = new Set(viewerLikedRows.map((r) => r.reviewId));

    const reviewItems: MusicDetailReviewItem[] = reviewRows.map((r) => ({
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

    const userLog: MusicDetailUserLog | null = viewerLogRow
      ? {
          diaryEntryId: viewerLogRow.id,
          listenedDate: viewerLogRow.listenedDate,
          relisten: viewerLogRow.relisten,
          rating: viewerLogRow.rating,
        }
      : null;

    const interaction: MusicInteraction | null = viewerInteractionRow
      ? {
          liked: viewerInteractionRow.liked,
          wantToListen: viewerInteractionRow.wantToListen,
          rating: viewerInteractionRow.rating,
        }
      : null;

    return {
      album: {
        id: album.id,
        mbid: album.mbid,
        title: album.title,
        artistName: album.artistName,
        artistMbid: album.artistMbid,
        coverArtUrl: album.coverArtUrl,
        primaryType: album.primaryType,
        secondaryTypes: (album.secondaryTypes ?? []) as string[],
        firstReleaseDate: album.firstReleaseDate,
        firstReleaseYear: album.firstReleaseYear,
        genres: (album.genres ?? []) as { name: string; count: number }[],
        disambiguation: album.disambiguation,
      },
      logsCount,
      reviewCount: reviewRows.length,
      userLog,
      interaction,
      reviewsSort: input.reviewsSort,
      reviews: sortedReviews,
    };
  }

  static async getLogsByMbid(mbid: string) {
    const [album] = await db
      .select({ id: albums.id })
      .from(albums)
      .where(eq(albums.mbid, mbid))
      .limit(1);
    if (!album) return null;
    return MusicInteractionsRepository.getLogsByAlbumId(album.id);
  }
}
