import { apiRequest, type QueryRequestOptions } from "./client";
import { toArchiveParams } from "./movies";
import {
  serialArchiveResponseSchema,
  serialDetailResponseSchema,
  serialInteractionSchema,
  serialSeasonDetailSchema,
  type SerialArchiveResponse,
  type SerialArchiveSort,
  type SerialDetailResponse,
  type SerialInteraction,
  type SerialSeasonDetail,
  type UpdateSerialInteractionInput,
} from "@/types/serials";
import type { ArchivePeriod, ReviewSort } from "@/types/common";

export type SerialArchiveInput = {
  genre?: string;
  sort?: SerialArchiveSort;
  period?: ArchivePeriod;
  page?: number;
  limit?: number;
};

export const getSeriesArchive = async (
  input: SerialArchiveInput,
  options: QueryRequestOptions = {},
): Promise<SerialArchiveResponse> => {
  const response = await apiRequest<unknown>(`/api/serials/archive?${toArchiveParams(input)}`, {
    signal: options.signal,
  });
  return serialArchiveResponseSchema.parse(response);
};

export const getSeriesDetail = async (
  tmdbId: number,
  reviewsSort: ReviewSort,
  options: QueryRequestOptions = {},
): Promise<SerialDetailResponse> => {
  const response = await apiRequest<unknown>(
    `/api/serials/${tmdbId}/detail?reviewsSort=${reviewsSort}`,
    { signal: options.signal },
  );
  return serialDetailResponseSchema.parse(response);
};

export const getSeriesSeasonDetail = async (
  tmdbId: number,
  seasonNumber: number,
  options: QueryRequestOptions = {},
): Promise<SerialSeasonDetail> => {
  const response = await apiRequest<unknown>(`/api/serials/${tmdbId}/seasons/${seasonNumber}`, {
    signal: options.signal,
  });
  return serialSeasonDetailSchema.parse(response);
};

export const getSeriesInteraction = async (tmdbId: number): Promise<SerialInteraction> => {
  const response = await apiRequest<unknown>(`/api/serials/${tmdbId}/interaction`);
  return serialInteractionSchema.parse(response);
};

export const updateSeriesInteraction = async (
  tmdbId: number,
  input: UpdateSerialInteractionInput,
): Promise<SerialInteraction> => {
  const response = await apiRequest<unknown, UpdateSerialInteractionInput>(
    `/api/serials/${tmdbId}/interaction`,
    { method: "PUT", body: input },
  );
  return serialInteractionSchema.parse(response);
};

type EpisodeInteractionInput = { watched?: boolean; liked?: boolean; rating?: number | null };

export const updateEpisodeInteraction = async (
  tmdbId: number,
  seasonNumber: number,
  episodeNumber: number,
  input: EpisodeInteractionInput,
): Promise<void> => {
  await apiRequest<unknown, EpisodeInteractionInput>(
    `/api/serials/${tmdbId}/seasons/${seasonNumber}/episodes/${episodeNumber}/interaction`,
    { method: "PUT", body: input },
  );
};

export const updateSeasonInteraction = async (
  tmdbId: number,
  seasonNumber: number,
  input: EpisodeInteractionInput,
): Promise<void> => {
  await apiRequest<unknown, EpisodeInteractionInput>(
    `/api/serials/${tmdbId}/seasons/${seasonNumber}/interaction`,
    { method: "PUT", body: input },
  );
};
