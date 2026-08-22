import { toNullableMediaFields } from "../../../commons/helpers/media-activity-fields.helper";
import { truncateExcerpt as toExcerpt } from "../../../commons/helpers/text.helper";
import type { ReviewMediaMetadata } from "../types/reviews.types";

// Extra fields only - MovieActivityRecorder/SerialsActivityRecorder already
// supply the movie/series id, mediaType, and base media fields for every
// review-creation activity.
export const buildReviewCreatedActivityMetadata = (input: {
  reviewId: string;
  content: string;
  containsSpoilers: boolean;
}) => ({
  reviewId: input.reviewId,
  containsSpoilers: input.containsSpoilers,
  excerpt: toExcerpt(input.content),
});

export const buildReviewLikedActivityMetadata = (input: {
  reviewId: string;
  mediaMetadata: ReviewMediaMetadata | null;
  targetUsername: string | null;
}) => ({
  action: "liked_review",
  mediaType: input.mediaMetadata?.mediaType ?? null,
  reviewId: input.reviewId,
  targetUsername: input.targetUsername,
  ...toNullableMediaFields(input.mediaMetadata),
});

export const buildCommentCreatedActivityMetadata = (input: {
  reviewId: string;
  commentId: string;
  content: string;
  mediaMetadata: ReviewMediaMetadata | null;
  targetUsername: string | null;
}) => ({
  action: "commented",
  mediaType: input.mediaMetadata?.mediaType ?? null,
  reviewId: input.reviewId,
  commentId: input.commentId,
  targetUsername: input.targetUsername,
  excerpt: toExcerpt(input.content),
  ...toNullableMediaFields(input.mediaMetadata),
});
