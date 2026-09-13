import { apiRequest } from "@/lib/api-client";

export interface SeasonEpisodeReview {
  id: string;
  content: string;
  containsSpoilers: boolean;
  createdAt: string;
  updatedAt: string;
}

export const getSeasonReview = async (
  tmdbId: number,
  seasonNumber: number,
): Promise<SeasonEpisodeReview | null> => {
  const response = await apiRequest<unknown>(
    `/api/serials/${tmdbId}/seasons/${seasonNumber}/review`,
    {
      method: "GET",
    },
  );
  return response as SeasonEpisodeReview | null;
};

export const upsertSeasonReview = async (
  tmdbId: number,
  seasonNumber: number,
  input: { content: string; containsSpoilers?: boolean },
): Promise<SeasonEpisodeReview> => {
  const response = await apiRequest<SeasonEpisodeReview, { content: string; containsSpoilers?: boolean }>(
    `/api/serials/${tmdbId}/seasons/${seasonNumber}/review`,
    {
      method: "POST",
      body: input,
    },
  );
  return response;
};

export const deleteSeasonReview = async (
  tmdbId: number,
  seasonNumber: number,
): Promise<void> => {
  await apiRequest<unknown>(
    `/api/serials/${tmdbId}/seasons/${seasonNumber}/review`,
    {
      method: "DELETE",
    },
  );
};

export const getEpisodeReview = async (
  tmdbId: number,
  seasonNumber: number,
  episodeNumber: number,
): Promise<SeasonEpisodeReview | null> => {
  const response = await apiRequest<unknown>(
    `/api/serials/${tmdbId}/seasons/${seasonNumber}/episodes/${episodeNumber}/review`,
    {
      method: "GET",
    },
  );
  return response as SeasonEpisodeReview | null;
};

export const upsertEpisodeReview = async (
  tmdbId: number,
  seasonNumber: number,
  episodeNumber: number,
  input: { content: string; containsSpoilers?: boolean },
): Promise<SeasonEpisodeReview> => {
  const response = await apiRequest<SeasonEpisodeReview, { content: string; containsSpoilers?: boolean }>(
    `/api/serials/${tmdbId}/seasons/${seasonNumber}/episodes/${episodeNumber}/review`,
    {
      method: "POST",
      body: input,
    },
  );
  return response;
};

export const deleteEpisodeReview = async (
  tmdbId: number,
  seasonNumber: number,
  episodeNumber: number,
): Promise<void> => {
  await apiRequest<unknown>(
    `/api/serials/${tmdbId}/seasons/${seasonNumber}/episodes/${episodeNumber}/review`,
    {
      method: "DELETE",
    },
  );
};
