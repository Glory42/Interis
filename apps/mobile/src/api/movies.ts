import { apiRequest, type QueryRequestOptions } from "./client";
import {
  movieArchiveResponseSchema,
  movieDetailResponseSchema,
  movieInteractionSchema,
  type MovieArchiveResponse,
  type MovieArchiveSort,
  type MovieDetailResponse,
  type MovieInteraction,
  type UpdateMovieInteractionInput,
} from "@/types/movies";
import type { ArchivePeriod, ReviewSort } from "@/types/common";

export type MovieArchiveInput = {
  genre?: string;
  sort?: MovieArchiveSort;
  period?: ArchivePeriod;
  page?: number;
  limit?: number;
};

export const toArchiveParams = (input: {
  genre?: string;
  sort?: string;
  period?: string;
  page?: number;
  limit?: number;
}): string => {
  const params = new URLSearchParams();
  if (input.genre) params.set("genre", input.genre);
  if (input.sort) params.set("sort", input.sort);
  if (input.period) params.set("period", input.period);
  if (input.page) params.set("page", String(input.page));
  if (input.limit) params.set("limit", String(input.limit));
  return params.toString();
};

export const getMovieArchive = async (
  input: MovieArchiveInput,
  options: QueryRequestOptions = {},
): Promise<MovieArchiveResponse> => {
  const response = await apiRequest<unknown>(`/api/movies/archive?${toArchiveParams(input)}`, {
    signal: options.signal,
  });
  return movieArchiveResponseSchema.parse(response);
};

export const getMovieDetail = async (
  tmdbId: number,
  reviewsSort: ReviewSort,
  options: QueryRequestOptions = {},
): Promise<MovieDetailResponse> => {
  const response = await apiRequest<unknown>(
    `/api/movies/${tmdbId}/detail?reviewsSort=${reviewsSort}`,
    { signal: options.signal },
  );
  return movieDetailResponseSchema.parse(response);
};

export const getMovieInteraction = async (tmdbId: number): Promise<MovieInteraction> => {
  const response = await apiRequest<unknown>(`/api/interactions/${tmdbId}`);
  return movieInteractionSchema.parse(response);
};

export const updateMovieInteraction = async (
  tmdbId: number,
  input: UpdateMovieInteractionInput,
): Promise<MovieInteraction> => {
  const response = await apiRequest<unknown, UpdateMovieInteractionInput>(
    `/api/interactions/${tmdbId}`,
    { method: "PUT", body: input },
  );
  return movieInteractionSchema.parse(response);
};
