import { z } from "zod";
import { apiRequest } from "@/lib/api-client";
import type { MediaKind } from "@/features/media/media-cache";

const followingPersonSchema = z.object({
  username: z.string(),
  displayUsername: z.string().nullable(),
  avatarUrl: z.string().nullable(),
  liked: z.boolean(),
  watched: z.boolean(),
  watchStatus: z.enum(["watching", "paused", "dropped", "completed"]).nullable(),
  rating: z.number().nullable(),
  watchedDate: z.string().nullable(),
  reviewId: z.string().nullable(),
});

export const mediaFollowingResponseSchema = z.object({
  summary: z.object({
    count: z.number().int(),
    ratedCount: z.number().int(),
    reviewCount: z.number().int(),
    averageRating: z.number().nullable(),
  }),
  people: z.array(followingPersonSchema),
  limit: z.number().int(),
});

export type MediaFollowingPerson = z.infer<typeof followingPersonSchema>;
export type MediaFollowingResponse = z.infer<typeof mediaFollowingResponseSchema>;

const basePath = (kind: MediaKind) => (kind === "film" ? "/api/movies" : "/api/serials");

export const getMediaFollowing = async (
  kind: MediaKind,
  tmdbId: number,
  options: { signal?: AbortSignal } = {},
): Promise<MediaFollowingResponse> => {
  const response = await apiRequest<unknown>(`${basePath(kind)}/${tmdbId}/following`, {
    method: "GET",
    signal: options.signal,
  });
  return mediaFollowingResponseSchema.parse(response);
};
