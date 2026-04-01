import { parseMetadata, resolveActivityKind } from "./social-feed-metadata.helper";
import { resolveMovie, resolvePost, resolveReviewId, toFeedMetadata } from "./social-feed-resolvers.helper";
import type {
  ActivityRow,
  FeedEngagement,
  FeedItem,
  PostEngagement,
  ReviewContext,
} from "../types/social-feed.types";

export const toFeedItem = async (
  row: ActivityRow,
  reviewContext: ReviewContext,
  postEngagementByPostId: Map<string, PostEngagement>,
): Promise<FeedItem> => {
  const rawMetadata = parseMetadata(row.activity.metadata);
  const metadata = toFeedMetadata(rawMetadata);
  const kind = resolveActivityKind(row.activity.type, metadata.action);

  const reviewId = resolveReviewId(row.activity, metadata);
  const reviewById = reviewId ? reviewContext.byReviewId.get(reviewId) ?? null : null;
  const reviewByDiaryEntry =
    row.activity.type === "diary_entry"
      ? reviewContext.byDiaryEntryId.get(row.activity.entityId) ?? null
      : null;
  const reviewDetails = reviewById ?? reviewByDiaryEntry;

  const movie = reviewDetails?.movie ?? (await resolveMovie(rawMetadata, row.activity, metadata));

  const post = await resolvePost(rawMetadata, row.activity);

  const review = reviewDetails
    ? {
        id: reviewDetails.id,
        content: reviewDetails.content,
        containsSpoilers: reviewDetails.containsSpoilers,
        rating: reviewDetails.rating,
      }
    : metadata.hasReview || kind === "review"
      ? {
          id: metadata.reviewId ?? row.activity.entityId,
          content: metadata.excerpt ?? "Shared a review.",
          containsSpoilers: metadata.containsSpoilers ?? false,
          rating: metadata.rating,
        }
      : null;

  const postId = post?.id ?? metadata.postId ?? (kind === "post" ? row.activity.entityId : null);
  const postEngagement = postId
    ? postEngagementByPostId.get(postId) ?? { likeCount: 0, commentCount: 0 }
    : { likeCount: 0, commentCount: 0 };

  const engagement: FeedEngagement = reviewDetails
    ? {
        likeCount: reviewDetails.likeCount,
        commentCount: reviewDetails.commentCount,
        viewerHasLiked: reviewDetails.viewerHasLiked,
      }
    : {
        likeCount: postEngagement.likeCount,
        commentCount: postEngagement.commentCount,
        viewerHasLiked: null,
      };

  return {
    id: row.activity.id,
    type: row.activity.type,
    kind,
    createdAt: row.activity.createdAt,
    actor: {
      id: row.actorId,
      username: row.actorUsername,
      displayUsername: row.actorDisplayUsername,
      image: row.actorImage,
      avatarUrl: row.actorAvatarUrl,
    },
    movie,
    post,
    review,
    metadata,
    engagement,
  };
};
