import { parseMetadata, readString } from "./social-feed-metadata.helper";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const isUuid = (s: string) => UUID_RE.test(s);
import {
  resolveMovieFallbackId,
  resolvePostFallbackId,
  resolveReviewId,
  toFeedMetadata,
} from "./social-feed-resolvers.helper";
import { SocialFeedRepository } from "../repositories/social-feed.repository";
import { SocialRepository } from "../repositories/social.repository";
import type {
  ActivityRow,
  FeedEngagement,
  FeedFallbackMediaContext,
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

    if (row.activity.type === "diary_entry" && isUuid(row.activity.entityId)) {
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
      reviewAuthorUsername: row.reviewAuthorUsername,
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

// Batches the per-row post/movie fallback lookups (used when an activity's
// metadata doesn't already embed the full movie/post data) into two
// queries total instead of one query per feed row.
export const buildFeedFallbackMediaContext = async (
  rows: ActivityRow[],
  reviewContext: ReviewContext,
): Promise<FeedFallbackMediaContext> => {
  const postIds = new Set<string>();
  const movieIds = new Set<number>();

  for (const row of rows) {
    const rawMetadata = parseMetadata(row.activity.metadata);
    const metadata = toFeedMetadata(rawMetadata);

    const postId = resolvePostFallbackId(rawMetadata, row.activity);
    if (postId) {
      postIds.add(postId);
    }

    const reviewId = resolveReviewId(row.activity, metadata);
    const reviewDetails =
      (reviewId ? reviewContext.byReviewId.get(reviewId) : null) ??
      (row.activity.type === "diary_entry"
        ? reviewContext.byDiaryEntryId.get(row.activity.entityId)
        : null);

    if (!reviewDetails?.movie) {
      const movieId = resolveMovieFallbackId(rawMetadata, row.activity, metadata);
      if (movieId !== null) {
        movieIds.add(movieId);
      }
    }
  }

  const [postRows, movieRows] = await Promise.all([
    SocialFeedRepository.getPostsByIds([...postIds]),
    SocialFeedRepository.getMoviesByIds([...movieIds]),
  ]);

  return {
    postsById: new Map(postRows.map((post) => [post.id, post])),
    moviesById: new Map(movieRows.map((movie) => [movie.id, movie])),
  };
};

const REVIEW_TYPES = new Set(["diary_entry", "review", "liked_review", "commented"]);
const POST_TYPES = new Set(["post"]);

export const buildActivityEngagementContext = async (
  rows: ActivityRow[],
  viewerId?: string,
): Promise<Map<string, FeedEngagement>> => {
  const activityIds = rows
    .filter((r) => !REVIEW_TYPES.has(r.activity.type) && !POST_TYPES.has(r.activity.type))
    .map((r) => r.activity.id);

  if (activityIds.length === 0) return new Map();

  const [likeCounts, viewerLikes] = await Promise.all([
    SocialRepository.getActivityLikeCounts(activityIds),
    viewerId ? SocialRepository.getViewerActivityLikes(viewerId, activityIds) : Promise.resolve([]),
  ]);

  const likeCountById = new Map(likeCounts.map((r) => [r.activityId, r.count]));
  const viewerLikedIds = new Set(viewerLikes.map((r) => r.activityId));

  return new Map(
    activityIds.map((id) => [
      id,
      {
        likeCount: likeCountById.get(id) ?? 0,
        commentCount: 0,
        viewerHasLiked: viewerId ? viewerLikedIds.has(id) : null,
      } satisfies FeedEngagement,
    ]),
  );
};
