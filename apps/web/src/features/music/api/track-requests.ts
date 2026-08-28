import { apiRequest } from "@/lib/api-client";
import {
  trackSchema,
  trackDetailResponseSchema,
  trackInteractionSchema,
  myTrackLogsListSchema,
  updateTrackInteractionInputSchema,
  updateTrackLogInputSchema,
  createTrackLogInputSchema,
  createTrackLogResultSchema,
} from "./track-schemas";
import type { QueryRequestOptions } from "./types";
import type {
  Track,
  CreateTrackLogInput,
  CreateTrackLogResult,
  MyTrackLog,
  TrackDetailInput,
  TrackDetailResponse,
  TrackInteraction,
  UpdateTrackInteractionInput,
  UpdateTrackLogInput,
} from "./track-types";

export const getTrackByMbid = async (
  mbid: string,
  options: QueryRequestOptions = {},
): Promise<Track> => {
  const response = await apiRequest<unknown>(`/api/music/tracks/${mbid}`, {
    method: "GET",
    signal: options.signal,
  });
  return trackSchema.parse(response);
};

export const getTrackDetail = async (
  mbid: string,
  input: TrackDetailInput = {},
  options: QueryRequestOptions = {},
): Promise<TrackDetailResponse> => {
  const params = new URLSearchParams();
  if (input.reviewsSort) params.set("reviewsSort", input.reviewsSort);
  const query = params.toString();
  const path = query
    ? `/api/music/tracks/${mbid}/detail?${query}`
    : `/api/music/tracks/${mbid}/detail`;
  const response = await apiRequest<unknown>(path, {
    method: "GET",
    signal: options.signal,
    cache: "no-store",
  });
  return trackDetailResponseSchema.parse(response);
};

export const getTrackInteraction = async (mbid: string): Promise<TrackInteraction> => {
  const response = await apiRequest<unknown>(`/api/music/tracks/${mbid}/interaction`, {
    method: "GET",
  });
  return trackInteractionSchema.parse(response);
};

export const updateTrackInteraction = async (
  mbid: string,
  input: UpdateTrackInteractionInput,
): Promise<TrackInteraction> => {
  const payload = updateTrackInteractionInputSchema.parse(input);
  const response = await apiRequest<unknown, UpdateTrackInteractionInput>(
    `/api/music/tracks/${mbid}/interaction`,
    { method: "PUT", body: payload },
  );
  return trackInteractionSchema.parse(response);
};

export const createTrackLog = async (
  mbid: string,
  input: CreateTrackLogInput,
): Promise<CreateTrackLogResult> => {
  const payload = createTrackLogInputSchema.parse(input);
  const response = await apiRequest<unknown, CreateTrackLogInput>(
    `/api/music/tracks/${mbid}/log`,
    { method: "POST", body: payload },
  );
  return createTrackLogResultSchema.parse(response);
};

export const getMyTrackLogs = async (): Promise<MyTrackLog[]> => {
  const response = await apiRequest<unknown>("/api/music/tracks/logs", { method: "GET" });
  return myTrackLogsListSchema.parse(response);
};

export const updateTrackLog = async (
  entryId: string,
  input: UpdateTrackLogInput,
): Promise<MyTrackLog> => {
  const payload = updateTrackLogInputSchema.parse(input);
  const response = await apiRequest<unknown, UpdateTrackLogInput>(
    `/api/music/tracks/logs/${entryId}`,
    { method: "PUT", body: payload },
  );
  return myTrackLogsListSchema.element.parse(response);
};

export const deleteTrackLog = async (entryId: string): Promise<void> => {
  await apiRequest<unknown>(`/api/music/tracks/logs/${entryId}`, { method: "DELETE" });
};
