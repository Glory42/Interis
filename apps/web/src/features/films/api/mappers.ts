import { buildArchiveSearchParams, buildDetailSearchParams, normalizeSearchQuery } from "@/lib/query-params";
import type { MovieArchiveInput, MovieDetailInput, MovieReviewsInput } from "./types";

export { normalizeSearchQuery };

export const toMovieArchiveSearchParams = (input: MovieArchiveInput): URLSearchParams =>
  buildArchiveSearchParams(input);

export const toMovieDetailSearchParams = (input: MovieDetailInput): URLSearchParams =>
  buildDetailSearchParams(input);

export const toMovieReviewsSearchParams = (input: MovieReviewsInput): URLSearchParams =>
  buildDetailSearchParams({
    reviewsSort: input.sort,
    reviewsPage: input.page,
    reviewsLimit: input.limit,
  });
