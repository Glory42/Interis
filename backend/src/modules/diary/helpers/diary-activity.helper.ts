import { DIARY_REVIEW_EXCERPT_LENGTH } from "../constants/diary.constants";

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
  tmdbId: input.movie.tmdbId,
  title: input.movie.title,
  posterPath: input.movie.posterPath,
  releaseYear: input.movie.releaseYear,
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
  tmdbId: input.movie.tmdbId,
  title: input.movie.title,
  posterPath: input.movie.posterPath,
  releaseYear: input.movie.releaseYear,
  rating: input.rating,
  containsSpoilers: input.review.containsSpoilers,
  excerpt: input.review.content.slice(0, DIARY_REVIEW_EXCERPT_LENGTH),
});
