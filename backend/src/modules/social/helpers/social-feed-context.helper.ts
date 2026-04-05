import { parseMetadata, readString } from "./social-feed-metadata.helper";
import { resolveReviewId, toFeedMetadata } from "./social-feed-resolvers.helper";
import { SocialFeedRepository } from "../repositories/social-feed.repository";
import type {
  ActivityRow,
  PostEngagement,
  ReviewContext,
  ReviewFeedContext,
} from "../types/social-feed.types";

export const buildReviewContext = async (
  rows: ActivityRow[],
  viewerId?: string,
): Promise<ReviewContext> => {
  const reviewIds = new Set<string>();
  const diaryEntryIds = new Set<string>();

  for (const row of rows) {
    const metadata = toFeedMetadata(parseMetadata(row.activity.metadata));
    const reviewId = resolveReviewId(row.activity, metadata);

    if (reviewId) {
      reviewIds.add(reviewId);
    }

    if (row.activity.type === "diary_entry") {
      diaryEntryIds.add(row.activity.entityId);
    }
  }

  if (reviewIds.size === 0 && diaryEntryIds.size === 0) {
    return {
      byReviewId: new Map(),
      byDiaryEntryId: new Map(),
    };
  }

  const reviewRows = await SocialFeedRepository.getReviewRowsByReviewOrDiaryIds(
    [...reviewIds],
    [...diaryEntryIds],
  );

  const hydratedReviewIds = reviewRows.map((row) => row.id);
  if (hydratedReviewIds.length === 0) {
    return {
      byReviewId: new Map(),
      byDiaryEntryId: new Map(),
    };
  }

  const [reviewLikeRows, commentRows, viewerLikeRows] = await Promise.all([
    SocialFeedRepository.getReviewLikeCountRows(hydratedReviewIds),
    SocialFeedRepository.getReviewCommentCountRows(hydratedReviewIds),
    viewerId
      ? SocialFeedRepository.getViewerReviewLikeRows(viewerId, hydratedReviewIds)
      : Promise.resolve([]),
  ]);

  const likeCountsByReviewId = new Map(reviewLikeRows.map((row) => [row.reviewId, row.count]));
  const commentCountsByReviewId = new Map(commentRows.map((row) => [row.reviewId, row.count]));
  const viewerLikedReviewIds = new Set(viewerLikeRows.map((row) => row.reviewId));

  const byReviewId = new Map<string, ReviewFeedContext>();
  const byDiaryEntryId = new Map<string, ReviewFeedContext>();

  for (const row of reviewRows) {
    const context: ReviewFeedContext = {
      id: row.id,
      diaryEntryId: row.diaryEntryId,
      content: row.content,
      containsSpoilers: row.containsSpoilers,
      rating: row.rating,
      movie: {
        tmdbId: row.tmdbId,
        title: row.title,
        posterPath: row.posterPath,
        releaseYear: row.releaseYear,
        mediaType: row.mediaType,
      },
      likeCount: likeCountsByReviewId.get(row.id) ?? 0,
      commentCount: commentCountsByReviewId.get(row.id) ?? 0,
      viewerHasLiked: viewerId ? viewerLikedReviewIds.has(row.id) : null,
    };

    byReviewId.set(row.id, context);

    if (row.diaryEntryId) {
      byDiaryEntryId.set(row.diaryEntryId, context);
    }
  }

  return {
    byReviewId,
    byDiaryEntryId,
  };
};

export const buildPostEngagementContext = async (
  rows: ActivityRow[],
  viewerId?: string,
): Promise<Map<string, PostEngagement>> => {
  const postIds = new Set<string>();

  for (const row of rows) {
    const metadata = parseMetadata(row.activity.metadata);
    const postIdFromMetadata = readString(metadata, "postId");

    if (row.activity.type !== "post" && !postIdFromMetadata) {
      continue;
    }

    const postId = postIdFromMetadata ?? row.activity.entityId;
    postIds.add(postId);
  }

  if (postIds.size === 0) {
    return new Map();
  }

  const uniquePostIds = [...postIds];
  const [postLikeRows, postCommentRows, viewerPostLikeRows] = await Promise.all([
    SocialFeedRepository.getPostLikeCountRows(uniquePostIds),
    SocialFeedRepository.getPostCommentCountRows(uniquePostIds),
    viewerId
      ? SocialFeedRepository.getViewerPostLikeRows(viewerId, uniquePostIds)
      : Promise.resolve([]),
  ]);

  const likeCountsByPostId = new Map(postLikeRows.map((row) => [row.postId, row.count]));
  const commentCountsByPostId = new Map(postCommentRows.map((row) => [row.postId, row.count]));
  const viewerLikedPostIds = new Set(viewerPostLikeRows.map((row) => row.postId));

  return new Map(
    uniquePostIds.map((postId) => [
      postId,
      {
        likeCount: likeCountsByPostId.get(postId) ?? 0,
        commentCount: commentCountsByPostId.get(postId) ?? 0,
        viewerHasLiked: viewerId ? viewerLikedPostIds.has(postId) : null,
      },
    ]),
  );
};
