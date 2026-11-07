import { apiRequest } from "@/lib/api-client";
import {
  cachedSeriesSchema,
  createSeriesLogInputSchema,
  createSeriesLogResponseSchema,
  seriesArchiveResponseSchema,
  seriesDetailResponseSchema,
  seriesDiaryListSchema,
  seriesInteractionSchema,
  seriesLogsListSchema,
  seriesReviewsPageResponseSchema,
  seriesSeasonDetailSchema,
  tmdbSearchSeriesListSchema,
  trendingSeriesListSchema,
  updateSeriesInteractionInputSchema,
  updateSeriesLogInputSchema,
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
  SeriesArchiveInput,
  SeriesArchiveResponse,
  SeriesDetailInput,
  SeriesDetailResponse,
  SeriesDiaryList,
  SeriesInteraction,
  SeriesLogsList,
  SeriesReviewsInput,
  SeriesReviewsPageResponse,
  SeriesSeasonDetailResponse,
  TmdbSearchSeries,
  TrendingSeries,
  UpdateSeriesInteractionInput,
  UpdateSeriesLogInput,
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
  input: SeriesArchiveInput,
  options: QueryRequestOptions = {},
): Promise<SeriesArchiveResponse> => {
  const query = toSeriesArchiveSearchParams(input).toString();
  const path = query ? `/api/serials/archive?${query}` : "/api/serials/archive";

  const response = await apiRequest<unknown>(path, {
    method: "GET",
    signal: options.signal,
    cache: "no-store",
  });

  return seriesArchiveResponseSchema.parse(response);
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
  input: SeriesDetailInput = {},
  options: QueryRequestOptions = {},
): Promise<SeriesDetailResponse> => {
  const query = toSeriesDetailSearchParams(input).toString();
  const path = query
    ? `/api/serials/${tmdbId}/detail?${query}`
    : `/api/serials/${tmdbId}/detail`;

  const response = await apiRequest<unknown>(path, {
    method: "GET",
    signal: options.signal,
    cache: "no-store",
  });

  return seriesDetailResponseSchema.parse(response);
};

export const getSeriesReviews = async (
  tmdbId: number,
  input: SeriesReviewsInput = {},
  options: QueryRequestOptions = {},
): Promise<SeriesReviewsPageResponse> => {
  const query = toSeriesReviewsSearchParams(input).toString();
  const path = query
    ? `/api/serials/${tmdbId}/reviews?${query}`
    : `/api/serials/${tmdbId}/reviews`;

  const response = await apiRequest<unknown>(path, {
    method: "GET",
    signal: options.signal,
    cache: "no-store",
  });

  return seriesReviewsPageResponseSchema.parse(response);
};

export const getSeriesInteraction = async (
  tmdbId: number,
): Promise<SeriesInteraction> => {
  const response = await apiRequest<unknown>(`/api/serials/${tmdbId}/interaction`, {
    method: "GET",
  });

  return seriesInteractionSchema.parse(response);
};

export const getSeriesSeasonDetail = async (
  tmdbId: number,
  seasonNumber: number,
  options: QueryRequestOptions = {},
): Promise<SeriesSeasonDetailResponse> => {
  const response = await apiRequest<unknown>(
    `/api/serials/${tmdbId}/seasons/${seasonNumber}`,
    {
      method: "GET",
      signal: options.signal,
      cache: "no-store",
    },
  );

  return seriesSeasonDetailSchema.parse(response);
};

export const updateSeriesInteraction = async (
  tmdbId: number,
  input: UpdateSeriesInteractionInput,
): Promise<SeriesInteraction> => {
  const payload = updateSeriesInteractionInputSchema.parse(input);
  const response = await apiRequest<unknown, UpdateSeriesInteractionInput>(
    `/api/serials/${tmdbId}/interaction`,
    {
      method: "PUT",
      body: payload,
    },
  );

  return seriesInteractionSchema.parse(response);
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

export const getMySeriesLogs = async (): Promise<SeriesDiaryList> => {
  const response = await apiRequest<unknown>("/api/serials/logs", { method: "GET" });
  return seriesDiaryListSchema.parse(response);
};

// The server answers with the bare log row, not a diary-list entry, so
// callers refetch what they show instead of reading the response.
export const updateSeriesLog = async (
  entryId: string,
  input: UpdateSeriesLogInput,
): Promise<void> => {
  const payload = updateSeriesLogInputSchema.parse(input);
  await apiRequest<unknown, UpdateSeriesLogInput>(`/api/serials/logs/${entryId}`, {
    method: "PUT",
    body: payload,
  });
};

export const deleteSeriesLog = async (
  entryId: string,
  options: { unwatch?: boolean } = {},
): Promise<void> => {
  const query = options.unwatch ? "?unwatch=true" : "";
  await apiRequest<unknown>(`/api/serials/logs/${entryId}${query}`, { method: "DELETE" });
};

export const getSeriesLogs = async (
  tmdbId: number,
  options: QueryRequestOptions = {},
): Promise<SeriesLogsList> => {
  const response = await apiRequest<unknown>(`/api/serials/${tmdbId}/logs`, {
    method: "GET",
    signal: options.signal,
  });
  return seriesLogsListSchema.parse(response);
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

// "Mark up to here": episodes 1..episodeNumber of the season become watched.
export const markEpisodesWatchedThrough = (
  tmdbId: number,
  seasonNumber: number,
  episodeNumber: number,
): Promise<{ seasonNumber: number; watchedThrough: number }> =>
  apiRequest(`/api/serials/${tmdbId}/seasons/${seasonNumber}/watched-through/${episodeNumber}`, {
    method: "POST",
  });
