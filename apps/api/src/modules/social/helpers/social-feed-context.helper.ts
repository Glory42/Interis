import { SocialFeedRepository } from "../repositories/social-feed.repository";
import { SocialRepository } from "../repositories/social.repository";
import type {
  FeedEngagement,
  PostEngagement,
  ReviewContext,
  ReviewFeedContext,
} from "../types/social-feed.types";
import type { FeedContext, FeedIds } from "../types/social-feed-kind.types";

export const emptyFeedIds = (): FeedIds => ({
  reviews: new Set(),
  logs: new Set(),
  posts: new Set(),
  films: new Set(),
  lists: new Set(),
  users: new Set(),
  likedActivities: new Set(),
});

const byId = <Row extends { id: string | number }>(rows: Row[]) =>
  new Map<Row["id"], Row>(rows.map((row) => [row.id, row]));

// Reviews named by id or attached to a loaded log, with their likes and comment counts.
const loadReviews = async (
  reviewIds: string[],
  logIds: string[],
  viewerId?: string,
): Promise<ReviewContext> => {
  const reviewRows = await SocialFeedRepository.getReviewRowsByReviewOrDiaryIds(reviewIds, logIds);
  const hydratedReviewIds = reviewRows.map((row) => row.id);
  if (hydratedReviewIds.length === 0) {
    return { byReviewId: new Map(), byDiaryEntryId: new Map() };
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

  return { byReviewId, byDiaryEntryId };
};

const loadPostEngagement = async (postIds: string[], viewerId?: string): Promise<Map<string, PostEngagement>> => {
  if (postIds.length === 0) {
    return new Map();
  }

  const [postLikeRows, postCommentRows, viewerPostLikeRows] = await Promise.all([
    SocialFeedRepository.getPostLikeCountRows(postIds),
    SocialFeedRepository.getPostCommentCountRows(postIds),
    viewerId ? SocialFeedRepository.getViewerPostLikeRows(viewerId, postIds) : Promise.resolve([]),
  ]);

  const likeCountsByPostId = new Map(postLikeRows.map((row) => [row.postId, row.count]));
  const commentCountsByPostId = new Map(postCommentRows.map((row) => [row.postId, row.count]));
  const viewerLikedPostIds = new Set(viewerPostLikeRows.map((row) => row.postId));

  return new Map(
    postIds.map((postId) => [
      postId,
      {
        likeCount: likeCountsByPostId.get(postId) ?? 0,
        commentCount: commentCountsByPostId.get(postId) ?? 0,
        viewerHasLiked: viewerId ? viewerLikedPostIds.has(postId) : null,
      },
    ]),
  );
};

const loadActivityEngagement = async (
  activityIds: string[],
  viewerId?: string,
): Promise<Map<string, FeedEngagement>> => {
  if (activityIds.length === 0) {
    return new Map();
  }

  const [likeCounts, viewerLikes] = await Promise.all([
    SocialRepository.getActivityLikeCounts(activityIds),
    viewerId ? SocialRepository.getViewerActivityLikes(viewerId, activityIds) : Promise.resolve([]),
  ]);

  const likeCountById = new Map(likeCounts.map((row) => [row.activityId, row.count]));
  const viewerLikedIds = new Set(viewerLikes.map((row) => row.activityId));

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

// One round of batched queries for a whole page, one per table, in parallel.
export const loadFeedContext = async (ids: FeedIds, viewerId?: string): Promise<FeedContext> => {
  const postIds = [...ids.posts];
  const [
    reviews,
    postEngagement,
    activityEngagement,
    postRows,
    filmRows,
    logRows,
    listRows,
    userRows,
  ] = await Promise.all([
    loadReviews([...ids.reviews], [...ids.logs], viewerId),
    loadPostEngagement(postIds, viewerId),
    loadActivityEngagement([...ids.likedActivities], viewerId),
    SocialFeedRepository.getPostsByIds(postIds),
    SocialFeedRepository.getMoviesByIds([...ids.films]),
    SocialFeedRepository.getDiaryEntriesByIds([...ids.logs]),
    SocialFeedRepository.getListsByIds([...ids.lists]),
    SocialFeedRepository.getUsersByIds([...ids.users]),
  ]);

  return {
    reviews,
    posts: byId(postRows),
    postEngagement,
    films: byId(filmRows),
    logs: byId(logRows),
    lists: byId(listRows),
    users: byId(userRows),
    activityEngagement,
  };
};
