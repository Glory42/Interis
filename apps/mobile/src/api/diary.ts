import { apiRequest } from "./client";
import type { MediaType } from "@/types/common";

export type LogMediaInput = {
  watchedDate: string;
  rating?: number;
  rewatch?: boolean;
  review?: string;
  containsSpoilers?: boolean;
};

// Movies log through /api/diary (keyed by tmdbId in the body); series have
// their own /api/serials/:tmdbId/log endpoint - same payload otherwise.
export const logMedia = async (
  mediaType: MediaType,
  tmdbId: number,
  input: LogMediaInput,
): Promise<void> => {
  if (mediaType === "tv") {
    await apiRequest<unknown, LogMediaInput>(`/api/serials/${tmdbId}/log`, {
      method: "POST",
      body: input,
    });
    return;
  }

  await apiRequest<unknown, LogMediaInput & { tmdbId: number }>("/api/diary", {
    method: "POST",
    body: { ...input, tmdbId },
  });
};
