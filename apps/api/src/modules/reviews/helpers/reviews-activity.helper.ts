import { REVIEW_ACTIVITY_EXCERPT_LENGTH } from "../constants/reviews.constants";
import type { ReviewMediaMetadata } from "../types/reviews.types";

const toExcerpt = (content: string): string => {
  return content.slice(0, REVIEW_ACTIVITY_EXCERPT_LENGTH);
};

export const buildReviewCreatedActivityMetadata = (input: {
  reviewId: string;
  content: string;
  containsSpoilers: boolean;
  media: ReviewMediaMetadata;
}) => ({
  reviewId: input.reviewId,
  mediaType: input.media.mediaType,
  tmdbId: input.media.tmdbId ?? null,
  mbid: input.media.mbid ?? null,
  volumeId: input.media.volumeId ?? null,
  title: input.media.title,
  posterPath: input.media.posterPath ?? null,
  coverArtUrl: input.media.coverArtUrl ?? null,
  artistName: input.media.artistName ?? null,
  authors: input.media.authors ?? null,
  releaseYear: input.media.releaseYear,
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
  tmdbId: input.mediaMetadata?.tmdbId ?? null,
  mbid: input.mediaMetadata?.mbid ?? null,
  volumeId: input.mediaMetadata?.volumeId ?? null,
  title: input.mediaMetadata?.title ?? null,
  posterPath: input.mediaMetadata?.posterPath ?? null,
  coverArtUrl: input.mediaMetadata?.coverArtUrl ?? null,
  releaseYear: input.mediaMetadata?.releaseYear ?? null,
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
  tmdbId: input.mediaMetadata?.tmdbId ?? null,
  mbid: input.mediaMetadata?.mbid ?? null,
  volumeId: input.mediaMetadata?.volumeId ?? null,
  title: input.mediaMetadata?.title ?? null,
  posterPath: input.mediaMetadata?.posterPath ?? null,
  coverArtUrl: input.mediaMetadata?.coverArtUrl ?? null,
  releaseYear: input.mediaMetadata?.releaseYear ?? null,
});
