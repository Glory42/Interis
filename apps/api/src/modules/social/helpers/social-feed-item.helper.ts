import { parseMetadata, resolveActivityKind } from "./social-feed-metadata.helper";
import { truncateExcerpt } from "../../../commons/helpers/text.helper";
import {
  resolveMovie,
  resolvePost,
  resolvePostFallbackId,
  resolveReviewId,
  toFeedMetadata,
} from "./social-feed-resolvers.helper";
import type {
  ActivityRow,
  FeedEngagement,
  FeedFallbackMediaContext,
  FeedItem,
  PostEngagement,
  ReviewContext,
} from "../types/social-feed.types";

// Returns null when the review, post, diary log, list or followed account
// the activity is about no longer exists (deleted by its author or a
// moderator), or when the list is private. Metadata keeps a copy of
// the text from when the activity was recorded, but it must never stand in
// for deleted content.
export const toFeedItem = (
  row: ActivityRow,
  reviewContext: ReviewContext,
  postEngagementByPostId: Map<string, PostEngagement>,
  activityEngagementById: Map<string, FeedEngagement>,
  fallbackMedia: FeedFallbackMediaContext,
): FeedItem | null => {
  const rawMetadata = parseMetadata(row.activity.metadata);
  const metadata = toFeedMetadata(rawMetadata);
  const kind = resolveActivityKind(row.activity.type, metadata.action);

  const reviewId = resolveReviewId(row.activity, metadata);
  const reviewById = reviewId ? reviewContext.byReviewId.get(reviewId) ?? null : null;
  const isDiaryEntry = row.activity.type === "diary_entry";
  const reviewByDiaryEntry =
    isDiaryEntry
      ? reviewContext.byDiaryEntryId.get(row.activity.entityId) ?? null
      : null;
  const reviewDetails = reviewById ?? reviewByDiaryEntry;

  // Rating and rewatch come from the live log, so an edit shows up too.
  const diaryEntry = isDiaryEntry
    ? fallbackMedia.diaryEntriesById.get(row.activity.entityId) ?? null
    : null;
  if (isDiaryEntry && !diaryEntry) {
    return null;
  }

  // A private list stays out of every feed, its owner's included, and comes
  // back if it's made public again. The title is the list's current one.
  const isCreatedList = row.activity.type === "created_list";
  const list = isCreatedList ? fallbackMedia.listsById.get(row.activity.entityId) ?? null : null;
  if (isCreatedList && !list?.isPublic) {
    return null;
  }

  // A follow names its target by id, so it shows the target's current
  // username, and goes once the account is deleted (#102).
  const isFollow = row.activity.type === "followed_user";
  const followedUser = isFollow
    ? fallbackMedia.usersById.get(row.activity.entityId) ?? null
    : null;
  if (isFollow && !followedUser) {
    return null;
  }

  // A diary entry outlives its review, so it stays in the feed without it.
  if (reviewId && !reviewById && !isDiaryEntry) {
    return null;
  }

  const post = resolvePost(rawMetadata, row.activity, fallbackMedia);
  if (resolvePostFallbackId(rawMetadata, row.activity) && !post) {
    return null;
  }

  const movie =
    reviewDetails?.movie ?? resolveMovie(rawMetadata, row.activity, metadata, fallbackMedia);

  const review = reviewDetails
    ? {
        id: reviewDetails.id,
        content: reviewDetails.content,
        containsSpoilers: reviewDetails.containsSpoilers,
        rating: reviewDetails.rating,
      }
    : null;

  // Review items carry a copy of the review text in metadata.excerpt, taken
  // when the activity was recorded. Replace it with the live review so an
  // edited or deleted review never shows its old text.
  const carriesReviewText = kind === "review" || kind === "liked_review" || isDiaryEntry;
  const reviewMetadata = carriesReviewText
    ? {
        hasReview: reviewDetails !== null,
        reviewId: reviewDetails?.id ?? null,
        containsSpoilers: reviewDetails?.containsSpoilers ?? null,
        excerpt: reviewDetails ? truncateExcerpt(reviewDetails.content) : null,
      }
    : {};

  const metadataWithReviewContext = {
    ...metadata,
    ...reviewMetadata,
    ...(diaryEntry && { rating: diaryEntry.rating, rewatch: diaryEntry.rewatch }),
    targetUsername:
      followedUser?.username ??
      metadata.targetUsername ??
      reviewDetails?.reviewAuthorUsername ??
      null,
    listId: list?.id ?? null,
    listTitle: list?.title ?? null,
  };

  const postId = post?.id ?? metadata.postId ?? (kind === "post" ? row.activity.entityId : null);
  const fallbackPostEngagement: PostEngagement = {
    likeCount: 0,
    commentCount: 0,
    viewerHasLiked: null,
  };
  const postEngagement: PostEngagement = postId
    ? postEngagementByPostId.get(postId) ?? fallbackPostEngagement
    : fallbackPostEngagement;

  const engagement: FeedEngagement = reviewDetails
    ? {
        likeCount: reviewDetails.likeCount,
        commentCount: reviewDetails.commentCount,
        viewerHasLiked: reviewDetails.viewerHasLiked,
      }
    : postId
      ? {
          likeCount: postEngagement.likeCount,
          commentCount: postEngagement.commentCount,
          viewerHasLiked: postEngagement.viewerHasLiked,
        }
      : activityEngagementById.get(row.activity.id) ?? {
          likeCount: 0,
          commentCount: 0,
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
      avatarUrl: row.actorAvatarUrl,
    },
    movie,
    post,
    review,
    metadata: metadataWithReviewContext,
    engagement,
  };
};
