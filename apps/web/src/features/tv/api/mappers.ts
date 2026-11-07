import { buildArchiveSearchParams, buildDetailSearchParams, normalizeSearchQuery } from "@/lib/query-params";
import type { SeriesArchiveInput, SeriesDetailInput, SeriesReviewsInput } from "./types";

export const normalizeSeriesSearchQuery = normalizeSearchQuery;

export const toSeriesArchiveSearchParams = (input: SeriesArchiveInput): URLSearchParams =>
  buildArchiveSearchParams(input);

export const toSeriesDetailSearchParams = (input: SeriesDetailInput): URLSearchParams =>
  buildDetailSearchParams(input);

export const toSeriesReviewsSearchParams = (input: SeriesReviewsInput): URLSearchParams =>
  buildDetailSearchParams({
    reviewsSort: input.sort,
    reviewsPage: input.page,
    reviewsLimit: input.limit,
  });
