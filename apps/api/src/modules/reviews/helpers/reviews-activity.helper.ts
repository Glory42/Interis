import { toMediaFields, toNullableMediaFields } from "../../../commons/helpers/media-activity-fields.helper";
import { truncateExcerpt as toExcerpt } from "../../../commons/helpers/text.helper";
import type { ReviewMediaMetadata } from "../types/reviews.types";

export const buildReviewCreatedActivityMetadata = (input: {
  reviewId: string;
  content: string;
  containsSpoilers: boolean;
  media: ReviewMediaMetadata;
}) => ({
  reviewId: input.reviewId,
  mediaType: input.media.mediaType,
  ...toMediaFields(input.media),
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
