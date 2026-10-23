import { apiRequest } from "@/lib/api-client";

export interface SeasonEpisodeReview {
  id: string;
  content: string;
  containsSpoilers: boolean;
  createdAt: string;
  updatedAt: string;
}

// `reviewId` edits that review, `createNew` writes another one (#72); with
// neither the newest review is edited.
export type SeasonEpisodeReviewSaveInput = {
  content: string;
  containsSpoilers?: boolean;
  reviewId?: string;
  createNew?: boolean;
};

const reviewIdQuery = (reviewId?: string): string =>
  reviewId ? `?reviewId=${encodeURIComponent(reviewId)}` : "";

export const upsertSeasonReview = async (
  tmdbId: number,
  seasonNumber: number,
  input: SeasonEpisodeReviewSaveInput,
): Promise<SeasonEpisodeReview> => {
  const response = await apiRequest<SeasonEpisodeReview, SeasonEpisodeReviewSaveInput>(
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
  reviewId?: string,
): Promise<void> => {
  await apiRequest<unknown>(
    `/api/serials/${tmdbId}/seasons/${seasonNumber}/review${reviewIdQuery(reviewId)}`,
    {
      method: "DELETE",
    },
  );
};

export const upsertEpisodeReview = async (
  tmdbId: number,
  seasonNumber: number,
  episodeNumber: number,
  input: SeasonEpisodeReviewSaveInput,
): Promise<SeasonEpisodeReview> => {
  const response = await apiRequest<SeasonEpisodeReview, SeasonEpisodeReviewSaveInput>(
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
  reviewId?: string,
): Promise<void> => {
  await apiRequest<unknown>(
    `/api/serials/${tmdbId}/seasons/${seasonNumber}/episodes/${episodeNumber}/review${reviewIdQuery(reviewId)}`,
    {
      method: "DELETE",
    },
  );
};
