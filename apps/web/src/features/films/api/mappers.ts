import { buildArchiveSearchParams, buildDetailSearchParams, normalizeSearchQuery } from "@/lib/query-params";
import type { MovieArchiveInput, MovieDetailInput } from "./types";

export { normalizeSearchQuery };

export const toMovieArchiveSearchParams = (input: MovieArchiveInput): URLSearchParams =>
  buildArchiveSearchParams(input);

export const toMovieDetailSearchParams = (input: MovieDetailInput): URLSearchParams =>
  buildDetailSearchParams(input);
