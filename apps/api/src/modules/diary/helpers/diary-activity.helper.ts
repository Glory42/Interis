import { toMediaFields } from "../../../commons/helpers/media-activity-fields.helper";
import { truncateExcerpt } from "../../../commons/helpers/text.helper";

export const buildDiaryEntryActivityMetadata = (input: {
  movie: {
    id: number;
    tmdbId: number;
    title: string;
    posterPath: string | null;
    releaseYear: number | null;
  };
  rating: number | null;
  rewatch: boolean;
  hasReview: boolean;
  reviewId: string | null;
}) => ({
  movieId: input.movie.id,
  ...toMediaFields(input.movie),
  rating: input.rating,
  rewatch: input.rewatch,
  mediaType: "movie",
  hasReview: input.hasReview,
  reviewId: input.reviewId,
});

export const buildDiaryReviewActivityMetadata = (input: {
  review: {
    id: string;
    content: string;
    containsSpoilers: boolean;
  };
  movie: {
    id: number;
    tmdbId: number;
    title: string;
    posterPath: string | null;
    releaseYear: number | null;
  };
  rating: number | null;
}) => ({
  reviewId: input.review.id,
  movieId: input.movie.id,
  ...toMediaFields(input.movie),
  rating: input.rating,
  containsSpoilers: input.review.containsSpoilers,
  excerpt: truncateExcerpt(input.review.content),
});
