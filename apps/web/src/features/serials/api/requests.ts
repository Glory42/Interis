import { apiRequest } from "@/lib/api-client";
import {
  cachedSeriesSchema,
  createSeriesLogInputSchema,
  createSeriesLogResponseSchema,
  serialArchiveResponseSchema,
  serialDetailResponseSchema,
  serialDiaryListSchema,
  serialInteractionSchema,
  serialLogsListSchema,
  serialReviewsPageResponseSchema,
  serialSeasonDetailSchema,
  tmdbSearchSeriesListSchema,
  trendingSeriesListSchema,
  updateSerialInteractionInputSchema,
  updateSerialLogInputSchema,
} from "./schemas";
import {
  normalizeSeriesSearchQuery,
  toSeriesArchiveSearchParams,
  toSeriesDetailSearchParams,
  toSeriesReviewsSearchParams,
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
  SerialDiaryEntry,
  SerialDiaryList,
  SerialInteraction,
  SerialLogsList,
  SerialReviewsInput,
  SerialReviewsPageResponse,
  SerialSeasonDetailResponse,
  TmdbSearchSeries,
  TrendingSeries,
  UpdateSerialInteractionInput,
  UpdateSerialLogInput,
} from "./types";

export * from "./season-episode-reviews.requests";

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

export const getSeriesReviews = async (
  tmdbId: number,
  input: SerialReviewsInput = {},
  options: QueryRequestOptions = {},
): Promise<SerialReviewsPageResponse> => {
  const query = toSeriesReviewsSearchParams(input).toString();
  const path = query
    ? `/api/serials/${tmdbId}/reviews?${query}`
    : `/api/serials/${tmdbId}/reviews`;

  const response = await apiRequest<unknown>(path, {
    method: "GET",
    signal: options.signal,
    cache: "no-store",
  });

  return serialReviewsPageResponseSchema.parse(response);
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

export const getMySerialLogs = async (): Promise<SerialDiaryList> => {
  const response = await apiRequest<unknown>("/api/serials/logs", { method: "GET" });
  return serialDiaryListSchema.parse(response);
};

export const updateSerialLog = async (
  entryId: string,
  input: UpdateSerialLogInput,
): Promise<SerialDiaryEntry> => {
  const payload = updateSerialLogInputSchema.parse(input);
  const response = await apiRequest<unknown, UpdateSerialLogInput>(
    `/api/serials/logs/${entryId}`,
    { method: "PUT", body: payload },
  );
  return serialDiaryListSchema.element.parse(response);
};

export const deleteSerialLog = async (entryId: string): Promise<void> => {
  await apiRequest<unknown>(`/api/serials/logs/${entryId}`, { method: "DELETE" });
};

export const getSeriesLogs = async (
  tmdbId: number,
  options: QueryRequestOptions = {},
): Promise<SerialLogsList> => {
  const response = await apiRequest<unknown>(`/api/serials/${tmdbId}/logs`, {
    method: "GET",
    signal: options.signal,
  });
  return serialLogsListSchema.parse(response);
};

export const getRecentSeries = async (
  options: QueryRequestOptions = {},
): Promise<TmdbSearchSeries[]> => {
  const response = await apiRequest<unknown>("/api/serials/recent", {
    method: "GET",
    signal: options.signal,
  });
  return tmdbSearchSeriesListSchema.parse(response);
};

export const updateSeasonInteraction = async (
  tmdbId: number,
  seasonNumber: number,
  input: { watched?: boolean; liked?: boolean; rating?: number | null },
): Promise<{ watched: boolean; liked: boolean; rating: number | null }> => {
  const response = await apiRequest<
    { watched: boolean; liked: boolean; rating: number | null },
    { watched?: boolean; liked?: boolean; rating?: number | null }
  >(
    `/api/serials/${tmdbId}/seasons/${seasonNumber}/interaction`,
    {
      method: "PUT",
      body: input,
    },
  );
  return response;
};

export const updateEpisodeInteraction = async (
  tmdbId: number,
  seasonNumber: number,
  episodeNumber: number,
  input: { watched?: boolean; liked?: boolean; rating?: number | null },
): Promise<{ watched: boolean; liked: boolean; rating: number | null }> => {
  const response = await apiRequest<
    { watched: boolean; liked: boolean; rating: number | null },
    { watched?: boolean; liked?: boolean; rating?: number | null }
  >(
    `/api/serials/${tmdbId}/seasons/${seasonNumber}/episodes/${episodeNumber}/interaction`,
    {
      method: "PUT",
      body: input,
    },
  );
  return response;
};
