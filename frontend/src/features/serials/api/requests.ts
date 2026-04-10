import { apiRequest } from "@/lib/api-client";
import {
  cachedSeriesSchema,
  createSeriesLogInputSchema,
  createSeriesLogResponseSchema,
  serialArchiveResponseSchema,
  serialDetailResponseSchema,
  serialInteractionSchema,
  serialSeasonDetailSchema,
  tmdbSearchSeriesListSchema,
  trendingSeriesListSchema,
  updateSerialInteractionInputSchema,
} from "./schemas";
import {
  normalizeSeriesSearchQuery,
  toSeriesArchiveSearchParams,
  toSeriesDetailSearchParams,
} from "./mappers";
import type {
  CachedSeries,
  CreateSeriesLogInput,
  CreateSeriesLogResponse,
  QueryRequestOptions,
  SerialArchiveInput,
  SerialArchiveResponse,
  SerialDetailInput,
  SerialDetailResponse,
  SerialInteraction,
  SerialSeasonDetailResponse,
  TmdbSearchSeries,
  TrendingSeries,
  UpdateSerialInteractionInput,
} from "./types";

export const searchSeries = async (
  query: string,
  options: QueryRequestOptions = {},
): Promise<TmdbSearchSeries[]> => {
  const normalizedQuery = normalizeSeriesSearchQuery(query);
  if (normalizedQuery.length === 0) {
    return [];
  }

  const response = await apiRequest<unknown>(
    `/api/serials/search?query=${encodeURIComponent(normalizedQuery)}`,
    {
      method: "GET",
      signal: options.signal,
    },
  );

  return tmdbSearchSeriesListSchema.parse(response);
};

export const getTrendingSeries = async (
  options: QueryRequestOptions = {},
): Promise<TrendingSeries[]> => {
  const response = await apiRequest<unknown>("/api/serials/trending", {
    method: "GET",
    signal: options.signal,
  });

  return trendingSeriesListSchema.parse(response);
};

export const getSeriesArchive = async (
  input: SerialArchiveInput,
  options: QueryRequestOptions = {},
): Promise<SerialArchiveResponse> => {
  const query = toSeriesArchiveSearchParams(input).toString();
  const path = query ? `/api/serials/archive?${query}` : "/api/serials/archive";

  const response = await apiRequest<unknown>(path, {
    method: "GET",
    signal: options.signal,
    cache: "no-store",
  });

  return serialArchiveResponseSchema.parse(response);
};

export const getSeriesByTmdbId = async (
  tmdbId: number,
  options: QueryRequestOptions = {},
): Promise<CachedSeries> => {
  const response = await apiRequest<unknown>(`/api/serials/${tmdbId}`, {
    method: "GET",
    signal: options.signal,
  });

  return cachedSeriesSchema.parse(response);
};

export const getSeriesDetail = async (
  tmdbId: number,
  input: SerialDetailInput = {},
  options: QueryRequestOptions = {},
): Promise<SerialDetailResponse> => {
  const query = toSeriesDetailSearchParams(input).toString();
  const path = query
    ? `/api/serials/${tmdbId}/detail?${query}`
    : `/api/serials/${tmdbId}/detail`;

  const response = await apiRequest<unknown>(path, {
    method: "GET",
    signal: options.signal,
    cache: "no-store",
  });

  return serialDetailResponseSchema.parse(response);
};

export const getSeriesInteraction = async (
  tmdbId: number,
): Promise<SerialInteraction> => {
  const response = await apiRequest<unknown>(`/api/serials/${tmdbId}/interaction`, {
    method: "GET",
  });

  return serialInteractionSchema.parse(response);
};

export const getSeriesSeasonDetail = async (
  tmdbId: number,
  seasonNumber: number,
  options: QueryRequestOptions = {},
): Promise<SerialSeasonDetailResponse> => {
  const response = await apiRequest<unknown>(
    `/api/serials/${tmdbId}/seasons/${seasonNumber}`,
    {
      method: "GET",
      signal: options.signal,
      cache: "no-store",
    },
  );

  return serialSeasonDetailSchema.parse(response);
};

export const updateSeriesInteraction = async (
  tmdbId: number,
  input: UpdateSerialInteractionInput,
): Promise<SerialInteraction> => {
  const payload = updateSerialInteractionInputSchema.parse(input);
  const response = await apiRequest<unknown, UpdateSerialInteractionInput>(
    `/api/serials/${tmdbId}/interaction`,
    {
      method: "PUT",
      body: payload,
    },
  );

  return serialInteractionSchema.parse(response);
};

export const createSeriesLog = async (
  tmdbId: number,
  input: CreateSeriesLogInput,
): Promise<CreateSeriesLogResponse> => {
  const payload = createSeriesLogInputSchema.parse(input);
  const response = await apiRequest<unknown, CreateSeriesLogInput>(
    `/api/serials/${tmdbId}/log`,
    {
      method: "POST",
      body: payload,
    },
  );

  return createSeriesLogResponseSchema.parse(response);
};
