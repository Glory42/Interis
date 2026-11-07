import { buildArchiveSearchParams, buildDetailSearchParams, normalizeSearchQuery } from "@/lib/query-params";
import type { FilmArchiveInput, FilmDetailInput, FilmReviewsInput } from "./types";

export { normalizeSearchQuery };

export const toFilmArchiveSearchParams = (input: FilmArchiveInput): URLSearchParams =>
  buildArchiveSearchParams(input);

export const toFilmDetailSearchParams = (input: FilmDetailInput): URLSearchParams =>
  buildDetailSearchParams(input);

export const toFilmReviewsSearchParams = (input: FilmReviewsInput): URLSearchParams =>
  buildDetailSearchParams({
    reviewsSort: input.sort,
    reviewsPage: input.page,
    reviewsLimit: input.limit,
  });
