import { toMediaFields } from "../../../commons/helpers/media-activity-fields.helper";
import { truncateExcerpt } from "../../../commons/helpers/text.helper";

// Extra fields only - MovieActivityRecorder already supplies movieId,
// mediaType, and the base media fields for every movie activity.
export const buildDiaryEntryActivityMetadata = (input: {
  rating: number | null;
  rewatch: boolean;
  hasReview: boolean;
  reviewId: string | null;
}) => ({
  rating: input.rating,
  rewatch: input.rewatch,
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
