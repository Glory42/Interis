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
  SerialSeasonDetailResponse,
  TmdbSearchSeries,
  TrendingSeries,
  UpdateSerialInteractionInput,
  UpdateSerialLogInput,
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

