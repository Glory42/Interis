import { apiRequest } from "@/lib/api-client";
import {
  albumSchema,
  mbSearchResultListSchema,
  musicArchiveResponseSchema,
  musicDetailResponseSchema,
  musicInteractionSchema,
  musicLogsListSchema,
  myMusicLogsListSchema,
  updateMusicInteractionInputSchema,
  updateMusicLogInputSchema,
  createMusicLogInputSchema,
} from "./schemas";
import type {
  Album,
  CreateMusicLogInput,
  MbSearchResult,
  MusicArchiveInput,
  MusicArchiveResponse,
  MusicDetailInput,
  MusicDetailResponse,
  MusicInteraction,
  MusicLogItem,
  MyMusicLog,
  QueryRequestOptions,
  UpdateMusicInteractionInput,
  UpdateMusicLogInput,
} from "./types";

function toMusicArchiveParams(input: MusicArchiveInput): string {
  const params = new URLSearchParams();
  if (input.genre) params.set("genre", input.genre);
  if (input.type) params.set("type", input.type);
  if (input.sort) params.set("sort", input.sort);
  if (input.page) params.set("page", String(input.page));
  if (input.limit) params.set("limit", String(input.limit));
  return params.toString();
}

export const searchMusic = async (
  query: string,
  options: QueryRequestOptions = {},
): Promise<MbSearchResult[]> => {
  const q = query.trim();
  if (q.length === 0) return [];
  const response = await apiRequest<unknown>(
    `/api/music/search?query=${encodeURIComponent(q)}`,
    { method: "GET", signal: options.signal },
  );
  return mbSearchResultListSchema.parse(response);
};

export const getAlbumByMbid = async (
  mbid: string,
  options: QueryRequestOptions = {},
): Promise<Album> => {
  const response = await apiRequest<unknown>(`/api/music/${mbid}`, {
    method: "GET",
    signal: options.signal,
  });
  return albumSchema.parse(response);
};

export const getMusicDetail = async (
  mbid: string,
  input: MusicDetailInput = {},
  options: QueryRequestOptions = {},
): Promise<MusicDetailResponse> => {
  const params = new URLSearchParams();
  if (input.reviewsSort) params.set("reviewsSort", input.reviewsSort);
  const query = params.toString();
  const path = query ? `/api/music/${mbid}/detail?${query}` : `/api/music/${mbid}/detail`;
  const response = await apiRequest<unknown>(path, {
    method: "GET",
    signal: options.signal,
    cache: "no-store",
  });
  return musicDetailResponseSchema.parse(response);
};

export const getMusicArchive = async (
  input: MusicArchiveInput,
  options: QueryRequestOptions = {},
): Promise<MusicArchiveResponse> => {
  const query = toMusicArchiveParams(input);
  const path = query ? `/api/music/archive?${query}` : "/api/music/archive";
  const response = await apiRequest<unknown>(path, {
    method: "GET",
    signal: options.signal,
    cache: "no-store",
  });
  return musicArchiveResponseSchema.parse(response);
};

export const getMusicLogs = async (
  mbid: string,
  options: QueryRequestOptions = {},
): Promise<MusicLogItem[]> => {
  const response = await apiRequest<unknown>(`/api/music/${mbid}/logs`, {
    method: "GET",
    signal: options.signal,
  });
  return musicLogsListSchema.parse(response);
};

export const getMusicInteraction = async (mbid: string): Promise<MusicInteraction> => {
  const response = await apiRequest<unknown>(`/api/music/${mbid}/interaction`, {
    method: "GET",
  });
  return musicInteractionSchema.parse(response);
};

export const updateMusicInteraction = async (
  mbid: string,
  input: UpdateMusicInteractionInput,
): Promise<MusicInteraction> => {
  const payload = updateMusicInteractionInputSchema.parse(input);
  const response = await apiRequest<unknown, UpdateMusicInteractionInput>(
    `/api/music/${mbid}/interaction`,
    { method: "PUT", body: payload },
  );
  return musicInteractionSchema.parse(response);
};

export const createMusicLog = async (
  mbid: string,
  input: CreateMusicLogInput,
): Promise<unknown> => {
  const payload = createMusicLogInputSchema.parse(input);
  return apiRequest<unknown, CreateMusicLogInput>(`/api/music/${mbid}/log`, {
    method: "POST",
    body: payload,
  });
};

export const getMyMusicLogs = async (): Promise<MyMusicLog[]> => {
  const response = await apiRequest<unknown>("/api/music/logs", { method: "GET" });
  return myMusicLogsListSchema.parse(response);
};

export const updateMusicLog = async (
  entryId: string,
  input: UpdateMusicLogInput,
): Promise<MyMusicLog> => {
  const payload = updateMusicLogInputSchema.parse(input);
  const response = await apiRequest<unknown, UpdateMusicLogInput>(
    `/api/music/logs/${entryId}`,
    { method: "PUT", body: payload },
  );
  return myMusicLogsListSchema.element.parse(response);
};

export const deleteMusicLog = async (entryId: string): Promise<void> => {
  await apiRequest<unknown>(`/api/music/logs/${entryId}`, { method: "DELETE" });
};
