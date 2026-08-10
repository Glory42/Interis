import { truncateExcerpt } from "../../../commons/helpers/text.helper";

// Metadata fields that vary by *content*, not by which part of a series the
// activity targets (series/season/episode - that's SerialsActivityRecorder's
// job). Kept separate since a diary entry and a review carry genuinely
// different extra fields, not just a different target shape.

export const buildDiaryEntryExtraMetadata = (input: {
  rating: number | null;
  rewatch: boolean;
  review: { id: string; content: string; containsSpoilers: boolean } | null;
}) => ({
  rating: input.rating,
  rewatch: input.rewatch,
  hasReview: Boolean(input.review),
  reviewId: input.review?.id ?? null,
  containsSpoilers: input.review?.containsSpoilers ?? null,
  excerpt: input.review ? truncateExcerpt(input.review.content) : null,
});

export const buildReviewExtraMetadata = (review: {
  id: string;
  content: string;
  containsSpoilers: boolean;
}) => ({
  reviewId: review.id,
  excerpt: truncateExcerpt(review.content),
  containsSpoilers: review.containsSpoilers,
});
